import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ControlType = 'none' | 'ceiling' | 'floor' | 'tax' | 'subsidy'

interface DeterminantInfo {
    name: string
    effect: 'increase' | 'decrease'
    example: string
}

const demandDeterminants: DeterminantInfo[] = [
    { name: 'Income (normal good)', effect: 'increase', example: 'Higher wages → more restaurant meals' },
    { name: 'Income (inferior good)', effect: 'decrease', example: 'Higher wages → less ramen noodles' },
    { name: 'Price of substitutes ↑', effect: 'increase', example: 'Pepsi price ↑ → more Coke demand' },
    { name: 'Price of complements ↑', effect: 'decrease', example: 'Gas price ↑ → less SUV demand' },
    { name: 'Consumer expectations', effect: 'increase', example: 'Expected price ↑ → buy now' },
    { name: 'Number of buyers', effect: 'increase', example: 'Population growth → more housing demand' },
    { name: 'Tastes/preferences', effect: 'increase', example: 'Health trend → more organic food' },
]

const supplyDeterminants: DeterminantInfo[] = [
    { name: 'Input prices ↓', effect: 'increase', example: 'Cheaper steel → more cars produced' },
    { name: 'Technology improvement', effect: 'increase', example: 'AI → more efficient production' },
    { name: 'Subsidies', effect: 'increase', example: 'Farm subsidies → more corn supply' },
    { name: 'Taxes/regulations', effect: 'decrease', example: 'Carbon tax → less oil supply' },
    { name: 'Number of sellers', effect: 'increase', example: 'New entrants → more supply' },
    { name: 'Producer expectations', effect: 'decrease', example: 'Expected price ↑ → hoard now' },
]

interface DemoStep {
    title: string
    description: string
    action: () => void
}

