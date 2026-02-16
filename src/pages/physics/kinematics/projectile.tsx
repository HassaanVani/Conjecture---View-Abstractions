import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'
import { Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

interface TrailPoint { x: number; y: number }

export default function ProjectileMotion() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [v0, setV0] = useState(50)
    const [angle, setAngle] = useState(45)
    const [height, setHeight] = useState(0)
    const [gravity, setGravity] = useState(9.8)
    const [showVectors, setShowVectors] = useState(true)
    const [timeScale, setTimeScale] = useState(1)
    const [airResistance, setAirResistance] = useState(false)
    const [dragCoeff, setDragCoeff] = useState(0.1)
    const [showTrajectoryPreview, setShowTrajectoryPreview] = useState(true)
    const [comparisonMode, setComparisonMode] = useState<'none' | 'angles' | 'drag'>('none')

    const stateRef = useRef({
        t: 0, x: 0, y: 0, vx: 0, vy: 0,
        trail: [] as TrailPoint[],
        comparisonTrails: [] as TrailPoint[][],
    })

    const reset = useCallback(() => {
        setIsRunning(false)
        const rad = angle * Math.PI / 180
        stateRef.current = {
            t: 0, x: 0, y: height,
            vx: v0 * Math.cos(rad), vy: v0 * Math.sin(rad),
            trail: [], comparisonTrails: [],
        }
    }, [v0, angle, height])

    useEffect(() => { if (!isRunning) reset() }, [v0, angle, height, gravity, reset, isRunning])

    // Computed values
    const rad = angle * Math.PI / 180
    const vy0 = v0 * Math.sin(rad)
    const vx0 = v0 * Math.cos(rad)
    const tPeak = vy0 / gravity
    const yMax = height + vy0 * tPeak - 0.5 * gravity * tPeak * tPeak
    const tTotal = (vy0 + Math.sqrt(vy0 * vy0 + 2 * gravity * height)) / gravity
    const xMax = vx0 * tTotal

    const demoSteps: DemoStep[] = [
        { title: 'Projectile Motion', description: 'A projectile is any object launched into the air, subject only to gravity (and optionally air resistance). Its path forms a parabola.', setup: () => { setV0(50); setAngle(45); setHeight(0); setAirResistance(false) } },
        { title: 'Launch Angle', description: 'The launch angle determines the trajectory shape. 45° gives maximum range on level ground. Try changing it!', highlight: 'Adjust the angle slider to see how the trajectory changes.', setup: () => { setAngle(45); setShowTrajectoryPreview(true) } },
        { title: 'Initial Velocity', description: 'Greater initial velocity means the projectile travels farther and higher. The range scales with v₀².', setup: () => { setV0(70); setAngle(45) } },
        { title: 'Velocity Components', description: 'The velocity breaks into horizontal (vₓ = v₀cosθ, constant) and vertical (vᵧ = v₀sinθ - gt, changing due to gravity).', setup: () => { setShowVectors(true); setV0(50); setAngle(60) } },
        { title: 'Maximum Height', description: 'At the peak, vᵧ = 0. The max height is y_max = h + v₀²sin²θ/(2g). More vertical velocity → greater height.', setup: () => { setAngle(75); setV0(50) } },
        { title: 'Range', description: 'The horizontal range is R = v₀²sin(2θ)/g. Complementary angles (e.g., 30° and 60°) give the same range.', setup: () => { setAngle(30); setComparisonMode('angles') } },
        { title: 'Air Resistance', description: 'Real projectiles experience drag: F_d = ½CρAv². This reduces range and maximum height, and the trajectory is no longer a perfect parabola.', setup: () => { setAirResistance(true); setDragCoeff(0.1); setComparisonMode('drag') } },
        { title: 'Initial Height', description: 'Launching from a height h > 0 increases both the range and total flight time. The projectile has more time to travel horizontally.', setup: () => { setHeight(20); setAirResistance(false); setComparisonMode('none') } },
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
        let lastTime = performance.now()

        const animate = (now: number) => {
            const rawDt = Math.min((now - lastTime) / 1000, 0.05) * timeScale
            lastTime = now

            const rect = canvas.getBoundingClientRect()
            const w = rect.width
            const h = rect.height

            // Auto-scale to fit trajectory
            const padding = 60
            const maxDim = Math.max(xMax, yMax, 100)
            const scaleX = (w - padding * 2) / Math.max(xMax * 1.1, 50)
            const scaleY = (h - padding * 2) / Math.max(yMax * 1.1, 50)
            const scale = Math.min(scaleX, scaleY, 8)
            const originX = padding
            const originY = h - padding

            const toX = (x: number) => originX + x * scale
            const toY = (y: number) => originY - y * scale

            // Physics update
            if (isRunning) {
                const st = stateRef.current
                const steps = 4
                const subDt = rawDt / steps
                for (let i = 0; i < steps; i++) {
                    if (airResistance) {
                        const speed = Math.sqrt(st.vx * st.vx + st.vy * st.vy)
                        const ax = -dragCoeff * st.vx * speed
                        const ay = -gravity - dragCoeff * st.vy * speed
                        st.vx += ax * subDt
                        st.vy += ay * subDt
                    } else {
                        st.vy -= gravity * subDt
                    }
                    st.x += st.vx * subDt
                    st.y += st.vy * subDt
                    st.t += subDt
                }
                if (st.y <= 0) { st.y = 0; setIsRunning(false) }
                if (st.trail.length === 0 || Math.abs(st.x - st.trail[st.trail.length - 1].x) > 0.5) {
                    st.trail.push({ x: st.x, y: st.y })
                }
            }

            // --- Drawing ---
            ctx.clearRect(0, 0, w, h)

            // Grid
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.04)'
            ctx.lineWidth = 1
            const gridStep = Math.pow(10, Math.floor(Math.log10(maxDim / 5)))
            for (let gx = 0; gx <= xMax * 1.2; gx += gridStep) {
                const cx = toX(gx)
                if (cx > w) break
                ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()
            }
            for (let gy = 0; gy <= yMax * 1.2; gy += gridStep) {
                const cy = toY(gy)
                if (cy < 0) break
                ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.lineWidth = 1.5
            ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, h); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(w, originY); ctx.stroke()

            // Tick labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.font = '10px Inter, sans-serif'
            ctx.textAlign = 'center'
            for (let gx = gridStep; gx <= xMax * 1.2; gx += gridStep) {
                const cx = toX(gx)
                if (cx > w - 20) break
                ctx.fillText(`${gx.toFixed(0)}`, cx, originY + 15)
            }
            ctx.textAlign = 'right'
            for (let gy = gridStep; gy <= yMax * 1.2; gy += gridStep) {
                const cy = toY(gy)
                if (cy < 20) break
                ctx.fillText(`${gy.toFixed(0)}`, originX - 8, cy + 3)
            }

            // Ground
            ctx.fillStyle = 'rgba(160, 100, 255, 0.03)'
            ctx.fillRect(0, originY, w, h - originY)

            // Platform
            if (height > 0) {
                ctx.fillStyle = 'rgba(160, 100, 255, 0.1)'
                ctx.fillRect(toX(-3), toY(height), 6 * scale / 10, originY - toY(height))
            }

            // Trajectory preview
            if (showTrajectoryPreview && !isRunning) {
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.25)'
                ctx.setLineDash([4, 4])
                ctx.lineWidth = 1.5
                ctx.beginPath()
                for (let t = 0; t <= tTotal * 1.05; t += tTotal / 200) {
                    const px = vx0 * t
                    const py = height + vy0 * t - 0.5 * gravity * t * t
                    if (py < 0) break
                    if (t === 0) ctx.moveTo(toX(px), toY(py))
                    else ctx.lineTo(toX(px), toY(py))
                }
                ctx.stroke()
                ctx.setLineDash([])
            }

            // Comparison trails
            if (comparisonMode === 'angles') {
                const compAngles = [30, 60]
                compAngles.forEach((ca, ci) => {
                    const cr = ca * Math.PI / 180
                    ctx.strokeStyle = ci === 0 ? 'rgba(100, 200, 255, 0.3)' : 'rgba(255, 150, 100, 0.3)'
                    ctx.setLineDash([3, 3])
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    const cvx = v0 * Math.cos(cr), cvy = v0 * Math.sin(cr)
                    const ct = (cvy + Math.sqrt(cvy * cvy + 2 * gravity * height)) / gravity
                    for (let t = 0; t <= ct; t += ct / 150) {
                        const px = cvx * t
                        const py = height + cvy * t - 0.5 * gravity * t * t
                        if (py < 0) break
                        if (t === 0) ctx.moveTo(toX(px), toY(py))
                        else ctx.lineTo(toX(px), toY(py))
                    }
                    ctx.stroke()
                    ctx.setLineDash([])
                    ctx.fillStyle = ctx.strokeStyle
                    ctx.font = '11px Inter, sans-serif'
                    ctx.textAlign = 'left'
                    ctx.fillText(`${ca}°`, toX(cvx * ct * 0.5) + 5, toY(height + cvy * ct * 0.25 - 0.5 * gravity * (ct * 0.25) ** 2) - 5)
                })
            }

            // Active trail
            if (stateRef.current.trail.length > 1) {
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.7)'
                ctx.lineWidth = 2.5
                ctx.beginPath()
                stateRef.current.trail.forEach((p, i) => {
                    if (i === 0) ctx.moveTo(toX(p.x), toY(p.y))
                    else ctx.lineTo(toX(p.x), toY(p.y))
                })
                ctx.lineTo(toX(stateRef.current.x), toY(stateRef.current.y))
                ctx.stroke()
            }

            // Projectile
            const cx = toX(stateRef.current.x)
            const cy = toY(stateRef.current.y)
            ctx.fillStyle = 'rgb(160, 100, 255)'
            ctx.shadowColor = 'rgba(160, 100, 255, 0.5)'
            ctx.shadowBlur = 12
            ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill()
            ctx.shadowBlur = 0

            // Velocity vectors
            if (showVectors) {
                const vScale = scale * 0.8
                const st = stateRef.current
                // Vx (red)
                const drawArrow = (fx: number, fy: number, tx: number, ty: number, color: string) => {
                    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2
                    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke()
                    const a = Math.atan2(ty - fy, tx - fx)
                    ctx.beginPath()
                    ctx.moveTo(tx, ty)
                    ctx.lineTo(tx - 8 * Math.cos(a - 0.4), ty - 8 * Math.sin(a - 0.4))
                    ctx.lineTo(tx - 8 * Math.cos(a + 0.4), ty - 8 * Math.sin(a + 0.4))
                    ctx.closePath(); ctx.fill()
                }
                if (Math.abs(st.vx) > 0.5) drawArrow(cx, cy, cx + st.vx * vScale, cy, 'rgba(255, 100, 100, 0.8)')
                if (Math.abs(st.vy) > 0.5) drawArrow(cx, cy, cx, cy - st.vy * vScale, 'rgba(100, 255, 100, 0.8)')
                const speed = Math.sqrt(st.vx * st.vx + st.vy * st.vy)
                if (speed > 0.5) {
                    ctx.setLineDash([3, 3])
                    drawArrow(cx, cy, cx + st.vx * vScale, cy - st.vy * vScale, 'rgba(255, 255, 255, 0.6)')
                    ctx.setLineDash([])
                }
            }

            // Max height marker
            if (stateRef.current.trail.length > 5) {
                let maxY = 0, maxYx = 0
                stateRef.current.trail.forEach(p => { if (p.y > maxY) { maxY = p.y; maxYx = p.x } })
                if (maxY > 1) {
                    ctx.setLineDash([3, 5])
                    ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)'
                    ctx.lineWidth = 1
                    ctx.beginPath(); ctx.moveTo(toX(maxYx), toY(maxY)); ctx.lineTo(toX(maxYx), originY); ctx.stroke()
                    ctx.beginPath(); ctx.moveTo(originX, toY(maxY)); ctx.lineTo(toX(maxYx), toY(maxY)); ctx.stroke()
                    ctx.setLineDash([])
                }
            }

            animId = requestAnimationFrame(animate)
        }
        animId = requestAnimationFrame(animate)

        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [v0, angle, height, gravity, isRunning, timeScale, showVectors, airResistance, dragCoeff, showTrajectoryPreview, comparisonMode, xMax, yMax, tTotal, vx0, vy0, rad])

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
                        <h1 className="text-lg font-medium tracking-tight">Projectile Motion</h1>
                        <div className="flex items-center gap-2">
                            <APTag course="Physics 1" unit="Unit 1" color="rgb(160, 100, 255)" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={demo.open} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors">
                        AP Tutorial
                    </button>
                    <span className="text-xs text-white/40 font-mono">t = {stateRef.current.t.toFixed(2)}s</span>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Position', expression: 'x = v₀cosθ · t', description: 'Horizontal (constant velocity)' },
                                { label: 'Position', expression: 'y = h + v₀sinθ · t - ½gt²', description: 'Vertical (accelerated)' },
                                { label: 'Range', expression: 'R = v₀²sin(2θ) / g' },
                                ...(airResistance ? [{ label: 'Drag', expression: 'F_d = ½Cρv²', description: 'Opposes velocity' }] : []),
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4">
                        <InfoPanel
                            departmentColor="rgb(160, 100, 255)"
                            title="Calculated Values"
                            items={[
                                { label: 'Max Height', value: yMax.toFixed(1), unit: 'm' },
                                { label: 'Range', value: xMax.toFixed(1), unit: 'm' },
                                { label: 'Flight Time', value: tTotal.toFixed(2), unit: 's' },
                                { label: 'Speed', value: Math.sqrt(stateRef.current.vx ** 2 + stateRef.current.vy ** 2).toFixed(1), unit: 'm/s' },
                                { label: 'vₓ', value: stateRef.current.vx.toFixed(1), unit: 'm/s' },
                                { label: 'vᵧ', value: stateRef.current.vy.toFixed(1), unit: 'm/s' },
                            ]}
                        />
                    </div>

                    {demo.isOpen && (
                        <div className="absolute bottom-4 left-4 z-20">
                            <DemoMode
                                steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen}
                                onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep}
                                departmentColor="rgb(160, 100, 255)"
                            />
                        </div>
                    )}
                </div>

                <div className="w-72 bg-[#0d0a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto z-20">
                    <Slider label="Initial Velocity (v₀)" value={v0} onChange={setV0} min={5} max={100} step={1} />
                    <Slider label="Launch Angle (θ°)" value={angle} onChange={setAngle} min={0} max={90} step={1} />
                    <Slider label="Initial Height (m)" value={height} onChange={setHeight} min={0} max={100} step={1} />
                    <Slider label="Gravity (m/s²)" value={gravity} onChange={setGravity} min={1} max={25} step={0.1} />

                    <div className="h-px bg-white/10" />

                    <Toggle label="Air Resistance" value={airResistance} onChange={setAirResistance} />
                    {airResistance && (
                        <Slider label="Drag Coefficient" value={dragCoeff} onChange={setDragCoeff} min={0.01} max={0.5} step={0.01} />
                    )}
                    <Toggle label="Show Vectors" value={showVectors} onChange={setShowVectors} />
                    <Toggle label="Preview Path" value={showTrajectoryPreview} onChange={setShowTrajectoryPreview} />

                    <ButtonGroup
                        label="Comparison"
                        value={comparisonMode}
                        onChange={v => setComparisonMode(v as 'none' | 'angles' | 'drag')}
                        options={[
                            { value: 'none', label: 'None' },
                            { value: 'angles', label: '30°/60°' },
                        ]}
                        color="rgb(160, 100, 255)"
                    />

                    <Slider label="Time Scale" value={timeScale} onChange={setTimeScale} min={0.1} max={2} step={0.1} />

                    <div className="flex gap-2">
                        <button onClick={() => setIsRunning(!isRunning)} className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-purple-500 text-white hover:bg-purple-400'}`}>
                            {isRunning ? 'Pause' : 'Launch'}
                        </button>
                        <Button onClick={reset} variant="secondary" className="px-4 py-2.5 rounded-lg text-sm">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
