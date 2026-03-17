import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Select, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

interface CurrencyPair {
    name: string
    base: string
    quote: string
    baseFlag: string
    quoteFlag: string
}

const currencyPairs: CurrencyPair[] = [
    { name: 'EUR/USD', base: 'EUR', quote: 'USD', baseFlag: '🇪🇺', quoteFlag: '🇺🇸' },
    { name: 'USD/JPY', base: 'USD', quote: 'JPY', baseFlag: '🇺🇸', quoteFlag: '🇯🇵' },
    { name: 'GBP/USD', base: 'GBP', quote: 'USD', baseFlag: '🇬🇧', quoteFlag: '🇺🇸' },
    { name: 'USD/CNY', base: 'USD', quote: 'CNY', baseFlag: '🇺🇸', quoteFlag: '🇨🇳' },
]

type Shock = 'none' | 'interest-up' | 'interest-down' | 'export-up' | 'import-up' | 'inflation'

interface ShockInfo {
    name: string
    demandShift: number
    supplyShift: number
    description: string
}

const shocks: Record<Shock, ShockInfo> = {
    none: { name: 'Equilibrium', demandShift: 0, supplyShift: 0, description: 'Market at equilibrium exchange rate.' },
    'interest-up': { name: 'Rate Hike', demandShift: 20, supplyShift: 0, description: 'Higher interest rates attract foreign capital → currency appreciates.' },
    'interest-down': { name: 'Rate Cut', demandShift: -20, supplyShift: 0, description: 'Lower rates cause capital outflow → currency depreciates.' },
    'export-up': { name: 'Export Boom', demandShift: 15, supplyShift: 0, description: 'Foreigners need our currency to buy exports → currency appreciates.' },
    'import-up': { name: 'Import Surge', demandShift: 0, supplyShift: 15, description: 'We need foreign currency to buy imports → currency depreciates.' },
    inflation: { name: 'High Inflation', demandShift: -15, supplyShift: 10, description: 'Inflation erodes value → currency depreciates (PPP).' },
}

const GOLD = 'rgb(220, 180, 80)'

