import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { Slider, Button, Select, Toggle } from '@/components/control-panel'

type FuncType = 'sin' | 'cos' | 'exp' | 'ln1x' | 'geo'

const CALC_COLOR = 'rgb(180, 120, 255)'

const funcLabels: Record<FuncType, string> = {
    sin: 'sin(x)',
    cos: 'cos(x)',
    exp: 'e^x',
    ln1x: 'ln(1+x)',
    geo: '1/(1-x)',
}

const convergenceRadii: Record<FuncType, string> = {
    sin: 'R = Infinity',
    cos: 'R = Infinity',
    exp: 'R = Infinity',
    ln1x: 'R = 1 (centered at 0)',
    geo: 'R = 1 (centered at 0)',
}

function factorial(n: number): number {
    if (n <= 1) return 1
    let result = 1
    for (let i = 2; i <= n; i++) result *= i
    return result
}

function trueFunction(ft: FuncType, x: number): number {
    switch (ft) {
        case 'sin': return Math.sin(x)
        case 'cos': return Math.cos(x)
        case 'exp': return Math.exp(x)
        case 'ln1x': return Math.log(1 + x)
        case 'geo': return 1 / (1 - x)
    }
}

function nthDerivativeAtA(ft: FuncType, n: number, a: number): number {
    // For general Taylor series, compute nth derivative at a numerically
    // But for Maclaurin (a=0) of standard functions we know exact forms
    if (a === 0) {
        switch (ft) {
            case 'sin': {
                const cycle = n % 4
                if (cycle === 0) return 0
                if (cycle === 1) return 1
                if (cycle === 2) return 0
                return -1
            }
            case 'cos': {
                const cycle = n % 4
                if (cycle === 0) return 1
                if (cycle === 1) return 0
                if (cycle === 2) return -1
                return 0
            }
            case 'exp': return 1
            case 'ln1x': {
                if (n === 0) return 0
                return Math.pow(-1, n + 1) * factorial(n - 1)
            }
            case 'geo': return factorial(n)
        }
    }
    // Numerical differentiation for non-zero center
    const h = 0.0001
    if (n === 0) return trueFunction(ft, a)
    // Use finite differences recursively (limited precision for high n)
    let coeffs = [1]
    for (let k = 0; k < n; k++) {
        const next: number[] = []
        for (let i = 0; i <= coeffs.length; i++) {
            const left = i > 0 ? coeffs[i - 1] : 0
            const right = i < coeffs.length ? coeffs[i] : 0
            next.push(left - right)
        }
        coeffs = next
    }
    let sum = 0
    for (let i = 0; i < coeffs.length; i++) {
        sum += coeffs[i] * trueFunction(ft, a + (n / 2 - i) * h)
    }
    return sum / Math.pow(h, n)
}

function taylorValue(ft: FuncType, x: number, a: number, degree: number): number {
    let sum = 0
    for (let n = 0; n <= degree; n++) {
        const coeff = nthDerivativeAtA(ft, n, a) / factorial(n)
        sum += coeff * Math.pow(x - a, n)
    }
    return sum
}

