import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

const BIO_COLOR = 'rgb(80, 200, 120)'
const BG = '#0a1a12'

type DivisionType = 'mitosis' | 'meiosis'
type MitosisPhase = 'interphase' | 'prophase' | 'metaphase' | 'anaphase' | 'telophase'
type MeiosisPhase = 'interphase' | 'prophase-i' | 'metaphase-i' | 'anaphase-i' | 'telophase-i' | 'prophase-ii' | 'metaphase-ii' | 'anaphase-ii' | 'telophase-ii'

const mitosisPhases: { id: MitosisPhase; name: string; desc: string }[] = [
    { id: 'interphase', name: 'Interphase', desc: 'Cell grows and DNA replicates (S phase)' },
    { id: 'prophase', name: 'Prophase', desc: 'Chromosomes condense, spindle forms' },
    { id: 'metaphase', name: 'Metaphase', desc: 'Chromosomes align at the metaphase plate' },
    { id: 'anaphase', name: 'Anaphase', desc: 'Sister chromatids separate to opposite poles' },
    { id: 'telophase', name: 'Telophase', desc: 'Nuclear envelopes reform, cytokinesis completes' },
]

const meiosisPhases: { id: MeiosisPhase; name: string; desc: string }[] = [
    { id: 'interphase', name: 'Interphase', desc: 'DNA replicates before meiosis begins' },
    { id: 'prophase-i', name: 'Prophase I', desc: 'Homologous chromosomes pair, crossing over occurs' },
    { id: 'metaphase-i', name: 'Metaphase I', desc: 'Homologous pairs align at the metaphase plate' },
    { id: 'anaphase-i', name: 'Anaphase I', desc: 'Homologous chromosomes separate (reductional)' },
    { id: 'telophase-i', name: 'Telophase I', desc: 'Two haploid cells form' },
    { id: 'prophase-ii', name: 'Prophase II', desc: 'Chromosomes condense again in each cell' },
    { id: 'metaphase-ii', name: 'Metaphase II', desc: 'Chromosomes align at the metaphase plate' },
    { id: 'anaphase-ii', name: 'Anaphase II', desc: 'Sister chromatids finally separate' },
    { id: 'telophase-ii', name: 'Telophase II', desc: 'Four unique haploid daughter cells form' },
]

