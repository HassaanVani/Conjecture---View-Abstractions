import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'
import { Slider, Button, ButtonGroup } from '@/components/control-panel'

const ECON_COLOR = 'rgb(220, 180, 80)'
type ViewMode = 'product' | 'cost' | 'both'

export default function ProductionCosts() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('both')
    const [laborInput, setLaborInput] = useState(10)
    const [fixedCost, setFixedCost] = useState(100)
    const [wageCost, setWageCost] = useState(20)
    const [showLRATC, setShowLRATC] = useState(false)

    const getOutput = useCallback((L: number) => 10 * Math.sqrt(L), [])
    const getMPL = useCallback((L: number) => L <= 0.5 ? getOutput(1) : getOutput(L) - getOutput(L - 1), [getOutput])
    const getAPL = useCallback((L: number) => L > 0 ? getOutput(L) / L : 0, [getOutput])
    const getTC = useCallback((Q: number) => { const L = (Q / 10) ** 2; return fixedCost + wageCost * L }, [fixedCost, wageCost])
    const getATC = useCallback((Q: number) => Q > 0 ? getTC(Q) / Q : 0, [getTC])
    const getAVC = useCallback((Q: number) => Q > 0 ? (getTC(Q) - fixedCost) / Q : 0, [getTC, fixedCost])
    const getAFC = useCallback((Q: number) => Q > 0 ? fixedCost / Q : 0, [fixedCost])
    const getMC = useCallback((Q: number) => Q <= 0.5 ? getTC(1) - getTC(0) : getTC(Q) - getTC(Q - 1), [getTC])

    // Long-run ATC (economies of scale envelope)
    const getLRATC = useCallback((Q: number) => {
        const minATC = Infinity; let best = Infinity
        for (let fc = 50; fc <= 300; fc += 10) {
            const L = (Q / 10) ** 2; const tc = fc + wageCost * L; const atc = Q > 0 ? tc / Q : 0
            if (atc < best) best = atc
        }
        return best
    }, [wageCost])

    const currentQ = getOutput(laborInput)
    const currentMC = getMC(currentQ), currentATC = getATC(currentQ), currentAVC = getAVC(currentQ)
    const currentMPL = getMPL(laborInput), currentAPL = getAPL(laborInput)

    // Shutdown condition: P < min AVC
    const shutdownPrice = (() => {
        let minAVC = Infinity
        for (let Q = 5; Q <= 70; Q++) { const avc = getAVC(Q); if (avc < minAVC) minAVC = avc }
        return minAVC
    })()

    const demoSteps: DemoStep[] = [
        { title: 'Production & Costs', description: 'This shows how inputs become outputs and how costs change as production scales. Understanding these relationships is key to firm decisions.', setup: () => { setViewMode('both'); setLaborInput(10) } },
        { title: 'Total & Marginal Product', description: 'Total Product (TP) is total output. Marginal Product (MP) is additional output from one more worker. MP eventually FALLS due to diminishing returns.', setup: () => { setViewMode('product'); setLaborInput(5) } },
        { title: 'Diminishing Returns', description: 'Each additional worker produces LESS than the one before. This is the law of diminishing marginal returns -- a fundamental economic principle.', setup: () => { setViewMode('product'); setLaborInput(25) } },
        { title: 'Cost Curves', description: 'When MP is high, MC is low. When MP falls, MC rises. The MC curve is U-shaped, reflecting diminishing returns in reverse.', setup: () => { setViewMode('cost'); setLaborInput(15) } },
        { title: 'MC Crosses ATC at Minimum', description: 'When MC < ATC, ATC falls. When MC > ATC, ATC rises. MC crosses ATC at its minimum -- the efficient scale of production.', setup: () => { setViewMode('cost'); setLaborInput(20) } },
        { title: 'Long-Run ATC', description: 'In the long run, firms can change ALL inputs. The LRATC envelope shows economies of scale (falling), constant returns, and diseconomies (rising).', highlight: 'Toggle LRATC to see the envelope curve', setup: () => { setViewMode('cost'); setShowLRATC(true) } },
        { title: 'Shutdown Condition', description: 'A firm shuts down in the short run if price falls below minimum AVC. Below this, revenue does not even cover variable costs.', highlight: `Shutdown price: $${shutdownPrice.toFixed(2)}`, setup: () => { setViewMode('cost'); setLaborInput(10) } },
        { title: 'Explore', description: 'Adjust labor, fixed costs, and wages. Find where ATC is minimized. What happens to the shutdown point when wages change?', setup: () => { setViewMode('both'); setLaborInput(10); setShowLRATC(false) } },
    ]
    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d'); if (!ctx) return
        const dpr = window.devicePixelRatio || 1
        const resize = () => { canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
        resize(); window.addEventListener('resize', resize)
        const w = canvas.offsetWidth, h = canvas.offsetHeight
        ctx.fillStyle = '#1a150a'; ctx.fillRect(0, 0, w, h)

        const drawProductGraph = (sx: number, gw: number) => {
            const pad = 50, gh = h - 180
            ctx.strokeStyle = 'rgba(220,180,80,0.4)'; ctx.lineWidth = 1; ctx.beginPath()
            ctx.moveTo(sx + pad, 50); ctx.lineTo(sx + pad, 50 + gh); ctx.lineTo(sx + pad + gw - pad, 50 + gh); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Labor (L)', sx + pad + (gw - pad) / 2, 50 + gh + 35)
            ctx.save(); ctx.translate(sx + pad - 35, 50 + gh / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Product', 0, 0); ctx.restore()
            ctx.font = 'bold 14px system-ui'; ctx.fillStyle = 'rgba(100,200,150,1)'; ctx.fillText('Production Function', sx + pad + (gw - pad) / 2, 30)
            const maxL = 40, maxQ = getOutput(maxL) * 1.1
            ctx.strokeStyle = 'rgba(100,200,150,0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath()
            for (let L = 0; L <= maxL; L += 0.5) { const Q = getOutput(L); const x = sx + pad + (L / maxL) * (gw - pad); const y = 50 + gh - (Q / maxQ) * gh; if (L === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
            ctx.stroke(); ctx.fillStyle = 'rgba(100,200,150,0.9)'; ctx.font = '11px system-ui'; ctx.textAlign = 'left'; ctx.fillText('TP', sx + pad + (35 / maxL) * (gw - pad) + 5, 50 + gh - (getOutput(35) / maxQ) * gh)
            const maxMP = getMPL(1) * 1.5
            ctx.strokeStyle = 'rgba(255,150,100,0.8)'; ctx.lineWidth = 2; ctx.beginPath()
            for (let L = 1; L <= maxL; L += 0.5) { const mp = getMPL(L); const x = sx + pad + (L / maxL) * (gw - pad); const y = 50 + gh - (mp / maxMP) * gh * 0.5; if (L === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
            ctx.stroke(); ctx.fillStyle = 'rgba(255,150,100,0.9)'; ctx.fillText('MP', sx + pad + (5 / maxL) * (gw - pad) + 5, 50 + gh - (getMPL(5) / maxMP) * gh * 0.5 - 5)
            ctx.strokeStyle = 'rgba(100,150,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath()
            for (let L = 1; L <= maxL; L += 0.5) { const ap = getAPL(L); const x = sx + pad + (L / maxL) * (gw - pad); const y = 50 + gh - (ap / maxMP) * gh * 0.5; if (L === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
            ctx.stroke(); ctx.fillStyle = 'rgba(100,150,255,0.9)'; ctx.fillText('AP', sx + pad + (8 / maxL) * (gw - pad) + 5, 50 + gh - (getAPL(8) / maxMP) * gh * 0.5 + 15)
            const cx = sx + pad + (laborInput / maxL) * (gw - pad), cy = 50 + gh - (currentQ / maxQ) * gh
            ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill()
            ctx.strokeStyle = 'rgba(220,180,80,0.3)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, 50 + gh); ctx.stroke(); ctx.setLineDash([])
        }

        const drawCostGraph = (sx: number, gw: number) => {
            const pad = 50, gh = h - 180
            ctx.strokeStyle = 'rgba(220,180,80,0.4)'; ctx.lineWidth = 1; ctx.beginPath()
            ctx.moveTo(sx + pad, 50); ctx.lineTo(sx + pad, 50 + gh); ctx.lineTo(sx + pad + gw - pad, 50 + gh); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Quantity (Q)', sx + pad + (gw - pad) / 2, 50 + gh + 35)
            ctx.save(); ctx.translate(sx + pad - 35, 50 + gh / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Cost ($)', 0, 0); ctx.restore()
            ctx.font = 'bold 14px system-ui'; ctx.fillStyle = 'rgba(255,150,100,1)'; ctx.fillText('Cost Curves', sx + pad + (gw - pad) / 2, 30)
            const maxQC = getOutput(40), maxCost = Math.max(getATC(1), getMC(maxQC)) * 1.3
            // Shutdown price line
            ctx.strokeStyle = 'rgba(255,80,80,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
            const sdY = 50 + gh - (shutdownPrice / maxCost) * gh
            ctx.beginPath(); ctx.moveTo(sx + pad, sdY); ctx.lineTo(sx + pad + gw - pad, sdY); ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,80,80,0.7)'; ctx.font = '9px system-ui'; ctx.textAlign = 'right'
            ctx.fillText('Shutdown', sx + pad + gw - pad - 5, sdY - 5)
            // ATC
            ctx.strokeStyle = 'rgba(255,200,100,0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath()
            for (let Q = 5; Q <= maxQC; Q++) { const atc = getATC(Q); const x = sx + pad + (Q / maxQC) * (gw - pad); const y = 50 + gh - (atc / maxCost) * gh; if (Q === 5) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
            ctx.stroke()
            // AVC
            ctx.strokeStyle = 'rgba(100,200,150,0.8)'; ctx.lineWidth = 2; ctx.beginPath()
            for (let Q = 5; Q <= maxQC; Q++) { const avc = getAVC(Q); const x = sx + pad + (Q / maxQC) * (gw - pad); const y = 50 + gh - (avc / maxCost) * gh; if (Q === 5) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
            ctx.stroke()
            // MC
            ctx.strokeStyle = 'rgba(255,100,100,0.9)'; ctx.lineWidth = 3; ctx.beginPath()
            for (let Q = 5; Q <= maxQC; Q++) { const mc = getMC(Q); const x = sx + pad + (Q / maxQC) * (gw - pad); const y = 50 + gh - (mc / maxCost) * gh; if (Q === 5) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
            ctx.stroke()
            // AFC
            ctx.strokeStyle = 'rgba(150,150,255,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath()
            for (let Q = 5; Q <= maxQC; Q += 2) { const afc = getAFC(Q); const x = sx + pad + (Q / maxQC) * (gw - pad); const y = 50 + gh - (afc / maxCost) * gh; if (Q === 5) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
            ctx.stroke(); ctx.setLineDash([])
            // LRATC envelope
            if (showLRATC) {
                ctx.strokeStyle = 'rgba(220,180,80,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]); ctx.beginPath()
                for (let Q = 8; Q <= maxQC; Q++) { const latc = getLRATC(Q); const x = sx + pad + (Q / maxQC) * (gw - pad); const y = 50 + gh - (latc / maxCost) * gh; if (Q === 8) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
                ctx.stroke(); ctx.setLineDash([])
                ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '11px system-ui'; ctx.textAlign = 'left'
                ctx.fillText('LRATC', sx + pad + (maxQC * 0.7 / maxQC) * (gw - pad), 50 + gh - (getLRATC(maxQC * 0.7) / maxCost) * gh - 10)
            }
            // Labels
            ctx.font = '11px system-ui'; ctx.textAlign = 'left'
            ctx.fillStyle = 'rgba(255,200,100,1)'; ctx.fillText('ATC', sx + pad + (55 / maxQC) * (gw - pad), 50 + gh - (getATC(55) / maxCost) * gh - 5)
            ctx.fillStyle = 'rgba(100,200,150,1)'; ctx.fillText('AVC', sx + pad + (55 / maxQC) * (gw - pad), 50 + gh - (getAVC(55) / maxCost) * gh + 15)
            ctx.fillStyle = 'rgba(255,100,100,1)'; ctx.fillText('MC', sx + pad + (45 / maxQC) * (gw - pad), 50 + gh - (getMC(45) / maxCost) * gh + 15)
            // Current point
            const cx = sx + pad + (currentQ / maxQC) * (gw - pad), cy = 50 + gh - (currentATC / maxCost) * gh
            ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill()
        }

        if (viewMode === 'both') { drawProductGraph(30, w / 2 - 40); drawCostGraph(w / 2 + 20, w / 2 - 40) }
        else if (viewMode === 'product') drawProductGraph(60, w - 120)
        else drawCostGraph(60, w - 120)
        return () => window.removeEventListener('resize', resize)
    }, [viewMode, laborInput, fixedCost, wageCost, showLRATC, getOutput, getMPL, getAPL, getTC, getATC, getAVC, getAFC, getMC, getLRATC, currentQ, currentATC, shutdownPrice])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />
                <div className="absolute top-4 left-4 flex items-center gap-3">
                    <APTag course="Microeconomics" unit="Unit 3" color={ECON_COLOR} />
                    <ButtonGroup value={viewMode} onChange={v => setViewMode(v as ViewMode)} options={[{ value: 'product', label: 'Production' }, { value: 'cost', label: 'Costs' }, { value: 'both', label: 'Both' }]} color={ECON_COLOR} />
                    <button onClick={demo.open} className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors">AP Tutorial</button>
                </div>
                <InfoPanel title="Current Values" departmentColor={ECON_COLOR} className="absolute top-4 right-4 w-52" items={[
                    { label: 'Labor (L)', value: laborInput },
                    { label: 'Output (Q)', value: currentQ.toFixed(1), color: 'rgb(100,200,150)' },
                    { label: 'MP', value: currentMPL.toFixed(2), color: 'rgb(255,150,100)' },
                    { label: 'AP', value: currentAPL.toFixed(2), color: 'rgb(100,150,255)' },
                    { label: 'MC', value: `$${currentMC.toFixed(2)}`, color: 'rgb(255,100,100)' },
                    { label: 'ATC', value: `$${currentATC.toFixed(2)}`, color: 'rgb(255,200,100)' },
                    { label: 'AVC', value: `$${currentAVC.toFixed(2)}`, color: 'rgb(100,200,150)' },
                    { label: 'Shutdown P', value: `$${shutdownPrice.toFixed(2)}`, color: 'rgb(255,80,80)' },
                    { label: 'MC vs ATC', value: currentMC < currentATC ? 'ATC falling' : currentMC > currentATC ? 'ATC rising' : 'Efficient scale' },
                ]} />
                <EquationDisplay departmentColor={ECON_COLOR} className="absolute bottom-28 right-4 w-64" collapsed title="Cost Equations" equations={[
                    { label: 'TC', expression: 'TC = FC + VC', description: 'Total = Fixed + Variable Cost' },
                    { label: 'ATC', expression: 'ATC = TC / Q', description: 'Average Total Cost' },
                    { label: 'MC', expression: 'MC = dTC/dQ', description: 'Marginal Cost' },
                    { label: 'Shutdown', expression: 'P < min AVC', description: 'Firm shuts down in short run' },
                ]} />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={ECON_COLOR} />
                </div>
            </div>
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <Slider label="Labor (L)" value={laborInput} onChange={setLaborInput} min={1} max={40} />
                    <Slider label="Fixed Cost" value={fixedCost} onChange={setFixedCost} min={50} max={200} step={10} />
                    <Slider label="Wage" value={wageCost} onChange={setWageCost} min={10} max={40} step={2} />
                    <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer"><input type="checkbox" checked={showLRATC} onChange={e => setShowLRATC(e.target.checked)} className="accent-yellow-400" />LRATC</label>
                    <Button onClick={() => { setLaborInput(10); setFixedCost(100); setWageCost(20); setShowLRATC(false) }} variant="secondary">Reset</Button>
                </div>
            </div>
        </div>
    )
}
