import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Phase = 'peak' | 'recession' | 'trough' | 'expansion'

interface PhaseInfo {
    name: string
    description: string
    characteristics: string[]
    color: string
    policy: string
}

const phaseInfo: Record<Phase, PhaseInfo> = {
    peak: {
        name: 'Peak',
        description: 'Economy at maximum output. Growth is slowing, inflation rising.',
        characteristics: ['Low unemployment', 'High inflation', 'Interest rates rising', 'Consumer confidence high'],
        color: 'rgba(255, 180, 80, 1)',
        policy: 'Fed may raise rates to cool inflation',
    },
    recession: {
        name: 'Recession',
        description: 'Economy contracting. Two consecutive quarters of negative GDP growth.',
        characteristics: ['Rising unemployment', 'Falling GDP', 'Reduced consumer spending', 'Business failures'],
        color: 'rgba(255, 100, 100, 1)',
        policy: 'Expansionary fiscal/monetary policy',
    },
    trough: {
        name: 'Trough',
        description: 'Economy at lowest point. Conditions for recovery forming.',
        characteristics: ['High unemployment', 'Low inflation/deflation', 'Low interest rates', 'Depressed asset prices'],
        color: 'rgba(100, 150, 255, 1)',
        policy: 'Aggressive stimulus measures',
    },
    expansion: {
        name: 'Expansion',
        description: 'Economy growing. GDP, employment, and incomes rising.',
        characteristics: ['Declining unemployment', 'Moderate inflation', 'Rising consumer spending', 'Business investment up'],
        color: 'rgba(100, 200, 150, 1)',
        policy: 'Monitor for overheating; gradual rate normalization',
    },
}

