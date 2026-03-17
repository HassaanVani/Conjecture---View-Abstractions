import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type Scenario = 'balanced' | 'trade-deficit' | 'trade-surplus' | 'capital-flight'

const GOLD = 'rgb(220, 180, 80)'

const scenarioPresets: Record<Scenario, { exports: number; imports: number; foreignInvestment: number; domesticInvestment: number; label: string }> = {
    balanced: { exports: 500, imports: 500, foreignInvestment: 200, domesticInvestment: 200, label: 'Balanced' },
    'trade-deficit': { exports: 300, imports: 600, foreignInvestment: 500, domesticInvestment: 200, label: 'Trade Deficit' },
    'trade-surplus': { exports: 700, imports: 400, foreignInvestment: 150, domesticInvestment: 450, label: 'Trade Surplus' },
    'capital-flight': { exports: 400, imports: 350, foreignInvestment: 100, domesticInvestment: 500, label: 'Capital Flight' },
}

export default function BalanceOfPayments() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const timeRef = useRef(0)

    const [exports_, setExports] = useState(500)
    const [imports_, setImports] = useState(500)
    const [foreignInvestment, setForeignInvestment] = useState(200)
    const [domesticInvestment, setDomesticInvestment] = useState(200)
    const [scenario, setScenario] = useState<Scenario>('balanced')
    const [showFlows, setShowFlows] = useState(true)

    const netIncome = useMemo(() => Math.round((exports_ - imports_) * 0.05), [exports_, imports_])
    const transfers = useMemo(() => -20, [])
    const currentAccount = useMemo(() => exports_ - imports_ + netIncome + transfers, [exports_, imports_, netIncome, transfers])
    const capitalAccount = useMemo(() => foreignInvestment - domesticInvestment, [foreignInvestment, domesticInvestment])
    const bopBalance = useMemo(() => currentAccount + capitalAccount, [currentAccount, capitalAccount])
    const tradeBalance = useMemo(() => exports_ - imports_, [exports_, imports_])

    const exchangePressure = useMemo(() => {
        if (bopBalance > 50) return 'Appreciation'
        if (bopBalance < -50) return 'Depreciation'
        return 'Stable'
    }, [bopBalance])

    const applyScenario = useCallback((s: Scenario) => {
        setScenario(s)
        const p = scenarioPresets[s]
        setExports(p.exports)
        setImports(p.imports)
        setForeignInvestment(p.foreignInvestment)
        setDomesticInvestment(p.domesticInvestment)
    }, [])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'Balance of Payments', description: 'The BOP records ALL economic transactions between a country and the rest of the world. It has two main accounts that must balance.', setup: () => applyScenario('balanced') },
        { title: 'Current Account', description: 'Tracks trade in goods/services (exports - imports), net income from abroad, and unilateral transfers. A surplus means more money flowing IN.', setup: () => applyScenario('balanced') },
        { title: 'Capital/Financial Account', description: 'Tracks investment flows: foreign investment coming IN minus domestic investment going OUT. Capital inflows = foreigners buying our assets.', setup: () => applyScenario('balanced') },
        { title: 'Why It Balances', description: 'CA + KA must equal zero. A trade deficit (buying more than selling) must be financed by capital inflows (foreigners lending/investing).', setup: () => applyScenario('balanced') },
        { title: 'Trade Deficit', description: 'Imports exceed exports. The current account is negative. Capital must flow IN to finance the deficit -- foreigners invest the surplus dollars.', setup: () => applyScenario('trade-deficit') },
        { title: 'Trade Surplus', description: 'Exports exceed imports. Current account is positive. Domestic investors send capital abroad, investing the surplus earnings.', setup: () => applyScenario('trade-surplus') },
        { title: 'Exchange Rate Link', description: 'BOP imbalances affect exchange rates. Trade deficit = more demand for foreign currency = depreciation. Surplus = appreciation.', setup: () => applyScenario('trade-deficit') },
        { title: 'Experiment', description: 'Adjust sliders to see how trade and investment flows interact. Toggle animated flows. Try to make the BOP balance!', setup: () => applyScenario('balanced') },
    ], [applyScenario])

    const demo = useDemoMode(demoSteps)

    // Animation + rendering
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

        const drawFrame = () => {
            timeRef.current += 0.02
            const t = timeRef.current
            const w = canvas.offsetWidth, h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = '#1a150a'
            ctx.fillRect(0, 0, w, h)

            const midX = w / 2
            const tAccountTop = 40
            const tAccountH = h * 0.45
            const tAccountW = w * 0.8
            const tLeft = midX - tAccountW / 2
            const tRight = midX + tAccountW / 2
            const barTop = tAccountTop + tAccountH + 50

            // --- T-Account Header ---
            ctx.fillStyle = 'rgba(220,180,80,0.9)'
            ctx.font = 'bold 16px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('BALANCE OF PAYMENTS', midX, tAccountTop - 10)

            // T-account box
            ctx.strokeStyle = 'rgba(220,180,80,0.35)'
            ctx.lineWidth = 2
            ctx.strokeRect(tLeft, tAccountTop, tAccountW, tAccountH)
            // Vertical divider
            ctx.beginPath()
            ctx.moveTo(midX, tAccountTop)
            ctx.lineTo(midX, tAccountTop + tAccountH)
            ctx.stroke()
            // Horizontal divider under headers
            const headerH = 30
            ctx.beginPath()
            ctx.moveTo(tLeft, tAccountTop + headerH)
            ctx.lineTo(tRight, tAccountTop + headerH)
            ctx.stroke()

            // Headers
            ctx.fillStyle = 'rgba(220,180,80,0.85)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('CURRENT ACCOUNT', tLeft + tAccountW / 4, tAccountTop + 20)
            ctx.fillText('CAPITAL / FINANCIAL ACCOUNT', midX + tAccountW / 4, tAccountTop + 20)

            const itemStartY = tAccountTop + headerH + 25
            const lineH = 28

            // --- Current Account Items ---
            const caItems = [
                { label: 'Exports', value: exports_, color: 'rgba(80,200,120,0.9)', inflow: true },
                { label: 'Imports', value: -imports_, color: 'rgba(255,100,100,0.9)', inflow: false },
                { label: 'Net Income', value: netIncome, color: netIncome >= 0 ? 'rgba(80,200,120,0.7)' : 'rgba(255,100,100,0.7)', inflow: netIncome >= 0 },
                { label: 'Transfers', value: transfers, color: 'rgba(255,100,100,0.6)', inflow: false },
            ]

            const caX = tLeft + 20
            const caValX = midX - 20
            caItems.forEach((item, i) => {
                const y = itemStartY + i * lineH
                ctx.fillStyle = 'rgba(255,255,255,0.6)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(item.label, caX, y)
                ctx.fillStyle = item.color
                ctx.font = 'bold 12px monospace'
                ctx.textAlign = 'right'
                ctx.fillText(`${item.value >= 0 ? '+' : ''}${item.value}B`, caValX, y)
            })

            // CA total
            const caTotalY = itemStartY + caItems.length * lineH + 10
            ctx.strokeStyle = 'rgba(220,180,80,0.3)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(caX, caTotalY - 8)
            ctx.lineTo(caValX, caTotalY - 8)
            ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.9)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('CA Balance', caX, caTotalY + 5)
            ctx.font = 'bold 13px monospace'
            ctx.textAlign = 'right'
            ctx.fillStyle = currentAccount >= 0 ? 'rgba(80,200,120,1)' : 'rgba(255,100,100,1)'
            ctx.fillText(`${currentAccount >= 0 ? '+' : ''}${currentAccount}B`, caValX, caTotalY + 5)

            // --- Capital/Financial Account Items ---
            const kaItems = [
                { label: 'Foreign Invest. In', value: foreignInvestment, color: 'rgba(80,200,120,0.9)', inflow: true },
                { label: 'Domestic Invest. Out', value: -domesticInvestment, color: 'rgba(255,100,100,0.9)', inflow: false },
            ]

            const kaX = midX + 20
            const kaValX = tRight - 20
            kaItems.forEach((item, i) => {
                const y = itemStartY + i * lineH
                ctx.fillStyle = 'rgba(255,255,255,0.6)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(item.label, kaX, y)
                ctx.fillStyle = item.color
                ctx.font = 'bold 12px monospace'
                ctx.textAlign = 'right'
                ctx.fillText(`${item.value >= 0 ? '+' : ''}${item.value}B`, kaValX, y)
            })

            // KA total
            const kaTotalY = itemStartY + 2 * lineH + 10
            ctx.strokeStyle = 'rgba(220,180,80,0.3)'
            ctx.beginPath()
            ctx.moveTo(kaX, kaTotalY - 8)
            ctx.lineTo(kaValX, kaTotalY - 8)
            ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.9)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('KA/FA Balance', kaX, kaTotalY + 5)
            ctx.font = 'bold 13px monospace'
            ctx.textAlign = 'right'
            ctx.fillStyle = capitalAccount >= 0 ? 'rgba(80,200,120,1)' : 'rgba(255,100,100,1)'
            ctx.fillText(`${capitalAccount >= 0 ? '+' : ''}${capitalAccount}B`, kaValX, kaTotalY + 5)

            // BOP balance summary
            const bopY = tAccountTop + tAccountH + 25
            ctx.fillStyle = 'rgba(220,180,80,0.8)'
            ctx.font = 'bold 14px system-ui'
            ctx.textAlign = 'center'
            const bopColor = Math.abs(bopBalance) < 10 ? 'rgba(80,200,120,1)' : 'rgba(255,180,80,1)'
            ctx.fillText('BOP = CA + KA =', midX - 80, bopY)
            ctx.fillStyle = bopColor
            ctx.font = 'bold 16px monospace'
            ctx.fillText(`${bopBalance >= 0 ? '+' : ''}${bopBalance}B`, midX + 80, bopY)
            if (Math.abs(bopBalance) < 10) {
                ctx.fillStyle = 'rgba(80,200,120,0.5)'
                ctx.font = '11px system-ui'
                ctx.fillText('(Balanced)', midX + 150, bopY)
            }

            // --- Animated Flows ---
            if (showFlows) {
                const drawFlowArrow = (x1: number, y1: number, x2: number, y2: number, color: string, magnitude: number, offset: number) => {
                    const progress = ((t * 0.8 + offset) % 1)
                    const px = x1 + (x2 - x1) * progress
                    const py = y1 + (y2 - y1) * progress
                    const size = Math.min(6, 2 + magnitude / 150)
                    const alpha = Math.sin(progress * Math.PI) * 0.8
                    ctx.fillStyle = color.replace(')', `,${alpha})`)
                    ctx.beginPath()
                    ctx.arc(px, py, size, 0, Math.PI * 2)
                    ctx.fill()
                }

                const flowCount = (mag: number) => Math.max(2, Math.min(8, Math.floor(mag / 80)))

                // Export flows (left side, flowing IN = green dots moving right toward T-account)
                const exportN = flowCount(exports_)
                for (let i = 0; i < exportN; i++) {
                    drawFlowArrow(tLeft - 40, itemStartY, tLeft + 5, itemStartY, 'rgba(80,200,120', exports_, i / exportN)
                }

                // Import flows (left side, flowing OUT = red dots moving left away from T-account)
                const importN = flowCount(imports_)
                for (let i = 0; i < importN; i++) {
                    drawFlowArrow(tLeft + 5, itemStartY + lineH, tLeft - 40, itemStartY + lineH, 'rgba(255,100,100', imports_, i / importN)
                }

                // Foreign investment in (right side, flowing IN = green dots moving left toward T-account)
                const fiN = flowCount(foreignInvestment)
                for (let i = 0; i < fiN; i++) {
                    drawFlowArrow(tRight + 40, itemStartY, tRight - 5, itemStartY, 'rgba(80,200,120', foreignInvestment, i / fiN)
                }

                // Domestic investment out (right side, flowing OUT = red dots moving right away)
                const diN = flowCount(domesticInvestment)
                for (let i = 0; i < diN; i++) {
                    drawFlowArrow(tRight - 5, itemStartY + lineH, tRight + 40, itemStartY + lineH, 'rgba(255,100,100', domesticInvestment, i / diN)
                }
            }

            // --- Bar Chart ---
            const chartH = h - barTop - 40
            const barAreaW = tAccountW * 0.9
            const barLeft = midX - barAreaW / 2
            const barMidY = barTop + chartH / 2

            ctx.fillStyle = 'rgba(220,180,80,0.7)'
            ctx.font = 'bold 12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('COMPONENT BREAKDOWN ($B)', midX, barTop - 5)

            // Zero line
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(barLeft, barMidY)
            ctx.lineTo(barLeft + barAreaW, barMidY)
            ctx.stroke()

            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = '9px system-ui'
            ctx.textAlign = 'right'
            ctx.fillText('0', barLeft - 5, barMidY + 3)

            const components = [
                { label: 'Exports', value: exports_, color: 'rgba(80,200,120,0.8)' },
                { label: 'Imports', value: -imports_, color: 'rgba(255,100,100,0.8)' },
                { label: 'Net Inc.', value: netIncome, color: 'rgba(100,180,220,0.8)' },
                { label: 'Transfers', value: transfers, color: 'rgba(200,150,100,0.8)' },
                { label: 'CA', value: currentAccount, color: currentAccount >= 0 ? 'rgba(80,200,120,0.9)' : 'rgba(255,100,100,0.9)' },
                { label: 'FDI In', value: foreignInvestment, color: 'rgba(120,200,160,0.8)' },
                { label: 'Inv. Out', value: -domesticInvestment, color: 'rgba(255,130,130,0.8)' },
                { label: 'KA', value: capitalAccount, color: capitalAccount >= 0 ? 'rgba(80,200,120,0.9)' : 'rgba(255,100,100,0.9)' },
            ]

            const maxVal = Math.max(800, ...components.map(c => Math.abs(c.value)))
            const barW = (barAreaW - (components.length + 1) * 8) / components.length
            const scale = (chartH / 2 - 15) / maxVal

            components.forEach((comp, i) => {
                const x = barLeft + 8 + i * (barW + 8)
                const barH = Math.abs(comp.value) * scale
                const y = comp.value >= 0 ? barMidY - barH : barMidY

                ctx.fillStyle = comp.color
                ctx.beginPath()
                const r = 3
                if (comp.value >= 0) {
                    ctx.moveTo(x + r, y)
                    ctx.lineTo(x + barW - r, y)
                    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r)
                    ctx.lineTo(x + barW, y + barH)
                    ctx.lineTo(x, y + barH)
                    ctx.lineTo(x, y + r)
                    ctx.quadraticCurveTo(x, y, x + r, y)
                } else {
                    ctx.moveTo(x, y)
                    ctx.lineTo(x + barW, y)
                    ctx.lineTo(x + barW, y + barH - r)
                    ctx.quadraticCurveTo(x + barW, y + barH, x + barW - r, y + barH)
                    ctx.lineTo(x + r, y + barH)
                    ctx.quadraticCurveTo(x, y + barH, x, y + barH - r)
                    ctx.lineTo(x, y)
                }
                ctx.fill()

                // Value label
                ctx.fillStyle = 'rgba(255,255,255,0.8)'
                ctx.font = 'bold 10px monospace'
                ctx.textAlign = 'center'
                const labelY = comp.value >= 0 ? y - 5 : y + barH + 12
                ctx.fillText(`${comp.value}`, x + barW / 2, labelY)

                // Component label
                ctx.fillStyle = 'rgba(255,255,255,0.45)'
                ctx.font = '9px system-ui'
                const bottomLabelY = barMidY + chartH / 2 + 12
                ctx.fillText(comp.label, x + barW / 2, bottomLabelY)
            })

            // Exchange rate indicator
            const erX = tRight + 10
            const erY = tAccountTop + tAccountH - 30
            ctx.fillStyle = 'rgba(220,180,80,0.6)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('FX Pressure:', erX - tAccountW * 0.07, erY)
            ctx.fillStyle = exchangePressure === 'Appreciation' ? 'rgba(80,200,120,0.9)' : exchangePressure === 'Depreciation' ? 'rgba(255,100,100,0.9)' : 'rgba(255,255,255,0.6)'
            ctx.font = 'bold 12px system-ui'
            ctx.fillText(exchangePressure, erX - tAccountW * 0.07, erY + 16)

            animRef.current = requestAnimationFrame(drawFrame)
        }

        animRef.current = requestAnimationFrame(drawFrame)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animRef.current)
        }
    }, [exports_, imports_, foreignInvestment, domesticInvestment, currentAccount, capitalAccount, bopBalance, tradeBalance, netIncome, transfers, showFlows, exchangePressure])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Scenario">
                            <ButtonGroup
                                value={scenario}
                                onChange={v => applyScenario(v as Scenario)}
                                options={Object.entries(scenarioPresets).map(([k, v]) => ({ value: k, label: v.label }))}
                                color={GOLD}
                            />
                        </ControlGroup>
                        <Slider label="Exports ($B)" value={exports_} onChange={v => { setExports(v); setScenario('balanced') }} min={0} max={1000} step={10} />
                        <Slider label="Imports ($B)" value={imports_} onChange={v => { setImports(v); setScenario('balanced') }} min={0} max={1000} step={10} />
                        <Slider label="Foreign Invest. In ($B)" value={foreignInvestment} onChange={v => { setForeignInvestment(v); setScenario('balanced') }} min={0} max={800} step={10} />
                        <Slider label="Domestic Invest. Out ($B)" value={domesticInvestment} onChange={v => { setDomesticInvestment(v); setScenario('balanced') }} min={0} max={800} step={10} />
                        <Toggle label="Animated Flows" value={showFlows} onChange={setShowFlows} />
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={() => applyScenario('balanced')} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 6" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title="BOP Summary" items={[
                        { label: 'Current Account', value: `${currentAccount >= 0 ? '+' : ''}${currentAccount}B`, color: currentAccount >= 0 ? 'rgba(80,200,120,1)' : 'rgba(255,100,100,1)' },
                        { label: 'Capital/Fin. Acct', value: `${capitalAccount >= 0 ? '+' : ''}${capitalAccount}B`, color: capitalAccount >= 0 ? 'rgba(80,200,120,1)' : 'rgba(255,100,100,1)' },
                        { label: 'Trade Balance (X-M)', value: `${tradeBalance >= 0 ? '+' : ''}${tradeBalance}B`, color: tradeBalance >= 0 ? 'rgba(80,200,120,1)' : 'rgba(255,100,100,1)' },
                        { label: 'Net Capital Flow', value: `${capitalAccount >= 0 ? '+' : ''}${capitalAccount}B`, color: capitalAccount >= 0 ? 'rgba(100,180,220,1)' : 'rgba(255,150,100,1)' },
                        { label: 'FX Pressure', value: exchangePressure, color: exchangePressure === 'Appreciation' ? 'rgba(80,200,120,1)' : exchangePressure === 'Depreciation' ? 'rgba(255,100,100,1)' : 'rgba(255,255,255,0.7)' },
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'BOP', expression: 'CA + KA + FA = 0', description: 'BOP must balance' },
                        { label: 'CA', expression: 'X - M + Net Inc + Transfers', description: 'Current account' },
                        { label: 'Twin', expression: 'Trade Deficit = Capital Surplus', description: 'Twin relationship' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode
                        steps={demoSteps}
                        currentStep={demo.currentStep}
                        isOpen={demo.isOpen}
                        onClose={demo.close}
                        onNext={demo.next}
                        onPrev={demo.prev}
                        onGoToStep={demo.goToStep}
                        departmentColor={GOLD}
                    />
                </div>
            </div>
        </div>
    )
}
