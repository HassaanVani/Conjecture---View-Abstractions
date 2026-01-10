import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ViewMode = 'product' | 'cost' | 'both'

export default function ProductionCosts() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('both')
    const [laborInput, setLaborInput] = useState(10)
    const [fixedCost, setFixedCost] = useState(100)
    const [wageCost, setWageCost] = useState(20)
    const [showDemo, setShowDemo] = useState(false)
    const [demoStep, setDemoStep] = useState(0)

    // Production function with diminishing returns: Q = 10 * sqrt(L)
    const getOutput = useCallback((L: number) => 10 * Math.sqrt(L), [])

    // Marginal Product of Labor
    const getMPL = useCallback((L: number) => {
        if (L <= 0.5) return getOutput(1)
        return getOutput(L) - getOutput(L - 1)
    }, [getOutput])

    // Average Product of Labor
    const getAPL = useCallback((L: number) => L > 0 ? getOutput(L) / L : 0, [getOutput])

    // Cost functions
    const getTC = useCallback((Q: number) => {
        // Q = 10 * sqrt(L) => L = (Q/10)^2
        const L = Math.pow(Q / 10, 2)
        return fixedCost + wageCost * L
    }, [fixedCost, wageCost])

    const getATC = useCallback((Q: number) => Q > 0 ? getTC(Q) / Q : 0, [getTC])
    const getAVC = useCallback((Q: number) => Q > 0 ? (getTC(Q) - fixedCost) / Q : 0, [getTC, fixedCost])
    const getAFC = useCallback((Q: number) => Q > 0 ? fixedCost / Q : 0, [fixedCost])

    const getMC = useCallback((Q: number) => {
        if (Q <= 0.5) return getTC(1) - getTC(0)
        return getTC(Q) - getTC(Q - 1)
    }, [getTC])

    const currentQ = getOutput(laborInput)
    const currentMC = getMC(currentQ)
    const currentATC = getATC(currentQ)
    const currentMPL = getMPL(laborInput)
    const currentAPL = getAPL(laborInput)

    const demoSteps = [
        {
            title: 'Production & Costs',
            description: 'This visualization shows how inputs (labor) become outputs (product) and how costs change as production scales. Understanding these relationships is key to business decisions.',
            action: () => { setViewMode('both'); setLaborInput(10) },
        },
        {
            title: 'Total & Marginal Product',
            description: 'Total Product (TP) is total output. Marginal Product (MP) is the additional output from one more worker. Notice how MP initially rises but then FALLS (diminishing returns).',
            action: () => { setViewMode('product'); setLaborInput(5) },
        },
        {
            title: 'Diminishing Marginal Returns',
            description: 'As you add more workers, each additional worker produces LESS than the one before. This is the law of diminishing marginal returns — a fundamental economic principle.',
            action: () => { setViewMode('product'); setLaborInput(25) },
        },
        {
            title: 'Cost Curves',
            description: 'Costs mirror production in reverse. When MP is high, MC is low. When MP falls (diminishing returns), MC rises. This is why the MC curve is U-shaped.',
            action: () => { setViewMode('cost'); setLaborInput(15) },
        },
        {
            title: 'MC and ATC Relationship',
            description: 'When MC is below ATC, ATC is falling. When MC is above ATC, ATC is rising. MC crosses ATC at its minimum — this is the efficient scale.',
            action: () => { setViewMode('cost'); setLaborInput(20) },
        },
        {
            title: 'Try It Yourself!',
            description: 'Adjust labor input and fixed costs. Watch how the curves shift. Can you find the output level where ATC is minimized?',
            action: () => { setViewMode('both'); setLaborInput(10) },
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

        const showProduct = viewMode === 'product' || viewMode === 'both'
        const showCost = viewMode === 'cost' || viewMode === 'both'

        if (viewMode === 'both') {
            // Two graphs side by side
            drawProductGraph(ctx, 30, width / 2 - 40)
            drawCostGraph(ctx, width / 2 + 20, width / 2 - 40)
        } else if (showProduct) {
            drawProductGraph(ctx, 60, width - 120)
        } else if (showCost) {
            drawCostGraph(ctx, 60, width - 120)
        }

        function drawProductGraph(ctx: CanvasRenderingContext2D, startX: number, graphWidth: number) {
            const padding = 50
            const graphHeight = height - 180

            // Axes
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(startX + padding, 50)
            ctx.lineTo(startX + padding, 50 + graphHeight)
            ctx.lineTo(startX + padding + graphWidth - padding, 50 + graphHeight)
            ctx.stroke()

            // Labels
            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.font = '12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Labor (L)', startX + padding + (graphWidth - padding) / 2, 50 + graphHeight + 35)

            ctx.save()
            ctx.translate(startX + padding - 35, 50 + graphHeight / 2)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Product', 0, 0)
            ctx.restore()

            ctx.font = 'bold 14px system-ui'
            ctx.fillStyle = 'rgba(100, 200, 150, 1)'
            ctx.fillText('Production Function', startX + padding + (graphWidth - padding) / 2, 30)

            // Total Product curve
            const maxL = 40
            const maxQ = getOutput(maxL) * 1.1

            ctx.strokeStyle = 'rgba(100, 200, 150, 0.9)'
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.beginPath()
            for (let L = 0; L <= maxL; L += 0.5) {
                const Q = getOutput(L)
                const x = startX + padding + (L / maxL) * (graphWidth - padding)
                const y = 50 + graphHeight - (Q / maxQ) * graphHeight
                if (L === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            ctx.fillStyle = 'rgba(100, 200, 150, 0.9)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('TP', startX + padding + (35 / maxL) * (graphWidth - padding) + 5, 50 + graphHeight - (getOutput(35) / maxQ) * graphHeight)

            // MPL curve (scaled to fit)
            const maxMP = getMPL(1) * 1.5
            ctx.strokeStyle = 'rgba(255, 150, 100, 0.8)'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let L = 1; L <= maxL; L += 0.5) {
                const mp = getMPL(L)
                const x = startX + padding + (L / maxL) * (graphWidth - padding)
                const y = 50 + graphHeight - (mp / maxMP) * graphHeight * 0.5
                if (L === 1) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            ctx.fillStyle = 'rgba(255, 150, 100, 0.9)'
            ctx.fillText('MP', startX + padding + (5 / maxL) * (graphWidth - padding) + 5, 50 + graphHeight - (getMPL(5) / maxMP) * graphHeight * 0.5 - 5)

            // APL curve
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.8)'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let L = 1; L <= maxL; L += 0.5) {
                const ap = getAPL(L)
                const x = startX + padding + (L / maxL) * (graphWidth - padding)
                const y = 50 + graphHeight - (ap / maxMP) * graphHeight * 0.5
                if (L === 1) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            ctx.fillStyle = 'rgba(100, 150, 255, 0.9)'
            ctx.fillText('AP', startX + padding + (8 / maxL) * (graphWidth - padding) + 5, 50 + graphHeight - (getAPL(8) / maxMP) * graphHeight * 0.5 + 15)

            // Current point on TP
            const currentX = startX + padding + (laborInput / maxL) * (graphWidth - padding)
            const currentY = 50 + graphHeight - (currentQ / maxQ) * graphHeight

            ctx.fillStyle = 'rgba(220, 180, 80, 1)'
            ctx.beginPath()
            ctx.arc(currentX, currentY, 6, 0, Math.PI * 2)
            ctx.fill()

            // Dashed line to axis
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.3)'
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.moveTo(currentX, currentY)
            ctx.lineTo(currentX, 50 + graphHeight)
            ctx.stroke()
            ctx.setLineDash([])
        }

        function drawCostGraph(ctx: CanvasRenderingContext2D, startX: number, graphWidth: number) {
            const padding = 50
            const graphHeight = height - 180

            // Axes
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(startX + padding, 50)
            ctx.lineTo(startX + padding, 50 + graphHeight)
            ctx.lineTo(startX + padding + graphWidth - padding, 50 + graphHeight)
            ctx.stroke()

            // Labels
            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.font = '12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Quantity (Q)', startX + padding + (graphWidth - padding) / 2, 50 + graphHeight + 35)

            ctx.save()
            ctx.translate(startX + padding - 35, 50 + graphHeight / 2)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Cost ($)', 0, 0)
            ctx.restore()

            ctx.font = 'bold 14px system-ui'
            ctx.fillStyle = 'rgba(255, 150, 100, 1)'
            ctx.fillText('Cost Curves', startX + padding + (graphWidth - padding) / 2, 30)

            const maxQCost = getOutput(40)
            const maxCost = Math.max(getATC(1), getMC(maxQCost)) * 1.3

            // ATC curve
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.9)'
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.beginPath()
            for (let Q = 5; Q <= maxQCost; Q += 1) {
                const atc = getATC(Q)
                const x = startX + padding + (Q / maxQCost) * (graphWidth - padding)
                const y = 50 + graphHeight - (atc / maxCost) * graphHeight
                if (Q === 5) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            ctx.fillStyle = 'rgba(255, 200, 100, 1)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('ATC', startX + padding + (55 / maxQCost) * (graphWidth - padding), 50 + graphHeight - (getATC(55) / maxCost) * graphHeight - 5)

            // AVC curve
            ctx.strokeStyle = 'rgba(100, 200, 150, 0.8)'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let Q = 5; Q <= maxQCost; Q += 1) {
                const avc = getAVC(Q)
                const x = startX + padding + (Q / maxQCost) * (graphWidth - padding)
                const y = 50 + graphHeight - (avc / maxCost) * graphHeight
                if (Q === 5) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            ctx.fillStyle = 'rgba(100, 200, 150, 1)'
            ctx.fillText('AVC', startX + padding + (55 / maxQCost) * (graphWidth - padding), 50 + graphHeight - (getAVC(55) / maxCost) * graphHeight + 15)

            // MC curve
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
            ctx.lineWidth = 3
            ctx.beginPath()
            for (let Q = 5; Q <= maxQCost; Q += 1) {
                const mc = getMC(Q)
                const x = startX + padding + (Q / maxQCost) * (graphWidth - padding)
                const y = 50 + graphHeight - (mc / maxCost) * graphHeight
                if (Q === 5) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            ctx.fillStyle = 'rgba(255, 100, 100, 1)'
            ctx.fillText('MC', startX + padding + (45 / maxQCost) * (graphWidth - padding), 50 + graphHeight - (getMC(45) / maxCost) * graphHeight + 15)

            // AFC curve (dashed)
            ctx.strokeStyle = 'rgba(150, 150, 255, 0.5)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            for (let Q = 5; Q <= maxQCost; Q += 2) {
                const afc = getAFC(Q)
                const x = startX + padding + (Q / maxQCost) * (graphWidth - padding)
                const y = 50 + graphHeight - (afc / maxCost) * graphHeight
                if (Q === 5) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()
            ctx.setLineDash([])

            ctx.fillStyle = 'rgba(150, 150, 255, 0.7)'
            ctx.fillText('AFC', startX + padding + 15, 50 + graphHeight - (getAFC(8) / maxCost) * graphHeight)

            // Current point on ATC
            const currentX = startX + padding + (currentQ / maxQCost) * (graphWidth - padding)
            const currentY = 50 + graphHeight - (currentATC / maxCost) * graphHeight

            ctx.fillStyle = 'rgba(220, 180, 80, 1)'
            ctx.beginPath()
            ctx.arc(currentX, currentY, 6, 0, Math.PI * 2)
            ctx.fill()

            // Dashed line to axis
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.3)'
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.moveTo(currentX, currentY)
            ctx.lineTo(currentX, 50 + graphHeight)
            ctx.stroke()
            ctx.setLineDash([])
        }

        return () => window.removeEventListener('resize', resize)
    }, [viewMode, laborInput, fixedCost, wageCost, getOutput, getMPL, getAPL, getTC, getATC, getAVC, getAFC, getMC, currentQ, currentATC])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* View mode selector */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex gap-2"
                >
                    {[
                        { mode: 'product' as const, label: 'Production' },
                        { mode: 'cost' as const, label: 'Costs' },
                        { mode: 'both' as const, label: 'Both' },
                    ].map(item => (
                        <button
                            key={item.mode}
                            onClick={() => setViewMode(item.mode)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${viewMode === item.mode
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
                        <span className="text-sm text-white/60">Current Values</span>
                        <button
                            onClick={() => { setShowDemo(true); setDemoStep(0) }}
                            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            Learn
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <div className="text-white/40">Labor (L)</div>
                            <div className="text-lg font-mono text-yellow-400">{laborInput}</div>
                        </div>
                        <div>
                            <div className="text-white/40">Output (Q)</div>
                            <div className="text-lg font-mono text-green-400">{currentQ.toFixed(1)}</div>
                        </div>
                        <div>
                            <div className="text-white/40">MP</div>
                            <div className="font-mono text-orange-400">{currentMPL.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-white/40">AP</div>
                            <div className="font-mono text-blue-400">{currentAPL.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-white/40">MC</div>
                            <div className="font-mono text-red-400">${currentMC.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-white/40">ATC</div>
                            <div className="font-mono text-yellow-400">${currentATC.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="text-xs text-white/40 mt-3 border-t border-white/10 pt-2">
                        {currentMC < currentATC && 'MC < ATC → ATC is falling'}
                        {currentMC > currentATC && 'MC > ATC → ATC is rising'}
                        {Math.abs(currentMC - currentATC) < 0.1 && 'MC ≈ ATC → Efficient scale'}
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm">Labor (L)</span>
                            <input
                                type="range"
                                min={1}
                                max={40}
                                value={laborInput}
                                onChange={e => setLaborInput(+e.target.value)}
                                className="w-32 accent-yellow-400"
                            />
                            <span className="text-yellow-400 text-sm font-mono w-8">{laborInput}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm">Fixed Cost</span>
                            <input
                                type="range"
                                min={50}
                                max={200}
                                step={10}
                                value={fixedCost}
                                onChange={e => setFixedCost(+e.target.value)}
                                className="w-24 accent-blue-400"
                            />
                            <span className="text-blue-400 text-sm font-mono w-10">${fixedCost}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm">Wage</span>
                            <input
                                type="range"
                                min={10}
                                max={40}
                                step={2}
                                value={wageCost}
                                onChange={e => setWageCost(+e.target.value)}
                                className="w-24 accent-green-400"
                            />
                            <span className="text-green-400 text-sm font-mono w-8">${wageCost}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => { setLaborInput(10); setFixedCost(100); setWageCost(20) }}
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
