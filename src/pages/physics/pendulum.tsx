import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'
import { Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

const COLOR = 'rgb(160, 100, 255)'

interface PendState { theta: number; omega: number }

export default function Pendulum() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mode, setMode] = useState<'simple' | 'physical'>('simple')
    const [length, setLength] = useState(200)
    const [gravity, setGravity] = useState(9.8)
    const [damping, setDamping] = useState(0.999)
    const [initialAngle, setInitialAngle] = useState(45)
    const [showTrail, setShowTrail] = useState(true)
    const [showEnergy, setShowEnergy] = useState(true)
    const [showGraph, setShowGraph] = useState(true)
    const [useLargeAngle, setUseLargeAngle] = useState(true)

    const stateRef = useRef<{
        pend: PendState; trail: { x: number; y: number }[]
        history: { t: number; T: number }[]; t: number
        ke: number; pe: number
    }>({
        pend: { theta: Math.PI / 4, omega: 0 },
        trail: [], history: [], t: 0, ke: 0, pe: 0,
    })

    const reset = useCallback(() => {
        const th = initialAngle * Math.PI / 180
        stateRef.current = {
            pend: { theta: th, omega: 0 },
            trail: [], history: [], t: 0, ke: 0, pe: 0,
        }
        setIsRunning(false)
    }, [initialAngle])

    // Period calculations
    const smallAnglePeriod = 2 * Math.PI * Math.sqrt(length / (gravity * 100))
    const theta0 = initialAngle * Math.PI / 180
    // Large-angle correction: T ~ T0 * (1 + (1/16)*theta^2 + ...)
    const largeAnglePeriod = smallAnglePeriod * (1 + (1 / 16) * theta0 * theta0 + (11 / 3072) * theta0 ** 4)
    const physicalPeriod = 2 * Math.PI * Math.sqrt((2 * length) / (3 * gravity * 100))

    const demoSteps: DemoStep[] = [
        { title: 'Pendulum Motion', description: 'A pendulum swings back and forth under gravity. For small angles, it approximates simple harmonic motion.', setup: () => { setMode('simple'); setInitialAngle(15); setUseLargeAngle(false); setShowEnergy(true) } },
        { title: 'Small Angle Approx.', description: 'For small angles (< 15deg), sin(theta) ~ theta. Period T = 2pi*sqrt(L/g), independent of amplitude. This is the "small angle approximation".', setup: () => { setInitialAngle(10); setUseLargeAngle(false) } },
        { title: 'Large Angle Effects', description: 'Beyond ~15deg, the small angle approximation breaks down. The true period increases with amplitude. Toggle large-angle mode to see the correction.', highlight: 'Enable "Large Angle" toggle.', setup: () => { setInitialAngle(60); setUseLargeAngle(true) } },
        { title: 'Energy Conservation', description: 'At the top: max PE, zero KE. At the bottom: max KE, zero PE. Total energy is conserved (minus damping losses).', setup: () => { setShowEnergy(true); setInitialAngle(45); setDamping(1.0) } },
        { title: 'Damping', description: 'Real pendulums lose energy to friction/air resistance. The amplitude decays exponentially. Lower damping = faster energy loss.', setup: () => { setDamping(0.995); setInitialAngle(45) } },
        { title: 'Period vs Length', description: 'Period scales as sqrt(L). Quadrupling the length doubles the period. The graph shows this relationship.', highlight: 'Try changing the length slider.', setup: () => { setShowGraph(true); setDamping(1.0) } },
        { title: 'Physical Pendulum', description: 'A uniform rod pivoted at one end has T = 2pi*sqrt(2L/3g). The moment of inertia shifts the effective length to 2L/3.', setup: () => { setMode('physical'); setInitialAngle(30) } },
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
        let animId: number
        const dt = 0.02

        const animate = () => {
            const rect = canvas.getBoundingClientRect()
            const w = rect.width, h = rect.height
            const pivotX = w * 0.45, pivotY = h * 0.22

            ctx.fillStyle = showTrail ? 'rgba(13, 10, 26, 0.12)' : '#0d0a1a'
            ctx.fillRect(0, 0, w, h)

            if (isRunning) {
                const st = stateRef.current.pend
                const L = length / 100 // meters
                const g = gravity
                const substeps = 4

                for (let i = 0; i < substeps; i++) {
                    let alpha: number
                    if (mode === 'physical') {
                        // Physical pendulum: I*alpha = -mgL/2*sin(theta), I = mL^2/3
                        alpha = (-3 * g / (2 * L)) * (useLargeAngle ? Math.sin(st.theta) : st.theta)
                    } else {
                        alpha = (-g / L) * (useLargeAngle ? Math.sin(st.theta) : st.theta)
                    }
                    st.omega += alpha * dt / substeps
                    st.omega *= Math.pow(damping, 1 / substeps)
                    st.theta += st.omega * dt / substeps
                }
                stateRef.current.t += dt

                // Energy (m=1 assumed)
                const L_m = L
                stateRef.current.ke = 0.5 * (L_m * st.omega) ** 2
                stateRef.current.pe = g * L_m * (1 - Math.cos(st.theta))

                // History for period graph
                if (stateRef.current.history.length === 0 || stateRef.current.t - stateRef.current.history[stateRef.current.history.length - 1].t > 0.1) {
                    stateRef.current.history.push({ t: stateRef.current.t, T: st.theta })
                    if (stateRef.current.history.length > 300) stateRef.current.history.shift()
                }
            }

            const st = stateRef.current.pend
            const bobX = pivotX + length * Math.sin(st.theta)
            const bobY = pivotY + length * Math.cos(st.theta)

            // Pivot mount
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.fillRect(pivotX - 30, pivotY - 6, 60, 6)

            if (mode === 'physical') {
                // Draw rod (thick)
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
                ctx.lineWidth = 8
                ctx.lineCap = 'round'
                ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(bobX, bobY); ctx.stroke()
                // Center of mass marker
                const cmX = (pivotX + bobX) / 2, cmY = (pivotY + bobY) / 2
                ctx.fillStyle = 'rgba(255, 200, 100, 0.8)'
                ctx.beginPath(); ctx.arc(cmX, cmY, 5, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(255, 200, 100, 0.5)'; ctx.font = '10px Inter'; ctx.textAlign = 'left'
                ctx.fillText('CM', cmX + 8, cmY + 4)
            } else {
                // Rod
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 2
                ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(bobX, bobY); ctx.stroke()
            }

            // Pivot
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.beginPath(); ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2); ctx.fill()

            // Bob
            ctx.fillStyle = COLOR; ctx.shadowColor = 'rgba(160, 100, 255, 0.4)'; ctx.shadowBlur = 15
            ctx.beginPath(); ctx.arc(bobX, bobY, mode === 'physical' ? 8 : 18, 0, Math.PI * 2); ctx.fill()
            ctx.shadowBlur = 0

            // Trail
            if (showTrail && isRunning) {
                stateRef.current.trail.push({ x: bobX, y: bobY })
                if (stateRef.current.trail.length > 200) stateRef.current.trail.shift()
            }
            if (showTrail && stateRef.current.trail.length > 1) {
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.3)'; ctx.lineWidth = 1.5
                ctx.beginPath()
                stateRef.current.trail.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y) })
                ctx.stroke()
            }

            // Energy bar diagram
            if (showEnergy) {
                const ex = w - 90, ey = h - 40, barH = 150
                const total = stateRef.current.ke + stateRef.current.pe || 1
                const keH = (stateRef.current.ke / total) * barH
                const peH = (stateRef.current.pe / total) * barH

                ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(ex - 10, ey - barH - 30, 80, barH + 50)
                ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'; ctx.fillRect(ex, ey - keH, 20, keH)
                ctx.fillStyle = 'rgba(100, 180, 255, 0.7)'; ctx.fillRect(ex + 30, ey - peH, 20, peH)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.font = '10px Inter'; ctx.textAlign = 'center'
                ctx.fillText('KE', ex + 10, ey + 14); ctx.fillText('PE', ex + 40, ey + 14)
                ctx.fillText('Energy', ex + 25, ey - barH - 15)
            }

            // Period vs Length graph (bottom-left)
            if (showGraph) {
                const gx = 20, gy = h - 30, gw = 200, gh = 100
                ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(gx - 5, gy - gh - 20, gw + 15, gh + 40)
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - gh); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke()

                // Plot T = 2pi*sqrt(L/g)
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'; ctx.lineWidth = 2
                ctx.beginPath()
                for (let l = 10; l <= 300; l += 2) {
                    const T = 2 * Math.PI * Math.sqrt((l / 100) / gravity)
                    const x = gx + (l / 300) * gw
                    const y = gy - (T / 4) * gh
                    if (l === 10) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                }
                ctx.stroke()

                // Current length marker
                const curT = 2 * Math.PI * Math.sqrt((length / 100) / gravity)
                const mx = gx + (length / 300) * gw, my = gy - (curT / 4) * gh
                ctx.fillStyle = COLOR; ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px Inter'; ctx.textAlign = 'center'
                ctx.fillText('T vs L', gx + gw / 2, gy - gh - 8)
                ctx.fillText('Length', gx + gw / 2, gy + 14)
            }

            animId = requestAnimationFrame(animate)
        }
        animId = requestAnimationFrame(animate)

        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [isRunning, mode, length, gravity, damping, showTrail, showEnergy, showGraph, useLargeAngle])

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
                        <h1 className="text-lg font-medium tracking-tight">Pendulum</h1>
                        <div className="flex items-center gap-2">
                            <APTag course="Physics 1" unit="Unit 6" color={COLOR} />
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
                            { label: 'Small Angle', expression: 'T = 2π√(L/g)', description: `T ≈ ${smallAnglePeriod.toFixed(3)} s` },
                            ...(useLargeAngle ? [{ label: 'Large Angle', expression: 'T ≈ T₀(1 + θ₀²/16 + ...)', description: `T ≈ ${largeAnglePeriod.toFixed(3)} s` }] : []),
                            ...(mode === 'physical' ? [{ label: 'Physical', expression: 'T = 2π√(2L/3g)', description: `T ≈ ${physicalPeriod.toFixed(3)} s` }] : []),
                            { label: 'Restoring', expression: 'α = -(g/L)sin θ' },
                        ]} />
                    </div>

                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={COLOR} title="State" items={[
                            { label: 'Angle', value: (stateRef.current.pend.theta * 180 / Math.PI).toFixed(1), unit: 'deg' },
                            { label: 'Angular Vel', value: stateRef.current.pend.omega.toFixed(3), unit: 'rad/s' },
                            { label: 'KE', value: stateRef.current.ke.toFixed(3), unit: 'J' },
                            { label: 'PE', value: stateRef.current.pe.toFixed(3), unit: 'J' },
                            { label: 'Total E', value: (stateRef.current.ke + stateRef.current.pe).toFixed(3), unit: 'J' },
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
                    <ButtonGroup label="Type" value={mode}
                        onChange={v => { setMode(v as 'simple' | 'physical'); reset() }}
                        options={[{ value: 'simple', label: 'Simple' }, { value: 'physical', label: 'Physical' }]}
                        color={COLOR} />

                    <div className="h-px bg-white/10" />

                    <Slider label="Initial Angle (deg)" value={initialAngle} onChange={setInitialAngle} min={5} max={170} step={1} />
                    <Slider label="Length (px)" value={length} onChange={setLength} min={80} max={300} step={5} />
                    <Slider label="Gravity (m/s²)" value={gravity} onChange={setGravity} min={1} max={25} step={0.5} />
                    <Slider label="Damping" value={damping} onChange={setDamping} min={0.98} max={1.0} step={0.001} />

                    <div className="h-px bg-white/10" />

                    <Toggle label="Large Angle Correction" value={useLargeAngle} onChange={setUseLargeAngle} />
                    <Toggle label="Show Trail" value={showTrail} onChange={setShowTrail} />
                    <Toggle label="Energy Diagram" value={showEnergy} onChange={setShowEnergy} />
                    <Toggle label="T vs L Graph" value={showGraph} onChange={setShowGraph} />

                    <div className="flex gap-2 mt-2">
                        <button onClick={() => setIsRunning(!isRunning)}
                            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-purple-500 text-white hover:bg-purple-400'}`}>
                            {isRunning ? 'Pause' : 'Start'}
                        </button>
                        <Button onClick={reset} variant="secondary" className="px-4 py-2.5 rounded-lg text-sm">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
