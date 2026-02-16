import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { generateRandomArray } from '@/lib/utils'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CS_COLOR = 'rgb(34, 211, 238)'

type AlgorithmType = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick'

interface SortingState {
    array: number[]
    comparing: number[]
    swapping: number[]
    sorted: number[]
    comparisons: number
    swaps: number
}

const ALGO_META: Record<AlgorithmType, { name: string; best: string; avg: string; worst: string; space: string }> = {
    bubble: { name: 'Bubble Sort', best: 'O(n)', avg: 'O(n^2)', worst: 'O(n^2)', space: 'O(1)' },
    selection: { name: 'Selection Sort', best: 'O(n^2)', avg: 'O(n^2)', worst: 'O(n^2)', space: 'O(1)' },
    insertion: { name: 'Insertion Sort', best: 'O(n)', avg: 'O(n^2)', worst: 'O(n^2)', space: 'O(1)' },
    merge: { name: 'Merge Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    quick: { name: 'Quick Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n^2)', space: 'O(log n)' },
}

const ALGO_KEYS: AlgorithmType[] = ['bubble', 'selection', 'insertion', 'merge', 'quick']

function makeEmptyState(): SortingState {
    return { array: [], comparing: [], swapping: [], sorted: [], comparisons: 0, swaps: 0 }
}

