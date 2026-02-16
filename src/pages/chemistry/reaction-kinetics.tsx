import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CHEM_COLOR = 'rgb(251, 146, 60)'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    energy: number
    reacted: boolean
}

export default function ReactionKinetics() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [temperature, setTemperature] = useState(300)
    const [concentration, setConcentration] = useState(50)
    const [activationEnergy, setActivationEnergy] = useState(50)
    const [showEnergyDiagram, setShowEnergyDiagram] = useState(true)
    const [hasCatalyst, setHasCatalyst] = useState(false)
    const [showDistribution, setShowDistribution] = useState(false)

    const particlesRef = useRef<Particle[]>([])
    const reactionCountRef = useRef(0)
    const rateHistoryRef = useRef<number[]>([])
    const frameRef = useRef(0)

    const effectiveEa = hasCatalyst ? activationEnergy * 0.6 : activationEnergy

    const initParticles = useCallback(() => {
        const particles: Particle[] = []
        for (let i = 0; i < concentration; i++) {
            particles.push({
                x: Math.random() * 700 + 50,
                y: Math.random() * 400 + 50,
                vx: (Math.random() - 0.5) * (temperature / 100),
                vy: (Math.random() - 0.5) * (temperature / 100),
                energy: Math.random() * 100,
                reacted: false,
            })
        }
        particlesRef.current = particles
        reactionCountRef.current = 0
        rateHistoryRef.current = []
        frameRef.current = 0
    }, [concentration, temperature])

    const reset = useCallback(() => {
        setIsRunning(false)
        initParticles()
    }, [initParticles])

    useEffect(() => { initParticles() }, [initParticles])

    const demoSteps: DemoStep[] = [
        { title: 'Collision Theory', description: 'Particles must collide with sufficient energy and proper orientation to react. Watch how molecules bounce around.', setup: () => { setTemperature(300); setConcentration(50); setActivationEnergy(50); setHasCatalyst(false); setShowEnergyDiagram(true) } },
        { title: 'Temperature Effect', description: 'Higher temperature means faster particles with more kinetic energy. More collisions exceed the activation energy barrier.', setup: () => { setTemperature(450); setConcentration(50); setActivationEnergy(50); setHasCatalyst(false) } },
        { title: 'Low Temperature', description: 'At low temperatures, particles move slowly. Few collisions have enough energy to overcome Ea.', setup: () => { setTemperature(150); setConcentration(50); setActivationEnergy(50); setHasCatalyst(false) } },
        { title: 'Concentration Effect', description: 'More particles means more frequent collisions. The rate law shows rate is proportional to concentration.', setup: () => { setTemperature(300); setConcentration(90); setActivationEnergy(50); setHasCatalyst(false) } },
        { title: 'Activation Energy', description: 'Ea is the minimum energy needed for a reaction. Higher Ea means fewer successful collisions.', setup: () => { setTemperature(300); setConcentration(50); setActivationEnergy(80); setHasCatalyst(false); setShowEnergyDiagram(true) } },
        { title: 'Catalyst Effect', description: 'A catalyst lowers the activation energy without being consumed. It provides an alternative reaction pathway.', highlight: 'Toggle the catalyst and observe how more reactions occur.', setup: () => { setTemperature(300); setConcentration(50); setActivationEnergy(70); setHasCatalyst(true); setShowEnergyDiagram(true) } },
        { title: 'Energy Distribution', description: 'The Maxwell-Boltzmann distribution shows how particle energies spread. Only particles above Ea can react.', setup: () => { setShowDistribution(true); setTemperature(300); setActivationEnergy(50); setHasCatalyst(false) } },
        { title: 'Rate Law', description: 'rate = k[A]^n. The Arrhenius equation gives k = A*e^(-Ea/RT). Temperature and Ea together determine the rate constant k.', setup: () => { setTemperature(350); setConcentration(60); setActivationEnergy(50) } },
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

        const animate = () => {
            const rect = canvas.getBoundingClientRect()
            const width = rect.width
            const height = rect.height

            ctx.fillStyle = '#1a120a'
            ctx.fillRect(0, 0, width, height)

            const particles = particlesRef.current
            const tempFactor = temperature / 300
            const ea = effectiveEa

            if (isRunning) {
                frameRef.current++
                let frameReactions = 0

                particles.forEach(p => {
                    if (p.reacted) return
                    p.x += p.vx * tempFactor * 2
                    p.y += p.vy * tempFactor * 2
                    if (p.x < 10 || p.x > width - 10) p.vx *= -1
                    if (p.y < 10 || p.y > height - 10) p.vy *= -1
                    p.x = Math.max(10, Math.min(width - 10, p.x))
                    p.y = Math.max(10, Math.min(height - 10, p.y))
                    p.energy += (Math.random() - 0.5) * tempFactor * 5
                    p.energy = Math.max(0, Math.min(100, p.energy))
                })

                for (let i = 0; i < particles.length; i++) {
                    if (particles[i].reacted) continue
                    for (let j = i + 1; j < particles.length; j++) {
                        if (particles[j].reacted) continue
                        const dx = particles[i].x - particles[j].x
                        const dy = particles[i].y - particles[j].y
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        if (dist < 20) {
                            const totalEnergy = particles[i].energy + particles[j].energy
                            if (totalEnergy > ea) {
                                particles[i].reacted = true
                                particles[j].reacted = true
                                reactionCountRef.current++
                                frameReactions++
                            } else {
                                const nx = dx / dist
                                const ny = dy / dist
                                const dvx = particles[i].vx - particles[j].vx
                                const dvy = particles[i].vy - particles[j].vy
                                const dvn = dvx * nx + dvy * ny
                                particles[i].vx -= nx * dvn
                                particles[i].vy -= ny * dvn
                                particles[j].vx += nx * dvn
                                particles[j].vy += ny * dvn
                            }
                        }
                    }
                }

                rateHistoryRef.current.push(frameReactions)
                if (rateHistoryRef.current.length > 120) rateHistoryRef.current.shift()
            }

            // Draw particles
            particles.forEach(p => {
                if (p.reacted) {
                    ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
                    ctx.fill()
                } else {
                    const energyRatio = p.energy / 100
                    const hasEnoughEnergy = p.energy > ea / 2
                    if (hasEnoughEnergy) {
                        ctx.fillStyle = `rgba(255, 160, 80, ${energyRatio * 0.3})`
                        ctx.beginPath()
                        ctx.arc(p.x, p.y, 12 + energyRatio * 8, 0, Math.PI * 2)
                        ctx.fill()
                    }
                    ctx.fillStyle = `rgba(255, ${160 - energyRatio * 80}, ${80 - energyRatio * 80}, 0.9)`
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, 6 + energyRatio * 4, 0, Math.PI * 2)
                    ctx.fill()
                }
            })

            // Energy diagram (activation energy profile)
            if (showEnergyDiagram) {
                const dx0 = 20, dy0 = height - 180, dw = 200, dh = 150
                ctx.fillStyle = 'rgba(0,0,0,0.5)'
                ctx.fillRect(dx0 - 5, dy0 - 15, dw + 10, dh + 30)

                ctx.strokeStyle = 'rgba(255,255,255,0.2)'
                ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(dx0, dy0 + dh); ctx.lineTo(dx0, dy0); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(dx0, dy0 + dh); ctx.lineTo(dx0 + dw, dy0 + dh); ctx.stroke()

                // Reactants level
                const reactantY = dy0 + dh - 30
                const productY = dy0 + dh - 50
                const peakY = dy0 + dh - 30 - (activationEnergy / 100) * (dh - 50)
                const catalystPeakY = dy0 + dh - 30 - (effectiveEa / 100) * (dh - 50)

                // Uncatalyzed path
                ctx.strokeStyle = 'rgba(251, 146, 60, 0.7)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(dx0 + 10, reactantY)
                ctx.lineTo(dx0 + 40, reactantY)
                ctx.quadraticCurveTo(dx0 + dw / 2, peakY - 20, dx0 + dw - 40, productY)
                ctx.lineTo(dx0 + dw - 10, productY)
                ctx.stroke()

                // Catalyzed path
                if (hasCatalyst) {
                    ctx.strokeStyle = 'rgba(80, 200, 120, 0.7)'
                    ctx.setLineDash([4, 4])
                    ctx.beginPath()
                    ctx.moveTo(dx0 + 10, reactantY)
                    ctx.lineTo(dx0 + 40, reactantY)
                    ctx.quadraticCurveTo(dx0 + dw / 2, catalystPeakY - 20, dx0 + dw - 40, productY)
                    ctx.lineTo(dx0 + dw - 10, productY)
                    ctx.stroke()
                    ctx.setLineDash([])
                }

                // Ea arrow
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)'
                ctx.lineWidth = 1
                const arrowX = dx0 + 45
                ctx.beginPath()
                ctx.moveTo(arrowX, reactantY)
                ctx.lineTo(arrowX, hasCatalyst ? catalystPeakY : peakY)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                ctx.font = '10px Inter'
                ctx.textAlign = 'left'
                ctx.fillText(`Ea${hasCatalyst ? ' (cat)' : ''} = ${effectiveEa.toFixed(0)}`, arrowX + 5, (reactantY + (hasCatalyst ? catalystPeakY : peakY)) / 2)

                // Labels
                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '10px Inter'
                ctx.textAlign = 'center'
                ctx.fillText('Reaction Progress', dx0 + dw / 2, dy0 + dh + 14)
                ctx.save()
                ctx.translate(dx0 - 8, dy0 + dh / 2)
                ctx.rotate(-Math.PI / 2)
                ctx.fillText('Energy', 0, 0)
                ctx.restore()
                ctx.fillText('Reactants', dx0 + 30, reactantY - 5)
                ctx.fillText('Products', dx0 + dw - 30, productY - 5)
            }

            // Energy distribution
            if (showDistribution) {
                const dx0 = width - 220, dy0 = height - 180, dw = 200, dh = 140
                ctx.fillStyle = 'rgba(0,0,0,0.5)'
                ctx.fillRect(dx0 - 5, dy0 - 15, dw + 10, dh + 30)

                ctx.strokeStyle = 'rgba(255,255,255,0.2)'
                ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(dx0, dy0 + dh); ctx.lineTo(dx0, dy0); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(dx0, dy0 + dh); ctx.lineTo(dx0 + dw, dy0 + dh); ctx.stroke()

                // Maxwell-Boltzmann-like distribution
                const kT = temperature / 100
                ctx.strokeStyle = 'rgba(251, 146, 60, 0.7)'
                ctx.lineWidth = 2
                ctx.beginPath()
                for (let e = 0; e <= 100; e++) {
                    const x = dx0 + (e / 100) * dw
                    const f = (e / (kT * kT)) * Math.exp(-e / (2 * kT))
                    const y = dy0 + dh - f * dh * 2
                    if (e === 0) ctx.moveTo(x, Math.max(dy0, y))
                    else ctx.lineTo(x, Math.max(dy0, y))
                }
                ctx.stroke()

                // Ea line
                const eaX = dx0 + (effectiveEa / 100) * dw
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)'
                ctx.setLineDash([3, 3])
                ctx.beginPath(); ctx.moveTo(eaX, dy0); ctx.lineTo(eaX, dy0 + dh); ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                ctx.font = '10px Inter'
                ctx.textAlign = 'center'
                ctx.fillText('Ea', eaX, dy0 - 3)

                // Shade reactive region
                ctx.fillStyle = 'rgba(251, 146, 60, 0.15)'
                ctx.beginPath()
                ctx.moveTo(eaX, dy0 + dh)
                for (let e = effectiveEa; e <= 100; e++) {
                    const x = dx0 + (e / 100) * dw
                    const f = (e / (kT * kT)) * Math.exp(-e / (2 * kT))
                    const y = dy0 + dh - f * dh * 2
                    ctx.lineTo(x, Math.max(dy0, y))
                }
                ctx.lineTo(dx0 + dw, dy0 + dh)
                ctx.closePath()
                ctx.fill()

                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '10px Inter'
                ctx.textAlign = 'center'
                ctx.fillText('Energy Distribution', dx0 + dw / 2, dy0 - 3)
                ctx.fillText('Kinetic Energy', dx0 + dw / 2, dy0 + dh + 14)
            }

            // Legend
            const unreacted = particles.filter(p => !p.reacted).length
            const reacted = particles.filter(p => p.reacted).length
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.font = '12px Inter'
            ctx.textAlign = 'left'
            ctx.fillText(`Reactants: ${unreacted}`, 20, 25)
            ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'
            ctx.fillText(`Products: ${reacted}`, 20, 43)

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [isRunning, temperature, activationEnergy, effectiveEa, showEnergyDiagram, showDistribution, hasCatalyst])

    const unreacted = particlesRef.current.filter(p => !p.reacted).length
    const reacted = particlesRef.current.filter(p => p.reacted).length
    const avgRate = rateHistoryRef.current.length > 0
        ? (rateHistoryRef.current.reduce((a, b) => a + b, 0) / rateHistoryRef.current.length).toFixed(2)
        : '0.00'

    // Arrhenius approx: k = A * exp(-Ea / RT)
    const R_const = 8.314
    const kArr = (1e10 * Math.exp(-effectiveEa * 100 / (R_const * temperature))).toExponential(2)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a120a]">
            <div className="flex-1 relative overflow-hidden">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 w-64">
                    <APTag course="Chemistry" unit="Unit 5" color={CHEM_COLOR} />
                    <EquationDisplay
                        departmentColor={CHEM_COLOR}
                        title="Kinetics"
                        equations={[
                            { label: 'Rate Law', expression: 'rate = k[A]^n', description: 'Rate depends on concentration' },
                            { label: 'Arrhenius', expression: 'k = Ae^(-Ea/RT)', description: `k ~ ${kArr}` },
                            { label: 'Collision', expression: 'E_collision > Ea', description: 'Minimum energy for reaction' },
                            ...(hasCatalyst ? [{ label: 'Catalyst', expression: 'Ea(cat) < Ea', description: 'Lower activation energy pathway' }] : []),
                        ]}
                    />
                </div>

                <div className="absolute top-4 right-4 w-56">
                    <ControlPanel>
                        <ControlGroup label="Simulation">
                            <div className="flex gap-2">
                                <Button onClick={() => setIsRunning(!isRunning)}>
                                    {isRunning ? 'Pause' : 'Start'}
                                </Button>
                                <Button onClick={reset} variant="secondary">Reset</Button>
                            </div>
                        </ControlGroup>
                        <Slider label="Temperature (K)" value={temperature} onChange={setTemperature} min={100} max={500} step={10} />
                        <Slider label="Activation Energy" value={activationEnergy} onChange={setActivationEnergy} min={20} max={100} />
                        <Slider label="Particles" value={concentration} onChange={v => { setConcentration(v); reset() }} min={20} max={100} />
                        <Toggle label="Catalyst" value={hasCatalyst} onChange={setHasCatalyst} />
                        <Toggle label="Energy Diagram" value={showEnergyDiagram} onChange={setShowEnergyDiagram} />
                        <Toggle label="Distribution" value={showDistribution} onChange={setShowDistribution} />
                        <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
                    </ControlPanel>
                </div>

                <div className="absolute bottom-4 right-4 w-52">
                    <InfoPanel
                        title="Reaction Data"
                        departmentColor={CHEM_COLOR}
                        items={[
                            { label: 'Reactants', value: unreacted },
                            { label: 'Products', value: reacted },
                            { label: 'Reactions', value: reactionCountRef.current },
                            { label: 'Avg Rate', value: avgRate, unit: '/frame' },
                            { label: 'Effective Ea', value: effectiveEa.toFixed(0) },
                            { label: 'Temperature', value: `${temperature}`, unit: 'K' },
                        ]}
                    />
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <DemoMode
                        steps={demoSteps}
                        currentStep={demo.currentStep}
                        isOpen={demo.isOpen}
                        onClose={demo.close}
                        onNext={demo.next}
                        onPrev={demo.prev}
                        onGoToStep={demo.goToStep}
                        departmentColor={CHEM_COLOR}
                    />
                </div>
            </div>
        </div>
    )
}
