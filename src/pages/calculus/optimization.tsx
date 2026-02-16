import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { Slider, Button, Select, Toggle } from '@/components/control-panel'

type Scenario = 'box' | 'fence' | 'cylinder'

interface ScenarioConfig {
    label: string
    paramLabel: string
    paramMin: number
    paramMax: number
    paramStep: number
    constraint: number
}

const scenarioConfigs: Record<Scenario, ScenarioConfig> = {
    box: {
        label: 'Open Box from Cardboard',
        paramLabel: 'Cut size x',
        paramMin: 0.1,
        paramMax: 12,
        paramStep: 0.1,
        constraint: 24,
    },
    fence: {
        label: 'Fenced Area (one wall)',
        paramLabel: 'Width x',
        paramMin: 1,
        paramMax: 200,
        paramStep: 1,
        constraint: 400,
    },
    cylinder: {
        label: 'Cylinder (fixed volume)',
        paramLabel: 'Radius r',
        paramMin: 0.5,
        paramMax: 10,
        paramStep: 0.1,
        constraint: 1000,
    },
}

const CALC_COLOR = 'rgb(180, 120, 255)'

function objectiveValue(scenario: Scenario, x: number, constraint: number): number {
    if (scenario === 'box') {
        const side = constraint
        if (x <= 0 || x >= side / 2) return 0
        return x * (side - 2 * x) * (side - 2 * x)
    }
    if (scenario === 'fence') {
        const totalFence = constraint
        if (x <= 0 || x >= totalFence / 2) return 0
        const y = (totalFence - x) / 2
        return x * y
    }
    // cylinder: minimize surface area SA = 2*pi*r^2 + 2*V/r
    const V = constraint
    if (x <= 0) return 0
    return 2 * Math.PI * x * x + 2 * V / x
}

function criticalPoint(scenario: Scenario, constraint: number): number {
    if (scenario === 'box') return constraint / 6
    if (scenario === 'fence') return constraint / 2
    // cylinder: dSA/dr = 4*pi*r - 2V/r^2 = 0 => r = (V/(2*pi))^(1/3)
    return Math.pow(constraint / (2 * Math.PI), 1 / 3)
}

function firstDerivative(scenario: Scenario, x: number, constraint: number): number {
    const h = 0.0001
    return (objectiveValue(scenario, x + h, constraint) - objectiveValue(scenario, x - h, constraint)) / (2 * h)
}

function secondDerivative(scenario: Scenario, x: number, constraint: number): number {
    const h = 0.001
    return (objectiveValue(scenario, x + h, constraint) - 2 * objectiveValue(scenario, x, constraint) + objectiveValue(scenario, x - h, constraint)) / (h * h)
}

