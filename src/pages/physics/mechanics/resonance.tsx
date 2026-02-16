import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const PHYS_COLOR = 'rgb(160, 100, 255)'

export default function Resonance() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const stateRef = useRef({ x: 0, v: 0, t: 0 })
    const historyRef = useRef<Array<{ t: number; x: number }>>([])

    const [isRunning, setIsRunning] = useState(false)
    const [driveFreq, setDriveFreq] = useState(3.0)
    const [naturalFreq, setNaturalFreq] = useState(3.16)
    const [damping, setDamping] = useState(0.3)
    const [driveAmp, setDriveAmp] = useState(5.0)
    const [showResponse, setShowResponse] = useState('both')

    const k = naturalFreq * naturalFreq
    const mass = 1.0

    const reset = useCallback(() => {
        stateRef.current = { x: 30, v: 0, t: 0 }
        historyRef.current = []
        setIsRunning(false)
        if (animRef.current) cancelAnimationFrame(animRef.current)
    }, [])

    const steadyStateAmplitude = useCallback((omega: number): number => {
        const w0sq = k
        const denom = Math.sqrt((w0sq - omega * omega) ** 2 + (damping * omega) ** 2)
        return denom > 0.01 ? driveAmp / denom : driveAmp / 0.01
    }, [k, damping, driveAmp])

    const demoSteps: DemoStep[] = [
        {
            title: 'What is Resonance?',
            description: 'When a driven oscillator is pushed at its natural frequency, amplitude grows dramatically. This is resonance -- the driving frequency matches the system\'s preferred oscillation frequency.',
            setup: () => { reset(); setDriveFreq(3.16); setNaturalFreq(3.16); setDamping(0.3) },
        },
        {
            title: 'Natural Frequency',
            description: 'Every spring-mass system has a natural frequency w0 = sqrt(k/m). This is the frequency it oscillates at when displaced and released without driving or damping.',
            setup: () => { setNaturalFreq(3.16); setDamping(0.1) },
        },
        {
            title: 'Below Resonance',
            description: 'When the driving frequency is well below w0, the mass follows the driving force almost in phase. The amplitude is moderate and nearly constant.',
            setup: () => { setDriveFreq(1.0); setDamping(0.3); setIsRunning(true) },
        },
        {
            title: 'At Resonance',
            description: 'When w = w0, maximum energy transfer occurs. The amplitude peaks dramatically. With low damping, the amplitude can become very large -- this is why soldiers break step on bridges!',
            setup: () => { setDriveFreq(3.16); setDamping(0.3); setIsRunning(true) },
        },
        {
            title: 'Above Resonance',
            description: 'When the driving frequency is well above w0, the mass cannot keep up. It oscillates nearly 180 degrees out of phase with the driving force, and amplitude drops.',
            setup: () => { setDriveFreq(6.0); setDamping(0.3); setIsRunning(true) },
        },
        {
            title: 'Damping Effects',
            description: 'Higher damping broadens the resonance peak and reduces the maximum amplitude. Critical damping (b = 2*sqrt(km)) eliminates oscillation entirely.',
            setup: () => { setDriveFreq(3.16); setDamping(1.5); setIsRunning(true) },
        },
        {
            title: 'Response Curve',
            description: 'The amplitude vs frequency response curve shows the resonance peak. Observe how damping affects the peak height and width. The Q-factor measures the sharpness of resonance.',
            setup: () => { setShowResponse('both'); setDamping(0.3); setDriveFreq(3.16) },
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
            const dt = Math.min((now - lastTime) / 1000, 0.05)
            lastTime = now

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            if (isRunning) {
                const s = stateRef.current
                const Fs = -k * s.x
                const Fd = -damping * s.v
                const Fext = driveAmp * Math.cos(driveFreq * s.t)
                const a = (Fs + Fd + Fext) / mass
                s.v += a * dt
                s.x += s.v * dt
                s.t += dt

                if (historyRef.current.length === 0 || s.t - historyRef.current[historyRef.current.length - 1].t > 0.03) {
                    historyRef.current.push({ t: s.t, x: s.x })
                    if (historyRef.current.length > 300) historyRef.current.shift()
                }
            }

            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = '#0d0a1a'
            ctx.fillRect(0, 0, w, h)

            const cx = w * 0.35
            const cy = h * 0.4
            const xPx = stateRef.current.x * 2.5

            // Wall
            ctx.fillStyle = 'rgba(160, 100, 255, 0.3)'
            ctx.fillRect(cx - 180, cy - 50, 8, 100)
            for (let i = 0; i < 10; i++) {
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.2)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(cx - 180, cy - 50 + i * 10)
                ctx.lineTo(cx - 188, cy - 45 + i * 10)
                ctx.stroke()
            }

            // Spring coils
            ctx.beginPath()
            ctx.moveTo(cx - 172, cy)
            const springEnd = cx + xPx - 25
            const coils = 16
            for (let i = 0; i <= coils; i++) {
                const px = cx - 172 + (i / coils) * (springEnd - (cx - 172))
                const py = cy + (i % 2 === 0 ? -12 : 12) * (i === 0 || i === coils ? 0 : 1)
                ctx.lineTo(px, py)
            }
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
            ctx.lineWidth = 2.5
            ctx.stroke()

            // Mass block
            const massX = cx + xPx
            const gradient = ctx.createLinearGradient(massX - 22, cy - 22, massX + 22, cy + 22)
            gradient.addColorStop(0, 'rgba(160, 100, 255, 0.8)')
            gradient.addColorStop(1, 'rgba(100, 60, 200, 0.6)')
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.roundRect(massX - 22, cy - 22, 44, 44, 6)
            ctx.fill()
            ctx.strokeStyle = 'rgba(200, 160, 255, 0.5)'
            ctx.lineWidth = 1.5
            ctx.stroke()
            ctx.fillStyle = 'white'
            ctx.font = 'bold 14px system-ui'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('m', massX, cy)

            // Equilibrium line
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.moveTo(cx, cy - 60)
            ctx.lineTo(cx, cy + 60)
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,255,255,0.2)'
            ctx.font = '10px system-ui'
            ctx.fillText('x=0', cx, cy + 75)

            // Driving force arrow
            const fPhase = Math.cos(driveFreq * stateRef.current.t)
            const arrowLen = fPhase * 40
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)'
            ctx.lineWidth = 2.5
            ctx.beginPath()
            ctx.moveTo(massX + 30, cy)
            ctx.lineTo(massX + 30 + arrowLen, cy)
            ctx.stroke()
            if (Math.abs(arrowLen) > 5) {
                const dir = arrowLen > 0 ? 1 : -1
                ctx.beginPath()
                ctx.moveTo(massX + 30 + arrowLen, cy)
                ctx.lineTo(massX + 30 + arrowLen - dir * 8, cy - 5)
                ctx.lineTo(massX + 30 + arrowLen - dir * 8, cy + 5)
                ctx.closePath()
                ctx.fillStyle = 'rgba(100, 200, 255, 0.7)'
                ctx.fill()
            }
            ctx.fillStyle = 'rgba(100, 200, 255, 0.6)'
            ctx.font = '11px system-ui'
            ctx.fillText('F(t)', massX + 30, cy - 12)

            // Resonance indicator
            const ratio = driveFreq / naturalFreq
            if (Math.abs(ratio - 1.0) < 0.08) {
                ctx.fillStyle = 'rgba(255, 80, 80, 0.9)'
                ctx.font = 'bold 16px system-ui'
                ctx.fillText('RESONANCE', cx, cy - 80)
                const glow = ctx.createRadialGradient(massX, cy, 0, massX, cy, 60)
                glow.addColorStop(0, 'rgba(255, 80, 80, 0.15)')
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath()
                ctx.arc(massX, cy, 60, 0, Math.PI * 2)
                ctx.fill()
            }

            // Time-domain plot
            if (showResponse === 'time' || showResponse === 'both') {
                const gx = 40
                const gy = h * 0.75
                const gw = w * 0.4
                const gh = h * 0.18

                ctx.fillStyle = 'rgba(0,0,0,0.3)'
                ctx.beginPath()
                ctx.roundRect(gx - 10, gy - gh - 10, gw + 20, gh * 2 + 30, 8)
                ctx.fill()

                ctx.strokeStyle = 'rgba(255,255,255,0.15)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(gx, gy - gh)
                ctx.lineTo(gx, gy + gh)
                ctx.moveTo(gx, gy)
                ctx.lineTo(gx + gw, gy)
                ctx.stroke()

                ctx.fillStyle = 'rgba(255,255,255,0.3)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText('x(t)', gx + 5, gy - gh + 5)

                if (historyRef.current.length > 1) {
                    ctx.strokeStyle = 'rgba(160, 100, 255, 0.8)'
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    historyRef.current.forEach((pt, i) => {
                        const px = gx + (i / historyRef.current.length) * gw
                        const py = gy - (pt.x / 80) * gh
                        if (i === 0) ctx.moveTo(px, py)
                        else ctx.lineTo(px, py)
                    })
                    ctx.stroke()
                }

                ctx.fillStyle = 'rgba(255,255,255,0.2)'
                ctx.textAlign = 'center'
                ctx.fillText('Position vs Time', gx + gw / 2, gy + gh + 15)
            }

            // Frequency response curve
            if (showResponse === 'response' || showResponse === 'both') {
                const rx = w * 0.55
                const ry = h * 0.75
                const rw = w * 0.38
                const rh = h * 0.3

                ctx.fillStyle = 'rgba(0,0,0,0.3)'
                ctx.beginPath()
                ctx.roundRect(rx - 10, ry - rh - 10, rw + 20, rh + 30, 8)
                ctx.fill()

                ctx.strokeStyle = 'rgba(255,255,255,0.15)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(rx, ry - rh)
                ctx.lineTo(rx, ry)
                ctx.lineTo(rx + rw, ry)
                ctx.stroke()

                const maxOmega = naturalFreq * 3
                const maxAmp = steadyStateAmplitude(naturalFreq)

                ctx.strokeStyle = 'rgba(160, 100, 255, 0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                for (let i = 0; i <= 200; i++) {
                    const omega = (i / 200) * maxOmega
                    const amp = steadyStateAmplitude(omega)
                    const px = rx + (omega / maxOmega) * rw
                    const py = ry - (amp / (maxAmp * 1.2)) * rh
                    if (i === 0) ctx.moveTo(px, py)
                    else ctx.lineTo(px, py)
                }
                ctx.stroke()

                // Current driving freq marker
                const markerX = rx + (driveFreq / maxOmega) * rw
                const markerAmp = steadyStateAmplitude(driveFreq)
                const markerY = ry - (markerAmp / (maxAmp * 1.2)) * rh

                ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
                ctx.beginPath()
                ctx.arc(markerX, markerY, 5, 0, Math.PI * 2)
                ctx.fill()

                ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)'
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(markerX, markerY)
                ctx.lineTo(markerX, ry)
                ctx.stroke()
                ctx.setLineDash([])

                // Natural frequency marker
                const w0X = rx + (naturalFreq / maxOmega) * rw
                ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)'
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(w0X, ry - rh)
                ctx.lineTo(w0X, ry)
                ctx.stroke()
                ctx.setLineDash([])

                ctx.fillStyle = 'rgba(100, 255, 100, 0.5)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('w0', w0X, ry + 12)

                ctx.fillStyle = 'rgba(255,255,255,0.3)'
                ctx.fillText('Amplitude vs Driving Frequency', rx + rw / 2, ry + 25)
                ctx.textAlign = 'left'
                ctx.fillText('A', rx - 8, ry - rh + 5)
                ctx.textAlign = 'center'
                ctx.fillText('w', rx + rw, ry + 12)
            }

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [isRunning, driveFreq, naturalFreq, damping, driveAmp, k, showResponse, steadyStateAmplitude])

    const qFactor = naturalFreq / (damping > 0.01 ? damping : 0.01)
    const ampAtDrive = steadyStateAmplitude(driveFreq)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0d0a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full block" />

                <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
                    <APTag course="Physics C: Mech" unit="Unit 2" color={PHYS_COLOR} />
                    <InfoPanel
                        title="Oscillator State"
                        departmentColor={PHYS_COLOR}
                        items={[
                            { label: 'Displacement x', value: stateRef.current.x.toFixed(2), unit: 'm' },
                            { label: 'Driving w', value: driveFreq.toFixed(2), unit: 'rad/s' },
                            { label: 'Natural w0', value: naturalFreq.toFixed(2), unit: 'rad/s' },
                            { label: 'Q Factor', value: qFactor.toFixed(1) },
                            { label: 'Steady-state A', value: ampAtDrive.toFixed(2), unit: 'm' },
                        ]}
                    />
                    <EquationDisplay
                        departmentColor={PHYS_COLOR}
                        title="Driven Oscillation"
                        equations={[
                            { label: 'EOM', expression: "x'' + (b/m)x' + (k/m)x = (F0/m)cos(wt)", description: 'Driven damped harmonic oscillator' },
                            { label: 'Resonance', expression: 'w_res = w0 = sqrt(k/m)', description: 'Maximum amplitude when w = w0' },
                            { label: 'Amplitude', expression: 'A = F0 / sqrt((w0^2-w^2)^2 + (bw)^2)' },
                            { label: 'Q Factor', expression: 'Q = w0 / b', description: 'Sharpness of resonance peak' },
                        ]}
                    />
                </div>

                <div className="absolute top-4 right-4 z-10">
                    <ControlPanel>
                        <ControlGroup label="Simulation">
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        if (!isRunning) { stateRef.current = { x: 30, v: 0, t: 0 }; historyRef.current = [] }
                                        setIsRunning(!isRunning)
                                    }}
                                    variant={isRunning ? 'secondary' : 'primary'}
                                >
                                    {isRunning ? 'Pause' : 'Start'}
                                </Button>
                                <Button onClick={reset} variant="secondary">Reset</Button>
                            </div>
                        </ControlGroup>
                        <Slider label="Driving Frequency w" value={driveFreq} onChange={setDriveFreq} min={0.5} max={10} step={0.05} />
                        <Slider label="Natural Frequency w0" value={naturalFreq} onChange={v => { setNaturalFreq(v) }} min={0.5} max={10} step={0.05} />
                        <Slider label="Damping b" value={damping} onChange={setDamping} min={0.01} max={3} step={0.01} />
                        <Slider label="Drive Amplitude F0" value={driveAmp} onChange={setDriveAmp} min={0} max={20} step={0.5} />
                        <ButtonGroup
                            label="Display"
                            value={showResponse}
                            onChange={setShowResponse}
                            options={[
                                { value: 'time', label: 'Time' },
                                { value: 'response', label: 'Response' },
                                { value: 'both', label: 'Both' },
                            ]}
                            color={PHYS_COLOR}
                        />
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
