import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

// Charge Type
type Charge = { x: number, y: number, q: number, id: number }

export default function GaussLaw() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [charges, setCharges] = useState<Charge[]>([])
    const [surfaceRadius, setSurfaceRadius] = useState(150) // pixels
    const [flux, setFlux] = useState(0)
    const [encCharge, setEncCharge] = useState(0)
    const nextId = useRef(0)

    // Physics Logic
    // Gauss Law: Flux = Q_enc / epsilon_0
    // We visualize in 2D. 2D "Flux" is line integral of E dot n dl.
    // Result is still proportional to Q_enc / epsilon_0 (2D equivalent).
    // E-field from point charge in 2D: E = k*q / r (1/r decay vs 1/r^2 in 3D).
    // If we want 3D behavior projected: E = k*q / r^2.
    // Flux integral in 2D of 1/r field over circle -> constant * q.
    // Flux integral in 2D of 1/r^2 field over circle -> ???
    // Let's stick to standard 3D Coulomb field E = kq/r^2 visualized in 2D cross section.
    // Flux calculation: standard gauss law applies.

    // Handle Click to Add Charge
    const handleCanvasClick = (e: React.MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        // const scale = canvas.width / rect.width // handle pixel density? handleCanvasClick uses client coords

        // We need coordinates relative to canvas layout
        // Let's rely on standard logic
        // No, standard click logic:
        // rect is display size.
        // internal resolution is high.
        // We need simple offset.

        // Better:
        const mx = (e.clientX - rect.left)
        const my = (e.clientY - rect.top)

        // Add charge
        // Toggle + / - ? Or random?
        // Left click +1, Shift click -1?
        const q = e.shiftKey ? -1 : 1

        setCharges(prev => [...prev, { x: mx, y: my, q, id: nextId.current++ }])
    }

    const clearCharges = () => {
        setCharges([])
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            // For correct mouse mapping, keep canvas size match display size or handle scaling
            // Let's simple scaling:
            // canvas.style.width = '100%'...
            // internal width = offsetWidth * dpr
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
            const cx = w / 2
            const cy = h / 2

            ctx.clearRect(0, 0, w, h)

            // Draw Gaussian Surface (Circle)
            ctx.strokeStyle = '#fbbf24' // Amber
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.beginPath()
            ctx.arc(cx, cy, surfaceRadius, 0, Math.PI * 2)
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(251, 191, 36, 0.1)'
            ctx.fill()

            // Calculate Q_enc
            let q_enc = 0
            charges.forEach(c => {
                // Check distance to center
                const dx = c.x - cx
                const dy = c.y - cy
                const r = Math.sqrt(dx * dx + dy * dy)
                if (r < surfaceRadius) {
                    q_enc += c.q
                }
            })
            setEncCharge(q_enc)
            setFlux(q_enc * 1.0) // Flux is prop to Q_enc

            // Draw Charges
            charges.forEach(c => {
                ctx.beginPath()
                ctx.arc(c.x, c.y, 8, 0, Math.PI * 2)
                ctx.fillStyle = c.q > 0 ? '#ef4444' : '#3b82f6'
                ctx.fill()
                // Sign
                ctx.fillStyle = 'white'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.font = '10px serif'
                ctx.fillText(c.q > 0 ? '+' : '-', c.x, c.y)
            })

            // Visualize Electric Field Lines
            // Vectors on a grid or just on Surface?
            // "Flux Viz" implies showing field pass through surface.
            // Let's calculate E at points on the surface.

            const numPoints = 36
            for (let i = 0; i < numPoints; i++) {
                const theta = (i / numPoints) * Math.PI * 2
                const px = cx + Math.cos(theta) * surfaceRadius
                const py = cy + Math.sin(theta) * surfaceRadius

                // Calc E-field vector (Ex, Ey) at (px, py)
                let Ex = 0
                let Ey = 0

                charges.forEach(c => {
                    const dx = px - c.x
                    const dy = py - c.y
                    const r2 = dx * dx + dy * dy
                    const r = Math.sqrt(r2)
                    const E = 1000 * c.q / Math.max(r2, 100) // Scale factor
                    Ex += E * (dx / r)
                    Ey += E * (dy / r)
                })

                // Draw Vector
                const mag = Math.sqrt(Ex * Ex + Ey * Ey)
                if (mag > 0.1) {
                    const vecLen = Math.min(mag * 20, 40) // Cap length
                    const endX = px + (Ex / mag) * vecLen
                    const endY = py + (Ey / mag) * vecLen

                    ctx.strokeStyle = 'white'
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(px, py)
                    ctx.lineTo(endX, endY)
                    ctx.stroke()

                    // Arrowhead
                    // ...

                    // Color code: Outward (positive flux) vs Inward (negative)
                    // Dot product with Normal (Radial unit vector)
                    const nx = Math.cos(theta)
                    const ny = Math.sin(theta)
                    const dot = Ex * nx + Ey * ny

                    ctx.fillStyle = dot > 0 ? '#4ade80' : '#f87171' // Green Out, Red In
                    ctx.beginPath(); ctx.arc(endX, endY, 2, 0, Math.PI * 2); ctx.fill()
                }
            }

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [charges, surfaceRadius])

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
                        <h1 className="text-xl font-medium tracking-tight">Gauss's Law Flux</h1>
                        <p className="text-xs text-white/50">AP Physics C: E&M</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative cursor-crosshair" onClick={handleCanvasClick}>
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                    />
                    <div className="absolute top-4 left-4 pointer-events-none text-xs text-white/40">
                        Click to add +Q. Shift+Click to add -Q.
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div className="text-sm text-white/70 leading-relaxed">
                        <b>Φ_E = ∮E•dA = Q_enc / ε₀</b>
                        <br />
                        The net flux through the yellow Gaussian surface depends <i>only</i> on the enclosed charge.
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="space-y-4 text-center">
                        <div>
                            <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Enclosed Charge</div>
                            <div className={`text-3xl font-light ${encCharge > 0 ? 'text-red-400' : encCharge < 0 ? 'text-blue-400' : 'text-white/60'}`}>
                                {encCharge > 0 ? '+' : ''}{encCharge} Q
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Net Flux Φ</div>
                            <div className={`text-2xl font-mono ${flux > 0 ? 'text-green-400' : flux < 0 ? 'text-red-400' : 'text-white/60'}`}>
                                {flux > 0 ? '+' : ''}{flux.toFixed(1)}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="space-y-6">
                        <button
                            onClick={clearCharges}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                        >
                            Clear Charges
                        </button>

                        {/* Radius */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Surface Radius</label>
                                <span className="text-xs font-mono text-white/60">{surfaceRadius} px</span>
                            </div>
                            <input
                                type="range" min="50" max="300" step="10" value={surfaceRadius}
                                onChange={(e) => setSurfaceRadius(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
