import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function ProjectileMotion() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [v0, setV0] = useState(50)
    const [angle, setAngle] = useState(45)
    const [height, setHeight] = useState(0)
    const [gravity, setGravity] = useState(9.8)
    const [showVectors, setShowVectors] = useState(true)
    const [timeScale, setTimeScale] = useState(1)

    const stateRef = useRef({
        t: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        trail: [] as { x: number, y: number }[]
    })

    const reset = () => {
        setIsRunning(false)
        stateRef.current = {
            t: 0,
            x: 0,
            y: height,
            vx: v0 * Math.cos(angle * Math.PI / 180),
            vy: v0 * Math.sin(angle * Math.PI / 180),
            trail: []
        }
        // Force a re-render/update
    }

    // Reset when parameters change if not running
    useEffect(() => {
        if (!isRunning) {
            reset()
        }
    }, [v0, angle, height, gravity])

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

        let animId: number
        const dt = 0.016 * timeScale // Base time step * scale

        const animate = () => {
            const width = canvas.offsetWidth
            const heightPx = canvas.offsetHeight

            // Physics Simulation
            if (isRunning) {
                stateRef.current.t += dt
                const t = stateRef.current.t
                const rad = angle * Math.PI / 180

                // Equations: x = v0x * t, y = h + v0y * t - 0.5 * g * t^2
                // Note: We use mathematical y (up is positive), but canvas y (down is positive) needs conversion
                stateRef.current.x = v0 * Math.cos(rad) * t
                stateRef.current.y = height + v0 * Math.sin(rad) * t - 0.5 * gravity * t * t

                stateRef.current.vx = v0 * Math.cos(rad)
                stateRef.current.vy = v0 * Math.sin(rad) - gravity * t

                // Stop if hits ground (y < 0)
                if (stateRef.current.y < 0) {
                    stateRef.current.y = 0
                    setIsRunning(false)
                }

                if (stateRef.current.t % 0.05 < dt) { // Add trail point occasionally
                    stateRef.current.trail.push({ x: stateRef.current.x, y: stateRef.current.y })
                }
            }

            // Drawing
            // Coordinate System: 
            // Scale: 1 meter = 4 pixels (approx, need dynamic scaling or fixed)
            // Origin: Bottom Left (with padding)
            const scale = 4
            const originX = 50
            const originY = heightPx - 50

            const toCanvasX = (x: number) => originX + x * scale
            const toCanvasY = (y: number) => originY - y * scale

            ctx.clearRect(0, 0, width, heightPx)

            // Ground
            ctx.fillStyle = '#1a1f2e'
            ctx.fillRect(0, originY, width, heightPx - originY)
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(0, originY)
            ctx.lineTo(width, originY)
            ctx.stroke()

            // Cannon / Start Platform
            if (height > 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
                ctx.fillRect(toCanvasX(-5), toCanvasY(height), toCanvasX(0) - toCanvasX(-5), originY - toCanvasY(height))
            }

            // Trajectory Prediction (Dashed Line)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.setLineDash([5, 5])
            ctx.lineWidth = 1
            ctx.beginPath()
            const totalTime = (v0 * Math.sin(angle * Math.PI / 180) + Math.sqrt(Math.pow(v0 * Math.sin(angle * Math.PI / 180), 2) + 2 * gravity * height)) / gravity
            for (let t = 0; t <= totalTime; t += 0.1) {
                const rad = angle * Math.PI / 180
                const px = v0 * Math.cos(rad) * t
                const py = height + v0 * Math.sin(rad) * t - 0.5 * gravity * t * t
                const cx = toCanvasX(px)
                const cy = toCanvasY(py)
                if (t === 0) ctx.moveTo(cx, cy)
                else ctx.lineTo(cx, cy)
            }
            ctx.stroke()
            ctx.setLineDash([])

            // Trail
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'
            ctx.lineWidth = 2
            ctx.beginPath()
            stateRef.current.trail.forEach((p, i) => {
                const cx = toCanvasX(p.x)
                const cy = toCanvasY(p.y)
                if (i === 0) ctx.moveTo(cx, cy)
                else ctx.lineTo(cx, cy)
            })
            // Draw to current pos
            ctx.lineTo(toCanvasX(stateRef.current.x), toCanvasY(stateRef.current.y))
            ctx.stroke()

            // Projectile
            const curX = toCanvasX(stateRef.current.x)
            const curY = toCanvasY(stateRef.current.y)

            ctx.fillStyle = '#3b82f6'
            ctx.beginPath()
            ctx.arc(curX, curY, 8, 0, Math.PI * 2)
            ctx.fill()

            // Velocity Vectors
            if (showVectors) {
                // Velocity Scale
                const vScale = 1

                // Vx
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)' // Red for X
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(curX, curY)
                ctx.lineTo(curX + stateRef.current.vx * scale * vScale, curY)
                ctx.stroke()

                // Vy
                ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)' // Green for Y
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(curX, curY)
                ctx.lineTo(curX, curY - stateRef.current.vy * scale * vScale)
                ctx.stroke()

                // Resultant V
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
                ctx.setLineDash([2, 2])
                ctx.beginPath()
                ctx.moveTo(curX, curY)
                ctx.lineTo(curX + stateRef.current.vx * scale * vScale, curY - stateRef.current.vy * scale * vScale)
                ctx.stroke()
                ctx.setLineDash([])
            }

            animId = requestAnimationFrame(animate)
        }
        animId = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [v0, angle, height, gravity, isRunning, timeScale, showVectors])

    // Calculate max values for display
    const rad = angle * Math.PI / 180
    const vy0 = v0 * Math.sin(rad)
    const vx0 = v0 * Math.cos(rad)
    const t_peak = vy0 / gravity
    const y_max = height + vy0 * t_peak - 0.5 * gravity * t_peak * t_peak
    const t_total = (vy0 + Math.sqrt(vy0 * vy0 + 2 * gravity * height)) / gravity
    const x_max = vx0 * t_total

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="absolute inset-0 pointer-events-none">
                <PhysicsBackground />
            </div>

            {/* Navbar / Header */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Projectile Motion</h1>
                        <p className="text-xs text-white/50">Kinematics Unit</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40 font-mono">
                        Time: {stateRef.current.t.toFixed(2)}s
                    </span>
                </div>
            </div>

            <div className="flex-1 relative flex">
                {/* Canvas Area */}
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    {/* Stats Overlay */}
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl min-w-[200px]">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Calculated Values</h3>
                        <div className="space-y-2 text-sm font-mono">
                            <div className="flex justify-between">
                                <span className="text-white/60">Max Height (y)</span>
                                <span>{y_max.toFixed(1)} m</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Range (x)</span>
                                <span>{x_max.toFixed(1)} m</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Flight Time</span>
                                <span>{t_total.toFixed(2)} s</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Initial Velocity (v₀)</label>
                            <span className="text-xs font-mono text-blue-400">{v0} m/s</span>
                        </div>
                        <input
                            type="range" min="0" max="100" value={v0}
                            onChange={(e) => setV0(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Launch Angle (θ)</label>
                            <span className="text-xs font-mono text-purple-400">{angle}°</span>
                        </div>
                        <input
                            type="range" min="0" max="90" value={angle}
                            onChange={(e) => setAngle(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Initial Height (h)</label>
                            <span className="text-xs font-mono text-green-400">{height} m</span>
                        </div>
                        <input
                            type="range" min="0" max="100" value={height}
                            onChange={(e) => setHeight(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Gravity (g)</label>
                            <span className="text-xs font-mono text-yellow-400">{gravity} m/s²</span>
                        </div>
                        <input
                            type="range" min="1" max="25" step="0.1" value={gravity}
                            onChange={(e) => setGravity(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${isRunning
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-blue-500 text-white hover:bg-blue-400'
                                }`}
                        >
                            {isRunning ? 'Pause' : 'Launch'}
                        </button>
                        <button
                            onClick={reset}
                            className="px-4 py-2.5 rounded-lg font-medium text-sm bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Show Vectors</span>
                            <input
                                type="checkbox"
                                checked={showVectors}
                                onChange={(e) => setShowVectors(e.target.checked)}
                                className="accent-blue-500"
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Slow Motion</span>
                            <input
                                type="checkbox"
                                checked={timeScale < 1}
                                onChange={(e) => setTimeScale(e.target.checked ? 0.2 : 1)}
                                className="accent-blue-500"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}
