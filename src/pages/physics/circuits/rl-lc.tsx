import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const PHYS_COLOR = 'rgb(160, 100, 255)'

type CircuitType = 'RL' | 'LC'

export default function RlLc() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)

    const [circuitType, setCircuitType] = useState<CircuitType>('RL')
    const [resistance, setResistance] = useState(100)
    const [inductance, setInductance] = useState(0.5)
    const [capacitance, setCapacitance] = useState(100) // microfarads
    const [voltage, setVoltage] = useState(12)
    const [isRunning, setIsRunning] = useState(false)
    const [showVoltages, setShowVoltages] = useState(true)

    const stateRef = useRef({ t: 0, I: 0, Vc: 0 })
    const historyRef = useRef<Array<{ t: number; I: number; V: number }>>([])

    const tauRL = inductance / resistance
    const capF = capacitance * 1e-6
    const omegaLC = 1 / Math.sqrt(inductance * capF)
    const periodLC = (2 * Math.PI) / omegaLC

    const reset = useCallback(() => {
        stateRef.current = { t: 0, I: 0, Vc: circuitType === 'LC' ? voltage : 0 }
        historyRef.current = []
        setIsRunning(false)
        if (animRef.current) cancelAnimationFrame(animRef.current)
    }, [circuitType, voltage])

    const demoSteps: DemoStep[] = [
        {
            title: 'Transient Circuits',
            description: 'RL and LC circuits exhibit transient behavior -- currents and voltages that change over time as energy is stored in inductors (magnetic field) and capacitors (electric field).',
            setup: () => { setCircuitType('RL'); reset() },
        },
        {
            title: 'RL Circuit Charging',
            description: 'When voltage is applied to an RL circuit, current rises exponentially: I(t) = (V/R)(1 - e^(-t/tau)), where tau = L/R is the time constant. The inductor resists sudden changes in current.',
            setup: () => { setCircuitType('RL'); setResistance(100); setInductance(0.5); setVoltage(12); reset(); setIsRunning(true) },
        },
        {
            title: 'RL Time Constant',
            description: 'tau = L/R determines how fast the circuit responds. After one tau, current reaches 63% of maximum. After 5*tau, it is essentially at steady state (99.3%).',
            setup: () => { setCircuitType('RL'); setResistance(50); setInductance(0.5); reset(); setIsRunning(true) },
        },
        {
            title: 'Inductor Voltage',
            description: 'V_L = L * dI/dt. Initially all voltage drops across L. As current stabilizes, V_L approaches zero and all voltage drops across R. Energy is stored in B-field: U = (1/2)LI^2.',
            setup: () => { setCircuitType('RL'); setShowVoltages(true); reset(); setIsRunning(true) },
        },
        {
            title: 'LC Oscillation',
            description: 'An LC circuit oscillates like a spring-mass system. Energy bounces between the capacitor (electric field) and inductor (magnetic field) at frequency w = 1/sqrt(LC).',
            setup: () => { setCircuitType('LC'); setInductance(0.5); setCapacitance(100); reset(); setIsRunning(true) },
        },
        {
            title: 'LC Frequency',
            description: 'The angular frequency w = 1/sqrt(LC). This is analogous to w = sqrt(k/m) for SHM. Charge oscillates sinusoidally: q(t) = Q0*cos(wt).',
            setup: () => { setCircuitType('LC'); setCapacitance(50); reset(); setIsRunning(true) },
        },
        {
            title: 'Energy Conservation',
            description: 'In an ideal LC circuit, total energy U = (1/2)CV^2 + (1/2)LI^2 is constant. The energy sloshes back and forth at the resonant frequency without any loss.',
            setup: () => { setCircuitType('LC'); reset(); setShowVoltages(true); setIsRunning(true) },
        },
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

        let lastTime = performance.now()

        const animate = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTime) / 1000, 0.02)
            lastTime = now
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            if (isRunning) {
                const s = stateRef.current
                s.t += dt

                if (circuitType === 'RL') {
                    s.I = (voltage / resistance) * (1 - Math.exp(-s.t / tauRL))
                    s.Vc = 0
                } else {
                    // LC oscillation: q(t) = Q0 cos(wt), I = -Q0*w*sin(wt)
                    const Q0 = capF * voltage
                    const q = Q0 * Math.cos(omegaLC * s.t)
                    s.I = Q0 * omegaLC * Math.sin(omegaLC * s.t)
                    s.Vc = q / capF
                }

                const vPlot = circuitType === 'RL' ? s.I * resistance : s.Vc
                if (historyRef.current.length === 0 || s.t - historyRef.current[historyRef.current.length - 1].t > 0.002) {
                    historyRef.current.push({ t: s.t, I: s.I, V: vPlot })
                    if (historyRef.current.length > 400) historyRef.current.shift()
                }
            }

            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = '#0d0a1a'
            ctx.fillRect(0, 0, w, h)

            // Draw circuit schematic
            const scX = w * 0.22
            const scY = h * 0.4
            const scW = 180
            const scH = 120

            // Wires
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(scX, scY)
            ctx.lineTo(scX + scW, scY)
            ctx.lineTo(scX + scW, scY + scH)
            ctx.lineTo(scX, scY + scH)
            ctx.lineTo(scX, scY)
            ctx.stroke()

            // Battery (left side)
            ctx.strokeStyle = 'rgba(255, 200, 80, 0.7)'
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(scX - 6, scY + scH / 2 - 12)
            ctx.lineTo(scX - 6, scY + scH / 2 + 12)
            ctx.stroke()
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(scX + 4, scY + scH / 2 - 7)
            ctx.lineTo(scX + 4, scY + scH / 2 + 7)
            ctx.stroke()
            ctx.fillStyle = 'rgba(255, 200, 80, 0.6)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`${voltage}V`, scX - 18, scY + scH / 2 + 4)

            // Inductor (top)
            ctx.strokeStyle = 'rgba(100, 180, 255, 0.7)'
            ctx.lineWidth = 2
            const indX = scX + scW * 0.3
            const indW = scW * 0.4
            for (let i = 0; i < 4; i++) {
                ctx.beginPath()
                ctx.arc(indX + (i + 0.5) * (indW / 4), scY, indW / 8, Math.PI, 0)
                ctx.stroke()
            }
            ctx.fillStyle = 'rgba(100, 180, 255, 0.6)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`L=${inductance}H`, indX + indW / 2, scY - 12)

            if (circuitType === 'RL') {
                // Resistor (bottom) zigzag
                ctx.strokeStyle = 'rgba(255, 130, 80, 0.7)'
                ctx.lineWidth = 2
                const resX = scX + scW * 0.25
                const resW = scW * 0.5
                ctx.beginPath()
                ctx.moveTo(resX, scY + scH)
                for (let i = 0; i < 6; i++) {
                    const x = resX + (i + 0.5) * (resW / 6)
                    const y = scY + scH + (i % 2 === 0 ? -8 : 8)
                    ctx.lineTo(x, y)
                }
                ctx.lineTo(resX + resW, scY + scH)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 130, 80, 0.6)'
                ctx.fillText(`R=${resistance}O`, resX + resW / 2, scY + scH + 22)
            } else {
                // Capacitor (bottom)
                const capX = scX + scW / 2
                ctx.strokeStyle = 'rgba(100, 255, 180, 0.7)'
                ctx.lineWidth = 2.5
                ctx.beginPath()
                ctx.moveTo(capX - 4, scY + scH - 12)
                ctx.lineTo(capX - 4, scY + scH + 12)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(capX + 4, scY + scH - 12)
                ctx.lineTo(capX + 4, scY + scH + 12)
                ctx.stroke()
                ctx.fillStyle = 'rgba(100, 255, 180, 0.6)'
                ctx.font = '10px system-ui'
                ctx.fillText(`C=${capacitance}uF`, capX, scY + scH + 25)
            }

            // Animated current flow
            if (isRunning && Math.abs(stateRef.current.I) > 0.001) {
                const currentDir = stateRef.current.I > 0 ? 1 : -1
                const speed = Math.abs(stateRef.current.I) * 200
                const t = performance.now() / 1000
                const numDots = 12

                ctx.fillStyle = `rgba(160, 100, 255, ${Math.min(0.8, Math.abs(stateRef.current.I) * 10)})`
                for (let i = 0; i < numDots; i++) {
                    const progress = ((i / numDots) + t * speed / (2 * (scW + scH)) * currentDir) % 1
                    const p = progress < 0 ? progress + 1 : progress
                    const perimeter = 2 * (scW + scH)
                    const dist = p * perimeter
                    let px: number, py: number

                    if (dist < scW) {
                        px = scX + dist; py = scY
                    } else if (dist < scW + scH) {
                        px = scX + scW; py = scY + (dist - scW)
                    } else if (dist < 2 * scW + scH) {
                        px = scX + scW - (dist - scW - scH); py = scY + scH
                    } else {
                        px = scX; py = scY + scH - (dist - 2 * scW - scH)
                    }
                    ctx.beginPath()
                    ctx.arc(px, py, 3, 0, Math.PI * 2)
                    ctx.fill()
                }
            }

            // Plot area
            const plotX = w * 0.48
            const plotY = h * 0.12
            const plotW = w * 0.46
            const plotH = h * 0.7

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.beginPath()
            ctx.roundRect(plotX - 10, plotY - 10, plotW + 20, plotH + 30, 8)
            ctx.fill()

            // Axes
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(plotX, plotY)
            ctx.lineTo(plotX, plotY + plotH)
            ctx.lineTo(plotX + plotW, plotY + plotH)
            ctx.stroke()

            // Center line for LC
            if (circuitType === 'LC') {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
                ctx.beginPath()
                ctx.moveTo(plotX, plotY + plotH / 2)
                ctx.lineTo(plotX + plotW, plotY + plotH / 2)
                ctx.stroke()
            }

            // Plot current
            if (historyRef.current.length > 1) {
                const maxI = circuitType === 'RL' ? voltage / resistance : capF * voltage * omegaLC
                const maxV = voltage

                // Current trace
                ctx.strokeStyle = 'rgba(100, 180, 255, 0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                const tWindow = circuitType === 'RL' ? tauRL * 6 : periodLC * 3
                historyRef.current.forEach((pt, i) => {
                    const px = plotX + (pt.t / tWindow) * plotW
                    let py: number
                    if (circuitType === 'RL') {
                        py = plotY + plotH - (pt.I / (maxI * 1.2)) * plotH
                    } else {
                        py = plotY + plotH / 2 - (pt.I / (maxI * 1.3)) * (plotH / 2)
                    }
                    if (px > plotX + plotW) return
                    if (i === 0) ctx.moveTo(px, py)
                    else ctx.lineTo(px, py)
                })
                ctx.stroke()

                // Voltage trace
                if (showVoltages) {
                    ctx.strokeStyle = 'rgba(255, 160, 80, 0.7)'
                    ctx.lineWidth = 1.5
                    ctx.setLineDash([4, 3])
                    ctx.beginPath()
                    historyRef.current.forEach((pt, i) => {
                        const px = plotX + (pt.t / tWindow) * plotW
                        let py: number
                        if (circuitType === 'RL') {
                            const VL = voltage - pt.I * resistance
                            py = plotY + plotH - (VL / (maxV * 1.2)) * plotH
                        } else {
                            py = plotY + plotH / 2 - (pt.V / (maxV * 1.3)) * (plotH / 2)
                        }
                        if (px > plotX + plotW) return
                        if (i === 0) ctx.moveTo(px, py)
                        else ctx.lineTo(px, py)
                    })
                    ctx.stroke()
                    ctx.setLineDash([])
                }

                // Time constant markers for RL
                if (circuitType === 'RL') {
                    for (let n = 1; n <= 5; n++) {
                        const tx = plotX + (n * tauRL / tWindow) * plotW
                        if (tx > plotX + plotW) break
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
                        ctx.lineWidth = 1
                        ctx.setLineDash([3, 3])
                        ctx.beginPath()
                        ctx.moveTo(tx, plotY)
                        ctx.lineTo(tx, plotY + plotH)
                        ctx.stroke()
                        ctx.setLineDash([])
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
                        ctx.font = '9px system-ui'
                        ctx.textAlign = 'center'
                        ctx.fillText(`${n}T`, tx, plotY + plotH + 12)
                    }
                }
            }

            // Legend
            ctx.fillStyle = 'rgba(100, 180, 255, 0.8)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('-- I(t)', plotX + 10, plotY + 15)
            if (showVoltages) {
                ctx.fillStyle = 'rgba(255, 160, 80, 0.7)'
                ctx.fillText('-- V(t)', plotX + 70, plotY + 15)
            }

            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.textAlign = 'center'
            ctx.fillText('t', plotX + plotW, plotY + plotH + 12)
            ctx.textAlign = 'left'
            ctx.fillText(circuitType === 'RL' ? 'I, V' : 'I, Vc', plotX - 5, plotY - 5)

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [isRunning, circuitType, resistance, inductance, capacitance, voltage, showVoltages, tauRL, omegaLC, periodLC, capF])

    const currentNow = stateRef.current.I

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0d0a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full block" />

                <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
                    <APTag course="Physics C: E&M" unit="Unit 3" color={PHYS_COLOR} />
                    <InfoPanel
                        title="Circuit Data"
                        departmentColor={PHYS_COLOR}
                        items={[
                            { label: 'Current I', value: (currentNow * 1000).toFixed(2), unit: 'mA' },
                            { label: circuitType === 'RL' ? 'Tau (L/R)' : 'Period T', value: circuitType === 'RL' ? (tauRL * 1000).toFixed(2) : (periodLC * 1000).toFixed(2), unit: 'ms' },
                            { label: circuitType === 'RL' ? 'I_max (V/R)' : 'w (1/sqrt(LC))', value: circuitType === 'RL' ? ((voltage / resistance) * 1000).toFixed(2) : omegaLC.toFixed(1), unit: circuitType === 'RL' ? 'mA' : 'rad/s' },
                            { label: 'Time', value: (stateRef.current.t * 1000).toFixed(1), unit: 'ms' },
                        ]}
                    />
                    <EquationDisplay
                        departmentColor={PHYS_COLOR}
                        title={circuitType === 'RL' ? 'RL Circuit' : 'LC Circuit'}
                        equations={circuitType === 'RL' ? [
                            { label: 'Current', expression: 'I(t) = (V/R)(1 - e^(-Rt/L))', description: 'Exponential rise to V/R' },
                            { label: 'Time const', expression: 'tau = L/R', description: 'Time to reach 63.2% of max' },
                            { label: 'V_L', expression: 'V_L = L * dI/dt = V*e^(-t/tau)' },
                            { label: 'Energy', expression: 'U_L = (1/2)LI^2' },
                        ] : [
                            { label: 'Charge', expression: 'q(t) = Q0 * cos(wt)', description: 'Sinusoidal oscillation' },
                            { label: 'Frequency', expression: 'w = 1/sqrt(LC)' },
                            { label: 'Current', expression: 'I = -dq/dt = Q0*w*sin(wt)' },
                            { label: 'Energy', expression: 'U = (1/2)CV^2 + (1/2)LI^2 = const' },
                        ]}
                    />
                </div>

                <div className="absolute top-4 right-4 z-10">
                    <ControlPanel>
                        <ControlGroup label="Simulation">
                            <div className="flex gap-2">
                                <Button onClick={() => { if (!isRunning) { reset(); setTimeout(() => setIsRunning(true), 50) } else setIsRunning(false) }} variant={isRunning ? 'secondary' : 'primary'}>
                                    {isRunning ? 'Pause' : 'Start'}
                                </Button>
                                <Button onClick={reset} variant="secondary">Reset</Button>
                            </div>
                        </ControlGroup>
                        <ButtonGroup
                            label="Circuit Type"
                            value={circuitType}
                            onChange={v => { setCircuitType(v as CircuitType); reset() }}
                            options={[
                                { value: 'RL', label: 'RL Circuit' },
                                { value: 'LC', label: 'LC Circuit' },
                            ]}
                            color={PHYS_COLOR}
                        />
                        <Slider label={`Voltage (${voltage} V)`} value={voltage} onChange={v => setVoltage(Math.round(v))} min={1} max={24} step={1} />
                        <Slider label={`Inductance (${inductance} H)`} value={inductance} onChange={setInductance} min={0.01} max={2} step={0.01} />
                        {circuitType === 'RL' ? (
                            <Slider label={`Resistance (${resistance} Ohm)`} value={resistance} onChange={v => setResistance(Math.round(v))} min={10} max={500} step={10} />
                        ) : (
                            <Slider label={`Capacitance (${capacitance} uF)`} value={capacitance} onChange={v => setCapacitance(Math.round(v))} min={1} max={500} step={1} />
                        )}
                        <Toggle label="Show Voltage Trace" value={showVoltages} onChange={setShowVoltages} />
                        <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
                    </ControlPanel>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <DemoMode
                        steps={demoSteps}
                        currentStep={demo.currentStep}
                        isOpen={demo.isOpen}
                        onClose={demo.close}
                        onNext={demo.next}
                        onPrev={demo.prev}
                        onGoToStep={demo.goToStep}
                        departmentColor={PHYS_COLOR}
                    />
                </div>
            </div>
        </div>
    )
}
