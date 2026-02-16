import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'

const PC = 'rgb(160, 100, 255)'

interface Ball {
    x: number; y: number; vx: number; vy: number
    mass: number; radius: number; color: string
}

export default function Collision() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [elasticity, setElasticity] = useState(1.0)
    const [mass1, setMass1] = useState(5)
    const [mass2, setMass2] = useState(5)
    const [showVectors, setShowVectors] = useState(true)
    const [showMomentum, setShowMomentum] = useState(true)
    const [showCOMFrame, setShowCOMFrame] = useState(false)

    const stateRef = useRef<{ balls: Ball[] }>({
        balls: [
            { x: 100, y: 300, vx: 5, vy: 0, mass: 5, radius: 30, color: '#3b82f6' },
            { x: 500, y: 300, vx: -3, vy: 0, mass: 5, radius: 30, color: '#ec4899' },
        ],
    })

    useEffect(() => {
        if (!isRunning) {
            stateRef.current.balls[0].mass = mass1
            stateRef.current.balls[0].radius = 20 + Math.sqrt(mass1) * 5
            stateRef.current.balls[1].mass = mass2
            stateRef.current.balls[1].radius = 20 + Math.sqrt(mass2) * 5
        }
    }, [mass1, mass2, isRunning])

    const reset = useCallback(() => {
        setIsRunning(false)
        const canvas = canvasRef.current
        const w = canvas ? canvas.offsetWidth : 800
        const h = canvas ? canvas.offsetHeight : 600
        stateRef.current.balls = [
            { x: w * 0.2, y: h / 2, vx: 5, vy: 0, mass: mass1, radius: 20 + Math.sqrt(mass1) * 5, color: '#3b82f6' },
            { x: w * 0.8, y: h / 2, vx: -3, vy: 0, mass: mass2, radius: 20 + Math.sqrt(mass2) * 5, color: '#ec4899' },
        ]
    }, [mass1, mass2])

    const b1 = stateRef.current.balls[0]
    const b2 = stateRef.current.balls[1]
    const px = b1.mass * b1.vx + b2.mass * b2.vx
    const py = b1.mass * b1.vy + b2.mass * b2.vy
    const pTotal = Math.sqrt(px * px + py * py)
    const keTotal = 0.5 * b1.mass * (b1.vx ** 2 + b1.vy ** 2) + 0.5 * b2.mass * (b2.vx ** 2 + b2.vy ** 2)
    const comVx = px / (b1.mass + b2.mass)

    const demoSteps = [
        { title: 'Momentum Conservation', description: 'In any collision, total momentum is conserved: p_before = p_after. This simulation shows 1D collisions between two objects.', highlight: 'Adjust elasticity and masses.' },
        { title: 'Elastic Collision', description: 'With e=1 (perfectly elastic), both momentum AND kinetic energy are conserved. Objects bounce off each other.', setup: () => { setElasticity(1); setMass1(5); setMass2(5) } },
        { title: 'Inelastic Collision', description: 'With e=0 (perfectly inelastic), objects stick together. Momentum is conserved but kinetic energy is lost to deformation.', setup: () => { setElasticity(0) } },
        { title: 'Unequal Masses', description: 'When a heavy object hits a light one, the light one flies away fast. When a light object hits a heavy one, it bounces back.', setup: () => { setElasticity(1); setMass1(15); setMass2(3) } },
        { title: 'Momentum Vectors', description: 'The colored arrows show each object\u2019s momentum vector. The total system momentum stays constant throughout.', setup: () => { setShowMomentum(true); setShowVectors(true) } },
        { title: 'Center of Mass Frame', description: 'Toggle the COM frame view. In this frame, the center of mass is stationary and the objects move symmetrically.', setup: () => { setShowCOMFrame(true) } },
        { title: 'Restitution', description: 'The coefficient of restitution e = (v2\u2032-v1\u2032)/(v1-v2) determines how much bounce there is. Try intermediate values.', setup: () => { setElasticity(0.5); setShowCOMFrame(false) } },
        { title: 'Explore!', description: 'Combine different masses, elasticities, and views. Verify that total momentum is always conserved.' },
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
        if (stateRef.current.balls[0].x === 100) reset()

        let animId: number
        const dt = 0.5

        const drawArrow = (fx: number, fy: number, tx: number, ty: number, color: string, label?: string) => {
            const hl = 8; const a = Math.atan2(ty - fy, tx - fx)
            ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath()
            ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke()
            ctx.fillStyle = color; ctx.beginPath()
            ctx.moveTo(tx, ty)
            ctx.lineTo(tx - hl * Math.cos(a - Math.PI / 6), ty - hl * Math.sin(a - Math.PI / 6))
            ctx.lineTo(tx - hl * Math.cos(a + Math.PI / 6), ty - hl * Math.sin(a + Math.PI / 6))
            ctx.fill()
            if (label) { ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText(label, tx, ty - 8) }
        }

        const animate = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const balls = stateRef.current.balls
            const comVxNow = (balls[0].mass * balls[0].vx + balls[1].mass * balls[1].vx) / (balls[0].mass + balls[1].mass)

            if (isRunning) {
                balls.forEach(b => {
                    b.x += b.vx * dt; b.y += b.vy * dt
                    if (b.x - b.radius < 0) { b.x = b.radius; b.vx *= -1 }
                    if (b.x + b.radius > w) { b.x = w - b.radius; b.vx *= -1 }
                    if (b.y - b.radius < 0) { b.y = b.radius; b.vy *= -1 }
                    if (b.y + b.radius > h) { b.y = h - b.radius; b.vy *= -1 }
                })
                const dx = balls[1].x - balls[0].x
                const dy = balls[1].y - balls[0].y
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist < balls[0].radius + balls[1].radius) {
                    const nx = dx / dist; const ny = dy / dist
                    const dvx = balls[0].vx - balls[1].vx
                    const dvy = balls[0].vy - balls[1].vy
                    const vn = dvx * nx + dvy * ny
                    if (vn > 0) {
                        const imp = -(1 + elasticity) * vn / (1 / balls[0].mass + 1 / balls[1].mass)
                        balls[0].vx += imp * nx / balls[0].mass; balls[0].vy += imp * ny / balls[0].mass
                        balls[1].vx -= imp * nx / balls[1].mass; balls[1].vy -= imp * ny / balls[1].mass
                    }
                }
            }

            ctx.clearRect(0, 0, w, h)

            // Center of mass marker
            const comX = (balls[0].x * balls[0].mass + balls[1].x * balls[1].mass) / (balls[0].mass + balls[1].mass)
            const comY = (balls[0].y * balls[0].mass + balls[1].y * balls[1].mass) / (balls[0].mass + balls[1].mass)
            ctx.strokeStyle = 'rgba(160,100,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
            ctx.beginPath(); ctx.moveTo(comX, 0); ctx.lineTo(comX, h); ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = PC; ctx.font = '10px monospace'; ctx.textAlign = 'center'
            ctx.fillText('COM', comX, 14)

            balls.forEach(b => {
                const drawX = showCOMFrame ? b.x - comVxNow * stateRef.current.balls[0].x / (b.vx || 1) : b.x
                const bx = showCOMFrame ? w / 2 + (b.x - comX) : b.x
                const by = b.y

                ctx.fillStyle = b.color; ctx.beginPath()
                ctx.arc(bx, by, b.radius, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'white'; ctx.font = '12px monospace'
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
                ctx.fillText(`${b.mass}kg`, bx, by)

                if (showVectors) {
                    const vx = showCOMFrame ? b.vx - comVxNow : b.vx
                    drawArrow(bx, by, bx + vx * 10, by + b.vy * 10, 'rgba(255,255,255,0.5)', 'v')
                }
                if (showMomentum) {
                    const mvx = showCOMFrame ? b.mass * (b.vx - comVxNow) : b.mass * b.vx
                    drawArrow(bx, by + b.radius + 5, bx + mvx * 3, by + b.radius + 5, b.color, 'p')
                }
            })

            if (showCOMFrame) {
                ctx.fillStyle = 'rgba(160,100,255,0.15)'; ctx.fillRect(0, 0, w, h)
                ctx.fillStyle = PC; ctx.font = '12px monospace'; ctx.textAlign = 'center'
                ctx.fillText('Center of Mass Frame', w / 2, h - 20)
            }

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [isRunning, mass1, mass2, elasticity, showVectors, showMomentum, showCOMFrame, reset])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Collision Lab</h1>
                        <p className="text-xs text-white/50">Momentum &amp; Impulse</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <APTag course="Physics 1" unit="Unit 5" color={PC} />
                    <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-[260px]">
                        <EquationDisplay departmentColor={PC} equations={[
                            { label: 'Momentum', expression: 'p = mv' },
                            { label: 'Conservation', expression: 'm\u2081v\u2081 + m\u2082v\u2082 = m\u2081v\u2081\u2032 + m\u2082v\u2082\u2032' },
                            { label: 'Impulse', expression: 'J = \u0394p = F\u0394t' },
                            { label: 'Restitution', expression: 'e = (v\u2082\u2032\u2212v\u2081\u2032)/(v\u2081\u2212v\u2082)' },
                            { label: 'KE', expression: 'KE = \u00BDmv\u00B2' },
                        ]} />
                    </div>

                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PC} title="System Data" items={[
                            { label: 'Total p', value: pTotal, unit: 'kg\u00B7m/s', color: PC },
                            { label: 'Total KE', value: keTotal, unit: 'J', color: '#eab308' },
                            { label: 'Blue v', value: b1.vx, unit: 'm/s', color: '#3b82f6' },
                            { label: 'Pink v', value: b2.vx, unit: 'm/s', color: '#ec4899' },
                            { label: 'Blue p', value: b1.mass * b1.vx, unit: 'kg\u00B7m/s', color: '#3b82f6' },
                            { label: 'Pink p', value: b2.mass * b2.vx, unit: 'kg\u00B7m/s', color: '#ec4899' },
                            { label: 'COM v', value: comVx, unit: 'm/s' },
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
                        <Slider label={`Elasticity (e) \u2014 ${elasticity.toFixed(2)}`} value={elasticity} onChange={setElasticity} min={0} max={1} step={0.05} />
                        <Slider label={`Blue Mass \u2014 ${mass1} kg`} value={mass1} onChange={setMass1} min={1} max={20} step={1} />
                        <Slider label={`Pink Mass \u2014 ${mass2} kg`} value={mass2} onChange={setMass2} min={1} max={20} step={1} />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={() => setIsRunning(!isRunning)} className="flex-1">
                            {isRunning ? 'Pause' : 'Start'}
                        </Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>

                    <Toggle label="Velocity Vectors" value={showVectors} onChange={setShowVectors} />
                    <Toggle label="Momentum Vectors" value={showMomentum} onChange={setShowMomentum} />
                    <Toggle label="COM Frame View" value={showCOMFrame} onChange={setShowCOMFrame} />
                </div>
            </div>
        </div>
    )
}
