import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ControlPanel, ControlGroup, Button, VisualizationContainer, Slider } from '@/components/control-panel'
import { cn, delay } from '@/lib/utils'

type MatrixSize = 2 | 3

interface AnimationState {
    currentRow: number
    currentCol: number
    currentK: number
    highlightedA: number[]
    highlightedB: number[]
    resultCell: [number, number] | null
    dotProduct: string
}

export default function Matrix() {
    const [size, setSize] = useState<MatrixSize>(2)
    const [matrixA, setMatrixA] = useState<number[][]>([[1, 2], [3, 4]])
    const [matrixB, setMatrixB] = useState<number[][]>([[5, 6], [7, 8]])
    const [result, setResult] = useState<(number | null)[][]>([[null, null], [null, null]])
    const [isAnimating, setIsAnimating] = useState(false)
    const [speed, setSpeed] = useState(500)
    const [animState, setAnimState] = useState<AnimationState>({
        currentRow: -1,
        currentCol: -1,
        currentK: -1,
        highlightedA: [],
        highlightedB: [],
        resultCell: null,
        dotProduct: '',
    })

    const initializeMatrices = useCallback((newSize: MatrixSize) => {
        const a = Array(newSize).fill(null).map(() =>
            Array(newSize).fill(null).map(() => Math.floor(Math.random() * 9) + 1)
        )
        const b = Array(newSize).fill(null).map(() =>
            Array(newSize).fill(null).map(() => Math.floor(Math.random() * 9) + 1)
        )
        setMatrixA(a)
        setMatrixB(b)
        setResult(Array(newSize).fill(null).map(() => Array(newSize).fill(null)))
    }, [])

    useEffect(() => {
        initializeMatrices(size)
    }, [size, initializeMatrices])

    const updateCell = (matrix: 'A' | 'B', row: number, col: number, value: number) => {
        if (matrix === 'A') {
            const newMatrix = [...matrixA]
            newMatrix[row] = [...newMatrix[row]]
            newMatrix[row][col] = value
            setMatrixA(newMatrix)
        } else {
            const newMatrix = [...matrixB]
            newMatrix[row] = [...newMatrix[row]]
            newMatrix[row][col] = value
            setMatrixB(newMatrix)
        }
    }

    const startMultiplication = async () => {
        setIsAnimating(true)
        const newResult: (number | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null))
        setResult(newResult)

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                let sum = 0
                let dotProductStr = ''

                for (let k = 0; k < size; k++) {
                    setAnimState({
                        currentRow: i,
                        currentCol: j,
                        currentK: k,
                        highlightedA: [i * size + k],
                        highlightedB: [k * size + j],
                        resultCell: [i, j],
                        dotProduct: dotProductStr + (k > 0 ? ' + ' : '') + `${matrixA[i][k]}×${matrixB[k][j]}`,
                    })

                    await delay(speed)
                    sum += matrixA[i][k] * matrixB[k][j]
                    dotProductStr += (k > 0 ? ' + ' : '') + `${matrixA[i][k]}×${matrixB[k][j]}`
                }

                newResult[i][j] = sum
                setResult([...newResult.map(row => [...row])])

                setAnimState(prev => ({
                    ...prev,
                    dotProduct: `${dotProductStr} = ${sum}`,
                }))

                await delay(speed / 2)
            }
        }

        setAnimState({
            currentRow: -1,
            currentCol: -1,
            currentK: -1,
            highlightedA: [],
            highlightedB: [],
            resultCell: null,
            dotProduct: '',
        })
        setIsAnimating(false)
    }

    const reset = () => {
        initializeMatrices(size)
        setAnimState({
            currentRow: -1,
            currentCol: -1,
            currentK: -1,
            highlightedA: [],
            highlightedB: [],
            resultCell: null,
            dotProduct: '',
        })
    }

    const renderMatrix = (
        matrix: number[][] | (number | null)[][],
        id: string,
        editable: boolean = false,
        matrixId?: 'A' | 'B'
    ) => (
        <div className="inline-flex flex-col gap-1">
            <div className="flex gap-1">
                <div className="w-2 border-l-2 border-t-2 border-b-2 border-text-muted rounded-l" />
                <div className="flex flex-col gap-1">
                    {matrix.map((row, i) => (
                        <div key={i} className="flex gap-1">
                            {row.map((cell, j) => {
                                const index = i * size + j
                                const isHighlighted = id === 'A'
                                    ? animState.highlightedA.includes(index)
                                    : id === 'B'
                                        ? animState.highlightedB.includes(index)
                                        : animState.resultCell?.[0] === i && animState.resultCell?.[1] === j

                                return (
                                    <motion.div
                                        key={j}
                                        className={cn(
                                            'w-12 h-12 rounded-lg flex items-center justify-center font-mono transition-all duration-200',
                                            editable ? 'bg-bg-tertiary hover:bg-border cursor-text' : 'bg-bg-secondary',
                                            isHighlighted && id === 'A' && 'bg-accent-blue/30 ring-2 ring-accent-blue',
                                            isHighlighted && id === 'B' && 'bg-accent-purple/30 ring-2 ring-accent-purple',
                                            isHighlighted && id === 'result' && 'bg-accent-teal/30 ring-2 ring-accent-teal',
                                        )}
                                        animate={isHighlighted ? { scale: 1.1 } : { scale: 1 }}
                                    >
                                        {editable && matrixId ? (
                                            <input
                                                type="number"
                                                value={cell ?? ''}
                                                onChange={e => updateCell(matrixId, i, j, parseInt(e.target.value) || 0)}
                                                className="w-full h-full bg-transparent text-center text-text-primary focus:outline-none"
                                                disabled={isAnimating}
                                            />
                                        ) : (
                                            <AnimatePresence mode="wait">
                                                <motion.span
                                                    key={cell}
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                    className={cn(
                                                        cell === null ? 'text-text-muted' : 'text-text-primary'
                                                    )}
                                                >
                                                    {cell ?? '?'}
                                                </motion.span>
                                            </AnimatePresence>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    ))}
                </div>
                <div className="w-2 border-r-2 border-t-2 border-b-2 border-text-muted rounded-r" />
            </div>
        </div>
    )

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gradient">Matrix Multiplication</h1>
                <p className="text-text-secondary">
                    Visualize how matrices multiply element by element. Watch rows meet columns
                    in the dot product dance.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <ControlPanel className="lg:col-span-1">
                    <ControlGroup label="Matrix Size">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSize(2)}
                                disabled={isAnimating}
                                className={cn(
                                    'flex-1 py-2 rounded-lg font-mono transition-all',
                                    size === 2 ? 'bg-accent-blue text-bg-primary' : 'bg-bg-tertiary text-text-secondary hover:bg-border'
                                )}
                            >
                                2×2
                            </button>
                            <button
                                onClick={() => setSize(3)}
                                disabled={isAnimating}
                                className={cn(
                                    'flex-1 py-2 rounded-lg font-mono transition-all',
                                    size === 3 ? 'bg-accent-blue text-bg-primary' : 'bg-bg-tertiary text-text-secondary hover:bg-border'
                                )}
                            >
                                3×3
                            </button>
                        </div>
                    </ControlGroup>

                    <Slider
                        value={speed}
                        onChange={setSpeed}
                        min={200}
                        max={1000}
                        label="Animation Speed (ms)"
                    />

                    <div className="flex gap-2 pt-2">
                        <Button onClick={startMultiplication} disabled={isAnimating} className="flex-1">
                            {isAnimating ? 'Running...' : 'Multiply'}
                        </Button>
                        <Button onClick={reset} variant="secondary" className="flex-1">
                            Reset
                        </Button>
                    </div>

                    {animState.dotProduct && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="pt-4 border-t border-border"
                        >
                            <div className="text-xs text-text-secondary mb-1">Current Calculation</div>
                            <div className="font-mono text-sm text-text-primary bg-bg-tertiary rounded-lg p-2 break-all">
                                {animState.dotProduct}
                            </div>
                        </motion.div>
                    )}
                </ControlPanel>

                <VisualizationContainer className="lg:col-span-4">
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
                        <div className="text-center">
                            <div className="text-sm text-text-secondary mb-2">Matrix A</div>
                            {renderMatrix(matrixA, 'A', true, 'A')}
                        </div>

                        <div className="text-3xl text-text-muted">×</div>

                        <div className="text-center">
                            <div className="text-sm text-text-secondary mb-2">Matrix B</div>
                            {renderMatrix(matrixB, 'B', true, 'B')}
                        </div>

                        <div className="text-3xl text-text-muted">=</div>

                        <div className="text-center">
                            <div className="text-sm text-text-secondary mb-2">Result</div>
                            {renderMatrix(result, 'result')}
                        </div>
                    </div>

                    <div className="mt-8 text-center text-text-secondary text-sm">
                        {isAnimating
                            ? `Computing C[${animState.currentRow + 1}][${animState.currentCol + 1}]...`
                            : 'Click on matrix cells to edit values, then click Multiply'
                        }
                    </div>
                </VisualizationContainer>
            </div>

            <div className="glass rounded-xl p-4">
                <div className="flex gap-6 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-blue" />
                        <span className="text-text-secondary">Row from A</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-purple" />
                        <span className="text-text-secondary">Column from B</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent-teal" />
                        <span className="text-text-secondary">Result Cell</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
