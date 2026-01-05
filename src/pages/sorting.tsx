import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { ControlPanel, ControlGroup, Button, VisualizationContainer, Slider } from '@/components/control-panel'
import { generateRandomArray, cn } from '@/lib/utils'

type AlgorithmType = 'bubble' | 'merge' | 'quick'

interface SortingState {
    array: number[]
    comparing: number[]
    swapping: number[]
    sorted: number[]
    comparisons: number
    swaps: number
}

interface AlgorithmVisualization {
    type: AlgorithmType
    state: SortingState
    done: boolean
}

export default function Sorting() {
    const [arraySize, setArraySize] = useState(20)
    const [speed, setSpeed] = useState(50)
    const [isRunning, setIsRunning] = useState(false)
    const [algorithms, setAlgorithms] = useState<AlgorithmVisualization[]>([])
    const stopRef = useRef(false)

    const initializeArrays = useCallback(() => {
        const baseArray = generateRandomArray(arraySize)
        setAlgorithms([
            { type: 'bubble', state: { array: [...baseArray], comparing: [], swapping: [], sorted: [], comparisons: 0, swaps: 0 }, done: false },
            { type: 'merge', state: { array: [...baseArray], comparing: [], swapping: [], sorted: [], comparisons: 0, swaps: 0 }, done: false },
            { type: 'quick', state: { array: [...baseArray], comparing: [], swapping: [], sorted: [], comparisons: 0, swaps: 0 }, done: false },
        ])
    }, [arraySize])

    useEffect(() => {
        initializeArrays()
    }, [initializeArrays])

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    const updateState = (type: AlgorithmType, updates: Partial<SortingState>) => {
        setAlgorithms(prev => prev.map(alg =>
            alg.type === type ? { ...alg, state: { ...alg.state, ...updates } } : alg
        ))
    }

    const markDone = (type: AlgorithmType) => {
        setAlgorithms(prev => prev.map(alg =>
            alg.type === type ? { ...alg, done: true, state: { ...alg.state, comparing: [], swapping: [], sorted: Array.from({ length: alg.state.array.length }, (_, i) => i) } } : alg
        ))
    }

    const bubbleSort = async (arr: number[]) => {
        const array = [...arr]
        let comparisons = 0
        let swaps = 0

        for (let i = 0; i < array.length - 1; i++) {
            for (let j = 0; j < array.length - i - 1; j++) {
                if (stopRef.current) return
                updateState('bubble', { comparing: [j, j + 1], comparisons: ++comparisons })
                await delay(speed)

                if (array[j] > array[j + 1]) {
                    [array[j], array[j + 1]] = [array[j + 1], array[j]]
                    updateState('bubble', { array: [...array], swapping: [j, j + 1], swaps: ++swaps })
                    await delay(speed)
                }
                updateState('bubble', { swapping: [] })
            }
            updateState('bubble', { sorted: Array.from({ length: i + 1 }, (_, k) => array.length - 1 - k) })
        }
        markDone('bubble')
    }

    const mergeSort = async (arr: number[]) => {
        const array = [...arr]
        let comparisons = 0
        let swaps = 0

        const merge = async (start: number, mid: number, end: number) => {
            const left = array.slice(start, mid + 1)
            const right = array.slice(mid + 1, end + 1)
            let i = 0, j = 0, k = start

            while (i < left.length && j < right.length) {
                if (stopRef.current) return
                updateState('merge', { comparing: [start + i, mid + 1 + j], comparisons: ++comparisons })
                await delay(speed)

                if (left[i] <= right[j]) {
                    array[k] = left[i++]
                } else {
                    array[k] = right[j++]
                }
                updateState('merge', { array: [...array], swapping: [k], swaps: ++swaps })
                await delay(speed)
                k++
            }

            while (i < left.length) {
                if (stopRef.current) return
                array[k] = left[i++]
                updateState('merge', { array: [...array], swapping: [k++], swaps: ++swaps })
                await delay(speed)
            }
            while (j < right.length) {
                if (stopRef.current) return
                array[k] = right[j++]
                updateState('merge', { array: [...array], swapping: [k++], swaps: ++swaps })
                await delay(speed)
            }
            updateState('merge', { swapping: [] })
        }

        const sort = async (start: number, end: number) => {
            if (start >= end || stopRef.current) return
            const mid = Math.floor((start + end) / 2)
            await sort(start, mid)
            await sort(mid + 1, end)
            await merge(start, mid, end)
        }

        await sort(0, array.length - 1)
        if (!stopRef.current) markDone('merge')
    }

    const quickSort = async (arr: number[]) => {
        const array = [...arr]
        let comparisons = 0
        let swaps = 0

        const partition = async (low: number, high: number): Promise<number> => {
            const pivot = array[high]
            let i = low - 1

            for (let j = low; j < high; j++) {
                if (stopRef.current) return i
                updateState('quick', { comparing: [j, high], comparisons: ++comparisons })
                await delay(speed)

                if (array[j] < pivot) {
                    i++;
                    [array[i], array[j]] = [array[j], array[i]]
                    updateState('quick', { array: [...array], swapping: [i, j], swaps: ++swaps })
                    await delay(speed)
                }
            }
            [array[i + 1], array[high]] = [array[high], array[i + 1]]
            updateState('quick', { array: [...array], swapping: [i + 1, high], swaps: ++swaps })
            await delay(speed)
            updateState('quick', { swapping: [] })
            return i + 1
        }

        const sort = async (low: number, high: number) => {
            if (low < high && !stopRef.current) {
                const pi = await partition(low, high)
                await sort(low, pi - 1)
                await sort(pi + 1, high)
            }
        }

        await sort(0, array.length - 1)
        if (!stopRef.current) markDone('quick')
    }

    const startRace = async () => {
        stopRef.current = false
        setIsRunning(true)
        initializeArrays()

        await delay(100)

        const currentArrays = algorithms.map(a => [...a.state.array])

        await Promise.all([
            bubbleSort(currentArrays[0]),
            mergeSort(currentArrays[1]),
            quickSort(currentArrays[2]),
        ])

        setIsRunning(false)
    }

    const stop = () => {
        stopRef.current = true
        setIsRunning(false)
    }

    const reset = () => {
        stop()
        initializeArrays()
    }

    const getBarColor = (alg: AlgorithmVisualization, index: number) => {
        if (alg.state.sorted.includes(index)) return 'bg-accent-teal'
        if (alg.state.swapping.includes(index)) return 'bg-accent-orange'
        if (alg.state.comparing.includes(index)) return 'bg-accent-gold'
        return 'bg-accent-blue'
    }

    const algorithmNames: Record<AlgorithmType, string> = {
        bubble: 'Bubble Sort',
        merge: 'Merge Sort',
        quick: 'Quick Sort',
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gradient">Sorting Algorithms</h1>
                <p className="text-text-secondary">
                    Race three classic sorting algorithms side-by-side. Watch Bubble Sort's simplicity,
                    Merge Sort's divide-and-conquer elegance, and Quick Sort's partitioning strategy.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <ControlPanel className="lg:col-span-1">
                    <Slider
                        value={arraySize}
                        onChange={v => { setArraySize(v); reset(); }}
                        min={10}
                        max={50}
                        label="Array Size"
                    />

                    <Slider
                        value={speed}
                        onChange={setSpeed}
                        min={10}
                        max={200}
                        label="Speed (ms)"
                    />

                    <div className="flex gap-2 pt-2">
                        <Button onClick={startRace} disabled={isRunning} className="flex-1">
                            Start Race
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={stop} variant="secondary" disabled={!isRunning} className="flex-1">
                            Stop
                        </Button>
                        <Button onClick={reset} variant="secondary" className="flex-1">
                            Reset
                        </Button>
                    </div>
                </ControlPanel>

                <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {algorithms.map(alg => (
                        <VisualizationContainer key={alg.type} className="min-h-[300px]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-text-primary">{algorithmNames[alg.type]}</h3>
                                {alg.done && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-accent-teal text-sm"
                                    >
                                        ✓ Done
                                    </motion.span>
                                )}
                            </div>

                            <div className="flex items-end justify-center gap-[2px] h-40">
                                {alg.state.array.map((value, index) => (
                                    <motion.div
                                        key={index}
                                        className={cn('rounded-t transition-colors duration-150', getBarColor(alg, index))}
                                        style={{
                                            height: `${(value / 100) * 100}%`,
                                            width: `${Math.max(100 / alg.state.array.length - 1, 2)}%`
                                        }}
                                        layout
                                    />
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-border/50 flex justify-between text-xs text-text-secondary">
                                <span>Comparisons: <span className="text-accent-gold font-mono">{alg.state.comparisons}</span></span>
                                <span>Swaps: <span className="text-accent-orange font-mono">{alg.state.swaps}</span></span>
                            </div>
                        </VisualizationContainer>
                    ))}
                </div>
            </div>

            <div className="glass rounded-xl p-4">
                <div className="flex gap-6 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-gold" />
                        <span className="text-text-secondary">Comparing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-orange" />
                        <span className="text-text-secondary">Swapping</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-teal" />
                        <span className="text-text-secondary">Sorted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-blue" />
                        <span className="text-text-secondary">Unsorted</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
