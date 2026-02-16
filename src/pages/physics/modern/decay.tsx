import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup, Select } from '@/components/control-panel'

type DecayType = 'alpha' | 'beta' | 'gamma'

interface Isotope {
    name: string
    symbol: string
    A: number
    Z: number
    halfLife: number
    unit: string
    decayType: DecayType
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    type: DecayType
}

const ISOTOPES: Isotope[] = [
    { name: 'Uranium-238', symbol: 'U', A: 238, Z: 92, halfLife: 4.5e9, unit: 'yr', decayType: 'alpha' },
    { name: 'Carbon-14', symbol: 'C', A: 14, Z: 6, halfLife: 5730, unit: 'yr', decayType: 'beta' },
    { name: 'Radon-222', symbol: 'Rn', A: 222, Z: 86, halfLife: 3.82, unit: 'days', decayType: 'alpha' },
    { name: 'Cobalt-60', symbol: 'Co', A: 60, Z: 27, halfLife: 5.27, unit: 'yr', decayType: 'gamma' },
    { name: 'Iodine-131', symbol: 'I', A: 131, Z: 53, halfLife: 8.02, unit: 'days', decayType: 'beta' },
]

export default function NuclearDecay() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isotopeIdx, setIsotopeIdx] = useState(0)
    const [n0, setN0] = useState(1000)
    const [timeSlider, setTimeSlider] = useState(0) // 0 to 1 representing 0 to 5 half-lives
    const [decayType, setDecayType] = useState<DecayType>('alpha')
    const [showGraph, setShowGraph] = useState(true)
    const [showNuclei, setShowNuclei] = useState(true)
    const [showDaughters, setShowDaughters] = useState(true)
    const [animating, setAnimating] = useState(false)
    const timeRef = useRef(0)
    const particlesRef = useRef<Particle[]>([])

    const isotope = ISOTOPES[isotopeIdx]
    const lambda = Math.LN2 / isotope.halfLife

    useEffect(() => {
        setDecayType(isotope.decayType)
    }, [isotopeIdx, isotope.decayType])

    const calcRemaining = useCallback((tHalfLives: number) => {
        const t = tHalfLives * isotope.halfLife
        return n0 * Math.exp(-lambda * t)
    }, [n0, lambda, isotope.halfLife])

    const getDaughter = useCallback(() => {
        if (decayType === 'alpha') return { dA: isotope.A - 4, dZ: isotope.Z - 2, particle: 'He-4 (alpha)' }
        if (decayType === 'beta') return { dA: isotope.A, dZ: isotope.Z + 1, particle: 'e- + antineutrino' }
        return { dA: isotope.A, dZ: isotope.Z, particle: 'gamma photon' }
    }, [decayType, isotope])

    const reset = useCallback(() => {
        setIsotopeIdx(0)
        setN0(1000)
        setTimeSlider(0)
        setDecayType('alpha')
        setShowGraph(true)
        setShowNuclei(true)
        setShowDaughters(true)
        setAnimating(false)
        timeRef.current = 0
        particlesRef.current = []
    }, [])

    const demoSteps = [
        { title: 'Nuclear Decay', description: 'Unstable nuclei spontaneously transform into more stable configurations by emitting particles or radiation. This process is random but statistically predictable for large numbers of atoms.', setup: () => reset() },
        { title: 'Exponential Decay Law', description: 'N(t) = N0 * e^(-lambda*t). The number of remaining nuclei decreases exponentially. Lambda is the decay constant, related to half-life: t_half = ln(2)/lambda.', setup: () => { setShowGraph(true); setTimeSlider(0.5) } },
        { title: 'Half-Life', description: 'After one half-life, exactly half the original nuclei remain. After two half-lives, 1/4 remain. After 3, 1/8. The concept applies identically to every interval.', setup: () => { setN0(1000); setTimeSlider(0.2) } },
        { title: 'Alpha Decay', description: 'The nucleus emits an alpha particle (He-4: 2 protons + 2 neutrons). The parent loses 4 mass units and 2 protons. Example: U-238 -> Th-234 + alpha.', setup: () => { setIsotopeIdx(0); setDecayType('alpha'); setShowDaughters(true) } },
        { title: 'Beta Decay', description: 'A neutron converts to a proton, emitting an electron (beta particle) and antineutrino. Mass number stays the same, atomic number increases by 1. Example: C-14 -> N-14 + e-.', setup: () => { setIsotopeIdx(1); setDecayType('beta') } },
        { title: 'Gamma Decay', description: 'The nucleus releases excess energy as a high-energy photon (gamma ray). No change in A or Z - just the nucleus dropping to a lower energy state. Example: Co-60.', setup: () => { setIsotopeIdx(3); setDecayType('gamma') } },
        { title: 'Decay Curve', description: 'The decay curve shows N vs t. The steeper the curve, the shorter the half-life. Slide the time control to see how the number of remaining nuclei changes.', setup: () => { setIsotopeIdx(2); setShowGraph(true); setTimeSlider(0.6) } },
        { title: 'Activity', description: 'Activity A = lambda * N = the rate of decays per second (Becquerels). It also decreases exponentially: A(t) = A0 * e^(-lambda*t). Higher activity means more radiation.', setup: () => { setShowGraph(true) } },
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

        const draw = () => {
            timeRef.current += 0.016
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const currentN = calcRemaining(timeSlider * 5)
            const decayed = n0 - currentN

            // Animation: auto-advance time
            if (animating) {
                setTimeSlider(prev => Math.min(1, prev + 0.001))
            }

            // Spawn decay particles
            if (animating && Math.random() < 0.1 * (decayed / n0)) {
                particlesRef.current.push({
                    x: w * 0.15 + Math.random() * w * 0.2,
                    y: h * 0.3 + Math.random() * h * 0.3,
                    vx: (Math.random() - 0.5) * 200,
                    vy: (Math.random() - 0.5) * 200,
                    life: 1,
                    type: decayType,
                })
            }

            // Update particles
            particlesRef.current = particlesRef.current.filter(p => {
                p.x += p.vx * 0.016
                p.y += p.vy * 0.016
                p.life -= 0.015
                return p.life > 0
            })

            // ---- LEFT: Nuclei visualization ----
            if (showNuclei) {
                const nucleiArea = { x: 30, y: 60, w: w * 0.35 - 30, h: h - 120 }
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.15)'
                ctx.lineWidth = 1
                ctx.strokeRect(nucleiArea.x, nucleiArea.y, nucleiArea.w, nucleiArea.h)

                // Draw grid of nuclei (show fraction remaining)
                const gridSize = Math.ceil(Math.sqrt(Math.min(n0, 200)))
                const cellW = nucleiArea.w / gridSize
                const cellH = nucleiArea.h / gridSize
                const fraction = currentN / n0

                for (let i = 0; i < gridSize * gridSize && i < Math.min(n0, 200); i++) {
                    const gx = i % gridSize
                    const gy = Math.floor(i / gridSize)
                    const cx = nucleiArea.x + gx * cellW + cellW / 2
                    const cy = nucleiArea.y + gy * cellH + cellH / 2
                    const r = Math.min(cellW, cellH) * 0.35

                    const isFrac = (i / Math.min(n0, 200)) < fraction
                    if (isFrac) {
                        // Parent - still alive
                        ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
                    } else if (showDaughters) {
                        // Daughter product
                        const dColor = decayType === 'alpha' ? 'rgba(100, 200, 100, 0.5)' :
                            decayType === 'beta' ? 'rgba(100, 200, 255, 0.5)' : 'rgba(255, 220, 100, 0.5)'
                        ctx.fillStyle = dColor
                        ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); ctx.fill()
                    }
                }

                // Labels
                ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`${isotope.name}: ${Math.round(currentN)} remaining`, nucleiArea.x + nucleiArea.w / 2, nucleiArea.y - 10)

                if (showDaughters) {
                    const daughter = getDaughter()
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.font = '10px system-ui'
                    ctx.fillText(`Daughter: A=${daughter.dA}, Z=${daughter.dZ} | ${daughter.particle}`, nucleiArea.x + nucleiArea.w / 2, h - 30)
                }
            }

            // Draw decay particles
            particlesRef.current.forEach(p => {
                const color = p.type === 'alpha' ? `rgba(255, 100, 100, ${p.life})` :
                    p.type === 'beta' ? `rgba(100, 200, 255, ${p.life})` :
                        `rgba(255, 220, 100, ${p.life})`
                ctx.fillStyle = color
                const size = p.type === 'alpha' ? 4 : p.type === 'beta' ? 2.5 : 3
                ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill()

                if (p.type === 'gamma') {
                    ctx.strokeStyle = color; ctx.lineWidth = 1
                    ctx.beginPath()
                    for (let i = 0; i < 8; i++) {
                        const sx = p.x - p.vx * 0.016 * i + Math.sin(i * 3) * 4
                        const sy = p.y - p.vy * 0.016 * i + Math.cos(i * 3) * 4
                        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy)
                    }
                    ctx.stroke()
                }
            })

            // ---- RIGHT: Decay Curve ----
            if (showGraph) {
                const graphArea = { x: w * 0.45, y: 60, w: w * 0.5, h: h - 120 }
                const gpad = 50

                // Axes
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'; ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(graphArea.x + gpad, graphArea.y)
                ctx.lineTo(graphArea.x + gpad, graphArea.y + graphArea.h)
                ctx.lineTo(graphArea.x + graphArea.w, graphArea.y + graphArea.h)
                ctx.stroke()

                ctx.fillStyle = 'rgba(160, 100, 255, 0.5)'
                ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('Time (half-lives)', graphArea.x + gpad + (graphArea.w - gpad) / 2, graphArea.y + graphArea.h + 35)
                ctx.save()
                ctx.translate(graphArea.x + 12, graphArea.y + graphArea.h / 2)
                ctx.rotate(-Math.PI / 2)
                ctx.fillText('N(t) / N0', 0, 0)
                ctx.restore()

                // Tick marks
                const gw = graphArea.w - gpad
                const gh = graphArea.h
                ctx.fillStyle = 'rgba(160, 100, 255, 0.4)'; ctx.font = '10px system-ui'
                for (let i = 0; i <= 5; i++) {
                    const x = graphArea.x + gpad + (i / 5) * gw
                    ctx.textAlign = 'center'
                    ctx.fillText(`${i}`, x, graphArea.y + gh + 15)
                    // Grid line
                    ctx.strokeStyle = 'rgba(160, 100, 255, 0.06)'; ctx.lineWidth = 1
                    ctx.beginPath(); ctx.moveTo(x, graphArea.y); ctx.lineTo(x, graphArea.y + gh); ctx.stroke()
                }
                for (let i = 0; i <= 4; i++) {
                    const frac = i / 4
                    const y = graphArea.y + gh - frac * gh
                    ctx.textAlign = 'right'
                    ctx.fillText((frac * 100).toFixed(0) + '%', graphArea.x + gpad - 8, y + 4)
                    ctx.strokeStyle = 'rgba(160, 100, 255, 0.06)'; ctx.lineWidth = 1
                    ctx.beginPath(); ctx.moveTo(graphArea.x + gpad, y); ctx.lineTo(graphArea.x + graphArea.w, y); ctx.stroke()
                }

                // Decay curve
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round'
                ctx.beginPath()
                for (let i = 0; i <= 200; i++) {
                    const tHL = (i / 200) * 5
                    const frac = Math.exp(-Math.LN2 * tHL)
                    const x = graphArea.x + gpad + (tHL / 5) * gw
                    const y = graphArea.y + gh - frac * gh
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                }
                ctx.stroke()

                // Current time marker
                const curT = timeSlider * 5
                const curFrac = Math.exp(-Math.LN2 * curT)
                const curX = graphArea.x + gpad + (curT / 5) * gw
                const curY = graphArea.y + gh - curFrac * gh

                // Dashed lines to axes
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
                ctx.beginPath(); ctx.moveTo(curX, curY); ctx.lineTo(curX, graphArea.y + gh); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(curX, curY); ctx.lineTo(graphArea.x + gpad, curY); ctx.stroke()
                ctx.setLineDash([])

                // Point
                const glow = ctx.createRadialGradient(curX, curY, 0, curX, curY, 12)
                glow.addColorStop(0, 'rgba(160, 100, 255, 0.5)')
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath(); ctx.arc(curX, curY, 12, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(160, 100, 255, 1)'
                ctx.beginPath(); ctx.arc(curX, curY, 5, 0, Math.PI * 2); ctx.fill()

                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left'
                ctx.fillText(`${(curFrac * 100).toFixed(1)}%`, curX + 10, curY - 8)

                // Half-life markers
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.3)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4])
                for (let hl = 1; hl <= 5; hl++) {
                    const hlFrac = Math.pow(0.5, hl)
                    const hlX = graphArea.x + gpad + (hl / 5) * gw
                    const hlY = graphArea.y + gh - hlFrac * gh
                    ctx.beginPath(); ctx.moveTo(graphArea.x + gpad, hlY); ctx.lineTo(hlX, hlY); ctx.lineTo(hlX, graphArea.y + gh); ctx.stroke()
                }
                ctx.setLineDash([])
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [isotopeIdx, n0, timeSlider, decayType, showGraph, showNuclei, showDaughters, animating, isotope, lambda, calcRemaining, getDaughter])

    const currentN = calcRemaining(timeSlider * 5)
    const activity = lambda * currentN
    const daughter = getDaughter()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 7" color="rgb(160, 100, 255)" />
                        <InfoPanel title="Decay Analysis" departmentColor="rgb(160, 100, 255)" items={[
                            { label: 'Isotope', value: isotope.name },
                            { label: 'N remaining', value: Math.round(currentN).toString(), color: 'rgb(160, 100, 255)' },
                            { label: 'N decayed', value: Math.round(n0 - currentN).toString() },
                            { label: 'Half-life', value: `${isotope.halfLife} ${isotope.unit}` },
                            { label: 'Elapsed', value: `${(timeSlider * 5).toFixed(2)} t_1/2` },
                            { label: 'Daughter', value: `A=${daughter.dA}, Z=${daughter.dZ}` },
                        ]} />
                    </div>
                    <div className="absolute bottom-4 left-4">
                        <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor="rgb(160, 100, 255)" />
                    </div>
                </div>
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ControlGroup label="Isotope">
                            <Select value={isotopeIdx.toString()} onChange={v => setIsotopeIdx(parseInt(v))} options={ISOTOPES.map((iso, i) => ({ value: i.toString(), label: `${iso.name} (t=${iso.halfLife} ${iso.unit})` }))} />
                        </ControlGroup>
                        <ControlGroup label="Decay Type">
                            <ButtonGroup value={decayType} onChange={v => setDecayType(v as DecayType)} options={[
                                { value: 'alpha', label: 'Alpha' },
                                { value: 'beta', label: 'Beta' },
                                { value: 'gamma', label: 'Gamma' },
                            ]} color="rgb(160, 100, 255)" />
                        </ControlGroup>
                        <ControlGroup label="Initial Count N0">
                            <Slider value={n0} onChange={v => setN0(Math.round(v))} min={100} max={5000} step={100} label={`N0 = ${n0}`} />
                        </ControlGroup>
                        <ControlGroup label="Time (half-lives)">
                            <Slider value={timeSlider} onChange={setTimeSlider} min={0} max={1} step={0.005} label={`${(timeSlider * 5).toFixed(2)} t_1/2`} />
                        </ControlGroup>
                        <Toggle value={showGraph} onChange={setShowGraph} label="Show Decay Curve" />
                        <Toggle value={showNuclei} onChange={setShowNuclei} label="Show Nuclei Grid" />
                        <Toggle value={showDaughters} onChange={setShowDaughters} label="Show Daughter Products" />
                        <Toggle value={animating} onChange={setAnimating} label="Animate Decay" />
                    </ControlPanel>
                    <EquationDisplay departmentColor="rgb(160, 100, 255)" equations={[
                        { label: 'Decay law', expression: 'N(t) = N0 * e^(-lambda*t)' },
                        { label: 'Half-life', expression: 't_1/2 = ln(2) / lambda' },
                        { label: 'Activity', expression: 'A = lambda * N = A0 * e^(-lambda*t)' },
                    ]} />
                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
