import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'

const H = 6.626e-34
const ME = 9.109e-31
const C = 3e8
const COMPTON_WL = H / (ME * C) // 2.426e-12 m = 2.426 pm

export default function ComptonScattering() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [incidentWL, setIncidentWL] = useState(0.05) // nm (X-ray range)
    const [scatterAngle, setScatterAngle] = useState(90) // degrees
    const [showMomentum, setShowMomentum] = useState(true)
    const [showEnergyDiagram, setShowEnergyDiagram] = useState(false)
    const [paused, setPaused] = useState(false)
    const [playing, setPlaying] = useState(true)
    const timeRef = useRef(0)
    const phaseRef = useRef<'incoming' | 'collision' | 'scattered'>('incoming')
    const animProgressRef = useRef(0)

    // --- Drag state for mouse interaction ---
    const [canvasCursor, setCanvasCursor] = useState('default')
    const draggingRef = useRef<'angle' | null>(null)
    // Store layout geometry for mouse handlers
    const layoutRef = useRef({
        cx: 0, cy: 0,
        angleHandleX: 0, angleHandleY: 0,
        arcRadius: 50,
    })

    const calcPhysics = useCallback(() => {
        const lambdaI = incidentWL * 1e-9 // incident wavelength in meters
        const thetaRad = scatterAngle * Math.PI / 180
        const deltaLambda = COMPTON_WL * (1 - Math.cos(thetaRad)) // meters
        const lambdaF = lambdaI + deltaLambda // scattered wavelength

        const energyI = (H * C) / lambdaI // Joules
        const energyF = (H * C) / lambdaF
        const energyIeV = energyI / 1.602e-19 // eV
        const energyFeV = energyF / 1.602e-19
        const electronKE = energyIeV - energyFeV // eV

        const pPhotonI = H / lambdaI // kg m/s
        const pPhotonF = H / lambdaF

        // Electron recoil angle from conservation of momentum
        // tan(phi) = sin(theta) / (lambdaI/lambdaF - cos(theta))
        const numerator = Math.sin(thetaRad)
        const denominator = (lambdaI / lambdaF) - Math.cos(thetaRad)
        const electronAngle = Math.atan2(numerator, denominator) * 180 / Math.PI

        const pElectron = Math.sqrt(
            pPhotonI * pPhotonI + pPhotonF * pPhotonF - 2 * pPhotonI * pPhotonF * Math.cos(thetaRad)
        )

        return {
            lambdaI, lambdaF,
            lambdaINm: incidentWL,
            lambdaFNm: lambdaF * 1e9,
            deltaLambdaPm: deltaLambda * 1e12,
            energyIeV, energyFeV, electronKE,
            pPhotonI, pPhotonF, pElectron,
            electronAngle,
            thetaRad,
        }
    }, [incidentWL, scatterAngle])

    const resetAnim = useCallback(() => {
        phaseRef.current = 'incoming'
        animProgressRef.current = 0
        timeRef.current = 0
    }, [])

    const reset = useCallback(() => {
        setIncidentWL(0.05)
        setScatterAngle(90)
        setShowMomentum(true)
        setShowEnergyDiagram(false)
        setPaused(false)
        setPlaying(true)
        resetAnim()
    }, [resetAnim])

    // --- Mouse event handlers for canvas dragging ---
    const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasPos(e)
        const layout = layoutRef.current

        // Hit-test angle handle (small circle at end of angle arc)
        const dx = pos.x - layout.angleHandleX
        const dy = pos.y - layout.angleHandleY
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
            draggingRef.current = 'angle'
            setCanvasCursor('grabbing')
            return
        }

        // Also allow clicking near the angle arc itself
        const dxC = pos.x - layout.cx
        const dyC = pos.y - layout.cy
        const distFromCenter = Math.sqrt(dxC * dxC + dyC * dyC)
        if (distFromCenter > 30 && distFromCenter < layout.arcRadius + 25) {
            // Check if we're in the upper half (where the angle arc is)
            const mouseAngle = Math.atan2(-(pos.y - layout.cy), pos.x - layout.cx)
            if (mouseAngle > -0.1 && mouseAngle < Math.PI + 0.1) {
                draggingRef.current = 'angle'
                setCanvasCursor('grabbing')
                // Immediately compute angle from mouse position
                const angleDeg = Math.max(0, Math.min(180, mouseAngle * 180 / Math.PI))
                const snapped = Math.round(angleDeg / 5) * 5
                setScatterAngle(snapped)
                resetAnim()
                return
            }
        }
    }, [getCanvasPos, resetAnim])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasPos(e)
        const layout = layoutRef.current

        if (draggingRef.current === 'angle') {
            // Compute angle from collision point to mouse
            const dx = pos.x - layout.cx
            const dy = -(pos.y - layout.cy) // invert Y for standard math coords
            const angleRad = Math.atan2(dy, dx)
            let angleDeg = angleRad * 180 / Math.PI
            angleDeg = Math.max(0, Math.min(180, angleDeg))
            const snapped = Math.round(angleDeg / 5) * 5
            setScatterAngle(snapped)
            resetAnim()
            return
        }

        // Hover cursor logic
        const dx = pos.x - layout.angleHandleX
        const dy = pos.y - layout.angleHandleY
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
            setCanvasCursor('grab')
            return
        }

        // Near the arc
        const dxC = pos.x - layout.cx
        const dyC = pos.y - layout.cy
        const distFromCenter = Math.sqrt(dxC * dxC + dyC * dyC)
        if (distFromCenter > 30 && distFromCenter < layout.arcRadius + 25) {
            const mouseAngle = Math.atan2(-(pos.y - layout.cy), pos.x - layout.cx)
            if (mouseAngle > -0.1 && mouseAngle < Math.PI + 0.1) {
                setCanvasCursor('grab')
                return
            }
        }

        setCanvasCursor('default')
    }, [getCanvasPos, resetAnim])

    const handleMouseUp = useCallback(() => {
        draggingRef.current = null
        setCanvasCursor('default')
    }, [])

    const handleMouseLeave = useCallback(() => {
        draggingRef.current = null
        setCanvasCursor('default')
    }, [])

    const demoSteps = [
        { title: 'Compton Scattering', description: 'When a high-energy photon (X-ray) collides with a stationary electron, it scatters at an angle with a longer wavelength. This proved photons carry momentum like particles.', setup: () => { reset(); setScatterAngle(90) } },
        { title: 'Photon as Particle with Momentum', description: 'A photon carries momentum p = h/lambda despite having no mass. When it collides with an electron, both momentum and energy are conserved, just like billiard balls.', setup: () => { setShowMomentum(true); setScatterAngle(60) } },
        { title: 'Wavelength Shift Formula', description: 'The scattered photon wavelength increases by delta_lambda = (h/m_e*c)(1 - cos theta). The quantity h/m_e*c = 2.43 pm is called the Compton wavelength of the electron.', setup: () => { setScatterAngle(90); setShowMomentum(true) } },
        { title: 'Angle Dependence', description: 'The wavelength shift depends ONLY on the scattering angle, not on the incident wavelength. At theta = 0 (forward), there is no shift. The shift increases with angle.', setup: () => { setScatterAngle(45); resetAnim() } },
        { title: 'Maximum Shift at 180 degrees', description: 'At theta = 180 degrees (backscatter), the shift is maximum: delta_lambda = 2h/m_e*c = 4.86 pm. The photon bounces straight back with the greatest energy loss.', setup: () => { setScatterAngle(180); resetAnim() } },
        { title: 'Conservation of Energy and Momentum', description: 'The scattered photon loses energy to the electron. E_photon_in = E_photon_out + KE_electron. The momentum vector diagram closes, confirming conservation.', setup: () => { setScatterAngle(90); setShowMomentum(true); setShowEnergyDiagram(true); resetAnim() } },
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
        const ANIM_SPEED = 1.2

        const drawWavePacket = (
            x: number, y: number, angle: number,
            wavelengthScale: number, color: string, alpha: number, length: number
        ) => {
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(angle)
            ctx.strokeStyle = color
            ctx.lineWidth = 2
            ctx.globalAlpha = alpha
            ctx.beginPath()
            for (let i = 0; i < length; i++) {
                const envelope = Math.exp(-((i - length / 2) ** 2) / (length * length * 0.08))
                const yy = Math.sin(i * 0.3 / wavelengthScale) * 10 * envelope
                if (i === 0) ctx.moveTo(-i, yy); else ctx.lineTo(-i, yy)
            }
            ctx.stroke()
            ctx.globalAlpha = 1
            ctx.restore()
        }

        const drawArrow = (
            fromX: number, fromY: number, toX: number, toY: number,
            color: string, label: string, lineWidth: number = 2
        ) => {
            const dx = toX - fromX
            const dy = toY - fromY
            const len = Math.sqrt(dx * dx + dy * dy)
            if (len < 5) return
            const angle = Math.atan2(dy, dx)

            ctx.strokeStyle = color
            ctx.lineWidth = lineWidth
            ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke()

            // Arrowhead
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.moveTo(toX, toY)
            ctx.lineTo(toX - 10 * Math.cos(angle - 0.3), toY - 10 * Math.sin(angle - 0.3))
            ctx.lineTo(toX - 10 * Math.cos(angle + 0.3), toY - 10 * Math.sin(angle + 0.3))
            ctx.closePath(); ctx.fill()

            // Label
            ctx.fillStyle = color
            ctx.font = '10px system-ui'; ctx.textAlign = 'center'
            const labelX = (fromX + toX) / 2 - 15 * Math.sin(angle)
            const labelY = (fromY + toY) / 2 + 15 * Math.cos(angle)
            ctx.fillText(label, labelX, labelY)
        }

        const draw = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const phys = calcPhysics()
            const cx = w * 0.4
            const cy = h * 0.45

            // Animation control
            if (!paused && playing) {
                animProgressRef.current += 0.016 * ANIM_SPEED
            }
            const progress = animProgressRef.current

            // Determine phase
            if (progress < 1.5) phaseRef.current = 'incoming'
            else if (progress < 2.0) phaseRef.current = 'collision'
            else phaseRef.current = 'scattered'

            const phase = phaseRef.current

            // Reset loop
            if (progress > 4.5) {
                animProgressRef.current = 0
                phaseRef.current = 'incoming'
            }

            // Draw stationary electron (before collision)
            if (phase === 'incoming' || phase === 'collision') {
                const electronGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20)
                electronGlow.addColorStop(0, 'rgba(100, 180, 255, 0.5)')
                electronGlow.addColorStop(1, 'transparent')
                ctx.fillStyle = electronGlow
                ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill()

                ctx.fillStyle = 'rgba(100, 180, 255, 0.9)'
                ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('e\u207B', cx, cy + 4)

                // Label
                ctx.fillStyle = 'rgba(100, 180, 255, 0.5)'
                ctx.font = '10px system-ui'
                ctx.fillText('electron (at rest)', cx, cy + 30)
            }

            // Incoming photon wave packet
            if (phase === 'incoming') {
                const t = Math.min(progress / 1.5, 1)
                const photonX = cx - 250 + t * 250
                const incidentColor = 'rgba(160, 100, 255, 0.9)'
                drawWavePacket(photonX, cy, 0, 1, incidentColor, 0.9, 60)

                // Photon dot
                ctx.fillStyle = 'rgba(160, 100, 255, 1)'
                ctx.beginPath(); ctx.arc(photonX, cy, 4, 0, Math.PI * 2); ctx.fill()

                // Label
                ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`lambda = ${phys.lambdaINm.toFixed(3)} nm`, photonX - 30, cy - 25)
            }

            // Collision flash
            if (phase === 'collision') {
                const flashT = (progress - 1.5) / 0.5
                const flashAlpha = Math.max(0, 1 - flashT * 2)
                const flashR = 10 + flashT * 40
                const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR)
                flash.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`)
                flash.addColorStop(0.5, `rgba(160, 100, 255, ${flashAlpha * 0.5})`)
                flash.addColorStop(1, 'transparent')
                ctx.fillStyle = flash
                ctx.beginPath(); ctx.arc(cx, cy, flashR, 0, Math.PI * 2); ctx.fill()
            }

            // Scattered particles
            if (phase === 'scattered') {
                const t = Math.min((progress - 2.0) / 2.0, 1)

                // Scattered photon
                const scatterAngleRad = phys.thetaRad
                const photonDist = t * 220
                const photonX = cx + photonDist * Math.cos(scatterAngleRad)
                const photonY = cy - photonDist * Math.sin(scatterAngleRad) // negative because canvas y is inverted

                // Wavelength scale for visual: longer wavelength = stretched wave
                const wlScale = phys.lambdaFNm / phys.lambdaINm
                const scatteredColor = 'rgba(255, 120, 80, 0.9)' // redshifted
                drawWavePacket(photonX, photonY, -scatterAngleRad, wlScale, scatteredColor, 0.9, 50)

                ctx.fillStyle = 'rgba(255, 120, 80, 1)'
                ctx.beginPath(); ctx.arc(photonX, photonY, 4, 0, Math.PI * 2); ctx.fill()

                // Scattered photon label
                ctx.fillStyle = 'rgba(255, 120, 80, 0.7)'
                ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`lambda' = ${phys.lambdaFNm.toFixed(3)} nm`, photonX + 20, photonY - 20)

                // Recoiling electron
                const electronAngleRad = phys.electronAngle * Math.PI / 180
                const eDist = t * 150 * Math.min(1, phys.electronKE / phys.energyIeV * 3)
                const eX = cx + eDist * Math.cos(electronAngleRad)
                const eY = cy + eDist * Math.sin(electronAngleRad) // electron goes down (positive angle in canvas coords)

                const electronGlow = ctx.createRadialGradient(eX, eY, 0, eX, eY, 15)
                electronGlow.addColorStop(0, 'rgba(100, 180, 255, 0.5)')
                electronGlow.addColorStop(1, 'transparent')
                ctx.fillStyle = electronGlow
                ctx.beginPath(); ctx.arc(eX, eY, 15, 0, Math.PI * 2); ctx.fill()

                ctx.fillStyle = 'rgba(100, 180, 255, 0.9)'
                ctx.beginPath(); ctx.arc(eX, eY, 8, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('e\u207B', eX, eY + 3)

                ctx.fillStyle = 'rgba(100, 180, 255, 0.6)'
                ctx.font = '10px system-ui'
                ctx.fillText(`KE = ${phys.electronKE.toFixed(0)} eV`, eX + 20, eY + 25)

                // Angle arc for scattered photon
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.5)'
                ctx.lineWidth = 1.5
                ctx.beginPath()
                ctx.arc(cx, cy, 50, 0, -scatterAngleRad, true)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 220, 100, 0.7)'
                ctx.font = '11px system-ui'; ctx.textAlign = 'left'
                const labelAngleRad = scatterAngleRad / 2
                ctx.fillText(`theta = ${scatterAngle}\u00B0`, cx + 55 * Math.cos(labelAngleRad), cy - 55 * Math.sin(labelAngleRad))

                // Momentum vectors
                if (showMomentum && t > 0.3) {
                    const mvAlpha = Math.min(1, (t - 0.3) / 0.3)
                    ctx.globalAlpha = mvAlpha

                    // Momentum diagram origin
                    const mox = w * 0.12
                    const moy = h * 0.85
                    const mScale = 800 // scale for visibility

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
                    ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText('Momentum Vectors', mox + 50, moy - 120)

                    // p_initial (incident photon momentum, pointing right)
                    const piLen = phys.pPhotonI * mScale * 1e24
                    drawArrow(mox, moy, mox + piLen, moy, 'rgba(160, 100, 255, 0.8)', 'p_i', 2)

                    // p_photon_final
                    const pfLen = phys.pPhotonF * mScale * 1e24
                    const pfX = mox + pfLen * Math.cos(-scatterAngleRad)
                    const pfY = moy + pfLen * Math.sin(-scatterAngleRad)
                    drawArrow(mox, moy, pfX, pfY, 'rgba(255, 120, 80, 0.8)', "p'_photon", 2)

                    // p_electron (completes the triangle: p_i = p'_photon + p_electron)
                    const peEndX = mox + piLen
                    const peEndY = moy
                    drawArrow(pfX, pfY, peEndX, peEndY, 'rgba(100, 180, 255, 0.8)', 'p_e', 2)

                    ctx.globalAlpha = 1
                }
            }

            // Energy diagram (bar chart)
            if (showEnergyDiagram) {
                const phys = calcPhysics()
                const dx = w * 0.7
                const dy = h - 30
                const dw = 180
                const dh = 140

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.fillRect(dx - 10, dy - dh - 20, dw + 20, dh + 35)

                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('Energy Conservation', dx + dw / 2, dy - dh - 8)

                const maxE = phys.energyIeV
                const barH = dh - 20
                const barW = 35

                // Incident photon energy bar
                const h1 = (phys.energyIeV / maxE) * barH
                ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                ctx.fillRect(dx, dy - h1, barW, h1)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
                ctx.font = '9px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('E_in', dx + barW / 2, dy + 12)
                ctx.fillText(`${(phys.energyIeV / 1000).toFixed(1)}keV`, dx + barW / 2, dy - h1 - 5)

                // Scattered photon energy bar
                const h2 = (phys.energyFeV / maxE) * barH
                ctx.fillStyle = 'rgba(255, 120, 80, 0.7)'
                ctx.fillRect(dx + 50, dy - h2, barW, h2)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
                ctx.fillText("E'_ph", dx + 50 + barW / 2, dy + 12)
                ctx.fillText(`${(phys.energyFeV / 1000).toFixed(1)}keV`, dx + 50 + barW / 2, dy - h2 - 5)

                // Electron KE bar
                const h3 = (phys.electronKE / maxE) * barH
                ctx.fillStyle = 'rgba(100, 180, 255, 0.7)'
                ctx.fillRect(dx + 100, dy - h3, barW, h3)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
                ctx.fillText('KE_e', dx + 100 + barW / 2, dy + 12)
                ctx.fillText(`${(phys.electronKE / 1000).toFixed(1)}keV`, dx + 100 + barW / 2, dy - h3 - 5)

                // Equals sign
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('=', dx + 42, dy - barH / 2)
                ctx.fillText('+', dx + 92, dy - barH / 2)
            }

            // Compton wavelength reference
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.font = '10px system-ui'; ctx.textAlign = 'left'
            ctx.fillText(`Compton wavelength: h/m_e c = ${(COMPTON_WL * 1e12).toFixed(2)} pm`, 10, h - 10)

            // Delta-lambda indicator
            const phys2 = calcPhysics()
            ctx.fillStyle = 'rgba(255, 220, 100, 0.6)'
            ctx.font = '12px system-ui'; ctx.textAlign = 'right'
            ctx.fillText(`delta_lambda = ${phys2.deltaLambdaPm.toFixed(3)} pm`, w - 20, h - 10)

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [incidentWL, scatterAngle, showMomentum, showEnergyDiagram, paused, playing, calcPhysics])

    const phys = calcPhysics()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas
                        ref={canvasRef}
                        className={`w-full h-full block ${canvasCursor === 'grabbing' ? 'cursor-grabbing' : canvasCursor === 'grab' ? 'cursor-grab' : ''}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 15" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Compton Scattering"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'Incident lambda', value: phys.lambdaINm.toFixed(3), unit: 'nm', color: 'rgb(160, 100, 255)' },
                                { label: 'Scattered lambda', value: phys.lambdaFNm.toFixed(3), unit: 'nm', color: 'rgb(255, 120, 80)' },
                                { label: 'delta lambda', value: phys.deltaLambdaPm.toFixed(3), unit: 'pm', color: 'rgb(255, 220, 100)' },
                                { label: 'Scatter angle', value: `${scatterAngle}`, unit: 'deg' },
                                { label: 'Electron KE', value: (phys.electronKE / 1000).toFixed(2), unit: 'keV', color: 'rgb(100, 180, 255)' },
                                { label: 'Photon E (in)', value: (phys.energyIeV / 1000).toFixed(2), unit: 'keV' },
                                { label: 'Photon E (out)', value: (phys.energyFeV / 1000).toFixed(2), unit: 'keV' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-[340px] max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Compton shift', expression: 'delta_lambda = (h/m_e c)(1 - cos theta)', description: 'Wavelength increases after scattering' },
                                { label: 'Compton wl', expression: 'h / m_e c = 2.43 pm', description: 'Electron Compton wavelength' },
                                { label: 'Photon energy', expression: 'E = hc / lambda' },
                                { label: 'Conservation', expression: 'E_i = E_f + KE_e', description: 'Energy is conserved' },
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
                        <ControlGroup label="Incident Wavelength">
                            <Slider value={incidentWL * 1000} onChange={v => setIncidentWL(v / 1000)} min={10} max={100} step={1} label={`lambda = ${(incidentWL * 1000).toFixed(0)} pm (${incidentWL.toFixed(3)} nm)`} />
                        </ControlGroup>

                        <ControlGroup label="Scattering Angle">
                            <Slider value={scatterAngle} onChange={v => { setScatterAngle(v); resetAnim() }} min={0} max={180} step={5} label={`theta = ${scatterAngle} deg`} />
                        </ControlGroup>

                        <Toggle value={showMomentum} onChange={setShowMomentum} label="Momentum Vectors" />
                        <Toggle value={showEnergyDiagram} onChange={setShowEnergyDiagram} label="Energy Diagram" />
                        <Toggle value={playing} onChange={v => { setPlaying(v); if (v) resetAnim() }} label="Play Animation" />
                        <Toggle value={paused} onChange={setPaused} label="Pause" />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={() => { resetAnim() }} variant="secondary">Replay</Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
