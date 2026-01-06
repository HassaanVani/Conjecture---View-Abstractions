import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { generateRandomArray } from '@/lib/utils'

type AlgorithmType = 'bubble' | 'merge' | 'quick'

interface SortingState {
    array: number[]
    comparing: number[]
    swapping: number[]
    sorted: number[]
}

export default function Sorting() {
    const [arraySize, setArraySize] = useState(30)
    const [speed, setSpeed] = useState(30)
    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [states, setStates] = useState<Record<AlgorithmType, SortingState>>({
        bubble: { array: [], comparing: [], swapping: [], sorted: [] },
        merge: { array: [], comparing: [], swapping: [], sorted: [] },
        quick: { array: [], comparing: [], swapping: [], sorted: [] },
    })
    const [done, setDone] = useState<Record<AlgorithmType, boolean>>({ bubble: false, merge: false, quick: false })
    const stopRef = useRef(false)
    const pauseRef = useRef(false)

    useEffect(() => { pauseRef.current = isPaused }, [isPaused])

    const initArrays = useCallback(() => {
        const baseArray = generateRandomArray(arraySize)
        setStates({
            bubble: { array: [...baseArray], comparing: [], swapping: [], sorted: [] },
            merge: { array: [...baseArray], comparing: [], swapping: [], sorted: [] },
            quick: { array: [...baseArray], comparing: [], swapping: [], sorted: [] },
        })
        setDone({ bubble: false, merge: false, quick: false })
    }, [arraySize])

    useEffect(() => { initArrays() }, [initArrays])

    const delay = async (ms: number) => {
        while (pauseRef.current && !stopRef.current) {
            await new Promise(r => setTimeout(r, 100))
        }
        return new Promise(r => setTimeout(r, ms))
    }

    const updateState = (type: AlgorithmType, updates: Partial<SortingState>) => {
        setStates(prev => ({ ...prev, [type]: { ...prev[type], ...updates } }))
    }

    const markDone = (type: AlgorithmType, arr: number[]) => {
        setStates(prev => ({ ...prev, [type]: { array: arr, comparing: [], swapping: [], sorted: Array.from({ length: arr.length }, (_, i) => i) } }))
        setDone(prev => ({ ...prev, [type]: true }))
    }

    const bubbleSort = async (arr: number[]) => {
        const a = [...arr]
        for (let i = 0; i < a.length - 1 && !stopRef.current; i++) {
            for (let j = 0; j < a.length - i - 1 && !stopRef.current; j++) {
                updateState('bubble', { comparing: [j, j + 1] })
                await delay(speed)
                if (a[j] > a[j + 1]) {
                    [a[j], a[j + 1]] = [a[j + 1], a[j]]
                    updateState('bubble', { array: [...a], swapping: [j, j + 1] })
                    await delay(speed)
                }
                updateState('bubble', { swapping: [] })
            }
        }
        if (!stopRef.current) markDone('bubble', a)
    }

    const mergeSort = async (arr: number[]) => {
        const a = [...arr]
        const merge = async (s: number, m: number, e: number) => {
            const L = a.slice(s, m + 1), R = a.slice(m + 1, e + 1)
            let i = 0, j = 0, k = s
            while (i < L.length && j < R.length && !stopRef.current) {
                updateState('merge', { comparing: [s + i, m + 1 + j] })
                await delay(speed)
                a[k++] = L[i] <= R[j] ? L[i++] : R[j++]
                updateState('merge', { array: [...a], swapping: [k - 1] })
                await delay(speed)
            }
            while (i < L.length && !stopRef.current) { a[k++] = L[i++]; updateState('merge', { array: [...a] }); await delay(speed) }
            while (j < R.length && !stopRef.current) { a[k++] = R[j++]; updateState('merge', { array: [...a] }); await delay(speed) }
            updateState('merge', { swapping: [] })
        }
        const sort = async (s: number, e: number) => {
            if (s >= e || stopRef.current) return
            const m = Math.floor((s + e) / 2)
            await sort(s, m)
            await sort(m + 1, e)
            await merge(s, m, e)
        }
        await sort(0, a.length - 1)
        if (!stopRef.current) markDone('merge', a)
    }

    const quickSort = async (arr: number[]) => {
        const a = [...arr]
        const partition = async (l: number, h: number) => {
            const pivot = a[h]
            let i = l - 1
            for (let j = l; j < h && !stopRef.current; j++) {
                updateState('quick', { comparing: [j, h] })
                await delay(speed)
                if (a[j] < pivot) {
                    i++;
                    [a[i], a[j]] = [a[j], a[i]]
                    updateState('quick', { array: [...a], swapping: [i, j] })
                    await delay(speed)
                }
            }
            [a[i + 1], a[h]] = [a[h], a[i + 1]]
            updateState('quick', { array: [...a], swapping: [i + 1, h] })
            await delay(speed)
            updateState('quick', { swapping: [] })
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
        if (!stopRef.current) markDone('quick', a)
    }

    const start = async () => {
        stopRef.current = false
        setIsRunning(true)
        setIsPaused(false)
        initArrays()
        await new Promise(r => setTimeout(r, 50))
        const base = states.bubble.array
        await Promise.all([bubbleSort([...base]), mergeSort([...base]), quickSort([...base])])
        setIsRunning(false)
    }

    const stop = () => { stopRef.current = true; setIsRunning(false); setIsPaused(false) }
    const reset = () => { stop(); initArrays() }
    const togglePause = () => setIsPaused(!isPaused)

    const getBarColor = (type: AlgorithmType, i: number) => {
        const s = states[type]
        if (s.sorted.includes(i)) return 'bg-accent-teal'
        if (s.swapping.includes(i)) return 'bg-accent-coral'
        if (s.comparing.includes(i)) return 'bg-white/60'
        return 'bg-node'
    }

    const algorithms: { type: AlgorithmType; name: string }[] = [
        { type: 'bubble', name: 'Bubble Sort' },
        { type: 'merge', name: 'Merge Sort' },
        { type: 'quick', name: 'Quick Sort' },
    ]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 grid grid-cols-3 gap-px bg-border">
                {algorithms.map(({ type, name }) => (
                    <div key={type} className="bg-bg flex flex-col p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">{name}</h3>
                            {done[type] && <span className="text-accent-teal text-xs">Done</span>}
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

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <button onClick={start} disabled={isRunning} className="btn-primary disabled:opacity-30">
                            {isRunning ? 'Racing...' : 'Start Race'}
                        </button>
                        {isRunning && (
                            <button onClick={togglePause} className="btn-ghost">
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                        )}
                        <button onClick={reset} className="btn-ghost">Reset</button>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Size</span>
                            <input
                                type="range"
                                min={10}
                                max={60}
                                value={arraySize}
                                onChange={e => { setArraySize(+e.target.value); reset() }}
                                className="w-24 accent-text"
                                disabled={isRunning}
                            />
                            <span className="text-text-muted text-xs font-mono w-8">{arraySize}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Speed</span>
                            <input
                                type="range"
                                min={5}
                                max={200}
                                value={205 - speed}
                                onChange={e => setSpeed(205 - +e.target.value)}
                                className="w-24 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono w-12">{speed}ms</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
