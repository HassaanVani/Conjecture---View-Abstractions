import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

type ForceShape = 'square' | 'triangle' | 'halfsine'

export default function Impulse() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [initialVel, setInitialVel] = useState(5)
    const [mass, setMass] = useState(2)
    const [forceMag, setForceMag] = useState(20)
    const [forceDuration, setForceDuration] = useState(0.5)
    const [forceShape, setForceShape] = useState<string>('square')
    const [showMomentumVectors, setShowMomentumVectors] = useState(true)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const phaseRef = useRef<'approach' | 'impulse' | 'after'>('approach')
    const ballPosRef = useRef(0)
    const ballVelRef = useRef(0)
    const impulseTimeRef = useRef(0)
    const impulseAccumRef = useRef(0)

    const calcImpulse = useCallback(() => {
        const shape = forceShape as ForceShape
        let impulse: number
        if (shape === 'square') {
            impulse = forceMag * forceDuration
        } else if (shape === 'triangle') {
            impulse = 0.5 * forceMag * forceDuration
        } else {
            // half-sine: integral of F_peak * sin(pi*t/T) dt from 0 to T = 2*F_peak*T/pi
            impulse = (2 * forceMag * forceDuration) / Math.PI
        }
        const deltaV = impulse / mass
        const pBefore = mass * initialVel
        const pAfter = pBefore + impulse
        const vAfter = initialVel + deltaV
        const fAvg = impulse / forceDuration

        return { impulse, deltaV, pBefore, pAfter, vAfter, fAvg }
    }, [initialVel, mass, forceMag, forceDuration, forceShape])

    const getForceAtTime = useCallback((t: number): number => {
        if (t < 0 || t > forceDuration) return 0
        const shape = forceShape as ForceShape
        if (shape === 'square') return forceMag
        if (shape === 'triangle') {
            const mid = forceDuration / 2
            return t <= mid ? (forceMag * t) / mid : forceMag * (1 - (t - mid) / mid)
        }
        // half-sine
        return forceMag * Math.sin((Math.PI * t) / forceDuration)
    }, [forceMag, forceDuration, forceShape])

    const resetSim = useCallback(() => {
        timeRef.current = 0
        phaseRef.current = 'approach'
        ballPosRef.current = 0
        ballVelRef.current = initialVel
        impulseTimeRef.current = 0
        impulseAccumRef.current = 0
    }, [initialVel])

    const reset = useCallback(() => {
        setInitialVel(5)
        setMass(2)
        setForceMag(20)
        setForceDuration(0.5)
        setForceShape('square')
        setShowMomentumVectors(true)
        setPaused(false)
        timeRef.current = 0
        phaseRef.current = 'approach'
        ballPosRef.current = 0
        ballVelRef.current = 5
        impulseTimeRef.current = 0
        impulseAccumRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'Momentum = mass x velocity', description: 'Momentum (p = mv) measures how hard it is to stop a moving object. The ball moves with initial velocity, carrying momentum shown as an arrow. More mass or more velocity means more momentum.', setup: () => { reset(); setInitialVel(6); setMass(2); setForceMag(0) } },
        { title: 'Impulse = Force x Time', description: 'An impulse is a force applied over a time interval: J = F\u0394t. It changes the momentum of the object. Watch the force pulse act on the ball and observe the momentum change.', setup: () => { setForceMag(30); setForceDuration(0.4); setForceShape('square') } },
        { title: 'Impulse-Momentum Theorem', description: 'The impulse equals the change in momentum: J = \u0394p = m\u0394v. The area under the F-t graph equals the impulse, which equals the change in momentum. This is the fundamental connection.', setup: () => { setForceMag(25); setForceDuration(0.5); setShowMomentumVectors(true) } },
        { title: 'Same Impulse, Different Ways', description: 'A large force for a short time gives the same impulse as a small force for a long time. Both change momentum by the same amount. Try adjusting force and duration to keep impulse constant.', setup: () => { setForceMag(40); setForceDuration(0.25); setForceShape('square') } },
        { title: 'Cushioning Effect', description: 'Extending the collision time reduces the peak force for the same impulse. This is why cars have crumple zones and athletes bend their knees on landing. Compare the force shapes!', setup: () => { setForceMag(50); setForceDuration(0.2); setForceShape('triangle') } },
        { title: 'F-t Graph Area = Impulse', description: 'The area under the force vs time graph gives the total impulse regardless of shape. Square, triangle, and sine pulses can all deliver the same impulse with different peak forces and durations.', setup: () => { setForceMag(30); setForceDuration(0.6); setForceShape('halfsine'); setShowMomentumVectors(true) } },
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
            if (!paused) {
                timeRef.current += dt

                if (phaseRef.current === 'approach') {
                    ballPosRef.current += ballVelRef.current * dt
                    if (ballPosRef.current >= 200) {
                        phaseRef.current = 'impulse'
                        impulseTimeRef.current = 0
                        impulseAccumRef.current = 0
                    }
                } else if (phaseRef.current === 'impulse') {
                    impulseTimeRef.current += dt
                    const f = getForceAtTime(impulseTimeRef.current)
                    const accel = f / mass
                    ballVelRef.current += accel * dt
                    ballPosRef.current += ballVelRef.current * dt
                    impulseAccumRef.current += f * dt

                    if (impulseTimeRef.current >= forceDuration) {
                        phaseRef.current = 'after'
                    }
                } else {
                    ballPosRef.current += ballVelRef.current * dt
                    if (ballPosRef.current > 500) {
                        resetSim()
                    }
                }
            }

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const impData = calcImpulse()
            const phase = phaseRef.current

            // --- LEFT: Ball animation ---
            const leftW = w * 0.48
            const ballY = h * 0.5
            const ballR = 12 + mass * 3
            const ballScreenX = 40 + ballPosRef.current * 0.8

            // Track / ground line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(20, ballY + ballR + 5)
            ctx.lineTo(leftW - 10, ballY + ballR + 5)
            ctx.stroke()

            // Impact zone indicator
            const impactX = 40 + 200 * 0.8
            ctx.fillStyle = 'rgba(255, 100, 100, 0.06)'
            ctx.fillRect(impactX - 20, ballY - 50, 40, 100)
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.2)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.moveTo(impactX, ballY - 50)
            ctx.lineTo(impactX, ballY + 50)
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255, 100, 100, 0.3)'
            ctx.font = '9px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Impact Zone', impactX, ballY - 55)

            // Ball glow
            const glow = ctx.createRadialGradient(ballScreenX, ballY, 0, ballScreenX, ballY, ballR + 12)
            glow.addColorStop(0, 'rgba(160, 100, 255, 0.4)')
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.beginPath(); ctx.arc(ballScreenX, ballY, ballR + 12, 0, Math.PI * 2); ctx.fill()

            // Ball
            const ballColor = phase === 'impulse' ? 'rgba(255, 140, 100, 0.9)' : 'rgba(160, 100, 255, 0.9)'
            ctx.fillStyle = ballColor
            ctx.beginPath(); ctx.arc(ballScreenX, ballY, ballR, 0, Math.PI * 2); ctx.fill()

            // Mass label
            ctx.fillStyle = 'rgba(255,255,255,0.9)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`${mass}kg`, ballScreenX, ballY + 4)

            // Force arrow during impulse
            if (phase === 'impulse') {
                const f = getForceAtTime(impulseTimeRef.current)
                if (f > 0.5) {
                    const arrowLen = Math.min(80, f * 1.5)
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
                    ctx.lineWidth = 3
                    ctx.beginPath()
                    ctx.moveTo(ballScreenX - ballR - 5, ballY)
                    ctx.lineTo(ballScreenX - ballR - 5 - arrowLen, ballY)
                    ctx.stroke()

                    // Arrowhead pointing right (at the ball)
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
                    ctx.beginPath()
                    ctx.moveTo(ballScreenX - ballR - 5, ballY)
                    ctx.lineTo(ballScreenX - ballR - 13, ballY - 5)
                    ctx.lineTo(ballScreenX - ballR - 13, ballY + 5)
                    ctx.closePath()
                    ctx.fill()

                    ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
                    ctx.font = '10px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`F = ${f.toFixed(0)} N`, ballScreenX - ballR - 5 - arrowLen / 2, ballY - 12)
                }
            }

            // Momentum vectors
            if (showMomentumVectors) {
                const currentV = ballVelRef.current
                const p = mass * currentV
                if (Math.abs(p) > 0.5) {
                    const pArrowLen = Math.min(70, Math.abs(p) * 2)
                    const dir = p > 0 ? 1 : -1
                    ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)'
                    ctx.lineWidth = 2.5
                    ctx.beginPath()
                    ctx.moveTo(ballScreenX, ballY - ballR - 10)
                    ctx.lineTo(ballScreenX + pArrowLen * dir, ballY - ballR - 10)
                    ctx.stroke()

                    ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
                    ctx.beginPath()
                    ctx.moveTo(ballScreenX + pArrowLen * dir, ballY - ballR - 10)
                    ctx.lineTo(ballScreenX + (pArrowLen - 7) * dir, ballY - ballR - 15)
                    ctx.lineTo(ballScreenX + (pArrowLen - 7) * dir, ballY - ballR - 5)
                    ctx.closePath()
                    ctx.fill()

                    ctx.fillStyle = 'rgba(100, 200, 255, 0.7)'
                    ctx.font = '10px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`p = ${p.toFixed(1)} kg\u00B7m/s`, ballScreenX + pArrowLen * dir * 0.5, ballY - ballR - 22)
                }

                // Before/after labels
                if (phase === 'approach') {
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.5)'
                    ctx.font = '9px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`p_i = ${impData.pBefore.toFixed(1)}`, ballScreenX, ballY + ballR + 22)
                } else if (phase === 'after') {
                    ctx.fillStyle = 'rgba(100, 255, 150, 0.5)'
                    ctx.font = '9px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`p_f = ${(mass * ballVelRef.current).toFixed(1)}`, ballScreenX, ballY + ballR + 22)
                }
            }

            // Phase label
            const phaseLabels = { approach: 'Approaching', impulse: 'Force Applied!', after: 'After Impulse' }
            ctx.fillStyle = phase === 'impulse' ? 'rgba(255, 100, 100, 0.7)' : 'rgba(255,255,255,0.4)'
            ctx.font = 'bold 12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(phaseLabels[phase], leftW / 2, h * 0.15)

            // --- RIGHT: F vs t graph ---
            const graphLeft = w * 0.52
            const graphRight = w - 20
            const graphW = graphRight - graphLeft
            const graphTop = 25
            const graphH = h * 0.48 - 25

            // Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
            ctx.fillRect(graphLeft, graphTop, graphW, graphH)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
            ctx.lineWidth = 1
            ctx.strokeRect(graphLeft, graphTop, graphW, graphH)

            // Title
            ctx.fillStyle = 'rgb(160, 100, 255)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('F vs t  (Area = Impulse)', graphLeft + 6, graphTop + 14)

            // Axes
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(graphLeft + 30, graphTop + 25)
            ctx.lineTo(graphLeft + 30, graphTop + graphH - 10)
            ctx.lineTo(graphRight - 10, graphTop + graphH - 10)
            ctx.stroke()

            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = '9px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('F (N)', graphLeft + 15, graphTop + 28)
            ctx.fillText('t (s)', graphLeft + 30 + (graphW - 40) / 2, graphTop + graphH + 4)

            // Plot force shape
            const plotLeft = graphLeft + 30
            const plotRight = graphRight - 10
            const plotW = plotRight - plotLeft
            const plotBottom = graphTop + graphH - 10
            const plotTop = graphTop + 25
            const plotH = plotBottom - plotTop
            const tTotal = forceDuration * 2 // Show some time after pulse
            const fMax = forceMag * 1.2

            // Grid
            for (let ft = 0; ft <= forceDuration * 2; ft += 0.2) {
                const tx = plotLeft + (ft / tTotal) * plotW
                ctx.strokeStyle = 'rgba(255,255,255,0.04)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(tx, plotTop)
                ctx.lineTo(tx, plotBottom)
                ctx.stroke()
            }

            // Force shape and shaded area
            ctx.fillStyle = 'rgba(255, 100, 100, 0.12)'
            ctx.beginPath()
            ctx.moveTo(plotLeft, plotBottom)
            const steps = 80
            for (let i = 0; i <= steps; i++) {
                const tFrac = (i / steps) * forceDuration
                const f = getForceAtTime(tFrac)
                const px = plotLeft + (tFrac / tTotal) * plotW
                const py = plotBottom - (f / fMax) * plotH
                ctx.lineTo(px, py)
            }
            const endPx = plotLeft + (forceDuration / tTotal) * plotW
            ctx.lineTo(endPx, plotBottom)
            ctx.closePath()
            ctx.fill()

            // Force line
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let i = 0; i <= steps; i++) {
                const tFrac = (i / steps) * tTotal
                const f = getForceAtTime(tFrac)
                const px = plotLeft + (tFrac / tTotal) * plotW
                const py = plotBottom - (f / fMax) * plotH
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
            }
            ctx.stroke()

            // Current time indicator during impulse
            if (phase === 'impulse') {
                const curT = impulseTimeRef.current
                const curPx = plotLeft + (curT / tTotal) * plotW
                ctx.strokeStyle = 'rgba(255, 255, 100, 0.6)'
                ctx.lineWidth = 1.5
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(curPx, plotTop)
                ctx.lineTo(curPx, plotBottom)
                ctx.stroke()
                ctx.setLineDash([])
            }

            // Impulse value on graph
            ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'center'
            const impMid = plotLeft + (forceDuration / 2 / tTotal) * plotW
            ctx.fillText(`J = ${impData.impulse.toFixed(1)} N\u00B7s`, impMid, plotBottom - plotH * 0.3)

            // Duration marker
            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = '9px system-ui'
            ctx.fillText(`\u0394t = ${forceDuration}s`, impMid, plotBottom + 14)

            // Peak force label
            const peakY = plotBottom - plotH
            ctx.fillStyle = 'rgba(255,100,100,0.5)'
            ctx.textAlign = 'left'
            ctx.fillText(`${forceMag}N`, plotLeft - 26, peakY + 4)

            // --- BOTTOM RIGHT: Momentum comparison bars ---
            const barTop = h * 0.53
            const barH = h * 0.42
            const barAreaLeft = graphLeft
            const barAreaW = graphW

            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
            ctx.fillRect(barAreaLeft, barTop, barAreaW, barH)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
            ctx.lineWidth = 1
            ctx.strokeRect(barAreaLeft, barTop, barAreaW, barH)

            ctx.fillStyle = 'rgb(160, 100, 255)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText('Momentum Before / After', barAreaLeft + 6, barTop + 14)

            // Momentum bars
            const maxP = Math.max(Math.abs(impData.pBefore), Math.abs(impData.pAfter), 10) * 1.2
            const barWidth = 40
            const barCenterY = barTop + barH * 0.55
            const barMaxLen = barAreaW * 0.35

            // p_before bar
            const pBeforeLen = (impData.pBefore / maxP) * barMaxLen
            const barStartX = barAreaLeft + barAreaW * 0.45
            ctx.fillStyle = 'rgba(100, 200, 255, 0.5)'
            ctx.fillRect(barStartX, barCenterY - barWidth - 5, pBeforeLen, barWidth)
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)'
            ctx.lineWidth = 1
            ctx.strokeRect(barStartX, barCenterY - barWidth - 5, pBeforeLen, barWidth)

            ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'right'
            ctx.fillText(`p_i = ${impData.pBefore.toFixed(1)}`, barStartX - 6, barCenterY - barWidth / 2)
            ctx.font = '9px system-ui'
            ctx.fillText('kg\u00B7m/s', barStartX - 6, barCenterY - barWidth / 2 + 12)

            // p_after bar
            const pAfterLen = (impData.pAfter / maxP) * barMaxLen
            ctx.fillStyle = 'rgba(100, 255, 150, 0.5)'
            ctx.fillRect(barStartX, barCenterY + 5, pAfterLen, barWidth)
            ctx.strokeStyle = 'rgba(100, 255, 150, 0.7)'
            ctx.lineWidth = 1
            ctx.strokeRect(barStartX, barCenterY + 5, pAfterLen, barWidth)

            ctx.fillStyle = 'rgba(100, 255, 150, 0.8)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'right'
            ctx.fillText(`p_f = ${impData.pAfter.toFixed(1)}`, barStartX - 6, barCenterY + barWidth / 2 + 10)
            ctx.font = '9px system-ui'
            ctx.fillText('kg\u00B7m/s', barStartX - 6, barCenterY + barWidth / 2 + 22)

            // Delta p arrow
            const dpLen = pAfterLen - pBeforeLen
            if (Math.abs(dpLen) > 2) {
                const dpY = barCenterY + barWidth + 25
                ctx.strokeStyle = 'rgba(255, 255, 100, 0.7)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(barStartX + pBeforeLen, dpY)
                ctx.lineTo(barStartX + pAfterLen, dpY)
                ctx.stroke()

                const dpDir = dpLen > 0 ? 1 : -1
                ctx.fillStyle = 'rgba(255, 255, 100, 0.7)'
                ctx.beginPath()
                ctx.moveTo(barStartX + pAfterLen, dpY)
                ctx.lineTo(barStartX + pAfterLen - 6 * dpDir, dpY - 4)
                ctx.lineTo(barStartX + pAfterLen - 6 * dpDir, dpY + 4)
                ctx.closePath()
                ctx.fill()

                ctx.fillStyle = 'rgba(255, 255, 100, 0.7)'
                ctx.font = 'bold 10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`\u0394p = ${impData.impulse.toFixed(1)} = J`, barStartX + (pBeforeLen + pAfterLen) / 2, dpY - 8)
            }

            // F_avg display
            ctx.fillStyle = 'rgba(255,180,80,0.6)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText(`F_avg = ${impData.fAvg.toFixed(1)} N`, barAreaLeft + 6, barTop + barH - 10)

            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.fillText(`\u0394v = ${impData.deltaV.toFixed(1)} m/s`, barAreaLeft + 6, barTop + barH - 25)

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [initialVel, mass, forceMag, forceDuration, forceShape, showMomentumVectors, paused, calcImpulse, getForceAtTime, resetSim])

    const impData = calcImpulse()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 1" unit="Unit 4" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Impulse & Momentum"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'p_before', value: impData.pBefore.toFixed(1), unit: 'kg\u00B7m/s', color: 'rgb(100, 200, 255)' },
                                { label: 'p_after', value: impData.pAfter.toFixed(1), unit: 'kg\u00B7m/s', color: 'rgb(100, 255, 150)' },
                                { label: 'Impulse (J)', value: impData.impulse.toFixed(1), unit: 'N\u00B7s', color: 'rgb(255, 100, 100)' },
                                { label: 'Force', value: forceMag.toFixed(0), unit: 'N' },
                                { label: 'Duration', value: forceDuration.toFixed(2), unit: 's' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-[340px] max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Momentum', expression: 'p = mv', description: 'Momentum = mass times velocity' },
                                { label: 'Impulse', expression: 'J = F\u00B7\u0394t', description: 'Impulse = force times time interval' },
                                { label: 'Impulse-Momentum', expression: 'J = \u0394p = m\u0394v', description: 'Impulse equals change in momentum' },
                                { label: 'Average Force', expression: 'F_avg = \u0394p / \u0394t' },
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
                        <ControlGroup label="Force Shape">
                            <ButtonGroup
                                value={forceShape}
                                onChange={setForceShape}
                                options={[
                                    { value: 'square', label: 'Square' },
                                    { value: 'triangle', label: 'Triangle' },
                                    { value: 'halfsine', label: 'Sine' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Initial Velocity">
                            <Slider value={initialVel} onChange={(v) => { setInitialVel(v); resetSim() }} min={0} max={15} step={0.5} label={`v\u2080 = ${initialVel} m/s`} />
                        </ControlGroup>

                        <ControlGroup label="Mass">
                            <Slider value={mass} onChange={(v) => { setMass(v); resetSim() }} min={0.5} max={10} step={0.5} label={`m = ${mass} kg`} />
                        </ControlGroup>

                        <ControlGroup label="Force Magnitude">
                            <Slider value={forceMag} onChange={setForceMag} min={0} max={80} step={1} label={`F = ${forceMag} N`} />
                        </ControlGroup>

                        <ControlGroup label="Force Duration">
                            <Slider value={forceDuration} onChange={setForceDuration} min={0.1} max={2} step={0.05} label={`\u0394t = ${forceDuration.toFixed(2)} s`} />
                        </ControlGroup>

                        <Toggle value={showMomentumVectors} onChange={setShowMomentumVectors} label="Show Momentum Vectors" />
                        <Toggle value={paused} onChange={setPaused} label="Pause Animation" />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={() => { reset() }} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
