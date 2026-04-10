import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

interface CircuitSolution {
    I: number[]
    V: number[]
    P: number[]
}

function solveSeriesParallel(emf: number, r1: number, r2: number, r3: number): CircuitSolution {
    // R2 and R3 in parallel, series with R1
    const rPar = (r2 * r3) / (r2 + r3)
    const rTotal = r1 + rPar
    const iTotal = emf / rTotal
    const v1 = iTotal * r1
    const vPar = iTotal * rPar
    const i2 = vPar / r2
    const i3 = vPar / r3
    return {
        I: [iTotal, i2, i3],
        V: [v1, vPar, vPar],
        P: [iTotal * iTotal * r1, i2 * i2 * r2, i3 * i3 * r3],
    }
}

function solveTwoLoop(emf: number, r1: number, r2: number, r3: number): CircuitSolution {
    // Two loops sharing R2:
    // Loop 1: emf - I1*R1 - (I1-I2)*R2 = 0
    // Loop 2: -(I2)*R3 - (I2-I1)*R2 = 0
    // Rearranging: I1*(R1+R2) - I2*R2 = emf; -I1*R2 + I2*(R2+R3) = 0
    const det = (r1 + r2) * (r2 + r3) - r2 * r2
    const i1 = (emf * (r2 + r3)) / det
    const i2 = (emf * r2) / det
    const iR2 = i1 - i2
    return {
        I: [i1, iR2, i2],
        V: [i1 * r1, iR2 * r2, i2 * r3],
        P: [i1 * i1 * r1, iR2 * iR2 * r2, i2 * i2 * r3],
    }
}

function solveWheatstone(emf: number, r1: number, r2: number, r3: number): CircuitSolution {
    // Simplified Wheatstone: R1 top-left, R2 top-right, R3 bottom-left, R4=R3 bottom-right
    const r4 = r3
    // Using mesh analysis for two loops
    const rTotal = r1 + (r2 * (r3 + r4)) / (r2 + r3 + r4)
    const iTotal = emf / rTotal
    const vTop = emf - iTotal * r1
    const i2 = vTop / r2
    const i34 = vTop / (r3 + r4)
    return {
        I: [iTotal, i2, i34],
        V: [iTotal * r1, vTop, i34 * r3],
        P: [iTotal * iTotal * r1, i2 * i2 * r2, i34 * i34 * r3],
    }
}

