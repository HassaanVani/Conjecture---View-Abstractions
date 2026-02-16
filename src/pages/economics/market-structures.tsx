import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, Slider, Select, Button, ButtonGroup } from '@/components/control-panel'
import type { DemoStep } from '@/components/demo-mode'

type Structure = 'perfect' | 'monopoly' | 'monopolistic' | 'oligopoly'

const COLOR = 'rgb(220, 180, 80)'

interface StructureInfo {
    label: string
    demand: 'horizontal' | 'downward'
    mrSplit: boolean
    longRunProfit: boolean
    description: string
}

const STRUCTURES: Record<Structure, StructureInfo> = {
    perfect: {
        label: 'Perfect Competition',
        demand: 'horizontal',
        mrSplit: false,
        longRunProfit: false,
        description: 'Many firms, identical products. Price taker: P = MR = D. Zero economic profit in long run.',
    },
    monopoly: {
        label: 'Monopoly',
        demand: 'downward',
        mrSplit: true,
        longRunProfit: true,
        description: 'Single firm, unique product, high barriers. Price maker: MR < P. Earns economic profit.',
    },
    monopolistic: {
        label: 'Monopolistic Competition',
        demand: 'downward',
        mrSplit: true,
        longRunProfit: false,
        description: 'Many firms, differentiated products. Downward D, but zero profit in long run (free entry).',
    },
    oligopoly: {
        label: 'Oligopoly',
        demand: 'downward',
        mrSplit: true,
        longRunProfit: true,
        description: 'Few large firms, interdependent. Strategic behavior, possible collusion.',
    },
}

