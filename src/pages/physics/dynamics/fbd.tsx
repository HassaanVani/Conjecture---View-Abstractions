import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

interface Force {
    id: number
    magnitude: number
    angle: number // degrees from +x axis
    label: string
}

const COLORS = [
    'rgba(255, 100, 100, 0.9)',
    'rgba(100, 200, 255, 0.9)',
    'rgba(100, 255, 150, 0.9)',
    'rgba(255, 220, 100, 0.9)',
    'rgba(200, 130, 255, 0.9)',
    'rgba(255, 160, 100, 0.9)',
]

export default function FreeBodyDiagram() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [mass, setMass] = useState(5)
    const [forces, setForces] = useState<Force[]>([
        { id: 1, magnitude: 30, angle: 0, label: 'F1' },
        { id: 2, magnitude: 20, angle: 90, label: 'F2' },
    ])
    const [selectedForce, setSelectedForce] = useState(0)
    const [showDecomposition, setShowDecomposition] = useState(true)
    const [showResultant, setShowResultant] = useState(true)
    const [solveMode, setSolveMode] = useState<string>('forces')
    const nextId = useRef(3)

    const addForce = useCallback(() => {
        if (forces.length >= 6) return
        const newForce: Force = {
            id: nextId.current++,
            magnitude: 20,
            angle: forces.length * 60,
            label: `F${forces.length + 1}`,
        }
        setForces(prev => [...prev, newForce])
        setSelectedForce(forces.length)
    }, [forces.length])

    const removeForce = useCallback(() => {
        if (forces.length <= 1) return
        setForces(prev => {
            const next = prev.filter((_, i) => i !== selectedForce)
            return next
        })
        setSelectedForce(s => Math.max(0, s - 1))
    }, [forces.length, selectedForce])

    const updateForce = useCallback((index: number, field: 'magnitude' | 'angle', value: number) => {
        setForces(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f))
    }, [])

    const calcNet = useCallback(() => {
        let fx = 0, fy = 0
        for (const f of forces) {
            const rad = (f.angle * Math.PI) / 180
            fx += f.magnitude * Math.cos(rad)
            fy += f.magnitude * Math.sin(rad)
        }
        const fNet = Math.sqrt(fx * fx + fy * fy)
        const theta = Math.atan2(fy, fx) * (180 / Math.PI)
        const ax = fx / mass
        const ay = fy / mass
        const aNet = fNet / mass
        return { fx, fy, fNet, theta, ax, ay, aNet }
    }, [forces, mass])

    const reset = useCallback(() => {
        setMass(5)
        setForces([
            { id: 1, magnitude: 30, angle: 0, label: 'F1' },
            { id: 2, magnitude: 20, angle: 90, label: 'F2' },
        ])
        setSelectedForce(0)
        setShowDecomposition(true)
        setShowResultant(true)
        setSolveMode('forces')
        nextId.current = 3
    }, [])

    const demoSteps = [
        { title: 'Free Body Diagrams', description: 'A free body diagram isolates an object and shows ALL forces acting on it. Each arrow represents a force with magnitude and direction.', setup: () => reset() },
        { title: 'Force Vectors', description: 'Each force is a vector with magnitude (length of arrow) and direction (angle from positive x-axis). Try dragging the sliders to change forces.', setup: () => { reset() } },
        { title: 'Force Decomposition', description: 'Any force can be decomposed into x and y components: Fx = F cos(theta), Fy = F sin(theta). Toggle decomposition to see the components.', setup: () => { setShowDecomposition(true); setShowResultant(false) } },
        { title: 'Net Force', description: 'The net force is the vector sum of all forces. Add the x-components and y-components separately, then combine: F_net = sqrt(Fx^2 + Fy^2).', setup: () => { setShowDecomposition(true); setShowResultant(true) } },
        { title: 'Newton\'s Second Law', description: 'F_net = ma tells us the acceleration. If F_net is zero, the object is in equilibrium (a = 0). If not, it accelerates in the direction of F_net.', setup: () => { setShowResultant(true); setSolveMode('accel') } },
        { title: 'Adding Forces', description: 'Add more forces to see how they combine. With 3+ forces, the diagram becomes more complex but the method stays the same: sum components.', setup: () => { addForce() } },
        { title: 'Equilibrium', description: 'When F_net = 0, the object is in static or dynamic equilibrium. Try adjusting forces to achieve equilibrium where the net force vanishes.', setup: () => { reset(); setForces([{ id: 1, magnitude: 30, angle: 0, label: 'F1' }, { id: 2, magnitude: 30, angle: 180, label: 'F2' }]); setShowResultant(true) } },
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

        const draw = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const cx = w / 2
            const cy = h / 2

            ctx.clearRect(0, 0, w, h)

            // Grid
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.06)'
            ctx.lineWidth = 1
            const gridSize = 40
            for (let x = cx % gridSize; x < w; x += gridSize) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
            }
            for (let y = cy % gridSize; y < h; y += gridSize) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.2)'
            ctx.lineWidth = 1.5
            ctx.setLineDash([6, 4])
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()
            ctx.setLineDash([])

            ctx.fillStyle = 'rgba(160, 100, 255, 0.5)'
            ctx.font = '12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('+x', w - 20, cy - 8)
            ctx.fillText('+y', cx + 14, 18)

            // Object (block)
            const blockSize = 40 + mass * 2
            const half = blockSize / 2
            ctx.fillStyle = 'rgba(160, 100, 255, 0.15)'
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.5)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.roundRect(cx - half, cy - half, blockSize, blockSize, 6)
            ctx.fill(); ctx.stroke()
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.font = 'bold 14px system-ui'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(`${mass} kg`, cx, cy)
            ctx.textBaseline = 'alphabetic'

            const scale = 2.5

            const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, color: string, lw: number) => {
                const dx = toX - fromX
                const dy = toY - fromY
                const len = Math.sqrt(dx * dx + dy * dy)
                if (len < 2) return
                const headLen = Math.min(12, len * 0.3)
                const ang = Math.atan2(dy, dx)
                ctx.strokeStyle = color
                ctx.fillStyle = color
                ctx.lineWidth = lw
                ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(toX, toY)
                ctx.lineTo(toX - headLen * Math.cos(ang - 0.35), toY - headLen * Math.sin(ang - 0.35))
                ctx.lineTo(toX - headLen * Math.cos(ang + 0.35), toY - headLen * Math.sin(ang + 0.35))
                ctx.closePath(); ctx.fill()
            }

            // Draw force decomposition
            forces.forEach((f, i) => {
                const rad = (f.angle * Math.PI) / 180
                const fx = f.magnitude * Math.cos(rad)
                const fy = f.magnitude * Math.sin(rad)
                const color = COLORS[i % COLORS.length]

                if (showDecomposition) {
                    const dxPx = fx * scale
                    const dyPx = -fy * scale
                    // x component
                    ctx.globalAlpha = 0.4
                    ctx.setLineDash([4, 3])
                    drawArrow(cx, cy, cx + dxPx, cy, color, 1.5)
                    // y component
                    drawArrow(cx, cy, cx, cy + dyPx, color, 1.5)
                    ctx.setLineDash([])
                    ctx.globalAlpha = 1
                }
            })

            // Draw force arrows
            forces.forEach((f, i) => {
                const rad = (f.angle * Math.PI) / 180
                const endX = cx + f.magnitude * Math.cos(rad) * scale
                const endY = cy - f.magnitude * Math.sin(rad) * scale
                const color = COLORS[i % COLORS.length]

                drawArrow(cx, cy, endX, endY, color, i === selectedForce ? 3 : 2)

                // Label
                const labelX = cx + (f.magnitude * Math.cos(rad) * scale) * 1.15
                const labelY = cy - (f.magnitude * Math.sin(rad) * scale) * 1.15
                ctx.fillStyle = color
                ctx.font = 'bold 13px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`${f.label}`, labelX, labelY - 10)
                ctx.font = '11px system-ui'
                ctx.fillText(`${f.magnitude.toFixed(0)}N @ ${f.angle}deg`, labelX, labelY + 4)
            })

            // Resultant
            if (showResultant) {
                const net = calcNet()
                const rad = (net.theta * Math.PI) / 180
                const endX = cx + net.fNet * Math.cos(rad) * scale
                const endY = cy - net.fNet * Math.sin(rad) * scale
                ctx.setLineDash([6, 3])
                drawArrow(cx, cy, endX, endY, 'rgba(255, 255, 255, 0.9)', 3)
                ctx.setLineDash([])

                if (net.fNet > 0.5) {
                    const lx = cx + net.fNet * Math.cos(rad) * scale * 1.15
                    const ly = cy - net.fNet * Math.sin(rad) * scale * 1.15
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                    ctx.font = 'bold 13px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`F_net = ${net.fNet.toFixed(1)}N`, lx, ly - 8)
                } else {
                    ctx.fillStyle = 'rgba(100, 255, 150, 0.9)'
                    ctx.font = 'bold 14px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('EQUILIBRIUM', cx, cy - half - 20)
                }
            }

            animRef.current = requestAnimationFrame(draw)
        }

        const animRef = { current: requestAnimationFrame(draw) }

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animRef.current)
        }
    }, [forces, mass, showDecomposition, showResultant, selectedForce, calcNet])

    const net = calcNet()
    const sf = forces[selectedForce]

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 1" unit="Unit 2" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Net Force"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'Sigma Fx', value: net.fx.toFixed(2), unit: 'N' },
                                { label: 'Sigma Fy', value: net.fy.toFixed(2), unit: 'N' },
                                { label: 'F_net', value: net.fNet.toFixed(2), unit: 'N', color: 'rgb(160, 100, 255)' },
                                { label: 'Direction', value: net.theta.toFixed(1), unit: 'deg' },
                                { label: 'a_net', value: net.aNet.toFixed(2), unit: 'm/s2', color: 'rgb(100, 255, 150)' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[260px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Newton 2', expression: 'F_net = m * a', description: 'Net force equals mass times acceleration' },
                                { label: 'X-comp', expression: 'Fx = F * cos(theta)' },
                                { label: 'Y-comp', expression: 'Fy = F * sin(theta)' },
                                { label: 'Resultant', expression: 'F = sqrt(Fx^2 + Fy^2)' },
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
                        <ControlGroup label="Mass (kg)">
                            <Slider value={mass} onChange={setMass} min={1} max={50} step={1} label={`${mass} kg`} />
                        </ControlGroup>

                        <ControlGroup label="View Mode">
                            <ButtonGroup
                                value={solveMode}
                                onChange={setSolveMode}
                                options={[
                                    { value: 'forces', label: 'Forces' },
                                    { value: 'accel', label: 'Acceleration' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <div className="flex gap-2">
                            <Button onClick={addForce} className="flex-1" disabled={forces.length >= 6}>
                                + Add Force
                            </Button>
                            <Button onClick={removeForce} variant="secondary" disabled={forces.length <= 1}>
                                Remove
                            </Button>
                        </div>

                        <ControlGroup label={`Selected: ${sf?.label ?? '-'}`}>
                            <div className="flex gap-1 mb-2 flex-wrap">
                                {forces.map((f, i) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setSelectedForce(i)}
                                        className="px-2 py-1 text-xs rounded-md transition-all"
                                        style={{
                                            backgroundColor: i === selectedForce ? COLORS[i % COLORS.length] + '30' : 'rgba(255,255,255,0.05)',
                                            color: COLORS[i % COLORS.length],
                                            border: i === selectedForce ? `1px solid ${COLORS[i % COLORS.length]}` : '1px solid transparent',
                                        }}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                            {sf && (
                                <>
                                    <Slider value={sf.magnitude} onChange={v => updateForce(selectedForce, 'magnitude', v)} min={0} max={100} step={1} label={`Magnitude: ${sf.magnitude} N`} />
                                    <Slider value={sf.angle} onChange={v => updateForce(selectedForce, 'angle', v)} min={0} max={359} step={1} label={`Angle: ${sf.angle} deg`} />
                                </>
                            )}
                        </ControlGroup>

                        <Toggle value={showDecomposition} onChange={setShowDecomposition} label="Show Decomposition" />
                        <Toggle value={showResultant} onChange={setShowResultant} label="Show Resultant" />
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
