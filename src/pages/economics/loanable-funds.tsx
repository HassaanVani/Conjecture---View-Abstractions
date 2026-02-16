import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, Slider, Toggle, Button } from '@/components/control-panel'
import type { DemoStep } from '@/components/demo-mode'

const COLOR = 'rgb(220, 180, 80)'

export default function LoanableFunds() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)

    const [govBorrowing, setGovBorrowing] = useState(0)
    const [investDemandShift, setInvestDemandShift] = useState(0)
    const [supplyShift, setSupplyShift] = useState(0)
    const [crowdingOut, setCrowdingOut] = useState(true)
    const [showOriginal, setShowOriginal] = useState(true)

    // Supply of loanable funds (national saving) - upward sloping
    const getSupply = useCallback((r: number) => {
        const base = 10 + supplyShift * 15
        return base + 12 * r
    }, [supplyShift])

    // Private investment demand for loanable funds - downward sloping
    const getPrivateDemand = useCallback((r: number) => {
        const base = 120 + investDemandShift * 15
        return base - 10 * r
    }, [investDemandShift])

    // Total demand = private investment + government borrowing
    const getTotalDemand = useCallback((r: number) => {
        return getPrivateDemand(r) + govBorrowing
    }, [getPrivateDemand, govBorrowing])

    // Find equilibrium (S = D_total)
    const findEquilibrium = useCallback((demandFn: (r: number) => number) => {
        let bestR = 0
        let minDiff = Infinity
        for (let r = 0; r <= 12; r += 0.05) {
            const s = getSupply(r)
            const d = demandFn(r)
            const diff = Math.abs(s - d)
            if (diff < minDiff) { minDiff = diff; bestR = r }
        }
        return { r: bestR, Q: getSupply(bestR) }
    }, [getSupply])

    const originalEq = findEquilibrium(getPrivateDemand)
    const newEq = findEquilibrium(getTotalDemand)

    // Crowding out effect
    const privateInvestAtNewR = getPrivateDemand(newEq.r)
    const crowdedOutAmount = govBorrowing > 0 ? (getPrivateDemand(originalEq.r) - privateInvestAtNewR) : 0

    const demoSteps: DemoStep[] = [
        {
            title: 'The Loanable Funds Market',
            description: 'This market coordinates saving and borrowing. Supply comes from national saving (households, firms, foreign). Demand comes from investment and government borrowing. The price is the real interest rate.',
            setup: () => { setGovBorrowing(0); setInvestDemandShift(0); setSupplyShift(0); setCrowdingOut(true); setShowOriginal(true) },
        },
        {
            title: 'Supply of Loanable Funds',
            description: 'Supply = National Saving. It slopes UP because higher interest rates incentivize more saving. Shifts from changes in: savings behavior, budget surplus/deficit, capital inflows.',
            setup: () => { setGovBorrowing(0); setInvestDemandShift(0); setSupplyShift(0) },
            highlight: 'Higher r = more incentive to save',
        },
        {
            title: 'Demand for Loanable Funds',
            description: 'Demand = Investment + Government Borrowing. Investment demand slopes DOWN: higher interest rates make fewer projects profitable. Firms invest when expected return > real interest rate.',
            setup: () => { setGovBorrowing(0); setInvestDemandShift(0) },
        },
        {
            title: 'Equilibrium Interest Rate',
            description: 'Where S_LF = D_LF determines the real interest rate (r*). At this rate, the quantity of funds saved equals the quantity borrowed. The market for loanable funds clears.',
            setup: () => { setGovBorrowing(0); setInvestDemandShift(0); setSupplyShift(0) },
            highlight: 'r* balances saving and borrowing',
        },
        {
            title: 'Government Borrowing',
            description: 'When government runs a budget DEFICIT, it must borrow in the loanable funds market. This shifts total demand RIGHT, raising the interest rate.',
            setup: () => { setGovBorrowing(30); setInvestDemandShift(0); setSupplyShift(0); setCrowdingOut(true) },
        },
        {
            title: 'Crowding Out Effect',
            description: 'Higher government borrowing raises r*, which REDUCES private investment. Government spending "crowds out" private investment. The red area shows the investment lost due to higher interest rates.',
            setup: () => { setGovBorrowing(40); setCrowdingOut(true); setShowOriginal(true) },
            highlight: 'Notice private investment falls as r* rises',
        },
        {
            title: 'Investment Demand Shift',
            description: 'When businesses become more optimistic or new technology appears, investment demand shifts RIGHT. This raises r* and increases total borrowing. More saving is drawn out by higher rates.',
            setup: () => { setGovBorrowing(0); setInvestDemandShift(3); setSupplyShift(0) },
        },
        {
            title: 'Saving Shift',
            description: 'If households save more (thrift), supply shifts RIGHT. Real interest rate FALLS, stimulating MORE investment. Paradox of thrift: more saving can boost growth through lower rates.',
            setup: () => { setGovBorrowing(0); setInvestDemandShift(0); setSupplyShift(3) },
        },
        {
            title: 'Explore!',
            description: 'Combine government borrowing with supply and demand shifts. See how fiscal policy affects interest rates and private investment. Toggle crowding out visualization on/off.',
            setup: () => { setGovBorrowing(0); setInvestDemandShift(0); setSupplyShift(0) },
        },
    ]

    const demo = useDemoMode(demoSteps)

    const reset = useCallback(() => {
        setGovBorrowing(0)
        setInvestDemandShift(0)
        setSupplyShift(0)
        setCrowdingOut(true)
        setShowOriginal(true)
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

            const maxQ = 180
            const maxR = 12
            const toX = (q: number) => padding + (q / maxQ) * gw
            const toY = (r: number) => h - padding - 50 - (r / maxR) * gh

            ctx.fillStyle = '#1a150a'
            ctx.fillRect(0, 0, w, h)

            // Grid
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.06)'
            ctx.lineWidth = 1
            for (let q = 0; q <= maxQ; q += 30) {
                ctx.beginPath(); ctx.moveTo(toX(q), toY(0)); ctx.lineTo(toX(q), toY(maxR)); ctx.stroke()
            }
            for (let r = 0; r <= maxR; r += 2) {
                ctx.beginPath(); ctx.moveTo(toX(0), toY(r)); ctx.lineTo(toX(maxQ), toY(r)); ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(padding, toY(maxR))
            ctx.lineTo(padding, toY(0))
            ctx.lineTo(toX(maxQ), toY(0))
            ctx.stroke()

            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.font = '14px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Quantity of Loanable Funds ($)', padding + gw / 2, h - 20)
            ctx.save()
            ctx.translate(22, h / 2 - 25)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Real Interest Rate (r%)', 0, 0)
            ctx.restore()

            // Ticks
            ctx.fillStyle = 'rgba(220, 180, 80, 0.5)'
            ctx.font = '10px system-ui'
            for (let q = 30; q <= maxQ; q += 30) {
                ctx.textAlign = 'center'
                ctx.fillText(q.toString(), toX(q), toY(0) + 15)
            }
            for (let r = 2; r <= maxR; r += 2) {
                ctx.textAlign = 'right'
                ctx.fillText(r + '%', toX(0) - 8, toY(r) + 4)
            }

            // Crowding out visualization
            if (crowdingOut && govBorrowing > 0 && showOriginal) {
                // Show reduction in private investment
                const oldPrivI = getPrivateDemand(originalEq.r)
                const newPrivI = privateInvestAtNewR

                if (oldPrivI > newPrivI) {
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.15)'
                    ctx.fillRect(
                        toX(newPrivI),
                        toY(newEq.r),
                        toX(oldPrivI) - toX(newPrivI),
                        toY(originalEq.r) - toY(newEq.r)
                    )

                    ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
                    ctx.font = 'bold 11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(
                        `Crowded Out: ${crowdedOutAmount.toFixed(0)}`,
                        toX((newPrivI + oldPrivI) / 2),
                        toY((newEq.r + originalEq.r) / 2) + 4
                    )
                }
            }

            // Original private demand (faded, if shifted)
            if (govBorrowing > 0 && showOriginal) {
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)'
                ctx.lineWidth = 2
                ctx.setLineDash([4, 4])
                ctx.beginPath()
                let started = false
                for (let r = 0; r <= maxR; r += 0.1) {
                    const q = getPrivateDemand(r)
                    if (q < 0) break
                    if (q > maxQ) continue
                    if (!started) { ctx.moveTo(toX(q), toY(r)); started = true }
                    else ctx.lineTo(toX(q), toY(r))
                }
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(255, 100, 100, 0.4)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText('D_private', toX(getPrivateDemand(1)) + 5, toY(1) + 4)
            }

            // Supply curve (S_LF)
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.9)'
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.beginPath()
            let started = false
            for (let r = 0; r <= maxR; r += 0.1) {
                const q = getSupply(r)
                if (q > maxQ) break
                if (q < 0) continue
                if (!started) { ctx.moveTo(toX(q), toY(r)); started = true }
                else ctx.lineTo(toX(q), toY(r))
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(100, 150, 255, 1)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            const sLabelR = 9
            const sLabelQ = getSupply(sLabelR)
            if (sLabelQ < maxQ) ctx.fillText('S_LF', toX(sLabelQ) + 5, toY(sLabelR) - 8)

            // Total demand curve (D_LF)
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
            ctx.lineWidth = 3
            ctx.beginPath()
            started = false
            for (let r = 0; r <= maxR; r += 0.1) {
                const q = getTotalDemand(r)
                if (q < 0) break
                if (q > maxQ) continue
                if (!started) { ctx.moveTo(toX(q), toY(r)); started = true }
                else ctx.lineTo(toX(q), toY(r))
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255, 100, 100, 1)'
            ctx.font = 'bold 13px system-ui'
            const dLabelR = 1
            const dLabelQ = getTotalDemand(dLabelR)
            if (dLabelQ > 0 && dLabelQ < maxQ) {
                ctx.textAlign = 'left'
                ctx.fillText(govBorrowing > 0 ? 'D_total' : 'D_LF', toX(dLabelQ) + 5, toY(dLabelR) + 4)
            }

            // Government borrowing arrow (shows the horizontal shift)
            if (govBorrowing > 0) {
                const arrowR = newEq.r
                const arrowFromQ = getPrivateDemand(arrowR)
                const arrowToQ = getTotalDemand(arrowR)
                if (arrowFromQ > 0 && arrowToQ < maxQ) {
                    ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'
                    ctx.lineWidth = 1.5
                    ctx.setLineDash([3, 3])
                    ctx.beginPath()
                    ctx.moveTo(toX(arrowFromQ), toY(arrowR))
                    ctx.lineTo(toX(arrowToQ), toY(arrowR))
                    ctx.stroke()
                    ctx.setLineDash([])
                    ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
                    ctx.font = '10px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`G = ${govBorrowing}`, toX((arrowFromQ + arrowToQ) / 2), toY(arrowR) - 8)
                }
            }

            // Original equilibrium (faded if shifted)
            if (govBorrowing > 0 && showOriginal) {
                ctx.strokeStyle = 'rgba(220, 180, 80, 0.25)'
                ctx.lineWidth = 1
                ctx.setLineDash([4, 4])
                ctx.beginPath()
                ctx.moveTo(toX(originalEq.Q), toY(originalEq.r))
                ctx.lineTo(toX(originalEq.Q), toY(0))
                ctx.moveTo(toX(originalEq.Q), toY(originalEq.r))
                ctx.lineTo(toX(0), toY(originalEq.r))
                ctx.stroke()
                ctx.setLineDash([])

                ctx.fillStyle = 'rgba(220, 180, 80, 0.4)'
                ctx.beginPath()
                ctx.arc(toX(originalEq.Q), toY(originalEq.r), 5, 0, Math.PI * 2)
                ctx.fill()
                ctx.font = '10px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText('E\u2080', toX(originalEq.Q) + 8, toY(originalEq.r) - 4)
            }

            // New/current equilibrium
            const eqToShow = govBorrowing > 0 ? newEq : originalEq

            if (eqToShow.Q > 0 && eqToShow.Q < maxQ && eqToShow.r > 0) {
                // Dashed lines
                ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'
                ctx.lineWidth = 1.5
                ctx.setLineDash([6, 4])
                ctx.beginPath()
                ctx.moveTo(toX(eqToShow.Q), toY(eqToShow.r))
                ctx.lineTo(toX(eqToShow.Q), toY(0))
                ctx.moveTo(toX(eqToShow.Q), toY(eqToShow.r))
                ctx.lineTo(toX(0), toY(eqToShow.r))
                ctx.stroke()
                ctx.setLineDash([])

                // Glow
                const pulse = 0.3 + 0.15 * Math.sin(t * 3)
                const glow = ctx.createRadialGradient(toX(eqToShow.Q), toY(eqToShow.r), 0, toX(eqToShow.Q), toY(eqToShow.r), 22)
                glow.addColorStop(0, `rgba(220, 180, 80, ${pulse})`)
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath()
                ctx.arc(toX(eqToShow.Q), toY(eqToShow.r), 22, 0, Math.PI * 2)
                ctx.fill()

                // Point
                ctx.fillStyle = 'rgba(220, 180, 80, 1)'
                ctx.beginPath()
                ctx.arc(toX(eqToShow.Q), toY(eqToShow.r), 7, 0, Math.PI * 2)
                ctx.fill()
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.lineWidth = 2
                ctx.stroke()

                // Labels
                ctx.fillStyle = 'rgba(220, 180, 80, 0.9)'
                ctx.font = '11px monospace'
                ctx.textAlign = 'center'
                ctx.fillText(`Q* = ${eqToShow.Q.toFixed(0)}`, toX(eqToShow.Q), toY(0) + 18)
                ctx.textAlign = 'right'
                ctx.fillText(`r* = ${eqToShow.r.toFixed(1)}%`, toX(0) - 8, toY(eqToShow.r) + 4)

                ctx.font = 'bold 12px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(govBorrowing > 0 ? 'E\u2081' : 'E', toX(eqToShow.Q) + 12, toY(eqToShow.r) - 6)
            }

            // Legend
            const lx = w - 180
            let ly = 70
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            const items: Array<[string, string]> = [
                ['rgba(100, 150, 255, 0.9)', 'S_LF (Saving)'],
                ['rgba(255, 100, 100, 0.9)', govBorrowing > 0 ? 'D_total (I + G)' : 'D_LF (Investment)'],
            ]
            if (govBorrowing > 0 && crowdingOut) items.push(['rgba(255, 100, 100, 0.3)', 'Crowding Out'])
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
    }, [govBorrowing, investDemandShift, supplyShift, crowdingOut, showOriginal, getSupply, getPrivateDemand, getTotalDemand, findEquilibrium, originalEq, newEq, privateInvestAtNewR, crowdedOutAmount])

    const eqDisplay = govBorrowing > 0 ? newEq : originalEq

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-medium text-white/90">Loanable Funds Market</h1>
                    <APTag course="Macroeconomics" unit="Unit 4" color={COLOR} />
                </div>
                <Button onClick={demo.open} className="text-xs">AP Tutorial</Button>
            </div>

            <div className="flex-1 relative flex overflow-hidden">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <EquationDisplay
                        equations={[
                            { label: 'Equilibrium', expression: `S_LF = D_LF at r* = ${eqDisplay.r.toFixed(1)}%`, description: 'Saving equals borrowing at the real interest rate' },
                            { label: 'Total D', expression: `D_LF = I + G = ${eqDisplay.Q.toFixed(0)}`, description: govBorrowing > 0 ? `Investment + Gov borrowing (${govBorrowing})` : 'Private investment demand' },
                            ...(govBorrowing > 0 ? [{ label: 'Crowding out', expression: `\u0394I = -${crowdedOutAmount.toFixed(0)}`, description: `r rose from ${originalEq.r.toFixed(1)}% to ${newEq.r.toFixed(1)}%` }] : []),
                        ]}
                        departmentColor={COLOR}
                        className="absolute top-3 left-3 max-w-xs"
                        title="Loanable Funds Equations"
                    />

                    <InfoPanel
                        title="Market Equilibrium"
                        departmentColor={COLOR}
                        className="absolute top-3 right-3 min-w-[190px]"
                        items={[
                            { label: 'Real rate (r*)', value: `${eqDisplay.r.toFixed(1)}%`, color: 'rgb(220, 180, 80)' },
                            { label: 'Quantity', value: eqDisplay.Q.toFixed(0), color: 'rgb(220, 180, 80)' },
                            { label: 'Private I', value: privateInvestAtNewR.toFixed(0), color: 'rgb(255, 100, 100)' },
                            { label: 'Gov Borrowing', value: govBorrowing.toFixed(0), color: 'rgb(255, 200, 100)' },
                            ...(govBorrowing > 0 ? [{ label: 'Crowded Out', value: crowdedOutAmount.toFixed(0), color: 'rgb(255, 100, 100)' }] : []),
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
                            title="Loanable Funds Tutorial"
                        />
                    </div>
                </div>

                <div className="w-72 bg-black/30 border-l border-white/10 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto">
                    <ControlPanel className="!p-0 !bg-transparent !border-0 !backdrop-blur-0">
                        <Slider
                            label="Government Borrowing (G)"
                            value={govBorrowing}
                            onChange={setGovBorrowing}
                            min={0}
                            max={60}
                            step={5}
                        />
                        <Slider
                            label="Investment Demand Shift"
                            value={investDemandShift}
                            onChange={setInvestDemandShift}
                            min={-5}
                            max={5}
                            step={0.5}
                        />
                        <Slider
                            label="Supply (Saving) Shift"
                            value={supplyShift}
                            onChange={setSupplyShift}
                            min={-5}
                            max={5}
                            step={0.5}
                        />
                        <Toggle label="Show Crowding Out" value={crowdingOut} onChange={setCrowdingOut} />
                        <Toggle label="Show Original Eq." value={showOriginal} onChange={setShowOriginal} />
                    </ControlPanel>

                    <Button onClick={reset} variant="secondary" className="w-full">
                        Reset All
                    </Button>

                    <div className="mt-auto p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Key Insight</h4>
                        <p className="text-xs text-white/50 leading-relaxed">
                            {govBorrowing > 0
                                ? `Government borrowing of ${govBorrowing} raised r* by ${(newEq.r - originalEq.r).toFixed(1)}pp, reducing private investment by ${crowdedOutAmount.toFixed(0)} (crowding out).`
                                : 'Increase government borrowing to see the crowding out effect on private investment.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
