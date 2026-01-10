import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Scenario = 'neutral' | 'recession' | 'inflation' | 'stagflation' | 'growth'

interface ScenarioInfo {
    name: string
    adShift: number
    srasShift: number
    description: string
    policy: string
}

const scenarios: Record<Scenario, ScenarioInfo> = {
    neutral: {
        name: 'Equilibrium',
        adShift: 0,
        srasShift: 0,
        description: 'Economy at potential output (Y*). No output gap.',
        policy: 'No intervention needed',
    },
    recession: {
        name: 'Recessionary Gap',
        adShift: -0.4,
        srasShift: 0,
        description: 'Real GDP below potential. High unemployment, low inflation.',
        policy: 'Expansionary fiscal/monetary policy to shift AD right',
    },
    inflation: {
        name: 'Inflationary Gap',
        adShift: 0.4,
        srasShift: 0,
        description: 'Real GDP above potential. Low unemployment, rising prices.',
        policy: 'Contractionary fiscal/monetary policy to shift AD left',
    },
    stagflation: {
        name: 'Stagflation',
        adShift: 0,
        srasShift: -0.4,
        description: 'Negative supply shock. High unemployment AND high inflation.',
        policy: 'Dilemma: Fix inflation OR unemployment, not both',
    },
    growth: {
        name: 'Economic Growth',
        adShift: 0.3,
        srasShift: 0.3,
        description: 'Both AD and LRAS shift right. Sustainable growth.',
        policy: 'Investment in productivity, education, infrastructure',
    },
}

