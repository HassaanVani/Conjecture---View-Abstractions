import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type Scenario = 'recession' | 'inflation' | 'neutral' | 'auto-stabilizer'

const GOLD = 'rgb(220, 180, 80)'

export default function FiscalPolicy() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const [govSpending, setGovSpending] = useState(0)
    const [taxChange, setTaxChange] = useState(0)
    const [mpc, setMpc] = useState(0.75)
    const [showCrowdingOut, setShowCrowdingOut] = useState(false)
    const [showMultiplier, setShowMultiplier] = useState(true)
    const [scenario, setScenario] = useState<Scenario>('neutral')
    const [animProgress, setAnimProgress] = useState(1)

    const spendingMultiplier = 1 / (1 - mpc)
    const taxMultiplier = -mpc / (1 - mpc)
    const deltaY_G = spendingMultiplier * govSpending
    const deltaY_T = taxMultiplier * taxChange
    const totalDeltaY = deltaY_G + deltaY_T
    const crowdingOutOffset = showCrowdingOut ? Math.abs(govSpending) * 0.3 : 0
    const netDeltaY = totalDeltaY - (totalDeltaY > 0 ? crowdingOutOffset : -crowdingOutOffset)
    const interestRateEffect = showCrowdingOut ? Math.abs(govSpending) * 0.15 : 0

    const applyScenario = useCallback((s: Scenario) => {
        setScenario(s)
        setAnimProgress(0)
        if (s === 'recession') {
            setGovSpending(40); setTaxChange(-20); setMpc(0.75)
            setShowCrowdingOut(false); setShowMultiplier(true)
        } else if (s === 'inflation') {
            setGovSpending(-30); setTaxChange(25); setMpc(0.75)
            setShowCrowdingOut(false); setShowMultiplier(true)
        } else if (s === 'auto-stabilizer') {
            setGovSpending(20); setTaxChange(-15); setMpc(0.8)
            setShowCrowdingOut(true); setShowMultiplier(true)
        } else {
            setGovSpending(0); setTaxChange(0); setMpc(0.75)
            setShowCrowdingOut(false); setShowMultiplier(true)
        }
    }, [])

    // Animate transitions
    useEffect(() => {
        if (animProgress >= 1) return
        const start = performance.now()
        const duration = 800
        const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1)
            setAnimProgress(t * t * (3 - 2 * t)) // smoothstep
            if (t < 1) animRef.current = requestAnimationFrame(tick)
        }
        animRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animRef.current)
    }, [govSpending, taxChange, showCrowdingOut, showMultiplier, scenario])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'Fiscal Policy', description: 'Government uses spending and taxes to influence aggregate demand. This shifts the AD curve in the AD-AS model.', setup: () => applyScenario('neutral') },
        { title: 'Spending Multiplier', description: 'Each $1 of government spending creates more than $1 of GDP. Multiplier = 1/(1-MPC). With MPC=0.75, multiplier = 4.', setup: () => { setGovSpending(25); setTaxChange(0); setMpc(0.75); setShowMultiplier(true); setShowCrowdingOut(false); setScenario('neutral'); setAnimProgress(0) } },
        { title: 'Tax Multiplier', description: 'Tax cuts also boost AD, but with a smaller multiplier: -MPC/(1-MPC). Tax multiplier is always smaller than spending multiplier.', setup: () => { setGovSpending(0); setTaxChange(-25); setMpc(0.75); setShowMultiplier(true); setShowCrowdingOut(false); setScenario('neutral'); setAnimProgress(0) } },
        { title: 'Expansionary Policy', description: 'In a recession, increase G and/or cut taxes. AD shifts right, increasing output and price level. The recessionary gap closes.', setup: () => applyScenario('recession') },
        { title: 'Contractionary Policy', description: 'During inflation, decrease G and/or raise taxes. AD shifts left, reducing output and price level.', setup: () => applyScenario('inflation') },
        { title: 'Crowding Out', description: 'Deficit spending increases demand for loanable funds, raising interest rates. Higher rates reduce private investment, partially offsetting fiscal stimulus.', setup: () => { setGovSpending(40); setTaxChange(0); setMpc(0.75); setShowCrowdingOut(true); setShowMultiplier(true); setScenario('neutral'); setAnimProgress(0) } },
        { title: 'Automatic Stabilizers', description: 'Progressive taxes and transfer payments adjust automatically. In recession, tax revenue falls and transfers rise, cushioning the downturn without legislation.', setup: () => applyScenario('auto-stabilizer') },
        { title: 'Experiment', description: 'Adjust government spending, taxes, and MPC. Toggle crowding out and multiplier effects. Observe how the AD-AS and loanable funds markets respond.', setup: () => applyScenario('neutral') },
    ], [applyScenario])

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
        const midX = W / 2
        ctx.fillStyle = '#1a150a'; ctx.fillRect(0, 0, W, H)

        // Divider
        ctx.strokeStyle = 'rgba(220,180,80,0.15)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(midX, 20); ctx.lineTo(midX, H - 20); ctx.stroke()

        // Shared layout constants
        const pad = 60, topPad = 55, botPad = 55
        const ap = animProgress

        // ============ LEFT PANEL: AD-AS ============
        const lW = midX - pad * 2, lH = H - topPad - botPad - pad
        const lx0 = pad, ly0 = topPad, lx1 = lx0 + lW, ly1 = ly0 + lH
        const toAX = (v: number) => lx0 + (v / 400) * lW
        const toAY = (v: number) => ly1 - (v / 200) * lH

        // Panel title
        ctx.fillStyle = 'rgba(220,180,80,0.7)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('AD-AS Model', lx0 + lW / 2, ly0 - 15)

        // Grid
        ctx.strokeStyle = 'rgba(220,180,80,0.05)'; ctx.lineWidth = 1
        for (let v = 0; v <= 400; v += 50) { ctx.beginPath(); ctx.moveTo(toAX(v), ly0); ctx.lineTo(toAX(v), ly1); ctx.stroke() }
        for (let v = 0; v <= 200; v += 25) { ctx.beginPath(); ctx.moveTo(lx0, toAY(v)); ctx.lineTo(lx1, toAY(v)); ctx.stroke() }

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(lx0, ly0); ctx.lineTo(lx0, ly1); ctx.lineTo(lx1, ly1); ctx.stroke()
        ctx.fillStyle = 'rgba(220,180,80,0.7)'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('Real GDP (Y)', lx0 + lW / 2, ly1 + 35)
        ctx.save(); ctx.translate(lx0 - 35, ly0 + lH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Price Level (PL)', 0, 0); ctx.restore()

        // Ticks
        ctx.font = '9px system-ui'; ctx.fillStyle = 'rgba(220,180,80,0.4)'
        for (let v = 50; v <= 350; v += 50) { ctx.textAlign = 'center'; ctx.fillText(String(v), toAX(v), ly1 + 14) }
        for (let v = 25; v <= 175; v += 25) { ctx.textAlign = 'right'; ctx.fillText(String(v), lx0 - 8, toAY(v) + 3) }

        // LRAS (vertical at Y=200)
        const lrasY = 200
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([8, 4])
        ctx.beginPath(); ctx.moveTo(toAX(lrasY), ly0 + 5); ctx.lineTo(toAX(lrasY), ly1 - 5); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('LRAS', toAX(lrasY), ly0 + 18)
        ctx.font = '9px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.fillText('Yf = 200', toAX(lrasY), ly0 + 30)

        // SRAS: upward sloping PL = 30 + 0.35*Y
        const srasSlope = 0.35, srasInt = 30
        ctx.strokeStyle = 'rgba(100,200,150,0.8)'; ctx.lineWidth = 2.5; ctx.beginPath()
        for (let y = 50; y <= 350; y += 2) {
            const pl = srasInt + srasSlope * y
            if (pl < 0 || pl > 200) continue
            if (y === 50) ctx.moveTo(toAX(y), toAY(pl)); else ctx.lineTo(toAX(y), toAY(pl))
        }
        ctx.stroke()
        ctx.fillStyle = 'rgba(100,200,150,0.9)'; ctx.font = 'bold 12px system-ui'
        ctx.fillText('SRAS', toAX(340), toAY(srasInt + srasSlope * 340) - 10)

        // AD curve: PL = adIntercept - 0.4*Y
        const baseAdInt = 180
        const adShiftInitial = (govSpending - taxChange * mpc) * 0.5
        const adShiftMultiplied = showMultiplier ? (deltaY_G + deltaY_T) * 0.3 : adShiftInitial
        const adShiftFinal = adShiftMultiplied * ap
        const adSlope = 0.4

        // Original AD (dashed if shifted)
        if (Math.abs(adShiftFinal) > 1) {
            ctx.strokeStyle = 'rgba(255,100,100,0.25)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.beginPath()
            for (let y = 30; y <= 380; y += 2) {
                const pl = baseAdInt - adSlope * y
                if (pl < 0 || pl > 200) continue
                if (y === 30) ctx.moveTo(toAX(y), toAY(pl)); else ctx.lineTo(toAX(y), toAY(pl))
            }
            ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,100,100,0.35)'; ctx.font = '10px system-ui'
            ctx.fillText('AD₀', toAX(60), toAY(baseAdInt - adSlope * 60) - 8)
        }

        // Shifted AD
        const adInt = baseAdInt + adShiftFinal
        const adGrad = ctx.createLinearGradient(toAX(30), 0, toAX(350), 0)
        adGrad.addColorStop(0, 'rgba(255,100,100,0.9)'); adGrad.addColorStop(1, 'rgba(255,150,80,0.9)')
        ctx.strokeStyle = adGrad; ctx.lineWidth = 3; ctx.beginPath()
        for (let y = 30; y <= 380; y += 2) {
            const pl = adInt - adSlope * y
            if (pl < 0 || pl > 200) continue
            if (y === 30) ctx.moveTo(toAX(y), toAY(pl)); else ctx.lineTo(toAX(y), toAY(pl))
        }
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,120,80,0.9)'; ctx.font = 'bold 12px system-ui'
        const adLabelY = Math.min(380, Math.max(30, (adInt) / adSlope - 30))
        ctx.fillText(Math.abs(adShiftFinal) > 1 ? 'AD₁' : 'AD', toAX(adLabelY > 300 ? 300 : 80), toAY(adInt - adSlope * (adLabelY > 300 ? 300 : 80)) - 10)

        // Crowding out AD (partial offset)
        if (showCrowdingOut && Math.abs(adShiftFinal) > 1) {
            const coOffset = crowdingOutOffset * 0.3 * ap
            const adIntCO = adInt - (totalDeltaY > 0 ? coOffset : -coOffset)
            ctx.strokeStyle = 'rgba(255,200,50,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath()
            for (let y = 30; y <= 380; y += 2) {
                const pl = adIntCO - adSlope * y
                if (pl < 0 || pl > 200) continue
                if (y === 30) ctx.moveTo(toAX(y), toAY(pl)); else ctx.lineTo(toAX(y), toAY(pl))
            }
            ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,200,50,0.7)'; ctx.font = '10px system-ui'
            ctx.fillText('AD (net)', toAX(80), toAY(adIntCO - adSlope * 80) - 8)
        }

        // Equilibrium point (AD intersects SRAS): srasInt + srasSlope*Y = adInt - adSlope*Y
        const eqY = (adInt - srasInt) / (srasSlope + adSlope)
        const eqPL = srasInt + srasSlope * eqY
        if (eqY > 0 && eqY < 400 && eqPL > 0 && eqPL < 200) {
            const ex = toAX(eqY), ey = toAY(eqPL)
            const glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 20)
            glow.addColorStop(0, 'rgba(220,180,80,0.4)'); glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(ex, ey, 20, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill()
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke()
            // Dashed lines to axes
            ctx.strokeStyle = 'rgba(220,180,80,0.25)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex, ly1); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(lx0, ey); ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'
            ctx.fillText(`Y=${eqY.toFixed(0)}`, ex, ly1 + 24)
            ctx.textAlign = 'right'
            ctx.fillText(`PL=${eqPL.toFixed(0)}`, lx0 - 2, ey - 6)
        }

        // Shift arrow
        if (Math.abs(adShiftFinal) > 5) {
            const arrowY = 150, arrowPL = baseAdInt - adSlope * arrowY
            const arrowPL2 = adInt - adSlope * arrowY
            if (arrowPL > 5 && arrowPL < 195 && arrowPL2 > 5 && arrowPL2 < 195) {
                const ax1 = toAX(arrowY), ay1 = toAY(arrowPL), ay2 = toAY(arrowPL2)
                ctx.strokeStyle = 'rgba(220,180,80,0.6)'; ctx.lineWidth = 2
                ctx.beginPath(); ctx.moveTo(ax1, ay1); ctx.lineTo(ax1, ay2); ctx.stroke()
                const dir = ay2 < ay1 ? -1 : 1
                ctx.beginPath(); ctx.moveTo(ax1, ay2); ctx.lineTo(ax1 - 5, ay2 - dir * 8); ctx.moveTo(ax1, ay2); ctx.lineTo(ax1 + 5, ay2 - dir * 8); ctx.stroke()
            }
        }

        // ============ RIGHT PANEL: Loanable Funds ============
        const rx0 = midX + pad, rW = W - midX - pad * 2, rH = lH
        const ry0 = topPad, ry1 = ry0 + rH
        const toRX = (v: number) => rx0 + (v / 500) * rW
        const toRY = (v: number) => ry1 - (v / 12) * rH

        // Panel title
        ctx.fillStyle = 'rgba(220,180,80,0.7)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('Loanable Funds Market', rx0 + rW / 2, ry0 - 15)

        // Grid
        ctx.strokeStyle = 'rgba(220,180,80,0.05)'; ctx.lineWidth = 1
        for (let v = 0; v <= 500; v += 50) { ctx.beginPath(); ctx.moveTo(toRX(v), ry0); ctx.lineTo(toRX(v), ry1); ctx.stroke() }
        for (let v = 0; v <= 12; v += 2) { ctx.beginPath(); ctx.moveTo(rx0, toRY(v)); ctx.lineTo(rx0 + rW, toRY(v)); ctx.stroke() }

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(rx0, ry0); ctx.lineTo(rx0, ry1); ctx.lineTo(rx0 + rW, ry1); ctx.stroke()
        ctx.fillStyle = 'rgba(220,180,80,0.7)'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('Quantity of Loanable Funds', rx0 + rW / 2, ry1 + 35)
        ctx.save(); ctx.translate(rx0 - 35, ry0 + rH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Real Interest Rate (%)', 0, 0); ctx.restore()

        // Ticks
        ctx.font = '9px system-ui'; ctx.fillStyle = 'rgba(220,180,80,0.4)'
        for (let v = 100; v <= 400; v += 100) { ctx.textAlign = 'center'; ctx.fillText(String(v), toRX(v), ry1 + 14) }
        for (let v = 2; v <= 10; v += 2) { ctx.textAlign = 'right'; ctx.fillText(v + '%', rx0 - 8, toRY(v) + 3) }

        // Supply of loanable funds (upward sloping): r = 1 + 0.02*Q
        const slSupply = 0.02, slInt = 1
        ctx.strokeStyle = 'rgba(100,200,150,0.8)'; ctx.lineWidth = 2.5; ctx.beginPath()
        for (let q = 20; q <= 480; q += 2) {
            const r = slInt + slSupply * q
            if (r < 0 || r > 12) continue
            if (q === 20) ctx.moveTo(toRX(q), toRY(r)); else ctx.lineTo(toRX(q), toRY(r))
        }
        ctx.stroke()
        ctx.fillStyle = 'rgba(100,200,150,0.9)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left'
        ctx.fillText('S (LF)', toRX(430), toRY(slInt + slSupply * 430) - 8)

        // Demand for loanable funds (downward sloping): r = 10 - 0.02*Q
        const baseDlInt = 10, dlSlope = 0.02
        const dlShift = showCrowdingOut ? Math.abs(govSpending) * 0.8 * ap : 0

        // Original demand (dashed if shifted)
        if (dlShift > 2) {
            ctx.strokeStyle = 'rgba(100,150,255,0.25)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.beginPath()
            for (let q = 20; q <= 480; q += 2) {
                const r = baseDlInt - dlSlope * q
                if (r < 0 || r > 12) continue
                if (q === 20) ctx.moveTo(toRX(q), toRY(r)); else ctx.lineTo(toRX(q), toRY(r))
            }
            ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(100,150,255,0.3)'; ctx.font = '10px system-ui'; ctx.textAlign = 'left'
            ctx.fillText('D₀', toRX(420), toRY(baseDlInt - dlSlope * 420) + 15)
        }

        // Shifted demand
        const dlInt = baseDlInt + dlShift * 0.02
        const dlGrad = ctx.createLinearGradient(toRX(20), 0, toRX(450), 0)
        dlGrad.addColorStop(0, 'rgba(100,150,255,0.9)'); dlGrad.addColorStop(1, 'rgba(150,100,255,0.9)')
        ctx.strokeStyle = dlGrad; ctx.lineWidth = 2.5; ctx.beginPath()
        for (let q = 20; q <= 480; q += 2) {
            const r = dlInt - dlSlope * q
            if (r < 0 || r > 12) continue
            if (q === 20) ctx.moveTo(toRX(q), toRY(r)); else ctx.lineTo(toRX(q), toRY(r))
        }
        ctx.stroke()
        ctx.fillStyle = 'rgba(100,150,255,0.9)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left'
        ctx.fillText(dlShift > 2 ? 'D₁ (LF)' : 'D (LF)', toRX(20), toRY(dlInt - dlSlope * 20) - 10)

        // Equilibrium: slInt + slSupply*Q = dlInt - dlSlope*Q => Q = (dlInt-slInt)/(slSupply+dlSlope)
        const lfEqQ = (dlInt - slInt) / (slSupply + dlSlope)
        const lfEqR = slInt + slSupply * lfEqQ
        if (lfEqQ > 0 && lfEqQ < 500 && lfEqR > 0 && lfEqR < 12) {
            const rex = toRX(lfEqQ), rey = toRY(lfEqR)
            const glow = ctx.createRadialGradient(rex, rey, 0, rex, rey, 20)
            glow.addColorStop(0, 'rgba(220,180,80,0.4)'); glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(rex, rey, 20, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(rex, rey, 6, 0, Math.PI * 2); ctx.fill()
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke()
            ctx.strokeStyle = 'rgba(220,180,80,0.25)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(rex, rey); ctx.lineTo(rex, ry1); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(rex, rey); ctx.lineTo(rx0, rey); ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'
            ctx.fillText(`Q=${lfEqQ.toFixed(0)}`, rex, ry1 + 24)
            ctx.textAlign = 'right'
            ctx.fillText(`r=${lfEqR.toFixed(1)}%`, rx0 - 2, rey - 6)
        }

        // Crowding out annotation
        if (showCrowdingOut && govSpending > 5 && ap > 0.5) {
            const baseEqQ = (baseDlInt - slInt) / (slSupply + dlSlope)
            const baseEqR = slInt + slSupply * baseEqQ
            ctx.fillStyle = `rgba(255,200,50,${0.7 * ap})`; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
            const annotX = rx0 + rW / 2, annotY = ry0 + 20
            ctx.fillText(`r rises: ${baseEqR.toFixed(1)}% -> ${lfEqR.toFixed(1)}%`, annotX, annotY)
            ctx.fillText('Private investment crowded out', annotX, annotY + 14)
        }

        // Auto-stabilizer annotation
        if (scenario === 'auto-stabilizer' && ap > 0.3) {
            ctx.fillStyle = `rgba(220,180,80,${0.6 * ap})`; ctx.font = '11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Automatic: Taxes fall + Transfers rise', lx0 + lW / 2, ly1 + 48)
        }

        return () => window.removeEventListener('resize', resize)
    }, [govSpending, taxChange, mpc, showCrowdingOut, showMultiplier, scenario, animProgress, totalDeltaY, deltaY_G, deltaY_T, crowdingOutOffset])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Scenario">
                            <ButtonGroup value={scenario} onChange={v => applyScenario(v as Scenario)} options={[
                                { value: 'neutral', label: 'Neutral' },
                                { value: 'recession', label: 'Recession' },
                                { value: 'inflation', label: 'Inflation' },
                                { value: 'auto-stabilizer', label: 'Auto' },
                            ]} color={GOLD} />
                        </ControlGroup>
                        <Slider label="Gov Spending (ΔG)" value={govSpending} onChange={v => { setGovSpending(v); setScenario('neutral'); setAnimProgress(0) }} min={-50} max={50} step={5} />
                        <Slider label="Tax Change (ΔT)" value={taxChange} onChange={v => { setTaxChange(v); setScenario('neutral'); setAnimProgress(0) }} min={-50} max={50} step={5} />
                        <Slider label="MPC" value={mpc} onChange={v => { setMpc(v); setScenario('neutral') }} min={0.5} max={0.9} step={0.05} />
                        <Toggle label="Crowding Out" value={showCrowdingOut} onChange={v => { setShowCrowdingOut(v); setAnimProgress(0) }} />
                        <Toggle label="Show Multiplier" value={showMultiplier} onChange={v => { setShowMultiplier(v); setAnimProgress(0) }} />
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={() => applyScenario('neutral')} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 3" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title="Fiscal Impact" items={[
                        { label: 'Multiplier (G)', value: spendingMultiplier.toFixed(2), color: 'rgba(255,120,80,1)' },
                        { label: 'Multiplier (T)', value: taxMultiplier.toFixed(2), color: 'rgba(100,150,255,1)' },
                        { label: 'Initial ΔG', value: `${govSpending > 0 ? '+' : ''}${govSpending}`, color: 'rgba(100,200,150,1)' },
                        { label: 'Initial ΔT', value: `${taxChange > 0 ? '+' : ''}${taxChange}`, color: 'rgba(100,200,150,1)' },
                        { label: 'Total ΔY', value: `${totalDeltaY > 0 ? '+' : ''}${totalDeltaY.toFixed(1)}`, color: GOLD },
                        { label: 'Interest Rate', value: showCrowdingOut ? `+${interestRateEffect.toFixed(1)}%` : 'N/A', color: 'rgba(255,200,50,1)' },
                        { label: 'Net ΔY', value: showCrowdingOut ? `${netDeltaY > 0 ? '+' : ''}${netDeltaY.toFixed(1)}` : `${totalDeltaY > 0 ? '+' : ''}${totalDeltaY.toFixed(1)}`, color: 'rgba(220,180,80,1)' },
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'Spend Mult', expression: `1/(1-MPC) = ${spendingMultiplier.toFixed(2)}`, description: 'Government spending multiplier' },
                        { label: 'Tax Mult', expression: `-MPC/(1-MPC) = ${taxMultiplier.toFixed(2)}`, description: 'Tax multiplier (smaller)' },
                        { label: 'ΔY', expression: `mult × ΔG = ${deltaY_G.toFixed(1)}`, description: 'Change in GDP from spending' },
                        { label: 'Crowding', expression: 'ΔG → ↑r → ↓I', description: 'Partial offset of fiscal stimulus' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
