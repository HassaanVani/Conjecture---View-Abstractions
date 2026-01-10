import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Country {
    name: string
    flag: string
    goodA: number
    goodB: number
}

interface Scenario {
    name: string
    countries: [Country, Country]
    description: string
}

const scenarios: Scenario[] = [
    {
        name: 'Classic Trade',
        countries: [
            { name: 'USA', flag: '🇺🇸', goodA: 100, goodB: 50 },
            { name: 'China', flag: '🇨🇳', goodA: 80, goodB: 160 },
        ],
        description: 'USA is better at tech goods; China is better at manufacturing.',
    },
    {
        name: 'Oil vs Services',
        countries: [
            { name: 'Saudi Arabia', flag: '🇸🇦', goodA: 200, goodB: 40 },
            { name: 'Japan', flag: '🇯🇵', goodA: 30, goodB: 120 },
        ],
        description: 'Resource-rich vs service-oriented economies.',
    },
    {
        name: 'Absolute Advantage',
        countries: [
            { name: 'Germany', flag: '🇩🇪', goodA: 100, goodB: 100 },
            { name: 'Brazil', flag: '🇧🇷', goodA: 50, goodB: 50 },
        ],
        description: 'Germany has absolute advantage in both, but trade still benefits!',
    },
]

type GoodLabel = 'Tech Goods' | 'Consumer Goods'

