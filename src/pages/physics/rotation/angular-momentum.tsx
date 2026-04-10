import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

export default function AngularMomentum() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [viewMode, setViewMode] = useState<string>('skater')
    const [armPosition, setArmPosition] = useState(0.5)
    const [initialOmega, setInitialOmega] = useState(4)
    const [mass, setMass] = useState(50)
    const [skaterRadius, setSkaterRadius] = useState(0.4)
    const [inclineAngle, setInclineAngle] = useState(30)
    const [showEnergyBars, setShowEnergyBars] = useState(true)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const thetaRef = useRef(0)
    const rollPosRef = useRef(0)
    const rollVelRef = useRef(0)

    // Skater: I ranges from compact (arms in) to extended (arms out)
    // I_min ~ point mass, I_max ~ arms extended
    const I_min = 0.5 * mass * skaterRadius * skaterRadius
    const I_max = mass * (skaterRadius + 0.6) * (skaterRadius + 0.6)

    // Conservation: L = I_initial * omega_initial = I_current * omega_current
    const L = I_min * initialOmega

    // Rolling: disk rolling down incline
    const g = 9.81
    const rollingR = 0.3
    const I_rolling = 0.5 * mass * rollingR * rollingR
    const sinA = Math.sin((inclineAngle * Math.PI) / 180)
    const rollingAccel = (g * sinA) / (1 + I_rolling / (mass * rollingR * rollingR))
    const rollV = rollVelRef.current
    const rollOmega = rollV / rollingR
    const KE_trans = 0.5 * mass * rollV * rollV
    const KE_rot = 0.5 * I_rolling * rollOmega * rollOmega
    const KE_total = KE_trans + KE_rot

    const reset = useCallback(() => {
        setViewMode('skater')
        setArmPosition(0.5)
        setInitialOmega(4)
        setMass(50)
        setSkaterRadius(0.4)
        setInclineAngle(30)
        setShowEnergyBars(true)
        setPaused(false)
        timeRef.current = 0
        thetaRef.current = 0
        rollPosRef.current = 0
        rollVelRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'Angular Momentum', description: 'Angular momentum L = Iω is the rotational analog of linear momentum. Like linear momentum, it is conserved when no external torque acts on the system.', setup: () => { reset(); setViewMode('skater'); setArmPosition(0.5) } },
        { title: 'Conservation of L — Ice Skater', description: 'An ice skater spinning with arms out has large I and small ω. When they pull arms in, I decreases but L stays constant, so ω must increase. This is conservation of angular momentum!', setup: () => { setViewMode('skater'); setArmPosition(0.8); setInitialOmega(3) } },
        { title: 'Changing I Changes ω', description: 'Try the arm position slider: arms out → large I, slow spin. Arms in → small I, fast spin. The product L = Iω remains constant throughout. Watch the angular momentum value stay fixed.', setup: () => { setViewMode('skater'); setArmPosition(0.2); setInitialOmega(5) } },
        { title: 'Rotational Kinetic Energy', description: 'Rotational KE = ½Iω². Even though L is conserved, KE changes! When the skater pulls arms in, KE increases. The skater does internal work (muscles) to speed up.', setup: () => { setViewMode('skater'); setShowEnergyBars(true); setArmPosition(0.5) } },
        { title: 'Rolling Without Slipping', description: 'When an object rolls without slipping, v_cm = ωR. The contact point has zero velocity. The object has both translational and rotational kinetic energy.', setup: () => { setViewMode('rolling'); rollPosRef.current = 0; rollVelRef.current = 0; timeRef.current = 0; setInclineAngle(25) } },
        { title: 'Energy Partition in Rolling', description: 'For a rolling disk, KE_total = ½mv² + ½Iω². Since I = ½mR² and v = ωR, rotational KE is always ⅓ of the total. The energy bar chart shows this split.', setup: () => { setViewMode('rolling'); setShowEnergyBars(true); setInclineAngle(30); rollPosRef.current = 0; rollVelRef.current = 0; timeRef.current = 0 } },
        { title: 'Satellites and Kepler', description: 'Planets in elliptical orbits conserve angular momentum: L = mvr. At perihelion (closest), v is maximum. At aphelion (farthest), v is minimum. This is Kepler\'s 2nd law — equal areas in equal times.', setup: () => { setViewMode('skater'); setArmPosition(0.5); setInitialOmega(4) } },
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

            if (!paused) timeRef.current += dt

            if (viewMode === 'skater') {
                // --- ICE SKATER MODE ---
                const curI = I_min + armPosition * (I_max - I_min)
                const curOmega = (I_min * initialOmega) / curI
                if (!paused) thetaRef.current += curOmega * dt

                const cx = w * 0.45
                const cy = h * 0.48
                const bodyH = 100
                const headR = 18
                const armExtend = 20 + armPosition * 80

                // Ice surface
                ctx.strokeStyle = 'rgba(160, 200, 255, 0.2)'
                ctx.lineWidth = 1
                ctx.setLineDash([6, 6])
                ctx.beginPath()
                ctx.moveTo(cx - 200, cy + bodyH / 2 + 30)
                ctx.lineTo(cx + 200, cy + bodyH / 2 + 30)
                ctx.stroke()
                ctx.setLineDash([])

                // Skater glow
                const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, armExtend + 60)
                glow.addColorStop(0, `rgba(160, 100, 255, ${0.05 + curOmega * 0.01})`)
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath(); ctx.arc(cx, cy, armExtend + 60, 0, Math.PI * 2); ctx.fill()

                // Rotation indicator circle
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.15)'
                ctx.lineWidth = 1
                ctx.beginPath(); ctx.arc(cx, cy, armExtend + 30, 0, Math.PI * 2); ctx.stroke()

                // Body (torso)
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.9)'
                ctx.lineWidth = 4
                ctx.beginPath()
                ctx.moveTo(cx, cy - bodyH * 0.3)
                ctx.lineTo(cx, cy + bodyH * 0.3)
                ctx.stroke()

                // Head
                ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'
                ctx.beginPath(); ctx.arc(cx, cy - bodyH * 0.3 - headR, headR, 0, Math.PI * 2); ctx.fill()
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.9)'
                ctx.lineWidth = 2
                ctx.beginPath(); ctx.arc(cx, cy - bodyH * 0.3 - headR, headR, 0, Math.PI * 2); ctx.stroke()

                // Arms (rotate with angle)
                const armAngle = thetaRef.current
                ctx.strokeStyle = 'rgba(200, 150, 255, 0.8)'
                ctx.lineWidth = 3
                // Left arm
                ctx.beginPath()
                ctx.moveTo(cx, cy - bodyH * 0.15)
                ctx.lineTo(cx + Math.cos(armAngle) * armExtend, cy - bodyH * 0.15 + Math.sin(armAngle) * armExtend * 0.3)
                ctx.stroke()
                // Right arm
                ctx.beginPath()
                ctx.moveTo(cx, cy - bodyH * 0.15)
                ctx.lineTo(cx - Math.cos(armAngle) * armExtend, cy - bodyH * 0.15 - Math.sin(armAngle) * armExtend * 0.3)
                ctx.stroke()

                // Legs
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.7)'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(cx, cy + bodyH * 0.3)
                ctx.lineTo(cx - 15, cy + bodyH * 0.3 + 40)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(cx, cy + bodyH * 0.3)
                ctx.lineTo(cx + 15, cy + bodyH * 0.3 + 40)
                ctx.stroke()

                // Spin speed indicator — blur lines
                if (curOmega > 2) {
                    const blurAlpha = Math.min(0.4, (curOmega - 2) * 0.05)
                    for (let i = 1; i <= 3; i++) {
                        ctx.strokeStyle = `rgba(160, 100, 255, ${blurAlpha / i})`
                        ctx.lineWidth = 1
                        ctx.beginPath()
                        ctx.arc(cx, cy, armExtend + 10 + i * 8, thetaRef.current + i * 0.5, thetaRef.current + i * 0.5 + 1.5)
                        ctx.stroke()
                    }
                }

                // Angular momentum label
                const curL = curI * curOmega
                ctx.fillStyle = 'rgba(100, 255, 200, 0.9)'
                ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`L = ${curL.toFixed(1)} kg·m²/s`, cx, cy + bodyH / 2 + 60)

                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.font = '11px system-ui'
                ctx.fillText(`I = ${curI.toFixed(1)} kg·m²    ω = ${curOmega.toFixed(2)} rad/s`, cx, cy + bodyH / 2 + 78)

                // Energy bars
                if (showEnergyBars) {
                    const barX = w * 0.75
                    const barW = 50
                    const curKE = 0.5 * curI * curOmega * curOmega
                    const maxKE = 0.5 * I_min * initialOmega * initialOmega * 2
                    const barMaxH = 160

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
                    ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText('Rotational KE', barX + barW / 2, cy - barMaxH / 2 - 15)

                    const keH = Math.min(barMaxH, (curKE / Math.max(maxKE, 1)) * barMaxH)

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
                    ctx.fillRect(barX, cy - barMaxH / 2, barW, barMaxH)

                    const keGrad = ctx.createLinearGradient(0, cy + barMaxH / 2, 0, cy + barMaxH / 2 - keH)
                    keGrad.addColorStop(0, 'rgba(160, 100, 255, 0.8)')
                    keGrad.addColorStop(1, 'rgba(100, 200, 255, 0.8)')
                    ctx.fillStyle = keGrad
                    ctx.fillRect(barX, cy + barMaxH / 2 - keH, barW, keH)

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
                    ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText(`${curKE.toFixed(0)} J`, barX + barW / 2, cy + barMaxH / 2 + 18)
                }
            } else {
                // --- ROLLING MODE ---
                if (!paused) {
                    rollVelRef.current += rollingAccel * dt
                    rollPosRef.current += rollVelRef.current * dt
                    thetaRef.current += (rollVelRef.current / rollingR) * dt
                }

                const incRad = (inclineAngle * Math.PI) / 180
                const inclineLen = Math.min(w * 0.7, h * 0.8)
                const startX = w * 0.15
                const startY = h * 0.2
                const endX = startX + inclineLen * Math.cos(incRad)
                const endY = startY + inclineLen * Math.sin(incRad)

                // Incline surface
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(startX, startY)
                ctx.lineTo(endX, endY)
                ctx.stroke()

                // Ground
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(endX, endY)
                ctx.lineTo(endX + 100, endY)
                ctx.stroke()

                // Vertical
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
                ctx.setLineDash([4, 4])
                ctx.beginPath()
                ctx.moveTo(startX, startY)
                ctx.lineTo(startX, endY)
                ctx.stroke()
                ctx.setLineDash([])

                // Angle arc
                ctx.strokeStyle = 'rgba(255, 180, 80, 0.5)'
                ctx.lineWidth = 1.5
                ctx.beginPath()
                ctx.arc(endX, endY, 40, -Math.PI, -Math.PI + incRad)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 180, 80, 0.7)'
                ctx.font = '12px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`${inclineAngle}°`, endX - 55, endY - 10)

                // Rolling object position along incline
                const maxDist = inclineLen * 0.85
                const dist = Math.min(rollPosRef.current * 80, maxDist)
                const diskR = 25
                const diskX = startX + dist * Math.cos(incRad) + diskR * Math.sin(incRad)
                const diskY = startY + dist * Math.sin(incRad) - diskR * Math.cos(incRad)

                // Disk glow
                const diskGlow = ctx.createRadialGradient(diskX, diskY, diskR * 0.3, diskX, diskY, diskR * 1.5)
                diskGlow.addColorStop(0, 'rgba(160, 100, 255, 0.15)')
                diskGlow.addColorStop(1, 'transparent')
                ctx.fillStyle = diskGlow
                ctx.beginPath(); ctx.arc(diskX, diskY, diskR * 1.5, 0, Math.PI * 2); ctx.fill()

                // Disk body
                const dGrad = ctx.createRadialGradient(diskX, diskY, 0, diskX, diskY, diskR)
                dGrad.addColorStop(0, 'rgba(160, 100, 255, 0.4)')
                dGrad.addColorStop(1, 'rgba(160, 100, 255, 0.15)')
                ctx.fillStyle = dGrad
                ctx.beginPath(); ctx.arc(diskX, diskY, diskR, 0, Math.PI * 2); ctx.fill()

                ctx.strokeStyle = 'rgba(160, 100, 255, 0.8)'
                ctx.lineWidth = 2.5
                ctx.beginPath(); ctx.arc(diskX, diskY, diskR, 0, Math.PI * 2); ctx.stroke()

                // Spokes
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.lineWidth = 1.5
                for (let i = 0; i < 6; i++) {
                    const a = thetaRef.current + (i * Math.PI * 2) / 6
                    ctx.beginPath()
                    ctx.moveTo(diskX, diskY)
                    ctx.lineTo(diskX + Math.cos(a) * diskR, diskY + Math.sin(a) * diskR)
                    ctx.stroke()
                }

                // Center
                ctx.fillStyle = 'rgba(160, 100, 255, 0.9)'
                ctx.beginPath(); ctx.arc(diskX, diskY, 4, 0, Math.PI * 2); ctx.fill()

                // Velocity arrow
                if (rollVelRef.current > 0.1) {
                    const vArrowLen = Math.min(60, rollVelRef.current * 10)
                    ctx.strokeStyle = 'rgba(100, 255, 200, 0.7)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.moveTo(diskX, diskY)
                    ctx.lineTo(diskX + Math.cos(incRad) * vArrowLen, diskY + Math.sin(incRad) * vArrowLen)
                    ctx.stroke()
                    ctx.fillStyle = 'rgba(100, 255, 200, 0.6)'
                    ctx.font = '10px system-ui'; ctx.textAlign = 'left'
                    ctx.fillText(`v = ${rollVelRef.current.toFixed(2)} m/s`, diskX + Math.cos(incRad) * vArrowLen + 8, diskY + Math.sin(incRad) * vArrowLen)
                }

                // v = ωR label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
                ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`v_cm = ωR = ${rollVelRef.current.toFixed(2)} m/s`, diskX, diskY - diskR - 20)
                ctx.fillText(`ω = ${(rollVelRef.current / rollingR).toFixed(1)} rad/s`, diskX, diskY - diskR - 6)

                // Energy bars
                if (showEnergyBars) {
                    const barX = w * 0.7
                    const barW = 60
                    const barMaxH = 200
                    const barY = h * 0.3

                    const curKEt = 0.5 * mass * rollVelRef.current * rollVelRef.current
                    const curKEr = 0.5 * I_rolling * (rollVelRef.current / rollingR) * (rollVelRef.current / rollingR)
                    const curTotal = curKEt + curKEr
                    const maxE = Math.max(curTotal, 100)

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
                    ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText('Energy Partition', barX + barW / 2, barY - 15)

                    // Background
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
                    ctx.fillRect(barX, barY, barW, barMaxH)

                    const hTrans = (curKEt / maxE) * barMaxH
                    const hRot = (curKEr / maxE) * barMaxH

                    // Translational KE
                    const transGrad = ctx.createLinearGradient(0, barY + barMaxH, 0, barY + barMaxH - hTrans)
                    transGrad.addColorStop(0, 'rgba(100, 200, 255, 0.8)')
                    transGrad.addColorStop(1, 'rgba(100, 200, 255, 0.4)')
                    ctx.fillStyle = transGrad
                    ctx.fillRect(barX, barY + barMaxH - hTrans, barW, hTrans)

                    // Rotational KE on top
                    const rotGrad = ctx.createLinearGradient(0, barY + barMaxH - hTrans, 0, barY + barMaxH - hTrans - hRot)
                    rotGrad.addColorStop(0, 'rgba(160, 100, 255, 0.8)')
                    rotGrad.addColorStop(1, 'rgba(160, 100, 255, 0.4)')
                    ctx.fillStyle = rotGrad
                    ctx.fillRect(barX, barY + barMaxH - hTrans - hRot, barW, hRot)

                    // Border
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
                    ctx.lineWidth = 1
                    ctx.strokeRect(barX, barY, barW, barMaxH)

                    // Labels
                    ctx.font = '10px system-ui'; ctx.textAlign = 'left'
                    const legendX = barX + barW + 12
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.9)'
                    ctx.fillText(`½mv² = ${curKEt.toFixed(0)} J`, legendX, barY + barMaxH - hTrans / 2 + 4)
                    ctx.fillStyle = 'rgba(160, 100, 255, 0.9)'
                    ctx.fillText(`½Iω² = ${curKEr.toFixed(0)} J`, legendX, barY + barMaxH - hTrans - hRot / 2 + 4)

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
                    ctx.font = '11px system-ui'
                    ctx.fillText(`Total = ${curTotal.toFixed(0)} J`, legendX, barY + barMaxH + 18)

                    if (curTotal > 1) {
                        const pctRot = ((curKEr / curTotal) * 100).toFixed(0)
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
                        ctx.font = '10px system-ui'
                        ctx.fillText(`Rotational: ${pctRot}% (disk: always 33%)`, legendX, barY + barMaxH + 34)
                    }
                }

                // Reset rolling if off screen
                if (dist >= maxDist) {
                    rollPosRef.current = 0
                    rollVelRef.current = 0
                }
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [viewMode, armPosition, initialOmega, mass, skaterRadius, inclineAngle, showEnergyBars, paused, I_min, I_max, rollingAccel, rollingR, I_rolling])

    const curI_skater = I_min + armPosition * (I_max - I_min)
    const curOmega_skater = L / curI_skater
    const KE_skater = 0.5 * curI_skater * curOmega_skater * curOmega_skater

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 1" unit="Unit 6" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title={viewMode === 'skater' ? 'Ice Skater' : 'Rolling Object'}
                            departmentColor="rgb(160, 100, 255)"
                            items={viewMode === 'skater' ? [
                                { label: 'L', value: L.toFixed(1), unit: 'kg·m²/s', color: 'rgb(100, 255, 200)' },
                                { label: 'I', value: curI_skater.toFixed(2), unit: 'kg·m²' },
                                { label: 'ω', value: curOmega_skater.toFixed(2), unit: 'rad/s', color: 'rgb(100, 255, 200)' },
                                { label: 'KE_rot', value: KE_skater.toFixed(0), unit: 'J', color: 'rgb(160, 100, 255)' },
                            ] : [
                                { label: 'v_cm', value: rollV.toFixed(2), unit: 'm/s', color: 'rgb(100, 255, 200)' },
                                { label: 'ω', value: rollOmega.toFixed(1), unit: 'rad/s' },
                                { label: 'KE_trans', value: KE_trans.toFixed(0), unit: 'J', color: 'rgb(100, 200, 255)' },
                                { label: 'KE_rot', value: KE_rot.toFixed(0), unit: 'J', color: 'rgb(160, 100, 255)' },
                                { label: 'KE_total', value: KE_total.toFixed(0), unit: 'J' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-[340px] max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={viewMode === 'skater' ? [
                                { label: 'Angular momentum', expression: 'L = Iω' },
                                { label: 'Conservation', expression: 'L₁ = L₂  →  I₁ω₁ = I₂ω₂' },
                                { label: 'Rotational KE', expression: 'KE_rot = ½Iω²' },
                            ] : [
                                { label: 'Rolling constraint', expression: 'v_cm = ωR' },
                                { label: 'Total KE', expression: 'KE = ½mv² + ½Iω²' },
                                { label: 'Disk rolling', expression: 'a = g sin θ / (1 + I/mR²)' },
                                { label: 'Angular momentum', expression: 'L = Iω' },
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
                                value={viewMode}
                                onChange={(v) => { setViewMode(v); timeRef.current = 0; thetaRef.current = 0; rollPosRef.current = 0; rollVelRef.current = 0 }}
                                options={[
                                    { value: 'skater', label: 'Ice Skater' },
                                    { value: 'rolling', label: 'Rolling' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        {viewMode === 'skater' ? (
                            <>
                                <ControlGroup label="Arm Position">
                                    <Slider value={armPosition} onChange={setArmPosition} min={0} max={1} step={0.01} label={armPosition < 0.3 ? 'Arms In (small I)' : armPosition > 0.7 ? 'Arms Out (large I)' : 'Intermediate'} />
                                </ControlGroup>

                                <ControlGroup label="Initial Angular Velocity">
                                    <Slider value={initialOmega} onChange={setInitialOmega} min={1} max={15} step={0.5} label={`ω₀ = ${initialOmega.toFixed(1)} rad/s`} />
                                </ControlGroup>

                                <ControlGroup label="Skater Radius">
                                    <Slider value={skaterRadius} onChange={setSkaterRadius} min={0.2} max={0.8} step={0.05} label={`R = ${skaterRadius.toFixed(2)} m`} />
                                </ControlGroup>
                            </>
                        ) : (
                            <>
                                <ControlGroup label="Incline Angle">
                                    <Slider value={inclineAngle} onChange={setInclineAngle} min={5} max={60} step={1} label={`θ = ${inclineAngle}°`} />
                                </ControlGroup>
                            </>
                        )}

                        <ControlGroup label="Mass">
                            <Slider value={mass} onChange={setMass} min={10} max={100} step={5} label={`M = ${mass} kg`} />
                        </ControlGroup>

                        <Toggle value={showEnergyBars} onChange={setShowEnergyBars} label="Show Energy Bars" />
                        <Toggle value={paused} onChange={setPaused} label="Pause Animation" />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={() => { timeRef.current = 0; thetaRef.current = 0; rollPosRef.current = 0; rollVelRef.current = 0 }} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
