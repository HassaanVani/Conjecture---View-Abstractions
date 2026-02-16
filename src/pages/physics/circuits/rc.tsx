import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Select } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

const PHYSICS_COLOR = 'rgb(160, 100, 255)'

type Mode = 'charge' | 'discharge'

const PRESETS = [
    { value: 'custom', label: 'Custom' },
    { value: 'fast', label: 'Fast (10ohm, 100uF)' },
    { value: 'medium', label: 'Medium (100ohm, 200uF)' },
    { value: 'slow', label: 'Slow (500ohm, 500uF)' },
]

export default function RCCircuit() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [mode, setMode] = useState<Mode>('charge')
    const [resistance, setResistance] = useState(100)
    const [capacitance, setCapacitance] = useState(200)
    const [sourceVoltage, setSourceVoltage] = useState(10)
    const [preset, setPreset] = useState('custom')
    const stateRef = useRef({ q: 0, v_c: 0, i: 0 })
    const timeRef = useRef(0)
    const historyRef = useRef<{ t: number; v: number; i: number; q: number }[]>([])
    const lastTimeRef = useRef(performance.now())

    const tau = (resistance * capacitance) / 1e5

    const reset = useCallback(() => {
        timeRef.current = 0
        if (mode === 'charge') {
            stateRef.current = { q: 0, v_c: 0, i: 0 }
        } else {
            const C = capacitance / 1e4
            stateRef.current = { q: sourceVoltage * C, v_c: sourceVoltage, i: 0 }
        }
        historyRef.current = []
        lastTimeRef.current = performance.now()
    }, [mode, capacitance, sourceVoltage])

    useEffect(() => { reset() }, [mode, reset])

    useEffect(() => {
        if (preset === 'fast') { setResistance(10); setCapacitance(100) }
        else if (preset === 'medium') { setResistance(100); setCapacitance(200) }
        else if (preset === 'slow') { setResistance(500); setCapacitance(500) }
    }, [preset])

    const demoSteps: DemoStep[] = [
        { title: 'RC Circuits', description: 'A resistor-capacitor circuit stores and releases electrical energy through exponential charge/discharge curves.', highlight: 'The circuit diagram shows R and C connected to a voltage source.' },
        { title: 'Time Constant (tau)', description: 'tau = RC determines how fast the circuit responds. After 1 tau, voltage reaches 63% of final value.', setup: () => { setResistance(100); setCapacitance(200); setMode('charge'); reset() }, highlight: 'Watch the tau marker on the graph.' },
        { title: 'Charging', description: 'V_c(t) = V_s(1 - e^(-t/RC)). Voltage rises exponentially toward source voltage. Current decreases.', setup: () => { setMode('charge'); reset() } },
        { title: 'Discharging', description: 'V_c(t) = V_0 * e^(-t/RC). Voltage decays exponentially to zero. Current flows in reverse.', setup: () => { setMode('discharge'); reset() }, highlight: 'Switch to discharge to see exponential decay.' },
        { title: 'Current vs Time', description: 'During charging: I = (V_s/R)e^(-t/RC). Current starts high and decays. Yellow curve shows current alongside voltage.', setup: () => { setMode('charge'); reset() }, highlight: 'Blue = voltage, Yellow = current.' },
        { title: 'Effect of R', description: 'Larger R means slower charging (larger tau). The current is also smaller at any given time.', setup: () => { setResistance(500); setMode('charge'); reset() } },
        { title: 'Effect of C', description: 'Larger C stores more charge (Q = CV). Takes longer to charge but holds more energy (U = 0.5CV^2).', setup: () => { setCapacitance(500); setMode('charge'); reset() } },
        { title: 'Presets', description: 'Use presets to quickly compare fast, medium, and slow RC circuits. Notice how tau changes the curve shape.', setup: () => { setPreset('fast') } },
    ]

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let dpr = window.devicePixelRatio || 1
        const resize = () => {
            dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        const animate = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05)
            lastTimeRef.current = now

            const w = canvas.offsetWidth, h = canvas.offsetHeight

            // Physics
            const R = resistance
            const C = capacitance / 1e4
            const Vs = mode === 'charge' ? sourceVoltage : 0
            const I = (Vs - stateRef.current.v_c) / R
            stateRef.current.q += I * dt
            stateRef.current.v_c = stateRef.current.q / C
            stateRef.current.i = I
            timeRef.current += dt

            historyRef.current.push({ t: timeRef.current, v: stateRef.current.v_c, i: I, q: stateRef.current.q })
            if (historyRef.current.length > 500) historyRef.current.shift()

            ctx.clearRect(0, 0, w, h)

            // Circuit diagram (top area)
            const cx = w * 0.35, cy = h * 0.28
            const cw = 240, ch = 120
            const left = cx - cw / 2, right = cx + cw / 2
            const top = cy - ch / 2, bot = cy + ch / 2

            ctx.strokeStyle = 'rgba(255,255,255,0.6)'
            ctx.lineWidth = 2.5
            ctx.lineJoin = 'round'

            // Top wire + resistor
            ctx.beginPath()
            ctx.moveTo(left, top); ctx.lineTo(cx - 40, top)
            const rPts = [-30, -20, -10, 0, 10, 20, 30]
            rPts.forEach((dx, i) => {
                ctx.lineTo(cx + dx, top + (i % 2 === 0 ? -8 : 8))
            })
            ctx.lineTo(cx + 40, top); ctx.lineTo(right, top)
            ctx.lineTo(right, bot)
            ctx.stroke()

            // Capacitor
            ctx.beginPath()
            ctx.moveTo(right, bot); ctx.lineTo(cx + 15, bot)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(cx + 15, bot - 18); ctx.lineTo(cx + 15, bot + 18)
            ctx.moveTo(cx - 15, bot - 18); ctx.lineTo(cx - 15, bot + 18)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(cx - 15, bot); ctx.lineTo(left, bot)
            ctx.stroke()

            // Battery
            ctx.beginPath()
            ctx.moveTo(left, bot); ctx.lineTo(left, cy + 15)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(left - 12, cy + 15); ctx.lineTo(left + 12, cy + 15)
            ctx.moveTo(left - 6, cy + 25); ctx.lineTo(left + 6, cy + 25)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(left, cy + 25); ctx.lineTo(left, top)
            ctx.stroke()

            // Labels
            ctx.fillStyle = 'rgba(255,255,255,0.6)'
            ctx.font = '12px monospace'
            ctx.textAlign = 'center'
            ctx.fillText(`R = ${resistance} ohm`, cx, top - 18)
            ctx.fillText(`C = ${capacitance} uF`, cx, bot + 32)
            ctx.fillText(`${sourceVoltage}V`, left - 25, cy + 22)

            // Current arrow
            if (Math.abs(I) > 0.001) {
                const arrowColor = mode === 'charge' ? 'rgba(100, 255, 150, 0.8)' : 'rgba(255, 100, 100, 0.8)'
                ctx.strokeStyle = arrowColor
                ctx.fillStyle = arrowColor
                ctx.lineWidth = 2
                const arrowY = top
                const arrowDir = I > 0 ? 1 : -1
                ctx.beginPath()
                ctx.moveTo(cx - 50 * arrowDir, arrowY - 20)
                ctx.lineTo(cx + 20 * arrowDir, arrowY - 20)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(cx + 20 * arrowDir, arrowY - 25)
                ctx.lineTo(cx + 30 * arrowDir, arrowY - 20)
                ctx.lineTo(cx + 20 * arrowDir, arrowY - 15)
                ctx.fill()
                ctx.font = '11px monospace'
                ctx.fillText(`I = ${(Math.abs(I) * 1000).toFixed(1)} mA`, cx, arrowY - 30)
            }

            // Charge level on capacitor
            const chargePercent = Math.abs(stateRef.current.v_c / sourceVoltage)
            ctx.fillStyle = `rgba(160, 100, 255, ${chargePercent * 0.5})`
            ctx.fillRect(cx - 14, bot - 17, 28, 34)

            // Graphs (bottom half)
            const graphY = h * 0.55
            const graphH = h * 0.35
            const graphW = w * 0.75
            const gx = 70

            // Axes
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(gx, graphY); ctx.lineTo(gx, graphY + graphH)
            ctx.lineTo(gx + graphW, graphY + graphH)
            ctx.stroke()

            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '11px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('Time (s)', gx + graphW / 2, graphY + graphH + 18)

            // Tau marker
            if (historyRef.current.length > 0) {
                const tMin = historyRef.current[0].t
                const tMax = Math.max(tMin + tau * 6, historyRef.current[historyRef.current.length - 1].t)
                const tauX = gx + ((tau - tMin) / (tMax - tMin)) * graphW

                if (tauX > gx && tauX < gx + graphW) {
                    ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'
                    ctx.setLineDash([4, 4])
                    ctx.beginPath(); ctx.moveTo(tauX, graphY); ctx.lineTo(tauX, graphY + graphH); ctx.stroke()
                    ctx.setLineDash([])
                    ctx.fillStyle = PHYSICS_COLOR
                    ctx.font = '10px monospace'
                    ctx.fillText('tau', tauX, graphY - 5)
                }

                // Voltage curve (blue)
                ctx.beginPath()
                ctx.strokeStyle = '#60a5fa'
                ctx.lineWidth = 2
                historyRef.current.forEach((pt, i) => {
                    const x = gx + ((pt.t - tMin) / (tMax - tMin)) * graphW
                    const y = graphY + graphH - (pt.v / (sourceVoltage * 1.2)) * graphH
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke()

                // Current curve (yellow)
                ctx.beginPath()
                ctx.strokeStyle = '#facc15'
                ctx.lineWidth = 2
                const iMax = sourceVoltage / resistance
                historyRef.current.forEach((pt, i) => {
                    const x = gx + ((pt.t - tMin) / (tMax - tMin)) * graphW
                    const y = graphY + graphH - (Math.abs(pt.i) / (iMax * 1.2)) * graphH
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke()
            }

            // Legend
            ctx.fillStyle = '#60a5fa'; ctx.textAlign = 'left'
            ctx.fillText('Vc (voltage)', gx + 10, graphY + 15)
            ctx.fillStyle = '#facc15'
            ctx.fillText('I (current)', gx + 120, graphY + 15)

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [resistance, capacitance, sourceVoltage, mode])

    const energy = 0.5 * (capacitance / 1e4) * stateRef.current.v_c * stateRef.current.v_c

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">RC Circuits</h1>
                        <p className="text-xs text-white/50">Circuits</p>
                    </div>
                    <APTag course="Physics 2" unit="Unit 4" color={PHYSICS_COLOR} />
                </div>
                <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                    <div className="absolute top-4 left-4 space-y-2">
                        <EquationDisplay departmentColor={PHYSICS_COLOR} title="RC Equations"
                            equations={[
                                { label: 'Charging', expression: 'Vc = Vs(1 - e^(-t/RC))', description: 'Voltage across capacitor' },
                                { label: 'Discharging', expression: 'Vc = V0 * e^(-t/RC)', description: 'Exponential decay' },
                                { label: 'Time const', expression: 'tau = RC', description: 'Time constant' },
                                { label: 'Energy', expression: 'U = (1/2)CV^2', description: 'Stored energy' },
                            ]} />
                    </div>
                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PHYSICS_COLOR} title="Circuit State"
                            items={[
                                { label: 'Mode', value: mode },
                                { label: 'Vc', value: stateRef.current.v_c.toFixed(2), unit: 'V' },
                                { label: 'I', value: (stateRef.current.i * 1000).toFixed(1), unit: 'mA' },
                                { label: 'tau', value: tau.toFixed(3), unit: 's' },
                                { label: 'Energy', value: (energy * 1000).toFixed(2), unit: 'mJ' },
                                { label: 'Time', value: timeRef.current.toFixed(2), unit: 's' },
                            ]} />
                    </div>
                </div>

                <div className="w-72 bg-[#0d0a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ButtonGroup label="Mode" value={mode} onChange={v => setMode(v as Mode)}
                            options={[{ value: 'charge', label: 'Charge' }, { value: 'discharge', label: 'Discharge' }]}
                            color={PHYSICS_COLOR} />
                        <Select label="Presets" value={preset} onChange={setPreset} options={PRESETS} />
                        <ControlGroup label="Resistance (R)">
                            <Slider value={resistance} onChange={v => { setResistance(v); setPreset('custom') }} min={10} max={1000} step={10} label={`${resistance} ohm`} />
                        </ControlGroup>
                        <ControlGroup label="Capacitance (C)">
                            <Slider value={capacitance} onChange={v => { setCapacitance(v); setPreset('custom') }} min={10} max={500} step={10} label={`${capacitance} uF`} />
                        </ControlGroup>
                        <ControlGroup label="Source Voltage">
                            <Slider value={sourceVoltage} onChange={setSourceVoltage} min={1} max={20} step={1} label={`${sourceVoltage} V`} />
                        </ControlGroup>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </ControlPanel>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={PHYSICS_COLOR} />
            </div>
        </div>
    )
}
