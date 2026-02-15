import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

// Point in wire
type Point = { x: number, y: number }

export default function BiotSavart() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [wirePath, setWirePath] = useState<Point[]>([])
    const [isDrawing, setIsDrawing] = useState(false)
    const [current, setCurrent] = useState(5.0) // Amps

    // Biot-Savart Law:
    // dB = (mu0 * I / 4pi) * (dL x r^) / r^2
    // We are in 2D. Current I is in the wire (in the plane).
    // dL is vector along wire.
    // r is vector from wire element to observation point P.
    // dL x r is vector perpendicular to plane (Z-axis).
    // So B-field is purely in/out of page at any point P in the plane.
    // +Z (Out) or -Z (In).
    // Magnitude: |dL x r| = |dL||r|sin(theta).
    // B_z = integral of (mu0*I/4pi) * (dL_x*r_y - dL_y*r_x) / |r|^3

    // Visualizing: B field strength as color map (Red=Out, Blue=In) or Intensity.

    const handleMouseDown = () => {
        setIsDrawing(true)
        setWirePath([]) // Clear old path on new draw? Or append? Let's clear for simplicity.
        // Or maybe just start a new segment? 
        // Let's allow drawing a single continuous wire for now.
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        setWirePath(prev => [...prev, { x, y }])
    }

    const handleMouseUp = () => {
        setIsDrawing(false)
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.scale(dpr, dpr)
        }
        resize()
        window.addEventListener('resize', resize)

        const animate = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            ctx.clearRect(0, 0, w, h)

            // Draw Wire
            if (wirePath.length > 1) {
                ctx.strokeStyle = '#fbbf24' // Warning color
                ctx.lineWidth = 3
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.beginPath()
                ctx.moveTo(wirePath[0].x, wirePath[0].y)
                for (let i = 1; i < wirePath.length; i++) {
                    ctx.lineTo(wirePath[i].x, wirePath[i].y)
                }
                ctx.stroke()

                // Show Current Direction arrows
                if (wirePath.length > 5) {
                    ctx.fillStyle = '#fbbf24'
                    for (let i = 5; i < wirePath.length; i += 20) {
                        const p1 = wirePath[i - 1]
                        const p2 = wirePath[i]
                        const dx = p2.x - p1.x
                        const dy = p2.y - p1.y
                        const angle = Math.atan2(dy, dx)

                        ctx.save()
                        ctx.translate(p2.x, p2.y)
                        ctx.rotate(angle)
                        ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, 0); ctx.lineTo(-5, 5); ctx.fill()
                        ctx.restore()
                    }
                }
            }

            // Calculate B Field Grid
            // Subsample grid for performance
            const gridSize = 20

            // Only calc if wire exists
            if (wirePath.length > 1) {
                for (let y = 0; y < h; y += gridSize) {
                    for (let x = 0; x < w; x += gridSize) {
                        // Calc B at (x, y)
                        let Bz = 0

                        // Integrate over wire segments
                        // dL is p[i] to p[i+1]
                        // Center of segment is mid
                        const step = Math.max(1, Math.floor(wirePath.length / 50)) // Optimization

                        for (let i = 0; i < wirePath.length - 1; i += step) {
                            const p1 = wirePath[i]
                            const p2 = wirePath[i + 1]

                            const dLx = p2.x - p1.x
                            const dLy = p2.y - p1.y

                            const midX = (p1.x + p2.x) / 2
                            const midY = (p1.y + p2.y) / 2

                            const rx = x - midX
                            const ry = y - midY
                            const r2 = rx * rx + ry * ry + 100 // +100 to avoid div by zero singularity
                            const r = Math.sqrt(r2)

                            // Cross product (dL x r)_z = dLx*ry - dLy*rx
                            const crossZ = dLx * ry - dLy * rx

                            // dB = k * crossZ / r^3
                            Bz += (crossZ / (r * r * r))
                        }

                        // Scale B
                        const val = Bz * current * 50

                        // Draw
                        if (Math.abs(val) > 0.5) {
                            const maxVal = 20
                            const normVal = Math.min(Math.abs(val) / maxVal, 1)

                            ctx.beginPath()
                            if (val > 0) {
                                // Out of page (Dot) - Red
                                ctx.fillStyle = `rgba(239, 68, 68, ${normVal})`
                                ctx.arc(x, y, 2, 0, Math.PI * 2)
                                ctx.fill()
                            } else {
                                // Into page (X) - Blue
                                ctx.strokeStyle = `rgba(59, 130, 246, ${normVal})`
                                ctx.lineWidth = 1.5
                                // Draw X
                                ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3)
                                ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3)
                                ctx.stroke()
                            }
                        }
                    }
                }
            }


            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [wirePath, current])

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
                        <h1 className="text-xl font-medium tracking-tight">Biot-Savart Law</h1>
                        <p className="text-xs text-white/50">AP Physics C: E&M</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                    />
                    {wirePath.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-xl text-white/50 border border-white/10">
                                Click and Drag to draw a wire
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div className="text-sm text-white/70 leading-relaxed">
                        <b>dB = (μ₀I/4π) (dl × r̂)/r²</b>
                        <br />
                        Draw a wire to see the magnetic field generated by the current.
                        <br />
                        <span className="text-blue-400">× Into Page</span> <span className="text-red-400">• Out of Page</span>
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="space-y-6">
                        <button
                            onClick={() => setWirePath([])}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                        >
                            Clear Wire
                        </button>

                        {/* Current */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Current (I)</label>
                                <span className="text-xs font-mono text-white/60">{current} A</span>
                            </div>
                            <input
                                type="range" min="1" max="10" step="0.5" value={current}
                                onChange={(e) => setCurrent(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
