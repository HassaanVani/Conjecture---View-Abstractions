import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'

const PC = 'rgb(160, 100, 255)'
const G = 1

export default function Orbit() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [starMass, setStarMass] = useState(1000)
    const [initialV, setInitialV] = useState(3.5)
    const [initialR, setInitialR] = useState(150)
    const [showVectors, setShowVectors] = useState(true)
    const [showTrail, setShowTrail] = useState(true)
    const [showAreas, setShowAreas] = useState(false)

    const stateRef = useRef({
        t: 0, x: 150, y: 0, vx: 0, vy: 3.5,
        trail: [] as { x: number; y: number }[],
        areaPoints: [] as { x: number; y: number; t: number }[],
    })

    const reset = useCallback(() => {
        setIsRunning(false)
        stateRef.current = {
            t: 0, x: initialR, y: 0, vx: 0, vy: initialV,
            trail: [], areaPoints: [],
        }
    }, [initialR, initialV])

    useEffect(() => { if (!isRunning) reset() }, [starMass, initialV, initialR, reset, isRunning])

    const vCirc = Math.sqrt(G * starMass / initialR)
    const vEsc = Math.sqrt(2 * G * starMass / initialR)
    const curR = Math.sqrt(stateRef.current.x ** 2 + stateRef.current.y ** 2)
    const curV = Math.sqrt(stateRef.current.vx ** 2 + stateRef.current.vy ** 2)
    const KE = 0.5 * 10 * curV * curV
    const PE = -G * starMass * 10 / Math.max(curR, 1)
    const totalE = KE + PE

    const demoSteps = [
        { title: 'Orbital Motion', description: 'Explore gravitational orbits. A planet orbits a star under the force of gravity F = GMm/r\u00B2.', highlight: 'Click Start Orbit to begin.' },
        { title: 'Circular Orbit', description: 'Set velocity to the circular velocity for a perfect circle. The gravitational force provides centripetal acceleration.', setup: () => { setInitialV(Number(vCirc.toFixed(1))); setShowVectors(true) } },
        { title: 'Elliptical Orbit', description: 'Velocities between circular and escape produce ellipses. The orbit is bound but not circular.', setup: () => { setInitialV(Number((vCirc * 0.7).toFixed(1))) } },
        { title: 'Escape Velocity', description: 'At v_esc = sqrt(2GM/r), total energy is zero and the object escapes to infinity.', setup: () => { setInitialV(Number(vEsc.toFixed(1))) } },
        { title: "Kepler's 2nd Law", description: 'Equal areas are swept in equal times. Toggle the area display to see this principle in action.', setup: () => { setShowAreas(true); setInitialV(Number((vCirc * 0.7).toFixed(1))) } },
        { title: 'Orbital Energy', description: 'KE + PE is conserved. Watch how KE and PE trade off as the planet moves closer and farther from the star.', highlight: 'Check the Info Panel for live energy values.' },
        { title: 'Star Mass', description: 'Increasing the star mass increases gravitational pull, requiring higher velocities for stable orbits.', setup: () => { setStarMass(1500) } },
        { title: 'Experiment!', description: 'Try different combinations of velocity, distance, and star mass. Can you create a hyperbolic trajectory?' },
    ]

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        let animId: number
        const dt = 0.5

        const drawArrow = (fx: number, fy: number, tx: number, ty: number, color: string) => {
            const hl = 8
            const a = Math.atan2(ty - fy, tx - fx)
            ctx.strokeStyle = color; ctx.lineWidth = 2
            ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke()
            ctx.fillStyle = color; ctx.beginPath()
            ctx.moveTo(tx, ty)
            ctx.lineTo(tx - hl * Math.cos(a - Math.PI / 6), ty - hl * Math.sin(a - Math.PI / 6))
            ctx.lineTo(tx - hl * Math.cos(a + Math.PI / 6), ty - hl * Math.sin(a + Math.PI / 6))
            ctx.fill()
        }

        const animate = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const cx = w / 2
            const cy = h / 2
            const s = stateRef.current

            if (isRunning) {
                const r2 = s.x * s.x + s.y * s.y
                const r = Math.sqrt(r2)
                const F = (G * starMass) / r2
                s.vx += -F * (s.x / r) * dt
                s.vy += -F * (s.y / r) * dt
                s.x += s.vx * dt
                s.y += s.vy * dt
                s.t += dt

                if (showTrail && s.t % 2 < dt * 2) {
                    s.trail.push({ x: s.x, y: s.y })
                    if (s.trail.length > 500) s.trail.shift()
                }
                if (showAreas && s.t % 8 < dt * 2) {
                    s.areaPoints.push({ x: s.x, y: s.y, t: s.t })
                    if (s.areaPoints.length > 30) s.areaPoints.shift()
                }
            }

            ctx.clearRect(0, 0, w, h)

            // Star glow
            const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60)
            sg.addColorStop(0, 'rgba(251,191,36,0.4)')
            sg.addColorStop(1, 'rgba(251,191,36,0)')
            ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = '#fbbf24'; ctx.beginPath()
            ctx.arc(cx, cy, 18 + Math.log(starMass / 100) * 2, 0, Math.PI * 2); ctx.fill()

            // Kepler areas
            if (showAreas && s.areaPoints.length > 1) {
                for (let i = 0; i < s.areaPoints.length - 1; i++) {
                    ctx.fillStyle = i % 2 === 0 ? 'rgba(160,100,255,0.12)' : 'rgba(56,189,248,0.12)'
                    ctx.beginPath(); ctx.moveTo(cx, cy)
                    ctx.lineTo(cx + s.areaPoints[i].x, cy - s.areaPoints[i].y)
                    ctx.lineTo(cx + s.areaPoints[i + 1].x, cy - s.areaPoints[i + 1].y)
                    ctx.closePath(); ctx.fill()
                }
            }

            // Trail
            if (showTrail && s.trail.length > 1) {
                ctx.strokeStyle = 'rgba(160,100,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath()
                s.trail.forEach((p, i) => { i === 0 ? ctx.moveTo(cx + p.x, cy - p.y) : ctx.lineTo(cx + p.x, cy - p.y) })
                ctx.stroke()
            }

            // Planet
            const px = cx + s.x
            const py = cy - s.y
            ctx.fillStyle = PC; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill()

            if (showVectors) {
                const vs = 10
                drawArrow(px, py, px + s.vx * vs, py - s.vy * vs, '#22c55e')
                const r = Math.sqrt(s.x ** 2 + s.y ** 2) || 1
                drawArrow(px, py, px + (-s.x / r) * 40, py - (-s.y / r) * 40, '#ef4444')
            }

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [isRunning, starMass, initialV, initialR, showVectors, showTrail, showAreas])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Orbital Motion</h1>
                        <p className="text-xs text-white/50">Gravitation &amp; Kepler&apos;s Laws</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <APTag course="Physics 1" unit="Unit 3" color={PC} />
                    <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-[260px]">
                        <EquationDisplay departmentColor={PC} equations={[
                            { label: 'Gravity', expression: 'F = GMm/r\u00B2' },
                            { label: 'Circular v', expression: 'v_c = \u221A(GM/r)', description: `= ${vCirc.toFixed(2)}` },
                            { label: 'Escape v', expression: 'v_esc = \u221A(2GM/r)', description: `= ${vEsc.toFixed(2)}` },
                            { label: 'Energy', expression: 'E = \u00BDmv\u00B2 \u2212 GMm/r' },
                            { label: "Kepler 2", expression: 'dA/dt = L/(2m) = const' },
                        ]} />
                    </div>

                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PC} title="Orbital Data" items={[
                            { label: 'Distance (r)', value: curR, unit: '' },
                            { label: 'Speed (v)', value: curV },
                            { label: 'KE', value: KE, unit: 'J', color: '#22c55e' },
                            { label: 'PE', value: PE, unit: 'J', color: '#ef4444' },
                            { label: 'Total E', value: totalE, unit: 'J', color: PC },
                            { label: 'Circular v', value: vCirc },
                            { label: 'Escape v', value: vEsc },
                        ]} />
                    </div>

                    {demo.isOpen && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                            <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={PC} />
                        </div>
                    )}
                </div>

                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <Slider label={`Star Mass (M) \u2014 ${starMass}`} value={starMass} onChange={setStarMass} min={500} max={2000} step={50} />
                        <Slider label={`Initial Distance (r) \u2014 ${initialR}`} value={initialR} onChange={setInitialR} min={50} max={250} step={5} />
                        <Slider label={`Initial Velocity (v) \u2014 ${initialV}`} value={initialV} onChange={setInitialV} min={0} max={8} step={0.1} />
                        <div className="flex justify-between text-[10px] text-white/40">
                            <span className="cursor-pointer hover:text-white" onClick={() => setInitialV(Number(vCirc.toFixed(1)))}>Set Circular</span>
                            <span className="cursor-pointer hover:text-white" onClick={() => setInitialV(Number(vEsc.toFixed(1)))}>Set Escape</span>
                        </div>
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={() => setIsRunning(!isRunning)} className="flex-1">
                            {isRunning ? 'Pause' : 'Start Orbit'}
                        </Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>

                    <Toggle label="Velocity & Force Vectors" value={showVectors} onChange={setShowVectors} />
                    <Toggle label="Orbital Trail" value={showTrail} onChange={setShowTrail} />
                    <Toggle label="Kepler Area Sweep" value={showAreas} onChange={setShowAreas} />
                </div>
            </div>
        </div>
    )
}
