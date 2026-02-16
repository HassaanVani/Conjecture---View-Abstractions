import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { Slider, Button, Select, Toggle } from '@/components/control-panel'

type CurvePair = 'circle' | 'ellipse' | 'cycloid' | 'lissajous' | 'butterfly'

const CALC_COLOR = 'rgb(180, 120, 255)'

const curveLabels: Record<CurvePair, { x: string; y: string }> = {
    circle: { x: 'x(t) = a*cos(t)', y: 'y(t) = a*sin(t)' },
    ellipse: { x: 'x(t) = a*cos(t)', y: 'y(t) = b*sin(t)' },
    cycloid: { x: 'x(t) = a*(t - sin(t))', y: 'y(t) = a*(1 - cos(t))' },
    lissajous: { x: 'x(t) = a*sin(n*t + phi)', y: 'y(t) = b*sin(m*t)' },
    butterfly: { x: 'x(t) = sin(t)*(e^cos(t) - 2cos(4t))', y: 'y(t) = cos(t)*(e^cos(t) - 2cos(4t))' },
}

function parametricXY(curve: CurvePair, t: number, params: { a: number; b: number; n: number; m: number }): { x: number; y: number } {
    const { a, b, n, m } = params
    switch (curve) {
        case 'circle': return { x: a * Math.cos(t), y: a * Math.sin(t) }
        case 'ellipse': return { x: a * Math.cos(t), y: b * Math.sin(t) }
        case 'cycloid': return { x: a * (t - Math.sin(t)), y: a * (1 - Math.cos(t)) }
        case 'lissajous': return { x: a * Math.sin(n * t + Math.PI / 4), y: b * Math.sin(m * t) }
        case 'butterfly': {
            const factor = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5)
            return { x: a * Math.sin(t) * factor, y: a * Math.cos(t) * factor }
        }
    }
}

function parametricVelocity(curve: CurvePair, t: number, params: { a: number; b: number; n: number; m: number }): { dx: number; dy: number } {
    const h = 0.0001
    const p1 = parametricXY(curve, t - h, params)
    const p2 = parametricXY(curve, t + h, params)
    return { dx: (p2.x - p1.x) / (2 * h), dy: (p2.y - p1.y) / (2 * h) }
}

function tRange(curve: CurvePair): { min: number; max: number } {
    switch (curve) {
        case 'circle': return { min: 0, max: 2 * Math.PI }
        case 'ellipse': return { min: 0, max: 2 * Math.PI }
        case 'cycloid': return { min: 0, max: 4 * Math.PI }
        case 'lissajous': return { min: 0, max: 2 * Math.PI }
        case 'butterfly': return { min: 0, max: 12 * Math.PI }
    }
}

