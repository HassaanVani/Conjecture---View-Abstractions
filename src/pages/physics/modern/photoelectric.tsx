import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'
import { Slider, Button, Toggle, Select } from '@/components/control-panel'

const COLOR = 'rgb(160, 100, 255)'

const METALS: Record<string, number> = {
    Sodium: 2.36, Calcium: 2.9, Zinc: 4.3, Copper: 4.7, Platinum: 6.35,
}

export default function Photoelectric() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [wavelength, setWavelength] = useState(400)
    const [intensity, setIntensity] = useState(50)
    const [voltage, setVoltage] = useState(0)
    const [metal, setMetal] = useState('Sodium')
    const [showIV, setShowIV] = useState(true)
    const [showEnergyDiagram, setShowEnergyDiagram] = useState(true)

    const phi = METALS[metal]
    const E_photon = 1240 / wavelength
    const K_max = Math.max(0, E_photon - phi)
    const thresholdWl = 1240 / phi
    const thresholdFreq = (3e8) / (thresholdWl * 1e-9) / 1e12 // THz
    const stoppingV = K_max > 0 ? K_max : 0

    const demoSteps: DemoStep[] = [
        { title: 'Photoelectric Effect', description: 'Light hitting a metal surface can eject electrons. This phenomenon, explained by Einstein, proved light has particle nature (photons).', setup: () => { setMetal('Sodium'); setWavelength(400); setVoltage(0); setIntensity(50) } },
        { title: 'Photon Energy', description: 'Each photon carries energy E = hf = hc/lambda. Only the frequency (not intensity) determines whether electrons are ejected.', setup: () => { setWavelength(350); setShowEnergyDiagram(true) } },
        { title: 'Work Function', description: 'The work function (Phi) is the minimum energy needed to free an electron from the metal surface. Different metals have different work functions.', highlight: 'Try different metals.', setup: () => { setMetal('Sodium') } },
        { title: 'Threshold Frequency', description: 'Below the threshold frequency (f0 = Phi/h), no electrons are emitted regardless of intensity. Above it, electrons are emitted instantly.', setup: () => { setWavelength(600) } },
        { title: 'Maximum KE', description: 'Kmax = hf - Phi. Extra photon energy beyond the work function becomes kinetic energy of ejected electrons.', setup: () => { setWavelength(300); setShowEnergyDiagram(true) } },
        { title: 'Stopping Potential', description: 'Applying a reverse voltage stops electrons. The stopping potential Vs = Kmax/e. It measures the maximum KE.', setup: () => { setVoltage(-2); setShowIV(true) } },
        { title: 'Intensity Effect', description: 'Increasing intensity increases the NUMBER of photons, thus more electrons and higher current, but does NOT change Kmax.', highlight: 'Try changing intensity.', setup: () => { setIntensity(80); setVoltage(0) } },
        { title: 'I-V Characteristic', description: 'The I-V curve shows: current saturates at high +V, goes to zero at -Vs. Saturation current depends on intensity.', setup: () => { setShowIV(true); setVoltage(0) } },
    ]

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.scale(dpr, dpr)
        }
        resize()
        window.addEventListener('resize', resize)

        const photons: { x: number; y: number; vx: number; vy: number }[] = []
        const electrons: { x: number; y: number; vx: number; vy: number }[] = []
        let animId: number

        const wlToColor = (wl: number): string => {
            if (wl < 380) return 'rgb(180, 100, 255)'
            if (wl < 440) return `rgb(${Math.floor(180 - (wl - 380) * 3)}, 0, 255)`
            if (wl < 490) return `rgb(0, ${Math.floor((wl - 440) * 5)}, 255)`
            if (wl < 510) return `rgb(0, 255, ${Math.floor(255 - (wl - 490) * 12)})`
            if (wl < 580) return `rgb(${Math.floor((wl - 510) * 3.6)}, 255, 0)`
            if (wl < 645) return `rgb(255, ${Math.floor(255 - (wl - 580) * 3.9)}, 0)`
            return 'rgb(255, 0, 0)'
        }

        const animate = () => {
            const rect = canvas.getBoundingClientRect()
            const w = rect.width, h = rect.height
            ctx.fillStyle = '#0d0a1a'
            ctx.fillRect(0, 0, w, h)

            const plateX = w * 0.35, collectorX = w * 0.65
            const plateTop = h * 0.25, plateBot = h * 0.75, plateH = plateBot - plateTop
            const color = wlToColor(wavelength)

            // Emitter plate
            const emGrad = ctx.createLinearGradient(plateX - 10, 0, plateX + 10, 0)
            emGrad.addColorStop(0, 'rgba(120, 120, 160, 0.3)')
            emGrad.addColorStop(1, 'rgba(160, 160, 200, 0.8)')
            ctx.fillStyle = emGrad
            ctx.fillRect(plateX - 8, plateTop, 16, plateH)
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px Inter'; ctx.textAlign = 'center'
            ctx.fillText(metal, plateX, plateTop - 10)

            // Collector plate
            ctx.fillStyle = 'rgba(120, 120, 160, 0.6)'
            ctx.fillRect(collectorX - 5, plateTop, 10, plateH)
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillText('Collector', collectorX, plateTop - 10)

            // Circuit wires
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(plateX, plateBot); ctx.lineTo(plateX, h * 0.88)
            ctx.lineTo(collectorX, h * 0.88); ctx.lineTo(collectorX, plateBot)
            ctx.stroke()

            // Battery symbol
            const batX = (plateX + collectorX) / 2, batY = h * 0.88
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2
            ctx.beginPath(); ctx.moveTo(batX - 8, batY - 8); ctx.lineTo(batX - 8, batY + 8); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(batX + 4, batY - 14); ctx.lineTo(batX + 4, batY + 14); ctx.stroke()
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px Inter'; ctx.textAlign = 'center'
            ctx.fillText(`${voltage.toFixed(1)} V`, batX, batY + 28)

            // Spawn photons
            if (Math.random() < intensity * 0.008) {
                photons.push({
                    x: 10, y: plateTop + Math.random() * plateH,
                    vx: 5, vy: (Math.random() - 0.5) * 0.5,
                })
            }

            // Update/draw photons
            for (let i = photons.length - 1; i >= 0; i--) {
                const p = photons[i]
                p.x += p.vx; p.y += p.vy

                // Draw wavy photon
                ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.8
                ctx.beginPath()
                for (let dx = 0; dx < 15; dx++) {
                    const yy = p.y + Math.sin((p.x - dx) * 0.5) * 3
                    if (dx === 0) ctx.moveTo(p.x - dx, yy); else ctx.lineTo(p.x - dx, yy)
                }
                ctx.stroke(); ctx.globalAlpha = 1

                ctx.fillStyle = color
                ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill()

                if (p.x >= plateX - 8) {
                    photons.splice(i, 1)
                    if (K_max > 0 && Math.random() < 0.6) {
                        electrons.push({
                            x: plateX + 12, y: p.y,
                            vx: Math.sqrt(K_max) * 2, vy: (Math.random() - 0.5) * 1.5,
                        })
                    }
                }
                if (p.x > w || p.y < 0 || p.y > h) photons.splice(i, 1)
            }

            // Update/draw electrons
            const dist = collectorX - plateX
            for (let i = electrons.length - 1; i >= 0; i--) {
                const e = electrons[i]
                e.vx += (voltage * 0.15) / Math.max(dist, 1)
                e.x += e.vx; e.y += e.vy
                ctx.fillStyle = 'rgba(100, 180, 255, 0.9)'
                ctx.beginPath(); ctx.arc(e.x, e.y, 2, 0, Math.PI * 2); ctx.fill()
                ctx.shadowColor = 'rgba(100, 180, 255, 0.4)'; ctx.shadowBlur = 6
                ctx.beginPath(); ctx.arc(e.x, e.y, 2, 0, Math.PI * 2); ctx.fill()
                ctx.shadowBlur = 0

                if (e.x > collectorX || e.x < plateX - 20 || e.y < 0 || e.y > h) electrons.splice(i, 1)
            }

            // I-V Characteristic graph
            if (showIV) {
                const gx = 30, gy = h - 30, gw = 180, gh = 120
                ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(gx - 5, gy - gh - 15, gw + 15, gh + 35)

                // Axes
                ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1
                const zeroX = gx + gw * 0.4
                ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(zeroX, gy); ctx.lineTo(zeroX, gy - gh); ctx.stroke()

                // Draw I-V curve
                ctx.strokeStyle = COLOR; ctx.lineWidth = 2; ctx.beginPath()
                for (let v = -5; v <= 5; v += 0.1) {
                    const px = zeroX + (v / 5) * (gw * 0.55)
                    let current = 0
                    if (K_max > 0) {
                        if (v >= 0) current = intensity * 0.01
                        else if (-v < stoppingV) current = intensity * 0.01 * (1 + v / stoppingV)
                    }
                    const py = gy - current * gh * 0.8
                    if (v === -5) ctx.moveTo(px, py); else ctx.lineTo(px, py)
                }
                ctx.stroke()

                // Current voltage marker
                const markerX = zeroX + (voltage / 5) * (gw * 0.55)
                ctx.fillStyle = 'rgba(255, 200, 100, 0.8)'
                ctx.beginPath(); ctx.arc(markerX, gy - 5, 3, 0, Math.PI * 2); ctx.fill()

                ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px Inter'; ctx.textAlign = 'center'
                ctx.fillText('I-V Curve', gx + gw / 2, gy - gh - 5)
                ctx.fillText('V', gx + gw + 5, gy + 4); ctx.fillText('I', zeroX - 2, gy - gh - 2)

                // Stopping potential marker
                if (K_max > 0) {
                    const vsX = zeroX + (-stoppingV / 5) * (gw * 0.55)
                    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)'; ctx.lineWidth = 1
                    ctx.beginPath(); ctx.moveTo(vsX, gy); ctx.lineTo(vsX, gy - gh * 0.5); ctx.stroke()
                    ctx.setLineDash([])
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.6)'; ctx.fillText(`-Vs`, vsX, gy + 12)
                }
            }

            // Energy level diagram
            if (showEnergyDiagram) {
                const dx = w - 200, dy = h - 30, dw = 160, dh = 140
                ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(dx - 5, dy - dh - 15, dw + 15, dh + 35)

                const baseY = dy - 10
                const eScale = dh / 8

                // Metal surface level
                ctx.fillStyle = 'rgba(120, 120, 180, 0.3)'; ctx.fillRect(dx, baseY - phi * eScale, dw - 20, phi * eScale)
                ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1
                ctx.setLineDash([3, 3])
                ctx.beginPath(); ctx.moveTo(dx, baseY - phi * eScale); ctx.lineTo(dx + dw - 20, baseY - phi * eScale); ctx.stroke()
                ctx.setLineDash([])

                // Photon energy arrow
                ctx.strokeStyle = color; ctx.lineWidth = 2
                ctx.beginPath(); ctx.moveTo(dx + 20, baseY); ctx.lineTo(dx + 20, baseY - E_photon * eScale); ctx.stroke()
                ctx.fillStyle = color; ctx.beginPath()
                ctx.moveTo(dx + 20, baseY - E_photon * eScale)
                ctx.lineTo(dx + 16, baseY - E_photon * eScale + 6)
                ctx.lineTo(dx + 24, baseY - E_photon * eScale + 6); ctx.closePath(); ctx.fill()

                // Labels
                ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px Inter'; ctx.textAlign = 'left'
                ctx.fillText(`E = ${E_photon.toFixed(2)} eV`, dx + 30, baseY - E_photon * eScale + 5)
                ctx.fillText(`Phi = ${phi.toFixed(2)} eV`, dx + dw - 60, baseY - phi * eScale + 12)
                if (K_max > 0) {
                    ctx.fillStyle = 'rgba(100, 255, 100, 0.7)'
                    ctx.fillText(`KE = ${K_max.toFixed(2)} eV`, dx + 30, baseY - (phi + K_max / 2) * eScale)
                }
                ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'center'
                ctx.fillText('Energy Levels', dx + dw / 2, dy - dh - 5)
            }

            // Threshold frequency indicator
            const tfX = w * 0.15
            ctx.fillStyle = K_max > 0 ? 'rgba(100, 255, 100, 0.15)' : 'rgba(255, 100, 100, 0.15)'
            ctx.fillRect(0, 0, tfX, 3)
            ctx.fillStyle = K_max > 0 ? 'rgba(100, 255, 100, 0.6)' : 'rgba(255, 100, 100, 0.6)'
            ctx.font = '11px Inter'; ctx.textAlign = 'left'
            ctx.fillText(K_max > 0 ? 'EMISSION' : 'NO EMISSION', 10, h * 0.15)

            animId = requestAnimationFrame(animate)
        }
        animId = requestAnimationFrame(animate)

        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [wavelength, intensity, voltage, metal, showIV, showEnergyDiagram, phi, E_photon, K_max, stoppingV])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-lg font-medium tracking-tight">Photoelectric Effect</h1>
                        <div className="flex items-center gap-2">
                            <APTag course="Physics 2" unit="Unit 7" color={COLOR} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={demo.open} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors">AP Tutorial</button>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4">
                        <EquationDisplay departmentColor={COLOR} equations={[
                            { label: 'Photon', expression: 'E = hf = hc/λ', description: `E = ${E_photon.toFixed(2)} eV` },
                            { label: 'KE max', expression: 'K = hf - Φ', description: `K = ${K_max.toFixed(2)} eV` },
                            { label: 'Threshold', expression: 'f₀ = Φ/h', description: `λ₀ = ${thresholdWl.toFixed(0)} nm` },
                            { label: 'Stopping V', expression: 'eV_s = K_max', description: `V_s = ${stoppingV.toFixed(2)} V` },
                        ]} />
                    </div>

                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={COLOR} title="Properties" items={[
                            { label: 'Photon Energy', value: E_photon.toFixed(2), unit: 'eV', color: E_photon > phi ? 'rgb(100, 255, 100)' : 'rgb(255, 100, 100)' },
                            { label: 'Work Function', value: phi.toFixed(2), unit: 'eV' },
                            { label: 'Max KE', value: K_max.toFixed(2), unit: 'eV' },
                            { label: 'Threshold λ', value: thresholdWl.toFixed(0), unit: 'nm' },
                            { label: 'Threshold f', value: thresholdFreq.toFixed(1), unit: 'THz' },
                        ]} />
                    </div>

                    {demo.isOpen && (
                        <div className="absolute bottom-4 left-4 z-20">
                            <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen}
                                onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep}
                                departmentColor={COLOR} />
                        </div>
                    )}
                </div>

                <div className="w-72 bg-[#0d0a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto z-20">
                    <Select label="Target Metal" value={metal} onChange={setMetal}
                        options={Object.keys(METALS).map(m => ({ value: m, label: `${m} (Φ=${METALS[m]} eV)` }))} />

                    <div className="h-px bg-white/10" />

                    <Slider label={`Wavelength λ (${wavelength} nm)`} value={wavelength} onChange={setWavelength} min={100} max={700} step={5} />
                    <Slider label={`Intensity (${intensity}%)`} value={intensity} onChange={setIntensity} min={5} max={100} step={5} />
                    <Slider label={`Voltage (${voltage.toFixed(1)} V)`} value={voltage} onChange={setVoltage} min={-5} max={5} step={0.1} />

                    <div className="h-px bg-white/10" />

                    <Toggle label="I-V Curve" value={showIV} onChange={setShowIV} />
                    <Toggle label="Energy Diagram" value={showEnergyDiagram} onChange={setShowEnergyDiagram} />
                </div>
            </div>
        </div>
    )
}
