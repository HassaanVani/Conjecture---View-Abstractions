import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    energy: number
    reacted: boolean
}

export default function ReactionKinetics() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [temperature, setTemperature] = useState(300)
    const [concentration, setConcentration] = useState(50)
    const [activationEnergy, setActivationEnergy] = useState(50)
    const [_reactionCount, setReactionCount] = useState(0)

    const particlesRef = useRef<Particle[]>([])

    const initParticles = useCallback(() => {
        const particles: Particle[] = []
        for (let i = 0; i < concentration; i++) {
            particles.push({
                x: Math.random() * 700 + 50,
                y: Math.random() * 400 + 50,
                vx: (Math.random() - 0.5) * (temperature / 100),
                vy: (Math.random() - 0.5) * (temperature / 100),
                energy: Math.random() * 100,
                reacted: false,
            })
        }
        particlesRef.current = particles
        setReactionCount(0)
    }, [concentration, temperature])

    const reset = () => {
        setIsRunning(false)
        initParticles()
    }

    useEffect(() => {
        initParticles()
    }, [initParticles])

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

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            ctx.fillStyle = '#1a120a'
            ctx.fillRect(0, 0, width, height)

            const particles = particlesRef.current
            const tempFactor = temperature / 300

            if (isRunning) {
                // Update particles
                particles.forEach(p => {
                    if (p.reacted) return

                    // Apply temperature-based velocity
                    p.x += p.vx * tempFactor * 2
                    p.y += p.vy * tempFactor * 2

                    // Bounce off walls
                    if (p.x < 10 || p.x > width - 10) p.vx *= -1
                    if (p.y < 10 || p.y > height - 100) p.vy *= -1

                    // Keep in bounds
                    p.x = Math.max(10, Math.min(width - 10, p.x))
                    p.y = Math.max(10, Math.min(height - 100, p.y))

                    // Random energy fluctuation
                    p.energy += (Math.random() - 0.5) * tempFactor * 5
                    p.energy = Math.max(0, Math.min(100, p.energy))
                })

                // Check for collisions and reactions
                for (let i = 0; i < particles.length; i++) {
                    if (particles[i].reacted) continue

                    for (let j = i + 1; j < particles.length; j++) {
                        if (particles[j].reacted) continue

                        const dx = particles[i].x - particles[j].x
                        const dy = particles[i].y - particles[j].y
                        const dist = Math.sqrt(dx * dx + dy * dy)

                        if (dist < 20) {
                            // Collision! Check if enough energy for reaction
                            const totalEnergy = particles[i].energy + particles[j].energy

                            if (totalEnergy > activationEnergy) {
                                // Reaction occurs!
                                particles[i].reacted = true
                                particles[j].reacted = true
                                setReactionCount(prev => prev + 1)
                            } else {
                                // Elastic collision
                                const nx = dx / dist
                                const ny = dy / dist
                                const dvx = particles[i].vx - particles[j].vx
                                const dvy = particles[i].vy - particles[j].vy
                                const dvn = dvx * nx + dvy * ny

                                particles[i].vx -= nx * dvn
                                particles[i].vy -= ny * dvn
                                particles[j].vx += nx * dvn
                                particles[j].vy += ny * dvn
                            }
                        }
                    }
                }
            }

            // Draw particles
            particles.forEach(p => {
                if (p.reacted) {
                    // Reacted particle (product)
                    ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
                    ctx.fill()
                } else {
                    // Unreacted particle - color based on energy
                    const energyRatio = p.energy / 100
                    const hasEnoughEnergy = p.energy > activationEnergy / 2

                    // Glow for high-energy particles
                    if (hasEnoughEnergy) {
                        ctx.fillStyle = `rgba(255, 160, 80, ${energyRatio * 0.3})`
                        ctx.beginPath()
                        ctx.arc(p.x, p.y, 12 + energyRatio * 8, 0, Math.PI * 2)
                        ctx.fill()
                    }

                    ctx.fillStyle = `rgba(255, ${160 - energyRatio * 80}, ${80 - energyRatio * 80}, 0.9)`
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, 6 + energyRatio * 4, 0, Math.PI * 2)
                    ctx.fill()
                }
            })

            // Draw activation energy indicator
            const unreacted = particles.filter(p => !p.reacted).length
            const reacted = particles.filter(p => p.reacted).length

            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.font = '12px sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText(`Reactants: ${unreacted}`, 20, 30)
            ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'
            ctx.fillText(`Products: ${reacted}`, 20, 50)

            // Energy distribution hint
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.fillText(`Ea = ${activationEnergy} (activation energy threshold)`, 20, height - 110)

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [isRunning, temperature, activationEnergy])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 right-4 text-xs text-text-dim max-w-xs text-right"
                >
                    Collision theory: particles must collide with sufficient energy to react
                </motion.div>

                {/* Legend */}
                <div className="absolute bottom-24 right-4 bg-bg-elevated/60 backdrop-blur-sm rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-orange-400" />
                        <span className="text-text-muted">High energy</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-orange-600" />
                        <span className="text-text-muted">Low energy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                        <span className="text-text-muted">Product</span>
                    </div>
                </div>
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
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">T</span>
                            <input
                                type="range"
                                min={100}
                                max={500}
                                value={temperature}
                                onChange={e => setTemperature(+e.target.value)}
                                className="w-20 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono">{temperature}K</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Eₐ</span>
                            <input
                                type="range"
                                min={20}
                                max={100}
                                value={activationEnergy}
                                onChange={e => setActivationEnergy(+e.target.value)}
                                className="w-20 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono">{activationEnergy}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">n</span>
                            <input
                                type="range"
                                min={20}
                                max={100}
                                value={concentration}
                                onChange={e => { setConcentration(+e.target.value); reset() }}
                                className="w-20 accent-text"
                                disabled={isRunning}
                            />
                            <span className="text-text-muted text-xs font-mono">{concentration}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
