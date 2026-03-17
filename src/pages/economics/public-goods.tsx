import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type View = 'public-goods' | 'lorenz'
type Preset = 'custom' | 'us' | 'sweden' | 'brazil' | 'southafrica'

const GOLD = 'rgb(220, 180, 80)'

const presetGinis: Record<Exclude<Preset, 'custom'>, { gini: number; label: string }> = {
    sweden: { gini: 0.27, label: 'Sweden' },
    us: { gini: 0.39, label: 'United States' },
    brazil: { gini: 0.53, label: 'Brazil' },
    southafrica: { gini: 0.63, label: 'South Africa' },
}

const goodTypes = [
    { name: 'Private Goods', excludable: true, rival: true, examples: 'Food, clothing, cars', color: 'rgba(100,150,255,0.85)' },
    { name: 'Club Goods', excludable: true, rival: false, examples: 'Netflix, gym, toll road', color: 'rgba(100,200,150,0.85)' },
    { name: 'Common Resources', excludable: false, rival: true, examples: 'Fish stocks, clean air', color: 'rgba(255,180,80,0.85)' },
    { name: 'Public Goods', excludable: false, rival: false, examples: 'National defense, fireworks', color: 'rgba(255,100,100,0.85)' },
]

function getLorenzY(x: number, gini: number): number {
    const n = 1 + gini * 4
    return Math.pow(x, n)
}

function computeGiniFromCurve(gini: number): number {
    const steps = 200
    let areaUnderLorenz = 0
    for (let i = 0; i < steps; i++) {
        const x0 = i / steps, x1 = (i + 1) / steps
        areaUnderLorenz += (getLorenzY(x0, gini) + getLorenzY(x1, gini)) / 2 * (x1 - x0)
    }
    return 1 - 2 * areaUnderLorenz
}

function getQuintileShares(gini: number): number[] {
    const shares: number[] = []
    for (let q = 0; q < 5; q++) {
        const x0 = q / 5, x1 = (q + 1) / 5
        shares.push((getLorenzY(x1, gini) - getLorenzY(x0, gini)) * 100)
    }
    return shares
}

function getDemandAtQ(q: number, consumerIndex: number, _numConsumers: number): number {
    const baseWTP = 10 - consumerIndex * 2
    return Math.max(0, baseWTP - q * (1.2 - consumerIndex * 0.15))
}

