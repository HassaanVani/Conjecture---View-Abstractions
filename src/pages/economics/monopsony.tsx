import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const GOLD = 'rgb(220, 180, 80)'

export default function Monopsony() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [laborDemandSlope, setLaborDemandSlope] = useState(1.2)
    const [laborSupplySlope, setLaborSupplySlope] = useState(0.8)
    const [showCompetitive, setShowCompetitive] = useState(true)
    const [minWage, setMinWage] = useState(0)
    const [showDWL, setShowDWL] = useState(true)

    // Curve functions: labor quantity L in [0, 10]
    // MRP (demand): W = intercept - slope * L
    const mrpIntercept = 12
    const getMRP = useCallback((l: number) => mrpIntercept - laborDemandSlope * l, [laborDemandSlope])
    // Supply (AFC): W = base + slope * L
    const supplyBase = 1
    const getSupply = useCallback((l: number) => supplyBase + laborSupplySlope * l, [laborSupplySlope])
    // MFC: W = base + 2 * slope * L (twice the slope of supply for linear supply)
    const getMFC = useCallback((l: number) => supplyBase + 2 * laborSupplySlope * l, [laborSupplySlope])

    // Equilibrium calculations
    const equils = useMemo(() => {
        // Competitive: Supply = MRP => base + sSlope*L = intercept - dSlope*L
        const compL = (mrpIntercept - supplyBase) / (laborSupplySlope + laborDemandSlope)
        const compW = getSupply(compL)
        // Monopsony: MFC = MRP => base + 2*sSlope*L = intercept - dSlope*L
        const monoL = (mrpIntercept - supplyBase) / (2 * laborSupplySlope + laborDemandSlope)
        const monoW = getSupply(monoL)
        const monoMFC = getMFC(monoL)

        // Min wage effects
        let effectiveL = monoL
        let effectiveW = monoW
        if (minWage > 0 && minWage > monoW) {
            // With min wage floor, firm hires where MRP = minWage (if minWage <= compW)
            // or the supply-constrained quantity
            if (minWage <= compW) {
                // Min wage between monopsony and competitive wage: increases both W and L
                effectiveW = minWage
                effectiveL = (mrpIntercept - minWage) / laborDemandSlope
            } else {
                // Min wage above competitive: reduces employment
                effectiveW = minWage
                effectiveL = (mrpIntercept - minWage) / laborDemandSlope
            }
            effectiveL = Math.max(0, effectiveL)
        }

        // DWL: triangle between competitive and monopsony outcomes
        // Vertices: (monoL, monoW), (compL, compW), and (monoL, getMRP(monoL))
        const dwl = 0.5 * (compL - monoL) * (getMRP(monoL) - monoW) - 0.5 * (compL - monoL) * (compW - monoW)

        return { compL, compW, monoL, monoW, monoMFC, effectiveL, effectiveW, dwl: Math.max(0, dwl) }
    }, [laborDemandSlope, laborSupplySlope, getMRP, getSupply, getMFC, minWage])

    const resetDefaults = useCallback(() => {
        setLaborDemandSlope(1.2)
        setLaborSupplySlope(0.8)
        setShowCompetitive(true)
        setMinWage(0)
        setShowDWL(true)
    }, [])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'Factor Markets', description: 'In factor markets, firms demand labor and workers supply it. The wage is determined by the interaction of supply and demand for labor.', setup: () => { resetDefaults(); setShowCompetitive(false); setShowDWL(false) } },
        { title: 'MRP Curve', description: 'The Marginal Revenue Product (MRP) curve is the firm\'s demand for labor. MRP = MR x MP. It slopes downward due to diminishing marginal returns.', setup: () => { resetDefaults(); setShowCompetitive(false); setShowDWL(false) } },
        { title: 'Competitive Labor Market', description: 'In a competitive labor market, equilibrium occurs where Supply = MRP. Many firms compete for workers, so no single firm can set the wage.', setup: () => { resetDefaults(); setShowDWL(false); setMinWage(0) } },
        { title: 'Monopsony Power', description: 'A monopsony is a single buyer of labor. The firm faces the entire market supply curve and must raise wages for ALL workers to hire one more.', setup: () => { resetDefaults(); setShowCompetitive(false); setShowDWL(false) } },
        { title: 'MFC Above Supply', description: 'Because hiring one more worker raises wages for all, the Marginal Factor Cost (MFC) exceeds the supply curve wage. MFC has twice the slope of supply.', setup: () => { resetDefaults(); setShowCompetitive(false); setShowDWL(false) } },
        { title: 'Monopsony vs Competitive', description: 'The monopsony hires where MFC = MRP, then pays the supply-curve wage. Result: lower employment AND lower wages than the competitive outcome.', setup: () => { resetDefaults(); setMinWage(0) } },
        { title: 'Minimum Wage in Monopsony', description: 'Uniquely, a minimum wage CAN increase BOTH employment and wages in a monopsony -- up to the competitive wage. This corrects the market failure.', setup: () => { resetDefaults(); setMinWage(Math.round(equils.compW * 2) / 2) } },
        { title: 'Experiment', description: 'Adjust the demand and supply slopes, toggle the competitive outcome, and try different minimum wage levels. Observe how deadweight loss changes!', setup: () => resetDefaults() },
    ], [resetDefaults, equils.compW])

    const demo = useDemoMode(demoSteps)

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

        const maxL = 10, maxW = 14
        const toX = (l: number) => padding + (l / maxL) * gW
        const toY = (w: number) => height - padding - 50 - (w / maxW) * gH

        // Grid
        ctx.strokeStyle = 'rgba(220,180,80,0.06)'
        ctx.lineWidth = 1
        for (let l = 0; l <= maxL; l++) { ctx.beginPath(); ctx.moveTo(toX(l), toY(0)); ctx.lineTo(toX(l), toY(maxW)); ctx.stroke() }
        for (let w = 0; w <= maxW; w += 2) { ctx.beginPath(); ctx.moveTo(toX(0), toY(w)); ctx.lineTo(toX(maxL), toY(w)); ctx.stroke() }

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padding, toY(maxW))
        ctx.lineTo(padding, toY(0))
        ctx.lineTo(toX(maxL), toY(0))
        ctx.stroke()

        // Axis labels
        ctx.fillStyle = 'rgba(220,180,80,0.8)'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Quantity of Labor', padding + gW / 2, height - 20)
        ctx.save()
        ctx.translate(22, height / 2 - 25)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('Wage ($)', 0, 0)
        ctx.restore()

        // Ticks
        ctx.font = '10px system-ui'
        ctx.fillStyle = 'rgba(220,180,80,0.5)'
        for (let l = 2; l <= maxL; l += 2) { ctx.textAlign = 'center'; ctx.fillText(String(l), toX(l), toY(0) + 15) }
        for (let w = 2; w <= maxW; w += 2) { ctx.textAlign = 'right'; ctx.fillText('$' + w, toX(0) - 8, toY(w) + 4) }

        // Helper: draw a curve segment
        const drawCurve = (fn: (l: number) => number, color: string, lineWidth: number, dash: number[] = []) => {
            ctx.strokeStyle = color
            ctx.lineWidth = lineWidth
            ctx.setLineDash(dash)
            ctx.beginPath()
            let started = false
            for (let l = 0; l <= maxL; l += 0.1) {
                const w = fn(l)
                if (w < 0 || w > maxW) { started = false; continue }
                if (!started) { ctx.moveTo(toX(l), toY(w)); started = true }
                else ctx.lineTo(toX(l), toY(w))
            }
            ctx.stroke()
            ctx.setLineDash([])
        }

        // DWL shading (draw before curves so it's behind)
        if (showDWL && equils.compL > equils.monoL) {
            const { monoL, monoW, compL, compW } = equils
            ctx.fillStyle = 'rgba(220,180,80,0.12)'
            ctx.beginPath()
            ctx.moveTo(toX(monoL), toY(monoW))
            // Along supply curve from monoL to compL
            for (let l = monoL; l <= compL; l += 0.05) ctx.lineTo(toX(l), toY(getSupply(l)))
            // Along MRP curve from compL back to monoL
            for (let l = compL; l >= monoL; l -= 0.05) ctx.lineTo(toX(l), toY(getMRP(l)))
            ctx.closePath()
            ctx.fill()
            // DWL label
            const dwlCenterL = (monoL + compL) / 2
            const dwlCenterW = (monoW + compW + getMRP(dwlCenterL)) / 3
            ctx.fillStyle = 'rgba(220,180,80,0.6)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('DWL', toX(dwlCenterL), toY(dwlCenterW))
        }

        // Minimum wage line
        if (minWage > 0) {
            ctx.strokeStyle = 'rgba(255,100,100,0.7)'
            ctx.lineWidth = 2
            ctx.setLineDash([6, 4])
            ctx.beginPath()
            ctx.moveTo(toX(0), toY(minWage))
            ctx.lineTo(toX(maxL), toY(minWage))
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,100,100,0.9)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'right'
            ctx.fillText(`Min Wage = $${minWage.toFixed(1)}`, toX(maxL) - 5, toY(minWage) - 8)
        }

        // Supply curve (AFC)
        drawCurve(getSupply, 'rgba(100,200,150,0.9)', 3)
        // Label supply
        const sLabelL = 8.5, sLabelW = getSupply(sLabelL)
        if (sLabelW <= maxW) {
            ctx.fillStyle = 'rgba(100,200,150,0.9)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('S (AFC)', toX(sLabelL) + 5, toY(sLabelW) + 4)
        }

        // MFC curve
        drawCurve(getMFC, 'rgba(255,150,80,0.9)', 3)
        const mfcLabelL = 4.5, mfcLabelW = getMFC(mfcLabelL)
        if (mfcLabelW <= maxW) {
            ctx.fillStyle = 'rgba(255,150,80,0.9)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('MFC', toX(mfcLabelL) + 5, toY(mfcLabelW) - 8)
        }

        // MRP curve (demand)
        drawCurve(getMRP, 'rgba(100,150,255,0.9)', 3)
        const mrpLabelL = 1, mrpLabelW = getMRP(mrpLabelL)
        if (mrpLabelW <= maxW) {
            ctx.fillStyle = 'rgba(100,150,255,0.9)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('MRP (D)', toX(mrpLabelL) - 15, toY(mrpLabelW) - 10)
        }

        // Monopsony equilibrium
        const { monoL, monoW, monoMFC, compL, compW, effectiveL, effectiveW } = equils

        // Dashed lines from monopsony point
        if (monoL > 0 && monoL <= maxL && monoW > 0 && monoW <= maxW) {
            // Vertical from MFC=MRP intersection down to supply
            ctx.strokeStyle = 'rgba(220,180,80,0.4)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 3])
            ctx.beginPath()
            ctx.moveTo(toX(monoL), toY(monoMFC))
            ctx.lineTo(toX(monoL), toY(0))
            ctx.stroke()
            // Horizontal from monopsony wage
            ctx.beginPath()
            ctx.moveTo(toX(0), toY(monoW))
            ctx.lineTo(toX(monoL), toY(monoW))
            ctx.stroke()
            ctx.setLineDash([])

            // MFC=MRP intersection dot
            ctx.fillStyle = 'rgba(255,150,80,0.9)'
            ctx.beginPath()
            ctx.arc(toX(monoL), toY(monoMFC), 5, 0, Math.PI * 2)
            ctx.fill()

            // Monopsony point on supply curve (wage paid)
            const glow = ctx.createRadialGradient(toX(monoL), toY(monoW), 0, toX(monoL), toY(monoW), 20)
            glow.addColorStop(0, 'rgba(220,180,80,0.4)')
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.beginPath()
            ctx.arc(toX(monoL), toY(monoW), 20, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = 'rgba(220,180,80,1)'
            ctx.beginPath()
            ctx.arc(toX(monoL), toY(monoW), 7, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'
            ctx.lineWidth = 2
            ctx.stroke()

            // Label
            ctx.fillStyle = 'rgba(220,180,80,0.9)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Monopsony', toX(monoL), toY(monoW) + 20)
            ctx.font = '10px monospace'
            ctx.fillText(`(L=${monoL.toFixed(1)}, W=$${monoW.toFixed(1)})`, toX(monoL), toY(monoW) + 33)
        }

        // Competitive equilibrium
        if (showCompetitive && compL > 0 && compL <= maxL && compW > 0 && compW <= maxW) {
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 3])
            ctx.beginPath()
            ctx.moveTo(toX(compL), toY(compW))
            ctx.lineTo(toX(compL), toY(0))
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(toX(0), toY(compW))
            ctx.lineTo(toX(compL), toY(compW))
            ctx.stroke()
            ctx.setLineDash([])

            ctx.fillStyle = 'rgba(255,255,255,0.9)'
            ctx.beginPath()
            ctx.arc(toX(compL), toY(compW), 7, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'
            ctx.lineWidth = 2
            ctx.stroke()

            ctx.fillStyle = 'rgba(255,255,255,0.8)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Competitive', toX(compL), toY(compW) - 15)
            ctx.font = '10px monospace'
            ctx.fillText(`(L=${compL.toFixed(1)}, W=$${compW.toFixed(1)})`, toX(compL), toY(compW) - 3)
        }

        // Min wage effective point
        if (minWage > 0 && minWage > monoW && effectiveL > 0) {
            ctx.fillStyle = 'rgba(255,100,100,0.9)'
            ctx.beginPath()
            ctx.arc(toX(effectiveL), toY(effectiveW), 6, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = 'rgba(255,100,100,0.8)'
            ctx.font = '10px monospace'
            ctx.textAlign = 'center'
            ctx.fillText(`MW (L=${effectiveL.toFixed(1)})`, toX(effectiveL), toY(effectiveW) - 12)
        }

        return () => window.removeEventListener('resize', resize)
    }, [laborDemandSlope, laborSupplySlope, showCompetitive, minWage, showDWL, getMRP, getSupply, getMFC, equils])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Curves">
                            <Slider label="MRP Steepness" value={laborDemandSlope} onChange={setLaborDemandSlope} min={0.4} max={2.5} step={0.1} />
                            <Slider label="Supply Steepness" value={laborSupplySlope} onChange={setLaborSupplySlope} min={0.3} max={2.0} step={0.1} />
                        </ControlGroup>
                        <ControlGroup label="Policy">
                            <Slider label={`Min Wage${minWage > 0 ? ` ($${minWage.toFixed(1)})` : ' (Off)'}`} value={minWage} onChange={setMinWage} min={0} max={10} step={0.5} />
                        </ControlGroup>
                        <Toggle label="Show Competitive" value={showCompetitive} onChange={setShowCompetitive} />
                        <Toggle label="Show DWL" value={showDWL} onChange={setShowDWL} />
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={resetDefaults} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Microeconomics" unit="Unit 5" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title="Market Outcomes" items={[
                        { label: 'Wage (monopsony)', value: `$${equils.monoW.toFixed(2)}`, color: GOLD },
                        { label: 'Wage (competitive)', value: `$${equils.compW.toFixed(2)}`, color: 'rgba(255,255,255,0.9)' },
                        { label: 'Employ. (monopsony)', value: equils.monoL.toFixed(2), color: GOLD },
                        { label: 'Employ. (competitive)', value: equils.compL.toFixed(2), color: 'rgba(255,255,255,0.9)' },
                        { label: 'DWL', value: `$${equils.dwl.toFixed(2)}`, color: 'rgba(220,180,80,0.7)' },
                        ...(minWage > 0 ? [{ label: 'Min Wage Effect', value: `L=${equils.effectiveL.toFixed(1)}, W=$${equils.effectiveW.toFixed(1)}`, color: 'rgba(255,100,100,1)' }] : []),
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'MRP', expression: 'MRP = MR × MP', description: 'Marginal Revenue Product' },
                        { label: 'Hire rule', expression: 'Hire where MRP = MFC', description: 'Profit maximization' },
                        { label: 'Monopsony', expression: 'MFC > W', description: 'Wage < competitive level' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
