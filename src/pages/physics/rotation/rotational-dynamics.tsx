import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

type Shape = 'disk' | 'ring' | 'sphere'

function momentOfInertia(shape: Shape, mass: number, radius: number): number {
    switch (shape) {
        case 'disk': return 0.5 * mass * radius * radius
        case 'ring': return mass * radius * radius
        case 'sphere': return 0.4 * mass * radius * radius
    }
}

function shapeLabel(shape: Shape): string {
    switch (shape) {
        case 'disk': return '½MR²'
        case 'ring': return 'MR²'
        case 'sphere': return '⅖MR²'
    }
}

export default function RotationalDynamics() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [appliedTorque, setAppliedTorque] = useState(5)
    const [frictionTorque, setFrictionTorque] = useState(0.5)
    const [shape, setShape] = useState<Shape>('disk')
    const [mass, setMass] = useState(4)
    const [radius, setRadius] = useState(1.5)
    const [mode, setMode] = useState<string>('constant')
    const [showGraphs, setShowGraphs] = useState(true)
    const [showComparison, setShowComparison] = useState(false)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const thetaRef = useRef(0)
    const omegaRef = useRef(0)
    const historyRef = useRef<{ t: number; theta: number; omega: number; alpha: number }[]>([])

    // --- Mouse drag state ---
    const [dragging, setDragging] = useState<'wheel' | null>(null)
    const [hovered, setHovered] = useState<'wheel' | null>(null)
    // Store layout geometry for mouse handlers
    const layoutRef = useRef<{
        wheelCx: number; wheelCy: number; wheelR: number
    }>({ wheelCx: 0, wheelCy: 0, wheelR: 0 })
    const lastMouseAngleRef = useRef<number | null>(null)
    const lastMouseTimeRef = useRef<number>(0)

    const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasPos(e)
        const lay = layoutRef.current
        const dist = Math.hypot(x - lay.wheelCx, y - lay.wheelCy)
        // Hit-test near the rim (within 20px inside/outside the rim)
        if (dist > lay.wheelR * 0.5 && dist < lay.wheelR + 25) {
            setDragging('wheel')
            lastMouseAngleRef.current = Math.atan2(y - lay.wheelCy, x - lay.wheelCx)
            lastMouseTimeRef.current = performance.now()
            e.preventDefault()
        }
    }, [getCanvasPos])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasPos(e)
        const lay = layoutRef.current

        if (dragging === 'wheel') {
            const currentAngle = Math.atan2(y - lay.wheelCy, x - lay.wheelCx)
            const prevAngle = lastMouseAngleRef.current
            if (prevAngle !== null) {
                // Calculate angular displacement
                let dAngle = currentAngle - prevAngle
                // Normalize to [-PI, PI]
                if (dAngle > Math.PI) dAngle -= 2 * Math.PI
                if (dAngle < -Math.PI) dAngle += 2 * Math.PI

                const now = performance.now()
                const dtMs = Math.max(1, now - lastMouseTimeRef.current)
                lastMouseTimeRef.current = now

                // Angular velocity from mouse tangential motion (rad/s)
                const mouseOmega = (dAngle / dtMs) * 1000

                // Apply as torque: map mouse angular velocity to torque value
                // Clamp to a reasonable range
                const torqueFromMouse = Math.max(0, Math.min(20, Math.abs(mouseOmega) * 2))
                setAppliedTorque(Math.round(torqueFromMouse * 2) / 2)

                // Also directly adjust omega for immediate feedback
                omegaRef.current += dAngle * 3
            }
            lastMouseAngleRef.current = currentAngle
            return
        }

        // Hover detection
        const dist = Math.hypot(x - lay.wheelCx, y - lay.wheelCy)
        if (dist > lay.wheelR * 0.5 && dist < lay.wheelR + 25) {
            setHovered('wheel')
        } else {
            setHovered(null)
        }
    }, [dragging, getCanvasPos])

    const handleMouseUp = useCallback(() => {
        if (dragging === 'wheel') {
            lastMouseAngleRef.current = null
        }
        setDragging(null)
    }, [dragging])

    const handleMouseLeave = useCallback(() => {
        if (dragging === 'wheel') {
            lastMouseAngleRef.current = null
        }
        setDragging(null)
        setHovered(null)
    }, [dragging])

    const I = momentOfInertia(shape, mass, radius)
    const netTorque = mode === 'constant' ? appliedTorque - frictionTorque : -frictionTorque
    const alpha = netTorque / I
    const omega = omegaRef.current
    const theta = thetaRef.current
    const vTan = omega * radius
    const aTan = alpha * radius

    const reset = useCallback(() => {
        setAppliedTorque(5)
        setFrictionTorque(0.5)
        setShape('disk')
        setMass(4)
        setRadius(1.5)
        setMode('constant')
        setShowGraphs(true)
        setShowComparison(false)
        setPaused(false)
        timeRef.current = 0
        thetaRef.current = 0
        omegaRef.current = 0
        historyRef.current = []
    }, [])

    const demoSteps = [
        { title: 'Rotational Kinematics', description: 'Just like linear motion has position, velocity, and acceleration, rotational motion has angular position (θ), angular velocity (ω), and angular acceleration (α). Watch the wheel spin and see these quantities update.', setup: () => { reset(); setMode('constant'); setAppliedTorque(3); setFrictionTorque(0) } },
        { title: 'Moment of Inertia', description: 'Moment of inertia (I) is the rotational analog of mass — it measures resistance to angular acceleration. It depends on both mass AND how that mass is distributed from the axis of rotation.', setup: () => { setShowComparison(true); setMode('constant'); setAppliedTorque(5); setFrictionTorque(0) } },
        { title: 'τ = Iα (Newton\'s 2nd for Rotation)', description: 'Net torque equals moment of inertia times angular acceleration. More torque → more α. More I → less α for the same torque. Try changing the applied torque and mass.', setup: () => { setShowComparison(false); setMode('constant'); setAppliedTorque(8); setMass(4) } },
        { title: 'Shape Comparison', description: 'Different shapes have different moments of inertia. A ring (I = MR²) has all mass at the edge. A disk (I = ½MR²) has mass distributed inside. A sphere (I = ⅖MR²) is even more compact. Switch between them to see the effect.', setup: () => { setShowComparison(true); setAppliedTorque(5); setFrictionTorque(0) } },
        { title: 'Linear ↔ Rotational Connection', description: 'Every rotational quantity maps to a linear one: v_tangential = ωR and a_tangential = αR. A point on the rim of a spinning wheel traces a larger circle and moves faster than one near the center.', setup: () => { setShowComparison(false); setAppliedTorque(4); setRadius(2); setShowGraphs(true) } },
        { title: 'Angular Acceleration Graphs', description: 'With constant α, ω grows linearly and θ grows quadratically — just like constant linear acceleration. The ω-t graph is a straight line and the θ-t graph is a parabola.', setup: () => { setShowGraphs(true); setAppliedTorque(3); setFrictionTorque(0); setMode('constant'); timeRef.current = 0; thetaRef.current = 0; omegaRef.current = 0; historyRef.current = [] } },
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

        const draw = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            if (!paused) {
                timeRef.current += dt
                const curI = momentOfInertia(shape, mass, radius)
                const curNetTorque = mode === 'constant' ? appliedTorque - frictionTorque : -frictionTorque
                const curAlpha = curNetTorque / curI

                omegaRef.current += curAlpha * dt
                if (mode === 'free' && omegaRef.current < 0) omegaRef.current = 0
                thetaRef.current += omegaRef.current * dt

                historyRef.current.push({ t: timeRef.current, theta: thetaRef.current, omega: omegaRef.current, alpha: curAlpha })
                if (historyRef.current.length > 500) historyRef.current.shift()
            }

            const cx = showGraphs ? w * 0.3 : w * 0.45
            const cy = showComparison ? h * 0.35 : h * 0.5
            const wheelR = Math.min(120, Math.min(w, h) * 0.18) * (radius / 2)
            const numSpokes = 8

            // Store layout for mouse handlers
            layoutRef.current.wheelCx = cx
            layoutRef.current.wheelCy = cy
            layoutRef.current.wheelR = wheelR

            // Draw wheel glow
            const glow = ctx.createRadialGradient(cx, cy, wheelR * 0.5, cx, cy, wheelR * 1.4)
            glow.addColorStop(0, 'rgba(160, 100, 255, 0.08)')
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.beginPath(); ctx.arc(cx, cy, wheelR * 1.4, 0, Math.PI * 2); ctx.fill()

            // Draw wheel rim
            ctx.strokeStyle = shape === 'ring' ? 'rgba(160, 100, 255, 0.9)' : 'rgba(160, 100, 255, 0.5)'
            ctx.lineWidth = shape === 'ring' ? 8 : 3
            ctx.beginPath(); ctx.arc(cx, cy, wheelR, 0, Math.PI * 2); ctx.stroke()

            // Fill for disk/sphere
            if (shape === 'disk') {
                const diskGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, wheelR)
                diskGrad.addColorStop(0, 'rgba(160, 100, 255, 0.25)')
                diskGrad.addColorStop(1, 'rgba(160, 100, 255, 0.05)')
                ctx.fillStyle = diskGrad
                ctx.beginPath(); ctx.arc(cx, cy, wheelR, 0, Math.PI * 2); ctx.fill()
            } else if (shape === 'sphere') {
                const sphGrad = ctx.createRadialGradient(cx - wheelR * 0.2, cy - wheelR * 0.2, 0, cx, cy, wheelR)
                sphGrad.addColorStop(0, 'rgba(160, 100, 255, 0.35)')
                sphGrad.addColorStop(0.7, 'rgba(160, 100, 255, 0.1)')
                sphGrad.addColorStop(1, 'rgba(160, 100, 255, 0.05)')
                ctx.fillStyle = sphGrad
                ctx.beginPath(); ctx.arc(cx, cy, wheelR, 0, Math.PI * 2); ctx.fill()
            }

            // Spokes rotating
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.lineWidth = 2
            for (let i = 0; i < numSpokes; i++) {
                const angle = thetaRef.current + (i * Math.PI * 2) / numSpokes
                ctx.beginPath()
                ctx.moveTo(cx, cy)
                ctx.lineTo(cx + Math.cos(angle) * wheelR, cy + Math.sin(angle) * wheelR)
                ctx.stroke()
            }

            // Center hub
            ctx.fillStyle = 'rgba(160, 100, 255, 0.8)'
            ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill()

            // Drag affordance on wheel rim
            const rimAlpha = dragging === 'wheel' ? 0.8 : hovered === 'wheel' ? 0.5 : 0.15
            if (rimAlpha > 0.1) {
                // Highlight ring around rim
                ctx.strokeStyle = `rgba(255, 180, 80, ${rimAlpha})`
                ctx.lineWidth = dragging === 'wheel' ? 4 : 2
                ctx.setLineDash(dragging === 'wheel' ? [] : [6, 4])
                ctx.beginPath(); ctx.arc(cx, cy, wheelR, 0, Math.PI * 2); ctx.stroke()
                ctx.setLineDash([])

                // Small circular arrow affordance at 3 o'clock position on rim
                const affordAngle = thetaRef.current
                const affordX = cx + Math.cos(affordAngle) * wheelR
                const affordY = cy + Math.sin(affordAngle) * wheelR
                ctx.fillStyle = `rgba(255, 180, 80, ${rimAlpha})`
                ctx.beginPath(); ctx.arc(affordX, affordY, dragging === 'wheel' ? 6 : 4, 0, Math.PI * 2); ctx.fill()

                // Curved arrow hint near the rim
                if (hovered === 'wheel' && !dragging) {
                    ctx.strokeStyle = 'rgba(255, 180, 80, 0.5)'
                    ctx.lineWidth = 1.5
                    const hintR = wheelR + 15
                    ctx.beginPath()
                    ctx.arc(cx, cy, hintR, -0.4, 0.4)
                    ctx.stroke()
                    // Arrowhead
                    const tipA = 0.4
                    const tipX = cx + Math.cos(tipA) * hintR
                    const tipY = cy + Math.sin(tipA) * hintR
                    ctx.fillStyle = 'rgba(255, 180, 80, 0.5)'
                    ctx.beginPath()
                    ctx.moveTo(tipX, tipY)
                    ctx.lineTo(tipX - 3, tipY - 8)
                    ctx.lineTo(tipX + 6, tipY - 3)
                    ctx.closePath(); ctx.fill()

                    ctx.fillStyle = 'rgba(255, 180, 80, 0.6)'
                    ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText('drag rim to spin', cx, cy + wheelR + 42)
                }
            }

            // Angular velocity arc arrow
            if (Math.abs(omegaRef.current) > 0.01) {
                const arcR = wheelR + 25
                const arcSpan = Math.min(Math.abs(omegaRef.current) * 0.3, Math.PI * 1.5)
                const startA = -Math.PI / 2
                const endA = startA + arcSpan * Math.sign(omegaRef.current)
                ctx.strokeStyle = 'rgba(100, 255, 200, 0.7)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(cx, cy, arcR, Math.min(startA, endA), Math.max(startA, endA))
                ctx.stroke()

                // Arrowhead
                const tipAngle = endA
                const tipX = cx + Math.cos(tipAngle) * arcR
                const tipY = cy + Math.sin(tipAngle) * arcR
                const perpAngle = tipAngle + (omegaRef.current > 0 ? Math.PI / 2 : -Math.PI / 2)
                ctx.fillStyle = 'rgba(100, 255, 200, 0.7)'
                ctx.beginPath()
                ctx.moveTo(tipX, tipY)
                ctx.lineTo(tipX + Math.cos(perpAngle + 2.5) * 10, tipY + Math.sin(perpAngle + 2.5) * 10)
                ctx.lineTo(tipX + Math.cos(perpAngle - 2.5) * 10, tipY + Math.sin(perpAngle - 2.5) * 10)
                ctx.closePath(); ctx.fill()

                ctx.fillStyle = 'rgba(100, 255, 200, 0.8)'
                ctx.font = '12px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`ω = ${omegaRef.current.toFixed(2)} rad/s`, cx, cy - wheelR - 40)
            }

            // Torque arrow
            if (mode === 'constant' && appliedTorque > 0) {
                const torqueArcR = wheelR + 45
                ctx.strokeStyle = 'rgba(255, 180, 80, 0.7)'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.arc(cx, cy, torqueArcR, -Math.PI * 0.3, Math.PI * 0.3)
                ctx.stroke()
                const tTipX = cx + Math.cos(Math.PI * 0.3) * torqueArcR
                const tTipY = cy + Math.sin(Math.PI * 0.3) * torqueArcR
                ctx.fillStyle = 'rgba(255, 180, 80, 0.7)'
                ctx.beginPath()
                ctx.moveTo(tTipX, tTipY)
                ctx.lineTo(tTipX - 5, tTipY - 10)
                ctx.lineTo(tTipX + 8, tTipY - 3)
                ctx.closePath(); ctx.fill()
                ctx.fillStyle = 'rgba(255, 180, 80, 0.7)'
                ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`τ = ${appliedTorque.toFixed(1)} N·m`, cx + torqueArcR + 40, cy)
            }

            // Tangential velocity arrow at rim
            if (Math.abs(omegaRef.current) > 0.05) {
                const rimAngle = thetaRef.current
                const rimX = cx + Math.cos(rimAngle) * wheelR
                const rimY = cy + Math.sin(rimAngle) * wheelR
                const tanAngle = rimAngle + Math.PI / 2
                const vScale = Math.min(40, Math.abs(omegaRef.current * radius) * 8)
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(rimX, rimY)
                ctx.lineTo(rimX + Math.cos(tanAngle) * vScale, rimY + Math.sin(tanAngle) * vScale)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 100, 100, 0.6)'
                ctx.font = '10px system-ui'; ctx.textAlign = 'left'
                ctx.fillText(`v_t = ${Math.abs(omegaRef.current * radius).toFixed(2)} m/s`, rimX + Math.cos(tanAngle) * vScale + 5, rimY + Math.sin(tanAngle) * vScale)
            }

            // Shape labels
            ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'
            ctx.font = '13px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(`${shape.charAt(0).toUpperCase() + shape.slice(1)} — I = ${shapeLabel(shape)}`, cx, cy + wheelR + 25)

            // Shape comparison
            if (showComparison) {
                const shapes: Shape[] = ['disk', 'ring', 'sphere']
                const compY = h * 0.75
                const spacing = Math.min(200, w * 0.2)
                const compCx = showGraphs ? w * 0.3 : w * 0.45

                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('Moment of Inertia Comparison (same M and R)', compCx, compY - 60)

                shapes.forEach((s, i) => {
                    const sx = compCx + (i - 1) * spacing
                    const sI = momentOfInertia(s, mass, radius)
                    const barH = (sI / (mass * radius * radius)) * 80

                    ctx.fillStyle = s === shape ? 'rgba(160, 100, 255, 0.8)' : 'rgba(160, 100, 255, 0.3)'
                    ctx.fillRect(sx - 20, compY - barH, 40, barH)

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
                    ctx.lineWidth = 1
                    ctx.strokeRect(sx - 20, compY - 80, 40, 80)

                    ctx.fillStyle = s === shape ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)'
                    ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText(s.charAt(0).toUpperCase() + s.slice(1), sx, compY + 18)
                    ctx.fillText(`I = ${shapeLabel(s)}`, sx, compY + 33)
                    ctx.fillText(`= ${sI.toFixed(2)} kg·m²`, sx, compY + 48)
                })
            }

            // Graphs
            if (showGraphs && historyRef.current.length > 2) {
                const graphX = w * 0.62
                const graphW = w * 0.32
                const graphH = (h - 80) / 3
                const graphs = [
                    { label: 'θ (rad)', key: 'theta' as const, color: 'rgba(160, 100, 255, 0.8)' },
                    { label: 'ω (rad/s)', key: 'omega' as const, color: 'rgba(100, 255, 200, 0.8)' },
                    { label: 'α (rad/s²)', key: 'alpha' as const, color: 'rgba(255, 180, 80, 0.8)' },
                ]

                graphs.forEach((g, gi) => {
                    const gy = 20 + gi * (graphH + 15)
                    // Background
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
                    ctx.fillRect(graphX, gy, graphW, graphH)
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
                    ctx.lineWidth = 1
                    ctx.strokeRect(graphX, gy, graphW, graphH)

                    // Zero line
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
                    ctx.setLineDash([4, 4])
                    ctx.beginPath()
                    ctx.moveTo(graphX, gy + graphH / 2)
                    ctx.lineTo(graphX + graphW, gy + graphH / 2)
                    ctx.stroke()
                    ctx.setLineDash([])

                    ctx.fillStyle = g.color
                    ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left'
                    ctx.fillText(g.label, graphX + 6, gy + 15)

                    const data = historyRef.current
                    const vals = data.map(d => d[g.key])
                    const maxVal = Math.max(Math.abs(Math.max(...vals)), Math.abs(Math.min(...vals)), 0.01)

                    ctx.strokeStyle = g.color
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    data.forEach((d, di) => {
                        const px = graphX + (di / (data.length - 1)) * graphW
                        const py = gy + graphH / 2 - (d[g.key] / maxVal) * (graphH * 0.4)
                        if (di === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
                    })
                    ctx.stroke()
                })
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [appliedTorque, frictionTorque, shape, mass, radius, mode, showGraphs, showComparison, paused])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas
                        ref={canvasRef}
                        className={`w-full h-full block ${dragging === 'wheel' ? 'cursor-grabbing' : hovered === 'wheel' ? 'cursor-grab' : ''}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 1" unit="Unit 5" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Rotational Dynamics"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'θ', value: (theta % (2 * Math.PI)).toFixed(2), unit: 'rad' },
                                { label: 'ω', value: omega.toFixed(2), unit: 'rad/s', color: 'rgb(100, 255, 200)' },
                                { label: 'α', value: alpha.toFixed(3), unit: 'rad/s²', color: 'rgb(255, 180, 80)' },
                                { label: 'τ_net', value: netTorque.toFixed(2), unit: 'N·m', color: 'rgb(255, 180, 80)' },
                                { label: 'I', value: I.toFixed(3), unit: 'kg·m²' },
                                { label: 'v_tan', value: vTan.toFixed(2), unit: 'm/s', color: 'rgb(255, 100, 100)' },
                                { label: 'a_tan', value: aTan.toFixed(3), unit: 'm/s²' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-[340px] max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Newton\'s 2nd (rotation)', expression: 'τ = Iα' },
                                { label: 'Disk', expression: 'I = ½MR²' },
                                { label: 'Ring', expression: 'I = MR²' },
                                { label: 'Sphere', expression: 'I = ⅖MR²' },
                                { label: 'Tangential velocity', expression: 'v = ωR' },
                                { label: 'Kinematics', expression: 'θ = θ₀ + ω₀t + ½αt²' },
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
                                    { value: 'constant', label: 'Constant Torque' },
                                    { value: 'free', label: 'Free Spin' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Shape">
                            <ButtonGroup
                                value={shape}
                                onChange={(v) => setShape(v as Shape)}
                                options={[
                                    { value: 'disk', label: 'Disk' },
                                    { value: 'ring', label: 'Ring' },
                                    { value: 'sphere', label: 'Sphere' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Applied Torque">
                            <Slider value={appliedTorque} onChange={setAppliedTorque} min={0} max={20} step={0.5} label={`τ = ${appliedTorque.toFixed(1)} N·m`} />
                        </ControlGroup>

                        <ControlGroup label="Friction Torque">
                            <Slider value={frictionTorque} onChange={setFrictionTorque} min={0} max={10} step={0.1} label={`τ_f = ${frictionTorque.toFixed(1)} N·m`} />
                        </ControlGroup>

                        <ControlGroup label="Mass">
                            <Slider value={mass} onChange={setMass} min={1} max={20} step={0.5} label={`M = ${mass.toFixed(1)} kg`} />
                        </ControlGroup>

                        <ControlGroup label="Radius">
                            <Slider value={radius} onChange={setRadius} min={0.5} max={3} step={0.1} label={`R = ${radius.toFixed(1)} m`} />
                        </ControlGroup>

                        <Toggle value={showGraphs} onChange={setShowGraphs} label="Show Graphs" />
                        <Toggle value={showComparison} onChange={setShowComparison} label="Shape Comparison" />
                        <Toggle value={paused} onChange={setPaused} label="Pause Animation" />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={() => { timeRef.current = 0; thetaRef.current = 0; omegaRef.current = 0; historyRef.current = [] }} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
