import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type Degree = 'none' | 'first' | 'second' | 'third'

const GOLD = 'rgb(220, 180, 80)'

const demandAt = (q: number) => 120 - 2 * q
const mcAt = (q: number) => 20 + 0.4 * q
const atcAt = (q: number) => 20 + 0.2 * q + 200 / Math.max(q, 1)
const mrAt = (q: number) => 120 - 4 * q

function findMRMC(): number {
    for (let q = 1; q < 50; q += 0.5) { if (mrAt(q) <= mcAt(q)) return q }
    return 25
}

export default function PriceDiscrimination() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [degree, setDegree] = useState<Degree>('none')
    const [numTiers, setNumTiers] = useState(3)
    const [marketSplit, setMarketSplit] = useState(0.5)
    const [showSurplus, setShowSurplus] = useState(true)

    const qStar = useMemo(() => findMRMC(), [])
    const pStar = demandAt(qStar)
    const mcStar = mcAt(qStar)

    const qCompetitive = useMemo(() => {
        for (let q = 1; q < 60; q += 0.5) { if (demandAt(q) <= mcAt(q)) return q }
        return 50
    }, [])

    const computeSurplus = useCallback(() => {
        const step = 0.5
        let cs = 0, ps = 0, dwl = 0
        if (degree === 'none') {
            for (let q = 0; q < qStar; q += step) { cs += (demandAt(q) - pStar) * step; ps += (pStar - mcAt(q)) * step }
            for (let q = qStar; q < qCompetitive; q += step) { dwl += (demandAt(q) - mcAt(q)) * step }
        } else if (degree === 'first') {
            for (let q = 0; q < qCompetitive; q += step) { ps += (demandAt(q) - mcAt(q)) * step }
        } else if (degree === 'second') {
            const tierWidth = qCompetitive / numTiers
            for (let t = 0; t < numTiers; t++) {
                const qStart = t * tierWidth, qEnd = (t + 1) * tierWidth
                const tierP = demandAt(qStart)
                for (let q = qStart; q < qEnd; q += step) {
                    const mc = mcAt(q); const d = demandAt(q)
                    if (tierP >= mc && tierP <= d) { cs += (d - tierP) * step; ps += (tierP - mc) * step }
                    else if (tierP >= mc && tierP > d) { ps += (tierP - mc) * step }
                }
            }
            const lastTierEnd = numTiers * tierWidth
            for (let q = lastTierEnd; q < qCompetitive; q += step) {
                const surplus = demandAt(q) - mcAt(q)
                if (surplus > 0) dwl += surplus * step
            }
        } else {
            const elasticQ = qStar * (1 + (marketSplit - 0.5) * 0.6)
            const inelasticQ = qStar * (1 - (marketSplit - 0.5) * 0.6)
            const pElastic = demandAt(elasticQ) * (0.7 + (1 - marketSplit) * 0.4)
            const pInelastic = demandAt(inelasticQ) * (0.9 + marketSplit * 0.3)
            for (let q = 0; q < elasticQ; q += step) {
                const d = demandAt(q) * (0.7 + (1 - marketSplit) * 0.4)
                cs += Math.max(0, d - pElastic) * step; ps += Math.max(0, pElastic - mcAt(q)) * step
            }
            for (let q = 0; q < inelasticQ; q += step) {
                const d = demandAt(q) * (0.9 + marketSplit * 0.3)
                cs += Math.max(0, d - pInelastic) * step; ps += Math.max(0, pInelastic - mcAt(q)) * step
            }
        }
        const tr = degree === 'none' ? pStar * qStar : degree === 'first'
            ? (() => { let r = 0; for (let q = 0; q < qCompetitive; q += step) r += demandAt(q) * step; return r })()
            : ps + cs + dwl > 0 ? ps + cs : 0
        return { cs: Math.max(0, cs), ps: Math.max(0, ps), dwl: Math.max(0, dwl), tr: Math.max(0, tr || pStar * qStar) }
    }, [degree, numTiers, marketSplit, qStar, pStar, qCompetitive])

    const surplus = useMemo(() => computeSurplus(), [computeSurplus])

    const setDegreeWrapped = useCallback((d: Degree) => { setDegree(d) }, [])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'Single-Price Monopoly', description: 'Baseline: the monopolist sets MR=MC to find Qm, then charges one price Pm. Consumer surplus exists above price, deadweight loss exists beyond Qm.', setup: () => { setDegreeWrapped('none'); setShowSurplus(true) } },
        { title: '1st Degree Concept', description: 'Perfect price discrimination: charge each consumer their maximum willingness to pay. Every unit sold at a different price.', setup: () => { setDegreeWrapped('first'); setShowSurplus(false) } },
        { title: '1st Degree Surplus', description: 'The monopolist captures ALL consumer surplus. Output expands to the competitive quantity. DWL = 0, but all surplus goes to the producer.', setup: () => { setDegreeWrapped('first'); setShowSurplus(true) } },
        { title: '2nd Degree: Quantity Discounts', description: 'Charge different prices for different quantities (tiers/blocks). Bulk buyers get lower per-unit prices. Think: cell phone data plans.', setup: () => { setDegreeWrapped('second'); setNumTiers(3); setShowSurplus(false) } },
        { title: '2nd Degree Tiers', description: 'Each tier captures more of the demand curve. More tiers = more surplus captured. Adjust the slider to see how tier count affects surplus.', setup: () => { setDegreeWrapped('second'); setNumTiers(3); setShowSurplus(true) } },
        { title: '3rd Degree: Market Segmentation', description: 'Split customers into groups with different elasticities (students vs adults, peak vs off-peak). Charge each group a different price.', setup: () => { setDegreeWrapped('third'); setMarketSplit(0.5); setShowSurplus(false) } },
        { title: '3rd Degree MR=MC', description: 'Set MR=MC in EACH market separately. The more inelastic market pays a higher price. Profit maximized when MR1 = MR2 = MC.', setup: () => { setDegreeWrapped('third'); setMarketSplit(0.5); setShowSurplus(true) } },
        { title: 'Experiment', description: 'Switch between types, adjust tiers and market split. Compare surplus distributions across all three degrees of price discrimination.', setup: () => { setDegreeWrapped('none'); setShowSurplus(true) } },
    ], [setDegreeWrapped])

    const demo = useDemoMode(demoSteps)

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

        if (degree === 'third') {
            drawThirdDegree(ctx, W, H)
        } else {
            drawSingleGraph(ctx, W, H)
        }

        function drawSingleGraph(ctx: CanvasRenderingContext2D, W: number, H: number) {
            const pad = 70, gW = W - pad * 2, gH = H - pad * 2 - 40
            const maxQ = 60, maxP = 140
            const toX = (q: number) => pad + (q / maxQ) * gW
            const toY = (p: number) => H - pad - 40 - (p / maxP) * gH

            drawGrid(ctx, pad, gW, gH, toX, toY, maxQ, maxP, W, H)
            drawAxes(ctx, pad, gW, gH, toX, toY, maxQ, maxP, W, H, 'Quantity', 'Price ($)')

            // Surplus shading
            if (showSurplus && degree === 'none') {
                // CS: between demand and Pm, from 0 to qStar
                ctx.fillStyle = 'rgba(100,180,255,0.15)'
                ctx.beginPath(); ctx.moveTo(toX(0), toY(pStar))
                for (let q = 0; q <= qStar; q += 1) ctx.lineTo(toX(q), toY(demandAt(q)))
                ctx.lineTo(toX(qStar), toY(pStar)); ctx.closePath(); ctx.fill()
                // PS: between Pm and MC, from 0 to qStar
                ctx.fillStyle = 'rgba(220,180,80,0.2)'
                ctx.beginPath(); ctx.moveTo(toX(0), toY(pStar))
                for (let q = 0; q <= qStar; q += 1) ctx.lineTo(toX(q), toY(mcAt(q)))
                ctx.lineTo(toX(qStar), toY(pStar)); ctx.closePath(); ctx.fill()
                // DWL: between demand and MC, from qStar to qCompetitive
                ctx.fillStyle = 'rgba(255,80,80,0.15)'
                ctx.beginPath(); ctx.moveTo(toX(qStar), toY(pStar))
                for (let q = qStar; q <= qCompetitive; q += 1) ctx.lineTo(toX(q), toY(demandAt(q)))
                for (let q = qCompetitive; q >= qStar; q -= 1) ctx.lineTo(toX(q), toY(mcAt(q)))
                ctx.closePath(); ctx.fill()
            }

            if (showSurplus && degree === 'first') {
                // Entire area between demand and MC is PS
                ctx.fillStyle = 'rgba(220,180,80,0.25)'
                ctx.beginPath(); ctx.moveTo(toX(0), toY(demandAt(0)))
                for (let q = 0; q <= qCompetitive; q += 1) ctx.lineTo(toX(q), toY(demandAt(q)))
                for (let q = qCompetitive; q >= 0; q -= 1) ctx.lineTo(toX(q), toY(mcAt(q)))
                ctx.closePath(); ctx.fill()
            }

            if (degree === 'second') {
                const tierWidth = qCompetitive / numTiers
                for (let t = 0; t < numTiers; t++) {
                    const qStart = t * tierWidth, qEnd = (t + 1) * tierWidth
                    const tierP = demandAt(qStart)
                    const hue = 40 + t * 20
                    ctx.fillStyle = showSurplus ? `hsla(${hue},70%,50%,0.18)` : `hsla(${hue},70%,50%,0.10)`
                    ctx.strokeStyle = `hsla(${hue},70%,60%,0.6)`; ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.moveTo(toX(qStart), toY(tierP))
                    ctx.lineTo(toX(qEnd), toY(tierP))
                    ctx.lineTo(toX(qEnd), toY(mcAt(qEnd)))
                    for (let q = qEnd; q >= qStart; q -= 1) ctx.lineTo(toX(q), toY(mcAt(q)))
                    ctx.closePath(); ctx.fill(); ctx.stroke()
                    // Price label
                    ctx.fillStyle = `hsla(${hue},70%,70%,0.9)`; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'right'
                    ctx.fillText(`$${tierP.toFixed(0)}`, toX(qStart) - 4, toY(tierP) + 4)
                }
            }

            // Demand curve
            ctx.strokeStyle = 'rgba(100,180,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 0.5) { const p = demandAt(q); if (p < 0) break; if (q === 0) ctx.moveTo(toX(q), toY(p)); else ctx.lineTo(toX(q), toY(p)) }
            ctx.stroke()
            ctx.fillStyle = 'rgba(100,180,255,0.9)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left'
            ctx.fillText('D', toX(55), toY(demandAt(55)) - 8)

            // MR curve
            ctx.strokeStyle = 'rgba(100,200,150,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]); ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 0.5) { const p = mrAt(q); if (p < -10) break; if (q === 0) ctx.moveTo(toX(q), toY(p)); else ctx.lineTo(toX(q), toY(p)) }
            ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(100,200,150,0.8)'; ctx.font = 'bold 12px system-ui'
            ctx.fillText('MR', toX(28), toY(mrAt(28)) - 8)

            // MC curve
            ctx.strokeStyle = 'rgba(255,120,80,0.9)'; ctx.lineWidth = 2.5; ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 0.5) { const p = mcAt(q); if (q === 0) ctx.moveTo(toX(q), toY(p)); else ctx.lineTo(toX(q), toY(p)) }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255,120,80,0.9)'; ctx.font = 'bold 12px system-ui'
            ctx.fillText('MC', toX(55), toY(mcAt(55)) - 8)

            // ATC curve
            ctx.strokeStyle = 'rgba(255,200,100,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath()
            for (let q = 2; q <= maxQ; q += 0.5) { const p = atcAt(q); if (q === 2) ctx.moveTo(toX(q), toY(p)); else ctx.lineTo(toX(q), toY(p)) }
            ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,200,100,0.6)'; ctx.font = '11px system-ui'
            ctx.fillText('ATC', toX(45), toY(atcAt(45)) - 8)

            // Monopoly point
            if (degree === 'none' || degree === 'first') {
                const px = toX(qStar), py = toY(pStar)
                if (degree === 'none') {
                    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(220,180,80,0.4)'; ctx.lineWidth = 1
                    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, toY(0)); ctx.stroke()
                    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(toX(0), py); ctx.stroke(); ctx.setLineDash([])
                }
                const glowTarget = degree === 'first' ? toX(qCompetitive) : px
                const glowY = degree === 'first' ? toY(demandAt(qCompetitive)) : py
                const glow = ctx.createRadialGradient(glowTarget, glowY, 0, glowTarget, glowY, 20)
                glow.addColorStop(0, 'rgba(220,180,80,0.4)'); glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(glowTarget, glowY, 20, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(glowTarget, glowY, 6, 0, Math.PI * 2); ctx.fill()
                if (degree === 'none') {
                    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'
                    ctx.fillText(`Qm=${qStar.toFixed(0)}, Pm=$${pStar.toFixed(0)}`, px, py - 14)
                }
            }

            // 1st degree: staircase illustration
            if (degree === 'first') {
                ctx.strokeStyle = 'rgba(220,180,80,0.6)'; ctx.lineWidth = 1
                const steps = 20; const stepW = qCompetitive / steps
                for (let i = 0; i < steps; i++) {
                    const qL = i * stepW, qR = (i + 1) * stepW
                    const p = demandAt(qL)
                    ctx.beginPath(); ctx.moveTo(toX(qL), toY(p)); ctx.lineTo(toX(qR), toY(p)); ctx.lineTo(toX(qR), toY(demandAt(qR))); ctx.stroke()
                }
                ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('Each unit priced at WTP', toX(qCompetitive / 2), toY(maxP * 0.92))
            }

            // Legend
            const lx = pad + gW - 130, ly = pad + 15
            ctx.font = '10px system-ui'
            if (showSurplus) {
                if (degree === 'none') {
                    ctx.fillStyle = 'rgba(100,180,255,0.4)'; ctx.fillRect(lx, ly, 12, 12)
                    ctx.fillStyle = 'rgba(100,180,255,0.9)'; ctx.textAlign = 'left'; ctx.fillText('Consumer Surplus', lx + 18, ly + 10)
                    ctx.fillStyle = 'rgba(220,180,80,0.4)'; ctx.fillRect(lx, ly + 18, 12, 12)
                    ctx.fillStyle = 'rgba(220,180,80,0.9)'; ctx.fillText('Producer Surplus', lx + 18, ly + 28)
                    ctx.fillStyle = 'rgba(255,80,80,0.4)'; ctx.fillRect(lx, ly + 36, 12, 12)
                    ctx.fillStyle = 'rgba(255,80,80,0.9)'; ctx.fillText('Deadweight Loss', lx + 18, ly + 46)
                } else if (degree === 'first') {
                    ctx.fillStyle = 'rgba(220,180,80,0.5)'; ctx.fillRect(lx, ly, 12, 12)
                    ctx.fillStyle = 'rgba(220,180,80,0.9)'; ctx.textAlign = 'left'; ctx.fillText('Producer Surplus (all)', lx + 18, ly + 10)
                }
            }
        }

        function drawThirdDegree(ctx: CanvasRenderingContext2D, W: number, H: number) {
            const pad = 60, gap = 40
            const halfW = (W - pad * 2 - gap) / 2
            const gH = H - pad * 2 - 40
            const maxQ = 35, maxP = 140

            // Elastic market (left)
            const elasticScale = 0.7 + (1 - marketSplit) * 0.4
            const toXL = (q: number) => pad + (q / maxQ) * halfW
            const toYL = (p: number) => H - pad - 40 - (p / maxP) * gH

            drawGrid(ctx, pad, halfW, gH, toXL, toYL, maxQ, maxP, W, H)
            drawAxesPartial(ctx, pad, halfW, gH, toXL, toYL, maxQ, maxP, H, 'Q (Elastic Mkt)')

            const elasticD = (q: number) => demandAt(q) * elasticScale
            const elasticMR = (q: number) => (120 * elasticScale) - 4 * q * elasticScale
            let qE = 0
            for (let q = 1; q < maxQ; q += 0.5) { if (elasticMR(q) <= mcAt(q)) { qE = q; break } }
            const pE = elasticD(qE)

            if (showSurplus) {
                ctx.fillStyle = 'rgba(100,180,255,0.12)'
                ctx.beginPath(); ctx.moveTo(toXL(0), toYL(pE))
                for (let q = 0; q <= qE; q += 1) ctx.lineTo(toXL(q), toYL(elasticD(q)))
                ctx.lineTo(toXL(qE), toYL(pE)); ctx.closePath(); ctx.fill()
                ctx.fillStyle = 'rgba(220,180,80,0.18)'
                ctx.beginPath(); ctx.moveTo(toXL(0), toYL(pE))
                for (let q = 0; q <= qE; q += 1) ctx.lineTo(toXL(q), toYL(mcAt(q)))
                ctx.lineTo(toXL(qE), toYL(pE)); ctx.closePath(); ctx.fill()
            }

            // Elastic demand
            ctx.strokeStyle = 'rgba(100,180,255,0.8)'; ctx.lineWidth = 2.5; ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 0.5) { const p = elasticD(q); if (p < 0) break; if (q === 0) ctx.moveTo(toXL(q), toYL(p)); else ctx.lineTo(toXL(q), toYL(p)) }
            ctx.stroke()
            ctx.fillStyle = 'rgba(100,180,255,0.8)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left'
            ctx.fillText('D₁', toXL(maxQ - 5), toYL(elasticD(maxQ - 5)) - 8)

            // Elastic MR
            ctx.strokeStyle = 'rgba(100,200,150,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]); ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 0.5) { const p = elasticMR(q); if (p < -10) break; if (q === 0) ctx.moveTo(toXL(q), toYL(p)); else ctx.lineTo(toXL(q), toYL(p)) }
            ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(100,200,150,0.7)'; ctx.fillText('MR₁', toXL(14), toYL(elasticMR(14)) - 8)

            // MC on left
            ctx.strokeStyle = 'rgba(255,120,80,0.7)'; ctx.lineWidth = 2; ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 0.5) { if (q === 0) ctx.moveTo(toXL(q), toYL(mcAt(q))); else ctx.lineTo(toXL(q), toYL(mcAt(q))) }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255,120,80,0.7)'; ctx.fillText('MC', toXL(maxQ - 3), toYL(mcAt(maxQ - 3)) - 8)

            // Elastic equilibrium point
            ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(220,180,80,0.3)'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(toXL(qE), toYL(pE)); ctx.lineTo(toXL(qE), toYL(0)); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(toXL(qE), toYL(pE)); ctx.lineTo(toXL(0), toYL(pE)); ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(toXL(qE), toYL(pE), 5, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
            ctx.fillText(`P₁=$${pE.toFixed(0)}`, toXL(qE), toYL(pE) - 12)

            // Inelastic market (right)
            const inelasticScale = 0.9 + marketSplit * 0.3
            const rightStart = pad + halfW + gap
            const toXR = (q: number) => rightStart + (q / maxQ) * halfW
            const toYR = (p: number) => H - pad - 40 - (p / maxP) * gH

            drawGrid(ctx, rightStart, halfW, gH, toXR, toYR, maxQ, maxP, W, H)
            drawAxesPartial(ctx, rightStart, halfW, gH, toXR, toYR, maxQ, maxP, H, 'Q (Inelastic Mkt)')

            const inelasticD = (q: number) => demandAt(q) * inelasticScale
            const inelasticMR = (q: number) => (120 * inelasticScale) - 4 * q * inelasticScale
            let qI = 0
            for (let q = 1; q < maxQ; q += 0.5) { if (inelasticMR(q) <= mcAt(q)) { qI = q; break } }
            const pI = inelasticD(qI)

            if (showSurplus) {
                ctx.fillStyle = 'rgba(100,180,255,0.12)'
                ctx.beginPath(); ctx.moveTo(toXR(0), toYR(pI))
                for (let q = 0; q <= qI; q += 1) ctx.lineTo(toXR(q), toYR(inelasticD(q)))
                ctx.lineTo(toXR(qI), toYR(pI)); ctx.closePath(); ctx.fill()
                ctx.fillStyle = 'rgba(220,180,80,0.18)'
                ctx.beginPath(); ctx.moveTo(toXR(0), toYR(pI))
                for (let q = 0; q <= qI; q += 1) ctx.lineTo(toXR(q), toYR(mcAt(q)))
                ctx.lineTo(toXR(qI), toYR(pI)); ctx.closePath(); ctx.fill()
            }

            // Inelastic demand
            ctx.strokeStyle = 'rgba(255,160,80,0.8)'; ctx.lineWidth = 2.5; ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 0.5) { const p = inelasticD(q); if (p < 0) break; if (q === 0) ctx.moveTo(toXR(q), toYR(p)); else ctx.lineTo(toXR(q), toYR(p)) }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255,160,80,0.8)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left'
            ctx.fillText('D₂', toXR(maxQ - 8), toYR(inelasticD(maxQ - 8)) - 8)

            // Inelastic MR
            ctx.strokeStyle = 'rgba(100,200,150,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]); ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 0.5) { const p = inelasticMR(q); if (p < -10) break; if (q === 0) ctx.moveTo(toXR(q), toYR(p)); else ctx.lineTo(toXR(q), toYR(p)) }
            ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(100,200,150,0.7)'; ctx.fillText('MR₂', toXR(14), toYR(inelasticMR(14)) - 8)

            // MC on right
            ctx.strokeStyle = 'rgba(255,120,80,0.7)'; ctx.lineWidth = 2; ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 0.5) { if (q === 0) ctx.moveTo(toXR(q), toYR(mcAt(q))); else ctx.lineTo(toXR(q), toYR(mcAt(q))) }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255,120,80,0.7)'; ctx.fillText('MC', toXR(maxQ - 3), toYR(mcAt(maxQ - 3)) - 8)

            // Inelastic equilibrium point
            ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(220,180,80,0.3)'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(toXR(qI), toYR(pI)); ctx.lineTo(toXR(qI), toYR(0)); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(toXR(qI), toYR(pI)); ctx.lineTo(toXR(0), toYR(pI)); ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(toXR(qI), toYR(pI), 5, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
            ctx.fillText(`P₂=$${pI.toFixed(0)}`, toXR(qI), toYR(pI) - 12)

            // Title labels
            ctx.fillStyle = 'rgba(100,180,255,0.7)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Elastic Market (lower price)', pad + halfW / 2, pad - 10)
            ctx.fillStyle = 'rgba(255,160,80,0.7)'; ctx.fillText('Inelastic Market (higher price)', rightStart + halfW / 2, pad - 10)
        }

        function drawGrid(ctx: CanvasRenderingContext2D, _padL: number, _gW: number, _gH: number, toX: (q: number) => number, toY: (p: number) => number, maxQ: number, maxP: number, _W: number, _H: number) {
            ctx.strokeStyle = 'rgba(220,180,80,0.05)'; ctx.lineWidth = 1
            for (let q = 0; q <= maxQ; q += 10) { ctx.beginPath(); ctx.moveTo(toX(q), toY(0)); ctx.lineTo(toX(q), toY(maxP)); ctx.stroke() }
            for (let p = 0; p <= maxP; p += 20) { ctx.beginPath(); ctx.moveTo(toX(0), toY(p)); ctx.lineTo(toX(maxQ), toY(p)); ctx.stroke() }
        }

        function drawAxes(ctx: CanvasRenderingContext2D, pad: number, gW: number, _gH: number, toX: (q: number) => number, toY: (p: number) => number, maxQ: number, maxP: number, _W: number, H: number, xLabel: string, yLabel: string) {
            ctx.strokeStyle = 'rgba(220,180,80,0.5)'; ctx.lineWidth = 2
            ctx.beginPath(); ctx.moveTo(toX(0), toY(maxP)); ctx.lineTo(toX(0), toY(0)); ctx.lineTo(toX(maxQ), toY(0)); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.7)'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(xLabel, pad + gW / 2, H - 15)
            ctx.save(); ctx.translate(18, H / 2 - 20); ctx.rotate(-Math.PI / 2); ctx.fillText(yLabel, 0, 0); ctx.restore()
            ctx.font = '10px system-ui'; ctx.fillStyle = 'rgba(220,180,80,0.4)'
            for (let q = 10; q <= maxQ; q += 10) { ctx.textAlign = 'center'; ctx.fillText(q.toString(), toX(q), toY(0) + 14) }
            for (let p = 20; p <= maxP; p += 20) { ctx.textAlign = 'right'; ctx.fillText('$' + p, toX(0) - 6, toY(p) + 4) }
        }

        function drawAxesPartial(ctx: CanvasRenderingContext2D, padL: number, gW: number, _gH: number, toX: (q: number) => number, toY: (p: number) => number, maxQ: number, maxP: number, H: number, xLabel: string) {
            ctx.strokeStyle = 'rgba(220,180,80,0.5)'; ctx.lineWidth = 2
            ctx.beginPath(); ctx.moveTo(toX(0), toY(maxP)); ctx.lineTo(toX(0), toY(0)); ctx.lineTo(toX(maxQ), toY(0)); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.6)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(xLabel, padL + gW / 2, H - 15)
            ctx.font = '9px system-ui'; ctx.fillStyle = 'rgba(220,180,80,0.35)'
            for (let q = 10; q <= maxQ; q += 10) { ctx.textAlign = 'center'; ctx.fillText(q.toString(), toX(q), toY(0) + 12) }
            for (let p = 40; p <= maxP; p += 40) { ctx.textAlign = 'right'; ctx.fillText('$' + p, toX(0) - 4, toY(p) + 3) }
        }

        return () => window.removeEventListener('resize', resize)
    }, [degree, numTiers, marketSplit, showSurplus, qStar, pStar, mcStar, qCompetitive])

    const degreeLabel = degree === 'none' ? 'Single-Price Monopoly' : degree === 'first' ? '1st Degree (Perfect)' : degree === 'second' ? '2nd Degree (Quantity)' : '3rd Degree (Market Seg.)'

    const equations = useMemo(() => {
        if (degree === 'first') return [
            { label: '1st', expression: 'P = WTP for each unit', description: 'Perfect discrimination' },
            { label: 'DWL', expression: 'DWL = 0', description: 'No deadweight loss' },
            { label: 'Output', expression: 'Q = Qc (competitive)', description: 'Allocatively efficient quantity' },
        ]
        if (degree === 'third') return [
            { label: 'Rule', expression: 'MR\u2081 = MR\u2082 = MC', description: 'Profit max across markets' },
            { label: 'Price', expression: 'P(inelastic) > P(elastic)', description: 'Higher price where demand is less elastic' },
        ]
        return [
            { label: 'Monopoly', expression: 'MR = MC \u2192 Qm, Pm', description: 'Profit-maximizing rule' },
            { label: 'DWL', expression: 'DWL > 0', description: 'Underproduction vs competitive' },
        ]
    }, [degree])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Discrimination Type">
                            <ButtonGroup value={degree} onChange={v => setDegree(v as Degree)} options={[
                                { value: 'none', label: 'None' },
                                { value: 'first', label: '1st' },
                                { value: 'second', label: '2nd' },
                                { value: 'third', label: '3rd' },
                            ]} color={GOLD} />
                        </ControlGroup>
                        {degree === 'second' && (
                            <Slider label="Price Tiers" value={numTiers} onChange={setNumTiers} min={2} max={5} step={1} />
                        )}
                        {degree === 'third' && (
                            <Slider label="Elasticity Split" value={marketSplit} onChange={setMarketSplit} min={0.3} max={0.7} step={0.05} />
                        )}
                        <Toggle label="Show Surplus" value={showSurplus} onChange={setShowSurplus} />
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={() => { setDegree('none'); setShowSurplus(true); setNumTiers(3); setMarketSplit(0.5) }} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Microeconomics" unit="Unit 4" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title={degreeLabel} items={[
                        { label: 'Type', value: degreeLabel, color: GOLD },
                        { label: 'Total Revenue', value: `$${surplus.tr.toFixed(0)}`, color: 'rgba(220,180,80,1)' },
                        { label: 'Consumer Surplus', value: `$${surplus.cs.toFixed(0)}`, color: 'rgba(100,180,255,1)' },
                        { label: 'Producer Surplus', value: `$${surplus.ps.toFixed(0)}`, color: 'rgba(255,160,80,1)' },
                        { label: 'Deadweight Loss', value: `$${surplus.dwl.toFixed(0)}`, color: degree === 'first' ? 'rgba(80,200,120,1)' : 'rgba(255,80,80,1)' },
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={equations} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
