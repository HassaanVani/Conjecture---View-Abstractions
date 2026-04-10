import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'

const H = 6.626e-34
const C = 3e8
const KB = 1.381e-23
const SIGMA = 5.670e-8
const WIEN_B = 2.898e-3

function planck(lambdaM: number, T: number): number {
    const a = (2 * H * C * C) / Math.pow(lambdaM, 5)
    const exponent = (H * C) / (lambdaM * KB * T)
    if (exponent > 500) return 0
    return a / (Math.exp(exponent) - 1)
}

function rayleighJeans(lambdaM: number, T: number): number {
    return (2 * C * KB * T) / Math.pow(lambdaM, 4)
}

function tempToGlowColor(T: number): string {
    // Approximate blackbody color for display
    // Using simplified Planckian locus approximation
    const t = T / 100
    let r: number, g: number, b: number

    // Red
    if (t <= 66) r = 255
    else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); r = Math.min(255, Math.max(0, r)) }

    // Green
    if (t <= 66) { g = 99.4708025861 * Math.log(t) - 161.1195681661; g = Math.min(255, Math.max(0, g)) }
    else { g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); g = Math.min(255, Math.max(0, g)) }

    // Blue
    if (t >= 66) b = 255
    else if (t <= 19) b = 0
    else { b = 138.5177312231 * Math.log(t - 10) - 305.0447927307; b = Math.min(255, Math.max(0, b)) }

    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`
}

export default function BlackbodyRadiation() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [temperature, setTemperature] = useState(5500)
    const [showMultiple, setShowMultiple] = useState(false)
    const [showWien, setShowWien] = useState(true)
    const [showClassical, setShowClassical] = useState(false)
    const [showUVCatastrophe, setShowUVCatastrophe] = useState(false)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)

    const calcPhysics = useCallback(() => {
        const peakWavelength = WIEN_B / temperature // meters
        const peakWavelengthNm = peakWavelength * 1e9
        const totalPower = SIGMA * Math.pow(temperature, 4) // W/m^2
        const peakFreq = C / peakWavelength
        const peakPhotonEnergy = H * peakFreq / 1.602e-19 // eV
        const glowColor = tempToGlowColor(temperature)

        return { peakWavelength, peakWavelengthNm, totalPower, peakFreq, peakPhotonEnergy, glowColor }
    }, [temperature])

    const reset = useCallback(() => {
        setTemperature(5500)
        setShowMultiple(false)
        setShowWien(true)
        setShowClassical(false)
        setShowUVCatastrophe(false)
        setPaused(false)
        timeRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'Blackbody Radiation', description: 'A blackbody is an idealized object that absorbs all radiation and emits a characteristic spectrum depending only on its temperature. Every hot object emits this radiation.', setup: () => { reset(); setTemperature(5500) } },
        { title: 'Hotter = Brighter + Bluer', description: 'As temperature increases, the spectrum shifts to shorter wavelengths (bluer) and the total radiated power increases dramatically. The Sun at 5778K peaks in visible light.', setup: () => { setShowMultiple(true); setTemperature(6000) } },
        { title: "Wien's Displacement Law", description: "The peak wavelength is inversely proportional to temperature: lambda_max * T = 2.898 x 10^-3 m*K. This is why red-hot objects are cooler than white-hot ones.", setup: () => { setShowMultiple(false); setShowWien(true); setTemperature(4000) } },
        { title: 'Stefan-Boltzmann Law', description: 'Total radiated power per unit area goes as T^4: P = sigma * T^4. Doubling the temperature increases power by 16x. This is why stars of different temperatures have vastly different luminosities.', setup: () => { setShowMultiple(true); setTemperature(5500) } },
        { title: 'The UV Catastrophe', description: 'Classical physics (Rayleigh-Jeans law) predicted infinite energy at short wavelengths -- the "ultraviolet catastrophe." The prediction diverges wildly from observation at short wavelengths.', setup: () => { setShowClassical(true); setShowUVCatastrophe(true); setShowMultiple(false); setTemperature(5000) } },
        { title: "Planck's Quantum Solution", description: "Max Planck resolved the UV catastrophe by proposing that energy is emitted in discrete quanta: E = hf. This was the birth of quantum mechanics. Planck's law perfectly matches all observations.", setup: () => { setShowClassical(true); setShowUVCatastrophe(true); setTemperature(5000) } },
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

        // Wavelength range for plot: 100nm to 3000nm
        const LAMBDA_MIN = 100e-9
        const LAMBDA_MAX = 3000e-9

        const draw = () => {
            if (!paused) timeRef.current += 0.016
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            // Plot area
            const plotLeft = 80
            const plotRight = w - 40
            const plotTop = 40
            const plotBot = h - 100
            const plotW = plotRight - plotLeft
            const plotH = plotBot - plotTop

            // Glowing object (bottom-right area)
            const objX = w - 140
            const objY = h - 50
            const objSize = 60
            const glowColor = tempToGlowColor(temperature)

            // Object glow
            const objGlow = ctx.createRadialGradient(objX, objY, 0, objX, objY, objSize * 1.5)
            objGlow.addColorStop(0, glowColor)
            objGlow.addColorStop(0.5, glowColor.replace('rgb', 'rgba').replace(')', ', 0.3)'))
            objGlow.addColorStop(1, 'transparent')
            ctx.fillStyle = objGlow
            ctx.beginPath(); ctx.arc(objX, objY, objSize * 1.5, 0, Math.PI * 2); ctx.fill()

            ctx.fillStyle = glowColor
            ctx.fillRect(objX - objSize / 2, objY - objSize / 2, objSize, objSize)

            // Temperature label on object
            ctx.fillStyle = temperature > 4000 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)'
            ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(`${temperature} K`, objX, objY + 4)

            // Plot axes
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(plotLeft, plotTop); ctx.lineTo(plotLeft, plotBot); ctx.lineTo(plotRight, plotBot)
            ctx.stroke()

            // Axis labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.font = '11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Wavelength (nm)', (plotLeft + plotRight) / 2, plotBot + 35)
            ctx.save()
            ctx.translate(15, (plotTop + plotBot) / 2)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Spectral Radiance (arb.)', 0, 0)
            ctx.restore()

            // Wavelength ticks
            const tickWavelengths = [200, 400, 600, 800, 1000, 1500, 2000, 2500, 3000]
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
            ctx.font = '9px system-ui'; ctx.textAlign = 'center'
            tickWavelengths.forEach(nmVal => {
                const x = plotLeft + (nmVal * 1e-9 - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN) * plotW
                if (x > plotLeft && x < plotRight) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
                    ctx.beginPath(); ctx.moveTo(x, plotBot); ctx.lineTo(x, plotTop); ctx.stroke()
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
                    ctx.fillText(`${nmVal}`, x, plotBot + 15)
                }
            })

            // Visible light band on x-axis
            const vis380x = plotLeft + (380e-9 - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN) * plotW
            const vis780x = plotLeft + (780e-9 - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN) * plotW
            const visGrad = ctx.createLinearGradient(vis380x, 0, vis780x, 0)
            visGrad.addColorStop(0, 'rgba(100, 0, 255, 0.15)')
            visGrad.addColorStop(0.15, 'rgba(0, 0, 255, 0.15)')
            visGrad.addColorStop(0.3, 'rgba(0, 255, 255, 0.15)')
            visGrad.addColorStop(0.45, 'rgba(0, 255, 0, 0.15)')
            visGrad.addColorStop(0.6, 'rgba(255, 255, 0, 0.15)')
            visGrad.addColorStop(0.8, 'rgba(255, 150, 0, 0.15)')
            visGrad.addColorStop(1, 'rgba(255, 0, 0, 0.15)')
            ctx.fillStyle = visGrad
            ctx.fillRect(vis380x, plotTop, vis780x - vis380x, plotH)

            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
            ctx.font = '9px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Visible', (vis380x + vis780x) / 2, plotBot + 25)

            // UV catastrophe region highlight
            if (showUVCatastrophe) {
                const uvEndX = plotLeft + (400e-9 - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN) * plotW
                ctx.fillStyle = 'rgba(255, 50, 50, 0.08)'
                ctx.fillRect(plotLeft, plotTop, uvEndX - plotLeft, plotH)
                ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
                ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('UV Catastrophe', (plotLeft + uvEndX) / 2, plotTop + 15)
                ctx.fillText('Region', (plotLeft + uvEndX) / 2, plotTop + 27)
            }

            // Determine temperatures to plot
            const temps = showMultiple
                ? [2000, 3000, 4000, 5000, 6000, 8000, 10000].filter(t => Math.abs(t - temperature) > 300)
                    .concat([temperature]).sort((a, b) => a - b)
                : [temperature]

            // Find global max for normalization
            let globalMax = 0
            const nPoints = 300
            temps.forEach(T => {
                for (let i = 0; i < nPoints; i++) {
                    const lambda = LAMBDA_MIN + (i / nPoints) * (LAMBDA_MAX - LAMBDA_MIN)
                    const val = planck(lambda, T)
                    if (val > globalMax) globalMax = val
                }
            })

            // Draw Planck curves
            temps.forEach(T => {
                const isMain = T === temperature
                const curveColor = isMain ? glowColor : tempToGlowColor(T)
                ctx.strokeStyle = isMain
                    ? curveColor
                    : curveColor.replace('rgb', 'rgba').replace(')', ', 0.4)')
                ctx.lineWidth = isMain ? 2.5 : 1.5
                ctx.beginPath()

                for (let i = 0; i < nPoints; i++) {
                    const lambda = LAMBDA_MIN + (i / nPoints) * (LAMBDA_MAX - LAMBDA_MIN)
                    const val = planck(lambda, T)
                    const x = plotLeft + (i / nPoints) * plotW
                    const y = plotBot - (val / globalMax) * plotH * 0.9
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                }
                ctx.stroke()

                // Temperature label at peak
                const peakLambda = WIEN_B / T
                const peakX = plotLeft + (peakLambda - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN) * plotW
                const peakVal = planck(peakLambda, T)
                const peakY = plotBot - (peakVal / globalMax) * plotH * 0.9
                if (peakX > plotLeft && peakX < plotRight) {
                    ctx.fillStyle = isMain ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'
                    ctx.font = isMain ? 'bold 11px system-ui' : '9px system-ui'
                    ctx.textAlign = 'left'
                    ctx.fillText(`${T} K`, peakX + 5, peakY - 5)
                }
            })

            // Wien's displacement line
            if (showWien) {
                const peakLambda = WIEN_B / temperature
                const peakX = plotLeft + (peakLambda - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN) * plotW
                if (peakX > plotLeft && peakX < plotRight) {
                    ctx.setLineDash([4, 4])
                    ctx.strokeStyle = 'rgba(255, 220, 100, 0.6)'
                    ctx.lineWidth = 1.5
                    ctx.beginPath(); ctx.moveTo(peakX, plotTop); ctx.lineTo(peakX, plotBot); ctx.stroke()
                    ctx.setLineDash([])

                    ctx.fillStyle = 'rgba(255, 220, 100, 0.8)'
                    ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText(`lambda_max = ${(peakLambda * 1e9).toFixed(0)} nm`, peakX, plotTop - 8)
                }
            }

            // Classical Rayleigh-Jeans curve
            if (showClassical) {
                ctx.strokeStyle = 'rgba(255, 80, 80, 0.7)'
                ctx.lineWidth = 2
                ctx.setLineDash([6, 4])
                ctx.beginPath()

                let clipped = false
                for (let i = 0; i < nPoints; i++) {
                    const lambda = LAMBDA_MIN + (i / nPoints) * (LAMBDA_MAX - LAMBDA_MIN)
                    let val = rayleighJeans(lambda, temperature)
                    // Clip to visible area
                    const yVal = plotBot - (val / globalMax) * plotH * 0.9
                    const x = plotLeft + (i / nPoints) * plotW
                    if (yVal < plotTop - 50) { clipped = true; continue }
                    if (clipped) { ctx.moveTo(x, Math.max(yVal, plotTop)); clipped = false }
                    else if (i === 0) ctx.moveTo(x, Math.max(yVal, plotTop))
                    else ctx.lineTo(x, Math.max(yVal, plotTop))
                }
                ctx.stroke()
                ctx.setLineDash([])

                // Label
                ctx.fillStyle = 'rgba(255, 80, 80, 0.7)'
                ctx.font = '10px system-ui'; ctx.textAlign = 'right'
                ctx.fillText('Rayleigh-Jeans (classical)', plotRight - 10, plotTop + 15)
            }

            // Legend for main curve
            ctx.fillStyle = glowColor
            ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'right'
            ctx.fillText('Planck (quantum)', plotRight - 10, plotTop + (showClassical ? 30 : 15))

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [temperature, showMultiple, showWien, showClassical, showUVCatastrophe, paused])

    const phys = calcPhysics()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 15" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Blackbody Properties"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'Temperature', value: `${temperature}`, unit: 'K', color: phys.glowColor },
                                { label: 'Peak lambda', value: phys.peakWavelengthNm.toFixed(0), unit: 'nm', color: 'rgb(255, 220, 100)' },
                                { label: 'Peak energy', value: phys.peakPhotonEnergy.toFixed(2), unit: 'eV' },
                                { label: 'Total power', value: phys.totalPower < 1e6 ? phys.totalPower.toFixed(0) : (phys.totalPower / 1e6).toFixed(1) + 'M', unit: 'W/m^2', color: 'rgb(255, 150, 100)' },
                                { label: 'Color', value: phys.peakWavelengthNm < 380 ? 'UV' : phys.peakWavelengthNm > 780 ? 'IR' : 'Visible', color: phys.glowColor },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-[340px] max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: "Wien's Law", expression: 'lambda_max = b / T', description: 'b = 2.898 x 10^-3 m*K' },
                                { label: 'Stefan-Boltzmann', expression: 'P = sigma * A * T^4', description: 'sigma = 5.67 x 10^-8 W/m^2K^4' },
                                { label: 'Planck', expression: 'E = hf', description: 'Energy is quantized' },
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
                        <ControlGroup label="Temperature">
                            <Slider value={temperature} onChange={setTemperature} min={1000} max={10000} step={100} label={`T = ${temperature} K`} />
                        </ControlGroup>

                        <Toggle value={showMultiple} onChange={setShowMultiple} label="Show Multiple Temperatures" />
                        <Toggle value={showWien} onChange={setShowWien} label="Wien's Displacement Line" />
                        <Toggle value={showClassical} onChange={setShowClassical} label="Classical (Rayleigh-Jeans)" />
                        <Toggle value={showUVCatastrophe} onChange={setShowUVCatastrophe} label="UV Catastrophe Region" />
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
