import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

type EndType = 'fixed' | 'open'

export default function StandingWaves() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [harmonic, setHarmonic] = useState(1)
    const [stringLength, setStringLength] = useState(2.0)
    const [waveSpeed, setWaveSpeed] = useState(100)
    const [endType, setEndType] = useState<EndType>('fixed')
    const [amplitude, setAmplitude] = useState(60)
    const [showEnvelope, setShowEnvelope] = useState(true)
    const [showNodes, setShowNodes] = useState(true)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)

    const calcWave = useCallback(() => {
        const n = harmonic
        const L = stringLength
        const v = waveSpeed
        let wavelength: number, frequency: number

        if (endType === 'fixed') {
            wavelength = (2 * L) / n
            frequency = (n * v) / (2 * L)
        } else {
            // Open-open: same formula; open-closed would use odd harmonics
            wavelength = (2 * L) / n
            frequency = (n * v) / (2 * L)
        }
        const period = 1 / frequency
        return { wavelength, frequency, period, n, L, v }
    }, [harmonic, stringLength, waveSpeed, endType])

    const reset = useCallback(() => {
        setHarmonic(1)
        setStringLength(2.0)
        setWaveSpeed(100)
        setEndType('fixed')
        setAmplitude(60)
        setShowEnvelope(true)
        setShowNodes(true)
        setPaused(false)
        timeRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'Standing Waves', description: 'Standing waves form when two identical waves travel in opposite directions and interfere. On a string, waves reflect at the boundaries creating stable patterns.', setup: () => { reset(); setHarmonic(1) } },
        { title: 'Fundamental (n=1)', description: 'The first harmonic or fundamental has the longest wavelength (lambda = 2L) and lowest frequency. It has one antinode in the middle and nodes at each end.', setup: () => { setHarmonic(1); setEndType('fixed') } },
        { title: 'Second Harmonic', description: 'n=2 has wavelength = L and frequency = 2f1. There are 2 antinodes and a node in the center. Each harmonic is an integer multiple of the fundamental.', setup: () => { setHarmonic(2) } },
        { title: 'Higher Harmonics', description: 'As n increases, more nodes and antinodes form. The frequency increases proportionally: f_n = n * v / (2L). This is how musical instruments create overtones.', setup: () => { setHarmonic(5) } },
        { title: 'Nodes and Antinodes', description: 'Nodes (marked) are points of zero displacement - destructive interference. Antinodes have maximum displacement - constructive interference. They alternate along the string.', setup: () => { setShowNodes(true); setHarmonic(3) } },
        { title: 'Envelope', description: 'The envelope shows the maximum displacement at each point. It outlines the shape of the standing wave pattern. Points inside the envelope oscillate back and forth.', setup: () => { setShowEnvelope(true); setHarmonic(3) } },
        { title: 'Wave Speed & Tension', description: 'Wave speed v = sqrt(T/mu) depends on string tension T and linear mass density mu. Changing wave speed shifts all frequencies proportionally.', setup: () => { setHarmonic(1); setWaveSpeed(200) } },
        { title: 'Open vs Fixed Ends', description: 'Fixed ends are nodes (zero displacement). Open ends are antinodes (maximum displacement). The boundary conditions determine which harmonics are possible.', setup: () => { setEndType('open'); setHarmonic(2) } },
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

            const { wavelength, frequency } = calcWave()
            const omega = 2 * Math.PI * frequency
            const k = (2 * Math.PI) / wavelength

            // Coordinate system
            const padX = 60
            const padY = 40
            const stringW = w - padX * 2
            const cy = h / 2

            // Background grid
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.05)'
            ctx.lineWidth = 1
            for (let x = padX; x <= w - padX; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, padY); ctx.lineTo(x, h - padY); ctx.stroke()
            }

            // Equilibrium line
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.2)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 4])
            ctx.beginPath(); ctx.moveTo(padX, cy); ctx.lineTo(w - padX, cy); ctx.stroke()
            ctx.setLineDash([])

            // Fixed/Open end markers
            ctx.lineWidth = 3
            if (endType === 'fixed') {
                // Fixed end: solid line
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
                ctx.beginPath(); ctx.moveTo(padX, cy - amplitude - 20); ctx.lineTo(padX, cy + amplitude + 20); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(w - padX, cy - amplitude - 20); ctx.lineTo(w - padX, cy + amplitude + 20); ctx.stroke()
            } else {
                // Open end: ring
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'
                ctx.beginPath(); ctx.arc(padX, cy, 8, 0, Math.PI * 2); ctx.stroke()
                ctx.beginPath(); ctx.arc(w - padX, cy, 8, 0, Math.PI * 2); ctx.stroke()
            }

            // Envelope (max displacement at each point)
            if (showEnvelope) {
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.25)'
                ctx.lineWidth = 1.5
                ctx.setLineDash([4, 3])
                // Upper envelope
                ctx.beginPath()
                for (let px = 0; px <= stringW; px += 2) {
                    const xPos = (px / stringW) * stringLength
                    const envAmp = Math.abs(Math.sin(k * xPos)) * amplitude
                    const sx = padX + px
                    if (px === 0) ctx.moveTo(sx, cy - envAmp)
                    else ctx.lineTo(sx, cy - envAmp)
                }
                ctx.stroke()
                // Lower envelope
                ctx.beginPath()
                for (let px = 0; px <= stringW; px += 2) {
                    const xPos = (px / stringW) * stringLength
                    const envAmp = Math.abs(Math.sin(k * xPos)) * amplitude
                    const sx = padX + px
                    if (px === 0) ctx.moveTo(sx, cy + envAmp)
                    else ctx.lineTo(sx, cy + envAmp)
                }
                ctx.stroke()
                ctx.setLineDash([])
            }

            // Standing wave
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.9)'
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.beginPath()
            for (let px = 0; px <= stringW; px += 1) {
                const xPos = (px / stringW) * stringLength
                const y = amplitude * Math.sin(k * xPos) * Math.cos(omega * t)
                const sx = padX + px
                const sy = cy - y
                if (px === 0) ctx.moveTo(sx, sy)
                else ctx.lineTo(sx, sy)
            }
            ctx.stroke()

            // Ghost waves (forward and backward)
            ctx.globalAlpha = 0.15
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            for (let px = 0; px <= stringW; px += 2) {
                const xPos = (px / stringW) * stringLength
                const y = (amplitude / 2) * Math.sin(k * xPos - omega * t)
                const sx = padX + px
                if (px === 0) ctx.moveTo(sx, cy - y)
                else ctx.lineTo(sx, cy - y)
            }
            ctx.stroke()

            ctx.strokeStyle = 'rgba(255, 150, 100, 0.8)'
            ctx.beginPath()
            for (let px = 0; px <= stringW; px += 2) {
                const xPos = (px / stringW) * stringLength
                const y = (amplitude / 2) * Math.sin(k * xPos + omega * t)
                const sx = padX + px
                if (px === 0) ctx.moveTo(sx, cy - y)
                else ctx.lineTo(sx, cy - y)
            }
            ctx.stroke()
            ctx.globalAlpha = 1

            // Nodes and antinodes
            if (showNodes) {
                const n = harmonic
                // Nodes for fixed-fixed: at x = m * L/n for m = 0..n
                for (let m = 0; m <= n; m++) {
                    const nodeX = padX + (m / n) * stringW
                    // Node marker
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                    ctx.beginPath(); ctx.arc(nodeX, cy, 5, 0, Math.PI * 2); ctx.fill()
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.6)'
                    ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText('N', nodeX, cy + 18)
                }
                // Antinodes: midway between nodes
                for (let m = 0; m < n; m++) {
                    const antiX = padX + ((m + 0.5) / n) * stringW
                    ctx.strokeStyle = 'rgba(100, 255, 150, 0.6)'
                    ctx.lineWidth = 1.5
                    ctx.setLineDash([3, 3])
                    ctx.beginPath(); ctx.moveTo(antiX, cy - amplitude - 5); ctx.lineTo(antiX, cy + amplitude + 5); ctx.stroke()
                    ctx.setLineDash([])
                    ctx.fillStyle = 'rgba(100, 255, 150, 0.6)'
                    ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText('A', antiX, cy - amplitude - 10)
                }
            }

            // Wavelength marker
            if (harmonic >= 1) {
                const lambdaPx = stringW / harmonic
                const markerY = h - padY - 10
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.6)'
                ctx.lineWidth = 1.5
                ctx.beginPath(); ctx.moveTo(padX, markerY); ctx.lineTo(padX + lambdaPx, markerY); ctx.stroke()
                // Arrows
                ctx.beginPath(); ctx.moveTo(padX + 5, markerY - 4); ctx.lineTo(padX, markerY); ctx.lineTo(padX + 5, markerY + 4); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(padX + lambdaPx - 5, markerY - 4); ctx.lineTo(padX + lambdaPx, markerY); ctx.lineTo(padX + lambdaPx - 5, markerY + 4); ctx.stroke()
                ctx.fillStyle = 'rgba(255, 220, 100, 0.7)'
                ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`lambda = ${wavelength.toFixed(2)} m`, padX + lambdaPx / 2, markerY - 8)
            }

            // Labels
            ctx.fillStyle = 'rgba(160, 100, 255, 0.5)'
            ctx.font = '12px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(`L = ${stringLength.toFixed(1)} m`, w / 2, h - 10)

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [harmonic, stringLength, waveSpeed, endType, amplitude, showEnvelope, showNodes, paused, calcWave])

    const wave = calcWave()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 1" unit="Unit 6" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Standing Wave"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'Harmonic n', value: harmonic, color: 'rgb(160, 100, 255)' },
                                { label: 'Frequency', value: wave.frequency.toFixed(1), unit: 'Hz' },
                                { label: 'Wavelength', value: wave.wavelength.toFixed(3), unit: 'm', color: 'rgb(255, 220, 100)' },
                                { label: 'Period', value: (wave.period * 1000).toFixed(1), unit: 'ms' },
                                { label: 'Nodes', value: `${harmonic + 1}` },
                                { label: 'Antinodes', value: `${harmonic}` },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[260px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Frequency', expression: 'f_n = n * v / (2L)', description: 'n-th harmonic frequency' },
                                { label: 'Wavelength', expression: 'lambda_n = 2L / n' },
                                { label: 'Wave speed', expression: 'v = f * lambda' },
                                { label: 'Standing', expression: 'y = 2A sin(kx) cos(wt)' },
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
                        <ControlGroup label="Harmonic Number (n)">
                            <Slider value={harmonic} onChange={v => setHarmonic(Math.round(v))} min={1} max={10} step={1} label={`n = ${harmonic}`} />
                        </ControlGroup>

                        <ControlGroup label="String Length">
                            <Slider value={stringLength} onChange={setStringLength} min={0.5} max={5} step={0.1} label={`${stringLength.toFixed(1)} m`} />
                        </ControlGroup>

                        <ControlGroup label="Wave Speed">
                            <Slider value={waveSpeed} onChange={setWaveSpeed} min={10} max={500} step={10} label={`${waveSpeed} m/s`} />
                        </ControlGroup>

                        <ControlGroup label="Boundary Conditions">
                            <ButtonGroup
                                value={endType}
                                onChange={v => setEndType(v as EndType)}
                                options={[
                                    { value: 'fixed', label: 'Fixed-Fixed' },
                                    { value: 'open', label: 'Open-Open' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Amplitude">
                            <Slider value={amplitude} onChange={setAmplitude} min={10} max={100} step={5} label={`${amplitude} px`} />
                        </ControlGroup>

                        <Toggle value={showEnvelope} onChange={setShowEnvelope} label="Show Envelope" />
                        <Toggle value={showNodes} onChange={setShowNodes} label="Show Nodes/Antinodes" />
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
