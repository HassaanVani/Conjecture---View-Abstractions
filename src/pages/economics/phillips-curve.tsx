import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Scenario = 'neutral' | 'demand-pull' | 'cost-push' | 'expectations-shift' | 'volcker'

interface ScenarioInfo {
    name: string
    expectedInflation: number
    point: { unemployment: number; inflation: number }
    description: string
}

const scenarios: Record<Scenario, ScenarioInfo> = {
    neutral: {
        name: 'Long-Run Equilibrium',
        expectedInflation: 2,
        point: { unemployment: 5, inflation: 2 },
        description: 'At the natural rate of unemployment with stable expectations.',
    },
    'demand-pull': {
        name: 'Demand-Pull Inflation',
        expectedInflation: 2,
        point: { unemployment: 3, inflation: 5 },
        description: 'Expansionary policy reduces unemployment but raises inflation (move along SRPC).',
    },
    'cost-push': {
        name: 'Cost-Push Inflation',
        expectedInflation: 4,
        point: { unemployment: 5, inflation: 4 },
        description: 'Supply shock shifts SRPC up. Same unemployment, higher inflation.',
    },
    'expectations-shift': {
        name: 'Rising Expectations',
        expectedInflation: 5,
        point: { unemployment: 5, inflation: 5 },
        description: 'Expectations adjust upward, shifting the entire SRPC.',
    },
    'volcker': {
        name: 'Volcker Disinflation',
        expectedInflation: 2,
        point: { unemployment: 8, inflation: 3 },
        description: 'Tight monetary policy: high unemployment to break inflation expectations.',
    },
}

