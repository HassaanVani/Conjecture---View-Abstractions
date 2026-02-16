import { useState, useEffect, useRef } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const PHYS_COLOR = 'rgb(160, 100, 255)'

type FieldDisplay = 'E' | 'B' | 'both'

export default function EmWave() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const timeRef = useRef(0)

    const [frequency, setFrequency] = useState(1.5) // visual frequency
    const [amplitude, setAmplitude] = useState(60)
    const [fieldDisplay, setFieldDisplay] = useState<FieldDisplay>('both')
    const [showPoynting, setShowPoynting] = useState(true)
    const [showLabels, setShowLabels] = useState(true)
    const [waveSpeed, setWaveSpeed] = useState(1.0)

    const wavelength = 200 / frequency
    const c = 3e8
    const realFreq = c / (wavelength * 1e-9 * 1e6)

    const reset = () => {
        timeRef.current = 0
        setFrequency(1.5)
        setAmplitude(60)
        setFieldDisplay('both')
        setShowPoynting(true)
        setWaveSpeed(1.0)
    }

    const demoSteps: DemoStep[] = [
        {
            title: 'Electromagnetic Waves',
            description: 'EM waves are oscillating electric and magnetic fields that propagate through space. They require no medium and travel at the speed of light c = 3 x 10^8 m/s.',
            setup: () => { reset(); setFieldDisplay('both') },
        },
        {
            title: 'Electric Field Component',
            description: 'The E-field oscillates in one plane (here, vertical). It is a transverse wave -- the oscillation is perpendicular to the direction of propagation.',
            setup: () => { setFieldDisplay('E'); setAmplitude(60) },
        },
        {
            title: 'Magnetic Field Component',
            description: 'The B-field oscillates perpendicular to both E and the propagation direction. E and B are always in phase and their magnitudes are related by E0/B0 = c.',
            setup: () => { setFieldDisplay('B') },
        },
        {
            title: 'Perpendicularity',
            description: 'E, B, and the propagation direction are mutually perpendicular, forming a right-hand coordinate system. This is a fundamental property of EM waves in free space.',
            setup: () => { setFieldDisplay('both'); setShowLabels(true) },
        },
        {
            title: 'Poynting Vector',
            description: 'The Poynting vector S = (1/mu0) E x B gives the direction and rate of energy flow. It points in the direction of wave propagation. Its magnitude is the intensity.',
            setup: () => { setFieldDisplay('both'); setShowPoynting(true) },
        },
        {
            title: 'Frequency and Wavelength',
            description: 'c = f * lambda. Higher frequency means shorter wavelength. All EM waves travel at c in vacuum, regardless of frequency -- from radio waves to gamma rays.',
            setup: () => { setFrequency(3.0); setFieldDisplay('both') },
        },
        {
            title: 'Speed of Light',
            description: 'c = 1/sqrt(mu0 * epsilon0). The speed of light emerges from the fundamental constants of electromagnetism. Maxwell predicted this, unifying electricity, magnetism, and optics.',
            setup: () => { reset() },
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

        const animate = () => {
            const now = performance.now() / 1000
            timeRef.current += 0.016 * waveSpeed
            const t = timeRef.current

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = '#0d0a1a'
            ctx.fillRect(0, 0, w, h)

            // 3D perspective parameters
            const originX = w * 0.12
            const originY = h * 0.5
            const axisLen = w * 0.72
            const perspScale = 0.35 // depth compression

            // Helper: project 3D point (along propagation, E-plane, B-plane) to 2D
            const project = (z: number, ey: number, bx: number): { x: number; y: number } => {
                const px = originX + z + bx * perspScale
                const py = originY - ey - bx * perspScale * 0.5
                return { x: px, y: py }
            }

            // Draw propagation axis (z-axis)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = 1
            ctx.beginPath()
            const p0 = project(0, 0, 0)
            const p1 = project(axisLen, 0, 0)
            ctx.moveTo(p0.x, p0.y)
            ctx.lineTo(p1.x, p1.y)
            ctx.stroke()

            // Draw E-axis (vertical)
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.15)'
            ctx.beginPath()
            const eUp = project(0, amplitude * 1.3, 0)
            const eDown = project(0, -amplitude * 1.3, 0)
            ctx.moveTo(eUp.x, eUp.y)
            ctx.lineTo(eDown.x, eDown.y)
            ctx.stroke()

            // Draw B-axis (depth)
            ctx.strokeStyle = 'rgba(100, 180, 255, 0.15)'
            ctx.beginPath()
            const bFwd = project(0, 0, amplitude * 1.3)
            const bBack = project(0, 0, -amplitude * 1.3)
            ctx.moveTo(bFwd.x, bFwd.y)
            ctx.lineTo(bBack.x, bBack.y)
            ctx.stroke()

            // Axis labels
            if (showLabels) {
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'

                const zLabel = project(axisLen + 15, 0, 0)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.fillText('z (propagation)', zLabel.x, zLabel.y + 5)

                const eLabel = project(0, amplitude * 1.5, 0)
                ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
                ctx.fillText('E', eLabel.x - 15, eLabel.y)

                const bLabel = project(0, 0, amplitude * 1.5)
                ctx.fillStyle = 'rgba(100, 180, 255, 0.5)'
                ctx.fillText('B', bLabel.x, bLabel.y - 5)
            }

            // Draw E-field wave
            const k = (2 * Math.PI) / wavelength
            const omega = 2 * Math.PI * frequency
            const numPoints = 300

            if (fieldDisplay === 'E' || fieldDisplay === 'both') {
                // Wave surface fill
                ctx.fillStyle = 'rgba(255, 100, 100, 0.04)'
                ctx.beginPath()
                const startP = project(0, 0, 0)
                ctx.moveTo(startP.x, startP.y)
                for (let i = 0; i <= numPoints; i++) {
                    const z = (i / numPoints) * axisLen
                    const eVal = amplitude * Math.sin(k * z - omega * t)
                    const pt = project(z, eVal, 0)
                    ctx.lineTo(pt.x, pt.y)
                }
                const endP = project(axisLen, 0, 0)
                ctx.lineTo(endP.x, endP.y)
                ctx.closePath()
                ctx.fill()

                // Wave line
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.85)'
                ctx.lineWidth = 2.5
                ctx.beginPath()
                for (let i = 0; i <= numPoints; i++) {
                    const z = (i / numPoints) * axisLen
                    const eVal = amplitude * Math.sin(k * z - omega * t)
                    const pt = project(z, eVal, 0)
                    if (i === 0) ctx.moveTo(pt.x, pt.y)
                    else ctx.lineTo(pt.x, pt.y)
                }
                ctx.stroke()

                // Field vectors along E-wave
                for (let i = 0; i < 20; i++) {
                    const z = (i / 20) * axisLen + (t * 10) % (axisLen / 20)
                    if (z > axisLen) continue
                    const eVal = amplitude * Math.sin(k * z - omega * t)
                    const base = project(z, 0, 0)
                    const tip = project(z, eVal, 0)

                    ctx.strokeStyle = `rgba(255, 100, 100, ${0.15 + Math.abs(eVal / amplitude) * 0.2})`
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(base.x, base.y)
                    ctx.lineTo(tip.x, tip.y)
                    ctx.stroke()
                }
            }

            // Draw B-field wave (in the depth plane)
            if (fieldDisplay === 'B' || fieldDisplay === 'both') {
                // Wave surface fill
                ctx.fillStyle = 'rgba(100, 180, 255, 0.03)'
                ctx.beginPath()
                const startP = project(0, 0, 0)
                ctx.moveTo(startP.x, startP.y)
                for (let i = 0; i <= numPoints; i++) {
                    const z = (i / numPoints) * axisLen
                    const bVal = amplitude * Math.sin(k * z - omega * t)
                    const pt = project(z, 0, bVal)
                    ctx.lineTo(pt.x, pt.y)
                }
                const endP = project(axisLen, 0, 0)
                ctx.lineTo(endP.x, endP.y)
                ctx.closePath()
                ctx.fill()

                // Wave line
                ctx.strokeStyle = 'rgba(100, 180, 255, 0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                for (let i = 0; i <= numPoints; i++) {
                    const z = (i / numPoints) * axisLen
                    const bVal = amplitude * Math.sin(k * z - omega * t)
                    const pt = project(z, 0, bVal)
                    if (i === 0) ctx.moveTo(pt.x, pt.y)
                    else ctx.lineTo(pt.x, pt.y)
                }
                ctx.stroke()

                // Field vectors along B-wave
                for (let i = 0; i < 20; i++) {
                    const z = (i / 20) * axisLen + (t * 10) % (axisLen / 20)
                    if (z > axisLen) continue
                    const bVal = amplitude * Math.sin(k * z - omega * t)
                    const base = project(z, 0, 0)
                    const tip = project(z, 0, bVal)

                    ctx.strokeStyle = `rgba(100, 180, 255, ${0.12 + Math.abs(bVal / amplitude) * 0.18})`
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(base.x, base.y)
                    ctx.lineTo(tip.x, tip.y)
                    ctx.stroke()
                }
            }

            // Poynting vector arrows
            if (showPoynting) {
                const numArrows = 6
                for (let i = 0; i < numArrows; i++) {
                    const z = ((i + 0.5) / numArrows) * axisLen
                    const eVal = Math.sin(k * z - omega * t)
                    const intensity = eVal * eVal
                    const pt = project(z, 0, 0)
                    const arrowLen = 15 + intensity * 15

                    ctx.strokeStyle = `rgba(255, 220, 80, ${0.2 + intensity * 0.5})`
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.moveTo(pt.x, pt.y + 30)
                    ctx.lineTo(pt.x + arrowLen, pt.y + 30)
                    ctx.stroke()

                    ctx.fillStyle = ctx.strokeStyle
                    ctx.beginPath()
                    ctx.moveTo(pt.x + arrowLen, pt.y + 30)
                    ctx.lineTo(pt.x + arrowLen - 5, pt.y + 26)
                    ctx.lineTo(pt.x + arrowLen - 5, pt.y + 34)
                    ctx.closePath()
                    ctx.fill()
                }

                ctx.fillStyle = 'rgba(255, 220, 80, 0.4)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'left'
                const sLabel = project(axisLen * 0.1, 0, 0)
                ctx.fillText('S = E x B / mu0', sLabel.x, sLabel.y + 45)
            }

            // Wavelength indicator
            const wlStart = project(axisLen * 0.3, -amplitude - 15, 0)
            const wlEnd = project(axisLen * 0.3 + wavelength, -amplitude - 15, 0)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(wlStart.x, wlStart.y)
            ctx.lineTo(wlEnd.x, wlEnd.y)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(wlStart.x, wlStart.y - 4)
            ctx.lineTo(wlStart.x, wlStart.y + 4)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(wlEnd.x, wlEnd.y - 4)
            ctx.lineTo(wlEnd.x, wlEnd.y + 4)
            ctx.stroke()
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`lambda = ${wavelength.toFixed(0)} (arb)`, (wlStart.x + wlEnd.x) / 2, wlStart.y - 8)

            // Legend
            const lgX = w * 0.02
            const lgY = h * 0.85

            ctx.fillStyle = 'rgba(0,0,0,0.3)'
            ctx.beginPath()
            ctx.roundRect(lgX, lgY, 180, 60, 8)
            ctx.fill()

            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
            ctx.fillText('-- E-field (vertical)', lgX + 10, lgY + 18)
            ctx.fillStyle = 'rgba(100, 180, 255, 0.8)'
            ctx.fillText('-- B-field (horizontal)', lgX + 10, lgY + 35)
            ctx.fillStyle = 'rgba(255, 220, 80, 0.6)'
            ctx.fillText('-> S (Poynting vector)', lgX + 10, lgY + 52)

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [frequency, amplitude, fieldDisplay, showPoynting, showLabels, waveSpeed, wavelength])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0d0a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full block" />

                <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
                    <APTag course="Physics C: E&M" unit="Unit 4" color={PHYS_COLOR} />
                    <InfoPanel
                        title="EM Wave Properties"
                        departmentColor={PHYS_COLOR}
                        items={[
                            { label: 'Wavelength', value: wavelength.toFixed(0), unit: 'arb' },
                            { label: 'Frequency', value: frequency.toFixed(2), unit: 'arb' },
                            { label: 'c = f * lambda', value: (frequency * wavelength).toFixed(0) },
                            { label: 'E0/B0', value: 'c', color: 'rgba(160, 100, 255, 0.8)' },
                            { label: 'Speed', value: `${waveSpeed.toFixed(1)}x` },
                        ]}
                    />
                    <EquationDisplay
                        departmentColor={PHYS_COLOR}
                        title="EM Wave Equations"
                        equations={[
                            { label: 'Speed', expression: 'c = 1/sqrt(mu0 * e0)', description: '= 3 x 10^8 m/s' },
                            { label: 'Relation', expression: 'c = f * lambda' },
                            { label: 'E/B ratio', expression: 'E0 / B0 = c', description: 'Always in phase' },
                            { label: 'Poynting', expression: 'S = (1/mu0) E x B', description: 'Energy flux density' },
                        ]}
                    />
                </div>

                <div className="absolute top-4 right-4 z-10">
                    <ControlPanel>
                        <ControlGroup label="Controls">
                            <Button onClick={reset} variant="secondary">Reset</Button>
                        </ControlGroup>
                        <Slider label="Frequency" value={frequency} onChange={setFrequency} min={0.5} max={4} step={0.1} />
                        <Slider label="Amplitude" value={amplitude} onChange={v => setAmplitude(Math.round(v))} min={20} max={100} step={1} />
                        <Slider label="Animation Speed" value={waveSpeed} onChange={setWaveSpeed} min={0.1} max={3} step={0.1} />
                        <ButtonGroup
                            label="Show Fields"
                            value={fieldDisplay}
                            onChange={v => setFieldDisplay(v as FieldDisplay)}
                            options={[
                                { value: 'E', label: 'E only' },
                                { value: 'B', label: 'B only' },
                                { value: 'both', label: 'Both' },
                            ]}
                            color={PHYS_COLOR}
                        />
                        <Toggle label="Show Poynting Vector" value={showPoynting} onChange={setShowPoynting} />
                        <Toggle label="Show Axis Labels" value={showLabels} onChange={setShowLabels} />
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
