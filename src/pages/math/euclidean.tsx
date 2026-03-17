import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { gcd } from '@/lib/utils'
import { ControlPanel, ControlGroup, Slider, Button } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

interface Step {
    a: number
    b: number
    q: number
    r: number
}

const MATH_BLUE = 'rgb(100, 140, 255)'

function extendedGcd(a: number, b: number): { x: number; y: number } {
    if (b === 0) return { x: 1, y: 0 }
    const { x: x1, y: y1 } = extendedGcd(b, a % b)
    return { x: y1, y: x1 - Math.floor(a / b) * y1 }
}

export default function Euclidean() {
    const [numA, setNumA] = useState(252)
    const [numB, setNumB] = useState(105)
    const [steps, setSteps] = useState<Step[]>([])
    const [result, setResult] = useState<number | null>(null)
    const [visibleCount, setVisibleCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [speed, setSpeed] = useState(800)
    const pauseRef = useRef(false)

    useEffect(() => { pauseRef.current = isPaused }, [isPaused])

    const start = useCallback(() => {
        if (!numA || !numB || numA < 1 || numB < 1) return
        const { steps: s, result: r } = gcd(numA, numB)
        setSteps(s)
        setResult(r)
        setVisibleCount(0)
        setIsAnimating(true)
        setIsPaused(false)
    }, [numA, numB])

    useEffect(() => {
        if (!isAnimating || isPaused || visibleCount >= steps.length) {
            if (visibleCount >= steps.length && steps.length > 0) setIsAnimating(false)
            return
        }
        const timer = setTimeout(() => setVisibleCount(prev => prev + 1), speed)
        return () => clearTimeout(timer)
    }, [isAnimating, isPaused, visibleCount, steps.length, speed])

    const reset = useCallback(() => {
        setNumA(252)
        setNumB(105)
        setSteps([])
        setResult(null)
        setVisibleCount(0)
        setIsAnimating(false)
        setIsPaused(false)
    }, [])

    const togglePause = () => setIsPaused(!isPaused)

    const bezout = useMemo(() => {
        if (result === null || steps.length === 0) return null
        return extendedGcd(steps[0].a, steps[0].b)
    }, [result, steps])

    const quotients = useMemo(() => {
        return steps.slice(0, visibleCount).map(s => s.q).join(', ')
    }, [steps, visibleCount])

    const setupExample = useCallback((a: number, b: number) => {
        setNumA(a)
        setNumB(b)
        const { steps: s, result: r } = gcd(a, b)
        setSteps(s)
        setResult(r)
        setVisibleCount(s.length)
        setIsAnimating(false)
        setIsPaused(false)
    }, [])

    const demoSteps: DemoStep[] = useMemo(() => [
        {
            title: 'What is GCD?',
            description: 'The Greatest Common Divisor of two integers is the largest positive integer that divides both without a remainder. For example, gcd(12, 8) = 4.',
            setup: () => setupExample(12, 8),
        },
        {
            title: 'Division Algorithm',
            description: 'Every integer division can be written as a = b x q + r, where q is the quotient and r is the remainder (0 <= r < b). This is the foundation of the Euclidean algorithm.',
            setup: () => setupExample(252, 105),
        },
        {
            title: 'Euclidean Algorithm',
            description: 'Key insight: gcd(a, b) = gcd(b, a mod b). We repeatedly replace (a, b) with (b, r) until the remainder is 0. The last non-zero remainder is the GCD.',
            setup: () => setupExample(252, 105),
        },
        {
            title: 'Step-Through Example',
            description: '252 = 105 x 2 + 42, then 105 = 42 x 2 + 21, then 42 = 21 x 2 + 0. The remainder hit 0, so gcd(252, 105) = 21. Only 3 steps!',
            setup: () => setupExample(252, 105),
        },
        {
            title: 'Geometric Interpretation',
            description: 'Geometrically, finding gcd(a, b) is like tiling a rectangle of size a x b with the largest possible square. The side length of that square is the GCD.',
            setup: () => setupExample(48, 18),
        },
        {
            title: 'Extended Algorithm',
            description: 'The Extended Euclidean Algorithm works backwards through the steps to find integers x and y such that ax + by = gcd(a, b). Check the Bezout coefficients in the info panel.',
            setup: () => setupExample(252, 105),
        },
        {
            title: "Bezout's Identity",
            description: 'For any integers a, b there exist integers x, y such that ax + by = gcd(a, b). For 252 and 105: 252(1) + 105(-2) = 42... This identity is central to number theory.',
            setup: () => setupExample(35, 15),
        },
        {
            title: 'Applications',
            description: 'The Euclidean algorithm is used in RSA encryption (modular inverses), simplifying fractions, solving Diophantine equations, and computing continued fractions. Try your own numbers!',
            setup: () => reset(),
        },
    ], [setupExample, reset])

    const demo = useDemoMode(demoSteps)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 relative overflow-auto">
                {/* Main visualization area */}
                <div className="flex items-center justify-center h-full px-8 py-12">
                    <div className="max-w-2xl w-full">
                        {steps.length === 0 ? (
                            <div className="text-center text-text-dim">
                                Enter two numbers to find their Greatest Common Divisor
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {steps.slice(0, visibleCount).map((step, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="font-mono text-2xl md:text-3xl flex items-center gap-3 flex-wrap"
                                    >
                                        <span>{step.a}</span>
                                        <span className="text-text-dim">=</span>
                                        <span>{step.b}</span>
                                        <span className="text-text-dim">x</span>
                                        <span className="text-text-muted">{step.q}</span>
                                        <span className="text-text-dim">+</span>
                                        <span className={step.r === 0 ? 'text-accent-teal font-bold' : 'text-accent-coral'}>
                                            {step.r}
                                        </span>
                                    </motion.div>
                                ))}

                                {!isAnimating && result !== null && visibleCount >= steps.length && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-12 pt-8 border-t border-border text-center"
                                    >
                                        <p className="text-text-muted mb-2">Greatest Common Divisor</p>
                                        <p className="text-6xl font-mono text-accent-teal">{result}</p>
                                        {bezout && (
                                            <p className="text-text-dim mt-4 font-mono text-sm">
                                                {steps[0].a}({bezout.x}) + {steps[0].b}({bezout.y}) = {result}
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls — top left */}
                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Number A">
                            <input
                                type="number"
                                value={numA}
                                onChange={e => setNumA(Math.max(1, parseInt(e.target.value) || 1))}
                                min={1}
                                max={999999}
                                className="control-input w-full text-center"
                                disabled={isAnimating}
                            />
                        </ControlGroup>
                        <ControlGroup label="Number B">
                            <input
                                type="number"
                                value={numB}
                                onChange={e => setNumB(Math.max(1, parseInt(e.target.value) || 1))}
                                min={1}
                                max={999999}
                                className="control-input w-full text-center"
                                disabled={isAnimating}
                            />
                        </ControlGroup>
                        <Slider label="Speed (ms)" value={speed} onChange={setSpeed} min={200} max={2000} step={100} />
                        <div className="flex gap-2 flex-wrap">
                            <Button onClick={start} disabled={isAnimating || !numA || !numB}>Calculate</Button>
                            {isAnimating && (
                                <Button onClick={togglePause} variant="secondary">
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={reset} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Mathematics" unit="Number Theory" color={MATH_BLUE} />
                </div>

                {/* Info + Equations — top right */}
                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={MATH_BLUE} title="Algorithm State" items={[
                        { label: 'GCD Result', value: result !== null ? String(result) : '--', color: 'rgba(80,200,180,1)' },
                        { label: 'Steps', value: steps.length > 0 ? `${visibleCount} / ${steps.length}` : '--', color: 'rgba(200,200,200,1)' },
                        { label: 'Quotients', value: quotients || '--', color: 'rgba(180,160,255,1)' },
                        { label: 'Bezout (x, y)', value: bezout ? `(${bezout.x}, ${bezout.y})` : '--', color: MATH_BLUE },
                    ]} />
                    <EquationDisplay departmentColor={MATH_BLUE} title="Key Equations" collapsed equations={[
                        { label: 'Euclidean', expression: 'gcd(a,b) = gcd(b, a mod b)', description: 'Euclidean algorithm' },
                        { label: 'Bezout', expression: 'ax + by = gcd(a,b)', description: "Bezout's identity" },
                    ]} />
                </div>

                {/* Demo — bottom center */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode
                        steps={demoSteps}
                        currentStep={demo.currentStep}
                        isOpen={demo.isOpen}
                        onClose={demo.close}
                        onNext={demo.next}
                        onPrev={demo.prev}
                        onGoToStep={demo.goToStep}
                        departmentColor={MATH_BLUE}
                    />
                </div>
            </div>
        </div>
    )
}
