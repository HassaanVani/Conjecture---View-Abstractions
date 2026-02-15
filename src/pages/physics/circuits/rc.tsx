import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function RCCircuit() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isCharging, setIsCharging] = useState(false)
    const [resistance, setResistance] = useState(100) // Ohms
    const [capacitance, setCapacitance] = useState(100) // microFarads
    const [sourceVoltage, setSourceVoltage] = useState(10) // Volts

    // Simulation state
    const timeRef = useRef(0)
    const stateRef = useRef({ q: 0, v_c: 0, i: 0 }) // Charge, Voltage across C, Current

    // RC Time Constant
    const tau = (resistance * capacitance) / 1000 // scale? 100 * 100 uF = 10000 uS = 10ms.
    // Let's adjust scales for visibility.
    // R: 10-1000 Ohms
    // C: 10-1000 uF
    // Time scale: seconds for viz.

    const reset = () => {
        timeRef.current = 0
        stateRef.current = { q: 0, v_c: 0, i: 0 }
        setIsCharging(false)
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

        // Data history for graph
        const history: { t: number, v: number, i: number }[] = []
        let lastTime = performance.now()

        const animate = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTime) / 1000, 0.05) // seconds
            lastTime = now

            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            // Physics Update
            // V_s = I*R + Q/C
            // I = dQ/dt
            // Charging: V_c(t) = V_s(1 - e^(-t/RC))
            // Discharging: V_c(t) = V_0 * e^(-t/RC)
            // Ideally simulate step-wise

            const R = resistance
            const C = capacitance / 10000 // Arb scale factor to make it slower
            const Vs = isCharging ? sourceVoltage : 0

            // Numerical integration for smooth transitions
            // I = (Vs - V_c) / R
            // dQ = I * dt
            // V_c = Q / C

            const currentV_c = stateRef.current.v_c
            const I = (Vs - currentV_c) / R

            // Check direction
            // If discharging and V_c ~ 0, stop?
            // Exponential never reaches 0, but effectively.

            stateRef.current.q += I * dt
            stateRef.current.v_c = stateRef.current.q / C
            stateRef.current.i = I

            timeRef.current += dt

            // Record history (keep last 5-10s)
            history.push({
                t: timeRef.current,
                v: stateRef.current.v_c,
                i: stateRef.current.i
            })
            if (history.length > 300) history.shift() // Prune

            // Drawing
            ctx.clearRect(0, 0, width, height)

            const cx = width / 2
            const cy = height / 3

            // Draw Circuit Diagram (Schematic)
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 3
            ctx.lineJoin = 'round'

            const circW = 300
            const circH = 150
            const left = cx - circW / 2
            const right = cx + circW / 2
            const top = cy - circH / 2
            const bottom = cy + circH / 2

            ctx.beginPath()
            // Top (Switch + Resistor)
            ctx.moveTo(left, top)
            // Resistor jagged line
            // ... simplified block for now
            ctx.lineTo(cx - 50, top) // To R
            // Resistor Icon
            ctx.lineTo(cx - 40, top - 10)
            ctx.lineTo(cx - 30, top + 10)
            ctx.lineTo(cx - 20, top - 10)
            ctx.lineTo(cx - 10, top + 10)
            ctx.lineTo(cx, top)      // End R

            ctx.lineTo(right, top)

            // Right (Wire)
            ctx.lineTo(right, bottom)

            // Bottom (Capacitor)
            ctx.lineTo(cx + 20, bottom)
            // Capacitor Plates
            ctx.moveTo(cx + 20, bottom - 15)
            ctx.lineTo(cx + 20, bottom + 15)
            ctx.moveTo(cx - 20, bottom - 15)
            ctx.lineTo(cx - 20, bottom + 15)

            ctx.moveTo(cx - 20, bottom)
            ctx.lineTo(left, bottom)

            // Left (Source / Battery)
            ctx.lineTo(left, cy + 20)
            // Battery symbol
            ctx.moveTo(left - 15, cy + 20); ctx.lineTo(left + 15, cy + 20) // Long
            ctx.moveTo(left - 8, cy + 40); ctx.lineTo(left + 8, cy + 40)   // Short
            ctx.moveTo(left, cy + 40)
            ctx.lineTo(left, top)

            // Switch Visual
            // Ideally switch determines connection to Source (Charging) or disconnect/short (Discharging)
            // Schematic correction: Typically "Charging" connects Vs. "Discharging" connects R to C directly (bypass source).
            // Let's visualize a switch flipping.
            // Switch at Top Left.
            // if charging: Closed to source.
            // if discharging: Connected to loop without source?
            // Simplified: Draw battery active or not?
            // "Discharging" usually means C acts as source through R.
            // Standard RC circuit: Battery -> Switch -> R -> C (-).
            // If Switch open, nothing happens (hold charge).
            // If switch connects C to ground (short), it discharges.

            // Let's visualize switch state:
            // Point A (Source), Point B (Circuit), Point C (Ground/Short)

            ctx.stroke()

            ctx.fillStyle = 'white'
            ctx.font = '14px monospace'
            ctx.fillText(`R = ${resistance}Ω`, cx - 25, top - 20)
            ctx.fillText(`C = ${capacitance}μF`, cx, bottom + 35)
            ctx.textAlign = 'left'
            ctx.fillText(`${isCharging ? 'Charging' : 'Discharging'}`, left + 20, top + 20)

            // Draw Electrons / Current Flow
            if (Math.abs(I) > 0.001) {
                // const speed = I * 50
                // Simplified: Show arrow
                ctx.fillStyle = isCharging ? '#4ade80' : '#ef4444' // Green charge, Red discharge
                ctx.textAlign = 'right'
                ctx.fillText(`I = ${(I * 1000).toFixed(1)} mA`, right + 10, cy)
            }

            // Draw Tau Info
            ctx.fillStyle = 'white'
            ctx.textAlign = 'left'
            ctx.fillText(`τ (RC) = ${tau.toFixed(1)} s`, left, bottom + 60)

            // Draw Graph (V_c vs Time)
            const graphH = 150
            const graphW = width - 100
            const gx = 50
            const gy = height - 50

            // Axes
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(gx, gy)
            ctx.lineTo(gx, gy - graphH)
            ctx.moveTo(gx, gy)
            ctx.lineTo(gx + graphW, gy)
            ctx.stroke()

            // Plot
            if (history.length > 1) {
                const tMax = history[history.length - 1].t
                const tMin = Math.max(0, tMax - 10) // Show last 10s window? Or scroll?
                // Let's scroll.

                ctx.beginPath()
                ctx.strokeStyle = '#60a5fa' // Blue voltage
                ctx.lineWidth = 2

                history.forEach((pt, i) => {
                    const x = gx + ((pt.t - tMin) / 10) * graphW // Scale t to window
                    const y = gy - (pt.v / 12) * graphH // Scale V (max 12V? 10V src)

                    if (x < gx) return // Out of window

                    if (i === 0 || history[i - 1].t < tMin) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                })
                ctx.stroke()

                // Current
                ctx.beginPath()
                ctx.strokeStyle = '#facc15' // Yellow current
                history.forEach((pt, i) => {
                    const x = gx + ((pt.t - tMin) / 10) * graphW
                    const y = gy - (pt.i * resistance / 12) * graphH // Scale I*R ~ V

                    if (x < gx) return
                    if (i === 0 || history[i - 1].t < tMin) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                })
                ctx.stroke()
            }

            // Legend
            ctx.fillStyle = '#60a5fa'; ctx.fillText('Voltage (Vc)', gx + 20, gy - graphH + 20)
            ctx.fillStyle = '#facc15'; ctx.fillText('Current (I)', gx + 120, gy - graphH + 20)

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [resistance, capacitance, sourceVoltage, isCharging])


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
                        <h1 className="text-xl font-medium tracking-tight">RC Circuits</h1>
                        <p className="text-xs text-white/50">AP Physics 2: Circuits</p>
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
                        Visualize limits of exponential growth/decay.
                        <br />
                        τ = RC (Time Constant).
                        <br />
                        Charging: V increases. Discharging: V decreases.
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setIsCharging(true)}
                            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${isCharging
                                ? 'bg-green-500 text-white'
                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                                }`}
                        >
                            Charge
                        </button>
                        <button
                            onClick={() => setIsCharging(false)}
                            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${!isCharging
                                ? 'bg-red-500 text-white'
                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                                }`}
                        >
                            Discharge
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Resistance (R)</label>
                                <span className="text-xs font-mono text-white/60">{resistance} Ω</span>
                            </div>
                            <input
                                type="range" min="10" max="1000" step="10" value={resistance}
                                onChange={(e) => setResistance(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Capacitance (C)</label>
                                <span className="text-xs font-mono text-white/60">{capacitance} μF</span>
                            </div>
                            <input
                                type="range" min="10" max="500" step="10" value={capacitance}
                                onChange={(e) => setCapacitance(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Source Voltage</label>
                                <span className="text-xs font-mono text-white/60">{sourceVoltage} V</span>
                            </div>
                            <input
                                type="range" min="1" max="20" step="1" value={sourceVoltage}
                                onChange={(e) => setSourceVoltage(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>
                    </div>

                    <button
                        onClick={reset}
                        className="w-full py-3 mt-4 rounded-xl font-medium text-sm bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                    >
                        Reset Capacitor (Short)
                    </button>
                </div>
            </div>
        </div>
    )
}
