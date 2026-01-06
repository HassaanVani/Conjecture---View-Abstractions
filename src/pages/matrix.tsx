import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { delay as delayFn } from '@/lib/utils'

type MatrixSize = 2 | 3

interface AnimState {
    row: number
    col: number
    k: number
    calc: string
}

export default function Matrix() {
    const [size, setSize] = useState<MatrixSize>(2)
    const [matrixA, setMatrixA] = useState<number[][]>([[1, 2], [3, 4]])
    const [matrixB, setMatrixB] = useState<number[][]>([[5, 6], [7, 8]])
    const [result, setResult] = useState<(number | null)[][]>([[null, null], [null, null]])
    const [isAnimating, setIsAnimating] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [speed, setSpeed] = useState(400)
    const [anim, setAnim] = useState<AnimState | null>(null)
    const pauseRef = useRef(false)
    const stopRef = useRef(false)

    useEffect(() => { pauseRef.current = isPaused }, [isPaused])

    const initMatrices = useCallback((s: MatrixSize) => {
        const rand = () => Math.floor(Math.random() * 9) + 1
        setMatrixA(Array(s).fill(0).map(() => Array(s).fill(0).map(rand)))
        setMatrixB(Array(s).fill(0).map(() => Array(s).fill(0).map(rand)))
        setResult(Array(s).fill(0).map(() => Array(s).fill(null)))
    }, [])

    useEffect(() => { initMatrices(size) }, [size, initMatrices])

    const delay = async (ms: number) => {
        while (pauseRef.current && !stopRef.current) {
            await delayFn(100)
        }
        return delayFn(ms)
    }

    const updateCell = (m: 'A' | 'B', r: number, c: number, v: number) => {
        if (m === 'A') {
            const n = matrixA.map(row => [...row])
            n[r][c] = v
            setMatrixA(n)
        } else {
            const n = matrixB.map(row => [...row])
            n[r][c] = v
            setMatrixB(n)
        }
    }

    const multiply = async () => {
        stopRef.current = false
        setIsAnimating(true)
        setIsPaused(false)
        const res: (number | null)[][] = Array(size).fill(0).map(() => Array(size).fill(null))
        setResult(res)

        for (let i = 0; i < size && !stopRef.current; i++) {
            for (let j = 0; j < size && !stopRef.current; j++) {
                let sum = 0, calc = ''
                for (let k = 0; k < size && !stopRef.current; k++) {
                    calc += (k > 0 ? ' + ' : '') + `${matrixA[i][k]}×${matrixB[k][j]}`
                    setAnim({ row: i, col: j, k, calc })
                    await delay(speed)
                    sum += matrixA[i][k] * matrixB[k][j]
                }
                res[i][j] = sum
                setResult(res.map(r => [...r]))
                setAnim({ row: i, col: j, k: -1, calc: `${calc} = ${sum}` })
                await delay(speed / 2)
            }
        }
        setAnim(null)
        setIsAnimating(false)
    }

    const reset = () => { stopRef.current = true; initMatrices(size); setAnim(null); setIsAnimating(false); setIsPaused(false) }
    const togglePause = () => setIsPaused(!isPaused)

    const isHighlighted = (m: 'A' | 'B' | 'R', r: number, c: number) => {
        if (!anim) return false
        if (m === 'A') return anim.row === r && anim.k === c
        if (m === 'B') return anim.k === r && anim.col === c
        return anim.row === r && anim.col === c
    }

    const renderMatrix = (m: number[][] | (number | null)[][], id: 'A' | 'B' | 'R', editable = false) => (
        <div className="flex flex-col gap-2">
            {m.map((row, i) => (
                <div key={i} className="flex gap-2">
                    {row.map((cell, j) => (
                        <motion.div
                            key={j}
                            animate={{ scale: isHighlighted(id, i, j) ? 1.1 : 1 }}
                            className={`w-14 h-14 rounded-lg flex items-center justify-center font-mono text-lg transition-colors ${isHighlighted(id, i, j)
                                    ? id === 'R' ? 'bg-accent-teal/30 text-accent-teal border border-accent-teal' : 'bg-accent-coral/30 text-accent-coral border border-accent-coral'
                                    : 'bg-node border border-white/10'
                                }`}
                        >
                            {editable ? (
                                <input
                                    type="number"
                                    value={cell ?? ''}
                                    onChange={e => updateCell(id as 'A' | 'B', i, j, parseInt(e.target.value) || 0)}
                                    className="w-full h-full bg-transparent text-center focus:outline-none"
                                    disabled={isAnimating}
                                />
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.span key={cell} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                        {cell ?? '?'}
                                    </motion.span>
                                </AnimatePresence>
                            )}
                        </motion.div>
                    ))}
                </div>
            ))}
        </div>
    )

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                <div className="flex items-center gap-6 md:gap-10 flex-wrap justify-center">
                    <div className="text-center">
                        <p className="text-text-dim text-sm mb-3">A</p>
                        {renderMatrix(matrixA, 'A', true)}
                    </div>
                    <span className="text-3xl text-text-dim">×</span>
                    <div className="text-center">
                        <p className="text-text-dim text-sm mb-3">B</p>
                        {renderMatrix(matrixB, 'B', true)}
                    </div>
                    <span className="text-3xl text-text-dim">=</span>
                    <div className="text-center">
                        <p className="text-text-dim text-sm mb-3">Result</p>
                        {renderMatrix(result, 'R')}
                    </div>
                </div>

                {anim && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-text-muted text-center h-6">
                        {anim.calc}
                    </motion.div>
                )}
            </div>

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1 mr-2">
                            {([2, 3] as MatrixSize[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSize(s)}
                                    disabled={isAnimating}
                                    className={`px-3 py-2 rounded font-mono text-sm transition-colors ${size === s ? 'bg-white text-bg' : 'bg-node text-text-muted hover:text-text'
                                        }`}
                                >
                                    {s}×{s}
                                </button>
                            ))}
                        </div>
                        <button onClick={multiply} disabled={isAnimating} className="btn-primary disabled:opacity-30">
                            {isAnimating ? 'Running...' : 'Multiply'}
                        </button>
                        {isAnimating && (
                            <button onClick={togglePause} className="btn-ghost">
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                        )}
                        <button onClick={reset} className="btn-ghost">Reset</button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-text-dim text-sm">Speed</span>
                        <input
                            type="range"
                            min={100}
                            max={1000}
                            step={50}
                            value={1100 - speed}
                            onChange={e => setSpeed(1100 - parseInt(e.target.value))}
                            className="w-24 accent-text"
                        />
                        <span className="text-text-muted text-xs font-mono w-14">{speed}ms</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
