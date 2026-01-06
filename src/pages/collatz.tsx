import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { collatzSequence } from '@/lib/utils'

interface NodeData {
    value: number
    operation: 'multiply' | 'divide' | 'start' | 'loop'
}

export default function Collatz() {
    const [inputValue, setInputValue] = useState('')
    const [sequence, setSequence] = useState<NodeData[]>([])
    const [visibleCount, setVisibleCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [speed, setSpeed] = useState(300)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const NODE_SIZE = 64
    const NODE_GAP = 100
    const ARROW_LENGTH = NODE_GAP - NODE_SIZE

    const startVisualization = useCallback(() => {
        const num = parseInt(inputValue)
        if (!num || num < 1) return

        const seq = collatzSequence(num)
        const nodes: NodeData[] = seq.map((value, i) => {
            if (i === 0) return { value, operation: 'start' as const }
            const prev = seq[i - 1]
            if (value === 4 || value === 2 || value === 1) {
                return { value, operation: 'loop' as const }
            }
            return { value, operation: value > prev ? 'multiply' as const : 'divide' as const }
        })

        setSequence(nodes)
        setVisibleCount(0)
        setIsAnimating(true)
        setIsPaused(false)
    }, [inputValue])

    useEffect(() => {
        if (!isAnimating || isPaused || visibleCount >= sequence.length) {
            if (visibleCount >= sequence.length && sequence.length > 0) {
                setIsAnimating(false)
            }
            return
        }

        const timer = setTimeout(() => {
            setVisibleCount(prev => {
                const next = prev + 1
                if (scrollContainerRef.current && next > 3) {
                    const nodeWidth = NODE_SIZE + ARROW_LENGTH
                    const scrollTarget = (next - 3) * nodeWidth
                    scrollContainerRef.current.scrollTo({
                        left: Math.max(0, scrollTarget),
                        behavior: 'smooth'
                    })
                }
                return next
            })
        }, speed)

        return () => clearTimeout(timer)
    }, [isAnimating, isPaused, visibleCount, sequence.length, speed, ARROW_LENGTH])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') startVisualization()
    }

    const reset = () => {
        setSequence([])
        setVisibleCount(0)
        setIsAnimating(false)
        setIsPaused(false)
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ left: 0 })
        }
    }

    const togglePause = () => setIsPaused(!isPaused)

    const getNodeStyle = (node: NodeData, isActive: boolean) => {
        if (node.operation === 'loop') {
            return 'border-accent-teal bg-accent-teal/10'
        }
        if (isActive && node.operation === 'multiply') {
            return 'border-accent-coral bg-accent-coral/10'
        }
        return 'border-white/20 bg-node'
    }

    const getVerticalOffset = (node: NodeData, index: number) => {
        if (index === 0) return 0
        if (node.operation === 'multiply') return -40
        if (node.operation === 'divide') return 40
        return 0
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto overflow-y-hidden"
                style={{ scrollBehavior: 'smooth' }}
            >
                <div
                    className="h-full flex items-center px-16 py-8"
                    style={{
                        minWidth: sequence.length > 0
                            ? `${sequence.length * (NODE_SIZE + NODE_GAP) + 200}px`
                            : '100%'
                    }}
                >
                    {sequence.length === 0 ? (
                        <div className="w-full text-center text-text-dim">
                            Enter a number to explore the Collatz sequence
                        </div>
                    ) : (
                        <div className="flex items-center relative" style={{ height: 200 }}>
                            {sequence.slice(0, visibleCount).map((node, index) => {
                                const isActive = index === visibleCount - 1
                                const yOffset = getVerticalOffset(node, index)
                                const prevYOffset = index > 0 ? getVerticalOffset(sequence[index - 1], index - 1) : 0

                                return (
                                    <div key={index} className="flex items-center">
                                        {index > 0 && (
                                            <svg
                                                width={ARROW_LENGTH}
                                                height="80"
                                                className="flex-shrink-0"
                                                style={{ marginTop: (yOffset + prevYOffset) / 2 }}
                                            >
                                                <defs>
                                                    <marker
                                                        id={`arrow-${index}`}
                                                        markerWidth="8"
                                                        markerHeight="6"
                                                        refX="7"
                                                        refY="3"
                                                        orient="auto"
                                                    >
                                                        <polygon
                                                            points="0 0, 8 3, 0 6"
                                                            fill="rgba(255,255,255,0.4)"
                                                        />
                                                    </marker>
                                                </defs>
                                                <line
                                                    x1="0"
                                                    y1={40 - (yOffset - prevYOffset) / 2}
                                                    x2={ARROW_LENGTH - 10}
                                                    y2={40 + (yOffset - prevYOffset) / 2}
                                                    stroke="rgba(255,255,255,0.4)"
                                                    strokeWidth="2"
                                                    markerEnd={`url(#arrow-${index})`}
                                                />
                                            </svg>
                                        )}

                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                            className="relative flex-shrink-0"
                                            style={{ marginTop: yOffset }}
                                        >
                                            <div
                                                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center font-mono text-lg transition-colors ${getNodeStyle(node, isActive)}`}
                                            >
                                                {node.value}
                                            </div>

                                            {isActive && node.operation !== 'start' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-sm"
                                                    style={{
                                                        color: node.operation === 'multiply' ? 'var(--color-accent-coral)' : 'var(--color-text-muted)'
                                                    }}
                                                >
                                                    {node.operation === 'multiply' ? '×3 + 1' : '÷2'}
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    </div>
                                )
                            })}

                            {!isAnimating && visibleCount === sequence.length && sequence.length >= 3 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="ml-8 flex items-center gap-2 text-accent-teal text-sm"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    4 → 2 → 1 loop
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
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter number..."
                            className="control-input w-40"
                            disabled={isAnimating}
                        />
                        <button
                            onClick={startVisualization}
                            disabled={isAnimating || !inputValue}
                            className="btn-primary disabled:opacity-30"
                        >
                            Start
                        </button>
                        {isAnimating && (
                            <button onClick={togglePause} className="btn-ghost">
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                        )}
                        {sequence.length > 0 && (
                            <button onClick={reset} className="btn-ghost">
                                Reset
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Speed</span>
                            <input
                                type="range"
                                min={50}
                                max={1000}
                                step={50}
                                value={1050 - speed}
                                onChange={e => setSpeed(1050 - parseInt(e.target.value))}
                                className="w-32 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono w-16">{speed}ms</span>
                        </div>

                        {sequence.length > 0 && (
                            <div className="text-text-muted text-sm">
                                Step {visibleCount} / {sequence.length}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
