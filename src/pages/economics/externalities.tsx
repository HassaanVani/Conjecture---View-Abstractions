import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ExternalityType = 'negative' | 'positive'

interface Example {
    name: string
    type: ExternalityType
    description: string
    correction: string
}

const examples: Example[] = [
    { name: 'Pollution', type: 'negative', description: 'Factory emissions harm third parties not involved in the transaction', correction: 'Carbon tax, cap-and-trade' },
    { name: 'Congestion', type: 'negative', description: 'Each driver adds to traffic, slowing everyone else', correction: 'Congestion pricing, tolls' },
    { name: 'Smoking', type: 'negative', description: 'Second-hand smoke affects non-smokers', correction: 'Cigarette taxes, smoking bans' },
    { name: 'Education', type: 'positive', description: 'Educated citizens benefit society through innovation and civic participation', correction: 'Public schools, scholarships' },
    { name: 'Vaccines', type: 'positive', description: 'Herd immunity protects those who cannot be vaccinated', correction: 'Subsidies, free programs' },
    { name: 'R&D', type: 'positive', description: 'Knowledge spillovers benefit other firms and industries', correction: 'Research grants, patents' },
]

export default function Externalities() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [type, setType] = useState<ExternalityType>('negative')
    const [externalitySize, setExternalitySize] = useState(20)
    const [showCorrection, setShowCorrection] = useState(false)
    const [correctionAmount, setCorrectionAmount] = useState(0)
    const [selectedExample, setSelectedExample] = useState<Example | null>(null)
    const [showDemo, setShowDemo] = useState(false)
    const [demoStep, setDemoStep] = useState(0)

    const filteredExamples = examples.filter(ex => ex.type === type)

    // Auto-adjust correction to optimal when toggled on
    useEffect(() => {
        if (showCorrection) {
            setCorrectionAmount(externalitySize)
        }
    }, [showCorrection, externalitySize])

    const demoSteps = [
        {
            title: 'What Are Externalities?',
            description: 'Externalities are costs or benefits that affect third parties not involved in a transaction. They cause markets to produce the "wrong" amount.',
            action: () => { setType('negative'); setShowCorrection(false) },
        },
        {
            title: 'Negative Externalities',
            description: 'Negative externalities impose costs on others (pollution, noise). The SOCIAL cost (MSC) exceeds the PRIVATE cost (MPC). Markets OVERPRODUCE because producers don\'t pay the full cost.',
            action: () => { setType('negative'); setShowCorrection(false); setExternalitySize(20) },
        },
        {
            title: 'Positive Externalities',
            description: 'Positive externalities create benefits for others (education, vaccines). The SOCIAL benefit (MSB) exceeds the PRIVATE benefit (MPB). Markets UNDERPRODUCE because buyers don\'t capture full value.',
            action: () => { setType('positive'); setShowCorrection(false); setExternalitySize(20) },
        },
        {
            title: 'The Deadweight Loss',
            description: 'The shaded triangle shows DEADWEIGHT LOSS — value destroyed by producing the wrong quantity. Negative: too much production. Positive: too little.',
            action: () => { setType('negative'); setShowCorrection(false) },
        },
        {
            title: 'Pigouvian Corrections',
            description: 'A Pigouvian tax (for negative) or subsidy (for positive) can restore efficiency. The optimal correction equals the externality size, moving output to Q*.',
            action: () => { setShowCorrection(true); setCorrectionAmount(externalitySize) },
        },
        {
            title: 'Try It Yourself!',
            description: 'Adjust the externality size and correction amount. Can you eliminate the deadweight loss? Try different real-world examples.',
            action: () => { setShowCorrection(true) },
        },
    ]

    useEffect(() => {
        if (showDemo) {
            demoSteps[demoStep].action()
        }
    }, [showDemo, demoStep])

    // Cached calculations
    const calculations = useCallback(() => {
        const demandIntercept = 90
        const demandSlope = -0.8
        const supplyIntercept = 10
        const supplySlope = 0.6

        const getDemandP = (q: number) => demandIntercept + demandSlope * q
        const getSupplyP = (q: number) => supplyIntercept + supplySlope * q
        const getMSC = (q: number) => getSupplyP(q) + (type === 'negative' ? externalitySize : 0)
        const getMSB = (q: number) => getDemandP(q) + (type === 'positive' ? externalitySize : 0)

        const qMarket = (demandIntercept - supplyIntercept) / (supplySlope - demandSlope)
        const pMarket = getDemandP(qMarket)

        let qOptimal: number
        if (type === 'negative') {
            qOptimal = (demandIntercept - supplyIntercept - externalitySize) / (supplySlope - demandSlope)
        } else {
            qOptimal = (demandIntercept + externalitySize - supplyIntercept) / (supplySlope - demandSlope)
        }

        // With correction
        let qCorrected: number
        if (type === 'negative') {
            const taxedSupplyIntercept = supplyIntercept + correctionAmount
            qCorrected = (demandIntercept - taxedSupplyIntercept) / (supplySlope - demandSlope)
        } else {
            const subsidizedSupplyIntercept = supplyIntercept - correctionAmount
            qCorrected = (demandIntercept - subsidizedSupplyIntercept) / (supplySlope - demandSlope)
        }

        const dwl = 0.5 * Math.abs(qMarket - qOptimal) * externalitySize

        return { qMarket, pMarket, qOptimal, qCorrected, dwl, getDemandP, getSupplyP, getMSC, getMSB, demandIntercept, supplyIntercept, supplySlope }
    }, [type, externalitySize, correctionAmount])

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
        const maxP = 100

        const toCanvasX = (q: number) => padding + (q / maxQ) * graphWidth
        const toCanvasY = (p: number) => height - padding - 50 - (p / maxP) * graphHeight

        const { qMarket, qOptimal, qCorrected, getDemandP, getSupplyP, getMSC, getMSB, supplyIntercept, supplySlope } = calculations()

        // Grid
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.06)'
        ctx.lineWidth = 1
        for (let i = 0; i <= maxQ; i += 20) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(i), toCanvasY(0))
            ctx.lineTo(toCanvasX(i), toCanvasY(maxP))
            ctx.stroke()
        }
        for (let i = 0; i <= maxP; i += 20) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), toCanvasY(i))
            ctx.lineTo(toCanvasX(maxQ), toCanvasY(i))
            ctx.stroke()
        }

        // Axes
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padding, toCanvasY(maxP))
        ctx.lineTo(padding, toCanvasY(0))
        ctx.lineTo(toCanvasX(maxQ), toCanvasY(0))
        ctx.stroke()

        // Axis labels
        ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Quantity', padding + graphWidth / 2, height - 20)

        ctx.save()
        ctx.translate(22, height / 2 - 25)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('Price / Cost', 0, 0)
        ctx.restore()

        // Draw deadweight loss area
        const dwlColor = type === 'negative' ? 'rgba(255, 100, 100, 0.25)' : 'rgba(100, 200, 150, 0.25)'
        ctx.fillStyle = dwlColor
        ctx.beginPath()

        if (type === 'negative') {
            // DWL between Q* and Qm
            ctx.moveTo(toCanvasX(qOptimal), toCanvasY(getMSC(qOptimal)))
            for (let q = qOptimal; q <= qMarket; q += 0.5) {
                ctx.lineTo(toCanvasX(q), toCanvasY(getMSC(q)))
            }
            for (let q = qMarket; q >= qOptimal; q -= 0.5) {
                ctx.lineTo(toCanvasX(q), toCanvasY(getDemandP(q)))
            }
        } else {
            // DWL between Qm and Q*
            ctx.moveTo(toCanvasX(qMarket), toCanvasY(getSupplyP(qMarket)))
            for (let q = qMarket; q <= qOptimal; q += 0.5) {
                ctx.lineTo(toCanvasX(q), toCanvasY(getSupplyP(q)))
            }
            for (let q = qOptimal; q >= qMarket; q -= 0.5) {
                ctx.lineTo(toCanvasX(q), toCanvasY(getMSB(q)))
            }
        }
        ctx.closePath()
        ctx.fill()

        // Demand curve (MPB)
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let q = 0; q <= maxQ; q += 1) {
            const p = getDemandP(q)
            if (p < 0 || p > maxP) continue
            if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p))
            else ctx.lineTo(toCanvasX(q), toCanvasY(p))
        }
        ctx.stroke()

        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
        ctx.font = 'bold 12px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText('D (MPB)', toCanvasX(75), toCanvasY(getDemandP(75)) - 10)

        // Supply curve (MPC)
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.9)'
        ctx.lineWidth = 3
        ctx.beginPath()
        for (let q = 0; q <= maxQ; q += 1) {
            const p = getSupplyP(q)
            if (p < 0 || p > maxP) continue
            if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p))
            else ctx.lineTo(toCanvasX(q), toCanvasY(p))
        }
        ctx.stroke()

        ctx.fillStyle = 'rgba(100, 150, 255, 0.9)'
        ctx.fillText('S (MPC)', toCanvasX(75), toCanvasY(getSupplyP(75)) + 18)

        // MSC or MSB curve
        if (type === 'negative') {
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.9)'
            ctx.lineWidth = 2
            ctx.setLineDash([6, 4])
            ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 1) {
                const p = getMSC(q)
                if (p < 0 || p > maxP) continue
                if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p))
                else ctx.lineTo(toCanvasX(q), toCanvasY(p))
            }
            ctx.stroke()
            ctx.setLineDash([])

            ctx.fillStyle = 'rgba(255, 200, 100, 0.9)'
            ctx.fillText('MSC', toCanvasX(60), toCanvasY(getMSC(60)) + 18)
        } else {
            ctx.strokeStyle = 'rgba(100, 255, 150, 0.9)'
            ctx.lineWidth = 2
            ctx.setLineDash([6, 4])
            ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 1) {
                const p = getMSB(q)
                if (p < 0 || p > maxP) continue
                if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p))
                else ctx.lineTo(toCanvasX(q), toCanvasY(p))
            }
            ctx.stroke()
            ctx.setLineDash([])

            ctx.fillStyle = 'rgba(100, 255, 150, 0.9)'
            ctx.fillText('MSB', toCanvasX(60), toCanvasY(getMSB(60)) - 10)
        }

        // Corrected supply curve
        if (showCorrection && correctionAmount > 0) {
            const correctedIntercept = type === 'negative'
                ? supplyIntercept + correctionAmount
                : supplyIntercept - correctionAmount

            ctx.strokeStyle = 'rgba(220, 180, 80, 0.7)'
            ctx.lineWidth = 2
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            for (let q = 0; q <= maxQ; q += 1) {
                const p = correctedIntercept + supplySlope * q
                if (p < 0 || p > maxP) continue
                if (q === 0) ctx.moveTo(toCanvasX(q), toCanvasY(p))
                else ctx.lineTo(toCanvasX(q), toCanvasY(p))
            }
            ctx.stroke()
            ctx.setLineDash([])

            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            const label = type === 'negative' ? 'S + Tax' : 'S - Subsidy'
            ctx.fillText(label, toCanvasX(50), toCanvasY(correctedIntercept + supplySlope * 50) + 18)

            // Corrected quantity marker
            if (qCorrected > 0 && qCorrected < maxQ) {
                ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'
                ctx.lineWidth = 1
                ctx.setLineDash([4, 4])
                ctx.beginPath()
                ctx.moveTo(toCanvasX(qCorrected), toCanvasY(0))
                ctx.lineTo(toCanvasX(qCorrected), toCanvasY(getDemandP(qCorrected)))
                ctx.stroke()
                ctx.setLineDash([])

                ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
                ctx.font = '11px monospace'
                ctx.textAlign = 'center'
                ctx.fillText(`Q' = ${qCorrected.toFixed(0)}`, toCanvasX(qCorrected), toCanvasY(0) + 15)
            }
        }

        // Market equilibrium point
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.beginPath()
        ctx.arc(toCanvasX(qMarket), toCanvasY(getDemandP(qMarket)), 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = 'bold 11px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Qm', toCanvasX(qMarket), toCanvasY(0) + 15)

        // Social optimum point
        const optimalP = type === 'negative' ? getDemandP(qOptimal) : getSupplyP(qOptimal)
        ctx.fillStyle = 'rgba(80, 200, 120, 0.9)'
        ctx.beginPath()
        ctx.arc(toCanvasX(qOptimal), toCanvasY(optimalP), 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillText('Q*', toCanvasX(qOptimal), toCanvasY(0) + 28)

        // Legend
        ctx.textAlign = 'left'
        ctx.font = '11px system-ui'
        let legendY = 25

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.beginPath()
        ctx.arc(width - 140, legendY, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.fillText('Qm = Market output', width - 130, legendY + 4)

        legendY += 18
        ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'
        ctx.beginPath()
        ctx.arc(width - 140, legendY, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.fillText('Q* = Social optimum', width - 130, legendY + 4)

        return () => window.removeEventListener('resize', resize)
    }, [type, externalitySize, showCorrection, correctionAmount, calculations])

    const { dwl, qMarket, qOptimal } = calculations()
    const overUnder = type === 'negative' ? 'Overproduction' : 'Underproduction'
    const gap = Math.abs(qMarket - qOptimal)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Type selector */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex gap-2"
                >
                    <button
                        onClick={() => { setType('negative'); setSelectedExample(null) }}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all ${type === 'negative'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'text-white/50 hover:text-white bg-black/30 border border-white/10'
                            }`}
                    >
                        Negative Externality
                    </button>
                    <button
                        onClick={() => { setType('positive'); setSelectedExample(null) }}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all ${type === 'positive'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'text-white/50 hover:text-white bg-black/30 border border-white/10'
                            }`}
                    >
                        Positive Externality
                    </button>
                </motion.div>

                {/* Examples */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-14 left-4 flex gap-2 flex-wrap"
                >
                    {filteredExamples.map(ex => (
                        <button
                            key={ex.name}
                            onClick={() => setSelectedExample(ex)}
                            className={`px-2 py-1 rounded text-xs transition-all ${selectedExample?.name === ex.name
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'text-white/40 hover:text-white/60 bg-black/20'
                                }`}
                        >
                            {ex.name}
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
                        <span className="text-sm font-medium text-yellow-400">
                            {type === 'negative' ? 'Negative Externality' : 'Positive Externality'}
                        </span>
                        <button
                            onClick={() => { setShowDemo(true); setDemoStep(0) }}
                            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            Learn
                        </button>
                    </div>

                    {selectedExample && (
                        <div className="mb-3 pb-3 border-b border-white/10">
                            <div className="text-sm text-white/80 mb-1">{selectedExample.name}</div>
                            <div className="text-xs text-white/50">{selectedExample.description}</div>
                            <div className="text-xs text-green-400 mt-1">Fix: {selectedExample.correction}</div>
                        </div>
                    )}

                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-white/50">{overUnder}:</span>
                            <span className={type === 'negative' ? 'text-red-400' : 'text-blue-400'}>
                                {gap.toFixed(1)} units
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">Deadweight Loss:</span>
                            <span className="text-orange-400">${dwl.toFixed(0)}</span>
                        </div>
                        {showCorrection && (
                            <div className="flex justify-between">
                                <span className="text-white/50">After {type === 'negative' ? 'Tax' : 'Subsidy'}:</span>
                                <span className={Math.abs(correctionAmount - externalitySize) < 1 ? 'text-green-400' : 'text-yellow-400'}>
                                    {Math.abs(correctionAmount - externalitySize) < 1 ? 'Optimal!' : 'Adjusting...'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/40">
                        {type === 'negative' ? (
                            <>MSC {'>'} MPC → Market overproduces</>
                        ) : (
                            <>MSB {'>'} MPB → Market underproduces</>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showCorrection}
                                onChange={e => setShowCorrection(e.target.checked)}
                                className="accent-yellow-400"
                            />
                            Show {type === 'negative' ? 'Tax' : 'Subsidy'} Correction
                        </label>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm">Externality Size</span>
                            <input
                                type="range"
                                min={5}
                                max={40}
                                value={externalitySize}
                                onChange={e => setExternalitySize(+e.target.value)}
                                className={`w-28 ${type === 'negative' ? 'accent-red-400' : 'accent-green-400'}`}
                            />
                            <span className="text-white/60 text-sm font-mono w-8">${externalitySize}</span>
                        </div>

                        {showCorrection && (
                            <div className="flex items-center gap-3">
                                <span className="text-white/50 text-sm">{type === 'negative' ? 'Tax' : 'Subsidy'}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={50}
                                    value={correctionAmount}
                                    onChange={e => setCorrectionAmount(+e.target.value)}
                                    className="w-28 accent-yellow-400"
                                />
                                <span className="text-yellow-400 text-sm font-mono w-8">${correctionAmount}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setExternalitySize(20)
                            setCorrectionAmount(0)
                            setShowCorrection(false)
                            setSelectedExample(null)
                        }}
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
