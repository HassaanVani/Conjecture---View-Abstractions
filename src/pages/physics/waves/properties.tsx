import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

export default function WaveProperties() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [waveMode, setWaveMode] = useState<string>('transverse')
    const [amplitude, setAmplitude] = useState(60)
    const [wavelength, setWavelength] = useState(160)
    const [frequency, setFrequency] = useState(2)
    const [boundaryType, setBoundaryType] = useState<string>('none')
    const [polarizerAngle, setPolarizerAngle] = useState(0)
    const [showParticles, setShowParticles] = useState(true)
    const [showLabels, setShowLabels] = useState(true)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)

    const waveSpeed = frequency * wavelength

    const reset = useCallback(() => {
        setWaveMode('transverse')
        setAmplitude(60)
        setWavelength(160)
        setFrequency(2)
        setBoundaryType('none')
        setPolarizerAngle(0)
        setShowParticles(true)
        setShowLabels(true)
        setPaused(false)
        timeRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'Transverse Waves', description: 'In a transverse wave, particles oscillate perpendicular to the direction of wave propagation. Light and waves on a string are transverse.', setup: () => { reset(); setWaveMode('transverse'); setShowParticles(true) } },
        { title: 'Longitudinal Waves', description: 'In a longitudinal wave, particles oscillate parallel to the wave direction, creating compressions and rarefactions. Sound is a longitudinal wave.', setup: () => { setWaveMode('longitudinal'); setShowParticles(true) } },
        { title: 'v = f * lambda', description: 'Wave speed equals frequency times wavelength. Increasing frequency while keeping speed constant decreases wavelength, and vice versa.', setup: () => { setWaveMode('transverse'); setFrequency(3); setWavelength(120); setBoundaryType('none') } },
        { title: 'Fixed-End Reflection', description: 'When a wave hits a fixed boundary, it reflects inverted (phase shift of pi). The reflected pulse is flipped upside down.', setup: () => { setWaveMode('transverse'); setBoundaryType('fixed'); setFrequency(1.5); setWavelength(200) } },
        { title: 'Free-End Reflection', description: 'When a wave hits a free boundary, it reflects upright (no phase shift). The reflected pulse maintains its orientation.', setup: () => { setBoundaryType('free') } },
        { title: 'Polarization', description: 'Unpolarized light has electric field oscillating in all directions perpendicular to propagation. A polarizer transmits only one component.', setup: () => { setWaveMode('polarization'); setPolarizerAngle(0) } },
        { title: 'Malus\'s Law', description: 'When polarized light passes through a second polarizer (analyzer), the transmitted intensity is I = I_0 * cos^2(theta), where theta is the angle between polarizer axes.', setup: () => { setWaveMode('polarization'); setPolarizerAngle(45) } },
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

            const centerY = h * 0.5

            if (waveMode === 'transverse') {
                drawTransverse(ctx, w, h, centerY, t)
            } else if (waveMode === 'longitudinal') {
                drawLongitudinal(ctx, w, h, centerY, t)
            } else if (waveMode === 'polarization') {
                drawPolarization(ctx, w, h, t)
            }

            animId = requestAnimationFrame(draw)
        }

        const drawTransverse = (ctx: CanvasRenderingContext2D, w: number, _h: number, cy: number, t: number) => {
            const boundaryX = w * 0.85
            const startX = 40
            const omega = 2 * Math.PI * frequency
            const k = (2 * Math.PI) / wavelength

            // Equilibrium line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.moveTo(startX, cy)
            ctx.lineTo(boundaryX, cy)
            ctx.stroke()
            ctx.setLineDash([])

            // Draw boundary wall if needed
            if (boundaryType !== 'none') {
                ctx.strokeStyle = boundaryType === 'fixed' ? 'rgba(255, 100, 100, 0.7)' : 'rgba(100, 255, 150, 0.7)'
                ctx.lineWidth = 4
                ctx.beginPath()
                ctx.moveTo(boundaryX, cy - 100)
                ctx.lineTo(boundaryX, cy + 100)
                ctx.stroke()

                if (boundaryType === 'fixed') {
                    // Hatching for fixed end
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)'
                    ctx.lineWidth = 1
                    for (let i = -90; i <= 90; i += 10) {
                        ctx.beginPath()
                        ctx.moveTo(boundaryX, cy + i)
                        ctx.lineTo(boundaryX + 10, cy + i - 10)
                        ctx.stroke()
                    }
                } else {
                    // Ring for free end
                    ctx.strokeStyle = 'rgba(100, 255, 150, 0.5)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.arc(boundaryX, cy, 8, 0, Math.PI * 2)
                    ctx.stroke()
                }

                if (showLabels) {
                    ctx.fillStyle = boundaryType === 'fixed' ? 'rgba(255, 100, 100, 0.7)' : 'rgba(100, 255, 150, 0.7)'
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(boundaryType === 'fixed' ? 'Fixed End' : 'Free End', boundaryX, cy - 115)
                }
            }

            // Incident wave
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.9)'
            ctx.lineWidth = 2.5
            ctx.beginPath()
            for (let x = startX; x <= (boundaryType !== 'none' ? boundaryX : w - 40); x += 1) {
                const y = cy + amplitude * Math.sin(k * x - omega * t)
                if (x === startX) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            // Reflected wave (if boundary)
            if (boundaryType !== 'none') {
                const reflectionSign = boundaryType === 'fixed' ? -1 : 1
                ctx.strokeStyle = 'rgba(255, 180, 100, 0.6)'
                ctx.lineWidth = 2
                ctx.beginPath()
                for (let x = boundaryX; x >= startX; x -= 1) {
                    const distFromBoundary = boundaryX - x
                    const y = cy + reflectionSign * amplitude * 0.7 * Math.sin(k * distFromBoundary - omega * t)
                    if (x === boundaryX) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                }
                ctx.stroke()
            }

            // Particles
            if (showParticles) {
                const spacing = wavelength / 4
                const endX = boundaryType !== 'none' ? boundaryX : w - 40
                for (let x = startX; x <= endX; x += spacing) {
                    const y = cy + amplitude * Math.sin(k * x - omega * t)
                    const vy = -amplitude * omega * Math.cos(k * x - omega * t)

                    ctx.fillStyle = 'rgba(160, 100, 255, 0.8)'
                    ctx.beginPath()
                    ctx.arc(x, y, 4, 0, Math.PI * 2)
                    ctx.fill()

                    // Velocity arrow (vertical for transverse)
                    const arrowLen = vy * 0.02
                    ctx.strokeStyle = 'rgba(255, 220, 100, 0.5)'
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x, y + arrowLen)
                    ctx.stroke()
                }
            }

            // Labels
            if (showLabels) {
                // Wavelength bracket
                const labelX = startX + wavelength * 0.5
                const phase = (k * labelX - omega * t) % (2 * Math.PI)
                const bracketStartX = labelX - (phase / (2 * Math.PI)) * wavelength
                const bracketX1 = bracketStartX > startX ? bracketStartX : bracketStartX + wavelength
                const bracketX2 = bracketX1 + wavelength

                if (bracketX2 < (boundaryType !== 'none' ? boundaryX : w - 40)) {
                    ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)'
                    ctx.lineWidth = 1.5
                    const bracketY = cy + amplitude + 30
                    ctx.beginPath()
                    ctx.moveTo(bracketX1, bracketY - 5)
                    ctx.lineTo(bracketX1, bracketY)
                    ctx.lineTo(bracketX2, bracketY)
                    ctx.lineTo(bracketX2, bracketY - 5)
                    ctx.stroke()
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
                    ctx.font = 'bold 12px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('lambda', (bracketX1 + bracketX2) / 2, bracketY + 16)
                }

                // Amplitude label
                const ampLabelX = startX + 60
                ctx.strokeStyle = 'rgba(255, 150, 100, 0.6)'
                ctx.lineWidth = 1
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(ampLabelX - 20, cy)
                ctx.lineTo(ampLabelX - 20, cy - amplitude)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(255, 150, 100, 0.8)'
                ctx.font = 'bold 12px system-ui'
                ctx.textAlign = 'right'
                ctx.fillText('A', ampLabelX - 25, cy - amplitude / 2 + 4)

                // Direction arrow
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.lineWidth = 1.5
                const arrowY = cy - amplitude - 40
                ctx.beginPath()
                ctx.moveTo(w * 0.3, arrowY)
                ctx.lineTo(w * 0.55, arrowY)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(w * 0.55, arrowY)
                ctx.lineTo(w * 0.55 - 8, arrowY - 4)
                ctx.moveTo(w * 0.55, arrowY)
                ctx.lineTo(w * 0.55 - 8, arrowY + 4)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Wave propagation', w * 0.425, arrowY - 8)
            }
        }

        const drawLongitudinal = (ctx: CanvasRenderingContext2D, w: number, _h: number, cy: number, t: number) => {
            const startX = 60
            const endX = w - 60
            const omega = 2 * Math.PI * frequency
            const k = (2 * Math.PI) / wavelength
            const numParticles = 80

            // Equilibrium positions
            const spacing = (endX - startX) / numParticles

            for (let i = 0; i < numParticles; i++) {
                const eqX = startX + i * spacing
                const displacement = amplitude * 0.4 * Math.sin(k * eqX - omega * t)
                const x = eqX + displacement
                const y = cy

                // Density-based color: compressed = brighter, rarefied = dimmer
                const dSdx = amplitude * 0.4 * k * Math.cos(k * eqX - omega * t)
                const density = 1 / (1 + dSdx * 0.01)
                const brightness = Math.min(1, Math.max(0.2, density))

                ctx.fillStyle = `rgba(160, 100, 255, ${brightness})`
                const particleSize = 3 + brightness * 3
                ctx.beginPath()
                ctx.arc(x, y, particleSize, 0, Math.PI * 2)
                ctx.fill()

                // Show equilibrium dots
                if (showParticles) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
                    ctx.beginPath()
                    ctx.arc(eqX, cy + 50, 2, 0, Math.PI * 2)
                    ctx.fill()

                    // Connection line from eq to displaced
                    ctx.strokeStyle = 'rgba(255, 220, 100, 0.15)'
                    ctx.lineWidth = 0.5
                    ctx.beginPath()
                    ctx.moveTo(eqX, cy + 50)
                    ctx.lineTo(x, y)
                    ctx.stroke()
                }
            }

            // Labels
            if (showLabels) {
                // Find compression and rarefaction regions
                const compX = startX + ((omega * t / k) % wavelength)
                const rareX = compX + wavelength / 2

                if (compX > startX + 30 && compX < endX - 80) {
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('Compression', compX, cy - 35)
                    // Bracket
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)'
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(compX - 25, cy - 25)
                    ctx.lineTo(compX + 25, cy - 25)
                    ctx.stroke()
                }

                if (rareX > startX + 30 && rareX < endX - 80) {
                    ctx.fillStyle = 'rgba(100, 150, 255, 0.5)'
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('Rarefaction', rareX, cy - 35)
                    ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)'
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(rareX - 25, cy - 25)
                    ctx.lineTo(rareX + 25, cy - 25)
                    ctx.stroke()
                }

                // Wavelength
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)'
                ctx.lineWidth = 1.5
                const bracketY = cy + 35
                const bx1 = startX + 50
                const bx2 = bx1 + wavelength
                if (bx2 < endX) {
                    ctx.beginPath()
                    ctx.moveTo(bx1, bracketY - 5)
                    ctx.lineTo(bx1, bracketY)
                    ctx.lineTo(bx2, bracketY)
                    ctx.lineTo(bx2, bracketY - 5)
                    ctx.stroke()
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
                    ctx.font = 'bold 12px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('lambda', (bx1 + bx2) / 2, bracketY + 16)
                }

                // Displacement arrows
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Particle displacement direction', w * 0.5, cy + 80)
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.4)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(w * 0.35, cy + 90)
                ctx.lineTo(w * 0.65, cy + 90)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(w * 0.65, cy + 90)
                ctx.lineTo(w * 0.65 - 6, cy + 86)
                ctx.moveTo(w * 0.65, cy + 90)
                ctx.lineTo(w * 0.65 - 6, cy + 94)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(w * 0.35, cy + 90)
                ctx.lineTo(w * 0.35 + 6, cy + 86)
                ctx.moveTo(w * 0.35, cy + 90)
                ctx.lineTo(w * 0.35 + 6, cy + 94)
                ctx.stroke()
            }
        }

        const drawPolarization = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
            const cy = h * 0.5
            const omega = 2 * Math.PI * frequency
            const polarizerX = w * 0.35
            const analyzerX = w * 0.65
            const thetaRad = (polarizerAngle * Math.PI) / 180

            // Propagation line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.moveTo(40, cy)
            ctx.lineTo(w - 40, cy)
            ctx.stroke()
            ctx.setLineDash([])

            // Unpolarized light (before polarizer) - multiple oscillation directions
            const numDirs = 8
            for (let d = 0; d < numDirs; d++) {
                const angle = (d / numDirs) * Math.PI
                const dx = Math.cos(angle)
                const dy = Math.sin(angle)
                ctx.strokeStyle = `rgba(160, 100, 255, ${0.3 + 0.1 * Math.sin(omega * t + d)})`
                ctx.lineWidth = 1.5
                for (let x = 60; x < polarizerX - 20; x += 16) {
                    const phase = omega * t - x * 0.05
                    const osc = amplitude * 0.3 * Math.sin(phase)
                    ctx.beginPath()
                    ctx.moveTo(x, cy + osc * dy * 0.5 - osc * dx * 0.3)
                    ctx.lineTo(x, cy - osc * dy * 0.5 + osc * dx * 0.3)
                    ctx.stroke()
                }
            }

            // Polarizer (vertical slit)
            ctx.fillStyle = 'rgba(100, 200, 255, 0.15)'
            ctx.fillRect(polarizerX - 8, cy - 100, 16, 200)
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(polarizerX, cy - 100)
            ctx.lineTo(polarizerX, cy + 100)
            ctx.stroke()
            // Transmission axis arrow
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(polarizerX, cy - 80)
            ctx.lineTo(polarizerX, cy + 80)
            ctx.stroke()

            if (showLabels) {
                ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
                ctx.font = 'bold 11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Polarizer', polarizerX, cy - 115)
                ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'
                ctx.fillText('Unpolarized', (60 + polarizerX) / 2, cy - 115)
            }

            // Polarized light (between polarizer and analyzer) - vertical oscillation
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.9)'
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let x = polarizerX + 10; x < analyzerX - 10; x += 1) {
                const phase = omega * t - x * 0.04
                const osc = amplitude * 0.5 * Math.sin(phase)
                const px = x
                const py = cy - osc
                if (x === polarizerX + 10) ctx.moveTo(px, py)
                else ctx.lineTo(px, py)
            }
            ctx.stroke()

            if (showLabels) {
                ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Vertically polarized', (polarizerX + analyzerX) / 2, cy + amplitude * 0.5 + 30)
                ctx.fillText('I = I_0 / 2', (polarizerX + analyzerX) / 2, cy + amplitude * 0.5 + 45)
            }

            // Analyzer (rotated slit)
            ctx.save()
            ctx.translate(analyzerX, cy)
            ctx.rotate(thetaRad)
            ctx.fillStyle = 'rgba(255, 180, 80, 0.15)'
            ctx.fillRect(-8, -100, 16, 200)
            ctx.strokeStyle = 'rgba(255, 180, 80, 0.7)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(0, -100)
            ctx.lineTo(0, 100)
            ctx.stroke()
            ctx.restore()

            if (showLabels) {
                ctx.fillStyle = 'rgba(255, 180, 80, 0.8)'
                ctx.font = 'bold 11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`Analyzer (${polarizerAngle}deg)`, analyzerX, cy - 115)
            }

            // Transmitted light after analyzer
            const transmittedAmp = amplitude * 0.5 * Math.cos(thetaRad)
            const transmittedIntensity = Math.cos(thetaRad) * Math.cos(thetaRad)

            if (Math.abs(transmittedAmp) > 0.5) {
                ctx.strokeStyle = `rgba(255, 180, 80, ${0.3 + transmittedIntensity * 0.6})`
                ctx.lineWidth = 2
                ctx.beginPath()
                for (let x = analyzerX + 10; x < w - 40; x += 1) {
                    const phase = omega * t - x * 0.04
                    const osc = transmittedAmp * Math.sin(phase)
                    // Oscillation along analyzer axis
                    const px = x
                    const py = cy - osc * Math.cos(thetaRad)
                    if (x === analyzerX + 10) ctx.moveTo(px, py)
                    else ctx.lineTo(px, py)
                }
                ctx.stroke()
            }

            if (showLabels) {
                ctx.fillStyle = 'rgba(255, 180, 80, 0.7)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                const intensityPct = (transmittedIntensity * 50).toFixed(0)
                ctx.fillText(`I = ${intensityPct}% of I_0`, (analyzerX + w - 40) / 2, cy + amplitude * 0.5 + 30)
                ctx.fillText(`I = I_0 cos^2(${polarizerAngle}deg)`, (analyzerX + w - 40) / 2, cy + amplitude * 0.5 + 45)
            }

            // Angle arc
            if (polarizerAngle > 0) {
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.5)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.arc(analyzerX, cy, 30, -Math.PI / 2, -Math.PI / 2 + thetaRad, false)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 220, 100, 0.7)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(`theta = ${polarizerAngle}deg`, analyzerX + 35, cy - 25)
            }
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [waveMode, amplitude, wavelength, frequency, boundaryType, polarizerAngle, showParticles, showLabels, paused])

    const period = 1 / frequency
    const malusIntensity = Math.cos((polarizerAngle * Math.PI) / 180) ** 2

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 14" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Wave Properties"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'Wavelength', value: wavelength.toFixed(0), unit: 'px' },
                                { label: 'Frequency', value: frequency.toFixed(1), unit: 'Hz' },
                                { label: 'Wave Speed', value: waveSpeed.toFixed(0), unit: 'px/s', color: 'rgb(100, 255, 150)' },
                                { label: 'Amplitude', value: amplitude.toFixed(0), unit: 'px' },
                                { label: 'Period', value: period.toFixed(3), unit: 's' },
                                ...(waveMode === 'polarization' ? [{ label: 'I/I_0', value: (malusIntensity * 0.5).toFixed(3), color: 'rgb(255, 180, 80)' }] : []),
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Wave Speed', expression: 'v = f * lambda', description: 'Speed equals frequency times wavelength' },
                                { label: 'Period', expression: 'T = 1 / f', description: 'Period is inverse of frequency' },
                                { label: "Malus's Law", expression: 'I = I_0 cos^2(theta)', description: 'Transmitted intensity through analyzer' },
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
                        <ControlGroup label="Wave Mode">
                            <ButtonGroup
                                value={waveMode}
                                onChange={setWaveMode}
                                options={[
                                    { value: 'transverse', label: 'Transverse' },
                                    { value: 'longitudinal', label: 'Longitud.' },
                                    { value: 'polarization', label: 'Polarize' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Amplitude">
                            <Slider value={amplitude} onChange={setAmplitude} min={10} max={120} step={5} label={`A = ${amplitude} px`} />
                        </ControlGroup>

                        <ControlGroup label="Wavelength">
                            <Slider value={wavelength} onChange={setWavelength} min={60} max={400} step={10} label={`lambda = ${wavelength} px`} />
                        </ControlGroup>

                        <ControlGroup label="Frequency">
                            <Slider value={frequency} onChange={setFrequency} min={0.5} max={5} step={0.1} label={`f = ${frequency.toFixed(1)} Hz`} />
                        </ControlGroup>

                        {waveMode === 'transverse' && (
                            <ControlGroup label="Boundary">
                                <ButtonGroup
                                    value={boundaryType}
                                    onChange={setBoundaryType}
                                    options={[
                                        { value: 'none', label: 'None' },
                                        { value: 'fixed', label: 'Fixed' },
                                        { value: 'free', label: 'Free' },
                                    ]}
                                    color="rgb(160, 100, 255)"
                                />
                            </ControlGroup>
                        )}

                        {waveMode === 'polarization' && (
                            <ControlGroup label="Analyzer Angle">
                                <Slider value={polarizerAngle} onChange={setPolarizerAngle} min={0} max={90} step={1} label={`theta = ${polarizerAngle} deg`} />
                            </ControlGroup>
                        )}

                        <Toggle value={showParticles} onChange={setShowParticles} label="Show Particles" />
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
