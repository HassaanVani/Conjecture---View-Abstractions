import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

interface Wavefront {
    x: number
    y: number
    radius: number
    birth: number
}

export default function DopplerEffect() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [sourceSpeed, setSourceSpeed] = useState(40)
    const [observerSpeed, setObserverSpeed] = useState(0)
    const [waveSpeedVal, setWaveSpeedVal] = useState(340)
    const [sourceFreq, setSourceFreq] = useState(2)
    const [direction, setDirection] = useState<string>('approaching')
    const [showFreqLabels, setShowFreqLabels] = useState(true)
    const [showCompression, setShowCompression] = useState(true)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const wavefrontsRef = useRef<Wavefront[]>([])
    const lastEmitRef = useRef(0)

    const calcDoppler = useCallback(() => {
        const v = waveSpeedVal
        const vs = sourceSpeed
        const vo = observerSpeed

        let fObserved: number
        if (direction === 'approaching') {
            fObserved = sourceFreq * ((v + vo) / (v - vs))
        } else {
            fObserved = sourceFreq * ((v - vo) / (v + vs))
        }

        const lambdaSource = v / sourceFreq
        const lambdaFront = (v - vs) / sourceFreq
        const lambdaBehind = (v + vs) / sourceFreq
        const mach = vs / v

        return { fObserved, lambdaSource, lambdaFront, lambdaBehind, mach }
    }, [sourceSpeed, observerSpeed, waveSpeedVal, sourceFreq, direction])

    const reset = useCallback(() => {
        setSourceSpeed(40)
        setObserverSpeed(0)
        setWaveSpeedVal(340)
        setSourceFreq(2)
        setDirection('approaching')
        setShowFreqLabels(true)
        setShowCompression(true)
        setPaused(false)
        timeRef.current = 0
        wavefrontsRef.current = []
        lastEmitRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'The Doppler Effect', description: 'When a wave source moves, the wavefronts compress in front and stretch behind. This causes observers to detect a different frequency than what was emitted.', setup: () => { reset(); setSourceSpeed(60) } },
        { title: 'Stationary Source', description: 'When the source is stationary, wavefronts spread out uniformly in all directions. All observers detect the same frequency regardless of position.', setup: () => { setSourceSpeed(0); setObserverSpeed(0) } },
        { title: 'Moving Source', description: 'As the source moves, it "chases" its own wavefronts. The wavefronts ahead are compressed (shorter wavelength = higher frequency). Behind, they stretch out (longer wavelength = lower frequency).', setup: () => { setSourceSpeed(80) } },
        { title: 'Approaching Observer', description: 'An approaching source means higher frequency: f\' = f * (v + v_o)/(v - v_s). This is why ambulance sirens sound higher-pitched as they approach.', setup: () => { setDirection('approaching'); setSourceSpeed(60); setShowFreqLabels(true) } },
        { title: 'Receding Observer', description: 'A receding source means lower frequency: f\' = f * (v - v_o)/(v + v_s). The pitch drops as the ambulance passes and moves away.', setup: () => { setDirection('receding'); setSourceSpeed(60) } },
        { title: 'Moving Observer', description: 'The observer can also move! Moving toward the source increases frequency, moving away decreases it. Both motions contribute to the total shift.', setup: () => { setDirection('approaching'); setSourceSpeed(40); setObserverSpeed(30) } },
        { title: 'Near Sonic Speed', description: 'As the source approaches the wave speed (Mach 1), wavefronts pile up into a shock wave. This is the sonic boom barrier. At v_s = v, the Doppler formula diverges!', setup: () => { setSourceSpeed(320); setObserverSpeed(0); setDirection('approaching') } },
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
        const scale = 0.4 // pixels per meter equivalent

        const draw = () => {
            if (!paused) timeRef.current += 0.016

            const t = timeRef.current
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const cy = h / 2
            const sourceStartX = w * 0.3

            // Source position (moves right)
            const sourceX = sourceStartX + sourceSpeed * scale * (t % 20)
            const sourceY = cy

            // Observer position (right side)
            const observerBaseX = direction === 'approaching' ? w * 0.8 : w * 0.2
            const obsDir = direction === 'approaching' ? -1 : 1
            const observerX = observerBaseX + observerSpeed * scale * obsDir * (t % 20)
            const observerY = cy

            // Emit wavefronts at source frequency
            const emitInterval = 1 / sourceFreq
            if (t - lastEmitRef.current >= emitInterval && !paused) {
                wavefrontsRef.current.push({
                    x: sourceX,
                    y: sourceY,
                    radius: 0,
                    birth: t,
                })
                lastEmitRef.current = t
            }

            // Remove old wavefronts
            wavefrontsRef.current = wavefrontsRef.current.filter(wf => wf.radius < Math.max(w, h))

            // Draw wavefronts
            wavefrontsRef.current.forEach(wf => {
                const age = t - wf.birth
                wf.radius = age * waveSpeedVal * scale

                const alpha = Math.max(0.05, 0.5 - age * 0.05)
                ctx.strokeStyle = `rgba(160, 100, 255, ${alpha})`
                ctx.lineWidth = 1.5
                ctx.beginPath()
                ctx.arc(wf.x, wf.y, wf.radius, 0, Math.PI * 2)
                ctx.stroke()
            })

            // Compression/rarefaction indicator
            if (showCompression && sourceSpeed > 0) {
                // Front region (compressed)
                const grad1 = ctx.createLinearGradient(sourceX, 0, sourceX + 150, 0)
                grad1.addColorStop(0, 'rgba(255, 100, 100, 0.15)')
                grad1.addColorStop(1, 'transparent')
                ctx.fillStyle = grad1
                ctx.fillRect(sourceX, cy - 80, 150, 160)

                // Behind region (stretched)
                const grad2 = ctx.createLinearGradient(sourceX - 150, 0, sourceX, 0)
                grad2.addColorStop(0, 'transparent')
                grad2.addColorStop(1, 'rgba(100, 150, 255, 0.15)')
                ctx.fillStyle = grad2
                ctx.fillRect(sourceX - 150, cy - 80, 150, 160)

                if (showFreqLabels) {
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
                    ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText('Compressed (higher f)', sourceX + 75, cy - 90)

                    ctx.fillStyle = 'rgba(100, 150, 255, 0.7)'
                    ctx.fillText('Stretched (lower f)', sourceX - 75, cy - 90)
                }
            }

            // Source
            const sourceGlow = ctx.createRadialGradient(sourceX, sourceY, 0, sourceX, sourceY, 25)
            sourceGlow.addColorStop(0, 'rgba(160, 100, 255, 0.6)')
            sourceGlow.addColorStop(1, 'transparent')
            ctx.fillStyle = sourceGlow
            ctx.beginPath(); ctx.arc(sourceX, sourceY, 25, 0, Math.PI * 2); ctx.fill()

            ctx.fillStyle = 'rgba(160, 100, 255, 1)'
            ctx.beginPath(); ctx.arc(sourceX, sourceY, 10, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('S', sourceX, sourceY + 4)

            // Source velocity arrow
            if (sourceSpeed > 0) {
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.7)'
                ctx.lineWidth = 2
                const arrowLen = Math.min(60, sourceSpeed * 0.5)
                ctx.beginPath(); ctx.moveTo(sourceX, sourceY - 25); ctx.lineTo(sourceX + arrowLen, sourceY - 25); ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(sourceX + arrowLen, sourceY - 25)
                ctx.lineTo(sourceX + arrowLen - 8, sourceY - 30)
                ctx.lineTo(sourceX + arrowLen - 8, sourceY - 20)
                ctx.closePath()
                ctx.fillStyle = 'rgba(255, 220, 100, 0.7)'; ctx.fill()
                ctx.fillStyle = 'rgba(255, 220, 100, 0.6)'; ctx.font = '10px system-ui'
                ctx.fillText(`v_s = ${sourceSpeed} m/s`, sourceX + arrowLen / 2, sourceY - 35)
            }

            // Observer
            ctx.fillStyle = 'rgba(100, 255, 150, 0.8)'
            ctx.beginPath(); ctx.arc(observerX, observerY, 8, 0, Math.PI * 2); ctx.fill()
            ctx.strokeStyle = 'rgba(100, 255, 150, 0.5)'; ctx.lineWidth = 2
            ctx.beginPath(); ctx.arc(observerX, observerY, 14, 0, Math.PI * 2); ctx.stroke()
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('O', observerX, observerY + 4)

            // Observed frequency label
            if (showFreqLabels) {
                const { fObserved } = calcDoppler()
                ctx.fillStyle = 'rgba(100, 255, 150, 0.9)'
                ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`f\' = ${fObserved.toFixed(2)} Hz`, observerX, observerY - 25)

                ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                ctx.fillText(`f_0 = ${sourceFreq.toFixed(1)} Hz`, sourceX, sourceY + 30)
            }

            // Reset source position when it goes too far
            if (sourceX > w + 50) {
                timeRef.current = 0
                wavefrontsRef.current = []
                lastEmitRef.current = 0
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [sourceSpeed, observerSpeed, waveSpeedVal, sourceFreq, direction, showFreqLabels, showCompression, paused, calcDoppler])

    const doppler = calcDoppler()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 1" unit="Unit 6" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Doppler Shift"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'f_source', value: sourceFreq.toFixed(1), unit: 'Hz' },
                                { label: 'f_observed', value: doppler.fObserved.toFixed(2), unit: 'Hz', color: 'rgb(100, 255, 150)' },
                                { label: 'lambda_front', value: doppler.lambdaFront.toFixed(1), unit: 'm', color: 'rgb(255, 100, 100)' },
                                { label: 'lambda_behind', value: doppler.lambdaBehind.toFixed(1), unit: 'm', color: 'rgb(100, 150, 255)' },
                                { label: 'Mach', value: doppler.mach.toFixed(3) },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Approaching', expression: 'f\' = f(v + v_o)/(v - v_s)', description: 'Source and observer moving closer' },
                                { label: 'Receding', expression: 'f\' = f(v - v_o)/(v + v_s)', description: 'Source and observer moving apart' },
                                { label: 'Wavelength', expression: 'lambda\' = v / f\'' },
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
                        <ControlGroup label="Direction">
                            <ButtonGroup
                                value={direction}
                                onChange={setDirection}
                                options={[
                                    { value: 'approaching', label: 'Approaching' },
                                    { value: 'receding', label: 'Receding' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Source Speed">
                            <Slider value={sourceSpeed} onChange={setSourceSpeed} min={0} max={330} step={5} label={`v_s = ${sourceSpeed} m/s`} />
                        </ControlGroup>

                        <ControlGroup label="Observer Speed">
                            <Slider value={observerSpeed} onChange={setObserverSpeed} min={0} max={200} step={5} label={`v_o = ${observerSpeed} m/s`} />
                        </ControlGroup>

                        <ControlGroup label="Wave Speed">
                            <Slider value={waveSpeedVal} onChange={setWaveSpeedVal} min={100} max={600} step={10} label={`v = ${waveSpeedVal} m/s`} />
                        </ControlGroup>

                        <ControlGroup label="Source Frequency">
                            <Slider value={sourceFreq} onChange={setSourceFreq} min={0.5} max={10} step={0.1} label={`f = ${sourceFreq.toFixed(1)} Hz`} />
                        </ControlGroup>

                        <Toggle value={showFreqLabels} onChange={setShowFreqLabels} label="Show Frequency Labels" />
                        <Toggle value={showCompression} onChange={setShowCompression} label="Show Compression Zones" />
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
