import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

const PHYSICS_COLOR = 'rgb(160, 100, 255)'

type Mode = 'drag' | 'ac-generator'

export default function FaradayFlux() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [loopX, setLoopX] = useState(150)
    const [isDragging, setIsDragging] = useState(false)
    const [mode, setMode] = useState<Mode>('drag')
    const [turns, setTurns] = useState(1)
    const [bStrength, setBStrength] = useState(1.0)
    const [acFrequency, setAcFrequency] = useState(1.0)
    const [showLenz, setShowLenz] = useState(true)
    const [autoScan, setAutoScan] = useState(false)
    const historyRef = useRef<{ t: number; phi: number; emf: number }[]>([])
    const lastXRef = useRef(150)
    const acAngleRef = useRef(0)

    const fieldStartX = 350
    const fieldEndX = 650
    const loopW = 100
    const loopH = 100
    const B = bStrength

    const resetHistory = useCallback(() => { historyRef.current = [] }, [])

    const demoSteps: DemoStep[] = [
        { title: 'Faraday\'s Law', description: 'A changing magnetic flux through a loop induces an EMF (voltage). EMF = -N * d(Phi)/dt.', highlight: 'Drag the coil through the field region.' },
        { title: 'Magnetic Flux', description: 'Phi = B * A * cos(theta). Flux depends on field strength, area in field, and angle.', setup: () => { setMode('drag'); setLoopX(150); resetHistory() }, highlight: 'Move the coil into the blue B-field region.' },
        { title: 'Lenz\'s Law', description: 'The induced current opposes the change that caused it. If flux increases, current creates opposing field.', setup: () => { setShowLenz(true); setLoopX(300); setAutoScan(true) }, highlight: 'Arrow on coil shows induced current direction.' },
        { title: 'Multiple Turns', description: 'N turns multiply the induced EMF: EMF = -N * d(Phi)/dt. More turns = stronger effect.', setup: () => { setTurns(5); setAutoScan(false); setLoopX(200) }, highlight: 'Increase turns and see EMF multiply.' },
        { title: 'B Field Strength', description: 'Stronger B field means more flux and larger induced EMF for the same rate of change.', setup: () => { setBStrength(2.0); setTurns(1) } },
        { title: 'AC Generator', description: 'A rotating coil in a constant B field produces sinusoidal EMF. This is how generators work.', setup: () => { setMode('ac-generator'); setAcFrequency(1.0) }, highlight: 'Watch the coil rotate and see sinusoidal EMF output.' },
        { title: 'Flux & EMF Graphs', description: 'Flux varies as cos(wt), EMF as sin(wt). EMF leads flux by 90 degrees.', setup: () => { setMode('ac-generator'); setAcFrequency(1.5) }, highlight: 'Blue = flux, Red = EMF. Note the phase relationship.' },
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

        let lastTime = performance.now()

        const animate = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTime) / 1000, 0.05)
            lastTime = now

            const w = canvas.offsetWidth, h = canvas.offsetHeight
            const cy = h * 0.33

            // Auto scan logic (drag mode)
            if (mode === 'drag' && autoScan && !isDragging) {
                const speed = 120
                const nextX = loopX + speed * dt
                if (nextX > w - 50) { setAutoScan(false) }
                else { setLoopX(nextX) }
            }

            // AC generator angle
            if (mode === 'ac-generator') {
                acAngleRef.current += acFrequency * Math.PI * 2 * dt
            }

            // Flux calculation
            let Flux = 0
            let emf = 0

            if (mode === 'drag') {
                const left = loopX - loopW / 2
                const right = loopX + loopW / 2
                const overlapL = Math.max(left, fieldStartX)
                const overlapR = Math.min(right, fieldEndX)
                const overlapW = Math.max(0, overlapR - overlapL)
                Flux = B * (overlapW * loopH) / 10000 * turns

                const prevPhi = historyRef.current.length > 0 ? historyRef.current[historyRef.current.length - 1].phi : Flux
                emf = dt > 0 ? -(Flux - prevPhi) / dt : 0
            } else {
                // AC generator
                const area = loopW * loopH / 10000
                Flux = B * area * Math.cos(acAngleRef.current) * turns
                emf = B * area * turns * acFrequency * Math.PI * 2 * Math.sin(acAngleRef.current) * 1000
            }

            historyRef.current.push({ t: now, phi: Flux, emf })
            if (historyRef.current.length > 400) historyRef.current.shift()
            lastXRef.current = loopX

            ctx.clearRect(0, 0, w, h)

            if (mode === 'drag') {
                // B-field region
                ctx.fillStyle = 'rgba(59, 130, 246, 0.08)'
                ctx.fillRect(fieldStartX, cy - 160, fieldEndX - fieldStartX, 320)
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
                ctx.lineWidth = 1
                ctx.strokeRect(fieldStartX, cy - 160, fieldEndX - fieldStartX, 320)

                // Field symbols
                ctx.fillStyle = 'rgba(59, 130, 246, 0.25)'
                ctx.font = '14px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                for (let x = fieldStartX + 25; x < fieldEndX; x += 35) {
                    for (let y = cy - 140; y < cy + 160; y += 35) {
                        ctx.fillText(B > 0 ? '\u00d7' : '\u2022', x, y)
                    }
                }
                ctx.fillStyle = 'rgba(59, 130, 246, 0.6)'
                ctx.font = '12px sans-serif'
                ctx.fillText(`B = ${B.toFixed(1)}T (${B > 0 ? 'into' : 'out of'} page)`, (fieldStartX + fieldEndX) / 2, cy - 175)

                // Coil
                for (let t = 0; t < turns; t++) {
                    const offset = t * 3
                    ctx.strokeStyle = `rgba(250, 204, 21, ${0.9 - t * 0.1})`
                    ctx.lineWidth = 3 - t * 0.3
                    ctx.strokeRect(loopX - loopW / 2 + offset, cy - loopH / 2 + offset, loopW, loopH)
                }

                // Lenz's law indicator
                if (showLenz && Math.abs(emf) > 50) {
                    const dPhi = Flux - (historyRef.current.length > 2 ? historyRef.current[historyRef.current.length - 2].phi : Flux)
                    const ccw = dPhi > 0

                    ctx.strokeStyle = '#ef4444'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    if (ccw) {
                        ctx.arc(loopX, cy, loopH / 2 + 8, -Math.PI * 0.3, Math.PI * 1.3)
                    } else {
                        ctx.arc(loopX, cy, loopH / 2 + 8, Math.PI * 0.3, -Math.PI * 1.3, true)
                    }
                    ctx.stroke()
                    // Arrow tip
                    ctx.fillStyle = '#ef4444'
                    ctx.font = 'bold 12px sans-serif'
                    ctx.textAlign = 'center'
                    ctx.fillText(ccw ? 'CCW (Lenz)' : 'CW (Lenz)', loopX, cy - loopH / 2 - 18)
                }

                // Handle
                ctx.fillStyle = 'white'
                ctx.beginPath(); ctx.arc(loopX, cy, 4, 0, Math.PI * 2); ctx.fill()
            } else {
                // AC Generator visualization
                const gcx = w * 0.4, gcy = cy
                const coilW = 120, coilH = 80
                const angle = acAngleRef.current

                // Static magnet poles
                ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
                ctx.fillRect(gcx - coilW - 30, gcy - 60, 20, 120)
                ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
                ctx.fillRect(gcx + coilW + 10, gcy - 60, 20, 120)

                ctx.fillStyle = '#ef4444'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'
                ctx.fillText('N', gcx - coilW - 20, gcy + 80)
                ctx.fillStyle = '#3b82f6'
                ctx.fillText('S', gcx + coilW + 20, gcy + 80)

                // B field lines
                ctx.strokeStyle = 'rgba(255,255,255,0.1)'
                ctx.lineWidth = 1
                for (let dy = -40; dy <= 40; dy += 20) {
                    ctx.beginPath()
                    ctx.moveTo(gcx - coilW - 10, gcy + dy)
                    ctx.lineTo(gcx + coilW + 10, gcy + dy)
                    ctx.stroke()
                }

                // Rotating coil (perspective)
                const cosA = Math.cos(angle)
                const projW = coilW * Math.abs(cosA)

                for (let t = 0; t < turns; t++) {
                    ctx.strokeStyle = `rgba(250, 204, 21, ${0.8 - t * 0.1})`
                    ctx.lineWidth = 3
                    ctx.beginPath()
                    ctx.rect(gcx - projW / 2 + t * 2, gcy - coilH / 2 + t * 2, projW, coilH)
                    ctx.stroke()
                }

                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '11px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText(`angle: ${((angle % (Math.PI * 2)) * 180 / Math.PI).toFixed(0)} deg`, gcx, gcy + coilH / 2 + 25)
                ctx.fillText(`f = ${acFrequency.toFixed(1)} Hz`, gcx, gcy + coilH / 2 + 40)
            }

            // Graphs
            const graphH = 80
            const graphW = w - 100
            const gx = 50

            // Flux graph
            const gy1 = h * 0.62
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(gx, gy1); ctx.lineTo(gx, gy1 + graphH); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(gx, gy1 + graphH / 2); ctx.lineTo(gx + graphW, gy1 + graphH / 2); ctx.stroke()

            if (historyRef.current.length > 1) {
                const tMax = now, tMin = tMax - 5000
                ctx.beginPath()
                ctx.strokeStyle = '#60a5fa'
                ctx.lineWidth = 2
                let maxPhi = 0.01
                historyRef.current.forEach(pt => { maxPhi = Math.max(maxPhi, Math.abs(pt.phi)) })
                historyRef.current.forEach((pt, i) => {
                    if (pt.t < tMin) return
                    const x = gx + ((pt.t - tMin) / 5000) * graphW
                    const y = gy1 + graphH / 2 - (pt.phi / (maxPhi * 1.2)) * (graphH / 2)
                    if (i === 0 || historyRef.current[i - 1].t < tMin) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke()
            }

            ctx.fillStyle = '#60a5fa'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'
            ctx.fillText('Magnetic Flux (Phi)', gx + 5, gy1 + 12)

            // EMF graph
            const gy2 = h * 0.82
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(gx, gy2); ctx.lineTo(gx, gy2 + graphH); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(gx, gy2 + graphH / 2); ctx.lineTo(gx + graphW, gy2 + graphH / 2); ctx.stroke()

            if (historyRef.current.length > 1) {
                const tMax = now, tMin = tMax - 5000
                ctx.beginPath()
                ctx.strokeStyle = '#ef4444'
                ctx.lineWidth = 2
                let maxEmf = 0.01
                historyRef.current.forEach(pt => { maxEmf = Math.max(maxEmf, Math.abs(pt.emf)) })
                historyRef.current.forEach((pt, i) => {
                    if (pt.t < tMin) return
                    const x = gx + ((pt.t - tMin) / 5000) * graphW
                    const y = gy2 + graphH / 2 - (pt.emf / (maxEmf * 1.2)) * (graphH / 2)
                    if (i === 0 || historyRef.current[i - 1].t < tMin) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke()
            }

            ctx.fillStyle = '#ef4444'; ctx.fillText('Induced EMF (epsilon)', gx + 5, gy2 + 12)

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [loopX, mode, autoScan, isDragging, turns, bStrength, acFrequency, showLenz])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'drag') return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const cy = canvas.offsetHeight * 0.33
        if (Math.abs(mx - loopX) < 70 && Math.abs(my - cy) < 70) {
            setIsDragging(true); setAutoScan(false)
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        setLoopX(e.clientX - rect.left)
    }

    const handleMouseUp = () => { setIsDragging(false) }

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
                        <h1 className="text-xl font-medium tracking-tight">Faraday's Law & Flux</h1>
                        <p className="text-xs text-white/50">Magnetism</p>
                    </div>
                    <APTag course="Physics 2" unit="Unit 5" color={PHYSICS_COLOR} />
                </div>
                <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative cursor-grab active:cursor-grabbing">
                    <canvas ref={canvasRef} className="w-full h-full block"
                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
                    <div className="absolute top-4 left-4 space-y-2">
                        <EquationDisplay departmentColor={PHYSICS_COLOR} title="Electromagnetic Induction"
                            equations={[
                                { label: 'Flux', expression: 'Phi = B * A * cos(theta)', description: 'Magnetic flux' },
                                { label: 'Faraday', expression: 'EMF = -N * dPhi/dt', description: 'Induced EMF' },
                                { label: 'Lenz', expression: 'Direction opposes change', description: 'Lenz\'s law' },
                            ]} />
                    </div>
                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PHYSICS_COLOR} title="Induction State"
                            items={[
                                { label: 'Mode', value: mode },
                                { label: 'Turns (N)', value: turns },
                                { label: 'B field', value: `${bStrength.toFixed(1)} T` },
                                { label: 'Flux', value: (historyRef.current.length > 0 ? historyRef.current[historyRef.current.length - 1].phi : 0).toFixed(4), unit: 'Wb' },
                                { label: 'EMF', value: (historyRef.current.length > 0 ? historyRef.current[historyRef.current.length - 1].emf : 0).toFixed(1), unit: 'V' },
                            ]} />
                    </div>
                </div>

                <div className="w-72 bg-[#0d0a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ButtonGroup label="Mode" value={mode} onChange={v => { setMode(v as Mode); resetHistory() }}
                            options={[{ value: 'drag', label: 'Drag Coil' }, { value: 'ac-generator', label: 'AC Generator' }]}
                            color={PHYSICS_COLOR} />
                        {mode === 'drag' && (
                            <Button onClick={() => { setAutoScan(true); setLoopX(100) }} variant="secondary">Auto Scan</Button>
                        )}
                        {mode === 'ac-generator' && (
                            <ControlGroup label="Frequency">
                                <Slider value={acFrequency} onChange={setAcFrequency} min={0.2} max={3} step={0.1} label={`${acFrequency.toFixed(1)} Hz`} />
                            </ControlGroup>
                        )}
                        <ControlGroup label="B Field Strength">
                            <Slider value={bStrength} onChange={setBStrength} min={0.2} max={3} step={0.1} label={`${bStrength.toFixed(1)} T`} />
                        </ControlGroup>
                        <ControlGroup label="Coil Turns (N)">
                            <Slider value={turns} onChange={v => setTurns(Math.round(v))} min={1} max={10} step={1} label={`${turns}`} />
                        </ControlGroup>
                        <Toggle value={showLenz} onChange={setShowLenz} label="Lenz's Law Arrow" />
                        <Button onClick={() => { setLoopX(150); setAutoScan(false); resetHistory() }} variant="secondary">Reset</Button>
                    </ControlPanel>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={PHYSICS_COLOR} />
            </div>
        </div>
    )
}
