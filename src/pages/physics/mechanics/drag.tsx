import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'
import { Slider, Button, Toggle, ButtonGroup, Select } from '@/components/control-panel'

const COLOR = 'rgb(160, 100, 255)'

const SHAPES: Record<string, number> = {
    Sphere: 0.47, Cylinder: 0.82, FlatPlate: 1.17, Streamlined: 0.04, Cube: 1.05,
}

export default function DragSimulation() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mass, setMass] = useState(2.0)
    const [dragCoeff, setDragCoeff] = useState(0.2)
    const [dragType, setDragType] = useState<'linear' | 'quadratic'>('quadratic')
    const [shape, setShape] = useState('Sphere')
    const [showGraph, setShowGraph] = useState(true)
    const [showReynolds, setShowReynolds] = useState(true)
    const [fluidDensity, setFluidDensity] = useState(1.225) // air kg/m^3
    const [objRadius, setObjRadius] = useState(0.05) // m

    const G = 9.8
    const SCALE = 4

    const stateRef = useRef({ y1: 0, v1: 0, y2: 0, v2: 0, t: 0 })
    const historyRef = useRef<{ t: number; v1: number; v2: number }[]>([])
    const animRef = useRef<number>(0)

    const vTerminal = dragType === 'linear'
        ? (mass * G) / dragCoeff
        : Math.sqrt((2 * mass * G) / (dragCoeff * fluidDensity * Math.PI * objRadius * objRadius))

    const reynolds = (v: number) => (fluidDensity * v * 2 * objRadius) / 1.81e-5

    const reset = useCallback(() => {
        stateRef.current = { y1: 0, v1: 0, y2: 0, v2: 0, t: 0 }
        historyRef.current = []
        setIsRunning(false)
    }, [])

    useEffect(() => { setDragCoeff(SHAPES[shape] ?? 0.47) }, [shape])

    const demoSteps: DemoStep[] = [
        { title: 'Drag Forces', description: 'When an object moves through a fluid, it experiences a drag force opposing its motion. Two models: linear F=-cv and quadratic F=-cv^2.', setup: () => { setDragType('quadratic'); setMass(2); reset() } },
        { title: 'Terminal Velocity', description: 'When drag force equals gravitational force (mg), net force is zero and the object falls at constant terminal velocity.', highlight: 'Watch the red ball approach terminal velocity.', setup: () => { setDragType('quadratic'); setShowGraph(true); setMass(2); setDragCoeff(0.47) } },
        { title: 'Linear vs Quadratic', description: 'Linear drag (F=-bv) applies at low Reynolds numbers (viscous flow). Quadratic (F=-½CρAv²) applies at high Re (turbulent flow).', setup: () => { setDragType('linear'); setShowReynolds(true) } },
        { title: 'Drag Coefficient', description: 'The drag coefficient Cd depends on shape. Streamlined shapes have low Cd (~0.04), while flat plates have high Cd (~1.17).', highlight: 'Try different shapes.', setup: () => { setShape('Sphere'); setDragType('quadratic') } },
        { title: 'Reynolds Number', description: 'Re = ρvD/μ determines flow regime. Re < 1: Stokes (linear), Re > 1000: turbulent (quadratic). It characterizes the flow pattern.', setup: () => { setShowReynolds(true) } },
        { title: 'Mass Effect', description: 'Heavier objects reach higher terminal velocities (vt = sqrt(2mg/CρA)). A feather and bowling ball differ due to different m/A ratios.', setup: () => { setMass(5); setDragCoeff(0.47) } },
        { title: 'Velocity vs Time', description: 'The v(t) graph shows exponential approach to terminal velocity: v(t) = vt*(1 - e^(-gt/vt)) for linear drag.', setup: () => { setShowGraph(true); setDragType('linear') } },
    ]

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.scale(dpr, dpr)
        }
        resize()
        window.addEventListener('resize', resize)

        let lastTime = performance.now()

        const animate = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTime) / 1000, 0.05)
            lastTime = now

            const rect = canvas.getBoundingClientRect()
            const w = rect.width, h = rect.height

            if (isRunning) {
                const s = stateRef.current
                // Object 1: With drag
                let Fd = dragType === 'linear' ? dragCoeff * s.v1 : dragCoeff * s.v1 * s.v1
                const a1 = G - (Fd / mass)
                s.v1 += a1 * dt; s.y1 += s.v1 * dt

                // Object 2: Vacuum
                s.v2 += G * dt; s.y2 += s.v2 * dt; s.t += dt

                if (historyRef.current.length === 0 || s.t - historyRef.current[historyRef.current.length - 1].t > 0.03) {
                    historyRef.current.push({ t: s.t, v1: s.v1, v2: s.v2 })
                    if (historyRef.current.length > 500) historyRef.current.shift()
                }
                if (s.y1 * SCALE > h - 60 && s.y2 * SCALE > h - 60) setIsRunning(false)
            }

            // Draw
            ctx.fillStyle = '#0d0a1a'; ctx.fillRect(0, 0, w, h)
            const startY = 60, groundY = h - 30

            // Ground
            ctx.fillStyle = 'rgba(160, 100, 255, 0.05)'; ctx.fillRect(0, groundY, w, h - groundY)
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.2)'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke()

            const y1_px = Math.min(startY + stateRef.current.y1 * SCALE, groundY - 18)
            const y2_px = Math.min(startY + stateRef.current.y2 * SCALE, groundY - 18)

            // Object 1: With Drag
            ctx.fillStyle = COLOR; ctx.shadowColor = 'rgba(160, 100, 255, 0.4)'; ctx.shadowBlur = 12
            ctx.beginPath(); ctx.arc(w * 0.35, y1_px, 16, 0, Math.PI * 2); ctx.fill()
            ctx.shadowBlur = 0

            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px Inter'; ctx.textAlign = 'center'
            ctx.fillText('With Drag', w * 0.35, startY - 15)
            ctx.fillStyle = COLOR; ctx.font = '12px monospace'
            ctx.fillText(`${stateRef.current.v1.toFixed(1)} m/s`, w * 0.35, y1_px - 25)

            // Drag arrow
            if (isRunning && stateRef.current.v1 > 0.5) {
                const arrowLen = Math.min(stateRef.current.v1 * 2, 50)
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)'; ctx.lineWidth = 2
                ctx.beginPath(); ctx.moveTo(w * 0.35, y1_px - 18); ctx.lineTo(w * 0.35, y1_px - 18 - arrowLen); ctx.stroke()
                ctx.fillStyle = 'rgba(255, 100, 100, 0.6)'; ctx.font = '10px Inter'
                ctx.fillText('Fd', w * 0.35 + 12, y1_px - 18 - arrowLen / 2)
            }

            // Object 2: Vacuum
            ctx.fillStyle = 'rgba(100, 180, 255, 0.8)'; ctx.shadowColor = 'rgba(100, 180, 255, 0.3)'; ctx.shadowBlur = 10
            ctx.beginPath(); ctx.arc(w * 0.65, y2_px, 16, 0, Math.PI * 2); ctx.fill()
            ctx.shadowBlur = 0

            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px Inter'; ctx.textAlign = 'center'
            ctx.fillText('Vacuum', w * 0.65, startY - 15)
            ctx.fillStyle = 'rgba(100, 180, 255, 0.8)'; ctx.font = '12px monospace'
            ctx.fillText(`${stateRef.current.v2.toFixed(1)} m/s`, w * 0.65, y2_px - 25)

            // Terminal velocity dashed line
            if (showGraph) {
                const gx = 30, gy = h - 40, gw = 220, gh = 140
                ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(gx - 8, gy - gh - 18, gw + 20, gh + 42)

                // Axes
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - gh); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke()

                if (historyRef.current.length > 1) {
                    const tMax = Math.max(5, stateRef.current.t)
                    const vMax = Math.max(30, stateRef.current.v2, vTerminal * 1.2)

                    // Terminal velocity line
                    const vtY = gy - (vTerminal / vMax) * gh
                    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)'; ctx.lineWidth = 1
                    ctx.beginPath(); ctx.moveTo(gx, vtY); ctx.lineTo(gx + gw, vtY); ctx.stroke()
                    ctx.setLineDash([]); ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'; ctx.font = '10px Inter'; ctx.textAlign = 'right'
                    ctx.fillText(`vt = ${vTerminal.toFixed(1)}`, gx + gw, vtY - 4)

                    // Drag curve
                    ctx.strokeStyle = COLOR; ctx.lineWidth = 2
                    ctx.beginPath()
                    historyRef.current.forEach((pt, i) => {
                        const x = gx + (pt.t / tMax) * gw
                        const y = gy - (pt.v1 / vMax) * gh
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                    })
                    ctx.stroke()

                    // Vacuum curve
                    ctx.strokeStyle = 'rgba(100, 180, 255, 0.6)'; ctx.setLineDash([4, 4])
                    ctx.beginPath()
                    historyRef.current.forEach((pt, i) => {
                        const x = gx + (pt.t / tMax) * gw
                        const y = gy - (Math.min(pt.v2, vMax) / vMax) * gh
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                    })
                    ctx.stroke(); ctx.setLineDash([])
                }

                ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px Inter'; ctx.textAlign = 'center'
                ctx.fillText('v(t) - Velocity vs Time', gx + gw / 2, gy - gh - 6)
                ctx.fillText('t (s)', gx + gw / 2, gy + 14)
            }

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animRef.current) }
    }, [isRunning, mass, dragCoeff, dragType, showGraph, vTerminal, fluidDensity, objRadius])

    const curReynolds = reynolds(stateRef.current.v1)

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-lg font-medium tracking-tight">Drag Forces</h1>
                        <div className="flex items-center gap-2">
                            <APTag course="Physics C: Mech" unit="Unit 1" color={COLOR} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={demo.open} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors">AP Tutorial</button>
                    <span className="text-xs text-white/40 font-mono">t = {stateRef.current.t.toFixed(2)}s</span>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4">
                        <EquationDisplay departmentColor={COLOR} equations={[
                            ...(dragType === 'linear'
                                ? [{ label: 'Linear', expression: 'F_d = -bv', description: 'Low Reynolds number' }]
                                : [{ label: 'Quadratic', expression: 'F_d = -½CρAv²', description: 'High Reynolds number' }]),
                            { label: 'Terminal', expression: dragType === 'linear' ? 'v_t = mg/b' : 'v_t = √(2mg/CρA)', description: `v_t = ${vTerminal.toFixed(1)} m/s` },
                            { label: 'Reynolds', expression: 'Re = ρvD/μ', description: `Re = ${curReynolds.toFixed(0)}` },
                            { label: 'Newton 2', expression: 'ma = mg - F_d' },
                        ]} />
                    </div>

                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={COLOR} title="State" items={[
                            { label: 'Velocity (drag)', value: stateRef.current.v1.toFixed(2), unit: 'm/s' },
                            { label: 'Velocity (vacuum)', value: stateRef.current.v2.toFixed(2), unit: 'm/s' },
                            { label: 'Terminal v', value: vTerminal.toFixed(1), unit: 'm/s', color: 'rgb(255, 200, 100)' },
                            ...(showReynolds ? [{ label: 'Reynolds #', value: curReynolds.toFixed(0), unit: '' }] : []),
                            { label: 'Cd', value: dragCoeff.toFixed(2) },
                            { label: 'Time', value: stateRef.current.t.toFixed(2), unit: 's' },
                        ]} />
                    </div>

                    {demo.isOpen && (
                        <div className="absolute bottom-4 left-4 z-20">
                            <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen}
                                onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep}
                                departmentColor={COLOR} />
                        </div>
                    )}
                </div>

                <div className="w-72 bg-[#0d0a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto z-20">
                    <ButtonGroup label="Drag Model" value={dragType}
                        onChange={v => { setDragType(v as 'linear' | 'quadratic'); reset() }}
                        options={[{ value: 'linear', label: 'Linear -bv' }, { value: 'quadratic', label: 'Quadratic -cv²' }]}
                        color={COLOR} />

                    <Select label="Shape (Cd)" value={shape} onChange={setShape}
                        options={Object.entries(SHAPES).map(([k, v]) => ({ value: k, label: `${k} (${v})` }))} />

                    <div className="h-px bg-white/10" />

                    <Slider label={`Mass (${mass} kg)`} value={mass} onChange={setMass} min={0.5} max={10} step={0.5} />
                    <Slider label={`Drag Coeff (${dragCoeff.toFixed(2)})`} value={dragCoeff} onChange={setDragCoeff} min={0.02} max={2} step={0.02} />
                    {dragType === 'quadratic' && (
                        <>
                            <Slider label={`Fluid Density (${fluidDensity} kg/m³)`} value={fluidDensity} onChange={setFluidDensity} min={0.1} max={1000} step={0.1} />
                            <Slider label={`Object Radius (${objRadius} m)`} value={objRadius} onChange={setObjRadius} min={0.01} max={0.5} step={0.01} />
                        </>
                    )}

                    <div className="h-px bg-white/10" />

                    <Toggle label="V-T Graph" value={showGraph} onChange={setShowGraph} />
                    <Toggle label="Reynolds Number" value={showReynolds} onChange={setShowReynolds} />

                    <div className="flex gap-2 mt-2">
                        <button onClick={() => { if (isRunning) setIsRunning(false); else { reset(); setIsRunning(true) } }}
                            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-purple-500 text-white hover:bg-purple-400'}`}>
                            {isRunning ? 'Stop' : 'Drop Objects'}
                        </button>
                        <Button onClick={reset} variant="secondary" className="px-4 py-2.5 rounded-lg text-sm">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
