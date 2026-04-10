import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'

const K = 8.99e9

interface SourceCharge {
    x: number
    y: number
    q: number
}

export default function ElectricPotential() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [numCharges, setNumCharges] = useState(1)
    const [q1Val, setQ1Val] = useState(3)
    const [q2Val, setQ2Val] = useState(-2)
    const [q3Val, setQ3Val] = useState(1)
    const [showEquipotential, setShowEquipotential] = useState(true)
    const [showEField, setShowEField] = useState(false)
    const [showColormap, setShowColormap] = useState(true)
    const [testChargeOn, setTestChargeOn] = useState(false)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const cursorRef = useRef({ x: 0, y: 0 })
    const testChargeRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, placed: false })
    const [cursorV, setCursorV] = useState(0)
    const [cursorE, setCursorE] = useState(0)

    const reset = useCallback(() => {
        setNumCharges(1); setQ1Val(3); setQ2Val(-2); setQ3Val(1)
        setShowEquipotential(true); setShowEField(false)
        setShowColormap(true); setTestChargeOn(false)
        setPaused(false); timeRef.current = 0
        testChargeRef.current = { x: 0, y: 0, vx: 0, vy: 0, placed: false }
    }, [])

    const demoSteps = [
        { title: 'Electric Potential', description: 'Electric potential V is the electric potential energy per unit charge at a point in space. It is a scalar quantity — it has magnitude but no direction. Positive charges create positive potential, negative charges create negative potential.', setup: () => { reset(); setShowColormap(true) } },
        { title: 'Potential from a Point Charge', description: 'The potential at distance r from a point charge q is V = kq/r. It decreases with distance. Notice the color gradient: red/bright for high potential near positive charges, blue for low potential near negative charges.', setup: () => { setNumCharges(1); setQ1Val(4); setShowColormap(true); setShowEquipotential(false) } },
        { title: 'Equipotential Lines', description: 'Equipotential lines connect points of equal potential. No work is done moving a charge along an equipotential line. For a point charge, equipotential lines are concentric circles.', setup: () => { setShowEquipotential(true); setShowEField(false); setShowColormap(true) } },
        { title: 'E Perpendicular to Equipotentials', description: 'Electric field lines are always perpendicular to equipotential lines. The field points from high to low potential. This is because E = -dV/dr — the field is the negative gradient of potential.', setup: () => { setShowEquipotential(true); setShowEField(true) } },
        { title: 'Potential Energy U = qV', description: 'A test charge q at potential V has potential energy U = qV. A positive test charge has high potential energy at high V and will naturally move toward lower V (just like a ball rolling downhill).', setup: () => { setTestChargeOn(true); setShowColormap(true); setShowEquipotential(true) } },
        { title: 'Work and Potential Difference', description: 'The work done by the electric field on a charge q moving through a potential difference is W = -qDeltaV. Moving a positive charge from high to low potential: the field does positive work (releases energy).', setup: () => { setTestChargeOn(true); setShowEField(true) } },
        { title: 'Superposition of Potentials', description: 'Since potential is a scalar, the total potential at any point is the algebraic sum of contributions from all charges. Unlike vectors, there is no direction to worry about — just add the values.', setup: () => { setNumCharges(2); setQ1Val(3); setQ2Val(-3); setShowColormap(true); setShowEquipotential(true); setShowEField(false); setTestChargeOn(false) } },
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

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            cursorRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        }
        const handleClick = (e: MouseEvent) => {
            if (!testChargeOn) return
            const rect = canvas.getBoundingClientRect()
            testChargeRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, vx: 0, vy: 0, placed: true }
        }
        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('click', handleClick)

        let animId: number

        const draw = () => {
            const dt = 0.016
            if (!paused) timeRef.current += dt

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const cx = w / 2
            const cy = h / 2

            // Build source charges array
            const sources: SourceCharge[] = []
            if (numCharges >= 1) sources.push({ x: numCharges === 1 ? cx : cx - 120, y: cy, q: q1Val * 1e-6 })
            if (numCharges >= 2) sources.push({ x: cx + 120, y: cy, q: q2Val * 1e-6 })
            if (numCharges >= 3) sources.push({ x: cx, y: cy - 120, q: q3Val * 1e-6 })

            // Compute potential at a point
            const computeV = (px: number, py: number) => {
                let v = 0
                const scale = 0.005 // pixel to meters
                for (const s of sources) {
                    const dx = (px - s.x) * scale
                    const dy = (py - s.y) * scale
                    const r = Math.max(0.01, Math.sqrt(dx * dx + dy * dy))
                    v += K * s.q / r
                }
                return v
            }

            // Compute E field at a point
            const computeE = (px: number, py: number) => {
                let ex = 0, ey = 0
                const scale = 0.005
                for (const s of sources) {
                    const dx = (px - s.x) * scale
                    const dy = (py - s.y) * scale
                    const r2 = Math.max(0.0001, dx * dx + dy * dy)
                    const r = Math.sqrt(r2)
                    const eMag = K * s.q / r2
                    ex += eMag * dx / r
                    ey += eMag * dy / r
                }
                return { ex, ey, mag: Math.sqrt(ex * ex + ey * ey) }
            }

            // Potential colormap
            if (showColormap) {
                const step = 8
                const imgData = ctx.createImageData(Math.ceil(w / step), Math.ceil(h / step))
                for (let py = 0; py < h; py += step) {
                    for (let px = 0; px < w; px += step) {
                        const v = computeV(px, py)
                        const maxV = 5e5
                        const norm = Math.max(-1, Math.min(1, v / maxV))

                        let r: number, g: number, b: number
                        if (norm > 0) {
                            r = Math.round(40 + norm * 200)
                            g = Math.round(20 + norm * 40)
                            b = Math.round(40)
                        } else {
                            const n = -norm
                            r = Math.round(40)
                            g = Math.round(20 + n * 60)
                            b = Math.round(40 + n * 200)
                        }

                        const ix = Math.floor(px / step)
                        const iy = Math.floor(py / step)
                        const idx = (iy * imgData.width + ix) * 4
                        imgData.data[idx] = r
                        imgData.data[idx + 1] = g
                        imgData.data[idx + 2] = b
                        imgData.data[idx + 3] = 140
                    }
                }

                // Draw scaled
                const tmpCanvas = document.createElement('canvas')
                tmpCanvas.width = imgData.width
                tmpCanvas.height = imgData.height
                const tmpCtx = tmpCanvas.getContext('2d')!
                tmpCtx.putImageData(imgData, 0, 0)
                ctx.imageSmoothingEnabled = true
                ctx.drawImage(tmpCanvas, 0, 0, w, h)
            }

            // Equipotential lines
            if (showEquipotential) {
                const levels = [-4e5, -2e5, -1e5, -5e4, -2e4, 2e4, 5e4, 1e5, 2e5, 4e5]
                const step = 6

                for (const level of levels) {
                    const isPositive = level > 0
                    ctx.strokeStyle = isPositive ? 'rgba(255, 130, 80, 0.35)' : 'rgba(80, 160, 255, 0.35)'
                    ctx.lineWidth = 1

                    // Marching squares simplified: just draw contour dots
                    for (let py = 0; py < h - step; py += step) {
                        for (let px = 0; px < w - step; px += step) {
                            const v00 = computeV(px, py)
                            const v10 = computeV(px + step, py)
                            const v01 = computeV(px, py + step)

                            // Check horizontal crossing
                            if ((v00 - level) * (v10 - level) < 0) {
                                const t = (level - v00) / (v10 - v00)
                                ctx.fillStyle = isPositive ? 'rgba(255, 130, 80, 0.5)' : 'rgba(80, 160, 255, 0.5)'
                                ctx.fillRect(px + t * step, py, 1.5, 1.5)
                            }
                            // Check vertical crossing
                            if ((v00 - level) * (v01 - level) < 0) {
                                const t = (level - v00) / (v01 - v00)
                                ctx.fillStyle = isPositive ? 'rgba(255, 130, 80, 0.5)' : 'rgba(80, 160, 255, 0.5)'
                                ctx.fillRect(px, py + t * step, 1.5, 1.5)
                            }
                        }
                    }
                }
            }

            // E-field arrows
            if (showEField) {
                const gridStep = 50
                for (let py = gridStep; py < h; py += gridStep) {
                    for (let px = gridStep; px < w; px += gridStep) {
                        // Skip near source charges
                        let tooClose = false
                        for (const s of sources) {
                            if (Math.hypot(px - s.x, py - s.y) < 35) { tooClose = true; break }
                        }
                        if (tooClose) continue

                        const { ex, ey, mag } = computeE(px, py)
                        if (mag < 100) continue
                        const maxLen = 20
                        const len = Math.min(maxLen, Math.log10(mag + 1) * 4)
                        const nx = ex / mag
                        const ny = ey / mag

                        ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'
                        ctx.lineWidth = 1.2
                        ctx.beginPath()
                        ctx.moveTo(px, py)
                        ctx.lineTo(px + nx * len, py + ny * len)
                        ctx.stroke()

                        // Arrowhead
                        const ax = px + nx * len
                        const ay = py + ny * len
                        ctx.beginPath()
                        ctx.moveTo(ax, ay)
                        ctx.lineTo(ax - nx * 4 + ny * 2.5, ay - ny * 4 - nx * 2.5)
                        ctx.lineTo(ax - nx * 4 - ny * 2.5, ay - ny * 4 + nx * 2.5)
                        ctx.closePath()
                        ctx.fillStyle = 'rgba(160, 100, 255, 0.4)'
                        ctx.fill()
                    }
                }
            }

            // Draw source charges
            for (const s of sources) {
                const isPos = s.q > 0
                const color = isPos ? 'rgba(255, 80, 80, 1)' : 'rgba(80, 150, 255, 1)'
                const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 30)
                glow.addColorStop(0, isPos ? 'rgba(255, 80, 80, 0.5)' : 'rgba(80, 150, 255, 0.5)')
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath()
                ctx.arc(s.x, s.y, 30, 0, Math.PI * 2)
                ctx.fill()

                ctx.fillStyle = color
                ctx.beginPath()
                ctx.arc(s.x, s.y, 14, 0, Math.PI * 2)
                ctx.fill()
                ctx.fillStyle = '#fff'
                ctx.font = 'bold 14px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(isPos ? '+' : '-', s.x, s.y + 5)
                ctx.fillStyle = 'rgba(255,255,255,0.6)'
                ctx.font = '10px system-ui'
                ctx.fillText(`${(s.q * 1e6).toFixed(0)} uC`, s.x, s.y - 22)
            }

            // Test charge
            const tc = testChargeRef.current
            if (testChargeOn && tc.placed) {
                // Move test charge along E field
                if (!paused) {
                    const { ex, ey } = computeE(tc.x, tc.y)
                    const scale = 0.005
                    const qTest = 1e-6
                    const mass = 1e-6
                    const ax = qTest * ex * scale / mass * 0.0001
                    const ay = qTest * ey * scale / mass * 0.0001
                    tc.vx += ax
                    tc.vy += ay
                    tc.vx *= 0.99
                    tc.vy *= 0.99
                    tc.x += tc.vx
                    tc.y += tc.vy
                }

                // Draw test charge
                ctx.fillStyle = 'rgba(100, 255, 150, 0.8)'
                ctx.beginPath()
                ctx.arc(tc.x, tc.y, 8, 0, Math.PI * 2)
                ctx.fill()
                ctx.strokeStyle = 'rgba(100, 255, 150, 0.4)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(tc.x, tc.y, 14, 0, Math.PI * 2)
                ctx.stroke()
                ctx.fillStyle = '#fff'
                ctx.font = 'bold 10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('+q', tc.x, tc.y + 4)

                // Potential at test charge
                const vTc = computeV(tc.x, tc.y)
                ctx.fillStyle = 'rgba(100, 255, 150, 0.8)'
                ctx.font = '11px system-ui'
                ctx.fillText(`V = ${vTc.toExponential(2)}`, tc.x, tc.y - 22)
            }

            // Cursor info
            const cur = cursorRef.current
            if (cur.x > 0 && cur.y > 0 && cur.x < w && cur.y < h) {
                const vCur = computeV(cur.x, cur.y)
                const eCur = computeE(cur.x, cur.y)
                setCursorV(vCur)
                setCursorE(eCur.mag)

                // Crosshair
                ctx.strokeStyle = 'rgba(255,255,255,0.15)'
                ctx.lineWidth = 0.5
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(cur.x - 10, cur.y); ctx.lineTo(cur.x + 10, cur.y)
                ctx.moveTo(cur.x, cur.y - 10); ctx.lineTo(cur.x, cur.y + 10)
                ctx.stroke()
                ctx.setLineDash([])
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => {
            window.removeEventListener('resize', resize)
            canvas.removeEventListener('mousemove', handleMouseMove)
            canvas.removeEventListener('click', handleClick)
            cancelAnimationFrame(animId)
        }
    }, [numCharges, q1Val, q2Val, q3Val, showEquipotential, showEField, showColormap, testChargeOn, paused])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 10" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Electric Potential"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'V at cursor', value: cursorV.toExponential(2), unit: 'V', color: 'rgb(255, 180, 80)' },
                                { label: '|E| at cursor', value: cursorE.toExponential(2), unit: 'N/C', color: 'rgb(160, 100, 255)' },
                                { label: 'U = qV (1uC)', value: (cursorV * 1e-6).toExponential(2), unit: 'J' },
                                { label: 'Charges', value: `${numCharges}` },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Potential', expression: 'V = kq / r', description: 'Scalar — add contributions' },
                                { label: 'PE', expression: 'U = qV' },
                                { label: 'Work', expression: 'W = -DeltaU = -q DeltaV' },
                                { label: 'Field', expression: 'E = -dV/dr', description: 'E points from high to low V' },
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

                    {testChargeOn && (
                        <div className="absolute bottom-4 right-[340px] bg-[#0d0a1a]/80 rounded-lg px-3 py-2 text-xs text-white/60">
                            Click on the canvas to place a test charge (+1 uC)
                        </div>
                    )}
                </div>

                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ControlGroup label="Number of Charges">
                            <Slider value={numCharges} onChange={(v) => setNumCharges(Math.round(v))} min={1} max={3} step={1} label={`${numCharges} charge${numCharges > 1 ? 's' : ''}`} />
                        </ControlGroup>

                        <ControlGroup label="q1">
                            <Slider value={q1Val} onChange={setQ1Val} min={-8} max={8} step={1} label={`q_1 = ${q1Val} uC`} />
                        </ControlGroup>

                        {numCharges >= 2 && (
                            <ControlGroup label="q2">
                                <Slider value={q2Val} onChange={setQ2Val} min={-8} max={8} step={1} label={`q_2 = ${q2Val} uC`} />
                            </ControlGroup>
                        )}

                        {numCharges >= 3 && (
                            <ControlGroup label="q3">
                                <Slider value={q3Val} onChange={setQ3Val} min={-8} max={8} step={1} label={`q_3 = ${q3Val} uC`} />
                            </ControlGroup>
                        )}

                        <Toggle value={showColormap} onChange={setShowColormap} label="Potential Colormap" />
                        <Toggle value={showEquipotential} onChange={setShowEquipotential} label="Equipotential Lines" />
                        <Toggle value={showEField} onChange={setShowEField} label="E-Field Arrows" />
                        <Toggle value={testChargeOn} onChange={setTestChargeOn} label="Test Charge" />
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