export default function Sorting() {
    const [arraySize, setArraySize] = useState(30)
    const [speed, setSpeed] = useState(30)
    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [stepMode, setStepMode] = useState(false)
    const [selectedAlgos, setSelectedAlgos] = useState<AlgorithmType[]>(['bubble', 'merge', 'quick'])

    const [states, setStates] = useState<Record<AlgorithmType, SortingState>>(() => {
        const s: Record<string, SortingState> = {}
        for (const k of ALGO_KEYS) s[k] = makeEmptyState()
        return s as Record<AlgorithmType, SortingState>
    })
    const [done, setDone] = useState<Record<AlgorithmType, boolean>>(() => {
        const d: Record<string, boolean> = {}
        for (const k of ALGO_KEYS) d[k] = false
        return d as Record<AlgorithmType, boolean>
    })

    const stopRef = useRef(false)
    const pauseRef = useRef(false)
    const stepResolveRef = useRef<(() => void) | null>(null)

    useEffect(() => { pauseRef.current = isPaused }, [isPaused])

    const initArrays = useCallback(() => {
        const baseArray = generateRandomArray(arraySize)
        const s: Record<string, SortingState> = {}
        const d: Record<string, boolean> = {}
        for (const k of ALGO_KEYS) {
            s[k] = { array: [...baseArray], comparing: [], swapping: [], sorted: [], comparisons: 0, swaps: 0 }
            d[k] = false
        }
        setStates(s as Record<AlgorithmType, SortingState>)
        setDone(d as Record<AlgorithmType, boolean>)
    }, [arraySize])

    useEffect(() => { initArrays() }, [initArrays])

    const delay = async (ms: number) => {
        if (stepMode) {
            await new Promise<void>(resolve => { stepResolveRef.current = resolve })
            return
        }
        while (pauseRef.current && !stopRef.current) {
            await new Promise(r => setTimeout(r, 100))
        }
        return new Promise(r => setTimeout(r, ms))
    }

    const stepForward = () => { stepResolveRef.current?.() }

    const updateState = (type: AlgorithmType, updates: Partial<SortingState>) => {
        setStates(prev => ({ ...prev, [type]: { ...prev[type], ...updates } }))
    }

    const markDone = (type: AlgorithmType, arr: number[]) => {
        setStates(prev => ({
            ...prev,
            [type]: { ...prev[type], array: arr, comparing: [], swapping: [], sorted: Array.from({ length: arr.length }, (_, i) => i) }
        }))
        setDone(prev => ({ ...prev, [type]: true }))
    }

    const bubbleSort = async (arr: number[], type: AlgorithmType) => {
        const a = [...arr]
        let comps = 0
        let swps = 0
        for (let i = 0; i < a.length - 1 && !stopRef.current; i++) {
            for (let j = 0; j < a.length - i - 1 && !stopRef.current; j++) {
                comps++
                updateState(type, { comparing: [j, j + 1], comparisons: comps })
                await delay(speed)
                if (a[j] > a[j + 1]) {
                    [a[j], a[j + 1]] = [a[j + 1], a[j]]
                    swps++
                    updateState(type, { array: [...a], swapping: [j, j + 1], swaps: swps })
                    await delay(speed)
                }
                updateState(type, { swapping: [] })
            }
        }
        if (!stopRef.current) markDone(type, a)
    }

    const selectionSort = async (arr: number[], type: AlgorithmType) => {
        const a = [...arr]
        let comps = 0
        let swps = 0
        for (let i = 0; i < a.length - 1 && !stopRef.current; i++) {
            let minIdx = i
            for (let j = i + 1; j < a.length && !stopRef.current; j++) {
                comps++
                updateState(type, { comparing: [minIdx, j], comparisons: comps })
                await delay(speed)
                if (a[j] < a[minIdx]) minIdx = j
            }
            if (minIdx !== i) {
                [a[i], a[minIdx]] = [a[minIdx], a[i]]
                swps++
                updateState(type, { array: [...a], swapping: [i, minIdx], swaps: swps })
                await delay(speed)
            }
            updateState(type, { swapping: [] })
        }
        if (!stopRef.current) markDone(type, a)
    }

    const insertionSort = async (arr: number[], type: AlgorithmType) => {
        const a = [...arr]
        let comps = 0
        let swps = 0
        for (let i = 1; i < a.length && !stopRef.current; i++) {
            let j = i
            while (j > 0 && !stopRef.current) {
                comps++
                updateState(type, { comparing: [j - 1, j], comparisons: comps })
                await delay(speed)
                if (a[j - 1] > a[j]) {
                    [a[j - 1], a[j]] = [a[j], a[j - 1]]
                    swps++
                    updateState(type, { array: [...a], swapping: [j - 1, j], swaps: swps })
                    await delay(speed)
                    j--
                } else break
            }
            updateState(type, { swapping: [] })
        }
        if (!stopRef.current) markDone(type, a)
    }

    const mergeSort = async (arr: number[], type: AlgorithmType) => {
        const a = [...arr]
        let comps = 0
        let swps = 0
        const merge = async (s: number, m: number, e: number) => {
            const L = a.slice(s, m + 1)
            const R = a.slice(m + 1, e + 1)
            let i = 0, j = 0, k = s
            while (i < L.length && j < R.length && !stopRef.current) {
                comps++
                updateState(type, { comparing: [s + i, m + 1 + j], comparisons: comps })
                await delay(speed)
                if (L[i] <= R[j]) { a[k++] = L[i++] } else { a[k++] = R[j++] }
                swps++
                updateState(type, { array: [...a], swapping: [k - 1], swaps: swps })
                await delay(speed)
            }
            while (i < L.length && !stopRef.current) { a[k++] = L[i++]; updateState(type, { array: [...a] }); await delay(speed) }
            while (j < R.length && !stopRef.current) { a[k++] = R[j++]; updateState(type, { array: [...a] }); await delay(speed) }
            updateState(type, { swapping: [] })
        }
        const sort = async (s: number, e: number) => {
            if (s >= e || stopRef.current) return
            const m = Math.floor((s + e) / 2)
            await sort(s, m)
            await sort(m + 1, e)
            await merge(s, m, e)
        }
        await sort(0, a.length - 1)
        if (!stopRef.current) markDone(type, a)
    }

    const quickSort = async (arr: number[], type: AlgorithmType) => {
        const a = [...arr]
        let comps = 0
        let swps = 0
        const partition = async (l: number, h: number) => {
            const pivot = a[h]
            let i = l - 1
            for (let j = l; j < h && !stopRef.current; j++) {
                comps++
                updateState(type, { comparing: [j, h], comparisons: comps })
                await delay(speed)
                if (a[j] < pivot) {
                    i++;
                    [a[i], a[j]] = [a[j], a[i]]
                    swps++
                    updateState(type, { array: [...a], swapping: [i, j], swaps: swps })
                    await delay(speed)
                }
            }
            [a[i + 1], a[h]] = [a[h], a[i + 1]]
            swps++
            updateState(type, { array: [...a], swapping: [i + 1, h], swaps: swps })
            await delay(speed)
            updateState(type, { swapping: [] })
            return i + 1
        }
        const sort = async (l: number, h: number) => {
            if (l < h && !stopRef.current) {
                const p = await partition(l, h)
                await sort(l, p - 1)
                await sort(p + 1, h)
            }
        }
        await sort(0, a.length - 1)
        if (!stopRef.current) markDone(type, a)
    }

    const SORT_FNS: Record<AlgorithmType, (arr: number[], type: AlgorithmType) => Promise<void>> = {
        bubble: bubbleSort, selection: selectionSort, insertion: insertionSort,
        merge: mergeSort, quick: quickSort,
    }

    const start = async () => {
        stopRef.current = false
        setIsRunning(true)
        setIsPaused(false)
        initArrays()
        await new Promise(r => setTimeout(r, 50))
        const base = states[selectedAlgos[0]].array
        await Promise.all(selectedAlgos.map(algo => SORT_FNS[algo]([...base], algo)))
        setIsRunning(false)
    }

    const stop = () => { stopRef.current = true; setIsRunning(false); setIsPaused(false) }
    const reset = () => { stop(); initArrays() }
    const togglePause = () => setIsPaused(!isPaused)

    const toggleAlgo = (algo: AlgorithmType) => {
        setSelectedAlgos(prev =>
            prev.includes(algo) ? prev.filter(a => a !== algo) : [...prev, algo]
        )
    }

    const getBarColor = (type: AlgorithmType, i: number) => {
        const s = states[type]
        if (s.sorted.includes(i)) return 'bg-accent-teal'
        if (s.swapping.includes(i)) return 'bg-accent-coral'
        if (s.comparing.includes(i)) return 'bg-white/60'
        return 'bg-node'
    }

    const demoSteps: DemoStep[] = [
        { title: 'Sorting Algorithms', description: 'Sorting is fundamental in CS. We compare different algorithms by their time and space complexity.', setup: () => { setSelectedAlgos(['bubble', 'merge', 'quick']); setArraySize(30) } },
        { title: 'Bubble Sort', description: 'Repeatedly swaps adjacent elements. Simple but O(n^2) -- very slow for large arrays. Best case O(n) if already sorted.', setup: () => { setSelectedAlgos(['bubble']); setArraySize(20) } },
        { title: 'Selection Sort', description: 'Finds the minimum in the unsorted portion and places it. Always O(n^2) comparisons regardless of input.', setup: () => { setSelectedAlgos(['selection']); setArraySize(20) } },
        { title: 'Insertion Sort', description: 'Builds the sorted array one element at a time. Efficient for small or nearly-sorted data. O(n) best, O(n^2) worst.', setup: () => { setSelectedAlgos(['insertion']); setArraySize(20) } },
        { title: 'Merge Sort', description: 'Divide and conquer: split in half, sort each, then merge. Always O(n log n) but uses O(n) extra space.', setup: () => { setSelectedAlgos(['merge']); setArraySize(20) } },
        { title: 'Quick Sort', description: 'Picks a pivot and partitions. Average O(n log n), worst O(n^2) on bad pivots. In-place with O(log n) stack space.', setup: () => { setSelectedAlgos(['quick']); setArraySize(20) } },
        { title: 'Race Mode', description: 'Compare algorithms head-to-head. Watch how divide-and-conquer algorithms finish faster than quadratic ones.', highlight: 'Click Start Race to see all algorithms compete.', setup: () => { setSelectedAlgos(['bubble', 'merge', 'quick']); setArraySize(30) } },
        { title: 'Step Mode', description: 'Enable step mode to advance one operation at a time. This helps you trace exactly how each algorithm works.', setup: () => { setStepMode(true); setSelectedAlgos(['bubble']); setArraySize(10) } },
    ]

    const demo = useDemoMode(demoSteps)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1a1a]">
            <div className="flex-1 flex">
                <div className="flex-1 flex flex-col">
                    <div className={`flex-1 grid gap-px bg-border ${selectedAlgos.length <= 2 ? 'grid-cols-2' : selectedAlgos.length <= 3 ? 'grid-cols-3' : 'grid-cols-3 grid-rows-2'}`}>
                        {selectedAlgos.map(type => (
                            <div key={type} className="bg-[#0a1a1a] flex flex-col p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-sm">{ALGO_META[type].name}</h3>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-white/40 font-mono">{states[type].comparisons}c / {states[type].swaps}s</span>
                                        {done[type] && <span className="text-accent-teal">Done</span>}
                                    </div>
                                </div>
                                <div className="flex-1 flex items-end justify-center gap-[2px]">
                                    {states[type].array.map((v, i) => (
                                        <motion.div
                                            key={i}
                                            className={`rounded-t transition-colors duration-75 ${getBarColor(type, i)}`}
                                            style={{ height: `${v}%`, width: `${Math.max(100 / arraySize - 0.5, 2)}%` }}
                                            layout
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="absolute top-4 left-4 space-y-3 w-64 pointer-events-auto">
                        <APTag course="CS A" unit="Unit 7" color={CS_COLOR} />
                        <EquationDisplay
                            departmentColor={CS_COLOR}
                            title="Complexity"
                            equations={selectedAlgos.map(a => ({
                                label: ALGO_META[a].name,
                                expression: `Avg: ${ALGO_META[a].avg}`,
                                description: `Best: ${ALGO_META[a].best} | Worst: ${ALGO_META[a].worst} | Space: ${ALGO_META[a].space}`,
                            }))}
                        />
                    </div>
                </div>

                <div className="w-64 bg-[#0a1a1a]/90 border-l border-white/10 p-4 flex flex-col gap-3 overflow-y-auto z-20">
                    <ControlPanel>
                        <ControlGroup label="Algorithms">
                            <div className="grid grid-cols-2 gap-1">
                                {ALGO_KEYS.map(a => (
                                    <button
                                        key={a}
                                        onClick={() => toggleAlgo(a)}
                                        disabled={isRunning}
                                        className={`px-2 py-1.5 text-xs rounded-lg border transition-all ${
                                            selectedAlgos.includes(a)
                                                ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                                                : 'border-white/10 text-white/40 hover:text-white/70'
                                        } disabled:opacity-50`}
                                    >
                                        {ALGO_META[a].name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </ControlGroup>
                        <Slider label={`Array Size: ${arraySize}`} value={arraySize} onChange={v => { setArraySize(v); reset() }} min={10} max={60} />
                        <Slider label={`Speed: ${speed}ms`} value={205 - speed} onChange={v => setSpeed(205 - v)} min={5} max={200} />
                        <Toggle label="Step Mode" value={stepMode} onChange={setStepMode} />
                        {stepMode && isRunning && (
                            <Button onClick={stepForward}>Step Forward</Button>
                        )}
                        <div className="flex gap-2">
                            <Button onClick={start} disabled={isRunning || selectedAlgos.length === 0}>
                                {isRunning ? 'Racing...' : 'Start Race'}
                            </Button>
                            {isRunning && !stepMode && (
                                <Button onClick={togglePause} variant="secondary">
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                            )}
                        </div>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                        <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
                    </ControlPanel>

                    <InfoPanel
                        title="Comparison Counts"
                        departmentColor={CS_COLOR}
                        items={selectedAlgos.map(a => ({
                            label: ALGO_META[a].name,
                            value: `${states[a].comparisons}`,
                            color: done[a] ? 'rgb(34, 211, 238)' : undefined,
                        }))}
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
