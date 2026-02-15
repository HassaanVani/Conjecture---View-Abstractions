import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function Photoelectric() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [wavelength, setWavelength] = useState(400) // nm (UV/Visible)
    const [intensity, setIntensity] = useState(50) // %
    const [voltage, setVoltage] = useState(0) // V (Stopping potential)
    const [metal, setMetal] = useState('Sodium') // Work function selector

    // Metals: Name -> Work Function (eV)
    const metals = {
        'Sodium': 2.36,
        'Zinc': 4.3,
        'Copper': 4.7,
        'Platinum': 6.35,
        'Calcium': 2.9
    }
    const phi = metals[metal as keyof typeof metals]

    // Physics Logic
    // E = hc / lambda
    // h = 4.1357e-15 eV*s
    // c = 3e8 m/s
    // lambda in m
    // Simpler: E (eV) = 1240 / lambda (nm)

    // K_max = E - phi
    // If K_max > 0, electrons ejected.
    // Stopping potential Vs = K_max / e (Volts = eV/e) => Vs = K_max

    // Current I: Proportional to Intensity (if K_max > 0)
    // Scale current based on (K_max - Voltage) logic?
    // If Voltage is retarding (-V), only e- with KE > |V| cross.
    // If Voltage is accelerating (+V), all cross.
    // Wait, typical setup: 
    // Plate 1 (Emitter) -> Plate 2 (Collector).
    // Battery applies V. 
    // If V negative (retarding), electrons slowed.
    // If KE_max < |V_stop|, current = 0.

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

        // Particles
        const photons: { x: number, y: number, vx: number, vy: number }[] = []
        const electrons: { x: number, y: number, vx: number, vy: number, ke: number }[] = []

        let lastTime = performance.now()

        const animate = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTime) / 1000, 0.05)
            lastTime = now

            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            ctx.clearRect(0, 0, width, height)

            // Draw Setup
            // Emitter Plate (Left)
            ctx.fillStyle = '#94a3b8' // Metal
            ctx.fillRect(100, height / 2 - 50, 20, 100)

            // Collector Plate (Right)
            ctx.fillStyle = '#94a3b8'
            ctx.fillRect(width - 120, height / 2 - 50, 20, 100)

            // Circuit (Lines)
            ctx.strokeStyle = '#475569'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(110, height / 2 + 50); ctx.lineTo(110, height - 100); ctx.lineTo(width - 110, height - 100); ctx.lineTo(width - 110, height / 2 + 50)
            ctx.stroke()

            // Voltage Source Symbol at bottom
            ctx.fillStyle = '#0d0a1a'
            ctx.fillRect(width / 2 - 20, height - 110, 40, 20)
            // Draw battery
            ctx.strokeStyle = 'white'
            // If V > 0 (Accelerating, Right positive): Long Right, Short Left
            // If V < 0 (Retarding, Left positive): Long Left, Short Right
            // Standard: V is "Collector relative to Emitter". 
            // V < 0 means Collector is negative (repels electrons).

            ctx.beginPath()
            if (voltage >= 0) {
                ctx.moveTo(width / 2 - 10, height - 115); ctx.lineTo(width / 2 - 10, height - 85) // Left Short? No Long is Pos.
                // Right is Collector. V > 0 -> Collector Pos.
                // So Right Loop line connects to Long Bar.
                // Left Loop line connects to Short Bar.
                ctx.moveTo(width / 2 + 5, height - 120); ctx.lineTo(width / 2 + 5, height - 80) // Long Right
                ctx.moveTo(width / 2 - 5, height - 110); ctx.lineTo(width / 2 - 5, height - 90) // Short Left
            } else {
                // Forward biased? No, Photoelectric effect stops with Retarding.
                // V < 0 -> Collector Neg.
                ctx.moveTo(width / 2 - 5, height - 120); ctx.lineTo(width / 2 - 5, height - 80) // Long Left
                ctx.moveTo(width / 2 + 5, height - 110); ctx.lineTo(width / 2 + 5, height - 90) // Short Right
            }
            ctx.stroke()
            ctx.fillStyle = 'white'
            ctx.textAlign = 'center'
            ctx.fillText(`${voltage} V`, width / 2, height - 60)


            // Photon Logic
            // Rate depends on intensity
            // Color from wavelength
            // RGB approx
            const hue = wavelength > 700 ? 0 : wavelength > 600 ? 30 : wavelength > 500 ? 120 : wavelength > 400 ? 240 : 280
            const color = `hsl(${hue}, 100%, 70%)`

            if (Math.random() < intensity * 0.01) {
                // Spawn Photon
                // Should aim at plate
                photons.push({
                    x: 0,
                    y: height / 2 - 50 + Math.random() * 100, // Random height on plate
                    vx: 300,
                    vy: (Math.random() - 0.5) * 10
                })
            }

            // E Logic
            const E_photon = 1240 / wavelength
            const K_max = E_photon - phi

            // Update Photons
            for (let i = photons.length - 1; i >= 0; i--) {
                const p = photons[i]
                p.x += p.vx * dt
                p.y += p.vy * dt

                // Draw Photon (Wavy line or particle?)
                // Particle for simplicity
                ctx.fillStyle = color
                ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill()
                // Wavy trail
                ctx.strokeStyle = color; ctx.globalAlpha = 0.5
                ctx.beginPath(); ctx.moveTo(p.x - 10, p.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.globalAlpha = 1

                // Hit Plate
                if (p.x > 100) {
                    photons.splice(i, 1)
                    // Eject Electron?
                    if (K_max > 0) {
                        // Eject with Probability?
                        if (Math.random() > 0.5) {
                            electrons.push({
                                x: 100,
                                y: p.y,
                                vx: Math.sqrt(K_max) * 100, // Speed scale
                                vy: (Math.random() - 0.5) * 50,
                                ke: K_max
                            })
                        }
                    }
                }
            }

            // Update Electrons
            for (let i = electrons.length - 1; i >= 0; i--) {
                const e = electrons[i]

                // Physics: Acceleration by E-field from Voltage
                // V = Potential Difference over Distance d
                const dist = width - 120 - 100 // dist between plates
                // const E_field = voltage / dist // V/m
                // F = qE, a = F/m. In atomic units...
                // K_final = K_initial + qV
                // e.vx changes.
                // a = (voltage * const)
                const ax = (voltage * 1000) / dist // arbitrary scale

                e.vx += ax * dt

                e.x += e.vx * dt
                e.y += e.vy * dt

                // Draw Electron
                ctx.fillStyle = '#60a5fa' // Blue e-
                ctx.beginPath(); ctx.arc(e.x, e.y, 2, 0, Math.PI * 2); ctx.fill()

                // Hit Collector
                if (e.x > width - 120) {
                    electrons.splice(i, 1)
                    // Current!
                }
                // Hit Emitter (returned) or lost
                else if (e.x < 100 || e.y < 0 || e.y > height) {
                    electrons.splice(i, 1)
                }
            }

            // Energy Level Diagram (Overlay)
            const dx = width - 250

            ctx.fillStyle = 'rgba(0,0,0,0.5)'
            ctx.fillRect(dx, 20, 230, 150)

            // Work Function depth
            ctx.fillStyle = 'white'
            ctx.font = '12px sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText(`Photon E: ${E_photon.toFixed(2)} eV`, dx + 10, 40)
            ctx.fillText(`Work Func Φ: ${phi.toFixed(2)} eV`, dx + 10, 60)

            if (K_max > 0) {
                ctx.fillStyle = '#4ade80' // Green
                ctx.fillText(`Max KE: ${K_max.toFixed(2)} eV`, dx + 10, 80)
            } else {
                ctx.fillStyle = '#f87171' // Red
                ctx.fillText(`Max KE: 0 eV (No Emission)`, dx + 10, 80)
            }

            // Stop Voltage
            if (K_max > 0) {
                ctx.fillStyle = '#fbbf24'
                ctx.fillText(`Stop Voltage: -${K_max.toFixed(2)} V`, dx + 10, 100)
            }


            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [wavelength, intensity, voltage, metal])

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
                        <h1 className="text-xl font-medium tracking-tight">Photoelectric Effect</h1>
                        <p className="text-xs text-white/50">AP Physics 2 & Modern</p>
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
                        <b>E = hf = hc/λ</b>
                        <br />
                        <b>Kmax = hf - Φ</b>
                        <br />
                        Electrons are emitted only if photon energy exceeds Work Function (Φ).
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-white/80 mb-2 block">Target Metal</label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.keys(metals).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMetal(m)}
                                        className={`px-2 py-2 text-xs rounded-lg transition-all ${metal === m ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Wavelength (λ)</label>
                                <span className="text-xs font-mono text-white/60">{wavelength} nm</span>
                            </div>
                            <input
                                type="range" min="100" max="800" step="10" value={wavelength}
                                onChange={(e) => setWavelength(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                            <div className="flex justify-between text-xs text-white/40 mt-1">
                                <span>UV</span>
                                <span>Visible</span>
                                <span>IR</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Intensity</label>
                                <span className="text-xs font-mono text-white/60">{intensity}%</span>
                            </div>
                            <input
                                type="range" min="0" max="100" step="5" value={intensity}
                                onChange={(e) => setIntensity(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Voltage (V)</label>
                                <span className="text-xs font-mono text-white/60">{voltage} V</span>
                            </div>
                            <input
                                type="range" min="-5.0" max="5.0" step="0.1" value={voltage}
                                onChange={(e) => setVoltage(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                            <div className="flex justify-between text-xs text-white/40 mt-1">
                                <span>Retarding</span>
                                <span>Accelerating</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
