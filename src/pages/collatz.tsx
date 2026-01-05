import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ControlPanel, ControlGroup, NumberInput, Button, VisualizationContainer, Slider } from '@/components/control-panel'
import { collatzSequence, cn } from '@/lib/utils'

interface Node {
    value: number
    type: 'growing' | 'shrinking' | 'loop'
}

export default function Collatz() {
    const [inputValue, setInputValue] = useState(27)
    const [sequence, setSequence] = useState<Node[]>([])
    const [visibleCount, setVisibleCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [speed, setSpeed] = useState(200)

    const getNodeType = (current: number, next: number | undefined): 'growing' | 'shrinking' | 'loop' => {
        if (current === 4 || current === 2 || current === 1) return 'loop'
        if (next && next > current) return 'growing'
        return 'shrinking'
    }

    const startVisualization = useCallback(() => {
        const seq = collatzSequence(inputValue)
        const nodes: Node[] = seq.map((value, i) => ({
            value,
            type: getNodeType(value, seq[i + 1]),
        }))

        setSequence(nodes)
        setVisibleCount(0)
        setIsAnimating(true)
    }, [inputValue])

    useEffect(() => {
        if (!isAnimating || visibleCount >= sequence.length) {
            if (visibleCount >= sequence.length) setIsAnimating(false)
            return
        }

        const timer = setTimeout(() => {
            setVisibleCount(prev => prev + 1)
        }, speed)

        return () => clearTimeout(timer)
    }, [isAnimating, visibleCount, sequence.length, speed])

    const reset = () => {
        setSequence([])
        setVisibleCount(0)
        setIsAnimating(false)
    }

    const currentNode = sequence[visibleCount - 1]

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gradient">Collatz Conjecture</h1>
                <p className="text-text-secondary">
                    Enter any positive integer. If even, divide by 2. If odd, multiply by 3 and add 1.
                    The conjecture states all numbers eventually reach the 4 → 2 → 1 loop.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <ControlPanel className="lg:col-span-1">
                    <ControlGroup label="Starting Number">
                        <NumberInput
                            value={inputValue}
                            onChange={setInputValue}
                            min={1}
                            max={10000}
                        />
                    </ControlGroup>

                    <Slider
                        value={speed}
                        onChange={setSpeed}
                        min={50}
                        max={500}
                        label="Animation Speed (ms)"
                    />

                    <div className="flex gap-2 pt-2">
                        <Button onClick={startVisualization} disabled={isAnimating} className="flex-1">
                            {isAnimating ? 'Running...' : 'Start'}
                        </Button>
                        <Button onClick={reset} variant="secondary" className="flex-1">
                            Reset
                        </Button>
                    </div>

                    {sequence.length > 0 && (
                        <div className="pt-4 border-t border-border space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Steps</span>
                                <span className="font-mono text-text-primary">{visibleCount} / {sequence.length}</span>
                            </div>
                            {currentNode && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Current</span>
                                    <span className={cn(
                                        'font-mono font-bold',
                                        currentNode.type === 'growing' && 'text-accent-orange',
                                        currentNode.type === 'shrinking' && 'text-accent-blue',
                                        currentNode.type === 'loop' && 'text-accent-gold',
                                    )}>
                                        {currentNode.value}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </ControlPanel>

                <VisualizationContainer className="lg:col-span-3">
                    <div className="flex flex-wrap gap-3 items-center justify-start">
                        <AnimatePresence>
                            {sequence.slice(0, visibleCount).map((node, index) => (
                                <motion.div
                                    key={`${node.value}-${index}`}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className={cn(
                                        'node',
                                        node.type === 'growing' && 'node-growing',
                                        node.type === 'shrinking' && 'node-shrinking',
                                        node.type === 'loop' && 'node-loop',
                                        node.type === 'loop' && 'animate-pulse'
                                    )}>
                                        {node.value}
                                    </div>

                                    {index < visibleCount - 1 && (
                                        <motion.div
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: 'auto', opacity: 1 }}
                                            className="flex items-center"
                                        >
                                            <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {sequence.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                            Enter a number and click Start to begin
                        </div>
                    )}

                    {!isAnimating && visibleCount === sequence.length && sequence.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-8 left-8 right-8 text-center"
                        >
                            <div className="glass inline-block px-6 py-3 rounded-full">
                                <span className="text-accent-gold">✓</span>
                                <span className="ml-2 text-text-secondary">Reached the 4-2-1 loop in {sequence.length - 1} steps</span>
                            </div>
                        </motion.div>
                    )}
                </VisualizationContainer>
            </div>

            <div className="glass rounded-xl p-4">
                <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-accent-orange/30 border border-accent-orange" />
                        <span className="text-text-secondary">Growing (3n + 1)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-accent-blue/30 border border-accent-blue" />
                        <span className="text-text-secondary">Shrinking (n ÷ 2)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-accent-gold/30 border border-accent-gold" />
                        <span className="text-text-secondary">Loop (4 → 2 → 1)</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
