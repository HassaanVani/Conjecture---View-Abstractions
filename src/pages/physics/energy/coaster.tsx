import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function EnergyCoaster() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mass, setMass] = useState(60)
    const [gravity, setGravity] = useState(9.8)
    const [friction, setFriction] = useState(0)
    const [trackType, setTrackType] = useState<'parabola' | 'sine' | 'loop'>('parabola')
    const [showGrid, setShowGrid] = useState(false)

    // Physics State
    const stateRef = useRef({
        x: 0,
        y: 0, // Calculated from track
        vx: 0,
        vy: 0, // Calculated from track slope
        energy: { pe: 0, ke: 0, total: 0, thermal: 0 }
    })

    const isDragging = useRef(false)

    // Track Definitions
    const getTrackHeight = (x: number, width: number, height: number, type: string) => {
        // x is in canvas pixels
        // Normalize x to -1 to 1 range relative to center?
        const cx = width / 2
        const nx = (x - cx) / (width / 2.5) // Range approx -1 to 1

        if (type === 'parabola') {
            // y = x^2 parabola
            return height * 0.8 - (nx * nx) * (height * 0.6)
        } else if (type === 'sine') {
            // W shape
            return height * 0.5 - Math.cos(nx * 3) * (height * 0.3)
        }
        return height * 0.8
    }

    // Get slope dy/dx
    const getTrackSlope = (x: number, width: number, height: number, type: string) => {
        const h = 1
        const y1 = getTrackHeight(x - h, width, height, type)
        const y2 = getTrackHeight(x + h, width, height, type)
        return (y2 - y1) / (2 * h)
    }

    const reset = () => {
        setIsRunning(false)
        stateRef.current.vx = 0
        stateRef.current.energy.thermal = 0
        // Position reset happens in animate loop based on defaults or drag
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

        // Initial Position Check
        if (stateRef.current.x === 0) {
            stateRef.current.x = canvas.offsetWidth * 0.2
        }

        let animId: number
        const dt = 0.016

        // Mouse Handling
        const handleMouseDown = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            const clickX = e.clientX - rect.left
            const clickY = e.clientY - rect.top
            // Check if near skater
            const sx = stateRef.current.x
            const sy = getTrackHeight(sx, canvas.offsetWidth, canvas.offsetHeight, trackType)
            const dist = Math.sqrt((clickX - sx) ** 2 + (clickY - (canvas.offsetHeight - sy)) ** 2) // Canvas Y inverted

            if (dist < 30) {
                isDragging.current = true
                setIsRunning(false)
                stateRef.current.vx = 0
                stateRef.current.energy.thermal = 0
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging.current) {
                const rect = canvas.getBoundingClientRect()
                let mx = e.clientX - rect.left
                // Clamp to screen
                if (mx < 0) mx = 0
                if (mx > canvas.width / window.devicePixelRatio) mx = canvas.width / window.devicePixelRatio
                stateRef.current.x = mx
            }
        }

        const handleMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false
                if (!isRunning) setIsRunning(true)
            }
        }

        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            // Physics
            if (isRunning && !isDragging.current) {
                // Slope at current position
                const slope = getTrackSlope(stateRef.current.x, width, height, trackType)
                const angle = Math.atan(slope)

                // Forces
                const gTangent = -gravity * Math.sin(angle)

                // Energy Method (better for conservation):
                // KE_new = KE_old + Work_gravity + Work_friction
                // This forces conservation.

                // Let's use Forces on X for smooth animation.
                // Fx = F_tangent * cos(theta)
                // ax = (g_tangent + frictionAccel) * cos(theta)

                const ax = (gTangent) * Math.cos(angle) // Ignore friction in force calc for now to test energy

                // Friction is non-conservative, handle simply:
                // v *= (1 - friction*0.01)

                stateRef.current.vx += ax * dt * 20
                // Scale factor 20 purely heuristic for pixels/meter scaling

                if (friction > 0) {
                    stateRef.current.vx *= (1 - friction * 0.05)
                    stateRef.current.energy.thermal += (0.5 * mass * stateRef.current.vx ** 2) * (friction * 0.05) // Fake thermal
                }

                stateRef.current.x += stateRef.current.vx * dt

                // Check bounds
                if (stateRef.current.x < 0 || stateRef.current.x > width) {
                    stateRef.current.vx *= -1 // Bounce
                    stateRef.current.x = Math.max(0, Math.min(width, stateRef.current.x))
                }
            }

            // Calculate current Height and Y
            const physY = getTrackHeight(stateRef.current.x, width, height, trackType)
            stateRef.current.y = physY

            // Calculate Energies
            // PE = mgh
            // h = physY / ?? Scale. Let's say 100px = 1m?
            const scale = 50 // pixels per meter
            const h = physY / scale
            const pe = mass * gravity * h

            // KE = 0.5 * m * v^2
            // v is tangential velocity.
            // vx is horizontal. v = vx / cos(theta)
            const slope = getTrackSlope(stateRef.current.x, width, height, trackType)
            const angle = Math.atan(slope)
            const v = stateRef.current.vx / Math.cos(angle)

            const vReal = v / 20 // Arbitrary scaling for nice numbers

            const ke = 0.5 * mass * vReal * vReal

            stateRef.current.energy = {
                pe,
                ke,
                total: pe + ke + stateRef.current.energy.thermal,
                thermal: stateRef.current.energy.thermal
            }


            // Draw
            ctx.clearRect(0, 0, width, height)

            // Draw Grid
            if (showGrid) {
                ctx.strokeStyle = '#ffffff20'
                ctx.lineWidth = 1
                ctx.beginPath()
                for (let i = 0; i < width; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
                for (let i = 0; i < height; i += 50) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
                ctx.stroke()
            }

            // Draw Ground
            ctx.fillStyle = '#1e293b'
            ctx.fillRect(0, height - 20, width, 20)

            // Draw Track
            ctx.beginPath()
            ctx.moveTo(0, height) // Bottom left cornerrish
            // Trace track
            for (let x = 0; x <= width; x += 5) {
                const y = getTrackHeight(x, width, height, trackType)
                ctx.lineTo(x, height - y)
            }
            ctx.lineTo(width, height)
            ctx.lineTo(0, height)
            ctx.fillStyle = '#334155'
            ctx.fill()

            ctx.strokeStyle = '#38bdf8'
            ctx.lineWidth = 5
            ctx.lineCap = 'round'
            ctx.beginPath()
            for (let x = 0; x <= width; x += 5) {
                const y = getTrackHeight(x, width, height, trackType)
                if (x === 0) ctx.moveTo(x, height - y)
                else ctx.lineTo(x, height - y)
            }
            ctx.stroke()

            // Draw Skater
            const sx = stateRef.current.x
            const sy = height - stateRef.current.y

            ctx.save()
            ctx.translate(sx, sy)
            // Rotate skater to match slope
            ctx.rotate(-angle)

            // Skater Body (Simple circle)
            ctx.beginPath()
            ctx.arc(0, -10, 10, 0, Math.PI * 2)
            ctx.fillStyle = '#ec4899' // Pink skater
            ctx.fill()

            // Skateboard
            ctx.fillStyle = '#fff'
            ctx.fillRect(-15, 0, 30, 4)

            // Wheels
            ctx.fillStyle = '#888'
            ctx.beginPath(); ctx.arc(-10, 4, 3, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.arc(10, 4, 3, 0, Math.PI * 2); ctx.fill()

            ctx.restore()

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [isRunning, mass, gravity, friction, trackType, showGrid])

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
                        <h1 className="text-xl font-medium tracking-tight">Energy Skate Park</h1>
                        <p className="text-xs text-white/50">Energy Unit</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

                    {/* Energy Chart Overlay */}
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl min-w-[200px]">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Energy</h3>
                        <div className="flex items-end gap-3 h-32 px-2 pb-2 border-b border-white/10">
                            {/* PE Bar */}
                            <div className="w-8 bg-blue-500/80 rounded-t-md relative group transition-all" style={{ height: `${Math.min(100, (stateRef.current.energy.pe / (stateRef.current.energy.total || 1)) * 100)}%` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 bg-black/80 px-2 py-1 rounded">PE</div>
                            </div>
                            {/* KE Bar */}
                            <div className="w-8 bg-green-500/80 rounded-t-md relative group transition-all" style={{ height: `${Math.min(100, (stateRef.current.energy.ke / (stateRef.current.energy.total || 1)) * 100)}%` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 bg-black/80 px-2 py-1 rounded">KE</div>
                            </div>
                            {/* Thermal Bar */}
                            <div className="w-8 bg-red-500/80 rounded-t-md relative group transition-all" style={{ height: `${Math.min(100, (stateRef.current.energy.thermal / (stateRef.current.energy.total || 1)) * 100)}%` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 bg-black/80 px-2 py-1 rounded">Q</div>
                            </div>
                            {/* Total Bar */}
                            <div className="w-8 bg-yellow-500/80 rounded-t-md relative group transition-all" style={{ height: '100%' }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 bg-black/80 px-2 py-1 rounded">E</div>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 pt-2 text-[10px] text-white/50 font-mono">
                            <span>PE</span>
                            <span>KE</span>
                            <span>Th</span>
                            <span>Tot</span>
                        </div>
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Mass (m)</label>
                            <span className="text-xs font-mono text-purple-400">{mass} kg</span>
                        </div>
                        <input
                            type="range" min="20" max="100" value={mass}
                            onChange={(e) => setMass(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Friction</label>
                            <span className="text-xs font-mono text-red-400">{friction.toFixed(2)}</span>
                        </div>
                        <input
                            type="range" min="0" max="1" step="0.05" value={friction}
                            onChange={(e) => setFriction(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Gravity</label>
                            <span className="text-xs font-mono text-blue-400">{gravity} m/s²</span>
                        </div>
                        <input
                            type="range" min="1" max="25" step="0.1" value={gravity}
                            onChange={(e) => setGravity(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Track Shape</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setTrackType('parabola')}
                                className={`px-4 py-2 rounded-lg text-xs border ${trackType === 'parabola' ? 'bg-blue-500/20 border-blue-500' : 'border-white/10 hover:bg-white/5'}`}
                            >
                                U-Pipe
                            </button>
                            <button
                                onClick={() => setTrackType('sine')}
                                className={`px-4 py-2 rounded-lg text-xs border ${trackType === 'sine' ? 'bg-blue-500/20 border-blue-500' : 'border-white/10 hover:bg-white/5'}`}
                            >
                                W-Track
                            </button>
                        </div>
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
                            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Show Grid</span>
                            <input
                                type="checkbox"
                                checked={showGrid}
                                onChange={(e) => setShowGrid(e.target.checked)}
                                className="accent-blue-500"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}
