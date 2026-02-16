import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CalculusBackground } from '@/components/backgrounds'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { ControlPanel, ControlGroup, Slider, ButtonGroup, Toggle, Select, Button } from '@/components/control-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

type Method = 'left' | 'right' | 'midpoint' | 'trapezoid'
type FuncKey = 'x2' | 'sin' | 'exp' | 'inv' | 'sqrt' | 'cubic'

interface FuncDef {
    label: string; fn: (x: number) => number; latex: string; ad: (x: number) => number
}

const FUNCS: Record<FuncKey, FuncDef> = {
    x2:    { label: 'x\u00B2',       fn: x => x * x,               latex: 'f(x) = x\u00B2',         ad: x => x ** 3 / 3 },
    sin:   { label: 'sin(x)',        fn: x => Math.sin(x),         latex: 'f(x) = sin(x)',          ad: x => -Math.cos(x) },
    exp:   { label: 'e\u02E3',       fn: x => Math.exp(x),         latex: 'f(x) = e\u02E3',         ad: x => Math.exp(x) },
    inv:   { label: '1/x',          fn: x => x === 0 ? NaN : 1/x, latex: 'f(x) = 1/x',            ad: x => Math.log(Math.abs(x)) },
    sqrt:  { label: '\u221Ax',       fn: x => x >= 0 ? Math.sqrt(x) : NaN, latex: 'f(x) = \u221Ax', ad: x => (2/3) * x ** 1.5 },
    cubic: { label: 'x\u00B3\u2212x', fn: x => x**3 - x,          latex: 'f(x) = x\u00B3 \u2212 x', ad: x => x**4/4 - x**2/2 },
}

const ACCENT = 'rgb(180, 120, 255)'
const BG = '#120a1a'

