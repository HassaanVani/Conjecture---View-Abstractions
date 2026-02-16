import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, Slider, Toggle, Button, Select } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'

const PC = 'rgb(160, 100, 255)'

interface Particle { x: number; y: number; id: number }

export default function FluidFlow() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [constriction, setConstriction] = useState(0.5)
    const [flowRate, setFlowRate] = useState(5)
    const [showParticles, setShowParticles] = useState(true)
    const [showGauges, setShowGauges] = useState(true)
    const [scenario, setScenario] = useState('pipe')

    const particlesRef = useRef<Particle[]>([])
    const idCounter = useRef(0)

    const pipeH = 150
    const maxV = flowRate * (pipeH / (pipeH * 0.2))
    const vWide = flowRate
    const vNarrow = flowRate * (pipeH / (pipeH * constriction))
    const pWide = 100 - (vWide / maxV) * 80
    const pNarrow = 100 - (vNarrow / maxV) * 80

    const demoSteps = [
        { title: 'Fluid Dynamics', description: 'This simulation shows how fluid velocity and pressure change as a pipe narrows. Two fundamental equations govern the behavior.', highlight: 'Adjust the constriction slider.' },
        { title: 'Continuity Equation', description: 'A\u2081v\u2081 = A\u2082v\u2082. When the pipe narrows, the fluid must speed up to maintain constant flow rate. This is conservation of mass.', setup: () => { setConstriction(0.4); setShowParticles(true) } },
        { title: "Bernoulli's Equation", description: "P + \u00BD\u03C1v\u00B2 + \u03C1gh = constant. Higher velocity means lower pressure. This is Bernoulli's principle.", setup: () => { setShowGauges(true) } },
        { title: 'Pressure Gauges', description: 'The gauges show pressure at three points. Notice how pressure drops in the narrow section where velocity is highest.', highlight: 'Compare gauge readings.' },
        { title: 'Venturi Effect', description: 'The pressure drop in a constriction is the Venturi effect. It is used in carburetors, atomizers, and flow meters.', setup: () => { setScenario('venturi'); setConstriction(0.3) } },
        { title: 'Straight Pipe', description: 'With no constriction, velocity and pressure are uniform. Set constriction to 100% to see this baseline case.', setup: () => { setConstriction(1.0); setScenario('pipe') } },
        { title: 'Flow Rate', description: 'Increasing the flow rate increases all velocities proportionally. Pressure differences also increase due to the v\u00B2 term.', setup: () => { setConstriction(0.4); setFlowRate(10) } },
        { title: 'Explore!', description: 'Adjust constriction and flow rate. Switch between pipe and venturi scenarios. Watch how particles speed up and slow down.' },
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

        const getR = (x: number, w: number) => {
            const nx = x / w
            if (scenario === 'venturi') {
                // Smooth venturi shape
                const center = 0.5; const width = 0.15
                const d = Math.abs(nx - center) / width
                if (d > 1) return pipeH
                const t = 0.5 * (1 + Math.cos(Math.PI * Math.min(d, 1)))
                return pipeH * (1 - t) + pipeH * constriction * t
            }
            // Standard pipe sections
            if (nx < 0.2) return pipeH
            if (nx < 0.3) { const t = (nx - 0.2) / 0.1; return pipeH * (1 - t) + pipeH * constriction * t }
            if (nx < 0.7) return pipeH * constriction
            if (nx < 0.8) { const t = (nx - 0.7) / 0.1; return pipeH * constriction * (1 - t) + pipeH * t }
            return pipeH
        }

        const animate = () => {
            const w = canvas.offsetWidth; const h = canvas.offsetHeight; const cy = h / 2

            // Spawn particles
            if (showParticles && particlesRef.current.length < 200) {
                idCounter.current++
                particlesRef.current.push({ x: 0, y: (Math.random() - 0.5) * 2 * pipeH * 0.9, id: idCounter.current })
            }

            // Update particles
            particlesRef.current.forEach(p => {
                const R = getR(p.x, w)
                const vx = flowRate * (pipeH / R)
                const oldR = getR(p.x, w)
                p.x += vx
                const newR = getR(p.x, w)
                if (oldR > 0) p.y = p.y * (newR / oldR)
            })
            particlesRef.current = particlesRef.current.filter(p => p.x < w)

            ctx.clearRect(0, 0, w, h)

            // Pipe exterior
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, h)

            // Clear interior
            ctx.globalCompositeOperation = 'destination-out'
            ctx.beginPath(); ctx.moveTo(0, cy - getR(0, w))
            for (let x = 0; x <= w; x += 8) ctx.lineTo(x, cy - getR(x, w))
            ctx.lineTo(w, cy + getR(w, w))
            for (let x = w; x >= 0; x -= 8) ctx.lineTo(x, cy + getR(x, w))
            ctx.closePath(); ctx.fill()
            ctx.globalCompositeOperation = 'source-over'

            // Interior gradient
            ctx.save()
            ctx.beginPath(); ctx.moveTo(0, cy - getR(0, w))
            for (let x = 0; x <= w; x += 8) ctx.lineTo(x, cy - getR(x, w))
            ctx.lineTo(w, cy + getR(w, w))
            for (let x = w; x >= 0; x -= 8) ctx.lineTo(x, cy + getR(x, w))
            ctx.closePath(); ctx.clip()
            ctx.fillStyle = 'rgba(15,23,42,0.5)'; ctx.fillRect(0, 0, w, h)
            ctx.restore()

            // Pipe walls
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3
            ctx.beginPath(); ctx.moveTo(0, cy - getR(0, w))
            for (let x = 0; x <= w; x += 4) ctx.lineTo(x, cy - getR(x, w))
            ctx.stroke()
            ctx.beginPath(); ctx.moveTo(0, cy + getR(0, w))
            for (let x = 0; x <= w; x += 4) ctx.lineTo(x, cy + getR(x, w))
            ctx.stroke()

            // Velocity color field
            for (let x = 0; x < w; x += 12) {
                const R = getR(x, w)
                const v = flowRate * (pipeH / R)
                const normV = Math.min(1, v / (flowRate * 5))
                ctx.fillStyle = `rgba(160, 100, 255, ${normV * 0.15})`
                ctx.fillRect(x, cy - R, 12, R * 2)
            }

            // Particles
            if (showParticles) {
                particlesRef.current.forEach(p => {
                    const R = getR(p.x, w)
                    const v = flowRate * (pipeH / R)
                    const normV = Math.min(1, v / (flowRate * 5))
                    ctx.fillStyle = `rgba(${96 + normV * 64}, ${160 - normV * 60}, 255, 0.8)`
                    ctx.beginPath(); ctx.arc(p.x, cy + p.y, 2 + normV, 0, Math.PI * 2); ctx.fill()
                })
            }

            // Pressure gauges
            if (showGauges) {
                const gaugePositions = [
                    { x: w * 0.1, label: 'Wide (inlet)' },
                    { x: w * 0.5, label: 'Narrow' },
                    { x: w * 0.9, label: 'Wide (outlet)' },
                ]

                gaugePositions.forEach(gp => {
                    const R = getR(gp.x, w)
                    const v = flowRate * (pipeH / R)
                    const P = 100 - (v / maxV) * 80
                    const gy = cy - pipeH - 65

                    // Gauge stem
                    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2
                    ctx.beginPath(); ctx.moveTo(gp.x, cy - R); ctx.lineTo(gp.x, gy + 30); ctx.stroke()

                    // Gauge circle
                    ctx.fillStyle = 'rgba(15,23,42,0.9)'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2
                    ctx.beginPath(); ctx.arc(gp.x, gy, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

                    // Needle
                    const needleAngle = Math.PI - (P / 100) * Math.PI
                    ctx.strokeStyle = PC; ctx.lineWidth = 2.5
                    ctx.beginPath(); ctx.moveTo(gp.x, gy)
                    ctx.lineTo(gp.x + Math.cos(needleAngle) * 20, gy - Math.sin(needleAngle) * 20)
                    ctx.stroke()

                    // Center dot
                    ctx.fillStyle = PC; ctx.beginPath(); ctx.arc(gp.x, gy, 3, 0, Math.PI * 2); ctx.fill()

                    // Labels
                    ctx.fillStyle = 'white'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
                    ctx.fillText(gp.label, gp.x, gy - 34)
                    ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace'
                    ctx.fillText(`P\u2248${P.toFixed(0)}`, gp.x, gy + 42)
                    ctx.fillStyle = '#60a5fa'
                    ctx.fillText(`v\u2248${v.toFixed(1)}`, gp.x, gy + 54)

                    // Bernoulli annotation
                    ctx.fillStyle = 'rgba(160,100,255,0.4)'; ctx.font = '8px monospace'
                    ctx.fillText(`P+\u00BD\u03C1v\u00B2=${(P + 0.5 * v * v / 10).toFixed(0)}`, gp.x, gy + 66)
                })
            }

            // Bernoulli constant verification bar
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(w / 2 - 120, h - 30, 240, 24)
            ctx.fillStyle = PC; ctx.font = '10px monospace'; ctx.textAlign = 'center'
            const bConst1 = pWide + 0.5 * vWide * vWide / 10
            const bConst2 = pNarrow + 0.5 * vNarrow * vNarrow / 10
            ctx.fillText(`Bernoulli const: inlet=${bConst1.toFixed(1)} | narrow=${bConst2.toFixed(1)}`, w / 2, h - 14)

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [constriction, flowRate, showParticles, showGauges, scenario, maxV, pWide, pNarrow, vWide, vNarrow])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Fluid Dynamics</h1>
                        <p className="text-xs text-white/50">Bernoulli &amp; Continuity</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <APTag course="Physics 2" unit="Unit 1" color={PC} />
                    <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute bottom-4 left-4 flex flex-col gap-3 max-w-[260px]">
                        <EquationDisplay departmentColor={PC} equations={[
                            { label: 'Continuity', expression: 'A\u2081v\u2081 = A\u2082v\u2082' },
                            { label: 'Bernoulli', expression: 'P + \u00BD\u03C1v\u00B2 + \u03C1gh = const' },
                            { label: 'Venturi', expression: '\u0394P = \u00BD\u03C1(v\u2082\u00B2 \u2212 v\u2081\u00B2)' },
                        ]} />
                    </div>

                    <div className="absolute bottom-4 right-4">
                        <InfoPanel departmentColor={PC} title="Flow Data" items={[
                            { label: 'v (wide)', value: vWide, unit: 'm/s', color: '#3b82f6' },
                            { label: 'v (narrow)', value: vNarrow, unit: 'm/s', color: '#ef4444' },
                            { label: 'P (wide)', value: pWide, unit: 'arb' },
                            { label: 'P (narrow)', value: pNarrow, unit: 'arb' },
                            { label: 'Speed ratio', value: (vNarrow / vWide), unit: 'x' },
                            { label: 'Constriction', value: `${(constriction * 100).toFixed(0)}%` },
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
                        <Select label="Scenario" value={scenario} onChange={setScenario} options={[
                            { value: 'pipe', label: 'Standard Pipe' },
                            { value: 'venturi', label: 'Venturi Tube' },
                        ]} />
                        <Slider label={`Constriction \u2014 ${(constriction * 100).toFixed(0)}%`} value={constriction} onChange={setConstriction} min={0.2} max={1} step={0.01} />
                        <Slider label={`Flow Rate \u2014 ${flowRate.toFixed(1)}`} value={flowRate} onChange={setFlowRate} min={1} max={15} step={0.5} />
                    </ControlPanel>

                    <Toggle label="Show Streamlines" value={showParticles} onChange={setShowParticles} />
                    <Toggle label="Pressure Gauges" value={showGauges} onChange={setShowGauges} />

                    <Button onClick={demo.open} variant="secondary" className="w-full">Start Tutorial</Button>
                </div>
            </div>
        </div>
    )
}