export default function ForeignExchange() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [selectedPair, setSelectedPair] = useState(0)
    const [demandShift, setDemandShift] = useState(0)
    const [supplyShift, setSupplyShift] = useState(0)
    const [shock, setShock] = useState<Shock>('none')

    const pair = currencyPairs[selectedPair]

    const applyShock = useCallback((s: Shock) => {
        setShock(s)
        setDemandShift(shocks[s].demandShift)
        setSupplyShift(shocks[s].supplyShift)
    }, [])

    const reset = useCallback(() => {
        applyShock('none')
        setSelectedPair(0)
    }, [applyShock])

    // Calculate equilibrium exchange rate
    const demandIntercept = 120 + demandShift
    const supplyIntercept = 30 + supplyShift
    const demandSlope = -0.8
    const supplySlope = 0.6

    const equilibriumQ = (demandIntercept - supplyIntercept) / (supplySlope - demandSlope)
    const equilibriumE = demandIntercept + demandSlope * equilibriumQ

    // Baseline equilibrium
    const baseQ = (120 - 30) / (0.6 - (-0.8))
    const baseE = 120 + (-0.8) * baseQ

    const exchangeChange = equilibriumE - baseE
    const isAppreciating = exchangeChange > 0.5
    const isDepreciating = exchangeChange < -0.5

    const demoSteps: DemoStep[] = useMemo(() => [
        {
            title: 'The Foreign Exchange Market',
            description: 'Currencies are traded in the forex market. The exchange rate is the price of one currency in terms of another, determined by supply and demand.',
            setup: () => { reset(); },
        },
        {
            title: 'Supply of Currency',
            description: 'Supply comes from: our residents buying imports, our investors buying foreign assets, our tourists traveling abroad. More supply = depreciation.',
            setup: () => { applyShock('none'); setSupplyShift(15); },
        },
        {
            title: 'Demand for Currency',
            description: 'Demand for a currency comes from: foreigners buying our exports, foreign investors buying our assets, tourists visiting us. More demand = appreciation.',
            setup: () => { applyShock('none'); setDemandShift(15); },
        },
        {
            title: 'Equilibrium Exchange Rate',
            description: 'Where supply meets demand determines the equilibrium exchange rate. At this rate, the quantity of currency demanded equals quantity supplied.',
            setup: () => applyShock('none'),
        },
        {
            title: 'Currency Appreciation',
            description: 'When demand rises or supply falls, the exchange rate increases. The currency buys more foreign currency — it has appreciated.',
            setup: () => applyShock('interest-up'),
        },
        {
            title: 'Currency Depreciation',
            description: 'When demand falls or supply rises, the exchange rate decreases. The currency buys less foreign currency — it has depreciated.',
            setup: () => applyShock('interest-down'),
        },
        {
            title: 'Effects on Trade',
            description: 'Appreciation makes exports expensive and imports cheap (NX falls). Depreciation makes exports cheap and imports expensive (NX rises).',
            setup: () => applyShock('export-up'),
        },
        {
            title: 'Capital Flows',
            description: 'Higher interest rates attract foreign investment (capital inflow → appreciation). Lower rates cause capital outflow → depreciation. Try different shocks!',
            setup: () => applyShock('none'),
        },
    ], [applyShock, reset])

    const demo = useDemoMode(demoSteps)

    // Derived display values
    const currencyDirection = isAppreciating ? 'Appreciating' : isDepreciating ? 'Depreciating' : 'Stable'
    const netExportsEffect = isAppreciating ? 'NX Decreasing' : isDepreciating ? 'NX Increasing' : 'Neutral'
    const capitalFlow = isAppreciating ? 'Inflow' : isDepreciating ? 'Outflow' : 'Balanced'

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

        const width = canvas.offsetWidth
        const height = canvas.offsetHeight
        const padding = 80
        const graphWidth = width - padding * 2
        const graphHeight = height - padding * 2 - 50

        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, width, height)

        const maxQ = 100
        const maxE = 100

        const toCanvasX = (q: number) => padding + (q / maxQ) * graphWidth
        const toCanvasY = (e: number) => height - padding - 50 - (e / maxE) * graphHeight

        // Grid
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.06)'
        ctx.lineWidth = 1
        for (let i = 0; i <= maxQ; i += 20) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(i), toCanvasY(0))
            ctx.lineTo(toCanvasX(i), toCanvasY(maxE))
            ctx.stroke()
        }
        for (let i = 0; i <= maxE; i += 20) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), toCanvasY(i))
            ctx.lineTo(toCanvasX(maxQ), toCanvasY(i))
            ctx.stroke()
        }

        // Axes
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padding, toCanvasY(maxE))
        ctx.lineTo(padding, toCanvasY(0))
        ctx.lineTo(toCanvasX(maxQ), toCanvasY(0))
        ctx.stroke()

        // Axis labels
        ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(`Quantity of ${pair.base}`, padding + graphWidth / 2, height - 20)

        ctx.save()
        ctx.translate(22, height / 2 - 25)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(`Exchange Rate (${pair.quote}/${pair.base})`, 0, 0)
        ctx.restore()

        // Draw demand curve
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.9)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let q = 5; q <= 95; q += 1) {
            const e = demandIntercept + demandSlope * q
            if (e < 5 || e > 95) continue
            if (q === 5) ctx.moveTo(toCanvasX(q), toCanvasY(e))
            else ctx.lineTo(toCanvasX(q), toCanvasY(e))
        }
        ctx.stroke()

        ctx.fillStyle = 'rgba(100, 150, 255, 0.9)'
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText(`D${pair.base}`, toCanvasX(80), toCanvasY(demandIntercept + demandSlope * 80) - 10)

        // Draw supply curve
        ctx.strokeStyle = 'rgba(255, 150, 100, 0.9)'
        ctx.lineWidth = 3
        ctx.beginPath()
        for (let q = 5; q <= 95; q += 1) {
            const e = supplyIntercept + supplySlope * q
            if (e < 5 || e > 95) continue
            if (q === 5) ctx.moveTo(toCanvasX(q), toCanvasY(e))
            else ctx.lineTo(toCanvasX(q), toCanvasY(e))
        }
        ctx.stroke()

        ctx.fillStyle = 'rgba(255, 150, 100, 0.9)'
        ctx.textAlign = 'right'
        ctx.fillText(`S${pair.base}`, toCanvasX(80), toCanvasY(supplyIntercept + supplySlope * 80) + 20)

        // Baseline equilibrium (dashed)
        if (Math.abs(exchangeChange) > 0.5) {
            ctx.setLineDash([4, 4])
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(toCanvasX(baseQ), toCanvasY(baseE))
            ctx.lineTo(toCanvasX(baseQ), toCanvasY(0))
            ctx.moveTo(toCanvasX(baseQ), toCanvasY(baseE))
            ctx.lineTo(toCanvasX(0), toCanvasY(baseE))
            ctx.stroke()
            ctx.setLineDash([])

            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.beginPath()
            ctx.arc(toCanvasX(baseQ), toCanvasY(baseE), 5, 0, Math.PI * 2)
            ctx.fill()
        }

        // Current equilibrium
        if (equilibriumQ > 5 && equilibriumQ < 95 && equilibriumE > 5 && equilibriumE < 95) {
            // Dashed lines to axes
            ctx.setLineDash([6, 4])
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(toCanvasX(equilibriumQ), toCanvasY(equilibriumE))
            ctx.lineTo(toCanvasX(equilibriumQ), toCanvasY(0))
            ctx.moveTo(toCanvasX(equilibriumQ), toCanvasY(equilibriumE))
            ctx.lineTo(toCanvasX(0), toCanvasY(equilibriumE))
            ctx.stroke()
            ctx.setLineDash([])

            // Glow
            const glow = ctx.createRadialGradient(
                toCanvasX(equilibriumQ), toCanvasY(equilibriumE), 0,
                toCanvasX(equilibriumQ), toCanvasY(equilibriumE), 20
            )
            glow.addColorStop(0, 'rgba(220, 180, 80, 0.5)')
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.beginPath()
            ctx.arc(toCanvasX(equilibriumQ), toCanvasY(equilibriumE), 20, 0, Math.PI * 2)
            ctx.fill()

            // Point
            ctx.fillStyle = 'rgba(220, 180, 80, 1)'
            ctx.beginPath()
            ctx.arc(toCanvasX(equilibriumQ), toCanvasY(equilibriumE), 8, 0, Math.PI * 2)
            ctx.fill()

            // Arrow showing change direction
            if (Math.abs(exchangeChange) > 0.5) {
                const arrowDir = exchangeChange > 0 ? -1 : 1
                ctx.strokeStyle = isAppreciating ? 'rgba(100, 200, 150, 0.8)' : 'rgba(255, 100, 100, 0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(toCanvasX(0) - 15, toCanvasY(baseE))
                ctx.lineTo(toCanvasX(0) - 15, toCanvasY(equilibriumE))
                ctx.stroke()

                // Arrow head
                ctx.fillStyle = ctx.strokeStyle
                ctx.beginPath()
                ctx.moveTo(toCanvasX(0) - 15, toCanvasY(equilibriumE))
                ctx.lineTo(toCanvasX(0) - 20, toCanvasY(equilibriumE) - arrowDir * 8)
                ctx.lineTo(toCanvasX(0) - 10, toCanvasY(equilibriumE) - arrowDir * 8)
                ctx.closePath()
                ctx.fill()
            }

            // Value labels
            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.font = '11px monospace'
            ctx.textAlign = 'center'
            ctx.fillText(`E = ${equilibriumE.toFixed(1)}`, toCanvasX(0) - 35, toCanvasY(equilibriumE) + 4)
        }

        // Currency pair display
        ctx.fillStyle = 'rgba(220, 180, 80, 1)'
        ctx.font = 'bold 20px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(`${pair.baseFlag} ${pair.name} ${pair.quoteFlag}`, width / 2, 35)

        return () => window.removeEventListener('resize', resize)
    }, [demandIntercept, demandSlope, supplyIntercept, supplySlope, equilibriumQ, equilibriumE, baseQ, baseE, exchangeChange, isAppreciating, pair])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Controls — top-left */}
                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Currency Pair">
                            <Select
                                value={String(selectedPair)}
                                onChange={v => setSelectedPair(Number(v))}
                                options={currencyPairs.map((p, i) => ({ value: String(i), label: `${p.baseFlag} ${p.name}` }))}
                            />
                        </ControlGroup>
                        <ControlGroup label="Shock">
                            <ButtonGroup
                                value={shock}
                                onChange={v => applyShock(v as Shock)}
                                options={[
                                    { value: 'none', label: 'None' },
                                    { value: 'interest-up', label: 'Rate+' },
                                    { value: 'interest-down', label: 'Rate-' },
                                    { value: 'export-up', label: 'Export' },
                                    { value: 'import-up', label: 'Import' },
                                    { value: 'inflation', label: 'Infl.' },
                                ]}
                                color={GOLD}
                            />
                        </ControlGroup>
                        <Slider label="Demand Shift" value={demandShift} onChange={v => { setDemandShift(v); setShock('none') }} min={-40} max={40} step={1} />
                        <Slider label="Supply Shift" value={supplyShift} onChange={v => { setSupplyShift(v); setShock('none') }} min={-40} max={40} step={1} />
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={reset} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 6" color={GOLD} />
                </div>

                {/* InfoPanel + EquationDisplay — top-right */}
                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title="Forex Market" items={[
                        { label: 'Exchange Rate', value: equilibriumE.toFixed(2), color: GOLD },
                        { label: 'Currency', value: currencyDirection, color: isAppreciating ? 'rgba(100,200,150,1)' : isDepreciating ? 'rgba(255,100,100,1)' : 'rgba(255,255,255,0.6)' },
                        { label: 'Net Exports', value: netExportsEffect, color: isDepreciating ? 'rgba(100,200,150,1)' : isAppreciating ? 'rgba(255,100,100,1)' : 'rgba(255,255,255,0.6)' },
                        { label: 'Capital Flow', value: capitalFlow, color: isAppreciating ? 'rgba(100,150,255,1)' : isDepreciating ? 'rgba(255,150,100,1)' : 'rgba(255,255,255,0.6)' },
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Relationships" collapsed equations={[
                        { label: 'Equilibrium', expression: 'E = S ∩ D', description: 'Exchange rate from supply and demand' },
                        { label: 'Appreciation', expression: 'E↑ → NX↓', description: 'Stronger currency reduces net exports' },
                        { label: 'Depreciation', expression: 'E↓ → NX↑', description: 'Weaker currency increases net exports' },
                    ]} />
                </div>

                {/* DemoMode — bottom center */}
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
