import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type ElasticityTab = 'ped' | 'pes' | 'cross-price' | 'income'

const GOLD = 'rgb(220, 180, 80)'

// Demand: Q = maxQ - slope * P (linear). slope controls elasticity.
// slope high => elastic, slope low => inelastic
const getDemandQ = (p: number, slope: number) => Math.max(0, 100 - slope * p)
const getSupplyQ = (p: number) => 10 + 0.8 * p

export default function Elasticity() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [demandElasticity, setDemandElasticity] = useState(1) // slope factor multiplier
    const [priceFrom, setPriceFrom] = useState(30)
    const [priceTo, setPriceTo] = useState(50)
    const [showTotalRevenue, setShowTotalRevenue] = useState(false)
    const [elasticityType, setElasticityType] = useState<ElasticityTab>('ped')
    const [isDragging, setIsDragging] = useState(false)
    const [currentPrice, setCurrentPrice] = useState(40)

    const slope = demandElasticity // direct mapping: 0.3 inelastic, 1 unit, 2 elastic

    const qAtCurrent = getDemandQ(currentPrice, slope)
    const tr = currentPrice * qAtCurrent

    // Point elasticity: PED = |dQ/dP| * (P/Q) = slope * (P/Q)
    const pedAtPoint = qAtCurrent > 0 ? Math.abs(slope * (currentPrice / qAtCurrent)) : Infinity

    // Midpoint method
    const q1 = getDemandQ(priceFrom, slope)
    const q2 = getDemandQ(priceTo, slope)
    const midpointPctQ = (q2 - q1) / ((q1 + q2) / 2)
    const midpointPctP = (priceTo - priceFrom) / ((priceFrom + priceTo) / 2)
    const midpointElasticity = midpointPctP !== 0 ? Math.abs(midpointPctQ / midpointPctP) : 0

    const elasticityLabel = (e: number) => {
        if (e > 1.05) return 'Elastic'
        if (e < 0.95) return 'Inelastic'
        return 'Unit Elastic'
    }

    const applyPreset = useCallback((type: 'elastic' | 'inelastic' | 'unit') => {
        if (type === 'elastic') setDemandElasticity(2)
        else if (type === 'inelastic') setDemandElasticity(0.3)
        else setDemandElasticity(1)
    }, [])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'What is Elasticity?', description: 'Elasticity measures how sensitive quantity demanded is to a change in price. A steeper curve means less responsive (inelastic) demand.', setup: () => { setDemandElasticity(1); setCurrentPrice(40); setShowTotalRevenue(false) } },
        { title: 'Elastic Demand', description: 'When PED > 1, quantity changes by a greater percentage than price. Consumers are very responsive. Think luxury goods.', setup: () => { applyPreset('elastic'); setCurrentPrice(35) } },
        { title: 'Inelastic Demand', description: 'When PED < 1, quantity changes by a smaller percentage than price. Consumers are unresponsive. Think necessities like insulin.', setup: () => { applyPreset('inelastic'); setCurrentPrice(45) } },
        { title: 'Unit Elastic', description: 'When PED = 1, the percentage change in quantity exactly equals the percentage change in price. Total revenue stays constant.', setup: () => { applyPreset('unit'); setCurrentPrice(50) } },
        { title: 'Total Revenue Test', description: 'If demand is elastic, lowering price INCREASES TR. If inelastic, lowering price DECREASES TR. Toggle TR to see the revenue bar.', setup: () => { setShowTotalRevenue(true); setDemandElasticity(1.5); setCurrentPrice(30) } },
        { title: 'Midpoint Method', description: 'The midpoint formula avoids the problem of different elasticities depending on direction. It averages the two endpoints.', setup: () => { setPriceFrom(30); setPriceTo(50); setDemandElasticity(1); setCurrentPrice(40) } },
        { title: 'Other Elasticities', description: 'PES measures supply responsiveness. Cross-price elasticity measures substitutes/complements. Income elasticity distinguishes normal from inferior goods.', setup: () => { setElasticityType('ped'); setDemandElasticity(1) } },
        { title: 'Experiment', description: 'Adjust the slope slider to change elasticity. Drag on the canvas to move along the demand curve. Toggle total revenue to see the TR test.', setup: () => { setDemandElasticity(1); setCurrentPrice(40) } },
    ], [applyPreset])

    const demo = useDemoMode(demoSteps)

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const resize = () => { canvas.width = canvas.offsetWidth * window.devicePixelRatio; canvas.height = canvas.offsetHeight * window.devicePixelRatio; ctx.scale(window.devicePixelRatio, window.devicePixelRatio) }
        resize()
        window.addEventListener('resize', resize)
        const W = canvas.offsetWidth, H = canvas.offsetHeight
        const pad = 70, gW = W - pad * 2 - (showTotalRevenue ? 140 : 0), gH = H - pad * 2 - 30
        ctx.fillStyle = '#1a150a'; ctx.fillRect(0, 0, W, H)

        const maxP = 100, maxQ = 120
        const toX = (q: number) => pad + (q / maxQ) * gW
        const toY = (p: number) => pad + ((maxP - p) / maxP) * gH

        // Grid
        ctx.strokeStyle = 'rgba(220,180,80,0.06)'; ctx.lineWidth = 1
        for (let q = 0; q <= maxQ; q += 20) { ctx.beginPath(); ctx.moveTo(toX(q), toY(maxP)); ctx.lineTo(toX(q), toY(0)); ctx.stroke() }
        for (let p = 0; p <= maxP; p += 20) { ctx.beginPath(); ctx.moveTo(toX(0), toY(p)); ctx.lineTo(toX(maxQ), toY(p)); ctx.stroke() }

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(pad, toY(maxP)); ctx.lineTo(pad, toY(0)); ctx.lineTo(toX(maxQ), toY(0)); ctx.stroke()
        ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('Quantity (Q)', pad + gW / 2, H - 12)
        ctx.save(); ctx.translate(18, pad + gH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Price (P)', 0, 0); ctx.restore()

        // Ticks
        ctx.font = '10px system-ui'; ctx.fillStyle = 'rgba(220,180,80,0.5)'
        for (let q = 20; q <= maxQ; q += 20) { ctx.textAlign = 'center'; ctx.fillText(String(q), toX(q), toY(0) + 14) }
        for (let p = 20; p <= maxP; p += 20) { ctx.textAlign = 'right'; ctx.fillText(String(p), toX(0) - 8, toY(p) + 4) }

        // Revenue rectangle shading
        const qCur = getDemandQ(currentPrice, slope)
        if (qCur > 0) {
            ctx.fillStyle = 'rgba(220,180,80,0.08)'
            ctx.fillRect(toX(0), toY(currentPrice), toX(qCur) - toX(0), toY(0) - toY(currentPrice))
            ctx.strokeStyle = 'rgba(220,180,80,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
            ctx.strokeRect(toX(0), toY(currentPrice), toX(qCur) - toX(0), toY(0) - toY(currentPrice))
            ctx.setLineDash([])
            // TR label inside rectangle
            ctx.fillStyle = 'rgba(220,180,80,0.5)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'
            const rectCx = (toX(0) + toX(qCur)) / 2, rectCy = (toY(currentPrice) + toY(0)) / 2
            ctx.fillText(`TR = ${(currentPrice * qCur).toFixed(0)}`, rectCx, rectCy)
        }

        // Elastic / Inelastic zone markers along demand curve
        ctx.font = '10px system-ui'; ctx.textAlign = 'left'
        const midP = slope > 0 ? (100 / (2 * slope)) : 50 // price where PED = 1 on linear curve: P where slope*(P/Q)=1
        // PED=1 when slope * P / (100 - slope*P) = 1 => P = 100/(2*slope)
        const unitQ = getDemandQ(midP, slope)
        if (midP > 0 && midP < maxP && unitQ > 0) {
            ctx.fillStyle = 'rgba(100,200,150,0.5)'; ctx.font = '9px system-ui'
            ctx.fillText('Elastic (PED>1)', toX(unitQ) - 40, toY(midP) - 25)
            ctx.fillStyle = 'rgba(255,130,100,0.5)'
            ctx.fillText('Inelastic (PED<1)', toX(unitQ) + 5, toY(midP) + 20)
            // unit elastic dot
            ctx.fillStyle = 'rgba(100,200,150,0.8)'; ctx.beginPath(); ctx.arc(toX(unitQ), toY(midP), 4, 0, Math.PI * 2); ctx.fill()
        }

        // Supply curve
        ctx.strokeStyle = 'rgba(100,180,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath()
        for (let p = 0; p <= maxP; p += 1) { const q = getSupplyQ(p); if (q > maxQ) break; if (p === 0) ctx.moveTo(toX(q), toY(p)); else ctx.lineTo(toX(q), toY(p)) }
        ctx.stroke()
        ctx.fillStyle = 'rgba(100,180,255,0.8)'; ctx.font = 'bold 12px system-ui'
        ctx.fillText('S', toX(getSupplyQ(85)), toY(88))

        // Demand curve
        const dGrad = ctx.createLinearGradient(toX(0), toY(maxP), toX(maxQ), toY(0))
        dGrad.addColorStop(0, 'rgba(255,200,80,0.9)'); dGrad.addColorStop(1, 'rgba(220,120,50,0.9)')
        ctx.strokeStyle = dGrad; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath()
        let started = false
        for (let p = maxP; p >= 0; p -= 1) { const q = getDemandQ(p, slope); if (q <= 0 || q > maxQ) continue; if (!started) { ctx.moveTo(toX(q), toY(p)); started = true } else ctx.lineTo(toX(q), toY(p)) }
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,200,80,0.9)'; ctx.font = 'bold 12px system-ui'
        const dLabelP = 15, dLabelQ = getDemandQ(dLabelP, slope)
        if (dLabelQ > 0 && dLabelQ < maxQ) ctx.fillText('D', toX(dLabelQ) + 8, toY(dLabelP))

        // Midpoint markers
        const qFrom = getDemandQ(priceFrom, slope), qTo = getDemandQ(priceTo, slope)
        if (qFrom > 0 && qTo > 0) {
            ctx.fillStyle = 'rgba(150,120,255,0.8)'
            ctx.beginPath(); ctx.arc(toX(qFrom), toY(priceFrom), 5, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.arc(toX(qTo), toY(priceTo), 5, 0, Math.PI * 2); ctx.fill()
            ctx.strokeStyle = 'rgba(150,120,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
            ctx.beginPath(); ctx.moveTo(toX(qFrom), toY(priceFrom)); ctx.lineTo(toX(qTo), toY(priceTo)); ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(150,120,255,0.7)'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('A', toX(qFrom), toY(priceFrom) - 10)
            ctx.fillText('B', toX(qTo), toY(priceTo) - 10)
        }

        // Current point on demand curve
        if (qCur > 0 && qCur < maxQ) {
            const px = toX(qCur), py = toY(currentPrice)
            const glow = ctx.createRadialGradient(px, py, 0, px, py, 22)
            glow.addColorStop(0, 'rgba(220,180,80,0.4)'); glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, py, 22, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill()
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke()
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'
            ctx.fillText(`P=${currentPrice.toFixed(0)} Q=${qCur.toFixed(0)}`, px, py - 15)
            // Dashed lines to axes
            ctx.strokeStyle = 'rgba(220,180,80,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, toY(0)); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(toX(0), py); ctx.stroke()
            ctx.setLineDash([])
        }

        // TR bar chart (right side)
        if (showTotalRevenue) {
            const trX = pad + gW + 40, trW = 80, trH = gH
            ctx.strokeStyle = 'rgba(220,180,80,0.3)'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(trX, pad); ctx.lineTo(trX, pad + trH); ctx.lineTo(trX + trW, pad + trH); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.6)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Total Revenue', trX + trW / 2, pad - 8)

            // Draw TR for several price points
            const maxTR = (() => { let m = 0; for (let p = 5; p <= 95; p += 5) { const t = p * getDemandQ(p, slope); if (t > m) m = t }; return m })()
            const barCount = 10, barW = (trW - 10) / barCount
            for (let i = 0; i < barCount; i++) {
                const p = 10 + i * 8
                const q = getDemandQ(p, slope)
                const t = p * q
                if (t <= 0) continue
                const barH = (t / (maxTR * 1.1)) * trH
                const isActive = Math.abs(p - currentPrice) < 5
                ctx.fillStyle = isActive ? 'rgba(220,180,80,0.7)' : 'rgba(220,180,80,0.2)'
                ctx.fillRect(trX + 5 + i * barW, pad + trH - barH, barW - 2, barH)
            }
            // Current TR marker
            const curTRHeight = maxTR > 0 ? (tr / (maxTR * 1.1)) * trH : 0
            ctx.fillStyle = 'rgba(220,180,80,0.5)'; ctx.font = '9px monospace'; ctx.textAlign = 'center'
            ctx.fillText(`${tr.toFixed(0)}`, trX + trW / 2, pad + trH - curTRHeight - 5)
        }

        return () => window.removeEventListener('resize', resize)
    }, [currentPrice, slope, showTotalRevenue, priceFrom, priceTo])

    // Canvas interaction: drag along demand curve
    const handleCanvasInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const H = canvas.offsetHeight
        const pad = 70, gH = H - pad * 2 - 30
        let clientY: number
        if ('touches' in e) { clientY = e.touches[0].clientY } else { clientY = e.clientY }
        const clickY = clientY - rect.top
        const maxP = 100
        const p = maxP - ((clickY - pad) / gH) * maxP
        const clamped = Math.max(5, Math.min(95, p))
        setCurrentPrice(Math.round(clamped))
    }, [])

    const tabDescriptions: Record<ElasticityTab, string> = {
        ped: 'Price Elasticity of Demand',
        pes: 'Price Elasticity of Supply',
        'cross-price': 'Cross-Price Elasticity',
        income: 'Income Elasticity',
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full cursor-crosshair"
                    onClick={handleCanvasInteraction}
                    onMouseDown={() => setIsDragging(true)} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
                    onMouseMove={e => isDragging && handleCanvasInteraction(e)}
                    onTouchStart={e => { setIsDragging(true); handleCanvasInteraction(e) }}
                    onTouchMove={e => isDragging && handleCanvasInteraction(e)} onTouchEnd={() => setIsDragging(false)}
                />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Elasticity Type">
                            <ButtonGroup value={elasticityType} onChange={v => setElasticityType(v as ElasticityTab)} options={[
                                { value: 'ped', label: 'PED' },
                                { value: 'pes', label: 'PES' },
                                { value: 'cross-price', label: 'XED' },
                                { value: 'income', label: 'YED' },
                            ]} color={GOLD} />
                        </ControlGroup>
                        <Slider label="Demand Slope" value={demandElasticity} onChange={setDemandElasticity} min={0.2} max={3} step={0.1} />
                        <Slider label="Price (from)" value={priceFrom} onChange={v => setPriceFrom(v)} min={5} max={90} step={5} />
                        <Slider label="Price (to)" value={priceTo} onChange={v => setPriceTo(v)} min={10} max={95} step={5} />
                        <Toggle label="Show Total Revenue" value={showTotalRevenue} onChange={setShowTotalRevenue} />
                        <div className="flex gap-2 flex-wrap">
                            <Button onClick={() => applyPreset('elastic')} variant="secondary">Elastic</Button>
                            <Button onClick={() => applyPreset('inelastic')} variant="secondary">Inelastic</Button>
                            <Button onClick={() => applyPreset('unit')} variant="secondary">Unit</Button>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={() => { setDemandElasticity(1); setCurrentPrice(40); setShowTotalRevenue(false); setPriceFrom(30); setPriceTo(50) }} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Microeconomics" unit="Unit 2" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title={tabDescriptions[elasticityType]} items={[
                        { label: 'PED at Point', value: pedAtPoint === Infinity ? '---' : pedAtPoint.toFixed(2), color: pedAtPoint > 1.05 ? 'rgba(100,200,150,1)' : pedAtPoint < 0.95 ? 'rgba(255,130,100,1)' : GOLD },
                        { label: 'Type', value: pedAtPoint === Infinity ? '---' : elasticityLabel(pedAtPoint), color: GOLD },
                        { label: 'Total Revenue', value: `${tr.toFixed(0)}`, color: 'rgba(220,180,80,1)' },
                        { label: 'Midpoint PED', value: midpointElasticity.toFixed(3), color: 'rgba(150,120,255,1)' },
                        { label: 'Price', value: `${currentPrice}`, color: 'rgba(255,255,255,0.8)' },
                        { label: 'Quantity', value: `${qAtCurrent.toFixed(1)}`, color: 'rgba(255,255,255,0.8)' },
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'PED', expression: '|(%\u0394Qd) / (%\u0394P)|', description: 'Price elasticity of demand' },
                        { label: 'Midpoint', expression: '(Q2-Q1)/((Q1+Q2)/2)', description: 'Midpoint method for %\u0394Q' },
                        { label: 'TR Test', expression: 'TR = P \u00d7 Q', description: 'Total revenue test' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
