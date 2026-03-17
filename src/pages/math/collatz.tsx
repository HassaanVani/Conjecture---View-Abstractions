import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { collatzSequence } from '@/lib/utils'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const MATH_COLOR = 'rgb(100, 149, 237)'

interface NodeData {
    value: number
    operation: 'multiply' | 'divide' | 'start' | 'loop'
}

// Precompute some notable sequence lengths for comparison
const NOTABLE_NUMBERS: { n: number; length: number }[] = [
    { n: 7, length: 17 }, { n: 9, length: 20 }, { n: 27, length: 112 },
    { n: 97, length: 119 }, { n: 171, length: 125 }, { n: 231, length: 128 },
]

export default function Collatz() {
    const [inputValue, setInputValue] = useState('')
    const [sequence, setSequence] = useState<NodeData[]>([])
    const [visibleCount, setVisibleCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [speed, setSpeed] = useState(300)
    const [showTree, setShowTree] = useState(false)
    const [compareN, setCompareN] = useState(27)
    const [showCompare, setShowCompare] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const treeCanvasRef = useRef<HTMLCanvasElement>(null)

    const NODE_SIZE = 64
    const NODE_GAP = 100
    const ARROW_LENGTH = NODE_GAP - NODE_SIZE

    const rawSequence = inputValue ? collatzSequence(parseInt(inputValue) || 1) : []
    const compareSequence = collatzSequence(compareN)
    const maxValue = rawSequence.length > 0 ? Math.max(...rawSequence) : 0
    const oddSteps = rawSequence.filter((v, i) => i > 0 && v > rawSequence[i - 1]).length
    const evenSteps = rawSequence.filter((v, i) => i > 0 && v < rawSequence[i - 1]).length

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
                    scrollContainerRef.current.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' })
                }
                return next
            })
        }, speed)
        return () => clearTimeout(timer)
    }, [isAnimating, isPaused, visibleCount, sequence.length, speed, ARROW_LENGTH])

    // Tree visualization
    useEffect(() => {
        if (!showTree) return
        const canvas = treeCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)

        const w = rect.width
        const h = rect.height
        ctx.fillStyle = '#0a0e1a'
        ctx.fillRect(0, 0, w, h)

        // Build reverse Collatz tree from 1
        // For a value n: predecessors are 2n (always) and (n-1)/3 (if n-1 divisible by 3 and (n-1)/3 is odd)
        interface TreeNodeData { val: number; x: number; y: number; children: TreeNodeData[] }
        const root: TreeNodeData = { val: 1, x: w / 2, y: h - 30, children: [] }

        const buildTree = (node: TreeNodeData, depth: number, xMin: number, xMax: number) => {
            if (depth > 6) return
            const children: TreeNodeData[] = []
            // 2n predecessor
            const pred1 = node.val * 2
            if (pred1 <= 512) {
                children.push({ val: pred1, x: 0, y: 0, children: [] })
            }
            // (n-1)/3 predecessor
            if ((node.val - 1) % 3 === 0 && node.val > 1) {
                const pred2 = (node.val - 1) / 3
                if (pred2 > 0 && pred2 % 2 === 1 && pred2 !== 1) {
                    children.push({ val: pred2, x: 0, y: 0, children: [] })
                }
            }

            const spacing = (xMax - xMin) / (children.length + 1)
            children.forEach((c, i) => {
                c.x = xMin + spacing * (i + 1)
                c.y = node.y - (h - 60) / 7
                node.children.push(c)
                buildTree(c, depth + 1, c.x - spacing / 2, c.x + spacing / 2)
            })
        }
        buildTree(root, 0, 20, w - 20)

        // Draw tree
        const drawNode = (node: TreeNodeData) => {
            const inSequence = rawSequence.includes(node.val)
            node.children.forEach(child => {
                const childInSeq = rawSequence.includes(child.val) && inSequence
                ctx.strokeStyle = childInSeq ? 'rgba(100, 149, 237, 0.7)' : 'rgba(100, 149, 237, 0.15)'
                ctx.lineWidth = childInSeq ? 2 : 1
                ctx.beginPath()
                ctx.moveTo(node.x, node.y)
                ctx.lineTo(child.x, child.y)
                ctx.stroke()
                drawNode(child)
            })

            const r = inSequence ? 14 : 10
            ctx.fillStyle = inSequence ? 'rgba(100, 149, 237, 0.3)' : 'rgba(30, 40, 60, 0.8)'
            ctx.strokeStyle = inSequence ? 'rgba(100, 149, 237, 0.8)' : 'rgba(100, 149, 237, 0.2)'
            ctx.lineWidth = inSequence ? 2 : 1
            ctx.beginPath()
            ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()

            ctx.fillStyle = inSequence ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'
            ctx.font = `${inSequence ? 'bold ' : ''}${r > 10 ? 11 : 9}px monospace`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(node.val.toString(), node.x, node.y)
        }
        drawNode(root)

        ctx.fillStyle = 'rgba(100, 149, 237, 0.6)'
        ctx.font = '12px Inter'
        ctx.textAlign = 'center'
        ctx.fillText('Reverse Collatz Tree (from 1)', w / 2, 16)
    }, [showTree, rawSequence])

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
        if (node.operation === 'loop') return 'border-accent-teal bg-accent-teal/10'
        if (isActive && node.operation === 'multiply') return 'border-accent-coral bg-accent-coral/10'
        return 'border-white/20 bg-node'
    }

    const getVerticalOffset = (node: NodeData, index: number) => {
        if (index === 0) return 0
        if (node.operation === 'multiply') return -40
        if (node.operation === 'divide') return 40
        return 0
    }

    const demoSteps: DemoStep[] = [
        { title: 'The Collatz Conjecture', description: 'Take any positive integer. If even, divide by 2. If odd, multiply by 3 and add 1. The conjecture: every number eventually reaches 1.', setup: () => { setInputValue('7'); setShowTree(false); setShowCompare(false) } },
        { title: 'Simple Example: 7', description: 'Starting from 7: 7 -> 22 -> 11 -> 34 -> 17 -> 52 -> 26 -> 13 -> 40 -> 20 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1. That is 17 steps!', setup: () => { setInputValue('7'); setShowTree(false) } },
        { title: 'The 3n+1 Explosion', description: 'When n is odd, 3n+1 can cause the value to skyrocket. Watch the red nodes (multiply steps) push values much higher than the starting point.', setup: () => { setInputValue('27'); setShowTree(false) } },
        { title: 'Surprising Case: 27', description: 'The number 27 takes 112 steps and reaches a max of 9232 before finally descending to 1. Small inputs can have very long sequences.', setup: () => { setInputValue('27') } },
        { title: 'Sequence Length Comparison', description: 'Compare how different starting numbers produce vastly different sequence lengths. Some small numbers have surprisingly long sequences.', highlight: 'Toggle "Show Comparison" to see a bar chart.', setup: () => { setShowCompare(true); setInputValue('27') } },
        { title: 'The Collatz Tree', description: 'Working backwards from 1, we can build a tree of all paths. Every number explored so far eventually appears in this tree.', highlight: 'Enable "Show Tree" to see the reverse tree.', setup: () => { setShowTree(true); setInputValue('7') } },
        { title: 'The 4-2-1 Loop', description: 'Every sequence ends with ...4 -> 2 -> 1. The teal nodes mark this terminal loop. No other loops have been found.', setup: () => { setInputValue('12'); setShowTree(false); setShowCompare(false) } },
        { title: 'Unsolved Mystery', description: 'Despite being checked for all numbers up to ~10^20, the Collatz Conjecture remains unproven. Explore different numbers and observe the patterns!', setup: () => { setInputValue(''); setShowTree(false) } },
    ]

    const demo = useDemoMode(demoSteps)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a0e1a]">
            <div className="flex-1 relative flex">
                <div className="flex-1 flex flex-col">
                    {showTree ? (
                        <div className="flex-1 relative">
                            <canvas ref={treeCanvasRef} className="w-full h-full" />
                        </div>
                    ) : (
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
                                                                <marker id={`arrow-${index}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                                                    <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.4)" />
                                                                </marker>
                                                            </defs>
                                                            <line
                                                                x1="0" y1={40 - (yOffset - prevYOffset) / 2}
                                                                x2={ARROW_LENGTH - 10} y2={40 + (yOffset - prevYOffset) / 2}
                                                                stroke="rgba(255,255,255,0.4)" strokeWidth="2"
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
                                                        <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center font-mono text-lg transition-colors ${getNodeStyle(node, isActive)}`}>
                                                            {node.value}
                                                        </div>
                                                        {isActive && node.operation !== 'start' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-sm"
                                                                style={{ color: node.operation === 'multiply' ? 'var(--color-accent-coral)' : 'var(--color-text-muted)' }}
                                                            >
                                                                {node.operation === 'multiply' ? '\u00d73 + 1' : '\u00f72'}
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
                                                {'4 → 2 → 1 loop'}
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Comparison bar chart */}
                    {showCompare && (
                        <div className="h-36 border-t border-white/10 px-6 py-3 bg-[#0a0e1a]/80">
                            <p className="text-xs text-white/40 mb-2">Sequence Length Comparison</p>
                            <div className="flex items-end gap-2 h-24">
                                {[...(inputValue ? [{ n: parseInt(inputValue), length: rawSequence.length }] : []), ...NOTABLE_NUMBERS].map(({ n, length }) => {
                                    const maxLen = Math.max(128, rawSequence.length)
                                    const isCurrentInput = n === parseInt(inputValue)
                                    return (
                                        <div key={n} className="flex flex-col items-center gap-1 flex-1">
                                            <span className="text-[10px] text-white/50 font-mono">{length}</span>
                                            <div
                                                className="w-full rounded-t transition-all duration-300"
                                                style={{
                                                    height: `${(length / maxLen) * 80}px`,
                                                    backgroundColor: isCurrentInput ? 'rgba(100, 149, 237, 0.6)' : 'rgba(100, 149, 237, 0.2)',
                                                    border: isCurrentInput ? '1px solid rgba(100, 149, 237, 0.8)' : 'none',
                                                }}
                                            />
                                            <span className={`text-[10px] font-mono ${isCurrentInput ? 'text-blue-400' : 'text-white/40'}`}>{n}</span>
                                        </div>
                                    )
                                })}
                                <div className="flex flex-col items-center gap-1 flex-1">
                                    <span className="text-[10px] text-white/50 font-mono">{compareSequence.length}</span>
                                    <div
                                        className="w-full rounded-t"
                                        style={{
                                            height: `${(compareSequence.length / Math.max(128, rawSequence.length)) * 80}px`,
                                            backgroundColor: 'rgba(251, 146, 60, 0.3)',
                                        }}
                                    />
                                    <span className="text-[10px] font-mono text-orange-400">{compareN}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="absolute top-4 left-4 space-y-3 w-64">
                        <APTag course="Mathematics" unit="Number Theory" color={MATH_COLOR} />
                        <EquationDisplay
                            departmentColor={MATH_COLOR}
                            title="Collatz Function"
                            equations={[
                                { label: 'Even', expression: 'f(n) = n / 2', description: 'Divide by 2' },
                                { label: 'Odd', expression: 'f(n) = 3n + 1', description: 'Multiply by 3, add 1' },
                                { label: 'Conjecture', expression: 'f^k(n) = 1 for all n > 0', description: 'Always reaches 1' },
                            ]}
                        />
                    </div>
                </div>

                <div className="w-60 bg-[#0a0e1a]/90 border-l border-white/10 p-4 flex flex-col gap-3 overflow-y-auto z-20">
                    <ControlPanel>
                        <ControlGroup label="Starting Number">
                            <input
                                type="number"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter number..."
                                className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/30"
                                disabled={isAnimating}
                            />
                        </ControlGroup>
                        <Slider label={`Speed: ${speed}ms`} value={1050 - speed} onChange={v => setSpeed(1050 - v)} min={50} max={1000} step={50} />
                        <Toggle label="Show Tree" value={showTree} onChange={setShowTree} />
                        <Toggle label="Show Comparison" value={showCompare} onChange={setShowCompare} />
                        {showCompare && (
                            <Slider label={`Compare: ${compareN}`} value={compareN} onChange={setCompareN} min={2} max={300} />
                        )}
                        <div className="flex gap-2">
                            <Button onClick={startVisualization} disabled={isAnimating || !inputValue}>
                                Start
                            </Button>
                            {isAnimating && (
                                <Button onClick={togglePause} variant="secondary">
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                            )}
                        </div>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                        <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                    </ControlPanel>

                    <InfoPanel
                        title="Sequence Data"
                        departmentColor={MATH_COLOR}
                        items={[
                            { label: 'Starting N', value: inputValue || '--' },
                            { label: 'Seq Length', value: rawSequence.length > 0 ? rawSequence.length : '--' },
                            { label: 'Max Value', value: maxValue > 0 ? maxValue : '--' },
                            { label: '3n+1 Steps', value: oddSteps > 0 ? oddSteps : '--' },
                            { label: 'n/2 Steps', value: evenSteps > 0 ? evenSteps : '--' },
                            { label: 'Progress', value: sequence.length > 0 ? `${visibleCount} / ${sequence.length}` : '--' },
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
                    departmentColor={MATH_COLOR}
                />
            </div>
        </div>
    )
}
