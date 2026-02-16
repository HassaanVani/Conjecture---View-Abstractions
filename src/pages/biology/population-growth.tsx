import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

const BIO_COLOR = 'rgb(80, 200, 120)'
const BG = '#0a1a12'

type Mode = 'logistic' | 'lotka-volterra' | 'age-pyramid'
type Strategy = 'r-strategy' | 'K-strategy'

interface PopData {
    logistic: number[]
    prey: number[]
    predator: number[]
    time: number
}

export default function PopulationGrowth() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mode, setMode] = useState<Mode>('logistic')
    const [strategy, setStrategy] = useState<Strategy>('K-strategy')
    const [growthRate, setGrowthRate] = useState(0.5)
    const [carryingCapacity, setCarryingCapacity] = useState(1000)
    const [timeScale, setTimeScale] = useState(1)
    const [showAgeStructure, setShowAgeStructure] = useState(false)

    // Lotka-Volterra params
    const [alpha, setAlpha] = useState(0.1)
    const [beta, setBeta] = useState(0.002)

    const dataRef = useRef<PopData>({ logistic: [100], prey: [100], predator: [20], time: 0 })

    const reset = useCallback(() => {
        dataRef.current = { logistic: [100], prey: [100], predator: [20], time: 0 }
        setIsRunning(false)
    }, [])

    const demoSteps: DemoStep[] = [
        { title: 'Population Ecology', description: 'Understand how populations grow, stabilize, and interact using mathematical models.', highlight: 'Choose between logistic growth, predator-prey dynamics, or age structure.' },
        { title: 'Exponential vs Logistic Growth', description: 'Without limits, populations grow exponentially (J-curve). With limited resources, growth follows a logistic S-curve approaching carrying capacity K.', setup: () => { setMode('logistic'); setGrowthRate(0.5); setCarryingCapacity(1000); reset() } },
        { title: 'r-Strategy vs K-Strategy', description: 'r-strategists (high r, low K) reproduce rapidly in unstable environments. K-strategists (low r, high K) invest in fewer, more competitive offspring.', setup: () => { setMode('logistic'); setStrategy('r-strategy'); setGrowthRate(0.9); setCarryingCapacity(500) } },
        { title: 'K-Strategy Organisms', description: 'K-strategists have lower growth rates but higher carrying capacity. They thrive in stable environments with strong parental care.', setup: () => { setStrategy('K-strategy'); setGrowthRate(0.2); setCarryingCapacity(1500) } },
        { title: 'Lotka-Volterra Model', description: 'Predator and prey populations oscillate cyclically. When prey increase, predators follow; as predators increase, prey decline.', setup: () => { setMode('lotka-volterra'); reset() } },
        { title: 'Adjusting Interaction Rates', description: 'Alpha controls prey growth rate, beta controls predation efficiency. Small changes create dramatically different oscillation patterns.', highlight: 'Try adjusting alpha and beta to see how cycles change.' },
        { title: 'Age Structure Pyramids', description: 'The age distribution of a population predicts its future growth. Growing populations have wide bases; declining ones are top-heavy.', setup: () => { setShowAgeStructure(true) } },
        { title: 'Explore Freely', description: 'Experiment with all parameters. Watch how r, K, and interaction coefficients shape population dynamics over time.', setup: () => { setShowAgeStructure(false) } },
    ]

    const demo = useDemoMode(demoSteps)

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

        let animId: number
        const dt = 0.1
        const pad = 60

        const animate = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const gw = w - pad * 2
            const gh = h - pad * 2

            ctx.fillStyle = BG
            ctx.fillRect(0, 0, w, h)

            if (isRunning) {
                const d = dataRef.current
                if (mode === 'logistic') {
                    const N = d.logistic[d.logistic.length - 1]
                    const r = strategy === 'r-strategy' ? growthRate * 1.5 : growthRate
                    const K = strategy === 'r-strategy' ? carryingCapacity * 0.6 : carryingCapacity
                    const dN = r * N * (1 - N / K) * dt * timeScale
                    d.logistic.push(Math.max(0, N + dN))
                    if (d.logistic.length > 600) d.logistic.shift()
                } else if (mode === 'lotka-volterra') {
                    const prey = d.prey[d.prey.length - 1]
                    const pred = d.predator[d.predator.length - 1]
                    const gamma = 0.1
                    const delta = 0.001
                    const dPrey = (alpha * prey - beta * prey * pred) * dt * timeScale
                    const dPred = (delta * prey * pred - gamma * pred) * dt * timeScale
                    d.prey.push(Math.max(1, prey + dPrey))
                    d.predator.push(Math.max(1, pred + dPred))
                    if (d.prey.length > 600) d.prey.shift()
                    if (d.predator.length > 600) d.predator.shift()
                }
                d.time += dt * timeScale
            }

            // Draw axes
            ctx.strokeStyle = 'rgba(80, 200, 120, 0.25)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(pad, pad)
            ctx.lineTo(pad, h - pad)
            ctx.lineTo(w - pad, h - pad)
            ctx.stroke()

            ctx.fillStyle = 'rgba(80, 200, 120, 0.4)'
            ctx.font = '12px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('Time', w / 2, h - 20)
            ctx.save()
            ctx.translate(18, h / 2)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Population', 0, 0)
            ctx.restore()

            const d = dataRef.current

            if (showAgeStructure) {
                // Age structure pyramids side-by-side
                const pyramidW = gw * 0.35
                const pyramidH = gh * 0.7
                const types: { label: string; ages: number[]; x: number }[] = [
                    { label: 'Growing (Expansive)', ages: [50, 40, 30, 22, 15, 10, 5], x: pad + gw * 0.2 },
                    { label: 'Stable (Stationary)', ages: [20, 20, 20, 20, 18, 15, 10], x: pad + gw * 0.5 },
                    { label: 'Declining (Constrictive)', ages: [10, 15, 18, 22, 25, 28, 20], x: pad + gw * 0.8 },
                ]
                const ageLabels = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60+']

                types.forEach(({ label, ages, x }) => {
                    ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
                    ctx.font = '13px sans-serif'
                    ctx.textAlign = 'center'
                    ctx.fillText(label, x, pad + 20)

                    const barH = pyramidH / ages.length
                    const maxAge = 55
                    ages.forEach((a, i) => {
                        const bw = (a / maxAge) * pyramidW * 0.4
                        const by = pad + 40 + (ages.length - 1 - i) * barH
                        // Left bar (males)
                        ctx.fillStyle = 'rgba(80, 160, 220, 0.6)'
                        ctx.fillRect(x - bw, by, bw - 2, barH - 2)
                        // Right bar (females)
                        ctx.fillStyle = 'rgba(220, 120, 160, 0.6)'
                        ctx.fillRect(x + 2, by, bw - 2, barH - 2)
                        // Age label
                        ctx.fillStyle = 'rgba(255,255,255,0.3)'
                        ctx.font = '10px monospace'
                        ctx.textAlign = 'center'
                        ctx.fillText(ageLabels[i], x, by + barH / 2 + 3)
                    })
                })
            } else if (mode === 'logistic') {
                const K = strategy === 'r-strategy' ? carryingCapacity * 0.6 : carryingCapacity
                // K line
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)'
                ctx.setLineDash([5, 5])
                ctx.beginPath()
                const kY = h - pad - (K / K) * gh * 0.9
                ctx.moveTo(pad, kY)
                ctx.lineTo(w - pad, kY)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(255, 200, 100, 0.5)'
                ctx.font = '11px monospace'
                ctx.textAlign = 'left'
                ctx.fillText(`K = ${Math.round(K)}`, w - pad + 8, kY + 4)

                // Population curve
                ctx.strokeStyle = 'rgba(80, 200, 120, 0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                d.logistic.forEach((v, i) => {
                    const x = pad + (i / d.logistic.length) * gw
                    const y = h - pad - (v / K) * gh * 0.9
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke()

                if (d.logistic.length > 0) {
                    ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'
                    ctx.font = '14px monospace'
                    ctx.textAlign = 'left'
                    ctx.fillText(`N = ${Math.round(d.logistic[d.logistic.length - 1])}`, pad + 10, pad + 20)
                }
            } else {
                const maxVal = Math.max(...d.prey, ...d.predator) * 1.2 || 200

                // Prey
                ctx.strokeStyle = 'rgba(80, 200, 120, 0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                d.prey.forEach((v, i) => {
                    const x = pad + (i / d.prey.length) * gw
                    const y = h - pad - (v / maxVal) * gh
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke()

                // Predator
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)'
                ctx.beginPath()
                d.predator.forEach((v, i) => {
                    const x = pad + (i / d.predator.length) * gw
                    const y = h - pad - (v / maxVal) * gh
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke()

                // Legend
                ctx.font = '12px sans-serif'
                ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'
                ctx.fillRect(pad + 10, pad + 10, 12, 12)
                ctx.fillText('Prey', pad + 28, pad + 20)
                ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                ctx.fillRect(pad + 10, pad + 30, 12, 12)
                ctx.fillText('Predator', pad + 28, pad + 40)
            }

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [isRunning, mode, strategy, growthRate, carryingCapacity, timeScale, alpha, beta, showAgeStructure])

    const currentN = dataRef.current.logistic[dataRef.current.logistic.length - 1] || 100

    return (
        <div className="h-[calc(100vh-64px)] relative overflow-hidden" style={{ background: BG }}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            <div className="absolute top-4 right-4 z-10">
                <APTag course="Biology" unit="Unit 8" color={BIO_COLOR} />
            </div>

            {/* Controls */}
            <div className="absolute top-16 left-4 w-64 z-10 space-y-3">
                <ControlPanel>
                    <ButtonGroup
                        value={mode}
                        onChange={(v) => { setMode(v as Mode); reset() }}
                        options={[
                            { value: 'logistic', label: 'Logistic' },
                            { value: 'lotka-volterra', label: 'Predator-Prey' },
                        ]}
                        label="Mode"
                        color={BIO_COLOR}
                    />
                    {mode === 'logistic' && (
                        <>
                            <ButtonGroup
                                value={strategy}
                                onChange={(v) => { setStrategy(v as Strategy); reset() }}
                                options={[{ value: 'r-strategy', label: 'r-Strategy' }, { value: 'K-strategy', label: 'K-Strategy' }]}
                                label="Life History"
                                color={BIO_COLOR}
                            />
                            <Slider value={growthRate} onChange={setGrowthRate} min={0.1} max={1} step={0.05} label={`Growth Rate (r): ${growthRate.toFixed(2)}`} />
                            <Slider value={carryingCapacity} onChange={setCarryingCapacity} min={200} max={2000} step={50} label={`Carrying Capacity (K): ${carryingCapacity}`} />
                        </>
                    )}
                    {mode === 'lotka-volterra' && (
                        <>
                            <Slider value={alpha} onChange={setAlpha} min={0.01} max={0.3} step={0.01} label={`Prey growth (a): ${alpha.toFixed(2)}`} />
                            <Slider value={beta} onChange={setBeta} min={0.001} max={0.01} step={0.001} label={`Predation (b): ${beta.toFixed(3)}`} />
                        </>
                    )}
                    <Slider value={timeScale} onChange={setTimeScale} min={0.5} max={3} step={0.5} label={`Speed: ${timeScale}x`} />
                    <Toggle value={showAgeStructure} onChange={setShowAgeStructure} label="Age Pyramids" />
                    <ControlGroup label="Controls">
                        <div className="flex gap-2">
                            <Button onClick={() => setIsRunning(!isRunning)} className="flex-1 text-xs">
                                {isRunning ? 'Pause' : 'Start'}
                            </Button>
                            <Button onClick={reset} variant="secondary" className="flex-1 text-xs">Reset</Button>
                        </div>
                    </ControlGroup>
                    <Button onClick={demo.open} variant="secondary" className="w-full text-xs">Demo Mode</Button>
                </ControlPanel>
            </div>

            {/* Info panel */}
            <div className="absolute top-16 right-4 w-64 z-10 space-y-3">
                <InfoPanel
                    title="Population Data"
                    departmentColor={BIO_COLOR}
                    items={mode === 'logistic' ? [
                        { label: 'N (current)', value: Math.round(currentN) },
                        { label: 'r (rate)', value: growthRate.toFixed(2) },
                        { label: 'K (capacity)', value: carryingCapacity },
                        { label: 'Strategy', value: strategy },
                        { label: 'Time', value: dataRef.current.time.toFixed(1), unit: 'gen' },
                    ] : [
                        { label: 'Prey', value: Math.round(dataRef.current.prey[dataRef.current.prey.length - 1] || 100), color: BIO_COLOR },
                        { label: 'Predator', value: Math.round(dataRef.current.predator[dataRef.current.predator.length - 1] || 20), color: 'rgb(255,100,100)' },
                        { label: 'Time', value: dataRef.current.time.toFixed(1), unit: 'gen' },
                    ]}
                />
                <EquationDisplay
                    departmentColor={BIO_COLOR}
                    title="Equations"
                    equations={mode === 'logistic' ? [
                        { label: 'Logistic', expression: 'dN/dt = rN(1 - N/K)', description: 'S-shaped growth curve' },
                        { label: 'Exponential', expression: 'dN/dt = rN', description: 'J-shaped unlimited growth' },
                    ] : [
                        { label: 'Prey', expression: 'dx/dt = ax - bxy', description: 'Prey growth minus predation' },
                        { label: 'Predator', expression: 'dy/dt = dxy - cy', description: 'Predator growth minus death' },
                    ]}
                />
            </div>

            {/* Demo Mode */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                <DemoMode
                    steps={demoSteps}
                    currentStep={demo.currentStep}
                    isOpen={demo.isOpen}
                    onClose={demo.close}
                    onNext={demo.next}
                    onPrev={demo.prev}
                    onGoToStep={demo.goToStep}
                    departmentColor={BIO_COLOR}
                    title="AP Biology | Unit 8"
                />
            </div>
        </div>
    )
}
