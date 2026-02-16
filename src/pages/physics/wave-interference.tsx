import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'
import { Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

const COLOR = 'rgb(160, 100, 255)'

export default function WaveInterference() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const frameRef = useRef(0)
    const [isRunning, setIsRunning] = useState(true)
    const [wavelength, setWavelength] = useState(40)
    const [frequency, setFrequency] = useState(2)
    const [sourceDistance, setSourceDistance] = useState(200)
    const [amplitude, setAmplitude] = useState(1.0)
    const [showSources, setShowSources] = useState(true)
    const [showLabels, setShowLabels] = useState(true)
    const [mode, setMode] = useState<'two-source' | 'double-slit' | 'standing'>('two-source')

    const pathDiff = useCallback((x: number, y: number, s1y: number, s2y: number, sx: number) => {
        const d1 = Math.sqrt((x - sx) ** 2 + (y - s1y) ** 2)
        const d2 = Math.sqrt((x - sx) ** 2 + (y - s2y) ** 2)
        return { d1, d2, diff: Math.abs(d1 - d2) }
    }, [])

    const demoSteps: DemoStep[] = [
        { title: 'Wave Interference', description: 'When two coherent waves overlap, they create an interference pattern. Bright regions = constructive, dark = destructive.', setup: () => { setMode('two-source'); setWavelength(40); setFrequency(2); setSourceDistance(200) } },
        { title: 'Wavelength Effect', description: 'Shorter wavelength produces finer fringes. Longer wavelength produces wider spacing between maxima and minima.', highlight: 'Try changing the wavelength slider.', setup: () => { setWavelength(25); setShowLabels(true) } },
        { title: 'Source Separation', description: 'Increasing the distance between sources produces more closely spaced fringes. d sin(theta) = m*lambda for maxima.', setup: () => { setSourceDistance(300); setWavelength(40) } },
        { title: 'Constructive Interference', description: 'When path difference = m*lambda (integer multiples of wavelength), waves add constructively. Amplitude doubles.', highlight: 'Look for the bright bands.', setup: () => { setSourceDistance(200); setShowLabels(true) } },
        { title: 'Destructive Interference', description: 'When path difference = (m+1/2)*lambda, waves cancel. Amplitude goes to zero. These are the dark bands.', setup: () => { setShowLabels(true) } },
        { title: 'Double-Slit Experiment', description: 'Young\'s experiment: light passes through two slits and creates an interference pattern on a screen. This confirmed the wave nature of light.', setup: () => { setMode('double-slit'); setWavelength(35); setSourceDistance(150) } },
        { title: 'Standing Waves', description: 'When two waves travel in opposite directions with the same frequency, they create a standing wave with nodes (no motion) and antinodes (max motion).', setup: () => { setMode('standing'); setWavelength(60); setFrequency(2) } },
        { title: 'Frequency & Wavelength', description: 'v = f*lambda. For a fixed wave speed, increasing frequency decreases wavelength. The pattern changes accordingly.', setup: () => { setMode('two-source'); setFrequency(4); setWavelength(25) } },
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
        let animId: number

        const animate = () => {
            const rect = canvas.getBoundingClientRect()
            const w = rect.width, h = rect.height
            ctx.fillStyle = '#0d0a1a'
            ctx.fillRect(0, 0, w, h)

            if (isRunning) frameRef.current++
            const time = frameRef.current * 0.05 * frequency
            const cy = h / 2
            const res = 5

            if (mode === 'standing') {
                // Standing wave visualization
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.15)'
                ctx.lineWidth = 1
                ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()

                // Draw standing wave: two counter-propagating waves
                for (let row = -3; row <= 3; row++) {
                    const yOff = cy + row * 60
                    // Wave 1 (right)
                    ctx.strokeStyle = row === 0 ? 'rgba(100, 180, 255, 0.6)' : 'rgba(100, 180, 255, 0.15)'
                    ctx.lineWidth = row === 0 ? 2 : 1
                    if (row <= 0) {
                        ctx.beginPath()
                        for (let x = 0; x < w; x++) {
                            const y1 = amplitude * 40 * Math.sin((x / wavelength) * Math.PI * 2 - time)
                            if (x === 0) ctx.moveTo(x, yOff + y1); else ctx.lineTo(x, yOff + y1)
                        }
                        ctx.stroke()
                    }
                    // Wave 2 (left)
                    ctx.strokeStyle = row === 0 ? 'rgba(255, 150, 100, 0.6)' : 'rgba(255, 150, 100, 0.15)'
                    if (row <= 0) {
                        ctx.beginPath()
                        for (let x = 0; x < w; x++) {
                            const y2 = amplitude * 40 * Math.sin((x / wavelength) * Math.PI * 2 + time)
                            if (x === 0) ctx.moveTo(x, yOff + y2); else ctx.lineTo(x, yOff + y2)
                        }
                        ctx.stroke()
                    }
                }
                // Resultant standing wave
                ctx.strokeStyle = COLOR
                ctx.lineWidth = 3
                ctx.beginPath()
                for (let x = 0; x < w; x++) {
                    const env = 2 * amplitude * 40 * Math.cos((x / wavelength) * Math.PI * 2)
                    const val = env * Math.sin(time)
                    if (x === 0) ctx.moveTo(x, cy + val); else ctx.lineTo(x, cy + val)
                }
                ctx.stroke()

                // Node/Antinode markers
                if (showLabels) {
                    for (let x = 0; x < w; x += wavelength / 2) {
                        const isNode = Math.abs(Math.cos((x / wavelength) * Math.PI * 2)) < 0.1
                        const isAntinode = Math.abs(Math.abs(Math.cos((x / wavelength) * Math.PI * 2)) - 1) < 0.1
                        if (isNode) {
                            ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
                            ctx.beginPath(); ctx.arc(x, cy, 5, 0, Math.PI * 2); ctx.fill()
                            ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
                            ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center'
                            ctx.fillText('Node', x, cy + 20)
                        } else if (isAntinode && x > 10) {
                            ctx.fillStyle = 'rgba(100, 255, 100, 0.7)'
                            ctx.beginPath(); ctx.arc(x, cy, 5, 0, Math.PI * 2); ctx.fill()
                            ctx.fillStyle = 'rgba(100, 255, 100, 0.5)'
                            ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center'
                            ctx.fillText('Antinode', x, cy - 55)
                        }
                    }
                }
            } else {
                // Two-source or double-slit
                const slitX = mode === 'double-slit' ? w * 0.25 : w * 0.3
                const s1 = { x: slitX, y: cy - sourceDistance / 2 }
                const s2 = { x: slitX, y: cy + sourceDistance / 2 }

                // Double-slit barrier
                if (mode === 'double-slit') {
                    ctx.fillStyle = 'rgba(80, 80, 120, 0.8)'
                    ctx.fillRect(slitX - 4, 0, 8, s1.y - 8)
                    ctx.fillRect(slitX - 4, s1.y + 8, 8, s2.y - s1.y - 16)
                    ctx.fillRect(slitX - 4, s2.y + 8, 8, h - s2.y - 8)
                }

                // Interference pattern
                const startX = mode === 'double-slit' ? slitX + 10 : 0
                for (let x = startX; x < w; x += res) {
                    for (let y = 0; y < h; y += res) {
                        const d1 = Math.sqrt((x - s1.x) ** 2 + (y - s1.y) ** 2)
                        const d2 = Math.sqrt((x - s2.x) ** 2 + (y - s2.y) ** 2)
                        const w1 = amplitude * Math.sin((d1 / wavelength) * Math.PI * 2 - time)
                        const w2 = amplitude * Math.sin((d2 / wavelength) * Math.PI * 2 - time)
                        const combined = (w1 + w2) / 2
                        const intensity = (combined + 1) / 2
                        const r = Math.floor(intensity * 160)
                        const g = Math.floor(intensity * 80 + (1 - intensity) * 20)
                        const b = Math.floor(intensity * 255)
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.85)`
                        ctx.fillRect(x, y, res - 1, res - 1)
                    }
                }

                // Constructive/Destructive labels on screen
                if (showLabels && mode === 'double-slit') {
                    const screenX = w * 0.85
                    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
                    ctx.lineWidth = 1
                    ctx.beginPath(); ctx.moveTo(screenX, 0); ctx.lineTo(screenX, h); ctx.stroke()

                    for (let m = -3; m <= 3; m++) {
                        const sinT = m * wavelength / sourceDistance
                        if (Math.abs(sinT) > 1) continue
                        const yPos = cy + Math.tan(Math.asin(sinT)) * (screenX - slitX)
                        ctx.fillStyle = 'rgba(100, 255, 100, 0.6)'
                        ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'left'
                        ctx.fillText(m === 0 ? 'm=0 (central)' : `m=${m}`, screenX + 8, yPos + 4)
                        ctx.beginPath(); ctx.arc(screenX, yPos, 3, 0, Math.PI * 2); ctx.fill()
                    }
                }

                // Source points
                if (showSources) {
                    [s1, s2].forEach((s, i) => {
                        const pulse = Math.sin(time * 2) * 0.3 + 0.7
                        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 25)
                        grad.addColorStop(0, `rgba(255, 255, 255, ${0.5 * pulse})`)
                        grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
                        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(s.x, s.y, 25, 0, Math.PI * 2); ctx.fill()
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, Math.PI * 2); ctx.fill()
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; ctx.font = '11px monospace'; ctx.textAlign = 'left'
                        ctx.fillText(`S${i + 1}`, s.x + 10, s.y + 4)
                    })
                }
            }

            animId = requestAnimationFrame(animate)
        }
        animId = requestAnimationFrame(animate)

        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [isRunning, wavelength, frequency, sourceDistance, showSources, showLabels, mode, amplitude, pathDiff])

    // Computed info
    const waveSpeed = wavelength * frequency
    const period = 1 / frequency

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
                        <h1 className="text-lg font-medium tracking-tight">Wave Interference</h1>
                        <div className="flex items-center gap-2">
                            <APTag course="Physics 2" unit="Unit 6" color={COLOR} />
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
                        <EquationDisplay
                            departmentColor={COLOR}
                            equations={[
                                { label: 'Superposition', expression: 'y = y₁ + y₂', description: 'Waves add algebraically' },
                                { label: 'Constructive', expression: 'Δr = mλ', description: 'Path diff = integer wavelengths' },
                                { label: 'Destructive', expression: 'Δr = (m+½)λ', description: 'Path diff = half-integer wavelengths' },
                                ...(mode === 'double-slit' ? [{ label: 'Double Slit', expression: 'd sin θ = mλ', description: 'Bright fringe condition' }] : []),
                                ...(mode === 'standing' ? [{ label: 'Standing', expression: 'y = 2A cos(kx) sin(ωt)', description: 'Nodes at kx = nπ' }] : []),
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4">
                        <InfoPanel
                            departmentColor={COLOR}
                            title="Wave Properties"
                            items={[
                                { label: 'Wavelength', value: wavelength, unit: 'px' },
                                { label: 'Frequency', value: frequency, unit: 'Hz' },
                                { label: 'Wave Speed', value: waveSpeed, unit: 'px/s' },
                                { label: 'Period', value: period.toFixed(3), unit: 's' },
                                { label: 'Source Sep.', value: sourceDistance, unit: 'px' },
                            ]}
                        />
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
                    <ButtonGroup label="Mode" value={mode}
                        onChange={v => setMode(v as 'two-source' | 'double-slit' | 'standing')}
                        options={[
                            { value: 'two-source', label: 'Two Source' },
                            { value: 'double-slit', label: 'Double Slit' },
                            { value: 'standing', label: 'Standing' },
                        ]} color={COLOR} />

                    <div className="h-px bg-white/10" />

                    <Slider label="Wavelength (λ)" value={wavelength} onChange={setWavelength} min={15} max={80} step={1} />
                    <Slider label="Frequency (f)" value={frequency} onChange={setFrequency} min={0.5} max={5} step={0.5} />
                    <Slider label="Amplitude" value={amplitude} onChange={setAmplitude} min={0.2} max={2} step={0.1} />
                    {mode !== 'standing' && (
                        <Slider label="Source Distance (d)" value={sourceDistance} onChange={setSourceDistance} min={50} max={400} step={10} />
                    )}

                    <div className="h-px bg-white/10" />

                    <Toggle label="Show Sources" value={showSources} onChange={setShowSources} />
                    <Toggle label="Show Labels" value={showLabels} onChange={setShowLabels} />

                    <div className="flex gap-2 mt-2">
                        <button onClick={() => setIsRunning(!isRunning)}
                            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-purple-500 text-white hover:bg-purple-400'}`}>
                            {isRunning ? 'Pause' : 'Play'}
                        </button>
                        <Button onClick={() => { frameRef.current = 0 }} variant="secondary" className="px-4 py-2.5 rounded-lg text-sm">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
