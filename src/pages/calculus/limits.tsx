import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, Slider, Select, Toggle, Button } from '@/components/control-panel'
import type { DemoStep } from '@/components/demo-mode'

type FuncId = 'sinc' | 'piecewise' | 'reciprocal' | 'polynomial' | 'oscillating' | 'absolute'

interface FuncDef {
    label: string
    expr: string
    fn: (x: number) => number
    defaultA: number
    hasJump: boolean
    hasHole: boolean
    hasInfinite: boolean
}

const FUNCS: Record<FuncId, FuncDef> = {
    sinc: {
        label: 'sin(x)/x',
        expr: 'f(x) = sin(x) / x',
        fn: (x: number) => (x === 0 ? NaN : Math.sin(x) / x),
        defaultA: 0, hasJump: false, hasHole: true, hasInfinite: false,
    },
    piecewise: {
        label: 'Piecewise (jump)',
        expr: 'f(x) = { x+1 if x<2, x-1 if x>=2 }',
        fn: (x: number) => (x < 2 ? x + 1 : x - 1),
        defaultA: 2, hasJump: true, hasHole: false, hasInfinite: false,
    },
    reciprocal: {
        label: '1/x',
        expr: 'f(x) = 1 / x',
        fn: (x: number) => (x === 0 ? NaN : 1 / x),
        defaultA: 0, hasJump: false, hasHole: false, hasInfinite: true,
    },
    polynomial: {
        label: 'x^2 - 1',
        expr: 'f(x) = x^2 - 1',
        fn: (x: number) => x * x - 1,
        defaultA: 1, hasJump: false, hasHole: false, hasInfinite: false,
    },
    oscillating: {
        label: 'sin(1/x)',
        expr: 'f(x) = sin(1/x)',
        fn: (x: number) => (x === 0 ? NaN : Math.sin(1 / x)),
        defaultA: 0, hasJump: false, hasHole: false, hasInfinite: false,
    },
    absolute: {
        label: '|x-1|/(x-1)',
        expr: 'f(x) = |x-1| / (x-1)',
        fn: (x: number) => (x === 1 ? NaN : Math.abs(x - 1) / (x - 1)),
        defaultA: 1, hasJump: true, hasHole: false, hasInfinite: false,
    },
}

const COLOR = 'rgb(180, 120, 255)'

function computeLimit(fn: (x: number) => number, a: number, side: 'left' | 'right' | 'both'): number {
    const h = 1e-7
    if (side === 'left' || side === 'both') {
        const lVal = fn(a - h)
        if (side === 'left') return lVal
        const rVal = fn(a + h)
        if (Math.abs(lVal - rVal) < 1e-3) return (lVal + rVal) / 2
        return NaN
    }
    return fn(a + h)
}

function findDelta(fn: (x: number) => number, a: number, L: number, epsilon: number): number {
    for (let d = 0.01; d <= 5; d += 0.01) {
        let ok = true
        for (let t = -1; t <= 1; t += 0.02) {
            if (t === 0) continue
            const x = a + t * d
            const val = fn(x)
            if (!isFinite(val) || Math.abs(val - L) > epsilon) { ok = false; break }
        }
        if (ok) return d
    }
    return 0.5
}

