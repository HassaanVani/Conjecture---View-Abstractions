import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { Slider, Button, Select, Toggle } from '@/components/control-panel'

type DiffEq = 'y' | 'x+y' | 'xy' | 'x2-y' | 'sinx'

const CALC_COLOR = 'rgb(180, 120, 255)'

const diffEqLabels: Record<DiffEq, string> = {
    'y': 'dy/dx = y',
    'x+y': 'dy/dx = x + y',
    'xy': 'dy/dx = xy',
    'x2-y': 'dy/dx = x^2 - y',
    'sinx': 'dy/dx = sin(x)',
}

const diffEqSolutions: Record<DiffEq, string> = {
    'y': 'y = Ce^x',
    'x+y': 'y = Ce^x - x - 1',
    'xy': 'y = Ce^(x^2/2)',
    'x2-y': 'y = x^2 - 2x + 2 + Ce^(-x)',
    'sinx': 'y = -cos(x) + C',
}

function slopeAt(eq: DiffEq, x: number, y: number): number {
    switch (eq) {
        case 'y': return y
        case 'x+y': return x + y
        case 'xy': return x * y
        case 'x2-y': return x * x - y
        case 'sinx': return Math.sin(x)
    }
}

interface SolutionCurve {
    points: { x: number; y: number }[]
    color: string
}

const CURVE_COLORS = [
    'rgba(100, 255, 180, 0.8)',
    'rgba(255, 200, 100, 0.8)',
    'rgba(255, 130, 130, 0.8)',
    'rgba(130, 200, 255, 0.8)',
    'rgba(255, 180, 255, 0.8)',
]

