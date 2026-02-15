import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function DragSimulation() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mass, setMass] = useState(1.0) // kg
    const [dragCoeff, setDragCoeff] = useState(0.2) // c
    const [dragType, setDragType] = useState<'linear' | 'quadratic'>('quadratic')

    // Physics State
    // Object 1: With Drag
    // Object 2: No Drag (Vacuum)
    const stateRef = useRef({
        y1: 0, v1: 0,
        y2: 0, v2: 0,
        t: 0
    })
    const historyRef = useRef<{ t: number, v1: number, v2: number }[]>([])
    const animRef = useRef<number>(0)

    const G = 9.8
    const SCALE = 5 // pixels per meter

    const reset = () => {
        stateRef.current = { y1: 0, v1: 0, y2: 0, v2: 0, t: 0 }
        historyRef.current = []
        setIsRunning(false)
        if (animRef.current) cancelAnimationFrame(animRef.current)
        // Trigger generic draw
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext('2d')
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
            // drawInitial(ctx, canvas.width, canvas.height)
        }
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

        let lastTime = performance.now()

        const animate = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTime) / 1000, 0.05)
            lastTime = now

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            if (isRunning) {
                const s = stateRef.current

                // Object 1: Drag
                // F_net = mg - F_drag
                // Linear: F_d = c*v
                // Quad: F_d = c*v^2
                // a = g - (F_d/m)

                let Fd = 0
                if (dragType === 'linear') Fd = dragCoeff * s.v1
                else Fd = dragCoeff * s.v1 * s.v1

                // Direction of drag opposes motion?
                // Falling down (v > 0) -> Drag up (negative force).
                // My coord system: Down is Positive Y?
                // Let's say y=0 is top. Down is positive.
                // g is positive.
                // v is positive.
                // Drag opposes v -> Drag force is negative.

                const a1 = G - (Fd / mass)
                s.v1 += a1 * dt
                s.y1 += s.v1 * dt

                // Object 2: Vacuum
                const a2 = G
                s.v2 += a2 * dt
                s.y2 += s.v2 * dt

                s.t += dt

                // Hist
                if (historyRef.current.length === 0 || s.t - historyRef.current[historyRef.current.length - 1].t > 0.05) {
                    historyRef.current.push({ t: s.t, v1: s.v1, v2: s.v2 })
                }

                // Stop if hit ground
                if (s.y1 * SCALE > h - 50 && s.y2 * SCALE > h - 50) setIsRunning(false)
            }

            // DRAW
            ctx.clearRect(0, 0, w, h)

            const startY = 50
            const groundY = h - 20

            // Ground
            ctx.fillStyle = '#475569'
            ctx.fillRect(0, groundY, w, 20)

            // Render Objects
            // Obj 1 (Drag) - x = w/3
            // Obj 2 (Vacuum) - x = 2w/3

            const y1_px = startY + stateRef.current.y1 * SCALE
            const y2_px = startY + stateRef.current.y2 * SCALE

            // Object 1
            ctx.fillStyle = '#ef4444' // Red
            if (y1_px < groundY) {
                ctx.beginPath(); ctx.arc(w / 3, y1_px, 15, 0, Math.PI * 2); ctx.fill()
            } else {
                ctx.beginPath(); ctx.arc(w / 3, groundY - 15, 15, 0, Math.PI * 2); ctx.fill()
            }
            ctx.fillStyle = 'white'; ctx.textAlign = 'center'
            ctx.fillText('With Drag', w / 3, startY - 20)
            ctx.fillText(`${stateRef.current.v1.toFixed(1)} m/s`, w / 3, y1_px < groundY ? y1_px - 25 : groundY - 45)

            // Object 2
            ctx.fillStyle = '#3b82f6' // Blue
            if (y2_px < groundY) {
                ctx.beginPath(); ctx.arc(2 * w / 3, y2_px, 15, 0, Math.PI * 2); ctx.fill()
            } else {
                ctx.beginPath(); ctx.arc(2 * w / 3, groundY - 15, 15, 0, Math.PI * 2); ctx.fill()
            }
            ctx.fillStyle = 'white'
            ctx.fillText('Vacuum (No Air)', 2 * w / 3, startY - 20)
            ctx.fillText(`${stateRef.current.v2.toFixed(1)} m/s`, 2 * w / 3, y2_px < groundY ? y2_px - 25 : groundY - 45)

            // Graph (Velocity vs Time)
            // Overlay on top right
            const gx = w - 250
            const gy = 150
            const gw = 200
            const gh = 100

            ctx.fillStyle = 'rgba(0,0,0,0.5)'
            ctx.fillRect(gx - 10, gy - gh - 10, gw + 20, gh + 40)

            ctx.strokeStyle = 'white'
            ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - gh); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke()

            // Plot
            if (historyRef.current.length > 1) {
                const tMax = Math.max(5, stateRef.current.t)
                const vMax = Math.max(20, stateRef.current.v2)

                // Drag
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2
                ctx.beginPath()
                historyRef.current.forEach((pt, i) => {
                    const x = gx + (pt.t / tMax) * gw
                    const y = gy - (pt.v1 / vMax) * gh
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke()

                // Vacuum
                ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.setLineDash([4, 4])
                ctx.beginPath()
                historyRef.current.forEach((pt, i) => {
                    const x = gx + (pt.t / tMax) * gw
                    const y = gy - (pt.v2 / vMax) * gh
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke(); ctx.setLineDash([])
            }

            ctx.fillStyle = 'white'; ctx.fillText('Velocity vs Time', gx + gw / 2, gy + 20)

            // Terminal Volocity calc
            let vt = 0
            if (dragType === 'linear') vt = (mass * G) / dragCoeff
            else vt = Math.sqrt((mass * G) / dragCoeff)

            ctx.fillStyle = '#ef4444'
            ctx.fillText(`Term. Vel: ${vt.toFixed(1)} m/s`, gx + gw / 2, gy - gh - 15)

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [isRunning, mass, dragCoeff, dragType])

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
                        <h1 className="text-xl font-medium tracking-tight">Drag Forces</h1>
                        <p className="text-xs text-white/50">AP Physics C: Mechanics</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                    />
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div className="text-sm text-white/70 leading-relaxed">
                        <b>F_drag = -cv</b> or <b>-cv²</b>
                        <br />
                        Differential Eq: <b>a = g - (c/m)vⁿ</b>
                        <br />
                        Observe the approach to terminal velocity.
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <button
                        onClick={() => {
                            if (isRunning) setIsRunning(false)
                            else {
                                reset() // Reset states
                                setIsRunning(true)
                            }
                        }}
                        className={`w-full py-3 mb-6 rounded-xl font-medium text-sm transition-all ${isRunning ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500 text-white'}`}
                    >
                        {isRunning ? 'Stop' : 'Drop Objects'}
                    </button>

                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-white/80 mb-2 block">Drag Model</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['linear', 'quadratic'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setDragType(type as any)}
                                        className={`px-3 py-2 text-xs rounded-lg transition-all ${dragType === type ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                    >
                                        {type === 'linear' ? 'Linear (-cv)' : 'Quadratic (-cv²)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Mass (m)</label>
                                <span className="text-xs font-mono text-white/60">{mass} kg</span>
                            </div>
                            <input
                                type="range" min="0.5" max="10.0" step="0.5" value={mass}
                                onChange={(e) => setMass(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Drag Coeff (c)</label>
                                <span className="text-xs font-mono text-white/60">{dragCoeff.toFixed(2)}</span>
                            </div>
                            <input
                                type="range" min="0.05" max="1.0" step="0.05" value={dragCoeff}
                                onChange={(e) => setDragCoeff(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
