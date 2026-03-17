import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type FedAction = 'none' | 'buy-bonds' | 'sell-bonds' | 'lower-rr' | 'raise-rr' | 'lower-dr' | 'raise-dr'

interface ActionInfo {
    name: string
    msShift: number
    description: string
    tool: string
}

const GOLD = 'rgb(220, 180, 80)'

const ACTIONS: Record<FedAction, ActionInfo> = {
    none: { name: 'No Action', msShift: 0, description: 'No Fed intervention.', tool: 'None' },
    'buy-bonds': { name: 'Buy Bonds (OMO)', msShift: 1, description: 'Fed buys bonds, injects reserves into banking system.', tool: 'Open Market Operations' },
    'sell-bonds': { name: 'Sell Bonds (OMO)', msShift: -1, description: 'Fed sells bonds, drains reserves from banking system.', tool: 'Open Market Operations' },
    'lower-rr': { name: 'Lower Reserve Req.', msShift: 1, description: 'Lower RR raises money multiplier, banks lend more.', tool: 'Reserve Requirements' },
    'raise-rr': { name: 'Raise Reserve Req.', msShift: -1, description: 'Higher RR lowers money multiplier, banks lend less.', tool: 'Reserve Requirements' },
    'lower-dr': { name: 'Lower Discount Rate', msShift: 1, description: 'Cheaper Fed lending encourages bank borrowing.', tool: 'Discount Rate' },
    'raise-dr': { name: 'Raise Discount Rate', msShift: -1, description: 'Costlier Fed lending discourages bank borrowing.', tool: 'Discount Rate' },
}

