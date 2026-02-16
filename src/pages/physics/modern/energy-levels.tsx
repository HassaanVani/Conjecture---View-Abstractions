import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup, Select } from '@/components/control-panel'

type Element = 'H' | 'He+' | 'Li2+'
type PhotonMode = 'emission' | 'absorption'

interface Transition {
    from: number
    to: number
    progress: number
    mode: PhotonMode
}

const Z_MAP: Record<Element, number> = { 'H': 1, 'He+': 2, 'Li2+': 3 }

function wavelengthToColor(nm: number): string {
    if (nm < 380) return 'rgb(120, 80, 255)' // UV - shown as violet
    if (nm < 440) return `rgb(${Math.round(120 + (440 - nm) / 60 * 135)}, 0, 255)`
    if (nm < 490) return `rgb(0, ${Math.round((nm - 440) / 50 * 255)}, 255)`
    if (nm < 510) return `rgb(0, 255, ${Math.round(255 - (nm - 490) / 20 * 255)})`
    if (nm < 580) return `rgb(${Math.round((nm - 510) / 70 * 255)}, 255, 0)`
    if (nm < 645) return `rgb(255, ${Math.round(255 - (nm - 580) / 65 * 255)}, 0)`
    if (nm < 780) return 'rgb(255, 0, 0)'
    return 'rgb(180, 0, 0)' // IR
}

