import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const PHYS_COLOR = 'rgb(160, 100, 255)'

interface MassPoint {
    x: number; y: number; mass: number; id: number
}

export default function GravField() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const nextId = useRef(1)

    const [masses, setMasses] = useState<MassPoint[]>([])
    const [selectedMass, setSelectedMass] = useState(5.0)
    const [showField, setShowField] = useState(true)
    const [showEquipotential, setShowEquipotential] = useState(true)
    const [showVectors, setShowVectors] = useState(true)
    const [gridDensity, setGridDensity] = useState(20)

    const G = 800 // Scaled gravitational constant for visualization

    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setMasses(prev => [...prev, { x, y, mass: selectedMass, id: nextId.current++ }])
    }, [selectedMass])

    const reset = useCallback(() => {
        setMasses([])
        nextId.current = 1
    }, [])

    const calcField = useCallback((px: number, py: number): { gx: number; gy: number; potential: number } => {
        let gx = 0, gy = 0, potential = 0
        for (const m of masses) {
            const dx = px - m.x
            const dy = py - m.y
            const r2 = dx * dx + dy * dy
            const r = Math.sqrt(r2)
            if (r < 15) continue
            const gMag = G * m.mass / r2
            gx -= gMag * (dx / r)
            gy -= gMag * (dy / r)
            potential -= G * m.mass / r
        }
        return { gx, gy, potential }
    }, [masses, G])

    const demoSteps: DemoStep[] = [
        {
            title: 'Gravitational Field',
            description: 'A gravitational field describes the force per unit mass at every point in space. The field is a vector quantity pointing toward the mass that creates it.',
            setup: () => { reset() },
        },
        {
            title: 'Single Mass Field',
            description: 'Click on the canvas to place a mass. The field vectors point radially inward, and their magnitude decreases as 1/r^2. This is Newton\'s law of gravitation.',
            setup: () => { reset(); setShowField(true); setShowVectors(true) },
        },
        {
            title: 'Field Strength',
            description: 'The arrows show field direction and are colored by magnitude: brighter means stronger. Near the mass, the field is intense; far away, it weakens rapidly.',
            setup: () => { setShowField(true); setShowEquipotential(false) },
        },
        {
            title: 'Equipotential Lines',
            description: 'Equipotential lines connect points of equal gravitational potential energy. They are always perpendicular to field lines. No work is done moving along an equipotential.',
            setup: () => { setShowField(false); setShowEquipotential(true) },
        },
        {
            title: 'Multiple Masses',
            description: 'Place multiple masses to see superposition: the total field is the vector sum of individual fields. Notice how the field pattern becomes complex between masses.',
            setup: () => { setShowField(true); setShowEquipotential(true) },
        },
        {
            title: 'Saddle Points',
            description: 'Between two masses, there are points where fields partially cancel. These saddle points in the potential are Lagrange-like points where the net force has interesting behavior.',
            setup: () => { setShowField(true); setShowEquipotential(true) },
        },
        {
            title: 'Potential Energy',
            description: 'U = -GMm/r is always negative and approaches zero at infinity. The deeper the potential well, the more energy needed to escape. This is the basis of orbital mechanics.',
            setup: () => { setShowEquipotential(true) },
        },
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

        const animate = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = '#0d0a1a'
            ctx.fillRect(0, 0, w, h)

            // Grid
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.03)'
            ctx.lineWidth = 1
            for (let x = 0; x < w; x += 50) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
            }
            for (let y = 0; y < h; y += 50) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
            }

            if (masses.length > 0) {
                // Equipotential contours using marching approach
                if (showEquipotential) {
                    const step = 6
                    const potentialGrid: number[][] = []
                    for (let y = 0; y < h; y += step) {
                        const row: number[] = []
                        for (let x = 0; x < w; x += step) {
                            const { potential } = calcField(x, y)
                            row.push(potential)
                        }
                        potentialGrid.push(row)
                    }

                    // Draw contour lines at specific potential levels
                    const minP = -2000
                    const levels = 12
                    for (let lvl = 1; lvl <= levels; lvl++) {
                        const threshold = minP * (lvl / levels)
                        const alpha = 0.12 + (lvl / levels) * 0.15
                        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`
                        ctx.lineWidth = 1

                        for (let gy = 0; gy < potentialGrid.length - 1; gy++) {
                            for (let gx = 0; gx < potentialGrid[gy].length - 1; gx++) {
                                const v00 = potentialGrid[gy][gx]
                                const v10 = potentialGrid[gy][gx + 1]
                                const v01 = potentialGrid[gy + 1][gx]
                                const v11 = potentialGrid[gy + 1][gx + 1]
                                const px = gx * step
                                const py = gy * step

                                const crossings: Array<{ x: number; y: number }> = []
                                if ((v00 - threshold) * (v10 - threshold) < 0) {
                                    const t = (threshold - v00) / (v10 - v00)
                                    crossings.push({ x: px + t * step, y: py })
                                }
                                if ((v10 - threshold) * (v11 - threshold) < 0) {
                                    const t = (threshold - v10) / (v11 - v10)
                                    crossings.push({ x: px + step, y: py + t * step })
                                }
                                if ((v01 - threshold) * (v11 - threshold) < 0) {
                                    const t = (threshold - v01) / (v11 - v01)
                                    crossings.push({ x: px + t * step, y: py + step })
                                }
                                if ((v00 - threshold) * (v01 - threshold) < 0) {
                                    const t = (threshold - v00) / (v01 - v00)
                                    crossings.push({ x: px, y: py + t * step })
                                }

                                if (crossings.length >= 2) {
                                    ctx.beginPath()
                                    ctx.moveTo(crossings[0].x, crossings[0].y)
                                    ctx.lineTo(crossings[1].x, crossings[1].y)
                                    ctx.stroke()
                                }
                            }
                        }
                    }
                }

                // Field vectors
                if (showField && showVectors) {
                    const spacing = Math.max(25, Math.round(w / gridDensity))
                    for (let x = spacing / 2; x < w; x += spacing) {
                        for (let y = spacing / 2; y < h; y += spacing) {
                            let tooClose = false
                            for (const m of masses) {
                                const dx = x - m.x
                                const dy = y - m.y
                                if (dx * dx + dy * dy < 900) { tooClose = true; break }
                            }
                            if (tooClose) continue

                            const { gx, gy: fieldY } = calcField(x, y)
                            const mag = Math.sqrt(gx * gx + fieldY * fieldY)
                            if (mag < 0.1) continue

                            const maxLen = spacing * 0.4
                            const len = Math.min(mag * 0.5, maxLen)
                            const nx = gx / mag
                            const ny = fieldY / mag

                            // Color by magnitude
                            const intensity = Math.min(mag / 50, 1)
                            const r = Math.round(160 + intensity * 95)
                            const g = Math.round(100 - intensity * 40)
                            const b = Math.round(255 - intensity * 55)

                            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.5})`
                            ctx.lineWidth = 1 + intensity
                            ctx.beginPath()
                            ctx.moveTo(x, y)
                            ctx.lineTo(x + nx * len, y + ny * len)
                            ctx.stroke()

                            // Arrowhead
                            const ax = x + nx * len
                            const ay = y + ny * len
                            const headSize = 3 + intensity * 2
                            ctx.fillStyle = ctx.strokeStyle
                            ctx.beginPath()
                            ctx.moveTo(ax, ay)
                            ctx.lineTo(ax - nx * headSize + ny * headSize * 0.5, ay - ny * headSize - nx * headSize * 0.5)
                            ctx.lineTo(ax - nx * headSize - ny * headSize * 0.5, ay - ny * headSize + nx * headSize * 0.5)
                            ctx.closePath()
                            ctx.fill()
                        }
                    }
                }
            }

            // Draw masses
            for (const m of masses) {
                const r = 10 + m.mass * 2
                const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r * 3)
                glow.addColorStop(0, 'rgba(160, 100, 255, 0.3)')
                glow.addColorStop(1, 'transparent')
                ctx.fillStyle = glow
                ctx.beginPath()
                ctx.arc(m.x, m.y, r * 3, 0, Math.PI * 2)
                ctx.fill()

                const grad = ctx.createRadialGradient(m.x - r * 0.3, m.y - r * 0.3, 0, m.x, m.y, r)
                grad.addColorStop(0, 'rgba(200, 160, 255, 1)')
                grad.addColorStop(1, 'rgba(120, 60, 200, 1)')
                ctx.fillStyle = grad
                ctx.beginPath()
                ctx.arc(m.x, m.y, r, 0, Math.PI * 2)
                ctx.fill()

                ctx.fillStyle = 'white'
                ctx.font = 'bold 10px system-ui'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(`${m.mass.toFixed(0)}M`, m.x, m.y)
            }

            // Instructions if no masses
            if (masses.length === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.font = '16px system-ui'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('Click anywhere to place masses', w / 2, h / 2)
                ctx.font = '12px system-ui'
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
                ctx.fillText('Adjust mass size with the slider, then click to place', w / 2, h / 2 + 25)
            }

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [masses, showField, showEquipotential, showVectors, gridDensity, calcField])

    const totalMass = masses.reduce((sum, m) => sum + m.mass, 0)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0d0a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" onClick={handleCanvasClick} />

                <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
                    <APTag course="Physics C: Mech" unit="Unit 3" color={PHYS_COLOR} />
                    <InfoPanel
                        title="Field Data"
                        departmentColor={PHYS_COLOR}
                        items={[
                            { label: 'Masses Placed', value: masses.length.toString() },
                            { label: 'Total Mass', value: totalMass.toFixed(1), unit: 'M' },
                            { label: 'Grid Points', value: (gridDensity * gridDensity).toString() },
                        ]}
                    />
                    <EquationDisplay
                        departmentColor={PHYS_COLOR}
                        title="Gravitational Field"
                        equations={[
                            { label: 'Field', expression: 'g = -GM/r^2 (r-hat)', description: 'Points toward the mass' },
                            { label: 'Potential', expression: 'U = -GMm/r', description: 'Always negative, zero at infinity' },
                            { label: 'Superposition', expression: 'g_net = Sum(gi)', description: 'Fields add as vectors' },
                            { label: 'Relation', expression: 'g = -dU/dr' },
                        ]}
                    />
                </div>

                <div className="absolute top-4 right-4 z-10">
                    <ControlPanel>
                        <ControlGroup label="Controls">
                            <Button onClick={reset} variant="secondary">Reset (Clear All)</Button>
                        </ControlGroup>
                        <Slider label="Mass to Place" value={selectedMass} onChange={setSelectedMass} min={1} max={15} step={0.5} />
                        <Slider label="Field Grid Density" value={gridDensity} onChange={v => setGridDensity(Math.round(v))} min={10} max={35} step={1} />
                        <Toggle label="Show Field Vectors" value={showVectors} onChange={setShowVectors} />
                        <Toggle label="Show Equipotentials" value={showEquipotential} onChange={setShowEquipotential} />
                        <Toggle label="Show Field" value={showField} onChange={setShowField} />
                        <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
                    </ControlPanel>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <DemoMode
                        steps={demoSteps}
                        currentStep={demo.currentStep}
                        isOpen={demo.isOpen}
                        onClose={demo.close}
                        onNext={demo.next}
                        onPrev={demo.prev}
                        onGoToStep={demo.goToStep}
                        departmentColor={PHYS_COLOR}
                    />
                </div>
            </div>
        </div>
    )
}
