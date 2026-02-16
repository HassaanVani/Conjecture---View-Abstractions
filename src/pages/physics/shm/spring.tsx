import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'

const PC = 'rgb(160, 100, 255)'

export default function SpringMass() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mass, setMass] = useState(2)
    const [k, setK] = useState(50)
    const [damping, setDamping] = useState(0.5)
    const [gravity, setGravity] = useState(9.8)
    const [showEnergy, setShowEnergy] = useState(true)
    const [showPhaseSpace, setShowPhaseSpace] = useState(true)

    const stateRef = useRef({
        y: 100, vy: 0, t: 0,
        history: [] as { t: number; y: number }[],
        phaseHistory: [] as { y: number; vy: number }[],
    })

    const scaleFactor = 20
    const gPix = gravity * scaleFactor
    const yEq = (mass * gPix) / k
    const omega = Math.sqrt(k / mass)
    const period = 2 * Math.PI / omega
    const amplitude = Math.abs(stateRef.current.y - yEq)
    const curVel = stateRef.current.vy

    const reset = useCallback(() => {
        setIsRunning(false)
        stateRef.current = { y: 100, vy: 0, t: 0, history: [], phaseHistory: [] }
    }, [])

    const demoSteps = [
        { title: 'Simple Harmonic Motion', description: 'A mass on a spring oscillates around its equilibrium position. The restoring force is proportional to displacement: F = -kx.', highlight: 'Press Start to begin oscillation.' },
        { title: 'Equilibrium Position', description: 'The dashed line shows where mg = kx (static equilibrium). Oscillation occurs around this point, not the natural spring length.', setup: () => { setDamping(0); setShowEnergy(true) } },
        { title: 'Period & Frequency', description: 'T = 2\u03C0\u221A(m/k). The period depends only on mass and spring constant, not amplitude. Try changing m and k.', setup: () => { setMass(2); setK(50) } },
        { title: 'Energy Exchange', description: 'PE_elastic and KE continuously exchange. At maximum displacement, all energy is potential. At equilibrium, all energy is kinetic.', setup: () => { setShowEnergy(true); setDamping(0) } },
        { title: 'Phase Space', description: 'The v-vs-x plot shows an ellipse for undamped SHM. This is called phase space. The trajectory repeats perfectly without damping.', setup: () => { setShowPhaseSpace(true); setDamping(0) } },
        { title: 'Damping', description: 'Real systems lose energy to friction. Increase damping to see the amplitude decay exponentially. The phase space spiral inward.', setup: () => { setDamping(2); setShowPhaseSpace(true) } },
        { title: 'Amplitude Readout', description: 'The info panel shows real-time values for amplitude, period, velocity, and energy. All are calculated from the physics state.', highlight: 'Check the right panel for live values.' },
        { title: 'Experiment!', description: 'Adjust mass, spring constant, damping, and gravity. Observe how each parameter affects the oscillation.' },
    ]

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        let animId: number
        const dt = 0.016

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight
            const s = stateRef.current

            if (isRunning) {
                const Fnet = (mass * gPix) - (k * s.y) - (damping * s.vy)
                const acc = Fnet / mass
                s.vy += acc * dt
                s.y += s.vy * dt
                s.t += dt

                if (s.t % 0.05 < dt * 1.5) {
                    s.history.push({ t: s.t, y: s.y })
                    if (s.history.length > 200) s.history.shift()
                }
                if (s.t % 0.03 < dt * 1.5) {
                    s.phaseHistory.push({ y: s.y - yEq, vy: s.vy })
                    if (s.phaseHistory.length > 400) s.phaseHistory.shift()
                }
            }

            ctx.clearRect(0, 0, width, height)
            const cx = width * 0.28
            const mountY = 50

            // Support
            ctx.fillStyle = '#64748b'
            ctx.fillRect(cx - 50, mountY - 10, 100, 10)
            for (let i = -50; i < 50; i += 8) {
                ctx.strokeStyle = '#475569'; ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(cx + i, mountY - 10); ctx.lineTo(cx + i - 5, mountY - 15); ctx.stroke()
            }

            // Spring zigzag
            const unstrLen = 150
            const curLen = unstrLen + s.y
            ctx.beginPath(); ctx.moveTo(cx, mountY)
            const coils = 12; const coilH = curLen / coils
            for (let i = 0; i < coils; i++) {
                const xOff = i % 2 === 0 ? 15 : -15
                ctx.lineTo(cx + xOff, mountY + (i + 0.5) * coilH)
                ctx.lineTo(cx - xOff, mountY + (i + 1) * coilH)
            }
            ctx.lineTo(cx, mountY + curLen)
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.stroke()

            // Mass box
            const boxSize = 40 + Math.sqrt(mass) * 5
            ctx.fillStyle = PC; ctx.shadowColor = PC; ctx.shadowBlur = 10
            ctx.fillRect(cx - boxSize / 2, mountY + curLen, boxSize, boxSize)
            ctx.shadowBlur = 0
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(cx - boxSize / 2, mountY + curLen, boxSize, boxSize)
            ctx.fillStyle = 'white'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText(`${mass}kg`, cx, mountY + curLen + boxSize / 2)

            // Equilibrium line
            const eqY = mountY + unstrLen + yEq
            ctx.beginPath(); ctx.setLineDash([5, 5])
            ctx.moveTo(cx - 80, eqY); ctx.lineTo(cx + 80, eqY)
            ctx.strokeStyle = 'rgba(160,100,255,0.4)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(160,100,255,0.5)'; ctx.font = '10px monospace'
            ctx.fillText('Equilibrium', cx + 100, eqY)

            // Displacement vs Time graph
            const gx = width * 0.58; const gw = width * 0.38; const gh = height * 0.28; const gy = height * 0.08
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke()
            ctx.fillStyle = PC; ctx.font = '11px monospace'; ctx.textAlign = 'center'
            ctx.fillText('Displacement vs Time', gx + gw / 2, gy - 8)

            if (s.history.length > 1) {
                ctx.beginPath(); ctx.strokeStyle = PC; ctx.lineWidth = 2
                const last = s.history[s.history.length - 1]
                s.history.forEach((pt, i) => {
                    const tDiff = last.t - pt.t; if (tDiff > 10) return
                    const dx = gx + gw - (tDiff / 10) * gw
                    const dy = (gy + gh / 2) + (pt.y - yEq) * 0.5
                    i === 0 || dx < gx ? ctx.moveTo(Math.max(gx, dx), dy) : ctx.lineTo(Math.max(gx, dx), dy)
                })
                ctx.stroke()
            }

            // Phase space plot
            if (showPhaseSpace) {
                const px = width * 0.58; const pw = width * 0.38; const ph = height * 0.28; const py = height * 0.42
                ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(px, py + ph / 2); ctx.lineTo(px + pw, py + ph / 2); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(px + pw / 2, py); ctx.lineTo(px + pw / 2, py + ph); ctx.stroke()
                ctx.fillStyle = '#38bdf8'; ctx.font = '11px monospace'; ctx.textAlign = 'center'
                ctx.fillText('Phase Space (v vs x)', px + pw / 2, py - 8)
                ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '9px monospace'
                ctx.fillText('x', px + pw - 5, py + ph / 2 - 5)
                ctx.fillText('v', px + pw / 2 + 8, py + 8)

                if (s.phaseHistory.length > 1) {
                    ctx.beginPath(); ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5
                    s.phaseHistory.forEach((pt, i) => {
                        const dx = px + pw / 2 + pt.y * 0.4
                        const dy = py + ph / 2 - pt.vy * 0.15
                        i === 0 ? ctx.moveTo(dx, dy) : ctx.lineTo(dx, dy)
                    })
                    ctx.stroke()
                    const last = s.phaseHistory[s.phaseHistory.length - 1]
                    ctx.fillStyle = '#38bdf8'; ctx.beginPath()
                    ctx.arc(px + pw / 2 + last.y * 0.4, py + ph / 2 - last.vy * 0.15, 3, 0, Math.PI * 2); ctx.fill()
                }
            }

            // Energy bars
            if (showEnergy) {
                const distFromEq = s.y - yEq
                const peEff = 0.5 * k * distFromEq * distFromEq / 1000
                const keVal = 0.5 * mass * s.vy * s.vy / 1000
                const totalEff = peEff + keVal

                const bx = width * 0.58; const by = height * 0.78; const bw = 28; const maxH = 80
                ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx - 5, by - 20, 140, maxH + 40)
                ctx.fillStyle = 'white'; ctx.font = '11px monospace'; ctx.textAlign = 'center'
                ctx.fillText('Energy', bx + 55, by - 6)

                const bars = [
                    { label: 'PE', val: peEff, color: '#3b82f6' },
                    { label: 'KE', val: keVal, color: '#22c55e' },
                    { label: 'Tot', val: totalEff, color: '#eab308' },
                ]
                bars.forEach((b, i) => {
                    const bH = totalEff > 0 ? Math.min(maxH, (b.val / totalEff) * maxH) : 0
                    ctx.fillStyle = b.color
                    ctx.fillRect(bx + i * (bw + 10), by + maxH - bH, bw, bH)
                    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px monospace'
                    ctx.fillText(b.label, bx + i * (bw + 10) + bw / 2, by + maxH + 12)
                })
            }

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [isRunning, mass, k, damping, gravity, showEnergy, showPhaseSpace, gPix, yEq])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Spring Oscillator</h1>
                        <p className="text-xs text-white/50">Simple Harmonic Motion</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <APTag course="Physics 1" unit="Unit 6" color={PC} />
                    <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute bottom-4 left-4 flex flex-col gap-3 max-w-[260px]">
                        <EquationDisplay departmentColor={PC} equations={[
                            { label: 'Hooke', expression: 'F = \u2212kx' },
                            { label: 'Period', expression: 'T = 2\u03C0\u221A(m/k)', description: `= ${period.toFixed(3)} s` },
                            { label: 'Frequency', expression: '\u03C9 = \u221A(k/m)', description: `= ${omega.toFixed(2)} rad/s` },
                            { label: 'PE elastic', expression: 'U = \u00BDkx\u00B2' },
                            { label: 'KE', expression: 'K = \u00BDmv\u00B2' },
                        ]} />
                    </div>

                    <div className="absolute bottom-4 right-4">
                        <InfoPanel departmentColor={PC} title="Oscillation Data" items={[
                            { label: 'Amplitude', value: amplitude, unit: 'px' },
                            { label: 'Period', value: period, unit: 's' },
                            { label: '\u03C9', value: omega, unit: 'rad/s' },
                            { label: 'Velocity', value: curVel, unit: 'px/s' },
                            { label: 'Displacement', value: stateRef.current.y - yEq, unit: 'px' },
                            { label: 'Time', value: stateRef.current.t, unit: 's' },
                        ]} />
                    </div>

                    {demo.isOpen && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                            <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={PC} />
                        </div>
                    )}
                </div>

                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <Slider label={`Mass (m) \u2014 ${mass} kg`} value={mass} onChange={setMass} min={1} max={10} step={0.5} />
                        <Slider label={`Spring Constant (k) \u2014 ${k} N/m`} value={k} onChange={setK} min={10} max={200} step={5} />
                        <Slider label={`Damping (c) \u2014 ${damping}`} value={damping} onChange={setDamping} min={0} max={5} step={0.1} />
                        <Slider label={`Gravity \u2014 ${gravity} m/s\u00B2`} value={gravity} onChange={setGravity} min={0} max={20} step={0.1} />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={() => setIsRunning(!isRunning)} className="flex-1">
                            {isRunning ? 'Pause' : 'Start Oscillation'}
                        </Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>

                    <Toggle label="Energy Diagram" value={showEnergy} onChange={setShowEnergy} />
                    <Toggle label="Phase Space Plot" value={showPhaseSpace} onChange={setShowPhaseSpace} />
                </div>
            </div>
        </div>
    )
}