export default function EnergyLevels() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [element, setElement] = useState<Element>('H')
    const [nUpper, setNUpper] = useState(3)
    const [nLower, setNLower] = useState(1)
    const [photonMode, setPhotonMode] = useState<PhotonMode>('emission')
    const [showBohr, setShowBohr] = useState(true)
    const [showSpectrum, setShowSpectrum] = useState(true)
    const [autoTransition, setAutoTransition] = useState(false)
    const timeRef = useRef(0)
    const transitionsRef = useRef<Transition[]>([])

    const Z = Z_MAP[element]

    const energyLevel = useCallback((n: number) => {
        return -13.6 * Z * Z / (n * n)
    }, [Z])

    const calcTransition = useCallback(() => {
        const eUpper = energyLevel(nUpper)
        const eLower = energyLevel(nLower)
        const deltaE = Math.abs(eUpper - eLower)
        const wavelength = 1240 / deltaE // nm (from E = hc/lambda with hc = 1240 eV*nm)
        const frequency = (3e8) / (wavelength * 1e-9) // Hz
        return { deltaE, wavelength, frequency, eUpper, eLower }
    }, [nUpper, nLower, energyLevel])

    const triggerTransition = useCallback(() => {
        transitionsRef.current.push({
            from: photonMode === 'emission' ? nUpper : nLower,
            to: photonMode === 'emission' ? nLower : nUpper,
            progress: 0,
            mode: photonMode,
        })
    }, [nUpper, nLower, photonMode])

    const reset = useCallback(() => {
        setElement('H')
        setNUpper(3)
        setNLower(1)
        setPhotonMode('emission')
        setShowBohr(true)
        setShowSpectrum(true)
        setAutoTransition(false)
        timeRef.current = 0
        transitionsRef.current = []
    }, [])

    const demoSteps = [
        { title: 'Atomic Energy Levels', description: 'Electrons in atoms occupy discrete energy levels, labeled by quantum number n. The energy is quantized: only specific values are allowed. This is the foundation of quantum mechanics.', setup: () => reset() },
        { title: 'The Bohr Model', description: 'Bohr modeled electrons orbiting the nucleus in circular paths. Each orbit has a specific radius r_n = n^2 * a_0 / Z and energy E_n = -13.6 * Z^2 / n^2 eV.', setup: () => { setElement('H'); setShowBohr(true) } },
        { title: 'Emission', description: 'When an electron drops from a higher level to a lower one, it emits a photon. The photon energy equals the energy difference: E_photon = E_upper - E_lower.', setup: () => { setPhotonMode('emission'); setNUpper(3); setNLower(1); triggerTransition() } },
        { title: 'Absorption', description: 'An electron can absorb a photon and jump to a higher level, but ONLY if the photon energy exactly matches the gap. This creates absorption lines in spectra.', setup: () => { setPhotonMode('absorption'); setNUpper(3); setNLower(1); triggerTransition() } },
        { title: 'The Hydrogen Spectrum', description: 'Hydrogen produces specific spectral lines. The Lyman series (to n=1) is UV. The Balmer series (to n=2) is visible. The Paschen series (to n=3) is infrared.', setup: () => { setElement('H'); setShowSpectrum(true); setNUpper(4); setNLower(2) } },
        { title: 'Hydrogen-like Ions', description: 'He+ (Z=2) and Li2+ (Z=3) have the same level structure but energies scale as Z^2. Higher Z means deeper energy wells and higher-energy photons.', setup: () => { setElement('He+'); setNUpper(3); setNLower(1) } },
        { title: 'Energy-Wavelength Relation', description: 'E = hf = hc/lambda. Higher energy transitions produce shorter wavelength (bluer) photons. The color of emitted light directly reveals the energy gap.', setup: () => { setElement('H'); setShowSpectrum(true); setNUpper(2); setNLower(1) } },
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
        let lastAutoEmit = 0

        const draw = () => {
            timeRef.current += 0.016
            const t = timeRef.current
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const trans = calcTransition()

            // Auto transition
            if (autoTransition && t - lastAutoEmit > 1.5) {
                transitionsRef.current.push({
                    from: photonMode === 'emission' ? nUpper : nLower,
                    to: photonMode === 'emission' ? nLower : nUpper,
                    progress: 0,
                    mode: photonMode,
                })
                lastAutoEmit = t
            }

            // Update transitions
            transitionsRef.current = transitionsRef.current.filter(tr => {
                tr.progress += 0.02
                return tr.progress < 1
            })

            // ---- LEFT: Bohr Model ----
            if (showBohr) {
                const bohrCx = w * 0.25
                const bohrCy = h * 0.45
                const maxR = Math.min(w * 0.22, h * 0.38)

                // Nucleus
                const nucleusGlow = ctx.createRadialGradient(bohrCx, bohrCy, 0, bohrCx, bohrCy, 20)
                nucleusGlow.addColorStop(0, 'rgba(255, 100, 100, 0.8)')
                nucleusGlow.addColorStop(1, 'transparent')
                ctx.fillStyle = nucleusGlow
                ctx.beginPath(); ctx.arc(bohrCx, bohrCy, 20, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
                ctx.beginPath(); ctx.arc(bohrCx, bohrCy, 8, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'white'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
                ctx.fillText(`Z=${Z}`, bohrCx, bohrCy)
                ctx.textBaseline = 'alphabetic'

                // Orbits
                for (let n = 1; n <= 6; n++) {
                    const r = (n * n / 36) * maxR
                    const isActive = n === nUpper || n === nLower
                    ctx.strokeStyle = isActive ? 'rgba(160, 100, 255, 0.5)' : 'rgba(160, 100, 255, 0.12)'
                    ctx.lineWidth = isActive ? 2 : 1
                    ctx.beginPath(); ctx.arc(bohrCx, bohrCy, r, 0, Math.PI * 2); ctx.stroke()
                    ctx.fillStyle = isActive ? 'rgba(160, 100, 255, 0.7)' : 'rgba(160, 100, 255, 0.3)'
                    ctx.font = '10px system-ui'; ctx.textAlign = 'left'
                    ctx.fillText(`n=${n}`, bohrCx + r + 4, bohrCy - 4)
                }

                // Electron on current level (orbiting)
                const electronN = photonMode === 'emission' ? nUpper : nLower
                const eR = (electronN * electronN / 36) * maxR
                const eAngle = t * 2
                const ex = bohrCx + eR * Math.cos(eAngle)
                const ey = bohrCy + eR * Math.sin(eAngle)
                ctx.fillStyle = 'rgba(100, 200, 255, 1)'
                ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill()
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)'; ctx.lineWidth = 1
                ctx.beginPath(); ctx.arc(ex, ey, 8, 0, Math.PI * 2); ctx.stroke()

                // Photon arrows for transitions
                transitionsRef.current.forEach(tr => {
                    const fromR = (tr.from * tr.from / 36) * maxR
                    const toR = (tr.to * tr.to / 36) * maxR
                    const angle = Math.PI * 0.3
                    const r = fromR + (toR - fromR) * tr.progress
                    const px = bohrCx + r * Math.cos(angle)
                    const py = bohrCy + r * Math.sin(angle)
                    const color = wavelengthToColor(trans.wavelength)
                    ctx.fillStyle = color
                    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill()
                    // Wavy trail
                    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5
                    ctx.beginPath()
                    for (let i = 0; i < 15; i++) {
                        const tr2 = Math.max(0, tr.progress - i * 0.01)
                        const r2 = fromR + (toR - fromR) * tr2
                        const px2 = bohrCx + r2 * Math.cos(angle) + Math.sin(i * 2) * 3
                        const py2 = bohrCy + r2 * Math.sin(angle) + Math.cos(i * 2) * 3
                        if (i === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2)
                    }
                    ctx.stroke(); ctx.globalAlpha = 1
                })

                // Label
                ctx.fillStyle = 'rgba(160, 100, 255, 0.5)'
                ctx.font = '12px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('Bohr Model', bohrCx, h - 20)
            }

            // ---- RIGHT: Energy Level Diagram ----
            const lvlX = showBohr ? w * 0.55 : w * 0.15
            const lvlW = showBohr ? w * 0.35 : w * 0.7
            const lvlTop = 60
            const lvlBot = h - 80

            // Energy range: from E_1 (most negative) to 0
            const E1 = energyLevel(1)
            const eRange = Math.abs(E1) * 1.1

            const toY = (e: number) => lvlTop + ((0 - e) / eRange) * (lvlBot - lvlTop)

            // Draw levels
            for (let n = 1; n <= 6; n++) {
                const e = energyLevel(n)
                const y = toY(e)
                const isActive = n === nUpper || n === nLower
                ctx.strokeStyle = isActive ? 'rgba(160, 100, 255, 0.8)' : 'rgba(160, 100, 255, 0.25)'
                ctx.lineWidth = isActive ? 2.5 : 1.5
                ctx.beginPath(); ctx.moveTo(lvlX, y); ctx.lineTo(lvlX + lvlW, y); ctx.stroke()

                // Labels
                ctx.fillStyle = isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)'
                ctx.font = isActive ? 'bold 12px system-ui' : '11px system-ui'
                ctx.textAlign = 'right'
                ctx.fillText(`n=${n}`, lvlX - 8, y + 4)
                ctx.textAlign = 'left'
                ctx.fillText(`${e.toFixed(2)} eV`, lvlX + lvlW + 8, y + 4)
            }

            // Ionization level (E=0)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = 1; ctx.setLineDash([4, 4])
            ctx.beginPath(); ctx.moveTo(lvlX, toY(0)); ctx.lineTo(lvlX + lvlW, toY(0)); ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.font = '10px system-ui'; ctx.textAlign = 'left'
            ctx.fillText('E = 0 (ionized)', lvlX + lvlW + 8, toY(0) + 4)

            // Transition arrow
            const yUpper = toY(energyLevel(nUpper))
            const yLower = toY(energyLevel(nLower))
            const arrowX = lvlX + lvlW / 2
            const color = wavelengthToColor(trans.wavelength)

            if (photonMode === 'emission') {
                // Downward arrow
                ctx.strokeStyle = color; ctx.lineWidth = 3
                ctx.beginPath(); ctx.moveTo(arrowX, yUpper + 5); ctx.lineTo(arrowX, yLower - 5); ctx.stroke()
                ctx.fillStyle = color; ctx.beginPath()
                ctx.moveTo(arrowX, yLower - 5)
                ctx.lineTo(arrowX - 6, yLower - 15)
                ctx.lineTo(arrowX + 6, yLower - 15)
                ctx.closePath(); ctx.fill()
            } else {
                // Upward arrow
                ctx.strokeStyle = color; ctx.lineWidth = 3
                ctx.beginPath(); ctx.moveTo(arrowX, yLower - 5); ctx.lineTo(arrowX, yUpper + 5); ctx.stroke()
                ctx.fillStyle = color; ctx.beginPath()
                ctx.moveTo(arrowX, yUpper + 5)
                ctx.lineTo(arrowX - 6, yUpper + 15)
                ctx.lineTo(arrowX + 6, yUpper + 15)
                ctx.closePath(); ctx.fill()
            }

            // Photon info
            ctx.fillStyle = color; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left'
            ctx.fillText(`lambda = ${trans.wavelength.toFixed(1)} nm`, arrowX + 12, (yUpper + yLower) / 2 - 8)
            ctx.fillText(`E = ${trans.deltaE.toFixed(2)} eV`, arrowX + 12, (yUpper + yLower) / 2 + 8)

            // Spectrum bar at bottom
            if (showSpectrum) {
                const specY = h - 50
                const specH = 20
                // Draw visible spectrum background
                for (let nm = 380; nm < 780; nm++) {
                    const frac = (nm - 380) / 400
                    const x = lvlX + frac * lvlW
                    ctx.fillStyle = wavelengthToColor(nm)
                    ctx.globalAlpha = 0.3
                    ctx.fillRect(x, specY, lvlW / 400 + 1, specH)
                }
                ctx.globalAlpha = 1

                // Mark transition wavelength
                if (trans.wavelength >= 380 && trans.wavelength <= 780) {
                    const frac = (trans.wavelength - 380) / 400
                    const x = lvlX + frac * lvlW
                    ctx.fillStyle = color
                    ctx.fillRect(x - 2, specY - 5, 4, specH + 10)
                    ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText(`${trans.wavelength.toFixed(0)} nm`, x, specY - 10)
                }

                ctx.fillStyle = 'rgba(160, 100, 255, 0.4)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('Visible Spectrum (380-780 nm)', lvlX + lvlW / 2, specY + specH + 14)
            }

            ctx.fillStyle = 'rgba(160, 100, 255, 0.5)'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Energy Level Diagram', lvlX + lvlW / 2, 30)

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [element, nUpper, nLower, photonMode, showBohr, showSpectrum, autoTransition, energyLevel, calcTransition, Z])

    const trans = calcTransition()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 7" color="rgb(160, 100, 255)" />
                        <InfoPanel title="Transition" departmentColor="rgb(160, 100, 255)" items={[
                            { label: 'Element', value: element },
                            { label: 'Delta E', value: trans.deltaE.toFixed(3), unit: 'eV', color: 'rgb(160, 100, 255)' },
                            { label: 'Wavelength', value: trans.wavelength.toFixed(1), unit: 'nm', color: wavelengthToColor(trans.wavelength) },
                            { label: 'Frequency', value: (trans.frequency / 1e12).toFixed(1), unit: 'THz' },
                            { label: 'E_upper (n=' + nUpper + ')', value: trans.eUpper.toFixed(3), unit: 'eV' },
                            { label: 'E_lower (n=' + nLower + ')', value: trans.eLower.toFixed(3), unit: 'eV' },
                        ]} />
                    </div>
                    <div className="absolute bottom-4 left-4">
                        <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor="rgb(160, 100, 255)" />
                    </div>
                </div>
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ControlGroup label="Element">
                            <Select value={element} onChange={v => setElement(v as Element)} options={[
                                { value: 'H', label: 'Hydrogen (Z=1)' },
                                { value: 'He+', label: 'Helium+ (Z=2)' },
                                { value: 'Li2+', label: 'Lithium2+ (Z=3)' },
                            ]} />
                        </ControlGroup>
                        <ControlGroup label="Mode">
                            <ButtonGroup value={photonMode} onChange={v => setPhotonMode(v as PhotonMode)} options={[
                                { value: 'emission', label: 'Emission' },
                                { value: 'absorption', label: 'Absorption' },
                            ]} color="rgb(160, 100, 255)" />
                        </ControlGroup>
                        <ControlGroup label="Upper Level (n)">
                            <Slider value={nUpper} onChange={v => { const n = Math.round(v); setNUpper(n); if (n <= nLower) setNLower(Math.max(1, n - 1)) }} min={2} max={6} step={1} label={`n = ${nUpper}`} />
                        </ControlGroup>
                        <ControlGroup label="Lower Level (n)">
                            <Slider value={nLower} onChange={v => { const n = Math.round(v); setNLower(n); if (n >= nUpper) setNUpper(Math.min(6, n + 1)) }} min={1} max={5} step={1} label={`n = ${nLower}`} />
                        </ControlGroup>
                        <Button onClick={triggerTransition}>Fire Photon</Button>
                        <Toggle value={showBohr} onChange={setShowBohr} label="Show Bohr Model" />
                        <Toggle value={showSpectrum} onChange={setShowSpectrum} label="Show Spectrum" />
                        <Toggle value={autoTransition} onChange={setAutoTransition} label="Auto Transitions" />
                    </ControlPanel>
                    <EquationDisplay departmentColor="rgb(160, 100, 255)" equations={[
                        { label: 'Energy', expression: 'E_n = -13.6 Z^2 / n^2 eV' },
                        { label: 'Photon', expression: 'E_photon = hf = hc/lambda' },
                        { label: 'Rydberg', expression: '1/lambda = RZ^2(1/n1^2 - 1/n2^2)' },
                    ]} />
                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