export default function RiemannSums() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const displayN = useRef(4)
    const [funcKey, setFuncKey] = useState<FuncKey>('x2')
    const [n, setN] = useState(4)
    const [method, setMethod] = useState<Method>('left')
    const [a, setA] = useState(0)
    const [b, setB] = useState(3)
    const [showExact, setShowExact] = useState(true)

    const f = FUNCS[funcKey].fn

    const riemannSum = useCallback((fn: (x: number) => number, lo: number, hi: number, cnt: number, m: Method) => {
        const dx = (hi - lo) / cnt
        let sum = 0
        for (let i = 0; i < cnt; i++) {
            const xL = lo + i * dx, xR = xL + dx
            if (m === 'left') sum += fn(xL) * dx
            else if (m === 'right') sum += fn(xR) * dx
            else if (m === 'midpoint') sum += fn((xL + xR) / 2) * dx
            else sum += (fn(xL) + fn(xR)) / 2 * dx
        }
        return sum
    }, [])

    const exact = FUNCS[funcKey].ad(b) - FUNCS[funcKey].ad(a)
    const approx = riemannSum(f, a, b, n, method)
    const error = Math.abs(approx - exact)

    // Animated n transition
    useEffect(() => {
        const target = n
        let raf = 0
        const step = () => {
            const cur = displayN.current
            if (Math.abs(cur - target) < 0.5) { displayN.current = target; return }
            displayN.current += (target - cur) * 0.15
            raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [n])

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        let raf = 0
        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        const draw = () => {
            const w = canvas.offsetWidth, h = canvas.offsetHeight
            const pad = { l: 60, r: 30, t: 30, b: 50 }
            const gw = w - pad.l - pad.r, gh = h - pad.t - pad.b
            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = BG
            ctx.fillRect(0, 0, w, h)

            const vA = Math.min(a, b) - 0.5, vB = Math.max(a, b) + 0.5
            let yMin = 0, yMax = 1
            for (let px = 0; px <= gw; px++) {
                const y = f(vA + (px / gw) * (vB - vA))
                if (isFinite(y)) { yMin = Math.min(yMin, y); yMax = Math.max(yMax, y) }
            }
            const yP = (yMax - yMin) * 0.15 || 1
            yMin -= yP; yMax += yP

            const toX = (x: number) => pad.l + ((x - vA) / (vB - vA)) * gw
            const toY = (y: number) => pad.t + (1 - (y - yMin) / (yMax - yMin)) * gh

            // Grid
            ctx.strokeStyle = 'rgba(180,120,255,0.06)'; ctx.lineWidth = 1
            const xS = Math.pow(10, Math.floor(Math.log10(vB - vA)))
            for (let gx = Math.ceil(vA / xS) * xS; gx <= vB; gx += xS) {
                ctx.beginPath(); ctx.moveTo(toX(gx), pad.t); ctx.lineTo(toX(gx), pad.t + gh); ctx.stroke()
            }
            const yS = Math.pow(10, Math.floor(Math.log10(yMax - yMin)))
            for (let gy = Math.ceil(yMin / yS) * yS; gy <= yMax; gy += yS) {
                ctx.beginPath(); ctx.moveTo(pad.l, toY(gy)); ctx.lineTo(pad.l + gw, toY(gy)); ctx.stroke()
            }

            // Axes at 0
            ctx.strokeStyle = 'rgba(180,120,255,0.4)'; ctx.lineWidth = 1.5
            if (yMin <= 0 && yMax >= 0) { ctx.beginPath(); ctx.moveTo(pad.l, toY(0)); ctx.lineTo(pad.l + gw, toY(0)); ctx.stroke() }
            if (vA <= 0 && vB >= 0) { ctx.beginPath(); ctx.moveTo(toX(0), pad.t); ctx.lineTo(toX(0), pad.t + gh); ctx.stroke() }

            // Ticks
            ctx.fillStyle = 'rgba(180,120,255,0.5)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
            const yBase = yMin <= 0 && yMax >= 0 ? toY(0) : pad.t + gh
            for (let gx = Math.ceil(vA / xS) * xS; gx <= vB; gx += xS)
                ctx.fillText(gx.toFixed(xS < 1 ? 1 : 0), toX(gx), yBase + 15)
            ctx.textAlign = 'right'
            for (let gy = Math.ceil(yMin / yS) * yS; gy <= yMax; gy += yS)
                ctx.fillText(gy.toFixed(yS < 1 ? 1 : 0), pad.l - 8, toY(gy) + 4)

            // Rectangles / Trapezoids
            const aN = Math.round(displayN.current)
            const lo = Math.min(a, b), hi = Math.max(a, b), dx = (hi - lo) / aN
            for (let i = 0; i < aN; i++) {
                const xL = lo + i * dx, xR = xL + dx, fL = f(xL), fR = f(xR)
                if (method === 'trapezoid') {
                    const y0 = toY(0)
                    ctx.beginPath()
                    ctx.moveTo(toX(xL), y0); ctx.lineTo(toX(xL), toY(fL))
                    ctx.lineTo(toX(xR), toY(fR)); ctx.lineTo(toX(xR), y0)
                    ctx.closePath()
                    const pos = (fL + fR) / 2 >= 0
                    ctx.fillStyle = pos ? 'rgba(100,200,150,0.25)' : 'rgba(255,100,120,0.25)'; ctx.fill()
                    ctx.strokeStyle = pos ? 'rgba(100,200,150,0.6)' : 'rgba(255,100,120,0.6)'; ctx.lineWidth = 1; ctx.stroke()
                } else {
                    const sx = method === 'right' ? xR : method === 'midpoint' ? (xL + xR) / 2 : xL
                    const fV = f(sx)
                    if (!isFinite(fV)) continue
                    const y0 = toY(0), yV = toY(fV)
                    const pos = fV >= 0
                    ctx.fillStyle = pos ? 'rgba(100,200,150,0.25)' : 'rgba(255,100,120,0.25)'
                    ctx.fillRect(toX(xL), Math.min(y0, yV), toX(xR) - toX(xL), Math.abs(y0 - yV))
                    ctx.strokeStyle = pos ? 'rgba(100,200,150,0.6)' : 'rgba(255,100,120,0.6)'; ctx.lineWidth = 1
                    ctx.strokeRect(toX(xL), Math.min(y0, yV), toX(xR) - toX(xL), Math.abs(y0 - yV))
                    if (aN <= 50) {
                        ctx.fillStyle = 'rgba(180,120,255,0.9)'; ctx.beginPath()
                        ctx.arc(toX(sx), toY(fV), 3, 0, Math.PI * 2); ctx.fill()
                    }
                }
            }

            // Exact area shading
            if (showExact) {
                ctx.fillStyle = 'rgba(180,120,255,0.08)'; ctx.beginPath()
                ctx.moveTo(toX(lo), toY(0))
                for (let px = 0; px <= gw; px++) {
                    const x = lo + (px / gw) * (hi - lo), y = f(x)
                    if (isFinite(y)) ctx.lineTo(toX(x), toY(y))
                }
                ctx.lineTo(toX(hi), toY(0)); ctx.closePath(); ctx.fill()
            }

            // Function curve
            ctx.strokeStyle = ACCENT; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
            ctx.beginPath(); let started = false
            for (let px = 0; px <= gw; px++) {
                const x = vA + (px / gw) * (vB - vA), y = f(x)
                if (!isFinite(y)) { started = false; continue }
                if (!started) { ctx.moveTo(toX(x), toY(y)); started = true }
                else ctx.lineTo(toX(x), toY(y))
            }
            ctx.stroke()

            // Interval markers
            ctx.strokeStyle = 'rgba(180,120,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.moveTo(toX(a), pad.t); ctx.lineTo(toX(a), pad.t + gh)
            ctx.moveTo(toX(b), pad.t); ctx.lineTo(toX(b), pad.t + gh)
            ctx.stroke(); ctx.setLineDash([])

            ctx.fillStyle = 'rgba(180,120,255,0.7)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('a=' + a.toFixed(1), toX(a), pad.t + gh + 35)
            ctx.fillText('b=' + b.toFixed(1), toX(b), pad.t + gh + 35)

            // Axis labels
            ctx.fillStyle = 'rgba(180,120,255,0.6)'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('x', pad.l + gw / 2, h - 6)
            ctx.save(); ctx.translate(14, pad.t + gh / 2); ctx.rotate(-Math.PI / 2)
            ctx.fillText('f(x)', 0, 0); ctx.restore()

            raf = requestAnimationFrame(draw)
        }
        raf = requestAnimationFrame(draw)
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
    }, [funcKey, n, method, a, b, showExact, f])

    const reset = () => { setFuncKey('x2'); setN(4); setMethod('left'); setA(0); setB(3); setShowExact(true) }

    const demoSteps: DemoStep[] = [
        {
            title: 'What is a Riemann Sum?',
            description: 'A Riemann sum approximates the area under a curve by dividing the region into rectangles. The sum of rectangle areas approaches the true integral as n increases.',
            setup: () => { setFuncKey('x2'); setN(4); setMethod('left'); setA(0); setB(3); setShowExact(true) },
            highlight: 'Notice the 4 rectangles approximating the area under x\u00B2.',
        },
        {
            title: 'Left Riemann Sum',
            description: 'Each rectangle\'s height equals f(x) at the LEFT endpoint of each subinterval. For increasing functions, left sums underestimate the true area.',
            setup: () => { setMethod('left'); setN(6) },
            highlight: 'The top-left corner of each rectangle touches the curve.',
        },
        {
            title: 'Right Riemann Sum',
            description: 'Each rectangle\'s height equals f(x) at the RIGHT endpoint. For increasing functions, right sums overestimate the true area.',
            setup: () => { setMethod('right'); setN(6) },
            highlight: 'The top-right corner of each rectangle touches the curve.',
        },
        {
            title: 'Midpoint Rule',
            description: 'The height equals f(x) at the MIDPOINT of each subinterval. Midpoint often gives a better approximation than left or right for the same n.',
            setup: () => { setMethod('midpoint'); setN(6) },
            highlight: 'The purple dots mark each midpoint sample.',
        },
        {
            title: 'Trapezoidal Rule',
            description: 'Instead of rectangles, we use trapezoids connecting f(xL) to f(xR). This captures the slope of the function within each subinterval.',
            setup: () => { setMethod('trapezoid'); setN(6) },
            highlight: 'Notice the slanted tops following the curve more closely.',
        },
        {
            title: 'Convergence: Increasing n',
            description: 'As n increases, all methods converge to the exact integral. Watch the error shrink dramatically from n=4 to n=50.',
            setup: () => { setMethod('left'); setN(50) },
            highlight: 'With 50 rectangles the error is very small.',
        },
        {
            title: 'The Definite Integral',
            description: 'The definite integral is the LIMIT of the Riemann sum as n \u2192 \u221E. It gives the exact signed area between the curve and the x-axis on [a,b].',
            setup: () => { setN(200); setShowExact(true) },
            highlight: 'At n=200, the sum is nearly indistinguishable from the exact integral.',
        },
        {
            title: 'Signed Area (Negative Values)',
            description: 'When f(x) < 0, the signed area is negative (red/pink). The integral gives NET area: positive area above x-axis minus area below.',
            setup: () => { setFuncKey('cubic'); setA(-1.5); setB(1.5); setN(30); setMethod('midpoint') },
            highlight: 'Green = positive area, red = negative area.',
        },
    ]

    const demo = useDemoMode(demoSteps)

    return (
        <div className="min-h-screen flex flex-col bg-[#120a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><CalculusBackground /></div>

            {/* Navbar */}
            <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#120a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/calculus" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Riemann Sums & Integration</h1>
                        <p className="text-xs text-white/50">AP Calculus AB/BC: Approximating Definite Integrals</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <APTag course="Calculus AB/BC" unit="Unit 6" color={ACCENT} />
                    <Button onClick={demo.open} variant="secondary" className="text-xs">AP Tutorial</Button>
                </div>
            </div>

            <div className="flex-1 relative flex">
                {/* Canvas */}
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                    <div className="absolute top-4 left-4 space-y-3 max-w-xs">
                        <EquationDisplay
                            departmentColor={ACCENT} title="Riemann Sum"
                            equations={[
                                { label: 'Sum', expression: 'S\u2099 = \u03A3 f(x\u1D62*)\u0394x', description: `\u0394x = (b\u2212a)/n = ${((b-a)/n).toFixed(4)}` },
                                { label: 'Approx', expression: `S\u2099 \u2248 ${approx.toFixed(6)}`, description: `n = ${n} ${method} rectangles` },
                                { label: 'Exact', expression: `\u222B f(x)dx = ${exact.toFixed(6)}`, description: FUNCS[funcKey].latex },
                            ]}
                        />
                    </div>
                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={ACCENT} title="Integration Values" items={[
                            { label: 'Approximate Area', value: approx.toFixed(6), color: 'rgb(100,200,150)' },
                            { label: 'Exact Area', value: exact.toFixed(6), color: ACCENT },
                            { label: 'Absolute Error', value: error.toFixed(6), color: error < 0.01 ? 'rgb(100,200,150)' : 'rgb(255,160,100)' },
                            { label: 'Rectangles (n)', value: n.toString(), color: 'white' },
                            { label: 'Error %', value: exact !== 0 ? (error / Math.abs(exact) * 100).toFixed(3) + '%' : 'N/A', color: 'rgba(255,255,255,0.6)' },
                        ]} />
                    </div>
                </div>

                {/* Controls */}
                <div className="w-72 bg-[#120a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel className="!p-0 !bg-transparent !backdrop-blur-none !border-none">
                        <Select label="Function" value={funcKey} onChange={v => setFuncKey(v as FuncKey)}
                            options={Object.entries(FUNCS).map(([k, d]) => ({ value: k, label: d.label }))} />
                        <ButtonGroup label="Method" value={method} onChange={v => setMethod(v as Method)} color={ACCENT}
                            options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }, { value: 'midpoint', label: 'Mid' }, { value: 'trapezoid', label: 'Trap' }]} />
                        <Slider label="Rectangles (n)" value={n} onChange={setN} min={1} max={200} />
                        <ControlGroup label="Interval">
                            <Slider label="a (lower)" value={a} onChange={setA} min={-5} max={5} step={0.1} />
                            <Slider label="b (upper)" value={b} onChange={setB} min={-5} max={5} step={0.1} />
                        </ControlGroup>
                        <Toggle label="Show exact area" value={showExact} onChange={setShowExact} />
                    </ControlPanel>
                    <div className="h-px bg-white/10" />
                    <div className="space-y-2">
                        <span className="text-xs text-white/40 block">Quick Presets</span>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'x\u00B2 [0,3]', fn: () => { setFuncKey('x2'); setA(0); setB(3); setN(4); setMethod('left') } },
                                { label: 'sin [0,\u03C0]', fn: () => { setFuncKey('sin'); setA(0); setB(3.1); setN(10); setMethod('midpoint') } },
                                { label: 'e\u02E3 [0,2]', fn: () => { setFuncKey('exp'); setA(0); setB(2); setN(8); setMethod('trapezoid') } },
                                { label: 'x\u00B3\u2212x signed', fn: () => { setFuncKey('cubic'); setA(-1.5); setB(1.5); setN(20); setMethod('midpoint') } },
                            ].map(p => (
                                <button key={p.label} onClick={p.fn}
                                    className="text-xs py-1.5 px-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors border border-white/10">
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button onClick={reset} variant="secondary" className="w-full mt-auto">Reset All</Button>
                </div>
            </div>

            {/* Demo overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen}
                    onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep}
                    departmentColor={ACCENT} title="Riemann Sums Tutorial" />
            </div>
        </div>
    )
}
