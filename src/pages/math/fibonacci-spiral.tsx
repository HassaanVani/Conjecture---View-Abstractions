import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, Slider, Toggle, Button } from '@/components/control-panel'
import type { DemoStep } from '@/components/demo-mode'

const MATH_COLOR = 'rgb(100, 140, 255)'
const GOLD_COLOR = 'rgba(255, 200, 100, 0.9)'

function fibonacci(n: number): number[] {
    const seq = [1, 1]
    for (let i = 2; i < n; i++) seq.push(seq[i - 1] + seq[i - 2])
    return seq.slice(0, n)
}

const NATURE_EXAMPLES: { label: string; desc: string }[] = [
    { label: 'Sunflower Seeds', desc: 'Spirals in 34 and 55 (Fibonacci numbers)' },
    { label: 'Nautilus Shell', desc: 'Logarithmic spiral approximating golden ratio' },
    { label: 'Pine Cone', desc: '8 and 13 spiral directions' },
    { label: 'Flower Petals', desc: '3, 5, 8, 13 petals are most common' },
    { label: 'Galaxy Arms', desc: 'Logarithmic spiral structure' },
]

export default function FibonacciSpiral() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const [count, setCount] = useState(10)
    const [isAnimating, setIsAnimating] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [speed, setSpeed] = useState(500)
    const [showRatioGraph, setShowRatioGraph] = useState(true)
    const [showNature, setShowNature] = useState(false)
    const [showNumbers, setShowNumbers] = useState(true)
    const [showGrid, setShowGrid] = useState(true)

    const fib = fibonacci(Math.max(count, 2))

    const startAnimation = useCallback(() => {
        setCurrentStep(0)
        setIsAnimating(true)
    }, [])

    const reset = useCallback(() => {
        setIsAnimating(false)
        setCurrentStep(0)
    }, [])

    useEffect(() => {
        if (!isAnimating || currentStep >= count) {
            if (currentStep >= count) setIsAnimating(false)
            return
        }
        const timer = setTimeout(() => setCurrentStep(prev => prev + 1), speed)
        return () => clearTimeout(timer)
    }, [isAnimating, currentStep, count, speed])

    /* ── Canvas rendering ───────────────────────────────────── */
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

        const draw = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            ctx.fillStyle = '#0a0e1a'
            ctx.fillRect(0, 0, w, h)

            // Faint grid
            if (showGrid) {
                ctx.strokeStyle = 'rgba(100, 140, 255, 0.04)'
                ctx.lineWidth = 1
                const gs = 40
                for (let gx = 0; gx < w; gx += gs) {
                    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke()
                }
                for (let gy = 0; gy < h; gy += gs) {
                    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke()
                }
            }

            if (currentStep === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.15)'
                ctx.font = '14px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Press Start to visualize the Fibonacci spiral', w / 2, h / 2)
                animRef.current = requestAnimationFrame(draw)
                return
            }

            const seq = fib.slice(0, count)
            const scale = Math.min(w * 0.55, h * 0.7) / (seq[Math.min(currentStep, count) - 1] * 2.5 || 1)

            // Spiral section: left side
            const spiralW = showRatioGraph ? w * 0.58 : w
            const offsetX = spiralW / 2
            const offsetY = h / 2

            let x = offsetX
            let y = offsetY

            ctx.lineWidth = 2

            // Draw Fibonacci squares and arcs
            seq.slice(0, currentStep).forEach((size, i) => {
                const scaledSize = size * scale
                const direction = i % 4

                if (i > 0) {
                    const prevSize = seq[i - 1] * scale
                    switch ((i - 1) % 4) {
                        case 0: x += prevSize; break
                        case 1: y += prevSize; break
                        case 2: x -= scaledSize; break
                        case 3: y -= scaledSize; break
                    }
                }

                // Square fill (subtle)
                const isNewest = i === currentStep - 1
                ctx.fillStyle = isNewest ? 'rgba(100, 140, 255, 0.08)' : 'rgba(100, 140, 255, 0.02)'
                ctx.fillRect(x, y, scaledSize, scaledSize)

                // Square outline
                ctx.strokeStyle = isNewest
                    ? 'rgba(100, 140, 255, 0.7)'
                    : 'rgba(100, 140, 255, 0.15)'
                ctx.lineWidth = isNewest ? 2 : 1
                ctx.strokeRect(x, y, scaledSize, scaledSize)

                // Number inside square
                if (showNumbers) {
                    const fontSize = Math.max(9, Math.min(scaledSize / 3.5, 24))
                    ctx.fillStyle = isNewest ? 'rgba(100, 140, 255, 0.8)' : 'rgba(100, 140, 255, 0.3)'
                    ctx.font = `${fontSize}px monospace`
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillText(size.toString(), x + scaledSize / 2, y + scaledSize / 2)
                }

                // Quarter-circle arc (golden spiral)
                ctx.strokeStyle = isNewest ? 'rgba(255, 200, 100, 1)' : 'rgba(255, 200, 100, 0.6)'
                ctx.lineWidth = isNewest ? 3 : 2
                ctx.beginPath()

                let arcX: number, arcY: number, startAngle: number, endAngle: number
                switch (direction) {
                    case 0: arcX = x + scaledSize; arcY = y + scaledSize; startAngle = Math.PI; endAngle = Math.PI * 1.5; break
                    case 1: arcX = x; arcY = y + scaledSize; startAngle = Math.PI * 1.5; endAngle = Math.PI * 2; break
                    case 2: arcX = x; arcY = y; startAngle = 0; endAngle = Math.PI * 0.5; break
                    default: arcX = x + scaledSize; arcY = y; startAngle = Math.PI * 0.5; endAngle = Math.PI; break
                }
                ctx.arc(arcX, arcY, scaledSize, startAngle, endAngle)
                ctx.stroke()
            })

            /* ── Golden ratio convergence graph ─────────────── */
            if (showRatioGraph && currentStep >= 2) {
                const gx = spiralW + 20
                const gw = w - spiralW - 40
                const gt = 40
                const gh = h * 0.4
                const gb = gt + gh

                // Graph background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
                ctx.strokeStyle = 'rgba(100, 140, 255, 0.15)'
                ctx.lineWidth = 1
                const gr = 8
                ctx.beginPath()
                ctx.moveTo(gx + gr, gt - 10)
                ctx.lineTo(gx + gw - gr, gt - 10)
                ctx.quadraticCurveTo(gx + gw, gt - 10, gx + gw, gt - 10 + gr)
                ctx.lineTo(gx + gw, gb + 10 - gr)
                ctx.quadraticCurveTo(gx + gw, gb + 10, gx + gw - gr, gb + 10)
                ctx.lineTo(gx + gr, gb + 10)
                ctx.quadraticCurveTo(gx, gb + 10, gx, gb + 10 - gr)
                ctx.lineTo(gx, gt - 10 + gr)
                ctx.quadraticCurveTo(gx, gt - 10, gx + gr, gt - 10)
                ctx.closePath()
                ctx.fill()
                ctx.stroke()

                // Title
                ctx.fillStyle = 'rgba(255, 200, 100, 0.7)'
                ctx.font = 'bold 11px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText('Golden Ratio Convergence', gx + 10, gt + 8)

                // phi line
                const phi = (1 + Math.sqrt(5)) / 2
                const yMin = 0.8
                const yMax = 2.5
                const mapY = (v: number) => gb - ((v - yMin) / (yMax - yMin)) * gh

                // Phi reference line
                ctx.setLineDash([4, 4])
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(gx, mapY(phi))
                ctx.lineTo(gx + gw, mapY(phi))
                ctx.stroke()
                ctx.setLineDash([])

                ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'
                ctx.font = '10px monospace'
                ctx.textAlign = 'right'
                ctx.fillText(`phi = ${phi.toFixed(5)}`, gx + gw - 5, mapY(phi) - 5)

                // 1.0 line
                ctx.setLineDash([2, 4])
                ctx.strokeStyle = 'rgba(100, 140, 255, 0.2)'
                ctx.beginPath()
                ctx.moveTo(gx, mapY(1))
                ctx.lineTo(gx + gw, mapY(1))
                ctx.stroke()
                ctx.setLineDash([])

                // 2.0 line
                ctx.beginPath()
                ctx.moveTo(gx, mapY(2))
                ctx.lineTo(gx + gw, mapY(2))
                ctx.stroke()

                // Y-axis labels
                ctx.fillStyle = 'rgba(100, 140, 255, 0.3)'
                ctx.font = '9px monospace'
                ctx.textAlign = 'right'
                ctx.fillText('1.0', gx - 4, mapY(1) + 3)
                ctx.fillText('2.0', gx - 4, mapY(2) + 3)

                // Plot ratios
                const ratios: number[] = []
                for (let i = 1; i < currentStep && i < count; i++) {
                    ratios.push(seq[i] / seq[i - 1])
                }

                if (ratios.length > 0) {
                    const stepW = gw / (Math.max(count - 2, 1))

                    // Line
                    ctx.strokeStyle = GOLD_COLOR
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ratios.forEach((r, i) => {
                        const px = gx + i * stepW
                        const py = mapY(Math.min(Math.max(r, yMin), yMax))
                        if (i === 0) ctx.moveTo(px, py)
                        else ctx.lineTo(px, py)
                    })
                    ctx.stroke()

                    // Dots
                    ratios.forEach((r, i) => {
                        const px = gx + i * stepW
                        const py = mapY(Math.min(Math.max(r, yMin), yMax))
                        ctx.fillStyle = i === ratios.length - 1 ? 'rgba(255, 200, 100, 1)' : 'rgba(255, 200, 100, 0.6)'
                        ctx.beginPath()
                        ctx.arc(px, py, i === ratios.length - 1 ? 4 : 2.5, 0, Math.PI * 2)
                        ctx.fill()
                    })

                    // Current ratio text
                    const latest = ratios[ratios.length - 1]
                    ctx.fillStyle = 'rgba(255, 200, 100, 0.9)'
                    ctx.font = 'bold 12px monospace'
                    ctx.textAlign = 'center'
                    ctx.fillText(`F(${currentStep})/F(${currentStep - 1}) = ${latest.toFixed(6)}`, gx + gw / 2, gb + 30)

                    const error = Math.abs(latest - phi)
                    ctx.fillStyle = error < 0.01 ? 'rgba(100, 220, 160, 0.7)' : 'rgba(255, 140, 100, 0.7)'
                    ctx.font = '10px monospace'
                    ctx.fillText(`error: ${error.toFixed(8)}`, gx + gw / 2, gb + 46)
                }

                // X-axis label
                ctx.fillStyle = 'rgba(100, 140, 255, 0.4)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('n (term index)', gx + gw / 2, gb + 62)
            }

            /* ── Nature examples overlay ────────────────────── */
            if (showNature && currentStep > 0) {
                const nx = showRatioGraph ? spiralW + 20 : w - 250
                const ny = showRatioGraph ? h * 0.55 : 20
                const nw = showRatioGraph ? w - spiralW - 40 : 230

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.strokeStyle = 'rgba(100, 220, 160, 0.2)'
                ctx.lineWidth = 1
                const nr = 8
                ctx.beginPath()
                ctx.moveTo(nx + nr, ny)
                ctx.lineTo(nx + nw - nr, ny)
                ctx.quadraticCurveTo(nx + nw, ny, nx + nw, ny + nr)
                ctx.lineTo(nx + nw, ny + NATURE_EXAMPLES.length * 44 + 30 - nr)
                ctx.quadraticCurveTo(nx + nw, ny + NATURE_EXAMPLES.length * 44 + 30, nx + nw - nr, ny + NATURE_EXAMPLES.length * 44 + 30)
                ctx.lineTo(nx + nr, ny + NATURE_EXAMPLES.length * 44 + 30)
                ctx.quadraticCurveTo(nx, ny + NATURE_EXAMPLES.length * 44 + 30, nx, ny + NATURE_EXAMPLES.length * 44 + 30 - nr)
                ctx.lineTo(nx, ny + nr)
                ctx.quadraticCurveTo(nx, ny, nx + nr, ny)
                ctx.closePath()
                ctx.fill()
                ctx.stroke()

                ctx.fillStyle = 'rgba(100, 220, 160, 0.8)'
                ctx.font = 'bold 11px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText('Fibonacci in Nature', nx + 10, ny + 18)

                NATURE_EXAMPLES.forEach((ex, i) => {
                    const ey = ny + 34 + i * 44
                    ctx.fillStyle = 'rgba(100, 220, 160, 0.7)'
                    ctx.font = 'bold 10px system-ui'
                    ctx.fillText(ex.label, nx + 10, ey)
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
                    ctx.font = '9px system-ui'
                    ctx.fillText(ex.desc, nx + 10, ey + 14)

                    // Separator
                    if (i < NATURE_EXAMPLES.length - 1) {
                        ctx.strokeStyle = 'rgba(100, 220, 160, 0.1)'
                        ctx.beginPath()
                        ctx.moveTo(nx + 10, ey + 26)
                        ctx.lineTo(nx + nw - 10, ey + 26)
                        ctx.stroke()
                    }
                })
            }

            animRef.current = requestAnimationFrame(draw)
        }

        animRef.current = requestAnimationFrame(draw)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animRef.current)
        }
    }, [currentStep, count, showRatioGraph, showNature, showNumbers, showGrid, fib])

    /* ── Demo steps ─────────────────────────────────────────── */
    const demoSteps: DemoStep[] = [
        {
            title: 'The Fibonacci Sequence',
            description: 'Each number is the sum of the two preceding: 1, 1, 2, 3, 5, 8, 13, 21... Starting from F(1) = F(2) = 1, we build an infinite sequence.',
            setup: () => { setCount(10); reset(); setShowRatioGraph(false); setShowNature(false); setShowNumbers(true) },
            highlight: 'Press Start to watch the sequence build',
        },
        {
            title: 'Fibonacci Squares',
            description: 'Each Fibonacci number defines a square. We place them edge-to-edge, spiraling outward. The side length of each square is the corresponding Fibonacci number.',
            setup: () => { setCount(8); setCurrentStep(8); setIsAnimating(false); setShowNumbers(true) },
            highlight: 'Notice how each square perfectly tiles against the previous ones',
        },
        {
            title: 'The Golden Spiral',
            description: 'By drawing a quarter-circle arc in each square, we approximate the golden (logarithmic) spiral. This spiral appears throughout nature, art, and architecture.',
            setup: () => { setCount(12); setCurrentStep(12); setIsAnimating(false) },
        },
        {
            title: 'The Golden Ratio',
            description: 'As n grows, the ratio F(n+1)/F(n) converges to phi = (1 + sqrt(5)) / 2 = 1.618034... This irrational number is the golden ratio.',
            setup: () => { setShowRatioGraph(true); setCount(12); setCurrentStep(12); setIsAnimating(false) },
            highlight: 'Watch the convergence graph approach the golden line',
        },
        {
            title: 'How Fast Does It Converge?',
            description: 'The convergence is remarkably fast. By F(10)/F(9) the ratio is already within 0.001 of phi. The error decreases geometrically at rate 1/phi^2.',
            setup: () => { setShowRatioGraph(true); setCount(15); setCurrentStep(15); setIsAnimating(false) },
        },
        {
            title: 'Fibonacci in Nature',
            description: 'The golden ratio and Fibonacci numbers appear in sunflowers, pine cones, flower petals, shells, and galaxies. Nature optimizes packing efficiency using these ratios.',
            setup: () => { setShowNature(true); setCount(12); setCurrentStep(12); setIsAnimating(false) },
            highlight: 'Toggle "Nature Examples" in controls to see the overlay',
        },
        {
            title: 'Closed Form: Binet Formula',
            description: 'F(n) = (phi^n - psi^n) / sqrt(5), where psi = (1 - sqrt(5))/2. Despite involving irrationals, this always yields integers.',
            setup: () => { setShowNature(false); setShowRatioGraph(true); setCount(10); setCurrentStep(10); setIsAnimating(false) },
        },
        {
            title: 'Explore Freely',
            description: 'Adjust the number of squares, toggle overlays, and animate to build your intuition about this fundamental mathematical sequence.',
            setup: () => { setShowRatioGraph(true); setShowNature(false) },
        },
    ]

    const demo = useDemoMode(demoSteps)

    /* ── Derived info ───────────────────────────────────────── */
    const phi = (1 + Math.sqrt(5)) / 2
    const currentRatio = currentStep >= 2 ? fib[currentStep - 1] / fib[currentStep - 2] : 0
    const ratioError = currentStep >= 2 ? Math.abs(currentRatio - phi) : phi

    const equations = [
        { label: 'Recurrence', expression: 'F(n) = F(n-1) + F(n-2)', description: 'Base cases: F(1) = F(2) = 1' },
        { label: 'Golden Ratio', expression: `phi = (1 + sqrt(5)) / 2 = ${phi.toFixed(6)}` },
        { label: 'Binet', expression: 'F(n) = (phi^n - psi^n) / sqrt(5)', description: 'psi = (1 - sqrt(5)) / 2' },
    ]

    const infoItems = [
        { label: 'Step', value: `${currentStep} / ${count}`, color: 'white' },
        { label: `F(${currentStep || 1})`, value: String(fib[Math.max(currentStep - 1, 0)]), color: MATH_COLOR },
        ...(currentStep >= 2 ? [
            { label: 'Ratio', value: currentRatio.toFixed(6), color: GOLD_COLOR },
            { label: 'Error', value: ratioError.toExponential(3), color: ratioError < 0.01 ? 'rgb(100, 220, 160)' : 'rgb(255, 140, 100)' },
        ] : []),
        { label: 'phi', value: phi.toFixed(6), color: GOLD_COLOR },
        { label: 'phi^2', value: (phi * phi).toFixed(6), color: 'rgba(255, 200, 100, 0.6)' },
    ]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a0e1a]">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Link to="/" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-lg font-medium text-white/90">Fibonacci Spiral</h1>
                    <APTag course="Mathematics" color={MATH_COLOR} />
                </div>
                <Button onClick={demo.open} className="text-xs">AP Tutorial</Button>
            </div>

            <div className="flex-1 relative flex overflow-hidden">
                {/* Canvas */}
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    {/* Equation overlay */}
                    <EquationDisplay
                        equations={equations}
                        departmentColor={MATH_COLOR}
                        className="absolute top-3 left-3 max-w-xs z-10"
                        title="Fibonacci Identities"
                    />

                    {/* Info panel */}
                    <InfoPanel
                        title="Live Data"
                        departmentColor={MATH_COLOR}
                        className="absolute top-3 right-3 min-w-[170px] z-10"
                        items={infoItems}
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
                            departmentColor={MATH_COLOR}
                            title="Fibonacci Tutorial"
                        />
                    </div>
                </div>

                {/* Right sidebar controls */}
                <div className="w-72 bg-black/30 border-l border-white/10 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto">
                    <ControlPanel className="!p-0 !bg-transparent !border-0 !backdrop-blur-0">
                        <Slider
                            label="Squares"
                            value={count}
                            onChange={v => { setCount(v); if (!isAnimating) setCurrentStep(0) }}
                            min={3}
                            max={15}
                            step={1}
                        />
                        <Slider
                            label="Speed (ms)"
                            value={speed}
                            onChange={setSpeed}
                            min={100}
                            max={1000}
                            step={50}
                        />
                        <Toggle label="Ratio Convergence Graph" value={showRatioGraph} onChange={setShowRatioGraph} />
                        <Toggle label="Nature Examples" value={showNature} onChange={setShowNature} />
                        <Toggle label="Show Numbers" value={showNumbers} onChange={setShowNumbers} />
                        <Toggle label="Show Grid" value={showGrid} onChange={setShowGrid} />
                    </ControlPanel>

                    <div className="flex flex-col gap-2">
                        <Button onClick={startAnimation} disabled={isAnimating} className="w-full">
                            {isAnimating ? 'Drawing...' : 'Start'}
                        </Button>
                        <Button onClick={reset} variant="secondary" className="w-full">Reset</Button>
                        <Button onClick={() => { setCurrentStep(count); setIsAnimating(false) }} variant="secondary" className="w-full">
                            Show All
                        </Button>
                    </div>

                    {/* Sequence preview */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Sequence</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {fib.slice(0, count).map((n, i) => (
                                <span
                                    key={i}
                                    className="font-mono text-xs px-1.5 py-0.5 rounded"
                                    style={{
                                        color: i < currentStep ? MATH_COLOR : 'rgba(255,255,255,0.2)',
                                        backgroundColor: i < currentStep ? 'rgba(100, 140, 255, 0.1)' : 'transparent',
                                    }}
                                >
                                    {n}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Quick reference */}
                    <div className="mt-auto p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Quick Reference</h4>
                        <ul className="text-xs text-white/50 space-y-1.5 leading-relaxed">
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: MATH_COLOR }} />Fibonacci squares (blue)</li>
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(255, 200, 100)' }} />Golden spiral (amber)</li>
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(100, 220, 160)' }} />Nature examples (green)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
