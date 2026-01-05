import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ControlPanel, ControlGroup, NumberInput, Button, VisualizationContainer, Slider } from '@/components/control-panel'
import { gcd, cn } from '@/lib/utils'

interface Step {
    a: number
    b: number
    q: number
    r: number
}

export default function Euclidean() {
    const [numA, setNumA] = useState(48)
    const [numB, setNumB] = useState(18)
    const [steps, setSteps] = useState<Step[]>([])
    const [result, setResult] = useState<number | null>(null)
    const [visibleCount, setVisibleCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [speed, setSpeed] = useState(800)

    const startVisualization = useCallback(() => {
        const { steps: newSteps, result: gcdResult } = gcd(numA, numB)
        setSteps(newSteps)
        setResult(gcdResult)
        setVisibleCount(0)
        setIsAnimating(true)
    }, [numA, numB])

    useEffect(() => {
        if (!isAnimating || visibleCount >= steps.length) {
            if (visibleCount >= steps.length && steps.length > 0) setIsAnimating(false)
            return
        }

        const timer = setTimeout(() => {
            setVisibleCount(prev => prev + 1)
        }, speed)

        return () => clearTimeout(timer)
    }, [isAnimating, visibleCount, steps.length, speed])

    const reset = () => {
        setSteps([])
        setResult(null)
        setVisibleCount(0)
        setIsAnimating(false)
    }

    const maxDimension = Math.max(numA, numB)

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gradient">Euclidean Algorithm</h1>
                <p className="text-text-secondary">
                    Find the greatest common divisor of two numbers through repeated division.
                    Watch as rectangles subdivide until we reach the GCD.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <ControlPanel className="lg:col-span-1">
                    <ControlGroup label="First Number (a)">
                        <NumberInput
                            value={numA}
                            onChange={setNumA}
                            min={1}
                            max={1000}
                        />
                    </ControlGroup>

                    <ControlGroup label="Second Number (b)">
                        <NumberInput
                            value={numB}
                            onChange={setNumB}
                            min={1}
                            max={1000}
                        />
                    </ControlGroup>

                    <Slider
                        value={speed}
                        onChange={setSpeed}
                        min={200}
                        max={1500}
                        label="Animation Speed (ms)"
                    />

                    <div className="flex gap-2 pt-2">
                        <Button onClick={startVisualization} disabled={isAnimating} className="flex-1">
                            {isAnimating ? 'Running...' : 'Calculate'}
                        </Button>
                        <Button onClick={reset} variant="secondary" className="flex-1">
                            Reset
                        </Button>
                    </div>

                    {result !== null && !isAnimating && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="pt-4 border-t border-border text-center"
                        >
                            <div className="text-text-secondary text-sm mb-1">GCD({numA}, {numB})</div>
                            <div className="text-4xl font-bold text-accent-teal">{result}</div>
                        </motion.div>
                    )}
                </ControlPanel>

                <VisualizationContainer className="lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text-primary">Algorithm Steps</h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                <AnimatePresence>
                                    {steps.slice(0, visibleCount).map((step, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.3 }}
                                            className={cn(
                                                'glass rounded-lg p-4',
                                                index === visibleCount - 1 && 'ring-2 ring-accent-blue'
                                            )}
                                        >
                                            <div className="font-mono text-sm mb-2">
                                                <span className="text-accent-gold">{step.a}</span>
                                                <span className="text-text-muted"> = </span>
                                                <span className="text-accent-purple">{step.b}</span>
                                                <span className="text-text-muted"> × </span>
                                                <span className="text-text-primary">{step.q}</span>
                                                <span className="text-text-muted"> + </span>
                                                <span className={cn(
                                                    step.r === 0 ? 'text-accent-teal font-bold' : 'text-accent-orange'
                                                )}>{step.r}</span>
                                            </div>
                                            <div className="text-xs text-text-secondary">
                                                {step.r === 0
                                                    ? `Remainder is 0! GCD = ${step.b}`
                                                    : `Remainder ${step.r} becomes new divisor`
                                                }
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text-primary">Rectangle Visualization</h3>
                            <div className="relative h-[300px] flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    {visibleCount > 0 && (
                                        <motion.div
                                            key={visibleCount}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="relative"
                                            style={{
                                                width: `${(steps[visibleCount - 1].a / maxDimension) * 280}px`,
                                                height: `${(steps[visibleCount - 1].b / maxDimension) * 280}px`,
                                            }}
                                        >
                                            <div className="absolute inset-0 border-2 border-accent-blue rounded-lg bg-accent-blue/10 flex items-center justify-center">
                                                <span className="font-mono text-accent-blue text-lg">
                                                    {steps[visibleCount - 1].a} × {steps[visibleCount - 1].b}
                                                </span>
                                            </div>

                                            {Array.from({ length: steps[visibleCount - 1].q }).map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="absolute border border-accent-purple/50 bg-accent-purple/20 rounded"
                                                    style={{
                                                        width: `${(steps[visibleCount - 1].b / steps[visibleCount - 1].a) * 100}%`,
                                                        height: '100%',
                                                        left: `${i * (steps[visibleCount - 1].b / steps[visibleCount - 1].a) * 100}%`,
                                                    }}
                                                />
                                            ))}

                                            {steps[visibleCount - 1].r > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="absolute border-2 border-accent-orange bg-accent-orange/20 rounded right-0 top-0 h-full flex items-center justify-center"
                                                    style={{
                                                        width: `${(steps[visibleCount - 1].r / steps[visibleCount - 1].a) * 100}%`,
                                                    }}
                                                >
                                                    <span className="font-mono text-accent-orange text-xs">
                                                        r={steps[visibleCount - 1].r}
                                                    </span>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {steps.length === 0 && (
                                    <div className="text-text-muted text-center">
                                        Enter two numbers and click Calculate
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </VisualizationContainer>
            </div>

            <div className="glass rounded-xl p-4">
                <div className="flex gap-6 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-gold" />
                        <span className="text-text-secondary">Dividend (a)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-purple" />
                        <span className="text-text-secondary">Divisor (b)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-orange" />
                        <span className="text-text-secondary">Remainder (r)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-teal" />
                        <span className="text-text-secondary">GCD Found</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
