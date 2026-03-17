import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const GOLD = 'rgb(220, 180, 80)'

export default function EconomicGrowth() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [capitalInvestment, setCapitalInvestment] = useState(50)
    const [humanCapital, setHumanCapital] = useState(50)
    const [technology, setTechnology] = useState(50)
    const [years, setYears] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [showLRAS, setShowLRAS] = useState(false)

    // Derived economic state
    const growthRate = useMemo(() => {
        const capitalEffect = (capitalInvestment / 100) * 2.0
        const humanEffect = (humanCapital / 100) * 1.5
        const techEffect = (technology / 100) * 2.5
        return capitalEffect + humanEffect + techEffect
    }, [capitalInvestment, humanCapital, technology])

    const ppcScale = useMemo(() => {
        return 1 + (growthRate / 100) * years
    }, [growthRate, years])

    const consumerShare = useMemo(() => (100 - capitalInvestment) / 100, [capitalInvestment])

    const realGDP = useMemo(() => {
        const A = 1 + (technology / 100) * 0.5
        const K = ppcScale * (capitalInvestment / 100 + 0.3)
        const H = 1 + (humanCapital / 100) * 0.4
        return A * Math.pow(K, 0.4) * Math.pow(H, 0.3) * 100
    }, [ppcScale, capitalInvestment, humanCapital, technology])

    const doublingTime = useMemo(() => {
        return growthRate > 0.01 ? (70 / growthRate).toFixed(1) : '---'
    }, [growthRate])

    const gdpHistory = useRef<number[]>([])

    // Animation loop
    useEffect(() => {
        if (!isAnimating) return
        const interval = setInterval(() => {
            setYears(y => {
                const next = y + 1
                if (next > 50) { setIsAnimating(false); return y }
                return next
            })
        }, 200)
        return () => clearInterval(interval)
    }, [isAnimating])

    // Track GDP history
    useEffect(() => {
        if (years === 0) gdpHistory.current = [realGDP]
        else gdpHistory.current = [...gdpHistory.current.slice(0, years), realGDP]
    }, [years, realGDP])

    const resetSim = useCallback(() => {
        setYears(0)
        setIsAnimating(false)
        gdpHistory.current = []
    }, [])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'What is Economic Growth?', description: 'Economic growth is a sustained increase in real GDP over time. It means the economy can produce MORE goods and services than before.', setup: () => { resetSim(); setCapitalInvestment(50); setHumanCapital(50); setTechnology(50); setShowLRAS(false) } },
        { title: 'PPC and Growth', description: 'The PPC shifts OUTWARD when an economy grows. Previously unattainable combinations of goods become possible. Watch the curve expand!', setup: () => { resetSim(); setCapitalInvestment(60); setHumanCapital(50); setTechnology(50); setShowLRAS(false); setIsAnimating(true) } },
        { title: 'Physical Capital', description: 'Investing in physical capital (factories, machines, infrastructure) expands productive capacity. More capital goods now = faster growth later, but fewer consumer goods today.', highlight: 'Drag the Capital Investment slider high and watch growth accelerate', setup: () => { resetSim(); setCapitalInvestment(80); setHumanCapital(30); setTechnology(30); setShowLRAS(false); setIsAnimating(true) } },
        { title: 'Human Capital', description: 'Education, training, and health improvements make workers more productive. Human capital is a KEY driver of sustained growth in modern economies.', highlight: 'Notice how human capital boosts the growth rate', setup: () => { resetSim(); setCapitalInvestment(40); setHumanCapital(90); setTechnology(40); setShowLRAS(false); setIsAnimating(true) } },
        { title: 'Technology', description: 'Technological innovation is the most powerful growth engine. It increases Total Factor Productivity (A in the production function), making ALL inputs more productive.', highlight: 'Technology has the highest multiplier effect', setup: () => { resetSim(); setCapitalInvestment(30); setHumanCapital(40); setTechnology(90); setShowLRAS(false); setIsAnimating(true) } },
        { title: 'Policy for Growth', description: 'Governments promote growth through: education spending (human capital), R&D subsidies (technology), infrastructure investment (physical capital), and institutions that protect property rights.', setup: () => { resetSim(); setCapitalInvestment(60); setHumanCapital(70); setTechnology(70); setShowLRAS(false); setIsAnimating(true) } },
        { title: 'Growth and LRAS', description: 'Economic growth shifts LRAS rightward in the AD-AS model. This means higher potential output at every price level. Toggle "Show LRAS" to see the connection!', highlight: 'Toggle LRAS to connect PPC growth to AD-AS', setup: () => { resetSim(); setCapitalInvestment(60); setHumanCapital(60); setTechnology(60); setShowLRAS(true); setIsAnimating(true) } },
        { title: 'Experiment!', description: 'Adjust all three sliders to see how different investment mixes affect growth. Can you find the fastest growth strategy? What tradeoffs exist?', setup: () => { resetSim(); setCapitalInvestment(50); setHumanCapital(50); setTechnology(50); setShowLRAS(false) } },
    ], [resetSim])

    const demo = useDemoMode(demoSteps)

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const dpr = window.devicePixelRatio || 1
        const resize = () => {
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        const w = canvas.offsetWidth, h = canvas.offsetHeight
        const pad = 80, gW = w - pad * 2 - (showLRAS ? 240 : 0), gH = h - pad * 2 - 40
        const gs = Math.min(gW, gH)
        const ox = pad, oy = h - pad - 20

        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, w, h)

        const tX = (x: number) => ox + (x / 120) * gs
        const tY = (y: number) => oy - (y / 120) * gs

        // Grid
        ctx.strokeStyle = 'rgba(220,180,80,0.06)'
        ctx.lineWidth = 1
        for (let i = 0; i <= 120; i += 20) {
            ctx.beginPath(); ctx.moveTo(tX(i), tY(0)); ctx.lineTo(tX(i), tY(120)); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(tX(0), tY(i)); ctx.lineTo(tX(120), tY(i)); ctx.stroke()
        }

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(ox, tY(120)); ctx.lineTo(ox, oy); ctx.lineTo(tX(120), oy); ctx.stroke()
        ctx.fillStyle = 'rgba(220,180,80,0.8)'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Consumer Goods', ox + gs / 2, oy + 35)
        ctx.save()
        ctx.translate(ox - 45, oy - gs / 2)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('Capital Goods', 0, 0)
        ctx.restore()

        // Draw base PPC (scale = 1, ghost)
        if (ppcScale > 1.02) {
            ctx.strokeStyle = 'rgba(220,180,80,0.15)'
            ctx.lineWidth = 2
            ctx.setLineDash([6, 4])
            ctx.beginPath()
            for (let t = 0; t <= 1; t += 0.01) {
                const angle = (Math.PI / 2) * t
                const x = Math.cos(angle) * 100
                const y = Math.sin(angle) * 100
                if (t === 0) ctx.moveTo(tX(x), tY(y))
                else ctx.lineTo(tX(x), tY(y))
            }
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(220,180,80,0.3)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('Original PPC', tX(72), tY(72) + 4)
        }

        // Attainable region
        const s = ppcScale
        ctx.fillStyle = 'rgba(220,180,80,0.04)'
        ctx.beginPath()
        ctx.moveTo(tX(0), tY(0))
        ctx.lineTo(tX(0), tY(100 * s))
        for (let t = 0; t <= 1; t += 0.01) {
            const angle = (Math.PI / 2) * t
            ctx.lineTo(tX(Math.cos(angle) * 100 * s), tY(Math.sin(angle) * 100 * s))
        }
        ctx.lineTo(tX(100 * s), tY(0))
        ctx.closePath()
        ctx.fill()

        // Current PPC curve
        const grad = ctx.createLinearGradient(tX(0), tY(100 * s), tX(100 * s), tY(0))
        grad.addColorStop(0, 'rgba(100,200,150,0.9)')
        grad.addColorStop(0.5, 'rgba(220,180,80,0.9)')
        grad.addColorStop(1, 'rgba(255,150,100,0.9)')
        ctx.strokeStyle = grad
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let t = 0; t <= 1; t += 0.01) {
            const angle = (Math.PI / 2) * t
            const x = Math.cos(angle) * 100 * s
            const y = Math.sin(angle) * 100 * s
            if (t === 0) ctx.moveTo(tX(x), tY(y))
            else ctx.lineTo(tX(x), tY(y))
        }
        ctx.stroke()

        // PPC label
        const labelAngle = Math.PI / 4
        const lx = Math.cos(labelAngle) * 100 * s
        const ly = Math.sin(labelAngle) * 100 * s
        ctx.fillStyle = 'rgba(220,180,80,0.9)'
        ctx.font = 'bold 13px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText(`PPC (Year ${years})`, tX(lx) + 12, tY(ly) - 8)

        // Production point on the PPC
        const prodX = Math.cos((Math.PI / 2) * consumerShare) * 100 * s
        const prodY = Math.sin((Math.PI / 2) * consumerShare) * 100 * s
        const px = tX(prodX), py = tY(prodY)

        // Glow
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 25)
        glow.addColorStop(0, 'rgba(220,180,80,0.4)')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath(); ctx.arc(px, py, 25, 0, Math.PI * 2); ctx.fill()

        // Dashed lines to axes
        ctx.strokeStyle = 'rgba(220,180,80,0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, oy); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ox, py); ctx.stroke()
        ctx.setLineDash([])

        // Point
        ctx.fillStyle = GOLD
        ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.font = 'bold 11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`(${prodX.toFixed(0)}, ${prodY.toFixed(0)})`, px, py - 18)

        // Growth arrow if expanding
        if (ppcScale > 1.05) {
            const arrowAngle = Math.PI / 4
            const innerR = 100
            const outerR = 100 * s
            const ax1 = Math.cos(arrowAngle) * innerR
            const ay1 = Math.sin(arrowAngle) * innerR
            const ax2 = Math.cos(arrowAngle) * (outerR - 5)
            const ay2 = Math.sin(arrowAngle) * (outerR - 5)
            ctx.strokeStyle = 'rgba(100,200,150,0.6)'
            ctx.lineWidth = 2
            ctx.setLineDash([3, 3])
            ctx.beginPath()
            ctx.moveTo(tX(ax1), tY(ay1))
            ctx.lineTo(tX(ax2), tY(ay2))
            ctx.stroke()
            ctx.setLineDash([])
            // Arrowhead
            ctx.fillStyle = 'rgba(100,200,150,0.7)'
            ctx.beginPath()
            const tipX = tX(ax2), tipY = tY(ay2)
            const dir = -Math.PI / 4
            ctx.moveTo(tipX, tipY)
            ctx.lineTo(tipX - 8 * Math.cos(dir - 0.4), tipY + 8 * Math.sin(dir - 0.4))
            ctx.lineTo(tipX - 8 * Math.cos(dir + 0.4), tipY + 8 * Math.sin(dir + 0.4))
            ctx.closePath()
            ctx.fill()
            ctx.fillStyle = 'rgba(100,200,150,0.7)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Growth', tX((ax1 + ax2) / 2) + 20, tY((ay1 + ay2) / 2))
        }

        // LRAS overlay (right side)
        if (showLRAS) {
            const lrasOx = ox + gs + 80
            const lrasW = 180, lrasH = gs * 0.7
            const lrasOy = oy - (gs - lrasH) / 2
            const lrasTopY = lrasOy - lrasH

            // LRAS axes
            ctx.strokeStyle = 'rgba(220,180,80,0.4)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(lrasOx, lrasTopY)
            ctx.lineTo(lrasOx, lrasOy)
            ctx.lineTo(lrasOx + lrasW, lrasOy)
            ctx.stroke()

            ctx.fillStyle = 'rgba(220,180,80,0.6)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Real GDP', lrasOx + lrasW / 2, lrasOy + 20)
            ctx.save()
            ctx.translate(lrasOx - 18, lrasOy - lrasH / 2)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Price Level', 0, 0)
            ctx.restore()

            // Original LRAS
            const lras1X = lrasOx + lrasW * 0.35
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'
            ctx.lineWidth = 1.5
            ctx.setLineDash([6, 4])
            ctx.beginPath()
            ctx.moveTo(lras1X, lrasTopY + 10)
            ctx.lineTo(lras1X, lrasOy - 5)
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('LRAS₁', lras1X, lrasTopY + 5)

            // Shifted LRAS
            const shiftPx = Math.min(lrasW * 0.55, (ppcScale - 1) * lrasW * 1.5 + lrasW * 0.35)
            const lras2X = lrasOx + shiftPx
            if (ppcScale > 1.02) {
                ctx.strokeStyle = 'rgba(100,200,150,0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(lras2X, lrasTopY + 10)
                ctx.lineTo(lras2X, lrasOy - 5)
                ctx.stroke()
                ctx.fillStyle = 'rgba(100,200,150,0.9)'
                ctx.font = 'bold 10px system-ui'
                ctx.fillText('LRAS₂', lras2X, lrasTopY + 5)

                // Arrow between LRAS
                ctx.strokeStyle = 'rgba(100,200,150,0.5)'
                ctx.lineWidth = 1
                ctx.setLineDash([3, 3])
                const arrowY = lrasOy - lrasH * 0.5
                ctx.beginPath()
                ctx.moveTo(lras1X + 5, arrowY)
                ctx.lineTo(lras2X - 5, arrowY)
                ctx.stroke()
                ctx.setLineDash([])
                // Arrowhead
                ctx.fillStyle = 'rgba(100,200,150,0.6)'
                ctx.beginPath()
                ctx.moveTo(lras2X - 5, arrowY)
                ctx.lineTo(lras2X - 12, arrowY - 4)
                ctx.lineTo(lras2X - 12, arrowY + 4)
                ctx.closePath()
                ctx.fill()
            }

            // AD-AS label
            ctx.fillStyle = 'rgba(220,180,80,0.5)'
            ctx.font = 'bold 12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('AD-AS Framework', lrasOx + lrasW / 2, lrasTopY - 12)
        }

        // Inset GDP chart (bottom-right)
        const history = gdpHistory.current
        if (history.length > 1) {
            const chartW = 160, chartH = 90
            const chartX = ox + gs - chartW - 10
            const chartY = tY(0) - chartH - 50
            // Background
            ctx.fillStyle = 'rgba(0,0,0,0.4)'
            ctx.strokeStyle = 'rgba(220,180,80,0.2)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.roundRect(chartX - 8, chartY - 22, chartW + 16, chartH + 34, 8)
            ctx.fill()
            ctx.stroke()

            ctx.fillStyle = 'rgba(220,180,80,0.6)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('Per-Capita GDP', chartX, chartY - 8)

            const minGDP = Math.min(...history)
            const maxGDP = Math.max(...history)
            const range = maxGDP - minGDP || 1

            ctx.strokeStyle = 'rgba(100,200,150,0.8)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            history.forEach((gdp, i) => {
                const x = chartX + (i / Math.max(history.length - 1, 1)) * chartW
                const y = chartY + chartH - ((gdp - minGDP) / range) * chartH
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            })
            ctx.stroke()

            // Endpoint dot
            const lastX = chartX + chartW
            const lastY = chartY + chartH - ((history[history.length - 1] - minGDP) / range) * chartH
            ctx.fillStyle = 'rgba(100,200,150,1)'
            ctx.beginPath(); ctx.arc(lastX, lastY, 3, 0, Math.PI * 2); ctx.fill()
        }

        // Legend
        ctx.textAlign = 'left'
        ctx.font = '11px system-ui'
        const legendItems = [
            { color: 'rgba(100,200,150,1)', label: 'Capital Goods axis' },
            { color: 'rgba(255,150,100,1)', label: 'Consumer Goods axis' },
            { color: GOLD, label: 'Production point' },
        ]
        let legendY = 24
        legendItems.forEach(item => {
            ctx.fillStyle = item.color
            ctx.beginPath(); ctx.arc(ox + gs - 140, legendY, 4, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'rgba(255,255,255,0.6)'
            ctx.fillText(item.label, ox + gs - 130, legendY + 4)
            legendY += 18
        })

        return () => window.removeEventListener('resize', resize)
    }, [capitalInvestment, humanCapital, technology, years, ppcScale, consumerShare, showLRAS])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Investment Mix">
                            <Slider label="Capital Investment" value={capitalInvestment} onChange={v => { setCapitalInvestment(v); if (!isAnimating) setYears(0) }} min={0} max={100} step={5} />
                            <Slider label="Human Capital" value={humanCapital} onChange={v => { setHumanCapital(v); if (!isAnimating) setYears(0) }} min={0} max={100} step={5} />
                            <Slider label="Technology" value={technology} onChange={v => { setTechnology(v); if (!isAnimating) setYears(0) }} min={0} max={100} step={5} />
                        </ControlGroup>
                        <Toggle label="Show LRAS Shift" value={showLRAS} onChange={setShowLRAS} />
                        <div className="flex gap-2 flex-wrap">
                            <Button onClick={() => setIsAnimating(!isAnimating)} variant="primary">
                                {isAnimating ? 'Pause' : years > 0 ? 'Resume' : 'Simulate'}
                            </Button>
                            <Button onClick={resetSim} variant="secondary">Reset</Button>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 5" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title="Growth Dashboard" items={[
                        { label: 'GDP Growth Rate', value: `${growthRate.toFixed(1)}%`, color: 'rgba(100,200,150,1)' },
                        { label: 'Capital Stock', value: `${(ppcScale * capitalInvestment / 100 * 100).toFixed(0)}`, color: 'rgba(255,180,100,1)' },
                        { label: 'Human Capital Idx', value: `${humanCapital}`, color: 'rgba(100,150,255,1)' },
                        { label: 'Technology Level', value: `${technology}`, color: 'rgba(200,130,255,1)' },
                        { label: 'Doubling Time', value: `${doublingTime} yrs`, color: 'rgba(220,180,80,1)' },
                        { label: 'Years Elapsed', value: `${years}`, color: 'rgba(255,255,255,0.7)' },
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Growth Equations" collapsed equations={[
                        { label: 'Production', expression: 'Y = A * f(K, L, H)', description: 'Production function' },
                        { label: 'Growth', expression: 'Growth = dY/Y', description: 'Real GDP growth rate' },
                        { label: 'Rule of 70', expression: 't = 70 / g', description: 'Doubling time' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