export default function MonetaryPolicy() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const [fedAction, setFedAction] = useState<FedAction>('none')
    const [showTransmission, setShowTransmission] = useState(true)
    const [quantityTheory, setQuantityTheory] = useState(false)
    const [animStep, setAnimStep] = useState(0) // 0-3: which panels are "activated"
    const [animProgress, setAnimProgress] = useState(0)

    const actionInfo = ACTIONS[fedAction]
    const moneySupplyShift = actionInfo.msShift
    const isExpansionary = moneySupplyShift > 0
    const isContractionary = moneySupplyShift < 0

    // Derived values
    const baseRate = 5
    const newRate = baseRate - moneySupplyShift * 2
    const baseInvestment = 50
    const investmentChange = -(newRate - baseRate) * 8
    const newInvestment = baseInvestment + investmentChange
    const adShift = investmentChange * 0.6

    // Animate step progression when action changes
    useEffect(() => {
        if (fedAction === 'none') { setAnimStep(0); setAnimProgress(0); return }
        setAnimStep(0); setAnimProgress(0)
        const timers = [
            setTimeout(() => setAnimStep(1), 600),
            setTimeout(() => setAnimStep(2), 1200),
            setTimeout(() => setAnimStep(3), 1800),
        ]
        return () => timers.forEach(clearTimeout)
    }, [fedAction])

    // Smooth animation progress
    useEffect(() => {
        const interval = setInterval(() => {
            setAnimProgress(p => Math.min(p + 0.04, 1))
        }, 16)
        return () => clearInterval(interval)
    }, [animStep])
    useEffect(() => setAnimProgress(0), [animStep])

    const applyAction = useCallback((a: FedAction) => setFedAction(a), [])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'The Federal Reserve', description: 'The Fed controls monetary policy to stabilize prices and maximize employment. It uses three main tools to influence the money supply and interest rates.', setup: () => { setFedAction('none'); setShowTransmission(true); setQuantityTheory(false) } },
        { title: 'Open Market Operations', description: 'The Fed\'s MOST COMMON tool. Buying bonds injects money (expansionary). Selling bonds drains money (contractionary). This directly changes bank reserves.', setup: () => { setFedAction('buy-bonds'); setShowTransmission(true); setQuantityTheory(false) }, highlight: 'OMO is used daily by the Fed' },
        { title: 'Reserve Requirements', description: 'The required reserve ratio determines how much banks must hold vs. lend. Lowering it increases the money multiplier. This tool is rarely used but very powerful.', setup: () => { setFedAction('lower-rr'); setShowTransmission(true); setQuantityTheory(false) } },
        { title: 'Discount Rate', description: 'The rate the Fed charges banks for short-term loans. Lowering it makes borrowing cheaper, expanding reserves. Raising it does the opposite.', setup: () => { setFedAction('lower-dr'); setShowTransmission(true); setQuantityTheory(false) } },
        { title: 'Expansionary Policy', description: 'Buy bonds / lower RR / lower DR --> Ms UP --> interest rate DOWN --> Investment UP --> AD shifts RIGHT --> output rises, price level rises. Used to fight recessions.', setup: () => { setFedAction('buy-bonds'); setShowTransmission(true); setQuantityTheory(false) }, highlight: 'Watch the chain: Ms -> r -> I -> AD' },
        { title: 'Contractionary Policy', description: 'Sell bonds / raise RR / raise DR --> Ms DOWN --> interest rate UP --> Investment DOWN --> AD shifts LEFT --> output falls, price level falls. Used to fight inflation.', setup: () => { setFedAction('sell-bonds'); setShowTransmission(true); setQuantityTheory(false) }, highlight: 'The opposite chain tightens the economy' },
        { title: 'Money & Inflation (MV=PQ)', description: 'The Quantity Theory of Money: M x V = P x Q. If velocity (V) is constant and Q is at full employment, increasing M directly raises P. Monetarist view of inflation.', setup: () => { setFedAction('none'); setShowTransmission(false); setQuantityTheory(true) } },
        { title: 'Experiment', description: 'Select different Fed actions and watch the transmission mechanism flow through all three graphs. Toggle the quantity theory view for a monetarist perspective.', setup: () => { setFedAction('none'); setShowTransmission(true); setQuantityTheory(false) } },
    ], [])

    const demo = useDemoMode(demoSteps)

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
            ctx.fillStyle = '#1a150a'
            ctx.fillRect(0, 0, w, h)

            const panelGap = 20
            const topPad = 60
            const bottomPad = 70
            const sidePad = 40
            const usableW = w - sidePad * 2 - panelGap * 2
            const panelW = usableW / 3
            const panelH = h - topPad - bottomPad - 50

            const panels = [
                { x: sidePad, y: topPad, w: panelW, h: panelH, title: 'Money Market' },
                { x: sidePad + panelW + panelGap, y: topPad, w: panelW, h: panelH, title: 'Investment' },
                { x: sidePad + (panelW + panelGap) * 2, y: topPad, w: panelW, h: panelH, title: 'AD-AS' },
            ]

            // Panel backgrounds
            panels.forEach((p, idx) => {
                const active = fedAction !== 'none' && animStep >= idx
                ctx.fillStyle = active ? 'rgba(220, 180, 80, 0.03)' : 'rgba(255,255,255,0.01)'
                ctx.strokeStyle = active ? 'rgba(220, 180, 80, 0.2)' : 'rgba(255,255,255,0.08)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.roundRect(p.x, p.y, p.w, p.h, 8)
                ctx.fill()
                ctx.stroke()
                ctx.fillStyle = active ? 'rgba(220, 180, 80, 0.9)' : 'rgba(255,255,255,0.5)'
                ctx.font = 'bold 13px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(p.title, p.x + p.w / 2, p.y + 20)
            })

            // === Panel 1: Money Market ===
            const p1 = panels[0]
            const m1Pad = 45
            const m1W = p1.w - m1Pad * 2
            const m1H = p1.h - m1Pad - 50
            const m1X = (q: number) => p1.x + m1Pad + (q / 200) * m1W
            const m1Y = (i: number) => p1.y + 40 + m1H - (i / 10) * m1H

            // Axes
            ctx.strokeStyle = 'rgba(220,180,80,0.4)'; ctx.lineWidth = 1.5
            ctx.beginPath(); ctx.moveTo(m1X(0), m1Y(10)); ctx.lineTo(m1X(0), m1Y(0)); ctx.lineTo(m1X(200), m1Y(0)); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.6)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Quantity of Money', p1.x + p1.w / 2, m1Y(0) + 25)
            ctx.save(); ctx.translate(p1.x + 14, p1.y + 40 + m1H / 2); ctx.rotate(-Math.PI / 2)
            ctx.fillText('Nom. Interest Rate (i)', 0, 0); ctx.restore()

            // Ms original (vertical)
            const msOrigX = 100
            ctx.strokeStyle = 'rgba(100,200,150,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4])
            ctx.beginPath(); ctx.moveTo(m1X(msOrigX), m1Y(9)); ctx.lineTo(m1X(msOrigX), m1Y(1)); ctx.stroke()
            ctx.setLineDash([])

            // Ms shifted
            const easeProgress = animStep >= 1 ? Math.min(animProgress, 1) : (animStep >= 0 && fedAction !== 'none' ? Math.min(animProgress, 1) : 0)
            const msShifted = msOrigX + moneySupplyShift * 40 * easeProgress
            ctx.strokeStyle = 'rgba(100,200,150,0.9)'; ctx.lineWidth = 2.5
            ctx.beginPath(); ctx.moveTo(m1X(msShifted), m1Y(9)); ctx.lineTo(m1X(msShifted), m1Y(1)); ctx.stroke()
            ctx.fillStyle = 'rgba(100,200,150,0.9)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(fedAction !== 'none' ? 'Ms\u2081' : 'Ms', m1X(msShifted), m1Y(9.5))
            if (fedAction !== 'none') {
                ctx.fillStyle = 'rgba(100,200,150,0.4)'; ctx.font = '10px system-ui'
                ctx.fillText('Ms\u2080', m1X(msOrigX), m1Y(9.5))
            }

            // Md (downward sloping)
            ctx.strokeStyle = 'rgba(255,100,100,0.9)'; ctx.lineWidth = 2.5; ctx.beginPath()
            for (let i = 1; i <= 9; i += 0.2) {
                const q = 180 - 18 * i
                if (q < 0 || q > 200) continue
                if (i === 1) ctx.moveTo(m1X(q), m1Y(i)); else ctx.lineTo(m1X(q), m1Y(i))
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255,100,100,0.9)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left'
            ctx.fillText('Md', m1X(180 - 18 * 1.5) + 4, m1Y(1.5))

            // Equilibrium
            const eqI_orig = (180 - msOrigX) / 18
            const eqI_new = (180 - msShifted) / 18
            if (eqI_new > 0 && eqI_new < 10) {
                ctx.strokeStyle = 'rgba(220,180,80,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
                ctx.beginPath(); ctx.moveTo(m1X(msShifted), m1Y(eqI_new)); ctx.lineTo(m1X(0), m1Y(eqI_new)); ctx.stroke()
                ctx.setLineDash([])
                const pulse = 0.3 + 0.15 * Math.sin(t * 3)
                const glow = ctx.createRadialGradient(m1X(msShifted), m1Y(eqI_new), 0, m1X(msShifted), m1Y(eqI_new), 14)
                glow.addColorStop(0, `rgba(220,180,80,${pulse})`); glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(m1X(msShifted), m1Y(eqI_new), 14, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.beginPath(); ctx.arc(m1X(msShifted), m1Y(eqI_new), 5, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '10px monospace'; ctx.textAlign = 'right'
                ctx.fillText(`i=${eqI_new.toFixed(1)}%`, m1X(0) - 4, m1Y(eqI_new) + 3)
            }

            // === Panel 2: Investment Demand ===
            const p2 = panels[1]
            const m2Pad = 45
            const m2W = p2.w - m2Pad * 2
            const m2H = p2.h - m2Pad - 50
            const m2X = (inv: number) => p2.x + m2Pad + (inv / 100) * m2W
            const m2Y = (i: number) => p2.y + 40 + m2H - (i / 10) * m2H

            // Axes
            ctx.strokeStyle = 'rgba(220,180,80,0.4)'; ctx.lineWidth = 1.5
            ctx.beginPath(); ctx.moveTo(m2X(0), m2Y(10)); ctx.lineTo(m2X(0), m2Y(0)); ctx.lineTo(m2X(100), m2Y(0)); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.6)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Investment (I)', p2.x + p2.w / 2, m2Y(0) + 25)
            ctx.save(); ctx.translate(p2.x + 14, p2.y + 40 + m2H / 2); ctx.rotate(-Math.PI / 2)
            ctx.fillText('Real Interest Rate (r)', 0, 0); ctx.restore()

            // Investment demand curve (downward sloping)
            ctx.strokeStyle = 'rgba(100,150,255,0.9)'; ctx.lineWidth = 2.5; ctx.beginPath()
            for (let i = 1; i <= 9; i += 0.2) {
                const inv = 90 - 8 * i
                if (inv < 0 || inv > 100) continue
                if (i === 1) ctx.moveTo(m2X(inv), m2Y(i)); else ctx.lineTo(m2X(inv), m2Y(i))
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(100,150,255,0.9)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left'
            ctx.fillText('I_d', m2X(90 - 8 * 1.5) + 4, m2Y(1.5))

            // Original rate point
            const origInv = 90 - 8 * eqI_orig
            ctx.fillStyle = 'rgba(220,180,80,0.3)'; ctx.beginPath()
            ctx.arc(m2X(origInv), m2Y(eqI_orig), 4, 0, Math.PI * 2); ctx.fill()

            // New rate point (animated)
            if (animStep >= 1 && fedAction !== 'none') {
                const progI = eqI_orig + (eqI_new - eqI_orig) * Math.min(animProgress, 1)
                const progInv = 90 - 8 * progI
                // Dashed lines to axes
                ctx.strokeStyle = 'rgba(220,180,80,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
                ctx.beginPath()
                ctx.moveTo(m2X(progInv), m2Y(progI)); ctx.lineTo(m2X(progInv), m2Y(0))
                ctx.moveTo(m2X(progInv), m2Y(progI)); ctx.lineTo(m2X(0), m2Y(progI))
                ctx.stroke(); ctx.setLineDash([])

                const pulse = 0.3 + 0.15 * Math.sin(t * 3)
                const glow = ctx.createRadialGradient(m2X(progInv), m2Y(progI), 0, m2X(progInv), m2Y(progI), 14)
                glow.addColorStop(0, `rgba(220,180,80,${pulse})`); glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(m2X(progInv), m2Y(progI), 14, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.beginPath(); ctx.arc(m2X(progInv), m2Y(progI), 5, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '10px monospace'
                ctx.textAlign = 'center'; ctx.fillText(`I=${progInv.toFixed(0)}`, m2X(progInv), m2Y(0) + 15)
                ctx.textAlign = 'right'; ctx.fillText(`r=${progI.toFixed(1)}%`, m2X(0) - 4, m2Y(progI) + 3)
            } else {
                ctx.strokeStyle = 'rgba(220,180,80,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
                ctx.beginPath()
                ctx.moveTo(m2X(origInv), m2Y(eqI_orig)); ctx.lineTo(m2X(origInv), m2Y(0))
                ctx.moveTo(m2X(origInv), m2Y(eqI_orig)); ctx.lineTo(m2X(0), m2Y(eqI_orig))
                ctx.stroke(); ctx.setLineDash([])
                ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '10px monospace'
                ctx.textAlign = 'center'; ctx.fillText(`I=${origInv.toFixed(0)}`, m2X(origInv), m2Y(0) + 15)
                ctx.textAlign = 'right'; ctx.fillText(`r=${eqI_orig.toFixed(1)}%`, m2X(0) - 4, m2Y(eqI_orig) + 3)
            }

            // === Panel 3: AD-AS ===
            const p3 = panels[2]
            const m3Pad = 45
            const m3W = p3.w - m3Pad * 2
            const m3H = p3.h - m3Pad - 50
            const m3X = (y: number) => p3.x + m3Pad + (y / 100) * m3W
            const m3Y = (p: number) => p3.y + 40 + m3H - (p / 100) * m3H

            // Axes
            ctx.strokeStyle = 'rgba(220,180,80,0.4)'; ctx.lineWidth = 1.5
            ctx.beginPath(); ctx.moveTo(m3X(0), m3Y(100)); ctx.lineTo(m3X(0), m3Y(0)); ctx.lineTo(m3X(100), m3Y(0)); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.6)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Real GDP (Y)', p3.x + p3.w / 2, m3Y(0) + 25)
            ctx.save(); ctx.translate(p3.x + 14, p3.y + 40 + m3H / 2); ctx.rotate(-Math.PI / 2)
            ctx.fillText('Price Level (PL)', 0, 0); ctx.restore()

            // LRAS (vertical)
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4])
            ctx.beginPath(); ctx.moveTo(m3X(50), m3Y(85)); ctx.lineTo(m3X(50), m3Y(15)); ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('LRAS', m3X(50), m3Y(88))

            // SRAS (upward sloping)
            ctx.strokeStyle = 'rgba(100,200,150,0.8)'; ctx.lineWidth = 2.5; ctx.beginPath()
            for (let p = 20; p <= 80; p += 1) { const y = 15 + p * 0.75; if (p === 20) ctx.moveTo(m3X(y), m3Y(p)); else ctx.lineTo(m3X(y), m3Y(p)) }
            ctx.stroke()
            ctx.fillStyle = 'rgba(100,200,150,0.9)'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'left'
            ctx.fillText('SRAS', m3X(15 + 80 * 0.75) + 4, m3Y(80))

            // AD original
            ctx.strokeStyle = 'rgba(255,100,100,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4])
            ctx.beginPath()
            for (let p = 20; p <= 80; p += 1) { const y = 90 - p * 0.75; if (p === 20) ctx.moveTo(m3X(y), m3Y(p)); else ctx.lineTo(m3X(y), m3Y(p)) }
            ctx.stroke(); ctx.setLineDash([])

            // AD shifted (animated)
            const adAnimShift = animStep >= 2 && fedAction !== 'none' ? adShift * Math.min(animProgress, 1) : 0
            ctx.strokeStyle = 'rgba(255,100,100,0.9)'; ctx.lineWidth = 2.5; ctx.beginPath()
            for (let p = 20; p <= 80; p += 1) { const y = 90 + adAnimShift - p * 0.75; if (y < 0 || y > 100) continue; if (p === 20) ctx.moveTo(m3X(y), m3Y(p)); else ctx.lineTo(m3X(y), m3Y(p)) }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255,100,100,0.9)'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'right'
            const adLabelY = 90 + adAnimShift - 25 * 0.75
            if (adLabelY > 0) ctx.fillText(fedAction !== 'none' && adAnimShift !== 0 ? 'AD\u2081' : 'AD', m3X(adLabelY) - 4, m3Y(25))
            if (fedAction !== 'none' && adAnimShift !== 0) {
                ctx.fillStyle = 'rgba(255,100,100,0.4)'; ctx.font = '10px system-ui'
                const adOrigLabelY = 90 - 25 * 0.75
                ctx.fillText('AD\u2080', m3X(adOrigLabelY) - 4, m3Y(25))
            }

            // AD-SRAS equilibrium
            // SRAS: y = 15 + p*0.75, AD: y = 90 + adAnimShift - p*0.75 => 15 + p*0.75 = 90 + adAnimShift - p*0.75 => 1.5p = 75 + adAnimShift => p = (75+adAnimShift)/1.5
            const eqP = (75 + adAnimShift) / 1.5
            const eqY_gdp = 15 + eqP * 0.75
            if (eqP > 15 && eqP < 85 && eqY_gdp > 5 && eqY_gdp < 95) {
                ctx.strokeStyle = 'rgba(220,180,80,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
                ctx.beginPath()
                ctx.moveTo(m3X(eqY_gdp), m3Y(eqP)); ctx.lineTo(m3X(eqY_gdp), m3Y(0))
                ctx.moveTo(m3X(eqY_gdp), m3Y(eqP)); ctx.lineTo(m3X(0), m3Y(eqP))
                ctx.stroke(); ctx.setLineDash([])
                const pulse = 0.3 + 0.15 * Math.sin(t * 3)
                const glow = ctx.createRadialGradient(m3X(eqY_gdp), m3Y(eqP), 0, m3X(eqY_gdp), m3Y(eqP), 14)
                glow.addColorStop(0, `rgba(220,180,80,${pulse})`); glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(m3X(eqY_gdp), m3Y(eqP), 14, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.beginPath(); ctx.arc(m3X(eqY_gdp), m3Y(eqP), 5, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '10px monospace'
                ctx.textAlign = 'center'; ctx.fillText(`Y=${eqY_gdp.toFixed(0)}`, m3X(eqY_gdp), m3Y(0) + 15)
                ctx.textAlign = 'right'; ctx.fillText(`PL=${eqP.toFixed(0)}`, m3X(0) - 4, m3Y(eqP) + 3)
            }

            // === Flow Arrows between panels ===
            if (showTransmission && fedAction !== 'none') {
                const arrowColors = isExpansionary ? 'rgba(100,200,150,0.7)' : 'rgba(255,100,100,0.7)'
                const drawFlowArrow = (x1: number, y1: number, x2: number, y2: number, active: boolean) => {
                    ctx.strokeStyle = active ? arrowColors : 'rgba(255,255,255,0.1)'
                    ctx.lineWidth = active ? 2.5 : 1.5
                    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
                    if (active) {
                        ctx.fillStyle = arrowColors
                        const angle = Math.atan2(y2 - y1, x2 - x1)
                        ctx.beginPath()
                        ctx.moveTo(x2, y2)
                        ctx.lineTo(x2 - 10 * Math.cos(angle - 0.4), y2 - 10 * Math.sin(angle - 0.4))
                        ctx.lineTo(x2 - 10 * Math.cos(angle + 0.4), y2 - 10 * Math.sin(angle + 0.4))
                        ctx.closePath(); ctx.fill()
                    }
                    // Animated dot
                    if (active) {
                        const dotT = (t * 1.5) % 1
                        const dx = x1 + (x2 - x1) * dotT
                        const dy = y1 + (y2 - y1) * dotT
                        ctx.fillStyle = `rgba(220,180,80,${0.8 * (1 - dotT)})`
                        ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI * 2); ctx.fill()
                    }
                }

                const midY = topPad + panelH / 2
                // Arrow 1->2
                drawFlowArrow(p1.x + p1.w + 2, midY, p2.x - 2, midY, animStep >= 1)
                // Arrow 2->3
                drawFlowArrow(p2.x + p2.w + 2, midY, p3.x - 2, midY, animStep >= 2)

                // Flow labels
                if (animStep >= 1) {
                    ctx.fillStyle = 'rgba(220,180,80,0.7)'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText(isExpansionary ? 'r \u2193' : 'r \u2191', (p1.x + p1.w + p2.x) / 2, midY - 10)
                }
                if (animStep >= 2) {
                    ctx.fillText(isExpansionary ? 'I \u2191' : 'I \u2193', (p2.x + p2.w + p3.x) / 2, midY - 10)
                }
            }

            // === Transmission chain bar at bottom ===
            if (showTransmission && fedAction !== 'none') {
                const barY = h - bottomPad + 10
                const chain = isExpansionary
                    ? ['Ms \u2191', '\u2192', 'r \u2193', '\u2192', 'I \u2191', '\u2192', 'AD \u2191']
                    : ['Ms \u2193', '\u2192', 'r \u2191', '\u2192', 'I \u2193', '\u2192', 'AD \u2193']
                const stepColors = [0, 0, 1, 1, 2, 2, 3]
                const totalW = chain.length * 45
                const startX = w / 2 - totalW / 2
                chain.forEach((label, idx) => {
                    const cx = startX + idx * 45 + 22
                    const active = animStep >= stepColors[idx]
                    ctx.fillStyle = active ? 'rgba(220,180,80,0.9)' : 'rgba(255,255,255,0.2)'
                    ctx.font = active ? 'bold 14px system-ui' : '14px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(label, cx, barY + 16)
                })
                ctx.fillStyle = 'rgba(220,180,80,0.5)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(isExpansionary ? 'Expansionary Transmission' : 'Contractionary Transmission', w / 2, barY + 34)
            }

            // === Quantity Theory overlay ===
            if (quantityTheory) {
                const boxW = 300, boxH = 80
                const bx = w / 2 - boxW / 2, by = h - bottomPad - boxH - 60
                ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.strokeStyle = 'rgba(220,180,80,0.4)'; ctx.lineWidth = 1
                ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 10); ctx.fill(); ctx.stroke()
                ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'
                ctx.fillText('M \u00D7 V = P \u00D7 Q', w / 2, by + 35)
                ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px system-ui'
                ctx.fillText('If V constant & Q at full employment: \u2191M \u2192 \u2191P', w / 2, by + 58)
            }

            animRef.current = requestAnimationFrame(draw)
        }

        animRef.current = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animRef.current) }
    }, [fedAction, moneySupplyShift, showTransmission, quantityTheory, animStep, animProgress, adShift, isExpansionary, isContractionary, baseRate, newRate, baseInvestment, newInvestment])

    const policyType = fedAction === 'none' ? 'None' : isExpansionary ? 'Expansionary' : 'Contractionary'
    const policyColor = fedAction === 'none' ? 'rgba(255,255,255,0.6)' : isExpansionary ? 'rgba(100,200,150,1)' : 'rgba(255,100,100,1)'

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Fed Action">
                            <ButtonGroup
                                value={fedAction}
                                onChange={v => applyAction(v as FedAction)}
                                options={[
                                    { value: 'none', label: 'None' },
                                    { value: 'buy-bonds', label: 'Buy' },
                                    { value: 'sell-bonds', label: 'Sell' },
                                ]}
                                color={GOLD}
                            />
                            <ButtonGroup
                                value={fedAction}
                                onChange={v => applyAction(v as FedAction)}
                                options={[
                                    { value: 'lower-rr', label: 'RR\u2193' },
                                    { value: 'raise-rr', label: 'RR\u2191' },
                                    { value: 'lower-dr', label: 'DR\u2193' },
                                    { value: 'raise-dr', label: 'DR\u2191' },
                                ]}
                                color={GOLD}
                            />
                        </ControlGroup>
                        <Toggle label="Show Transmission" value={showTransmission} onChange={setShowTransmission} />
                        <Toggle label="Quantity Theory (MV=PQ)" value={quantityTheory} onChange={setQuantityTheory} />
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={() => { setFedAction('none'); setShowTransmission(true); setQuantityTheory(false) }} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 4" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title="Policy Dashboard" items={[
                        { label: 'Fed Action', value: actionInfo.name, color: policyColor },
                        { label: 'Money Supply', value: moneySupplyShift > 0 ? 'Increase' : moneySupplyShift < 0 ? 'Decrease' : 'No change', color: policyColor },
                        { label: 'Interest Rate', value: fedAction !== 'none' ? `${baseRate}% \u2192 ${newRate}%` : `${baseRate}%` },
                        { label: 'Investment', value: fedAction !== 'none' ? `${baseInvestment} \u2192 ${newInvestment.toFixed(0)}` : `${baseInvestment}` },
                        { label: 'AD Shift', value: adShift > 0 ? 'Right (\u2191)' : adShift < 0 ? 'Left (\u2193)' : 'None', color: policyColor },
                        { label: 'Policy Type', value: policyType, color: policyColor },
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Transmission" collapsed equations={[
                        { label: 'Expansionary', expression: 'Ms\u2191 \u2192 r\u2193 \u2192 I\u2191 \u2192 AD\u2191', description: 'Expansionary transmission' },
                        { label: 'Contractionary', expression: 'Ms\u2193 \u2192 r\u2191 \u2192 I\u2193 \u2192 AD\u2193', description: 'Contractionary transmission' },
                        { label: 'QTM', expression: 'MV = PQ', description: 'Quantity theory of money' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
