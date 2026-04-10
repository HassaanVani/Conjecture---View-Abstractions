import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'

export default function NewtonsLaws() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [appliedForce, setAppliedForce] = useState(0)
    const [mass, setMass] = useState(5)
    const [mu, setMu] = useState(0.2)
    const [surfaceAngle, setSurfaceAngle] = useState(0)
    const [showLabels, setShowLabels] = useState(true)
    const [showNetForce, setShowNetForce] = useState(true)
    const [show3rdLaw, setShow3rdLaw] = useState(false)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const velRef = useRef(0)
    const posRef = useRef(0)

    const g = 9.8

    const calcForces = useCallback(() => {
        const theta = (surfaceAngle * Math.PI) / 180
        const gravityMag = mass * g
        const normal = mass * g * Math.cos(theta)
        const gravParallel = mass * g * Math.sin(theta)
        const frictionMax = mu * normal
        const netDriving = appliedForce - gravParallel
        let friction: number
        if (Math.abs(velRef.current) < 0.01 && Math.abs(netDriving) <= frictionMax) {
            friction = -netDriving // static friction balances
        } else {
            friction = velRef.current > 0.01 ? -frictionMax : velRef.current < -0.01 ? frictionMax : (netDriving > 0 ? -frictionMax : frictionMax)
        }
        const fNet = appliedForce - gravParallel + friction
        const acceleration = fNet / mass

        return { gravityMag, normal, friction, gravParallel, fNet, acceleration, frictionMax }
    }, [appliedForce, mass, mu, surfaceAngle])

    const reset = useCallback(() => {
        setAppliedForce(0)
        setMass(5)
        setMu(0.2)
        setSurfaceAngle(0)
        setShowLabels(true)
        setShowNetForce(true)
        setShow3rdLaw(false)
        setPaused(false)
        timeRef.current = 0
        velRef.current = 0
        posRef.current = 0
    }, [])

    const demoSteps = [
        { title: "Newton's 1st Law", description: 'An object at rest stays at rest unless acted on by a net external force. With no applied force and no initial velocity, the block remains stationary. This is inertia.', setup: () => { reset() } },
        { title: 'Apply Force - Acceleration', description: 'Push the block! When an unbalanced force acts, the object accelerates in the direction of the net force. Watch the block speed up as the applied force overcomes friction.', setup: () => { setAppliedForce(30); setMu(0.1); setSurfaceAngle(0) } },
        { title: 'Friction Opposes Motion', description: 'Kinetic friction always opposes the direction of motion. Increase the friction coefficient and watch how it reduces acceleration. Static friction prevents motion from starting.', setup: () => { setAppliedForce(15); setMu(0.4) } },
        { title: 'F = ma Relationship', description: "Newton's 2nd Law: the acceleration is directly proportional to net force and inversely proportional to mass. Double the force = double the acceleration. Double the mass = half the acceleration.", setup: () => { setAppliedForce(40); setMass(5); setMu(0.1); setSurfaceAngle(0); setShowNetForce(true) } },
        { title: '3rd Law Pairs', description: 'Every action has an equal and opposite reaction. The block pushes down on the surface with its weight; the surface pushes up with the normal force. These are action-reaction pairs.', setup: () => { setAppliedForce(0); setShow3rdLaw(true); setShowLabels(true) } },
        { title: 'Equilibrium', description: 'When all forces balance (net force = 0), the object is in equilibrium. It may be at rest or moving at constant velocity. This is a direct consequence of the 1st Law.', setup: () => { setAppliedForce(9.8); setMass(5); setMu(0.2); setSurfaceAngle(0); setShowNetForce(true) } },
        { title: 'Mass vs Acceleration', description: 'Keep force constant and increase mass. The heavier block accelerates less. F = ma means a = F/m: acceleration and mass are inversely proportional for the same net force.', setup: () => { setAppliedForce(40); setMass(10); setMu(0.1); setSurfaceAngle(0) } },
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
        const dt = 0.016

        const drawArrow = (x: number, y: number, dx: number, dy: number, color: string, label: string) => {
            const len = Math.sqrt(dx * dx + dy * dy)
            if (len < 1) return
            ctx.strokeStyle = color
            ctx.lineWidth = 2.5
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x + dx, y + dy)
            ctx.stroke()

            // Arrowhead
            const angle = Math.atan2(dy, dx)
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.moveTo(x + dx, y + dy)
            ctx.lineTo(x + dx - 8 * Math.cos(angle - 0.4), y + dy - 8 * Math.sin(angle - 0.4))
            ctx.lineTo(x + dx - 8 * Math.cos(angle + 0.4), y + dy - 8 * Math.sin(angle + 0.4))
            ctx.closePath()
            ctx.fill()

            if (showLabels && label) {
                ctx.fillStyle = color
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                const lx = x + dx * 0.5 + (Math.abs(dx) < 5 ? (dx >= 0 ? 14 : -14) : 0)
                const ly = y + dy * 0.5 + (Math.abs(dy) < 5 ? -10 : (dy > 0 ? 14 : -8))
                ctx.fillText(label, lx, ly)
            }
        }

        const draw = () => {
            if (!paused) {
                timeRef.current += dt
                const forces = calcForces()
                velRef.current += forces.acceleration * dt
                posRef.current += velRef.current * dt
                // Clamp position
                if (posRef.current < -200) { posRef.current = -200; velRef.current = 0 }
                if (posRef.current > 200) { posRef.current = -200; velRef.current = 0 }
            }

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const forces = calcForces()
            const theta = (surfaceAngle * Math.PI) / 180

            // Surface
            const surfCenterX = w * 0.45
            const surfCenterY = h * 0.55
            const surfLen = w * 0.7

            ctx.save()
            ctx.translate(surfCenterX, surfCenterY)
            ctx.rotate(-theta)

            // Surface line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(-surfLen / 2, 0)
            ctx.lineTo(surfLen / 2, 0)
            ctx.stroke()

            // Hatch marks
            for (let i = -surfLen / 2; i < surfLen / 2; i += 15) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(i, 0)
                ctx.lineTo(i - 8, 12)
                ctx.stroke()
            }

            // Block
            const blockW = 50 + mass * 2
            const blockH = 40 + mass * 1.5
            const blockX = posRef.current - blockW / 2
            const blockY = -blockH

            ctx.fillStyle = 'rgba(160, 100, 255, 0.15)'
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
            ctx.lineWidth = 2
            ctx.fillRect(blockX, blockY, blockW, blockH)
            ctx.strokeRect(blockX, blockY, blockW, blockH)

            // Mass label on block
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.font = 'bold 13px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`${mass} kg`, posRef.current, blockY + blockH / 2 + 5)

            // Force arrows (in rotated frame)
            const arrowScale = 1.5
            const cx = posRef.current
            const cy = blockY + blockH / 2

            // Applied force (along surface)
            if (Math.abs(appliedForce) > 0.1) {
                drawArrow(cx - blockW / 2 - 5, cy, -appliedForce * arrowScale * -1, 0, 'rgba(255, 100, 100, 0.9)', `F_app = ${appliedForce.toFixed(0)}N`)
            }

            // Friction (along surface, opposing motion)
            if (Math.abs(forces.friction) > 0.1) {
                drawArrow(cx + (forces.friction > 0 ? -blockW / 2 : blockW / 2), cy + 5, forces.friction * arrowScale, 0, 'rgba(255, 200, 80, 0.9)', `f = ${Math.abs(forces.friction).toFixed(1)}N`)
            }

            // Normal force (perpendicular to surface, up in local frame)
            drawArrow(cx, blockY - 5, 0, -forces.normal * arrowScale * 0.5, 'rgba(100, 200, 255, 0.9)', `N = ${forces.normal.toFixed(1)}N`)

            // Gravity component perpendicular (into surface in local frame)
            drawArrow(cx + 10, cy, 0, forces.normal * arrowScale * 0.5, 'rgba(255, 150, 50, 0.7)', `mg cos\u03B8 = ${forces.normal.toFixed(1)}N`)

            // Gravity parallel component (down the incline)
            if (surfaceAngle > 0) {
                drawArrow(cx, cy + 10, -forces.gravParallel * arrowScale, 0, 'rgba(255, 150, 50, 0.5)', `mg sin\u03B8 = ${forces.gravParallel.toFixed(1)}N`)
            }

            // Net force vector
            if (showNetForce) {
                const netFScale = forces.fNet * arrowScale
                if (Math.abs(netFScale) > 1) {
                    drawArrow(cx, blockY - 25, netFScale, 0, 'rgba(255, 255, 100, 1)', `F_net = ${forces.fNet.toFixed(1)}N`)
                } else {
                    ctx.fillStyle = 'rgba(100, 255, 100, 0.7)'
                    ctx.font = 'bold 10px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('EQUILIBRIUM', cx, blockY - 30)
                }
            }

            // 3rd law pairs
            if (show3rdLaw) {
                // Block pushes surface down
                drawArrow(cx - 15, 0, 0, forces.normal * arrowScale * 0.3, 'rgba(100, 255, 200, 0.6)', 'F_block\u2192surface')
                // Surface pushes block up (already drawn as N)
                ctx.fillStyle = 'rgba(100, 255, 200, 0.6)'
                ctx.font = '9px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText('Action-Reaction Pair', cx + blockW / 2 + 10, blockY + blockH / 2)
            }

            ctx.restore()

            // Velocity indicator (screen coords)
            const screenVel = velRef.current
            if (Math.abs(screenVel) > 0.1) {
                ctx.fillStyle = 'rgba(100, 255, 150, 0.7)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`v = ${screenVel.toFixed(1)} m/s`, surfCenterX, h * 0.2)
            }

            // Acceleration indicator
            ctx.fillStyle = 'rgba(255, 180, 80, 0.7)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`a = ${forces.acceleration.toFixed(2)} m/s\u00B2`, surfCenterX, h * 0.2 + 18)

            // Angle label
            if (surfaceAngle > 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(`\u03B8 = ${surfaceAngle}\u00B0`, surfCenterX + surfLen * 0.3, surfCenterY + 25)
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [appliedForce, mass, mu, surfaceAngle, showLabels, showNetForce, show3rdLaw, paused, calcForces])

    const forces = calcForces()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 1" unit="Unit 2" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Force Analysis"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'F_applied', value: appliedForce.toFixed(1), unit: 'N', color: 'rgb(255, 100, 100)' },
                                { label: 'F_friction', value: Math.abs(forces.friction).toFixed(1), unit: 'N', color: 'rgb(255, 200, 80)' },
                                { label: 'F_normal', value: forces.normal.toFixed(1), unit: 'N', color: 'rgb(100, 200, 255)' },
                                { label: 'F_net', value: forces.fNet.toFixed(1), unit: 'N', color: 'rgb(255, 255, 100)' },
                                { label: 'Mass', value: mass.toFixed(1), unit: 'kg' },
                                { label: 'Acceleration', value: forces.acceleration.toFixed(2), unit: 'm/s\u00B2', color: 'rgb(255, 180, 80)' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-[340px] max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: '2nd Law', expression: 'F_net = ma', description: 'Net force equals mass times acceleration' },
                                { label: 'Friction', expression: 'f = \u03BCN', description: 'Friction force = coefficient times normal' },
                                { label: 'Normal', expression: 'N = mg cos \u03B8', description: 'Normal force on an incline' },
                                { label: 'Net (incline)', expression: 'F_net = F_app \u2212 f \u2212 mg sin \u03B8' },
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
                        <ControlGroup label="Applied Force">
                            <Slider value={appliedForce} onChange={setAppliedForce} min={-50} max={80} step={1} label={`F = ${appliedForce} N`} />
                        </ControlGroup>

                        <ControlGroup label="Mass">
                            <Slider value={mass} onChange={setMass} min={1} max={30} step={0.5} label={`m = ${mass} kg`} />
                        </ControlGroup>

                        <ControlGroup label="Friction Coefficient">
                            <Slider value={mu} onChange={setMu} min={0} max={1} step={0.05} label={`\u03BC = ${mu.toFixed(2)}`} />
                        </ControlGroup>

                        <ControlGroup label="Surface Angle">
                            <Slider value={surfaceAngle} onChange={setSurfaceAngle} min={0} max={45} step={1} label={`\u03B8 = ${surfaceAngle}\u00B0`} />
                        </ControlGroup>

                        <Toggle value={showLabels} onChange={setShowLabels} label="Show Force Labels" />
                        <Toggle value={showNetForce} onChange={setShowNetForce} label="Show Net Force" />
                        <Toggle value={show3rdLaw} onChange={setShow3rdLaw} label="Show 3rd Law Pairs" />
                        <Toggle value={paused} onChange={setPaused} label="Pause Animation" />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={() => { reset(); velRef.current = 0; posRef.current = 0 }} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
