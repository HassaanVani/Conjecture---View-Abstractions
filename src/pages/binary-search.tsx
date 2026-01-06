import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { generateSortedArray, binarySearch } from '@/lib/utils'

interface SearchStep {
    left: number
    right: number
    mid: number
    found: boolean
}

export default function BinarySearch() {
    const [arraySize, setArraySize] = useState(15)
    const [array, setArray] = useState<number[]>([])
    const [target, setTarget] = useState(0)
    const [steps, setSteps] = useState<SearchStep[]>([])
    const [currentStep, setCurrentStep] = useState(-1)
    const [resultIndex, setResultIndex] = useState<number | null>(null)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [speed, setSpeed] = useState(600)
    const pauseRef = useRef(false)

    useEffect(() => { pauseRef.current = isPaused }, [isPaused])

    const generateArray = useCallback(() => {
        const arr = generateSortedArray(arraySize, 99)
        setArray(arr)
        setTarget(arr[Math.floor(Math.random() * arr.length)])
        setSteps([])
        setCurrentStep(-1)
        setResultIndex(null)
    }, [arraySize])

    useEffect(() => { generateArray() }, [generateArray])

    const start = useCallback(() => {
        const { steps: s, index } = binarySearch(array, target)
        setSteps(s)
        setResultIndex(index)
        setCurrentStep(0)
        setIsAnimating(true)
        setIsPaused(false)
    }, [array, target])

    useEffect(() => {
        if (!isAnimating || isPaused || currentStep >= steps.length) {
            if (currentStep >= steps.length && steps.length > 0) setIsAnimating(false)
            return
        }
        const timer = setTimeout(() => setCurrentStep(prev => prev + 1), speed)
        return () => clearTimeout(timer)
    }, [isAnimating, isPaused, currentStep, steps.length, speed])

    const reset = () => {
        setSteps([]); setCurrentStep(-1); setResultIndex(null)
        setIsAnimating(false); setIsPaused(false)
    }
    const togglePause = () => setIsPaused(!isPaused)

    const getState = (i: number) => {
        if (currentStep < 0) return 'idle'
        const step = steps[Math.min(currentStep, steps.length - 1)]
        if (!step) return 'idle'
        if (!isAnimating && resultIndex === i) return 'found'
        if (step.mid === i) return 'mid'
        if (i >= step.left && i <= step.right) return 'active'
        return 'eliminated'
    }

    const step = steps[Math.min(currentStep, steps.length - 1)]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
                <div className="text-center">
                    <p className="text-text-dim mb-2">Target</p>
                    <p className="text-4xl font-mono text-accent-coral">{target}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 max-w-5xl">
                    {array.map((value, i) => {
                        const state = getState(i)
                        return (
                            <motion.div
                                key={i}
                                animate={{
                                    opacity: state === 'eliminated' ? 0.25 : 1,
                                    scale: state === 'mid' || state === 'found' ? 1.15 : 1,
                                    y: state === 'found' ? -8 : 0,
                                }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className={`w-12 h-16 rounded-lg flex flex-col items-center justify-center font-mono transition-colors ${state === 'idle' ? 'bg-node text-text-muted' :
                                        state === 'active' ? 'bg-node text-text border border-white/20' :
                                            state === 'mid' ? 'bg-accent-coral/20 text-accent-coral border border-accent-coral' :
                                                state === 'found' ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal' :
                                                    'bg-node/50 text-text-dim'
                                    }`}
                            >
                                <span className="text-lg">{value}</span>
                                <span className="text-[10px] text-text-dim">{i}</span>
                            </motion.div>
                        )
                    })}
                </div>

                {step && isAnimating && (
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <p className="font-mono text-text-muted">
                            <span className="text-accent-coral">{array[step.mid]}</span>
                            <span className="mx-2">{array[step.mid] === target ? '=' : array[step.mid] < target ? '<' : '>'}</span>
                            <span className="text-accent-coral">{target}</span>
                        </p>
                        <p className="text-text-dim text-sm mt-1">
                            {array[step.mid] === target ? 'Found!' : array[step.mid] < target ? 'Search right half' : 'Search left half'}
                        </p>
                    </motion.div>
                )}

                {!isAnimating && resultIndex !== null && currentStep >= steps.length && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent-teal">
                        Found at index {resultIndex} in {steps.length} steps
                    </motion.p>
                )}

                {!isAnimating && currentStep >= steps.length && resultIndex === null && steps.length > 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent-coral">
                        Not found in array
                    </motion.p>
                )}
            </div>

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            value={target}
                            onChange={e => setTarget(+e.target.value)}
                            className="control-input w-20 text-center"
                            disabled={isAnimating}
                        />
                        <button onClick={start} disabled={isAnimating} className="btn-primary disabled:opacity-30">
                            {isAnimating ? 'Searching...' : 'Search'}
                        </button>
                        {isAnimating && (
                            <button onClick={togglePause} className="btn-ghost">
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                        )}
                        <button onClick={generateArray} className="btn-ghost">New Array</button>
                        <button onClick={reset} className="btn-ghost">Reset</button>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Size</span>
                            <input
                                type="range"
                                min={10}
                                max={25}
                                value={arraySize}
                                onChange={e => setArraySize(+e.target.value)}
                                className="w-20 accent-text"
                                disabled={isAnimating}
                            />
                            <span className="text-text-muted text-xs font-mono w-6">{arraySize}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Speed</span>
                            <input
                                type="range"
                                min={200}
                                max={1500}
                                step={100}
                                value={1700 - speed}
                                onChange={e => setSpeed(1700 - parseInt(e.target.value))}
                                className="w-20 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono w-14">{speed}ms</span>
                        </div>

                        {steps.length > 0 && (
                            <div className="text-text-muted text-sm">
                                Step {Math.min(currentStep + 1, steps.length)} / {steps.length}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
