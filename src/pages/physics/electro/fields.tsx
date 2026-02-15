import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

interface Charge {
    id: number
    x: number
    y: number
    q: number // +1 or -1
}

export default function ElectricFields() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [charges, setCharges] = useState<Charge[]>([
        { id: 1, x: 200, y: 150, q: 1 },
        { id: 2, x: 400, y: 150, q: -1 }
    ])
    const [selectedCharge, setSelectedCharge] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const nextId = useRef(3)

    // Interaction handling
    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = (e.clientX - rect.left)
        const my = (e.clientY - rect.top)

        // Check hit
        const hit = charges.find(c => {
            // My coordinates are CSS pixels, but canvas internal might be scaled?
            // Actually, mouse event is CSS pixels.
            // We need to match drawing logic.
            // Drawing logic maps canvas width/height to drawing coords.

            // Simplest: store coords in "canvas CSS pixels" space (0 to width)
            const dx = c.x - mx
            const dy = c.y - my
            return (dx * dx + dy * dy) < 400 // 20px radius
        })

        if (hit) {
            setSelectedCharge(hit.id)
            setIsDragging(true)
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || selectedCharge === null) return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top

        setCharges(prev => prev.map(c =>
            c.id === selectedCharge ? { ...c, x: mx, y: my } : c
        ))
    }

    const handleMouseUp = () => {
        setIsDragging(false)
        setSelectedCharge(null)
    }

    const addCharge = (q: number) => {
        setCharges(prev => [...prev, {
            id: nextId.current++,
            x: 50 + Math.random() * 50,
            y: 50 + Math.random() * 50,
            q
        }])
    }

    const removeCharge = () => {
        setCharges(prev => prev.slice(0, prev.length - 1))
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            ctx.clearRect(0, 0, width, height)

            // Draw Field Lines / Vectors
            // Grid of measurement points
            const gridSize = 40
            const k = 10000 // Arbitrary constant for viz

            ctx.lineWidth = 1

            for (let x = 20; x < width; x += gridSize) {
                for (let y = 20; y < height; y += gridSize) {
                    let Ex = 0
                    let Ey = 0

                    charges.forEach(c => {
                        const dx = x - c.x
                        const dy = y - c.y
                        const r2 = dx * dx + dy * dy
                        const r = Math.sqrt(r2)

                        // E = kQ/r^2
                        // E_vec = E * (r_vec / r) = kQ/r^3 * r_vec

                        if (r < 10) return // singularity check

                        const E = k * c.q / r2
                        // Component
                        Ex += E * (dx / r)
                        Ey += E * (dy / r)
                    })

                    const E_mag = Math.sqrt(Ex * Ex + Ey * Ey)
                    if (E_mag > 0.1) {
                        // Normalize for drawing arrow direction
                        const maxLen = gridSize * 0.8
                        // Log scale length or clamped?
                        // Let's draw unit vectors scaled by opacity? 
                        // Or fixed length indicating direction, opacity strength.

                        const drawLen = Math.min(maxLen, E_mag * 5)
                        const angle = Math.atan2(Ey, Ex)

                        // Opacity based on strength
                        const opacity = Math.min(1, E_mag / 2)
                        ctx.strokeStyle = `rgba(100, 200, 255, ${opacity})`

                        ctx.beginPath()
                        ctx.moveTo(x, y)
                        ctx.lineTo(x + Math.cos(angle) * drawLen, y + Math.sin(angle) * drawLen)
                        ctx.stroke()

                        // Arrowhead
                        // ctx.beginPath()
                        // ...
                    }
                }
            }

            // Draw Equipotential Lines
            // V = kQ/r
            // Simple threshold rendering
            const voltages = [-200, -100, -50, -25, 25, 50, 100, 200]
            if (charges.length > 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
                for (let x = 0; x < width; x += 4) {
                    for (let y = 0; y < height; y += 4) {
                        let V = 0
                        charges.forEach(c => {
                            const dx = x - c.x
                            const dy = y - c.y
                            const r = Math.sqrt(dx * dx + dy * dy)
                            if (r > 5) V += k * c.q / r
                        })

                        // Check if close to target voltage
                        for (const v_iso of voltages) {
                            if (Math.abs(V - v_iso) < 2) {
                                ctx.fillRect(x, y, 2, 2)
                                break
                            }
                        }
                    }
                }
            }

            // Draw Charges
            charges.forEach(c => {
                ctx.beginPath()
                ctx.arc(c.x, c.y, 15, 0, Math.PI * 2)
                ctx.fillStyle = c.q > 0 ? '#ef4444' : '#3b82f6'
                ctx.fill()

                ctx.strokeStyle = 'white'
                ctx.lineWidth = 2
                ctx.stroke()

                ctx.fillStyle = 'white'
                ctx.font = '16px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(c.q > 0 ? '+' : '-', c.x, c.y)
            })

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [charges])


    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <PhysicsBackground />
            </div>

            {/* Navbar */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Electric Fields</h1>
                        <p className="text-xs text-white/50">AP Physics 2: Electrostatics</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative cursor-crosshair">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    />
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div className="text-sm text-white/70 leading-relaxed">
                        Place positive (+) and negative (-) charges to visualize the Electric Field.
                        <br />
                        field vector <b>E</b> = kQ/r²
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => addCharge(1)}
                            className="py-3 rounded-xl font-medium text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/30"
                        >
                            Add Positive (+Q)
                        </button>
                        <button
                            onClick={() => addCharge(-1)}
                            className="py-3 rounded-xl font-medium text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all border border-blue-500/30"
                        >
                            Add Negative (-Q)
                        </button>

                        <button
                            onClick={removeCharge}
                            className="py-3 mt-4 rounded-xl font-medium text-sm bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                        >
                            Remove Last
                        </button>
                    </div>

                    <div className="mt-8 p-4 rounded-lg bg-white/5">
                        <h3 className="text-xs font-semibold text-white/50 mb-2">FIELD PROPERTIES</h3>
                        <ul className="text-xs text-white/70 space-y-1 list-disc pl-4">
                            <li>Vectors point AWAY from positive</li>
                            <li>Vectors point TOWARDS negative</li>
                            <li>Superposition Principle applies</li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    )
}
