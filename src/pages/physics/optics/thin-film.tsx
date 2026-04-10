import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'

function wavelengthToRGB(nm: number): [number, number, number] {
    let r = 0, g = 0, b = 0
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1 }
    else if (nm >= 440 && nm < 490) { g = (nm - 440) / 50; b = 1 }
    else if (nm >= 490 && nm < 510) { g = 1; b = -(nm - 510) / 20 }
    else if (nm >= 510 && nm < 580) { r = (nm - 510) / 70; g = 1 }
    else if (nm >= 580 && nm < 645) { r = 1; g = -(nm - 645) / 65 }
    else if (nm >= 645 && nm <= 780) { r = 1 }
    // Intensity falloff at edges
    let factor = 1
    if (nm >= 380 && nm < 420) factor = 0.3 + 0.7 * (nm - 380) / 40
    else if (nm > 700 && nm <= 780) factor = 0.3 + 0.7 * (780 - nm) / 80
    else if (nm < 380 || nm > 780) factor = 0
    return [r * factor * 255, g * factor * 255, b * factor * 255]
}

export default function ThinFilm() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [filmThickness, setFilmThickness] = useState(300)
    const [nFilm, setNFilm] = useState(1.33)
    const [nSubstrate, setNSubstrate] = useState(1.5)
    const [incidentWavelength, setIncidentWavelength] = useState(550)
    const [angleIncidence, setAngleIncidence] = useState(0)
    const [showRainbow, setShowRainbow] = useState(false)
    const [showLabels, setShowLabels] = useState(true)
    const [showPhaseArrows, setShowPhaseArrows] = useState(true)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)

    const nAir = 1.0

    const calcInterference = useCallback((lambda: number) => {
        const thetaI = (angleIncidence * Math.PI) / 180
        const sinThetaFilm = (nAir * Math.sin(thetaI)) / nFilm
        const cosThetaFilm = Math.sqrt(1 - sinThetaFilm * sinThetaFilm)

        const pathDiff = 2 * nFilm * filmThickness * cosThetaFilm

        // Phase shifts at boundaries
        // n_air -> n_film: if n_film > n_air, phase shift of pi (half wavelength)
        const shift1 = nFilm > nAir ? 0.5 : 0
        // n_film -> n_substrate: if n_substrate > n_film, phase shift of pi
        const shift2 = nSubstrate > nFilm ? 0.5 : 0
        const totalPhaseShifts = shift1 + shift2 // in units of lambda

        // Effective path difference including phase shifts (in nm)
        const effectiveOPD = pathDiff + totalPhaseShifts * lambda

        // Constructive: effective OPD = m * lambda
        // Check how close we are to constructive
        const mNearest = Math.round(effectiveOPD / lambda)
        const remainder = (effectiveOPD / lambda) - mNearest
        // Intensity factor: cos^2(pi * remainder) gives max at integers
        const intensity = Math.cos(Math.PI * remainder) ** 2

        // Find constructive wavelengths
        const constructiveOrders: number[] = []
        const destructiveOrders: number[] = []
        for (let m = 1; m <= 10; m++) {
            // Constructive when total phase shift is integer
            if (Math.abs(totalPhaseShifts - Math.round(totalPhaseShifts)) < 0.01) {
                // 0 or 2 phase shifts: 2nt = m*lambda
                const cLambda = pathDiff / m
                if (cLambda >= 380 && cLambda <= 780) constructiveOrders.push(cLambda)
                const dLambda = pathDiff / (m - 0.5)
                if (dLambda >= 380 && dLambda <= 780) destructiveOrders.push(dLambda)
            } else {
                // 1 phase shift: 2nt = (m-0.5)*lambda for constructive
                const cLambda = pathDiff / (m - 0.5)
                if (cLambda >= 380 && cLambda <= 780) constructiveOrders.push(cLambda)
                const dLambda = pathDiff / m
                if (dLambda >= 380 && dLambda <= 780) destructiveOrders.push(dLambda)
            }
        }

        return { pathDiff, shift1, shift2, totalPhaseShifts, intensity, constructiveOrders, destructiveOrders, cosThetaFilm }
    }, [filmThickness, nFilm, nSubstrate, angleIncidence, nAir])

    const reset = useCallback(() => {
        setFilmThickness(300)
        setNFilm(1.33)
        setNSubstrate(1.5)
        setIncidentWavelength(550)
        setAngleIncidence(0)
        setShowRainbow(false)
        setShowLabels(true)
        setShowPhaseArrows(true)
        setPaused(false)
        timeRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'Thin Film Interference', description: 'When light hits a thin film, it partially reflects from the top and bottom surfaces. These two reflected beams can interfere constructively or destructively, producing colors.', setup: () => { reset() } },
        { title: 'Path Difference = 2nt', description: 'The beam reflecting from the bottom surface travels an extra distance of 2nt through the film (at normal incidence). This path difference determines the phase relationship between the two reflected beams.', setup: () => { setAngleIncidence(0); setFilmThickness(300); setShowLabels(true) } },
        { title: 'Phase Shifts at Boundaries', description: 'When light reflects from a boundary going from lower to higher refractive index (n_low to n_high), it undergoes a pi phase shift (half wavelength). This is crucial for determining interference conditions.', setup: () => { setNFilm(1.33); setNSubstrate(1.5); setShowPhaseArrows(true) } },
        { title: 'Constructive Interference', description: 'With one phase shift: constructive interference occurs when 2nt = (m + 1/2) * lambda. With 0 or 2 phase shifts: 2nt = m * lambda. The reflected beam is bright at these wavelengths.', setup: () => { setFilmThickness(206); setIncidentWavelength(550) } },
        { title: 'Why Soap Bubbles Are Colorful', description: 'A soap film has varying thickness across its surface. Different thicknesses cause different wavelengths to constructively interfere, creating a rainbow of colors. Toggle "Show all wavelengths" to see which colors reflect.', setup: () => { setShowRainbow(true); setFilmThickness(300); setNFilm(1.33); setNSubstrate(1.0) } },
        { title: 'Anti-Reflection Coatings', description: 'By choosing film thickness so that reflected beams destructively interfere at a target wavelength, we can minimize reflection. Ideal: n_film = sqrt(n_substrate), thickness = lambda / (4 * n_film).', setup: () => { setShowRainbow(false); setNFilm(1.38); setNSubstrate(1.52); setFilmThickness(100); setIncidentWavelength(550) } },
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
            if (!paused) timeRef.current += 0.016
            const t = timeRef.current
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const filmTop = h * 0.35
            const filmScaleY = Math.max(40, filmThickness * 0.2)
            const filmBottom = filmTop + filmScaleY
            const thetaI = (angleIncidence * Math.PI) / 180
            const sinThetaFilm = (nAir * Math.sin(thetaI)) / nFilm
            const thetaFilm = Math.asin(Math.min(1, sinThetaFilm))
            const sinThetaSub = (nFilm * Math.sin(thetaFilm)) / nSubstrate
            const thetaSub = Math.asin(Math.min(1, Math.abs(sinThetaSub)))

            const result = calcInterference(incidentWavelength)

            // Background regions with labels
            // Air region
            ctx.fillStyle = 'rgba(30, 25, 50, 0.5)'
            ctx.fillRect(0, 0, w, filmTop)
            // Film region
            const [fr, fg, fb] = showRainbow ? computeFilmColor(result) : [160, 100, 255]
            ctx.fillStyle = showRainbow
                ? `rgba(${fr}, ${fg}, ${fb}, 0.15)`
                : 'rgba(160, 100, 255, 0.08)'
            ctx.fillRect(0, filmTop, w, filmScaleY)
            // Substrate region
            ctx.fillStyle = 'rgba(60, 50, 40, 0.3)'
            ctx.fillRect(0, filmBottom, w, h - filmBottom)

            // Film boundaries
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(0, filmTop)
            ctx.lineTo(w, filmTop)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(0, filmBottom)
            ctx.lineTo(w, filmBottom)
            ctx.stroke()

            // Region labels
            if (showLabels) {
                ctx.font = '12px system-ui'
                ctx.textAlign = 'left'
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.fillText(`Air (n = ${nAir.toFixed(2)})`, 15, filmTop - 12)
                ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                ctx.fillText(`Film (n = ${nFilm.toFixed(2)})`, 15, filmTop + filmScaleY / 2 + 4)
                ctx.fillStyle = 'rgba(200, 170, 120, 0.6)'
                ctx.fillText(`Substrate (n = ${nSubstrate.toFixed(2)})`, 15, filmBottom + 20)

                // Thickness label
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.lineWidth = 1
                const thickX = w * 0.85
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(thickX, filmTop)
                ctx.lineTo(thickX + 30, filmTop)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(thickX, filmBottom)
                ctx.lineTo(thickX + 30, filmBottom)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.beginPath()
                ctx.moveTo(thickX + 20, filmTop + 3)
                ctx.lineTo(thickX + 20, filmBottom - 3)
                ctx.stroke()
                // Arrowheads
                ctx.beginPath()
                ctx.moveTo(thickX + 20, filmTop + 3)
                ctx.lineTo(thickX + 17, filmTop + 8)
                ctx.moveTo(thickX + 20, filmTop + 3)
                ctx.lineTo(thickX + 23, filmTop + 8)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(thickX + 20, filmBottom - 3)
                ctx.lineTo(thickX + 17, filmBottom - 8)
                ctx.moveTo(thickX + 20, filmBottom - 3)
                ctx.lineTo(thickX + 23, filmBottom - 8)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`t = ${filmThickness} nm`, thickX + 20, (filmTop + filmBottom) / 2 + 4)
            }

            // Incident ray
            const hitX = w * 0.4
            const incidentStartX = hitX - Math.tan(thetaI) * (filmTop - 30)
            const incidentStartY = 30
            const [wr, wg, wb] = wavelengthToRGB(incidentWavelength)
            const rayColor = `rgba(${wr}, ${wg}, ${wb}, 0.9)`
            const rayColorDim = `rgba(${wr}, ${wg}, ${wb}, 0.4)`

            // Animate wave crests along the ray
            const wavePhase = t * 3

            // Incident ray
            ctx.strokeStyle = rayColor
            ctx.lineWidth = 2.5
            ctx.beginPath()
            ctx.moveTo(incidentStartX, incidentStartY)
            ctx.lineTo(hitX, filmTop)
            ctx.stroke()

            // Draw wave crests on incident ray
            drawWaveCrests(ctx, incidentStartX, incidentStartY, hitX, filmTop, wr, wg, wb, wavePhase)

            // Reflected ray 1 (from top surface)
            const ref1EndX = hitX + Math.tan(thetaI) * filmTop
            const ref1EndY = 30
            ctx.strokeStyle = `rgba(${wr}, ${wg}, ${wb}, ${0.3 + result.intensity * 0.5})`
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(hitX, filmTop)
            ctx.lineTo(ref1EndX, ref1EndY)
            ctx.stroke()
            drawWaveCrests(ctx, hitX, filmTop, ref1EndX, ref1EndY, wr, wg, wb, wavePhase + (result.shift1 * 2 * Math.PI))

            // Phase shift indicator at top surface
            if (showPhaseArrows && result.shift1 > 0) {
                ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                ctx.font = 'bold 11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('pi shift', hitX + 50, filmTop - 8)
                ctx.beginPath()
                ctx.arc(hitX + 15, filmTop - 5, 8, 0, Math.PI, true)
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)'
                ctx.lineWidth = 1.5
                ctx.stroke()
            }

            // Refracted ray into film
            const filmHitX = hitX + Math.tan(thetaFilm) * filmScaleY
            ctx.strokeStyle = rayColorDim
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(hitX, filmTop)
            ctx.lineTo(filmHitX, filmBottom)
            ctx.stroke()
            drawWaveCrests(ctx, hitX, filmTop, filmHitX, filmBottom, wr, wg, wb, wavePhase)

            // Reflected ray 2 (from bottom surface, back through film)
            const filmRef2X = filmHitX - Math.tan(thetaFilm) * filmScaleY
            ctx.strokeStyle = rayColorDim
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(filmHitX, filmBottom)
            ctx.lineTo(filmRef2X, filmTop)
            ctx.stroke()

            // Phase shift indicator at bottom surface
            if (showPhaseArrows && result.shift2 > 0) {
                ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                ctx.font = 'bold 11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('pi shift', filmHitX + 50, filmBottom + 16)
                ctx.beginPath()
                ctx.arc(filmHitX + 15, filmBottom + 10, 8, 0, Math.PI, true)
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)'
                ctx.lineWidth = 1.5
                ctx.stroke()
            } else if (showPhaseArrows && result.shift2 === 0) {
                ctx.fillStyle = 'rgba(100, 255, 150, 0.6)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('No shift', filmHitX + 45, filmBottom + 16)
            }

            // Reflected ray 2 exiting film
            const ref2EndX = filmRef2X + Math.tan(thetaI) * filmTop
            const ref2EndY = 30
            ctx.strokeStyle = `rgba(${wr}, ${wg}, ${wb}, ${0.3 + result.intensity * 0.4})`
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(filmRef2X, filmTop)
            ctx.lineTo(ref2EndX, ref2EndY)
            ctx.stroke()
            drawWaveCrests(ctx, filmRef2X, filmTop, ref2EndX, ref2EndY, wr, wg, wb, wavePhase + (result.totalPhaseShifts * 2 * Math.PI))

            // Transmitted ray into substrate
            const subEndX = filmHitX + Math.tan(thetaSub) * (h - filmBottom - 20)
            ctx.strokeStyle = `rgba(${wr}, ${wg}, ${wb}, 0.2)`
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(filmHitX, filmBottom)
            ctx.lineTo(subEndX, h - 20)
            ctx.stroke()

            // Ray labels
            if (showLabels) {
                ctx.font = '10px system-ui'
                ctx.textAlign = 'left'
                ctx.fillStyle = `rgba(${wr}, ${wg}, ${wb}, 0.8)`
                ctx.fillText('Incident', incidentStartX + 5, 50)
                ctx.fillText('Reflected 1', ref1EndX - 15, 50)
                ctx.fillText('Reflected 2', ref2EndX - 15, 65)

                // Angle labels
                if (angleIncidence > 2) {
                    ctx.fillStyle = 'rgba(255, 220, 100, 0.6)'
                    ctx.font = '10px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`theta_i = ${angleIncidence}deg`, hitX - 40, filmTop - 20)
                }
            }

            // Path difference annotation
            if (showLabels) {
                const pdX = w * 0.12
                const pdY = filmTop + filmScaleY / 2
                ctx.fillStyle = 'rgba(160, 100, 255, 0.8)'
                ctx.font = 'bold 12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`Path diff = ${result.pathDiff.toFixed(0)} nm`, pdX + 60, pdY - 5)
                ctx.fillStyle = 'rgba(160, 100, 255, 0.5)'
                ctx.font = '10px system-ui'
                ctx.fillText(`= 2 * ${nFilm.toFixed(2)} * ${filmThickness} * cos(${(Math.acos(result.cosThetaFilm) * 180 / Math.PI).toFixed(0)}deg)`, pdX + 60, pdY + 10)
            }

            // Rainbow spectrum view
            if (showRainbow) {
                const specX = w * 0.1
                const specY = h - 100
                const specW = w * 0.5
                const specH = 50

                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
                ctx.fillRect(specX - 5, specY - 25, specW + 10, specH + 40)

                if (showLabels) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('Reflected Spectrum', specX + specW / 2, specY - 10)
                }

                for (let px = 0; px < specW; px++) {
                    const lambda = 380 + (px / specW) * 400
                    const res = calcInterference(lambda)
                    const [sr, sg, sb] = wavelengthToRGB(lambda)
                    const intensity = res.intensity
                    ctx.fillStyle = `rgba(${sr * intensity}, ${sg * intensity}, ${sb * intensity}, 1)`
                    ctx.fillRect(specX + px, specY, 1, specH)
                }

                // Wavelength ticks
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.font = '9px system-ui'
                ctx.textAlign = 'center'
                for (let lambda = 400; lambda <= 750; lambda += 50) {
                    const px = ((lambda - 380) / 400) * specW
                    ctx.fillText(`${lambda}`, specX + px, specY + specH + 12)
                }

                // Current wavelength marker
                const curPx = ((incidentWavelength - 380) / 400) * specW
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
                ctx.lineWidth = 1.5
                ctx.beginPath()
                ctx.moveTo(specX + curPx, specY - 3)
                ctx.lineTo(specX + curPx, specY + specH + 3)
                ctx.stroke()
            }

            // Interference result indicator
            const indicatorX = w * 0.55
            const indicatorY = h - 60
            const intType = result.intensity > 0.7 ? 'Constructive' : result.intensity < 0.3 ? 'Destructive' : 'Partial'
            const intColor = result.intensity > 0.7 ? 'rgba(100, 255, 150, 0.8)' : result.intensity < 0.3 ? 'rgba(255, 100, 100, 0.8)' : 'rgba(255, 220, 100, 0.8)'

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.fillRect(indicatorX - 5, indicatorY - 18, 200, 40)
            ctx.fillStyle = intColor
            ctx.font = 'bold 14px system-ui'
            ctx.textAlign = 'left'
            ctx.fillText(`${intType} Interference`, indicatorX, indicatorY)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.font = '11px system-ui'
            ctx.fillText(`Intensity: ${(result.intensity * 100).toFixed(0)}%`, indicatorX, indicatorY + 16)

            animId = requestAnimationFrame(draw)
        }

        const drawWaveCrests = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number, phase: number) => {
            const dx = x2 - x1
            const dy = y2 - y1
            const len = Math.sqrt(dx * dx + dy * dy)
            const nx = -dy / len
            const ny = dx / len
            const crestSpacing = 12

            for (let d = 0; d < len; d += crestSpacing) {
                const frac = d / len
                const x = x1 + dx * frac
                const y = y1 + dy * frac
                const osc = Math.sin((d / crestSpacing) * Math.PI * 2 - phase * 5) * 3
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.15 + Math.max(0, osc / 6)})`
                ctx.beginPath()
                ctx.arc(x + nx * osc, y + ny * osc, 1.5, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        const computeFilmColor = (_result: ReturnType<typeof calcInterference>): [number, number, number] => {
            let rTotal = 0, gTotal = 0, bTotal = 0
            let count = 0
            for (let lambda = 380; lambda <= 780; lambda += 5) {
                const res = calcInterference(lambda)
                const [cr, cg, cb] = wavelengthToRGB(lambda)
                rTotal += cr * res.intensity
                gTotal += cg * res.intensity
                bTotal += cb * res.intensity
                count++
            }
            return [rTotal / count * 3, gTotal / count * 3, bTotal / count * 3]
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [filmThickness, nFilm, nSubstrate, incidentWavelength, angleIncidence, showRainbow, showLabels, showPhaseArrows, paused, calcInterference, nAir])

    const result = calcInterference(incidentWavelength)

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 14" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Thin Film Interference"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'Thickness', value: filmThickness.toFixed(0), unit: 'nm' },
                                { label: 'Path diff', value: result.pathDiff.toFixed(1), unit: 'nm', color: 'rgb(160, 100, 255)' },
                                { label: 'Phase shifts', value: result.totalPhaseShifts === 0 ? '0' : result.totalPhaseShifts === 0.5 ? 'pi (1 boundary)' : 'pi + pi (both)', color: result.totalPhaseShifts === 0.5 ? 'rgb(255, 200, 100)' : 'rgb(100, 200, 255)' },
                                { label: 'Intensity', value: (result.intensity * 100).toFixed(0), unit: '%', color: result.intensity > 0.7 ? 'rgb(100, 255, 150)' : result.intensity < 0.3 ? 'rgb(255, 100, 100)' : 'rgb(255, 220, 100)' },
                                { label: 'Constr. lambda', value: result.constructiveOrders.length > 0 ? result.constructiveOrders.slice(0, 3).map(l => l.toFixed(0)).join(', ') : 'None visible', unit: result.constructiveOrders.length > 0 ? 'nm' : '' },
                                { label: 'Destr. lambda', value: result.destructiveOrders.length > 0 ? result.destructiveOrders.slice(0, 3).map(l => l.toFixed(0)).join(', ') : 'None visible', unit: result.destructiveOrders.length > 0 ? 'nm' : '' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Path Diff', expression: 'delta = 2nt cos(theta)', description: 'Optical path difference in film' },
                                { label: 'Constructive', expression: '2nt = (m+1/2)lambda', description: 'With one phase shift' },
                                { label: 'Constructive', expression: '2nt = m * lambda', description: 'With 0 or 2 phase shifts' },
                                { label: "Snell's Law", expression: 'n1 sin(theta1) = n2 sin(theta2)' },
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
                        <ControlGroup label="Film Thickness">
                            <Slider value={filmThickness} onChange={setFilmThickness} min={50} max={800} step={5} label={`t = ${filmThickness} nm`} />
                        </ControlGroup>

                        <ControlGroup label="Film Refractive Index">
                            <Slider value={nFilm} onChange={setNFilm} min={1.0} max={2.5} step={0.01} label={`n_film = ${nFilm.toFixed(2)}`} />
                        </ControlGroup>

                        <ControlGroup label="Substrate Refractive Index">
                            <Slider value={nSubstrate} onChange={setNSubstrate} min={1.0} max={2.5} step={0.01} label={`n_sub = ${nSubstrate.toFixed(2)}`} />
                        </ControlGroup>

                        <ControlGroup label="Incident Wavelength">
                            <Slider value={incidentWavelength} onChange={setIncidentWavelength} min={380} max={780} step={5} label={`lambda = ${incidentWavelength} nm`} />
                        </ControlGroup>

                        <ControlGroup label="Angle of Incidence">
                            <Slider value={angleIncidence} onChange={setAngleIncidence} min={0} max={80} step={1} label={`theta = ${angleIncidence} deg`} />
                        </ControlGroup>

                        <Toggle value={showRainbow} onChange={setShowRainbow} label="Show All Wavelengths" />
                        <Toggle value={showPhaseArrows} onChange={setShowPhaseArrows} label="Show Phase Shifts" />
                        <Toggle value={showLabels} onChange={setShowLabels} label="Show Labels" />
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
