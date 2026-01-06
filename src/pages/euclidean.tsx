import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { gcd } from '@/lib/utils'

interface Step {
    a: number
    b: number
    q: number
    r: number
}

export default function Euclidean() {
    const [numA, setNumA] = useState('')
    const [numB, setNumB] = useState('')
    const [steps, setSteps] = useState<Step[]>([])
    const [result, setResult] = useState<number | null>(null)
    const [visibleCount, setVisibleCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [speed, setSpeed] = useState(800)
    const pauseRef = useRef(false)

    useEffect(() => { pauseRef.current = isPaused }, [isPaused])

    const start = useCallback(() => {
        const a = parseInt(numA), b = parseInt(numB)
        if (!a || !b || a < 1 || b < 1) return
        const { steps: s, result: r } = gcd(a, b)
        setSteps(s)
        setResult(r)
        setVisibleCount(0)
        setIsAnimating(true)
        setIsPaused(false)
    }, [numA, numB])

    useEffect(() => {
        if (!isAnimating || isPaused || visibleCount >= steps.length) {
            if (visibleCount >= steps.length && steps.length > 0) setIsAnimating(false)
            return
        }
        const timer = setTimeout(() => setVisibleCount(prev => prev + 1), speed)
        return () => clearTimeout(timer)
    }, [isAnimating, isPaused, visibleCount, steps.length, speed])

    const reset = () => {
        setSteps([]); setResult(null); setVisibleCount(0);
        setIsAnimating(false); setIsPaused(false)
    }
    const togglePause = () => setIsPaused(!isPaused)
    const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') start() }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 overflow-auto flex items-center justify-center px-8 py-12">
                <div className="max-w-2xl w-full">
                    {steps.length === 0 ? (
                        <div className="text-center text-text-dim">
                            Enter two numbers to find their Greatest Common Divisor
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {steps.slice(0, visibleCount).map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="font-mono text-2xl md:text-3xl flex items-center gap-3 flex-wrap"
                                >
                                    <span>{step.a}</span>
                                    <span className="text-text-dim">=</span>
                                    <span>{step.b}</span>
                                    <span className="text-text-dim">×</span>
                                    <span className="text-text-muted">{step.q}</span>
                                    <span className="text-text-dim">+</span>
                                    <span className={step.r === 0 ? 'text-accent-teal font-bold' : 'text-accent-coral'}>
                                        {step.r}
                                    </span>
                                </motion.div>
                            ))}

                            {!isAnimating && result !== null && visibleCount >= steps.length && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-12 pt-8 border-t border-border text-center"
                                >
                                    <p className="text-text-muted mb-2">Greatest Common Divisor</p>
                                    <p className="text-6xl font-mono text-accent-teal">{result}</p>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            value={numA}
                            onChange={e => setNumA(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="a"
                            className="control-input w-24 text-center"
                            disabled={isAnimating}
                        />
                        <span className="text-text-dim">and</span>
                        <input
                            type="number"
                            value={numB}
                            onChange={e => setNumB(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="b"
                            className="control-input w-24 text-center"
                            disabled={isAnimating}
                        />
                        <button onClick={start} disabled={isAnimating || !numA || !numB} className="btn-primary disabled:opacity-30">
                            Calculate
                        </button>
                        {isAnimating && (
                            <button onClick={togglePause} className="btn-ghost">
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                        )}
                        {steps.length > 0 && <button onClick={reset} className="btn-ghost">Reset</button>}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Speed</span>
                            <input
                                type="range"
                                min={200}
                                max={2000}
                                step={100}
                                value={2200 - speed}
                                onChange={e => setSpeed(2200 - parseInt(e.target.value))}
                                className="w-24 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono w-14">{speed}ms</span>
                        </div>

                        {steps.length > 0 && (
                            <div className="text-text-muted text-sm">
                                Step {visibleCount} / {steps.length}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
