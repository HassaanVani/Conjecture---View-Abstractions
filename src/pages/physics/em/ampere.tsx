import { useState, useEffect, useRef } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const PHYS_COLOR = 'rgb(160, 100, 255)'
const MU0 = 4 * Math.PI * 1e-7

type Config = 'wire' | 'solenoid' | 'toroid'

export default function Ampere() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)

    const [current, setCurrent] = useState(5.0)
    const [turns, setTurns] = useState(20)
    const [config, setConfig] = useState<Config>('wire')
    const [loopRadius, setLoopRadius] = useState(80)
    const [showLoop, setShowLoop] = useState(true)

    const demoSteps: DemoStep[] = [
        {
            title: "Ampere's Law",
            description: 'The line integral of B around any closed loop equals mu0 times the enclosed current. This powerful law relates magnetic fields to the currents that create them.',
            setup: () => { setConfig('wire'); setCurrent(5); setLoopRadius(80) },
        },
        {
            title: 'Long Straight Wire',
            description: 'For a long straight wire, B-field lines form concentric circles. By symmetry, B is constant on a circular Amperian loop: B = mu0*I / (2*pi*r).',
            setup: () => { setConfig('wire'); setCurrent(5); setLoopRadius(80) },
        },
        {
            title: 'Amperian Loop Radius',
            description: 'The B-field decreases as 1/r from the wire. Move the Amperian loop closer or farther to see how B changes, but the enclosed current (and thus the integral) remains the same.',
            setup: () => { setConfig('wire'); setLoopRadius(50) },
        },
        {
            title: 'Solenoid',
            description: 'A solenoid is a coil of wire. Inside, the B-field is uniform and strong: B = mu0*n*I, where n is turns per length. Outside, B is nearly zero.',
            setup: () => { setConfig('solenoid'); setTurns(20); setCurrent(5) },
        },
        {
            title: 'Solenoid Turns',
            description: 'More turns per length means a stronger internal field. The field is proportional to n (turns per length), making solenoids useful as electromagnets.',
            setup: () => { setConfig('solenoid'); setTurns(40) },
        },
        {
            title: 'Toroid',
            description: 'A toroid is a solenoid bent into a circle. The field is confined entirely inside the torus: B = mu0*N*I / (2*pi*r). There is zero field outside.',
            setup: () => { setConfig('toroid'); setTurns(20); setCurrent(5) },
        },
        {
            title: 'Current Magnitude',
            description: 'The B-field is directly proportional to current I. Double the current, double the field. This linearity is fundamental to electromagnetism and circuit design.',
            setup: () => { setConfig('wire'); setCurrent(10) },
        },
    ]

    const demo = useDemoMode(demoSteps)

    const getBField = (r: number): number => {
        if (config === 'wire') {
            return r > 5 ? MU0 * current / (2 * Math.PI * r * 0.01) : 0
        }
        if (config === 'solenoid') {
            return MU0 * turns * current / 0.3
        }
        // toroid
        return r > 10 ? MU0 * turns * current / (2 * Math.PI * r * 0.01) : 0
    }

    const enclosedCurrent = (): number => {
        if (config === 'wire') return current
        if (config === 'solenoid') return turns * current
        return turns * current
    }

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
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const cx = w * 0.42
            const cy = h * 0.48

            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = '#0d0a1a'
            ctx.fillRect(0, 0, w, h)

            if (config === 'wire') {
                // Wire cross-section (dot = current out of page)
                ctx.fillStyle = 'rgba(160, 100, 255, 0.8)'
                ctx.beginPath()
                ctx.arc(cx, cy, 12, 0, Math.PI * 2)
                ctx.fill()
                ctx.strokeStyle = 'rgba(200, 160, 255, 0.5)'
                ctx.lineWidth = 2
                ctx.stroke()

                // Current direction dot
                ctx.fillStyle = 'white'
                ctx.beginPath()
                ctx.arc(cx, cy, 3, 0, Math.PI * 2)
                ctx.fill()

                ctx.fillStyle = 'rgba(255,255,255,0.4)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('I (out)', cx, cy + 25)

                // Concentric B-field circles
                for (let r = 30; r < Math.max(w, h) * 0.5; r += 35) {
                    const intensity = Math.min(1, 80 / r)
                    ctx.strokeStyle = `rgba(100, 180, 255, ${intensity * 0.25})`
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.arc(cx, cy, r, 0, Math.PI * 2)
                    ctx.stroke()

                    // Direction arrows on field lines
                    const numArrows = Math.max(4, Math.round(r / 25))
                    for (let j = 0; j < numArrows; j++) {
                        const angle = (j / numArrows) * Math.PI * 2 + now * 0.5
                        const ax = cx + Math.cos(angle) * r
                        const ay = cy + Math.sin(angle) * r
                        const tx = -Math.sin(angle)
                        const ty = Math.cos(angle)
                        const sz = 4 + intensity * 3

                        ctx.fillStyle = `rgba(100, 180, 255, ${intensity * 0.5})`
                        ctx.beginPath()
                        ctx.moveTo(ax + tx * sz, ay + ty * sz)
                        ctx.lineTo(ax - tx * sz * 0.3 + ty * sz * 0.4, ay - ty * sz * 0.3 - tx * sz * 0.4)
                        ctx.lineTo(ax - tx * sz * 0.3 - ty * sz * 0.4, ay - ty * sz * 0.3 + tx * sz * 0.4)
                        ctx.closePath()
                        ctx.fill()
                    }
                }

                // Amperian loop
                if (showLoop) {
                    ctx.strokeStyle = 'rgba(255, 200, 80, 0.7)'
                    ctx.lineWidth = 2.5
                    ctx.setLineDash([8, 4])
                    ctx.beginPath()
                    ctx.arc(cx, cy, loopRadius, 0, Math.PI * 2)
                    ctx.stroke()
                    ctx.setLineDash([])

                    ctx.fillStyle = 'rgba(255, 200, 80, 0.1)'
                    ctx.beginPath()
                    ctx.arc(cx, cy, loopRadius, 0, Math.PI * 2)
                    ctx.fill()

                    // B value on loop
                    const B = getBField(loopRadius)
                    ctx.fillStyle = 'rgba(255, 200, 80, 0.8)'
                    ctx.font = '12px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`B = ${(B * 1e4).toFixed(2)} x 10^-4 T`, cx, cy - loopRadius - 12)
                    ctx.fillText(`r = ${(loopRadius * 0.01).toFixed(2)} m`, cx, cy + loopRadius + 20)
                }
            }

            if (config === 'solenoid') {
                const solW = 300
                const solH = 100

                // Solenoid outline
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.5)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.roundRect(cx - solW / 2, cy - solH / 2, solW, solH, 8)
                ctx.stroke()

                // Coil windings (cross-section view)
                const spacing = solW / turns
                for (let i = 0; i < turns; i++) {
                    const wx = cx - solW / 2 + (i + 0.5) * spacing

                    // Top dots (current out)
                    ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                    ctx.beginPath()
                    ctx.arc(wx, cy - solH / 2, 4, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.fillStyle = 'white'
                    ctx.beginPath()
                    ctx.arc(wx, cy - solH / 2, 1.5, 0, Math.PI * 2)
                    ctx.fill()

                    // Bottom X's (current into page)
                    ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                    ctx.beginPath()
                    ctx.arc(wx, cy + solH / 2, 4, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.strokeStyle = 'white'
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(wx - 2, cy + solH / 2 - 2)
                    ctx.lineTo(wx + 2, cy + solH / 2 + 2)
                    ctx.moveTo(wx + 2, cy + solH / 2 - 2)
                    ctx.lineTo(wx - 2, cy + solH / 2 + 2)
                    ctx.stroke()
                }

                // Internal B-field arrows
                const numFieldLines = 5
                const offset = (now * 40) % 20
                for (let i = 0; i < numFieldLines; i++) {
                    const fy = cy - solH / 2 + (i + 0.5) * (solH / numFieldLines)
                    ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)'
                    ctx.lineWidth = 1.5
                    ctx.setLineDash([8, 6])
                    ctx.lineDashOffset = -offset
                    ctx.beginPath()
                    ctx.moveTo(cx - solW / 2 + 10, fy)
                    ctx.lineTo(cx + solW / 2 - 10, fy)
                    ctx.stroke()
                    ctx.setLineDash([])

                    // Arrow
                    ctx.fillStyle = 'rgba(100, 180, 255, 0.6)'
                    ctx.beginPath()
                    ctx.moveTo(cx + 6, fy)
                    ctx.lineTo(cx - 2, fy - 4)
                    ctx.lineTo(cx - 2, fy + 4)
                    ctx.closePath()
                    ctx.fill()
                }

                // External field (weak, returning)
                ctx.strokeStyle = 'rgba(100, 180, 255, 0.1)'
                ctx.lineWidth = 1
                for (let side = -1; side <= 1; side += 2) {
                    ctx.beginPath()
                    ctx.moveTo(cx + (solW / 2) * side, cy - solH / 2 - 30)
                    ctx.quadraticCurveTo(cx + (solW / 2 + 60) * side, cy, cx + (solW / 2) * side, cy + solH / 2 + 30)
                    ctx.stroke()
                }

                // Amperian loop
                if (showLoop) {
                    ctx.strokeStyle = 'rgba(255, 200, 80, 0.7)'
                    ctx.lineWidth = 2.5
                    ctx.setLineDash([8, 4])
                    ctx.beginPath()
                    ctx.rect(cx - solW / 4, cy - solH / 2 - 20, solW / 2, solH + 40)
                    ctx.stroke()
                    ctx.setLineDash([])

                    ctx.fillStyle = 'rgba(255, 200, 80, 0.05)'
                    ctx.fillRect(cx - solW / 4, cy - solH / 2 - 20, solW / 2, solH + 40)

                    const B = getBField(0)
                    ctx.fillStyle = 'rgba(255, 200, 80, 0.8)'
                    ctx.font = '12px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`B_inside = ${(B * 1e3).toFixed(2)} mT`, cx, cy - solH / 2 - 30)
                }

                ctx.fillStyle = 'rgba(255,255,255,0.3)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`n = ${turns} turns`, cx, cy + solH / 2 + 35)
                ctx.fillText('B (uniform inside)', cx, cy + 10)
            }

            if (config === 'toroid') {
                const outerR = 140
                const innerR = 80
                const midR = (outerR + innerR) / 2

                // Toroid body
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
                ctx.stroke()
                ctx.beginPath()
                ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
                ctx.stroke()

                ctx.fillStyle = 'rgba(160, 100, 255, 0.08)'
                ctx.beginPath()
                ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
                ctx.fill()
                ctx.fillStyle = '#0d0a1a'
                ctx.beginPath()
                ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
                ctx.fill()

                // Coil dots
                for (let i = 0; i < turns; i++) {
                    const angle = (i / turns) * Math.PI * 2

                    // Outer dots
                    const ox = cx + Math.cos(angle) * outerR
                    const oy = cy + Math.sin(angle) * outerR
                    ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'
                    ctx.beginPath()
                    ctx.arc(ox, oy, 3, 0, Math.PI * 2)
                    ctx.fill()

                    // Inner dots
                    const ix = cx + Math.cos(angle) * innerR
                    const iy = cy + Math.sin(angle) * innerR
                    ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'
                    ctx.beginPath()
                    ctx.arc(ix, iy, 3, 0, Math.PI * 2)
                    ctx.fill()
                }

                // B-field circle inside toroid
                const fieldR = midR
                const numArrows = 16
                for (let i = 0; i < numArrows; i++) {
                    const angle = (i / numArrows) * Math.PI * 2 + now * 0.3
                    const fx = cx + Math.cos(angle) * fieldR
                    const fy = cy + Math.sin(angle) * fieldR
                    const tx = -Math.sin(angle)
                    const ty = Math.cos(angle)

                    ctx.strokeStyle = 'rgba(100, 180, 255, 0.4)'
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    ctx.moveTo(fx - tx * 8, fy - ty * 8)
                    ctx.lineTo(fx + tx * 8, fy + ty * 8)
                    ctx.stroke()

                    ctx.fillStyle = 'rgba(100, 180, 255, 0.5)'
                    ctx.beginPath()
                    ctx.moveTo(fx + tx * 8, fy + ty * 8)
                    ctx.lineTo(fx + tx * 4 + ty * 3, fy + ty * 4 - tx * 3)
                    ctx.lineTo(fx + tx * 4 - ty * 3, fy + ty * 4 + tx * 3)
                    ctx.closePath()
                    ctx.fill()
                }

                // Amperian loop
                if (showLoop) {
                    ctx.strokeStyle = 'rgba(255, 200, 80, 0.7)'
                    ctx.lineWidth = 2.5
                    ctx.setLineDash([8, 4])
                    ctx.beginPath()
                    ctx.arc(cx, cy, loopRadius, 0, Math.PI * 2)
                    ctx.stroke()
                    ctx.setLineDash([])

                    const isInside = loopRadius > innerR && loopRadius < outerR
                    const B = isInside ? getBField(loopRadius) : 0
                    ctx.fillStyle = 'rgba(255, 200, 80, 0.8)'
                    ctx.font = '12px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(
                        isInside ? `B = ${(B * 1e3).toFixed(2)} mT` : 'B = 0 (outside)',
                        cx, cy - loopRadius - 12
                    )
                }
            }

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [current, turns, config, loopRadius, showLoop])

    const B = getBField(config === 'wire' ? loopRadius : config === 'solenoid' ? 0 : (80 + 140) / 2)
    const Ienc = enclosedCurrent()

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0d0a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full block" />

                <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
                    <APTag course="Physics C: E&M" unit="Unit 2" color={PHYS_COLOR} />
                    <InfoPanel
                        title="Magnetic Field"
                        departmentColor={PHYS_COLOR}
                        items={[
                            { label: 'B-field', value: (B * 1e4).toFixed(3), unit: 'x10^-4 T' },
                            { label: 'Current I', value: current.toFixed(1), unit: 'A' },
                            { label: 'I_enclosed', value: Ienc.toFixed(1), unit: 'A' },
                            { label: 'Turns', value: turns.toString() },
                            { label: 'Config', value: config },
                        ]}
                    />
                    <EquationDisplay
                        departmentColor={PHYS_COLOR}
                        title="Ampere's Law"
                        equations={[
                            { label: 'Integral', expression: 'Integral B . dl = mu0 * I_enc', description: "Ampere's law" },
                            { label: 'Wire', expression: 'B = mu0*I / (2*pi*r)', description: 'Long straight wire' },
                            { label: 'Solenoid', expression: 'B = mu0*n*I', description: 'n = turns per length' },
                            { label: 'Toroid', expression: 'B = mu0*N*I / (2*pi*r)' },
                        ]}
                    />
                </div>

                <div className="absolute top-4 right-4 z-10">
                    <ControlPanel>
                        <ControlGroup label="Controls">
                            <Button onClick={() => { setCurrent(5); setTurns(20); setConfig('wire'); setLoopRadius(80) }} variant="secondary">Reset</Button>
                        </ControlGroup>
                        <ButtonGroup
                            label="Configuration"
                            value={config}
                            onChange={v => setConfig(v as Config)}
                            options={[
                                { value: 'wire', label: 'Wire' },
                                { value: 'solenoid', label: 'Solenoid' },
                                { value: 'toroid', label: 'Toroid' },
                            ]}
                            color={PHYS_COLOR}
                        />
                        <Slider label="Current I (A)" value={current} onChange={setCurrent} min={0.5} max={20} step={0.5} />
                        {config !== 'wire' && (
                            <Slider label="Number of Turns" value={turns} onChange={v => setTurns(Math.round(v))} min={5} max={50} step={1} />
                        )}
                        <Slider label="Amperian Loop Radius" value={loopRadius} onChange={v => setLoopRadius(Math.round(v))} min={20} max={200} step={2} />
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
