import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

const PHYSICS_COLOR = 'rgb(160, 100, 255)'

type SimMode = 'basic' | 'velocity-selector' | 'mass-spectrometer'

export default function MagneticParticle() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [bField, setBField] = useState(1.0)
    const [eField, setEField] = useState(0)
    const [velocity, setVelocity] = useState(5.0)
    const [charge, setCharge] = useState(1)
    const [mass, setMass] = useState(1.0)
    const [simMode, setSimMode] = useState<SimMode>('basic')
    const particleRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, path: [] as { x: number; y: number }[] })
    const isRunningRef = useRef(false)
    const animRef = useRef<number>(0)

    const fire = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const w = canvas.offsetWidth, h = canvas.offsetHeight

        if (simMode === 'velocity-selector') {
            particleRef.current = { x: 80, y: h / 2, vx: velocity * 20, vy: 0, path: [] }
        } else if (simMode === 'mass-spectrometer') {
            particleRef.current = { x: w / 2, y: 60, vx: 0, vy: velocity * 20, path: [] }
        } else {
            particleRef.current = { x: w / 2 - 120, y: h / 2, vx: velocity * 20, vy: 0, path: [] }
        }
        isRunningRef.current = true
    }, [velocity, simMode])

    useEffect(() => { fire() }, [velocity, simMode, fire])

    useEffect(() => {
        if (simMode === 'velocity-selector') {
            setEField(bField * velocity * 20 * 0.5)
        }
    }, [simMode, bField, velocity])

    const demoSteps: DemoStep[] = [
        { title: 'Magnetic Force', description: 'A charged particle in a magnetic field experiences a force F = qv x B. This force is always perpendicular to velocity.', highlight: 'The particle curves in a circle because F is centripetal.' },
        { title: 'Circular Motion', description: 'Since F is perpendicular to v, the speed stays constant but direction changes. The radius r = mv / (qB).', setup: () => { setSimMode('basic'); setBField(1.0); setVelocity(5); setMass(1); fire() }, highlight: 'Watch the circular path. r depends on m, v, q, and B.' },
        { title: 'Effect of Mass', description: 'Heavier particles have larger radius (r = mv/qB). This is the basis for mass spectrometry.', setup: () => { setMass(3.0); fire() }, highlight: 'Increase mass to see a larger orbit.' },
        { title: 'Effect of B Field', description: 'Stronger B field means tighter circles (smaller r). The field direction determines the curve direction.', setup: () => { setMass(1.0); setBField(2.0); fire() } },
        { title: 'Charge Sign', description: 'Positive and negative charges curve in opposite directions due to the cross product in F = qv x B.', setup: () => { setCharge(-1); setBField(1.0); fire() }, highlight: 'Flip charge to see the curve reverse.' },
        { title: 'Velocity Selector', description: 'Crossed E and B fields. Only particles with v = E/B pass straight through. Others are deflected.', setup: () => { setSimMode('velocity-selector'); setCharge(1); fire() }, highlight: 'The E field balances the magnetic force for the selected velocity.' },
        { title: 'Mass Spectrometer', description: 'After velocity selection, particles enter a pure B field region. Different masses curve differently, separating by m/q.', setup: () => { setSimMode('mass-spectrometer'); fire() }, highlight: 'Different masses land at different positions on the detector.' },
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

        if (particleRef.current.x === 0) fire()

        const animate = () => {
            const w = canvas.offsetWidth, h = canvas.offsetHeight
            const dt = 0.016
            const p = particleRef.current

            if (isRunningRef.current) {
                const B = bField
                const q = charge
                const m = mass
                const k = 0.5

                // Magnetic force: F = q(v x B)
                let ax = (q * p.vy * B) / m
                let ay = -(q * p.vx * B) / m

                // Electric force (for velocity selector)
                if (simMode === 'velocity-selector') {
                    ay += (q * eField) / m
                }

                p.vx += ax * k * dt * 60
                p.vy += ay * k * dt * 60
                p.x += p.vx * dt
                p.y += p.vy * dt

                if (p.path.length === 0 || Math.hypot(p.x - p.path[p.path.length - 1].x, p.y - p.path[p.path.length - 1].y) > 3) {
                    p.path.push({ x: p.x, y: p.y })
                    if (p.path.length > 800) p.path.shift()
                }

                // Bounds check
                if (p.x < -50 || p.x > w + 50 || p.y < -50 || p.y > h + 50) {
                    isRunningRef.current = false
                }
            }

            ctx.clearRect(0, 0, w, h)

            // B field background
            ctx.fillStyle = 'rgba(255,255,255,0.08)'
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'
            ctx.lineWidth = 1
            const spacing = 35

            if (simMode === 'velocity-selector') {
                // Selector region
                const selX = 60, selW = w - 120, selY = h * 0.3, selH = h * 0.4
                ctx.fillStyle = 'rgba(160, 100, 255, 0.05)'
                ctx.fillRect(selX, selY, selW, selH)
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.3)'
                ctx.lineWidth = 1
                ctx.strokeRect(selX, selY, selW, selH)

                // B field dots/crosses in selector
                for (let x = selX + 15; x < selX + selW; x += spacing) {
                    for (let y = selY + 15; y < selY + selH; y += spacing) {
                        if (bField > 0) {
                            ctx.fillStyle = 'rgba(100, 150, 255, 0.15)'
                            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
                        } else {
                            ctx.strokeStyle = 'rgba(100, 150, 255, 0.15)'
                            ctx.beginPath()
                            ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3)
                            ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3)
                            ctx.stroke()
                        }
                    }
                }

                // E field arrows
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)'
                ctx.lineWidth = 1
                for (let x = selX + 30; x < selX + selW; x += 60) {
                    const arrowDir = eField > 0 ? 1 : -1
                    ctx.beginPath()
                    ctx.moveTo(x, selY + selH * 0.3); ctx.lineTo(x, selY + selH * 0.7 * arrowDir + selY + selH * 0.3 * (1 - arrowDir))
                    ctx.stroke()
                }
                ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
                ctx.font = '11px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('E field', w / 2, selY - 8)
                ctx.fillStyle = 'rgba(100, 150, 255, 0.5)'
                ctx.fillText(`B = ${bField.toFixed(1)}T ${bField > 0 ? '(out)' : '(in)'}`, w / 2, selY + selH + 16)
            } else {
                // Full field background
                for (let x = 20; x < w; x += spacing) {
                    for (let y = 20; y < h; y += spacing) {
                        if (Math.abs(bField) < 0.1) continue
                        if (bField > 0) {
                            ctx.fillStyle = 'rgba(255,255,255,0.06)'
                            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
                            ctx.strokeStyle = 'rgba(255,255,255,0.04)'
                            ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke()
                        } else {
                            ctx.strokeStyle = 'rgba(255,255,255,0.06)'
                            ctx.beginPath()
                            ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4)
                            ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4)
                            ctx.stroke()
                        }
                    }
                }
            }

            // Mass spectrometer detector
            if (simMode === 'mass-spectrometer') {
                ctx.strokeStyle = 'rgba(100, 255, 100, 0.4)'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(w * 0.1, h - 40); ctx.lineTo(w * 0.9, h - 40)
                ctx.stroke()
                ctx.fillStyle = 'rgba(100, 255, 100, 0.5)'
                ctx.font = '11px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('Detector Plate', w / 2, h - 22)
            }

            // Particle path
            const pathColor = charge > 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)'
            ctx.strokeStyle = pathColor
            ctx.lineWidth = 2
            ctx.beginPath()
            p.path.forEach((pt, i) => {
                if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y)
            })
            ctx.stroke()

            // Particle body
            ctx.fillStyle = charge > 0 ? '#ef4444' : '#3b82f6'
            ctx.shadowColor = charge > 0 ? '#ef4444' : '#3b82f6'
            ctx.shadowBlur = 10
            ctx.beginPath()
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0

            ctx.fillStyle = 'white'
            ctx.font = 'bold 10px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(charge > 0 ? '+' : '-', p.x, p.y)

            // Radius calculation
            if (Math.abs(bField) > 0.1) {
                const vMag = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
                const rEst = (mass * vMag) / (Math.abs(charge * bField * 0.5 * 60))

                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '12px monospace'
                ctx.textAlign = 'left'
                ctx.fillText(`r = mv/qB ~ ${rEst.toFixed(1)} px`, 15, h - 15)
            }

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animRef.current) }
    }, [bField, eField, velocity, charge, mass, simMode])

    const radius = Math.abs(mass * velocity * 20) / Math.max(0.01, Math.abs(charge * bField * 0.5 * 60))

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
                        <h1 className="text-xl font-medium tracking-tight">Particle in Magnetic Field</h1>
                        <p className="text-xs text-white/50">Magnetism</p>
                    </div>
                    <APTag course="Physics 2" unit="Unit 5" color={PHYSICS_COLOR} />
                </div>
                <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                    <div className="absolute top-4 left-4 space-y-2">
                        <EquationDisplay departmentColor={PHYSICS_COLOR} title="Magnetic Force"
                            equations={[
                                { label: 'Lorentz', expression: 'F = qv x B', description: 'Force on moving charge' },
                                { label: 'Radius', expression: 'r = mv / |qB|', description: 'Circular orbit radius' },
                                { label: 'Selector', expression: 'v = E / B', description: 'Velocity selector condition' },
                            ]} />
                    </div>
                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PHYSICS_COLOR} title="Particle Info"
                            items={[
                                { label: 'Mode', value: simMode },
                                { label: 'B field', value: `${bField.toFixed(1)} T` },
                                { label: 'Velocity', value: `${velocity}` },
                                { label: 'Mass', value: `${mass} u` },
                                { label: 'Charge', value: charge > 0 ? '+q' : '-q' },
                                { label: 'Radius', value: radius.toFixed(1), unit: 'px' },
                            ]} />
                    </div>
                </div>

                <div className="w-72 bg-[#0d0a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <Button onClick={fire}>Fire Particle</Button>
                        <ButtonGroup label="Mode" value={simMode} onChange={v => setSimMode(v as SimMode)}
                            options={[
                                { value: 'basic', label: 'Basic' },
                                { value: 'velocity-selector', label: 'V-Select' },
                                { value: 'mass-spectrometer', label: 'Mass Spec' },
                            ]}
                            color={PHYSICS_COLOR} />
                        <ControlGroup label="Magnetic Field (B)">
                            <Slider value={bField} onChange={setBField} min={-2} max={2} step={0.1} label={`${bField.toFixed(1)} T ${bField > 0 ? '(out)' : '(in)'}`} />
                        </ControlGroup>
                        {simMode === 'velocity-selector' && (
                            <ControlGroup label="Electric Field (E)">
                                <Slider value={eField} onChange={setEField} min={-100} max={100} step={5} label={`${eField.toFixed(0)} N/C`} />
                            </ControlGroup>
                        )}
                        <ControlGroup label="Velocity (v)">
                            <Slider value={velocity} onChange={setVelocity} min={1} max={10} step={0.5} label={`${velocity}`} />
                        </ControlGroup>
                        <ControlGroup label="Charge (q)">
                            <ButtonGroup value={charge.toString()} onChange={v => setCharge(parseInt(v))}
                                options={[{ value: '1', label: '+q' }, { value: '-1', label: '-q' }]}
                                color={PHYSICS_COLOR} />
                        </ControlGroup>
                        <ControlGroup label="Mass (m)">
                            <Slider value={mass} onChange={setMass} min={0.5} max={5} step={0.5} label={`${mass} u`} />
                        </ControlGroup>
                    </ControlPanel>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={PHYSICS_COLOR} />
            </div>
        </div>
    )
}
