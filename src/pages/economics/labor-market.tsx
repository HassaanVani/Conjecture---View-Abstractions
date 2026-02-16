import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, Slider, Toggle, Button } from '@/components/control-panel'
import type { DemoStep } from '@/components/demo-mode'

const COLOR = 'rgb(220, 180, 80)'

export default function LaborMarket() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)

    const [demandShift, setDemandShift] = useState(0)
    const [supplyShift, setSupplyShift] = useState(0)
    const [minWageEnabled, setMinWageEnabled] = useState(false)
    const [minWageLevel, setMinWageLevel] = useState(12)
    const [monopsony, setMonopsony] = useState(false)
    const [productPrice, setProductPrice] = useState(50)

    // Labor demand: MRP = MR x MP. Downward sloping due to diminishing MP.
    const getDemandWage = useCallback((L: number) => {
        const base = 22 + demandShift * 3
        const mp = Math.max(0.1, base - 0.12 * L)
        return mp * (productPrice / 50)
    }, [demandShift, productPrice])

    // Labor supply: upward sloping
    const getSupplyWage = useCallback((L: number) => {
        const base = 2 + supplyShift * 2
        return base + 0.1 * L
    }, [supplyShift])

    // Marginal factor cost (for monopsony): rises faster than supply
    const getMFC = useCallback((L: number) => {
        const base = 2 + supplyShift * 2
        return base + 0.2 * L
    }, [supplyShift])

    // Find equilibrium
    const findEquilibrium = useCallback(() => {
        let bestL = 1
        let minDiff = Infinity
        const maxL = 200
        if (monopsony) {
            // Monopsony: MRP = MFC
            for (let L = 1; L <= maxL; L += 0.5) {
                const diff = Math.abs(getDemandWage(L) - getMFC(L))
                if (diff < minDiff) { minDiff = diff; bestL = L }
            }
            const wage = getSupplyWage(bestL)
            return { L: bestL, W: wage, type: 'monopsony' as const }
        }
        // Competitive: D_labor = S_labor
        for (let L = 1; L <= maxL; L += 0.5) {
            const diff = Math.abs(getDemandWage(L) - getSupplyWage(L))
            if (diff < minDiff) { minDiff = diff; bestL = L }
        }
        const wage = getDemandWage(bestL)
        return { L: bestL, W: wage, type: 'competitive' as const }
    }, [getDemandWage, getSupplyWage, getMFC, monopsony])

    const eq = findEquilibrium()

    // Compute surplus/shortage with min wage
    const getMinWageEffects = useCallback(() => {
        if (!minWageEnabled || minWageLevel <= eq.W) return null
        // Quantity supplied at min wage
        let qsAtWage = 1
        for (let L = 1; L <= 200; L += 0.5) {
            if (getSupplyWage(L) <= minWageLevel) qsAtWage = L
        }
        // Quantity demanded at min wage
        let qdAtWage = 1
        for (let L = 200; L >= 1; L -= 0.5) {
            if (getDemandWage(L) >= minWageLevel) { qdAtWage = L; break }
        }
        return {
            qs: qsAtWage,
            qd: qdAtWage,
            surplus: qsAtWage - qdAtWage,
            unemployment: Math.max(0, qsAtWage - qdAtWage),
        }
    }, [minWageEnabled, minWageLevel, eq.W, getSupplyWage, getDemandWage])

    const minWageEffects = getMinWageEffects()

    // MRP at equilibrium
    const mrpAtEq = getDemandWage(eq.L)
    const mpAtEq = mrpAtEq / (productPrice / 50)

    const demoSteps: DemoStep[] = [
        {
            title: 'Factor Markets: Labor',
            description: 'Factor markets are where firms buy inputs (labor, capital, land). The labor market determines wages and employment. Firms demand labor; workers supply labor.',
            setup: () => { setDemandShift(0); setSupplyShift(0); setMinWageEnabled(false); setMonopsony(false); setProductPrice(50) },
        },
        {
            title: 'Labor Demand = MRP',
            description: 'A firm\'s demand for labor equals the Marginal Revenue Product (MRP). MRP = MR x MP. The demand curve slopes DOWN due to diminishing marginal product of labor.',
            setup: () => { setMonopsony(false); setMinWageEnabled(false) },
            highlight: 'Each additional worker produces less (diminishing MP)',
        },
        {
            title: 'Derived Demand',
            description: 'Labor demand is DERIVED from product demand. If the product price rises, MRP rises, shifting labor demand RIGHT. Try adjusting the product price slider!',
            setup: () => { setProductPrice(70); setMonopsony(false); setMinWageEnabled(false) },
            highlight: 'Higher product price = higher MRP = more labor demand',
        },
        {
            title: 'Labor Supply',
            description: 'The labor supply curve slopes UP: higher wages attract more workers. It reflects the opportunity cost of leisure. Shifts from population changes, preferences, or alternative wages.',
            setup: () => { setProductPrice(50); setSupplyShift(0) },
        },
        {
            title: 'Wage Determination',
            description: 'In a competitive labor market, the wage is set where labor supply equals labor demand (MRP). At this wage, every worker is paid their MRP -- the value of what they produce.',
            setup: () => { setDemandShift(0); setSupplyShift(0); setMinWageEnabled(false); setMonopsony(false) },
            highlight: 'Equilibrium: Wage = MRP',
        },
        {
            title: 'Minimum Wage',
            description: 'A minimum wage above equilibrium creates a SURPLUS of labor (unemployment). Quantity supplied exceeds quantity demanded. This is a price FLOOR in the labor market.',
            setup: () => { setMinWageEnabled(true); setMinWageLevel(14); setMonopsony(false) },
            highlight: 'Notice the gap between Qs and Qd',
        },
        {
            title: 'Monopsony',
            description: 'A monopsony is a single buyer of labor. The MFC (Marginal Factor Cost) is above the supply curve. The monopsonist hires where MRP = MFC but pays the SUPPLY wage (lower).',
            setup: () => { setMonopsony(true); setMinWageEnabled(false); setDemandShift(0) },
            highlight: 'Monopsony pays BELOW competitive wage',
        },
        {
            title: 'Min Wage + Monopsony',
            description: 'Paradox: A minimum wage in a monopsony market can INCREASE both wages AND employment (up to competitive level). This is the efficiency argument for minimum wage.',
            setup: () => { setMonopsony(true); setMinWageEnabled(true); setMinWageLevel(12) },
        },
        {
            title: 'Explore!',
            description: 'Shift demand (change in productivity or product price). Shift supply (immigration, labor force participation). Toggle minimum wage and monopsony to see different outcomes.',
            setup: () => { setMonopsony(false); setMinWageEnabled(false); setDemandShift(0); setSupplyShift(0) },
        },
    ]

    const demo = useDemoMode(demoSteps)

    const reset = useCallback(() => {
        setDemandShift(0)
        setSupplyShift(0)
        setMinWageEnabled(false)
        setMinWageLevel(12)
        setMonopsony(false)
        setProductPrice(50)
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

            const maxL = 200
            const maxW = 30
            const toX = (l: number) => padding + (l / maxL) * gw
            const toY = (wage: number) => h - padding - 50 - (wage / maxW) * gh

            ctx.fillStyle = '#1a150a'
            ctx.fillRect(0, 0, w, h)

            // Grid
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.06)'
            ctx.lineWidth = 1
            for (let l = 0; l <= maxL; l += 40) {
                ctx.beginPath(); ctx.moveTo(toX(l), toY(0)); ctx.lineTo(toX(l), toY(maxW)); ctx.stroke()
            }
            for (let wage = 0; wage <= maxW; wage += 5) {
                ctx.beginPath(); ctx.moveTo(toX(0), toY(wage)); ctx.lineTo(toX(maxL), toY(wage)); ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(padding, toY(maxW))
            ctx.lineTo(padding, toY(0))
            ctx.lineTo(toX(maxL), toY(0))
            ctx.stroke()

            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.font = '14px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Quantity of Labor (L)', padding + gw / 2, h - 20)
            ctx.save()
            ctx.translate(22, h / 2 - 25)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Wage (W)', 0, 0)
            ctx.restore()

            // Ticks
            ctx.fillStyle = 'rgba(220, 180, 80, 0.5)'
            ctx.font = '10px system-ui'
            for (let l = 40; l <= maxL; l += 40) {
                ctx.textAlign = 'center'
                ctx.fillText(l.toString(), toX(l), toY(0) + 15)
            }
            for (let wage = 5; wage <= maxW; wage += 5) {
                ctx.textAlign = 'right'
                ctx.fillText('$' + wage, toX(0) - 8, toY(wage) + 4)
            }

            // Minimum wage effects
            if (minWageEnabled && minWageLevel > 0) {
                // Min wage line
                ctx.strokeStyle = 'rgba(255, 150, 50, 0.8)'
                ctx.lineWidth = 2
                ctx.setLineDash([8, 4])
                ctx.beginPath()
                ctx.moveTo(toX(0), toY(minWageLevel))
                ctx.lineTo(toX(maxL), toY(minWageLevel))
                ctx.stroke()
                ctx.setLineDash([])

                ctx.fillStyle = 'rgba(255, 150, 50, 0.9)'
                ctx.font = 'bold 12px system-ui'
                ctx.textAlign = 'right'
                ctx.fillText(`Min Wage: $${minWageLevel.toFixed(0)}`, toX(maxL), toY(minWageLevel) - 10)

                if (minWageEffects && minWageEffects.surplus > 0) {
                    // Unemployment/surplus area
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.15)'
                    ctx.fillRect(
                        toX(minWageEffects.qd),
                        toY(minWageLevel) - 4,
                        toX(minWageEffects.qs) - toX(minWageEffects.qd),
                        8
                    )

                    ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
                    ctx.font = 'bold 12px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(
                        `Unemployment: ${minWageEffects.unemployment.toFixed(0)} workers`,
                        toX((minWageEffects.qd + minWageEffects.qs) / 2),
                        toY(minWageLevel) - 18
                    )

                    // DWL triangle
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.12)'
                    ctx.beginPath()
                    ctx.moveTo(toX(minWageEffects.qd), toY(getDemandWage(minWageEffects.qd)))
                    ctx.lineTo(toX(eq.L), toY(eq.W))
                    ctx.lineTo(toX(minWageEffects.qd), toY(getSupplyWage(minWageEffects.qd)))
                    ctx.closePath()
                    ctx.fill()

                    ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
                    ctx.font = '10px system-ui'
                    ctx.fillText('DWL', toX(minWageEffects.qd) + 20, toY(eq.W))
                }
            }

            // Labor Supply curve (S_L)
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.9)'
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.beginPath()
            let started = false
            for (let L = 0; L <= maxL; L += 1) {
                const wage = getSupplyWage(L)
                if (wage > maxW) break
                if (!started) { ctx.moveTo(toX(L), toY(wage)); started = true }
                else ctx.lineTo(toX(L), toY(wage))
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(100, 150, 255, 1)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            const sLabelL = 160
            const sLabelW = getSupplyWage(sLabelL)
            if (sLabelW < maxW) ctx.fillText('S_L', toX(sLabelL) + 5, toY(sLabelW) - 8)

            // MFC curve (monopsony only)
            if (monopsony) {
                ctx.strokeStyle = 'rgba(255, 150, 100, 0.8)'
                ctx.lineWidth = 2.5
                ctx.beginPath()
                started = false
                for (let L = 0; L <= maxL; L += 1) {
                    const mfc = getMFC(L)
                    if (mfc > maxW) break
                    if (!started) { ctx.moveTo(toX(L), toY(mfc)); started = true }
                    else ctx.lineTo(toX(L), toY(mfc))
                }
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 150, 100, 1)'
                ctx.font = 'bold 13px system-ui'
                const mfcLabelL = 80
                const mfcLabelW = getMFC(mfcLabelL)
                if (mfcLabelW < maxW) ctx.fillText('MFC', toX(mfcLabelL) + 5, toY(mfcLabelW) - 8)
            }

            // Labor Demand curve (D_L = MRP)
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
            ctx.lineWidth = 3
            ctx.beginPath()
            started = false
            for (let L = 0; L <= maxL; L += 1) {
                const wage = getDemandWage(L)
                if (wage < 0) break
                if (wage > maxW) continue
                if (!started) { ctx.moveTo(toX(L), toY(wage)); started = true }
                else ctx.lineTo(toX(L), toY(wage))
            }
            ctx.stroke()
            ctx.fillStyle = 'rgba(255, 100, 100, 1)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('D_L = MRP', toX(10), toY(getDemandWage(10)) - 10)

            // Equilibrium point
            if (eq.L > 0 && eq.W > 0 && eq.W < maxW) {
                // Dashed lines
                ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'
                ctx.lineWidth = 1.5
                ctx.setLineDash([6, 4])
                ctx.beginPath()
                ctx.moveTo(toX(eq.L), toY(eq.W))
                ctx.lineTo(toX(eq.L), toY(0))
                ctx.moveTo(toX(eq.L), toY(eq.W))
                ctx.lineTo(toX(0), toY(eq.W))
                ctx.stroke()
                ctx.setLineDash([])

                // Glow
                const pulse = 0.3 + 0.15 * Math.sin(t * 3)
                const glow = ctx.createRadialGradient(toX(eq.L), toY(eq.W), 0, toX(eq.L), toY(eq.W), 22)
                glow.addColorStop(0, `rgba(220, 180, 80, ${pulse})`)
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath()
                ctx.arc(toX(eq.L), toY(eq.W), 22, 0, Math.PI * 2)
                ctx.fill()

                // Point
                ctx.fillStyle = 'rgba(220, 180, 80, 1)'
                ctx.beginPath()
                ctx.arc(toX(eq.L), toY(eq.W), 7, 0, Math.PI * 2)
                ctx.fill()
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.lineWidth = 2
                ctx.stroke()

                // Labels
                ctx.fillStyle = 'rgba(220, 180, 80, 0.9)'
                ctx.font = '11px monospace'
                ctx.textAlign = 'center'
                ctx.fillText(`L* = ${eq.L.toFixed(0)}`, toX(eq.L), toY(0) + 18)
                ctx.textAlign = 'right'
                ctx.fillText(`W* = $${eq.W.toFixed(1)}`, toX(0) - 8, toY(eq.W) + 4)

                // Monopsony exploitation
                if (monopsony) {
                    const compWage = getDemandWage(eq.L)
                    if (compWage > eq.W) {
                        ctx.fillStyle = 'rgba(255, 150, 100, 0.15)'
                        ctx.fillRect(toX(0), toY(compWage), toX(eq.L) - toX(0), toY(eq.W) - toY(compWage))
                        ctx.fillStyle = 'rgba(255, 150, 100, 0.9)'
                        ctx.font = 'bold 11px system-ui'
                        ctx.textAlign = 'center'
                        ctx.fillText('Exploitation', toX(eq.L / 2), toY((compWage + eq.W) / 2))

                        // Show MRP line
                        ctx.strokeStyle = 'rgba(220, 180, 80, 0.3)'
                        ctx.setLineDash([4, 4])
                        ctx.beginPath()
                        ctx.moveTo(toX(0), toY(compWage))
                        ctx.lineTo(toX(eq.L), toY(compWage))
                        ctx.stroke()
                        ctx.setLineDash([])
                        ctx.fillStyle = 'rgba(220, 180, 80, 0.6)'
                        ctx.font = '10px system-ui'
                        ctx.textAlign = 'right'
                        ctx.fillText(`MRP = $${compWage.toFixed(1)}`, toX(0) - 8, toY(compWage) + 4)
                    }
                }
            }

            // Surplus areas (when no min wage, competitive)
            if (!minWageEnabled && !monopsony && eq.L > 0) {
                // Worker surplus (above supply, below wage)
                ctx.fillStyle = 'rgba(100, 150, 255, 0.12)'
                ctx.beginPath()
                ctx.moveTo(toX(0), toY(eq.W))
                ctx.lineTo(toX(eq.L), toY(eq.W))
                for (let L = eq.L; L >= 0; L -= 2) {
                    ctx.lineTo(toX(L), toY(getSupplyWage(L)))
                }
                ctx.closePath()
                ctx.fill()

                // Firm surplus (above wage, below demand)
                ctx.fillStyle = 'rgba(255, 100, 100, 0.12)'
                ctx.beginPath()
                ctx.moveTo(toX(0), toY(eq.W))
                ctx.lineTo(toX(eq.L), toY(eq.W))
                for (let L = eq.L; L >= 0; L -= 2) {
                    ctx.lineTo(toX(L), toY(getDemandWage(L)))
                }
                ctx.closePath()
                ctx.fill()
            }

            // Legend
            const lx = w - 180
            let ly = 70
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            const items: Array<[string, string]> = [
                ['rgba(255, 100, 100, 0.9)', 'D_L = MRP'],
                ['rgba(100, 150, 255, 0.9)', 'S_L (Labor Supply)'],
            ]
            if (monopsony) items.push(['rgba(255, 150, 100, 0.8)', 'MFC'])
            if (minWageEnabled) items.push(['rgba(255, 150, 50, 0.8)', 'Minimum Wage'])
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
    }, [demandShift, supplyShift, minWageEnabled, minWageLevel, monopsony, productPrice, getDemandWage, getSupplyWage, getMFC, eq, minWageEffects, findEquilibrium])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-medium text-white/90">Factor Markets: Labor</h1>
                    <APTag course="Microeconomics" unit="Unit 5" color={COLOR} />
                </div>
                <Button onClick={demo.open} className="text-xs">AP Tutorial</Button>
            </div>

            <div className="flex-1 relative flex overflow-hidden">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <EquationDisplay
                        equations={[
                            { label: 'MRP', expression: 'MRP = MR x MP', description: 'Marginal revenue product = demand for labor' },
                            { label: 'Wage rule', expression: monopsony ? 'Hire where MRP = MFC' : 'W = MRP in competition', description: monopsony ? 'Pay supply wage, not MFC' : 'Workers earn their marginal product' },
                            { label: 'MP est.', expression: `MP = ${mpAtEq.toFixed(1)} units`, description: `At L* = ${eq.L.toFixed(0)}` },
                            { label: 'MRP', expression: `MRP = $${mrpAtEq.toFixed(1)}/worker` },
                        ]}
                        departmentColor={COLOR}
                        className="absolute top-3 left-3 max-w-xs"
                        title="Factor Market Equations"
                    />

                    <InfoPanel
                        title={monopsony ? 'Monopsony Market' : 'Competitive Labor Market'}
                        departmentColor={COLOR}
                        className="absolute top-3 right-3 min-w-[180px]"
                        items={[
                            { label: 'Employment (L*)', value: eq.L.toFixed(0), color: 'rgb(220, 180, 80)' },
                            { label: 'Wage (W*)', value: `$${eq.W.toFixed(1)}`, color: 'rgb(100, 150, 255)' },
                            { label: 'MRP at L*', value: `$${mrpAtEq.toFixed(1)}`, color: 'rgb(255, 100, 100)' },
                            ...(monopsony ? [{ label: 'Exploitation', value: `$${(mrpAtEq - eq.W).toFixed(1)}`, color: 'rgb(255, 150, 100)' }] : []),
                            ...(minWageEffects ? [
                                { label: 'Unemployment', value: `${minWageEffects.unemployment.toFixed(0)}`, color: 'rgb(255, 100, 100)' },
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
                            title="Factor Markets Tutorial"
                        />
                    </div>
                </div>

                <div className="w-72 bg-black/30 border-l border-white/10 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto">
                    <ControlPanel className="!p-0 !bg-transparent !border-0 !backdrop-blur-0">
                        <Slider
                            label="Labor Demand Shift"
                            value={demandShift}
                            onChange={setDemandShift}
                            min={-5}
                            max={5}
                            step={0.5}
                        />
                        <Slider
                            label="Labor Supply Shift"
                            value={supplyShift}
                            onChange={setSupplyShift}
                            min={-5}
                            max={5}
                            step={0.5}
                        />
                        <Slider
                            label="Product Price"
                            value={productPrice}
                            onChange={setProductPrice}
                            min={20}
                            max={80}
                            step={5}
                        />
                        <Toggle label="Minimum Wage" value={minWageEnabled} onChange={setMinWageEnabled} />
                        {minWageEnabled && (
                            <Slider
                                label="Minimum Wage Level"
                                value={minWageLevel}
                                onChange={setMinWageLevel}
                                min={5}
                                max={25}
                                step={1}
                            />
                        )}
                        <Toggle label="Monopsony" value={monopsony} onChange={setMonopsony} />
                    </ControlPanel>

                    <Button onClick={reset} variant="secondary" className="w-full">
                        Reset All
                    </Button>

                    <div className="mt-auto p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Key Concepts</h4>
                        <ul className="text-xs text-white/50 space-y-1.5 leading-relaxed">
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(255, 100, 100)' }} />Demand = MRP curve</li>
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(100, 150, 255)' }} />Supply = wage needed</li>
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(220, 180, 80)' }} />Equilibrium point</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
