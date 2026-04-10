import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

export default function WorkEnergy() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [forceMag, setForceMag] = useState(20)
    const [forceAngle, setForceAngle] = useState(0)
    const [mass, setMass] = useState(5)
    const [maxDisplacement, setMaxDisplacement] = useState(10)
    const [mu, setMu] = useState(0)
    const [height, setHeight] = useState(0)
    const [forceType, setForceType] = useState<string>('constant')
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const posRef = useRef(0)
    const velRef = useRef(0)

    const g = 9.8

    const calcPhysics = useCallback((d: number) => {
        const thetaRad = (forceAngle * Math.PI) / 180
        const Fx = forceMag * Math.cos(thetaRad)
        const Fy = forceMag * Math.sin(thetaRad)
        const normal = Math.max(0, mass * g - Fy)
        const friction = mu * normal
        const fNet = Fx - friction

        // Work calculations
        let work: number
        if (forceType === 'constant') {
            work = forceMag * d * Math.cos(thetaRad)
        } else {
            // Variable force: F increases linearly from 0 to forceMag
            work = 0.5 * forceMag * d * Math.cos(thetaRad)
        }

        const workFriction = -friction * d
        const workNet = work + workFriction
        const pe = mass * g * height
        const ke = Math.max(0, workNet) // starting from rest: KE = W_net (if positive)
        const vel = ke > 0 ? Math.sqrt((2 * ke) / mass) : 0
        const power = vel > 0 ? Fx * vel : 0

        return { Fx, Fy, normal, friction, fNet, work, workFriction, workNet, pe, ke, vel, power, thetaRad }
    }, [forceMag, forceAngle, mass, mu, height, forceType])

    const reset = useCallback(() => {
        setForceMag(20)
        setForceAngle(0)
        setMass(5)
        setMaxDisplacement(10)
        setMu(0)
        setHeight(0)
        setForceType('constant')
        setPaused(false)
        timeRef.current = 0
        posRef.current = 0
        velRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'Work = Force x Displacement', description: 'Work is the transfer of energy by a force acting over a distance. When force and displacement are in the same direction, W = Fd. Watch the work accumulate as the block moves.', setup: () => { reset(); setForceMag(25); setForceAngle(0); setMu(0) } },
        { title: 'Angle Matters: W = Fd cos \u03B8', description: 'When force is applied at an angle, only the component along the displacement does work. Increase the angle and watch how work decreases. At 90 degrees, no work is done!', setup: () => { setForceMag(25); setForceAngle(30); setMu(0) } },
        { title: 'Kinetic Energy', description: 'KE = \u00BDmv\u00B2. As net work is done on the block, it gains kinetic energy. The energy bar chart shows KE growing as the block accelerates. KE depends on velocity squared.', setup: () => { setForceMag(30); setForceAngle(0); setMu(0); setHeight(0) } },
        { title: 'Work-Energy Theorem', description: 'The net work done on an object equals its change in kinetic energy: W_net = \u0394KE. This is the work-energy theorem, connecting force and motion through energy.', setup: () => { setForceMag(30); setForceAngle(0); setMu(0.1) } },
        { title: 'Power = Rate of Doing Work', description: 'Power measures how fast work is done: P = W/t = Fv. As velocity increases, instantaneous power increases even with constant force. Power is measured in watts.', setup: () => { setForceMag(20); setForceAngle(0); setMu(0) } },
        { title: 'Negative Work (Friction)', description: 'Friction does negative work, removing energy from the system. The friction work appears as negative in the energy accounting. More friction = less KE for the same applied force.', setup: () => { setForceMag(25); setForceAngle(0); setMu(0.3) } },
        { title: 'Net Work and Energy Change', description: 'The total energy change equals the net work: sum of work by all forces. Applied force does positive work, friction does negative work. The difference determines the final KE.', setup: () => { setForceMag(30); setForceAngle(15); setMu(0.15); setHeight(2) } },
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
            const dt = 0.016
            if (!paused) {
                timeRef.current += dt
                const thetaRad = (forceAngle * Math.PI) / 180
                const Fx = forceMag * Math.cos(thetaRad)
                const Fy = forceMag * Math.sin(thetaRad)
                const normal = Math.max(0, mass * g - Fy)
                const friction = mu * normal
                const accel = (Fx - friction) / mass
                velRef.current += accel * dt
                if (velRef.current < 0) velRef.current = 0
                posRef.current += velRef.current * dt
                if (posRef.current >= maxDisplacement) {
                    posRef.current = 0
                    velRef.current = 0
                }
            }

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const d = posRef.current
            const physics = calcPhysics(d)

            // --- LEFT: Block and surface ---
            const leftW = w * 0.45
            const surfY = h * 0.6
            const surfLeft = 30
            const surfRight = leftW - 20
            const surfLen = surfRight - surfLeft

            // Surface
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(surfLeft, surfY)
            ctx.lineTo(surfRight, surfY)
            ctx.stroke()

            // Hatch marks
            for (let i = surfLeft; i < surfRight; i += 15) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(i, surfY)
                ctx.lineTo(i - 6, surfY + 10)
                ctx.stroke()
            }

            // Displacement markers
            const pxPerM = surfLen / maxDisplacement
            for (let mark = 0; mark <= maxDisplacement; mark += 2) {
                const mx = surfLeft + mark * pxPerM
                ctx.strokeStyle = 'rgba(255,255,255,0.15)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(mx, surfY - 6)
                ctx.lineTo(mx, surfY + 6)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255,255,255,0.3)'
                ctx.font = '9px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`${mark}m`, mx, surfY + 18)
            }

            // Block
            const blockSize = 40
            const blockX = surfLeft + d * pxPerM
            const blockTop = surfY - blockSize

            ctx.fillStyle = 'rgba(160, 100, 255, 0.15)'
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
            ctx.lineWidth = 2
            ctx.fillRect(blockX - blockSize / 2, blockTop, blockSize, blockSize)
            ctx.strokeRect(blockX - blockSize / 2, blockTop, blockSize, blockSize)

            ctx.fillStyle = 'rgba(255,255,255,0.7)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`${mass}kg`, blockX, surfY - blockSize / 2 + 4)

            // Force arrow
            if (forceMag > 0) {
                const arrowLen = Math.min(60, forceMag * 1.5)
                const aRad = physics.thetaRad
                const ax = blockX - blockSize / 2 - 5
                const ay = blockTop + blockSize / 2
                const adx = -arrowLen * Math.cos(aRad) * -1
                const ady = -arrowLen * Math.sin(aRad)

                ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(ax, ay)
                ctx.lineTo(ax + adx, ay + ady)
                ctx.stroke()

                // Arrowhead
                const angle = Math.atan2(ady, adx)
                ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
                ctx.beginPath()
                ctx.moveTo(ax + adx, ay + ady)
                ctx.lineTo(ax + adx - 8 * Math.cos(angle - 0.4), ay + ady - 8 * Math.sin(angle - 0.4))
                ctx.lineTo(ax + adx - 8 * Math.cos(angle + 0.4), ay + ady - 8 * Math.sin(angle + 0.4))
                ctx.closePath()
                ctx.fill()

                ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`F = ${forceMag}N`, ax + adx / 2, ay + ady / 2 - 12)
                if (forceAngle > 0) {
                    ctx.fillText(`\u03B8 = ${forceAngle}\u00B0`, ax + adx / 2, ay + ady / 2 + 2)
                }
            }

            // Friction arrow
            if (mu > 0 && d > 0.1) {
                const fLen = Math.min(40, physics.friction * 1.2)
                ctx.strokeStyle = 'rgba(255, 200, 80, 0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(blockX + blockSize / 2 + 5, surfY - blockSize / 2)
                ctx.lineTo(blockX + blockSize / 2 + 5 - fLen, surfY - blockSize / 2)
                ctx.stroke()

                ctx.fillStyle = 'rgba(255, 200, 80, 0.8)'
                ctx.beginPath()
                ctx.moveTo(blockX + blockSize / 2 + 5 - fLen, surfY - blockSize / 2)
                ctx.lineTo(blockX + blockSize / 2 + 5 - fLen + 6, surfY - blockSize / 2 - 4)
                ctx.lineTo(blockX + blockSize / 2 + 5 - fLen + 6, surfY - blockSize / 2 + 4)
                ctx.closePath()
                ctx.fill()

                ctx.fillStyle = 'rgba(255, 200, 80, 0.6)'
                ctx.font = '9px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`f = ${physics.friction.toFixed(1)}N`, blockX + blockSize / 2 - fLen / 2, surfY - blockSize / 2 - 10)
            }

            // Displacement arrow
            if (d > 0.5) {
                const dPx = d * pxPerM
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.5)'
                ctx.lineWidth = 1.5
                ctx.setLineDash([4, 4])
                ctx.beginPath()
                ctx.moveTo(surfLeft, surfY + 30)
                ctx.lineTo(surfLeft + dPx, surfY + 30)
                ctx.stroke()
                ctx.setLineDash([])

                ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`d = ${d.toFixed(1)}m`, surfLeft + dPx / 2, surfY + 44)
            }

            // --- RIGHT TOP: F vs d graph (Work area) ---
            const graphLeft = w * 0.5
            const graphRight = w - 20
            const graphW = graphRight - graphLeft
            const graphTop1 = 20
            const graphH1 = h * 0.4 - 20

            // Graph border
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
            ctx.fillRect(graphLeft, graphTop1, graphW, graphH1)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
            ctx.lineWidth = 1
            ctx.strokeRect(graphLeft, graphTop1, graphW, graphH1)

            // F vs d axes
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(graphLeft, graphTop1 + graphH1)
            ctx.lineTo(graphRight, graphTop1 + graphH1)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(graphLeft, graphTop1)
            ctx.lineTo(graphLeft, graphTop1 + graphH1)
            ctx.stroke()

            ctx.fillStyle = 'rgb(160, 100, 255)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('F vs d  (Work = shaded area)', graphLeft + 6, graphTop1 + 14)

            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = '9px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('F (N)', graphLeft + 4, graphTop1 + 28)
            ctx.textAlign = 'center'
            ctx.fillText('d (m)', graphLeft + graphW / 2, graphTop1 + graphH1 + 14)

            // Plot F vs d and shade area
            const fMax = forceMag * 1.3
            const dFrac = d / maxDisplacement

            if (d > 0.1) {
                const thetaRad = (forceAngle * Math.PI) / 180
                const Feff = forceMag * Math.cos(thetaRad)

                // Shaded area (work)
                ctx.fillStyle = 'rgba(160, 100, 255, 0.15)'
                ctx.beginPath()
                ctx.moveTo(graphLeft, graphTop1 + graphH1)
                if (forceType === 'constant') {
                    const fy = graphTop1 + graphH1 * (1 - Feff / fMax)
                    ctx.lineTo(graphLeft, fy)
                    ctx.lineTo(graphLeft + dFrac * graphW, fy)
                } else {
                    // Linear ramp
                    for (let i = 0; i <= 50; i++) {
                        const frac = (i / 50) * dFrac
                        const localF = (frac / dFrac) * Feff
                        const px = graphLeft + frac * graphW
                        const py = graphTop1 + graphH1 * (1 - localF / fMax)
                        ctx.lineTo(px, py)
                    }
                }
                ctx.lineTo(graphLeft + dFrac * graphW, graphTop1 + graphH1)
                ctx.closePath()
                ctx.fill()

                // Force line
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
                ctx.lineWidth = 2
                ctx.beginPath()
                if (forceType === 'constant') {
                    const fy = graphTop1 + graphH1 * (1 - Feff / fMax)
                    ctx.moveTo(graphLeft, fy)
                    ctx.lineTo(graphLeft + dFrac * graphW, fy)
                } else {
                    ctx.moveTo(graphLeft, graphTop1 + graphH1)
                    const fy = graphTop1 + graphH1 * (1 - Feff / fMax)
                    ctx.lineTo(graphLeft + dFrac * graphW, fy)
                }
                ctx.stroke()

                // Work value on graph
                ctx.fillStyle = 'rgba(160, 100, 255, 0.8)'
                ctx.font = 'bold 11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`W = ${physics.work.toFixed(1)} J`, graphLeft + dFrac * graphW * 0.5 + 20, graphTop1 + graphH1 * 0.6)
            }

            // Friction work (negative)
            if (mu > 0 && d > 0.1) {
                ctx.fillStyle = 'rgba(255, 200, 80, 0.1)'
                const fFricNorm = physics.friction / fMax
                const fricY = graphTop1 + graphH1
                ctx.fillRect(graphLeft, fricY - graphH1 * fFricNorm * 0.3, dFrac * graphW, graphH1 * fFricNorm * 0.3)

                ctx.fillStyle = 'rgba(255, 200, 80, 0.7)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`W_f = ${physics.workFriction.toFixed(1)} J`, graphLeft + dFrac * graphW * 0.5 + 20, graphTop1 + graphH1 - 6)
            }

            // --- RIGHT BOTTOM: Energy bar chart ---
            const barTop = h * 0.45
            const barH = h * 0.5 - 10
            const barAreaW = graphW

            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
            ctx.fillRect(graphLeft, barTop, barAreaW, barH)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
            ctx.lineWidth = 1
            ctx.strokeRect(graphLeft, barTop, barAreaW, barH)

            ctx.fillStyle = 'rgb(160, 100, 255)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('Energy Bar Chart', graphLeft + 6, barTop + 14)

            // Energy values
            const totalE = physics.ke + physics.pe
            const maxE = Math.max(totalE, 200, physics.ke + 50)

            const bars = [
                { label: 'KE', value: physics.ke, color: 'rgba(100, 255, 150, 0.7)' },
                { label: 'PE', value: physics.pe, color: 'rgba(100, 150, 255, 0.7)' },
                { label: 'Total', value: totalE, color: 'rgba(160, 100, 255, 0.7)' },
            ]

            const barWidth = 50
            const barGap = 30
            const barsStart = graphLeft + (barAreaW - bars.length * (barWidth + barGap) + barGap) / 2
            const barBottom = barTop + barH - 25
            const barMaxH = barH - 55

            bars.forEach((bar, i) => {
                const bx = barsStart + i * (barWidth + barGap)
                const bh = maxE > 0 ? (bar.value / maxE) * barMaxH : 0
                const by = barBottom - bh

                // Bar
                ctx.fillStyle = bar.color
                ctx.fillRect(bx, by, barWidth, bh)

                // Bar outline
                ctx.strokeStyle = bar.color
                ctx.lineWidth = 1
                ctx.strokeRect(bx, by, barWidth, bh)

                // Label
                ctx.fillStyle = 'rgba(255,255,255,0.6)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(bar.label, bx + barWidth / 2, barBottom + 14)

                // Value
                ctx.fillStyle = bar.color
                ctx.font = 'bold 10px system-ui'
                ctx.fillText(`${bar.value.toFixed(1)} J`, bx + barWidth / 2, by - 6)
            })

            // Zero line
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(graphLeft + 10, barBottom)
            ctx.lineTo(graphRight - 10, barBottom)
            ctx.stroke()

            // Velocity readout
            ctx.fillStyle = 'rgba(100, 255, 150, 0.6)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText(`v = ${physics.vel.toFixed(1)} m/s`, graphLeft + 6, barTop + 28)

            // Power readout
            ctx.fillStyle = 'rgba(255, 180, 80, 0.6)'
            ctx.fillText(`P = ${physics.power.toFixed(1)} W`, graphLeft + 6, barTop + 42)

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [forceMag, forceAngle, mass, maxDisplacement, mu, height, forceType, paused, calcPhysics])

    const currentPhysics = calcPhysics(posRef.current)

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 1" unit="Unit 3" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Work & Energy"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'Work done', value: currentPhysics.work.toFixed(1), unit: 'J', color: 'rgb(160, 100, 255)' },
                                { label: 'KE', value: currentPhysics.ke.toFixed(1), unit: 'J', color: 'rgb(100, 255, 150)' },
                                { label: 'PE', value: currentPhysics.pe.toFixed(1), unit: 'J', color: 'rgb(100, 150, 255)' },
                                { label: 'Power', value: currentPhysics.power.toFixed(1), unit: 'W', color: 'rgb(255, 180, 80)' },
                                { label: 'Velocity', value: currentPhysics.vel.toFixed(1), unit: 'm/s' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-[340px] max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Work', expression: 'W = F\u00B7d\u00B7cos \u03B8', description: 'Work done by a force at angle \u03B8' },
                                { label: 'Kinetic Energy', expression: 'KE = \u00BDmv\u00B2' },
                                { label: 'Work-Energy', expression: 'W_net = \u0394KE', description: 'Net work equals change in kinetic energy' },
                                { label: 'Power', expression: 'P = dW/dt = F\u00B7v', description: 'Instantaneous power' },
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
                        <ControlGroup label="Force Type">
                            <ButtonGroup
                                value={forceType}
                                onChange={setForceType}
                                options={[
                                    { value: 'constant', label: 'Constant' },
                                    { value: 'variable', label: 'Variable' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Force Magnitude">
                            <Slider value={forceMag} onChange={setForceMag} min={0} max={80} step={1} label={`F = ${forceMag} N`} />
                        </ControlGroup>

                        <ControlGroup label="Force Angle">
                            <Slider value={forceAngle} onChange={setForceAngle} min={0} max={89} step={1} label={`\u03B8 = ${forceAngle}\u00B0`} />
                        </ControlGroup>

                        <ControlGroup label="Mass">
                            <Slider value={mass} onChange={setMass} min={1} max={20} step={0.5} label={`m = ${mass} kg`} />
                        </ControlGroup>

                        <ControlGroup label="Max Displacement">
                            <Slider value={maxDisplacement} onChange={setMaxDisplacement} min={2} max={20} step={1} label={`d_max = ${maxDisplacement} m`} />
                        </ControlGroup>

                        <ControlGroup label="Friction Coefficient">
                            <Slider value={mu} onChange={setMu} min={0} max={0.8} step={0.05} label={`\u03BC = ${mu.toFixed(2)}`} />
                        </ControlGroup>

                        <ControlGroup label="Height (for PE)">
                            <Slider value={height} onChange={setHeight} min={0} max={10} step={0.5} label={`h = ${height} m`} />
                        </ControlGroup>

                        <Toggle value={paused} onChange={setPaused} label="Pause Animation" />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={() => { reset(); posRef.current = 0; velRef.current = 0 }} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
