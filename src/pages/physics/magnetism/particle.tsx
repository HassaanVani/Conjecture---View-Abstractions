import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function MagneticParticle() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [bField, setBField] = useState(1.0) // Tesla (positive = out of page, negative = into page)
    const [velocity, setVelocity] = useState(5.0) // v
    const [charge, setCharge] = useState(1) // +1 or -1
    const [mass, setMass] = useState(1.0)

    // Particle State
    const particleRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, path: [] as { x: number, y: number }[] })
    const isRunningRef = useRef(false)
    const animRef = useRef<number>(0)

    const reset = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        particleRef.current = {
            x: canvas.offsetWidth / 2 - 100, // Start left
            y: canvas.offsetHeight / 2,
            vx: velocity * 20, // Scale for pixels
            vy: 0,
            path: []
        }
        isRunningRef.current = true
    }

    useEffect(() => {
        reset()
    }, [velocity]) // Reset if inject velocity changes? Or just init.

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
            // If resize, maybe reset particle pos effectively?
            // particleRef.current.x = canvas.offsetWidth / 2 - 100
        }
        resize()
        window.addEventListener('resize', resize)

        // Init particle if fresh
        if (particleRef.current.x === 0) reset()

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            const dt = 0.016

            // Updates
            if (isRunningRef.current) {
                const p = particleRef.current

                // F = q(v x B)
                // 2D: v = (vx, vy, 0), B = (0, 0, Bz)
                // v x B = (vy*Bz - 0, 0 - vx*Bz, 0) -> (vy*Bz, -vx*Bz, 0)
                // Fx = q * vy * B
                // Fy = q * (-vx) * B
                // a = F/m

                const B = bField // * scale
                const q = charge
                const m = mass

                const ax = (q * p.vy * B) / m
                const ay = -(q * p.vx * B) / m

                // Scale forces for visual effect
                // Needs to orbit on screen. 
                // r = mv / qB
                // If B=1, q=1, m=1, v=100 -> r=100 px. Reasonable.
                // a should be substantial.
                // Let's multiply B by a constant for pixels.
                const k = 0.5 // Coupling constant

                p.vx += ax * k * dt * 60 // 60fps adjustment
                p.vy += ay * k * dt * 60

                p.x += p.vx * dt
                p.y += p.vy * dt

                // Record path
                if (p.path.length === 0 ||
                    Math.hypot(p.x - p.path[p.path.length - 1].x, p.y - p.path[p.path.length - 1].y) > 5) {
                    p.path.push({ x: p.x, y: p.y })
                    if (p.path.length > 500) p.path.shift()
                }

                // Bounds?
                // Just let it fly off
            }

            // Draw
            ctx.clearRect(0, 0, width, height)

            // Draw B-Field Background
            // If B > 0: Dots (Out). If B < 0: Crosses (In).
            ctx.fillStyle = 'rgba(255,255,255,0.1)'
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'
            ctx.lineWidth = 1
            const spacing = 40

            for (let x = 20; x < width; x += spacing) {
                for (let y = 20; y < height; y += spacing) {
                    if (Math.abs(bField) < 0.1) continue
                    if (bField > 0) {
                        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
                        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke()
                    } else {
                        // Cross
                        ctx.beginPath()
                        ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4)
                        ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4)
                        ctx.stroke()
                    }
                }
            }

            // Draw Particle
            const p = particleRef.current

            // Path
            ctx.strokeStyle = charge > 0 ? '#ef4444' : '#3b82f6'
            ctx.lineWidth = 2
            ctx.beginPath()
            p.path.forEach((pt, i) => {
                if (i === 0) ctx.moveTo(pt.x, pt.y)
                else ctx.lineTo(pt.x, pt.y)
            })
            ctx.stroke()

            // Body
            ctx.fillStyle = charge > 0 ? '#ef4444' : '#3b82f6'
            ctx.beginPath()
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
            ctx.fill()

            // Label
            ctx.fillStyle = 'white'
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(charge > 0 ? '+' : '-', p.x, p.y)

            // Radius Info if circular
            // r = mv / qB
            if (isRunningRef.current && Math.abs(bField) > 0.1) {
                // Calculate r based on current v and B
                // scaled units roughly:
                const v_mag = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
                const r_est = (mass * v_mag) / (Math.abs(charge * bField * 0.5 * 60))

                ctx.textAlign = 'left'
                ctx.fillStyle = 'rgba(255,255,255,0.7)'
                ctx.font = '14px monospace'
                ctx.fillText(`r ∝ ${r_est.toFixed(1)}`, 20, height - 20)
            }

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [bField, velocity, charge, mass])


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
                        <h1 className="text-xl font-medium tracking-tight">Particle in Magnetic Field</h1>
                        <p className="text-xs text-white/50">AP Physics 2: Magnetism</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div className="text-sm text-white/70 leading-relaxed">
                        Charged particles curve in B-fields due to Lorentz Force.
                        <br />
                        <b>F = qv × B</b> (Right Hand Rule)
                        <br />
                        Radius r = mv / |qB|
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <button
                        onClick={reset}
                        className="w-full py-3 mb-6 rounded-xl font-medium text-sm bg-blue-500 text-white hover:bg-blue-400 transition-all"
                    >
                        Fire Particle
                    </button>

                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Magnetic Field (B)</label>
                                <span className="text-xs font-mono text-white/60">{bField} T {bField > 0 ? '(Out)' : '(In)'}</span>
                            </div>
                            <input
                                type="range" min="-2.0" max="2.0" step="0.1" value={bField}
                                onChange={(e) => setBField(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Velocity (v)</label>
                                <span className="text-xs font-mono text-white/60">{velocity}</span>
                            </div>
                            <input
                                type="range" min="1" max="10" step="0.5" value={velocity}
                                onChange={(e) => setVelocity(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Charge (q)</label>
                                <div className="flex gap-2 text-xs">
                                    <button onClick={() => setCharge(1)} className={`px-3 py-1 rounded ${charge === 1 ? 'bg-red-500' : 'bg-white/10'}`}>+</button>
                                    <button onClick={() => setCharge(-1)} className={`px-3 py-1 rounded ${charge === -1 ? 'bg-blue-500' : 'bg-white/10'}`}>-</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Mass (m)</label>
                                <span className="text-xs font-mono text-white/60">{mass} kg</span>
                            </div>
                            <input
                                type="range" min="0.5" max="5.0" step="0.5" value={mass}
                                onChange={(e) => setMass(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
