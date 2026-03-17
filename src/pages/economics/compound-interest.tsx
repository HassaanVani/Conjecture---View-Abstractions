import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, Select } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const GOLD = 'rgb(220, 180, 80)'

const FREQ_OPTIONS = [
    { value: '1', label: 'Annual' },
    { value: '4', label: 'Quarterly' },
    { value: '12', label: 'Monthly' },
    { value: '365', label: 'Daily' },
]

const DEFAULTS = { principal: 1000, rate: 7, years: 30, compoundingFreq: 12 }

export default function CompoundInterest() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [principal, setPrincipal] = useState(DEFAULTS.principal)
    const [rate, setRate] = useState(DEFAULTS.rate)
    const [years, setYears] = useState(DEFAULTS.years)
    const [compoundingFreq, setCompoundingFreq] = useState(DEFAULTS.compoundingFreq)
    const [showSimple, setShowSimple] = useState(true)
    const [isAnimating, setIsAnimating] = useState(false)
    const [currentYear, setCurrentYear] = useState(0)

    const calculateSimple = useCallback((t: number) => principal * (1 + (rate / 100) * t), [principal, rate])
    const calculateCompound = useCallback((t: number) => principal * Math.pow(1 + (rate / 100) / compoundingFreq, compoundingFreq * t), [principal, rate, compoundingFreq])
    const calculateContinuous = useCallback((t: number) => principal * Math.exp((rate / 100) * t), [principal, rate])

    const reset = useCallback(() => { setIsAnimating(false); setCurrentYear(0) }, [])
    const resetAll = useCallback(() => {
        setPrincipal(DEFAULTS.principal); setRate(DEFAULTS.rate)
        setYears(DEFAULTS.years); setCompoundingFreq(DEFAULTS.compoundingFreq)
        setShowSimple(true); setIsAnimating(false); setCurrentYear(0)
    }, [])

    // Derived values
    const displayYear = isAnimating ? currentYear : years
    const futureValue = calculateCompound(displayYear)
    const totalInterest = futureValue - principal
    const doublingTime = Math.log(2) / (compoundingFreq * Math.log(1 + (rate / 100) / compoundingFreq))
    const effectiveRate = (Math.pow(1 + (rate / 100) / compoundingFreq, compoundingFreq) - 1) * 100

    const demoSteps: DemoStep[] = useMemo(() => [
        {
            title: 'Simple vs Compound',
            description: 'Simple interest grows linearly on principal only. Compound interest earns interest on interest, creating exponential growth.',
            setup: () => { setPrincipal(1000); setRate(7); setYears(30); setCompoundingFreq(1); setShowSimple(true); reset() },
        },
        {
            title: 'Compounding Frequency',
            description: 'More frequent compounding means interest is reinvested sooner. Monthly beats annual; daily beats monthly -- but with diminishing returns.',
            setup: () => { setPrincipal(1000); setRate(7); setYears(30); setCompoundingFreq(12); setShowSimple(false); reset() },
        },
        {
            title: 'Exponential Growth',
            description: 'Watch the curve steepen over time. Growth accelerates because the base keeps increasing. This is why starting early matters so much.',
            setup: () => { setPrincipal(1000); setRate(10); setYears(40); setCompoundingFreq(12); setShowSimple(true); reset(); setTimeout(() => { setCurrentYear(0); setIsAnimating(true) }, 100) },
        },
        {
            title: 'Rule of 72',
            description: 'Divide 72 by your interest rate to estimate doubling time. At 7%, money doubles in ~10.3 years. A quick mental-math shortcut.',
            setup: () => { setPrincipal(1000); setRate(7); setYears(22); setCompoundingFreq(12); setShowSimple(false); reset() },
        },
        {
            title: 'Present Value',
            description: 'Compound interest works in reverse too. $1,000 in 30 years at 7% is worth only ~$131 today. This is the time value of money.',
            setup: () => { setPrincipal(131); setRate(7); setYears(30); setCompoundingFreq(12); setShowSimple(false); reset() },
        },
        {
            title: 'Continuous Compounding',
            description: 'The dashed orange line shows Pe^(rt) -- compounding every instant. It is the theoretical upper bound and the basis for many financial models.',
            setup: () => { setPrincipal(1000); setRate(7); setYears(30); setCompoundingFreq(365); setShowSimple(false); reset() },
        },
        {
            title: 'Real vs Nominal',
            description: 'A 7% nominal rate with 3% inflation gives ~4% real growth. Inflation erodes purchasing power -- the real rate is what matters.',
            setup: () => { setPrincipal(1000); setRate(4); setYears(30); setCompoundingFreq(12); setShowSimple(true); reset() },
        },
        {
            title: 'Time Value of Money',
            description: 'Experiment freely. Adjust principal, rate, and time to see how each lever affects growth. Notice: time is the most powerful factor.',
            setup: () => { setPrincipal(1000); setRate(7); setYears(30); setCompoundingFreq(12); setShowSimple(true); reset() },
        },
    ], [reset])

    const demo = useDemoMode(demoSteps)

    // Animation tick
    useEffect(() => {
        if (!isAnimating || currentYear >= years) {
            if (currentYear >= years) setIsAnimating(false)
            return
        }
        const timer = setTimeout(() => setCurrentYear(prev => prev + 0.5), 50)
        return () => clearTimeout(timer)
    }, [isAnimating, currentYear, years])

    // Canvas rendering
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

        const maxValue = calculateContinuous(years) * 1.1
        const toCanvasX = (t: number) => padding + (t / years) * graphWidth
        const toCanvasY = (v: number) => height - padding - 20 - (v / maxValue) * graphHeight

        // Axes
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.4)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(padding, padding); ctx.lineTo(padding, height - padding - 20); ctx.lineTo(width - padding, height - padding - 20); ctx.stroke()

        // Axis labels
        ctx.fillStyle = 'rgba(220, 180, 80, 0.6)'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('Years', width / 2, height - 20)
        ctx.save(); ctx.translate(20, height / 2 - 10); ctx.rotate(-Math.PI / 2); ctx.fillText('Value ($)', 0, 0); ctx.restore()

        // Grid
        ctx.strokeStyle = 'rgba(220, 180, 80, 0.1)'; ctx.lineWidth = 1; ctx.font = '10px sans-serif'
        for (let t = 0; t <= years; t += Math.ceil(years / 6)) {
            ctx.beginPath(); ctx.moveTo(toCanvasX(t), padding); ctx.lineTo(toCanvasX(t), height - padding - 20); ctx.stroke()
            ctx.fillStyle = 'rgba(220, 180, 80, 0.4)'; ctx.textAlign = 'center'; ctx.fillText(t.toString(), toCanvasX(t), height - padding)
        }
        const yStep = Math.pow(10, Math.floor(Math.log10(maxValue))) / 2
        for (let v = 0; v <= maxValue; v += yStep) {
            ctx.beginPath(); ctx.moveTo(padding, toCanvasY(v)); ctx.lineTo(width - padding, toCanvasY(v)); ctx.stroke()
            ctx.fillStyle = 'rgba(220, 180, 80, 0.4)'; ctx.textAlign = 'right'; ctx.fillText('$' + v.toLocaleString(), padding - 10, toCanvasY(v) + 4)
        }

        // Principal line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.setLineDash([5, 5])
        ctx.beginPath(); ctx.moveTo(padding, toCanvasY(principal)); ctx.lineTo(width - padding, toCanvasY(principal)); ctx.stroke(); ctx.setLineDash([])

        const dYear = isAnimating ? currentYear : years

        // Simple interest
        if (showSimple) {
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.6)'; ctx.lineWidth = 2; ctx.beginPath()
            for (let t = 0; t <= dYear; t += 0.5) { const v = calculateSimple(t); if (t === 0) ctx.moveTo(toCanvasX(t), toCanvasY(v)); else ctx.lineTo(toCanvasX(t), toCanvasY(v)) }
            ctx.stroke()
        }

        // Compound interest
        ctx.strokeStyle = 'rgba(80, 200, 120, 0.8)'; ctx.lineWidth = 3; ctx.beginPath()
        for (let t = 0; t <= dYear; t += 0.5) { const v = calculateCompound(t); if (t === 0) ctx.moveTo(toCanvasX(t), toCanvasY(v)); else ctx.lineTo(toCanvasX(t), toCanvasY(v)) }
        ctx.stroke()

        // Continuous compound
        ctx.strokeStyle = 'rgba(255, 180, 80, 0.8)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath()
        for (let t = 0; t <= dYear; t += 0.5) { const v = calculateContinuous(t); if (t === 0) ctx.moveTo(toCanvasX(t), toCanvasY(v)); else ctx.lineTo(toCanvasX(t), toCanvasY(v)) }
        ctx.stroke(); ctx.setLineDash([])

        // End points
        if (dYear > 0) {
            const simpleEnd = calculateSimple(dYear), compoundEnd = calculateCompound(dYear), continuousEnd = calculateContinuous(dYear)

            ctx.fillStyle = 'rgba(80, 200, 120, 0.9)'; ctx.beginPath(); ctx.arc(toCanvasX(dYear), toCanvasY(compoundEnd), 6, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'rgba(255, 180, 80, 0.9)'; ctx.beginPath(); ctx.arc(toCanvasX(dYear), toCanvasY(continuousEnd), 5, 0, Math.PI * 2); ctx.fill()
            if (showSimple) { ctx.fillStyle = 'rgba(150, 150, 150, 0.9)'; ctx.beginPath(); ctx.arc(toCanvasX(dYear), toCanvasY(simpleEnd), 5, 0, Math.PI * 2); ctx.fill() }

            ctx.font = '12px monospace'; ctx.textAlign = 'right'
            const valueX = width - padding - 10; let valueY = padding + 20
            if (showSimple) { ctx.fillStyle = 'rgba(150, 150, 150, 0.8)'; ctx.fillText(`Simple: $${simpleEnd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, valueX, valueY); valueY += 20 }
            ctx.fillStyle = 'rgba(80, 200, 120, 0.9)'; ctx.fillText(`Compound: $${compoundEnd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, valueX, valueY); valueY += 20
            ctx.fillStyle = 'rgba(255, 180, 80, 0.9)'; ctx.fillText(`Continuous: $${continuousEnd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, valueX, valueY)
        }

        // Legend
        ctx.font = '11px sans-serif'; ctx.textAlign = 'left'; let legendY = padding + 20
        if (showSimple) { ctx.fillStyle = 'rgba(150, 150, 150, 0.8)'; ctx.fillRect(padding + 10, legendY - 8, 20, 2); ctx.fillText('P(1 + rt) — Simple', padding + 35, legendY); legendY += 18 }
        ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'; ctx.fillRect(padding + 10, legendY - 8, 20, 3); ctx.fillText(`P(1 + r/n)^nt — Compound (n=${compoundingFreq})`, padding + 35, legendY); legendY += 18
        ctx.fillStyle = 'rgba(255, 180, 80, 0.8)'; ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255, 180, 80, 0.8)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(padding + 10, legendY - 6); ctx.lineTo(padding + 30, legendY - 6); ctx.stroke(); ctx.setLineDash([])
        ctx.fillText('Pe^rt — Continuous', padding + 35, legendY)

        return () => window.removeEventListener('resize', resize)
    }, [principal, rate, years, compoundingFreq, showSimple, currentYear, isAnimating, calculateSimple, calculateCompound, calculateContinuous])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Year indicator during animation */}
                {isAnimating && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 bg-bg-elevated/80 backdrop-blur-sm rounded-lg px-4 py-2">
                        <span className="text-text-muted text-sm">Year </span>
                        <span className="text-yellow-400 font-mono text-lg">{Math.floor(currentYear)}</span>
                    </motion.div>
                )}

                {/* Controls — top left */}
                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <Slider label="Principal ($)" value={principal} onChange={v => { setPrincipal(v); reset() }} min={100} max={10000} step={100} />
                        <Slider label="Rate (%)" value={rate} onChange={v => { setRate(v); reset() }} min={1} max={15} step={0.5} />
                        <Slider label="Years" value={years} onChange={v => { setYears(v); reset() }} min={5} max={50} step={1} />
                        <ControlGroup label="Compounding (n)">
                            <Select value={String(compoundingFreq)} onChange={v => { setCompoundingFreq(Number(v)); reset() }} options={FREQ_OPTIONS} />
                        </ControlGroup>
                        <Toggle label="Show Simple Interest" value={showSimple} onChange={setShowSimple} />
                        <div className="flex gap-2 flex-wrap">
                            <Button onClick={() => { setCurrentYear(0); setIsAnimating(true) }} disabled={isAnimating} variant="primary">
                                {isAnimating ? 'Growing...' : 'Animate'}
                            </Button>
                            <Button onClick={resetAll} variant="secondary">Reset</Button>
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 4" color={GOLD} />
                </div>

                {/* Info + Equations — top right */}
                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title="Key Metrics" items={[
                        { label: 'Future Value', value: `$${futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'rgba(80,200,120,1)' },
                        { label: 'Total Interest', value: `$${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'rgba(255,180,80,1)' },
                        { label: 'Doubling Time', value: `${doublingTime.toFixed(1)} yrs`, color: 'rgba(220,180,80,1)' },
                        { label: 'Effective Rate', value: `${effectiveRate.toFixed(2)}%`, color: 'rgba(180,160,255,1)' },
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'Compound', expression: 'A = P(1 + r/n)^(nt)', description: 'Compound interest formula' },
                        { label: 'Continuous', expression: 'A = Pe^(rt)', description: 'Continuous compounding' },
                        { label: 'Rule of 72', expression: 't ≈ 72 / r', description: 'Doubling time estimate' },
                    ]} />
                </div>

                {/* Demo mode — bottom center */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen}
                        onClose={demo.close} onNext={demo.next} onPrev={demo.prev}
                        onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
