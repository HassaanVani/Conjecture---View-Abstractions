import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup, Select } from '@/components/control-panel'

const MATERIALS: Record<string, { c: number; label: string; color: string }> = {
    water: { c: 4186, label: 'Water (4186)', color: 'rgb(100, 180, 255)' },
    iron: { c: 450, label: 'Iron (450)', color: 'rgb(180, 180, 190)' },
    copper: { c: 385, label: 'Copper (385)', color: 'rgb(220, 160, 100)' },
    aluminum: { c: 897, label: 'Aluminum (897)', color: 'rgb(200, 210, 220)' },
}

export default function HeatTransfer() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [mode, setMode] = useState<string>('equilibrium')
    const [t1, setT1] = useState(90)
    const [t2, setT2] = useState(20)
    const [mass1, setMass1] = useState(2)
    const [mass2, setMass2] = useState(2)
    const [material1, setMaterial1] = useState('iron')
    const [material2, setMaterial2] = useState('water')
    const [conductivity, setConductivity] = useState(50)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const simT1Ref = useRef(90)
    const simT2Ref = useRef(20)

    const c1 = MATERIALS[material1].c
    const c2 = MATERIALS[material2].c

    const tFinal = (mass1 * c1 * t1 + mass2 * c2 * t2) / (mass1 * c1 + mass2 * c2)

    const reset = useCallback(() => {
        setMode('equilibrium')
        setT1(90); setT2(20)
        setMass1(2); setMass2(2)
        setMaterial1('iron'); setMaterial2('water')
        setConductivity(50)
        setPaused(false)
        timeRef.current = 0
        simT1Ref.current = 90
        simT2Ref.current = 20
    }, [])

    useEffect(() => {
        simT1Ref.current = t1
        simT2Ref.current = t2
        timeRef.current = 0
    }, [t1, t2, mode])

    const demoSteps = [
        { title: 'Thermal Equilibrium', description: 'When two objects at different temperatures make contact, heat flows from hot to cold until both reach the same final temperature. This is thermal equilibrium.', setup: () => { reset(); setMode('equilibrium') } },
        { title: 'Q = mcDeltaT', description: 'The heat transferred depends on mass (m), specific heat (c), and temperature change (DeltaT). More mass or higher specific heat means more energy needed for the same temperature change.', setup: () => { setMode('equilibrium'); setT1(80); setT2(20); setMass1(1); setMass2(1) } },
        { title: 'Specific Heat Comparison', description: 'Water has a very high specific heat (4186 J/kg K) compared to metals like copper (385). This is why water is such a good coolant — it absorbs a lot of energy with small temperature changes.', setup: () => { setMaterial1('copper'); setMaterial2('water'); setMass1(2); setMass2(2); setT1(90); setT2(20) } },
        { title: 'Conduction Rate', description: 'Heat conduction through a material depends on thermal conductivity (k), cross-sectional area (A), temperature difference (DeltaT), and thickness (L). dQ/dt = kA DeltaT/L.', setup: () => { setMode('conduction'); setConductivity(80) } },
        { title: 'Heating Curve with Phase Changes', description: 'When heat is added to a substance, temperature rises — except during phase changes. At a phase transition, temperature stays constant while the substance changes state (melting/boiling).', setup: () => { setMode('heating') } },
        { title: 'Material Properties Matter', description: 'Different materials have different specific heats and thermal conductivities. Iron heats up quickly (low c) while water resists temperature change (high c). This is why a metal pan gets hot fast but water takes time to boil.', setup: () => { setMode('equilibrium'); setMaterial1('iron'); setMaterial2('water'); setT1(95); setT2(15) } },
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
        const particles: { x: number; y: number; vx: number; vy: number; life: number }[] = []

        const draw = () => {
            const dt = 0.016
            if (!paused) timeRef.current += dt
            const time = timeRef.current

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            if (mode === 'equilibrium' || mode === 'conduction') {
                // Simulate heat transfer over time
                if (!paused) {
                    const currentC1 = MATERIALS[material1].c
                    const currentC2 = MATERIALS[material2].c
                    const diff = simT1Ref.current - simT2Ref.current
                    const rate = (mode === 'conduction' ? conductivity * 0.002 : 0.5) * dt
                    const dQ = diff * rate
                    simT1Ref.current -= dQ / (mass1 * currentC1) * 1000
                    simT2Ref.current += dQ / (mass2 * currentC2) * 1000
                }

                const curT1 = simT1Ref.current
                const curT2 = simT2Ref.current

                // Draw two objects
                const boxW = w * 0.22
                const boxH = h * 0.35
                const gap = mode === 'conduction' ? w * 0.12 : 20
                const x1 = w * 0.5 - gap / 2 - boxW
                const x2 = w * 0.5 + gap / 2
                const y = h * 0.3

                // Temperature to color
                const tempColor = (temp: number) => {
                    const t = Math.max(0, Math.min(1, (temp - 0) / 100))
                    const r = Math.round(50 + t * 205)
                    const g = Math.round(80 + (1 - Math.abs(t - 0.5) * 2) * 100)
                    const b = Math.round(255 - t * 205)
                    return `rgb(${r}, ${g}, ${b})`
                }

                // Object 1
                ctx.fillStyle = tempColor(curT1)
                ctx.globalAlpha = 0.8
                ctx.beginPath()
                ctx.roundRect(x1, y, boxW, boxH, 8)
                ctx.fill()
                ctx.globalAlpha = 1
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.roundRect(x1, y, boxW, boxH, 8)
                ctx.stroke()

                ctx.fillStyle = '#fff'
                ctx.font = 'bold 14px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`Object 1`, x1 + boxW / 2, y - 12)
                ctx.font = '12px system-ui'
                ctx.fillStyle = 'rgba(255,255,255,0.7)'
                ctx.fillText(`${MATERIALS[material1].label.split(' ')[0]}, ${mass1} kg`, x1 + boxW / 2, y - 30)
                ctx.fillStyle = '#fff'
                ctx.font = 'bold 22px system-ui'
                ctx.fillText(`${curT1.toFixed(1)} C`, x1 + boxW / 2, y + boxH / 2 + 8)

                // Object 2
                ctx.fillStyle = tempColor(curT2)
                ctx.globalAlpha = 0.8
                ctx.beginPath()
                ctx.roundRect(x2, y, boxW, boxH, 8)
                ctx.fill()
                ctx.globalAlpha = 1
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.roundRect(x2, y, boxW, boxH, 8)
                ctx.stroke()

                ctx.fillStyle = '#fff'
                ctx.font = 'bold 14px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`Object 2`, x2 + boxW / 2, y - 12)
                ctx.font = '12px system-ui'
                ctx.fillStyle = 'rgba(255,255,255,0.7)'
                ctx.fillText(`${MATERIALS[material2].label.split(' ')[0]}, ${mass2} kg`, x2 + boxW / 2, y - 30)
                ctx.fillStyle = '#fff'
                ctx.font = 'bold 22px system-ui'
                ctx.fillText(`${curT2.toFixed(1)} C`, x2 + boxW / 2, y + boxH / 2 + 8)

                // Conduction bar between objects
                if (mode === 'conduction') {
                    const barY = y + boxH * 0.4
                    const barH = boxH * 0.2
                    const grad = ctx.createLinearGradient(x1 + boxW, 0, x2, 0)
                    grad.addColorStop(0, tempColor(curT1))
                    grad.addColorStop(1, tempColor(curT2))
                    ctx.fillStyle = grad
                    ctx.globalAlpha = 0.6
                    ctx.fillRect(x1 + boxW, barY, gap, barH)
                    ctx.globalAlpha = 1
                    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
                    ctx.strokeRect(x1 + boxW, barY, gap, barH)
                    ctx.fillStyle = 'rgba(255,255,255,0.5)'
                    ctx.font = '10px system-ui'
                    ctx.fillText('conductor', w * 0.5, barY - 6)
                }

                // Heat flow particles (hot to cold)
                if (Math.abs(curT1 - curT2) > 0.5 && !paused) {
                    if (Math.random() < 0.3) {
                        const fromHot = curT1 > curT2
                        const startX = fromHot ? x1 + boxW : x2
                        const endX = fromHot ? x2 : x1 + boxW
                        particles.push({
                            x: startX,
                            y: y + boxH * 0.3 + Math.random() * boxH * 0.4,
                            vx: (endX - startX) * 0.01 * (0.8 + Math.random() * 0.4),
                            vy: (Math.random() - 0.5) * 0.8,
                            life: 1,
                        })
                    }
                }

                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i]
                    if (!paused) {
                        p.x += p.vx
                        p.y += p.vy
                        p.life -= 0.012
                    }
                    if (p.life <= 0) { particles.splice(i, 1); continue }
                    ctx.fillStyle = `rgba(255, 180, 80, ${p.life * 0.8})`
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
                    ctx.fill()
                }

                // Heat flow arrow
                if (Math.abs(curT1 - curT2) > 1) {
                    const arrowY = y + boxH + 30
                    const fromX = curT1 > curT2 ? x1 + boxW : x2
                    const toX = curT1 > curT2 ? x2 : x1 + boxW
                    ctx.strokeStyle = 'rgba(255, 180, 80, 0.6)'
                    ctx.lineWidth = 2.5
                    ctx.beginPath()
                    ctx.moveTo(fromX, arrowY)
                    ctx.lineTo(toX, arrowY)
                    ctx.stroke()
                    const dir = toX > fromX ? 1 : -1
                    ctx.beginPath()
                    ctx.moveTo(toX, arrowY)
                    ctx.lineTo(toX - dir * 10, arrowY - 6)
                    ctx.lineTo(toX - dir * 10, arrowY + 6)
                    ctx.closePath()
                    ctx.fillStyle = 'rgba(255, 180, 80, 0.6)'
                    ctx.fill()
                    ctx.fillStyle = 'rgba(255, 180, 80, 0.8)'
                    ctx.font = '12px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('Heat Flow (Q)', (fromX + toX) / 2, arrowY - 12)
                }

                // Temperature bars
                const barX = w * 0.1
                const barW = w * 0.8
                const barY2 = h * 0.82
                const barHeight = 12

                ctx.fillStyle = 'rgba(255,255,255,0.3)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText('0 C', barX, barY2 - 5)
                ctx.textAlign = 'right'
                ctx.fillText('100 C', barX + barW, barY2 - 5)

                // Bar background
                ctx.fillStyle = 'rgba(255,255,255,0.05)'
                ctx.beginPath()
                ctx.roundRect(barX, barY2, barW, barHeight, 4)
                ctx.fill()

                // T1 marker
                const t1Pos = barX + (curT1 / 100) * barW
                ctx.fillStyle = tempColor(curT1)
                ctx.beginPath()
                ctx.arc(t1Pos, barY2 + barHeight / 2, 7, 0, Math.PI * 2)
                ctx.fill()
                ctx.fillStyle = '#fff'
                ctx.font = 'bold 8px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('1', t1Pos, barY2 + barHeight / 2 + 3)

                // T2 marker
                const t2Pos = barX + (curT2 / 100) * barW
                ctx.fillStyle = tempColor(curT2)
                ctx.beginPath()
                ctx.arc(t2Pos, barY2 + barHeight / 2, 7, 0, Math.PI * 2)
                ctx.fill()
                ctx.fillStyle = '#fff'
                ctx.font = 'bold 8px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('2', t2Pos, barY2 + barHeight / 2 + 3)

                // T_final marker
                const tfPos = barX + (tFinal / 100) * barW
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.6)'
                ctx.lineWidth = 1.5
                ctx.setLineDash([4, 3])
                ctx.beginPath()
                ctx.moveTo(tfPos, barY2 - 3)
                ctx.lineTo(tfPos, barY2 + barHeight + 3)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(255, 220, 100, 0.8)'
                ctx.font = '10px system-ui'
                ctx.fillText(`T_f = ${tFinal.toFixed(1)} C`, tfPos, barY2 + barHeight + 16)
            }

            if (mode === 'heating') {
                // Heating curve: temperature vs heat added for water
                const padL = 70, padR = 30, padT = 50, padB = 60
                const gw = w - padL - padR
                const gh = h - padT - padB

                // Phase boundaries for water (approx, scaled): ice -> water -> steam
                // Segments: (1) ice heating, (2) melting at 0C, (3) water heating, (4) boiling at 100C, (5) steam heating
                const segments = [
                    { qEnd: 0.08, tStart: -20, tEnd: 0, label: 'Ice heats' },
                    { qEnd: 0.2, tStart: 0, tEnd: 0, label: 'Melting (334 kJ/kg)' },
                    { qEnd: 0.6, tStart: 0, tEnd: 100, label: 'Water heats' },
                    { qEnd: 0.85, tStart: 100, tEnd: 100, label: 'Boiling (2260 kJ/kg)' },
                    { qEnd: 1.0, tStart: 100, tEnd: 120, label: 'Steam heats' },
                ]

                // Axes
                ctx.strokeStyle = 'rgba(255,255,255,0.3)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(padL, padT)
                ctx.lineTo(padL, padT + gh)
                ctx.lineTo(padL + gw, padT + gh)
                ctx.stroke()

                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Heat Added (Q)', padL + gw / 2, h - 12)
                ctx.save()
                ctx.translate(18, padT + gh / 2)
                ctx.rotate(-Math.PI / 2)
                ctx.fillText('Temperature (C)', 0, 0)
                ctx.restore()

                // Temperature scale markers
                ctx.font = '10px system-ui'
                ctx.textAlign = 'right'
                for (let t = -20; t <= 120; t += 20) {
                    const yy = padT + gh - ((t + 20) / 140) * gh
                    ctx.fillStyle = 'rgba(255,255,255,0.3)'
                    ctx.fillText(`${t}`, padL - 8, yy + 3)
                    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
                    ctx.beginPath()
                    ctx.moveTo(padL, yy)
                    ctx.lineTo(padL + gw, yy)
                    ctx.stroke()
                }

                // Draw heating curve
                ctx.strokeStyle = 'rgb(160, 100, 255)'
                ctx.lineWidth = 2.5
                ctx.beginPath()
                let prevQEnd = 0
                segments.forEach((seg, i) => {
                    const x0 = padL + prevQEnd * gw
                    const x1 = padL + seg.qEnd * gw
                    const y0 = padT + gh - ((seg.tStart + 20) / 140) * gh
                    const y1 = padT + gh - ((seg.tEnd + 20) / 140) * gh
                    if (i === 0) ctx.moveTo(x0, y0)
                    ctx.lineTo(x1, y1)
                    prevQEnd = seg.qEnd
                })
                ctx.stroke()

                // Animated marker along curve
                const progress = (time * 0.08) % 1
                let markerX = 0, markerY = 0
                prevQEnd = 0
                for (const seg of segments) {
                    if (progress <= seg.qEnd) {
                        const segProgress = (progress - prevQEnd) / (seg.qEnd - prevQEnd)
                        const temp = seg.tStart + (seg.tEnd - seg.tStart) * segProgress
                        markerX = padL + progress * gw
                        markerY = padT + gh - ((temp + 20) / 140) * gh
                        break
                    }
                    prevQEnd = seg.qEnd
                }

                ctx.fillStyle = 'rgb(160, 100, 255)'
                ctx.beginPath()
                ctx.arc(markerX, markerY, 6, 0, Math.PI * 2)
                ctx.fill()
                ctx.fillStyle = 'rgba(160, 100, 255, 0.3)'
                ctx.beginPath()
                ctx.arc(markerX, markerY, 12, 0, Math.PI * 2)
                ctx.fill()

                // Phase labels
                prevQEnd = 0
                segments.forEach(seg => {
                    const midQ = (prevQEnd + seg.qEnd) / 2
                    const midT = (seg.tStart + seg.tEnd) / 2
                    const lx = padL + midQ * gw
                    const ly = padT + gh - ((midT + 20) / 140) * gh

                    if (seg.tStart === seg.tEnd) {
                        // Phase change — draw dashed horizontal
                        ctx.strokeStyle = 'rgba(255, 180, 80, 0.3)'
                        ctx.setLineDash([4, 4])
                        ctx.beginPath()
                        ctx.moveTo(padL + prevQEnd * gw, ly)
                        ctx.lineTo(padL + seg.qEnd * gw, ly)
                        ctx.stroke()
                        ctx.setLineDash([])
                        ctx.fillStyle = 'rgba(255, 180, 80, 0.8)'
                        ctx.font = '10px system-ui'
                        ctx.textAlign = 'center'
                        ctx.fillText(seg.label, lx, ly - 12)
                    } else {
                        ctx.fillStyle = 'rgba(255,255,255,0.4)'
                        ctx.font = '10px system-ui'
                        ctx.textAlign = 'center'
                        ctx.fillText(seg.label, lx, ly - 12)
                    }
                    prevQEnd = seg.qEnd
                })
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [mode, t1, t2, mass1, mass2, material1, material2, conductivity, paused, tFinal])

    const qTransferred = Math.abs(mass1 * c1 * (tFinal - t1))

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 9" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Heat Transfer"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'T_1', value: `${t1.toFixed(0)}`, unit: 'C' },
                                { label: 'T_2', value: `${t2.toFixed(0)}`, unit: 'C' },
                                { label: 'T_final', value: tFinal.toFixed(1), unit: 'C', color: 'rgb(255, 220, 100)' },
                                { label: 'Q transferred', value: qTransferred.toFixed(0), unit: 'J', color: 'rgb(255, 180, 80)' },
                                { label: 'c_1', value: `${c1}`, unit: 'J/kgK' },
                                { label: 'c_2', value: `${c2}`, unit: 'J/kgK' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Heat', expression: 'Q = mcDeltaT', description: 'Energy to change temperature' },
                                { label: 'Equilibrium', expression: 'T_f = (m1c1T1 + m2c2T2)/(m1c1 + m2c2)' },
                                { label: 'Conduction', expression: 'dQ/dt = kA DeltaT / L', description: 'Rate of heat conduction' },
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
                        <ControlGroup label="Mode">
                            <ButtonGroup
                                value={mode}
                                onChange={setMode}
                                options={[
                                    { value: 'equilibrium', label: 'Equilibrium' },
                                    { value: 'heating', label: 'Heating' },
                                    { value: 'conduction', label: 'Conduction' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="T1 Initial">
                            <Slider value={t1} onChange={setT1} min={-20} max={100} step={1} label={`T_1 = ${t1} C`} />
                        </ControlGroup>

                        <ControlGroup label="T2 Initial">
                            <Slider value={t2} onChange={setT2} min={-20} max={100} step={1} label={`T_2 = ${t2} C`} />
                        </ControlGroup>

                        <ControlGroup label="Mass 1">
                            <Slider value={mass1} onChange={setMass1} min={0.5} max={10} step={0.5} label={`m_1 = ${mass1} kg`} />
                        </ControlGroup>

                        <ControlGroup label="Mass 2">
                            <Slider value={mass2} onChange={setMass2} min={0.5} max={10} step={0.5} label={`m_2 = ${mass2} kg`} />
                        </ControlGroup>

                        <Select
                            value={material1}
                            onChange={setMaterial1}
                            label="Material 1"
                            options={Object.entries(MATERIALS).map(([k, v]) => ({ value: k, label: v.label }))}
                        />

                        <Select
                            value={material2}
                            onChange={setMaterial2}
                            label="Material 2"
                            options={Object.entries(MATERIALS).map(([k, v]) => ({ value: k, label: v.label }))}
                        />

                        {mode === 'conduction' && (
                            <ControlGroup label="Thermal Conductivity">
                                <Slider value={conductivity} onChange={setConductivity} min={1} max={200} step={1} label={`k = ${conductivity} W/mK`} />
                            </ControlGroup>
                        )}

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
