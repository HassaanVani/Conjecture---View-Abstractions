import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

export default function PopulationDynamics() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mode, setMode] = useState<'logistic' | 'predator-prey'>('logistic')
    const [growthRate, setGrowthRate] = useState(0.5)
    const [carryingCapacity, setCarryingCapacity] = useState(1000)
    const [timeScale, setTimeScale] = useState(1)

    const dataRef = useRef<{
        logistic: number[]
        prey: number[]
        predator: number[]
        time: number
    }>({
        logistic: [100],
        prey: [100],
        predator: [20],
        time: 0,
    })

    const reset = useCallback(() => {
        dataRef.current = {
            logistic: [100],
            prey: [100],
            predator: [20],
            time: 0,
        }
        setIsRunning(false)
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

        let animId: number
        const dt = 0.1

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight
            const graphPadding = 60
            const graphWidth = width - graphPadding * 2
            const graphHeight = height - graphPadding * 2

            ctx.fillStyle = '#0a1a12'
            ctx.fillRect(0, 0, width, height)

            if (isRunning) {
                const data = dataRef.current

                if (mode === 'logistic') {
                    // Logistic growth: dN/dt = rN(1 - N/K)
                    const N = data.logistic[data.logistic.length - 1]
                    const dN = growthRate * N * (1 - N / carryingCapacity) * dt * timeScale
                    const newN = Math.max(0, N + dN)
                    data.logistic.push(newN)
                    if (data.logistic.length > 500) data.logistic.shift()
                } else {
                    // Lotka-Volterra predator-prey
                    const prey = data.prey[data.prey.length - 1]
                    const predator = data.predator[data.predator.length - 1]

                    const alpha = 0.1  // prey growth rate
                    const beta = 0.002 // predation rate
                    const gamma = 0.1  // predator death rate
                    const delta = 0.001 // predator growth from eating

                    const dPrey = (alpha * prey - beta * prey * predator) * dt * timeScale
                    const dPredator = (delta * prey * predator - gamma * predator) * dt * timeScale

                    data.prey.push(Math.max(1, prey + dPrey))
                    data.predator.push(Math.max(1, predator + dPredator))

                    if (data.prey.length > 500) data.prey.shift()
                    if (data.predator.length > 500) data.predator.shift()
                }

                data.time += dt * timeScale
            }

            // Draw axes
            ctx.strokeStyle = 'rgba(80, 200, 120, 0.3)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(graphPadding, graphPadding)
            ctx.lineTo(graphPadding, height - graphPadding)
            ctx.lineTo(width - graphPadding, height - graphPadding)
            ctx.stroke()

            // Axis labels
            ctx.fillStyle = 'rgba(80, 200, 120, 0.5)'
            ctx.font = '12px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('Time', width / 2, height - 20)

            ctx.save()
            ctx.translate(20, height / 2)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Population', 0, 0)
            ctx.restore()

            // Draw data
            const data = dataRef.current

            if (mode === 'logistic') {
                // Draw carrying capacity line
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)'
                ctx.setLineDash([5, 5])
                ctx.beginPath()
                const kY = height - graphPadding - (carryingCapacity / carryingCapacity) * graphHeight * 0.9
                ctx.moveTo(graphPadding, kY)
                ctx.lineTo(width - graphPadding, kY)
                ctx.stroke()
                ctx.setLineDash([])

                ctx.fillStyle = 'rgba(255, 200, 100, 0.5)'
                ctx.font = '11px sans-serif'
                ctx.textAlign = 'left'
                ctx.fillText(`K = ${carryingCapacity}`, width - graphPadding + 10, kY + 4)

                // Draw population curve
                ctx.strokeStyle = 'rgba(80, 200, 120, 0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                data.logistic.forEach((val, i) => {
                    const x = graphPadding + (i / data.logistic.length) * graphWidth
                    const y = height - graphPadding - (val / carryingCapacity) * graphHeight * 0.9
                    if (i === 0) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                })
                ctx.stroke()

                // Current value
                if (data.logistic.length > 0) {
                    const current = data.logistic[data.logistic.length - 1]
                    ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'
                    ctx.font = '14px monospace'
                    ctx.textAlign = 'left'
                    ctx.fillText(`N = ${Math.round(current)}`, graphPadding + 10, graphPadding + 20)
                }
            } else {
                const maxVal = Math.max(...data.prey, ...data.predator) * 1.2

                // Draw prey curve
                ctx.strokeStyle = 'rgba(80, 200, 120, 0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                data.prey.forEach((val, i) => {
                    const x = graphPadding + (i / data.prey.length) * graphWidth
                    const y = height - graphPadding - (val / maxVal) * graphHeight
                    if (i === 0) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                })
                ctx.stroke()

                // Draw predator curve
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)'
                ctx.beginPath()
                data.predator.forEach((val, i) => {
                    const x = graphPadding + (i / data.predator.length) * graphWidth
                    const y = height - graphPadding - (val / maxVal) * graphHeight
                    if (i === 0) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                })
                ctx.stroke()

                // Legend
                ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'
                ctx.fillRect(graphPadding + 10, graphPadding + 10, 12, 12)
                ctx.fillText('Prey', graphPadding + 28, graphPadding + 20)

                ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                ctx.fillRect(graphPadding + 10, graphPadding + 30, 12, 12)
                ctx.fillText('Predator', graphPadding + 28, graphPadding + 40)
            }

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [isRunning, mode, growthRate, carryingCapacity, timeScale])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex gap-2"
                >
                    <button
                        onClick={() => { setMode('logistic'); reset() }}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${mode === 'logistic'
                                ? 'bg-white/10 text-white'
                                : 'text-text-muted hover:text-white'
                            }`}
                    >
                        Logistic Growth
                    </button>
                    <button
                        onClick={() => { setMode('predator-prey'); reset() }}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${mode === 'predator-prey'
                                ? 'bg-white/10 text-white'
                                : 'text-text-muted hover:text-white'
                            }`}
                    >
                        Predator-Prey
                    </button>
                </motion.div>

                <div className="absolute top-4 right-4 text-xs text-text-dim max-w-xs text-right">
                    {mode === 'logistic'
                        ? 'dN/dt = rN(1 - N/K) — population approaches carrying capacity'
                        : 'Lotka-Volterra model — oscillating predator-prey dynamics'
                    }
                </div>
            </div>

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className="btn-primary"
                        >
                            {isRunning ? 'Pause' : 'Start'}
                        </button>
                        <button onClick={reset} className="btn-ghost">
                            Reset
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        {mode === 'logistic' && (
                            <>
                                <div className="flex items-center gap-3">
                                    <span className="text-text-dim text-sm">r</span>
                                    <input
                                        type="range"
                                        min={0.1}
                                        max={1}
                                        step={0.1}
                                        value={growthRate}
                                        onChange={e => setGrowthRate(+e.target.value)}
                                        className="w-20 accent-text"
                                    />
                                    <span className="text-text-muted text-xs font-mono">{growthRate.toFixed(1)}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-text-dim text-sm">K</span>
                                    <input
                                        type="range"
                                        min={500}
                                        max={2000}
                                        step={100}
                                        value={carryingCapacity}
                                        onChange={e => setCarryingCapacity(+e.target.value)}
                                        className="w-20 accent-text"
                                    />
                                    <span className="text-text-muted text-xs font-mono">{carryingCapacity}</span>
                                </div>
                            </>
                        )}

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Speed</span>
                            <input
                                type="range"
                                min={0.5}
                                max={3}
                                step={0.5}
                                value={timeScale}
                                onChange={e => setTimeScale(+e.target.value)}
                                className="w-20 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono">{timeScale}x</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