export default function TaylorSeries() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [funcType, setFuncType] = useState<FuncType>('sin')
    const [center, setCenter] = useState(0)
    const [degree, setDegree] = useState(5)
    const [showError, setShowError] = useState(true)
    const [showConvergence, setShowConvergence] = useState(false)

    const xMin = -6
    const xMax = 6
    const yMin = -4
    const yMax = 4

    const reset = useCallback(() => {
        setCenter(0)
        setDegree(5)
        setShowError(true)
    }, [])

    const demoSteps = [
        { title: 'Taylor Series', description: 'A Taylor series approximates any smooth function as a polynomial. Near the center point a, a degree-n polynomial matches the function\'s value and first n derivatives.', setup: () => { setFuncType('sin'); setCenter(0); setDegree(1) } },
        { title: 'Increasing Degree', description: 'As we add more terms (increase degree), the polynomial approximation matches the function over a wider interval. Watch the purple curves approach the white original.', setup: () => { setDegree(3) } },
        { title: 'Higher Accuracy', description: 'At degree 7, the Taylor polynomial for sin(x) is nearly indistinguishable from sin(x) over [-pi, pi]. Each term adds one more matched derivative.', setup: () => { setDegree(7) } },
        { title: 'The Error', description: 'The error |f(x) - T_n(x)| grows as you move away from the center. The Lagrange error bound gives |R_n(x)| <= M|x-a|^(n+1)/(n+1)! where M bounds |f^(n+1)|.', setup: () => { setShowError(true); setDegree(5) } },
        { title: 'Center Point', description: 'Moving the center a shifts where the approximation is most accurate. A Taylor series centered at a=0 is called a Maclaurin series.', setup: () => { setCenter(2); setDegree(5) } },
        { title: 'Convergence Radius', description: 'Some series converge everywhere (sin, cos, e^x). Others converge only within a radius R. For ln(1+x) and 1/(1-x), R=1 from center 0.', setup: () => { setFuncType('ln1x'); setCenter(0); setDegree(10); setShowConvergence(true) } },
        { title: 'Common Series', description: 'Try all 5 functions. e^x = sum x^n/n!, sin(x) = sum (-1)^n x^(2n+1)/(2n+1)!, cos(x) = sum (-1)^n x^(2n)/(2n)!. These are essential for the BC exam.', setup: () => { setFuncType('exp'); setCenter(0); setDegree(8); setShowConvergence(false) } },
        { title: 'Explore!', description: 'Adjust degree, center, and function type. Try degree 20 for stunning accuracy. Notice how alternating series (sin, cos) converge differently than geometric series.', setup: () => { setDegree(15) } },
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

            const pad = 60
            const plotW = w - 2 * pad
            const plotH = h - 2 * pad

            const toSx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * plotW
            const toSy = (y: number) => pad + ((yMax - y) / (yMax - yMin)) * plotH

            // Grid
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.06)'
            ctx.lineWidth = 1
            for (let x = Math.ceil(xMin); x <= xMax; x++) {
                ctx.beginPath()
                ctx.moveTo(toSx(x), pad)
                ctx.lineTo(toSx(x), pad + plotH)
                ctx.stroke()
            }
            for (let y = Math.ceil(yMin); y <= yMax; y++) {
                ctx.beginPath()
                ctx.moveTo(pad, toSy(y))
                ctx.lineTo(pad + plotW, toSy(y))
                ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.4)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(toSx(xMin), toSy(0))
            ctx.lineTo(toSx(xMax), toSy(0))
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(toSx(0), toSy(yMin))
            ctx.lineTo(toSx(0), toSy(yMax))
            ctx.stroke()

            // Axis ticks
            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'center'
            for (let x = Math.ceil(xMin); x <= xMax; x++) {
                if (x === 0) continue
                ctx.fillText(String(x), toSx(x), toSy(0) + 14)
            }
            ctx.textAlign = 'right'
            for (let y = Math.ceil(yMin); y <= yMax; y++) {
                if (y === 0) continue
                ctx.fillText(String(y), toSx(0) - 6, toSy(y) + 4)
            }

            // Convergence radius shading
            if (showConvergence && (funcType === 'ln1x' || funcType === 'geo')) {
                const rLeft = toSx(center - 1)
                const rRight = toSx(center + 1)
                ctx.fillStyle = 'rgba(180, 120, 255, 0.05)'
                ctx.fillRect(rLeft, pad, rRight - rLeft, plotH)
                ctx.strokeStyle = 'rgba(180, 120, 255, 0.3)'
                ctx.lineWidth = 1
                ctx.setLineDash([4, 4])
                ctx.beginPath()
                ctx.moveTo(rLeft, pad)
                ctx.lineTo(rLeft, pad + plotH)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(rRight, pad)
                ctx.lineTo(rRight, pad + plotH)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(180, 120, 255, 0.5)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Convergence Region', (rLeft + rRight) / 2, pad + 15)
            }

            // True function (white)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.lineWidth = 2
            ctx.beginPath()
            let started = false
            const samples = 500
            for (let i = 0; i <= samples; i++) {
                const x = xMin + (xMax - xMin) * (i / samples)
                // Skip singularities
                if (funcType === 'ln1x' && x <= -1) continue
                if (funcType === 'geo' && Math.abs(x - 1) < 0.05) { started = false; continue }
                const y = trueFunction(funcType, x)
                if (!isFinite(y) || y < yMin - 1 || y > yMax + 1) { started = false; continue }
                const sx = toSx(x)
                const sy = toSy(y)
                if (!started) { ctx.moveTo(sx, sy); started = true }
                else ctx.lineTo(sx, sy)
            }
            ctx.stroke()

            // Taylor polynomials (show intermediate degrees as faded)
            const degreesToShow = showConvergence
                ? [degree]
                : [Math.max(1, degree - 4), Math.max(1, degree - 2), degree]

            for (let di = 0; di < degreesToShow.length; di++) {
                const d = degreesToShow[di]
                if (d < 1) continue
                const isCurrent = d === degree
                const alpha = isCurrent ? 0.9 : 0.2 + 0.15 * di

                ctx.strokeStyle = `rgba(180, 120, 255, ${alpha})`
                ctx.lineWidth = isCurrent ? 2.5 : 1.5
                ctx.beginPath()
                started = false
                for (let i = 0; i <= samples; i++) {
                    const x = xMin + (xMax - xMin) * (i / samples)
                    const y = taylorValue(funcType, x, center, d)
                    if (!isFinite(y) || y < yMin - 2 || y > yMax + 2) { started = false; continue }
                    const sx = toSx(x)
                    const sy = toSy(Math.max(yMin - 1, Math.min(yMax + 1, y)))
                    if (!started) { ctx.moveTo(sx, sy); started = true }
                    else ctx.lineTo(sx, sy)
                }
                ctx.stroke()

                // Degree label
                if (isCurrent) {
                    const labelX = toSx(center + 2)
                    const labelY = toSy(taylorValue(funcType, center + 2, center, d))
                    if (labelY > pad && labelY < pad + plotH) {
                        ctx.fillStyle = CALC_COLOR
                        ctx.font = 'bold 12px system-ui'
                        ctx.textAlign = 'left'
                        ctx.fillText(`T${d}(x)`, labelX + 5, labelY - 5)
                    }
                }
            }

            // Center point marker
            const centerSx = toSx(center)
            const centerSy = toSy(trueFunction(funcType, center))
            if (isFinite(centerSy) && centerSy > pad && centerSy < pad + plotH) {
                ctx.fillStyle = 'rgba(255, 200, 100, 0.9)'
                ctx.beginPath()
                ctx.arc(centerSx, centerSy, 5, 0, Math.PI * 2)
                ctx.fill()
                ctx.fillStyle = 'rgba(255, 200, 100, 0.7)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`a = ${center}`, centerSx, centerSy - 10)
            }

            // Error visualization
            if (showError) {
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)'
                ctx.lineWidth = 1
                ctx.beginPath()
                started = false
                for (let i = 0; i <= samples; i++) {
                    const x = xMin + (xMax - xMin) * (i / samples)
                    if (funcType === 'ln1x' && x <= -1) continue
                    if (funcType === 'geo' && Math.abs(x - 1) < 0.05) { started = false; continue }
                    const truY = trueFunction(funcType, x)
                    const tayY = taylorValue(funcType, x, center, degree)
                    const err = Math.abs(truY - tayY)
                    if (!isFinite(err)) { started = false; continue }
                    const mapped = Math.min(err * 30, plotH / 2)
                    const sy = pad + plotH - mapped
                    const sx = toSx(x)
                    if (!started) { ctx.moveTo(sx, sy); started = true }
                    else ctx.lineTo(sx, sy)
                }
                ctx.stroke()

                ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'right'
                ctx.fillText('|error| (scaled)', pad + plotW, pad + plotH - 5)
            }

            // Legend
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            const legendX = pad + 10
            let legendY = pad + 20
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.fillText(`f(x) = ${funcLabels[funcType]}`, legendX + 15, legendY)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(legendX, legendY - 3)
            ctx.lineTo(legendX + 12, legendY - 3)
            ctx.stroke()

            legendY += 18
            ctx.fillStyle = CALC_COLOR
            ctx.fillText(`T_${degree}(x) Taylor polynomial`, legendX + 15, legendY)
            ctx.strokeStyle = CALC_COLOR
            ctx.lineWidth = 2.5
            ctx.beginPath()
            ctx.moveTo(legendX, legendY - 3)
            ctx.lineTo(legendX + 12, legendY - 3)
            ctx.stroke()

            animId = requestAnimationFrame(draw)
        }
        animId = requestAnimationFrame(draw)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [funcType, center, degree, showError, showConvergence, xMin, xMax, yMin, yMax])

    // Compute error at x = center + 1
    const errorAtOne = Math.abs(trueFunction(funcType, center + 1) - taylorValue(funcType, center + 1, center, degree))

    const equations = [
        { label: 'Taylor', expression: `T_n(x) = sum f^(k)(a)/k! * (x-a)^k`, description: `Center a = ${center}, degree n = ${degree}` },
        { label: 'Function', expression: `f(x) = ${funcLabels[funcType]}` },
        { label: 'Error', expression: `|R_${degree}(${center + 1})| = ${errorAtOne.toExponential(3)}`, description: 'Lagrange remainder bound' },
        { label: 'Convergence', expression: convergenceRadii[funcType] },
    ]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#120a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
                    <APTag course="Calculus BC" unit="Unit 10" color={CALC_COLOR} />
                    <InfoPanel
                        title="Taylor Series"
                        departmentColor={CALC_COLOR}
                        items={[
                            { label: 'Function', value: funcLabels[funcType], color: 'white' },
                            { label: 'Center a', value: center, color: 'rgb(255, 200, 100)' },
                            { label: 'Degree n', value: degree, color: CALC_COLOR },
                            { label: `Error at x=${center + 1}`, value: errorAtOne.toExponential(3), color: 'rgb(255, 100, 100)' },
                        ]}
                    />
                    <EquationDisplay
                        equations={equations}
                        departmentColor={CALC_COLOR}
                        title="Series Equations"
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
                        value={funcType}
                        onChange={(v) => { setFuncType(v as FuncType); setCenter(0) }}
                        options={[
                            { value: 'sin', label: 'sin(x)' },
                            { value: 'cos', label: 'cos(x)' },
                            { value: 'exp', label: 'e^x' },
                            { value: 'ln1x', label: 'ln(1+x)' },
                            { value: 'geo', label: '1/(1-x)' },
                        ]}
                        label="Function"
                    />
                    <div className="w-36">
                        <Slider value={center} onChange={setCenter} min={-3} max={3} step={0.5} label="Center a" />
                    </div>
                    <div className="w-44">
                        <Slider value={degree} onChange={setDegree} min={1} max={20} step={1} label={`Degree n = ${degree}`} />
                    </div>
                    <Toggle value={showError} onChange={setShowError} label="Error" />
                    <Toggle value={showConvergence} onChange={setShowConvergence} label="Radius" />
                    <Button onClick={reset} variant="secondary">Reset</Button>
                    <Button onClick={demo.open} variant="primary">AP Tutorial</Button>
                </div>
            </div>
        </div>
    )
}