export default function PublicGoods() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [view, setView] = useState<View>('public-goods')
    const [gini, setGini] = useState(0.39)
    const [preset, setPreset] = useState<Preset>('us')
    const [showOptimal, setShowOptimal] = useState(true)
    const [numConsumers, setNumConsumers] = useState(3)

    const applyPreset = useCallback((p: Preset) => {
        setPreset(p)
        if (p !== 'custom') setGini(presetGinis[p].gini)
    }, [])

    const handleGiniChange = useCallback((v: number) => {
        setGini(v)
        setPreset('custom')
    }, [])

    const computedGini = useMemo(() => computeGiniFromCurve(gini), [gini])
    const quintiles = useMemo(() => getQuintileShares(gini), [gini])

    const optimalQ = useMemo(() => {
        const mc = 5
        for (let q = 0.1; q <= 10; q += 0.1) {
            let msb = 0
            for (let c = 0; c < numConsumers; c++) msb += getDemandAtQ(q, c, numConsumers)
            if (msb <= mc) return q
        }
        return 8
    }, [numConsumers])

    const marketQ = useMemo(() => {
        const mc = 5
        for (let q = 0.1; q <= 10; q += 0.1) {
            const highestMB = getDemandAtQ(q, 0, numConsumers)
            if (highestMB <= mc) return q
        }
        return 4
    }, [numConsumers])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'Goods Classification', description: 'Goods are classified by two properties: excludability (can you prevent use?) and rivalry (does use reduce availability?).', setup: () => setView('public-goods') },
        { title: 'Private Goods', description: 'Private goods are both excludable and rival. Markets allocate them efficiently through supply and demand.', setup: () => { setView('public-goods'); setNumConsumers(2) } },
        { title: 'Public Goods', description: 'Public goods are non-excludable and non-rival. Everyone benefits, and one person\'s use doesn\'t diminish another\'s.', setup: () => { setView('public-goods'); setShowOptimal(true); setNumConsumers(3) } },
        { title: 'The Free Rider Problem', description: 'People can enjoy public goods without paying. This leads to underprovision: Q_market < Q_optimal.', setup: () => { setView('public-goods'); setShowOptimal(true); setNumConsumers(3) } },
        { title: 'Vertical Summation', description: 'For public goods, MSB = sum of all individual MBs at each quantity. We add demand curves VERTICALLY, not horizontally.', setup: () => { setView('public-goods'); setNumConsumers(4) } },
        { title: 'Lorenz Curve Intro', description: 'The Lorenz curve shows income distribution. The 45-degree line represents perfect equality.', setup: () => { setView('lorenz'); applyPreset('sweden') } },
        { title: 'The Gini Coefficient', description: 'Gini = A/(A+B). Ranges from 0 (perfect equality) to 1 (perfect inequality). Compare countries!', setup: () => { setView('lorenz'); applyPreset('southafrica') } },
        { title: 'Experiment', description: 'Switch views, adjust sliders, and compare country presets. Explore the connections between public goods and inequality!', setup: () => { setView('lorenz'); applyPreset('us') } },
    ], [applyPreset])

    const demo = useDemoMode(demoSteps)

    // --- Canvas Drawing ---
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const resize = () => { canvas.width = canvas.offsetWidth * window.devicePixelRatio; canvas.height = canvas.offsetHeight * window.devicePixelRatio; ctx.scale(window.devicePixelRatio, window.devicePixelRatio) }
        resize()
        window.addEventListener('resize', resize)
        const W = canvas.offsetWidth, H = canvas.offsetHeight
        ctx.fillStyle = '#1a150a'; ctx.fillRect(0, 0, W, H)

        if (view === 'public-goods') {
            drawPublicGoodsPanel(ctx, W, H)
        } else {
            drawLorenzPanel(ctx, W, H)
        }

        return () => window.removeEventListener('resize', resize)
    }, [view, gini, showOptimal, numConsumers, optimalQ, marketQ])

    function drawPublicGoodsPanel(ctx: CanvasRenderingContext2D, W: number, H: number) {
        const matrixW = Math.min(280, W * 0.3), matrixH = 200
        const mx = 30, my = 50

        // Title
        ctx.fillStyle = 'rgba(220,180,80,0.9)'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'left'
        ctx.fillText('Goods Classification Matrix', mx, my - 12)

        // Matrix headers
        ctx.font = '11px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'center'
        ctx.fillText('Rival', mx + matrixW * 0.37, my + 10)
        ctx.fillText('Non-Rival', mx + matrixW * 0.77, my + 10)

        ctx.save(); ctx.translate(mx + 8, my + matrixH * 0.35 + 20); ctx.rotate(-Math.PI / 2)
        ctx.fillText('Excludable', 0, 0); ctx.restore()
        ctx.save(); ctx.translate(mx + 8, my + matrixH * 0.78 + 20); ctx.rotate(-Math.PI / 2)
        ctx.fillText('Non-Excl.', 0, 0); ctx.restore()

        // Draw 4 cells
        const cellW = (matrixW - 40) / 2, cellH = (matrixH - 30) / 2
        const startX = mx + 30, startY = my + 20
        const positions = [
            { row: 0, col: 0, good: goodTypes[0] },
            { row: 0, col: 1, good: goodTypes[1] },
            { row: 1, col: 0, good: goodTypes[2] },
            { row: 1, col: 1, good: goodTypes[3] },
        ]
        for (const { row, col, good } of positions) {
            const cx = startX + col * (cellW + 4), cy = startY + row * (cellH + 4)
            ctx.fillStyle = good.color.replace('0.85', '0.12')
            ctx.strokeStyle = good.color.replace('0.85', '0.3')
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.roundRect(cx, cy, cellW, cellH, 6); ctx.fill(); ctx.stroke()
            ctx.fillStyle = good.color; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(good.name, cx + cellW / 2, cy + cellH / 2 - 6)
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px system-ui'
            ctx.fillText(good.examples, cx + cellW / 2, cy + cellH / 2 + 10)
        }

        // --- Supply / Demand Chart ---
        const chartLeft = Math.max(mx + matrixW + 40, W * 0.35)
        const chartRight = W - 40, chartTop = 60, chartBot = H - 80
        const gW = chartRight - chartLeft, gH = chartBot - chartTop
        const maxQ = 10, maxP = 16

        const toX = (q: number) => chartLeft + (q / maxQ) * gW
        const toY = (p: number) => chartBot - (p / maxP) * gH

        // Grid
        ctx.strokeStyle = 'rgba(220,180,80,0.06)'; ctx.lineWidth = 1
        for (let q = 0; q <= maxQ; q += 2) { ctx.beginPath(); ctx.moveTo(toX(q), chartTop); ctx.lineTo(toX(q), chartBot); ctx.stroke() }
        for (let p = 0; p <= maxP; p += 2) { ctx.beginPath(); ctx.moveTo(chartLeft, toY(p)); ctx.lineTo(chartRight, toY(p)); ctx.stroke() }

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(chartLeft, chartTop); ctx.lineTo(chartLeft, chartBot); ctx.lineTo(chartRight, chartBot); ctx.stroke()
        ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('Quantity', chartLeft + gW / 2, chartBot + 35)
        ctx.save(); ctx.translate(chartLeft - 40, chartTop + gH / 2); ctx.rotate(-Math.PI / 2)
        ctx.fillText('Price / MB ($)', 0, 0); ctx.restore()

        // Ticks
        ctx.font = '10px system-ui'; ctx.fillStyle = 'rgba(220,180,80,0.5)'
        for (let q = 2; q <= maxQ; q += 2) { ctx.textAlign = 'center'; ctx.fillText(String(q), toX(q), chartBot + 15) }
        for (let p = 0; p <= maxP; p += 4) { ctx.textAlign = 'right'; ctx.fillText('$' + p, chartLeft - 8, toY(p) + 4) }

        // Individual demand curves
        const colors = ['rgba(100,150,255,0.7)', 'rgba(100,200,150,0.7)', 'rgba(255,180,80,0.7)', 'rgba(200,100,255,0.7)']
        for (let c = 0; c < numConsumers; c++) {
            ctx.strokeStyle = colors[c]; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.beginPath()
            let started = false
            for (let q = 0.1; q <= maxQ; q += 0.1) {
                const mb = getDemandAtQ(q, c, numConsumers)
                if (mb <= 0) break
                if (!started) { ctx.moveTo(toX(q), toY(mb)); started = true } else ctx.lineTo(toX(q), toY(mb))
            }
            ctx.stroke(); ctx.setLineDash([])
            const labelQ = 1
            const labelMB = getDemandAtQ(labelQ, c, numConsumers)
            if (labelMB > 0) {
                ctx.fillStyle = colors[c]; ctx.font = '10px system-ui'; ctx.textAlign = 'left'
                ctx.fillText(`MB${c + 1}`, toX(labelQ) + 4, toY(labelMB) - 6)
            }
        }

        // MSB (vertical summation)
        ctx.strokeStyle = 'rgba(255,100,100,0.9)'; ctx.lineWidth = 3; ctx.beginPath()
        let msbStarted = false
        for (let q = 0.1; q <= maxQ; q += 0.1) {
            let msb = 0
            for (let c = 0; c < numConsumers; c++) msb += getDemandAtQ(q, c, numConsumers)
            if (msb <= 0) break
            if (!msbStarted) { ctx.moveTo(toX(q), toY(msb)); msbStarted = true } else ctx.lineTo(toX(q), toY(msb))
        }
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,100,100,0.9)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left'
        let msbLabel = 0
        for (let c = 0; c < numConsumers; c++) msbLabel += getDemandAtQ(0.5, c, numConsumers)
        ctx.fillText('MSB = \u03A3MB\u1D62', toX(0.5) + 4, toY(msbLabel) - 8)

        // MC (supply) line
        const mc = 5
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(chartLeft, toY(mc)); ctx.lineTo(chartRight, toY(mc)); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'right'
        ctx.fillText('MC (Supply)', chartRight - 5, toY(mc) - 8)

        // Optimal Q (MSB = MC)
        if (showOptimal) {
            ctx.strokeStyle = 'rgba(80,200,120,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 3])
            ctx.beginPath(); ctx.moveTo(toX(optimalQ), chartTop); ctx.lineTo(toX(optimalQ), chartBot); ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(80,200,120,0.9)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(`Q* = ${optimalQ.toFixed(1)}`, toX(optimalQ), chartTop - 8)

            // Market Q (highest individual MB = MC)
            ctx.strokeStyle = 'rgba(255,180,80,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4])
            ctx.beginPath(); ctx.moveTo(toX(marketQ), chartTop + 15); ctx.lineTo(toX(marketQ), chartBot); ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,180,80,0.9)'; ctx.font = 'bold 11px system-ui'
            ctx.fillText(`Q_mkt = ${marketQ.toFixed(1)}`, toX(marketQ), chartTop + 8)

            // Free rider gap shading
            if (marketQ < optimalQ) {
                ctx.fillStyle = 'rgba(255,100,100,0.08)'
                ctx.fillRect(toX(marketQ), chartTop, toX(optimalQ) - toX(marketQ), chartBot - chartTop)
                ctx.fillStyle = 'rgba(255,100,100,0.7)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('Free Rider', (toX(marketQ) + toX(optimalQ)) / 2, chartBot - 20)
                ctx.fillText('Gap', (toX(marketQ) + toX(optimalQ)) / 2, chartBot - 8)
            }
        }

        // Government provision arrow
        if (showOptimal && marketQ < optimalQ) {
            const arrowY = chartBot + 50
            ctx.strokeStyle = 'rgba(80,200,120,0.6)'; ctx.lineWidth = 2
            ctx.beginPath(); ctx.moveTo(toX(marketQ), arrowY); ctx.lineTo(toX(optimalQ), arrowY); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(toX(optimalQ) - 8, arrowY - 5); ctx.lineTo(toX(optimalQ), arrowY); ctx.lineTo(toX(optimalQ) - 8, arrowY + 5); ctx.fill()
            ctx.fillStyle = 'rgba(80,200,120,0.7)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Gov\'t provision needed', (toX(marketQ) + toX(optimalQ)) / 2, arrowY - 8)
        }
    }

    function drawLorenzPanel(ctx: CanvasRenderingContext2D, W: number, H: number) {
        const pad = 70, chartSize = Math.min(W - pad * 2, H - pad * 2 - 40)
        const ox = (W - chartSize) / 2, oy = (H - chartSize) / 2 - 10
        const toX = (v: number) => ox + v * chartSize
        const toY = (v: number) => oy + chartSize - v * chartSize

        // Grid
        ctx.strokeStyle = 'rgba(220,180,80,0.06)'; ctx.lineWidth = 1
        for (let i = 0.2; i <= 1; i += 0.2) {
            ctx.beginPath(); ctx.moveTo(toX(i), toY(0)); ctx.lineTo(toX(i), toY(1)); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(toX(0), toY(i)); ctx.lineTo(toX(1), toY(i)); ctx.stroke()
        }

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(toX(0), toY(1)); ctx.lineTo(toX(0), toY(0)); ctx.lineTo(toX(1), toY(0)); ctx.stroke()
        ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('Cumulative % of Population', ox + chartSize / 2, toY(0) + 40)
        ctx.save(); ctx.translate(ox - 45, oy + chartSize / 2); ctx.rotate(-Math.PI / 2)
        ctx.fillText('Cumulative % of Income', 0, 0); ctx.restore()

        // Ticks
        ctx.font = '10px system-ui'; ctx.fillStyle = 'rgba(220,180,80,0.5)'
        for (let i = 0.2; i <= 1; i += 0.2) {
            ctx.textAlign = 'center'; ctx.fillText((i * 100).toFixed(0) + '%', toX(i), toY(0) + 16)
            ctx.textAlign = 'right'; ctx.fillText((i * 100).toFixed(0) + '%', toX(0) - 8, toY(i) + 4)
        }

        // Shade Area B (below Lorenz curve)
        ctx.fillStyle = 'rgba(100,150,255,0.1)'
        ctx.beginPath(); ctx.moveTo(toX(0), toY(0))
        for (let x = 0; x <= 1; x += 0.005) ctx.lineTo(toX(x), toY(getLorenzY(x, gini)))
        ctx.lineTo(toX(1), toY(1)); ctx.closePath(); ctx.fill()

        // Shade Area A (between equality line and Lorenz)
        ctx.fillStyle = 'rgba(255,100,100,0.12)'
        ctx.beginPath(); ctx.moveTo(toX(0), toY(0))
        for (let x = 0; x <= 1; x += 0.005) ctx.lineTo(toX(x), toY(x))
        ctx.lineTo(toX(1), toY(1))
        for (let x = 1; x >= 0; x -= 0.005) ctx.lineTo(toX(x), toY(getLorenzY(x, gini)))
        ctx.closePath(); ctx.fill()

        // Label Area A and B
        const labelAx = 0.35, labelAy = (0.35 + getLorenzY(0.35, gini)) / 2
        ctx.fillStyle = 'rgba(255,100,100,0.7)'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('A', toX(labelAx), toY(labelAy))
        const labelBx = 0.55, labelBy = getLorenzY(0.55, gini) / 2
        ctx.fillStyle = 'rgba(100,150,255,0.7)'; ctx.font = 'bold 16px system-ui'
        ctx.fillText('B', toX(labelBx), toY(labelBy))

        // 45-degree line of equality
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4])
        ctx.beginPath(); ctx.moveTo(toX(0), toY(0)); ctx.lineTo(toX(1), toY(1)); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px system-ui'; ctx.textAlign = 'left'
        ctx.fillText('Perfect Equality', toX(0.52), toY(0.56))

        // Lorenz curve
        const gradient = ctx.createLinearGradient(toX(0), 0, toX(1), 0)
        gradient.addColorStop(0, 'rgba(220,180,80,0.9)'); gradient.addColorStop(1, 'rgba(255,100,100,0.9)')
        ctx.strokeStyle = gradient; ctx.lineWidth = 3; ctx.beginPath()
        ctx.moveTo(toX(0), toY(0))
        for (let x = 0.005; x <= 1; x += 0.005) ctx.lineTo(toX(x), toY(getLorenzY(x, gini)))
        ctx.stroke()
        ctx.fillStyle = 'rgba(220,180,80,0.9)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'right'
        ctx.fillText('Lorenz Curve', toX(0.85), toY(getLorenzY(0.85, gini)) + 18)

        // Gini display
        ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(`Gini = ${computedGini.toFixed(3)}`, toX(0.5), oy - 10)
        if (preset !== 'custom') {
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '13px system-ui'
            ctx.fillText(presetGinis[preset].label, toX(0.5), oy + 10)
        }

        // Quintile markers on the curve
        ctx.fillStyle = 'rgba(220,180,80,0.8)'
        for (let q = 1; q <= 4; q++) {
            const px = q / 5
            const py = getLorenzY(px, gini)
            ctx.beginPath(); ctx.arc(toX(px), toY(py), 4, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(`${(py * 100).toFixed(1)}%`, toX(px), toY(py) + 14)
            ctx.fillStyle = 'rgba(220,180,80,0.8)'
        }
    }

    const currentPresetLabel = preset === 'custom' ? 'Custom' : presetGinis[preset].label

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="View">
                            <ButtonGroup value={view} onChange={v => setView(v as View)} options={[
                                { value: 'public-goods', label: 'Public Goods' },
                                { value: 'lorenz', label: 'Lorenz Curve' },
                            ]} color={GOLD} />
                        </ControlGroup>

                        {view === 'public-goods' && (
                            <>
                                <Slider label="Consumers" value={numConsumers} onChange={v => setNumConsumers(v)} min={2} max={4} step={1} />
                                <Toggle label="Show Optimal vs Market" value={showOptimal} onChange={setShowOptimal} />
                            </>
                        )}

                        {view === 'lorenz' && (
                            <>
                                <Slider label="Gini Coefficient" value={gini} onChange={handleGiniChange} min={0} max={0.8} step={0.01} />
                                <ControlGroup label="Country Presets">
                                    <ButtonGroup value={preset} onChange={v => applyPreset(v as Preset)} options={[
                                        { value: 'sweden', label: 'SWE' },
                                        { value: 'us', label: 'US' },
                                        { value: 'brazil', label: 'BRA' },
                                        { value: 'southafrica', label: 'ZAF' },
                                    ]} color={GOLD} />
                                </ControlGroup>
                            </>
                        )}

                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={() => { setView('public-goods'); setGini(0.39); setPreset('us'); setShowOptimal(true); setNumConsumers(3) }} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Microeconomics" unit="Unit 6" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    {view === 'public-goods' ? (
                        <InfoPanel departmentColor={GOLD} title="Public Goods Analysis" items={[
                            { label: 'Good Type', value: 'Public (non-excl, non-rival)', color: 'rgba(255,100,100,1)' },
                            { label: 'Optimal Q', value: `${optimalQ.toFixed(1)} units`, color: 'rgba(80,200,120,1)' },
                            { label: 'Market Q', value: `${marketQ.toFixed(1)} units`, color: 'rgba(255,180,80,1)' },
                            { label: 'Underprovision', value: `${(optimalQ - marketQ).toFixed(1)} units`, color: 'rgba(255,100,100,1)' },
                            { label: 'Consumers', value: String(numConsumers), color: 'rgba(100,150,255,1)' },
                        ]} />
                    ) : (
                        <InfoPanel departmentColor={GOLD} title="Income Distribution" items={[
                            { label: 'Gini Coefficient', value: computedGini.toFixed(3), color: GOLD },
                            { label: 'Preset', value: currentPresetLabel, color: 'rgba(255,255,255,0.8)' },
                            { label: 'Bottom 20%', value: `${quintiles[0].toFixed(1)}%`, color: 'rgba(100,150,255,1)' },
                            { label: 'Second 20%', value: `${quintiles[1].toFixed(1)}%`, color: 'rgba(100,180,200,1)' },
                            { label: 'Middle 20%', value: `${quintiles[2].toFixed(1)}%`, color: 'rgba(100,200,150,1)' },
                            { label: 'Fourth 20%', value: `${quintiles[3].toFixed(1)}%`, color: 'rgba(200,180,80,1)' },
                            { label: 'Top 20%', value: `${quintiles[4].toFixed(1)}%`, color: 'rgba(255,100,100,1)' },
                        ]} />
                    )}

                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'MSB', expression: 'MSB = \u03A3MB\u1D62', description: 'Vertical summation of individual demands' },
                        { label: 'Gini', expression: 'Gini = A / (A + B)', description: '0 = perfect equality, 1 = perfect inequality' },
                        { label: 'Free Rider', expression: 'Q_market < Q_optimal', description: 'Underprovision of public goods' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
