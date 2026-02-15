import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function SpringMass() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mass, setMass] = useState(2)
    const [k, setK] = useState(50) // Spring constant
    const [damping, setDamping] = useState(0.5)
    const [gravity, setGravity] = useState(9.8)
    const [showEnergy, setShowEnergy] = useState(true)

    const stateRef = useRef({
        y: 0, // Displacement from equilibrium (positive down)
        vy: 0,
        t: 0,
        history: [] as { t: number, y: number }[]
    })

    // Equilibrium position (where mg = k*extension_static)
    // We can define y=0 as the *unstretched* spring position?
    // Or y=0 as the *static equilibrium* position?
    // Let's define y=0 as the UNSTRETCHED spring end.
    // Static equilibrium will be at y_eq = mg/k.

    // Initial condition: Start pulled down a bit.

    const reset = () => {
        setIsRunning(false)
        stateRef.current = {
            y: 100, // Start stretched 100px (or units)
            vy: 0,
            t: 0,
            history: []
        }
    }

    useEffect(() => {
        // Reset when parameters change significantly? No, let physics adjust.
        // But if mass changes, equilibrium changes.
    }, [mass, k, gravity])

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
        const dt = 0.016

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            if (isRunning) {
                // Forces
                // F_spring = -k * y
                // F_damping = -c * vy
                // F_net = mg - ky - c*vy

                // Note: y is displacement from UNSTRETCHED length.
                // Positive y is DOWN (extension).
                // Gravity acts DOWN (+mg).
                // Spring force acts UP (-ky).

                // *10 to scale to pixels somewhat? 
                // Let's say 1 unit = 1 pixel for now, but g=9.8 is small for pixels.
                // Let's multiply g by a scale factor. 
                const scale = 20 // pixels per meter
                const g_pix = gravity * scale

                const F_net = (mass * g_pix) - (k * stateRef.current.y) - (damping * stateRef.current.vy)
                const acc = F_net / mass

                stateRef.current.vy += acc * dt
                stateRef.current.y += stateRef.current.vy * dt
                stateRef.current.t += dt

                // History for graph
                if (stateRef.current.t % 0.05 < dt * 1.5) {
                    stateRef.current.history.push({ t: stateRef.current.t, y: stateRef.current.y })
                    if (stateRef.current.history.length > 200) stateRef.current.history.shift()
                }
            }

            // Draw
            ctx.clearRect(0, 0, width, height)

            const cx = width / 3
            const mountY = 50

            // Draw Support
            ctx.fillStyle = '#94a3b8'
            ctx.fillRect(cx - 50, mountY - 10, 100, 10)

            // Draw Spring
            // Zigzag from mountY to mountY + unstretched_length + y
            const unstretchedLen = 150
            const currentLen = unstretchedLen + stateRef.current.y

            ctx.beginPath()
            ctx.moveTo(cx, mountY)
            const coils = 12
            const coilH = currentLen / coils
            for (let i = 0; i < coils; i += 1) {
                const xOffset = i % 2 === 0 ? 15 : -15
                // Smooth spring or zig zag? Zig zag is easier
                ctx.lineTo(cx + xOffset, mountY + (i + 0.5) * coilH)
                ctx.lineTo(cx - xOffset, mountY + (i + 1) * coilH)
            }
            ctx.lineTo(cx, mountY + currentLen)
            ctx.strokeStyle = '#cbd5e1'
            ctx.lineWidth = 2
            ctx.stroke() // Just stroke, don't close

            // Draw Mass
            const boxSize = 40 + Math.sqrt(mass) * 5
            ctx.fillStyle = '#3b82f6'
            ctx.fillRect(cx - boxSize / 2, mountY + currentLen, boxSize, boxSize)

            ctx.fillStyle = 'white'
            ctx.font = '12px monospace'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(`${mass}kg`, cx, mountY + currentLen + boxSize / 2)

            // Draw Equilibrium Line (Static)
            const scale = 20
            const g_pix = gravity * scale
            const y_eq = (mass * g_pix) / k
            const eqY = mountY + unstretchedLen + y_eq

            ctx.beginPath()
            ctx.setLineDash([5, 5])
            ctx.moveTo(cx - 100, eqY)
            ctx.lineTo(cx + 100, eqY)
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'
            ctx.lineWidth = 1
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.fillText('Equilibrium', cx + 120, eqY)

            // Draw Graph (Right side)
            const gx = width * 0.6
            const gw = width * 0.35
            const gh = height * 0.3
            const gy = height * 0.35

            // Graph Axis
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(gx, gy)
            ctx.lineTo(gx, gy + gh)
            ctx.lineTo(gx + gw, gy + gh / 2) // t axis in middle
            ctx.stroke()

            // Plot y vs t
            ctx.beginPath()
            ctx.strokeStyle = '#38bdf8'
            ctx.lineWidth = 2

            // Scale factors for graph
            const timeWindow = 10 // seconds view
            const yScale = 0.5 // pixels per displacement unit

            if (stateRef.current.history.length > 1) {
                const lastPt = stateRef.current.history[stateRef.current.history.length - 1]
                const endTime = lastPt.t

                stateRef.current.history.forEach((pt, i) => {
                    // Map t to x (scrolling)
                    // If t < timeWindow, start at gx.
                    // If t > timeWindow, shift.
                    // Let's just fit last 10 seconds?

                    const timeSinceEnd = endTime - pt.t
                    if (timeSinceEnd > timeWindow) return

                    const drawX = gx + gw - (timeSinceEnd / timeWindow) * gw
                    // y=eq corresponds to center line (gy + gh/2)
                    // val = pt.y - y_eq
                    const val = pt.y - y_eq
                    const drawY = (gy + gh / 2) + val * yScale

                    if (i === 0 || drawX < gx) ctx.moveTo(Math.max(gx, drawX), drawY)
                    else ctx.lineTo(Math.max(gx, drawX), drawY)
                })
                ctx.stroke()
            }

            ctx.fillStyle = '#38bdf8'
            ctx.fillText('Displacement vs Time', gx + gw / 2, gy - 20)


            // Energy Bars?
            if (showEnergy) {
                // PE_spring = 0.5 * k * y^2
                // PE_grav = m * g * (H - y)? (Relative to arbitrary zero)
                // KE = 0.5 * m * v^2

                // Let's use equilibrium as y=0 for PE_total?
                // Or stick to absolute definitions.

                // PE_spring
                const pes = 0.5 * k * (stateRef.current.y * stateRef.current.y) / 1000 // Scale down

                // KE
                const ke = 0.5 * mass * (stateRef.current.vy * stateRef.current.vy) / 1000

                // Drawing bars
                const barX = gx
                const barY = gy + gh + 50
                const barW = 30
                const maxH = 100

                // PES
                ctx.fillStyle = '#3b82f6'
                const h1 = Math.min(maxH, pes)
                ctx.fillRect(barX, barY + maxH - h1, barW, h1)
                ctx.fillText('PEs', barX + barW / 2, barY + maxH + 15)

                // KE
                ctx.fillStyle = '#22c55e'
                const h2 = Math.min(maxH, ke)
                ctx.fillRect(barX + 50, barY + maxH - h2, barW, h2)
                ctx.fillText('KE', barX + 50 + barW / 2, barY + maxH + 15)

                // Total
                ctx.fillStyle = '#eab308'

                // Wait, SHM E = K + U_spring_effective from equilibrium.
                // U_eff = 0.5 * k * (y - y_eq)^2.
                // Let's visualize THAT energy, which is conserved (plus damping loss).

                const distFromEq = stateRef.current.y - y_eq
                const pe_eff = 0.5 * k * (distFromEq * distFromEq) / 1000
                const total_eff = pe_eff + ke

                // Clear prev bars and draw Effective Energy
                const h4 = Math.min(maxH, pe_eff)
                const h5 = Math.min(maxH, total_eff)

                // Redraw correct physics bars
                // 1. Kinetic
                ctx.fillStyle = '#22c55e'
                ctx.fillRect(barX + 50, barY + maxH - h2, barW, h2)

                // 2. Potential (Effective around Eq)
                ctx.fillStyle = '#3b82f6'
                ctx.fillRect(barX, barY + maxH - h4, barW, h4)

                // 3. Total (Effective)
                ctx.fillStyle = '#eab308'
                ctx.fillRect(barX + 100, barY + maxH - h5, barW, h5)
                ctx.fillText('Tot', barX + 100 + barW / 2, barY + maxH + 15)
            }

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [isRunning, mass, k, damping, gravity, showEnergy])

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
                        <h1 className="text-xl font-medium tracking-tight">Spring Oscillator</h1>
                        <p className="text-xs text-white/50">Simple Harmonic Motion</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Mass (m)</label>
                            <span className="text-xs font-mono text-purple-400">{mass} kg</span>
                        </div>
                        <input
                            type="range" min="1" max="10" step="0.5" value={mass}
                            onChange={(e) => setMass(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Spring Constant (k)</label>
                            <span className="text-xs font-mono text-blue-400">{k} N/m</span>
                        </div>
                        <input
                            type="range" min="10" max="200" step="5" value={k}
                            onChange={(e) => setK(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Damping (c)</label>
                            <span className="text-xs font-mono text-red-400">{damping}</span>
                        </div>
                        <input
                            type="range" min="0" max="5" step="0.1" value={damping}
                            onChange={(e) => setDamping(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Gravity</label>
                            <span className="text-xs font-mono text-indigo-400">{gravity} m/s²</span>
                        </div>
                        <input
                            type="range" min="0" max="20" step="0.1" value={gravity}
                            onChange={(e) => setGravity(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
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
                            {isRunning ? 'Pause' : 'Start Oscillation'}
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
                            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Show Energy</span>
                            <input
                                type="checkbox"
                                checked={showEnergy}
                                onChange={(e) => setShowEnergy(e.target.checked)}
                                className="accent-blue-500"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}
