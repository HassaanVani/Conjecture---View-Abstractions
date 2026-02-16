import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

type CircuitMode = 'series' | 'parallel'

export default function DCCircuit() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [voltage, setVoltage] = useState(12)
    const [numResistors, setNumResistors] = useState(3)
    const [resistances, setResistances] = useState([100, 200, 300])
    const [mode, setMode] = useState<CircuitMode>('series')
    const [showCurrent, setShowCurrent] = useState(true)
    const [showVoltages, setShowVoltages] = useState(true)
    const [selectedResistor, setSelectedResistor] = useState(0)
    const animTime = useRef(0)

    const updateResistance = useCallback((index: number, value: number) => {
        setResistances(prev => {
            const next = [...prev]
            next[index] = value
            return next
        })
    }, [])

    useEffect(() => {
        if (numResistors > resistances.length) {
            setResistances(prev => [...prev, ...Array(numResistors - prev.length).fill(100)])
        } else if (numResistors < resistances.length) {
            setResistances(prev => prev.slice(0, numResistors))
        }
        if (selectedResistor >= numResistors) setSelectedResistor(Math.max(0, numResistors - 1))
    }, [numResistors, resistances.length, selectedResistor])

    const calc = useCallback(() => {
        const rs = resistances.slice(0, numResistors)
        let rTotal: number
        if (mode === 'series') {
            rTotal = rs.reduce((s, r) => s + r, 0)
        } else {
            const invSum = rs.reduce((s, r) => s + 1 / r, 0)
            rTotal = invSum > 0 ? 1 / invSum : Infinity
        }
        const iTotal = rTotal > 0 ? voltage / rTotal : 0
        const pTotal = voltage * iTotal

        const resistorData = rs.map(r => {
            if (mode === 'series') {
                const i = iTotal
                const v = i * r
                const p = v * i
                return { r, i, v, p }
            } else {
                const v = voltage
                const i = v / r
                const p = v * i
                return { r, i, v, p }
            }
        })
        return { rTotal, iTotal, pTotal, resistorData }
    }, [resistances, numResistors, mode, voltage])

    const reset = useCallback(() => {
        setVoltage(12)
        setNumResistors(3)
        setResistances([100, 200, 300])
        setMode('series')
        setShowCurrent(true)
        setShowVoltages(true)
        setSelectedResistor(0)
    }, [])

    const demoSteps = [
        { title: 'DC Circuits', description: 'A DC circuit has a voltage source (battery) driving current through resistors. Current flows from positive to negative terminal.', setup: () => reset() },
        { title: 'Ohm\'s Law', description: 'V = IR is the fundamental relationship. Voltage (V) equals current (I) times resistance (R). This applies to each component and the whole circuit.', setup: () => { reset(); setShowVoltages(true) } },
        { title: 'Series Circuits', description: 'In series, resistors are connected end-to-end. Total resistance adds: R_total = R1 + R2 + R3. Current is the SAME through each resistor.', setup: () => { setMode('series'); setShowCurrent(true) } },
        { title: 'Kirchhoff\'s Voltage Law', description: 'KVL: The sum of all voltage drops around a loop equals zero. In series, V_source = V_R1 + V_R2 + V_R3. The voltages divide proportionally.', setup: () => { setMode('series'); setShowVoltages(true) } },
        { title: 'Parallel Circuits', description: 'In parallel, resistors share the same two nodes. Each resistor has the SAME voltage. Total resistance: 1/R = 1/R1 + 1/R2 + 1/R3.', setup: () => { setMode('parallel'); setShowVoltages(true) } },
        { title: 'Kirchhoff\'s Current Law', description: 'KCL: Current entering a node equals current leaving. In parallel, I_total = I_R1 + I_R2 + I_R3. More current flows through lower resistance.', setup: () => { setMode('parallel'); setShowCurrent(true) } },
        { title: 'Power Dissipation', description: 'Power P = IV = I^2R = V^2/R. Each resistor converts electrical energy to heat. Total power equals source voltage times total current.', setup: () => { setMode('series'); setShowVoltages(true); setShowCurrent(true) } },
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
        const { rTotal, iTotal, resistorData } = calc()

        const draw = () => {
            animTime.current += 0.02
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const cx = w / 2
            const cy = h / 2
            const rs = resistances.slice(0, numResistors)

            // Drawing parameters
            const wireColor = 'rgba(160, 100, 255, 0.4)'
            const resistorColor = 'rgba(160, 100, 255, 0.8)'

            if (mode === 'series') {
                // Series layout: horizontal chain
                const totalWidth = Math.min(w - 160, numResistors * 120 + 100)
                const startX = cx - totalWidth / 2
                const rWidth = 60
                const spacing = (totalWidth - 80) / Math.max(numResistors, 1)

                // Battery
                const batX = startX
                const batY = cy
                ctx.strokeStyle = wireColor; ctx.lineWidth = 2
                // Top wire
                ctx.beginPath()
                ctx.moveTo(batX, batY - 60)
                ctx.lineTo(batX + totalWidth, batY - 60)
                ctx.stroke()
                // Bottom wire
                ctx.beginPath()
                ctx.moveTo(batX, batY + 60)
                ctx.lineTo(batX + totalWidth, batY + 60)
                ctx.stroke()
                // Left vertical
                ctx.beginPath()
                ctx.moveTo(batX, batY - 60)
                ctx.lineTo(batX, batY + 60)
                ctx.stroke()
                // Right vertical
                ctx.beginPath()
                ctx.moveTo(batX + totalWidth, batY - 60)
                ctx.lineTo(batX + totalWidth, batY + 60)
                ctx.stroke()

                // Battery symbol
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.8)'; ctx.lineWidth = 3
                ctx.beginPath(); ctx.moveTo(batX - 8, batY - 15); ctx.lineTo(batX - 8, batY + 15); ctx.stroke()
                ctx.lineWidth = 1.5
                ctx.beginPath(); ctx.moveTo(batX + 4, batY - 8); ctx.lineTo(batX + 4, batY + 8); ctx.stroke()
                ctx.fillStyle = 'rgba(255, 220, 100, 0.8)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`${voltage}V`, batX, batY + 35)
                ctx.fillText('+', batX - 12, batY - 20); ctx.fillText('-', batX + 8, batY - 20)

                // Resistors on top wire
                rs.forEach((r, i) => {
                    const rx = startX + 40 + i * spacing
                    const ry = batY - 60
                    // Zigzag resistor
                    ctx.strokeStyle = i === selectedResistor ? 'rgba(255, 255, 255, 0.9)' : resistorColor
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.moveTo(rx, ry)
                    const segments = 6
                    const segW = rWidth / segments
                    for (let s = 0; s < segments; s++) {
                        const yOff = s % 2 === 0 ? -8 : 8
                        ctx.lineTo(rx + (s + 1) * segW, ry + yOff)
                    }
                    ctx.lineTo(rx + rWidth, ry)
                    ctx.stroke()

                    // Label
                    ctx.fillStyle = i === selectedResistor ? 'rgba(255, 255, 255, 0.9)' : 'rgba(160, 100, 255, 0.7)'
                    ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText(`R${i + 1}`, rx + rWidth / 2, ry - 18)
                    ctx.font = '10px system-ui'
                    ctx.fillText(`${r} Ohm`, rx + rWidth / 2, ry - 30)

                    if (showVoltages) {
                        const rd = resistorData[i]
                        ctx.fillStyle = 'rgba(255, 220, 100, 0.8)'
                        ctx.fillText(`${rd.v.toFixed(1)}V`, rx + rWidth / 2, ry + 24)
                    }
                })

                // Current flow particles
                if (showCurrent && iTotal > 0) {
                    const particleCount = Math.min(20, Math.ceil(iTotal * 3))
                    const speed = iTotal * 0.5
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
                    for (let p = 0; p < particleCount; p++) {
                        const t = ((animTime.current * speed + p * (totalWidth * 2 + 240) / particleCount) % (totalWidth * 2 + 240))
                        let px: number, py: number
                        if (t < totalWidth) {
                            px = startX + t; py = batY - 60
                        } else if (t < totalWidth + 120) {
                            px = startX + totalWidth; py = batY - 60 + (t - totalWidth)
                        } else if (t < totalWidth * 2 + 120) {
                            px = startX + totalWidth - (t - totalWidth - 120); py = batY + 60
                        } else {
                            px = startX; py = batY + 60 - (t - totalWidth * 2 - 120)
                        }
                        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill()
                    }

                    // Current label
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.9)'
                    ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText(`I = ${iTotal.toFixed(2)} A`, cx, batY + 85)
                }
            } else {
                // Parallel layout
                const totalHeight = Math.min(h - 120, numResistors * 60 + 80)
                const startY = cy - totalHeight / 2
                const leftX = cx - 120
                const rightX = cx + 120

                // Left bus
                ctx.strokeStyle = wireColor; ctx.lineWidth = 2
                ctx.beginPath(); ctx.moveTo(leftX, startY); ctx.lineTo(leftX, startY + totalHeight); ctx.stroke()
                // Right bus
                ctx.beginPath(); ctx.moveTo(rightX, startY); ctx.lineTo(rightX, startY + totalHeight); ctx.stroke()
                // Bottom connection
                ctx.beginPath(); ctx.moveTo(leftX, startY + totalHeight); ctx.lineTo(rightX, startY + totalHeight); ctx.stroke()
                // Top connection
                ctx.beginPath(); ctx.moveTo(leftX, startY); ctx.lineTo(rightX, startY); ctx.stroke()

                // Battery at bottom
                const batY2 = startY + totalHeight
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.8)'; ctx.lineWidth = 3
                ctx.beginPath(); ctx.moveTo(cx - 8, batY2 + 5); ctx.lineTo(cx - 8, batY2 + 25); ctx.stroke()
                ctx.lineWidth = 1.5
                ctx.beginPath(); ctx.moveTo(cx + 4, batY2 + 10); ctx.lineTo(cx + 4, batY2 + 20); ctx.stroke()
                ctx.fillStyle = 'rgba(255, 220, 100, 0.8)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`${voltage}V`, cx, batY2 + 40)

                // Resistor branches
                const branchSpacing = totalHeight / (numResistors + 1)
                rs.forEach((r, i) => {
                    const by = startY + (i + 1) * branchSpacing
                    // Horizontal wires
                    ctx.strokeStyle = wireColor; ctx.lineWidth = 2
                    ctx.beginPath(); ctx.moveTo(leftX, by); ctx.lineTo(cx - 30, by); ctx.stroke()
                    ctx.beginPath(); ctx.moveTo(cx + 30, by); ctx.lineTo(rightX, by); ctx.stroke()

                    // Zigzag resistor
                    ctx.strokeStyle = i === selectedResistor ? 'rgba(255, 255, 255, 0.9)' : resistorColor
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    const segments = 6; const segW = 60 / segments
                    ctx.moveTo(cx - 30, by)
                    for (let s = 0; s < segments; s++) {
                        const yOff = s % 2 === 0 ? -6 : 6
                        ctx.lineTo(cx - 30 + (s + 1) * segW, by + yOff)
                    }
                    ctx.lineTo(cx + 30, by)
                    ctx.stroke()

                    // Label
                    ctx.fillStyle = i === selectedResistor ? 'rgba(255, 255, 255, 0.9)' : 'rgba(160, 100, 255, 0.7)'
                    ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText(`R${i + 1}: ${r} Ohm`, cx, by - 14)

                    if (showCurrent && resistorData[i]) {
                        ctx.fillStyle = 'rgba(100, 200, 255, 0.7)'; ctx.font = '10px system-ui'
                        ctx.fillText(`I${i + 1} = ${resistorData[i].i.toFixed(3)} A`, cx, by + 20)
                    }
                })

                // Current flow particles
                if (showCurrent && iTotal > 0) {
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
                    rs.forEach((_, i) => {
                        const by = startY + (i + 1) * branchSpacing
                        const branchI = resistorData[i]?.i ?? 0
                        const count = Math.max(1, Math.ceil(branchI * 5))
                        const speed = branchI * 2
                        for (let p = 0; p < count; p++) {
                            const t = ((animTime.current * speed + p * 300 / count) % 300)
                            const px = leftX + (t / 300) * (rightX - leftX)
                            ctx.beginPath(); ctx.arc(px, by, 2.5, 0, Math.PI * 2); ctx.fill()
                        }
                    })
                }
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [voltage, numResistors, resistances, mode, showCurrent, showVoltages, selectedResistor, calc])

    const { rTotal, iTotal, pTotal, resistorData } = calc()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 4" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Circuit Analysis"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'R_total', value: rTotal.toFixed(1), unit: 'Ohm', color: 'rgb(160, 100, 255)' },
                                { label: 'I_total', value: iTotal.toFixed(4), unit: 'A', color: 'rgb(100, 200, 255)' },
                                { label: 'P_total', value: pTotal.toFixed(2), unit: 'W', color: 'rgb(255, 220, 100)' },
                                { label: 'V_source', value: voltage.toFixed(1), unit: 'V' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[260px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Ohm\'s Law', expression: 'V = I * R' },
                                { label: 'KVL', expression: 'Sum(V) = 0 around loop' },
                                { label: 'KCL', expression: 'Sum(I_in) = Sum(I_out)' },
                                { label: 'Series', expression: 'R_total = R1 + R2 + ...' },
                                { label: 'Parallel', expression: '1/R = 1/R1 + 1/R2 + ...' },
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
                        <ControlGroup label="Circuit Type">
                            <ButtonGroup
                                value={mode}
                                onChange={v => setMode(v as CircuitMode)}
                                options={[
                                    { value: 'series', label: 'Series' },
                                    { value: 'parallel', label: 'Parallel' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Source Voltage">
                            <Slider value={voltage} onChange={setVoltage} min={1} max={50} step={0.5} label={`${voltage} V`} />
                        </ControlGroup>

                        <ControlGroup label="Number of Resistors">
                            <Slider value={numResistors} onChange={v => setNumResistors(Math.round(v))} min={1} max={5} step={1} label={`${numResistors}`} />
                        </ControlGroup>

                        <ControlGroup label={`R${selectedResistor + 1} Value`}>
                            <div className="flex gap-1 mb-2 flex-wrap">
                                {resistances.slice(0, numResistors).map((_, i) => (
                                    <button key={i} onClick={() => setSelectedResistor(i)}
                                        className={`px-2 py-1 text-xs rounded-md ${i === selectedResistor ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'bg-white/5 text-white/50'}`}>
                                        R{i + 1}
                                    </button>
                                ))}
                            </div>
                            <Slider
                                value={resistances[selectedResistor] ?? 100}
                                onChange={v => updateResistance(selectedResistor, v)}
                                min={10} max={1000} step={10}
                                label={`${resistances[selectedResistor] ?? 100} Ohm`}
                            />
                        </ControlGroup>

                        <Toggle value={showCurrent} onChange={setShowCurrent} label="Show Current Flow" />
                        <Toggle value={showVoltages} onChange={setShowVoltages} label="Show Voltages" />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>

                    {resistorData.length > 0 && (
                        <div className="bg-black/30 rounded-xl p-3 border border-white/10 space-y-1.5">
                            <span className="text-xs text-white/40 uppercase tracking-wider">Per Resistor</span>
                            {resistorData.map((rd, i) => (
                                <div key={i} className="flex justify-between text-xs font-mono">
                                    <span className="text-white/50">R{i + 1}</span>
                                    <span className="text-white/70">{rd.v.toFixed(1)}V / {rd.i.toFixed(3)}A / {rd.p.toFixed(2)}W</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
