import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { Slider, Button, Select, Toggle } from '@/components/control-panel'

type CurveType = 'rose' | 'cardioid' | 'lemniscate' | 'spiral'

const CALC_COLOR = 'rgb(180, 120, 255)'

const curveLabels: Record<CurveType, string> = {
    rose: 'r = a*cos(n*theta)',
    cardioid: 'r = a*(1 + cos(theta))',
    lemniscate: 'r^2 = a^2*cos(2*theta)',
    spiral: 'r = a*theta',
}

function polarR(curve: CurveType, theta: number, a: number, n: number): number {
    switch (curve) {
        case 'rose': return a * Math.cos(n * theta)
        case 'cardioid': return a * (1 + Math.cos(theta))
        case 'lemniscate': {
            const val = a * a * Math.cos(2 * theta)
            return val >= 0 ? Math.sqrt(val) : -1
        }
        case 'spiral': return a * theta
    }
}

function maxTheta(curve: CurveType, n: number): number {
    switch (curve) {
        case 'rose': return n % 1 === 0 ? (n % 2 === 0 ? 2 * Math.PI : Math.PI) : 4 * Math.PI
        case 'cardioid': return 2 * Math.PI
        case 'lemniscate': return 2 * Math.PI
        case 'spiral': return 6 * Math.PI
    }
}

