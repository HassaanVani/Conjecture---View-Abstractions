import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, Slider, Select, Toggle, Button } from '@/components/control-panel'
import type { DemoStep } from '@/components/demo-mode'

const COLOR = 'rgb(220, 180, 80)'

type FedPolicy = 'none' | 'omo_buy' | 'omo_sell' | 'discount_low' | 'discount_high' | 'rrr_low' | 'rrr_high'

interface PolicyInfo {
    label: string
    msEffect: number
    description: string
    mechanism: string
}

const POLICIES: Record<FedPolicy, PolicyInfo> = {
    none: { label: 'No Policy', msEffect: 0, description: 'No Fed intervention', mechanism: '' },
    omo_buy: { label: 'OMO: Buy Bonds', msEffect: 40, description: 'Expansionary: Fed buys bonds, injects reserves', mechanism: 'Fed buys bonds -> bank reserves up -> Ms shifts right -> i falls' },
    omo_sell: { label: 'OMO: Sell Bonds', msEffect: -40, description: 'Contractionary: Fed sells bonds, drains reserves', mechanism: 'Fed sells bonds -> bank reserves down -> Ms shifts left -> i rises' },
    discount_low: { label: 'Lower Discount Rate', msEffect: 30, description: 'Expansionary: cheaper to borrow from Fed', mechanism: 'Discount rate down -> banks borrow more -> Ms shifts right -> i falls' },
    discount_high: { label: 'Raise Discount Rate', msEffect: -30, description: 'Contractionary: more expensive to borrow from Fed', mechanism: 'Discount rate up -> banks borrow less -> Ms shifts left -> i rises' },
    rrr_low: { label: 'Lower Reserve Ratio', msEffect: 35, description: 'Expansionary: banks can lend more of deposits', mechanism: 'RRR down -> money multiplier up -> Ms shifts right -> i falls' },
    rrr_high: { label: 'Raise Reserve Ratio', msEffect: -35, description: 'Contractionary: banks must hold more reserves', mechanism: 'RRR up -> money multiplier down -> Ms shifts left -> i rises' },
}