export default function CellDivision() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [divisionType, setDivisionType] = useState<DivisionType>('mitosis')
    const [phaseIndex, setPhaseIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [speed, setSpeed] = useState(50)
    const [showCrossing, setShowCrossing] = useState(true)
    const [showComparison, setShowComparison] = useState(false)

    const phases = divisionType === 'mitosis' ? mitosisPhases : meiosisPhases
    const currentPhase = phases[phaseIndex]

    const demoSteps: DemoStep[] = [
        { title: 'Cell Division Overview', description: 'Cells divide to grow, repair, and reproduce. Mitosis produces identical cells; meiosis produces gametes with half the chromosomes.', highlight: 'Toggle between Mitosis and Meiosis modes.' },
        { title: 'Interphase & DNA Replication', description: 'Before division, the cell copies its DNA during S phase. Each chromosome becomes two sister chromatids joined at the centromere.', setup: () => { setPhaseIndex(0); setProgress(50) } },
        { title: 'Prophase & Chromosome Condensation', description: 'Chromatin condenses into visible chromosomes. In Meiosis I, homologous chromosomes pair up (synapsis) and crossing over shuffles genetic material.', setup: () => { setPhaseIndex(1); setProgress(50) } },
        { title: 'Metaphase Alignment', description: 'Chromosomes line up along the cell equator. Spindle fibers from centrioles attach to kinetochores on each chromosome.', setup: () => { setPhaseIndex(2); setProgress(50) } },
        { title: 'Anaphase Separation', description: 'In mitosis, sister chromatids separate. In meiosis I, homologous pairs separate (reductional division), halving the chromosome count.', setup: () => { setPhaseIndex(3); setProgress(50) } },
        { title: 'Telophase & Cytokinesis', description: 'Nuclear envelopes reform and the cell physically divides. Mitosis yields 2 diploid cells; meiosis eventually yields 4 haploid cells.', setup: () => { setPhaseIndex(4); setProgress(50) } },
        { title: 'Crossing Over (Meiosis)', description: 'During Prophase I, non-sister chromatids of homologous chromosomes exchange segments (crossing over), increasing genetic variation.', setup: () => { setDivisionType('meiosis'); setPhaseIndex(1); setShowCrossing(true); setProgress(50) } },
        { title: 'Comparison Mode', description: 'Enable comparison mode to see mitosis and meiosis side by side. Notice the key difference: mitosis preserves ploidy while meiosis halves it.', setup: () => { setShowComparison(true) } },
    ]

    const demo = useDemoMode(demoSteps)

    const startCycle = useCallback(() => {
        setPhaseIndex(0)
        setProgress(0)
        setIsAnimating(true)
    }, [])

    const reset = useCallback(() => {
        setIsAnimating(false)
        setPhaseIndex(0)
        setProgress(0)
    }, [])

    useEffect(() => {
        if (!isAnimating) return
        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + 1
                if (next >= 100) {
                    if (phaseIndex < phases.length - 1) {
                        setPhaseIndex(pi => pi + 1)
                        return 0
                    }
                    setIsAnimating(false)
                    return 100
                }
                return next
            })
        }, speed)
        return () => clearInterval(timer)
    }, [isAnimating, phaseIndex, phases.length, speed])

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const resize = () => {
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        const w = canvas.offsetWidth
        const h = canvas.offsetHeight
        ctx.clearRect(0, 0, w, h)
        ctx.fillStyle = BG
        ctx.fillRect(0, 0, w, h)

        const p = progress / 100
        const pi = phaseIndex

        const drawCell = (cx: number, cy: number, r: number, opacity: number) => {
            ctx.strokeStyle = `rgba(80, 200, 120, ${0.6 * opacity})`
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.arc(cx, cy, r, 0, Math.PI * 2)
            ctx.stroke()
            ctx.fillStyle = `rgba(80, 200, 120, ${0.06 * opacity})`
            ctx.fill()
        }

        const drawNucleus = (cx: number, cy: number, r: number, opacity: number) => {
            ctx.strokeStyle = `rgba(120, 180, 140, ${0.5 * opacity})`
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(cx, cy, r, 0, Math.PI * 2)
            ctx.stroke()
            ctx.fillStyle = `rgba(100, 160, 120, ${0.12 * opacity})`
            ctx.fill()
        }

        const drawChromosome = (cx: number, cy: number, size: number, color: string) => {
            ctx.strokeStyle = color
            ctx.lineWidth = 4
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(cx - size, cy - size)
            ctx.lineTo(cx + size, cy + size)
            ctx.moveTo(cx + size, cy - size)
            ctx.lineTo(cx - size, cy + size)
            ctx.stroke()
        }

        const drawSpindle = (cx: number, cy: number, r: number, op: number) => {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * op})`
            ctx.lineWidth = 1
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI - Math.PI / 2
                ctx.beginPath()
                ctx.moveTo(cx - r, cy)
                ctx.quadraticCurveTo(cx, cy + Math.sin(a) * r * 0.3, cx + r, cy)
                ctx.stroke()
            }
        }

        const drawCrossingOver = (cx: number, cy: number) => {
            if (!showCrossing) return
            ctx.strokeStyle = 'rgba(200, 120, 80, 0.8)'
            ctx.lineWidth = 4
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(cx - 20, cy - 15)
            ctx.bezierCurveTo(cx - 5, cy - 5, cx + 5, cy + 5, cx + 20, cy + 15)
            ctx.stroke()
            ctx.strokeStyle = 'rgba(80, 120, 200, 0.8)'
            ctx.beginPath()
            ctx.moveTo(cx + 20, cy - 15)
            ctx.bezierCurveTo(cx + 5, cy - 5, cx - 5, cy + 5, cx - 20, cy + 15)
            ctx.stroke()
            ctx.fillStyle = 'rgba(255, 255, 100, 0.6)'
            ctx.beginPath()
            ctx.arc(cx, cy, 4, 0, Math.PI * 2)
            ctx.fill()
        }

        if (showComparison) {
            // Side-by-side comparison
            const halfW = w / 2
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(halfW, 0)
            ctx.lineTo(halfW, h)
            ctx.stroke()

            ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
            ctx.font = '16px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('MITOSIS', halfW / 2, 30)
            ctx.fillText('MEIOSIS', halfW + halfW / 2, 30)

            // Mitosis result: 2 diploid cells
            const cellR = Math.min(halfW, h) * 0.12
            drawCell(halfW / 2 - cellR * 1.5, h * 0.5, cellR, 1)
            drawCell(halfW / 2 + cellR * 1.5, h * 0.5, cellR, 1)
            drawNucleus(halfW / 2 - cellR * 1.5, h * 0.5, cellR * 0.5, 1)
            drawNucleus(halfW / 2 + cellR * 1.5, h * 0.5, cellR * 0.5, 1)
            // 4 chromosomes each
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2
                const r2 = cellR * 0.3
                drawChromosome(halfW / 2 - cellR * 1.5 + Math.cos(a) * r2, h * 0.5 + Math.sin(a) * r2, 6, 'rgba(200,120,80,0.7)')
                drawChromosome(halfW / 2 + cellR * 1.5 + Math.cos(a) * r2, h * 0.5 + Math.sin(a) * r2, 6, 'rgba(200,120,80,0.7)')
            }
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '13px sans-serif'
            ctx.fillText('2n = 4 (diploid)', halfW / 2, h * 0.5 + cellR + 30)
            ctx.fillText('2 identical cells', halfW / 2, h * 0.5 + cellR + 50)

            // Meiosis result: 4 haploid cells
            const mCellR = cellR * 0.8
            const positions = [
                { x: halfW + halfW / 2 - mCellR * 2, y: h * 0.5 - mCellR },
                { x: halfW + halfW / 2 + mCellR * 2, y: h * 0.5 - mCellR },
                { x: halfW + halfW / 2 - mCellR * 2, y: h * 0.5 + mCellR * 1.5 },
                { x: halfW + halfW / 2 + mCellR * 2, y: h * 0.5 + mCellR * 1.5 },
            ]
            const colors = ['rgba(200,120,80,0.7)', 'rgba(80,120,200,0.7)', 'rgba(200,80,160,0.7)', 'rgba(80,200,160,0.7)']
            positions.forEach((pos, i) => {
                drawCell(pos.x, pos.y, mCellR, 1)
                drawNucleus(pos.x, pos.y, mCellR * 0.4, 1)
                drawChromosome(pos.x - 8, pos.y, 5, colors[i])
                drawChromosome(pos.x + 8, pos.y, 5, colors[i])
            })
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.fillText('n = 2 (haploid)', halfW + halfW / 2, h * 0.5 + mCellR * 1.5 + mCellR + 20)
            ctx.fillText('4 unique cells', halfW + halfW / 2, h * 0.5 + mCellR * 1.5 + mCellR + 40)
        } else {
            // Normal phase animation
            const cx = w / 2
            const cy = h / 2
            const cellR = Math.min(w, h) * 0.2

            if (divisionType === 'mitosis') {
                if (pi === 0) {
                    drawCell(cx, cy, cellR, 1)
                    drawNucleus(cx, cy, cellR * 0.5, 1)
                    if (p > 0.3) {
                        ctx.fillStyle = `rgba(80, 200, 120, ${(p - 0.3) * 0.5})`
                        ctx.font = '14px sans-serif'
                        ctx.textAlign = 'center'
                        ctx.fillText('DNA Replicating...', cx, cy + cellR + 40)
                    }
                } else if (pi === 1) {
                    drawCell(cx, cy, cellR, 1)
                    drawNucleus(cx, cy, cellR * 0.5 * (1 - p * 0.5), 1 - p * 0.7)
                    for (let i = 0; i < 4; i++) {
                        const a = (i / 4) * Math.PI * 2
                        const cr = cellR * 0.35 * p
                        drawChromosome(cx + Math.cos(a) * cr, cy + Math.sin(a) * cr * 0.6, 8 * p, 'rgba(200,120,80,0.8)')
                    }
                } else if (pi === 2) {
                    drawCell(cx, cy, cellR, 1)
                    drawSpindle(cx, cy, cellR, p)
                    for (let i = 0; i < 4; i++) {
                        drawChromosome(cx, cy + (i - 1.5) * 18, 8, 'rgba(200,120,80,0.8)')
                    }
                } else if (pi === 3) {
                    drawCell(cx, cy, cellR * (1 + p * 0.25), 1)
                    drawSpindle(cx, cy, cellR, 1)
                    const sep = p * cellR * 0.5
                    for (let i = 0; i < 4; i++) {
                        const a = (i / 4) * Math.PI * 2
                        drawChromosome(cx - sep + Math.cos(a) * cellR * 0.15, cy + Math.sin(a) * cellR * 0.15, 6, 'rgba(200,120,80,0.8)')
                        drawChromosome(cx + sep + Math.cos(a) * cellR * 0.15, cy + Math.sin(a) * cellR * 0.15, 6, 'rgba(200,120,80,0.8)')
                    }
                } else if (pi === 4) {
                    const lx = cx - cellR * 0.5 * (1 + p)
                    const rx = cx + cellR * 0.5 * (1 + p)
                    const r2 = cellR * (0.7 - p * 0.15)
                    drawCell(lx, cy, r2, 1)
                    drawCell(rx, cy, r2, 1)
                    if (p > 0.3) {
                        drawNucleus(lx, cy, r2 * 0.4, (p - 0.3) / 0.7)
                        drawNucleus(rx, cy, r2 * 0.4, (p - 0.3) / 0.7)
                    }
                    if (p < 0.7) {
                        ctx.strokeStyle = `rgba(80,200,120,${0.4 - p * 0.4})`
                        ctx.lineWidth = 2
                        ctx.beginPath()
                        ctx.moveTo(cx, cy - cellR * 0.4)
                        ctx.lineTo(cx, cy + cellR * 0.4)
                        ctx.stroke()
                    }
                }
            } else {
                // Meiosis phases
                if (pi === 0) {
                    drawCell(cx, cy, cellR, 1)
                    drawNucleus(cx, cy, cellR * 0.5, 1)
                    if (p > 0.3) {
                        ctx.fillStyle = `rgba(80, 200, 120, ${(p - 0.3) * 0.5})`
                        ctx.font = '14px sans-serif'
                        ctx.textAlign = 'center'
                        ctx.fillText('DNA Replicating (2n)...', cx, cy + cellR + 40)
                    }
                } else if (pi === 1) {
                    drawCell(cx, cy, cellR, 1)
                    drawNucleus(cx, cy, cellR * 0.5 * (1 - p * 0.5), 1 - p * 0.7)
                    // Homologous pairs with crossing over
                    for (let i = 0; i < 2; i++) {
                        const py2 = cy + (i - 0.5) * 40
                        drawChromosome(cx - 15, py2, 8 * p, 'rgba(200,120,80,0.8)')
                        drawChromosome(cx + 15, py2, 8 * p, 'rgba(80,120,200,0.8)')
                        if (p > 0.5 && showCrossing) drawCrossingOver(cx, py2)
                    }
                } else if (pi === 2) {
                    drawCell(cx, cy, cellR, 1)
                    drawSpindle(cx, cy, cellR, p)
                    for (let i = 0; i < 2; i++) {
                        const py2 = cy + (i - 0.5) * 25
                        drawChromosome(cx - 12, py2, 8, 'rgba(200,120,80,0.8)')
                        drawChromosome(cx + 12, py2, 8, 'rgba(80,120,200,0.8)')
                    }
                } else if (pi === 3) {
                    drawCell(cx, cy, cellR * (1 + p * 0.2), 1)
                    const sep = p * cellR * 0.5
                    for (let i = 0; i < 2; i++) {
                        const yOff = (i - 0.5) * 25
                        drawChromosome(cx - sep, cy + yOff, 7, 'rgba(200,120,80,0.8)')
                        drawChromosome(cx + sep, cy + yOff, 7, 'rgba(80,120,200,0.8)')
                    }
                } else if (pi === 4) {
                    const lx = cx - cellR * 0.5 * (1 + p)
                    const rx = cx + cellR * 0.5 * (1 + p)
                    const r2 = cellR * (0.65 - p * 0.1)
                    drawCell(lx, cy, r2, 1)
                    drawCell(rx, cy, r2, 1)
                    for (let i = 0; i < 2; i++) {
                        drawChromosome(lx + (i - 0.5) * 15, cy, 6, 'rgba(200,120,80,0.8)')
                        drawChromosome(rx + (i - 0.5) * 15, cy, 6, 'rgba(80,120,200,0.8)')
                    }
                } else if (pi === 5) {
                    // Prophase II - two cells
                    const lx = cx - cellR * 0.8
                    const rx = cx + cellR * 0.8
                    const r2 = cellR * 0.55
                    drawCell(lx, cy, r2, 1)
                    drawCell(rx, cy, r2, 1)
                    for (let i = 0; i < 2; i++) {
                        drawChromosome(lx + (i - 0.5) * 15, cy, 6 * p, 'rgba(200,120,80,0.8)')
                        drawChromosome(rx + (i - 0.5) * 15, cy, 6 * p, 'rgba(80,120,200,0.8)')
                    }
                } else if (pi === 6) {
                    const lx = cx - cellR * 0.8
                    const rx = cx + cellR * 0.8
                    const r2 = cellR * 0.55
                    drawCell(lx, cy, r2, 1)
                    drawCell(rx, cy, r2, 1)
                    drawSpindle(lx, cy, r2 * 0.8, p)
                    drawSpindle(rx, cy, r2 * 0.8, p)
                    drawChromosome(lx, cy - 8, 6, 'rgba(200,120,80,0.8)')
                    drawChromosome(lx, cy + 8, 6, 'rgba(200,120,80,0.8)')
                    drawChromosome(rx, cy - 8, 6, 'rgba(80,120,200,0.8)')
                    drawChromosome(rx, cy + 8, 6, 'rgba(80,120,200,0.8)')
                } else if (pi === 7) {
                    const lx = cx - cellR * 0.8
                    const rx = cx + cellR * 0.8
                    const r2 = cellR * 0.55
                    drawCell(lx, cy, r2, 1)
                    drawCell(rx, cy, r2, 1)
                    const sep2 = p * r2 * 0.5
                    drawChromosome(lx, cy - sep2, 5, 'rgba(200,120,80,0.8)')
                    drawChromosome(lx, cy + sep2, 5, 'rgba(200,160,120,0.8)')
                    drawChromosome(rx, cy - sep2, 5, 'rgba(80,120,200,0.8)')
                    drawChromosome(rx, cy + sep2, 5, 'rgba(120,120,200,0.8)')
                } else if (pi === 8) {
                    // 4 cells forming
                    const positions2 = [
                        { x: cx - cellR, y: cy - cellR * 0.4 * (1 + p) },
                        { x: cx - cellR, y: cy + cellR * 0.4 * (1 + p) },
                        { x: cx + cellR, y: cy - cellR * 0.4 * (1 + p) },
                        { x: cx + cellR, y: cy + cellR * 0.4 * (1 + p) },
                    ]
                    const r3 = cellR * (0.4 - p * 0.05)
                    const chColors = ['rgba(200,120,80,0.8)', 'rgba(200,160,120,0.8)', 'rgba(80,120,200,0.8)', 'rgba(120,120,200,0.8)']
                    positions2.forEach((pos, i) => {
                        drawCell(pos.x, pos.y, r3, 1)
                        if (p > 0.4) drawNucleus(pos.x, pos.y, r3 * 0.4, (p - 0.4) / 0.6)
                        drawChromosome(pos.x, pos.y, 5, chColors[i])
                    })
                    if (p > 0.7) {
                        ctx.fillStyle = `rgba(80,200,120,${(p - 0.7) * 2})`
                        ctx.font = '14px sans-serif'
                        ctx.textAlign = 'center'
                        ctx.fillText('4 Haploid Cells (n)', cx, cy + cellR * 1.6)
                    }
                }
            }
        }

        return () => window.removeEventListener('resize', resize)
    }, [divisionType, phaseIndex, progress, showCrossing, showComparison])

    return (
        <div className="h-[calc(100vh-64px)] relative overflow-hidden" style={{ background: BG }}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {/* Phase indicator */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${divisionType}-${phaseIndex}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-6 left-1/2 -translate-x-1/2 text-center z-10"
                >
                    <h3 className="text-2xl font-light mb-1" style={{ color: BIO_COLOR }}>{currentPhase.name}</h3>
                    <p className="text-white/40 text-sm">{currentPhase.desc}</p>
                </motion.div>
            </AnimatePresence>

            {/* APTag */}
            <div className="absolute top-4 right-4 z-10">
                <APTag course="Biology" unit="Unit 2" color={BIO_COLOR} />
            </div>

            {/* Phase dots */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {phases.map((ph, i) => (
                    <button
                        key={ph.id}
                        onClick={() => { setPhaseIndex(i); setProgress(0) }}
                        className="w-2.5 h-2.5 rounded-full transition-all"
                        style={{
                            backgroundColor: i < phaseIndex ? BIO_COLOR : i === phaseIndex ? BIO_COLOR : 'rgba(255,255,255,0.15)',
                            opacity: i <= phaseIndex ? 1 : 0.5,
                        }}
                    />
                ))}
            </div>

            {/* Controls */}
            <div className="absolute top-20 left-4 w-64 z-10 space-y-3">
                <ControlPanel>
                    <ButtonGroup
                        value={divisionType}
                        onChange={(v) => { setDivisionType(v as DivisionType); reset() }}
                        options={[{ value: 'mitosis', label: 'Mitosis' }, { value: 'meiosis', label: 'Meiosis' }]}
                        label="Division Type"
                        color={BIO_COLOR}
                    />
                    <Slider value={110 - speed} onChange={(v) => setSpeed(110 - v)} min={10} max={100} label="Speed" />
                    {divisionType === 'meiosis' && (
                        <Toggle value={showCrossing} onChange={setShowCrossing} label="Crossing Over" />
                    )}
                    <Toggle value={showComparison} onChange={setShowComparison} label="Comparison View" />
                    <ControlGroup label="Controls">
                        <div className="flex gap-2">
                            <Button onClick={startCycle} disabled={isAnimating} className="flex-1 text-xs">
                                {isAnimating ? 'Running...' : 'Start'}
                            </Button>
                            <Button onClick={reset} variant="secondary" className="flex-1 text-xs">Reset</Button>
                        </div>
                    </ControlGroup>
                    <Button onClick={demo.open} variant="secondary" className="w-full text-xs">Demo Mode</Button>
                </ControlPanel>
            </div>

            {/* Info & Equations */}
            <div className="absolute top-20 right-4 w-64 z-10 space-y-3">
                <InfoPanel
                    title="Status"
                    departmentColor={BIO_COLOR}
                    items={[
                        { label: 'Type', value: divisionType === 'mitosis' ? 'Mitosis' : 'Meiosis' },
                        { label: 'Phase', value: `${phaseIndex + 1} / ${phases.length}` },
                        { label: 'Progress', value: `${progress}%` },
                        { label: 'Daughter Cells', value: divisionType === 'mitosis' ? '2 (2n)' : '4 (n)' },
                    ]}
                />
                <EquationDisplay
                    departmentColor={BIO_COLOR}
                    title="Key Concepts"
                    equations={divisionType === 'mitosis' ? [
                        { label: 'Result', expression: '2n -> 2 cells (2n)', description: 'Identical diploid daughter cells' },
                        { label: 'Purpose', expression: 'Growth & Repair', description: 'Somatic cell division' },
                    ] : [
                        { label: 'Meiosis I', expression: '2n -> 2 cells (n)', description: 'Reductional division' },
                        { label: 'Meiosis II', expression: 'n -> 2 cells (n)', description: 'Equational division' },
                        { label: 'Total', expression: '2n -> 4 cells (n)', description: 'Gamete formation' },
                    ]}
                />
            </div>

            {/* Demo Mode */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
                <DemoMode
                    steps={demoSteps}
                    currentStep={demo.currentStep}
                    isOpen={demo.isOpen}
                    onClose={demo.close}
                    onNext={demo.next}
                    onPrev={demo.prev}
                    onGoToStep={demo.goToStep}
                    departmentColor={BIO_COLOR}
                    title="AP Biology | Unit 2"
                />
            </div>
        </div>
    )
}
