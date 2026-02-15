import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    color: string
}

export default function IdealGas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(true)

    // PV = nRT
    const [temperature, setTemperature] = useState(300) // Kelvin
    const [volume, setVolume] = useState(1.0) // 0.5 to 1.5 multiplier
    const [particleCount, setParticleCount] = useState(50) // n

    const particlesRef = useRef<Particle[]>([])

    // Initialize Particles
    useEffect(() => {
        const particles: Particle[] = []
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * 400,
                y: Math.random() * 300,
                vx: (Math.random() - 0.5) * Math.sqrt(temperature) * 20,
                vy: (Math.random() - 0.5) * Math.sqrt(temperature) * 20,
                color: `hsl(${200 + Math.random() * 40}, 70%, 50%)`
            })
        }
        particlesRef.current = particles
    }, [particleCount])

    // Update speeds when temperature changes
    // v_rms proportional to sqrt(T)
    const tempRef = useRef(temperature)
    useEffect(() => {
        const oldT = tempRef.current
        const ratio = Math.sqrt(temperature / oldT)
        particlesRef.current.forEach(p => {
            p.vx *= ratio
            p.vy *= ratio
        })
        tempRef.current = temperature
    }, [temperature])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            // We'll keep logic coords fixed and scale drawing
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        let animId: number
        const dt = 0.01

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            // Container Box Dimensions
            const boxW = 400 * volume
            const boxH = 300
            const cx = width / 2
            const cy = height / 2
            const left = cx - boxW / 2
            const top = cy - boxH / 2

            if (isRunning) {
                // Determine pressure (momentum change per area)
                // P = F/A. F = dp/dt.
                // We could calculate actual collisions with walls or just ideal gas law.
                // Let's sim collisions for visuals.

                particlesRef.current.forEach(p => {
                    p.x += p.vx * dt
                    p.y += p.vy * dt

                    // Box Collisions
                    // We need to map particle internal coords (0-400, 0-300) to centered box?
                    // Correction: initialized 0-400. Let's shift them or map them.
                    // Easier: Simulation space is centered at 0,0 with w,h?
                    // Let's re-map initialization to -boxW/2 to boxW/2

                    // Actually, let's keep simulation space simpler:
                    // x range: [-boxW/2, boxW/2]
                    // y range: [-boxH/2, boxH/2]

                    // Need to re-init particles if switching coordinate systems?
                    // Let's just handle coordinate shift in drawing.
                    // Let's assume particles are in local space [-W_max/2, W_max/2]
                    // And we clamp them to current volume bounds.

                })

                // Fix bounds and bounce
                particlesRef.current.forEach(p => {
                    // Current bounds
                    const maxX = boxW / 2
                    const maxY = boxH / 2

                    // If we just shrank the volume, push particles in
                    if (p.x > maxX) { p.x = maxX; p.vx = -Math.abs(p.vx); }
                    else if (p.x < -maxX) { p.x = -maxX; p.vx = Math.abs(p.vx); }

                    if (p.y > maxY) { p.y = maxY; p.vy = -Math.abs(p.vy); }
                    else if (p.y < -maxY) { p.y = -maxY; p.vy = Math.abs(p.vy); }
                })
            }

            // Draw
            ctx.clearRect(0, 0, width, height)

            // Draw Box
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 2
            ctx.strokeRect(left, top, boxW, boxH)

            // Draw Volume Handles?
            // Maybe just static box for now.

            // Draw Particles
            particlesRef.current.forEach(p => {
                ctx.fillStyle = p.color
                ctx.beginPath()
                // Map local coords to screen
                ctx.arc(cx + p.x, cy + p.y, 4, 0, Math.PI * 2)
                ctx.fill()
            })

            // Draw Piston (Side wall moving)
            // Left is fixed? No, centered.
            // Let's visually mark the walls.

            // Data Display
            // P = nRT / V
            // P = const * N * T / V
            const idealP = (particleCount * temperature) / (volume * 10000) * 8.314 // arb scale

            ctx.fillStyle = 'rgba(255,255,255,0.1)'
            ctx.fillRect(20, 20, 200, 100)
            ctx.fillStyle = 'white'
            ctx.font = '14px monospace'
            ctx.textAlign = 'left'
            ctx.fillText(`Pressure (P): ${idealP.toFixed(2)} atm`, 30, 40)
            ctx.fillText(`Volume (V): ${volume.toFixed(2)} L`, 30, 60)
            ctx.fillText(`Moles (n): ${particleCount}`, 30, 80)
            ctx.fillText(`Temp (T): ${temperature} K`, 30, 100)

            ctx.textAlign = 'right'
            ctx.font = '12px monospace'
            ctx.fillStyle = '#facc15'
            ctx.fillText('PV = nRT', width - 30, 40)

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => {
            canvas.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [isRunning, volume, temperature, particleCount, particlesRef]) // Re-bind on state change? 

    // Adjusting particle init to center logic
    useEffect(() => {
        // Correct initial positions to be centered 0,0
        particlesRef.current.forEach(p => {
            if (p.x > 200) p.x -= 200; // Hacky fix for init?
            // Better to just re-init correctly
        })
        const particles: Particle[] = []
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: (Math.random() - 0.5) * 300 * volume,
                y: (Math.random() - 0.5) * 200,
                vx: (Math.random() - 0.5) * Math.sqrt(temperature) * 20,
                vy: (Math.random() - 0.5) * Math.sqrt(temperature) * 20,
                color: `hsl(${200 + Math.random() * 40}, 70%, 50%)`
            })
        }
        particlesRef.current = particles
    }, [particleCount])


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
                        <h1 className="text-xl font-medium tracking-tight">Ideal Gas Law</h1>
                        <p className="text-xs text-white/50">AP Physics 2: Thermodynamics</p>
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
                        Ideal Gas Law Relationship.
                        <br />
                        Higher Temperature = Faster Particles.
                        <br />
                        Smaller Volume = More Collisions (Pressure).
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${isRunning
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                : 'bg-green-500 text-white hover:bg-green-400'
                                }`}
                        >
                            {isRunning ? 'Freeze' : 'Unfreeze'}
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Temperature (T)</label>
                                <span className="text-xs font-mono text-red-400">{temperature} K</span>
                            </div>
                            <input
                                type="range" min="50" max="600" step="10" value={temperature}
                                onChange={(e) => setTemperature(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Volume (V)</label>
                                <span className="text-xs font-mono text-blue-400">{volume.toFixed(1)}x</span>
                            </div>
                            <input
                                type="range" min="0.5" max="1.5" step="0.1" value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Particles (n)</label>
                                <span className="text-xs font-mono text-green-400">{particleCount}</span>
                            </div>
                            <input
                                type="range" min="10" max="200" step="10" value={particleCount}
                                onChange={(e) => setParticleCount(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