export default function PhillipsCurve() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [currentPoint, setCurrentPoint] = useState({ unemployment: 5, inflation: 2 })
    const [expectedInflation, setExpectedInflation] = useState(2)
    const [showLRPC, setShowLRPC] = useState(true)
    const [naturalRate] = useState(5)
    const [scenario, setScenario] = useState<Scenario>('neutral')
    const [showDemo, setShowDemo] = useState(false)
    const [demoStep, setDemoStep] = useState(0)
    const [isDragging, setIsDragging] = useState(false)

    const applyScenario = useCallback((s: Scenario) => {
        setScenario(s)
        const info = scenarios[s]
        setExpectedInflation(info.expectedInflation)
        setCurrentPoint(info.point)
    }, [])

    // SRPC: inflation = expected - slope * (unemployment - natural)
    const getSRPCInflation = useCallback((u: number) => {
        const slope = 0.8
        return expectedInflation - slope * (u - naturalRate)
    }, [expectedInflation, naturalRate])

    const demoSteps = [
        {
            title: 'The Phillips Curve',
            description: 'The Phillips Curve shows the short-run tradeoff between unemployment and inflation. Lower unemployment → higher inflation, and vice versa.',
            action: () => applyScenario('neutral'),
        },
        {
            title: 'Short-Run Phillips Curve',
            description: 'The downward-sloping SRPC shows this tradeoff. Policymakers can move ALONG the curve by adjusting demand. But there\'s a catch...',
            action: () => applyScenario('demand-pull'),
        },
        {
            title: 'Long-Run Phillips Curve',
            description: 'The vertical LRPC shows there\'s NO long-run tradeoff. In the long run, unemployment returns to the "natural rate" regardless of inflation.',
            action: () => { setShowLRPC(true); applyScenario('neutral') },
        },
        {
            title: 'Expectations Matter',
            description: 'The SRPC shifts when inflation expectations change. If people EXPECT higher inflation, the curve shifts UP. Each SRPC is anchored to expected inflation.',
            action: () => applyScenario('expectations-shift'),
        },
        {
            title: 'The Volcker Shock',
            description: 'To break entrenched inflation, Paul Volcker raised rates sharply in the 1980s. This caused high unemployment but eventually lowered expectations.',
            action: () => applyScenario('volcker'),
        },
        {
            title: 'Try It Yourself!',
            description: 'Drag the point to explore the curve. Adjust expected inflation to shift the SRPC. Can you return to long-run equilibrium?',
            action: () => applyScenario('neutral'),
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

        const maxU = 10
        const maxI = 10
        const minI = -2

        const toCanvasX = (u: number) => padding + (u / maxU) * graphWidth
        const toCanvasY = (i: number) => height - padding - 50 - ((i - minI) / (maxI - minI)) * graphHeight

        // Grid
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.06)'
        ctx.lineWidth = 1
        for (let u = 0; u <= maxU; u += 1) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(u), toCanvasY(minI))
            ctx.lineTo(toCanvasX(u), toCanvasY(maxI))
            ctx.stroke()
        }
        for (let i = minI; i <= maxI; i += 1) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), toCanvasY(i))
            ctx.lineTo(toCanvasX(maxU), toCanvasY(i))
            ctx.stroke()
        }

        // Axes
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padding, toCanvasY(maxI))
        ctx.lineTo(padding, toCanvasY(minI))
        ctx.lineTo(toCanvasX(maxU), toCanvasY(minI))
        ctx.stroke()

        // Zero line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(toCanvasX(0), toCanvasY(0))
        ctx.lineTo(toCanvasX(maxU), toCanvasY(0))
        ctx.stroke()

        // Axis labels
        ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Unemployment Rate (%)', padding + graphWidth / 2, height - 20)

        ctx.save()
        ctx.translate(22, height / 2 - 25)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('Inflation Rate (%)', 0, 0)
        ctx.restore()

        // Axis ticks
        ctx.font = '10px system-ui'
        ctx.fillStyle = 'rgba(220, 180, 80, 0.5)'
        for (let u = 2; u <= maxU; u += 2) {
            ctx.textAlign = 'center'
            ctx.fillText(u + '%', toCanvasX(u), toCanvasY(minI) + 15)
        }
        for (let i = 0; i <= maxI; i += 2) {
            ctx.textAlign = 'right'
            ctx.fillText(i + '%', toCanvasX(0) - 8, toCanvasY(i) + 4)
        }

        // Long-Run Phillips Curve (LRPC)
        if (showLRPC) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.lineWidth = 2
            ctx.setLineDash([8, 4])
            ctx.beginPath()
            ctx.moveTo(toCanvasX(naturalRate), toCanvasY(maxI - 0.5))
            ctx.lineTo(toCanvasX(naturalRate), toCanvasY(minI + 0.5))
            ctx.stroke()
            ctx.setLineDash([])

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('LRPC', toCanvasX(naturalRate), toCanvasY(maxI + 0.2))

            ctx.font = '10px system-ui'
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.fillText(`NRU = ${naturalRate}%`, toCanvasX(naturalRate), toCanvasY(maxI - 0.5))
        }

        // Short-Run Phillips Curve (SRPC)
        const gradient = ctx.createLinearGradient(toCanvasX(1), 0, toCanvasX(9), 0)
        gradient.addColorStop(0, 'rgba(255, 100, 100, 0.9)')
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0.9)')

        ctx.strokeStyle = gradient
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let u = 1; u <= 9; u += 0.1) {
            const i = getSRPCInflation(u)
            if (i < minI || i > maxI) continue
            if (u === 1) ctx.moveTo(toCanvasX(u), toCanvasY(i))
            else ctx.lineTo(toCanvasX(u), toCanvasY(i))
        }
        ctx.stroke()

        ctx.fillStyle = 'rgba(255, 150, 100, 0.9)'
        ctx.font = 'bold 13px system-ui'
        ctx.textAlign = 'left'
        const srpcLabelY = getSRPCInflation(1.5)
        if (srpcLabelY <= maxI && srpcLabelY >= minI) {
            ctx.fillText('SRPC', toCanvasX(1.2), toCanvasY(srpcLabelY) - 10)
        }

        // Expected inflation line
        ctx.strokeStyle = 'rgba(100, 200, 150, 0.5)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(toCanvasX(0), toCanvasY(expectedInflation))
        ctx.lineTo(toCanvasX(maxU), toCanvasY(expectedInflation))
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = 'rgba(100, 200, 150, 0.8)'
        ctx.font = '11px system-ui'
        ctx.textAlign = 'right'
        ctx.fillText(`πᵉ = ${expectedInflation}%`, toCanvasX(maxU) - 5, toCanvasY(expectedInflation) - 8)

        // Current point glow
        const px = toCanvasX(currentPoint.unemployment)
        const py = toCanvasY(currentPoint.inflation)

        const glow = ctx.createRadialGradient(px, py, 0, px, py, 25)
        glow.addColorStop(0, 'rgba(220, 180, 80, 0.4)')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(px, py, 25, 0, Math.PI * 2)
        ctx.fill()

        // Current point
        ctx.fillStyle = 'rgba(220, 180, 80, 1)'
        ctx.beginPath()
        ctx.arc(px, py, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Point label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = 'bold 11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(
            `(${currentPoint.unemployment.toFixed(1)}%, ${currentPoint.inflation.toFixed(1)}%)`,
            px,
            py - 18
        )

        return () => window.removeEventListener('resize', resize)
    }, [currentPoint, expectedInflation, showLRPC, naturalRate, getSRPCInflation])

    const handleCanvasInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const width = canvas.offsetWidth
        const height = canvas.offsetHeight
        const padding = 80
        const graphWidth = width - padding * 2
        const graphHeight = height - padding * 2 - 50

        let clientX: number, clientY: number
        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        const clickX = clientX - rect.left
        const clickY = clientY - rect.top

        const maxU = 10
        const maxI = 10
        const minI = -2

        const u = ((clickX - padding) / graphWidth) * maxU
        const i = (1 - (clickY - (height - padding - 50 - graphHeight)) / graphHeight) * (maxI - minI) + minI

        if (u >= 0.5 && u <= 9.5 && i >= minI && i <= maxI) {
            setCurrentPoint({ unemployment: u, inflation: i })
            setScenario('neutral')
        }
    }, [])

    // Check if point is on SRPC
    const expectedOnCurve = getSRPCInflation(currentPoint.unemployment)
    const distFromCurve = Math.abs(currentPoint.inflation - expectedOnCurve)
    const isOnCurve = distFromCurve < 0.3
    const isAboveCurve = currentPoint.inflation > expectedOnCurve + 0.3
    const isBelowCurve = currentPoint.inflation < expectedOnCurve - 0.3

    const snapToSRPC = () => {
        setCurrentPoint(prev => ({
            ...prev,
            inflation: getSRPCInflation(prev.unemployment)
        }))
    }

    const moveToLREquilibrium = () => {
        setCurrentPoint({ unemployment: naturalRate, inflation: expectedInflation })
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair"
                    onClick={handleCanvasInteraction}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onMouseMove={e => isDragging && handleCanvasInteraction(e)}
                    onTouchStart={e => { setIsDragging(true); handleCanvasInteraction(e) }}
                    onTouchMove={e => isDragging && handleCanvasInteraction(e)}
                    onTouchEnd={() => setIsDragging(false)}
                />

                {/* Scenario selector */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex gap-2 flex-wrap"
                >
                    {Object.entries(scenarios).map(([key, info]) => (
                        <button
                            key={key}
                            onClick={() => applyScenario(key as Scenario)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${scenario === key
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'text-white/50 hover:text-white bg-black/30 border border-white/10'
                                }`}
                        >
                            {info.name}
                        </button>
                    ))}
                </motion.div>

                {/* Analysis panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-xs"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-white/60">Current Position</span>
                        <button
                            onClick={() => { setShowDemo(true); setDemoStep(0) }}
                            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            Learn
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <div className="text-xs text-white/40">Unemployment</div>
                            <div className="text-lg font-mono text-yellow-400">{currentPoint.unemployment.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div className="text-xs text-white/40">Inflation</div>
                            <div className="text-lg font-mono text-yellow-400">{currentPoint.inflation.toFixed(1)}%</div>
                        </div>
                    </div>

                    <div className={`text-xs mb-3 ${isOnCurve ? 'text-green-400' :
                        isAboveCurve ? 'text-orange-400' :
                            'text-blue-400'
                        }`}>
                        {isOnCurve && '✓ On the Short-Run Phillips Curve'}
                        {isAboveCurve && '↑ Above SRPC — expectations may rise'}
                        {isBelowCurve && '↓ Below SRPC — expectations may fall'}
                    </div>

                    <div className="text-xs text-white/50 border-t border-white/10 pt-2">
                        {scenarios[scenario].description}
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
                                checked={showLRPC}
                                onChange={e => setShowLRPC(e.target.checked)}
                                className="accent-yellow-400"
                            />
                            Show LRPC
                        </label>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm">Expected Inflation (πᵉ)</span>
                            <input
                                type="range"
                                min={-1}
                                max={8}
                                step={0.5}
                                value={expectedInflation}
                                onChange={e => { setExpectedInflation(+e.target.value); setScenario('neutral') }}
                                className="w-28 accent-green-400"
                            />
                            <span className="text-green-400 text-sm font-mono w-10">{expectedInflation}%</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={snapToSRPC}
                            className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                        >
                            Snap to SRPC
                        </button>
                        <button
                            onClick={moveToLREquilibrium}
                            className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                        >
                            LR Equilibrium
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
