import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

interface Particle {
    x: number
    y: number
    alpha: number
}

const H = 6.626e-34
const ME = 9.109e-31

export default function WaveParticleDuality() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [particleType, setParticleType] = useState<string>('electron')
    const [slitSeparation, setSlitSeparation] = useState(50)
    const [slitWidth, setSlitWidth] = useState(10)
    const [energy, setEnergy] = useState(50)
    const [rate, setRate] = useState(20)
    const [showWaveOverlay, setShowWaveOverlay] = useState(false)
    const [singleParticle, setSingleParticle] = useState(false)
    const [paused, setPaused] = useState(false)
    const detectedRef = useRef<Particle[]>([])
    const timeRef = useRef(0)
    const lastEmitRef = useRef(0)
    const flyingRef = useRef<{ x: number; y: number; vy: number; targetY: number; speed: number }[]>([])

    const calcPhysics = useCallback(() => {
        // Energy parameter maps to eV for electrons, nm wavelength for photons
        let wavelength: number
        let momentum: number
        if (particleType === 'electron') {
            // energy slider -> kinetic energy in eV (1-200 eV)
            const KE = energy * 2 // 2-400 eV
            const KEJ = KE * 1.602e-19
            momentum = Math.sqrt(2 * ME * KEJ)
            wavelength = H / momentum // meters
        } else {
            // photon: energy slider maps to wavelength 100-700 nm
            wavelength = (700 - energy * 6) * 1e-9
            if (wavelength < 100e-9) wavelength = 100e-9
            momentum = H / wavelength
        }

        const wavelengthNm = wavelength * 1e9
        const wavelengthPm = wavelength * 1e12
        // Double-slit: d sin(theta) = m*lambda, fringe spacing ~ lambda*L/d
        const dMeters = slitSeparation * 1e-9 // slit sep in nm -> meters
        const L = 1 // screen 1m away (conceptual)
        const fringeSpacing = wavelength * L / dMeters // meters
        const fringeSpacingMm = fringeSpacing * 1e3

        return { wavelength, wavelengthNm, wavelengthPm, momentum, fringeSpacing, fringeSpacingMm, dMeters }
    }, [particleType, energy, slitSeparation])

    // Compute intensity pattern |psi|^2 for double slit
    const getIntensityAtY = useCallback((yFrac: number) => {
        // yFrac: -1 to 1 centered on screen
        const phys = calcPhysics()
        const lambda = phys.wavelength
        const d = phys.dMeters
        const a = slitWidth * 1e-9 // slit width in meters

        // theta approximation for screen position
        const theta = yFrac * 0.05 // small angle
        const sinTheta = Math.sin(theta)

        // Double slit: I = I0 * cos^2(pi*d*sin(theta)/lambda) * sinc^2(pi*a*sin(theta)/lambda)
        const alpha = Math.PI * a * sinTheta / lambda
        const beta = Math.PI * d * sinTheta / lambda
        const sinc = alpha === 0 ? 1 : Math.sin(alpha) / alpha
        const envelope = sinc * sinc
        const interference = Math.cos(beta) * Math.cos(beta)

        return envelope * interference
    }, [calcPhysics, slitWidth])

    const reset = useCallback(() => {
        setParticleType('electron')
        setSlitSeparation(50)
        setSlitWidth(10)
        setEnergy(50)
        setRate(20)
        setShowWaveOverlay(false)
        setSingleParticle(false)
        setPaused(false)
        detectedRef.current = []
        flyingRef.current = []
        timeRef.current = 0
        lastEmitRef.current = 0
    }, [])

    const clearScreen = useCallback(() => {
        detectedRef.current = []
    }, [])

    const demoSteps = [
        { title: 'Wave-Particle Duality', description: 'Quantum objects like electrons and photons exhibit both wave and particle properties. When detected, they appear as individual dots. But their distribution follows a wave interference pattern.', setup: () => { reset(); setEnergy(50); setRate(30) } },
        { title: 'De Broglie Wavelength', description: 'Louis de Broglie proposed that all matter has a wavelength: lambda = h/p. For electrons, higher energy means shorter wavelength and tighter fringe spacing.', setup: () => { setParticleType('electron'); setEnergy(30); setShowWaveOverlay(true) } },
        { title: 'Double-Slit with Electrons', description: 'Electrons are fired at two narrow slits. Each electron hits the screen at a single point, but over time an interference pattern emerges -- just like waves!', setup: () => { clearScreen(); setRate(40); setShowWaveOverlay(false); setSingleParticle(false) } },
        { title: 'Pattern Builds Over Time', description: 'Watch the dots accumulate. At first, they seem random. But gradually, bright and dark fringes appear. The probability of landing at each position follows |psi|^2.', setup: () => { clearScreen(); setRate(50); setSingleParticle(false) } },
        { title: 'Single Particle -- Still Interferes!', description: 'Even when particles are sent one at a time, the interference pattern still builds up. Each particle interferes with itself, passing through both slits simultaneously as a wave.', setup: () => { clearScreen(); setSingleParticle(true); setRate(5) } },
        { title: 'Wavelength Depends on Momentum', description: 'Higher momentum means shorter wavelength and more closely spaced fringes. Try changing the energy to see how the pattern changes.', setup: () => { setSingleParticle(false); setRate(30); setShowWaveOverlay(true) } },
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

            // Layout: source on left, slits in middle, screen on right
            const sourceX = w * 0.08
            const slitX = w * 0.4
            const screenX = w * 0.75
            const screenW = 6
            const cy = h / 2

            // Draw source
            const sourceGlow = ctx.createRadialGradient(sourceX, cy, 0, sourceX, cy, 30)
            sourceGlow.addColorStop(0, particleType === 'electron' ? 'rgba(100, 180, 255, 0.6)' : 'rgba(255, 220, 100, 0.6)')
            sourceGlow.addColorStop(1, 'transparent')
            ctx.fillStyle = sourceGlow
            ctx.beginPath(); ctx.arc(sourceX, cy, 30, 0, Math.PI * 2); ctx.fill()

            ctx.fillStyle = particleType === 'electron' ? 'rgba(100, 180, 255, 1)' : 'rgba(255, 220, 100, 1)'
            ctx.beginPath(); ctx.arc(sourceX, cy, 8, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(particleType === 'electron' ? 'e-' : 'gamma', sourceX, cy + 3)

            // Draw barrier with slits
            const barrierTop = h * 0.05
            const barrierBot = h * 0.95
            const slitHalfSep = (slitSeparation / 100) * h * 0.2
            const slitHalfW = (slitWidth / 40) * h * 0.02 + 2

            ctx.fillStyle = 'rgba(80, 80, 120, 0.7)'
            // Top section
            ctx.fillRect(slitX - 4, barrierTop, 8, (cy - slitHalfSep - slitHalfW) - barrierTop)
            // Middle section between slits
            ctx.fillRect(slitX - 4, cy - slitHalfSep + slitHalfW, 8, 2 * (slitHalfSep - slitHalfW))
            // Bottom section
            ctx.fillRect(slitX - 4, cy + slitHalfSep + slitHalfW, 8, barrierBot - (cy + slitHalfSep + slitHalfW))

            // Slit labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.font = '10px system-ui'; ctx.textAlign = 'left'
            ctx.fillText('Slit 1', slitX + 10, cy - slitHalfSep)
            ctx.fillText('Slit 2', slitX + 10, cy + slitHalfSep)

            // Draw detection screen
            ctx.fillStyle = 'rgba(40, 40, 60, 0.8)'
            ctx.fillRect(screenX - screenW / 2, barrierTop, screenW, barrierBot - barrierTop)

            // Draw wave overlay (probability distribution)
            if (showWaveOverlay) {
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.5)'
                ctx.lineWidth = 2
                ctx.beginPath()
                const screenHeight = barrierBot - barrierTop
                for (let py = 0; py <= screenHeight; py += 1) {
                    const yFrac = (py / screenHeight - 0.5) * 2
                    const intensity = getIntensityAtY(yFrac)
                    const barW = intensity * 80
                    const screenY = barrierTop + py
                    if (py === 0) ctx.moveTo(screenX + screenW / 2 + barW, screenY)
                    else ctx.lineTo(screenX + screenW / 2 + barW, screenY)
                }
                ctx.stroke()

                // Fill the probability curve
                ctx.fillStyle = 'rgba(160, 100, 255, 0.08)'
                ctx.beginPath()
                ctx.moveTo(screenX + screenW / 2, barrierTop)
                for (let py = 0; py <= screenHeight; py += 1) {
                    const yFrac = (py / screenHeight - 0.5) * 2
                    const intensity = getIntensityAtY(yFrac)
                    const barW = intensity * 80
                    ctx.lineTo(screenX + screenW / 2 + barW, barrierTop + py)
                }
                ctx.lineTo(screenX + screenW / 2, barrierBot)
                ctx.closePath()
                ctx.fill()
            }

            // Emit particles
            if (!paused) {
                const emitInterval = singleParticle ? (flyingRef.current.length > 0 ? Infinity : 0.3) : (1 / rate)
                if (t - lastEmitRef.current >= emitInterval) {
                    // Sample target Y from |psi|^2 distribution using rejection sampling
                    const screenHeight = barrierBot - barrierTop
                    let targetY = cy
                    for (let attempt = 0; attempt < 50; attempt++) {
                        const candidateYFrac = (Math.random() - 0.5) * 2
                        const prob = getIntensityAtY(candidateYFrac)
                        if (Math.random() < prob) {
                            targetY = barrierTop + (candidateYFrac * 0.5 + 0.5) * screenHeight
                            break
                        }
                    }

                    flyingRef.current.push({
                        x: sourceX + 15,
                        y: cy + (Math.random() - 0.5) * 10,
                        vy: 0,
                        targetY,
                        speed: 3 + Math.random() * 2,
                    })
                    lastEmitRef.current = t
                }

                // Update flying particles
                for (let i = flyingRef.current.length - 1; i >= 0; i--) {
                    const p = flyingRef.current[i]

                    if (p.x < slitX) {
                        // Before slits: fly straight
                        p.x += p.speed
                    } else {
                        // After slits: curve toward target
                        p.x += p.speed
                        const remainDist = screenX - p.x
                        if (remainDist > 0) {
                            p.y += (p.targetY - p.y) * (p.speed / remainDist) * 0.5
                        }
                    }

                    if (p.x >= screenX) {
                        // Hit the screen
                        detectedRef.current.push({ x: screenX, y: p.targetY, alpha: 1 })
                        flyingRef.current.splice(i, 1)
                    }
                }
            }

            // Draw flying particles
            const pColor = particleType === 'electron' ? 'rgba(100, 180, 255,' : 'rgba(255, 220, 100,'
            flyingRef.current.forEach(p => {
                ctx.fillStyle = pColor + '0.9)'
                ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill()

                // Glow
                const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8)
                glow.addColorStop(0, pColor + '0.4)')
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill()
            })

            // Draw detected particles on screen
            detectedRef.current.forEach(p => {
                const dotColor = particleType === 'electron' ? `rgba(120, 200, 255, ${p.alpha})` : `rgba(255, 230, 120, ${p.alpha})`
                ctx.fillStyle = dotColor
                ctx.beginPath()
                ctx.arc(p.x + (Math.random() - 0.5) * 3, p.y, 1.2, 0, Math.PI * 2)
                ctx.fill()
            })

            // Draw accumulated histogram on far right
            if (detectedRef.current.length > 10) {
                const histX = screenX + 20
                const bins = 80
                const screenHeight = barrierBot - barrierTop
                const binSize = screenHeight / bins
                const counts = new Array(bins).fill(0)
                detectedRef.current.forEach(p => {
                    const bin = Math.floor((p.y - barrierTop) / binSize)
                    if (bin >= 0 && bin < bins) counts[bin]++
                })
                const maxCount = Math.max(...counts, 1)

                ctx.fillStyle = 'rgba(160, 100, 255, 0.15)'
                counts.forEach((c, i) => {
                    const barW = (c / maxCount) * 60
                    ctx.fillRect(histX, barrierTop + i * binSize, barW, binSize)
                })

                ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'
                ctx.lineWidth = 1
                ctx.beginPath()
                counts.forEach((c, i) => {
                    const barW = (c / maxCount) * 60
                    const py = barrierTop + i * binSize + binSize / 2
                    if (i === 0) ctx.moveTo(histX + barW, py)
                    else ctx.lineTo(histX + barW, py)
                })
                ctx.stroke()
            }

            // Labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.font = '11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Source', sourceX, cy + 50)
            ctx.fillText('Double Slit', slitX, barrierTop - 8)
            ctx.fillText('Detection Screen', screenX, barrierTop - 8)

            // Particle counter
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.font = '12px system-ui'; ctx.textAlign = 'left'
            ctx.fillText(`Particles detected: ${detectedRef.current.length}`, 10, h - 10)

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [particleType, slitSeparation, slitWidth, energy, rate, showWaveOverlay, singleParticle, paused, getIntensityAtY, calcPhysics])

    const phys = calcPhysics()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 15" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Wave-Particle Duality"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'Particle', value: particleType === 'electron' ? 'Electron' : 'Photon' },
                                { label: 'de Broglie lambda', value: particleType === 'electron' ? phys.wavelengthPm.toFixed(1) : phys.wavelengthNm.toFixed(1), unit: particleType === 'electron' ? 'pm' : 'nm', color: 'rgb(160, 200, 255)' },
                                { label: 'Momentum', value: (phys.momentum * 1e27).toFixed(3), unit: 'x10^-27 kg m/s' },
                                { label: 'Particles', value: detectedRef.current.length.toString(), color: 'rgb(100, 255, 150)' },
                                { label: 'Fringe spacing', value: phys.fringeSpacingMm.toFixed(2), unit: 'mm' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-[340px] max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'de Broglie', expression: 'lambda = h / p', description: 'Wavelength from momentum' },
                                { label: 'Matter', expression: 'p = mv', description: 'Momentum of massive particles' },
                                { label: 'Photon', expression: 'p = h / lambda = hf / c' },
                                { label: 'Double slit', expression: 'd sin(theta) = m lambda', description: 'Constructive interference' },
                                { label: 'Energy', expression: 'E = hf', description: 'Photon energy' },
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
                        <ControlGroup label="Particle Type">
                            <ButtonGroup
                                value={particleType}
                                onChange={(v) => { setParticleType(v); clearScreen() }}
                                options={[
                                    { value: 'electron', label: 'Electron' },
                                    { value: 'photon', label: 'Photon' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Slit Separation">
                            <Slider value={slitSeparation} onChange={v => { setSlitSeparation(v); clearScreen() }} min={10} max={200} step={5} label={`d = ${slitSeparation} nm`} />
                        </ControlGroup>

                        <ControlGroup label="Slit Width">
                            <Slider value={slitWidth} onChange={v => { setSlitWidth(v); clearScreen() }} min={2} max={40} step={1} label={`a = ${slitWidth} nm`} />
                        </ControlGroup>

                        <ControlGroup label={particleType === 'electron' ? 'Electron Energy' : 'Photon Energy'}>
                            <Slider value={energy} onChange={v => { setEnergy(v); clearScreen() }} min={1} max={100} step={1} label={particleType === 'electron' ? `KE = ${(energy * 2).toFixed(0)} eV` : `lambda = ${(700 - energy * 6).toFixed(0)} nm`} />
                        </ControlGroup>

                        <ControlGroup label="Particle Rate">
                            <Slider value={rate} onChange={setRate} min={1} max={60} step={1} label={`${rate} per second`} />
                        </ControlGroup>

                        <Toggle value={showWaveOverlay} onChange={setShowWaveOverlay} label="Show Probability Wave" />
                        <Toggle value={singleParticle} onChange={(v) => { setSingleParticle(v); if (v) setRate(5) }} label="Single Particle Mode" />
                        <Toggle value={paused} onChange={setPaused} label="Pause Animation" />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={clearScreen} variant="secondary">Clear</Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
