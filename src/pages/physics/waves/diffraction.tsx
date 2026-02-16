import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'

function wavelengthToRGB(nm: number): [number, number, number] {
    let r = 0, g = 0, b = 0
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1 }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1 }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20 }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1 }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65 }
    else if (nm <= 780) { r = 1 }
    // Intensity falloff at edges
    let factor = 1
    if (nm < 420) factor = 0.3 + 0.7 * (nm - 380) / 40
    else if (nm > 700) factor = 0.3 + 0.7 * (780 - nm) / 80
    return [Math.round(r * factor * 255), Math.round(g * factor * 255), Math.round(b * factor * 255)]
}

export default function SingleSlitDiffraction() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [slitWidth, setSlitWidth] = useState(5) // micrometers
    const [wavelength, setWavelength] = useState(550) // nm
    const [screenDist, setScreenDist] = useState(2) // meters
    const [showIntensity, setShowIntensity] = useState(true)
    const [showWavefronts, setShowWavefronts] = useState(true)
    const [showMinima, setShowMinima] = useState(true)
    const [showEnvelope, setShowEnvelope] = useState(true)
    const timeRef = useRef(0)

    const calcDiffraction = useCallback(() => {
        const a = slitWidth * 1e-6 // slit width in meters
        const lam = wavelength * 1e-9 // wavelength in meters
        const D = screenDist

        // Central maximum half-width (angle to first minimum)
        const theta1 = Math.asin(lam / a)
        const y1 = D * Math.tan(theta1) // position of first minimum on screen

        // Minima positions: a sin(theta) = m * lambda
        const minima: number[] = []
        for (let m = 1; m <= 5; m++) {
            const sinTheta = m * lam / a
            if (sinTheta < 1) {
                minima.push(D * Math.tan(Math.asin(sinTheta)))
            }
        }

        return { a, lam, D, theta1, y1, minima }
    }, [slitWidth, wavelength, screenDist])

    const intensity = useCallback((theta: number) => {
        const a = slitWidth * 1e-6
        const lam = wavelength * 1e-9
        const beta = (Math.PI * a * Math.sin(theta)) / lam
        if (Math.abs(beta) < 1e-10) return 1
        const sincBeta = Math.sin(beta) / beta
        return sincBeta * sincBeta
    }, [slitWidth, wavelength])

    const reset = useCallback(() => {
        setSlitWidth(5)
        setWavelength(550)
        setScreenDist(2)
        setShowIntensity(true)
        setShowWavefronts(true)
        setShowMinima(true)
        setShowEnvelope(true)
        timeRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'Single Slit Diffraction', description: 'When a wave passes through a narrow slit, it spreads out and creates an interference pattern. This is diffraction - the bending of waves around obstacles and through openings.', setup: () => reset() },
        { title: 'Central Maximum', description: 'The brightest region is the central maximum, directly ahead of the slit. It is twice as wide as the secondary maxima. Most of the wave energy concentrates here.', setup: () => { setSlitWidth(5); setWavelength(550); setShowIntensity(true) } },
        { title: 'Minima Condition', description: 'Destructive interference creates dark fringes (minima) at angles where a*sin(theta) = m*lambda (m = 1, 2, 3...). At these angles, waves from different parts of the slit cancel.', setup: () => { setShowMinima(true) } },
        { title: 'Slit Width Effect', description: 'Narrower slits produce wider diffraction patterns. When the slit is comparable to the wavelength, diffraction is most pronounced. Very wide slits show almost no spreading.', setup: () => { setSlitWidth(2); setShowIntensity(true) } },
        { title: 'Wide Slit Comparison', description: 'With a wider slit, the pattern narrows. The central maximum becomes tighter. This is because more of the slit contributes to destructive interference at smaller angles.', setup: () => { setSlitWidth(10) } },
        { title: 'Wavelength Effect', description: 'Longer wavelengths produce wider patterns. Red light (700nm) diffracts more than blue (400nm) through the same slit. The color of the light directly affects the pattern.', setup: () => { setSlitWidth(5); setWavelength(700) } },
        { title: 'Intensity Pattern', description: 'The intensity follows I = I0*(sin(beta)/beta)^2 where beta = pi*a*sin(theta)/lambda. The central max is brightest, and secondary maxima rapidly diminish.', setup: () => { setShowIntensity(true); setShowEnvelope(true); setWavelength(550) } },
        { title: 'Screen Distance', description: 'Moving the screen farther away makes the pattern larger (wider fringes) but dimmer. The angular pattern stays the same - only the physical size on the screen changes.', setup: () => { setScreenDist(4); setSlitWidth(5) } },
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
        const diff = calcDiffraction()

        const draw = () => {
            timeRef.current += 0.03
            const t = timeRef.current
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const [r, g, b] = wavelengthToRGB(wavelength)
            const lightColor = `rgb(${r}, ${g}, ${b})`
            const lightAlpha = (a: number) => `rgba(${r}, ${g}, ${b}, ${a})`

            // Layout
            const slitX = w * 0.25
            const screenX = w * 0.75
            const cy = h / 2

            // Barrier with slit
            const slitPx = Math.max(4, slitWidth * 3) // visual slit width in pixels
            ctx.fillStyle = 'rgba(100, 80, 160, 0.6)'
            ctx.fillRect(slitX - 3, 0, 6, cy - slitPx / 2)
            ctx.fillRect(slitX - 3, cy + slitPx / 2, 6, h - cy - slitPx / 2)

            // Slit opening highlight
            ctx.fillStyle = lightAlpha(0.3)
            ctx.fillRect(slitX - 2, cy - slitPx / 2, 4, slitPx)

            // Screen
            ctx.fillStyle = 'rgba(100, 80, 160, 0.3)'
            ctx.fillRect(screenX - 2, 0, 4, h)

            // ---- Incoming plane waves (left of slit) ----
            if (showWavefronts) {
                const wavePeriodPx = 25
                ctx.strokeStyle = lightAlpha(0.3)
                ctx.lineWidth = 1.5
                for (let i = -10; i < 15; i++) {
                    const x = slitX - 40 + ((t * 15 + i * wavePeriodPx) % (wavePeriodPx * 15)) - wavePeriodPx * 5
                    if (x < slitX - 5 && x > 20) {
                        ctx.beginPath()
                        ctx.moveTo(x, 30); ctx.lineTo(x, h - 30)
                        ctx.stroke()
                    }
                }

                // Diffracted wavefronts (circular from slit)
                const numWavefronts = 12
                for (let i = 0; i < numWavefronts; i++) {
                    const radius = ((t * 15 + i * wavePeriodPx) % (wavePeriodPx * numWavefronts))
                    if (radius > 0 && radius < (screenX - slitX) * 1.2) {
                        const alpha = Math.max(0.05, 0.25 * (1 - radius / ((screenX - slitX) * 1.2)))
                        ctx.strokeStyle = lightAlpha(alpha)
                        ctx.lineWidth = 1
                        ctx.beginPath()
                        ctx.arc(slitX, cy, radius, -Math.PI / 2, Math.PI / 2)
                        ctx.stroke()
                    }
                }
            }

            // ---- Intensity pattern on screen ----
            const patternHeight = h - 80
            const maxAngle = 0.15 // radians

            if (showIntensity) {
                // Draw the pattern as colored bars on the screen
                for (let py = 0; py < patternHeight; py++) {
                    const yPos = (py / patternHeight - 0.5) * 2 // -1 to 1
                    const theta = yPos * maxAngle
                    const I = intensity(theta)
                    const screenY = 40 + py

                    ctx.fillStyle = lightAlpha(I * 0.9)
                    ctx.fillRect(screenX + 3, screenY, 30, 1)
                }

                // White intensity outline
                if (showEnvelope) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    for (let py = 0; py < patternHeight; py++) {
                        const yPos = (py / patternHeight - 0.5) * 2
                        const theta = yPos * maxAngle
                        const I = intensity(theta)
                        const screenY = 40 + py
                        const barW = I * 80
                        if (py === 0) ctx.moveTo(screenX + 35 + barW, screenY)
                        else ctx.lineTo(screenX + 35 + barW, screenY)
                    }
                    ctx.stroke()

                    // Intensity graph
                    ctx.strokeStyle = lightAlpha(0.7)
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    for (let py = 0; py < patternHeight; py++) {
                        const yPos = (py / patternHeight - 0.5) * 2
                        const theta = yPos * maxAngle
                        const I = intensity(theta)
                        const screenY = 40 + py
                        const graphX = screenX + 40 + I * 80
                        if (py === 0) ctx.moveTo(graphX, screenY)
                        else ctx.lineTo(graphX, screenY)
                    }
                    ctx.stroke()
                }
            }

            // ---- Minima markers ----
            if (showMinima) {
                diff.minima.forEach((yMeters, m) => {
                    const yFrac = yMeters / (screenDist * Math.tan(maxAngle))
                    if (Math.abs(yFrac) <= 1) {
                        const screenYPos = cy - yFrac * (patternHeight / 2)
                        const screenYNeg = cy + yFrac * (patternHeight / 2)

                        // Marker lines
                        ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)'
                        ctx.lineWidth = 1
                        ctx.setLineDash([4, 3])
                        ctx.beginPath(); ctx.moveTo(slitX + 5, cy); ctx.lineTo(screenX, screenYPos); ctx.stroke()
                        ctx.beginPath(); ctx.moveTo(slitX + 5, cy); ctx.lineTo(screenX, screenYNeg); ctx.stroke()
                        ctx.setLineDash([])

                        // Labels
                        ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
                        ctx.font = '10px system-ui'; ctx.textAlign = 'left'
                        ctx.fillText(`m=${m + 1}`, screenX + 125, screenYPos + 4)
                        ctx.fillText(`m=-${m + 1}`, screenX + 125, screenYNeg + 4)

                        // Dots on screen
                        ctx.fillStyle = 'rgba(255, 100, 100, 0.6)'
                        ctx.beginPath(); ctx.arc(screenX, screenYPos, 3, 0, Math.PI * 2); ctx.fill()
                        ctx.beginPath(); ctx.arc(screenX, screenYNeg, 3, 0, Math.PI * 2); ctx.fill()
                    }
                })

                // Central max marker
                ctx.fillStyle = 'rgba(100, 255, 150, 0.6)'
                ctx.beginPath(); ctx.arc(screenX, cy, 4, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(100, 255, 150, 0.7)'
                ctx.font = '10px system-ui'; ctx.textAlign = 'left'
                ctx.fillText('m=0 (central max)', screenX + 125, cy + 4)
            }

            // Labels
            ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'
            ctx.font = '12px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Slit', slitX, 25)
            ctx.fillText('Screen', screenX, 25)
            ctx.fillText(`a = ${slitWidth} um`, slitX, h - 15)
            ctx.fillText(`D = ${screenDist.toFixed(1)} m`, (slitX + screenX) / 2, h - 15)

            // Distance line
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
            ctx.beginPath(); ctx.moveTo(slitX, h - 30); ctx.lineTo(screenX, h - 30); ctx.stroke()
            ctx.setLineDash([])

            // Wavelength color swatch
            ctx.fillStyle = lightColor
            ctx.fillRect(20, h - 30, 15, 15)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.font = '10px system-ui'; ctx.textAlign = 'left'
            ctx.fillText(`lambda = ${wavelength} nm`, 40, h - 18)

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [slitWidth, wavelength, screenDist, showIntensity, showWavefronts, showMinima, showEnvelope, intensity, calcDiffraction])

    const diff = calcDiffraction()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 6" color="rgb(160, 100, 255)" />
                        <InfoPanel title="Diffraction Pattern" departmentColor="rgb(160, 100, 255)" items={[
                            { label: 'Slit width', value: slitWidth.toFixed(1), unit: 'um' },
                            { label: 'Wavelength', value: wavelength.toString(), unit: 'nm', color: `rgb(${wavelengthToRGB(wavelength).join(',')})` },
                            { label: '1st min angle', value: (diff.theta1 * 180 / Math.PI).toFixed(3), unit: 'deg' },
                            { label: '1st min position', value: (diff.y1 * 100).toFixed(2), unit: 'cm' },
                            { label: 'Central width', value: (diff.y1 * 200).toFixed(2), unit: 'cm' },
                        ]} />
                    </div>
                    <div className="absolute top-4 right-[340px] max-w-[240px]">
                        <EquationDisplay departmentColor="rgb(160, 100, 255)" equations={[
                            { label: 'Minima', expression: 'a sin(theta) = m * lambda', description: 'm = 1, 2, 3... (dark fringes)' },
                            { label: 'Intensity', expression: 'I = I0 (sin(beta)/beta)^2', description: 'beta = pi*a*sin(theta)/lambda' },
                            { label: 'Central width', expression: 'w = 2*lambda*D / a' },
                        ]} />
                    </div>
                    <div className="absolute bottom-4 left-4">
                        <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor="rgb(160, 100, 255)" />
                    </div>
                </div>
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ControlGroup label="Slit Width (um)">
                            <Slider value={slitWidth} onChange={setSlitWidth} min={1} max={20} step={0.5} label={`a = ${slitWidth.toFixed(1)} um`} />
                        </ControlGroup>
                        <ControlGroup label="Wavelength (nm)">
                            <Slider value={wavelength} onChange={v => setWavelength(Math.round(v))} min={380} max={780} step={5} label={`lambda = ${wavelength} nm`} />
                            <div className="h-3 rounded-full mt-1" style={{
                                background: 'linear-gradient(to right, #7700ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff7700, #ff0000)',
                            }} />
                        </ControlGroup>
                        <ControlGroup label="Screen Distance (m)">
                            <Slider value={screenDist} onChange={setScreenDist} min={0.5} max={5} step={0.1} label={`D = ${screenDist.toFixed(1)} m`} />
                        </ControlGroup>
                        <Toggle value={showIntensity} onChange={setShowIntensity} label="Show Intensity Pattern" />
                        <Toggle value={showWavefronts} onChange={setShowWavefronts} label="Show Wavefronts" />
                        <Toggle value={showMinima} onChange={setShowMinima} label="Show Minima Markers" />
                        <Toggle value={showEnvelope} onChange={setShowEnvelope} label="Show Intensity Envelope" />
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