export default function LimitsVisualization() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)

    const [funcId, setFuncId] = useState<FuncId>('sinc')
    const [approachX, setApproachX] = useState(0)
    const [epsilon, setEpsilon] = useState(0.5)
    const [showDelta, setShowDelta] = useState(true)
    const [zoom, setZoom] = useState(1)
    const [showTangent, setShowTangent] = useState(false)

    const funcDef = FUNCS[funcId]

    // Sync approach point when function changes
    useEffect(() => {
        setApproachX(FUNCS[funcId].defaultA)
    }, [funcId])

    const leftLimit = computeLimit(funcDef.fn, approachX, 'left')
    const rightLimit = computeLimit(funcDef.fn, approachX, 'right')
    const limitVal = computeLimit(funcDef.fn, approachX, 'both')
    const fOfA = funcDef.fn(approachX)
    const limitExists = isFinite(leftLimit) && isFinite(rightLimit) && Math.abs(leftLimit - rightLimit) < 1e-3
    const isContinuous = limitExists && isFinite(fOfA) && Math.abs(fOfA - limitVal) < 1e-3

    const delta = limitExists ? findDelta(funcDef.fn, approachX, limitVal, epsilon) : 0

    // Demo steps
    const demoSteps: DemoStep[] = [
        {
            title: 'What is a Limit?',
            description: 'A limit describes the value a function approaches as x gets closer to a point. It does not depend on the actual value at that point -- only on nearby behavior.',
            setup: () => { setFuncId('sinc'); setApproachX(0); setEpsilon(0.5); setShowDelta(true) },
            highlight: 'Watch the left and right arrows converge toward L',
        },
        {
            title: 'Epsilon-Delta Definition',
            description: 'For every epsilon > 0, there exists a delta > 0 such that if 0 < |x - a| < delta, then |f(x) - L| < epsilon. The purple horizontal band is epsilon; the vertical band is delta.',
            setup: () => { setFuncId('sinc'); setEpsilon(0.3); setShowDelta(true) },
            highlight: 'Try shrinking epsilon -- delta shrinks too!',
        },
        {
            title: 'Removable Discontinuity',
            description: 'sin(x)/x is undefined at x=0, but the limit exists and equals 1. This is a removable discontinuity -- we could "fill in" the hole to make it continuous.',
            setup: () => { setFuncId('sinc'); setApproachX(0); setEpsilon(0.5) },
        },
        {
            title: 'Jump Discontinuity',
            description: 'This piecewise function has different left and right limits at x=2. The overall limit does not exist because the one-sided limits disagree.',
            setup: () => { setFuncId('piecewise'); setApproachX(2); setEpsilon(0.5) },
            highlight: 'Left limit = 3, Right limit = 1',
        },
        {
            title: 'Infinite Discontinuity',
            description: 'f(x) = 1/x has a vertical asymptote at x=0. As x approaches 0 from the right, f(x) goes to +infinity. From the left, it goes to -infinity.',
            setup: () => { setFuncId('reciprocal'); setApproachX(0); setEpsilon(0.5) },
        },
        {
            title: 'Oscillating -- Limit DNE',
            description: 'sin(1/x) oscillates infinitely fast as x approaches 0. The function never settles on a single value, so the limit does not exist.',
            setup: () => { setFuncId('oscillating'); setApproachX(0); setEpsilon(0.5) },
        },
        {
            title: 'One-Sided Limits',
            description: 'For |x-1|/(x-1), the left limit is -1 and the right limit is +1. One-sided limits can exist even when the two-sided limit does not.',
            setup: () => { setFuncId('absolute'); setApproachX(1); setEpsilon(0.5) },
            highlight: 'The left and right limits differ by 2',
        },
        {
            title: 'Continuity',
            description: 'A function is continuous at x=a when three conditions hold: f(a) is defined, the limit exists, and f(a) equals the limit. Select the polynomial to see a continuous function.',
            setup: () => { setFuncId('polynomial'); setApproachX(1); setEpsilon(0.5) },
        },
    ]

    const demo = useDemoMode(demoSteps)

    const reset = useCallback(() => {
        setFuncId('sinc')
        setApproachX(0)
        setEpsilon(0.5)
        setShowDelta(true)
        setZoom(1)
        setShowTangent(false)
    }, [])

    // Canvas rendering
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

        let t = 0
        const draw = () => {
            t += 0.02
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const fn = funcDef.fn
            const a = approachX

            // Viewport
            const range = 6 / zoom
            const xMin = a - range
            const xMax = a + range
            const yCenter = limitExists ? limitVal : (isFinite(fOfA) ? fOfA : 0)
            const yRange = 4 / zoom
            const yMin = yCenter - yRange
            const yMax = yCenter + yRange

            const toX = (x: number) => ((x - xMin) / (xMax - xMin)) * w
            const toY = (y: number) => h - ((y - yMin) / (yMax - yMin)) * h

            // Background
            ctx.fillStyle = '#120a1a'
            ctx.fillRect(0, 0, w, h)

            // Grid
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.06)'
            ctx.lineWidth = 1
            const gridStep = range > 8 ? 2 : range > 3 ? 1 : 0.5
            for (let gx = Math.ceil(xMin / gridStep) * gridStep; gx <= xMax; gx += gridStep) {
                ctx.beginPath(); ctx.moveTo(toX(gx), 0); ctx.lineTo(toX(gx), h); ctx.stroke()
            }
            for (let gy = Math.ceil(yMin / gridStep) * gridStep; gy <= yMax; gy += gridStep) {
                ctx.beginPath(); ctx.moveTo(0, toY(gy)); ctx.lineTo(w, toY(gy)); ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.3)'
            ctx.lineWidth = 1.5
            if (yMin <= 0 && yMax >= 0) {
                ctx.beginPath(); ctx.moveTo(0, toY(0)); ctx.lineTo(w, toY(0)); ctx.stroke()
            }
            if (xMin <= 0 && xMax >= 0) {
                ctx.beginPath(); ctx.moveTo(toX(0), 0); ctx.lineTo(toX(0), h); ctx.stroke()
            }

            // Axis ticks and labels
            ctx.fillStyle = 'rgba(180, 120, 255, 0.4)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'center'
            for (let gx = Math.ceil(xMin / gridStep) * gridStep; gx <= xMax; gx += gridStep) {
                if (Math.abs(gx) < 0.01) continue
                const cy = yMin <= 0 && yMax >= 0 ? toY(0) + 14 : h - 8
                ctx.fillText(gx.toFixed(gridStep < 1 ? 1 : 0), toX(gx), cy)
            }
            ctx.textAlign = 'right'
            for (let gy = Math.ceil(yMin / gridStep) * gridStep; gy <= yMax; gy += gridStep) {
                if (Math.abs(gy) < 0.01) continue
                const cx = xMin <= 0 && xMax >= 0 ? toX(0) - 6 : 30
                ctx.fillText(gy.toFixed(gridStep < 1 ? 1 : 0), cx, toY(gy) + 4)
            }

            // Epsilon band (horizontal)
            if (limitExists && showDelta) {
                const L = limitVal
                ctx.fillStyle = 'rgba(180, 120, 255, 0.08)'
                ctx.fillRect(0, toY(L + epsilon), w, toY(L - epsilon) - toY(L + epsilon))

                ctx.setLineDash([6, 4])
                ctx.strokeStyle = 'rgba(180, 120, 255, 0.4)'
                ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(0, toY(L + epsilon)); ctx.lineTo(w, toY(L + epsilon)); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(0, toY(L - epsilon)); ctx.lineTo(w, toY(L - epsilon)); ctx.stroke()
                ctx.setLineDash([])

                // Epsilon labels
                ctx.fillStyle = 'rgba(180, 120, 255, 0.6)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(`L + e = ${(L + epsilon).toFixed(2)}`, 8, toY(L + epsilon) - 4)
                ctx.fillText(`L - e = ${(L - epsilon).toFixed(2)}`, 8, toY(L - epsilon) + 14)

                // Delta band (vertical)
                if (delta > 0) {
                    ctx.fillStyle = 'rgba(120, 200, 255, 0.07)'
                    ctx.fillRect(toX(a - delta), 0, toX(a + delta) - toX(a - delta), h)

                    ctx.setLineDash([6, 4])
                    ctx.strokeStyle = 'rgba(120, 200, 255, 0.35)'
                    ctx.lineWidth = 1
                    ctx.beginPath(); ctx.moveTo(toX(a - delta), 0); ctx.lineTo(toX(a - delta), h); ctx.stroke()
                    ctx.beginPath(); ctx.moveTo(toX(a + delta), 0); ctx.lineTo(toX(a + delta), h); ctx.stroke()
                    ctx.setLineDash([])

                    ctx.fillStyle = 'rgba(120, 200, 255, 0.5)'
                    ctx.font = '10px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`d=${delta.toFixed(2)}`, toX(a + delta), 14)
                }
            }

            // Non-existent limit: show left/right limit lines
            if (!limitExists && (isFinite(leftLimit) || isFinite(rightLimit))) {
                ctx.setLineDash([4, 4])
                ctx.lineWidth = 1.5
                if (isFinite(leftLimit)) {
                    ctx.strokeStyle = 'rgba(255, 140, 100, 0.6)'
                    ctx.beginPath(); ctx.moveTo(0, toY(leftLimit)); ctx.lineTo(toX(a), toY(leftLimit)); ctx.stroke()
                    ctx.fillStyle = 'rgba(255, 140, 100, 0.8)'
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'right'
                    ctx.fillText(`L- = ${leftLimit.toFixed(2)}`, toX(a) - 8, toY(leftLimit) - 6)
                }
                if (isFinite(rightLimit)) {
                    ctx.strokeStyle = 'rgba(100, 220, 160, 0.6)'
                    ctx.beginPath(); ctx.moveTo(toX(a), toY(rightLimit)); ctx.lineTo(w, toY(rightLimit)); ctx.stroke()
                    ctx.fillStyle = 'rgba(100, 220, 160, 0.8)'
                    ctx.textAlign = 'left'
                    ctx.fillText(`L+ = ${rightLimit.toFixed(2)}`, toX(a) + 8, toY(rightLimit) - 6)
                }
                ctx.setLineDash([])
            }

            // Draw the function curve
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.9)'
            ctx.lineWidth = 2.5
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            let penDown = false
            const step = (xMax - xMin) / (w * 0.5)
            for (let px = xMin; px <= xMax; px += step) {
                const val = fn(px)
                if (!isFinite(val) || Math.abs(val) > yRange * 10) {
                    penDown = false; continue
                }
                const cx = toX(px)
                const cy = toY(val)
                if (!penDown) { ctx.moveTo(cx, cy); penDown = true }
                else ctx.lineTo(cx, cy)
            }
            ctx.stroke()

            // Approach point vertical dashed line
            ctx.setLineDash([4, 4])
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(toX(a), 0); ctx.lineTo(toX(a), h); ctx.stroke()
            ctx.setLineDash([])

            // Animated approach arrows
            const arrowT = (Math.sin(t * 2) * 0.5 + 0.5) * delta * 0.8 + 0.02
            const leftX = a - arrowT
            const rightX = a + arrowT
            const leftY = fn(leftX)
            const rightY = fn(rightX)

            // Left approach dot
            if (isFinite(leftY)) {
                ctx.fillStyle = 'rgba(255, 140, 100, 0.9)'
                ctx.beginPath()
                ctx.arc(toX(leftX), toY(leftY), 5, 0, Math.PI * 2)
                ctx.fill()
            }
            // Right approach dot
            if (isFinite(rightY)) {
                ctx.fillStyle = 'rgba(100, 220, 160, 0.9)'
                ctx.beginPath()
                ctx.arc(toX(rightX), toY(rightY), 5, 0, Math.PI * 2)
                ctx.fill()
            }

            // Limit point
            if (limitExists) {
                const L = limitVal
                // Glow
                const glow = ctx.createRadialGradient(toX(a), toY(L), 0, toX(a), toY(L), 24)
                glow.addColorStop(0, 'rgba(180, 120, 255, 0.35)')
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath(); ctx.arc(toX(a), toY(L), 24, 0, Math.PI * 2); ctx.fill()

                // Point
                if (isFinite(fOfA) && Math.abs(fOfA - L) < 1e-3) {
                    ctx.fillStyle = 'rgba(180, 120, 255, 1)'
                    ctx.beginPath(); ctx.arc(toX(a), toY(L), 6, 0, Math.PI * 2); ctx.fill()
                } else {
                    // Open circle (hole)
                    ctx.strokeStyle = 'rgba(180, 120, 255, 1)'
                    ctx.lineWidth = 2
                    ctx.beginPath(); ctx.arc(toX(a), toY(L), 6, 0, Math.PI * 2); ctx.stroke()
                    ctx.fillStyle = '#120a1a'
                    ctx.beginPath(); ctx.arc(toX(a), toY(L), 4, 0, Math.PI * 2); ctx.fill()
                }

                // L label
                ctx.fillStyle = 'rgba(180, 120, 255, 0.9)'
                ctx.font = 'bold 13px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(`L = ${L.toFixed(3)}`, toX(a) + 14, toY(L) - 8)
            }

            // If f(a) is defined but differs from limit, draw the actual value
            if (isFinite(fOfA) && limitExists && Math.abs(fOfA - limitVal) > 1e-3) {
                ctx.fillStyle = 'rgba(255, 200, 100, 1)'
                ctx.beginPath(); ctx.arc(toX(a), toY(fOfA), 5, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(255, 200, 100, 0.8)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(`f(a) = ${fOfA.toFixed(3)}`, toX(a) + 14, toY(fOfA) + 14)
            }

            // Tangent line
            if (showTangent && isFinite(fOfA)) {
                const hh = 1e-5
                const slope = (fn(a + hh) - fn(a - hh)) / (2 * hh)
                if (isFinite(slope)) {
                    ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)'
                    ctx.lineWidth = 1.5
                    ctx.setLineDash([6, 3])
                    const tx1 = xMin
                    const ty1 = fOfA + slope * (tx1 - a)
                    const tx2 = xMax
                    const ty2 = fOfA + slope * (tx2 - a)
                    ctx.beginPath(); ctx.moveTo(toX(tx1), toY(ty1)); ctx.lineTo(toX(tx2), toY(ty2)); ctx.stroke()
                    ctx.setLineDash([])
                    ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'
                    ctx.font = '10px system-ui'
                    ctx.textAlign = 'right'
                    ctx.fillText(`slope = ${slope.toFixed(3)}`, w - 12, 20)
                }
            }

            // Axis labels
            ctx.fillStyle = 'rgba(180, 120, 255, 0.5)'
            ctx.font = '12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('x', w - 16, (yMin <= 0 && yMax >= 0 ? toY(0) : h) - 8)
            ctx.save()
            ctx.translate((xMin <= 0 && xMax >= 0 ? toX(0) : 16) + 8, 16)
            ctx.fillText('y', 0, 0)
            ctx.restore()

            animRef.current = requestAnimationFrame(draw)
        }

        animRef.current = requestAnimationFrame(draw)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animRef.current)
        }
    }, [funcDef, approachX, epsilon, showDelta, zoom, showTangent, limitExists, limitVal, fOfA, delta])

    const funcOptions = Object.entries(FUNCS).map(([id, def]) => ({ value: id, label: def.label }))

    const limitStr = limitExists
        ? limitVal.toFixed(4)
        : (!isFinite(leftLimit) && !isFinite(rightLimit)) ? 'DNE (infinite)' : 'DNE'
    const fAStr = isFinite(fOfA) ? fOfA.toFixed(4) : 'undefined'

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#120a1a]">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Link to="/calculus" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-lg font-medium text-white/90">Limits & Continuity</h1>
                    <APTag course="Calculus AB/BC" unit="Unit 1" color={COLOR} />
                </div>
                <Button onClick={demo.open} className="text-xs">AP Tutorial</Button>
            </div>

            <div className="flex-1 relative flex overflow-hidden">
                {/* Canvas */}
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    {/* Equation overlay */}
                    <EquationDisplay
                        equations={[
                            { label: 'Function', expression: funcDef.expr },
                            {
                                label: 'Limit',
                                expression: `lim(x -> ${approachX}) f(x) = ${limitStr}`,
                                description: limitExists
                                    ? `For all e > 0, there exists d > 0: 0 < |x - ${approachX}| < d => |f(x) - ${limitVal.toFixed(2)}| < e`
                                    : 'The two-sided limit does not exist at this point',
                            },
                        ]}
                        departmentColor={COLOR}
                        className="absolute top-3 left-3 max-w-xs"
                        title="Definitions"
                    />

                    {/* Info panel */}
                    <InfoPanel
                        title="Analysis"
                        departmentColor={COLOR}
                        className="absolute top-3 right-3 min-w-[180px]"
                        items={[
                            { label: 'f(a)', value: fAStr, color: isFinite(fOfA) ? 'rgb(255, 200, 100)' : 'rgb(255, 100, 100)' },
                            { label: 'Left limit', value: isFinite(leftLimit) ? leftLimit.toFixed(4) : 'DNE', color: 'rgb(255, 140, 100)' },
                            { label: 'Right limit', value: isFinite(rightLimit) ? rightLimit.toFixed(4) : 'DNE', color: 'rgb(100, 220, 160)' },
                            { label: 'Limit exists', value: limitExists ? 'Yes' : 'No', color: limitExists ? 'rgb(100, 220, 160)' : 'rgb(255, 100, 100)' },
                            { label: 'Continuous', value: isContinuous ? 'Yes' : 'No', color: isContinuous ? 'rgb(100, 220, 160)' : 'rgb(255, 100, 100)' },
                            ...(showDelta && limitExists ? [{ label: 'Delta', value: delta.toFixed(3), color: 'rgb(120, 200, 255)' }] : []),
                        ]}
                    />

                    {/* Demo mode overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                        <DemoMode
                            steps={demoSteps}
                            currentStep={demo.currentStep}
                            isOpen={demo.isOpen}
                            onClose={demo.close}
                            onNext={demo.next}
                            onPrev={demo.prev}
                            onGoToStep={demo.goToStep}
                            departmentColor={COLOR}
                            title="Limits Tutorial"
                        />
                    </div>
                </div>

                {/* Right sidebar controls */}
                <div className="w-72 bg-black/30 border-l border-white/10 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto">
                    <ControlPanel className="!p-0 !bg-transparent !border-0 !backdrop-blur-0">
                        <Select
                            label="Function"
                            value={funcId}
                            onChange={(v) => setFuncId(v as FuncId)}
                            options={funcOptions}
                        />
                        <Slider
                            label="Approach x = a"
                            value={approachX}
                            onChange={setApproachX}
                            min={-5}
                            max={5}
                            step={0.1}
                        />
                        <Slider
                            label="Epsilon (e)"
                            value={epsilon}
                            onChange={setEpsilon}
                            min={0.05}
                            max={2}
                            step={0.05}
                        />
                        <Slider
                            label="Zoom"
                            value={zoom}
                            onChange={setZoom}
                            min={0.3}
                            max={5}
                            step={0.1}
                        />
                        <Toggle label="Show delta band" value={showDelta} onChange={setShowDelta} />
                        <Toggle label="Show tangent line" value={showTangent} onChange={setShowTangent} />
                    </ControlPanel>

                    <Button onClick={reset} variant="secondary" className="w-full">
                        Reset All
                    </Button>

                    {/* Quick reference */}
                    <div className="mt-auto p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Quick Reference</h4>
                        <ul className="text-xs text-white/50 space-y-1.5 leading-relaxed">
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(255, 140, 100)' }} />Left approach (orange)</li>
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(100, 220, 160)' }} />Right approach (green)</li>
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(180, 120, 255)' }} />Limit value (purple)</li>
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(120, 200, 255)' }} />Delta band (blue)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
