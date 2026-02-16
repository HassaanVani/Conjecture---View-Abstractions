import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type ExternalityType = 'negative' | 'positive'

const GOLD = 'rgb(220, 180, 80)'

export default function Externalities() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [type, setType] = useState<ExternalityType>('negative')
    const [externalitySize, setExternalitySize] = useState(20)
    const [showCorrection, setShowCorrection] = useState(false)
    const [correctionAmount, setCorrectionAmount] = useState(0)

    useEffect(() => {
        if (showCorrection) setCorrectionAmount(externalitySize)
    }, [showCorrection, externalitySize])

    const calculations = useCallback(() => {
        const demandIntercept = 90
        const demandSlope = -0.8
        const supplyIntercept = 10
        const supplySlope = 0.6
        const getDemandP = (q: number) => demandIntercept + demandSlope * q
        const getSupplyP = (q: number) => supplyIntercept + supplySlope * q
        const getMSC = (q: number) => getSupplyP(q) + (type === 'negative' ? externalitySize : 0)
        const getMSB = (q: number) => getDemandP(q) + (type === 'positive' ? externalitySize : 0)
        const qMarket = (demandIntercept - supplyIntercept) / (supplySlope - demandSlope)
        const pMarket = getDemandP(qMarket)
        let qOptimal: number
        if (type === 'negative') qOptimal = (demandIntercept - supplyIntercept - externalitySize) / (supplySlope - demandSlope)
        else qOptimal = (demandIntercept + externalitySize - supplyIntercept) / (supplySlope - demandSlope)
        let qCorrected: number
        if (type === 'negative') qCorrected = (demandIntercept - (supplyIntercept + correctionAmount)) / (supplySlope - demandSlope)
        else qCorrected = (demandIntercept - (supplyIntercept - correctionAmount)) / (supplySlope - demandSlope)
        const dwl = 0.5 * Math.abs(qMarket - qOptimal) * externalitySize
        return { qMarket, pMarket, qOptimal, qCorrected, dwl, getDemandP, getSupplyP, getMSC, getMSB, supplyIntercept, supplySlope }
    }, [type, externalitySize, correctionAmount])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'What Are Externalities?', description: 'Externalities are costs or benefits that affect third parties not involved in a transaction. They cause markets to produce the "wrong" amount.', setup: () => { setType('negative'); setShowCorrection(false) } },
        { title: 'Negative Externalities', description: 'Negative externalities impose costs on others (pollution, noise). MSC > MPC. Markets OVERPRODUCE.', setup: () => { setType('negative'); setShowCorrection(false); setExternalitySize(20) } },
        { title: 'Positive Externalities', description: 'Positive externalities create benefits for others (education, vaccines). MSB > MPB. Markets UNDERPRODUCE.', setup: () => { setType('positive'); setShowCorrection(false); setExternalitySize(20) } },
        { title: 'Deadweight Loss', description: 'The shaded triangle shows DWL -- value destroyed by producing the wrong quantity.', setup: () => { setType('negative'); setShowCorrection(false) } },
        { title: 'Pigouvian Tax', description: 'A Pigouvian tax on negative externalities can restore efficiency. The optimal tax equals the externality size.', setup: () => { setType('negative'); setShowCorrection(true) } },
        { title: 'Pigouvian Subsidy', description: 'A subsidy for positive externalities encourages more production to reach the socially optimal quantity.', setup: () => { setType('positive'); setShowCorrection(true) } },
        { title: 'Coase Theorem', description: 'If property rights are well-defined and transaction costs are low, private bargaining can solve externalities without government intervention.', setup: () => { setType('negative'); setShowCorrection(false) } },
        { title: 'Try It Yourself', description: 'Adjust the externality size and correction amount. Can you eliminate the deadweight loss?', setup: () => { setShowCorrection(true) } },
    ], [])

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const resize = () => { canvas.width = canvas.offsetWidth * window.devicePixelRatio; canvas.height = canvas.offsetHeight * window.devicePixelRatio; ctx.scale(window.devicePixelRatio, window.devicePixelRatio) }
        resize()
        window.addEventListener('resize', resize)
        const width = canvas.offsetWidth
        const height = canvas.offsetHeight
        const padding = 80
        const graphWidth = width - padding * 2
        const graphHeight = height - padding * 2 - 50
        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, width, height)
        const maxQ = 100, maxP = 100
        const toCanvasX = (q: number) => padding + (q / maxQ) * graphWidth
        const toCanvasY = (p: number) => height - padding - 50 - (p / maxP) * graphHeight
        const { qMarket, qOptimal, qCorrected, getDemandP, getSupplyP, getMSC, getMSB, supplyIntercept, supplySlope } = calculations()

        // Grid
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.06)'; ctx.lineWidth = 1
        for (let i = 0; i <= maxQ; i += 20) { ctx.beginPath(); ctx.moveTo(toCanvasX(i), toCanvasY(0)); ctx.lineTo(toCanvasX(i), toCanvasY(maxP)); ctx.stroke() }
        for (let i = 0; i <= maxP; i += 20) { ctx.beginPath(); ctx.moveTo(toCanvasX(0), toCanvasY(i)); ctx.lineTo(toCanvasX(maxQ), toCanvasY(i)); ctx.stroke() }

        // Axes
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(padding, toCanvasY(maxP)); ctx.lineTo(padding, toCanvasY(0)); ctx.lineTo(toCanvasX(maxQ), toCanvasY(0)); ctx.stroke()
        ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'; ctx.font = '14px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('Quantity', padding + graphWidth / 2, height - 20)
        ctx.save(); ctx.translate(22, height / 2 - 25); ctx.rotate(-Math.PI / 2); ctx.fillText('Price / Cost', 0, 0); ctx.restore()

        // DWL area
        const dwlColor = type === 'negative' ? 'rgba(255, 100, 100, 0.25)' : 'rgba(100, 200, 150, 0.25)'
        ctx.fillStyle = dwlColor; ctx.beginPath()
        if (type === 'negative') {
            ctx.moveTo(toCanvasX(qOptimal), toCanvasY(getMSC(qOptimal)))
            for (let q = qOptimal; q <= qMarket; q += 0.5) ctx.lineTo(toCanvasX(q), toCanvasY(getMSC(q)))
            for (let q = qMarket; q >= qOptimal; q -= 0.5) ctx.lineTo(toCanvasX(q), toCanvasY(getDemandP(q)))
        } else {
            ctx.moveTo(toCanvasX(qMarket), toCanvasY(getSupplyP(qMarket)))
            for (let q = qMarket; q <= qOptimal; q += 0.5) ctx.lineTo(toCanvasX(q), toCanvasY(getSupplyP(q)))
            for (let q = qOptimal; q >= qMarket; q -= 0.5) ctx.lineTo(toCanvasX(q), toCanvasY(getMSB(q)))
        }
        ctx.closePath(); ctx.fill()

        // Demand (MPB)
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath()
        for (let q = 0; q <= maxQ; q += 1) { const p = getDemandP(q); if (p < 0 || p > maxP) continue; if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p)); else ctx.lineTo(toCanvasX(q), toCanvasY(p)) }
        ctx.stroke()
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left'
        ctx.fillText('D (MPB)', toCanvasX(75), toCanvasY(getDemandP(75)) - 10)

        // Supply (MPC)
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.9)'; ctx.lineWidth = 3; ctx.beginPath()
        for (let q = 0; q <= maxQ; q += 1) { const p = getSupplyP(q); if (p < 0 || p > maxP) continue; if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p)); else ctx.lineTo(toCanvasX(q), toCanvasY(p)) }
        ctx.stroke()
        ctx.fillStyle = 'rgba(100, 150, 255, 0.9)'; ctx.fillText('S (MPC)', toCanvasX(75), toCanvasY(getSupplyP(75)) + 18)

        // MSC or MSB
        if (type === 'negative') {
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.9)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 1) { const p = getMSC(q); if (p < 0 || p > maxP) continue; if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p)); else ctx.lineTo(toCanvasX(q), toCanvasY(p)) }
            ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255, 200, 100, 0.9)'; ctx.fillText('MSC', toCanvasX(60), toCanvasY(getMSC(60)) + 18)
        } else {
            ctx.strokeStyle = 'rgba(100, 255, 150, 0.9)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 1) { const p = getMSB(q); if (p < 0 || p > maxP) continue; if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p)); else ctx.lineTo(toCanvasX(q), toCanvasY(p)) }
            ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(100, 255, 150, 0.9)'; ctx.fillText('MSB', toCanvasX(60), toCanvasY(getMSB(60)) - 10)
        }

        // Corrected supply
        if (showCorrection && correctionAmount > 0) {
            const correctedIntercept = type === 'negative' ? supplyIntercept + correctionAmount : supplyIntercept - correctionAmount
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.7)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 1) { const p = correctedIntercept + supplySlope * q; if (p < 0 || p > maxP) continue; if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p)); else ctx.lineTo(toCanvasX(q), toCanvasY(p)) }
            ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.fillText(type === 'negative' ? 'S + Tax' : 'S - Subsidy', toCanvasX(50), toCanvasY(correctedIntercept + supplySlope * 50) + 18)
            if (qCorrected > 0 && qCorrected < maxQ) {
                ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
                ctx.beginPath(); ctx.moveTo(toCanvasX(qCorrected), toCanvasY(0)); ctx.lineTo(toCanvasX(qCorrected), toCanvasY(getDemandP(qCorrected))); ctx.stroke(); ctx.setLineDash([])
                ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'; ctx.font = '11px monospace'; ctx.textAlign = 'center'
                ctx.fillText(`Q' = ${qCorrected.toFixed(0)}`, toCanvasX(qCorrected), toCanvasY(0) + 15)
            }
        }

        // Market eq point
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.beginPath(); ctx.arc(toCanvasX(qMarket), toCanvasY(getDemandP(qMarket)), 6, 0, Math.PI * 2); ctx.fill()
        ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Qm', toCanvasX(qMarket), toCanvasY(0) + 15)

        // Social optimum
        const optimalP = type === 'negative' ? getDemandP(qOptimal) : getSupplyP(qOptimal)
        ctx.fillStyle = 'rgba(80, 200, 120, 0.9)'; ctx.beginPath(); ctx.arc(toCanvasX(qOptimal), toCanvasY(optimalP), 6, 0, Math.PI * 2); ctx.fill()
        ctx.fillText('Q*', toCanvasX(qOptimal), toCanvasY(0) + 28)

        return () => window.removeEventListener('resize', resize)
    }, [type, externalitySize, showCorrection, correctionAmount, calculations])

    const { dwl, qMarket, qOptimal } = calculations()
    const gap = Math.abs(qMarket - qOptimal)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Externality Type">
                            <ButtonGroup value={type} onChange={v => setType(v as ExternalityType)} options={[{ value: 'negative', label: 'Negative' }, { value: 'positive', label: 'Positive' }]} color={GOLD} />
                        </ControlGroup>
                        <Slider label="Externality Size" value={externalitySize} onChange={setExternalitySize} min={5} max={40} />
                        <Toggle label={type === 'negative' ? 'Show Tax' : 'Show Subsidy'} value={showCorrection} onChange={setShowCorrection} />
                        {showCorrection && <Slider label={type === 'negative' ? 'Tax Amount' : 'Subsidy Amount'} value={correctionAmount} onChange={setCorrectionAmount} min={0} max={50} />}
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={() => { setExternalitySize(20); setCorrectionAmount(0); setShowCorrection(false) }} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Microeconomics" unit="Unit 6" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title={type === 'negative' ? 'Negative Externality' : 'Positive Externality'} items={[
                        { label: type === 'negative' ? 'Overproduction' : 'Underproduction', value: `${gap.toFixed(1)} units` },
                        { label: 'Deadweight Loss', value: `$${dwl.toFixed(0)}`, color: 'rgba(255, 150, 100, 1)' },
                        ...(showCorrection ? [{ label: 'Correction Status', value: Math.abs(correctionAmount - externalitySize) < 1 ? 'Optimal!' : 'Adjusting...', color: Math.abs(correctionAmount - externalitySize) < 1 ? 'rgba(80, 200, 120, 1)' : GOLD }] : []),
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'Neg', expression: 'MSC = MPC + External Cost', description: 'Social cost exceeds private cost' },
                        { label: 'Pos', expression: 'MSB = MPB + External Benefit', description: 'Social benefit exceeds private benefit' },
                        { label: 'Tax', expression: 'Tax* = Externality Size', description: 'Pigouvian correction' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
