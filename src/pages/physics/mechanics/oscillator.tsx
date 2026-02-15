import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function DampedDrivenOscillator() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mass] = useState(1.0)
    const [k, setK] = useState(10.0) // k
    const [damping, setDamping] = useState(0.5) // b
    const [driveAmp, setDriveAmp] = useState(5.0) // F0
    const [driveFreq, setDriveFreq] = useState(3.0) // omega_d

    // Physics State
    const stateRef = useRef({
        x: 0, v: 0, t: 0
    })
    const historyRef = useRef<{ t: number, x: number }[]>([])
    const animRef = useRef<number>(0)

    // Natural Freq
    const w0 = Math.sqrt(k / mass)

    const reset = () => {
        stateRef.current = { x: 50, v: 0, t: 0 } // Start displaced
        historyRef.current = []
        setIsRunning(false)
        if (animRef.current) cancelAnimationFrame(animRef.current)
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

                // Forces
                // F_spring = -k*x
                // F_damp = -b*v
                // F_drive = F0 * cos(wd * t)

                const Fs = -k * s.x
                const Fd = -damping * s.v
                // Use cos or sin? Standard often cos for driving
                const Fext = driveAmp * Math.cos(driveFreq * s.t)

                const a = (Fs + Fd + Fext) / mass

                s.v += a * dt
                s.x += s.v * dt
                s.t += dt

                // Initial history calc
                if (historyRef.current.length === 0 || s.t - historyRef.current[historyRef.current.length - 1].t > 0.05) {
                    historyRef.current.push({ t: s.t, x: s.x })
                    if (historyRef.current.length > 200) historyRef.current.shift()
                }
            }

            // DRAW
            ctx.clearRect(0, 0, w, h)
            const cx = w / 2
            const cy = h / 2
            const scale = 3 // pixels per unit

            // Visual Setup: Mass on Spring
            const x_px = stateRef.current.x * scale

            // Spring
            ctx.beginPath()
            ctx.moveTo(0, cy)
            // Draw zig zag spring to mass
            const segments = 20
            const springEnd = cx + x_px - 20
            for (let i = 0; i <= segments; i++) {
                const x = (i / segments) * springEnd
                const y = cy + (i % 2 === 0 ? -10 : 10) * (i === 0 || i === segments ? 0 : 1)
                ctx.lineTo(x, y)
            }
            ctx.strokeStyle = '#94a3b8'
            ctx.lineWidth = 2
            ctx.stroke()

            // Mass
            ctx.fillStyle = '#3b82f6'
            ctx.fillRect(cx + x_px - 20, cy - 20, 40, 40)

            // Wall
            ctx.fillStyle = '#475569'
            ctx.fillRect(0, cy - 50, 10, 100)

            // Parameters Display
            ctx.fillStyle = 'white'
            ctx.textAlign = 'left'
            ctx.fillText(`Natural Freq ω₀: ${w0.toFixed(2)} rad/s`, 20, 30)
            ctx.fillText(`Driving Freq ω: ${driveFreq.toFixed(2)} rad/s`, 20, 50)

            // Graph (Position vs Time)
            const gx = w - 300
            const gy = h - 150
            const gw = 250
            const gh = 100

            ctx.fillStyle = 'rgba(0,0,0,0.5)'
            ctx.fillRect(gx - 10, gy - gh - 10, gw + 20, gh + 40)

            // Axes
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - gh); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(gx, gy - gh / 2); ctx.lineTo(gx + gw, gy - gh / 2); ctx.stroke() // Center line

            // Plot
            if (historyRef.current.length > 1) {
                ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2
                ctx.beginPath()
                // const maxT = historyRef.current[historyRef.current.length - 1].t
                // const minT = Math.max(0, maxT - 10) // Show last 10s window?
                // Or just scroll

                // Show window of last 200 pts (approx 10s)

                historyRef.current.forEach((pt, i) => {
                    // Normalize x to fit
                    // Max amplitude approx 50-100?
                    const x = gx + (i / historyRef.current.length) * gw
                    const y = (gy - gh / 2) - (pt.x / 100) * (gh / 2) // scale: 100 units = full height/2
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke()
            }
            ctx.fillStyle = 'white'; ctx.textAlign = 'center'
            ctx.fillText('Position vs Time', gx + gw / 2, gy + 20)

            // Resonance Indicator
            const ratio = driveFreq / w0
            let color = 'white'
            if (Math.abs(ratio - 1.0) < 0.1) color = '#ef4444' // Resonance!
            else if (Math.abs(ratio - 1.0) < 0.3) color = '#fbbf24' // Near

            ctx.fillStyle = color
            ctx.fillText(Math.abs(ratio - 1.0) < 0.1 ? 'RESONANCE!' : '', cx, cy - 50)

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [isRunning, mass, k, damping, driveAmp, driveFreq, w0])

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
                        <h1 className="text-xl font-medium tracking-tight">Damped Driven Oscillator</h1>
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
                        <b>ma = -kx - bv + F₀cos(ωt)</b>
                        <br />
                        Explore Resonance when ω approaches ω₀.
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <button
                        onClick={() => {
                            if (isRunning) setIsRunning(false)
                            else {
                                reset()
                                setIsRunning(true)
                            }
                        }}
                        className={`w-full py-3 mb-6 rounded-xl font-medium text-sm transition-all ${isRunning ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500 text-white'}`}
                    >
                        {isRunning ? 'Stop & Reset' : 'Start Oscillation'}
                    </button>

                    <div className="space-y-6">

                        {/* Spring Constant k */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Spring Constant (k)</label>
                                <span className="text-xs font-mono text-white/60">{k}</span>
                            </div>
                            <input
                                type="range" min="1" max="50" step="1" value={k}
                                onChange={(e) => setK(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        {/* Damping b */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Damping (b)</label>
                                <span className="text-xs font-mono text-white/60">{damping.toFixed(1)}</span>
                            </div>
                            <input
                                type="range" min="0" max="5.0" step="0.1" value={damping}
                                onChange={(e) => setDamping(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        {/* Drive Amp */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Drive Force (F₀)</label>
                                <span className="text-xs font-mono text-white/60">{driveAmp}</span>
                            </div>
                            <input
                                type="range" min="0" max="20" step="1" value={driveAmp}
                                onChange={(e) => setDriveAmp(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        {/* Drive Freq */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Drive Freq (ω)</label>
                                <span className="text-xs font-mono text-white/60">{driveFreq.toFixed(1)} rad/s</span>
                            </div>
                            <input
                                type="range" min="0.5" max="10.0" step="0.1" value={driveFreq}
                                onChange={(e) => setDriveFreq(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                            <div className="mt-1 text-xs text-blue-400">
                                Resonance at ω₀ ≈ {Math.sqrt(k / mass).toFixed(2)}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
