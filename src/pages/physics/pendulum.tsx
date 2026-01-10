import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface PendulumState {
    theta: number
    omega: number
}

export default function Pendulum() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mode, setMode] = useState<'simple' | 'double'>('simple')
    const [length, setLength] = useState(200)
    const [gravity, setGravity] = useState(9.8)
    const [damping, setDamping] = useState(0.999)
    const [showTrail, setShowTrail] = useState(true)

    const stateRef = useRef<{
        simple: PendulumState
        double: { p1: PendulumState; p2: PendulumState }
        trail: { x: number; y: number }[]
    }>({
        simple: { theta: Math.PI / 4, omega: 0 },
        double: {
            p1: { theta: Math.PI / 2, omega: 0 },
            p2: { theta: Math.PI / 2, omega: 0 },
        },
        trail: [],
    })

    const reset = () => {
        stateRef.current = {
            simple: { theta: Math.PI / 4, omega: 0 },
            double: {
                p1: { theta: Math.PI / 2, omega: 0 },
                p2: { theta: Math.PI / 2, omega: 0 },
            },
            trail: [],
        }
        setIsRunning(false)
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

        let animId: number
        const dt = 0.05

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight
            const pivotX = width / 2
            const pivotY = height * 0.3

            // Semi-transparent clear for trail effect
            ctx.fillStyle = showTrail ? 'rgba(10, 14, 26, 0.08)' : 'rgba(10, 14, 26, 1)'
            ctx.fillRect(0, 0, width, height)

            if (isRunning) {
                if (mode === 'simple') {
                    // Simple pendulum physics
                    const state = stateRef.current.simple
                    const alpha = (-gravity / length) * Math.sin(state.theta)
                    state.omega += alpha * dt * 50
                    state.omega *= damping
                    state.theta += state.omega * dt

                    stateRef.current.simple = state
                } else {
                    // Double pendulum physics (simplified)
                    const { p1, p2 } = stateRef.current.double
                    const m1 = 1, m2 = 1
                    const l1 = length * 0.5, l2 = length * 0.5
                    const g = gravity

                    // Equations of motion for double pendulum
                    const num1 = -g * (2 * m1 + m2) * Math.sin(p1.theta)
                    const num2 = -m2 * g * Math.sin(p1.theta - 2 * p2.theta)
                    const num3 = -2 * Math.sin(p1.theta - p2.theta) * m2
                    const num4 = p2.omega * p2.omega * l2 + p1.omega * p1.omega * l1 * Math.cos(p1.theta - p2.theta)
                    const den = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * p1.theta - 2 * p2.theta))
                    const alpha1 = (num1 + num2 + num3 * num4) / den

                    const num5 = 2 * Math.sin(p1.theta - p2.theta)
                    const num6 = p1.omega * p1.omega * l1 * (m1 + m2)
                    const num7 = g * (m1 + m2) * Math.cos(p1.theta)
                    const num8 = p2.omega * p2.omega * l2 * m2 * Math.cos(p1.theta - p2.theta)
                    const den2 = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * p1.theta - 2 * p2.theta))
                    const alpha2 = (num5 * (num6 + num7 + num8)) / den2

                    p1.omega += alpha1 * dt
                    p2.omega += alpha2 * dt
                    p1.omega *= damping
                    p2.omega *= damping
                    p1.theta += p1.omega * dt
                    p2.theta += p2.omega * dt

                    stateRef.current.double = { p1, p2 }
                }
            }

            // Draw
            ctx.lineCap = 'round'

            if (mode === 'simple') {
                const state = stateRef.current.simple
                const bobX = pivotX + length * Math.sin(state.theta)
                const bobY = pivotY + length * Math.cos(state.theta)

                // Rod
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(pivotX, pivotY)
                ctx.lineTo(bobX, bobY)
                ctx.stroke()

                // Pivot
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.beginPath()
                ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2)
                ctx.fill()

                // Bob
                ctx.fillStyle = 'rgba(160, 100, 255, 0.9)'
                ctx.beginPath()
                ctx.arc(bobX, bobY, 20, 0, Math.PI * 2)
                ctx.fill()

                // Trail
                if (showTrail && isRunning) {
                    stateRef.current.trail.push({ x: bobX, y: bobY })
                    if (stateRef.current.trail.length > 200) {
                        stateRef.current.trail.shift()
                    }
                }
            } else {
                const { p1, p2 } = stateRef.current.double
                const l1 = length * 0.5, l2 = length * 0.5

                const x1 = pivotX + l1 * Math.sin(p1.theta)
                const y1 = pivotY + l1 * Math.cos(p1.theta)
                const x2 = x1 + l2 * Math.sin(p2.theta)
                const y2 = y1 + l2 * Math.cos(p2.theta)

                // Rods
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(pivotX, pivotY)
                ctx.lineTo(x1, y1)
                ctx.lineTo(x2, y2)
                ctx.stroke()

                // Pivot
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.beginPath()
                ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2)
                ctx.fill()

                // Bob 1
                ctx.fillStyle = 'rgba(160, 100, 255, 0.9)'
                ctx.beginPath()
                ctx.arc(x1, y1, 15, 0, Math.PI * 2)
                ctx.fill()

                // Bob 2
                ctx.fillStyle = 'rgba(255, 100, 160, 0.9)'
                ctx.beginPath()
                ctx.arc(x2, y2, 15, 0, Math.PI * 2)
                ctx.fill()

                // Trail for second bob
                if (showTrail && isRunning) {
                    stateRef.current.trail.push({ x: x2, y: y2 })
                    if (stateRef.current.trail.length > 500) {
                        stateRef.current.trail.shift()
                    }
                }
            }

            // Draw trail
            if (showTrail && stateRef.current.trail.length > 1) {
                ctx.strokeStyle = 'rgba(255, 100, 160, 0.4)'
                ctx.lineWidth = 1
                ctx.beginPath()
                stateRef.current.trail.forEach((p, i) => {
                    if (i === 0) ctx.moveTo(p.x, p.y)
                    else ctx.lineTo(p.x, p.y)
                })
                ctx.stroke()
            }

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [isRunning, mode, length, gravity, damping, showTrail])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex gap-2"
                >
                    <button
                        onClick={() => { setMode('simple'); reset() }}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${mode === 'simple'
                                ? 'bg-white/10 text-white'
                                : 'text-text-muted hover:text-white'
                            }`}
                    >
                        Simple
                    </button>
                    <button
                        onClick={() => { setMode('double'); reset() }}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${mode === 'double'
                                ? 'bg-white/10 text-white'
                                : 'text-text-muted hover:text-white'
                            }`}
                    >
                        Double (Chaotic)
                    </button>
                </motion.div>

                {mode === 'double' && (
                    <div className="absolute top-4 right-4 text-xs text-text-dim max-w-xs text-right">
                        Double pendulum exhibits chaotic behavior — tiny changes lead to vastly different outcomes
                    </div>
                )}
            </div>

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className="btn-primary"
                        >
                            {isRunning ? 'Pause' : 'Start'}
                        </button>
                        <button onClick={reset} className="btn-ghost">
                            Reset
                        </button>
                        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showTrail}
                                onChange={e => setShowTrail(e.target.checked)}
                                className="accent-accent-coral"
                            />
                            Trail
                        </label>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Length</span>
                            <input
                                type="range"
                                min={100}
                                max={300}
                                value={length}
                                onChange={e => setLength(+e.target.value)}
                                className="w-20 accent-text"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Gravity</span>
                            <input
                                type="range"
                                min={1}
                                max={20}
                                step={0.5}
                                value={gravity}
                                onChange={e => setGravity(+e.target.value)}
                                className="w-20 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono">{gravity.toFixed(1)}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Damping</span>
                            <input
                                type="range"
                                min={0.99}
                                max={1}
                                step={0.001}
                                value={damping}
                                onChange={e => setDamping(+e.target.value)}
                                className="w-20 accent-text"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
