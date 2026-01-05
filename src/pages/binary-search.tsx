import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ControlPanel, ControlGroup, NumberInput, Button, VisualizationContainer, Slider } from '@/components/control-panel'
import { generateSortedArray, binarySearch, cn } from '@/lib/utils'

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
    const [speed, setSpeed] = useState(600)

    const generateArray = useCallback(() => {
        const newArray = generateSortedArray(arraySize, 99)
        setArray(newArray)
        setTarget(newArray[Math.floor(Math.random() * newArray.length)])
        setSteps([])
        setCurrentStep(-1)
        setResultIndex(null)
    }, [arraySize])

    useEffect(() => {
        generateArray()
    }, [generateArray])

    const startSearch = useCallback(() => {
        const { steps: searchSteps, index } = binarySearch(array, target)
        setSteps(searchSteps)
        setResultIndex(index)
        setCurrentStep(0)
        setIsAnimating(true)
    }, [array, target])

    useEffect(() => {
        if (!isAnimating || currentStep >= steps.length) {
            if (currentStep >= steps.length && steps.length > 0) setIsAnimating(false)
            return
        }

        const timer = setTimeout(() => {
            setCurrentStep(prev => prev + 1)
        }, speed)

        return () => clearTimeout(timer)
    }, [isAnimating, currentStep, steps.length, speed])

    const reset = () => {
        setSteps([])
        setCurrentStep(-1)
        setResultIndex(null)
        setIsAnimating(false)
    }

    const getElementState = (index: number) => {
        if (currentStep < 0) return 'idle'

        const step = steps[Math.min(currentStep, steps.length - 1)]
        if (!step) return 'idle'

        if (!isAnimating && resultIndex === index) return 'found'
        if (currentStep >= steps.length && resultIndex === null) return 'idle'

        if (step.mid === index) return 'mid'
        if (index >= step.left && index <= step.right) return 'active'
        return 'eliminated'
    }

    const currentStepData = steps[Math.min(currentStep, steps.length - 1)]

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gradient">Binary Search</h1>
                <p className="text-text-secondary">
                    Watch the power of divide and conquer in action. Each step eliminates half
                    the remaining elements, achieving O(log n) efficiency.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <ControlPanel className="lg:col-span-1">
                    <Slider
                        value={arraySize}
                        onChange={v => { setArraySize(v); }}
                        min={10}
                        max={25}
                        label="Array Size"
                    />

                    <ControlGroup label="Target Value">
                        <NumberInput
                            value={target}
                            onChange={setTarget}
                            min={1}
                            max={99}
                        />
                    </ControlGroup>

                    <Slider
                        value={speed}
                        onChange={setSpeed}
                        min={200}
                        max={1200}
                        label="Animation Speed (ms)"
                    />

                    <div className="flex gap-2 pt-2">
                        <Button onClick={startSearch} disabled={isAnimating} className="flex-1">
                            {isAnimating ? 'Searching...' : 'Search'}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={generateArray} variant="secondary" className="flex-1">
                            New Array
                        </Button>
                        <Button onClick={reset} variant="secondary" className="flex-1">
                            Reset
                        </Button>
                    </div>

                    {currentStep >= 0 && (
                        <div className="pt-4 border-t border-border space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Step</span>
                                <span className="font-mono text-text-primary">{Math.min(currentStep + 1, steps.length)} / {steps.length}</span>
                            </div>

                            {currentStepData && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">Range</span>
                                        <span className="font-mono text-text-primary">[{currentStepData.left}, {currentStepData.right}]</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">Mid Index</span>
                                        <span className="font-mono text-accent-purple">{currentStepData.mid}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">Mid Value</span>
                                        <span className="font-mono text-accent-purple">{array[currentStepData.mid]}</span>
                                    </div>
                                </>
                            )}

                            {!isAnimating && resultIndex !== null && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center pt-2"
                                >
                                    <span className="text-accent-teal">✓ Found at index {resultIndex}</span>
                                </motion.div>
                            )}

                            {!isAnimating && currentStep >= steps.length && resultIndex === null && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center pt-2"
                                >
                                    <span className="text-accent-orange">✗ Not found in array</span>
                                </motion.div>
                            )}
                        </div>
                    )}
                </ControlPanel>

                <VisualizationContainer className="lg:col-span-3">
                    <div className="mb-6 text-center">
                        <span className="text-text-secondary">Searching for: </span>
                        <span className="text-2xl font-bold text-accent-gold font-mono">{target}</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        <AnimatePresence>
                            {array.map((value, index) => {
                                const state = getElementState(index)

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{
                                            opacity: state === 'eliminated' ? 0.3 : 1,
                                            scale: state === 'mid' || state === 'found' ? 1.15 : 1,
                                            y: state === 'found' ? -10 : 0,
                                        }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        className={cn(
                                            'w-12 h-16 rounded-lg flex flex-col items-center justify-center font-mono transition-colors duration-200',
                                            state === 'idle' && 'bg-bg-tertiary text-text-secondary',
                                            state === 'active' && 'bg-accent-blue/20 text-accent-blue border border-accent-blue/50',
                                            state === 'mid' && 'bg-accent-purple/30 text-accent-purple border-2 border-accent-purple',
                                            state === 'eliminated' && 'bg-bg-tertiary/50 text-text-muted',
                                            state === 'found' && 'bg-accent-teal/30 text-accent-teal border-2 border-accent-teal glow-blue',
                                        )}
                                    >
                                        <span className="text-lg font-bold">{value}</span>
                                        <span className="text-[10px] opacity-60">[{index}]</span>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>

                    {currentStepData && isAnimating && (
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center glass rounded-lg p-4 max-w-md mx-auto"
                        >
                            <div className="text-sm text-text-secondary mb-2">
                                Checking middle element at index {currentStepData.mid}
                            </div>
                            <div className="font-mono">
                                <span className="text-accent-purple">{array[currentStepData.mid]}</span>
                                <span className="text-text-muted mx-2">
                                    {array[currentStepData.mid] === target ? '=' : array[currentStepData.mid] < target ? '<' : '>'}
                                </span>
                                <span className="text-accent-gold">{target}</span>
                            </div>
                            <div className="text-xs text-text-secondary mt-2">
                                {array[currentStepData.mid] === target
                                    ? 'Found!'
                                    : array[currentStepData.mid] < target
                                        ? 'Target is larger, search right half'
                                        : 'Target is smaller, search left half'
                                }
                            </div>
                        </motion.div>
                    )}

                    {steps.length === 0 && (
                        <div className="text-center text-text-muted">
                            Click Search to find the target value
                        </div>
                    )}

                    {!isAnimating && steps.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center mt-4"
                        >
                            <span className="text-text-secondary text-sm">
                                Completed in {steps.length} steps (worst case: {Math.ceil(Math.log2(array.length))} steps)
                            </span>
                        </motion.div>
                    )}
                </VisualizationContainer>
            </div>

            <div className="glass rounded-xl p-4">
                <div className="flex gap-6 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-blue" />
                        <span className="text-text-secondary">Search Range</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-purple" />
                        <span className="text-text-secondary">Mid Element</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-text-muted/30" />
                        <span className="text-text-secondary">Eliminated</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-teal" />
                        <span className="text-text-secondary">Found</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