export default function SupplyDemand() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Curve parameters
    const [demandIntercept] = useState(100)
    const [demandSlope, setDemandSlope] = useState(-0.8)
    const [supplyIntercept] = useState(10)
    const [supplySlope, setSupplySlope] = useState(0.7)

    // Price controls
    const [controlType, setControlType] = useState<ControlType>('none')
    const [controlPrice, setControlPrice] = useState(40)
    const [taxAmount, setTaxAmount] = useState(15)
    const [subsidyAmount, setSubsidyAmount] = useState(15)

    // Shift factors
    const [demandShift, setDemandShift] = useState(0)
    const [supplyShift, setSupplyShift] = useState(0)

    // Shift reason display
    const [shiftReason, setShiftReason] = useState<{ type: 'demand' | 'supply', info: DeterminantInfo } | null>(null)

    // UI state
    const [showDemo, setShowDemo] = useState(false)
    const [demoStep, setDemoStep] = useState(0)
    const [showDeterminants, setShowDeterminants] = useState(false)

    // Calculate equilibrium
    const calculateEquilibrium = useCallback(() => {
        const adjDemandIntercept = demandIntercept + demandShift
        const adjSupplyIntercept = supplyIntercept + supplyShift

        const Q = (adjDemandIntercept - adjSupplyIntercept) / (supplySlope - demandSlope)
        const P = adjDemandIntercept + demandSlope * Q
        return { Q: Math.max(0, Q), P: Math.max(0, P) }
    }, [demandIntercept, demandSlope, supplyIntercept, supplySlope, demandShift, supplyShift])

    // Calculate quantity demanded/supplied at a given price
    const getQd = useCallback((P: number) => {
        const adjDemandIntercept = demandIntercept + demandShift
        return (P - adjDemandIntercept) / demandSlope
    }, [demandIntercept, demandSlope, demandShift])

    const getQs = useCallback((P: number) => {
        const adjSupplyIntercept = supplyIntercept + supplyShift
        return (P - adjSupplyIntercept) / supplySlope
    }, [supplyIntercept, supplySlope, supplyShift])

    // Calculate elasticity (point elasticity at equilibrium)
    const getElasticity = useCallback(() => {
        const eq = calculateEquilibrium()
        if (eq.Q === 0 || eq.P === 0) return { demand: 0, supply: 0 }

        const demandElasticity = Math.abs((1 / demandSlope) * (eq.P / eq.Q))
        const supplyElasticity = (1 / supplySlope) * (eq.P / eq.Q)

        return {
            demand: demandElasticity,
            supply: supplyElasticity,
        }
    }, [calculateEquilibrium, demandSlope, supplySlope])

    // Calculate surplus values
    const getSurplusValues = useCallback(() => {
        const eq = calculateEquilibrium()
        const adjDemandIntercept = demandIntercept + demandShift
        const adjSupplyIntercept = supplyIntercept + supplyShift

        // Consumer surplus = 0.5 * Q * (max willingness - equilibrium price)
        const maxWillingness = adjDemandIntercept
        const consumerSurplus = 0.5 * eq.Q * (maxWillingness - eq.P)

        // Producer surplus = 0.5 * Q * (equilibrium price - min acceptable)
        const minAcceptable = adjSupplyIntercept
        const producerSurplus = 0.5 * eq.Q * (eq.P - minAcceptable)

        const totalSurplus = consumerSurplus + producerSurplus

        return { consumerSurplus, producerSurplus, totalSurplus }
    }, [calculateEquilibrium, demandIntercept, supplyIntercept, demandShift, supplyShift])

    // Apply a determinant shift
    const applyDeterminant = (type: 'demand' | 'supply', info: DeterminantInfo) => {
        const shift = info.effect === 'increase' ? 15 : -15
        if (type === 'demand') {
            setDemandShift(shift)
            setSupplyShift(0)
        } else {
            setSupplyShift(shift)
            setDemandShift(0)
        }
        setShiftReason({ type, info })
        setShowDeterminants(false)
    }

    // Demo steps
    const demoSteps: DemoStep[] = [
        {
            title: 'The Law of Demand',
            description: 'Holding all else constant (ceteris paribus), as price FALLS, quantity demanded RISES. This creates the downward-sloping demand curve.',
            action: () => { setControlType('none'); setDemandShift(0); setSupplyShift(0); setShiftReason(null) },
        },
        {
            title: 'The Law of Supply',
            description: 'Holding all else constant, as price RISES, quantity supplied RISES. Producers are willing to make more at higher prices. This creates the upward-sloping supply curve.',
            action: () => { setControlType('none') },
        },
        {
            title: 'Market Equilibrium',
            description: 'Where supply meets demand is equilibrium. At this price, Qs = Qd. The market "clears" — no shortage, no surplus. This is the efficient outcome.',
            action: () => { setControlType('none') },
        },
        {
            title: 'Consumer & Producer Surplus',
            description: 'Consumer surplus (green) = value to buyers above what they paid. Producer surplus (blue) = revenue above minimum acceptable. Together = total welfare gains from trade.',
            action: () => { setControlType('none') },
        },
        {
            title: 'Change in Quantity vs Change in Demand',
            description: 'MOVEMENT ALONG curve = change in Qs or Qd (caused by price change). SHIFT of entire curve = change in S or D (caused by non-price determinants like income, preferences).',
            action: () => { setDemandShift(20); setSupplyShift(0); setShiftReason({ type: 'demand', info: demandDeterminants[0] }) },
        },
        {
            title: 'Price Ceiling (Maximum Price)',
            description: 'Government sets MAXIMUM price below equilibrium. Creates SHORTAGE — Qd > Qs. Examples: rent control, gas price caps during crisis. Creates deadweight loss.',
            action: () => { setControlType('ceiling'); setControlPrice(35); setShiftReason(null) },
        },
        {
            title: 'Price Floor (Minimum Price)',
            description: 'Government sets MINIMUM price above equilibrium. Creates SURPLUS — Qs > Qd. Examples: minimum wage, agricultural price supports. Creates deadweight loss.',
            action: () => { setControlType('floor'); setControlPrice(60) },
        },
        {
            title: 'Per-Unit Tax',
            description: 'Tax creates a "wedge" between buyer price and seller price. Tax burden (incidence) depends on elasticity — the MORE INELASTIC side bears MORE tax. Creates deadweight loss.',
            action: () => { setControlType('tax'); setTaxAmount(20) },
        },
        {
            title: 'Subsidy',
            description: 'A subsidy is the opposite of a tax — government pays part of the cost. It increases quantity traded but can create inefficiency if market wasn\'t failing.',
            action: () => { setControlType('subsidy'); setSubsidyAmount(15) },
        },
        {
            title: 'Elasticity & Tax Incidence',
            description: 'Elastic demand = buyers sensitive to price (horizontal). Inelastic = less sensitive (vertical). Try adjusting slopes to see how tax burden shifts!',
            action: () => { setControlType('tax'); setTaxAmount(15); setDemandSlope(-0.4) },
        },
    ]

    useEffect(() => {
        if (showDemo && demoSteps[demoStep]) {
            demoSteps[demoStep].action()
        }
    }, [showDemo, demoStep])

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

        const width = canvas.offsetWidth
        const height = canvas.offsetHeight
        const padding = 70
        const graphWidth = width - padding * 2
        const graphHeight = height - padding * 2 - 50

        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, width, height)

        const maxQ = 120
        const maxP = 120
        const scaleX = graphWidth / maxQ
        const scaleY = graphHeight / maxP

        const toCanvasX = (q: number) => padding + q * scaleX
        const toCanvasY = (p: number) => height - padding - 50 - p * scaleY

        // Grid
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.06)'
        ctx.lineWidth = 1
        for (let q = 0; q <= maxQ; q += 20) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(q), toCanvasY(0))
            ctx.lineTo(toCanvasX(q), toCanvasY(maxP))
            ctx.stroke()
        }
        for (let p = 0; p <= maxP; p += 20) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), toCanvasY(p))
            ctx.lineTo(toCanvasX(maxQ), toCanvasY(p))
            ctx.stroke()
        }

        // Axes
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padding, toCanvasY(maxP))
        ctx.lineTo(padding, toCanvasY(0))
        ctx.lineTo(toCanvasX(maxQ), toCanvasY(0))
        ctx.stroke()

        // Axis labels
        ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Quantity (Q)', padding + graphWidth / 2, height - 20)

        ctx.save()
        ctx.translate(22, height / 2 - 25)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('Price (P)', 0, 0)
        ctx.restore()

        // Axis ticks
        ctx.fillStyle = 'rgba(220, 180, 80, 0.5)'
        ctx.font = '10px system-ui'
        for (let q = 20; q <= maxQ; q += 20) {
            ctx.textAlign = 'center'
            ctx.fillText(q.toString(), toCanvasX(q), toCanvasY(0) + 15)
        }
        for (let p = 20; p <= maxP; p += 20) {
            ctx.textAlign = 'right'
            ctx.fillText('$' + p.toString(), toCanvasX(0) - 8, toCanvasY(p) + 4)
        }

        const eq = calculateEquilibrium()
        const adjDemandIntercept = demandIntercept + demandShift
        const adjSupplyIntercept = supplyIntercept + supplyShift

        // Helper to get demand price for quantity
        const getDemandP = (q: number) => adjDemandIntercept + demandSlope * q
        // Helper to get supply price for quantity
        const getSupplyP = (q: number) => adjSupplyIntercept + supplySlope * q

        // Draw surplus areas (when no controls)
        if (controlType === 'none' && eq.Q > 0 && eq.P > 0) {
            // Consumer surplus
            ctx.fillStyle = 'rgba(80, 200, 120, 0.15)'
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), toCanvasY(eq.P))
            ctx.lineTo(toCanvasX(eq.Q), toCanvasY(eq.P))
            ctx.lineTo(toCanvasX(0), toCanvasY(Math.min(adjDemandIntercept, maxP)))
            ctx.closePath()
            ctx.fill()

            // Producer surplus
            ctx.fillStyle = 'rgba(100, 150, 255, 0.15)'
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), toCanvasY(eq.P))
            ctx.lineTo(toCanvasX(eq.Q), toCanvasY(eq.P))
            ctx.lineTo(toCanvasX(0), toCanvasY(Math.max(adjSupplyIntercept, 0)))
            ctx.closePath()
            ctx.fill()
        }

        // Draw price control effects
        if (controlType === 'ceiling' && controlPrice < eq.P) {
            const qd = getQd(controlPrice)
            const qs = getQs(controlPrice)
            const shortage = qd - qs

            // Shortage area
            ctx.fillStyle = 'rgba(255, 100, 100, 0.2)'
            ctx.fillRect(toCanvasX(qs), toCanvasY(controlPrice + 5), toCanvasX(qd) - toCanvasX(qs), 10)

            // Deadweight loss triangle
            ctx.fillStyle = 'rgba(255, 100, 100, 0.3)'
            ctx.beginPath()
            ctx.moveTo(toCanvasX(qs), toCanvasY(getSupplyP(qs)))
            ctx.lineTo(toCanvasX(eq.Q), toCanvasY(eq.P))
            ctx.lineTo(toCanvasX(qs), toCanvasY(getDemandP(qs)))
            ctx.closePath()
            ctx.fill()

            // Price ceiling line
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)'
            ctx.lineWidth = 2
            ctx.setLineDash([8, 4])
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), toCanvasY(controlPrice))
            ctx.lineTo(toCanvasX(maxQ), toCanvasY(controlPrice))
            ctx.stroke()
            ctx.setLineDash([])

            // Labels
            ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
            ctx.font = 'bold 12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`SHORTAGE: ${shortage.toFixed(0)} units`, toCanvasX((qs + qd) / 2), toCanvasY(controlPrice) - 15)
            ctx.fillText('Price Ceiling', toCanvasX(maxQ) - 50, toCanvasY(controlPrice) - 8)

            // DWL label
            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
            ctx.font = '10px system-ui'
            ctx.fillText('DWL', toCanvasX(qs) + 20, toCanvasY((getSupplyP(qs) + getDemandP(qs)) / 2))
        }

        if (controlType === 'floor' && controlPrice > eq.P) {
            const qd = getQd(controlPrice)
            const qs = getQs(controlPrice)
            const surplus = qs - qd

            // Surplus area
            ctx.fillStyle = 'rgba(100, 150, 255, 0.2)'
            ctx.fillRect(toCanvasX(qd), toCanvasY(controlPrice + 5), toCanvasX(qs) - toCanvasX(qd), 10)

            // Deadweight loss triangle
            ctx.fillStyle = 'rgba(255, 100, 100, 0.3)'
            ctx.beginPath()
            ctx.moveTo(toCanvasX(qd), toCanvasY(getDemandP(qd)))
            ctx.lineTo(toCanvasX(eq.Q), toCanvasY(eq.P))
            ctx.lineTo(toCanvasX(qd), toCanvasY(getSupplyP(qd)))
            ctx.closePath()
            ctx.fill()

            // Price floor line
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.8)'
            ctx.lineWidth = 2
            ctx.setLineDash([8, 4])
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), toCanvasY(controlPrice))
            ctx.lineTo(toCanvasX(maxQ), toCanvasY(controlPrice))
            ctx.stroke()
            ctx.setLineDash([])

            // Labels
            ctx.fillStyle = 'rgba(100, 150, 255, 0.9)'
            ctx.font = 'bold 12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`SURPLUS: ${surplus.toFixed(0)} units`, toCanvasX((qs + qd) / 2), toCanvasY(controlPrice) + 25)
            ctx.fillText('Price Floor', toCanvasX(maxQ) - 50, toCanvasY(controlPrice) + 15)

            // DWL label
            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
            ctx.font = '10px system-ui'
            ctx.fillText('DWL', toCanvasX(qd) + 20, toCanvasY((getSupplyP(qd) + getDemandP(qd)) / 2))
        }

        if (controlType === 'tax') {
            // With tax, supply shifts up by tax amount
            const taxedSupplyIntercept = adjSupplyIntercept + taxAmount
            const newEqQ = (adjDemandIntercept - taxedSupplyIntercept) / (supplySlope - demandSlope)
            const buyerP = getDemandP(newEqQ)
            const sellerP = buyerP - taxAmount

            // Tax wedge area
            ctx.fillStyle = 'rgba(220, 180, 80, 0.2)'
            ctx.beginPath()
            ctx.moveTo(toCanvasX(newEqQ), toCanvasY(buyerP))
            ctx.lineTo(toCanvasX(newEqQ), toCanvasY(sellerP))
            ctx.lineTo(toCanvasX(newEqQ + 8), toCanvasY(sellerP))
            ctx.lineTo(toCanvasX(newEqQ + 8), toCanvasY(buyerP))
            ctx.closePath()
            ctx.fill()

            // Draw taxed supply curve
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)'
            ctx.lineWidth = 2
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 2) {
                const p = taxedSupplyIntercept + supplySlope * q
                if (p < 0 || p > maxP) continue
                if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p))
                else ctx.lineTo(toCanvasX(q), toCanvasY(p))
            }
            ctx.stroke()
            ctx.setLineDash([])

            // Price labels
            ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText(`Buyer pays: $${buyerP.toFixed(0)}`, toCanvasX(newEqQ) + 15, toCanvasY(buyerP))

            ctx.fillStyle = 'rgba(100, 150, 255, 0.9)'
            ctx.fillText(`Seller gets: $${sellerP.toFixed(0)}`, toCanvasX(newEqQ) + 15, toCanvasY(sellerP))

            ctx.fillStyle = 'rgba(220, 180, 80, 0.9)'
            ctx.font = 'bold 11px system-ui'
            ctx.fillText(`Tax: $${taxAmount}`, toCanvasX(newEqQ) + 15, toCanvasY((buyerP + sellerP) / 2))

            // Calculate tax incidence
            const buyerBurden = buyerP - eq.P
            const sellerBurden = eq.P - sellerP
            const buyerPercent = (buyerBurden / taxAmount * 100).toFixed(0)
            const sellerPercent = (sellerBurden / taxAmount * 100).toFixed(0)

            // Tax revenue
            const taxRevenue = taxAmount * newEqQ
            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.font = '12px system-ui'
            ctx.textAlign = 'right'
            ctx.fillText(`Tax Revenue: $${taxRevenue.toFixed(0)}`, width - padding, 30)
            ctx.fillText(`Buyer burden: ${buyerPercent}% | Seller: ${sellerPercent}%`, width - padding, 48)

            // Deadweight loss triangle
            ctx.fillStyle = 'rgba(255, 100, 100, 0.3)'
            ctx.beginPath()
            ctx.moveTo(toCanvasX(newEqQ), toCanvasY(buyerP))
            ctx.lineTo(toCanvasX(eq.Q), toCanvasY(eq.P))
            ctx.lineTo(toCanvasX(newEqQ), toCanvasY(sellerP))
            ctx.closePath()
            ctx.fill()

            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('DWL', toCanvasX((newEqQ + eq.Q) / 2), toCanvasY(eq.P))
        }

        if (controlType === 'subsidy') {
            // With subsidy, supply shifts down by subsidy amount
            const subsidizedSupplyIntercept = adjSupplyIntercept - subsidyAmount
            const newEqQ = (adjDemandIntercept - subsidizedSupplyIntercept) / (supplySlope - demandSlope)
            const buyerP = getDemandP(newEqQ)
            const sellerP = buyerP + subsidyAmount

            // Subsidy wedge area
            ctx.fillStyle = 'rgba(100, 200, 150, 0.2)'
            ctx.beginPath()
            ctx.moveTo(toCanvasX(newEqQ), toCanvasY(buyerP))
            ctx.lineTo(toCanvasX(newEqQ), toCanvasY(sellerP))
            ctx.lineTo(toCanvasX(newEqQ + 8), toCanvasY(sellerP))
            ctx.lineTo(toCanvasX(newEqQ + 8), toCanvasY(buyerP))
            ctx.closePath()
            ctx.fill()

            // Draw subsidized supply curve
            ctx.strokeStyle = 'rgba(100, 200, 150, 0.6)'
            ctx.lineWidth = 2
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 2) {
                const p = subsidizedSupplyIntercept + supplySlope * q
                if (p < 0 || p > maxP) continue
                if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p))
                else ctx.lineTo(toCanvasX(q), toCanvasY(p))
            }
            ctx.stroke()
            ctx.setLineDash([])

            // Labels
            ctx.fillStyle = 'rgba(100, 200, 150, 0.9)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText(`Buyer pays: $${buyerP.toFixed(0)}`, toCanvasX(newEqQ) + 15, toCanvasY(buyerP))
            ctx.fillText(`Seller receives: $${sellerP.toFixed(0)}`, toCanvasX(newEqQ) + 15, toCanvasY(sellerP))

            ctx.font = 'bold 11px system-ui'
            ctx.fillText(`Subsidy: $${subsidyAmount}`, toCanvasX(newEqQ) + 15, toCanvasY((buyerP + sellerP) / 2))

            // Gov cost
            const govCost = subsidyAmount * newEqQ
            ctx.fillStyle = 'rgba(100, 200, 150, 0.8)'
            ctx.font = '12px system-ui'
            ctx.textAlign = 'right'
            ctx.fillText(`Gov Cost: $${govCost.toFixed(0)}`, width - padding, 30)
        }

        // Draw original demand curve (faded if shifted)
        if (demandShift !== 0) {
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)'
            ctx.lineWidth = 2
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 2) {
                const p = demandIntercept + demandSlope * q
                if (p < 0 || p > maxP) continue
                if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p))
                else ctx.lineTo(toCanvasX(q), toCanvasY(p))
            }
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255, 100, 100, 0.4)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('D₀', toCanvasX(70), toCanvasY(demandIntercept + demandSlope * 70) - 5)
        }

        // Draw demand curve
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let q = 0; q <= maxQ; q += 1) {
            const p = getDemandP(q)
            if (p < 0 || p > maxP) continue
            if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p))
            else ctx.lineTo(toCanvasX(q), toCanvasY(p))
        }
        ctx.stroke()

        // Demand label
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'left'
        const dLabelQ = 80
        const dLabelP = getDemandP(dLabelQ)
        if (dLabelP > 0 && dLabelP < maxP) {
            ctx.fillText(demandShift !== 0 ? 'D₁' : 'D', toCanvasX(dLabelQ) + 5, toCanvasY(dLabelP) - 8)
        }

        // Draw original supply curve (faded if shifted)
        if (supplyShift !== 0) {
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)'
            ctx.lineWidth = 2
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 2) {
                const p = supplyIntercept + supplySlope * q
                if (p < 0 || p > maxP) continue
                if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p))
                else ctx.lineTo(toCanvasX(q), toCanvasY(p))
            }
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(100, 150, 255, 0.4)'
            ctx.font = '11px system-ui'
            ctx.fillText('S₀', toCanvasX(75), toCanvasY(supplyIntercept + supplySlope * 75) + 15)
        }

        // Draw supply curve
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.9)'
        ctx.lineWidth = 3
        ctx.beginPath()
        for (let q = 0; q <= maxQ; q += 1) {
            const p = getSupplyP(q)
            if (p < 0 || p > maxP) continue
            if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p))
            else ctx.lineTo(toCanvasX(q), toCanvasY(p))
        }
        ctx.stroke()

        // Supply label
        ctx.fillStyle = 'rgba(100, 150, 255, 0.9)'
        ctx.font = 'bold 14px system-ui'
        const sLabelQ = 85
        const sLabelP = getSupplyP(sLabelQ)
        if (sLabelP > 0 && sLabelP < maxP) {
            ctx.fillText(supplyShift !== 0 ? 'S₁' : 'S', toCanvasX(sLabelQ) + 5, toCanvasY(sLabelP) + 15)
        }

        // Draw equilibrium point
        if (eq.Q > 0 && eq.Q < maxQ && eq.P > 0 && eq.P < maxP && controlType === 'none') {
            // Dashed lines to axes
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'
            ctx.lineWidth = 1.5
            ctx.setLineDash([6, 4])
            ctx.beginPath()
            ctx.moveTo(toCanvasX(eq.Q), toCanvasY(eq.P))
            ctx.lineTo(toCanvasX(eq.Q), toCanvasY(0))
            ctx.moveTo(toCanvasX(eq.Q), toCanvasY(eq.P))
            ctx.lineTo(toCanvasX(0), toCanvasY(eq.P))
            ctx.stroke()
            ctx.setLineDash([])

            // Equilibrium point glow
            const eqGlow = ctx.createRadialGradient(
                toCanvasX(eq.Q), toCanvasY(eq.P), 0,
                toCanvasX(eq.Q), toCanvasY(eq.P), 20
            )
            eqGlow.addColorStop(0, 'rgba(220, 180, 80, 0.4)')
            eqGlow.addColorStop(1, 'transparent')
            ctx.fillStyle = eqGlow
            ctx.beginPath()
            ctx.arc(toCanvasX(eq.Q), toCanvasY(eq.P), 20, 0, Math.PI * 2)
            ctx.fill()

            // Equilibrium point
            ctx.fillStyle = 'rgba(220, 180, 80, 1)'
            ctx.beginPath()
            ctx.arc(toCanvasX(eq.Q), toCanvasY(eq.P), 8, 0, Math.PI * 2)
            ctx.fill()

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.lineWidth = 2
            ctx.stroke()

            // Label
            ctx.fillStyle = 'rgba(220, 180, 80, 1)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('E', toCanvasX(eq.Q) + 12, toCanvasY(eq.P) - 4)
        }

        // Legend
        const legendX = width - 160
        let legendY = 70
        ctx.font = '11px system-ui'
        ctx.textAlign = 'left'

        const legendItems = [
            { color: 'rgba(80, 200, 120, 0.8)', label: 'Consumer Surplus' },
            { color: 'rgba(100, 150, 255, 0.8)', label: 'Producer Surplus' },
        ]

        if (controlType === 'none') {
            const surpluses = getSurplusValues()
            legendItems.forEach((item, idx) => {
                ctx.fillStyle = item.color
                ctx.fillRect(legendX, legendY - 8, 12, 12)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
                const value = idx === 0 ? surpluses.consumerSurplus : surpluses.producerSurplus
                ctx.fillText(`${item.label}: $${value.toFixed(0)}`, legendX + 18, legendY)
                legendY += 18
            })
            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.fillText(`Total: $${surpluses.totalSurplus.toFixed(0)}`, legendX + 18, legendY)
        }

        return () => window.removeEventListener('resize', resize)
    }, [demandIntercept, demandSlope, supplyIntercept, supplySlope, demandShift, supplyShift, controlType, controlPrice, taxAmount, subsidyAmount, calculateEquilibrium, getQd, getQs, getSurplusValues])

    const eq = calculateEquilibrium()
    const elasticity = getElasticity()

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Info Panel */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 left-4 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-xs"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-white/60">Market Equilibrium</span>
                        <button
                            onClick={() => { setShowDemo(true); setDemoStep(0) }}
                            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            AP Tutorial
                        </button>
                    </div>

                    <div className="font-mono text-lg mb-3 grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-white/40 text-xs">Price (P*)</div>
                            <div className="text-yellow-400">${eq.P.toFixed(1)}</div>
                        </div>
                        <div>
                            <div className="text-white/40 text-xs">Quantity (Q*)</div>
                            <div className="text-yellow-400">{eq.Q.toFixed(1)}</div>
                        </div>
                    </div>

                    <div className="text-xs text-white/50 border-t border-white/10 pt-2 space-y-1">
                        <div>
                            Ed: <span className={`font-mono ${elasticity.demand > 1 ? 'text-green-400' : 'text-orange-400'}`}>
                                {elasticity.demand.toFixed(2)}
                            </span>
                            <span className="text-white/30 ml-1">({elasticity.demand > 1 ? 'elastic' : elasticity.demand < 1 ? 'inelastic' : 'unit elastic'})</span>
                        </div>
                        <div>
                            Es: <span className="font-mono text-blue-400">{elasticity.supply.toFixed(2)}</span>
                            <span className="text-white/30 ml-1">({elasticity.supply > 1 ? 'elastic' : elasticity.supply < 1 ? 'inelastic' : 'unit elastic'})</span>
                        </div>
                    </div>

                    {shiftReason && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                            <div className={`text-xs ${shiftReason.type === 'demand' ? 'text-red-400' : 'text-blue-400'}`}>
                                {shiftReason.type === 'demand' ? '→ Demand' : '→ Supply'} {shiftReason.info.effect === 'increase' ? 'increased' : 'decreased'}
                            </div>
                            <div className="text-xs text-white/40 mt-1">{shiftReason.info.name}</div>
                        </div>
                    )}
                </motion.div>

                {/* Control Type Selector */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 right-4 flex gap-2 flex-wrap justify-end max-w-md"
                >
                    {[
                        { type: 'none' as const, label: 'Free Market' },
                        { type: 'ceiling' as const, label: 'Price Ceiling' },
                        { type: 'floor' as const, label: 'Price Floor' },
                        { type: 'tax' as const, label: 'Tax' },
                        { type: 'subsidy' as const, label: 'Subsidy' },
                    ].map(item => (
                        <button
                            key={item.type}
                            onClick={() => setControlType(item.type)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${controlType === item.type
                                ? item.type === 'ceiling' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    item.type === 'floor' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        item.type === 'tax' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                            item.type === 'subsidy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                'bg-white/10 text-white border border-white/20'
                                : 'text-white/50 hover:text-white bg-black/30 border border-white/10'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </motion.div>

                {/* Determinants Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-28 right-4"
                >
                    <button
                        onClick={() => setShowDeterminants(true)}
                        className="px-4 py-2 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                    >
                        Demand & Supply Shifters
                    </button>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Curve adjustments */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-red-400 text-xs font-medium">D Shift</span>
                                <input
                                    type="range" min={-30} max={30}
                                    value={demandShift}
                                    onChange={e => { setDemandShift(+e.target.value); setShiftReason(null) }}
                                    className="w-20 accent-red-400"
                                />
                                <span className={`text-xs font-mono w-6 ${demandShift > 0 ? 'text-green-400' : demandShift < 0 ? 'text-red-400' : 'text-white/30'}`}>
                                    {demandShift > 0 ? '→' : demandShift < 0 ? '←' : '—'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-blue-400 text-xs font-medium">S Shift</span>
                                <input
                                    type="range" min={-30} max={30}
                                    value={supplyShift}
                                    onChange={e => { setSupplyShift(+e.target.value); setShiftReason(null) }}
                                    className="w-20 accent-blue-400"
                                />
                                <span className={`text-xs font-mono w-6 ${supplyShift > 0 ? 'text-green-400' : supplyShift < 0 ? 'text-red-400' : 'text-white/30'}`}>
                                    {supplyShift > 0 ? '→' : supplyShift < 0 ? '←' : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Price control sliders */}
                        {controlType === 'ceiling' && (
                            <div className="flex items-center gap-3">
                                <span className="text-white/50 text-sm">Ceiling</span>
                                <input
                                    type="range" min={10} max={eq.P - 5}
                                    value={controlPrice}
                                    onChange={e => setControlPrice(+e.target.value)}
                                    className="w-28 accent-red-400"
                                />
                                <span className="text-red-400 font-mono text-sm">${controlPrice}</span>
                            </div>
                        )}
                        {controlType === 'floor' && (
                            <div className="flex items-center gap-3">
                                <span className="text-white/50 text-sm">Floor</span>
                                <input
                                    type="range" min={eq.P + 5} max={100}
                                    value={controlPrice}
                                    onChange={e => setControlPrice(+e.target.value)}
                                    className="w-28 accent-blue-400"
                                />
                                <span className="text-blue-400 font-mono text-sm">${controlPrice}</span>
                            </div>
                        )}
                        {controlType === 'tax' && (
                            <div className="flex items-center gap-3">
                                <span className="text-white/50 text-sm">Tax</span>
                                <input
                                    type="range" min={5} max={40}
                                    value={taxAmount}
                                    onChange={e => setTaxAmount(+e.target.value)}
                                    className="w-28 accent-yellow-400"
                                />
                                <span className="text-yellow-400 font-mono text-sm">${taxAmount}</span>
                            </div>
                        )}
                        {controlType === 'subsidy' && (
                            <div className="flex items-center gap-3">
                                <span className="text-white/50 text-sm">Subsidy</span>
                                <input
                                    type="range" min={5} max={30}
                                    value={subsidyAmount}
                                    onChange={e => setSubsidyAmount(+e.target.value)}
                                    className="w-28 accent-green-400"
                                />
                                <span className="text-green-400 font-mono text-sm">${subsidyAmount}</span>
                            </div>
                        )}

                        {/* Elasticity controls */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-white/40 text-xs">Ed</span>
                                <input
                                    type="range" min={-1.5} max={-0.3} step={0.1}
                                    value={demandSlope}
                                    onChange={e => setDemandSlope(+e.target.value)}
                                    className="w-16 accent-red-400"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-white/40 text-xs">Es</span>
                                <input
                                    type="range" min={0.3} max={1.5} step={0.1}
                                    value={supplySlope}
                                    onChange={e => setSupplySlope(+e.target.value)}
                                    className="w-16 accent-blue-400"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setDemandShift(0)
                                setSupplyShift(0)
                                setControlType('none')
                                setDemandSlope(-0.8)
                                setSupplySlope(0.7)
                                setShiftReason(null)
                            }}
                            className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Determinants Modal */}
            <AnimatePresence>
                {showDeterminants && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowDeterminants(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a150a] border border-white/20 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-yellow-400">Determinants of Supply & Demand</h3>
                                <button onClick={() => setShowDeterminants(false)} className="text-white/40 hover:text-white text-xl">×</button>
                            </div>

                            <p className="text-white/60 text-sm mb-6">
                                Click a determinant to see how it shifts the curve. Remember: these cause SHIFTS, not movements along the curve.
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-red-400/30"></span>
                                        Demand Shifters
                                    </h4>
                                    <div className="space-y-2">
                                        {demandDeterminants.map((det, i) => (
                                            <button
                                                key={i}
                                                onClick={() => applyDeterminant('demand', det)}
                                                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-colors"
                                            >
                                                <div className="text-white/80 text-sm flex items-center justify-between">
                                                    {det.name}
                                                    <span className={det.effect === 'increase' ? 'text-green-400' : 'text-red-400'}>
                                                        {det.effect === 'increase' ? '→' : '←'}
                                                    </span>
                                                </div>
                                                <div className="text-white/40 text-xs mt-1">{det.example}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-blue-400/30"></span>
                                        Supply Shifters
                                    </h4>
                                    <div className="space-y-2">
                                        {supplyDeterminants.map((det, i) => (
                                            <button
                                                key={i}
                                                onClick={() => applyDeterminant('supply', det)}
                                                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 transition-colors"
                                            >
                                                <div className="text-white/80 text-sm flex items-center justify-between">
                                                    {det.name}
                                                    <span className={det.effect === 'increase' ? 'text-green-400' : 'text-red-400'}>
                                                        {det.effect === 'increase' ? '→' : '←'}
                                                    </span>
                                                </div>
                                                <div className="text-white/40 text-xs mt-1">{det.example}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Demo Modal */}
            <AnimatePresence>
                {showDemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowDemo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a150a] border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs text-white/40">
                                    {demoStep + 1} of {demoSteps.length}
                                </span>
                                <button onClick={() => setShowDemo(false)} className="text-white/40 hover:text-white text-xl">×</button>
                            </div>

                            <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                                {demoSteps[demoStep].title}
                            </h3>
                            <p className="text-white/70 mb-6 leading-relaxed">
                                {demoSteps[demoStep].description}
                            </p>

                            <div className="flex justify-center gap-2 mb-6">
                                {demoSteps.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setDemoStep(i)}
                                        className={`w-2 h-2 rounded-full transition-colors ${i === demoStep ? 'bg-yellow-400' : 'bg-white/20 hover:bg-white/40'}`}
                                    />
                                ))}
                            </div>

                            <div className="flex justify-between gap-3">
                                <button
                                    onClick={() => setDemoStep(Math.max(0, demoStep - 1))}
                                    disabled={demoStep === 0}
                                    className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Previous
                                </button>
                                {demoStep < demoSteps.length - 1 ? (
                                    <button
                                        onClick={() => setDemoStep(demoStep + 1)}
                                        className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                                    >
                                        Next →
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowDemo(false)}
                                        className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                    >
                                        Done ✓
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
