import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ModelType = 'simple' | 'government' | 'open'

// Flow data is implicitly defined in draw functions

export default function CircularFlow() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [model, setModel] = useState<ModelType>('simple')
    const [animationFrame, setAnimationFrame] = useState(0)
    const [showValues, setShowValues] = useState(true)
    const [showDemo, setShowDemo] = useState(false)
    const [demoStep, setDemoStep] = useState(0)

    // GDP Components (in $B)
    const [consumption, setConsumption] = useState(70)
    const [investment, setInvestment] = useState(18)
    const [govSpending, setGovSpending] = useState(20)
    const [exports, setExports] = useState(12)
    const [imports, setImports] = useState(15)
    const [taxes] = useState(22)

    const netExports = exports - imports
    const gdp = consumption + investment + govSpending + netExports
    const demoSteps = [
        {
            title: 'The Circular Flow',
            description: 'The economy is a continuous flow of goods, services, resources, and money between different sectors. This model shows how they\'re all connected.',
            action: () => setModel('simple'),
        },
        {
            title: 'Simple Two-Sector Model',
            description: 'Households sell labor (and other factors) to firms. Firms pay income (wages, rent, profit). Households use income to buy goods. Money flows in circles!',
            action: () => setModel('simple'),
        },
        {
            title: 'Adding Government',
            description: 'Government collects TAXES (a leakage from the flow) and spends on goods/services (an injection). Government can run deficits or surpluses.',
            action: () => setModel('government'),
        },
        {
            title: 'Opening to Trade',
            description: 'EXPORTS are money flowing IN (injection). IMPORTS are money flowing OUT (leakage). Net Exports (X-M) can be positive or negative.',
            action: () => setModel('open'),
        },
        {
            title: 'GDP Identity',
            description: 'GDP = C + I + G + NX. This is the EXPENDITURE approach — total spending equals total output equals total income. All three are always equal!',
            action: () => setModel('open'),
        },
        {
            title: 'Leakages and Injections',
            description: 'LEAKAGES: Savings, Taxes, Imports (money leaving the flow). INJECTIONS: Investment, Government, Exports (money entering). When they\'re equal, economy is stable.',
            action: () => setModel('open'),
        },
    ]

    useEffect(() => {
        if (showDemo) {
            demoSteps[demoStep].action()
        }
    }, [showDemo, demoStep])

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimationFrame(f => (f + 1) % 360)
        }, 40)
        return () => clearInterval(interval)
    }, [])

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
        const cx = width / 2
        const cy = height / 2 - 30

        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, width, height)

        // Draw entity box
        const drawEntity = (x: number, y: number, label: string, color: string, size = 90) => {
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.beginPath()
            ctx.roundRect(x - size / 2 + 3, y - 25 + 3, size, 50, 12)
            ctx.fill()

            // Box
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.roundRect(x - size / 2, y - 25, size, 50, 12)
            ctx.fill()

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.lineWidth = 1
            ctx.stroke()

            // Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, x, y)
        }

        // Draw animated flow arrow
        const drawFlow = (from: { x: number; y: number }, to: { x: number; y: number }, label: string, value: number, color: string, curveDir = 1) => {
            const midX = (from.x + to.x) / 2
            const midY = (from.y + to.y) / 2

            // Calculate perpendicular offset for curve
            const dx = to.x - from.x
            const dy = to.y - from.y
            const len = Math.sqrt(dx * dx + dy * dy)
            const perpX = (-dy / len) * 40 * curveDir
            const perpY = (dx / len) * 40 * curveDir

            // Draw curved arrow
            ctx.strokeStyle = color
            ctx.lineWidth = 2 + (value / 50)
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(from.x, from.y)
            ctx.quadraticCurveTo(midX + perpX, midY + perpY, to.x, to.y)
            ctx.stroke()

            // Arrowhead
            const angle = Math.atan2(to.y - (midY + perpY), to.x - (midX + perpX))
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.moveTo(to.x, to.y)
            ctx.lineTo(to.x - 10 * Math.cos(angle - 0.3), to.y - 10 * Math.sin(angle - 0.3))
            ctx.lineTo(to.x - 10 * Math.cos(angle + 0.3), to.y - 10 * Math.sin(angle + 0.3))
            ctx.closePath()
            ctx.fill()

            // Animated particles
            const numParticles = Math.min(4, Math.floor(value / 15) + 1)
            for (let i = 0; i < numParticles; i++) {
                const t = ((animationFrame / 90 + i / numParticles) % 1)
                const t2 = t * t
                const mt = 1 - t
                const mt2 = mt * mt
                // Quadratic bezier formula
                const px = mt2 * from.x + 2 * mt * t * (midX + perpX) + t2 * to.x
                const py = mt2 * from.y + 2 * mt * t * (midY + perpY) + t2 * to.y

                ctx.fillStyle = color
                ctx.beginPath()
                ctx.arc(px, py, 3 + value / 40, 0, Math.PI * 2)
                ctx.fill()
            }

            // Label
            if (showValues) {
                const labelX = midX + perpX * 0.8
                const labelY = midY + perpY * 0.8

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.beginPath()
                ctx.roundRect(labelX - 30, labelY - 16, 60, 32, 6)
                ctx.fill()

                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(label, labelX, labelY - 5)
                ctx.font = 'bold 11px monospace'
                ctx.fillStyle = color
                ctx.fillText(`$${value}B`, labelX, labelY + 8)
            }
        }

        if (model === 'simple') {
            // Two-sector model
            const householdsY = cy + 100
            const firmsY = cy - 100

            drawEntity(cx, firmsY, 'Firms', 'rgba(100, 150, 255, 0.25)')
            drawEntity(cx, householdsY, 'Households', 'rgba(255, 150, 100, 0.25)')

            // Goods flow (firms -> households) - outer left
            drawFlow({ x: cx - 100, y: firmsY + 25 }, { x: cx - 100, y: householdsY - 25 }, 'Goods', gdp, 'rgba(100, 200, 150, 0.8)', 1)

            // Factor income (firms -> households) - inner right
            drawFlow({ x: cx + 60, y: firmsY + 25 }, { x: cx + 60, y: householdsY - 25 }, 'Income', gdp, 'rgba(200, 180, 100, 0.8)', -1)

            // Spending (households -> firms) - inner left
            drawFlow({ x: cx - 60, y: householdsY - 25 }, { x: cx - 60, y: firmsY + 25 }, 'Spending', consumption, 'rgba(255, 150, 100, 0.8)', 1)

            // Factors (households -> firms) - outer right
            drawFlow({ x: cx + 100, y: householdsY - 25 }, { x: cx + 100, y: firmsY + 25 }, 'Labor', gdp, 'rgba(150, 100, 255, 0.8)', -1)

        } else {
            // Multi-sector model
            const r = 130
            const entities = [
                { x: cx, y: cy - r, label: 'Firms', color: 'rgba(100, 150, 255, 0.25)' },
                { x: cx, y: cy + r, label: 'Households', color: 'rgba(255, 150, 100, 0.25)' },
            ]

            if (model === 'government' || model === 'open') {
                entities.push({ x: cx + r + 20, y: cy, label: 'Government', color: 'rgba(150, 100, 255, 0.25)' })
            }
            if (model === 'open') {
                entities.push({ x: cx - r - 20, y: cy, label: 'Foreign', color: 'rgba(100, 200, 150, 0.25)' })
            }

            entities.forEach(e => drawEntity(e.x, e.y, e.label, e.color, 95))

            // Core flows
            drawFlow({ x: cx - 50, y: cy + r - 25 }, { x: cx - 50, y: cy - r + 25 }, 'C', consumption, 'rgba(255, 150, 100, 0.8)', 1)
            drawFlow({ x: cx + 50, y: cy - r + 25 }, { x: cx + 50, y: cy + r - 25 }, 'Income', gdp, 'rgba(200, 180, 100, 0.8)', 1)

            if (model === 'government' || model === 'open') {
                // Investment (financial -> firms)
                drawFlow({ x: cx + 30, y: cy + r - 25 }, { x: cx + r - 30, y: cy - 30 }, 'I', investment, 'rgba(220, 180, 80, 0.8)', -1)

                // Government spending
                drawFlow({ x: cx + r - 30, y: cy + 30 }, { x: cx + 30, y: cy - r + 25 }, 'G', govSpending, 'rgba(150, 100, 255, 0.8)', -1)

                // Taxes
                drawFlow({ x: cx + 60, y: cy + r - 25 }, { x: cx + r - 40, y: cy + 40 }, 'T', taxes, 'rgba(255, 100, 100, 0.6)', 1)
            }

            if (model === 'open') {
                // Exports
                drawFlow({ x: cx - r + 30, y: cy - 30 }, { x: cx - 30, y: cy - r + 25 }, 'X', exports, 'rgba(100, 255, 150, 0.8)', 1)

                // Imports
                drawFlow({ x: cx - 30, y: cy - r + 25 }, { x: cx - r + 30, y: cy + 30 }, 'M', imports, 'rgba(255, 100, 100, 0.6)', 1)
            }
        }

        // GDP display at bottom
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.beginPath()
        ctx.roundRect(cx - 180, height - 85, 360, 65, 12)
        ctx.fill()

        ctx.fillStyle = 'rgba(220, 180, 80, 1)'
        ctx.font = 'bold 16px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('GDP = C + I + G + (X - M)', cx, height - 60)

        ctx.font = '13px monospace'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        if (model === 'open') {
            ctx.fillText(`${consumption} + ${investment} + ${govSpending} + (${exports} - ${imports}) = $${gdp}B`, cx, height - 38)
        } else if (model === 'government') {
            ctx.fillText(`${consumption} + ${investment} + ${govSpending} = $${consumption + investment + govSpending}B`, cx, height - 38)
        } else {
            ctx.fillText(`${consumption} = $${consumption}B (Simple Model)`, cx, height - 38)
        }

        return () => window.removeEventListener('resize', resize)
    }, [model, animationFrame, consumption, investment, govSpending, exports, imports, gdp, showValues])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Model selector */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex gap-2"
                >
                    {[
                        { type: 'simple' as const, label: 'Simple (2 Sector)' },
                        { type: 'government' as const, label: 'With Government' },
                        { type: 'open' as const, label: 'Open Economy' },
                    ].map(item => (
                        <button
                            key={item.type}
                            onClick={() => setModel(item.type)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${model === item.type
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'text-white/50 hover:text-white bg-black/30 border border-white/10'
                                }`}
                        >
                            {item.label}
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
                        <span className="text-sm text-white/60">GDP Components</span>
                        <button
                            onClick={() => { setShowDemo(true); setDemoStep(0) }}
                            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            Learn
                        </button>
                    </div>

                    <div className="text-2xl font-mono text-yellow-400 mb-3">
                        ${gdp}B
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-white/50">C:</span>
                            <span className="text-orange-400 font-mono">${consumption}B</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">I:</span>
                            <span className="text-yellow-400 font-mono">${investment}B</span>
                        </div>
                        {model !== 'simple' && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-white/50">G:</span>
                                    <span className="text-purple-400 font-mono">${govSpending}B</span>
                                </div>
                                {model === 'open' && (
                                    <div className="flex justify-between">
                                        <span className="text-white/50">NX:</span>
                                        <span className={`font-mono ${netExports >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${netExports}B
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showValues}
                                onChange={e => setShowValues(e.target.checked)}
                                className="accent-yellow-400"
                            />
                            Show Values
                        </label>

                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-2">
                                <span className="text-orange-400 text-xs font-medium">C</span>
                                <input type="range" min={40} max={90} value={consumption}
                                    onChange={e => setConsumption(+e.target.value)}
                                    className="w-16 accent-orange-400" />
                                <span className="text-white/50 text-xs font-mono w-6">{consumption}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-yellow-400 text-xs font-medium">I</span>
                                <input type="range" min={5} max={35} value={investment}
                                    onChange={e => setInvestment(+e.target.value)}
                                    className="w-16 accent-yellow-400" />
                                <span className="text-white/50 text-xs font-mono w-6">{investment}</span>
                            </div>
                            {model !== 'simple' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-purple-400 text-xs font-medium">G</span>
                                    <input type="range" min={10} max={40} value={govSpending}
                                        onChange={e => setGovSpending(+e.target.value)}
                                        className="w-16 accent-purple-400" />
                                    <span className="text-white/50 text-xs font-mono w-6">{govSpending}</span>
                                </div>
                            )}
                            {model === 'open' && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400 text-xs font-medium">X</span>
                                        <input type="range" min={5} max={30} value={exports}
                                            onChange={e => setExports(+e.target.value)}
                                            className="w-14 accent-green-400" />
                                        <span className="text-white/50 text-xs font-mono w-5">{exports}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-400 text-xs font-medium">M</span>
                                        <input type="range" min={5} max={30} value={imports}
                                            onChange={e => setImports(+e.target.value)}
                                            className="w-14 accent-red-400" />
                                        <span className="text-white/50 text-xs font-mono w-5">{imports}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setConsumption(70)
                                setInvestment(18)
                                setGovSpending(20)
                                setExports(12)
                                setImports(15)
                            }}
                            className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                        >
                            Reset
                        </button>
                    </div>
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
