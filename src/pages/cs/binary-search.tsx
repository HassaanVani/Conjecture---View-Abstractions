import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { generateSortedArray, binarySearch } from '@/lib/utils'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CS_COLOR = 'rgb(34, 211, 238)'

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
    const [showLinear, setShowLinear] = useState(false)
    const [linearStep, setLinearStep] = useState(-1)
    const [linearDone, setLinearDone] = useState(false)
    const pauseRef = useRef(false)

    useEffect(() => { pauseRef.current = isPaused }, [isPaused])

    const generateArray = useCallback(() => {
        const arr = generateSortedArray(arraySize, 99)
        setArray(arr)
        setTarget(arr[Math.floor(Math.random() * arr.length)])
        setSteps([])
        setCurrentStep(-1)
        setResultIndex(null)
        setLinearStep(-1)
        setLinearDone(false)
    }, [arraySize])

    useEffect(() => { generateArray() }, [generateArray])

    const start = useCallback(() => {
        const { steps: s, index } = binarySearch(array, target)
        setSteps(s)
        setResultIndex(index)
        setCurrentStep(0)
        setIsAnimating(true)
        setIsPaused(false)
        setLinearStep(0)
        setLinearDone(false)
    }, [array, target])

    // Binary search animation
    useEffect(() => {
        if (!isAnimating || isPaused || currentStep >= steps.length) {
            if (currentStep >= steps.length && steps.length > 0) setIsAnimating(false)
            return
        }
        const timer = setTimeout(() => setCurrentStep(prev => prev + 1), speed)
        return () => clearTimeout(timer)
    }, [isAnimating, isPaused, currentStep, steps.length, speed])

    // Linear search animation (runs in parallel)
    useEffect(() => {
        if (!isAnimating || isPaused || linearDone || !showLinear || linearStep < 0) return
        if (array[linearStep] === target) { setLinearDone(true); return }
        if (linearStep >= array.length - 1) { setLinearDone(true); return }
        const timer = setTimeout(() => setLinearStep(prev => prev + 1), speed)
        return () => clearTimeout(timer)
    }, [isAnimating, isPaused, linearStep, linearDone, showLinear, target, array, speed])

    const reset = () => {
        setSteps([]); setCurrentStep(-1); setResultIndex(null)
        setIsAnimating(false); setIsPaused(false)
        setLinearStep(-1); setLinearDone(false)
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

    const getLinearState = (i: number) => {
        if (linearStep < 0 || !showLinear) return 'idle'
        if (linearDone && array[i] === target) return 'found'
        if (i === linearStep) return 'mid'
        if (i < linearStep) return 'eliminated'
        return 'idle'
    }

    const step = steps[Math.min(currentStep, steps.length - 1)]

    // Complexity calculations
    const bestCase = 1
    const worstCase = Math.ceil(Math.log2(arraySize)) + 1
    const avgCase = Math.ceil(Math.log2(arraySize))
    const linearWorst = arraySize

    const demoSteps: DemoStep[] = [
        { title: 'Binary Search', description: 'Binary search finds a target in a sorted array by repeatedly halving the search space. It is much faster than checking each element.', setup: () => { setArraySize(15); setShowLinear(false) } },
        { title: 'How It Works', description: 'Compare the target to the middle element. If target < mid, search the left half. If target > mid, search the right half.', setup: () => { setArraySize(15); setShowLinear(false) } },
        { title: 'Best Case: O(1)', description: 'If the target is exactly the middle element, we find it in one comparison. This is the best case scenario.', setup: () => { setArraySize(15); setShowLinear(false) } },
        { title: 'Worst Case: O(log n)', description: `For an array of ${arraySize} elements, the worst case is ${worstCase} comparisons (log2(${arraySize}) + 1). Each step halves the remaining elements.`, setup: () => { setArraySize(15) } },
        { title: 'vs Linear Search', description: 'Linear search checks each element one by one: O(n) worst case. For 15 elements, that is up to 15 checks vs 4 for binary search.', highlight: 'Enable "Show Linear" to compare side by side.', setup: () => { setShowLinear(true); setArraySize(15) } },
        { title: 'Logarithmic Growth', description: 'Doubling the array size adds only ONE more step. 1000 elements? Only ~10 steps. 1 million? Only ~20. This is the power of O(log n).', setup: () => { setArraySize(25); setShowLinear(true) } },
        { title: 'Precondition: Sorted', description: 'Binary search REQUIRES a sorted array. On unsorted data, you must sort first (O(n log n)) or use linear search.', setup: () => { setArraySize(15); setShowLinear(false) } },
        { title: 'Try It Yourself', description: 'Enter a custom target, adjust array size, and watch the algorithm narrow down. Count the comparisons!', setup: () => { setArraySize(20); setShowLinear(true) } },
    ]

    const demo = useDemoMode(demoSteps)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1a1a]">
            <div className="flex-1 relative flex">
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                    <div className="text-center">
                        <p className="text-text-dim mb-1 text-sm">Target</p>
                        <p className="text-4xl font-mono text-accent-coral">{target}</p>
                    </div>

                    {/* Binary Search row */}
                    <div>
                        <p className="text-xs text-white/40 mb-2 text-center font-medium">Binary Search</p>
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
                                        className={`w-12 h-16 rounded-lg flex flex-col items-center justify-center font-mono transition-colors ${
                                            state === 'idle' ? 'bg-node text-text-muted' :
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
                    </div>

                    {/* Linear Search row */}
                    {showLinear && (
                        <div>
                            <p className="text-xs text-white/40 mb-2 text-center font-medium">Linear Search</p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-5xl">
                                {array.map((value, i) => {
                                    const lState = getLinearState(i)
                                    return (
                                        <motion.div
                                            key={i}
                                            animate={{
                                                opacity: lState === 'eliminated' ? 0.25 : 1,
                                                scale: lState === 'found' ? 1.15 : lState === 'mid' ? 1.1 : 1,
                                                y: lState === 'found' ? -8 : 0,
                                            }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                            className={`w-12 h-16 rounded-lg flex flex-col items-center justify-center font-mono transition-colors ${
                                                lState === 'idle' ? 'bg-node text-text-muted' :
                                                lState === 'mid' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400' :
                                                lState === 'found' ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal' :
                                                'bg-node/50 text-text-dim'
                                            }`}
                                        >
                                            <span className="text-lg">{value}</span>
                                            <span className="text-[10px] text-text-dim">{i}</span>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

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
                            {showLinear && ` (linear: ${linearStep + 1} steps)`}
                        </motion.p>
                    )}

                    {!isAnimating && currentStep >= steps.length && resultIndex === null && steps.length > 0 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent-coral">
                            Not found in array
                        </motion.p>
                    )}

                    {/* Complexity annotations */}
                    <div className="absolute top-4 left-4 space-y-3 w-64">
                        <APTag course="CS A" unit="Unit 7" color={CS_COLOR} />
                        <EquationDisplay
                            departmentColor={CS_COLOR}
                            title="Complexity"
                            equations={[
                                { label: 'Best', expression: 'O(1)', description: 'Target at midpoint' },
                                { label: 'Average', expression: 'O(log n)', description: `~ ${avgCase} comparisons` },
                                { label: 'Worst', expression: 'O(log n)', description: `<= ${worstCase} comparisons` },
                                ...(showLinear ? [{ label: 'Linear', expression: 'O(n)', description: `Up to ${linearWorst} comparisons` }] : []),
                            ]}
                        />
                    </div>
                </div>

                <div className="w-60 bg-[#0a1a1a]/90 border-l border-white/10 p-4 flex flex-col gap-3 overflow-y-auto z-20">
                    <ControlPanel>
                        <ControlGroup label="Target Value">
                            <input
                                type="number"
                                value={target}
                                onChange={e => setTarget(+e.target.value)}
                                className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/30"
                                disabled={isAnimating}
                            />
                        </ControlGroup>
                        <Slider label={`Array Size: ${arraySize}`} value={arraySize} onChange={setArraySize} min={10} max={25} />
                        <Slider label={`Speed: ${speed}ms`} value={1700 - speed} onChange={v => setSpeed(1700 - v)} min={200} max={1500} step={100} />
                        <Toggle label="Show Linear Search" value={showLinear} onChange={setShowLinear} />
                        <div className="flex gap-2">
                            <Button onClick={start} disabled={isAnimating}>
                                {isAnimating ? 'Searching...' : 'Search'}
                            </Button>
                            {isAnimating && (
                                <Button onClick={togglePause} variant="secondary">
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={generateArray} variant="secondary">New Array</Button>
                            <Button onClick={reset} variant="secondary">Reset</Button>
                        </div>
                        <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
                    </ControlPanel>

                    <InfoPanel
                        title="Search State"
                        departmentColor={CS_COLOR}
                        items={[
                            { label: 'Array Size', value: arraySize },
                            { label: 'Binary Steps', value: steps.length > 0 ? `${Math.min(currentStep + 1, steps.length)} / ${steps.length}` : '--' },
                            ...(showLinear ? [{ label: 'Linear Steps', value: linearStep >= 0 ? `${linearStep + 1}` : '--' }] : []),
                            { label: 'Best Case', value: `${bestCase}`, color: 'rgb(80, 200, 120)' },
                            { label: 'Worst Case', value: `${worstCase}` },
                            { label: 'log2(n)', value: Math.log2(arraySize).toFixed(2) },
                        ]}
                    />
                </div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                <DemoMode
                    steps={demoSteps}
                    currentStep={demo.currentStep}
                    isOpen={demo.isOpen}
                    onClose={demo.close}
                    onNext={demo.next}
                    onPrev={demo.prev}
                    onGoToStep={demo.goToStep}
                    departmentColor={CS_COLOR}
                />
            </div>
        </div>
    )
}
