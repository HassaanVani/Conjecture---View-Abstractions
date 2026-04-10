import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

export default function MotionGraphs() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [x0, setX0] = useState(0)
    const [v0, setV0] = useState(5)
    const [accel, setAccel] = useState(0)
    const [motionMode, setMotionMode] = useState<string>('uniform')
    const [showConnections, setShowConnections] = useState(true)
    const [paused, setPaused] = useState(false)
    const [refFrameV, setRefFrameV] = useState(0)
    const timeRef = useRef(0)
    const trailRef = useRef<{ t: number; x: number; v: number; a: number }[]>([])

    // --- Mouse drag state ---
    const [draggingParticle, setDraggingParticle] = useState(false)
    const [hoveringParticle, setHoveringParticle] = useState(false)
    const dragParticleRef = useRef(false)
    const wasPausedBeforeDrag = useRef(false)

    const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const { x, y } = getCanvasCoords(e)
        const w = canvas.offsetWidth
        const h = canvas.offsetHeight

        // Track geometry (must match draw code)
        const trackLeft = 30
        const trackRight = w * 0.42
        const trackY = h * 0.5
        const trackLen = trackRight - trackLeft
        const xRange = 60
        const pxPerUnit = trackLen / xRange

        // Current particle pixel position
        const params_cur = { x0, v0: v0 - refFrameV, a: motionMode === 'uniform' ? 0 : accel }
        const t = timeRef.current
        const xPos = params_cur.x0 + params_cur.v0 * t + 0.5 * params_cur.a * t * t
        const clampedX = Math.max(-30, Math.min(30, xPos))
        const particlePx = trackLeft + (clampedX + 30) * pxPerUnit

        const distToParticle = Math.sqrt((x - particlePx) ** 2 + (y - trackY) ** 2)

        if (distToParticle < 25) {
            wasPausedBeforeDrag.current = paused
            setPaused(true)
            setDraggingParticle(true)
            dragParticleRef.current = true
            e.preventDefault()
            return
        }

        // Click on velocity-time graph to set velocity
        const graphLeft = w * 0.48
        const graphRight = w - 20
        const graphGap = 12
        const graphAreaTop = 20
        const graphAreaBot = h - 20
        const graphH = (graphAreaBot - graphAreaTop - graphGap * 2) / 3
        // v-t graph is the second one (index 1)
        const vtTop = graphAreaTop + 1 * (graphH + graphGap)
        const vtBot = vtTop + graphH

        if (x >= graphLeft && x <= graphRight && y >= vtTop && y <= vtBot) {
            const vMin = -15, vMax = 15
            const clickedV = vMax - ((y - vtTop) / graphH) * (vMax - vMin)
            const clampedV = Math.max(-10, Math.min(10, Math.round(clickedV * 2) / 2))
            setV0(clampedV + refFrameV)
            timeRef.current = 0
            trailRef.current = []
            e.preventDefault()
        }
    }, [x0, v0, accel, motionMode, refFrameV, paused, getCanvasCoords])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const { x, y } = getCanvasCoords(e)
        const w = canvas.offsetWidth
        const h = canvas.offsetHeight

        const trackLeft = 30
        const trackRight = w * 0.42
        const trackY = h * 0.5
        const trackLen = trackRight - trackLeft
        const xRange = 60
        const pxPerUnit = trackLen / xRange

        if (dragParticleRef.current) {
            // Map mouse x back to physics units
            const newXPos = ((x - trackLeft) / pxPerUnit) - 30
            const clamped = Math.max(-20, Math.min(20, Math.round(newXPos)))
            setX0(clamped)
            timeRef.current = 0
            trailRef.current = []
        } else {
            // Hover detection
            const params_cur = { x0, v0: v0 - refFrameV, a: motionMode === 'uniform' ? 0 : accel }
            const t = timeRef.current
            const xPos = params_cur.x0 + params_cur.v0 * t + 0.5 * params_cur.a * t * t
            const clampedX = Math.max(-30, Math.min(30, xPos))
            const particlePx = trackLeft + (clampedX + 30) * pxPerUnit
            const distToParticle = Math.sqrt((x - particlePx) ** 2 + (y - trackY) ** 2)
            setHoveringParticle(distToParticle < 25)
        }
    }, [x0, v0, accel, motionMode, refFrameV, getCanvasCoords])

    const handleMouseUp = useCallback(() => {
        if (dragParticleRef.current) {
            dragParticleRef.current = false
            setDraggingParticle(false)
            if (!wasPausedBeforeDrag.current) {
                setPaused(false)
            }
        }
    }, [])

    const handleMouseLeave = useCallback(() => {
        if (dragParticleRef.current) {
            dragParticleRef.current = false
            setDraggingParticle(false)
            if (!wasPausedBeforeDrag.current) {
                setPaused(false)
            }
        }
        setHoveringParticle(false)
    }, [])

    const getParams = useCallback(() => {
        if (motionMode === 'uniform') return { x0, v0, a: 0 }
        if (motionMode === 'accelerating') return { x0, v0, a: accel }
        return { x0, v0, a: accel }
    }, [x0, v0, accel, motionMode])

    const reset = useCallback(() => {
        setX0(0)
        setV0(5)
        setAccel(0)
        setMotionMode('uniform')
        setShowConnections(true)
        setPaused(false)
        setRefFrameV(0)
        timeRef.current = 0
        trailRef.current = []
    }, [])

    const demoSteps = [
        { title: 'Uniform Motion', description: 'With constant velocity and zero acceleration, the x-t graph is a straight line, v-t is flat, and a-t is zero. The slope of the position graph equals the velocity.', setup: () => { reset(); setV0(8); setAccel(0); setMotionMode('uniform') } },
        { title: 'Constant Acceleration from Rest', description: 'Starting from rest with constant acceleration, the x-t graph is a parabola, v-t is a straight line rising from zero, and a-t is constant. Notice x grows quadratically.', setup: () => { setV0(0); setAccel(3); setMotionMode('accelerating') } },
        { title: 'Deceleration / Braking', description: 'With positive initial velocity and negative acceleration, the object slows down, stops, then reverses. Watch the v-t graph cross zero and x-t reach a maximum.', setup: () => { setV0(10); setAccel(-2.5); setMotionMode('custom') } },
        { title: 'Reading Motion Graphs', description: 'The slope of x-t at any instant gives the velocity. The slope of v-t gives the acceleration. These three graphs are mathematically linked through derivatives and integrals.', setup: () => { setV0(5); setAccel(2); setShowConnections(true); setMotionMode('accelerating') } },
        { title: 'Area Under v-t Curve', description: 'The area under the v-t graph equals the displacement. For constant acceleration, this is a trapezoid. For uniform motion, it is a rectangle. Watch the shaded area match the position change.', setup: () => { setV0(3); setAccel(1.5); setMotionMode('accelerating'); setShowConnections(true) } },
        { title: 'Reference Frames', description: 'Adding a constant reference-frame velocity shifts the v-t graph up or down and changes the x-t slope, but the a-t graph stays the same. Acceleration is the same in all inertial frames.', setup: () => { setV0(5); setAccel(0); setMotionMode('uniform'); setRefFrameV(3) } },
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
        const maxTime = 8

        const draw = () => {
            const dt = 0.016
            if (!paused) timeRef.current += dt

            const t = timeRef.current
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const params = getParams()
            const effV0 = params.v0 - refFrameV
            const a = params.a
            const xPos = params.x0 + effV0 * t + 0.5 * a * t * t
            const vel = effV0 + a * t
            const acc = a

            // Record trail
            if (!paused && t < maxTime) {
                trailRef.current.push({ t, x: xPos, v: vel, a: acc })
                if (trailRef.current.length > 600) trailRef.current = trailRef.current.slice(-600)
            }

            // Reset when time exceeds max
            if (t > maxTime) {
                timeRef.current = 0
                trailRef.current = []
            }

            // --- LEFT HALF: Particle track ---
            const trackLeft = 30
            const trackRight = w * 0.42
            const trackY = h * 0.5
            const trackLen = trackRight - trackLeft

            // Track background
            ctx.fillStyle = 'rgba(160, 100, 255, 0.05)'
            ctx.fillRect(trackLeft, trackY - 30, trackLen, 60)

            // Track line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(trackLeft, trackY)
            ctx.lineTo(trackRight, trackY)
            ctx.stroke()

            // Position markers
            const xRange = 60
            const pxPerUnit = trackLen / xRange
            for (let mark = -30; mark <= 30; mark += 5) {
                const mx = trackLeft + (mark + 30) * pxPerUnit
                const isMajor = mark % 10 === 0
                ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(mx, trackY - (isMajor ? 15 : 8))
                ctx.lineTo(mx, trackY + (isMajor ? 15 : 8))
                ctx.stroke()
                if (isMajor) {
                    ctx.fillStyle = 'rgba(255,255,255,0.4)'
                    ctx.font = '10px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`${mark}m`, mx, trackY + 28)
                }
            }

            // Particle
            const clampedX = Math.max(-30, Math.min(30, xPos))
            const particlePx = trackLeft + (clampedX + 30) * pxPerUnit

            const glow = ctx.createRadialGradient(particlePx, trackY, 0, particlePx, trackY, 20)
            glow.addColorStop(0, 'rgba(160, 100, 255, 0.5)')
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.beginPath(); ctx.arc(particlePx, trackY, 20, 0, Math.PI * 2); ctx.fill()

            ctx.fillStyle = 'rgb(160, 100, 255)'
            ctx.beginPath(); ctx.arc(particlePx, trackY, 8, 0, Math.PI * 2); ctx.fill()

            // Grab handle ring around particle
            const handleAlpha = draggingParticle ? 0.9 : 0.35
            ctx.strokeStyle = `rgba(160, 100, 255, ${handleAlpha})`
            ctx.lineWidth = draggingParticle ? 2.5 : 1.5
            ctx.beginPath(); ctx.arc(particlePx, trackY, 14, 0, Math.PI * 2); ctx.stroke()

            // Velocity arrow on particle
            if (Math.abs(vel) > 0.2) {
                const arrowLen = Math.min(50, Math.abs(vel) * 5)
                const dir = vel > 0 ? 1 : -1
                ctx.strokeStyle = 'rgba(100, 255, 150, 0.8)'
                ctx.lineWidth = 2.5
                ctx.beginPath()
                ctx.moveTo(particlePx, trackY - 20)
                ctx.lineTo(particlePx + arrowLen * dir, trackY - 20)
                ctx.stroke()
                // Arrowhead
                ctx.beginPath()
                ctx.moveTo(particlePx + arrowLen * dir, trackY - 20)
                ctx.lineTo(particlePx + (arrowLen - 6) * dir, trackY - 25)
                ctx.lineTo(particlePx + (arrowLen - 6) * dir, trackY - 15)
                ctx.closePath()
                ctx.fillStyle = 'rgba(100, 255, 150, 0.8)'
                ctx.fill()

                ctx.fillStyle = 'rgba(100, 255, 150, 0.7)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`v = ${vel.toFixed(1)} m/s`, particlePx + arrowLen * dir * 0.5, trackY - 32)
            }

            // Track labels
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.font = 'bold 12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('1D Track', (trackLeft + trackRight) / 2, trackY - 55)

            // --- RIGHT HALF: Three stacked graphs ---
            const graphLeft = w * 0.48
            const graphRight = w - 20
            const graphW = graphRight - graphLeft
            const graphGap = 12
            const graphAreaTop = 20
            const graphAreaBot = h - 20
            const graphH = (graphAreaBot - graphAreaTop - graphGap * 2) / 3

            const graphs = [
                { label: 'x (m)', color: 'rgb(160, 100, 255)', yMin: -30, yMax: 30, key: 'x' as const },
                { label: 'v (m/s)', color: 'rgb(100, 255, 150)', yMin: -15, yMax: 15, key: 'v' as const },
                { label: 'a (m/s\u00B2)', color: 'rgb(255, 180, 80)', yMin: -10, yMax: 10, key: 'a' as const },
            ]

            graphs.forEach((g, gi) => {
                const top = graphAreaTop + gi * (graphH + graphGap)
                const bot = top + graphH

                // Background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
                ctx.fillRect(graphLeft, top, graphW, graphH)

                // Border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
                ctx.lineWidth = 1
                ctx.strokeRect(graphLeft, top, graphW, graphH)

                // Axes
                const zeroY = top + graphH * (g.yMax / (g.yMax - g.yMin))
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
                ctx.lineWidth = 1
                ctx.setLineDash([4, 4])
                ctx.beginPath()
                ctx.moveTo(graphLeft, zeroY)
                ctx.lineTo(graphRight, zeroY)
                ctx.stroke()
                ctx.setLineDash([])

                // Label
                ctx.fillStyle = g.color
                ctx.font = 'bold 11px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(g.label, graphLeft + 6, top + 14)

                // Time axis label
                if (gi === 2) {
                    ctx.fillStyle = 'rgba(255,255,255,0.4)'
                    ctx.font = '10px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('t (s)', graphLeft + graphW / 2, bot + 14)
                }

                // Grid lines for time
                for (let ts = 0; ts <= maxTime; ts += 2) {
                    const tx = graphLeft + (ts / maxTime) * graphW
                    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(tx, top)
                    ctx.lineTo(tx, bot)
                    ctx.stroke()
                    if (gi === 2) {
                        ctx.fillStyle = 'rgba(255,255,255,0.3)'
                        ctx.font = '9px system-ui'
                        ctx.textAlign = 'center'
                        ctx.fillText(`${ts}`, tx, bot + 3)
                    }
                }

                // Plot trail
                if (trailRef.current.length > 1) {
                    ctx.strokeStyle = g.color
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    let started = false
                    trailRef.current.forEach(pt => {
                        const px = graphLeft + (pt.t / maxTime) * graphW
                        const val = pt[g.key]
                        const py = top + graphH * ((g.yMax - val) / (g.yMax - g.yMin))
                        const clampedPy = Math.max(top, Math.min(bot, py))
                        if (!started) { ctx.moveTo(px, clampedPy); started = true }
                        else ctx.lineTo(px, clampedPy)
                    })
                    ctx.stroke()

                    // Area under v-t curve (displacement visualization)
                    if (g.key === 'v' && showConnections) {
                        ctx.fillStyle = 'rgba(100, 255, 150, 0.08)'
                        ctx.beginPath()
                        ctx.moveTo(graphLeft, zeroY)
                        trailRef.current.forEach(pt => {
                            const px = graphLeft + (pt.t / maxTime) * graphW
                            const py = top + graphH * ((g.yMax - pt.v) / (g.yMax - g.yMin))
                            ctx.lineTo(px, Math.max(top, Math.min(bot, py)))
                        })
                        const lastPx = graphLeft + (trailRef.current[trailRef.current.length - 1].t / maxTime) * graphW
                        ctx.lineTo(lastPx, zeroY)
                        ctx.closePath()
                        ctx.fill()
                    }

                    // Current value dot
                    const lastPt = trailRef.current[trailRef.current.length - 1]
                    const dotX = graphLeft + (lastPt.t / maxTime) * graphW
                    const dotVal = lastPt[g.key]
                    const dotY = Math.max(top, Math.min(bot, top + graphH * ((g.yMax - dotVal) / (g.yMax - g.yMin))))
                    ctx.fillStyle = g.color
                    ctx.beginPath(); ctx.arc(dotX, dotY, 4, 0, Math.PI * 2); ctx.fill()

                    // Value label
                    ctx.fillStyle = g.color
                    ctx.font = 'bold 10px system-ui'
                    ctx.textAlign = 'left'
                    ctx.fillText(`${dotVal.toFixed(1)}`, dotX + 8, dotY + 4)
                }

                // Connection hints
                if (showConnections && gi === 0 && trailRef.current.length > 10) {
                    ctx.fillStyle = 'rgba(100, 255, 150, 0.5)'
                    ctx.font = '9px system-ui'
                    ctx.textAlign = 'right'
                    ctx.fillText('slope = v', graphRight - 6, top + 14)
                }
                if (showConnections && gi === 1 && trailRef.current.length > 10) {
                    ctx.fillStyle = 'rgba(255, 180, 80, 0.5)'
                    ctx.font = '9px system-ui'
                    ctx.textAlign = 'right'
                    ctx.fillText('slope = a', graphRight - 6, top + 14)

                    ctx.fillStyle = 'rgba(160, 100, 255, 0.5)'
                    ctx.fillText('area = \u0394x', graphRight - 6, top + 26)
                }
            })

            // Time indicator line across all graphs
            if (trailRef.current.length > 0) {
                const curT = trailRef.current[trailRef.current.length - 1].t
                const lineX = graphLeft + (curT / maxTime) * graphW
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
                ctx.lineWidth = 1
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(lineX, graphAreaTop)
                ctx.lineTo(lineX, graphAreaBot)
                ctx.stroke()
                ctx.setLineDash([])
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [x0, v0, accel, motionMode, showConnections, paused, refFrameV, getParams, draggingParticle])

    const params = getParams()
    const t = timeRef.current
    const effV0 = params.v0 - refFrameV
    const currentX = params.x0 + effV0 * t + 0.5 * params.a * t * t
    const currentV = effV0 + params.a * t

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas
                        ref={canvasRef}
                        className={`w-full h-full block ${draggingParticle ? 'cursor-grabbing' : hoveringParticle ? 'cursor-grab' : ''}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 1" unit="Unit 1" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Motion Data"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'Position', value: currentX.toFixed(1), unit: 'm', color: 'rgb(160, 100, 255)' },
                                { label: 'Velocity', value: currentV.toFixed(1), unit: 'm/s', color: 'rgb(100, 255, 150)' },
                                { label: 'Acceleration', value: params.a.toFixed(1), unit: 'm/s\u00B2', color: 'rgb(255, 180, 80)' },
                                { label: 'Time', value: t.toFixed(2), unit: 's' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-[340px] max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Position', expression: 'x = x\u2080 + v\u2080t + \u00BDat\u00B2', description: 'Position as a function of time' },
                                { label: 'Velocity', expression: 'v = v\u2080 + at', description: 'Velocity as a function of time' },
                                { label: 'No-time', expression: 'v\u00B2 = v\u2080\u00B2 + 2a(x \u2212 x\u2080)', description: 'Relates velocity to displacement' },
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
                        <ControlGroup label="Motion Type">
                            <ButtonGroup
                                value={motionMode}
                                onChange={(v) => { setMotionMode(v); timeRef.current = 0; trailRef.current = [] }}
                                options={[
                                    { value: 'uniform', label: 'Uniform' },
                                    { value: 'accelerating', label: 'Accel' },
                                    { value: 'custom', label: 'Custom' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Initial Position">
                            <Slider value={x0} onChange={(v) => { setX0(v); timeRef.current = 0; trailRef.current = [] }} min={-20} max={20} step={1} label={`x\u2080 = ${x0} m`} />
                        </ControlGroup>

                        <ControlGroup label="Initial Velocity">
                            <Slider value={v0} onChange={(v) => { setV0(v); timeRef.current = 0; trailRef.current = [] }} min={-10} max={10} step={0.5} label={`v\u2080 = ${v0} m/s`} />
                        </ControlGroup>

                        <ControlGroup label="Acceleration">
                            <Slider value={accel} onChange={(v) => { setAccel(v); timeRef.current = 0; trailRef.current = [] }} min={-5} max={5} step={0.5} label={`a = ${accel} m/s\u00B2`} />
                        </ControlGroup>

                        <ControlGroup label="Reference Frame Velocity">
                            <Slider value={refFrameV} onChange={(v) => { setRefFrameV(v); timeRef.current = 0; trailRef.current = [] }} min={-5} max={5} step={0.5} label={`v_ref = ${refFrameV} m/s`} />
                        </ControlGroup>

                        <Toggle value={showConnections} onChange={setShowConnections} label="Show Graph Connections" />
                        <Toggle value={paused} onChange={setPaused} label="Pause Animation" />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={() => { reset(); timeRef.current = 0; trailRef.current = [] }} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
