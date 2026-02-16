import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { Slider, Button, Select, Toggle } from '@/components/control-panel'

type Scenario = 'balloon' | 'ladder' | 'cone'

const CALC_COLOR = 'rgb(180, 120, 255)'

export default function RelatedRates() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [scenario, setScenario] = useState<Scenario>('balloon')
    const [time, setTime] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [rate, setRate] = useState(2)
    const [showChainRule, setShowChainRule] = useState(true)
    const timeRef = useRef(0)

    // Balloon: r increases, find dV/dt
    // Ladder: x increases (base slides), find dy/dt (top slides down)
    // Cone: h increases (water fills), find dV/dt

    const getValues = useCallback((t: number) => {
        if (scenario === 'balloon') {
            const r = 1 + rate * t * 0.1
            const V = (4 / 3) * Math.PI * r * r * r
            const drdt = rate * 0.1
            const dVdt = 4 * Math.PI * r * r * drdt
            return { primary: r, secondary: V, dPrimary: drdt, dSecondary: dVdt, labels: { p: 'r', s: 'V', dp: 'dr/dt', ds: 'dV/dt' } }
        }
        if (scenario === 'ladder') {
            const L = 10
            const x = 2 + rate * t * 0.15
            const y = Math.sqrt(Math.max(L * L - x * x, 0.01))
            const dxdt = rate * 0.15
            const dydt = x >= L ? 0 : (-x * dxdt) / y
            return { primary: x, secondary: y, dPrimary: dxdt, dSecondary: dydt, labels: { p: 'x', s: 'y', dp: 'dx/dt', ds: 'dy/dt' }, extra: L }
        }
        // Cone: r/h = 3/10 constant ratio, water fills
        const h = 1 + rate * t * 0.12
        const r = (3 / 10) * h
        const V = (1 / 3) * Math.PI * r * r * h
        const dhdt = rate * 0.12
        const dVdt = (3 / 100) * Math.PI * h * h * dhdt
        return { primary: h, secondary: V, dPrimary: dhdt, dSecondary: dVdt, labels: { p: 'h', s: 'V', dp: 'dh/dt', ds: 'dV/dt' } }
    }, [scenario, rate])

    const reset = useCallback(() => {
        setTime(0)
        timeRef.current = 0
        setIsAnimating(false)
    }, [])

    useEffect(() => { reset() }, [scenario, reset])

    const demoSteps = [
        { title: 'What Are Related Rates?', description: 'Related rates problems involve finding how fast one quantity changes when we know how fast a related quantity changes. We use the chain rule to connect the rates.', setup: () => { setScenario('balloon'); reset() } },
        { title: 'The Chain Rule Connection', description: 'If V = (4/3)pi*r^3 and we know dr/dt, then by chain rule: dV/dt = 4pi*r^2 * dr/dt. The rate of volume change depends on the current radius AND the rate of radius change.', setup: () => { setScenario('balloon'); setIsAnimating(true) } },
        { title: 'Expanding Balloon', description: 'As the balloon inflates at constant dr/dt, notice dV/dt INCREASES because the surface area 4pi*r^2 grows. A small dr gives more volume when r is large.', setup: () => { setScenario('balloon'); setRate(2) } },
        { title: 'Sliding Ladder', description: 'A ladder slides: the base moves at constant dx/dt. Using x^2 + y^2 = L^2, we get dy/dt = -(x/y)*dx/dt. As y gets small, the top accelerates downward!', setup: () => { setScenario('ladder'); reset(); setIsAnimating(true) } },
        { title: 'Filling Cone', description: 'Water fills a cone with fixed proportions r/h = 3/10. The volume V = (1/3)pi*r^2*h simplifies to V = (3/100)pi*h^3. Chain rule gives dV/dt = (9/100)pi*h^2 * dh/dt.', setup: () => { setScenario('cone'); reset(); setIsAnimating(true) } },
        { title: 'Rate Parameter', description: 'Adjust the rate slider to see how changing the known rate affects the unknown rate. The relationship is always through the chain rule.', setup: () => { setScenario('balloon'); setRate(3) } },
        { title: 'Practice Strategy', description: '1) Draw a diagram. 2) Identify known/unknown rates. 3) Write an equation relating the variables. 4) Differentiate implicitly with respect to time. 5) Substitute and solve.', setup: () => { setScenario('balloon'); reset() } },
    ]

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animId: number
        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        const draw = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = '#120a1a'
            ctx.fillRect(0, 0, w, h)

            if (isAnimating) {
                timeRef.current += 0.016
                setTime(timeRef.current)
            }

            const t = timeRef.current
            const vals = getValues(t)
            const midX = w / 2

            // --- Left: Physical visualization ---
            const cx = midX / 2
            const cy = h / 2

            if (scenario === 'balloon') {
                const r = vals.primary
                const drawR = Math.min(r * 25, midX / 2 - 20)

                // Balloon glow
                const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, drawR + 10)
                glow.addColorStop(0, 'rgba(180, 120, 255, 0.15)')
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath()
                ctx.arc(cx, cy, drawR + 10, 0, Math.PI * 2)
                ctx.fill()

                // Balloon circle
                ctx.strokeStyle = CALC_COLOR
                ctx.lineWidth = 2.5
                ctx.beginPath()
                ctx.arc(cx, cy, drawR, 0, Math.PI * 2)
                ctx.stroke()
                ctx.fillStyle = 'rgba(180, 120, 255, 0.08)'
                ctx.fill()

                // Radius line
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)'
                ctx.lineWidth = 2
                ctx.setLineDash([4, 3])
                ctx.beginPath()
                ctx.moveTo(cx, cy)
                ctx.lineTo(cx + drawR, cy)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(255, 200, 100, 0.9)'
                ctx.font = '13px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`r = ${r.toFixed(2)}`, cx + drawR / 2, cy - 10)

                // Outward arrows for dr/dt
                const arrowLen = 15
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                    const ax = cx + (drawR + 8) * Math.cos(a)
                    const ay = cy + (drawR + 8) * Math.sin(a)
                    ctx.strokeStyle = 'rgba(100, 255, 180, 0.5)'
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    ctx.moveTo(ax, ay)
                    ctx.lineTo(ax + arrowLen * Math.cos(a), ay + arrowLen * Math.sin(a))
                    ctx.stroke()
                }
            } else if (scenario === 'ladder') {
                const L = vals.extra as number
                const x = Math.min(vals.primary, L - 0.1)
                const y = Math.sqrt(Math.max(L * L - x * x, 0.01))
                const scale = 22

                const wallX = cx + 60
                const floorY = cy + 100

                // Wall
                ctx.fillStyle = 'rgba(100, 100, 100, 0.3)'
                ctx.fillRect(wallX, floorY - L * scale, 8, L * scale)
                // Floor
                ctx.fillRect(wallX - L * scale, floorY, L * scale + 8, 4)

                // Ladder
                const ladderBaseX = wallX - x * scale
                const ladderTopY = floorY - y * scale
                ctx.strokeStyle = CALC_COLOR
                ctx.lineWidth = 4
                ctx.beginPath()
                ctx.moveTo(ladderBaseX, floorY)
                ctx.lineTo(wallX, ladderTopY)
                ctx.stroke()

                // Labels
                ctx.fillStyle = 'rgba(255, 200, 100, 0.9)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`x = ${x.toFixed(1)}`, (ladderBaseX + wallX) / 2, floorY + 20)
                ctx.fillText(`y = ${y.toFixed(1)}`, wallX + 25, (ladderTopY + floorY) / 2)
                ctx.fillStyle = 'rgba(180, 120, 255, 0.7)'
                ctx.fillText(`L = ${L}`, (ladderBaseX + wallX) / 2 - 20, (ladderTopY + floorY) / 2 - 15)

                // Velocity arrows
                ctx.strokeStyle = 'rgba(100, 255, 180, 0.7)'
                ctx.lineWidth = 2
                // dx/dt arrow at base
                ctx.beginPath()
                ctx.moveTo(ladderBaseX, floorY - 8)
                ctx.lineTo(ladderBaseX - 20, floorY - 8)
                ctx.stroke()
                // dy/dt arrow at top
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)'
                ctx.beginPath()
                ctx.moveTo(wallX - 8, ladderTopY)
                ctx.lineTo(wallX - 8, ladderTopY + 20)
                ctx.stroke()
            } else {
                // Cone
                const hVal = vals.primary
                const rVal = (3 / 10) * hVal
                const maxH = 8
                const scale = Math.min(120 / maxH, 20)
                const coneH = maxH * scale
                const coneR = (3 / 10) * maxH * scale
                const waterH = hVal * scale
                const waterR = rVal * scale

                const coneTopY = cy - coneH / 2
                const coneBotY = cy + coneH / 2

                // Cone outline (inverted)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(cx, coneBotY)
                ctx.lineTo(cx - coneR, coneTopY)
                ctx.moveTo(cx, coneBotY)
                ctx.lineTo(cx + coneR, coneTopY)
                ctx.stroke()
                ctx.beginPath()
                ctx.ellipse(cx, coneTopY, coneR, coneR * 0.25, 0, 0, Math.PI * 2)
                ctx.stroke()

                // Water
                const waterTopY = coneBotY - waterH
                ctx.fillStyle = 'rgba(100, 150, 255, 0.2)'
                ctx.beginPath()
                ctx.moveTo(cx, coneBotY)
                ctx.lineTo(cx - waterR, waterTopY)
                ctx.lineTo(cx + waterR, waterTopY)
                ctx.closePath()
                ctx.fill()
                ctx.beginPath()
                ctx.ellipse(cx, waterTopY, waterR, waterR * 0.25, 0, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(100, 150, 255, 0.3)'
                ctx.fill()

                ctx.fillStyle = 'rgba(255, 200, 100, 0.9)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`h = ${hVal.toFixed(1)}`, cx + waterR + 30, (waterTopY + coneBotY) / 2)
                ctx.fillText(`r = ${rVal.toFixed(1)}`, cx, waterTopY - 12)
            }

            // --- Right: Rate chain diagram ---
            const rX = midX + 40
            const rW = w - midX - 80
            const boxW = 120
            const boxH = 50

            // Known rate box
            const box1X = rX + 20
            const box1Y = h / 2 - 80
            ctx.strokeStyle = 'rgba(100, 255, 180, 0.6)'
            ctx.lineWidth = 2
            ctx.strokeRect(box1X, box1Y, boxW, boxH)
            ctx.fillStyle = 'rgba(100, 255, 180, 0.08)'
            ctx.fillRect(box1X, box1Y, boxW, boxH)
            ctx.fillStyle = 'rgba(100, 255, 180, 0.9)'
            ctx.font = 'bold 14px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`${vals.labels.dp} = ${vals.dPrimary.toFixed(3)}`, box1X + boxW / 2, box1Y + boxH / 2 + 5)
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '10px system-ui'
            ctx.fillText('Known Rate', box1X + boxW / 2, box1Y - 8)

            // Chain rule box
            const box2X = rX + rW / 2 - boxW / 2
            const box2Y = h / 2 - 10
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.6)'
            ctx.strokeRect(box2X, box2Y, boxW, boxH)
            ctx.fillStyle = 'rgba(180, 120, 255, 0.08)'
            ctx.fillRect(box2X, box2Y, boxW, boxH)
            ctx.fillStyle = CALC_COLOR
            ctx.font = 'bold 13px system-ui'
            ctx.fillText('Chain Rule', box2X + boxW / 2, box2Y + boxH / 2 + 5)

            // Unknown rate box
            const box3X = rX + rW - boxW - 20
            const box3Y = h / 2 + 80
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)'
            ctx.lineWidth = 2
            ctx.strokeRect(box3X, box3Y, boxW, boxH)
            ctx.fillStyle = 'rgba(255, 200, 100, 0.08)'
            ctx.fillRect(box3X, box3Y, boxW, boxH)
            ctx.fillStyle = 'rgba(255, 200, 100, 0.9)'
            ctx.font = 'bold 14px system-ui'
            ctx.fillText(`${vals.labels.ds} = ${vals.dSecondary.toFixed(3)}`, box3X + boxW / 2, box3Y + boxH / 2 + 5)
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '10px system-ui'
            ctx.fillText('Unknown Rate', box3X + boxW / 2, box3Y + boxH + 15)

            // Arrows connecting boxes
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(box1X + boxW, box1Y + boxH / 2)
            ctx.lineTo(box2X, box2Y + boxH / 2)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(box2X + boxW, box2Y + boxH / 2)
            ctx.lineTo(box3X, box3Y + boxH / 2)
            ctx.stroke()

            // Chain rule formula display
            if (showChainRule) {
                ctx.fillStyle = 'rgba(180, 120, 255, 0.9)'
                ctx.font = '16px monospace'
                ctx.textAlign = 'center'
                const formulaY = h / 2 + 160

                let formula = ''
                if (scenario === 'balloon') {
                    formula = `dV/dt = 4*pi*r^2 * dr/dt`
                } else if (scenario === 'ladder') {
                    formula = `2x*dx/dt + 2y*dy/dt = 0`
                } else {
                    formula = `dV/dt = (9pi/100)*h^2 * dh/dt`
                }
                ctx.fillText(formula, rX + rW / 2, formulaY)
            }

            // Time display
            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = '11px monospace'
            ctx.textAlign = 'right'
            ctx.fillText(`t = ${t.toFixed(2)}s`, w - 20, 20)

            animId = requestAnimationFrame(draw)
        }
        animId = requestAnimationFrame(draw)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [scenario, isAnimating, rate, showChainRule, getValues])

    const vals = getValues(time)

    const equations = scenario === 'balloon'
        ? [
            { label: 'Volume', expression: 'V = (4/3)pi*r^3' },
            { label: 'Chain Rule', expression: 'dV/dt = 4pi*r^2 * dr/dt', description: 'Differentiate both sides w.r.t. t' },
            { label: 'Result', expression: `dV/dt = ${vals.dSecondary.toFixed(3)}` },
        ]
        : scenario === 'ladder'
        ? [
            { label: 'Constraint', expression: 'x^2 + y^2 = L^2' },
            { label: 'Chain Rule', expression: '2x(dx/dt) + 2y(dy/dt) = 0', description: 'Implicit differentiation' },
            { label: 'Result', expression: `dy/dt = ${vals.dSecondary.toFixed(3)}` },
        ]
        : [
            { label: 'Volume', expression: 'V = (1/3)pi*r^2*h = (3pi/100)h^3' },
            { label: 'Chain Rule', expression: 'dV/dt = (9pi/100)h^2 * dh/dt', description: 'r/h = 3/10 substitution' },
            { label: 'Result', expression: `dV/dt = ${vals.dSecondary.toFixed(3)}` },
        ]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#120a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
                    <APTag course="Calculus AB/BC" unit="Unit 5" color={CALC_COLOR} />
                    <InfoPanel
                        title="Related Rates"
                        departmentColor={CALC_COLOR}
                        items={[
                            { label: vals.labels.p, value: vals.primary.toFixed(3), color: CALC_COLOR },
                            { label: vals.labels.s, value: vals.secondary.toFixed(3), color: 'white' },
                            { label: vals.labels.dp, value: vals.dPrimary.toFixed(4), color: 'rgb(100, 255, 180)' },
                            { label: vals.labels.ds, value: vals.dSecondary.toFixed(4), color: 'rgb(255, 200, 100)' },
                        ]}
                    />
                    <EquationDisplay
                        equations={equations}
                        departmentColor={CALC_COLOR}
                        title="Rate Equations"
                    />
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <DemoMode
                        steps={demoSteps}
                        currentStep={demo.currentStep}
                        isOpen={demo.isOpen}
                        onClose={demo.close}
                        onNext={demo.next}
                        onPrev={demo.prev}
                        onGoToStep={demo.goToStep}
                        departmentColor={CALC_COLOR}
                    />
                </div>
            </div>

            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-6">
                    <Select
                        value={scenario}
                        onChange={(v) => { setScenario(v as Scenario); reset() }}
                        options={[
                            { value: 'balloon', label: 'Expanding Balloon' },
                            { value: 'ladder', label: 'Sliding Ladder' },
                            { value: 'cone', label: 'Filling Cone' },
                        ]}
                        label="Scenario"
                    />
                    <div className="flex-1 min-w-[160px]">
                        <Slider value={rate} onChange={setRate} min={0.5} max={5} step={0.1} label="Rate" />
                    </div>
                    <Toggle value={showChainRule} onChange={setShowChainRule} label="Chain Rule" />
                    <Toggle value={isAnimating} onChange={setIsAnimating} label="Animate" />
                    <Button onClick={reset} variant="secondary">Reset</Button>
                    <Button onClick={demo.open} variant="primary">AP Tutorial</Button>
                </div>
            </div>
        </div>
    )
}
