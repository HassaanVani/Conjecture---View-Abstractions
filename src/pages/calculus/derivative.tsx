import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Toggle, Select, Button } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type FuncKey = 'x2' | 'x3' | 'sin' | 'cos' | 'exp' | 'ln' | 'recip' | 'sqrt'

interface FuncDef {
    label: string
    f: (x: number) => number
    df: (x: number) => number
    expr: string
    dexpr: string
    domain: [number, number]
}

const FUNCS: Record<FuncKey, FuncDef> = {
    x2:    { label: 'x\u00B2',   f: x => x * x,       df: x => 2 * x,             expr: 'x\u00B2',       dexpr: '2x',         domain: [-5, 5] },
    x3:    { label: 'x\u00B3',   f: x => x ** 3,      df: x => 3 * x * x,         expr: 'x\u00B3',       dexpr: '3x\u00B2',   domain: [-3, 3] },
    sin:   { label: 'sin(x)',    f: x => Math.sin(x),  df: x => Math.cos(x),       expr: 'sin(x)',        dexpr: 'cos(x)',      domain: [-7, 7] },
    cos:   { label: 'cos(x)',    f: x => Math.cos(x),  df: x => -Math.sin(x),      expr: 'cos(x)',        dexpr: '-sin(x)',     domain: [-7, 7] },
    exp:   { label: 'e\u02E3',   f: x => Math.exp(x),  df: x => Math.exp(x),       expr: 'e\u02E3',       dexpr: 'e\u02E3',    domain: [-3, 3] },
    ln:    { label: 'ln(x)',     f: x => Math.log(x),  df: x => 1 / x,             expr: 'ln(x)',         dexpr: '1/x',        domain: [0.1, 8] },
    recip: { label: '1/x',      f: x => 1 / x,        df: x => -1 / (x * x),      expr: '1/x',           dexpr: '-1/x\u00B2', domain: [0.2, 6] },
    sqrt:  { label: '\u221Ax',   f: x => Math.sqrt(x), df: x => 1 / (2 * Math.sqrt(x)), expr: '\u221Ax', dexpr: '1/(2\u221Ax)', domain: [0, 8] },
}

const CALC_COLOR = 'rgb(180, 120, 255)'
const BG = '#120a1a'