export default function PolarCurves() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [curveType, setCurveType] = useState<CurveType>('rose')
    const [paramA, setParamA] = useState(2)
    const [paramN, setParamN] = useState(3)
    const [thetaSweep, setThetaSweep] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [showArea, setShowArea] = useState(true)
    const [showGrid, setShowGrid] = useState(true)
    const sweepRef = useRef(0)

    const thetaMax = maxTheta(curveType, paramN)

    const reset = useCallback(() => {
        setThetaSweep(0)
        sweepRef.current = 0
        setIsAnimating(false)
    }, [])

    useEffect(() => { reset() }, [curveType, reset])

    // Compute area via numerical integration: A = (1/2) integral r^2 d(theta)
    const computeArea = useCallback((endTheta: number): number => {
        const steps = 500
        const dt = endTheta / steps
        let area = 0
        for (let i = 0; i < steps; i++) {
            const theta = i * dt
            const r = polarR(curveType, theta, paramA, paramN)
            if (r < 0) continue
            area += 0.5 * r * r * dt
        }
        return area
    }, [curveType, paramA, paramN])

    const demoSteps = [
        { title: 'Polar Coordinates', description: 'In polar coordinates, each point is described by (r, theta) -- distance from origin and angle from positive x-axis. Curves are defined as r = f(theta).', setup: () => { setCurveType('cardioid'); setParamA(2); reset() } },
        { title: 'Rose Curves', description: 'r = a*cos(n*theta) creates rose petals. If n is odd, there are n petals. If n is even, there are 2n petals. Try different values of n!', setup: () => { setCurveType('rose'); setParamN(3); setParamA(2); setIsAnimating(true) } },
        { title: 'Cardioid', description: 'r = a(1 + cos(theta)) creates a heart-shaped cardioid. It passes through the origin when theta = pi. The area is A = (3/2)*pi*a^2.', setup: () => { setCurveType('cardioid'); setParamA(2); reset(); setIsAnimating(true) } },
        { title: 'Lemniscate', description: 'r^2 = a^2*cos(2*theta) creates a figure-eight (lemniscate of Bernoulli). It only exists where cos(2*theta) >= 0.', setup: () => { setCurveType('lemniscate'); setParamA(2); reset(); setIsAnimating(true) } },
        { title: 'Spiral', description: 'r = a*theta is an Archimedean spiral. The curve winds outward as theta increases. The distance between loops is constant = 2*pi*a.', setup: () => { setCurveType('spiral'); setParamA(0.3); reset(); setIsAnimating(true) } },
        { title: 'Area in Polar', description: 'The area enclosed is A = (1/2) integral from alpha to beta of r^2 d(theta). Watch the shaded area grow as theta sweeps. This is key for the AP BC exam.', setup: () => { setCurveType('cardioid'); setParamA(2); setShowArea(true); reset(); setIsAnimating(true) } },
        { title: 'Theta Sweep', description: 'Use the theta slider or animation to trace how the curve is drawn. Each value of theta maps to a point (r*cos(theta), r*sin(theta)) in Cartesian coordinates.', setup: () => { setCurveType('rose'); setParamN(4); reset(); setIsAnimating(true) } },
        { title: 'Parameters', description: 'Adjust parameter a to scale curves and n to change the number of petals for rose curves. Explore how these parameters transform the shapes.', setup: () => { setCurveType('rose'); setParamN(5); setParamA(2.5) } },
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
                sweepRef.current += 0.02
                if (sweepRef.current > thetaMax) sweepRef.current = thetaMax
                setThetaSweep(sweepRef.current)
            }

            const cx = w / 2
            const cy = h / 2

            // Determine scale based on curve
            let maxR = 0
            for (let i = 0; i <= 500; i++) {
                const theta = (thetaMax * i) / 500
                const r = polarR(curveType, theta, paramA, paramN)
                if (r > maxR) maxR = r
            }
            const scale = Math.min(w, h) * 0.35 / Math.max(maxR, 0.5)

            // Polar grid
            if (showGrid) {
                // Concentric circles
                ctx.strokeStyle = 'rgba(180, 120, 255, 0.08)'
                ctx.lineWidth = 1
                const gridStep = Math.max(0.5, Math.ceil(maxR / 4))
                for (let r = gridStep; r <= maxR * 1.3; r += gridStep) {
                    ctx.beginPath()
                    ctx.arc(cx, cy, r * scale, 0, Math.PI * 2)
                    ctx.stroke()
                    ctx.fillStyle = 'rgba(255,255,255,0.2)'
                    ctx.font = '9px system-ui'
                    ctx.textAlign = 'left'
                    ctx.fillText(r.toFixed(1), cx + r * scale + 3, cy - 3)
                }

                // Radial lines
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
                    ctx.beginPath()
                    ctx.moveTo(cx, cy)
                    ctx.lineTo(cx + Math.cos(a) * maxR * 1.3 * scale, cy - Math.sin(a) * maxR * 1.3 * scale)
                    ctx.stroke()
                }

                // Angle labels
                const angleLabels = ['0', 'pi/6', 'pi/3', 'pi/2', '2pi/3', '5pi/6', 'pi', '7pi/6', '4pi/3', '3pi/2', '5pi/3', '11pi/6']
                ctx.fillStyle = 'rgba(255,255,255,0.2)'
                ctx.font = '10px system-ui'
                for (let i = 0; i < 12; i++) {
                    const a = (i * Math.PI) / 6
                    const lx = cx + Math.cos(a) * (maxR * 1.3 * scale + 15)
                    const ly = cy - Math.sin(a) * (maxR * 1.3 * scale + 15)
                    ctx.textAlign = 'center'
                    ctx.fillText(angleLabels[i], lx, ly + 4)
                }
            }

            // Axes
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.3)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(cx - maxR * 1.3 * scale, cy)
            ctx.lineTo(cx + maxR * 1.3 * scale, cy)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(cx, cy - maxR * 1.3 * scale)
            ctx.lineTo(cx, cy + maxR * 1.3 * scale)
            ctx.stroke()

            // Area shading (swept region)
            const currentSweep = sweepRef.current
            if (showArea && currentSweep > 0) {
                ctx.fillStyle = 'rgba(180, 120, 255, 0.1)'
                ctx.beginPath()
                ctx.moveTo(cx, cy)
                const areaSteps = 300
                for (let i = 0; i <= areaSteps; i++) {
                    const theta = (currentSweep * i) / areaSteps
                    const r = polarR(curveType, theta, paramA, paramN)
                    if (r < 0) continue
                    const px = cx + r * scale * Math.cos(theta)
                    const py = cy - r * scale * Math.sin(theta)
                    ctx.lineTo(px, py)
                }
                ctx.closePath()
                ctx.fill()
            }

            // Full curve (faded)
            ctx.strokeStyle = 'rgba(180, 120, 255, 0.15)'
            ctx.lineWidth = 1
            ctx.beginPath()
            let started = false
            for (let i = 0; i <= 1000; i++) {
                const theta = (thetaMax * i) / 1000
                const r = polarR(curveType, theta, paramA, paramN)
                if (r < 0) { started = false; continue }
                const px = cx + r * scale * Math.cos(theta)
                const py = cy - r * scale * Math.sin(theta)
                if (!started) { ctx.moveTo(px, py); started = true }
                else ctx.lineTo(px, py)
            }
            ctx.stroke()

            // Lemniscate second lobe
            if (curveType === 'lemniscate') {
                ctx.beginPath()
                started = false
                for (let i = 0; i <= 1000; i++) {
                    const theta = (thetaMax * i) / 1000
                    const r = polarR(curveType, theta, paramA, paramN)
                    if (r < 0) { started = false; continue }
                    const px = cx - r * scale * Math.cos(theta)
                    const py = cy + r * scale * Math.sin(theta)
                    if (!started) { ctx.moveTo(px, py); started = true }
                    else ctx.lineTo(px, py)
                }
                ctx.stroke()
            }

            // Animated sweep portion (bright)
            if (currentSweep > 0) {
                ctx.strokeStyle = CALC_COLOR
                ctx.lineWidth = 2.5
                ctx.beginPath()
                started = false
                const sweepSteps = 500
                for (let i = 0; i <= sweepSteps; i++) {
                    const theta = (currentSweep * i) / sweepSteps
                    const r = polarR(curveType, theta, paramA, paramN)
                    if (r < 0) { started = false; continue }
                    const px = cx + r * scale * Math.cos(theta)
                    const py = cy - r * scale * Math.sin(theta)
                    if (!started) { ctx.moveTo(px, py); started = true }
                    else ctx.lineTo(px, py)
                }
                ctx.stroke()

                // Current point
                const rCur = polarR(curveType, currentSweep, paramA, paramN)
                if (rCur >= 0) {
                    const cpx = cx + rCur * scale * Math.cos(currentSweep)
                    const cpy = cy - rCur * scale * Math.sin(currentSweep)

                    // Glow
                    const glow = ctx.createRadialGradient(cpx, cpy, 0, cpx, cpy, 15)
                    glow.addColorStop(0, 'rgba(180, 120, 255, 0.5)')
                    glow.addColorStop(1, 'transparent')
                    ctx.fillStyle = glow
                    ctx.beginPath()
                    ctx.arc(cpx, cpy, 15, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.fillStyle = CALC_COLOR
                    ctx.beginPath()
                    ctx.arc(cpx, cpy, 4, 0, Math.PI * 2)
                    ctx.fill()

                    // Radius line from origin to current point
                    ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)'
                    ctx.lineWidth = 1
                    ctx.setLineDash([4, 4])
                    ctx.beginPath()
                    ctx.moveTo(cx, cy)
                    ctx.lineTo(cpx, cpy)
                    ctx.stroke()
                    ctx.setLineDash([])

                    // Theta arc
                    ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)'
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.arc(cx, cy, 30, 0, -currentSweep, true)
                    ctx.stroke()

                    // Labels
                    ctx.fillStyle = 'rgba(255, 200, 100, 0.8)'
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'left'
                    ctx.fillText(`theta = ${currentSweep.toFixed(2)}`, cpx + 10, cpy - 10)
                    ctx.fillText(`r = ${rCur.toFixed(2)}`, cpx + 10, cpy + 5)
                }
            }

            // Origin
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.beginPath()
            ctx.arc(cx, cy, 3, 0, Math.PI * 2)
            ctx.fill()

            animId = requestAnimationFrame(draw)
        }
        animId = requestAnimationFrame(draw)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [curveType, paramA, paramN, isAnimating, showArea, showGrid, thetaMax])

    const currentArea = computeArea(thetaSweep)
    const rCurrent = polarR(curveType, thetaSweep, paramA, paramN)

    const equations = [
        { label: 'Curve', expression: curveLabels[curveType] },
        { label: 'Area', expression: 'A = (1/2) integral r^2 d(theta)', description: `A(theta) = ${currentArea.toFixed(3)}` },
        { label: 'Cartesian', expression: 'x = r*cos(theta), y = r*sin(theta)' },
        { label: 'Arc Length', expression: 'L = integral sqrt(r^2 + (dr/d(theta))^2) d(theta)' },
    ]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#120a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
                    <APTag course="Calculus BC" unit="Unit 9" color={CALC_COLOR} />
                    <InfoPanel
                        title="Polar Curve"
                        departmentColor={CALC_COLOR}
                        items={[
                            { label: 'theta', value: thetaSweep.toFixed(2), color: 'rgb(255, 200, 100)' },
                            { label: 'r(theta)', value: rCurrent >= 0 ? rCurrent.toFixed(3) : 'undef', color: CALC_COLOR },
                            { label: 'Area', value: currentArea.toFixed(3), color: 'rgb(100, 255, 180)' },
                            { label: 'Parameter a', value: paramA.toFixed(1), color: 'white' },
                        ]}
                    />
                    <EquationDisplay
                        equations={equations}
                        departmentColor={CALC_COLOR}
                        title="Polar Equations"
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
                        value={curveType}
                        onChange={(v) => setCurveType(v as CurveType)}
                        options={[
                            { value: 'rose', label: 'Rose r=cos(n*theta)' },
                            { value: 'cardioid', label: 'Cardioid r=1+cos(theta)' },
                            { value: 'lemniscate', label: 'Lemniscate r^2=cos(2*theta)' },
                            { value: 'spiral', label: 'Spiral r=a*theta' },
                        ]}
                        label="Curve Type"
                    />
                    <div className="w-32">
                        <Slider value={paramA} onChange={setParamA} min={0.5} max={4} step={0.1} label="a" />
                    </div>
                    {curveType === 'rose' && (
                        <div className="w-32">
                            <Slider value={paramN} onChange={(v) => { setParamN(v); reset() }} min={1} max={8} step={1} label="n (petals)" />
                        </div>
                    )}
                    <div className="w-44">
                        <Slider value={thetaSweep} onChange={(v) => { setThetaSweep(v); sweepRef.current = v }} min={0} max={thetaMax} step={0.01} label="theta sweep" />
                    </div>
                    <Toggle value={isAnimating} onChange={(v) => { setIsAnimating(v); if (v && sweepRef.current >= thetaMax) { sweepRef.current = 0; setThetaSweep(0) } }} label="Animate" />
                    <Toggle value={showArea} onChange={setShowArea} label="Area" />
                    <Toggle value={showGrid} onChange={setShowGrid} label="Grid" />
                    <Button onClick={reset} variant="secondary">Reset</Button>
                    <Button onClick={demo.open} variant="primary">AP Tutorial</Button>
                </div>
            </div>
        </div>
    )
}
