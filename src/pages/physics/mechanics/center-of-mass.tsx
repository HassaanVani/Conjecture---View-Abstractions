import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Select, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const PHYS_COLOR = 'rgb(160, 100, 255)'

interface Particle {
    x: number; y: number
    vx: number; vy: number
    mass: number
    color: string
    trail: Array<{ x: number; y: number }>
}

type Scenario = 'explosion' | 'collision' | 'orbit'

function createScenario(scenario: Scenario, numParticles: number, w: number, h: number): Particle[] {
    const cx = w / 2
    const cy = h / 2
    const colors = ['#a064ff', '#64b5f6', '#81c784', '#ffb74d', '#e57373', '#ba68c8', '#4dd0e1', '#fff176']

    if (scenario === 'explosion') {
        return Array.from({ length: numParticles }, (_, i) => ({
            x: cx + (Math.random() - 0.5) * 10,
            y: cy + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 120,
            mass: 1 + Math.random() * 3,
            color: colors[i % colors.length],
            trail: [],
        }))
    }
    if (scenario === 'collision') {
        const left: Particle[] = Array.from({ length: Math.ceil(numParticles / 2) }, (_, i) => ({
            x: cx - 200 + (Math.random() - 0.5) * 30,
            y: cy + (Math.random() - 0.5) * 60,
            vx: 60 + Math.random() * 30,
            vy: (Math.random() - 0.5) * 20,
            mass: 1 + Math.random() * 2,
            color: colors[i % colors.length],
            trail: [],
        }))
        const right: Particle[] = Array.from({ length: Math.floor(numParticles / 2) }, (_, i) => ({
            x: cx + 200 + (Math.random() - 0.5) * 30,
            y: cy + (Math.random() - 0.5) * 60,
            vx: -60 - Math.random() * 30,
            vy: (Math.random() - 0.5) * 20,
            mass: 1 + Math.random() * 2,
            color: colors[(i + 4) % colors.length],
            trail: [],
        }))
        return [...left, ...right]
    }
    // orbit
    return Array.from({ length: numParticles }, (_, i) => {
        const angle = (i / numParticles) * Math.PI * 2
        const r = 80 + Math.random() * 60
        const speed = 50 + Math.random() * 30
        return {
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
            vx: -Math.sin(angle) * speed,
            vy: Math.cos(angle) * speed,
            mass: 1 + Math.random() * 2,
            color: colors[i % colors.length],
            trail: [],
        }
    })
}

