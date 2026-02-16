import { useState, useEffect, useRef, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type ModelType = 'simple' | 'government' | 'open'

const GOLD = 'rgb(220, 180, 80)'

export default function CircularFlow() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [model, setModel] = useState<ModelType>('simple')
    const [animationFrame, setAnimationFrame] = useState(0)
    const [showValues, setShowValues] = useState(true)
    const [consumption, setConsumption] = useState(70)
    const [investment, setInvestment] = useState(18)
    const [govSpending, setGovSpending] = useState(20)
    const [exports, setExports] = useState(12)
    const [imports, setImports] = useState(15)
    const taxes = 22
    const netExports = exports - imports
    const gdp = consumption + investment + govSpending + netExports

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'The Circular Flow', description: 'The economy is a continuous flow of goods, services, resources, and money between different sectors.', setup: () => setModel('simple') },
        { title: 'Two-Sector Model', description: 'Households sell labor to firms. Firms pay income. Households buy goods. Money flows in circles!', setup: () => setModel('simple') },
        { title: 'Adding Government', description: 'Government collects TAXES (leakage) and spends on goods/services (injection). Can run deficits or surpluses.', setup: () => setModel('government') },
        { title: 'Opening to Trade', description: 'EXPORTS = money flowing IN (injection). IMPORTS = money flowing OUT (leakage). NX can be positive or negative.', setup: () => setModel('open') },
        { title: 'GDP Identity', description: 'GDP = C + I + G + NX. Expenditure approach: total spending = total output = total income.', setup: () => setModel('open') },
        { title: 'Leakages & Injections', description: 'LEAKAGES: Savings, Taxes, Imports. INJECTIONS: Investment, Government, Exports. Equal = stable economy.', setup: () => setModel('open') },
        { title: 'Multiplier Effect', description: 'An injection creates a chain of spending. The multiplier = 1/(1-MPC). Larger MPC = larger multiplier.', setup: () => setModel('open') },
        { title: 'Experiment', description: 'Adjust C, I, G, X, M and watch GDP change. Try creating a trade deficit or surplus!', setup: () => setModel('open') },
    ], [])

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const interval = setInterval(() => setAnimationFrame(f => (f + 1) % 360), 40)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const resize = () => { canvas.width = canvas.offsetWidth * window.devicePixelRatio; canvas.height = canvas.offsetHeight * window.devicePixelRatio; ctx.scale(window.devicePixelRatio, window.devicePixelRatio) }
        resize()
        window.addEventListener('resize', resize)
        const width = canvas.offsetWidth, height = canvas.offsetHeight
        const cx = width / 2, cy = height / 2 - 30
        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, width, height)

        const drawEntity = (x: number, y: number, label: string, color: string, size = 90) => {
            ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.roundRect(x - size / 2 + 3, y - 25 + 3, size, 50, 12); ctx.fill()
            ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x - size / 2, y - 25, size, 50, 12); ctx.fill()
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.stroke()
            ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y)
        }

        const drawFlow = (from: { x: number; y: number }, to: { x: number; y: number }, label: string, value: number, color: string, curveDir = 1) => {
            const midX = (from.x + to.x) / 2, midY = (from.y + to.y) / 2
            const dx = to.x - from.x, dy = to.y - from.y, len = Math.sqrt(dx * dx + dy * dy)
            const perpX = (-dy / len) * 40 * curveDir, perpY = (dx / len) * 40 * curveDir
            ctx.strokeStyle = color; ctx.lineWidth = 2 + (value / 50); ctx.lineCap = 'round'
            ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.quadraticCurveTo(midX + perpX, midY + perpY, to.x, to.y); ctx.stroke()
            const angle = Math.atan2(to.y - (midY + perpY), to.x - (midX + perpX))
            ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(to.x, to.y); ctx.lineTo(to.x - 10 * Math.cos(angle - 0.3), to.y - 10 * Math.sin(angle - 0.3)); ctx.lineTo(to.x - 10 * Math.cos(angle + 0.3), to.y - 10 * Math.sin(angle + 0.3)); ctx.closePath(); ctx.fill()
            const numParticles = Math.min(4, Math.floor(value / 15) + 1)
            for (let i = 0; i < numParticles; i++) {
                const t = ((animationFrame / 90 + i / numParticles) % 1), t2 = t * t, mt = 1 - t, mt2 = mt * mt
                const px = mt2 * from.x + 2 * mt * t * (midX + perpX) + t2 * to.x
                const py = mt2 * from.y + 2 * mt * t * (midY + perpY) + t2 * to.y
                ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 3 + value / 40, 0, Math.PI * 2); ctx.fill()
            }
            if (showValues) {
                const labelX = midX + perpX * 0.8, labelY = midY + perpY * 0.8
                ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.roundRect(labelX - 30, labelY - 16, 60, 32, 6); ctx.fill()
                ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'; ctx.fillText(label, labelX, labelY - 5)
                ctx.font = 'bold 11px monospace'; ctx.fillStyle = color; ctx.fillText(`$${value}B`, labelX, labelY + 8)
            }
        }

        if (model === 'simple') {
            const hY = cy + 100, fY = cy - 100
            drawEntity(cx, fY, 'Firms', 'rgba(100,150,255,0.25)')
            drawEntity(cx, hY, 'Households', 'rgba(255,150,100,0.25)')
            drawFlow({ x: cx - 100, y: fY + 25 }, { x: cx - 100, y: hY - 25 }, 'Goods', gdp, 'rgba(100,200,150,0.8)', 1)
            drawFlow({ x: cx + 60, y: fY + 25 }, { x: cx + 60, y: hY - 25 }, 'Income', gdp, 'rgba(200,180,100,0.8)', -1)
            drawFlow({ x: cx - 60, y: hY - 25 }, { x: cx - 60, y: fY + 25 }, 'Spending', consumption, 'rgba(255,150,100,0.8)', 1)
            drawFlow({ x: cx + 100, y: hY - 25 }, { x: cx + 100, y: fY + 25 }, 'Labor', gdp, 'rgba(150,100,255,0.8)', -1)
        } else {
            const r = 130
            const entities = [
                { x: cx, y: cy - r, label: 'Firms', color: 'rgba(100,150,255,0.25)' },
                { x: cx, y: cy + r, label: 'Households', color: 'rgba(255,150,100,0.25)' },
            ]
            if (model === 'government' || model === 'open') entities.push({ x: cx + r + 20, y: cy, label: 'Government', color: 'rgba(150,100,255,0.25)' })
            if (model === 'open') entities.push({ x: cx - r - 20, y: cy, label: 'Foreign', color: 'rgba(100,200,150,0.25)' })
            entities.forEach(e => drawEntity(e.x, e.y, e.label, e.color, 95))
            drawFlow({ x: cx - 50, y: cy + r - 25 }, { x: cx - 50, y: cy - r + 25 }, 'C', consumption, 'rgba(255,150,100,0.8)', 1)
            drawFlow({ x: cx + 50, y: cy - r + 25 }, { x: cx + 50, y: cy + r - 25 }, 'Income', gdp, 'rgba(200,180,100,0.8)', 1)
            if (model === 'government' || model === 'open') {
                drawFlow({ x: cx + 30, y: cy + r - 25 }, { x: cx + r - 30, y: cy - 30 }, 'I', investment, 'rgba(220,180,80,0.8)', -1)
                drawFlow({ x: cx + r - 30, y: cy + 30 }, { x: cx + 30, y: cy - r + 25 }, 'G', govSpending, 'rgba(150,100,255,0.8)', -1)
                drawFlow({ x: cx + 60, y: cy + r - 25 }, { x: cx + r - 40, y: cy + 40 }, 'T', taxes, 'rgba(255,100,100,0.6)', 1)
            }
            if (model === 'open') {
                drawFlow({ x: cx - r + 30, y: cy - 30 }, { x: cx - 30, y: cy - r + 25 }, 'X', exports, 'rgba(100,255,150,0.8)', 1)
                drawFlow({ x: cx - 30, y: cy - r + 25 }, { x: cx - r + 30, y: cy + 30 }, 'M', imports, 'rgba(255,100,100,0.6)', 1)
            }
        }

        // GDP display
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.roundRect(cx - 180, height - 85, 360, 65, 12); ctx.fill()
        ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('GDP = C + I + G + (X - M)', cx, height - 60)
        ctx.font = '13px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.8)'
        if (model === 'open') ctx.fillText(`${consumption} + ${investment} + ${govSpending} + (${exports} - ${imports}) = $${gdp}B`, cx, height - 38)
        else if (model === 'government') ctx.fillText(`${consumption} + ${investment} + ${govSpending} = $${consumption + investment + govSpending}B`, cx, height - 38)
        else ctx.fillText(`${consumption} = $${consumption}B (Simple Model)`, cx, height - 38)

        return () => window.removeEventListener('resize', resize)
    }, [model, animationFrame, consumption, investment, govSpending, exports, imports, gdp, showValues])

    const handleReset = () => { setConsumption(70); setInvestment(18); setGovSpending(20); setExports(12); setImports(15) }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Model">
                            <ButtonGroup value={model} onChange={v => setModel(v as ModelType)} options={[{ value: 'simple', label: '2-Sector' }, { value: 'government', label: '+Gov' }, { value: 'open', label: 'Open' }]} color={GOLD} />
                        </ControlGroup>
                        <Toggle label="Show Values" value={showValues} onChange={setShowValues} />
                        <Slider label="Consumption (C)" value={consumption} onChange={setConsumption} min={40} max={90} />
                        <Slider label="Investment (I)" value={investment} onChange={setInvestment} min={5} max={35} />
                        {model !== 'simple' && <Slider label="Gov Spending (G)" value={govSpending} onChange={setGovSpending} min={10} max={40} />}
                        {model === 'open' && <>
                            <Slider label="Exports (X)" value={exports} onChange={setExports} min={5} max={30} />
                            <Slider label="Imports (M)" value={imports} onChange={setImports} min={5} max={30} />
                        </>}
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={handleReset} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 1" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title="GDP Components" items={[
                        { label: 'GDP', value: `$${gdp}B`, color: GOLD },
                        { label: 'C', value: `$${consumption}B`, color: 'rgba(255, 150, 100, 1)' },
                        { label: 'I', value: `$${investment}B`, color: GOLD },
                        ...(model !== 'simple' ? [{ label: 'G', value: `$${govSpending}B`, color: 'rgba(150, 100, 255, 1)' }] : []),
                        ...(model === 'open' ? [{ label: 'NX', value: `$${netExports}B`, color: netExports >= 0 ? 'rgba(100, 200, 150, 1)' : 'rgba(255, 100, 100, 1)' }] : []),
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'GDP', expression: 'Y = C + I + G + NX' },
                        { label: 'NX', expression: 'NX = Exports - Imports' },
                        { label: 'Balance', expression: 'S + T + M = I + G + X', description: 'Leakages = Injections' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
