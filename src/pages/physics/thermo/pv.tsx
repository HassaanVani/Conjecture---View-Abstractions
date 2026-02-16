import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

const PHYSICS_COLOR = 'rgb(160, 100, 255)'

type CycleType = 'manual' | 'carnot' | 'otto'

interface PVPoint { p: number; v: number }

export default function PVDiagram() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [pressure, setPressure] = useState(2.0)
    const [volume, setVolume] = useState(2.0)
    const [cycle, setCycle] = useState<CycleType>('manual')
    const [showWork, setShowWork] = useState(true)
    const [isAnimating, setIsAnimating] = useState(false)
    const historyRef = useRef<PVPoint[]>([{ p: 2.0, v: 2.0 }])
    const animatingRef = useRef(false)

    const calcEntropy = (p: number, v: number): number => {
        return 1.5 * Math.log(p) + 2.5 * Math.log(v)
    }

    const calcWork = useCallback((): number => {
        const pts = historyRef.current
        if (pts.length < 3) return 0
        let area = 0
        for (let i = 0; i < pts.length - 1; i++) {
            area += (pts[i].p + pts[i + 1].p) / 2 * (pts[i + 1].v - pts[i].v)
        }
        return area * 101.3
    }, [])

    const animateTo = useCallback((targetP: number, targetV: number, duration: number, isIsothermal = false) => {
        if (animatingRef.current) return
        animatingRef.current = true
        setIsAnimating(true)
        const startP = pressure
        const startV = volume
        const startTime = performance.now()
        const PV0 = startP * startV

        const step = (now: number) => {
            const t = Math.min(1, (now - startTime) / duration)
            let nextP: number, nextV: number
            if (isIsothermal) {
                nextV = startV + (targetV - startV) * t
                nextP = PV0 / nextV
            } else {
                nextP = startP + (targetP - startP) * t
                nextV = startV + (targetV - startV) * t
            }
            setPressure(nextP)
            setVolume(nextV)
            historyRef.current.push({ p: nextP, v: nextV })
            if (t < 1) requestAnimationFrame(step)
            else { animatingRef.current = false; setIsAnimating(false) }
        }
        requestAnimationFrame(step)
    }, [pressure, volume])

    const runCarnot = useCallback(() => {
        historyRef.current = [{ p: 3.5, v: 1.0 }]
        setPressure(3.5); setVolume(1.0)
        const steps = [
            () => animateTo(1.75, 2.0, 800, true),
            () => animateTo(1.0, 2.8, 800),
            () => animateTo(2.0, 1.4, 800, true),
            () => animateTo(3.5, 1.0, 800),
        ]
        let i = 0
        const next = () => { if (i < steps.length) { steps[i](); i++; setTimeout(next, 900) } }
        next()
    }, [animateTo])

    const runOtto = useCallback(() => {
        historyRef.current = [{ p: 1.0, v: 4.0 }]
        setPressure(1.0); setVolume(4.0)
        const steps = [
            () => animateTo(4.0, 1.5, 700),
            () => animateTo(4.5, 1.5, 700),
            () => animateTo(1.5, 4.0, 700),
            () => animateTo(1.0, 4.0, 700),
        ]
        let i = 0
        const next = () => { if (i < steps.length) { steps[i](); i++; setTimeout(next, 800) } }
        next()
    }, [animateTo])

    const demoSteps: DemoStep[] = [
        { title: 'PV Diagrams', description: 'A PV diagram shows the relationship between pressure and volume of a gas during thermodynamic processes.', highlight: 'The current state is shown as a yellow dot.' },
        { title: 'Work = Area', description: 'Work done BY the gas equals the area under the curve on a PV diagram. Expansion = positive work.', setup: () => { setShowWork(true); historyRef.current = [{ p: 2, v: 1 }]; setPressure(2); setVolume(1); setTimeout(() => animateTo(2, 4, 1000), 200) }, highlight: 'The shaded area represents work done.' },
        { title: 'Isobaric Process', description: 'Constant pressure. Horizontal line on PV diagram. W = P * deltaV.', setup: () => { historyRef.current = []; setPressure(3); setVolume(1); setTimeout(() => animateTo(3, 4, 1000), 200) } },
        { title: 'Isochoric Process', description: 'Constant volume. Vertical line. No work done (W = 0) since volume does not change.', setup: () => { historyRef.current = []; setPressure(1); setVolume(2.5); setTimeout(() => animateTo(4, 2.5, 1000), 200) } },
        { title: 'Carnot Cycle', description: 'The most efficient heat engine cycle: two isothermals + two adiabatics. Efficiency = 1 - Tc/Th.', setup: () => { setCycle('carnot'); setTimeout(runCarnot, 300) }, highlight: 'Watch the four-step Carnot cycle trace.' },
        { title: 'Entropy', description: 'Entropy (S) measures disorder. For an ideal gas, deltaS = nCv*ln(T2/T1) + nR*ln(V2/V1).', highlight: 'Entropy value updates in the info panel as state changes.' },
        { title: 'Heat Engine Efficiency', description: 'For any cycle, efficiency eta = W_net / Q_hot. The enclosed area is W_net.', setup: () => { setCycle('manual') }, highlight: 'Create closed cycles to see net work.' },
    ]

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let dpr = window.devicePixelRatio || 1
        const resize = () => {
            dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        const animate = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const gx = 80, gy = h - 60
            const gw = w - 140, gh = h - 120
            const scaleX = gw / 5, scaleY = gh / 5

            ctx.clearRect(0, 0, w, h)

            // Axes
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(gx, gy - gh); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw, gy)
            ctx.stroke()

            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.font = '12px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('Volume (L)', gx + gw / 2, gy + 40)
            ctx.save()
            ctx.translate(20, gy - gh / 2); ctx.rotate(-Math.PI / 2)
            ctx.fillText('Pressure (atm)', 0, 0)
            ctx.restore()

            // Grid + labels
            ctx.strokeStyle = 'rgba(255,255,255,0.06)'
            ctx.lineWidth = 1
            for (let i = 1; i <= 5; i++) {
                ctx.beginPath()
                ctx.moveTo(gx + i * scaleX, gy); ctx.lineTo(gx + i * scaleX, gy - gh); ctx.stroke()
                ctx.moveTo(gx, gy - i * scaleY); ctx.lineTo(gx + gw, gy - i * scaleY); ctx.stroke()
                ctx.fillStyle = 'rgba(255,255,255,0.3)'
                ctx.textAlign = 'center'
                ctx.fillText(`${i}`, gx + i * scaleX, gy + 18)
                ctx.textAlign = 'right'
                ctx.fillText(`${i}`, gx - 8, gy - i * scaleY + 4)
            }

            // Isotherms
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.15)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 4]);
            [2, 4, 8, 12].forEach(k => {
                ctx.beginPath()
                for (let v = 0.5; v <= 5; v += 0.1) {
                    const p = k / v
                    if (p > 5) continue
                    const x = gx + v * scaleX, y = gy - p * scaleY
                    if (v <= 0.6 || p > 5) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                }
                ctx.stroke()
            })
            ctx.setLineDash([])

            // Shaded work area
            if (showWork && historyRef.current.length > 2) {
                ctx.beginPath()
                const pts = historyRef.current
                ctx.moveTo(gx + pts[0].v * scaleX, gy)
                pts.forEach(pt => {
                    ctx.lineTo(gx + pt.v * scaleX, gy - pt.p * scaleY)
                })
                ctx.lineTo(gx + pts[pts.length - 1].v * scaleX, gy)
                ctx.closePath()
                ctx.fillStyle = 'rgba(160, 100, 255, 0.15)'
                ctx.fill()
            }

            // Path
            if (historyRef.current.length > 1) {
                ctx.beginPath()
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.8)'
                ctx.lineWidth = 2.5
                historyRef.current.forEach((pt, i) => {
                    const x = gx + pt.v * scaleX, y = gy - pt.p * scaleY
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke()
            }

            // Current point
            const cpx = gx + volume * scaleX, cpy = gy - pressure * scaleY
            ctx.fillStyle = '#facc15'
            ctx.shadowColor = '#facc15'; ctx.shadowBlur = 12
            ctx.beginPath(); ctx.arc(cpx, cpy, 6, 0, Math.PI * 2); ctx.fill()
            ctx.shadowBlur = 0

            // Dashed reference lines
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)'
            ctx.setLineDash([3, 5])
            ctx.beginPath(); ctx.moveTo(cpx, cpy); ctx.lineTo(cpx, gy); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(cpx, cpy); ctx.lineTo(gx, cpy); ctx.stroke()
            ctx.setLineDash([])

            requestAnimationFrame(animate)
        }

        requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize) }
    }, [pressure, volume, showWork])

    const U = 1.5 * pressure * volume * 101.3
    const work = calcWork()
    const entropy = calcEntropy(pressure, volume)

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">PV Diagrams</h1>
                        <p className="text-xs text-white/50">Thermodynamics</p>
                    </div>
                    <APTag course="Physics 2" unit="Unit 2" color={PHYSICS_COLOR} />
                </div>
                <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                    <div className="absolute top-4 left-4 space-y-2">
                        <EquationDisplay
                            departmentColor={PHYSICS_COLOR}
                            title="Thermodynamics"
                            equations={[
                                { label: '1st Law', expression: 'deltaU = Q - W', description: 'Energy conservation' },
                                { label: 'Work', expression: 'W = integral P dV', description: 'Area under PV curve' },
                                { label: 'Entropy', expression: 'deltaS = Q_rev / T', description: 'Disorder measure' },
                            ]}
                        />
                    </div>
                    <div className="absolute top-4 right-4">
                        <InfoPanel
                            departmentColor={PHYSICS_COLOR}
                            title="Thermodynamic State"
                            items={[
                                { label: 'Pressure', value: pressure.toFixed(2), unit: 'atm' },
                                { label: 'Volume', value: volume.toFixed(2), unit: 'L' },
                                { label: 'Internal Energy', value: U.toFixed(0), unit: 'J' },
                                { label: 'Work (path)', value: work.toFixed(1), unit: 'J' },
                                { label: 'Entropy (S)', value: entropy.toFixed(2) },
                                { label: 'PV ~ T', value: (pressure * volume).toFixed(2) },
                            ]}
                        />
                    </div>
                </div>

                <div className="w-72 bg-[#0d0a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ButtonGroup
                            label="Cycle Mode"
                            value={cycle}
                            onChange={v => setCycle(v as CycleType)}
                            options={[
                                { value: 'manual', label: 'Manual' },
                                { value: 'carnot', label: 'Carnot' },
                                { value: 'otto', label: 'Otto' },
                            ]}
                            color={PHYSICS_COLOR}
                        />
                        {cycle !== 'manual' && (
                            <Button onClick={cycle === 'carnot' ? runCarnot : runOtto} disabled={isAnimating}>
                                Run {cycle === 'carnot' ? 'Carnot' : 'Otto'} Cycle
                            </Button>
                        )}
                        <ControlGroup label="Isobaric (const P)">
                            <div className="flex gap-2">
                                <Button onClick={() => animateTo(pressure, Math.min(5, volume + 1), 500)} variant="secondary" disabled={isAnimating}>+V</Button>
                                <Button onClick={() => animateTo(pressure, Math.max(0.5, volume - 1), 500)} variant="secondary" disabled={isAnimating}>-V</Button>
                            </div>
                        </ControlGroup>
                        <ControlGroup label="Isochoric (const V)">
                            <div className="flex gap-2">
                                <Button onClick={() => animateTo(Math.min(5, pressure + 1), volume, 500)} variant="secondary" disabled={isAnimating}>+P</Button>
                                <Button onClick={() => animateTo(Math.max(0.5, pressure - 1), volume, 500)} variant="secondary" disabled={isAnimating}>-P</Button>
                            </div>
                        </ControlGroup>
                        <ControlGroup label="Isothermal (const T)">
                            <div className="flex gap-2">
                                <Button onClick={() => animateTo(0, Math.min(5, volume + 1), 500, true)} variant="secondary" disabled={isAnimating}>+V</Button>
                                <Button onClick={() => animateTo(0, Math.max(0.5, volume - 1), 500, true)} variant="secondary" disabled={isAnimating}>-V</Button>
                            </div>
                        </ControlGroup>
                        <ControlGroup label="Pressure">
                            <Slider value={pressure} onChange={v => { setPressure(v); historyRef.current.push({ p: v, v: volume }) }} min={0.5} max={5} step={0.1} />
                        </ControlGroup>
                        <ControlGroup label="Volume">
                            <Slider value={volume} onChange={v => { setVolume(v); historyRef.current.push({ p: pressure, v }) }} min={0.5} max={5} step={0.1} />
                        </ControlGroup>
                        <div className="flex gap-2">
                            <Button onClick={() => { historyRef.current = [{ p: pressure, v: volume }] }} variant="secondary">Clear Path</Button>
                            <Button onClick={() => setShowWork(!showWork)} variant="secondary">{showWork ? 'Hide' : 'Show'} W</Button>
                        </div>
                    </ControlPanel>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={PHYSICS_COLOR} />
            </div>
        </div>
    )
}