export default function KirchhoffLaws() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [topology, setTopology] = useState<string>('series-parallel')
    const [emf, setEmf] = useState(12)
    const [r1, setR1] = useState(100)
    const [r2, setR2] = useState(200)
    const [r3, setR3] = useState(300)
    const [showCurrentLabels, setShowCurrentLabels] = useState(true)
    const [showVoltageLabels, setShowVoltageLabels] = useState(true)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const [highlightLoop, setHighlightLoop] = useState(-1)

    const solve = useCallback(() => {
        if (topology === 'series-parallel') return solveSeriesParallel(emf, r1, r2, r3)
        if (topology === 'two-loop') return solveTwoLoop(emf, r1, r2, r3)
        return solveWheatstone(emf, r1, r2, r3)
    }, [topology, emf, r1, r2, r3])

    const solution = solve()

    const reset = useCallback(() => {
        setTopology('series-parallel')
        setEmf(12); setR1(100); setR2(200); setR3(300)
        setShowCurrentLabels(true); setShowVoltageLabels(true)
        setPaused(false); timeRef.current = 0; setHighlightLoop(-1)
    }, [])

    const demoSteps = [
        { title: "Kirchhoff's Loop Rule (KVL)", description: "Around any closed loop in a circuit, the sum of all voltage gains and drops must equal zero: SigmaV = 0. This is conservation of energy — a charge that goes around a loop returns to its starting energy.", setup: () => { reset(); setHighlightLoop(0) } },
        { title: 'Voltage Drops Around a Loop', description: 'Trace a loop: the battery provides a voltage rise (+EMF). Each resistor causes a voltage drop (-IR). The total around the loop sums to zero. Watch the colored loop highlights.', setup: () => { setTopology('series-parallel'); setHighlightLoop(0); setShowVoltageLabels(true) } },
        { title: "Junction Rule (KCL)", description: "At any junction (node) in a circuit, the total current flowing in equals the total current flowing out: SigmaI_in = SigmaI_out. This is conservation of charge — charge cannot accumulate at a node.", setup: () => { setHighlightLoop(-1); setShowCurrentLabels(true) } },
        { title: 'Current Splitting at Nodes', description: 'Where the circuit branches, current divides according to resistance. Lower resistance paths carry more current. The total current in always equals the total current out. I_total = I_2 + I_3.', setup: () => { setTopology('series-parallel'); setShowCurrentLabels(true) } },
        { title: 'Solving a Two-Loop Circuit', description: 'For circuits with multiple loops, apply KVL to each loop and KCL at each junction. This gives a system of equations that can be solved simultaneously for all unknown currents.', setup: () => { setTopology('two-loop'); setShowCurrentLabels(true); setShowVoltageLabels(true); setHighlightLoop(0) } },
        { title: 'Power Dissipation', description: 'Each resistor dissipates power as heat: P = IV = I2R = V2/R. The total power dissipated by all resistors equals the power supplied by the battery: P_battery = EMF x I_total.', setup: () => { setTopology('series-parallel'); setHighlightLoop(-1) } },
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
            const dt = 0.016
            if (!paused) timeRef.current += dt
            const time = timeRef.current

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const cx = w / 2
            const cy = h / 2
            const sol = solve()

            // Draw wire segment
            const drawWire = (x1: number, y1: number, x2: number, y2: number, current: number, color: string) => {
                ctx.strokeStyle = color
                ctx.lineWidth = 2.5
                ctx.beginPath()
                ctx.moveTo(x1, y1)
                ctx.lineTo(x2, y2)
                ctx.stroke()

                // Animated current dots
                if (Math.abs(current) > 0.001) {
                    const len = Math.hypot(x2 - x1, y2 - y1)
                    const nx = (x2 - x1) / len
                    const ny = (y2 - y1) / len
                    const dotSpacing = 25
                    const numDots = Math.floor(len / dotSpacing)
                    const dir = current > 0 ? 1 : -1
                    for (let i = 0; i < numDots; i++) {
                        const t = ((i / numDots + time * Math.abs(current) * 0.3 * dir) % 1 + 1) % 1
                        const dx = x1 + nx * t * len
                        const dy = y1 + ny * t * len
                        ctx.fillStyle = 'rgba(255, 220, 100, 0.8)'
                        ctx.beginPath()
                        ctx.arc(dx, dy, 3, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }
            }

            // Draw resistor symbol
            const drawResistor = (x: number, y: number, horizontal: boolean, label: string, resistance: number, vDrop: number, current: number) => {
                const len = 40
                const zigW = 8

                ctx.strokeStyle = 'rgba(160, 100, 255, 0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                if (horizontal) {
                    ctx.moveTo(x - len, y)
                    for (let i = 0; i < 5; i++) {
                        const px = x - len + (i + 0.5) * (2 * len / 5)
                        ctx.lineTo(px - len / 10, y + (i % 2 === 0 ? -zigW : zigW))
                    }
                    ctx.lineTo(x + len, y)
                } else {
                    ctx.moveTo(x, y - len)
                    for (let i = 0; i < 5; i++) {
                        const py = y - len + (i + 0.5) * (2 * len / 5)
                        ctx.lineTo(x + (i % 2 === 0 ? -zigW : zigW), py - len / 10)
                    }
                    ctx.lineTo(x, y + len)
                }
                ctx.stroke()

                // Label
                ctx.fillStyle = 'rgba(255,255,255,0.8)'
                ctx.font = 'bold 12px system-ui'
                ctx.textAlign = 'center'
                const labelOff = horizontal ? -20 : 20
                if (horizontal) {
                    ctx.fillText(label, x, y + labelOff)
                    ctx.font = '10px system-ui'
                    ctx.fillStyle = 'rgba(255,255,255,0.5)'
                    ctx.fillText(`${resistance} Ohm`, x, y + labelOff + 14)
                } else {
                    ctx.fillText(label, x + labelOff + 10, y)
                    ctx.font = '10px system-ui'
                    ctx.fillStyle = 'rgba(255,255,255,0.5)'
                    ctx.fillText(`${resistance} Ohm`, x + labelOff + 10, y + 14)
                }

                // Voltage drop label
                if (showVoltageLabels) {
                    ctx.fillStyle = 'rgba(255, 140, 80, 0.8)'
                    ctx.font = '10px system-ui'
                    const vOff = horizontal ? 35 : -25
                    if (horizontal) {
                        ctx.fillText(`${Math.abs(vDrop).toFixed(2)} V`, x, y - vOff + 10)
                    } else {
                        ctx.fillText(`${Math.abs(vDrop).toFixed(2)} V`, x - vOff - 10, y)
                    }
                }

                // Current label
                if (showCurrentLabels) {
                    ctx.fillStyle = 'rgba(100, 255, 150, 0.8)'
                    ctx.font = '10px system-ui'
                    const iOff = horizontal ? -35 : 40
                    if (horizontal) {
                        ctx.fillText(`${Math.abs(current * 1000).toFixed(1)} mA`, x, y + iOff)
                    } else {
                        ctx.fillText(`${Math.abs(current * 1000).toFixed(1)} mA`, x + iOff, y + 20)
                    }
                }
            }

            // Draw battery
            const drawBattery = (x: number, y: number) => {
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.8)'
                ctx.lineWidth = 2
                // Long line (positive terminal)
                ctx.beginPath()
                ctx.moveTo(x - 12, y - 18)
                ctx.lineTo(x - 12, y + 18)
                ctx.stroke()
                // Short line (negative terminal)
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(x + 8, y - 10)
                ctx.lineTo(x + 8, y + 10)
                ctx.stroke()

                // + and - symbols
                ctx.fillStyle = 'rgba(255, 220, 100, 0.8)'
                ctx.font = 'bold 12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('+', x - 22, y + 4)
                ctx.fillText('-', x + 20, y + 4)

                ctx.fillStyle = 'rgba(255,255,255,0.7)'
                ctx.font = 'bold 12px system-ui'
                ctx.fillText(`${emf} V`, x, y - 28)
            }

            if (topology === 'series-parallel') {
                // Layout: Battery left, R1 top, then R2/R3 parallel on right
                const left = cx - 180
                const right = cx + 180
                const top = cy - 120
                const bot = cy + 120
                const mid = cx + 40

                // Loop highlight
                if (highlightLoop >= 0) {
                    ctx.strokeStyle = highlightLoop === 0 ? 'rgba(160, 100, 255, 0.15)' : 'rgba(100, 200, 255, 0.15)'
                    ctx.lineWidth = 20
                    ctx.beginPath()
                    ctx.moveTo(left, top); ctx.lineTo(right, top)
                    if (highlightLoop === 0) {
                        ctx.lineTo(right, bot); ctx.lineTo(left, bot); ctx.closePath()
                    } else {
                        ctx.lineTo(right, bot); ctx.lineTo(left, bot); ctx.closePath()
                    }
                    ctx.stroke()
                }

                // Wires
                drawWire(left, bot, left, top, sol.I[0], 'rgba(255,255,255,0.25)')
                drawWire(left, top, mid - 40, top, sol.I[0], 'rgba(255,255,255,0.25)')
                drawWire(mid + 40, top, right, top, sol.I[0], 'rgba(255,255,255,0.25)')
                // Split
                drawWire(right, top, right, cy - 40, sol.I[1], 'rgba(255,255,255,0.25)')
                drawWire(right, cy + 40, right, bot, sol.I[1], 'rgba(255,255,255,0.25)')
                // R3 path — drawn offset to the right
                const r3x = right + 60
                drawWire(right, top, r3x, top, sol.I[2], 'rgba(255,255,255,0.25)')
                drawWire(r3x, top, r3x, cy - 40, sol.I[2], 'rgba(255,255,255,0.25)')
                drawWire(r3x, cy + 40, r3x, bot, sol.I[2], 'rgba(255,255,255,0.25)')
                drawWire(r3x, bot, right, bot, sol.I[2], 'rgba(255,255,255,0.25)')
                // Bottom wire
                drawWire(left, bot, right, bot, sol.I[0], 'rgba(255,255,255,0.25)')

                // Components
                drawBattery(left, cy)
                drawResistor(mid, top, true, 'R1', r1, sol.V[0], sol.I[0])
                drawResistor(right, cy, false, 'R2', r2, sol.V[1], sol.I[1])
                drawResistor(r3x, cy, false, 'R3', r3, sol.V[2], sol.I[2])

                // Junction markers
                ctx.fillStyle = 'rgba(100, 255, 150, 0.6)'
                ctx.beginPath()
                ctx.arc(right, top, 5, 0, Math.PI * 2)
                ctx.fill()
                ctx.beginPath()
                ctx.arc(right, bot, 5, 0, Math.PI * 2)
                ctx.fill()

                // Junction label
                if (showCurrentLabels) {
                    ctx.fillStyle = 'rgba(100, 255, 150, 0.6)'
                    ctx.font = '10px system-ui'
                    ctx.textAlign = 'left'
                    ctx.fillText(`I_in = I_2 + I_3`, right + 10, top - 10)
                    ctx.fillText(`${(sol.I[0] * 1000).toFixed(1)} = ${(sol.I[1] * 1000).toFixed(1)} + ${(sol.I[2] * 1000).toFixed(1)} mA`, right + 10, top + 4)
                }
            }

            if (topology === 'two-loop') {
                const left = cx - 180
                const right = cx + 180
                const top = cy - 120
                const bot = cy + 120
                const midX = cx

                // Loop highlights
                if (highlightLoop === 0) {
                    ctx.strokeStyle = 'rgba(160, 100, 255, 0.12)'
                    ctx.lineWidth = 18
                    ctx.beginPath()
                    ctx.moveTo(left, top); ctx.lineTo(midX, top); ctx.lineTo(midX, bot); ctx.lineTo(left, bot); ctx.closePath()
                    ctx.stroke()
                } else if (highlightLoop === 1) {
                    ctx.strokeStyle = 'rgba(100, 200, 255, 0.12)'
                    ctx.lineWidth = 18
                    ctx.beginPath()
                    ctx.moveTo(midX, top); ctx.lineTo(right, top); ctx.lineTo(right, bot); ctx.lineTo(midX, bot); ctx.closePath()
                    ctx.stroke()
                }

                // Wires - Loop 1
                drawWire(left, bot, left, top, sol.I[0], 'rgba(255,255,255,0.25)')
                drawWire(left, top, midX, top, sol.I[0], 'rgba(255,255,255,0.25)')
                drawWire(midX, top, midX, cy - 40, sol.I[1], 'rgba(255,255,255,0.25)')
                drawWire(midX, cy + 40, midX, bot, sol.I[1], 'rgba(255,255,255,0.25)')
                drawWire(left, bot, midX, bot, sol.I[0], 'rgba(255,255,255,0.25)')

                // Wires - Loop 2
                drawWire(midX, top, right, top, sol.I[2], 'rgba(255,255,255,0.25)')
                drawWire(right, top, right, bot, sol.I[2], 'rgba(255,255,255,0.25)')
                drawWire(midX, bot, right, bot, sol.I[2], 'rgba(255,255,255,0.25)')

                // Components
                drawBattery(left, cy)
                drawResistor(left + (midX - left) / 2, top, true, 'R1', r1, sol.V[0], sol.I[0])
                drawResistor(midX, cy, false, 'R2', r2, sol.V[1], sol.I[1])
                drawResistor(right, cy, false, 'R3', r3, sol.V[2], sol.I[2])

                // Junction nodes
                ctx.fillStyle = 'rgba(100, 255, 150, 0.6)'
                ctx.beginPath(); ctx.arc(midX, top, 5, 0, Math.PI * 2); ctx.fill()
                ctx.beginPath(); ctx.arc(midX, bot, 5, 0, Math.PI * 2); ctx.fill()

                // Loop labels
                ctx.fillStyle = 'rgba(160, 100, 255, 0.5)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Loop 1', (left + midX) / 2, cy + 5)
                ctx.fillStyle = 'rgba(100, 200, 255, 0.5)'
                ctx.fillText('Loop 2', (midX + right) / 2, cy + 5)
            }

            if (topology === 'wheatstone') {
                // Diamond layout
                const topN = { x: cx, y: cy - 130 }
                const botN = { x: cx, y: cy + 130 }
                const leftN = { x: cx - 160, y: cy }
                const rightN = { x: cx + 160, y: cy }

                // Loop highlight
                if (highlightLoop === 0) {
                    ctx.strokeStyle = 'rgba(160, 100, 255, 0.12)'
                    ctx.lineWidth = 18
                    ctx.beginPath()
                    ctx.moveTo(topN.x, topN.y); ctx.lineTo(rightN.x, rightN.y)
                    ctx.lineTo(botN.x, botN.y); ctx.lineTo(leftN.x, leftN.y); ctx.closePath()
                    ctx.stroke()
                }

                // Wires
                drawWire(leftN.x, leftN.y, topN.x, topN.y, sol.I[0], 'rgba(255,255,255,0.25)')
                drawWire(topN.x, topN.y, rightN.x, rightN.y, sol.I[1], 'rgba(255,255,255,0.25)')
                drawWire(leftN.x, leftN.y, botN.x, botN.y, sol.I[2], 'rgba(255,255,255,0.25)')
                drawWire(botN.x, botN.y, rightN.x, rightN.y, sol.I[2], 'rgba(255,255,255,0.25)')

                // Battery on left
                drawBattery(leftN.x - 40, leftN.y)
                drawWire(leftN.x - 55, leftN.y, leftN.x, leftN.y, sol.I[0], 'rgba(255,255,255,0.25)')

                // Resistors on the four arms
                const midTL = { x: (leftN.x + topN.x) / 2, y: (leftN.y + topN.y) / 2 }
                const midTR = { x: (topN.x + rightN.x) / 2, y: (topN.y + rightN.y) / 2 }
                const midBL = { x: (leftN.x + botN.x) / 2, y: (leftN.y + botN.y) / 2 }
                const midBR = { x: (botN.x + rightN.x) / 2, y: (botN.y + rightN.y) / 2 }

                // Draw resistor labels at the arm midpoints
                const drawArmLabel = (mx: number, my: number, label: string, R: number, V: number, I: number, side: number) => {
                    ctx.fillStyle = 'rgba(160, 100, 255, 0.8)'
                    ctx.font = 'bold 12px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(label, mx + side * 25, my)
                    ctx.font = '10px system-ui'
                    ctx.fillStyle = 'rgba(255,255,255,0.5)'
                    ctx.fillText(`${R} Ohm`, mx + side * 25, my + 14)
                    if (showVoltageLabels) {
                        ctx.fillStyle = 'rgba(255, 140, 80, 0.8)'
                        ctx.fillText(`${Math.abs(V).toFixed(2)} V`, mx + side * 25, my + 28)
                    }
                    if (showCurrentLabels) {
                        ctx.fillStyle = 'rgba(100, 255, 150, 0.8)'
                        ctx.fillText(`${Math.abs(I * 1000).toFixed(1)} mA`, mx + side * 25, my + 42)
                    }
                }

                drawArmLabel(midTL.x, midTL.y, 'R1', r1, sol.V[0], sol.I[0], -1)
                drawArmLabel(midTR.x, midTR.y, 'R2', r2, sol.V[1], sol.I[1], 1)
                drawArmLabel(midBL.x, midBL.y, 'R3', r3, sol.V[2], sol.I[2], -1)
                drawArmLabel(midBR.x, midBR.y, 'R4', r3, sol.V[2], sol.I[2], 1)

                // Junction nodes
                ctx.fillStyle = 'rgba(100, 255, 150, 0.6)'
                ;[topN, botN, leftN, rightN].forEach(n => {
                    ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, Math.PI * 2); ctx.fill()
                })
            }

            // KVL verification text
            ctx.fillStyle = 'rgba(255,255,255,0.35)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'center'
            const kvlText = `Loop check: ${emf.toFixed(1)}V - ${sol.V[0].toFixed(2)}V - ${sol.V[1].toFixed(2)}V = ${(emf - sol.V[0] - sol.V[1]).toFixed(4)}V (should be 0)`
            ctx.fillText(kvlText, cx, h - 30)

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [topology, emf, r1, r2, r3, showCurrentLabels, showVoltageLabels, paused, highlightLoop, solve])

    const pTotal = solution.P.reduce((a, b) => a + b, 0)

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 11" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Kirchhoff's Laws"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'I_R1', value: (solution.I[0] * 1000).toFixed(2), unit: 'mA', color: 'rgb(100, 255, 150)' },
                                { label: 'I_R2', value: (solution.I[1] * 1000).toFixed(2), unit: 'mA', color: 'rgb(100, 255, 150)' },
                                { label: 'I_R3', value: (solution.I[2] * 1000).toFixed(2), unit: 'mA', color: 'rgb(100, 255, 150)' },
                                { label: 'V_R1', value: solution.V[0].toFixed(2), unit: 'V', color: 'rgb(255, 140, 80)' },
                                { label: 'V_R2', value: solution.V[1].toFixed(2), unit: 'V', color: 'rgb(255, 140, 80)' },
                                { label: 'V_R3', value: solution.V[2].toFixed(2), unit: 'V', color: 'rgb(255, 140, 80)' },
                                { label: 'P_total', value: (pTotal * 1000).toFixed(2), unit: 'mW' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'KVL', expression: 'SigmaV_loop = 0', description: 'Sum of voltages around any loop' },
                                { label: 'KCL', expression: 'SigmaI_junction = 0', description: 'Sum of currents at any node' },
                                { label: "Ohm's Law", expression: 'V = IR' },
                                { label: 'Power', expression: 'P = IV = I2R', description: 'Power dissipated' },
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
                        <ControlGroup label="Circuit Topology">
                            <ButtonGroup
                                value={topology}
                                onChange={setTopology}
                                options={[
                                    { value: 'series-parallel', label: 'Series-Par' },
                                    { value: 'two-loop', label: 'Two-Loop' },
                                    { value: 'wheatstone', label: 'Wheatstone' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Battery EMF">
                            <Slider value={emf} onChange={setEmf} min={1} max={24} step={0.5} label={`EMF = ${emf} V`} />
                        </ControlGroup>

                        <ControlGroup label="R1">
                            <Slider value={r1} onChange={setR1} min={10} max={1000} step={10} label={`R_1 = ${r1} Ohm`} />
                        </ControlGroup>

                        <ControlGroup label="R2">
                            <Slider value={r2} onChange={setR2} min={10} max={1000} step={10} label={`R_2 = ${r2} Ohm`} />
                        </ControlGroup>

                        <ControlGroup label="R3">
                            <Slider value={r3} onChange={setR3} min={10} max={1000} step={10} label={`R_3 = ${r3} Ohm`} />
                        </ControlGroup>

                        <ControlGroup label="Highlight Loop">
                            <ButtonGroup
                                value={String(highlightLoop)}
                                onChange={(v) => setHighlightLoop(parseInt(v))}
                                options={[
                                    { value: '-1', label: 'None' },
                                    { value: '0', label: 'Loop 1' },
                                    { value: '1', label: 'Loop 2' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <Toggle value={showCurrentLabels} onChange={setShowCurrentLabels} label="Current Labels" />
                        <Toggle value={showVoltageLabels} onChange={setShowVoltageLabels} label="Voltage Labels" />
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