export default function AggregateSupplyDemand() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [adShift, setAdShift] = useState(0)
    const [srasShift, setSrasShift] = useState(0)
    const [lrasShift, setLrasShift] = useState(0)
    const [showLRAS, setShowLRAS] = useState(true)
    const [scenario, setScenario] = useState<Scenario>('neutral')
    const [showDemo, setShowDemo] = useState(false)
    const [demoStep, setDemoStep] = useState(0)

    const applyScenario = useCallback((s: Scenario) => {
        setScenario(s)
        const info = scenarios[s]
        setAdShift(info.adShift)
        setSrasShift(info.srasShift)
        if (s === 'growth') setLrasShift(0.3)
        else setLrasShift(0)
    }, [])

    const demoSteps = [
        {
            title: 'The AD-AS Model',
            description: 'This model shows how the overall economy reaches equilibrium. Aggregate Demand (AD) is total spending. Short-Run Aggregate Supply (SRAS) is total production at each price level.',
            action: () => applyScenario('neutral'),
        },
        {
            title: 'Long-Run Aggregate Supply',
            description: 'The vertical LRAS line shows potential output (Y*) — the economy\'s maximum sustainable production. In the long run, output returns to this level regardless of prices.',
            action: () => { setShowLRAS(true); applyScenario('neutral') },
        },
        {
            title: 'Recessionary Gap',
            description: 'When AD shifts left (less spending), equilibrium output falls BELOW potential. This means unemployment rises. The gap between actual and potential output is the "recessionary gap."',
            action: () => applyScenario('recession'),
        },
        {
            title: 'Inflationary Gap',
            description: 'When AD shifts right (more spending), output temporarily exceeds potential. Unemployment falls below natural rate, but prices rise. This "overheating" isn\'t sustainable.',
            action: () => applyScenario('inflation'),
        },
        {
            title: 'Stagflation',
            description: 'A leftward SRAS shift (negative supply shock) creates the worst of both worlds: falling output AND rising prices. Examples: oil crises, pandemics.',
            action: () => applyScenario('stagflation'),
        },
        {
            title: 'Long-Run Growth',
            description: 'When LRAS shifts right (more capacity), the economy can produce more without inflation. This comes from investment, technology, education, and population growth.',
            action: () => applyScenario('growth'),
        },
        {
            title: 'Try It Yourself!',
            description: 'Use the sliders to shift AD and SRAS. Watch how equilibrium price level and output change. Can you create a recession? An inflationary gap?',
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

        const toCanvasX = (x: number) => padding + (x / 100) * graphWidth
        const toCanvasY = (y: number) => height - padding - 50 - (y / 100) * graphHeight

        // Grid
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.06)'
        ctx.lineWidth = 1
        for (let i = 0; i <= 100; i += 20) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(i), toCanvasY(0))
            ctx.lineTo(toCanvasX(i), toCanvasY(100))
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), toCanvasY(i))
            ctx.lineTo(toCanvasX(100), toCanvasY(i))
            ctx.stroke()
        }

        // Axes
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padding, toCanvasY(100))
        ctx.lineTo(padding, toCanvasY(0))
        ctx.lineTo(toCanvasX(100), toCanvasY(0))
        ctx.stroke()

        // Arrow heads
        ctx.fillStyle = 'rgba(220, 180, 80, 0.5)'
        ctx.beginPath()
        ctx.moveTo(padding, toCanvasY(100))
        ctx.lineTo(padding - 5, toCanvasY(100) + 8)
        ctx.lineTo(padding + 5, toCanvasY(100) + 8)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(toCanvasX(100), toCanvasY(0))
        ctx.lineTo(toCanvasX(100) - 8, toCanvasY(0) - 5)
        ctx.lineTo(toCanvasX(100) - 8, toCanvasY(0) + 5)
        ctx.fill()

        // Axis labels
        ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Real GDP (Y)', padding + graphWidth / 2, height - 20)

        ctx.save()
        ctx.translate(22, height / 2 - 25)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('Price Level (P)', 0, 0)
        ctx.restore()

        // LRAS position
        const lrasX = 50 + lrasShift * 20

        // Long-Run Aggregate Supply (LRAS)
        if (showLRAS) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.lineWidth = 2
            ctx.setLineDash([8, 4])
            ctx.beginPath()
            ctx.moveTo(toCanvasX(lrasX), toCanvasY(90))
            ctx.lineTo(toCanvasX(lrasX), toCanvasY(10))
            ctx.stroke()
            ctx.setLineDash([])

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('LRAS', toCanvasX(lrasX), toCanvasY(95))

            ctx.font = '10px system-ui'
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.fillText('(Y*)', toCanvasX(lrasX), toCanvasY(90))
        }

        // Short-Run Aggregate Supply (SRAS)
        const srasBaseX = 15 + srasShift * 25
        ctx.strokeStyle = 'rgba(100, 200, 150, 0.9)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let y = 15; y <= 85; y += 1) {
            const x = srasBaseX + y * 0.75 + srasShift * 10
            if (y === 15) ctx.moveTo(toCanvasX(x), toCanvasY(y))
            else ctx.lineTo(toCanvasX(x), toCanvasY(y))
        }
        ctx.stroke()

        ctx.fillStyle = 'rgba(100, 200, 150, 0.9)'
        ctx.font = 'bold 13px system-ui'
        ctx.textAlign = 'left'
        const srasLabelX = srasBaseX + 85 * 0.75 + srasShift * 10
        ctx.fillText('SRAS', toCanvasX(srasLabelX) + 8, toCanvasY(85))

        // Aggregate Demand (AD)
        const adBaseX = 90 + adShift * 25
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
        ctx.lineWidth = 3
        ctx.beginPath()
        for (let y = 15; y <= 85; y += 1) {
            const x = adBaseX - y * 0.75 + adShift * 10
            if (y === 15) ctx.moveTo(toCanvasX(x), toCanvasY(y))
            else ctx.lineTo(toCanvasX(x), toCanvasY(y))
        }
        ctx.stroke()

        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
        ctx.textAlign = 'right'
        const adLabelX = adBaseX - 85 * 0.75 + adShift * 10
        ctx.fillText('AD', toCanvasX(adLabelX) - 8, toCanvasY(85))

        // Calculate equilibrium
        // AD: x = adBaseX - y * 0.75 + adShift * 10
        // SRAS: x = srasBaseX + y * 0.75 + srasShift * 10
        // Set equal: adBaseX + adShift * 10 - srasBaseX - srasShift * 10 = 1.5 * y
        const eqY = (adBaseX + adShift * 10 - srasBaseX - srasShift * 10) / 1.5
        const eqX = srasBaseX + eqY * 0.75 + srasShift * 10

        // Draw equilibrium
        if (eqX > 10 && eqX < 95 && eqY > 10 && eqY < 95) {
            // Dashed lines to axes
            ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'
            ctx.lineWidth = 1.5
            ctx.setLineDash([6, 4])
            ctx.beginPath()
            ctx.moveTo(toCanvasX(eqX), toCanvasY(eqY))
            ctx.lineTo(toCanvasX(eqX), toCanvasY(0))
            ctx.moveTo(toCanvasX(eqX), toCanvasY(eqY))
            ctx.lineTo(toCanvasX(0), toCanvasY(eqY))
            ctx.stroke()
            ctx.setLineDash([])

            // Equilibrium glow
            const eqGlow = ctx.createRadialGradient(
                toCanvasX(eqX), toCanvasY(eqY), 0,
                toCanvasX(eqX), toCanvasY(eqY), 20
            )
            eqGlow.addColorStop(0, 'rgba(220, 180, 80, 0.4)')
            eqGlow.addColorStop(1, 'transparent')
            ctx.fillStyle = eqGlow
            ctx.beginPath()
            ctx.arc(toCanvasX(eqX), toCanvasY(eqY), 20, 0, Math.PI * 2)
            ctx.fill()

            // Equilibrium point
            ctx.fillStyle = 'rgba(220, 180, 80, 1)'
            ctx.beginPath()
            ctx.arc(toCanvasX(eqX), toCanvasY(eqY), 8, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.lineWidth = 2
            ctx.stroke()

            // Gap analysis
            if (showLRAS) {
                const gap = eqX - lrasX
                let gapText = ''
                let gapColor = ''
                let gapBg = ''

                if (gap > 4) {
                    gapText = 'Inflationary Gap'
                    gapColor = 'rgba(255, 150, 100, 1)'
                    gapBg = 'rgba(255, 150, 100, 0.1)'
                } else if (gap < -4) {
                    gapText = 'Recessionary Gap'
                    gapColor = 'rgba(100, 150, 255, 1)'
                    gapBg = 'rgba(100, 150, 255, 0.1)'
                } else {
                    gapText = 'At Potential Output'
                    gapColor = 'rgba(80, 200, 120, 1)'
                    gapBg = 'rgba(80, 200, 120, 0.1)'
                }

                // Gap area
                if (Math.abs(gap) > 4) {
                    ctx.fillStyle = gapBg
                    ctx.fillRect(
                        Math.min(toCanvasX(eqX), toCanvasX(lrasX)),
                        toCanvasY(eqY) - 30,
                        Math.abs(toCanvasX(eqX) - toCanvasX(lrasX)),
                        60
                    )
                }

                // Gap label
                ctx.fillStyle = gapColor
                ctx.font = 'bold 13px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(gapText, toCanvasX((eqX + lrasX) / 2), toCanvasY(eqY) - 25)
            }

            // Value labels
            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.font = '11px monospace'
            ctx.textAlign = 'center'
            ctx.fillText(`Y = ${eqX.toFixed(0)}`, toCanvasX(eqX), toCanvasY(0) + 18)
            ctx.textAlign = 'right'
            ctx.fillText(`P = ${eqY.toFixed(0)}`, toCanvasX(0) - 8, toCanvasY(eqY) + 4)
        }

        return () => window.removeEventListener('resize', resize)
    }, [adShift, srasShift, lrasShift, showLRAS])

    const currentScenario = scenarios[scenario]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

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
                                ? key === 'recession' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    key === 'inflation' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                        key === 'stagflation' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            key === 'growth' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                'bg-white/10 text-white border border-white/20'
                                : 'text-white/50 hover:text-white bg-black/30 border border-white/10'
                                }`}
                        >
                            {info.name}
                        </button>
                    ))}
                </motion.div>

                {/* Info panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-xs"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-yellow-400">{currentScenario.name}</span>
                        <button
                            onClick={() => { setShowDemo(true); setDemoStep(0) }}
                            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            Learn
                        </button>
                    </div>
                    <p className="text-xs text-white/60 mb-3 leading-relaxed">{currentScenario.description}</p>
                    <div className="border-t border-white/10 pt-2">
                        <div className="text-xs text-white/40 mb-1">Policy Response:</div>
                        <div className="text-xs text-green-400">{currentScenario.policy}</div>
                    </div>
                </motion.div>

                {/* Shift indicators */}
                <div className="absolute bottom-24 right-4 text-xs text-white/40 text-right">
                    <div>AD shifts from: spending, taxes, confidence</div>
                    <div>SRAS shifts from: input costs, productivity</div>
                </div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showLRAS}
                                onChange={e => setShowLRAS(e.target.checked)}
                                className="accent-yellow-400"
                            />
                            Show LRAS
                        </label>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <span className="text-red-400 text-sm font-medium">AD</span>
                            <input
                                type="range"
                                min={-0.8}
                                max={0.8}
                                step={0.05}
                                value={adShift}
                                onChange={e => { setAdShift(+e.target.value); setScenario('neutral') }}
                                className="w-28 accent-red-400"
                            />
                            <span className={`text-xs font-mono w-8 ${adShift > 0 ? 'text-green-400' : adShift < 0 ? 'text-red-400' : 'text-white/40'}`}>
                                {adShift > 0 ? '→' : adShift < 0 ? '←' : '—'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-green-400 text-sm font-medium">SRAS</span>
                            <input
                                type="range"
                                min={-0.8}
                                max={0.8}
                                step={0.05}
                                value={srasShift}
                                onChange={e => { setSrasShift(+e.target.value); setScenario('neutral') }}
                                className="w-28 accent-green-400"
                            />
                            <span className={`text-xs font-mono w-8 ${srasShift > 0 ? 'text-green-400' : srasShift < 0 ? 'text-red-400' : 'text-white/40'}`}>
                                {srasShift > 0 ? '→' : srasShift < 0 ? '←' : '—'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => applyScenario('neutral')}
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
