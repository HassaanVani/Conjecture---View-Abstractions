import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Point {
    x: number
    y: number
}

type DemoStep = 'intro' | 'efficient' | 'inefficient' | 'unattainable' | 'opportunity-cost' | 'growth' | 'done'

const DEMO_STEPS: { step: DemoStep; title: string; description: string; action?: () => Point | number }[] = [
    {
        step: 'intro',
        title: 'Production Possibilities Curve',
        description: 'The PPC shows all possible combinations of two goods an economy can produce with its available resources. Points ON the curve are efficient - using all resources fully.',
    },
    {
        step: 'efficient',
        title: 'Efficient Production',
        description: 'This point is ON the curve - the economy is using all its resources efficiently. Click anywhere on the curve to produce at full capacity.',
    },
    {
        step: 'inefficient',
        title: 'Inefficient Production',
        description: 'Points INSIDE the curve mean some resources are unemployed or underutilized - like during a recession. The economy could produce more!',
    },
    {
        step: 'unattainable',
        title: 'Unattainable Points',
        description: 'Points OUTSIDE the curve are impossible with current resources and technology. We simply cannot produce this much... yet.',
    },
    {
        step: 'opportunity-cost',
        title: 'Opportunity Cost',
        description: 'Moving along the curve shows trade-offs. To get more of one good, you must give up some of the other. Notice how the cost INCREASES as you specialize more (the curve bows outward).',
    },
    {
        step: 'growth',
        title: 'Economic Growth',
        description: 'When the economy grows (more resources, better technology), the entire curve shifts outward. Previously unattainable points become possible!',
    },
    {
        step: 'done',
        title: 'Try It Yourself!',
        description: 'Click anywhere on the graph to move your production point. Use the slider to simulate economic growth or recession. Watch how opportunity cost changes as you move along the curve.',
    },
]

