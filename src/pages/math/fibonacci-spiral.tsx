import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function FibonacciSpiral() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [count, setCount] = useState(10)
    const [isAnimating, setIsAnimating] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [speed, setSpeed] = useState(500)

    const fibonacci = (n: number): number[] => {
        const seq = [1, 1]
        for (let i = 2; i < n; i++) {
            seq.push(seq[i - 1] + seq[i - 2])
        }
        return seq.slice(0, n)
    }

    const startAnimation = () => {
        setCurrentStep(0)
        setIsAnimating(true)
    }

    const reset = () => {
        setIsAnimating(false)
        setCurrentStep(0)
    }

    useEffect(() => {
        if (!isAnimating || currentStep >= count) {
            if (currentStep >= count) setIsAnimating(false)
            return
        }

        const timer = setTimeout(() => {
            setCurrentStep(prev => prev + 1)
        }, speed)

        return () => clearTimeout(timer)
    }, [isAnimating, currentStep, count, speed])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        ctx.clearRect(0, 0, rect.width, rect.height)

        const fib = fibonacci(count)
        const scale = Math.min(rect.width, rect.height) / (fib[count - 1] * 2.5)

        // Center offset
        let totalWidth = 0
        let totalHeight = 0
        fib.slice(0, currentStep).forEach((size, i) => {
            const dir = i % 4
            if (dir === 0 || dir === 2) totalWidth += size * scale
            else totalHeight += size * scale
        })

        const offsetX = rect.width / 2
        const offsetY = rect.height / 2

        let x = offsetX
        let y = offsetY

        // Draw squares and spiral
        ctx.lineWidth = 2

        fib.slice(0, currentStep).forEach((size, i) => {
            const scaledSize = size * scale
            const direction = i % 4 // 0: right, 1: down, 2: left, 3: up

            // Calculate position based on direction
            if (i > 0) {
                const prevSize = fib[i - 1] * scale
                switch ((i - 1) % 4) {
                    case 0: x += prevSize; break
                    case 1: y += prevSize; break
                    case 2: x -= scaledSize; break
                    case 3: y -= scaledSize; break
                }
            }

            // Draw square
            ctx.strokeStyle = i === currentStep - 1
                ? 'rgba(100, 140, 255, 0.6)'
                : 'rgba(100, 140, 255, 0.2)'
            ctx.strokeRect(x, y, scaledSize, scaledSize)

            // Draw number
            ctx.fillStyle = 'rgba(100, 140, 255, 0.4)'
            ctx.font = `${Math.max(10, scaledSize / 4)}px monospace`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(size.toString(), x + scaledSize / 2, y + scaledSize / 2)

            // Draw arc (quarter spiral)
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)'
            ctx.lineWidth = 2
            ctx.beginPath()

            let arcX, arcY, startAngle, endAngle
            switch (direction) {
                case 0:
                    arcX = x + scaledSize
                    arcY = y + scaledSize
                    startAngle = Math.PI
                    endAngle = Math.PI * 1.5
                    break
                case 1:
                    arcX = x
                    arcY = y + scaledSize
                    startAngle = Math.PI * 1.5
                    endAngle = Math.PI * 2
                    break
                case 2:
                    arcX = x
                    arcY = y
                    startAngle = 0
                    endAngle = Math.PI * 0.5
                    break
                case 3:
                    arcX = x + scaledSize
                    arcY = y
                    startAngle = Math.PI * 0.5
                    endAngle = Math.PI
                    break
                default:
                    arcX = x
                    arcY = y
                    startAngle = 0
                    endAngle = Math.PI * 0.5
            }

            ctx.arc(arcX, arcY, scaledSize, startAngle, endAngle)
            ctx.stroke()
        })

    }, [currentStep, count])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    style={{ background: 'transparent' }}
                />

                {currentStep === 0 && !isAnimating && (
                    <div className="absolute inset-0 flex items-center justify-center text-text-dim">
                        Configure and start to visualize the Fibonacci spiral
                    </div>
                )}

                {currentStep > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-4 right-4 bg-bg-elevated/80 backdrop-blur-sm rounded-lg px-4 py-2 font-mono text-sm"
                    >
                        <span className="text-text-muted">φ ≈ </span>
                        <span className="text-accent-coral">
                            {currentStep >= 2
                                ? (fibonacci(count)[currentStep - 1] / fibonacci(count)[currentStep - 2]).toFixed(6)
                                : '—'
                            }
                        </span>
                    </motion.div>
                )}
            </div>

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={startAnimation}
                            disabled={isAnimating}
                            className="btn-primary disabled:opacity-30"
                        >
                            {isAnimating ? 'Drawing...' : 'Start'}
                        </button>
                        <button onClick={reset} className="btn-ghost">
                            Reset
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Squares</span>
                            <input
                                type="range"
                                min={3}
                                max={15}
                                value={count}
                                onChange={e => { setCount(+e.target.value); reset() }}
                                className="w-24 accent-text"
                                disabled={isAnimating}
                            />
                            <span className="text-text-muted text-xs font-mono w-6">{count}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Speed</span>
                            <input
                                type="range"
                                min={100}
                                max={1000}
                                step={100}
                                value={1100 - speed}
                                onChange={e => setSpeed(1100 - +e.target.value)}
                                className="w-24 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono w-16">{speed}ms</span>
                        </div>

                        <div className="text-text-muted text-sm">
                            Step {currentStep} / {count}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
