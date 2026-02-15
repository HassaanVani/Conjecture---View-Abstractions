import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function RLC() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [resistance, setResistance] = useState(10) // Ohms
    const [inductance, setInductance] = useState(0.1) // Henry
    const [capacitance, setCapacitance] = useState(100) // microFarads
    const [frequency, setFrequency] = useState(50) // Hz (f, not omega)

    const [isRunning] = useState(true)

    // Physics Logic
    // omega = 2 * pi * f
    // XL = omega * L
    // XC = 1 / (omega * C)
    // Z = sqrt(R^2 + (XL - XC)^2)
    // I_max = V_max / Z
    // Phase phi = atan((XL - XC) / R)

    // V_R is in phase with I
    // V_L leads I by 90 deg
    // V_C lags I by 90 deg

    // Visualization:
    // Phasors rotating at omega.
    // Graph of V(t) and I(t).

    const V_max_source = 100 // Volts
    const timeRef = useRef(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.scale(dpr, dpr)
        }
        resize()
        window.addEventListener('resize', resize)

        let lastTime = performance.now()

        const animate = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTime) / 1000, 0.05)
            lastTime = now

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            ctx.clearRect(0, 0, w, h)

            if (isRunning) {
                timeRef.current += dt
                // historyRef.current.push(...)
            }
            const t = timeRef.current

            // Calc Physics Constants
            const omega = 2 * Math.PI * frequency
            const XL = omega * inductance
            const XC = 1 / (omega * (capacitance * 1e-6))
            const Z = Math.sqrt(resistance * resistance + (XL - XC) * (XL - XC))
            const phase = Math.atan2(XL - XC, resistance) // Phase of V relative to I?
            // V = Vmax sin(wt)
            // I = Imax sin(wt - phi)
            // Or I reference: I = Imax sin(wt)
            // VR = Imax R sin(wt)
            // VL = Imax XL sin(wt + 90)
            // VC = Imax XC sin(wt - 90)
            // Vsource = VR + VL + VC

            // Let's use I as reference phasor (angle wt)
            const I_max = V_max_source / Z
            const angle = omega * t // angle of Current phasor

            // Visual Phasors
            const cx = w / 4
            const cy = h / 2
            const scale = 1.5 // px per Volt

            // Draw Axes
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'
            ctx.setLineDash([5, 5])
            ctx.beginPath(); ctx.moveTo(cx - 150, cy); ctx.lineTo(cx + 150, cy); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(cx, cy - 150); ctx.lineTo(cx, cy + 150); ctx.stroke()
            ctx.setLineDash([])

            const drawPhasor = (mag: number, ang: number, color: string, label: string) => {
                const ex = cx + Math.cos(ang) * mag * scale
                const ey = cy - Math.sin(ang) * mag * scale // Canvas Y inverted

                ctx.strokeStyle = color
                ctx.lineWidth = 2
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke()

                // Arrow
                // ...

                ctx.fillStyle = color
                ctx.fillText(label, ex + 5, ey)
            }

            // VR (In Phase with I)
            const VR = I_max * resistance
            drawPhasor(VR, angle, '#4ade80', 'VR')

            // VL (Leads by 90)
            const VL = I_max * XL
            drawPhasor(VL, angle + Math.PI / 2, '#ef4444', 'VL')

            // VC (Lags by 90)
            const VC = I_max * XC
            drawPhasor(VC, angle - Math.PI / 2, '#3b82f6', 'VC')

            // Vsource (Sum)
            // Z phasor leads I by phase
            const V_mag = I_max * Z
            drawPhasor(V_mag, angle + phase, '#fbbf24', 'V_tot')

            // Current Phasor (for ref)
            // drawPhasor(I_max * 10, angle, 'white', 'I') // Scale I for visibility

            // Draw Trajectory?
            // Waveforms (Right side)
            const gx = w / 2 + 50
            const gy = cy
            const gw = w / 2 - 100

            // Draw V_source(t) and I(t)
            ctx.strokeStyle = '#fbbf24'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let x = 0; x < gw; x++) {
                // Time mapping
                const localT = t - (gw - x) * 0.0005
                const v = V_max_source * Math.sin(omega * localT + phase) // V leads I by phase if I is sin(wt)
                // Wait, if I is sin(wt), V is sin(wt + phi).

                const y = gy - v * 0.5 // scale
                if (x === 0) ctx.moveTo(gx + x, y); else ctx.lineTo(gx + x, y)
            }
            ctx.stroke()

            ctx.strokeStyle = 'white'
            ctx.beginPath()
            for (let x = 0; x < gw; x++) {
                const localT = t - (gw - x) * 0.0005
                const i = (V_max_source / Z) * Math.sin(omega * localT) // I is ref
                const y = gy - i * 5 // Current scale x10 relative to V for visibility
                if (x === 0) ctx.moveTo(gx + x, y); else ctx.lineTo(gx + x, y)
            }
            ctx.stroke()

            // Labels
            ctx.fillStyle = '#fbbf24'; ctx.fillText('Voltage (V)', gx + 10, gy - 60)
            ctx.fillStyle = 'white'; ctx.fillText('Current (I)', gx + 10, gy - 40)

            // Resonance Info
            // f0 = 1 / (2pi sqrt(LC))
            const f0 = 1 / (2 * Math.PI * Math.sqrt(inductance * capacitance * 1e-6))

            ctx.fillStyle = 'white'
            ctx.textAlign = 'left'
            ctx.fillText(`Resonance Freq f₀: ${f0.toFixed(1)} Hz`, 20, 30)
            ctx.fillText(`Impedance Z: ${Z.toFixed(1)} Ω`, 20, 50)
            ctx.fillText(`Phase φ: ${(phase * 180 / Math.PI).toFixed(1)}°`, 20, 70)

            // XL vs XC
            ctx.fillText(`XL: ${XL.toFixed(1)} Ω`, 20, 100)
            ctx.fillText(`XC: ${XC.toFixed(1)} Ω`, 20, 120)

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [resistance, inductance, capacitance, frequency, isRunning])

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
                        <h1 className="text-xl font-medium tracking-tight">RLC Circuit Phasors</h1>
                        <p className="text-xs text-white/50">AP Physics C: E&M</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                    />
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div className="text-sm text-white/70 leading-relaxed">
                        <b>Z = √[R² + (X_L - X_C)²]</b>
                        <br />
                        <b>tan(φ) = (X_L - X_C)/R</b>
                        <br />
                        Adjust f to find Resonance (where X_L = X_C).
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="space-y-6">

                        {/* Resistance R */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Resistance (R)</label>
                                <span className="text-xs font-mono text-white/60">{resistance} Ω</span>
                            </div>
                            <input
                                type="range" min="1" max="100" step="1" value={resistance}
                                onChange={(e) => setResistance(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        {/* Inductance L */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Inductance (L)</label>
                                <span className="text-xs font-mono text-white/60">{inductance.toFixed(2)} H</span>
                            </div>
                            <input
                                type="range" min="0.01" max="0.5" step="0.01" value={inductance}
                                onChange={(e) => setInductance(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        {/* Capacitance C */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Capacitance (C)</label>
                                <span className="text-xs font-mono text-white/60">{capacitance.toFixed(0)} μF</span>
                            </div>
                            <input
                                type="range" min="10" max="500" step="10" value={capacitance}
                                onChange={(e) => setCapacitance(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        {/* Freq */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Frequency (f)</label>
                                <span className="text-xs font-mono text-white/60">{frequency} Hz</span>
                            </div>
                            <input
                                type="range" min="10" max="200" step="1" value={frequency}
                                onChange={(e) => setFrequency(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