export default function ProductionPossibilities() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [curvePoints, setCurvePoints] = useState<Point[]>([])
    const [selectedPoint, setSelectedPoint] = useState<Point>({ x: 60, y: 60 })
    const [shiftFactor, setShiftFactor] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [showDemo, setShowDemo] = useState(false)
    const [demoStepIndex, setDemoStepIndex] = useState(0)
    const [goodA] = useState('Consumer Goods')
    const [goodB] = useState('Capital Goods')

    // Generate PPC curve points (concave from origin - increasing opportunity cost)
    const generateCurve = useCallback((shift: number) => {
        const points: Point[] = []
        const scale = 1 + shift * 0.3
        for (let t = 0; t <= 1; t += 0.01) {
            // Using a proper concave function for increasing opportunity cost
            const angle = (Math.PI / 2) * t
            const x = Math.cos(angle) * 100 * scale
            const y = Math.sin(angle) * 100 * scale
            if (x >= 0 && y >= 0 && x <= 100 && y <= 100) {
                points.push({ x, y })
            }
        }
        return points
    }, [])

    useEffect(() => {
        setCurvePoints(generateCurve(shiftFactor))
    }, [shiftFactor, generateCurve])

    // Find closest point on curve to given position
    const getClosestCurvePoint = useCallback((targetX: number, targetY: number): Point => {
        if (curvePoints.length === 0) return { x: 50, y: 50 }

        let closest = curvePoints[0]
        let minDist = Infinity

        for (const p of curvePoints) {
            const dist = Math.sqrt(Math.pow(p.x - targetX, 2) + Math.pow(p.y - targetY, 2))
            if (dist < minDist) {
                minDist = dist
                closest = p
            }
        }
        return closest
    }, [curvePoints])

    // Calculate opportunity cost at current point
    const getOpportunityCost = useCallback(() => {
        const closest = getClosestCurvePoint(selectedPoint.x, selectedPoint.y)

        // Find the slope at this point on the curve
        const idx = curvePoints.findIndex(p => p.x === closest.x && p.y === closest.y)
        if (idx <= 0 || idx >= curvePoints.length - 1) return { costA: 0, costB: 0 }

        const p1 = curvePoints[idx - 1]
        const p2 = curvePoints[idx + 1]

        const deltaY = p2.y - p1.y
        const deltaX = p2.x - p1.x

        if (Math.abs(deltaX) < 0.01) return { costA: Infinity, costB: 0 }
        if (Math.abs(deltaY) < 0.01) return { costA: 0, costB: Infinity }

        const slope = Math.abs(deltaY / deltaX)
        return {
            costA: slope.toFixed(2),
            costB: (1 / slope).toFixed(2),
        }
    }, [curvePoints, selectedPoint, getClosestCurvePoint])

    // Determine point classification
    const getPointStatus = useCallback(() => {
        if (curvePoints.length === 0) return 'loading'

        const closest = getClosestCurvePoint(selectedPoint.x, selectedPoint.y)
        const distToCurve = Math.sqrt(
            Math.pow(selectedPoint.x - closest.x, 2) +
            Math.pow(selectedPoint.y - closest.y, 2)
        )

        // Check if point is on curve (within threshold)
        if (distToCurve < 4) return 'efficient'

        // Check if inside or outside curve
        // A point is inside if moving toward origin would keep it inside the curve
        const originDist = Math.sqrt(selectedPoint.x * selectedPoint.x + selectedPoint.y * selectedPoint.y)
        const closestOriginDist = Math.sqrt(closest.x * closest.x + closest.y * closest.y)

        if (originDist < closestOriginDist - 2) return 'inefficient'
        return 'unattainable'
    }, [curvePoints, selectedPoint, getClosestCurvePoint])

    // Demo step actions
    useEffect(() => {
        if (!showDemo) return

        const currentStep = DEMO_STEPS[demoStepIndex]

        switch (currentStep.step) {
            case 'efficient': {
                const closest = getClosestCurvePoint(70, 70)
                setSelectedPoint(closest)
                break
            }
            case 'inefficient':
                setSelectedPoint({ x: 40, y: 40 })
                break
            case 'unattainable':
                setSelectedPoint({ x: 85, y: 85 })
                break
            case 'opportunity-cost': {
                const closest = getClosestCurvePoint(30, 95)
                setSelectedPoint(closest)
                break
            }
            case 'growth':
                setShiftFactor(0.5)
                break
            case 'done':
                setShiftFactor(0)
                setSelectedPoint({ x: 60, y: 60 })
                break
        }
    }, [showDemo, demoStepIndex, getClosestCurvePoint])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        const width = canvas.offsetWidth
        const height = canvas.offsetHeight
        const padding = 80
        const graphSize = Math.min(width - padding * 2, height - padding * 2 - 60)
        const originX = padding
        const originY = height - padding - 40

        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, width, height)

        const toCanvasX = (x: number) => originX + (x / 100) * graphSize
        const toCanvasY = (y: number) => originY - (y / 100) * graphSize

        // Draw grid
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.08)'
        ctx.lineWidth = 1
        for (let i = 0; i <= 100; i += 10) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(i), toCanvasY(0))
            ctx.lineTo(toCanvasX(i), toCanvasY(100))
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), toCanvasY(i))
            ctx.lineTo(toCanvasX(100), toCanvasY(i))
            ctx.stroke()
        }

        // Draw axes
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.6)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(originX, toCanvasY(100))
        ctx.lineTo(originX, originY)
        ctx.lineTo(toCanvasX(100), originY)
        ctx.stroke()

        // Arrow heads
        ctx.fillStyle = 'rgba(220, 180, 80, 0.6)'
        ctx.beginPath()
        ctx.moveTo(originX, toCanvasY(100))
        ctx.lineTo(originX - 6, toCanvasY(100) + 10)
        ctx.lineTo(originX + 6, toCanvasY(100) + 10)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(toCanvasX(100), originY)
        ctx.lineTo(toCanvasX(100) - 10, originY - 6)
        ctx.lineTo(toCanvasX(100) - 10, originY + 6)
        ctx.fill()

        // Axis labels
        ctx.fillStyle = 'rgba(220, 180, 80, 0.8)'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(goodA, originX + graphSize / 2, originY + 35)

        ctx.save()
        ctx.translate(originX - 45, originY - graphSize / 2)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(goodB, 0, 0)
        ctx.restore()

        // Shade the attainable region
        if (curvePoints.length > 1) {
            ctx.fillStyle = 'rgba(220, 180, 80, 0.04)'
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), toCanvasY(0))
            ctx.lineTo(toCanvasX(0), toCanvasY(curvePoints[0].y))
            curvePoints.forEach((p) => {
                ctx.lineTo(toCanvasX(p.x), toCanvasY(p.y))
            })
            ctx.lineTo(toCanvasX(curvePoints[curvePoints.length - 1].x), toCanvasY(0))
            ctx.closePath()
            ctx.fill()
        }

        // Draw the PPC curve with gradient
        if (curvePoints.length > 1) {
            const gradient = ctx.createLinearGradient(toCanvasX(0), toCanvasY(100), toCanvasX(100), toCanvasY(0))
            gradient.addColorStop(0, 'rgba(100, 200, 150, 0.9)')
            gradient.addColorStop(0.5, 'rgba(220, 180, 80, 0.9)')
            gradient.addColorStop(1, 'rgba(255, 150, 100, 0.9)')

            ctx.strokeStyle = gradient
            ctx.lineWidth = 4
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            curvePoints.forEach((p, i) => {
                const x = toCanvasX(p.x)
                const y = toCanvasY(p.y)
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            })
            ctx.stroke()

            // PPC label
            ctx.fillStyle = 'rgba(220, 180, 80, 0.9)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'left'
            const labelPoint = curvePoints[Math.floor(curvePoints.length * 0.7)]
            if (labelPoint) {
                ctx.fillText('PPC', toCanvasX(labelPoint.x) + 15, toCanvasY(labelPoint.y) - 10)
            }
        }

        // Draw selected point
        const status = getPointStatus()
        let pointColor = 'rgba(220, 180, 80, 0.9)'
        let statusLabel = ''
        if (status === 'efficient') {
            pointColor = 'rgba(80, 220, 140, 1)'
            statusLabel = 'Efficient'
        } else if (status === 'inefficient') {
            pointColor = 'rgba(255, 180, 80, 1)'
            statusLabel = 'Inefficient'
        } else if (status === 'unattainable') {
            pointColor = 'rgba(255, 100, 100, 1)'
            statusLabel = 'Unattainable'
        }

        const px = toCanvasX(selectedPoint.x)
        const py = toCanvasY(selectedPoint.y)

        // Glow effect
        const glowGradient = ctx.createRadialGradient(px, py, 0, px, py, 30)
        glowGradient.addColorStop(0, pointColor.replace('1)', '0.4)').replace('0.9)', '0.4)'))
        glowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(px, py, 30, 0, Math.PI * 2)
        ctx.fill()

        // Dashed lines to axes
        ctx.strokeStyle = pointColor.replace('1)', '0.5)').replace('0.9)', '0.5)')
        ctx.lineWidth = 1.5
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px, originY)
        ctx.moveTo(px, py)
        ctx.lineTo(originX, py)
        ctx.stroke()
        ctx.setLineDash([])

        // Point
        ctx.fillStyle = pointColor
        ctx.beginPath()
        ctx.arc(px, py, 12, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Point coordinates label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = 'bold 12px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(
            `(${selectedPoint.x.toFixed(0)}, ${selectedPoint.y.toFixed(0)})`,
            px,
            py - 22
        )

        // Status badge
        ctx.fillStyle = pointColor
        ctx.font = '11px system-ui'
        ctx.fillText(statusLabel, px, py + 28)

        // Axis value labels
        ctx.fillStyle = 'rgba(220, 180, 80, 0.7)'
        ctx.font = '11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(selectedPoint.x.toFixed(0), px, originY + 15)
        ctx.textAlign = 'right'
        ctx.fillText(selectedPoint.y.toFixed(0), originX - 8, py + 4)

        // Legend
        ctx.textAlign = 'left'
        ctx.font = '11px system-ui'
        const legendX = width - 170
        let legendY = 25

        const legendItems = [
            { color: 'rgba(80, 220, 140, 1)', label: 'Efficient (on curve)' },
            { color: 'rgba(255, 180, 80, 1)', label: 'Inefficient (inside)' },
            { color: 'rgba(255, 100, 100, 1)', label: 'Unattainable (outside)' },
        ]

        legendItems.forEach(item => {
            ctx.fillStyle = item.color
            ctx.beginPath()
            ctx.arc(legendX + 6, legendY, 5, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.fillText(item.label, legendX + 18, legendY + 4)
            legendY += 22
        })

        return () => window.removeEventListener('resize', resize)
    }, [curvePoints, selectedPoint, goodA, goodB, getPointStatus])

    const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const width = canvas.offsetWidth
        const height = canvas.offsetHeight
        const padding = 80
        const graphSize = Math.min(width - padding * 2, height - padding * 2 - 60)

        let clientX: number, clientY: number
        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        const clickX = clientX - rect.left
        const clickY = clientY - rect.top
        const originY = height - padding - 40

        const x = ((clickX - padding) / graphSize) * 100
        const y = ((originY - clickY) / graphSize) * 100

        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
            setSelectedPoint({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
        }
    }

    const snapToEfficient = () => {
        const closest = getClosestCurvePoint(selectedPoint.x, selectedPoint.y)
        setSelectedPoint(closest)
    }

    const status = getPointStatus()
    const costs = getOpportunityCost()
    const currentDemoStep = DEMO_STEPS[demoStepIndex]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair"
                    onClick={handleCanvasInteraction}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onMouseMove={(e) => isDragging && handleCanvasInteraction(e)}
                    onTouchStart={(e) => { setIsDragging(true); handleCanvasInteraction(e) }}
                    onTouchMove={(e) => isDragging && handleCanvasInteraction(e)}
                    onTouchEnd={() => setIsDragging(false)}
                />

                {/* Status panel */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 left-4 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-xs"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-white/60">Production Point</span>
                        <button
                            onClick={() => setShowDemo(true)}
                            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            Learn
                        </button>
                    </div>

                    <div className="font-mono text-xl mb-3 flex items-center gap-3">
                        <div>
                            <span className="text-yellow-400">{selectedPoint.x.toFixed(0)}</span>
                            <span className="text-white/40 text-sm ml-1">{goodA.split(' ')[0]}</span>
                        </div>
                        <span className="text-white/20">|</span>
                        <div>
                            <span className="text-yellow-400">{selectedPoint.y.toFixed(0)}</span>
                            <span className="text-white/40 text-sm ml-1">{goodB.split(' ')[0]}</span>
                        </div>
                    </div>

                    <div className={`text-sm font-medium mb-4 flex items-center gap-2 ${status === 'efficient' ? 'text-green-400' :
                            status === 'inefficient' ? 'text-orange-400' :
                                status === 'unattainable' ? 'text-red-400' : 'text-white/40'
                        }`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        {status === 'efficient' && 'Efficient — on the frontier'}
                        {status === 'inefficient' && 'Inefficient — resources underutilized'}
                        {status === 'unattainable' && 'Unattainable — beyond current capacity'}
                    </div>

                    <div className="border-t border-white/10 pt-3">
                        <div className="text-xs text-white/50 mb-1">Opportunity Cost</div>
                        <div className="text-sm text-white/80">
                            1 {goodA.split(' ')[0]} = <span className="text-yellow-400 font-mono">{costs.costA}</span> {goodB.split(' ')[0]}
                        </div>
                        <div className="text-sm text-white/80">
                            1 {goodB.split(' ')[0]} = <span className="text-yellow-400 font-mono">{costs.costB}</span> {goodA.split(' ')[0]}
                        </div>
                    </div>
                </motion.div>

                {/* Hint */}
                <div className="absolute top-4 right-4 text-xs text-white/40 max-w-xs text-right">
                    Click & drag to move the production point
                </div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm">Economic Growth</span>
                            <input
                                type="range"
                                min={-1}
                                max={1}
                                step={0.05}
                                value={shiftFactor}
                                onChange={e => setShiftFactor(+e.target.value)}
                                className="w-32 accent-yellow-400"
                            />
                            <span className={`text-xs font-mono w-12 ${shiftFactor > 0 ? 'text-green-400' :
                                    shiftFactor < 0 ? 'text-red-400' : 'text-white/50'
                                }`}>
                                {shiftFactor > 0 ? `+${(shiftFactor * 30).toFixed(0)}%` :
                                    shiftFactor < 0 ? `${(shiftFactor * 30).toFixed(0)}%` : '0%'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={snapToEfficient}
                            className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                        >
                            Snap to Curve
                        </button>
                        <button
                            onClick={() => { setSelectedPoint({ x: 50, y: 50 }); setShiftFactor(0) }}
                            className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Demo Modal */}
            <AnimatePresence>
                {showDemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowDemo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a150a] border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs text-white/40">
                                    Step {demoStepIndex + 1} of {DEMO_STEPS.length}
                                </span>
                                <button
                                    onClick={() => { setShowDemo(false); setDemoStepIndex(0) }}
                                    className="text-white/40 hover:text-white text-xl"
                                >
                                    ×
                                </button>
                            </div>

                            <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                                {currentDemoStep.title}
                            </h3>
                            <p className="text-white/70 mb-6 leading-relaxed">
                                {currentDemoStep.description}
                            </p>

                            {/* Progress dots */}
                            <div className="flex justify-center gap-2 mb-6">
                                {DEMO_STEPS.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setDemoStepIndex(i)}
                                        className={`w-2 h-2 rounded-full transition-colors ${i === demoStepIndex ? 'bg-yellow-400' : 'bg-white/20 hover:bg-white/40'
                                            }`}
                                    />
                                ))}
                            </div>

                            <div className="flex justify-between gap-3">
                                <button
                                    onClick={() => setDemoStepIndex(Math.max(0, demoStepIndex - 1))}
                                    disabled={demoStepIndex === 0}
                                    className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Previous
                                </button>
                                {demoStepIndex < DEMO_STEPS.length - 1 ? (
                                    <button
                                        onClick={() => setDemoStepIndex(demoStepIndex + 1)}
                                        className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                                    >
                                        Next →
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setShowDemo(false); setDemoStepIndex(0) }}
                                        className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                    >
                                        Start Exploring ✓
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