export default function ParametricCurves() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [curvePair, setCurvePair] = useState<CurvePair>('circle')
    const [paramA, setParamA] = useState(2)
    const [paramB, setParamB] = useState(1.5)
    const [paramN, setParamN] = useState(3)
    const [paramM, setParamM] = useState(2)
    const [tCurrent, setTCurrent] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [showVelocity, setShowVelocity] = useState(true)
    const [showArcLength, setShowArcLength] = useState(true)
    const tRef = useRef(0)

    const range = tRange(curvePair)
    const params = { a: paramA, b: paramB, n: paramN, m: paramM }

    const reset = useCallback(() => {
        setTCurrent(0)
        tRef.current = 0
        setIsAnimating(false)
    }, [])

    useEffect(() => { reset() }, [curvePair, reset])

    // Compute arc length numerically
    const computeArcLength = useCallback((endT: number): number => {
        const steps = 500
        const dt = endT / Math.max(steps, 1)
        let length = 0
        let prevPt = parametricXY(curvePair, 0, params)
        for (let i = 1; i <= steps; i++) {
            const t = i * dt
            const pt = parametricXY(curvePair, t, params)
            const dx = pt.x - prevPt.x
            const dy = pt.y - prevPt.y
            length += Math.sqrt(dx * dx + dy * dy)
            prevPt = pt
        }
        return length
    }, [curvePair, params])

    const demoSteps = [
        { title: 'Parametric Curves', description: 'Instead of y = f(x), parametric equations define x and y separately as functions of a parameter t: x = f(t), y = g(t). As t varies, the point traces out a curve.', setup: () => { setCurvePair('circle'); setParamA(2); reset() } },
        { title: 'The Parameter t', description: 'Think of t as time. As t increases, the point moves along the curve. The speed and direction depend on dx/dt and dy/dt. Watch the point trace the circle.', setup: () => { setCurvePair('circle'); setIsAnimating(true) } },
        { title: 'Velocity Vectors', description: 'The velocity vector v(t) = <dx/dt, dy/dt> is tangent to the curve. Its magnitude |v| = sqrt((dx/dt)^2 + (dy/dt)^2) gives the speed. Toggle velocity vectors to see.', setup: () => { setCurvePair('circle'); setShowVelocity(true); setIsAnimating(true) } },
        { title: 'Ellipse', description: 'An ellipse is x = a*cos(t), y = b*sin(t). When a != b, the velocity varies: faster along the short axis, slower along the long axis.', setup: () => { setCurvePair('ellipse'); setParamA(3); setParamB(1.5); reset(); setIsAnimating(true) } },
        { title: 'Cycloid', description: 'A cycloid traces a point on a rolling wheel: x = a(t - sin(t)), y = a(1 - cos(t)). It has cusps where the point touches the ground (velocity = 0).', setup: () => { setCurvePair('cycloid'); setParamA(1.5); reset(); setIsAnimating(true) } },
        { title: 'Lissajous Figures', description: 'x = a*sin(nt + phi), y = b*sin(mt). The ratio n:m determines the shape. Try n=3, m=2 for a pretzel shape. These appear in oscilloscope patterns.', setup: () => { setCurvePair('lissajous'); setParamN(3); setParamM(2); reset(); setIsAnimating(true) } },
        { title: 'Arc Length', description: 'Arc length L = integral sqrt((dx/dt)^2 + (dy/dt)^2) dt from t_0 to t. Watch the accumulated arc length grow as the curve is traced.', setup: () => { setCurvePair('circle'); setShowArcLength(true); reset(); setIsAnimating(true) } },
        { title: 'Butterfly Curve', description: 'The butterfly curve is a beautiful parametric curve. Its complexity shows the power of parametric equations to describe shapes impossible with y = f(x).', setup: () => { setCurvePair('butterfly'); setParamA(1); reset(); setIsAnimating(true) } },
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
                const speed = curvePair === 'butterfly' ? 0.03 : 0.02
                tRef.current += speed
                if (tRef.current > range.max) tRef.current = range.max
                setTCurrent(tRef.current)
            }

            const curT = tRef.current

            // Determine bounds for scaling
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
            const allPts: { x: number; y: number }[] = []
            const fullSamples = 800
            for (let i = 0; i <= fullSamples; i++) {
                const t = range.min + (range.max - range.min) * (i / fullSamples)
                const pt = parametricXY(curvePair, t, params)
                if (!isFinite(pt.x) || !isFinite(pt.y)) continue
                allPts.push(pt)
                if (pt.x < minX) minX = pt.x
                if (pt.x > maxX) maxX = pt.x
                if (pt.y < minY) minY = pt.y
                if (pt.y > maxY) maxY = pt.y
            }

            const rangeX = maxX - minX || 1
            const rangeY = maxY - minY || 1
            const pad = 80
            const plotW = w - 2 * pad
            const plotH = h - 2 * pad
            const scaleVal = Math.min(plotW / rangeX, plotH / rangeY) * 0.85
            const offsetX = w / 2 - ((minX + maxX) / 2) * scaleVal
            const offsetY = h / 2 + ((minY + maxY) / 2) * scaleVal

            const toSx = (x: number) => offsetX + x * scaleVal
            const toSy = (y: number) => offsetY - y * scaleVal

            // Grid
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.06)'
            ctx.lineWidth = 1
            const gridStep = Math.pow(10, Math.floor(Math.log10(Math.max(rangeX, rangeY) / 4)))
            for (let x = Math.ceil(minX / gridStep) * gridStep; x <= maxX; x += gridStep) {
                ctx.beginPath()
                ctx.moveTo(toSx(x), pad)
                ctx.lineTo(toSx(x), h - pad)
                ctx.stroke()
            }
            for (let y = Math.ceil(minY / gridStep) * gridStep; y <= maxY; y += gridStep) {
                ctx.beginPath()
                ctx.moveTo(pad, toSy(y))
                ctx.lineTo(w - pad, toSy(y))
                ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.3)'
            ctx.lineWidth = 1.5
            if (toSy(0) > pad && toSy(0) < h - pad) {
                ctx.beginPath()
                ctx.moveTo(pad, toSy(0))
                ctx.lineTo(w - pad, toSy(0))
                ctx.stroke()
            }
            if (toSx(0) > pad && toSx(0) < w - pad) {
                ctx.beginPath()
                ctx.moveTo(toSx(0), pad)
                ctx.lineTo(toSx(0), h - pad)
                ctx.stroke()
            }

            // Full curve (faded ghost)
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.12)'
            ctx.lineWidth = 1
            ctx.beginPath()
            let started = false
            for (const pt of allPts) {
                const sx = toSx(pt.x)
                const sy = toSy(pt.y)
                if (!started) { ctx.moveTo(sx, sy); started = true }
                else ctx.lineTo(sx, sy)
            }
            ctx.stroke()

            // Traced portion (bright)
            if (curT > range.min) {
                ctx.strokeStyle = CALC_COLOR
                ctx.lineWidth = 2.5
                ctx.beginPath()
                started = false
                const traceSamples = 600
                for (let i = 0; i <= traceSamples; i++) {
                    const t = range.min + (curT - range.min) * (i / traceSamples)
                    const pt = parametricXY(curvePair, t, params)
                    if (!isFinite(pt.x) || !isFinite(pt.y)) { started = false; continue }
                    const sx = toSx(pt.x)
                    const sy = toSy(pt.y)
                    if (!started) { ctx.moveTo(sx, sy); started = true }
                    else ctx.lineTo(sx, sy)
                }
                ctx.stroke()
            }

            // Current point + velocity vector
            const curPt = parametricXY(curvePair, curT, params)
            if (isFinite(curPt.x) && isFinite(curPt.y)) {
                const sx = toSx(curPt.x)
                const sy = toSy(curPt.y)

                // Glow
                const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 18)
                glow.addColorStop(0, 'rgba(180, 120, 255, 0.5)')
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath()
                ctx.arc(sx, sy, 18, 0, Math.PI * 2)
                ctx.fill()

                // Point
                ctx.fillStyle = 'rgba(255, 200, 100, 1)'
                ctx.beginPath()
                ctx.arc(sx, sy, 5, 0, Math.PI * 2)
                ctx.fill()

                // Velocity vector
                if (showVelocity) {
                    const vel = parametricVelocity(curvePair, curT, params)
                    const vMag = Math.sqrt(vel.dx * vel.dx + vel.dy * vel.dy)
                    const vScale = Math.min(60 / Math.max(vMag, 0.01), 40)

                    // Velocity arrow
                    const vx = vel.dx * vScale
                    const vy = -vel.dy * vScale
                    ctx.strokeStyle = 'rgba(100, 255, 180, 0.8)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.moveTo(sx, sy)
                    ctx.lineTo(sx + vx, sy + vy)
                    ctx.stroke()

                    // Arrowhead
                    const angle = Math.atan2(vy, vx)
                    ctx.beginPath()
                    ctx.moveTo(sx + vx, sy + vy)
                    ctx.lineTo(sx + vx - 8 * Math.cos(angle - 0.4), sy + vy - 8 * Math.sin(angle - 0.4))
                    ctx.lineTo(sx + vx - 8 * Math.cos(angle + 0.4), sy + vy - 8 * Math.sin(angle + 0.4))
                    ctx.closePath()
                    ctx.fillStyle = 'rgba(100, 255, 180, 0.8)'
                    ctx.fill()

                    // Component vectors
                    ctx.strokeStyle = 'rgba(255, 130, 130, 0.5)'
                    ctx.lineWidth = 1
                    ctx.setLineDash([3, 3])
                    ctx.beginPath()
                    ctx.moveTo(sx, sy)
                    ctx.lineTo(sx + vx, sy)
                    ctx.stroke()
                    ctx.strokeStyle = 'rgba(130, 200, 255, 0.5)'
                    ctx.beginPath()
                    ctx.moveTo(sx + vx, sy)
                    ctx.lineTo(sx + vx, sy + vy)
                    ctx.stroke()
                    ctx.setLineDash([])

                    // Speed label
                    ctx.fillStyle = 'rgba(100, 255, 180, 0.8)'
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'left'
                    ctx.fillText(`|v| = ${vMag.toFixed(2)}`, sx + vx + 8, sy + vy)
                }

                // Position label
                ctx.fillStyle = 'rgba(255, 200, 100, 0.8)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(`(${curPt.x.toFixed(2)}, ${curPt.y.toFixed(2)})`, sx + 10, sy - 12)
            }

            // Time indicator bar at bottom
            const barY = h - 25
            const barX = pad
            const barW = plotW
            ctx.fillStyle = 'rgba(255,255,255,0.05)'
            ctx.fillRect(barX, barY, barW, 4)
            const progress = (curT - range.min) / (range.max - range.min)
            ctx.fillStyle = CALC_COLOR
            ctx.fillRect(barX, barY, barW * progress, 4)
            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText(`t = ${curT.toFixed(2)}`, barX, barY - 4)
            ctx.textAlign = 'right'
            ctx.fillText(`t_max = ${range.max.toFixed(2)}`, barX + barW, barY - 4)

            animId = requestAnimationFrame(draw)
        }
        animId = requestAnimationFrame(draw)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [curvePair, paramA, paramB, paramN, paramM, isAnimating, showVelocity, showArcLength, range, params])

    const vel = parametricVelocity(curvePair, tCurrent, params)
    const speed = Math.sqrt(vel.dx * vel.dx + vel.dy * vel.dy)
    const arcLen = computeArcLength(tCurrent)
    const curPt = parametricXY(curvePair, tCurrent, params)

    const equations = [
        { label: 'x(t)', expression: curveLabels[curvePair].x },
        { label: 'y(t)', expression: curveLabels[curvePair].y },
        { label: 'dy/dx', expression: '(dy/dt) / (dx/dt)', description: `= ${vel.dx !== 0 ? (vel.dy / vel.dx).toFixed(3) : 'undef'}` },
        { label: 'Speed', expression: 'sqrt((dx/dt)^2 + (dy/dt)^2)', description: `= ${speed.toFixed(3)}` },
        { label: 'Arc Length', expression: 'L = integral |v(t)| dt', description: `L = ${arcLen.toFixed(3)}` },
    ]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#120a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
                    <APTag course="Calculus BC" unit="Unit 9" color={CALC_COLOR} />
                    <InfoPanel
                        title="Parametric Curve"
                        departmentColor={CALC_COLOR}
                        items={[
                            { label: 't', value: tCurrent.toFixed(3), color: 'rgb(255, 200, 100)' },
                            { label: 'Position', value: `(${curPt.x.toFixed(2)}, ${curPt.y.toFixed(2)})`, color: 'white' },
                            { label: 'Speed |v|', value: speed.toFixed(3), color: 'rgb(100, 255, 180)' },
                            { label: 'Arc Length', value: arcLen.toFixed(3), color: CALC_COLOR },
                            { label: 'dx/dt', value: vel.dx.toFixed(3), color: 'rgb(255, 130, 130)' },
                            { label: 'dy/dt', value: vel.dy.toFixed(3), color: 'rgb(130, 200, 255)' },
                        ]}
                    />
                    <EquationDisplay
                        equations={equations}
                        departmentColor={CALC_COLOR}
                        title="Parametric Equations"
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
                        value={curvePair}
                        onChange={(v) => setCurvePair(v as CurvePair)}
                        options={[
                            { value: 'circle', label: 'Circle' },
                            { value: 'ellipse', label: 'Ellipse' },
                            { value: 'cycloid', label: 'Cycloid' },
                            { value: 'lissajous', label: 'Lissajous' },
                            { value: 'butterfly', label: 'Butterfly' },
                        ]}
                        label="Curve"
                    />
                    <div className="w-28">
                        <Slider value={paramA} onChange={setParamA} min={0.5} max={4} step={0.1} label="a" />
                    </div>
                    {(curvePair === 'ellipse' || curvePair === 'lissajous') && (
                        <div className="w-28">
                            <Slider value={paramB} onChange={setParamB} min={0.5} max={4} step={0.1} label="b" />
                        </div>
                    )}
                    {curvePair === 'lissajous' && (
                        <>
                            <div className="w-24">
                                <Slider value={paramN} onChange={setParamN} min={1} max={6} step={1} label="n" />
                            </div>
                            <div className="w-24">
                                <Slider value={paramM} onChange={setParamM} min={1} max={6} step={1} label="m" />
                            </div>
                        </>
                    )}
                    <div className="w-40">
                        <Slider value={tCurrent} onChange={(v) => { setTCurrent(v); tRef.current = v }} min={range.min} max={range.max} step={0.01} label="t" />
                    </div>
                    <Toggle value={isAnimating} onChange={(v) => { setIsAnimating(v); if (v && tRef.current >= range.max) { tRef.current = 0; setTCurrent(0) } }} label="Animate" />
                    <Toggle value={showVelocity} onChange={setShowVelocity} label="Velocity" />
                    <Toggle value={showArcLength} onChange={setShowArcLength} label="Arc Len" />
                    <Button onClick={reset} variant="secondary">Reset</Button>
                    <Button onClick={demo.open} variant="primary">AP Tutorial</Button>
                </div>
            </div>
        </div>
    )
}