export default function SlopeFields() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [diffEq, setDiffEq] = useState<DiffEq>('y')
    const [gridDensity, setGridDensity] = useState(15)
    const [stepSize, setStepSize] = useState(0.1)
    const [showEuler, setShowEuler] = useState(false)
    const [curves, setCurves] = useState<SolutionCurve[]>([])
    const [xRange] = useState(5)
    const [yRange] = useState(5)

    const reset = useCallback(() => {
        setCurves([])
    }, [])

    useEffect(() => { reset() }, [diffEq, reset])

    const addCurve = useCallback((x0: number, y0: number) => {
        const points: { x: number; y: number }[] = []
        const dt = showEuler ? stepSize : 0.02

        // Forward Euler
        let x = x0
        let y = y0
        for (let i = 0; i < 500; i++) {
            points.push({ x, y })
            if (Math.abs(y) > yRange * 3 || x > xRange * 1.5) break
            const s = slopeAt(diffEq, x, y)
            if (!isFinite(s)) break
            if (showEuler) {
                y += s * dt
                x += dt
            } else {
                // RK4 for smoother curves
                const k1 = s
                const k2 = slopeAt(diffEq, x + dt / 2, y + k1 * dt / 2)
                const k3 = slopeAt(diffEq, x + dt / 2, y + k2 * dt / 2)
                const k4 = slopeAt(diffEq, x + dt, y + k3 * dt)
                y += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
                x += dt
            }
        }

        // Backward
        x = x0
        y = y0
        const backPoints: { x: number; y: number }[] = []
        for (let i = 0; i < 500; i++) {
            if (Math.abs(y) > yRange * 3 || x < -xRange * 1.5) break
            const s = slopeAt(diffEq, x, y)
            if (!isFinite(s)) break
            if (showEuler) {
                y -= s * dt
                x -= dt
            } else {
                const k1 = slopeAt(diffEq, x, y)
                const k2 = slopeAt(diffEq, x - dt / 2, y - k1 * dt / 2)
                const k3 = slopeAt(diffEq, x - dt / 2, y - k2 * dt / 2)
                const k4 = slopeAt(diffEq, x - dt, y - k3 * dt)
                y -= (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
                x -= dt
            }
            backPoints.unshift({ x, y })
        }

        const allPoints = [...backPoints, ...points]
        const color = CURVE_COLORS[curves.length % CURVE_COLORS.length]
        setCurves(prev => [...prev, { points: allPoints, color }])
    }, [diffEq, showEuler, stepSize, xRange, yRange, curves.length])

    const demoSteps = [
        { title: 'Slope Fields', description: 'A slope field shows tiny line segments whose slopes match dy/dx at each point. Together they reveal the "flow" of solutions without solving the DE.', setup: () => { setDiffEq('y'); reset() } },
        { title: 'Reading the Field', description: 'Each segment shows the slope of ANY solution curve passing through that point. Where segments are steep, solutions change rapidly. Where flat, solutions are nearly constant.', setup: () => { setDiffEq('sinx'); reset() } },
        { title: 'Solution Curves', description: 'Click anywhere on the field to trace a solution curve through that initial condition. The curve follows the slope segments like a river follows its banks.', setup: () => { setDiffEq('y'); reset() } },
        { title: 'Initial Conditions', description: 'Different initial conditions give different solution curves. Each curve is ONE particular solution. The general solution contains a constant C that the initial condition determines.', setup: () => { setDiffEq('y'); reset(); addCurve(0, 1); addCurve(0, -1) } },
        { title: 'Euler\'s Method', description: 'Toggle Euler\'s method to see step-by-step numerical approximation. With small steps, Euler matches the true solution. With large steps, you see approximation error.', setup: () => { setDiffEq('y'); setShowEuler(true); setStepSize(0.3); reset() } },
        { title: 'Step Size Matters', description: 'Smaller step sizes give better Euler approximations but require more computation. Try adjusting the step size to see how accuracy changes.', setup: () => { setStepSize(0.05) } },
        { title: 'Different Equations', description: 'Try different differential equations. Notice how dy/dx = y has exponential solutions, dy/dx = sin(x) has sinusoidal solutions, and dy/dx = xy has Gaussian-like solutions.', setup: () => { setDiffEq('xy'); setShowEuler(false); reset() } },
    ]

    const demo = useDemoMode(demoSteps)

    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const w = canvas.offsetWidth
        const h = canvas.offsetHeight
        const pad = 50

        const x = ((mx - pad) / (w - 2 * pad)) * 2 * xRange - xRange
        const y = -(((my - pad) / (h - 2 * pad)) * 2 * yRange - yRange)

        if (Math.abs(x) <= xRange && Math.abs(y) <= yRange) {
            addCurve(x, y)
        }
    }, [addCurve, xRange, yRange])

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

            const pad = 50
            const plotW = w - 2 * pad
            const plotH = h - 2 * pad

            const toScreenX = (x: number) => pad + ((x + xRange) / (2 * xRange)) * plotW
            const toScreenY = (y: number) => pad + ((-y + yRange) / (2 * yRange)) * plotH

            // Grid lines
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.06)'
            ctx.lineWidth = 1
            for (let x = -xRange; x <= xRange; x++) {
                ctx.beginPath()
                ctx.moveTo(toScreenX(x), pad)
                ctx.lineTo(toScreenX(x), pad + plotH)
                ctx.stroke()
            }
            for (let y = -yRange; y <= yRange; y++) {
                ctx.beginPath()
                ctx.moveTo(pad, toScreenY(y))
                ctx.lineTo(pad + plotW, toScreenY(y))
                ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.4)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(toScreenX(-xRange), toScreenY(0))
            ctx.lineTo(toScreenX(xRange), toScreenY(0))
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(toScreenX(0), toScreenY(-yRange))
            ctx.lineTo(toScreenX(0), toScreenY(yRange))
            ctx.stroke()

            // Axis labels
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'center'
            for (let x = -xRange; x <= xRange; x++) {
                if (x === 0) continue
                ctx.fillText(String(x), toScreenX(x), toScreenY(0) + 15)
            }
            ctx.textAlign = 'right'
            for (let y = -yRange; y <= yRange; y++) {
                if (y === 0) continue
                ctx.fillText(String(y), toScreenX(0) - 8, toScreenY(y) + 4)
            }

            // Slope field segments
            const segLen = Math.min(plotW, plotH) / (gridDensity * 2.5)
            ctx.lineCap = 'round'

            for (let i = 0; i <= gridDensity; i++) {
                for (let j = 0; j <= gridDensity; j++) {
                    const x = -xRange + (2 * xRange * i) / gridDensity
                    const y = -yRange + (2 * yRange * j) / gridDensity
                    const slope = slopeAt(diffEq, x, y)

                    if (!isFinite(slope)) continue

                    const angle = Math.atan(slope)
                    const dx = Math.cos(angle) * segLen / 2
                    const dy = Math.sin(angle) * segLen / 2

                    const sx = toScreenX(x)
                    const sy = toScreenY(y)

                    // Color based on slope magnitude
                    const mag = Math.min(Math.abs(slope) / 3, 1)
                    const r = Math.round(180 + 75 * mag)
                    const g = Math.round(120 - 20 * mag)
                    const b = 255
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`
                    ctx.lineWidth = 1.5

                    ctx.beginPath()
                    ctx.moveTo(sx - dx, sy + dy)
                    ctx.lineTo(sx + dx, sy - dy)
                    ctx.stroke()
                }
            }

            // Solution curves
            for (const curve of curves) {
                ctx.strokeStyle = curve.color
                ctx.lineWidth = showEuler ? 1.5 : 2
                ctx.beginPath()
                let started = false
                for (const pt of curve.points) {
                    if (Math.abs(pt.y) > yRange * 2) { started = false; continue }
                    const sx = toScreenX(pt.x)
                    const sy = toScreenY(pt.y)
                    if (!started) { ctx.moveTo(sx, sy); started = true }
                    else ctx.lineTo(sx, sy)
                }
                ctx.stroke()

                // For Euler, show step dots
                if (showEuler) {
                    ctx.fillStyle = curve.color
                    for (let i = 0; i < curve.points.length; i += Math.max(1, Math.floor(0.02 / stepSize))) {
                        const pt = curve.points[i]
                        if (Math.abs(pt.y) > yRange * 2) continue
                        ctx.beginPath()
                        ctx.arc(toScreenX(pt.x), toScreenY(pt.y), 2, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }
            }

            // Click instruction
            if (curves.length === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.25)'
                ctx.font = '14px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Click anywhere to add a solution curve', w / 2, h - 20)
            }

            animId = requestAnimationFrame(draw)
        }
        animId = requestAnimationFrame(draw)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [diffEq, gridDensity, curves, showEuler, stepSize, xRange, yRange])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#120a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" onClick={handleCanvasClick} />

                <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
                    <APTag course="Calculus AB/BC" unit="Unit 7" color={CALC_COLOR} />
                    <InfoPanel
                        title="Slope Field"
                        departmentColor={CALC_COLOR}
                        items={[
                            { label: 'Equation', value: diffEqLabels[diffEq], color: CALC_COLOR },
                            { label: 'Solutions', value: String(curves.length), color: 'white' },
                            { label: 'Method', value: showEuler ? `Euler (h=${stepSize})` : 'RK4 (exact)', color: showEuler ? 'rgb(255, 200, 100)' : 'rgb(100, 255, 180)' },
                            { label: 'Grid points', value: String((gridDensity + 1) * (gridDensity + 1)) },
                        ]}
                    />
                    <EquationDisplay
                        equations={[
                            { label: 'DE', expression: diffEqLabels[diffEq] },
                            { label: 'General', expression: diffEqSolutions[diffEq], description: 'General solution with constant C' },
                            ...(showEuler ? [{ label: 'Euler', expression: `y_{n+1} = y_n + f(x_n, y_n) * ${stepSize}`, description: 'Euler step formula' }] : []),
                        ]}
                        departmentColor={CALC_COLOR}
                        title="Differential Equation"
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
                        value={diffEq}
                        onChange={(v) => setDiffEq(v as DiffEq)}
                        options={[
                            { value: 'y', label: 'dy/dx = y' },
                            { value: 'x+y', label: 'dy/dx = x + y' },
                            { value: 'xy', label: 'dy/dx = xy' },
                            { value: 'x2-y', label: 'dy/dx = x^2 - y' },
                            { value: 'sinx', label: 'dy/dx = sin(x)' },
                        ]}
                        label="Equation"
                    />
                    <div className="w-36">
                        <Slider value={gridDensity} onChange={setGridDensity} min={8} max={25} step={1} label="Grid Density" />
                    </div>
                    <Toggle value={showEuler} onChange={setShowEuler} label="Euler's Method" />
                    {showEuler && (
                        <div className="w-36">
                            <Slider value={stepSize} onChange={setStepSize} min={0.01} max={0.5} step={0.01} label="Step Size h" />
                        </div>
                    )}
                    <Button onClick={reset} variant="secondary">Clear Curves</Button>
                    <Button onClick={demo.open} variant="primary">AP Tutorial</Button>
                </div>
            </div>
        </div>
    )
}
