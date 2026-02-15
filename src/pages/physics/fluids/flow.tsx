import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

interface Particle {
    x: number
    y: number // relative to center line
    speed: number
    id: number
}

export default function FluidFlow() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [constriction, setConstriction] = useState(0.5) // 0.2 to 0.8 (ratio of narrow height to wide height)
    const [flowRate, setFlowRate] = useState(5) // Base flow speed
    const [showParticles, setShowParticles] = useState(true)

    const particlesRef = useRef<Particle[]>([])
    const particleIdCounter = useRef(0)

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

        // Pipe Geometry
        // Wide section -> Transition -> Narrow -> Transition -> Wide
        // Sections: 0-20% Wide, 20-30% Trans, 30-70% Narrow, 70-80% Trans, 80-100% Wide

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight
            // const cx = width / 2 // Unused
            const cy = height / 2

            const pipeH = 150 // Max half-height

            // Function to get pipe half-height at x
            const getR = (x: number) => {
                const w = width
                // Normalize x
                const nx = x / w

                if (nx < 0.2) return pipeH
                if (nx < 0.3) {
                    // Smooth transition? Linear for now.
                    const t = (nx - 0.2) / 0.1
                    return pipeH * (1 - t) + (pipeH * constriction) * t
                }
                if (nx < 0.7) return pipeH * constriction
                if (nx < 0.8) {
                    const t = (nx - 0.7) / 0.1
                    return (pipeH * constriction) * (1 - t) + pipeH * t
                }
                return pipeH
            }

            // Spawn particles
            if (showParticles && particlesRef.current.length < 200) {
                // Spawn at left
                particleIdCounter.current++
                particlesRef.current.push({
                    x: 0,
                    y: (Math.random() - 0.5) * 2 * pipeH * 0.9, // Keep inside
                    speed: 0,
                    id: particleIdCounter.current
                })
            }

            // Update particles
            // Continuity: A1V1 = A2V2 => V(x) propto 1/A(x) propto 1/R(x) (2D flow)
            // Or 1/R(x)^2 for 3D pipe? Let's do 2D flow assumption (v ~ 1/Height).

            particlesRef.current.forEach(p => {
                const R = getR(p.x)
                // If particle is outside new R, push it in?
                // Just clamp y relative to R ratio?
                // Ideally streamlines follow geometry.
                // Simple approx: y_new = y_old * (R_new / R_old)

                // Let's just animate x for now and clamp y. 
                // Better: keep 'relative' y (-1 to 1) and project.
                // But we store absolute y.

                // Calculate local velocity
                const vx = flowRate * (pipeH / R)

                // Move
                const oldR = getR(p.x)
                p.x += vx
                const newR = getR(p.x)

                // Streamline adjustment (compress/expand y)
                if (oldR > 0) p.y = p.y * (newR / oldR)
            })

            // Remove off-screen
            particlesRef.current = particlesRef.current.filter(p => p.x < width)


            // Draw
            ctx.clearRect(0, 0, width, height)

            // Draw Pipe
            ctx.fillStyle = '#1e293b'
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(width, 0)
            ctx.lineTo(width, height)
            ctx.lineTo(0, height)
            ctx.fill()

            // Clear Pipe Interior
            ctx.globalCompositeOperation = 'destination-out'
            ctx.beginPath()
            ctx.moveTo(0, cy - getR(0))
            for (let x = 0; x <= width; x += 10) {
                ctx.lineTo(x, cy - getR(x))
            }
            ctx.lineTo(width, cy + getR(width))
            for (let x = width; x >= 0; x -= 10) {
                ctx.lineTo(x, cy + getR(x))
            }
            ctx.closePath()
            ctx.fill()

            ctx.globalCompositeOperation = 'source-over'

            // Draw Pipe Walls
            ctx.strokeStyle = '#94a3b8'
            ctx.lineWidth = 3
            ctx.beginPath()
            // Top wall
            ctx.moveTo(0, cy - getR(0))
            for (let x = 0; x <= width; x += 5) ctx.lineTo(x, cy - getR(x))
            ctx.stroke()

            // Bottom wall
            ctx.beginPath()
            ctx.moveTo(0, cy + getR(0))
            for (let x = 0; x <= width; x += 5) ctx.lineTo(x, cy + getR(x))
            ctx.stroke()

            // Draw Particles
            if (showParticles) {
                ctx.fillStyle = '#60a5fa'
                particlesRef.current.forEach(p => {
                    ctx.beginPath()
                    ctx.arc(p.x, cy + p.y, 2, 0, Math.PI * 2)
                    ctx.fill()
                })
            }

            // Bernoulli Gauges (Pressure & Speed)
            // Section 1 (Wide): x = width * 0.1
            // Section 2 (Narrow): x = width * 0.5

            const drawGauge = (x: number, label: string) => {
                const R = getR(x)
                const v = flowRate * (pipeH / R)
                // Bernoulli: P + 0.5 rho v^2 = const
                // Let base P be large.
                // P = P0 - k * v^2
                const maxV = flowRate * (pipeH / (pipeH * 0.2)) // max constriction
                const P = 100 - (v / maxV) * 80

                const gy = cy - pipeH - 50

                // Stem
                ctx.strokeStyle = '#cbd5e1'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(x, cy - R)
                ctx.lineTo(x, gy + 40)
                ctx.stroke()

                // Gauge Body
                ctx.fillStyle = '#ffff'
                ctx.beginPath()
                ctx.arc(x, gy, 30, 0, Math.PI * 2)
                ctx.fill()
                ctx.stroke()

                // Needle
                const angle = Math.PI - (P / 100) * Math.PI
                ctx.strokeStyle = '#ef4444'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(x, gy)
                ctx.lineTo(x + Math.cos(angle) * 25, gy - Math.sin(angle) * 25)
                ctx.stroke()

                // Label
                ctx.fillStyle = 'white'
                ctx.font = '12px monospace'
                ctx.textAlign = 'center'
                ctx.fillText(label, x, gy - 40)

                // Value text
                ctx.fillStyle = '#94a3b8'
                ctx.fillText(`P ≈ ${P.toFixed(0)}`, x, gy + 55)
                ctx.fillStyle = '#60a5fa'
                ctx.fillText(`v ≈ ${v.toFixed(1)}`, x, gy + 70)
            }

            if (width > 0) {
                drawGauge(width * 0.1, "Wide Section")
                drawGauge(width * 0.5, "Narrow Section")
                drawGauge(width * 0.9, "Wide Section")
            }

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => {
            canvas.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [constriction, flowRate, showParticles])


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
                        <h1 className="text-xl font-medium tracking-tight">Fluid Dynamics</h1>
                        <p className="text-xs text-white/50">AP Physics 2: Fluids</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex flex-col">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                </div>

                {/* Bottom Controls */}
                <div className="h-40 bg-[#0d0a1a]/90 border-t border-white/10 p-6 flex flex-row items-center justify-center gap-12 z-20">
                    <div className="flex flex-col w-64">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Pipe Constriction</label>
                            <span className="text-xs font-mono text-purple-400">{(constriction * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range" min="0.2" max="1.0" step="0.01" value={constriction}
                            onChange={(e) => setConstriction(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between text-[10px] text-white/30 mt-1">
                            <span>Narrrow</span>
                            <span>Straight</span>
                        </div>
                    </div>

                    <div className="flex flex-col w-64">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Flow Rate</label>
                            <span className="text-xs font-mono text-blue-400">{flowRate.toFixed(1)}</span>
                        </div>
                        <input
                            type="range" min="1" max="15" step="0.5" value={flowRate}
                            onChange={(e) => setFlowRate(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showParticles}
                                onChange={(e) => setShowParticles(e.target.checked)}
                                className="accent-blue-500"
                            />
                            <span className="text-sm">Show Streamlines</span>
                        </label>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg text-xs leading-relaxed max-w-sm">
                        <strong className="text-white">Continuity:</strong> A₁v₁ = A₂v₂ <br />
                        <strong className="text-white">Bernoulli:</strong> P + ½ρv² = const <br />
                        <span className="text-white/50">Higher velocity in the narrow section creates lower pressure.</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