export default function Optimization() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [scenario, setScenario] = useState<Scenario>('box')
    const [xVal, setXVal] = useState(4)
    const [showSecondDeriv, setShowSecondDeriv] = useState(true)
    const [showTangent, setShowTangent] = useState(true)
    const cfg = scenarioConfigs[scenario]

    const cp = criticalPoint(scenario, cfg.constraint)
    const optVal = objectiveValue(scenario, cp, cfg.constraint)
    const currentVal = objectiveValue(scenario, xVal, cfg.constraint)
    const fPrime = firstDerivative(scenario, xVal, cfg.constraint)
    const fDoublePrime = secondDerivative(scenario, cp, cfg.constraint)

    const reset = useCallback(() => {
        setXVal(cp)
        setShowSecondDeriv(true)
        setShowTangent(true)
    }, [cp])

    const demoSteps = [
        { title: 'What is Optimization?', description: 'Optimization finds the maximum or minimum value of a function subject to constraints. We use derivatives to find critical points where f\'(x) = 0.', setup: () => { setScenario('box'); setXVal(4) } },
        { title: 'Setting Up the Problem', description: 'Each scenario has a constraint (fixed material, fence length, or volume). We express the objective function in terms of a single variable using the constraint.', setup: () => { setScenario('box'); setXVal(2) } },
        { title: 'The Objective Function', description: 'The graph on the right shows f(x) -- the quantity we want to optimize. For the box, it\'s volume. For the fence, it\'s area. For the cylinder, it\'s surface area.', setup: () => { setXVal(3) } },
        { title: 'Finding Critical Points', description: 'Set f\'(x) = 0 and solve. The critical point is where the tangent line is horizontal. Move the slider to see the tangent line become flat at the critical point.', setup: () => { setXVal(cp * 0.7) } },
        { title: 'Second Derivative Test', description: 'If f\'\'(x) < 0 at the critical point, it\'s a maximum. If f\'\'(x) > 0, it\'s a minimum. This tells us the concavity of the function at that point.', setup: () => { setXVal(cp); setShowSecondDeriv(true) } },
        { title: 'The Optimal Solution', description: 'At the critical point, we achieve the optimal value. Notice the physical shape on the left updates to show the optimal dimensions.', setup: () => { setXVal(cp) } },
        { title: 'Try Different Scenarios', description: 'Switch between box, fence, and cylinder problems. Each has different constraints and objective functions, but the same calculus technique applies.', setup: () => { setXVal(cp) } },
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

            const midX = w / 2
            // Left half: physical shape, Right half: graph
            const leftW = midX - 20
            const rightW = midX - 20
            const graphPad = 50
            const graphX = midX + 20
            const graphY = 40
            const graphW = rightW - graphPad
            const graphH = h - 100

            // --- Draw physical shape on left ---
            const shapeCx = leftW / 2
            const shapeCy = h / 2

            if (scenario === 'box') {
                const side = cfg.constraint
                const cut = xVal
                const baseW = Math.max(0, side - 2 * cut)
                const scale = Math.min(150 / side, 1) * 1.8
                const bw = baseW * scale
                const bh = baseW * scale
                const depth = cut * scale * 0.7

                // 3D box
                ctx.strokeStyle = `rgba(180, 120, 255, 0.6)`
                ctx.lineWidth = 2
                // Front face
                ctx.fillStyle = 'rgba(180, 120, 255, 0.1)'
                ctx.fillRect(shapeCx - bw / 2, shapeCy - bh / 2 + depth, bw, bh)
                ctx.strokeRect(shapeCx - bw / 2, shapeCy - bh / 2 + depth, bw, bh)
                // Top face
                ctx.fillStyle = 'rgba(180, 120, 255, 0.05)'
                ctx.beginPath()
                ctx.moveTo(shapeCx - bw / 2, shapeCy - bh / 2 + depth)
                ctx.lineTo(shapeCx - bw / 2 + depth * 0.5, shapeCy - bh / 2)
                ctx.lineTo(shapeCx + bw / 2 + depth * 0.5, shapeCy - bh / 2)
                ctx.lineTo(shapeCx + bw / 2, shapeCy - bh / 2 + depth)
                ctx.closePath()
                ctx.fill()
                ctx.stroke()
                // Right face
                ctx.fillStyle = 'rgba(180, 120, 255, 0.08)'
                ctx.beginPath()
                ctx.moveTo(shapeCx + bw / 2, shapeCy - bh / 2 + depth)
                ctx.lineTo(shapeCx + bw / 2 + depth * 0.5, shapeCy - bh / 2)
                ctx.lineTo(shapeCx + bw / 2 + depth * 0.5, shapeCy + bh / 2)
                ctx.lineTo(shapeCx + bw / 2, shapeCy + bh / 2 + depth)
                ctx.closePath()
                ctx.fill()
                ctx.stroke()

                // Dimension labels
                ctx.fillStyle = 'rgba(255,255,255,0.6)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`${baseW.toFixed(1)} cm`, shapeCx, shapeCy + bh / 2 + depth + 20)
                ctx.fillText(`x = ${cut.toFixed(1)}`, shapeCx + bw / 2 + depth * 0.5 + 30, shapeCy)
            } else if (scenario === 'fence') {
                const totalF = cfg.constraint
                const wx = xVal
                const wy = (totalF - wx) / 2
                const scale = Math.min(200 / Math.max(wx, wy, 1), 1.5)
                const rw = wx * scale
                const rh = wy * scale

                // Wall at top
                ctx.fillStyle = 'rgba(100, 100, 100, 0.3)'
                ctx.fillRect(shapeCx - rw / 2 - 20, shapeCy - rh / 2 - 8, rw + 40, 8)
                ctx.fillStyle = 'rgba(255,255,255,0.3)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('WALL', shapeCx, shapeCy - rh / 2 - 12)

                // Fence
                ctx.strokeStyle = CALC_COLOR
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(shapeCx - rw / 2, shapeCy - rh / 2)
                ctx.lineTo(shapeCx - rw / 2, shapeCy + rh / 2)
                ctx.lineTo(shapeCx + rw / 2, shapeCy + rh / 2)
                ctx.lineTo(shapeCx + rw / 2, shapeCy - rh / 2)
                ctx.stroke()

                ctx.fillStyle = 'rgba(180, 120, 255, 0.08)'
                ctx.fillRect(shapeCx - rw / 2, shapeCy - rh / 2, rw, rh)

                ctx.fillStyle = 'rgba(255,255,255,0.6)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`x = ${wx.toFixed(0)}`, shapeCx, shapeCy + rh / 2 + 20)
                ctx.save()
                ctx.translate(shapeCx - rw / 2 - 15, shapeCy)
                ctx.rotate(-Math.PI / 2)
                ctx.fillText(`y = ${wy.toFixed(0)}`, 0, 0)
                ctx.restore()
            } else {
                // Cylinder
                const r = xVal
                const V = cfg.constraint
                const cylH = V / (Math.PI * r * r)
                const scale = Math.min(80 / Math.max(r, cylH / 3, 1), 12)
                const rr = r * scale
                const hh = Math.min(cylH * scale * 0.4, 200)

                // Ellipse top
                ctx.strokeStyle = CALC_COLOR
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.ellipse(shapeCx, shapeCy - hh / 2, rr, rr * 0.3, 0, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(180, 120, 255, 0.08)'
                ctx.fill()
                ctx.stroke()
                // Side
                ctx.beginPath()
                ctx.moveTo(shapeCx - rr, shapeCy - hh / 2)
                ctx.lineTo(shapeCx - rr, shapeCy + hh / 2)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(shapeCx + rr, shapeCy - hh / 2)
                ctx.lineTo(shapeCx + rr, shapeCy + hh / 2)
                ctx.stroke()
                // Bottom ellipse
                ctx.beginPath()
                ctx.ellipse(shapeCx, shapeCy + hh / 2, rr, rr * 0.3, 0, 0, Math.PI)
                ctx.stroke()
                ctx.setLineDash([4, 4])
                ctx.beginPath()
                ctx.ellipse(shapeCx, shapeCy + hh / 2, rr, rr * 0.3, 0, Math.PI, Math.PI * 2)
                ctx.stroke()
                ctx.setLineDash([])

                ctx.fillStyle = 'rgba(255,255,255,0.6)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`r = ${r.toFixed(1)}`, shapeCx, shapeCy + hh / 2 + 30)
                ctx.fillText(`h = ${cylH.toFixed(1)}`, shapeCx + rr + 25, shapeCy)
            }

            // --- Draw objective function graph on right ---
            // Grid
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.06)'
            ctx.lineWidth = 1
            for (let i = 0; i <= 5; i++) {
                const gy = graphY + (graphH * i) / 5
                ctx.beginPath()
                ctx.moveTo(graphX, gy)
                ctx.lineTo(graphX + graphW, gy)
                ctx.stroke()
                const gx = graphX + (graphW * i) / 5
                ctx.beginPath()
                ctx.moveTo(gx, graphY)
                ctx.lineTo(gx, graphY + graphH)
                ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.4)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(graphX, graphY)
            ctx.lineTo(graphX, graphY + graphH)
            ctx.lineTo(graphX + graphW, graphY + graphH)
            ctx.stroke()

            // Compute function values for graphing
            const xMin = cfg.paramMin
            const xMax = cfg.paramMax
            const samples = 200
            let fMax = -Infinity
            let fMin = Infinity
            const vals: number[] = []
            for (let i = 0; i <= samples; i++) {
                const x = xMin + (xMax - xMin) * (i / samples)
                const v = objectiveValue(scenario, x, cfg.constraint)
                vals.push(v)
                if (v > fMax) fMax = v
                if (v < fMin) fMin = v
            }
            const fRange = fMax - fMin || 1

            const toGx = (x: number) => graphX + ((x - xMin) / (xMax - xMin)) * graphW
            const toGy = (f: number) => graphY + graphH - ((f - fMin) / fRange) * graphH * 0.9 - graphH * 0.05

            // Draw curve
            ctx.strokeStyle = CALC_COLOR
            ctx.lineWidth = 2.5
            ctx.beginPath()
            for (let i = 0; i <= samples; i++) {
                const x = xMin + (xMax - xMin) * (i / samples)
                const gx = toGx(x)
                const gy = toGy(vals[i])
                if (i === 0) ctx.moveTo(gx, gy)
                else ctx.lineTo(gx, gy)
            }
            ctx.stroke()

            // Critical point marker
            const cpGx = toGx(cp)
            const cpGy = toGy(optVal)
            const glow = ctx.createRadialGradient(cpGx, cpGy, 0, cpGx, cpGy, 20)
            glow.addColorStop(0, 'rgba(180, 120, 255, 0.5)')
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.beginPath()
            ctx.arc(cpGx, cpGy, 20, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = CALC_COLOR
            ctx.beginPath()
            ctx.arc(cpGx, cpGy, 5, 0, Math.PI * 2)
            ctx.fill()

            // Dashed lines from critical point to axes
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.3)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.moveTo(cpGx, cpGy)
            ctx.lineTo(cpGx, graphY + graphH)
            ctx.moveTo(cpGx, cpGy)
            ctx.lineTo(graphX, cpGy)
            ctx.stroke()
            ctx.setLineDash([])

            // Current x marker
            const curGx = toGx(xVal)
            const curGy = toGy(currentVal)
            ctx.fillStyle = 'rgba(255, 200, 100, 1)'
            ctx.beginPath()
            ctx.arc(curGx, curGy, 6, 0, Math.PI * 2)
            ctx.fill()

            // Tangent line at current x
            if (showTangent) {
                const slope = fPrime
                ctx.strokeStyle = 'rgba(100, 255, 180, 0.6)'
                ctx.lineWidth = 1.5
                const tangentLen = 40
                const dx = tangentLen
                const dy = -slope * ((xMax - xMin) / graphW) * graphH / fRange * tangentLen
                ctx.beginPath()
                ctx.moveTo(curGx - dx, curGy - dy)
                ctx.lineTo(curGx + dx, curGy + dy)
                ctx.stroke()
            }

            // Second derivative annotation at critical point
            if (showSecondDeriv) {
                ctx.fillStyle = fDoublePrime < 0 ? 'rgba(100, 255, 180, 0.8)' : 'rgba(255, 150, 100, 0.8)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(
                    `f''(${cp.toFixed(1)}) = ${fDoublePrime.toFixed(1)} ${fDoublePrime < 0 ? '(concave down -> MAX)' : '(concave up -> MIN)'}`,
                    cpGx, cpGy - 28
                )
            }

            // Axis labels
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.font = '12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('x', graphX + graphW / 2, graphY + graphH + 20)
            ctx.save()
            ctx.translate(graphX - 15, graphY + graphH / 2)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('f(x)', 0, 0)
            ctx.restore()

            // Labels
            ctx.fillStyle = 'rgba(180, 120, 255, 0.6)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`x* = ${cp.toFixed(2)}`, cpGx, graphY + graphH + 14)

            animId = requestAnimationFrame(draw)
        }
        animId = requestAnimationFrame(draw)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [scenario, xVal, showSecondDeriv, showTangent, cfg, cp, optVal, currentVal, fPrime, fDoublePrime])

    const isMax = scenario !== 'cylinder'
    const eqLabel = isMax ? 'Maximize' : 'Minimize'

    const equations = scenario === 'box'
        ? [
            { label: eqLabel, expression: `V(x) = x(${cfg.constraint} - 2x)^2`, description: 'Volume of open box' },
            { label: "f'(x)=0", expression: `x* = ${cfg.constraint}/6 = ${cp.toFixed(2)}`, description: 'Critical point' },
            { label: "f''(x*)", expression: `${fDoublePrime.toFixed(1)} < 0 => Maximum`, description: 'Second derivative test' },
        ]
        : scenario === 'fence'
        ? [
            { label: eqLabel, expression: `A(x) = x(${cfg.constraint} - x)/2`, description: 'Area of fenced region' },
            { label: "f'(x)=0", expression: `x* = ${cfg.constraint}/2 = ${cp.toFixed(0)}`, description: 'Critical point' },
            { label: "f''(x*)", expression: `${fDoublePrime.toFixed(1)} < 0 => Maximum`, description: 'Second derivative test' },
        ]
        : [
            { label: eqLabel, expression: `SA(r) = 2*pi*r^2 + 2V/r`, description: 'Surface area of cylinder' },
            { label: "f'(r)=0", expression: `r* = (V/2pi)^(1/3) = ${cp.toFixed(2)}`, description: 'Critical point' },
            { label: "f''(r*)", expression: `${fDoublePrime.toFixed(1)} > 0 => Minimum`, description: 'Second derivative test' },
        ]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#120a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
                    <APTag course="Calculus AB/BC" unit="Unit 5" color={CALC_COLOR} />
                    <InfoPanel
                        title="Optimization"
                        departmentColor={CALC_COLOR}
                        items={[
                            { label: 'Current x', value: xVal.toFixed(2), color: 'rgb(255, 200, 100)' },
                            { label: 'f(x)', value: currentVal.toFixed(2), color: 'white' },
                            { label: "f'(x)", value: fPrime.toFixed(2), color: 'rgb(100, 255, 180)' },
                            { label: `Optimal x*`, value: cp.toFixed(2), color: CALC_COLOR },
                            { label: `Optimal f(x*)`, value: optVal.toFixed(2), color: CALC_COLOR },
                        ]}
                    />
                    <EquationDisplay
                        equations={equations}
                        departmentColor={CALC_COLOR}
                        title="Optimization Equations"
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
                        onChange={(v) => { setScenario(v as Scenario); setXVal(criticalPoint(v as Scenario, scenarioConfigs[v as Scenario].constraint) * 0.6) }}
                        options={[
                            { value: 'box', label: 'Open Box' },
                            { value: 'fence', label: 'Fenced Area' },
                            { value: 'cylinder', label: 'Cylinder' },
                        ]}
                        label="Scenario"
                    />
                    <div className="flex-1 min-w-[200px]">
                        <Slider
                            value={xVal}
                            onChange={setXVal}
                            min={cfg.paramMin}
                            max={cfg.paramMax}
                            step={cfg.paramStep}
                            label={cfg.paramLabel}
                        />
                    </div>
                    <Toggle value={showTangent} onChange={setShowTangent} label="Tangent" />
                    <Toggle value={showSecondDeriv} onChange={setShowSecondDeriv} label="f''(x) test" />
                    <Button onClick={reset} variant="secondary">Reset</Button>
                    <Button onClick={demo.open} variant="primary">AP Tutorial</Button>
                </div>
            </div>
        </div>
    )
}