export default function ComparativeAdvantage() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [scenarioIndex, setScenarioIndex] = useState(0)
    const [country1, setCountry1] = useState<Country>(scenarios[0].countries[0])
    const [country2, setCountry2] = useState<Country>(scenarios[0].countries[1])
    const [specializationLevel, setSpecializationLevel] = useState(0)
    const [showTrade, setShowTrade] = useState(false)
    const [showDemo, setShowDemo] = useState(false)
    const [demoStep, setDemoStep] = useState(0)
    const [goodALabel] = useState<GoodLabel>('Tech Goods')
    const [goodBLabel] = useState<GoodLabel>('Consumer Goods')

    const loadScenario = (idx: number) => {
        setScenarioIndex(idx)
        setCountry1(scenarios[idx].countries[0])
        setCountry2(scenarios[idx].countries[1])
        setSpecializationLevel(0)
        setShowTrade(false)
    }

    // Calculate opportunity costs
    const getOpportunityCost = useCallback((country: Country) => {
        // Opportunity cost of A in terms of B: how much B you give up to make 1 A
        const costAinB = country.goodB / country.goodA
        // Opportunity cost of B in terms of A
        const costBinA = country.goodA / country.goodB
        return { costAinB, costBinA }
    }, [])

    const oc1 = getOpportunityCost(country1)
    const oc2 = getOpportunityCost(country2)

    // Determine comparative advantage
    const country1AdvantageIn = oc1.costAinB < oc2.costAinB ? 'A' : 'B'
    const country2AdvantageIn = country1AdvantageIn === 'A' ? 'B' : 'A'

    // Calculate production with specialization
    const getProduction = useCallback((country: Country, advantageIn: 'A' | 'B', level: number) => {
        if (advantageIn === 'A') {
            const a = country.goodA * (0.5 + level * 0.5)
            const b = country.goodB * (0.5 - level * 0.5)
            return { a: Math.max(0, a), b: Math.max(0, b) }
        } else {
            const a = country.goodA * (0.5 - level * 0.5)
            const b = country.goodB * (0.5 + level * 0.5)
            return { a: Math.max(0, a), b: Math.max(0, b) }
        }
    }, [])

    const prod1 = getProduction(country1, country1AdvantageIn, specializationLevel)
    const prod2 = getProduction(country2, country2AdvantageIn, specializationLevel)

    // Total world production
    const totalA = prod1.a + prod2.a
    const totalB = prod1.b + prod2.b

    // Baseline (no specialization)
    const baselineA = country1.goodA * 0.5 + country2.goodA * 0.5
    const baselineB = country1.goodB * 0.5 + country2.goodB * 0.5

    const gainA = totalA - baselineA
    const gainB = totalB - baselineB

    const demoSteps = [
        {
            title: 'Comparative vs Absolute Advantage',
            description: 'Even if one country is better at producing EVERYTHING, both countries benefit from trade by specializing in what they\'re RELATIVELY better at.',
            action: () => { loadScenario(0); setSpecializationLevel(0) },
        },
        {
            title: 'Opportunity Cost',
            description: 'Each country gives up something to produce a good. The opportunity cost tells us what we sacrifice. Compare these costs to find comparative advantage.',
            action: () => { setSpecializationLevel(0); setShowTrade(false) },
        },
        {
            title: 'Finding Comparative Advantage',
            description: 'The country with the LOWER opportunity cost has comparative advantage in that good. They should specialize in it!',
            action: () => { setSpecializationLevel(0.3) },
        },
        {
            title: 'Specialization',
            description: 'As countries specialize in their comparative advantage, world production increases. Move the slider to see total output rise!',
            action: () => { setSpecializationLevel(0.8) },
        },
        {
            title: 'Gains from Trade',
            description: 'With full specialization and trade, both countries can consume MORE than they could produce alone. This is the magic of trade!',
            action: () => { setSpecializationLevel(1); setShowTrade(true) },
        },
        {
            title: 'Try Different Scenarios',
            description: 'Switch between scenarios to see how different production possibilities affect trade patterns. What if one country is better at both goods?',
            action: () => { loadScenario(2); setSpecializationLevel(1); setShowTrade(true) },
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

        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, width, height)

        // Draw two PPCs side by side
        const graphWidth = (width - 100) / 2 - 40
        const graphHeight = height - 180
        const padding = 50

        const drawPPC = (country: Country, advantageIn: 'A' | 'B', startX: number, color: string) => {
            const maxA = country.goodA * 1.1
            const maxB = country.goodB * 1.1

            // Axes
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(startX + padding, 50)
            ctx.lineTo(startX + padding, 50 + graphHeight)
            ctx.lineTo(startX + padding + graphWidth, 50 + graphHeight)
            ctx.stroke()

            // Axis labels
            ctx.fillStyle = 'rgba(220, 180, 80, 0.7)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(goodALabel, startX + padding + graphWidth / 2, 50 + graphHeight + 35)

            ctx.save()
            ctx.translate(startX + padding - 30, 50 + graphHeight / 2)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText(goodBLabel, 0, 0)
            ctx.restore()

            // PPC line
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.beginPath()
            const ppcX1 = startX + padding
            const ppcY1 = 50 + graphHeight - (country.goodB / maxB) * graphHeight
            const ppcX2 = startX + padding + (country.goodA / maxA) * graphWidth
            const ppcY2 = 50 + graphHeight
            ctx.moveTo(ppcX1, ppcY1)
            ctx.lineTo(ppcX2, ppcY2)
            ctx.stroke()

            // Production point
            const prod = getProduction(country, advantageIn, specializationLevel)
            const prodX = startX + padding + (prod.a / maxA) * graphWidth
            const prodY = 50 + graphHeight - (prod.b / maxB) * graphHeight

            // Point glow
            const glow = ctx.createRadialGradient(prodX, prodY, 0, prodX, prodY, 15)
            glow.addColorStop(0, color.replace('0.9)', '0.4)'))
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.beginPath()
            ctx.arc(prodX, prodY, 15, 0, Math.PI * 2)
            ctx.fill()

            // Point
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(prodX, prodY, 7, 0, Math.PI * 2)
            ctx.fill()

            // Production label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.font = '10px monospace'
            ctx.textAlign = 'center'
            ctx.fillText(`(${prod.a.toFixed(0)}, ${prod.b.toFixed(0)})`, prodX, prodY - 15)

            // Country label at top
            ctx.fillStyle = color
            ctx.font = 'bold 16px system-ui'
            ctx.fillText(`${country.flag} ${country.name}`, startX + padding + graphWidth / 2, 30)

            // Opportunity cost display
            const oc = getOpportunityCost(country)
            ctx.font = '11px system-ui'
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
            ctx.textAlign = 'left'
            const ocY = 50 + graphHeight + 55
            ctx.fillText(`OC of 1 ${goodALabel.split(' ')[0]}:`, startX + padding, ocY)
            ctx.fillStyle = advantageIn === 'A' ? 'rgba(100, 200, 150, 1)' : 'rgba(255, 255, 255, 0.8)'
            ctx.fillText(`${oc.costAinB.toFixed(2)} ${goodBLabel.split(' ')[0]}`, startX + padding + 90, ocY)

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
            ctx.fillText(`OC of 1 ${goodBLabel.split(' ')[0]}:`, startX + padding, ocY + 18)
            ctx.fillStyle = advantageIn === 'B' ? 'rgba(100, 200, 150, 1)' : 'rgba(255, 255, 255, 0.8)'
            ctx.fillText(`${oc.costBinA.toFixed(2)} ${goodALabel.split(' ')[0]}`, startX + padding + 90, ocY + 18)

            // Comparative advantage badge
            ctx.fillStyle = 'rgba(100, 200, 150, 0.2)'
            ctx.beginPath()
            ctx.roundRect(startX + padding, ocY + 32, graphWidth, 24, 6)
            ctx.fill()
            ctx.fillStyle = 'rgba(100, 200, 150, 1)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`Specializes in: ${advantageIn === 'A' ? goodALabel : goodBLabel}`, startX + padding + graphWidth / 2, ocY + 48)
        }

        // Draw both countries
        drawPPC(country1, country1AdvantageIn, 0, 'rgba(100, 150, 255, 0.9)')
        drawPPC(country2, country2AdvantageIn, width / 2, 'rgba(255, 150, 100, 0.9)')

        // Trade arrows between countries
        if (showTrade && specializationLevel > 0.5) {
            const arrowY = 50 + graphHeight / 2
            const arrowStartX = padding + graphWidth
            const arrowEndX = width / 2 + padding

            ctx.strokeStyle = 'rgba(220, 180, 80, 0.6)'
            ctx.lineWidth = 2
            ctx.setLineDash([6, 4])

            // Arrow 1 (country 1 → country2)
            ctx.beginPath()
            ctx.moveTo(arrowStartX + 20, arrowY - 20)
            ctx.lineTo(arrowEndX - 20, arrowY - 20)
            ctx.stroke()

            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(country1AdvantageIn === 'A' ? goodALabel : goodBLabel, (arrowStartX + arrowEndX) / 2, arrowY - 30)

            // Arrow 2 (country 2 → country 1)
            ctx.beginPath()
            ctx.moveTo(arrowEndX - 20, arrowY + 20)
            ctx.lineTo(arrowStartX + 20, arrowY + 20)
            ctx.stroke()

            ctx.fillText(country2AdvantageIn === 'A' ? goodALabel : goodBLabel, (arrowStartX + arrowEndX) / 2, arrowY + 35)
            ctx.setLineDash([])
        }

        // World production summary at bottom
        const summaryY = height - 50
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.beginPath()
        ctx.roundRect(width / 2 - 250, summaryY - 30, 500, 55, 10)
        ctx.fill()

        ctx.font = 'bold 13px system-ui'
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(220, 180, 80, 1)'
        ctx.fillText('World Production', width / 2, summaryY - 12)

        ctx.font = '12px monospace'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillText(
            `${goodALabel}: ${totalA.toFixed(0)}  |  ${goodBLabel}: ${totalB.toFixed(0)}`,
            width / 2, summaryY + 5
        )

        // Gains display
        ctx.font = '11px system-ui'
        ctx.fillStyle = gainA >= 0 && gainB >= 0 ? 'rgba(100, 200, 150, 1)' : 'rgba(255, 200, 100, 1)'
        const gainsText = `Gains from trade: ${gainA >= 0 ? '+' : ''}${gainA.toFixed(0)} ${goodALabel.split(' ')[0]}, ${gainB >= 0 ? '+' : ''}${gainB.toFixed(0)} ${goodBLabel.split(' ')[0]}`
        ctx.fillText(gainsText, width / 2, summaryY + 22)

        return () => window.removeEventListener('resize', resize)
    }, [country1, country2, specializationLevel, showTrade, country1AdvantageIn, country2AdvantageIn, getProduction, getOpportunityCost, goodALabel, goodBLabel, totalA, totalB, gainA, gainB])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Scenario selector */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex gap-2"
                >
                    {scenarios.map((s, i) => (
                        <button
                            key={s.name}
                            onClick={() => loadScenario(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${scenarioIndex === i
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'text-white/50 hover:text-white bg-black/30 border border-white/10'
                                }`}
                        >
                            {s.name}
                        </button>
                    ))}
                </motion.div>

                {/* Learn button */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 right-4"
                >
                    <button
                        onClick={() => { setShowDemo(true); setDemoStep(0) }}
                        className="text-sm px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                    >
                        Learn
                    </button>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showTrade}
                            onChange={e => setShowTrade(e.target.checked)}
                            className="accent-yellow-400"
                        />
                        Show Trade Flows
                    </label>

                    <div className="flex items-center gap-4">
                        <span className="text-white/50 text-sm">Specialization</span>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={specializationLevel}
                            onChange={e => setSpecializationLevel(+e.target.value)}
                            className="w-48 accent-yellow-400"
                        />
                        <span className="text-yellow-400 text-sm font-mono w-12">{(specializationLevel * 100).toFixed(0)}%</span>
                    </div>

                    <button
                        onClick={() => { setSpecializationLevel(0); setShowTrade(false) }}
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
