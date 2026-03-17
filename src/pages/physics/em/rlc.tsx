import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const PURPLE = 'rgb(160, 100, 255)'

export default function RLC() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [resistance, setResistance] = useState(10)
    const [inductance, setInductance] = useState(0.1)
    const [capacitance, setCapacitance] = useState(100)
    const [frequency, setFrequency] = useState(50)
    const [isRunning, setIsRunning] = useState(true)
    const [showImpedancePlot, setShowImpedancePlot] = useState(false)
    const [showPowerPlot, setShowPowerPlot] = useState(false)

    const V_max_source = 100
    const timeRef = useRef(0)
    const animRef = useRef<number>(0)

    const omega = 2 * Math.PI * frequency
    const XL = omega * inductance
    const XC = 1 / (omega * (capacitance * 1e-6))
    const Z = Math.sqrt(resistance * resistance + (XL - XC) * (XL - XC))
    const phase = Math.atan2(XL - XC, resistance)
    const f0 = 1 / (2 * Math.PI * Math.sqrt(inductance * capacitance * 1e-6))
    const omega0 = 2 * Math.PI * f0
    const Q = omega0 * inductance / resistance
    const powerFactor = Math.cos(phase)

    const reset = useCallback(() => {
        timeRef.current = 0
        setResistance(10)
        setInductance(0.1)
        setCapacitance(100)
        setFrequency(50)
        setIsRunning(true)
        setShowImpedancePlot(false)
        setShowPowerPlot(false)
    }, [])

    const demoSteps: DemoStep[] = useMemo(() => [
        {
            title: 'RLC Circuit Basics',
            description: 'A series RLC circuit has a resistor (R), inductor (L), and capacitor (C) driven by an AC voltage source. Current and voltage have phase relationships determined by component values.',
            setup: () => { reset() },
        },
        {
            title: 'Impedance',
            description: 'Impedance Z = sqrt(R^2 + (X_L - X_C)^2) is the AC equivalent of resistance. It determines the current amplitude I = V/Z. Increase R to see Z rise.',
            setup: () => { reset(); setResistance(30); setFrequency(50) },
        },
        {
            title: 'Resonance',
            description: 'At resonance, X_L = X_C and impedance is minimized to just R. Current is maximum and in phase with voltage. Watch the phasor diagram align.',
            setup: () => { reset(); setFrequency(Math.round(1 / (2 * Math.PI * Math.sqrt(0.1 * 100e-6)))) },
        },
        {
            title: 'Quality Factor',
            description: 'Q = omega_0 L / R measures the sharpness of resonance. Low R gives high Q (sharp peak). Try lowering R to see Q increase.',
            setup: () => { reset(); setResistance(3); setFrequency(Math.round(1 / (2 * Math.PI * Math.sqrt(0.1 * 100e-6)))) },
        },
        {
            title: 'Power & Dissipation',
            description: 'Average power P = (1/2) V I cos(phi). At resonance cos(phi) = 1, so power transfer is maximized. Toggle the power plot to see.',
            setup: () => { reset(); setShowPowerPlot(true); setFrequency(Math.round(1 / (2 * Math.PI * Math.sqrt(0.1 * 100e-6)))) },
        },
        {
            title: 'Phasor Diagram',
            description: 'V_R is in phase with current, V_L leads by 90 deg, V_C lags by 90 deg. The total voltage phasor is the vector sum. Observe how phase changes with frequency.',
            setup: () => { reset(); setFrequency(50) },
        },
        {
            title: 'Frequency Response',
            description: 'Toggle the impedance plot to see how Z varies with frequency. The dip at f_0 shows the resonance minimum. The current marker tracks your frequency.',
            setup: () => { reset(); setShowImpedancePlot(true); setFrequency(50) },
        },
        {
            title: 'Experiment',
            description: 'Adjust R, L, C, and frequency freely. Toggle impedance and power plots. Try to find resonance and maximize current!',
            setup: () => { reset() },
        },
    ], [reset])

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

            if (isRunning) timeRef.current += dt
            const t = timeRef.current

            const localOmega = 2 * Math.PI * frequency
            const localXL = localOmega * inductance
            const localXC = 1 / (localOmega * (capacitance * 1e-6))
            const localZ = Math.sqrt(resistance * resistance + (localXL - localXC) * (localXL - localXC))
            const localPhase = Math.atan2(localXL - localXC, resistance)
            const localIMax = V_max_source / localZ

            const angle = localOmega * t

            // --- PHASOR DIAGRAM ---
            const phasorAreaW = showImpedancePlot || showPowerPlot ? w * 0.35 : w * 0.4
            const cx = phasorAreaW / 2
            const cy = h * 0.4
            const scale = Math.min(1.5, phasorAreaW / 250)

            // Phasor axes
            ctx.strokeStyle = 'rgba(255,255,255,0.12)'
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.moveTo(cx - 130, cy)
            ctx.lineTo(cx + 130, cy)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(cx, cy - 130)
            ctx.lineTo(cx, cy + 130)
            ctx.stroke()
            ctx.setLineDash([])

            const drawPhasor = (mag: number, ang: number, color: string, label: string) => {
                const ex = cx + Math.cos(ang) * mag * scale
                const ey = cy - Math.sin(ang) * mag * scale
                ctx.strokeStyle = color
                ctx.lineWidth = 2.5
                ctx.beginPath()
                ctx.moveTo(cx, cy)
                ctx.lineTo(ex, ey)
                ctx.stroke()

                // Arrowhead
                const headAngle = Math.atan2(-(ey - cy), ex - cx)
                ctx.fillStyle = color
                ctx.beginPath()
                ctx.moveTo(ex, ey)
                ctx.lineTo(ex - 8 * Math.cos(headAngle - 0.3), ey + 8 * Math.sin(headAngle - 0.3))
                ctx.lineTo(ex - 8 * Math.cos(headAngle + 0.3), ey + 8 * Math.sin(headAngle + 0.3))
                ctx.closePath()
                ctx.fill()

                ctx.font = '11px sans-serif'
                ctx.fillStyle = color
                ctx.textAlign = 'left'
                ctx.fillText(label, ex + 8, ey - 4)
            }

            const VR = localIMax * resistance
            const VL = localIMax * localXL
            const VC = localIMax * localXC
            const VMag = localIMax * localZ

            drawPhasor(VR, angle, '#4ade80', `V_R = ${VR.toFixed(1)}V`)
            drawPhasor(VL, angle + Math.PI / 2, '#ef4444', `V_L = ${VL.toFixed(1)}V`)
            drawPhasor(VC, angle - Math.PI / 2, '#3b82f6', `V_C = ${VC.toFixed(1)}V`)
            drawPhasor(VMag, angle + localPhase, '#fbbf24', `V_tot = ${VMag.toFixed(1)}V`)

            // Current reference (smaller scale)
            const IScale = localIMax * 8
            drawPhasor(IScale, angle, 'rgba(255,255,255,0.6)', `I = ${localIMax.toFixed(2)}A`)

            // Resonance marker
            const localF0 = 1 / (2 * Math.PI * Math.sqrt(inductance * capacitance * 1e-6))
            if (Math.abs(frequency - localF0) < 3) {
                ctx.fillStyle = '#fbbf24'
                ctx.font = 'bold 13px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('AT RESONANCE', cx, 25)
            }

            // --- WAVEFORM PLOT ---
            const gx = phasorAreaW + 30
            const gy = h * 0.4
            const gw = (showImpedancePlot || showPowerPlot ? w * 0.3 : w - phasorAreaW - 60)
            const gScale = 0.5

            ctx.fillStyle = 'rgba(0,0,0,0.3)'
            ctx.fillRect(gx - 10, gy - 80, gw + 20, 170)

            // Zero line
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(gx, gy)
            ctx.lineTo(gx + gw, gy)
            ctx.stroke()

            // Voltage waveform
            ctx.strokeStyle = '#fbbf24'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let x = 0; x < gw; x++) {
                const localT = t - (gw - x) * 0.0005
                const v = V_max_source * Math.sin(localOmega * localT + localPhase)
                const y = gy - v * gScale
                if (x === 0) ctx.moveTo(gx + x, y)
                else ctx.lineTo(gx + x, y)
            }
            ctx.stroke()

            // Current waveform
            ctx.strokeStyle = 'rgba(255,255,255,0.8)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            for (let x = 0; x < gw; x++) {
                const localT = t - (gw - x) * 0.0005
                const i = localIMax * Math.sin(localOmega * localT)
                const y = gy - i * 5
                if (x === 0) ctx.moveTo(gx + x, y)
                else ctx.lineTo(gx + x, y)
            }
            ctx.stroke()

            ctx.font = '10px sans-serif'
            ctx.fillStyle = '#fbbf24'
            ctx.textAlign = 'left'
            ctx.fillText('V(t)', gx + 5, gy - 65)
            ctx.fillStyle = 'rgba(255,255,255,0.7)'
            ctx.fillText('I(t)', gx + 5, gy - 50)
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.textAlign = 'center'
            ctx.fillText('Voltage & Current Waveforms', gx + gw / 2, gy + 95)

            // --- IMPEDANCE VS FREQUENCY PLOT ---
            if (showImpedancePlot) {
                const ipx = w * 0.68
                const ipy = h * 0.75
                const ipw = w * 0.28
                const iph = h * 0.5

                ctx.fillStyle = 'rgba(0,0,0,0.4)'
                ctx.fillRect(ipx - 10, ipy - iph - 10, ipw + 20, iph + 30)

                const fMin = 10
                const fMax = 200
                let maxZ = 0
                for (let i = 0; i <= 200; i++) {
                    const ff = fMin + (i / 200) * (fMax - fMin)
                    const ww = 2 * Math.PI * ff
                    const xl = ww * inductance
                    const xc = 1 / (ww * (capacitance * 1e-6))
                    const zz = Math.sqrt(resistance * resistance + (xl - xc) * (xl - xc))
                    if (zz > maxZ) maxZ = zz
                }

                ctx.strokeStyle = PURPLE
                ctx.lineWidth = 2
                ctx.beginPath()
                for (let i = 0; i <= 200; i++) {
                    const ff = fMin + (i / 200) * (fMax - fMin)
                    const ww = 2 * Math.PI * ff
                    const xl = ww * inductance
                    const xc = 1 / (ww * (capacitance * 1e-6))
                    const zz = Math.sqrt(resistance * resistance + (xl - xc) * (xl - xc))
                    const px = ipx + (i / 200) * ipw
                    const py = ipy - (zz / maxZ) * iph * 0.9
                    if (i === 0) ctx.moveTo(px, py)
                    else ctx.lineTo(px, py)
                }
                ctx.stroke()

                const resX = ipx + ((localF0 - fMin) / (fMax - fMin)) * ipw
                ctx.strokeStyle = 'rgba(251,191,36,0.5)'
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(resX, ipy)
                ctx.lineTo(resX, ipy - iph)
                ctx.stroke()
                ctx.setLineDash([])

                const curX = ipx + ((frequency - fMin) / (fMax - fMin)) * ipw
                ctx.strokeStyle = '#ef4444'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(curX, ipy)
                ctx.lineTo(curX, ipy - iph)
                ctx.stroke()

                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '11px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('|Z| vs Frequency', ipx + ipw / 2, ipy + 12)
                ctx.fillStyle = 'rgba(251,191,36,0.6)'
                ctx.font = '9px sans-serif'
                ctx.fillText(`f_0=${localF0.toFixed(0)}Hz`, resX, ipy - iph - 4)
            }

            // --- POWER PLOT ---
            if (showPowerPlot) {
                const ppx = w * 0.68
                const ppy = h * 0.75
                const ppw = w * 0.28
                const pph = h * 0.5

                ctx.fillStyle = 'rgba(0,0,0,0.4)'
                ctx.fillRect(ppx - 10, ppy - pph - 10, ppw + 20, pph + 30)

                const fMin = 10
                const fMax = 200
                let maxP = 0
                for (let i = 0; i <= 200; i++) {
                    const ff = fMin + (i / 200) * (fMax - fMin)
                    const ww = 2 * Math.PI * ff
                    const xl = ww * inductance
                    const xc = 1 / (ww * (capacitance * 1e-6))
                    const zz = Math.sqrt(resistance * resistance + (xl - xc) * (xl - xc))
                    const iMax = V_max_source / zz
                    const phi = Math.atan2(xl - xc, resistance)
                    const pAvg = 0.5 * V_max_source * iMax * Math.cos(phi)
                    if (pAvg > maxP) maxP = pAvg
                }

                ctx.strokeStyle = '#4ade80'
                ctx.lineWidth = 2
                ctx.beginPath()
                for (let i = 0; i <= 200; i++) {
                    const ff = fMin + (i / 200) * (fMax - fMin)
                    const ww = 2 * Math.PI * ff
                    const xl = ww * inductance
                    const xc = 1 / (ww * (capacitance * 1e-6))
                    const zz = Math.sqrt(resistance * resistance + (xl - xc) * (xl - xc))
                    const iMax = V_max_source / zz
                    const phi = Math.atan2(xl - xc, resistance)
                    const pAvg = 0.5 * V_max_source * iMax * Math.cos(phi)
                    const px = ppx + (i / 200) * ppw
                    const py = ppy - (pAvg / (maxP || 1)) * pph * 0.9
                    if (i === 0) ctx.moveTo(px, py)
                    else ctx.lineTo(px, py)
                }
                ctx.stroke()

                const curX = ppx + ((frequency - fMin) / (fMax - fMin)) * ppw
                ctx.strokeStyle = '#ef4444'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(curX, ppy)
                ctx.lineTo(curX, ppy - pph)
                ctx.stroke()

                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '11px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('Avg Power vs Frequency', ppx + ppw / 2, ppy + 12)
            }

            // --- CIRCUIT DIAGRAM (bottom left) ---
            const cdx = 30
            const cdy = h - 60
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'
            ctx.lineWidth = 1.5
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'center'

            ctx.beginPath()
            ctx.moveTo(cdx, cdy)
            ctx.lineTo(cdx + 60, cdy)
            ctx.stroke()
            ctx.fillStyle = '#4ade80'
            ctx.fillText('R', cdx + 30, cdy - 8)

            ctx.beginPath()
            ctx.moveTo(cdx + 60, cdy)
            ctx.lineTo(cdx + 120, cdy)
            ctx.stroke()
            ctx.fillStyle = '#ef4444'
            ctx.fillText('L', cdx + 90, cdy - 8)

            ctx.beginPath()
            ctx.moveTo(cdx + 120, cdy)
            ctx.lineTo(cdx + 180, cdy)
            ctx.stroke()
            ctx.fillStyle = '#3b82f6'
            ctx.fillText('C', cdx + 150, cdy - 8)

            ctx.fillStyle = '#fbbf24'
            ctx.fillText('~V', cdx + 210, cdy - 8)

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [resistance, inductance, capacitance, frequency, isRunning, showImpedancePlot, showPowerPlot, V_max_source])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0f0a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full block" />

                {/* Controls — top-left */}
                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Circuit Components">
                            <Slider label={`R = ${resistance} \u03A9`} value={resistance} onChange={setResistance} min={1} max={100} step={1} />
                            <Slider label={`L = ${inductance.toFixed(2)} H`} value={inductance} onChange={setInductance} min={0.01} max={0.5} step={0.01} />
                            <Slider label={`C = ${capacitance} \u03BCF`} value={capacitance} onChange={setCapacitance} min={10} max={500} step={10} />
                        </ControlGroup>
                        <ControlGroup label="AC Source">
                            <Slider label={`f = ${frequency} Hz`} value={frequency} onChange={setFrequency} min={10} max={200} step={1} />
                            <p className="text-xs text-purple-400">Resonance at f\u2080 = {f0.toFixed(1)} Hz</p>
                            <Button variant="secondary" onClick={() => setFrequency(Math.round(f0))}>Set to Resonance</Button>
                        </ControlGroup>
                        <ControlGroup label="Plots">
                            <Toggle label="Impedance vs f" value={showImpedancePlot} onChange={setShowImpedancePlot} />
                            <Toggle label="Power vs f" value={showPowerPlot} onChange={setShowPowerPlot} />
                        </ControlGroup>
                        <div className="flex gap-2 flex-wrap">
                            <Button onClick={() => setIsRunning(!isRunning)} variant={isRunning ? 'secondary' : 'primary'}>
                                {isRunning ? 'Pause' : 'Play'}
                            </Button>
                            <Button variant="secondary" onClick={reset}>Reset</Button>
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Physics C: E&M" unit="Unit 4" color={PURPLE} />
                </div>

                {/* Info + Equations — top-right */}
                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={PURPLE} title="Circuit Values" items={[
                        { label: 'Impedance Z', value: `${Z.toFixed(1)}`, unit: '\u03A9' },
                        { label: 'Resonant \u03C9\u2080', value: `${omega0.toFixed(1)}`, unit: 'rad/s' },
                        { label: 'Q-Factor', value: Q.toFixed(2), color: Q > 5 ? '#4ade80' : undefined },
                        { label: 'Phase Angle', value: `${(phase * 180 / Math.PI).toFixed(1)}`, unit: 'deg' },
                        { label: 'Power Factor', value: powerFactor.toFixed(3) },
                    ]} />
                    <EquationDisplay departmentColor={PURPLE} title="RLC Equations" collapsed equations={[
                        { label: 'Impedance', expression: 'Z = \u221A(R\u00B2 + (X_L \u2212 X_C)\u00B2)', description: 'Impedance magnitude' },
                        { label: 'Resonance', expression: '\u03C9\u2080 = 1/\u221A(LC)', description: 'Resonant frequency' },
                        { label: 'Q Factor', expression: 'Q = \u03C9\u2080L / R', description: 'Quality factor' },
                    ]} />
                </div>

                {/* Demo — bottom center */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={PURPLE} />
                </div>
            </div>
        </div>
    )
}
