import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Phase = 'interphase' | 'prophase' | 'metaphase' | 'anaphase' | 'telophase'

const phases: { id: Phase; name: string; description: string }[] = [
    { id: 'interphase', name: 'Interphase', description: 'Cell grows and DNA replicates' },
    { id: 'prophase', name: 'Prophase', description: 'Chromosomes condense and become visible' },
    { id: 'metaphase', name: 'Metaphase', description: 'Chromosomes align at the cell equator' },
    { id: 'anaphase', name: 'Anaphase', description: 'Sister chromatids separate and move apart' },
    { id: 'telophase', name: 'Telophase', description: 'Nuclear envelopes reform, cytokinesis begins' },
]

export default function CellDivision() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [currentPhase, setCurrentPhase] = useState<Phase>('interphase')
    const [isAnimating, setIsAnimating] = useState(false)
    const [progress, setProgress] = useState(0)
    const [speed, setSpeed] = useState(50)

    const startCycle = () => {
        setCurrentPhase('interphase')
        setProgress(0)
        setIsAnimating(true)
    }

    const reset = () => {
        setIsAnimating(false)
        setCurrentPhase('interphase')
        setProgress(0)
    }

    useEffect(() => {
        if (!isAnimating) return

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + 1
                if (next >= 100) {
                    const phaseIndex = phases.findIndex(p => p.id === currentPhase)
                    if (phaseIndex < phases.length - 1) {
                        setCurrentPhase(phases[phaseIndex + 1].id)
                        return 0
                    } else {
                        setIsAnimating(false)
                        return 100
                    }
                }
                return next
            })
        }, speed)

        return () => clearInterval(timer)
    }, [isAnimating, currentPhase, speed])

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
        const centerX = width / 2
        const centerY = height / 2
        const cellRadius = Math.min(width, height) * 0.25

        ctx.clearRect(0, 0, width, height)

        // Draw based on phase
        const p = progress / 100

        if (currentPhase === 'interphase') {
            // Single round cell with nucleus
            drawCell(ctx, centerX, centerY, cellRadius, 1)
            drawNucleus(ctx, centerX, centerY, cellRadius * 0.5, 1)

            // DNA replication indicator
            if (p > 0.3) {
                ctx.fillStyle = `rgba(80, 200, 120, ${(p - 0.3) * 0.5})`
                ctx.font = '14px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('DNA Replicating...', centerX, centerY + cellRadius + 40)
            }
        } else if (currentPhase === 'prophase') {
            drawCell(ctx, centerX, centerY, cellRadius, 1)

            // Nucleus dissolving
            drawNucleus(ctx, centerX, centerY, cellRadius * 0.5 * (1 - p * 0.5), 1 - p * 0.7)

            // Chromosomes appearing
            drawChromosomes(ctx, centerX, centerY, cellRadius * 0.4, p, 'condensing')
        } else if (currentPhase === 'metaphase') {
            drawCell(ctx, centerX, centerY, cellRadius, 1)

            // Spindle fibers
            drawSpindleFibers(ctx, centerX, centerY, cellRadius, p)

            // Chromosomes aligned at center
            drawChromosomes(ctx, centerX, centerY, cellRadius * 0.3, 1, 'aligned')
        } else if (currentPhase === 'anaphase') {
            drawCell(ctx, centerX, centerY, cellRadius * (1 + p * 0.3), 1)

            // Spindle fibers pulling
            drawSpindleFibers(ctx, centerX, centerY, cellRadius, 1)

            // Chromosomes separating
            const separation = p * cellRadius * 0.6
            drawChromosomes(ctx, centerX - separation, centerY, cellRadius * 0.25, 1, 'separated')
            drawChromosomes(ctx, centerX + separation, centerY, cellRadius * 0.25, 1, 'separated')
        } else if (currentPhase === 'telophase') {
            // Cell pinching (cytokinesis)
            const pinch = p * 0.4

            // Left daughter cell
            const leftX = centerX - cellRadius * 0.5 * (1 + p)
            const rightX = centerX + cellRadius * 0.5 * (1 + p)

            drawCell(ctx, leftX, centerY, cellRadius * (0.8 - pinch * 0.3), 1)
            drawCell(ctx, rightX, centerY, cellRadius * (0.8 - pinch * 0.3), 1)

            // New nuclei forming
            if (p > 0.3) {
                const nucleusOpacity = (p - 0.3) / 0.7
                drawNucleus(ctx, leftX, centerY, cellRadius * 0.3, nucleusOpacity)
                drawNucleus(ctx, rightX, centerY, cellRadius * 0.3, nucleusOpacity)
            }

            // Cleavage furrow
            if (p < 0.8) {
                ctx.strokeStyle = `rgba(80, 200, 120, ${0.5 - p * 0.5})`
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(centerX, centerY - cellRadius * 0.5)
                ctx.lineTo(centerX, centerY + cellRadius * 0.5)
                ctx.stroke()
            }
        }

        function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, opacity: number) {
            // Cell membrane
            ctx.strokeStyle = `rgba(80, 200, 120, ${0.6 * opacity})`
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.stroke()

            // Cell fill
            ctx.fillStyle = `rgba(80, 200, 120, ${0.08 * opacity})`
            ctx.fill()
        }

        function drawNucleus(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, opacity: number) {
            ctx.strokeStyle = `rgba(120, 180, 140, ${0.5 * opacity})`
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.stroke()

            ctx.fillStyle = `rgba(100, 160, 120, ${0.15 * opacity})`
            ctx.fill()
        }

        function drawChromosomes(ctx: CanvasRenderingContext2D, x: number, y: number, spread: number, opacity: number, state: string) {
            const chromosomeCount = 4
            ctx.strokeStyle = `rgba(200, 120, 80, ${0.8 * opacity})`
            ctx.lineWidth = 4
            ctx.lineCap = 'round'

            for (let i = 0; i < chromosomeCount; i++) {
                const angle = (i / chromosomeCount) * Math.PI * 2
                let cx, cy

                if (state === 'condensing') {
                    cx = x + Math.cos(angle) * spread * opacity
                    cy = y + Math.sin(angle) * spread * opacity * 0.5
                } else if (state === 'aligned') {
                    cx = x
                    cy = y + (i - chromosomeCount / 2 + 0.5) * 20
                } else {
                    cx = x + Math.cos(angle) * spread * 0.5
                    cy = y + Math.sin(angle) * spread * 0.5
                }

                // X-shaped chromosome
                ctx.beginPath()
                ctx.moveTo(cx - 8, cy - 8)
                ctx.lineTo(cx + 8, cy + 8)
                ctx.moveTo(cx + 8, cy - 8)
                ctx.lineTo(cx - 8, cy + 8)
                ctx.stroke()
            }
        }

        function drawSpindleFibers(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, opacity: number) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * opacity})`
            ctx.lineWidth = 1

            const fibers = 12
            for (let i = 0; i < fibers; i++) {
                const angle = (i / fibers) * Math.PI - Math.PI / 2
                const endY = y + Math.sin(angle) * radius * 0.3

                ctx.beginPath()
                ctx.moveTo(x - radius, y)
                ctx.quadraticCurveTo(x, endY, x + radius, y)
                ctx.stroke()
            }
        }

        return () => window.removeEventListener('resize', resize)
    }, [currentPhase, progress])

    const phaseInfo = phases.find(p => p.id === currentPhase)!

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Phase indicator */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPhase}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-6 left-1/2 -translate-x-1/2 text-center"
                    >
                        <h3 className="text-2xl font-light mb-1" style={{ color: 'rgb(80, 200, 120)' }}>
                            {phaseInfo.name}
                        </h3>
                        <p className="text-text-muted text-sm">{phaseInfo.description}</p>
                    </motion.div>
                </AnimatePresence>

                {/* Phase progress bar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {phases.map((phase, i) => (
                        <div
                            key={phase.id}
                            className="flex flex-col items-center"
                        >
                            <div
                                className={`w-3 h-3 rounded-full border-2 transition-all ${phases.findIndex(p => p.id === currentPhase) > i
                                        ? 'bg-accent-teal border-accent-teal'
                                        : phases.findIndex(p => p.id === currentPhase) === i
                                            ? 'border-accent-teal'
                                            : 'border-white/20'
                                    }`}
                            />
                            <span className="text-xs text-text-dim mt-1 hidden md:block">
                                {phase.name.slice(0, 3)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={startCycle}
                            disabled={isAnimating}
                            className="btn-primary disabled:opacity-30"
                        >
                            {isAnimating ? 'Dividing...' : 'Start Mitosis'}
                        </button>
                        <button onClick={reset} className="btn-ghost">
                            Reset
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Speed</span>
                            <input
                                type="range"
                                min={10}
                                max={100}
                                value={110 - speed}
                                onChange={e => setSpeed(110 - +e.target.value)}
                                className="w-24 accent-text"
                            />
                        </div>

                        <div className="text-text-muted text-sm">
                            Phase {phases.findIndex(p => p.id === currentPhase) + 1} / {phases.length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
