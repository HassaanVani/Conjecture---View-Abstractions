import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

export default function ForeignExchange() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [selectedPair, setSelectedPair] = useState(0)
    const [demandShift, setDemandShift] = useState(0)
    const [supplyShift, setSupplyShift] = useState(0)
    const [shock, setShock] = useState<Shock>('none')
    const [showDemo, setShowDemo] = useState(false)
    const [demoStep, setDemoStep] = useState(0)

    const pair = currencyPairs[selectedPair]

    const applyShock = useCallback((s: Shock) => {
        setShock(s)
        setDemandShift(shocks[s].demandShift)
        setSupplyShift(shocks[s].supplyShift)
    }, [])

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

    const demoSteps = [
        {
            title: 'The Foreign Exchange Market',
            description: 'Currencies are traded in the forex market. The exchange rate is the price of one currency in terms of another, determined by supply and demand.',
            action: () => applyShock('none'),
        },
        {
            title: 'Demand for Currency',
            description: 'Demand for a currency comes from: foreigners buying our exports, foreign investors buying our assets, tourists visiting us.',
            action: () => { applyShock('none'); setDemandShift(15) },
        },
        {
            title: 'Supply of Currency',
            description: 'Supply comes from: our residents buying imports, our investors buying foreign assets, our tourists traveling abroad.',
            action: () => { applyShock('none'); setSupplyShift(15) },
        },
        {
            title: 'Interest Rate Effects',
            description: 'Higher interest rates attract capital inflows → demand for currency rises → appreciation. This is why Fed policy affects the dollar!',
            action: () => applyShock('interest-up'),
        },
        {
            title: 'Trade Balance Effects',
            description: 'An export boom means foreigners need our currency → appreciation. An import surge means we need foreign currency → depreciation.',
            action: () => applyShock('export-up'),
        },
        {
            title: 'Try It Yourself!',
            description: 'Use the sliders to shift demand and supply. Apply different shocks to see how exchange rates respond. Watch for appreciation vs depreciation!',
            action: () => applyShock('none'),
        },
    ]

    useEffect(() => {
        if (showDemo) {
            demoSteps[demoStep].action()
        }
    }, [showDemo, demoStep])

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

                {/* Pair selector */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex gap-2"
                >
                    {currencyPairs.map((p, i) => (
                        <button
                            key={p.name}
                            onClick={() => setSelectedPair(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${selectedPair === i
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'text-white/50 hover:text-white bg-black/30 border border-white/10'
                                }`}
                        >
                            {p.baseFlag} {p.name}
                        </button>
                    ))}
                </motion.div>

                {/* Info panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-xs"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{pair.baseFlag}</span>
                            <div>
                                <span className="text-sm font-medium text-yellow-400">{pair.base}/{pair.quote}</span>
                                <div className="text-lg font-mono text-white">{equilibriumE.toFixed(2)}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => { setShowDemo(true); setDemoStep(0) }}
                            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            Learn
                        </button>
                    </div>

                    <div className={`text-sm font-medium mb-3 ${isAppreciating ? 'text-green-400' : isDepreciating ? 'text-red-400' : 'text-white/60'
                        }`}>
                        {isAppreciating && `↑ ${pair.base} Appreciating (+${exchangeChange.toFixed(1)})`}
                        {isDepreciating && `↓ ${pair.base} Depreciating (${exchangeChange.toFixed(1)})`}
                        {!isAppreciating && !isDepreciating && 'At Equilibrium'}
                    </div>

                    <p className="text-xs text-white/60">{shocks[shock].description}</p>
                </motion.div>

                {/* Shock buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-24 left-4 flex flex-col gap-2"
                >
                    <div className="text-xs text-white/40 mb-1">Quick Shocks:</div>
                    {(Object.keys(shocks) as Shock[]).filter(s => s !== 'none').map(s => (
                        <button
                            key={s}
                            onClick={() => applyShock(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all text-left ${shock === s
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'text-white/50 hover:text-white bg-black/30 border border-white/10'
                                }`}
                        >
                            {shocks[s].name}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-blue-400 text-sm font-medium">Demand</span>
                            <input
                                type="range"
                                min={-40}
                                max={40}
                                value={demandShift}
                                onChange={e => { setDemandShift(+e.target.value); setShock('none') }}
                                className="w-28 accent-blue-400"
                            />
                            <span className={`text-xs font-mono w-8 ${demandShift > 0 ? 'text-green-400' : demandShift < 0 ? 'text-red-400' : 'text-white/40'}`}>
                                {demandShift > 0 ? '→' : demandShift < 0 ? '←' : '—'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-orange-400 text-sm font-medium">Supply</span>
                            <input
                                type="range"
                                min={-40}
                                max={40}
                                value={supplyShift}
                                onChange={e => { setSupplyShift(+e.target.value); setShock('none') }}
                                className="w-28 accent-orange-400"
                            />
                            <span className={`text-xs font-mono w-8 ${supplyShift > 0 ? 'text-green-400' : supplyShift < 0 ? 'text-red-400' : 'text-white/40'}`}>
                                {supplyShift > 0 ? '→' : supplyShift < 0 ? '←' : '—'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => applyShock('none')}
                        className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Demo Modal */}
            <AnimatePresence>
                {showDemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowDemo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a150a] border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs text-white/40">
                                    {demoStep + 1} of {demoSteps.length}
                                </span>
                                <button
                                    onClick={() => setShowDemo(false)}
                                    className="text-white/40 hover:text-white text-xl"
                                >
                                    ×
                                </button>
                            </div>

                            <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                                {demoSteps[demoStep].title}
                            </h3>
                            <p className="text-white/70 mb-6 leading-relaxed">
                                {demoSteps[demoStep].description}
                            </p>

                            <div className="flex justify-center gap-2 mb-6">
                                {demoSteps.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setDemoStep(i)}
                                        className={`w-2 h-2 rounded-full transition-colors ${i === demoStep ? 'bg-yellow-400' : 'bg-white/20 hover:bg-white/40'
                                            }`}
                                    />
                                ))}
                            </div>

                            <div className="flex justify-between gap-3">
                                <button
                                    onClick={() => setDemoStep(Math.max(0, demoStep - 1))}
                                    disabled={demoStep === 0}
                                    className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Previous
                                </button>
                                {demoStep < demoSteps.length - 1 ? (
                                    <button
                                        onClick={() => setDemoStep(demoStep + 1)}
                                        className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                                    >
                                        Next →
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowDemo(false)}
                                        className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                    >
                                        Done ✓
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
