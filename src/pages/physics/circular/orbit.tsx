import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function Orbit() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [starMass, setStarMass] = useState(1000)
    const [planetMass,] = useState(10)
    const [initialV, setInitialV] = useState(3.5)
    const [initialR, setInitialR] = useState(150)
    const [showVectors, setShowVectors] = useState(true)
    const [showTrail, setShowTrail] = useState(true)

    const G = 1 // Gravitational constant scaled for viz

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
            x: initialR,
            y: 0,
            vx: 0,
            vy: initialV,
            trail: []
        }
        // Force render
    }

    useEffect(() => {
        if (!isRunning) reset()
    }, [starMass, planetMass, initialV, initialR])

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
        const dt = 0.5 // Time step

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight
            const cx = width / 2
            const cy = height / 2

            if (isRunning) {
                // Symplectic Euler Integration for stability
                const r2 = stateRef.current.x * stateRef.current.x + stateRef.current.y * stateRef.current.y
                const r = Math.sqrt(r2)
                const F = (G * starMass /* * planetMass */) / r2 // Acceleration = F/m = GM/r^2

                const ax = -F * (stateRef.current.x / r)
                const ay = -F * (stateRef.current.y / r)

                stateRef.current.vx += ax * dt
                stateRef.current.vy += ay * dt

                stateRef.current.x += stateRef.current.vx * dt
                stateRef.current.y += stateRef.current.vy * dt

                stateRef.current.t += dt

                if (showTrail && stateRef.current.t % 2 < dt * 2) {
                    stateRef.current.trail.push({ x: stateRef.current.x, y: stateRef.current.y })
                    if (stateRef.current.trail.length > 300) stateRef.current.trail.shift()
                }
            }

            // Draw
            // Fade out trail effect?? No, clear rect
            ctx.clearRect(0, 0, width, height)

            // Star
            ctx.shadowBlur = 20
            ctx.shadowColor = '#fbbf24'
            ctx.fillStyle = '#fbbf24'
            ctx.beginPath()
            ctx.arc(cx, cy, 20 + Math.log(starMass / 100) * 2, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0

            // Trail
            if (showTrail) {
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
                ctx.lineWidth = 1
                ctx.beginPath()
                stateRef.current.trail.forEach((p, i) => {
                    if (i === 0) ctx.moveTo(cx + p.x, cy - p.y) // Canvas Y inverted
                    else ctx.lineTo(cx + p.x, cy - p.y)
                })
                ctx.stroke()
            }

            // Planet
            const px = cx + stateRef.current.x
            const py = cy - stateRef.current.y // Canvas Y inverted

            ctx.fillStyle = '#3b82f6'
            ctx.beginPath()
            ctx.arc(px, py, 6 + Math.log(planetMass) * 1, 0, Math.PI * 2)
            ctx.fill()

            // Vectors
            if (showVectors) {
                // Velocity
                const vScale = 10
                drawArrow(ctx, px, py, px + stateRef.current.vx * vScale, py - stateRef.current.vy * vScale, '#22c55e', 'v')

                // Force/Acceleration (towards star)
                // Just draw unit direction or scaled
                const r = Math.sqrt(stateRef.current.x ** 2 + stateRef.current.y ** 2)
                const nx = -stateRef.current.x / r
                const ny = -stateRef.current.y / r
                const fScale = 40
                drawArrow(ctx, px, py, px + nx * fScale, py - ny * fScale, '#ef4444', 'F')
            }

            animId = requestAnimationFrame(animate)
        }

        const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string, _label: string) => {
            const headlen = 8
            const dx = toX - fromX
            const dy = toY - fromY
            const angle = Math.atan2(dy, dx)

            ctx.strokeStyle = color
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(fromX, fromY)
            ctx.lineTo(toX, toY)
            ctx.stroke()

            ctx.fillStyle = color
            ctx.beginPath()
            ctx.moveTo(toX, toY)
            ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6))
            ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6))
            ctx.fill()

            // ctx.fillStyle = 'white'
            // ctx.font = '10px monospace'
            // ctx.fillText(label, toX + 5, toY)
        }

        animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [isRunning, starMass, planetMass, initialV, initialR, showVectors, showTrail])

    // Calc orbital prediction
    // Circular velocity: v = sqrt(GM/r)
    const vCirc = Math.sqrt(G * starMass / initialR)
    const vEsc = Math.sqrt(2 * G * starMass / initialR)

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
                        <h1 className="text-xl font-medium tracking-tight">Orbital Motion</h1>
                        <p className="text-xs text-white/50">Gravitation Unit</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    {/* Stats Overlay */}
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl min-w-[200px]">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Orbital Data</h3>
                        <div className="space-y-2 text-sm font-mono">
                            <div className="flex justify-between">
                                <span className="text-white/60">Distance (r)</span>
                                <span>{Math.sqrt(stateRef.current.x ** 2 + stateRef.current.y ** 2).toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Velocity (v)</span>
                                <span>{Math.sqrt(stateRef.current.vx ** 2 + stateRef.current.vy ** 2).toFixed(2)}</span>
                            </div>
                            <div className="h-px bg-white/10 my-1" />
                            <div className="flex justify-between text-xs">
                                <span className="text-green-400/80">Circular V</span>
                                <span>{vCirc.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-red-400/80">Escape V</span>
                                <span>{vEsc.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Star Mass (M)</label>
                            <span className="text-xs font-mono text-yellow-500">{starMass}</span>
                        </div>
                        <input
                            type="range" min="500" max="2000" step="50" value={starMass}
                            onChange={(e) => setStarMass(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Initial Distance (r)</label>
                            <span className="text-xs font-mono text-blue-400">{initialR}</span>
                        </div>
                        <input
                            type="range" min="50" max="250" value={initialR}
                            onChange={(e) => setInitialR(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Initial Velocity (v)</label>
                            <span className="text-xs font-mono text-green-400">{initialV}</span>
                        </div>
                        <input
                            type="range" min="0" max="8" step="0.1" value={initialV}
                            onChange={(e) => setInitialV(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <div className="flex justify-between mt-1 text-[10px] text-white/30">
                            <span className="cursor-pointer hover:text-white" onClick={() => setInitialV(Number(vCirc.toFixed(1)))}>Set Circular</span>
                            <span className="cursor-pointer hover:text-white" onClick={() => setInitialV(Number(vEsc.toFixed(1)))}>Set Escape</span>
                        </div>
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
                            {isRunning ? 'Pause' : 'Start Orbit'}
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
                            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Show Trail</span>
                            <input
                                type="checkbox"
                                checked={showTrail}
                                onChange={(e) => setShowTrail(e.target.checked)}
                                className="accent-blue-500"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}