export default function MoneyMarket() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)

    const [msBase, setMsBase] = useState(100)
    const [mdShift, setMdShift] = useState(0)
    const [fedPolicy, setFedPolicy] = useState<FedPolicy>('none')
    const [showTransmission, setShowTransmission] = useState(true)
    const [animatedMs, setAnimatedMs] = useState(100)

    const policyInfo = POLICIES[fedPolicy]
    const targetMs = msBase + policyInfo.msEffect

    // Animate Ms toward target
    useEffect(() => {
        const interval = setInterval(() => {
            setAnimatedMs(prev => {
                const diff = targetMs - prev
                if (Math.abs(diff) < 0.5) return targetMs
                return prev + diff * 0.08
            })
        }, 16)
        return () => clearInterval(interval)
    }, [targetMs])

    // Money demand: downward sloping (higher i -> less money demanded)
    const getMd = useCallback((i: number) => {
        const base = 180 + mdShift * 15
        return base - 18 * i
    }, [mdShift])

    // Money supply: vertical at animatedMs
    const getMs = useCallback(() => animatedMs, [animatedMs])

    // Find equilibrium (where Md curve crosses Ms vertical line)
    const findEquilibrium = useCallback(() => {
        const ms = getMs()
        // Md(i) = ms => i = (base + mdShift * 15 - ms) / 18
        const base = 180 + mdShift * 15
        const eqI = (base - ms) / 18
        return { i: Math.max(0, eqI), Q: ms }
    }, [getMs, mdShift])

    const eq = findEquilibrium()

    // Original equilibrium (without policy)
    const getOriginalEq = useCallback(() => {
        const base = 180 + mdShift * 15
        const eqI = (base - msBase) / 18
        return { i: Math.max(0, eqI), Q: msBase }
    }, [msBase, mdShift])

    const origEq = getOriginalEq()

    const demoSteps: DemoStep[] = [
        {
            title: 'The Money Market',
            description: 'The money market determines the nominal interest rate. The Fed controls money supply (Ms). Money demand (Md) comes from households and firms wanting liquidity. The intersection sets the equilibrium interest rate.',
            setup: () => { setMsBase(100); setMdShift(0); setFedPolicy('none'); setShowTransmission(true) },
        },
        {
            title: 'Money Supply (Ms)',
            description: 'The Fed sets the money supply, making it a VERTICAL line. The quantity does not depend on the interest rate -- it is determined by Fed policy (OMO, discount rate, reserve requirements).',
            setup: () => { setFedPolicy('none'); setMdShift(0) },
            highlight: 'Ms is vertical because the Fed controls it directly',
        },
        {
            title: 'Money Demand (Md)',
            description: 'Money demand slopes DOWN: at higher interest rates, the opportunity cost of holding money rises, so people hold less cash and more bonds. Shifts from GDP growth, price level changes.',
            setup: () => { setFedPolicy('none'); setMdShift(0) },
        },
        {
            title: 'Equilibrium Interest Rate',
            description: 'Where Ms = Md determines the nominal interest rate. If i is above equilibrium, people hold less money than available (surplus) -- they buy bonds, pushing i down. Vice versa if i is below.',
            setup: () => { setFedPolicy('none'); setMdShift(0); setMsBase(100) },
            highlight: 'The market self-corrects to equilibrium',
        },
        {
            title: 'Open Market Operations: Buy',
            description: 'The Fed\'s MOST COMMON tool. Buying bonds injects money into banks, shifting Ms RIGHT. The interest rate FALLS. This is EXPANSIONARY monetary policy.',
            setup: () => { setFedPolicy('omo_buy'); setMdShift(0); setMsBase(100) },
            highlight: 'Watch Ms shift right and i fall',
        },
        {
            title: 'Open Market Operations: Sell',
            description: 'Selling bonds drains money from banks, shifting Ms LEFT. The interest rate RISES. This is CONTRACTIONARY monetary policy used to fight inflation.',
            setup: () => { setFedPolicy('omo_sell'); setMdShift(0); setMsBase(100) },
        },
        {
            title: 'Discount Rate Policy',
            description: 'The discount rate is what the Fed charges banks for loans. Lowering it makes borrowing cheaper, expanding reserves and money supply. Raising it does the opposite.',
            setup: () => { setFedPolicy('discount_low'); setMdShift(0); setMsBase(100) },
        },
        {
            title: 'Reserve Requirements',
            description: 'The reserve ratio determines how much banks must hold vs. lend. Lowering it increases the money multiplier, expanding Ms. This tool is rarely used but powerful.',
            setup: () => { setFedPolicy('rrr_low'); setMdShift(0); setMsBase(100) },
        },
        {
            title: 'Money Demand Shifts',
            description: 'Md shifts RIGHT from: higher GDP (more transactions), higher price level, increased uncertainty. When Md shifts right with fixed Ms, the interest rate RISES.',
            setup: () => { setFedPolicy('none'); setMdShift(3); setMsBase(100) },
            highlight: 'GDP growth shifts Md right, raising i',
        },
        {
            title: 'Explore!',
            description: 'Combine Fed policies with money demand shifts. See how different tools affect the interest rate. The transmission mechanism: Ms -> i -> I -> AD -> GDP.',
            setup: () => { setFedPolicy('none'); setMdShift(0); setMsBase(100) },
        },
    ]

    const demo = useDemoMode(demoSteps)

    const reset = useCallback(() => {
        setMsBase(100)
        setMdShift(0)
        setFedPolicy('none')
        setShowTransmission(true)
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

            const maxQ = 200
            const maxI = 12
            const toX = (q: number) => padding + (q / maxQ) * gw
            const toY = (i: number) => h - padding - 50 - (i / maxI) * gh

            ctx.fillStyle = '#1a150a'
            ctx.fillRect(0, 0, w, h)

            // Grid
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.06)'
            ctx.lineWidth = 1
            for (let q = 0; q <= maxQ; q += 40) {
                ctx.beginPath(); ctx.moveTo(toX(q), toY(0)); ctx.lineTo(toX(q), toY(maxI)); ctx.stroke()
            }
            for (let i = 0; i <= maxI; i += 2) {
                ctx.beginPath(); ctx.moveTo(toX(0), toY(i)); ctx.lineTo(toX(maxQ), toY(i)); ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(padding, toY(maxI))
            ctx.lineTo(padding, toY(0))
            ctx.lineTo(toX(maxQ), toY(0))
            ctx.stroke()

            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.font = '14px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Quantity of Money (M)', padding + gw / 2, h - 20)
            ctx.save()
            ctx.translate(22, h / 2 - 25)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Nominal Interest Rate (i%)', 0, 0)
            ctx.restore()

            // Ticks
            ctx.fillStyle = 'rgba(220, 180, 80, 0.5)'
            ctx.font = '10px system-ui'
            for (let q = 40; q <= maxQ; q += 40) {
                ctx.textAlign = 'center'
                ctx.fillText(q.toString(), toX(q), toY(0) + 15)
            }
            for (let i = 2; i <= maxI; i += 2) {
                ctx.textAlign = 'right'
                ctx.fillText(i + '%', toX(0) - 8, toY(i) + 4)
            }

            // Original Ms line (faded, if policy active)
            if (fedPolicy !== 'none') {
                ctx.strokeStyle = 'rgba(100, 200, 150, 0.25)'
                ctx.lineWidth = 2
                ctx.setLineDash([4, 4])
                ctx.beginPath()
                ctx.moveTo(toX(msBase), toY(maxI))
                ctx.lineTo(toX(msBase), toY(0))
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(100, 200, 150, 0.35)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Ms\u2080', toX(msBase), toY(maxI) - 8)

                // Original equilibrium point
                ctx.fillStyle = 'rgba(220, 180, 80, 0.3)'
                ctx.beginPath()
                ctx.arc(toX(origEq.Q), toY(origEq.i), 5, 0, Math.PI * 2)
                ctx.fill()

                // Shift arrow
                const arrowY = toY(eq.i)
                const arrowColor = policyInfo.msEffect > 0 ? 'rgba(100, 200, 150, 0.6)' : 'rgba(255, 100, 100, 0.6)'
                ctx.strokeStyle = arrowColor
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(toX(msBase), arrowY)
                ctx.lineTo(toX(animatedMs), arrowY)
                ctx.stroke()
                // Arrowhead
                const dir = policyInfo.msEffect > 0 ? 1 : -1
                ctx.fillStyle = arrowColor
                ctx.beginPath()
                ctx.moveTo(toX(animatedMs), arrowY)
                ctx.lineTo(toX(animatedMs) - dir * 8, arrowY - 5)
                ctx.lineTo(toX(animatedMs) - dir * 8, arrowY + 5)
                ctx.closePath()
                ctx.fill()
            }

            // Money Supply (vertical line)
            const ms = animatedMs
            ctx.strokeStyle = 'rgba(100, 200, 150, 0.9)'
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(toX(ms), toY(maxI))
            ctx.lineTo(toX(ms), toY(0))
            ctx.stroke()

            ctx.fillStyle = 'rgba(100, 200, 150, 1)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(fedPolicy !== 'none' ? 'Ms\u2081' : 'Ms', toX(ms), toY(maxI) - 8)

            // Money Demand (downward sloping)
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
            ctx.lineWidth = 3
            ctx.beginPath()
            let started = false
            for (let i = 0; i <= maxI; i += 0.1) {
                const q = getMd(i)
                if (q < 0) break
                if (q > maxQ) continue
                if (!started) { ctx.moveTo(toX(q), toY(i)); started = true }
                else ctx.lineTo(toX(q), toY(i))
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255, 100, 100, 1)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            const mdLabelI = 1.5
            const mdLabelQ = getMd(mdLabelI)
            if (mdLabelQ > 0 && mdLabelQ < maxQ) {
                ctx.fillText('Md', toX(mdLabelQ) + 5, toY(mdLabelI) + 4)
            }

            // Surplus/shortage indication when not at equilibrium (if animating)
            if (Math.abs(animatedMs - targetMs) > 2) {
                const currentI = eq.i
                const surplusI = currentI + 1.5
                const shortageI = currentI - 1.5

                if (surplusI < maxI) {
                    ctx.fillStyle = 'rgba(100, 200, 150, 0.08)'
                    const mdAtSurplus = getMd(surplusI)
                    if (ms > mdAtSurplus) {
                        ctx.fillRect(toX(mdAtSurplus), toY(surplusI) - 2, toX(ms) - toX(mdAtSurplus), 4)
                    }
                }
            }

            // Equilibrium point
            if (eq.i > 0 && eq.i < maxI && eq.Q > 0 && eq.Q < maxQ) {
                // Dashed lines
                ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'
                ctx.lineWidth = 1.5
                ctx.setLineDash([6, 4])
                ctx.beginPath()
                ctx.moveTo(toX(eq.Q), toY(eq.i))
                ctx.lineTo(toX(eq.Q), toY(0))
                ctx.moveTo(toX(eq.Q), toY(eq.i))
                ctx.lineTo(toX(0), toY(eq.i))
                ctx.stroke()
                ctx.setLineDash([])

                // Glow
                const pulse = 0.3 + 0.15 * Math.sin(t * 3)
                const glow = ctx.createRadialGradient(toX(eq.Q), toY(eq.i), 0, toX(eq.Q), toY(eq.i), 22)
                glow.addColorStop(0, `rgba(220, 180, 80, ${pulse})`)
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath()
                ctx.arc(toX(eq.Q), toY(eq.i), 22, 0, Math.PI * 2)
                ctx.fill()

                // Point
                ctx.fillStyle = 'rgba(220, 180, 80, 1)'
                ctx.beginPath()
                ctx.arc(toX(eq.Q), toY(eq.i), 7, 0, Math.PI * 2)
                ctx.fill()
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.lineWidth = 2
                ctx.stroke()

                // Labels
                ctx.fillStyle = 'rgba(220, 180, 80, 0.9)'
                ctx.font = '11px monospace'
                ctx.textAlign = 'center'
                ctx.fillText(`M* = ${eq.Q.toFixed(0)}`, toX(eq.Q), toY(0) + 18)
                ctx.textAlign = 'right'
                ctx.fillText(`i* = ${eq.i.toFixed(1)}%`, toX(0) - 8, toY(eq.i) + 4)
            }

            // Transmission mechanism display
            if (showTransmission && fedPolicy !== 'none') {
                const boxW = Math.min(gw * 0.7, 480)
                const boxX = padding + (gw - boxW) / 2
                const boxY = toY(maxI) + 10
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.strokeStyle = 'rgba(220, 180, 80, 0.3)'
                ctx.lineWidth = 1

                const boxH = 30
                ctx.beginPath()
                ctx.roundRect(boxX, boxY, boxW, boxH, 8)
                ctx.fill()
                ctx.stroke()

                ctx.fillStyle = 'rgba(220, 180, 80, 0.9)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(policyInfo.mechanism, boxX + boxW / 2, boxY + 18)
            }

            // Legend
            const lx = w - 170
            let ly = 70
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            const items: Array<[string, string]> = [
                ['rgba(100, 200, 150, 0.9)', 'Ms (Money Supply)'],
                ['rgba(255, 100, 100, 0.9)', 'Md (Money Demand)'],
                ['rgba(220, 180, 80, 0.9)', 'Equilibrium'],
            ]
            items.forEach(([color, label]) => {
                ctx.fillStyle = color
                ctx.fillRect(lx, ly - 8, 12, 12)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
                ctx.fillText(label, lx + 18, ly)
                ly += 18
            })

            animRef.current = requestAnimationFrame(draw)
        }

        animRef.current = requestAnimationFrame(draw)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animRef.current)
        }
    }, [msBase, mdShift, fedPolicy, showTransmission, animatedMs, getMd, getMs, findEquilibrium, eq, origEq, policyInfo, targetMs])

    const policyOptions: Array<{ value: string; label: string }> = Object.entries(POLICIES).map(([k, v]) => ({ value: k, label: v.label }))

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-medium text-white/90">Money Market</h1>
                    <APTag course="Macroeconomics" unit="Unit 4" color={COLOR} />
                </div>
                <Button onClick={demo.open} className="text-xs">AP Tutorial</Button>
            </div>

            <div className="flex-1 relative flex overflow-hidden">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <EquationDisplay
                        equations={[
                            { label: 'Ms', expression: 'Ms = vertical (Fed sets)', description: 'Money supply is independent of interest rate' },
                            { label: 'Md', expression: `Md = f(i) = ${getMd(eq.i).toFixed(0)} at i* = ${eq.i.toFixed(1)}%`, description: 'Higher i = higher opportunity cost = less money demanded' },
                            { label: 'Eq.', expression: `Ms = Md at i* = ${eq.i.toFixed(1)}%`, description: fedPolicy !== 'none' ? `Policy: ${policyInfo.description}` : 'Nominal interest rate where money market clears' },
                        ]}
                        departmentColor={COLOR}
                        className="absolute top-3 left-3 max-w-xs"
                        title="Money Market Equations"
                    />

                    <InfoPanel
                        title="Money Market"
                        departmentColor={COLOR}
                        className="absolute top-3 right-3 min-w-[190px]"
                        items={[
                            { label: 'Nominal rate (i*)', value: `${eq.i.toFixed(1)}%`, color: 'rgb(220, 180, 80)' },
                            { label: 'Money supply', value: animatedMs.toFixed(0), color: 'rgb(100, 200, 150)' },
                            { label: 'Money demand', value: getMd(eq.i).toFixed(0), color: 'rgb(255, 100, 100)' },
                            ...(fedPolicy !== 'none' ? [
                                { label: 'Rate change', value: `${(eq.i - origEq.i) > 0 ? '+' : ''}${(eq.i - origEq.i).toFixed(1)}%`, color: (eq.i - origEq.i) > 0 ? 'rgb(255, 100, 100)' : 'rgb(100, 200, 150)' },
                                { label: 'Policy', value: policyInfo.msEffect > 0 ? 'Expansionary' : 'Contractionary', color: policyInfo.msEffect > 0 ? 'rgb(100, 200, 150)' : 'rgb(255, 100, 100)' },
                            ] : []),
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
                            title="Money Market Tutorial"
                        />
                    </div>
                </div>

                <div className="w-72 bg-black/30 border-l border-white/10 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto">
                    <ControlPanel className="!p-0 !bg-transparent !border-0 !backdrop-blur-0">
                        <Slider
                            label="Money Supply (Ms)"
                            value={msBase}
                            onChange={setMsBase}
                            min={60}
                            max={160}
                            step={5}
                        />
                        <Slider
                            label="Money Demand Shift"
                            value={mdShift}
                            onChange={setMdShift}
                            min={-5}
                            max={5}
                            step={0.5}
                        />
                        <Select
                            label="Fed Policy Tool"
                            value={fedPolicy}
                            onChange={(v) => setFedPolicy(v as FedPolicy)}
                            options={policyOptions}
                        />
                        <Toggle label="Show Transmission" value={showTransmission} onChange={setShowTransmission} />
                    </ControlPanel>

                    <Button onClick={reset} variant="secondary" className="w-full">
                        Reset All
                    </Button>

                    <div className="mt-auto p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Fed Tools</h4>
                        <ul className="text-xs text-white/50 space-y-1.5 leading-relaxed">
                            <li><span className="text-white/70 font-medium">OMO:</span> Most used. Buy/sell bonds.</li>
                            <li><span className="text-white/70 font-medium">Discount Rate:</span> Rate Fed charges banks.</li>
                            <li><span className="text-white/70 font-medium">Reserve Ratio:</span> Rarely used. Powerful.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