export default function CenterOfMass() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const particlesRef = useRef<Particle[]>([])
    const cmTrailRef = useRef<Array<{ x: number; y: number }>>([])

    const [isRunning, setIsRunning] = useState(false)
    const [numParticles, setNumParticles] = useState(5)
    const [scenario, setScenario] = useState<Scenario>('explosion')
    const [massScale, setMassScale] = useState(1.0)
    const [showTrails, setShowTrails] = useState('all')

    const initParticles = useCallback(() => {
        const canvas = canvasRef.current
        const w = canvas ? canvas.offsetWidth : 800
        const h = canvas ? canvas.offsetHeight : 600
        particlesRef.current = createScenario(scenario, numParticles, w, h)
        cmTrailRef.current = []
    }, [scenario, numParticles])

    const reset = useCallback(() => {
        setIsRunning(false)
        if (animRef.current) cancelAnimationFrame(animRef.current)
        initParticles()
    }, [initParticles])

    useEffect(() => { initParticles() }, [initParticles])

    const getCM = useCallback((): { x: number; y: number; vx: number; vy: number; M: number } => {
        const particles = particlesRef.current
        let M = 0, cmx = 0, cmy = 0, cvx = 0, cvy = 0
        for (const p of particles) {
            const m = p.mass * massScale
            M += m
            cmx += m * p.x
            cmy += m * p.y
            cvx += m * p.vx
            cvy += m * p.vy
        }
        return M > 0 ? { x: cmx / M, y: cmy / M, vx: cvx / M, vy: cvy / M, M } : { x: 0, y: 0, vx: 0, vy: 0, M: 0 }
    }, [massScale])

    const demoSteps: DemoStep[] = [
        {
            title: 'Center of Mass',
            description: 'The center of mass (CM) is the mass-weighted average position of all particles in a system. It represents where the system would balance if placed on a fulcrum.',
            setup: () => { reset(); setScenario('explosion') },
        },
        {
            title: 'CM Velocity is Constant',
            description: 'When no external forces act, the CM moves at constant velocity (or stays still). Internal forces cannot change the CM motion -- this is Newton\'s third law in action!',
            setup: () => { setScenario('explosion'); reset(); setIsRunning(true) },
        },
        {
            title: 'Explosion Scenario',
            description: 'Watch an explosion: particles fly apart, but the CM (white dot) stays nearly still. Internal explosive forces are equal and opposite, so the total momentum is conserved.',
            setup: () => { setScenario('explosion'); reset(); setIsRunning(true) },
        },
        {
            title: 'Collision Scenario',
            description: 'Two groups collide. Despite chaotic individual motion, the CM follows a smooth, predictable path. The total momentum of the system is preserved.',
            setup: () => { setScenario('collision'); reset(); setIsRunning(true) },
        },
        {
            title: 'Orbital Motion',
            description: 'Particles orbit a common center. The CM stays at the center because the internal gravitational forces are balanced. This is how binary stars work!',
            setup: () => { setScenario('orbit'); reset(); setIsRunning(true) },
        },
        {
            title: 'Mass Affects CM Position',
            description: 'Heavier particles pull the CM closer to them. Try adjusting the mass scale to see how the CM position shifts toward more massive particles.',
            setup: () => { setScenario('explosion'); setMassScale(2.0); reset() },
        },
        {
            title: 'Conservation of Momentum',
            description: 'P_total = M * v_cm is constant when F_ext = 0. The CM trajectory is always a straight line (or a point) regardless of how complex the internal dynamics are.',
            setup: () => { setScenario('collision'); reset(); setShowTrails('all'); setIsRunning(true) },
        },
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

        let lastTime = performance.now()

        const animate = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTime) / 1000, 0.05)
            lastTime = now
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            if (isRunning) {
                for (const p of particlesRef.current) {
                    p.x += p.vx * dt
                    p.y += p.vy * dt
                    p.trail.push({ x: p.x, y: p.y })
                    if (p.trail.length > 120) p.trail.shift()
                }
                const cm = getCM()
                cmTrailRef.current.push({ x: cm.x, y: cm.y })
                if (cmTrailRef.current.length > 500) cmTrailRef.current.shift()
            }

            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = '#0d0a1a'
            ctx.fillRect(0, 0, w, h)

            // Grid
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.04)'
            ctx.lineWidth = 1
            for (let x = 0; x < w; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
            }
            for (let y = 0; y < h; y += 40) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
            }

            // Particle trails
            if (showTrails === 'all' || showTrails === 'particles') {
                for (const p of particlesRef.current) {
                    if (p.trail.length > 1) {
                        ctx.beginPath()
                        p.trail.forEach((pt, i) => {
                            if (i === 0) ctx.moveTo(pt.x, pt.y)
                            else ctx.lineTo(pt.x, pt.y)
                        })
                        ctx.strokeStyle = p.color + '30'
                        ctx.lineWidth = 1
                        ctx.stroke()
                    }
                }
            }

            // CM trail
            if ((showTrails === 'all' || showTrails === 'cm') && cmTrailRef.current.length > 1) {
                ctx.beginPath()
                cmTrailRef.current.forEach((pt, i) => {
                    if (i === 0) ctx.moveTo(pt.x, pt.y)
                    else ctx.lineTo(pt.x, pt.y)
                })
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
                ctx.lineWidth = 2
                ctx.stroke()
            }

            // Particles
            for (const p of particlesRef.current) {
                const r = 6 + p.mass * massScale * 2.5
                const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2)
                glow.addColorStop(0, p.color + '40')
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath()
                ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2)
                ctx.fill()

                ctx.fillStyle = p.color
                ctx.beginPath()
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
                ctx.fill()
                ctx.strokeStyle = 'rgba(255,255,255,0.3)'
                ctx.lineWidth = 1
                ctx.stroke()

                // Velocity arrow
                const arrowLen = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 0.15
                if (arrowLen > 3) {
                    const ax = p.vx / Math.sqrt(p.vx * p.vx + p.vy * p.vy) * Math.min(arrowLen, 30)
                    const ay = p.vy / Math.sqrt(p.vx * p.vx + p.vy * p.vy) * Math.min(arrowLen, 30)
                    ctx.strokeStyle = p.color + '80'
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    ctx.moveTo(p.x, p.y)
                    ctx.lineTo(p.x + ax, p.y + ay)
                    ctx.stroke()
                }
            }

            // Center of mass
            const cm = getCM()
            const cmGlow = ctx.createRadialGradient(cm.x, cm.y, 0, cm.x, cm.y, 25)
            cmGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
            cmGlow.addColorStop(1, 'transparent')
            ctx.fillStyle = cmGlow
            ctx.beginPath()
            ctx.arc(cm.x, cm.y, 25, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = 'white'
            ctx.beginPath()
            ctx.arc(cm.x, cm.y, 6, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.8)'
            ctx.lineWidth = 2
            ctx.stroke()

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('CM', cm.x, cm.y - 14)

            // CM velocity arrow
            const cmSpeed = Math.sqrt(cm.vx * cm.vx + cm.vy * cm.vy)
            if (cmSpeed > 1) {
                const scale = Math.min(cmSpeed * 0.3, 40)
                const nvx = cm.vx / cmSpeed * scale
                const nvy = cm.vy / cmSpeed * scale
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(cm.x, cm.y)
                ctx.lineTo(cm.x + nvx, cm.y + nvy)
                ctx.stroke()
            }

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [isRunning, massScale, showTrails, getCM])

    const cm = getCM()
    const totalP = cm.M * Math.sqrt(cm.vx * cm.vx + cm.vy * cm.vy)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0d0a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full block" />

                <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
                    <APTag course="Physics C: Mech" unit="Unit 3" color={PHYS_COLOR} />
                    <InfoPanel
                        title="System State"
                        departmentColor={PHYS_COLOR}
                        items={[
                            { label: 'CM Position', value: `(${cm.x.toFixed(0)}, ${cm.y.toFixed(0)})` },
                            { label: 'CM Velocity', value: Math.sqrt(cm.vx * cm.vx + cm.vy * cm.vy).toFixed(1), unit: 'px/s' },
                            { label: 'Total Mass', value: cm.M.toFixed(1), unit: 'kg' },
                            { label: 'Total |p|', value: totalP.toFixed(1), unit: 'kg*px/s' },
                            { label: 'Particles', value: particlesRef.current.length.toString() },
                        ]}
                    />
                    <EquationDisplay
                        departmentColor={PHYS_COLOR}
                        title="Center of Mass"
                        equations={[
                            { label: 'Position', expression: 'r_cm = Sum(mi*ri) / M', description: 'Mass-weighted average position' },
                            { label: 'Velocity', expression: 'v_cm = Sum(mi*vi) / M', description: 'Or equivalently p_total / M' },
                            { label: 'Newton II', expression: 'F_ext = M * a_cm', description: 'CM obeys Newton\'s second law' },
                            { label: 'Conservation', expression: 'F_ext=0 => v_cm = const' },
                        ]}
                    />
                </div>

                <div className="absolute top-4 right-4 z-10">
                    <ControlPanel>
                        <ControlGroup label="Simulation">
                            <div className="flex gap-2">
                                <Button onClick={() => setIsRunning(!isRunning)} variant={isRunning ? 'secondary' : 'primary'}>
                                    {isRunning ? 'Pause' : 'Start'}
                                </Button>
                                <Button onClick={reset} variant="secondary">Reset</Button>
                            </div>
                        </ControlGroup>
                        <Select
                            label="Scenario"
                            value={scenario}
                            onChange={v => setScenario(v as Scenario)}
                            options={[
                                { value: 'explosion', label: 'Explosion' },
                                { value: 'collision', label: 'Collision' },
                                { value: 'orbit', label: 'Orbital' },
                            ]}
                        />
                        <Slider label="Number of Particles" value={numParticles} onChange={v => setNumParticles(Math.round(v))} min={2} max={8} step={1} />
                        <Slider label="Mass Scale" value={massScale} onChange={setMassScale} min={0.5} max={3} step={0.1} />
                        <ButtonGroup
                            label="Show Trails"
                            value={showTrails}
                            onChange={setShowTrails}
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'cm', label: 'CM Only' },
                                { value: 'particles', label: 'Particles' },
                            ]}
                            color={PHYS_COLOR}
                        />
                        <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
                    </ControlPanel>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <DemoMode
                        steps={demoSteps}
                        currentStep={demo.currentStep}
                        isOpen={demo.isOpen}
                        onClose={demo.close}
                        onNext={demo.next}
                        onPrev={demo.prev}
                        onGoToStep={demo.goToStep}
                        departmentColor={PHYS_COLOR}
                    />
                </div>
            </div>
        </div>
    )
}