export default function MarketStructures() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)

    const [structure, setStructure] = useState<Structure>('perfect')
    const [mcLevel, setMcLevel] = useState(50)
    const [demandElasticity, setDemandElasticity] = useState(0.6)
    const [priceLevel, setPriceLevel] = useState(60)
    const [showLongRun, setShowLongRun] = useState(false)

    const info = STRUCTURES[structure]

    const getMC = useCallback((q: number) => {
        const base = mcLevel * 0.4
        return base + (mcLevel * 0.012) * q * q * 0.01
    }, [mcLevel])

    const getATC = useCallback((q: number) => {
        if (q <= 0) return 200
        const fc = mcLevel * 2
        const vc = (mcLevel * 0.3) * q + (mcLevel * 0.005) * q * q
        return (fc + vc) / q
    }, [mcLevel])

    const getAVC = useCallback((q: number) => {
        if (q <= 0) return 0
        const vc = (mcLevel * 0.3) * q + (mcLevel * 0.005) * q * q
        return vc / q
    }, [mcLevel])

    const getDemandP = useCallback((q: number) => {
        if (structure === 'perfect') return priceLevel
        const intercept = priceLevel * 2
        return intercept - demandElasticity * q
    }, [structure, priceLevel, demandElasticity])

    const getMR = useCallback((q: number) => {
        if (structure === 'perfect') return priceLevel
        const intercept = priceLevel * 2
        return intercept - 2 * demandElasticity * q
    }, [structure, priceLevel, demandElasticity])

    // Find MR=MC intersection
    const findOptimalQ = useCallback(() => {
        let bestQ = 1
        let minDiff = Infinity
        for (let q = 1; q <= 150; q += 0.5) {
            const diff = Math.abs(getMR(q) - getMC(q))
            if (diff < minDiff) { minDiff = diff; bestQ = q }
        }
        return bestQ
    }, [getMR, getMC])

    const optQ = findOptimalQ()
    const optP = getDemandP(optQ)
    const optATC = getATC(optQ)
    const profit = (optP - optATC) * optQ
    const profitPerUnit = optP - optATC

    const demoSteps: DemoStep[] = [
        {
            title: 'Market Structures Overview',
            description: 'Market structure determines how firms behave. The key differences are: number of firms, product differentiation, barriers to entry, and price-setting power.',
            setup: () => { setStructure('perfect'); setMcLevel(50); setDemandElasticity(0.6); setPriceLevel(60); setShowLongRun(false) },
        },
        {
            title: 'Perfect Competition',
            description: 'Many small firms sell identical products. Each firm is a price TAKER -- the demand curve is perfectly horizontal at the market price. P = MR = AR. Firms produce where MR = MC.',
            setup: () => { setStructure('perfect'); setPriceLevel(60); setShowLongRun(false) },
            highlight: 'Notice the horizontal demand/MR curve',
        },
        {
            title: 'Profit Maximization: MR = MC',
            description: 'ALL firms maximize profit by producing where Marginal Revenue equals Marginal Cost. If MR > MC, produce more. If MR < MC, produce less. The MR=MC rule is universal.',
            setup: () => { setStructure('perfect'); setPriceLevel(70) },
            highlight: 'The gold dot shows the profit-maximizing output',
        },
        {
            title: 'Economic Profit & Loss',
            description: 'If P > ATC, the firm earns economic profit (green shading). If P < ATC, the firm has losses (red shading). If P = ATC exactly, the firm breaks even (normal profit).',
            setup: () => { setStructure('perfect'); setPriceLevel(80) },
        },
        {
            title: 'Monopoly',
            description: 'A monopolist faces the entire market demand curve (downward sloping). MR is below D because to sell more, it must lower price on ALL units. MR has twice the slope of D.',
            setup: () => { setStructure('monopoly'); setPriceLevel(60); setDemandElasticity(0.6) },
            highlight: 'MR curve is steeper than D curve',
        },
        {
            title: 'Monopoly Markup',
            description: 'The monopolist produces at MR = MC but charges the price on the DEMAND curve (not MR). This creates a markup: P > MC, causing allocative inefficiency (deadweight loss).',
            setup: () => { setStructure('monopoly'); setPriceLevel(65) },
        },
        {
            title: 'Monopolistic Competition',
            description: 'Like monopoly in the short run (downward D, MR < P). But free entry means in the long run, economic profit is driven to ZERO. The D curve becomes tangent to ATC.',
            setup: () => { setStructure('monopolistic'); setShowLongRun(true) },
        },
        {
            title: 'Oligopoly',
            description: 'A few large firms dominate. Each firm\'s decisions affect rivals. This interdependence leads to strategic behavior, possible collusion (acting like a monopoly), or price wars.',
            setup: () => { setStructure('oligopoly'); setDemandElasticity(0.5) },
        },
        {
            title: 'Efficiency Comparison',
            description: 'Perfect competition: P = MC (allocative) and P = min ATC (productive). Monopoly: P > MC (deadweight loss). The markup measures market power. Try adjusting elasticity!',
            setup: () => { setStructure('monopoly'); setDemandElasticity(0.4) },
            highlight: 'Lower elasticity = more market power',
        },
    ]

    const demo = useDemoMode(demoSteps)

    const reset = useCallback(() => {
        setStructure('perfect')
        setMcLevel(50)
        setDemandElasticity(0.6)
        setPriceLevel(60)
        setShowLongRun(false)
    }, [])

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
            t += 0.015
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const padding = 80
            const gw = w - padding * 2
            const gh = h - padding * 2 - 50

            const maxQ = 150
            const maxP = 150
            const toX = (q: number) => padding + (q / maxQ) * gw
            const toY = (p: number) => h - padding - 50 - (p / maxP) * gh

            ctx.fillStyle = '#1a150a'
            ctx.fillRect(0, 0, w, h)

            // Grid
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.06)'
            ctx.lineWidth = 1
            for (let q = 0; q <= maxQ; q += 30) {
                ctx.beginPath(); ctx.moveTo(toX(q), toY(0)); ctx.lineTo(toX(q), toY(maxP)); ctx.stroke()
            }
            for (let p = 0; p <= maxP; p += 30) {
                ctx.beginPath(); ctx.moveTo(toX(0), toY(p)); ctx.lineTo(toX(maxQ), toY(p)); ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(padding, toY(maxP))
            ctx.lineTo(padding, toY(0))
            ctx.lineTo(toX(maxQ), toY(0))
            ctx.stroke()

            // Axis labels
            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.font = '14px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Quantity (Q)', padding + gw / 2, h - 20)
            ctx.save()
            ctx.translate(22, h / 2 - 25)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Price / Cost ($)', 0, 0)
            ctx.restore()

            // Ticks
            ctx.fillStyle = 'rgba(220, 180, 80, 0.5)'
            ctx.font = '10px system-ui'
            for (let q = 30; q <= maxQ; q += 30) {
                ctx.textAlign = 'center'
                ctx.fillText(q.toString(), toX(q), toY(0) + 15)
            }
            for (let p = 30; p <= maxP; p += 30) {
                ctx.textAlign = 'right'
                ctx.fillText('$' + p, toX(0) - 8, toY(p) + 4)
            }

            // Profit/loss shading
            if (optQ > 0 && optP > 0 && optP < maxP) {
                const shadeColor = profitPerUnit > 2
                    ? 'rgba(80, 200, 120, 0.15)'
                    : profitPerUnit < -2
                        ? 'rgba(255, 100, 100, 0.15)'
                        : 'rgba(220, 180, 80, 0.08)'

                ctx.fillStyle = shadeColor
                const top = Math.min(toY(optP), toY(optATC))
                const bot = Math.max(toY(optP), toY(optATC))
                ctx.fillRect(toX(0), top, toX(optQ) - toX(0), bot - top)
            }

            // AVC curve
            ctx.strokeStyle = 'rgba(100, 200, 150, 0.6)'
            ctx.lineWidth = 2
            ctx.lineCap = 'round'
            ctx.beginPath()
            let started = false
            for (let q = 5; q <= maxQ; q += 1) {
                const p = getAVC(q)
                if (p > maxP) continue
                if (!started) { ctx.moveTo(toX(q), toY(p)); started = true }
                else ctx.lineTo(toX(q), toY(p))
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(100, 200, 150, 0.8)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('AVC', toX(maxQ - 15), toY(getAVC(maxQ - 15)) + 14)

            // ATC curve
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.9)'
            ctx.lineWidth = 2.5
            ctx.beginPath()
            started = false
            for (let q = 5; q <= maxQ; q += 1) {
                const p = getATC(q)
                if (p > maxP) continue
                if (!started) { ctx.moveTo(toX(q), toY(p)); started = true }
                else ctx.lineTo(toX(q), toY(p))
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255, 200, 100, 1)'
            ctx.fillText('ATC', toX(maxQ - 10), toY(getATC(maxQ - 10)) - 8)

            // MC curve
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
            ctx.lineWidth = 3
            ctx.beginPath()
            started = false
            for (let q = 2; q <= maxQ; q += 1) {
                const p = getMC(q)
                if (p > maxP) continue
                if (!started) { ctx.moveTo(toX(q), toY(p)); started = true }
                else ctx.lineTo(toX(q), toY(p))
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255, 100, 100, 1)'
            ctx.font = 'bold 13px system-ui'
            const mcLabelQ = Math.min(maxQ - 5, 120)
            const mcLabelP = getMC(mcLabelQ)
            if (mcLabelP < maxP) ctx.fillText('MC', toX(mcLabelQ) + 5, toY(mcLabelP) - 8)

            // Demand curve
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.9)'
            ctx.lineWidth = 3
            ctx.beginPath()
            if (structure === 'perfect') {
                ctx.moveTo(toX(0), toY(priceLevel))
                ctx.lineTo(toX(maxQ), toY(priceLevel))
            } else {
                for (let q = 0; q <= maxQ; q += 1) {
                    const p = getDemandP(q)
                    if (p < 0) break
                    if (p > maxP) continue
                    if (q === 0) ctx.moveTo(toX(q), toY(p))
                    else ctx.lineTo(toX(q), toY(p))
                }
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(100, 150, 255, 1)'
            ctx.font = 'bold 13px system-ui'
            if (structure === 'perfect') {
                ctx.textAlign = 'right'
                ctx.fillText('D = MR = P', toX(maxQ) - 5, toY(priceLevel) - 10)
            } else {
                ctx.textAlign = 'left'
                const dLabelQ = 20
                ctx.fillText('D', toX(dLabelQ), toY(getDemandP(dLabelQ)) - 10)
            }

            // MR curve (for non-perfect competition)
            if (info.mrSplit) {
                ctx.strokeStyle = 'rgba(180, 100, 255, 0.8)'
                ctx.lineWidth = 2.5
                ctx.beginPath()
                started = false
                for (let q = 0; q <= maxQ; q += 1) {
                    const p = getMR(q)
                    if (p < 0) break
                    if (p > maxP) continue
                    if (!started) { ctx.moveTo(toX(q), toY(p)); started = true }
                    else ctx.lineTo(toX(q), toY(p))
                }
                ctx.stroke()
                ctx.fillStyle = 'rgba(180, 100, 255, 1)'
                ctx.font = 'bold 13px system-ui'
                const mrLabelQ = 25
                const mrP = getMR(mrLabelQ)
                if (mrP > 0 && mrP < maxP) ctx.fillText('MR', toX(mrLabelQ), toY(mrP) - 10)
            }

            // MR=MC intersection point
            if (optQ > 0 && optQ < maxQ) {
                const mcAtOpt = getMC(optQ)

                // Dashed lines
                ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'
                ctx.lineWidth = 1.5
                ctx.setLineDash([6, 4])
                ctx.beginPath()
                ctx.moveTo(toX(optQ), toY(mcAtOpt))
                ctx.lineTo(toX(optQ), toY(0))
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(toX(optQ), toY(optP))
                ctx.lineTo(toX(0), toY(optP))
                ctx.stroke()
                if (info.mrSplit) {
                    ctx.beginPath()
                    ctx.moveTo(toX(optQ), toY(optATC))
                    ctx.lineTo(toX(0), toY(optATC))
                    ctx.stroke()
                }
                ctx.setLineDash([])

                // Glow
                const pulse = 0.3 + 0.15 * Math.sin(t * 3)
                const glow = ctx.createRadialGradient(toX(optQ), toY(mcAtOpt), 0, toX(optQ), toY(mcAtOpt), 22)
                glow.addColorStop(0, `rgba(220, 180, 80, ${pulse})`)
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath()
                ctx.arc(toX(optQ), toY(mcAtOpt), 22, 0, Math.PI * 2)
                ctx.fill()

                // MR=MC point
                ctx.fillStyle = 'rgba(220, 180, 80, 1)'
                ctx.beginPath()
                ctx.arc(toX(optQ), toY(mcAtOpt), 7, 0, Math.PI * 2)
                ctx.fill()
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.lineWidth = 2
                ctx.stroke()

                // Price point on D curve (for non-PC)
                if (info.mrSplit && optP < maxP) {
                    ctx.fillStyle = 'rgba(100, 150, 255, 1)'
                    ctx.beginPath()
                    ctx.arc(toX(optQ), toY(optP), 5, 0, Math.PI * 2)
                    ctx.fill()
                }

                // Labels
                ctx.fillStyle = 'rgba(220, 180, 80, 0.9)'
                ctx.font = '11px monospace'
                ctx.textAlign = 'center'
                ctx.fillText(`Q* = ${optQ.toFixed(0)}`, toX(optQ), toY(0) + 18)
                ctx.textAlign = 'right'
                ctx.fillText(`P* = $${optP.toFixed(0)}`, toX(0) - 8, toY(optP) + 4)

                // Profit label
                if (Math.abs(profitPerUnit) > 2) {
                    ctx.fillStyle = profitPerUnit > 0 ? 'rgba(80, 200, 120, 0.9)' : 'rgba(255, 100, 100, 0.9)'
                    ctx.font = 'bold 12px system-ui'
                    ctx.textAlign = 'center'
                    const midP = (optP + optATC) / 2
                    ctx.fillText(
                        `${profitPerUnit > 0 ? 'Profit' : 'Loss'}: $${Math.abs(profit).toFixed(0)}`,
                        toX(optQ / 2),
                        toY(midP)
                    )
                }
            }

            // Deadweight loss for monopoly/monopolistic
            if (info.mrSplit && structure !== 'oligopoly') {
                let compQ = 1, minD = Infinity
                for (let q = 1; q <= maxQ; q += 0.5) {
                    const diff = Math.abs(getMC(q) - getDemandP(q))
                    if (diff < minD) { minD = diff; compQ = q }
                }
                if (compQ > optQ) {
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.12)'
                    ctx.beginPath(); ctx.moveTo(toX(optQ), toY(optP))
                    for (let q = optQ; q <= compQ; q += 1) ctx.lineTo(toX(q), toY(getDemandP(q)))
                    for (let q = compQ; q >= optQ; q -= 1) ctx.lineTo(toX(q), toY(getMC(q)))
                    ctx.closePath(); ctx.fill()
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText('DWL', toX((optQ + compQ) / 2), toY((getDemandP((optQ + compQ) / 2) + getMC((optQ + compQ) / 2)) / 2))
                }
            }

            // Legend
            const lx = w - 170; let ly = 70
            ctx.font = '11px system-ui'; ctx.textAlign = 'left'
            const items: Array<[string, string]> = [['rgba(255,100,100,0.9)','MC'],['rgba(255,200,100,0.9)','ATC'],['rgba(100,200,150,0.8)','AVC'],['rgba(100,150,255,0.9)','Demand']]
            if (info.mrSplit) items.push(['rgba(180,100,255,0.8)', 'MR'])
            items.forEach(([color, label]) => { ctx.fillStyle = color; ctx.fillRect(lx, ly - 8, 12, 12); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText(label, lx + 18, ly); ly += 18 })

            animRef.current = requestAnimationFrame(draw)
        }

        animRef.current = requestAnimationFrame(draw)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animRef.current)
        }
    }, [structure, mcLevel, demandElasticity, priceLevel, showLongRun, info, getMC, getATC, getAVC, getDemandP, getMR, optQ, optP, optATC, profit, profitPerUnit, findOptimalQ])

    const markup = info.mrSplit ? optP - getMC(optQ) : 0
    const structureOptions = Object.entries(STRUCTURES).map(([k, v]) => ({ value: k, label: v.label }))

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-medium text-white/90">Market Structures</h1>
                    <APTag course="Microeconomics" unit="Unit 4" color={COLOR} />
                </div>
                <Button onClick={demo.open} className="text-xs">AP Tutorial</Button>
            </div>

            <div className="flex-1 relative flex overflow-hidden">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <EquationDisplay
                        equations={[
                            { label: 'Profit Max', expression: 'MR = MC', description: 'Produce where marginal revenue equals marginal cost' },
                            { label: 'Profit', expression: `\u03C0 = (P - ATC) x Q = $${profit.toFixed(0)}`, description: profitPerUnit > 0 ? 'Economic profit' : profitPerUnit < -2 ? 'Economic loss' : 'Normal profit (break-even)' },
                            ...(info.mrSplit ? [{ label: 'Markup', expression: `P - MC = $${markup.toFixed(1)}`, description: 'Market power: price exceeds marginal cost' }] : []),
                        ]}
                        departmentColor={COLOR}
                        className="absolute top-3 left-3 max-w-xs"
                        title="Key Equations"
                    />

                    <InfoPanel
                        title={info.label}
                        departmentColor={COLOR}
                        className="absolute top-3 right-3 min-w-[190px]"
                        items={[
                            { label: 'Optimal Q', value: optQ.toFixed(0), color: 'rgb(220, 180, 80)' },
                            { label: 'Price', value: `$${optP.toFixed(1)}`, color: 'rgb(100, 150, 255)' },
                            { label: 'ATC at Q*', value: `$${optATC.toFixed(1)}`, color: 'rgb(255, 200, 100)' },
                            { label: 'Profit/unit', value: `$${profitPerUnit.toFixed(1)}`, color: profitPerUnit > 0 ? 'rgb(80, 200, 120)' : 'rgb(255, 100, 100)' },
                            { label: 'Total profit', value: `$${profit.toFixed(0)}`, color: profitPerUnit > 0 ? 'rgb(80, 200, 120)' : 'rgb(255, 100, 100)' },
                        ]}
                    />

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
                            title="Market Structures Tutorial"
                        />
                    </div>
                </div>

                <div className="w-72 bg-black/30 border-l border-white/10 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto">
                    <ControlPanel className="!p-0 !bg-transparent !border-0 !backdrop-blur-0">
                        <Select
                            label="Market Structure"
                            value={structure}
                            onChange={(v) => setStructure(v as Structure)}
                            options={structureOptions}
                        />
                        <Slider
                            label="Cost Level (MC/ATC)"
                            value={mcLevel}
                            onChange={setMcLevel}
                            min={20}
                            max={90}
                            step={1}
                        />
                        {structure !== 'perfect' && (
                            <Slider
                                label="Demand Elasticity"
                                value={demandElasticity}
                                onChange={setDemandElasticity}
                                min={0.2}
                                max={1.2}
                                step={0.05}
                            />
                        )}
                        <Slider
                            label={structure === 'perfect' ? 'Market Price' : 'Demand Level'}
                            value={priceLevel}
                            onChange={setPriceLevel}
                            min={30}
                            max={90}
                            step={1}
                        />
                        <ButtonGroup
                            label="Time Horizon"
                            value={showLongRun ? 'long' : 'short'}
                            onChange={(v) => setShowLongRun(v === 'long')}
                            options={[
                                { value: 'short', label: 'Short Run' },
                                { value: 'long', label: 'Long Run' },
                            ]}
                            color={COLOR}
                        />
                    </ControlPanel>

                    <Button onClick={reset} variant="secondary" className="w-full">
                        Reset All
                    </Button>

                    <div className="mt-auto p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Current Structure</h4>
                        <p className="text-xs text-white/50 leading-relaxed">{info.description}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
