import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

const PHYSICS_COLOR = 'rgb(160, 100, 255)'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    speed: number
}

type ProcessType = 'free' | 'isothermal' | 'adiabatic' | 'isobaric'

export default function IdealGas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(true)
    const [temperature, setTemperature] = useState(300)
    const [volume, setVolume] = useState(1.0)
    const [particleCount, setParticleCount] = useState(80)
    const [process, setProcess] = useState<ProcessType>('free')
    const [showDistribution, setShowDistribution] = useState(true)
    const particlesRef = useRef<Particle[]>([])
    const wallHitsRef = useRef(0)
    const tempRef = useRef(temperature)

    const initParticles = useCallback((count: number, temp: number, vol: number) => {
        const particles: Particle[] = []
        const speedScale = Math.sqrt(temp / 300) * 3
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const sp = (0.5 + Math.random() * 2) * speedScale
            particles.push({
                x: (Math.random() - 0.5) * 300 * vol,
                y: (Math.random() - 0.5) * 220,
                vx: Math.cos(angle) * sp,
                vy: Math.sin(angle) * sp,
                speed: sp,
            })
        }
        return particles
    }, [])

    useEffect(() => {
        particlesRef.current = initParticles(particleCount, temperature, volume)
        tempRef.current = temperature
    }, [particleCount, initParticles])

    useEffect(() => {
        const ratio = Math.sqrt(temperature / tempRef.current)
        particlesRef.current.forEach(p => {
            p.vx *= ratio; p.vy *= ratio
            p.speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        })
        tempRef.current = temperature
    }, [temperature])

    useEffect(() => {
        if (process === 'isothermal') {
            // PV = const => T fixed already
        } else if (process === 'adiabatic') {
            // TV^(gamma-1) = const, gamma=5/3 for monatomic
            const gamma = 5 / 3
            const T0 = 300
            const V0 = 1.0
            const newT = T0 * Math.pow(V0 / volume, gamma - 1)
            setTemperature(Math.round(Math.max(50, Math.min(800, newT))))
        }
    }, [volume, process])

    const demoSteps: DemoStep[] = [
        { title: 'Ideal Gas Law', description: 'PV = nRT connects pressure, volume, amount, and temperature of an ideal gas.', highlight: 'Watch particle motion as a model of gas behavior.' },
        { title: 'Temperature & Speed', description: 'Temperature is the average kinetic energy of particles. Higher T means faster particles.', setup: () => { setTemperature(500); setVolume(1.0); setProcess('free') }, highlight: 'Increase temperature and watch particle speeds rise.' },
        { title: 'Volume & Pressure', description: 'Decreasing volume forces particles closer, increasing wall collisions (pressure).', setup: () => { setVolume(0.6); setTemperature(300) }, highlight: 'Smaller box = more collisions = higher pressure.' },
        { title: 'Maxwell-Boltzmann Distribution', description: 'Particle speeds follow a statistical distribution. The peak shifts right at higher temperatures.', setup: () => { setShowDistribution(true); setTemperature(300) }, highlight: 'The speed distribution graph shows the spread of particle velocities.' },
        { title: 'Isothermal Process', description: 'Temperature stays constant. If volume decreases, pressure increases proportionally (PV = const).', setup: () => { setProcess('isothermal'); setVolume(1.0) }, highlight: 'Select Isothermal and change volume.' },
        { title: 'Adiabatic Process', description: 'No heat exchange. Compressing the gas increases temperature (TV^(gamma-1) = const).', setup: () => { setProcess('adiabatic'); setVolume(1.0) }, highlight: 'Compress the gas and watch temperature rise automatically.' },
        { title: 'Isobaric Process', description: 'Constant pressure. Heating the gas expands the volume proportionally.', setup: () => { setProcess('isobaric'); setTemperature(300); setVolume(1.0) }, highlight: 'In isobaric mode, V changes with T to keep P constant.' },
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

        let animId: number
        const animate = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const boxW = 380 * volume
            const boxH = 260
            const cx = w * 0.4
            const cy = h * 0.45
            const halfW = boxW / 2
            const halfH = boxH / 2

            if (isRunning) {
                wallHitsRef.current = 0
                particlesRef.current.forEach(p => {
                    p.x += p.vx; p.y += p.vy
                    if (p.x > halfW) { p.x = halfW; p.vx = -Math.abs(p.vx); wallHitsRef.current++ }
                    else if (p.x < -halfW) { p.x = -halfW; p.vx = Math.abs(p.vx); wallHitsRef.current++ }
                    if (p.y > halfH) { p.y = halfH; p.vy = -Math.abs(p.vy); wallHitsRef.current++ }
                    else if (p.y < -halfH) { p.y = -halfH; p.vy = Math.abs(p.vy); wallHitsRef.current++ }
                    p.speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
                })
            }

            ctx.clearRect(0, 0, w, h)

            // Box
            ctx.save()
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
            ctx.lineWidth = 2
            ctx.shadowColor = PHYSICS_COLOR
            ctx.shadowBlur = 12
            ctx.strokeRect(cx - halfW, cy - halfH, boxW, boxH)
            ctx.restore()

            // Piston indicator
            ctx.fillStyle = 'rgba(160, 100, 255, 0.3)'
            ctx.fillRect(cx + halfW - 6, cy - halfH, 6, boxH)

            // Particles
            particlesRef.current.forEach(p => {
                const speedNorm = Math.min(1, p.speed / 8)
                const r = Math.round(100 + speedNorm * 155)
                const g = Math.round(100 - speedNorm * 60)
                const b = Math.round(255 - speedNorm * 155)
                ctx.fillStyle = `rgb(${r},${g},${b})`
                ctx.beginPath()
                ctx.arc(cx + p.x, cy + p.y, 3, 0, Math.PI * 2)
                ctx.fill()
            })

            // Maxwell-Boltzmann distribution graph
            if (showDistribution) {
                const gx = w * 0.65
                const gy = h * 0.15
                const gw = w * 0.3
                const gh = h * 0.35

                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
                ctx.fillRect(gx, gy, gw, gh)
                ctx.strokeStyle = 'rgba(255,255,255,0.15)'
                ctx.lineWidth = 1
                ctx.strokeRect(gx, gy, gw, gh)

                // Histogram of speeds
                const bins = 20
                const maxSpeed = 10
                const counts = new Array(bins).fill(0)
                particlesRef.current.forEach(p => {
                    const bin = Math.min(bins - 1, Math.floor((p.speed / maxSpeed) * bins))
                    counts[bin]++
                })
                const maxCount = Math.max(1, ...counts)

                const barW = gw / bins
                counts.forEach((c, i) => {
                    const barH = (c / maxCount) * (gh - 30)
                    const x = gx + i * barW
                    const gradient = ctx.createLinearGradient(x, gy + gh - barH, x, gy + gh)
                    gradient.addColorStop(0, 'rgba(160, 100, 255, 0.8)')
                    gradient.addColorStop(1, 'rgba(160, 100, 255, 0.2)')
                    ctx.fillStyle = gradient
                    ctx.fillRect(x + 1, gy + gh - barH - 15, barW - 2, barH)
                })

                // Theoretical MB curve
                const kT = temperature / 300
                ctx.beginPath()
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)'
                ctx.lineWidth = 2
                for (let i = 0; i < gw; i++) {
                    const v = (i / gw) * maxSpeed
                    const f = v * v * Math.exp(-v * v / (2 * kT * 2)) / (kT * kT)
                    const normF = f * 2.5
                    const y = gy + gh - 15 - normF * (gh - 30)
                    if (i === 0) ctx.moveTo(gx + i, y)
                    else ctx.lineTo(gx + i, y)
                }
                ctx.stroke()

                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '11px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('Speed Distribution', gx + gw / 2, gy + 12)
                ctx.fillText('speed', gx + gw / 2, gy + gh - 2)
                ctx.fillStyle = 'rgba(255, 200, 100, 0.7)'
                ctx.textAlign = 'left'
                ctx.fillText('MB Theory', gx + 5, gy + 25)
            }

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [isRunning, volume, temperature, showDistribution])

    const pressure = ((particleCount * temperature) / (volume * 10000) * 8.314)
    const vrms = Math.sqrt(3 * 8.314 * temperature / 28).toFixed(1)

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
                        <h1 className="text-xl font-medium tracking-tight">Ideal Gas Law</h1>
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
                            title="Gas Laws"
                            equations={[
                                { label: 'Ideal Gas', expression: 'PV = nRT', description: 'Pressure, volume, moles, temperature' },
                                { label: 'KE avg', expression: 'KE = (3/2)kT', description: 'Average kinetic energy per molecule' },
                                { label: 'RMS speed', expression: 'v_rms = sqrt(3RT/M)', description: 'Root mean square molecular speed' },
                            ]}
                        />
                    </div>
                    <div className="absolute top-4 right-4">
                        <InfoPanel
                            departmentColor={PHYSICS_COLOR}
                            title="State Variables"
                            items={[
                                { label: 'Pressure', value: pressure.toFixed(2), unit: 'atm' },
                                { label: 'Volume', value: volume.toFixed(2), unit: 'L' },
                                { label: 'Temperature', value: temperature, unit: 'K' },
                                { label: 'Particles', value: particleCount },
                                { label: 'v_rms', value: vrms, unit: 'm/s' },
                            ]}
                        />
                    </div>
                </div>

                <div className="w-72 bg-[#0d0a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <div className="flex gap-2">
                            <Button onClick={() => setIsRunning(!isRunning)} variant={isRunning ? 'secondary' : 'primary'}>
                                {isRunning ? 'Pause' : 'Play'}
                            </Button>
                            <Button onClick={() => { particlesRef.current = initParticles(particleCount, temperature, volume) }} variant="secondary">
                                Reset
                            </Button>
                        </div>
                        <ButtonGroup
                            label="Process"
                            value={process}
                            onChange={v => setProcess(v as ProcessType)}
                            options={[
                                { value: 'free', label: 'Free' },
                                { value: 'isothermal', label: 'Isothermal' },
                                { value: 'adiabatic', label: 'Adiabatic' },
                                { value: 'isobaric', label: 'Isobaric' },
                            ]}
                            color={PHYSICS_COLOR}
                        />
                        <ControlGroup label="Temperature (K)">
                            <Slider value={temperature} onChange={setTemperature} min={50} max={800} step={10} label={`${temperature} K`} />
                        </ControlGroup>
                        <ControlGroup label="Volume">
                            <Slider value={volume} onChange={setVolume} min={0.4} max={1.6} step={0.05} label={`${volume.toFixed(2)}x`} />
                        </ControlGroup>
                        <ControlGroup label="Particles">
                            <Slider value={particleCount} onChange={setParticleCount} min={10} max={200} step={5} label={`${particleCount}`} />
                        </ControlGroup>
                        <Button onClick={() => setShowDistribution(!showDistribution)} variant="secondary">
                            {showDistribution ? 'Hide' : 'Show'} Distribution
                        </Button>
                    </ControlPanel>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <DemoMode
                    steps={demoSteps}
                    currentStep={demo.currentStep}
                    isOpen={demo.isOpen}
                    onClose={demo.close}
                    onNext={demo.next}
                    onPrev={demo.prev}
                    onGoToStep={demo.goToStep}
                    departmentColor={PHYSICS_COLOR}
                />
            </div>
        </div>
    )
}
