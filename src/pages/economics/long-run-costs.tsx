import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const GOLD = 'rgb(220, 180, 80)'

// U-shaped cost function for a single SRATC plant centered at (centerQ, minCost)
function sratcCost(q: number, centerQ: number, minCost: number, spread: number): number {
    const t = (q - centerQ) / spread
    return minCost + minCost * 0.6 * t * t
}

// AVC is slightly below ATC (ATC = AVC + AFC, AFC decreases with Q)
function avcCost(q: number, centerQ: number, minCost: number, spread: number): number {
    const atc = sratcCost(q, centerQ, minCost, spread)
    const afc = (minCost * 0.3 * spread) / Math.max(q, 0.5)
    return Math.max(atc - afc, minCost * 0.3)
}

// MC intersects ATC at its minimum - derivative-based
function mcCost(q: number, centerQ: number, minCost: number, spread: number): number {
    const delta = 0.01
    const c1 = sratcCost(q - delta, centerQ, minCost, spread) * (q - delta)
    const c2 = sratcCost(q + delta, centerQ, minCost, spread) * (q + delta)
    return (c2 - c1) / (2 * delta)
}

export default function LongRunCosts() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [numPlants, setNumPlants] = useState(5)
    const [currentOutput, setCurrentOutput] = useState(50)
    const [showMC, setShowMC] = useState(false)
    const [showAVC, setShowAVC] = useState(false)
    const [showProfit, setShowProfit] = useState(false)
    const [priceLevel, setPriceLevel] = useState(12)

    // Generate plant configurations based on numPlants
    const plants = useMemo(() => {
        const pts = []
        const totalQ = 100
        const spacing = totalQ / (numPlants + 1)
        for (let i = 0; i < numPlants; i++) {
            const centerQ = spacing * (i + 1)
            // LRATC is U-shaped: first decreasing (economies), then increasing (diseconomies)
            const mid = (numPlants - 1) / 2
            const distFromMid = (i - mid) / Math.max(mid, 1)
            const minCost = 6 + 4 * distFromMid * distFromMid
            const spread = spacing * 0.8
            pts.push({ centerQ, minCost, spread })
        }
        return pts
    }, [numPlants])

    // Compute LRATC at a given Q (envelope = minimum across all SRATCs)
    const getLRATC = useCallback((q: number) => {
        let minVal = Infinity
        for (const p of plants) {
            const cost = sratcCost(q, p.centerQ, p.minCost, p.spread)
            if (cost < minVal) minVal = cost
        }
        return minVal
    }, [plants])

    // Find which plant is optimal at a given Q
    const getOptimalPlant = useCallback((q: number) => {
        let minVal = Infinity
        let bestIdx = 0
        for (let i = 0; i < plants.length; i++) {
            const cost = sratcCost(q, plants[i].centerQ, plants[i].minCost, plants[i].spread)
            if (cost < minVal) { minVal = cost; bestIdx = i }
        }
        return bestIdx
    }, [plants])

    // Returns to scale classification
    const getReturnsToScale = useCallback((q: number) => {
        const delta = 2
        const left = getLRATC(Math.max(q - delta, 1))
        const right = getLRATC(Math.min(q + delta, 99))
        const slope = right - left
        if (slope < -0.15) return 'Increasing (Economies)'
        if (slope > 0.15) return 'Decreasing (Diseconomies)'
        return 'Constant Returns'
    }, [getLRATC])

    const resetState = useCallback(() => {
        setNumPlants(5); setCurrentOutput(50); setShowMC(false)
        setShowAVC(false); setShowProfit(false); setPriceLevel(12)
    }, [])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'Long-Run Planning', description: 'In the long run, firms can change ALL inputs including plant size. The LRATC shows the lowest cost for each output level.', setup: () => { resetState(); setNumPlants(5) } },
        { title: 'Economies of Scale', description: 'As output increases from zero, LRATC falls. Specialization, bulk purchasing, and spreading fixed costs create economies of scale.', setup: () => { resetState(); setNumPlants(5); setCurrentOutput(20) } },
        { title: 'Constant Returns', description: 'At moderate output, LRATC is relatively flat. Doubling inputs doubles output -- constant returns to scale.', setup: () => { resetState(); setNumPlants(5); setCurrentOutput(50) } },
        { title: 'Diseconomies of Scale', description: 'At very large output, LRATC rises. Coordination problems, bureaucracy, and communication breakdowns increase costs.', setup: () => { resetState(); setNumPlants(5); setCurrentOutput(80) } },
        { title: 'LRATC Shape', description: 'The LRATC is an envelope curve tangent to each SRATC. The firm chooses the optimal plant size for each output level.', setup: () => { resetState(); setNumPlants(7) } },
        { title: 'Shutdown Rule', description: 'A firm shuts down in the short run if Price < min AVC. Toggle AVC to see the shutdown point below the ATC minimum.', setup: () => { resetState(); setShowAVC(true); setShowMC(true); setPriceLevel(5); setCurrentOutput(50) } },
        { title: 'Economic vs Accounting Profit', description: 'Economic profit = TR - TC (including implicit costs). Toggle profit to see the profit/loss rectangle at the current price.', setup: () => { resetState(); setShowProfit(true); setPriceLevel(14); setCurrentOutput(50) } },
        { title: 'Experiment', description: 'Adjust plant count, output level, price, and toggles to explore cost structures. Find the minimum efficient scale!', setup: () => { resetState(); setShowMC(true); setShowAVC(true); setShowProfit(true) } },
    ], [resetState])

    const demo = useDemoMode(demoSteps)

    const currentLRATC = getLRATC(currentOutput)
    const currentPlant = getOptimalPlant(currentOutput)
    const returnsToScale = getReturnsToScale(currentOutput)
    const currentPlantData = plants[currentPlant]
    const currentATCAtOutput = currentPlantData ? sratcCost(currentOutput, currentPlantData.centerQ, currentPlantData.minCost, currentPlantData.spread) : currentLRATC
    const economicProfit = (priceLevel - currentATCAtOutput) * currentOutput
    const shutdownPrice = currentPlantData ? (() => {
        let minAVC = Infinity
        for (let q = 1; q <= 99; q += 0.5) {
            const v = avcCost(q, currentPlantData.centerQ, currentPlantData.minCost, currentPlantData.spread)
            if (v < minAVC) minAVC = v
        }
        return minAVC
    })() : 0

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        const width = canvas.offsetWidth, height = canvas.offsetHeight
        const padding = 80, gW = width - padding * 2, gH = height - padding * 2 - 50
        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, width, height)

        const maxQ = 100, maxC = 25
        const toX = (q: number) => padding + (q / maxQ) * gW
        const toY = (c: number) => height - padding - 50 - (c / maxC) * gH

        // Grid
        ctx.strokeStyle = 'rgba(220,180,80,0.06)'
        ctx.lineWidth = 1
        for (let q = 0; q <= maxQ; q += 10) { ctx.beginPath(); ctx.moveTo(toX(q), toY(0)); ctx.lineTo(toX(q), toY(maxC)); ctx.stroke() }
        for (let c = 0; c <= maxC; c += 5) { ctx.beginPath(); ctx.moveTo(toX(0), toY(c)); ctx.lineTo(toX(maxQ), toY(c)); ctx.stroke() }

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padding, toY(maxC))
        ctx.lineTo(padding, toY(0))
        ctx.lineTo(toX(maxQ), toY(0))
        ctx.stroke()

        // Axis labels
        ctx.fillStyle = 'rgba(220,180,80,0.8)'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Quantity (Q)', padding + gW / 2, height - 20)
        ctx.save()
        ctx.translate(22, height / 2 - 25)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('Cost ($)', 0, 0)
        ctx.restore()

        // Ticks
        ctx.font = '10px system-ui'
        ctx.fillStyle = 'rgba(220,180,80,0.5)'
        for (let q = 10; q <= maxQ; q += 10) { ctx.textAlign = 'center'; ctx.fillText(q.toString(), toX(q), toY(0) + 15) }
        for (let c = 5; c <= maxC; c += 5) { ctx.textAlign = 'right'; ctx.fillText('$' + c, toX(0) - 8, toY(c) + 4) }

        // Region shading for economies/diseconomies
        const lratcPoints: { q: number; c: number }[] = []
        for (let q = 3; q <= 97; q += 0.5) {
            lratcPoints.push({ q, c: getLRATC(q) })
        }

        // Find approximate minimum of LRATC
        let minLRATCVal = Infinity, minLRATCQ = 50
        for (const pt of lratcPoints) {
            if (pt.c < minLRATCVal) { minLRATCVal = pt.c; minLRATCQ = pt.q }
        }

        // Economies region (left of min)
        ctx.fillStyle = 'rgba(80, 200, 120, 0.06)'
        ctx.beginPath()
        ctx.moveTo(toX(3), toY(0))
        for (const pt of lratcPoints) {
            if (pt.q > minLRATCQ - 5) break
            ctx.lineTo(toX(pt.q), toY(pt.c))
        }
        ctx.lineTo(toX(minLRATCQ - 5), toY(0))
        ctx.closePath()
        ctx.fill()

        // Diseconomies region (right of min)
        ctx.fillStyle = 'rgba(255, 100, 100, 0.06)'
        ctx.beginPath()
        ctx.moveTo(toX(minLRATCQ + 5), toY(0))
        for (const pt of lratcPoints) {
            if (pt.q < minLRATCQ + 5) continue
            ctx.lineTo(toX(pt.q), toY(pt.c))
        }
        ctx.lineTo(toX(97), toY(0))
        ctx.closePath()
        ctx.fill()

        // Region labels
        ctx.font = '11px system-ui'
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(80,200,120,0.5)'
        ctx.fillText('Economies', toX(minLRATCQ * 0.35), toY(1.5))
        ctx.fillText('of Scale', toX(minLRATCQ * 0.35), toY(0.5))
        ctx.fillStyle = 'rgba(220,180,80,0.4)'
        ctx.fillText('Constant', toX(minLRATCQ), toY(1.5))
        ctx.fillText('Returns', toX(minLRATCQ), toY(0.5))
        ctx.fillStyle = 'rgba(255,100,100,0.5)'
        ctx.fillText('Diseconomies', toX(minLRATCQ + (100 - minLRATCQ) * 0.55), toY(1.5))
        ctx.fillText('of Scale', toX(minLRATCQ + (100 - minLRATCQ) * 0.55), toY(0.5))

        // Draw SRATC curves
        const sratcColors = [
            'rgba(100,180,255,0.6)', 'rgba(255,150,100,0.6)', 'rgba(150,100,255,0.6)',
            'rgba(100,255,180,0.6)', 'rgba(255,100,150,0.6)', 'rgba(200,200,100,0.6)',
            'rgba(100,200,200,0.6)',
        ]
        for (let i = 0; i < plants.length; i++) {
            const p = plants[i]
            ctx.strokeStyle = sratcColors[i % sratcColors.length]
            ctx.lineWidth = 1.5
            ctx.beginPath()
            let started = false
            for (let q = Math.max(1, p.centerQ - p.spread * 2.2); q <= Math.min(99, p.centerQ + p.spread * 2.2); q += 0.5) {
                const cost = sratcCost(q, p.centerQ, p.minCost, p.spread)
                if (cost > maxC) continue
                if (!started) { ctx.moveTo(toX(q), toY(cost)); started = true }
                else ctx.lineTo(toX(q), toY(cost))
            }
            ctx.stroke()

            // Label
            ctx.fillStyle = sratcColors[i % sratcColors.length]
            ctx.font = '9px system-ui'
            ctx.textAlign = 'center'
            const labelCost = sratcCost(p.centerQ - p.spread * 1.2, p.centerQ, p.minCost, p.spread)
            if (labelCost < maxC) ctx.fillText(`SRATC${i + 1}`, toX(p.centerQ), toY(Math.min(labelCost, maxC - 1)) - 6)
        }

        // Draw AVC for current plant
        if (showAVC && currentPlantData) {
            const p = currentPlantData
            ctx.strokeStyle = 'rgba(255,200,50,0.7)'
            ctx.lineWidth = 1.5
            ctx.setLineDash([4, 3])
            ctx.beginPath()
            let started = false
            for (let q = Math.max(1, p.centerQ - p.spread * 2); q <= Math.min(99, p.centerQ + p.spread * 2); q += 0.5) {
                const cost = avcCost(q, p.centerQ, p.minCost, p.spread)
                if (cost > maxC) continue
                if (!started) { ctx.moveTo(toX(q), toY(cost)); started = true }
                else ctx.lineTo(toX(q), toY(cost))
            }
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,200,50,0.8)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'left'
            const avcLabelQ = p.centerQ + p.spread * 1.5
            const avcLabelC = avcCost(avcLabelQ, p.centerQ, p.minCost, p.spread)
            if (avcLabelC < maxC) ctx.fillText('AVC', toX(avcLabelQ), toY(avcLabelC) - 6)

            // Shutdown point marker (min AVC)
            let minAVCVal = Infinity, minAVCQ = p.centerQ
            for (let q = Math.max(1, p.centerQ - p.spread * 2); q <= Math.min(99, p.centerQ + p.spread * 2); q += 0.5) {
                const v = avcCost(q, p.centerQ, p.minCost, p.spread)
                if (v < minAVCVal) { minAVCVal = v; minAVCQ = q }
            }
            ctx.fillStyle = 'rgba(255,80,80,0.9)'
            ctx.beginPath()
            ctx.arc(toX(minAVCQ), toY(minAVCVal), 5, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = 'rgba(255,80,80,0.8)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Shutdown', toX(minAVCQ), toY(minAVCVal) + 16)
            ctx.fillText(`P < $${minAVCVal.toFixed(1)}`, toX(minAVCQ), toY(minAVCVal) + 28)
        }

        // Draw MC for current plant
        if (showMC && currentPlantData) {
            const p = currentPlantData
            ctx.strokeStyle = 'rgba(255,100,100,0.8)'
            ctx.lineWidth = 2
            ctx.beginPath()
            let started = false
            for (let q = Math.max(2, p.centerQ - p.spread * 1.8); q <= Math.min(98, p.centerQ + p.spread * 1.8); q += 0.5) {
                const cost = mcCost(q, p.centerQ, p.minCost, p.spread)
                if (cost > maxC || cost < 0) continue
                if (!started) { ctx.moveTo(toX(q), toY(cost)); started = true }
                else ctx.lineTo(toX(q), toY(cost))
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255,100,100,0.9)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'left'
            const mcLabelQ = p.centerQ + p.spread * 1.3
            const mcLabelC = mcCost(mcLabelQ, p.centerQ, p.minCost, p.spread)
            if (mcLabelC < maxC && mcLabelC > 0) ctx.fillText('MC', toX(mcLabelQ), toY(mcLabelC) - 6)
        }

        // Draw LRATC envelope
        const lratcGrad = ctx.createLinearGradient(toX(3), 0, toX(97), 0)
        lratcGrad.addColorStop(0, 'rgba(220,180,80,0.9)')
        lratcGrad.addColorStop(0.5, 'rgba(255,220,120,1)')
        lratcGrad.addColorStop(1, 'rgba(220,180,80,0.9)')
        ctx.strokeStyle = lratcGrad
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        let lratcStarted = false
        for (const pt of lratcPoints) {
            if (pt.c > maxC) continue
            if (!lratcStarted) { ctx.moveTo(toX(pt.q), toY(pt.c)); lratcStarted = true }
            else ctx.lineTo(toX(pt.q), toY(pt.c))
        }
        ctx.stroke()

        // LRATC label
        ctx.fillStyle = 'rgba(255,220,120,1)'
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'right'
        const lratcLabelQ = 92
        const lratcLabelC = getLRATC(lratcLabelQ)
        if (lratcLabelC < maxC) ctx.fillText('LRATC', toX(lratcLabelQ), toY(lratcLabelC) - 10)

        // Price line
        if (priceLevel <= maxC) {
            ctx.strokeStyle = 'rgba(100,200,255,0.6)'
            ctx.lineWidth = 1.5
            ctx.setLineDash([6, 4])
            ctx.beginPath()
            ctx.moveTo(toX(0), toY(priceLevel))
            ctx.lineTo(toX(maxQ), toY(priceLevel))
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(100,200,255,0.8)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'right'
            ctx.fillText(`P = $${priceLevel.toFixed(1)}`, toX(maxQ) - 5, toY(priceLevel) - 8)
        }

        // Profit/loss rectangle
        if (showProfit && currentPlantData && priceLevel <= maxC) {
            const profitPerUnit = priceLevel - currentATCAtOutput
            const qx1 = toX(currentOutput * 0.2)
            const qx2 = toX(currentOutput)
            if (profitPerUnit > 0) {
                ctx.fillStyle = 'rgba(80,200,120,0.15)'
                ctx.fillRect(qx1, toY(priceLevel), qx2 - qx1, toY(currentATCAtOutput) - toY(priceLevel))
                ctx.strokeStyle = 'rgba(80,200,120,0.5)'
                ctx.lineWidth = 1
                ctx.strokeRect(qx1, toY(priceLevel), qx2 - qx1, toY(currentATCAtOutput) - toY(priceLevel))
                ctx.fillStyle = 'rgba(80,200,120,0.9)'
                ctx.font = 'bold 11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Economic Profit', (qx1 + qx2) / 2, (toY(priceLevel) + toY(currentATCAtOutput)) / 2 + 4)
            } else if (profitPerUnit < 0) {
                ctx.fillStyle = 'rgba(255,80,80,0.12)'
                ctx.fillRect(qx1, toY(currentATCAtOutput), qx2 - qx1, toY(priceLevel) - toY(currentATCAtOutput))
                ctx.strokeStyle = 'rgba(255,80,80,0.5)'
                ctx.lineWidth = 1
                ctx.strokeRect(qx1, toY(currentATCAtOutput), qx2 - qx1, toY(priceLevel) - toY(currentATCAtOutput))
                ctx.fillStyle = 'rgba(255,80,80,0.9)'
                ctx.font = 'bold 11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Economic Loss', (qx1 + qx2) / 2, (toY(priceLevel) + toY(currentATCAtOutput)) / 2 + 4)
            }
        }

        // Current output indicator
        const curX = toX(currentOutput)
        const curY = toY(currentLRATC)
        ctx.strokeStyle = 'rgba(220,180,80,0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(curX, toY(0)); ctx.lineTo(curX, curY); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(toX(0), curY); ctx.lineTo(curX, curY); ctx.stroke()
        ctx.setLineDash([])

        // Glowing point on LRATC
        const glow = ctx.createRadialGradient(curX, curY, 0, curX, curY, 25)
        glow.addColorStop(0, 'rgba(220,180,80,0.4)')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath(); ctx.arc(curX, curY, 25, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = 'rgba(220,180,80,1)'
        ctx.beginPath(); ctx.arc(curX, curY, 8, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Point label
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.font = 'bold 11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`Q=${currentOutput}, ATC=$${currentLRATC.toFixed(1)}`, curX, curY - 18)

        // Min efficient scale marker
        ctx.fillStyle = 'rgba(220,180,80,0.6)'
        ctx.beginPath()
        ctx.arc(toX(minLRATCQ), toY(minLRATCVal), 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(220,180,80,0.5)'
        ctx.font = '10px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('MES', toX(minLRATCQ), toY(minLRATCVal) - 10)

        return () => window.removeEventListener('resize', resize)
    }, [numPlants, currentOutput, showMC, showAVC, showProfit, priceLevel, plants, getLRATC, currentPlantData, currentATCAtOutput, currentLRATC])

    const profitStatus = economicProfit > 5 ? 'Economic Profit' : economicProfit < -5 ? 'Economic Loss' : 'Normal Profit (zero)'

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <Slider label="Number of Plants" value={numPlants} onChange={setNumPlants} min={3} max={7} step={1} />
                        <Slider label="Current Output (Q)" value={currentOutput} onChange={setCurrentOutput} min={5} max={95} step={1} />
                        <Slider label="Market Price ($)" value={priceLevel} onChange={setPriceLevel} min={2} max={22} step={0.5} />
                        <Toggle label="Show MC" value={showMC} onChange={setShowMC} />
                        <Toggle label="Show AVC" value={showAVC} onChange={setShowAVC} />
                        <Toggle label="Show Profit" value={showProfit} onChange={setShowProfit} />
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={resetState} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Microeconomics" unit="Unit 3" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title="Cost Analysis" items={[
                        { label: 'Current Scale', value: `Plant ${currentPlant + 1} of ${numPlants}`, color: GOLD },
                        { label: 'LRATC at Q', value: `$${currentLRATC.toFixed(2)}`, color: 'rgba(255,220,120,1)' },
                        { label: 'Returns to Scale', value: returnsToScale, color: returnsToScale.includes('Increasing') ? 'rgba(80,200,120,1)' : returnsToScale.includes('Decreasing') ? 'rgba(255,100,100,1)' : GOLD },
                        { label: 'Market Price', value: `$${priceLevel.toFixed(1)}`, color: 'rgba(100,200,255,1)' },
                        { label: 'Economic Profit', value: `$${economicProfit.toFixed(0)}`, color: economicProfit >= 0 ? 'rgba(80,200,120,1)' : 'rgba(255,100,100,1)' },
                        { label: 'Profit Status', value: profitStatus, color: economicProfit > 5 ? 'rgba(80,200,120,1)' : economicProfit < -5 ? 'rgba(255,100,100,1)' : 'rgba(220,180,80,1)' },
                        { label: 'Shutdown Price', value: `$${shutdownPrice.toFixed(1)}`, color: 'rgba(255,80,80,1)' },
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'LRATC', expression: 'Envelope of SRATCs', description: 'Long-run planning curve' },
                        { label: 'Shutdown', expression: 'P < min AVC', description: 'Short-run shutdown rule' },
                        { label: 'Econ. Profit', expression: 'TR - TC (explicit + implicit)', description: 'Zero in long-run equilibrium' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