export default function DerivativeExplorer() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [funcKey, setFuncKey] = useState<FuncKey>('x2')
    const [xPos, setXPos] = useState(1.5)
    const [hVal, setHVal] = useState(1.0)
    const [showTangent, setShowTangent] = useState(true)
    const [showDerivGraph, setShowDerivGraph] = useState(false)

    const func = FUNCS[funcKey]
    const clampX = useCallback((x: number) => {
        const [lo, hi] = func.domain
        return Math.max(lo + 0.01, Math.min(hi - 0.01, x))
    }, [func.domain])

    const xClamped = clampX(xPos)
    const fVal = func.f(xClamped)
    const dfVal = func.df(xClamped)
    const secantSlope = (func.f(xClamped + hVal) - fVal) / hVal

    const resetState = useCallback(() => {
        setFuncKey('x2')
        setXPos(1.5)
        setHVal(1.0)
        setShowTangent(true)
        setShowDerivGraph(false)
    }, [])

    const demoSteps: DemoStep[] = [
        {
            title: 'The Slope of a Curve',
            description: 'Unlike a line, a curve has a different slope at every point. The derivative tells us the instantaneous rate of change -- the slope of the curve at a single point.',
            highlight: 'Drag the x-position slider to see how the slope changes.',
            setup: () => { setFuncKey('x2'); setXPos(1.5); setHVal(1.0); setShowTangent(true); setShowDerivGraph(false) },
        },
        {
            title: 'The Secant Line',
            description: 'A secant line passes through two points on the curve: (x, f(x)) and (x+h, f(x+h)). Its slope is the average rate of change over the interval [x, x+h].',
            highlight: 'Notice the secant line connecting two points on the curve.',
            setup: () => { setHVal(1.5); setShowTangent(false) },
        },
        {
            title: 'The Limit Definition',
            description: 'As h approaches 0, the secant line approaches the tangent line. The derivative is defined as: f\'(x) = lim(h->0) [f(x+h) - f(x)] / h. Watch the secant morph into the tangent!',
            highlight: 'Decrease h toward 0 and watch the secant approach the tangent.',
            setup: () => { setHVal(0.3); setShowTangent(true) },
        },
        {
            title: 'The Tangent Line',
            description: 'The tangent line touches the curve at exactly one point and has slope equal to f\'(x). It represents the best linear approximation of the function near that point.',
            highlight: 'The tangent line slope equals the derivative value.',
            setup: () => { setHVal(0.01); setShowTangent(true) },
        },
        {
            title: 'The Derivative as a Function',
            description: 'f\'(x) is itself a function. For f(x) = x\u00B2, the derivative f\'(x) = 2x is a line. Toggle the f\'(x) graph to see the derivative plotted below.',
            highlight: 'Enable "Show f\'(x) graph" to see the derivative function.',
            setup: () => { setFuncKey('x2'); setShowDerivGraph(true); setHVal(0.5) },
        },
        {
            title: 'Common Derivatives',
            description: 'Power rule: d/dx[x\u207F] = nx\u207F\u207B\u00B9. Trig: d/dx[sin(x)] = cos(x). Exponential: d/dx[e\u02E3] = e\u02E3. Try switching functions to verify these rules!',
            highlight: 'Select different functions and compare f(x) with f\'(x).',
            setup: () => { setFuncKey('sin'); setShowDerivGraph(true); setXPos(0) },
        },
        {
            title: 'Where f\'(x) = 0',
            description: 'When f\'(x) = 0, the tangent line is horizontal -- this indicates a local maximum, minimum, or inflection point. These critical points are key in optimization.',
            highlight: 'Move x to where the tangent line is flat (slope = 0).',
            setup: () => { setFuncKey('x3'); setXPos(0); setShowDerivGraph(true); setShowTangent(true); setHVal(0.01) },
        },
        {
            title: 'Chain Rule Concept',
            description: 'For composite functions f(g(x)), the derivative is f\'(g(x)) * g\'(x). The chain rule lets us differentiate "function inside a function" by multiplying the rates.',
            highlight: 'This foundational rule extends to all composite derivatives.',
            setup: () => { setFuncKey('exp'); setShowDerivGraph(true); setXPos(1); setShowTangent(true); setHVal(0.01) },
        },
    ]

    const demo = useDemoMode(demoSteps)

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animId: number

        const render = () => {
            const dpr = window.devicePixelRatio || 1
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            canvas.width = w * dpr
            canvas.height = h * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            ctx.fillStyle = BG
            ctx.fillRect(0, 0, w, h)

            const pad = 50
            const topH = showDerivGraph ? (h - 20) * 0.55 : h
            const botY = topH + 20
            const botH = h - botY

            const [domLo, domHi] = func.domain
            const domRange = domHi - domLo

            // Compute y range for f(x)
            let fMin = Infinity, fMax = -Infinity
            for (let i = 0; i <= 200; i++) {
                const xi = domLo + (domRange * i) / 200
                const yi = func.f(xi)
                if (isFinite(yi)) { fMin = Math.min(fMin, yi); fMax = Math.max(fMax, yi) }
            }
            const fPad = (fMax - fMin) * 0.15 || 1
            fMin -= fPad; fMax += fPad

            const toX = (x: number) => pad + ((x - domLo) / domRange) * (w - 2 * pad)
            const toY = (y: number) => pad + ((fMax - y) / (fMax - fMin)) * (topH - 2 * pad)

            // --- TOP PANEL: f(x) ---
            // Grid
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.06)'
            ctx.lineWidth = 1
            const xStep = domRange <= 8 ? 1 : 2
            for (let xg = Math.ceil(domLo); xg <= domHi; xg += xStep) {
                ctx.beginPath(); ctx.moveTo(toX(xg), pad); ctx.lineTo(toX(xg), topH - pad); ctx.stroke()
            }
            const yRange = fMax - fMin
            const yStep = yRange <= 5 ? 0.5 : yRange <= 20 ? 2 : yRange <= 50 ? 5 : 10
            for (let yg = Math.ceil(fMin / yStep) * yStep; yg <= fMax; yg += yStep) {
                ctx.beginPath(); ctx.moveTo(pad, toY(yg)); ctx.lineTo(w - pad, toY(yg)); ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.35)'
            ctx.lineWidth = 1.5
            if (fMin <= 0 && fMax >= 0) {
                ctx.beginPath(); ctx.moveTo(pad, toY(0)); ctx.lineTo(w - pad, toY(0)); ctx.stroke()
            }
            if (domLo <= 0 && domHi >= 0) {
                ctx.beginPath(); ctx.moveTo(toX(0), pad); ctx.lineTo(toX(0), topH - pad); ctx.stroke()
            }

            // Tick labels
            ctx.fillStyle = 'rgba(180, 120, 255, 0.5)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'center'
            for (let xg = Math.ceil(domLo); xg <= domHi; xg += xStep) {
                const yBase = (fMin <= 0 && fMax >= 0) ? toY(0) : topH - pad
                ctx.fillText(xg.toString(), toX(xg), yBase + 14)
            }
            ctx.textAlign = 'right'
            for (let yg = Math.ceil(fMin / yStep) * yStep; yg <= fMax; yg += yStep) {
                const xBase = (domLo <= 0 && domHi >= 0) ? toX(0) : pad
                ctx.fillText(yg.toFixed(yStep < 1 ? 1 : 0), xBase - 6, toY(yg) + 3)
            }

            // f(x) curve
            ctx.strokeStyle = CALC_COLOR
            ctx.lineWidth = 2.5
            ctx.lineCap = 'round'
            ctx.beginPath()
            let started = false
            for (let i = 0; i <= 400; i++) {
                const xi = domLo + (domRange * i) / 400
                const yi = func.f(xi)
                if (!isFinite(yi) || yi < fMin - 10 || yi > fMax + 10) { started = false; continue }
                const px = toX(xi), py = toY(yi)
                if (!started) { ctx.moveTo(px, py); started = true } else ctx.lineTo(px, py)
            }
            ctx.stroke()

            // Label
            ctx.fillStyle = CALC_COLOR
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText(`f(x) = ${func.expr}`, pad + 4, pad - 8)

            const cx = clampX(xPos)
            const fy = func.f(cx)
            const fxh = func.f(cx + hVal)
            const slope = (fxh - fy) / hVal
            const tanSlope = func.df(cx)

            // Secant line (x, f(x)) to (x+h, f(x+h))
            if (hVal > 0.005) {
                ctx.strokeStyle = 'rgba(255, 180, 60, 0.7)'
                ctx.lineWidth = 1.5
                ctx.setLineDash([6, 4])
                const extend = domRange * 0.6
                const sx1 = cx - extend, sx2 = cx + hVal + extend
                const sy1 = fy + slope * (sx1 - cx), sy2 = fy + slope * (sx2 - cx)
                ctx.beginPath(); ctx.moveTo(toX(sx1), toY(sy1)); ctx.lineTo(toX(sx2), toY(sy2)); ctx.stroke()
                ctx.setLineDash([])

                // Second point on curve (x+h, f(x+h))
                if (isFinite(fxh)) {
                    ctx.fillStyle = 'rgba(255, 180, 60, 0.9)'
                    ctx.beginPath(); ctx.arc(toX(cx + hVal), toY(fxh), 5, 0, Math.PI * 2); ctx.fill()
                }

                // h bracket
                ctx.strokeStyle = 'rgba(255, 180, 60, 0.5)'
                ctx.lineWidth = 1
                const bracketY = toY(Math.min(fy, fxh)) + 20
                ctx.beginPath()
                ctx.moveTo(toX(cx), bracketY); ctx.lineTo(toX(cx + hVal), bracketY)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 180, 60, 0.7)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`h=${hVal.toFixed(3)}`, toX(cx + hVal / 2), bracketY + 12)
            }

            // Tangent line
            if (showTangent) {
                ctx.strokeStyle = 'rgba(100, 220, 160, 0.8)'
                ctx.lineWidth = 2
                const extend = domRange * 0.4
                const t1 = cx - extend, t2 = cx + extend
                const ty1 = fy + tanSlope * (t1 - cx), ty2 = fy + tanSlope * (t2 - cx)
                ctx.beginPath(); ctx.moveTo(toX(t1), toY(ty1)); ctx.lineTo(toX(t2), toY(ty2)); ctx.stroke()
            }

            // Point on curve glow
            const glow = ctx.createRadialGradient(toX(cx), toY(fy), 0, toX(cx), toY(fy), 18)
            glow.addColorStop(0, 'rgba(180, 120, 255, 0.5)')
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.beginPath(); ctx.arc(toX(cx), toY(fy), 18, 0, Math.PI * 2); ctx.fill()

            ctx.fillStyle = 'white'
            ctx.beginPath(); ctx.arc(toX(cx), toY(fy), 5, 0, Math.PI * 2); ctx.fill()
            ctx.strokeStyle = CALC_COLOR
            ctx.lineWidth = 2
            ctx.stroke()

            // --- BOTTOM PANEL: f'(x) ---
            if (showDerivGraph && botH > 60) {
                // Separator
                ctx.strokeStyle = 'rgba(180, 120, 255, 0.15)'
                ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(pad, botY - 10); ctx.lineTo(w - pad, botY - 10); ctx.stroke()

                // Compute df range
                let dfMin = Infinity, dfMax = -Infinity
                for (let i = 0; i <= 200; i++) {
                    const xi = domLo + (domRange * i) / 200
                    const dyi = func.df(xi)
                    if (isFinite(dyi)) { dfMin = Math.min(dfMin, dyi); dfMax = Math.max(dfMax, dyi) }
                }
                const dfPad2 = (dfMax - dfMin) * 0.15 || 1
                dfMin -= dfPad2; dfMax += dfPad2

                const toYd = (y: number) => botY + ((dfMax - y) / (dfMax - dfMin)) * (botH - pad)

                // Zero line for derivative
                if (dfMin <= 0 && dfMax >= 0) {
                    ctx.strokeStyle = 'rgba(100, 220, 160, 0.25)'
                    ctx.lineWidth = 1
                    ctx.beginPath(); ctx.moveTo(pad, toYd(0)); ctx.lineTo(w - pad, toYd(0)); ctx.stroke()
                }

                // x-axis for derivative
                ctx.strokeStyle = 'rgba(100, 220, 160, 0.15)'
                for (let xg = Math.ceil(domLo); xg <= domHi; xg += xStep) {
                    ctx.beginPath(); ctx.moveTo(toX(xg), botY); ctx.lineTo(toX(xg), h - 5); ctx.stroke()
                }

                // Tick labels
                ctx.fillStyle = 'rgba(100, 220, 160, 0.5)'
                ctx.font = '9px system-ui'
                ctx.textAlign = 'right'
                const dyStep = (dfMax - dfMin) <= 5 ? 0.5 : (dfMax - dfMin) <= 20 ? 2 : 5
                for (let yg = Math.ceil(dfMin / dyStep) * dyStep; yg <= dfMax; yg += dyStep) {
                    ctx.fillText(yg.toFixed(dyStep < 1 ? 1 : 0), pad - 6, toYd(yg) + 3)
                }

                // f'(x) curve
                ctx.strokeStyle = 'rgba(100, 220, 160, 0.9)'
                ctx.lineWidth = 2
                ctx.beginPath()
                let dStarted = false
                for (let i = 0; i <= 400; i++) {
                    const xi = domLo + (domRange * i) / 400
                    const dyi = func.df(xi)
                    if (!isFinite(dyi)) { dStarted = false; continue }
                    const px = toX(xi), py = toYd(dyi)
                    if (!dStarted) { ctx.moveTo(px, py); dStarted = true } else ctx.lineTo(px, py)
                }
                ctx.stroke()

                // Point on derivative
                const dfAtX = func.df(cx)
                if (isFinite(dfAtX)) {
                    ctx.fillStyle = 'rgba(100, 220, 160, 1)'
                    ctx.beginPath(); ctx.arc(toX(cx), toYd(dfAtX), 5, 0, Math.PI * 2); ctx.fill()
                    ctx.strokeStyle = 'white'
                    ctx.lineWidth = 1.5
                    ctx.stroke()

                    // Vertical sync line
                    ctx.strokeStyle = 'rgba(180, 120, 255, 0.2)'
                    ctx.setLineDash([3, 3])
                    ctx.lineWidth = 1
                    ctx.beginPath(); ctx.moveTo(toX(cx), toY(fy)); ctx.lineTo(toX(cx), toYd(dfAtX)); ctx.stroke()
                    ctx.setLineDash([])
                }

                // Label
                ctx.fillStyle = 'rgba(100, 220, 160, 0.9)'
                ctx.font = 'bold 12px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(`f'(x) = ${func.dexpr}`, pad + 4, botY + 14)
            }

            animId = requestAnimationFrame(render)
        }

        animId = requestAnimationFrame(render)
        return () => cancelAnimationFrame(animId)
    }, [funcKey, xPos, hVal, showTangent, showDerivGraph, func, clampX])

    // Handle resize
    useEffect(() => {
        const handleResize = () => { /* re-render triggered by RAF loop */ }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const funcOptions = (Object.keys(FUNCS) as FuncKey[]).map(k => ({ value: k, label: FUNCS[k].label }))

    return (
        <div className="h-[calc(100vh-64px)] flex bg-[#120a1a]">
            {/* Left sidebar controls */}
            <div className="w-72 flex-shrink-0 border-r border-white/10 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <APTag course="Calculus AB/BC" unit="Unit 2" color={CALC_COLOR} />
                    <Button variant="secondary" onClick={demo.open} className="text-xs">
                        AP Tutorial
                    </Button>
                </div>

                <ControlPanel>
                    <Select
                        value={funcKey}
                        onChange={v => { setFuncKey(v as FuncKey); setXPos(FUNCS[v as FuncKey].domain[0] + (FUNCS[v as FuncKey].domain[1] - FUNCS[v as FuncKey].domain[0]) * 0.4) }}
                        options={funcOptions}
                        label="Function f(x)"
                    />

                    <ControlGroup label="x position">
                        <Slider
                            value={xPos}
                            onChange={setXPos}
                            min={func.domain[0] + 0.01}
                            max={func.domain[1] - 0.01}
                            step={0.01}
                            label={`x = ${clampX(xPos).toFixed(2)}`}
                        />
                    </ControlGroup>

                    <ControlGroup label="h value (secant width)">
                        <Slider
                            value={hVal}
                            onChange={setHVal}
                            min={0.001}
                            max={2.0}
                            step={0.001}
                            label={`h = ${hVal.toFixed(3)}`}
                        />
                    </ControlGroup>

                    <Toggle value={showTangent} onChange={setShowTangent} label="Show tangent line" />
                    <Toggle value={showDerivGraph} onChange={setShowDerivGraph} label="Show f'(x) graph" />

                    <Button variant="secondary" onClick={resetState} className="w-full">
                        Reset
                    </Button>
                </ControlPanel>

                <EquationDisplay
                    departmentColor={CALC_COLOR}
                    title="Derivative Definition"
                    equations={[
                        {
                            label: 'Limit',
                            expression: "f'(x) = lim(h\u21920) [f(x+h)-f(x)]/h",
                            description: 'The formal definition of the derivative',
                        },
                        {
                            label: 'f(x)',
                            expression: func.expr,
                        },
                        {
                            label: "f'(x)",
                            expression: func.dexpr,
                        },
                        {
                            label: 'Slope',
                            expression: `f'(${clampX(xPos).toFixed(2)}) = ${dfVal.toFixed(4)}`,
                            description: `Tangent slope at x = ${clampX(xPos).toFixed(2)}`,
                        },
                    ]}
                />

                <InfoPanel
                    departmentColor={CALC_COLOR}
                    title="Values at Current Point"
                    items={[
                        { label: 'f(x)', value: fVal.toFixed(4), color: CALC_COLOR },
                        { label: "f'(x)", value: dfVal.toFixed(4), color: 'rgb(100, 220, 160)' },
                        { label: 'Secant slope', value: secantSlope.toFixed(4), color: 'rgb(255, 180, 60)' },
                        { label: 'Tangent slope', value: dfVal.toFixed(4), color: 'rgb(100, 220, 160)' },
                        { label: 'Difference', value: Math.abs(secantSlope - dfVal).toFixed(6), color: hVal < 0.01 ? 'rgba(100,220,160,0.7)' : 'rgba(255,180,60,0.7)' },
                    ]}
                />
            </div>

            {/* Canvas area */}
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Legend overlay */}
                <div className="absolute top-4 right-4 backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-0.5 rounded" style={{ backgroundColor: CALC_COLOR, display: 'inline-block' }} />
                        <span className="text-white/60">f(x) = {func.expr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-0.5 rounded bg-[rgb(255,180,60)]" style={{ display: 'inline-block' }} />
                        <span className="text-white/60">Secant line</span>
                    </div>
                    {showTangent && (
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-0.5 rounded bg-[rgb(100,220,160)]" style={{ display: 'inline-block' }} />
                            <span className="text-white/60">Tangent line</span>
                        </div>
                    )}
                    {showDerivGraph && (
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-0.5 rounded bg-[rgb(100,220,160)]" style={{ display: 'inline-block', opacity: 0.6 }} />
                            <span className="text-white/60">f'(x) = {func.dexpr}</span>
                        </div>
                    )}
                </div>

                {/* Demo mode overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                    <DemoMode
                        steps={demoSteps}
                        currentStep={demo.currentStep}
                        isOpen={demo.isOpen}
                        onClose={demo.close}
                        onNext={demo.next}
                        onPrev={demo.prev}
                        onGoToStep={demo.goToStep}
                        departmentColor={CALC_COLOR}
                        title="AP Calculus Tutorial"
                    />
                </div>
            </div>
        </div>
    )
}
