import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function CompoundInterest() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [principal, setPrincipal] = useState(1000)
    const [rate, setRate] = useState(7)
    const [years, setYears] = useState(30)
    const [compoundingFreq, setCompoundingFreq] = useState(12)
    const [showSimple, setShowSimple] = useState(true)
    const [isAnimating, setIsAnimating] = useState(false)
    const [currentYear, setCurrentYear] = useState(0)

    const calculateSimple = (t: number): number => {
        return principal * (1 + (rate / 100) * t)
    }

    const calculateCompound = (t: number): number => {
        return principal * Math.pow(1 + (rate / 100) / compoundingFreq, compoundingFreq * t)
    }

    const calculateContinuous = (t: number): number => {
        return principal * Math.exp((rate / 100) * t)
    }

    const startAnimation = () => {
        setCurrentYear(0)
        setIsAnimating(true)
    }

    const reset = () => {
        setIsAnimating(false)
        setCurrentYear(0)
    }

    useEffect(() => {
        if (!isAnimating || currentYear >= years) {
            if (currentYear >= years) setIsAnimating(false)
            return
        }

        const timer = setTimeout(() => {
            setCurrentYear(prev => prev + 0.5)
        }, 50)

        return () => clearTimeout(timer)
    }, [isAnimating, currentYear, years])

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
        const padding = 70
        const graphWidth = width - padding * 2
        const graphHeight = height - padding * 2 - 20

        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, width, height)

        // Calculate max value for scaling
        const maxValue = calculateContinuous(years) * 1.1

        const toCanvasX = (t: number) => padding + (t / years) * graphWidth
        const toCanvasY = (v: number) => height - padding - 20 - (v / maxValue) * graphHeight

        // Axes
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padding, padding)
        ctx.lineTo(padding, height - padding - 20)
        ctx.lineTo(width - padding, height - padding - 20)
        ctx.stroke()

        // Axis labels
        ctx.fillStyle = 'rgba(220, 180, 80, 0.6)'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Years', width / 2, height - 20)

        ctx.save()
        ctx.translate(20, height / 2 - 10)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('Value ($)', 0, 0)
        ctx.restore()

        // Grid and labels
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.1)'
        ctx.lineWidth = 1
        ctx.font = '10px sans-serif'

        // X-axis labels
        for (let t = 0; t <= years; t += Math.ceil(years / 6)) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(t), padding)
            ctx.lineTo(toCanvasX(t), height - padding - 20)
            ctx.stroke()

            ctx.fillStyle = 'rgba(220, 180, 80, 0.4)'
            ctx.textAlign = 'center'
            ctx.fillText(t.toString(), toCanvasX(t), height - padding)
        }

        // Y-axis labels
        const yStep = Math.pow(10, Math.floor(Math.log10(maxValue))) / 2
        for (let v = 0; v <= maxValue; v += yStep) {
            ctx.beginPath()
            ctx.moveTo(padding, toCanvasY(v))
            ctx.lineTo(width - padding, toCanvasY(v))
            ctx.stroke()

            ctx.fillStyle = 'rgba(220, 180, 80, 0.4)'
            ctx.textAlign = 'right'
            ctx.fillText('$' + v.toLocaleString(), padding - 10, toCanvasY(v) + 4)
        }

        // Principal line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(padding, toCanvasY(principal))
        ctx.lineTo(width - padding, toCanvasY(principal))
        ctx.stroke()
        ctx.setLineDash([])

        const displayYear = isAnimating ? currentYear : years

        // Simple interest (linear)
        if (showSimple) {
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.6)'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let t = 0; t <= displayYear; t += 0.5) {
                const v = calculateSimple(t)
                if (t === 0) ctx.moveTo(toCanvasX(t), toCanvasY(v))
                else ctx.lineTo(toCanvasX(t), toCanvasY(v))
            }
            ctx.stroke()
        }

        // Compound interest
        ctx.strokeStyle = 'rgba(80, 200, 120, 0.8)'
        ctx.lineWidth = 3
        ctx.beginPath()
        for (let t = 0; t <= displayYear; t += 0.5) {
            const v = calculateCompound(t)
            if (t === 0) ctx.moveTo(toCanvasX(t), toCanvasY(v))
            else ctx.lineTo(toCanvasX(t), toCanvasY(v))
        }
        ctx.stroke()

        // Continuous compound (e^rt)
        ctx.strokeStyle = 'rgba(255, 180, 80, 0.8)'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        for (let t = 0; t <= displayYear; t += 0.5) {
            const v = calculateContinuous(t)
            if (t === 0) ctx.moveTo(toCanvasX(t), toCanvasY(v))
            else ctx.lineTo(toCanvasX(t), toCanvasY(v))
        }
        ctx.stroke()
        ctx.setLineDash([])

        // End points
        if (displayYear > 0) {
            const simpleEnd = calculateSimple(displayYear)
            const compoundEnd = calculateCompound(displayYear)
            const continuousEnd = calculateContinuous(displayYear)

            // Dots at current year
            ctx.fillStyle = 'rgba(80, 200, 120, 0.9)'
            ctx.beginPath()
            ctx.arc(toCanvasX(displayYear), toCanvasY(compoundEnd), 6, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = 'rgba(255, 180, 80, 0.9)'
            ctx.beginPath()
            ctx.arc(toCanvasX(displayYear), toCanvasY(continuousEnd), 5, 0, Math.PI * 2)
            ctx.fill()

            if (showSimple) {
                ctx.fillStyle = 'rgba(150, 150, 150, 0.9)'
                ctx.beginPath()
                ctx.arc(toCanvasX(displayYear), toCanvasY(simpleEnd), 5, 0, Math.PI * 2)
                ctx.fill()
            }

            // Values display
            ctx.font = '12px monospace'
            ctx.textAlign = 'right'
            const valueX = width - padding - 10
            let valueY = padding + 20

            if (showSimple) {
                ctx.fillStyle = 'rgba(150, 150, 150, 0.8)'
                ctx.fillText(`Simple: $${simpleEnd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, valueX, valueY)
                valueY += 20
            }

            ctx.fillStyle = 'rgba(80, 200, 120, 0.9)'
            ctx.fillText(`Compound: $${compoundEnd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, valueX, valueY)
            valueY += 20

            ctx.fillStyle = 'rgba(255, 180, 80, 0.9)'
            ctx.fillText(`Continuous: $${continuousEnd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, valueX, valueY)
        }

        // Legend
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'left'
        let legendY = padding + 20

        if (showSimple) {
            ctx.fillStyle = 'rgba(150, 150, 150, 0.8)'
            ctx.fillRect(padding + 10, legendY - 8, 20, 2)
            ctx.fillText('P(1 + rt) — Simple', padding + 35, legendY)
            legendY += 18
        }

        ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'
        ctx.fillRect(padding + 10, legendY - 8, 20, 3)
        ctx.fillText(`P(1 + r/n)^nt — Compound (n=${compoundingFreq})`, padding + 35, legendY)
        legendY += 18

        ctx.fillStyle = 'rgba(255, 180, 80, 0.8)'
        ctx.setLineDash([4, 4])
        ctx.strokeStyle = 'rgba(255, 180, 80, 0.8)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(padding + 10, legendY - 6)
        ctx.lineTo(padding + 30, legendY - 6)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillText('Pe^rt — Continuous', padding + 35, legendY)

        return () => window.removeEventListener('resize', resize)
    }, [principal, rate, years, compoundingFreq, showSimple, currentYear, isAnimating])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Current year indicator */}
                {isAnimating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-4 right-4 bg-bg-elevated/80 backdrop-blur-sm rounded-lg px-4 py-2"
                    >
                        <span className="text-text-muted text-sm">Year </span>
                        <span className="text-yellow-400 font-mono text-lg">{Math.floor(currentYear)}</span>
                    </motion.div>
                )}

                <div className="absolute top-4 left-4 text-xs text-text-dim max-w-xs">
                    "Compound interest is the eighth wonder of the world" — Albert Einstein
                </div>
            </div>

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={startAnimation}
                            disabled={isAnimating}
                            className="btn-primary disabled:opacity-30"
                        >
                            {isAnimating ? 'Growing...' : 'Animate'}
                        </button>
                        <button onClick={reset} className="btn-ghost">
                            Reset
                        </button>
                        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showSimple}
                                onChange={e => setShowSimple(e.target.checked)}
                                className="accent-gray-400"
                            />
                            Simple Interest
                        </label>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                            <span className="text-text-dim text-xs">Principal</span>
                            <input
                                type="range"
                                min={100}
                                max={10000}
                                step={100}
                                value={principal}
                                onChange={e => { setPrincipal(+e.target.value); reset() }}
                                className="w-16 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono w-12">${principal}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-text-dim text-xs">Rate</span>
                            <input
                                type="range"
                                min={1}
                                max={15}
                                step={0.5}
                                value={rate}
                                onChange={e => { setRate(+e.target.value); reset() }}
                                className="w-16 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono w-8">{rate}%</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-text-dim text-xs">Years</span>
                            <input
                                type="range"
                                min={5}
                                max={50}
                                value={years}
                                onChange={e => { setYears(+e.target.value); reset() }}
                                className="w-16 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono w-6">{years}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-text-dim text-xs">n</span>
                            <select
                                value={compoundingFreq}
                                onChange={e => { setCompoundingFreq(+e.target.value); reset() }}
                                className="bg-bg border border-border rounded px-2 py-1 text-xs"
                            >
                                <option value={1}>Annual</option>
                                <option value={4}>Quarterly</option>
                                <option value={12}>Monthly</option>
                                <option value={365}>Daily</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
