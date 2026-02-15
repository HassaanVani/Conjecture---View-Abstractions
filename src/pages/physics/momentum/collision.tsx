import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

interface Ball {
    x: number
    y: number
    vx: number
    vy: number
    mass: number
    radius: number
    color: string
}

export default function Collision() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [elasticity, setElasticity] = useState(1.0) // 1 = elastic, 0 = perfectly inelastic
    const [mass1, setMass1] = useState(5)
    const [mass2, setMass2] = useState(5)
    const [showVectors, setShowVectors] = useState(true)

    const stateRef = useRef<{ balls: Ball[] }>({
        balls: [
            { x: 100, y: 300, vx: 5, vy: 0, mass: 5, radius: 30, color: '#3b82f6' }, // Blue
            { x: 500, y: 300, vx: -3, vy: 0, mass: 5, radius: 30, color: '#ec4899' } // Pink
        ]
    })

    // Update masses when sliders change (if not running to avoid physics weirdness mid-sim)
    useEffect(() => {
        if (!isRunning) {
            stateRef.current.balls[0].mass = mass1
            stateRef.current.balls[0].radius = 20 + Math.sqrt(mass1) * 5

            stateRef.current.balls[1].mass = mass2
            stateRef.current.balls[1].radius = 20 + Math.sqrt(mass2) * 5
        }
    }, [mass1, mass2, isRunning])

    const reset = () => {
        setIsRunning(false)
        const canvas = canvasRef.current
        const w = canvas ? canvas.offsetWidth : 800
        const h = canvas ? canvas.offsetHeight : 600

        stateRef.current.balls = [
            { x: w * 0.2, y: h / 2, vx: 5, vy: 0, mass: mass1, radius: 20 + Math.sqrt(mass1) * 5, color: '#3b82f6' },
            { x: w * 0.8, y: h / 2, vx: -3, vy: 0, mass: mass2, radius: 20 + Math.sqrt(mass2) * 5, color: '#ec4899' }
        ]
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

        // Initial pos fix
        if (stateRef.current.balls[0].x === 100) reset()

        let animId: number
        const dt = 0.5

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            if (isRunning) {
                const balls = stateRef.current.balls

                // Movement
                balls.forEach(b => {
                    b.x += b.vx * dt
                    b.y += b.vy * dt

                    // Wall bounce
                    if (b.x - b.radius < 0) { b.x = b.radius; b.vx *= -1 }
                    if (b.x + b.radius > width) { b.x = width - b.radius; b.vx *= -1 }
                    if (b.y - b.radius < 0) { b.y = b.radius; b.vy *= -1 }
                    if (b.y + b.radius > height) { b.y = height - b.radius; b.vy *= -1 }
                })

                // Collision Detection
                const b1 = balls[0]
                const b2 = balls[1]
                const dx = b2.x - b1.x
                const dy = b2.y - b1.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < b1.radius + b2.radius) {
                    // Collision
                    // Normal vector check to avoid sticking
                    const nx = dx / dist
                    const ny = dy / dist

                    // Relative velocity
                    const dvx = b1.vx - b2.vx
                    const dvy = b1.vy - b2.vy

                    // Vel along normal
                    const vn = dvx * nx + dvy * ny

                    // Only resolve if moving towards each other
                    if (vn > 0) {
                        // Impulse
                        // j = -(1+e) * vn / (1/m1 + 1/m2)
                        const impulse = -(1 + elasticity) * vn / (1 / b1.mass + 1 / b2.mass)

                        // Apply impulse
                        const ix = impulse * nx
                        const iy = impulse * ny

                        b1.vx += ix / b1.mass
                        b1.vy += iy / b1.mass
                        b2.vx -= ix / b2.mass
                        b2.vy -= iy / b2.mass
                    }
                }
            }

            // Draw
            ctx.clearRect(0, 0, width, height)

            // Draw Balls
            stateRef.current.balls.forEach(b => {
                ctx.fillStyle = b.color
                ctx.beginPath()
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
                ctx.fill()

                // Mass text
                ctx.fillStyle = 'white'
                ctx.font = '12px monospace'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(`${b.mass}kg`, b.x, b.y)

                // Vectors
                if (showVectors) {
                    const vScale = 10
                    drawArrow(ctx, b.x, b.y, b.x + b.vx * vScale, b.y + b.vy * vScale, '#ffffff80')
                }
            })

            animId = requestAnimationFrame(animate)
        }

        const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
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
        }

        animId = requestAnimationFrame(animate)
        return () => {
            canvas.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [isRunning, mass1, mass2, elasticity, showVectors])

    // Calculate System Momentum
    const b1 = stateRef.current.balls[0]
    const b2 = stateRef.current.balls[1]
    const pTotal = Math.sqrt((b1.mass * b1.vx + b2.mass * b2.vx) ** 2 + (b1.mass * b1.vy + b2.mass * b2.vy) ** 2)
    const keTotal = 0.5 * b1.mass * (b1.vx ** 2 + b1.vy ** 2) + 0.5 * b2.mass * (b2.vx ** 2 + b2.vy ** 2)

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
                        <h1 className="text-xl font-medium tracking-tight">Collision Lab</h1>
                        <p className="text-xs text-white/50">Momentum Unit</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    {/* Stats Overlay */}
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl min-w-[200px]">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">System Data</h3>
                        <div className="space-y-2 text-sm font-mono">
                            <div className="flex justify-between">
                                <span className="text-white/60">Total Momentum (P)</span>
                                <span>{pTotal.toFixed(1)} kg·m/s</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Total Energy (K)</span>
                                <span>{keTotal.toFixed(1)} J</span>
                            </div>
                            <div className="h-px bg-white/10 my-2" />
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <span className="text-blue-400">Blue v: {b1.vx.toFixed(1)}</span>
                                <span className="text-pink-400">Pink v: {b2.vx.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Elasticity (e)</h3>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">{elasticity === 1 ? 'Elastic' : elasticity === 0 ? 'Inelastic' : 'Partially Elastic'}</label>
                                <span className="text-xs font-mono text-yellow-500">{elasticity.toFixed(2)}</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.05" value={elasticity}
                                onChange={(e) => setElasticity(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-blue-400">Blue Mass</label>
                            <span className="text-xs font-mono text-white/60">{mass1} kg</span>
                        </div>
                        <input
                            type="range" min="1" max="20" value={mass1}
                            onChange={(e) => setMass1(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-pink-400">Pink Mass</label>
                            <span className="text-xs font-mono text-white/60">{mass2} kg</span>
                        </div>
                        <input
                            type="range" min="1" max="20" value={mass2}
                            onChange={(e) => setMass2(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${isRunning
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-green-500 text-white hover:bg-green-400'
                                }`}
                        >
                            {isRunning ? 'Pause' : 'Start'}
                        </button>
                        <button
                            onClick={reset}
                            className="px-4 py-3 rounded-xl font-medium text-sm bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Show Momentum Vectors</span>
                            <input
                                type="checkbox"
                                checked={showVectors}
                                onChange={(e) => setShowVectors(e.target.checked)}
                                className="accent-blue-500"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}