export default function BusinessCycle() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [currentPhase, setCurrentPhase] = useState<Phase>('expansion')
    const [animationTime, setAnimationTime] = useState(0)
    const [isAnimating, setIsAnimating] = useState(true)
    const [speed, setSpeed] = useState(1)
    const [showIndicators, setShowIndicators] = useState(true)
    const [showDemo, setShowDemo] = useState(false)
    const [demoStep, setDemoStep] = useState(0)

    // GDP growth (percent)
    const getGDPGrowth = useCallback((t: number) => {
        return 3 * Math.sin(t * 0.02) + 2
    }, [])

    // Unemployment rate (inverse of cycle with lag)
    const getUnemployment = useCallback((t: number) => {
        return 5 - 2 * Math.sin((t - 20) * 0.02)
    }, [])

    // Inflation rate (peaks during expansion, lags growth)
    const getInflation = useCallback((t: number) => {
        return 2 + 1.5 * Math.sin((t - 15) * 0.02)
    }, [])

    // Determine phase based on position in cycle
    const determinePhase = useCallback((t: number): Phase => {
        const cyclePos = (t * 0.02) % (2 * Math.PI)
        if (cyclePos < Math.PI / 2) return 'expansion'
        if (cyclePos < Math.PI) return 'peak'
        if (cyclePos < 3 * Math.PI / 2) return 'recession'
        return 'trough'
    }, [])

    // Update phase based on animation
    useEffect(() => {
        setCurrentPhase(determinePhase(animationTime))
    }, [animationTime, determinePhase])

    useEffect(() => {
        if (!isAnimating) return
        const interval = setInterval(() => {
            setAnimationTime(t => t + speed)
        }, 50)
        return () => clearInterval(interval)
    }, [isAnimating, speed])

    const demoSteps = [
        {
            title: 'The Business Cycle',
            description: 'Economies naturally fluctuate through periods of growth and contraction. This cyclical pattern is called the business cycle.',
            action: () => { setIsAnimating(true); setAnimationTime(0) },
        },
        {
            title: 'Expansion Phase',
            description: 'During expansion, GDP grows, unemployment falls, and consumer spending rises. This is the "good times" phase of the cycle.',
            action: () => { setAnimationTime(10); setIsAnimating(false) },
        },
        {
            title: 'Peak',
            description: 'The peak is the highest point of economic activity. Growth slows, inflation pressures build, and the economy is "overheating."',
            action: () => { setAnimationTime(80); setIsAnimating(false) },
        },
        {
            title: 'Recession',
            description: 'A recession is two consecutive quarters of declining GDP. Unemployment rises, spending falls, and businesses struggle.',
            action: () => { setAnimationTime(130); setIsAnimating(false) },
        },
        {
            title: 'Trough',
            description: 'The trough is the lowest point. While painful, it sets the stage for recovery as prices reset and inventories clear.',
            action: () => { setAnimationTime(210); setIsAnimating(false) },
        },
        {
            title: 'Key Indicators',
            description: 'Watch how GDP, unemployment, and inflation move together but with different timing (leads and lags). This helps predict turning points.',
            action: () => { setShowIndicators(true); setIsAnimating(true); setAnimationTime(0) },
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
        const padding = { left: 70, right: 30, top: 40, bottom: 80 }
        const graphWidth = width - padding.left - padding.right
        const graphHeight = height - padding.top - padding.bottom

        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, width, height)

        // Draw graph area
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(padding.left, padding.top)
        ctx.lineTo(padding.left, height - padding.bottom)
        ctx.lineTo(width - padding.right, height - padding.bottom)
        ctx.stroke()

        // Y-axis labels
        ctx.fillStyle = 'rgba(220, 180, 80, 0.6)'
        ctx.font = '11px system-ui'
        ctx.textAlign = 'right'
        ctx.fillText('High', padding.left - 10, padding.top + 20)
        ctx.fillText('Low', padding.left - 10, height - padding.bottom - 10)

        // X-axis label
        ctx.textAlign = 'center'
        ctx.fillText('Time', width / 2, height - 20)

        // Potential GDP line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 4])
        ctx.beginPath()
        const potentialY = padding.top + graphHeight * 0.4
        ctx.moveTo(padding.left, potentialY)
        ctx.lineTo(width - padding.right, potentialY)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.font = '11px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText('Potential GDP (Y*)', padding.left + 10, potentialY - 8)

        // Draw cycle curve
        const cycleLength = 320
        const visibleStart = Math.max(0, animationTime - cycleLength)

        // Phase shading
        for (let t = visibleStart; t < animationTime - 1; t += 1) {
            const phase = determinePhase(t)
            const info = phaseInfo[phase]
            const x = padding.left + ((t - visibleStart) / cycleLength) * graphWidth
            ctx.fillStyle = info.color.replace('1)', '0.05)')
            ctx.fillRect(x, padding.top, 3, graphHeight)
        }

        // GDP curve
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.9)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let t = visibleStart; t <= animationTime; t += 1) {
            const x = padding.left + ((t - visibleStart) / cycleLength) * graphWidth
            const gdp = getGDPGrowth(t)
            const y = padding.top + (1 - (gdp / 10)) * graphHeight

            if (t === visibleStart) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Current point
        const currentX = width - padding.right
        const currentGDP = getGDPGrowth(animationTime)
        const currentY = padding.top + (1 - (currentGDP / 10)) * graphHeight

        const glow = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 20)
        glow.addColorStop(0, phaseInfo[currentPhase].color.replace('1)', '0.5)'))
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(currentX, currentY, 20, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = phaseInfo[currentPhase].color
        ctx.beginPath()
        ctx.arc(currentX, currentY, 8, 0, Math.PI * 2)
        ctx.fill()

        // Indicator curves (smaller, in bottom section)
        if (showIndicators) {
            const indicatorHeight = 50
            const indicatorBase = height - padding.bottom + 25

            // Unemployment (red, inverted)
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let t = visibleStart; t <= animationTime; t += 2) {
                const x = padding.left + ((t - visibleStart) / cycleLength) * graphWidth
                const u = getUnemployment(t)
                const y = indicatorBase - ((u - 3) / 4) * indicatorHeight

                if (t === visibleStart) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            // Inflation (purple)
            ctx.strokeStyle = 'rgba(150, 100, 255, 0.6)'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let t = visibleStart; t <= animationTime; t += 2) {
                const x = padding.left + ((t - visibleStart) / cycleLength) * graphWidth
                const inf = getInflation(t)
                const y = indicatorBase - ((inf) / 5) * indicatorHeight

                if (t === visibleStart) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            // Legend
            ctx.font = '10px system-ui'
            ctx.textAlign = 'left'

            ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
            ctx.fillText('GDP', padding.left + 20, indicatorBase + 20)

            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
            ctx.fillText('Unemployment', padding.left + 60, indicatorBase + 20)

            ctx.fillStyle = 'rgba(150, 100, 255, 0.8)'
            ctx.fillText('Inflation', padding.left + 160, indicatorBase + 20)
        }

        // Phase label with background
        ctx.fillStyle = phaseInfo[currentPhase].color.replace('1)', '0.2)')
        ctx.beginPath()
        ctx.roundRect(width - padding.right - 100, padding.top + 10, 90, 28, 6)
        ctx.fill()

        ctx.fillStyle = phaseInfo[currentPhase].color
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(phaseInfo[currentPhase].name, width - padding.right - 55, padding.top + 29)

        return () => window.removeEventListener('resize', resize)
    }, [animationTime, currentPhase, showIndicators, determinePhase, getGDPGrowth, getUnemployment, getInflation])

    const gdpGrowth = getGDPGrowth(animationTime)
    const unemployment = getUnemployment(animationTime)
    const inflation = getInflation(animationTime)
    const phase = phaseInfo[currentPhase]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Info panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-xs"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium" style={{ color: phase.color }}>
                            {phase.name}
                        </span>
                        <button
                            onClick={() => { setShowDemo(true); setDemoStep(0) }}
                            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            Learn
                        </button>
                    </div>

                    <p className="text-xs text-white/60 mb-3">{phase.description}</p>

                    <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                        <div>
                            <div className="text-white/40">GDP</div>
                            <div className={`font-mono ${gdpGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {gdpGrowth >= 0 ? '+' : ''}{gdpGrowth.toFixed(1)}%
                            </div>
                        </div>
                        <div>
                            <div className="text-white/40">Unemployment</div>
                            <div className="font-mono text-orange-400">{unemployment.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div className="text-white/40">Inflation</div>
                            <div className="font-mono text-purple-400">{inflation.toFixed(1)}%</div>
                        </div>
                    </div>

                    <div className="text-xs text-white/40 border-t border-white/10 pt-2">
                        <div className="text-white/60 mb-1">Policy Response:</div>
                        <div className="text-white/80">{phase.policy}</div>
                    </div>
                </motion.div>

                {/* Phase selector */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex gap-2 flex-wrap"
                >
                    {(Object.keys(phaseInfo) as Phase[]).map(p => (
                        <button
                            key={p}
                            onClick={() => {
                                setIsAnimating(false)
                                const phases: Phase[] = ['expansion', 'peak', 'recession', 'trough']
                                const phaseIndex = phases.indexOf(p)
                                setAnimationTime(10 + phaseIndex * 78)
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${currentPhase === p
                                ? 'border text-white'
                                : 'text-white/50 hover:text-white bg-black/30 border border-white/10'
                                }`}
                            style={{
                                backgroundColor: currentPhase === p ? phaseInfo[p].color.replace('1)', '0.2)') : undefined,
                                borderColor: currentPhase === p ? phaseInfo[p].color : undefined,
                                color: currentPhase === p ? phaseInfo[p].color : undefined,
                            }}
                        >
                            {phaseInfo[p].name}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showIndicators}
                            onChange={e => setShowIndicators(e.target.checked)}
                            className="accent-yellow-400"
                        />
                        Show Indicators
                    </label>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm">Speed</span>
                            <input
                                type="range"
                                min={0.2}
                                max={3}
                                step={0.2}
                                value={speed}
                                onChange={e => setSpeed(+e.target.value)}
                                className="w-24 accent-yellow-400"
                            />
                            <span className="text-yellow-400 text-sm font-mono w-8">{speed}x</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAnimating(!isAnimating)}
                            className="px-4 py-1.5 rounded-lg text-sm bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            {isAnimating ? 'Pause' : 'Play'}
                        </button>
                        <button
                            onClick={() => { setAnimationTime(0); setIsAnimating(true) }}
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
