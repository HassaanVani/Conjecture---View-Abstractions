import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

const K = 8.99e9

export default function CoulombsLaw() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [mode, setMode] = useState<string>('coulomb')
    const [q1, setQ1] = useState(3)
    const [q2, setQ2] = useState(-2)
    const [distance, setDistance] = useState(0.5)
    const [showForceVectors, setShowForceVectors] = useState(true)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const conductionPhaseRef = useRef(0)
    const inductionPhaseRef = useRef(0)
    const draggingRef = useRef<number | null>(null)
    const chargePositionsRef = useRef<{ x1: number; y1: number; x2: number; y2: number }>({ x1: 0, y1: 0, x2: 0, y2: 0 })

    const q1C = q1 * 1e-6
    const q2C = q2 * 1e-6
    const force = K * Math.abs(q1C * q2C) / (distance * distance)
    const isAttractive = q1 * q2 < 0

    const reset = useCallback(() => {
        setMode('coulomb')
        setQ1(3); setQ2(-2)
        setDistance(0.5)
        setShowForceVectors(true)
        setPaused(false)
        timeRef.current = 0
        conductionPhaseRef.current = 0
        inductionPhaseRef.current = 0
    }, [])

    const demoSteps = [
        { title: "Coulomb's Law", description: "The electric force between two point charges is proportional to the product of charges and inversely proportional to the square of the distance: F = kq1q2/r2. This is analogous to Newton's law of gravitation.", setup: () => { reset(); setQ1(4); setQ2(-3); setDistance(0.5) } },
        { title: 'Like Charges Repel', description: 'When both charges have the same sign (both positive or both negative), the force is repulsive. The charges push away from each other. Note the outward-pointing force vectors.', setup: () => { setMode('coulomb'); setQ1(3); setQ2(3); setShowForceVectors(true) } },
        { title: 'Opposite Charges Attract', description: 'When charges have opposite signs, the force is attractive. The charges pull toward each other. The force vectors point inward, toward the other charge.', setup: () => { setQ1(4); setQ2(-4); setShowForceVectors(true) } },
        { title: 'Inverse Square Law', description: 'Double the distance and the force drops to 1/4. Triple the distance and it drops to 1/9. Try moving the distance slider to see how rapidly the force changes with separation.', setup: () => { setQ1(3); setQ2(-3); setDistance(0.3); setShowForceVectors(true) } },
        { title: 'Charging by Conduction', description: 'When a charged object touches a neutral conductor, charge transfers until both objects have the same potential. For identical spheres, charge is shared equally: each ends up with (q1 + q2)/2.', setup: () => { setMode('conduction'); setQ1(6); setQ2(0) } },
        { title: 'Charging by Induction', description: 'A charged rod brought near (but not touching) a conductor causes charge separation. The near side gets opposite charge, the far side gets like charge. If the conductor is grounded, net charge is induced.', setup: () => { setMode('induction'); setQ1(-5) } },
        { title: 'Charge Conservation', description: 'Electric charge is always conserved. In any process — conduction, induction, friction — the total charge of the system remains constant. Charge can transfer but cannot be created or destroyed.', setup: () => { setMode('conduction'); setQ1(4); setQ2(-2) } },
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

        const handleMouseDown = (e: MouseEvent) => {
            if (mode !== 'coulomb') return
            const rect = canvas.getBoundingClientRect()
            const mx = e.clientX - rect.left
            const my = e.clientY - rect.top
            const p = chargePositionsRef.current
            const d1 = Math.hypot(mx - p.x1, my - p.y1)
            const d2 = Math.hypot(mx - p.x2, my - p.y2)
            if (d1 < 30) draggingRef.current = 1
            else if (d2 < 30) draggingRef.current = 2
        }
        const handleMouseUp = () => { draggingRef.current = null }
        const handleMouseMove = (e: MouseEvent) => {
            if (draggingRef.current === null || mode !== 'coulomb') return
            const rect = canvas.getBoundingClientRect()
            const w = canvas.offsetWidth
            const cx = w / 2
            const mx = e.clientX - rect.left
            if (draggingRef.current === 1) {
                const newDist = Math.max(0.1, Math.abs(cx - mx) / 200)
                setDistance(Math.round(newDist * 20) / 20)
            } else {
                const newDist = Math.max(0.1, Math.abs(mx - cx) / 200)
                setDistance(Math.round(newDist * 20) / 20)
            }
        }
        canvas.addEventListener('mousedown', handleMouseDown)
        canvas.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('mousemove', handleMouseMove)

        let animId: number

        const draw = () => {
            const dt = 0.016
            if (!paused) timeRef.current += dt
            const time = timeRef.current

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const cx = w / 2
            const cy = h / 2

            if (mode === 'coulomb') {
                const pixelDist = distance * 200
                const x1 = cx - pixelDist
                const x2 = cx + pixelDist
                chargePositionsRef.current = { x1, y1: cy, x2, y2: cy }

                // Distance line
                ctx.strokeStyle = 'rgba(255,255,255,0.15)'
                ctx.lineWidth = 1
                ctx.setLineDash([4, 4])
                ctx.beginPath()
                ctx.moveTo(x1, cy + 40)
                ctx.lineTo(x2, cy + 40)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(255,255,255,0.4)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`r = ${distance.toFixed(2)} m`, cx, cy + 55)

                // Force vectors
                if (showForceVectors) {
                    const maxArrow = 120
                    const arrowLen = Math.min(maxArrow, force * 1e-3 * 50)
                    const dir = isAttractive ? 1 : -1

                    // Force on q1 (points toward q2 if attractive, away if repulsive)
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)'
                    ctx.lineWidth = 3
                    const f1EndX = x1 + dir * arrowLen
                    ctx.beginPath()
                    ctx.moveTo(x1, cy)
                    ctx.lineTo(f1EndX, cy)
                    ctx.stroke()
                    ctx.beginPath()
                    ctx.moveTo(f1EndX, cy)
                    ctx.lineTo(f1EndX - dir * 10, cy - 6)
                    ctx.lineTo(f1EndX - dir * 10, cy + 6)
                    ctx.closePath()
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                    ctx.fill()

                    // Force on q2 (Newton's third law: opposite direction)
                    ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)'
                    ctx.lineWidth = 3
                    const f2EndX = x2 - dir * arrowLen
                    ctx.beginPath()
                    ctx.moveTo(x2, cy)
                    ctx.lineTo(f2EndX, cy)
                    ctx.stroke()
                    ctx.beginPath()
                    ctx.moveTo(f2EndX, cy)
                    ctx.lineTo(f2EndX + dir * 10, cy - 6)
                    ctx.lineTo(f2EndX + dir * 10, cy + 6)
                    ctx.closePath()
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
                    ctx.fill()

                    // Force labels
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                    ctx.fillText(`F = ${force.toExponential(2)} N`, x1 + dir * arrowLen / 2, cy - 18)
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
                    ctx.fillText(`F = ${force.toExponential(2)} N`, x2 - dir * arrowLen / 2, cy - 18)
                }

                // Draw charges with glow
                const drawCharge = (x: number, y: number, charge: number, label: string) => {
                    const color = charge > 0 ? 'rgba(255, 80, 80, 1)' : 'rgba(80, 150, 255, 1)'
                    const glowColor = charge > 0 ? 'rgba(255, 80, 80, 0.4)' : 'rgba(80, 150, 255, 0.4)'

                    const glow = ctx.createRadialGradient(x, y, 0, x, y, 35)
                    glow.addColorStop(0, glowColor)
                    glow.addColorStop(1, 'transparent')
                    ctx.fillStyle = glow
                    ctx.beginPath()
                    ctx.arc(x, y, 35, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.fillStyle = color
                    ctx.beginPath()
                    ctx.arc(x, y, 18, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.fillStyle = '#fff'
                    ctx.font = 'bold 16px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(charge > 0 ? '+' : '-', x, y + 6)

                    ctx.fillStyle = 'rgba(255,255,255,0.7)'
                    ctx.font = '11px system-ui'
                    ctx.fillText(`${label} = ${Math.abs(charge)} uC`, x, y - 30)
                }

                drawCharge(x1, cy, q1, 'q1')
                drawCharge(x2, cy, q2, 'q2')

                // Field lines sketch
                const numLines = 8
                for (let i = 0; i < numLines; i++) {
                    const angle = (i / numLines) * Math.PI * 2
                    const lineLen = 40 + Math.sin(time * 2 + i) * 5

                    // Lines from q1
                    if (q1 !== 0) {
                        const dir1 = q1 > 0 ? 1 : -1
                        ctx.strokeStyle = `rgba(255, 80, 80, 0.15)`
                        ctx.lineWidth = 1
                        ctx.beginPath()
                        ctx.moveTo(x1 + Math.cos(angle) * 20, cy + Math.sin(angle) * 20)
                        ctx.lineTo(x1 + Math.cos(angle) * (20 + lineLen * dir1), cy + Math.sin(angle) * (20 + lineLen * dir1))
                        ctx.stroke()
                    }

                    // Lines from q2
                    if (q2 !== 0) {
                        const dir2 = q2 > 0 ? 1 : -1
                        ctx.strokeStyle = `rgba(80, 150, 255, 0.15)`
                        ctx.lineWidth = 1
                        ctx.beginPath()
                        ctx.moveTo(x2 + Math.cos(angle) * 20, cy + Math.sin(angle) * 20)
                        ctx.lineTo(x2 + Math.cos(angle) * (20 + lineLen * dir2), cy + Math.sin(angle) * (20 + lineLen * dir2))
                        ctx.stroke()
                    }
                }
            }

            if (mode === 'conduction') {
                if (!paused) conductionPhaseRef.current = Math.min(1, conductionPhaseRef.current + dt * 0.3)
                const phase = conductionPhaseRef.current

                const sphereR = 50
                const sep = phase < 0.3 ? 180 - phase * 400 : phase < 0.7 ? 60 : 60 + (phase - 0.7) * 400

                const x1 = cx - sep
                const x2 = cx + sep

                // Charge values during process
                const q1Now = q1 * (1 - phase * 0.5) + q2 * phase * 0.5
                const q2Now = q2 * (1 - phase * 0.5) + q1 * phase * 0.5
                const qFinal = (q1 + q2) / 2

                // Draw spheres
                const drawSphere = (x: number, y: number, charge: number, label: string) => {
                    const intensity = Math.abs(charge) / Math.max(Math.abs(q1), Math.abs(q2), 1) * 0.6
                    const color = charge > 0.1 ? `rgba(255, 80, 80, ${0.3 + intensity})` : charge < -0.1 ? `rgba(80, 150, 255, ${0.3 + intensity})` : 'rgba(150, 150, 150, 0.3)'

                    ctx.fillStyle = color
                    ctx.beginPath()
                    ctx.arc(x, y, sphereR, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    ctx.arc(x, y, sphereR, 0, Math.PI * 2)
                    ctx.stroke()

                    ctx.fillStyle = '#fff'
                    ctx.font = 'bold 14px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(label, x, y - sphereR - 12)

                    const displayQ = phase >= 1 ? qFinal : charge
                    ctx.font = '13px system-ui'
                    ctx.fillText(`${displayQ.toFixed(1)} uC`, x, y + 5)
                }

                drawSphere(x1, cy, q1Now, 'Sphere 1')
                drawSphere(x2, cy, q2Now, 'Sphere 2')

                // Charge transfer particles
                if (phase > 0.2 && phase < 0.8 && Math.abs(q1 - q2) > 0.1) {
                    const numDots = 6
                    for (let i = 0; i < numDots; i++) {
                        const t = ((time * 1.5 + i / numDots) % 1)
                        const px = x1 + sphereR + (x2 - x1 - 2 * sphereR) * t
                        const py = cy + Math.sin(t * Math.PI * 3) * 15
                        ctx.fillStyle = q1 > q2 ? 'rgba(255, 80, 80, 0.6)' : 'rgba(80, 150, 255, 0.6)'
                        ctx.beginPath()
                        ctx.arc(px, py, 4, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }

                // Labels
                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                const phaseLabel = phase < 0.3 ? 'Approaching...' : phase < 0.7 ? 'Contact: Charge sharing' : phase < 1 ? 'Separating...' : `Final: each has ${qFinal.toFixed(1)} uC`
                ctx.fillText(phaseLabel, cx, cy + sphereR + 40)
                ctx.fillStyle = 'rgba(255, 220, 100, 0.6)'
                ctx.font = '11px system-ui'
                ctx.fillText(`Total charge conserved: ${(q1 + q2).toFixed(1)} uC`, cx, cy + sphereR + 60)
            }

            if (mode === 'induction') {
                if (!paused) inductionPhaseRef.current = Math.min(1, inductionPhaseRef.current + dt * 0.4)
                const phase = inductionPhaseRef.current

                // Charged rod on the left
                const rodX = cx - 180 + phase * 60
                const rodW = 20
                const rodH = 120
                ctx.fillStyle = q1 > 0 ? 'rgba(255, 80, 80, 0.7)' : 'rgba(80, 150, 255, 0.7)'
                ctx.beginPath()
                ctx.roundRect(rodX - rodW / 2, cy - rodH / 2, rodW, rodH, 4)
                ctx.fill()
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'
                ctx.beginPath()
                ctx.roundRect(rodX - rodW / 2, cy - rodH / 2, rodW, rodH, 4)
                ctx.stroke()
                ctx.fillStyle = '#fff'
                ctx.font = 'bold 13px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(q1 > 0 ? '+ Rod' : '- Rod', rodX, cy - rodH / 2 - 12)

                // Conductor (neutral overall but with charge separation)
                const condX = cx + 60
                const condW = 120
                const condH = 80
                ctx.fillStyle = 'rgba(150, 160, 170, 0.4)'
                ctx.beginPath()
                ctx.roundRect(condX - condW / 2, cy - condH / 2, condW, condH, 8)
                ctx.fill()
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'
                ctx.lineWidth = 1.5
                ctx.beginPath()
                ctx.roundRect(condX - condW / 2, cy - condH / 2, condW, condH, 8)
                ctx.stroke()
                ctx.fillStyle = '#fff'
                ctx.font = 'bold 13px system-ui'
                ctx.fillText('Conductor', condX, cy - condH / 2 - 12)

                // Show charge separation inside conductor
                const separation = phase * 0.8
                const numCharges = 5
                for (let i = 0; i < numCharges; i++) {
                    const yOff = (i - (numCharges - 1) / 2) * 14

                    // Near side: opposite charge attracted
                    const nearX = condX - condW / 2 + 15 + (1 - separation) * 20
                    ctx.fillStyle = q1 > 0 ? 'rgba(80, 150, 255, 0.8)' : 'rgba(255, 80, 80, 0.8)'
                    ctx.beginPath()
                    ctx.arc(nearX, cy + yOff, 5, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.fillStyle = '#fff'
                    ctx.font = 'bold 8px system-ui'
                    ctx.fillText(q1 > 0 ? '-' : '+', nearX, cy + yOff + 3)

                    // Far side: like charge repelled
                    const farX = condX + condW / 2 - 15 - (1 - separation) * 20
                    ctx.fillStyle = q1 > 0 ? 'rgba(255, 80, 80, 0.8)' : 'rgba(80, 150, 255, 0.8)'
                    ctx.beginPath()
                    ctx.arc(farX, cy + yOff, 5, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.fillStyle = '#fff'
                    ctx.font = 'bold 8px system-ui'
                    ctx.fillText(q1 > 0 ? '+' : '-', farX, cy + yOff + 3)
                }

                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Charge separates — near side gets opposite sign', cx, cy + condH / 2 + 30)
                ctx.fillStyle = 'rgba(255, 220, 100, 0.6)'
                ctx.font = '11px system-ui'
                ctx.fillText('Net charge on conductor is still ZERO (no contact)', cx, cy + condH / 2 + 50)
            }

            animId = requestAnimationFrame(draw)
        }

        conductionPhaseRef.current = 0
        inductionPhaseRef.current = 0
        animId = requestAnimationFrame(draw)
        return () => {
            window.removeEventListener('resize', resize)
            canvas.removeEventListener('mousedown', handleMouseDown)
            canvas.removeEventListener('mouseup', handleMouseUp)
            canvas.removeEventListener('mousemove', handleMouseMove)
            cancelAnimationFrame(animId)
        }
    }, [mode, q1, q2, distance, showForceVectors, paused])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 10" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Coulomb's Law"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'F_electric', value: force.toExponential(2), unit: 'N', color: isAttractive ? 'rgb(100, 200, 255)' : 'rgb(255, 100, 100)' },
                                { label: 'q_1', value: `${q1}`, unit: 'uC' },
                                { label: 'q_2', value: `${q2}`, unit: 'uC' },
                                { label: 'r', value: distance.toFixed(2), unit: 'm' },
                                { label: 'k', value: '8.99e9', unit: 'Nm2/C2' },
                                { label: 'Type', value: isAttractive ? 'Attractive' : 'Repulsive' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: "Coulomb", expression: 'F = kq1q2 / r2', description: 'Electric force between point charges' },
                                { label: 'k', expression: 'k = 1/(4pi e0) = 8.99e9 Nm2/C2' },
                                { label: 'Conservation', expression: 'q_total = q1 + q2', description: 'Charge is conserved' },
                            ]}
                        />
                    </div>

                    <div className="absolute bottom-4 left-4">
                        <DemoMode
                            steps={demoSteps}
                            currentStep={demo.currentStep}
                            isOpen={demo.isOpen}
                            onClose={demo.close}
                            onNext={demo.next}
                            onPrev={demo.prev}
                            onGoToStep={demo.goToStep}
                            departmentColor="rgb(160, 100, 255)"
                        />
                    </div>
                </div>

                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ControlGroup label="Mode">
                            <ButtonGroup
                                value={mode}
                                onChange={setMode}
                                options={[
                                    { value: 'coulomb', label: 'Coulomb' },
                                    { value: 'conduction', label: 'Conduction' },
                                    { value: 'induction', label: 'Induction' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Charge q1">
                            <Slider value={q1} onChange={setQ1} min={-10} max={10} step={1} label={`q_1 = ${q1} uC`} />
                        </ControlGroup>

                        <ControlGroup label="Charge q2">
                            <Slider value={q2} onChange={setQ2} min={-10} max={10} step={1} label={`q_2 = ${q2} uC`} />
                        </ControlGroup>

                        {mode === 'coulomb' && (
                            <ControlGroup label="Distance">
                                <Slider value={distance} onChange={setDistance} min={0.1} max={2} step={0.05} label={`r = ${distance.toFixed(2)} m`} />
                            </ControlGroup>
                        )}

                        <Toggle value={showForceVectors} onChange={setShowForceVectors} label="Show Force Vectors" />
                        <Toggle value={paused} onChange={setPaused} label="Pause Animation" />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
