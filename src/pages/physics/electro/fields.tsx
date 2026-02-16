import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

const PHYSICS_COLOR = 'rgb(160, 100, 255)'

interface Charge { id: number; x: number; y: number; q: number }

type ViewMode = 'vectors' | 'heatmap' | 'both'

export default function ElectricFields() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [charges, setCharges] = useState<Charge[]>([
        { id: 1, x: 250, y: 250, q: 1 },
        { id: 2, x: 450, y: 250, q: -1 },
    ])
    const [selectedCharge, setSelectedCharge] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>('vectors')
    const [showEquipotential, setShowEquipotential] = useState(true)
    const [showGauss, setShowGauss] = useState(false)
    const [fieldDensity, setFieldDensity] = useState(30)
    const nextId = useRef(3)

    const addCharge = (q: number) => {
        setCharges(prev => [...prev, {
            id: nextId.current++,
            x: 150 + Math.random() * 100,
            y: 150 + Math.random() * 100,
            q,
        }])
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const hit = charges.find(c => Math.hypot(c.x - mx, c.y - my) < 20)
        if (hit) { setSelectedCharge(hit.id); setIsDragging(true) }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || selectedCharge === null) return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        setCharges(prev => prev.map(c => c.id === selectedCharge ? { ...c, x: e.clientX - rect.left, y: e.clientY - rect.top } : c))
    }

    const handleMouseUp = () => { setIsDragging(false); setSelectedCharge(null) }

    const calcField = (x: number, y: number): { Ex: number; Ey: number; V: number } => {
        let Ex = 0, Ey = 0, V = 0
        const k = 8000
        charges.forEach(c => {
            const dx = x - c.x, dy = y - c.y
            const r2 = dx * dx + dy * dy
            const r = Math.sqrt(r2)
            if (r < 15) return
            const E = k * c.q / r2
            Ex += E * (dx / r)
            Ey += E * (dy / r)
            V += k * c.q / r
        })
        return { Ex, Ey, V }
    }

    const demoSteps: DemoStep[] = [
        { title: 'Electric Fields', description: 'An electric field surrounds every charge. It describes the force per unit charge at any point in space.', highlight: 'Drag charges to see field patterns change.' },
        { title: 'Field Vectors', description: 'E = kQ/r^2. Field vectors point away from positive charges and toward negative charges.', setup: () => { setViewMode('vectors'); setCharges([{ id: 1, x: 300, y: 250, q: 1 }]) } },
        { title: 'Dipole Field', description: 'Two opposite charges form a dipole. Field lines travel from + to -. This is the most common configuration.', setup: () => { setCharges([{ id: 1, x: 250, y: 250, q: 1 }, { id: 2, x: 450, y: 250, q: -1 }]) } },
        { title: 'Equipotential Lines', description: 'Points of equal electric potential form closed curves. They are always perpendicular to field lines.', setup: () => { setShowEquipotential(true); setViewMode('vectors') }, highlight: 'Faint contours show equipotential lines.' },
        { title: 'Potential Heatmap', description: 'Red regions are high positive potential, blue regions are negative. Zero potential is dark.', setup: () => { setViewMode('heatmap') }, highlight: 'Switch to heatmap mode to see potential gradients.' },
        { title: 'Gauss\'s Law', description: 'The net flux through a closed surface equals Q_enclosed / epsilon_0. Visualized as a Gaussian surface.', setup: () => { setShowGauss(true); setViewMode('vectors') }, highlight: 'Toggle Gauss surface to see the enclosed charge concept.' },
        { title: 'Superposition', description: 'The total field is the vector sum of individual fields. Add multiple charges to see superposition in action.', setup: () => { setShowGauss(false); setViewMode('both') } },
    ]

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let dpr = window.devicePixelRatio || 1
        const resize = () => {
            dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        const animate = () => {
            const w = canvas.offsetWidth, h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            // Heatmap
            if (viewMode === 'heatmap' || viewMode === 'both') {
                const step = 6
                for (let x = 0; x < w; x += step) {
                    for (let y = 0; y < h; y += step) {
                        const { V } = calcField(x, y)
                        const norm = Math.tanh(V / 200)
                        let r = 0, g = 0, b = 0
                        if (norm > 0) { r = Math.round(norm * 200); b = 40 }
                        else { b = Math.round(-norm * 200); r = 40 }
                        ctx.fillStyle = `rgba(${r},${g},${b},0.5)`
                        ctx.fillRect(x, y, step, step)
                    }
                }
            }

            // Field vectors
            if (viewMode === 'vectors' || viewMode === 'both') {
                for (let x = fieldDensity / 2; x < w; x += fieldDensity) {
                    for (let y = fieldDensity / 2; y < h; y += fieldDensity) {
                        const { Ex, Ey } = calcField(x, y)
                        const mag = Math.sqrt(Ex * Ex + Ey * Ey)
                        if (mag < 0.1) continue
                        const len = Math.min(fieldDensity * 0.7, mag * 3)
                        const angle = Math.atan2(Ey, Ex)
                        const opacity = Math.min(0.9, mag / 3)
                        ctx.strokeStyle = `rgba(100, 200, 255, ${opacity})`
                        ctx.lineWidth = 1.2
                        ctx.beginPath()
                        ctx.moveTo(x, y)
                        const ex = x + Math.cos(angle) * len, ey = y + Math.sin(angle) * len
                        ctx.lineTo(ex, ey)
                        ctx.stroke()
                        // Arrowhead
                        const aSize = 4
                        ctx.beginPath()
                        ctx.moveTo(ex, ey)
                        ctx.lineTo(ex - Math.cos(angle - 0.4) * aSize, ey - Math.sin(angle - 0.4) * aSize)
                        ctx.moveTo(ex, ey)
                        ctx.lineTo(ex - Math.cos(angle + 0.4) * aSize, ey - Math.sin(angle + 0.4) * aSize)
                        ctx.stroke()
                    }
                }
            }

            // Equipotential lines
            if (showEquipotential && charges.length > 0) {
                const voltages = [-300, -150, -80, -40, 40, 80, 150, 300]
                ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
                for (let x = 0; x < w; x += 4) {
                    for (let y = 0; y < h; y += 4) {
                        const { V } = calcField(x, y)
                        for (const target of voltages) {
                            if (Math.abs(V - target) < 3) { ctx.fillRect(x, y, 2, 2); break }
                        }
                    }
                }
            }

            // Gaussian surface
            if (showGauss && charges.length > 0) {
                const c0 = charges[0]
                ctx.strokeStyle = 'rgba(100, 255, 100, 0.5)'
                ctx.lineWidth = 2
                ctx.setLineDash([6, 4])
                ctx.beginPath()
                ctx.arc(c0.x, c0.y, 80, 0, Math.PI * 2)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(100, 255, 100, 0.6)'
                ctx.font = '11px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('Gaussian Surface', c0.x, c0.y - 90)
                const enclosed = charges.filter(c => Math.hypot(c.x - c0.x, c.y - c0.y) < 80).reduce((s, c) => s + c.q, 0)
                ctx.fillText(`Q_enc = ${enclosed > 0 ? '+' : ''}${enclosed}`, c0.x, c0.y + 95)
            }

            // Draw charges
            charges.forEach(c => {
                ctx.beginPath()
                ctx.arc(c.x, c.y, 16, 0, Math.PI * 2)
                const grad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 16)
                if (c.q > 0) { grad.addColorStop(0, '#ff6666'); grad.addColorStop(1, '#cc2222') }
                else { grad.addColorStop(0, '#6688ff'); grad.addColorStop(1, '#2244cc') }
                ctx.fillStyle = grad
                ctx.fill()
                ctx.strokeStyle = 'rgba(255,255,255,0.5)'
                ctx.lineWidth = 1.5
                ctx.stroke()
                ctx.fillStyle = 'white'
                ctx.font = 'bold 14px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(c.q > 0 ? '+' : '-', c.x, c.y)
            })

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [charges, viewMode, showEquipotential, showGauss, fieldDensity])

    const totalQ = charges.reduce((s, c) => s + c.q, 0)

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Electric Fields</h1>
                        <p className="text-xs text-white/50">Electrostatics</p>
                    </div>
                    <APTag course="Physics 2" unit="Unit 3" color={PHYSICS_COLOR} />
                </div>
                <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative cursor-crosshair">
                    <canvas ref={canvasRef} className="w-full h-full block"
                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
                    <div className="absolute top-4 left-4 space-y-2">
                        <EquationDisplay departmentColor={PHYSICS_COLOR} title="Electrostatics"
                            equations={[
                                { label: 'Coulomb', expression: 'E = kQ / r^2', description: 'Electric field from point charge' },
                                { label: 'Potential', expression: 'V = kQ / r', description: 'Electric potential' },
                                { label: 'Gauss', expression: 'flux = Q_enc / e0', description: 'Gauss\'s law' },
                            ]} />
                    </div>
                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PHYSICS_COLOR} title="Field Info"
                            items={[
                                { label: 'Charges', value: charges.length },
                                { label: 'Net Charge', value: totalQ > 0 ? `+${totalQ}` : `${totalQ}` },
                                { label: 'View', value: viewMode },
                                { label: 'Grid', value: `${fieldDensity}px` },
                            ]} />
                    </div>
                </div>

                <div className="w-72 bg-[#0d0a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <div className="flex gap-2">
                            <Button onClick={() => addCharge(1)}>+ Charge</Button>
                            <Button onClick={() => addCharge(-1)} variant="secondary">- Charge</Button>
                        </div>
                        <Button onClick={() => setCharges(prev => prev.slice(0, -1))} variant="secondary">Remove Last</Button>
                        <ButtonGroup label="View Mode" value={viewMode}
                            onChange={v => setViewMode(v as ViewMode)}
                            options={[
                                { value: 'vectors', label: 'Vectors' },
                                { value: 'heatmap', label: 'Heatmap' },
                                { value: 'both', label: 'Both' },
                            ]}
                            color={PHYSICS_COLOR} />
                        <ControlGroup label="Field Density">
                            <Slider value={fieldDensity} onChange={setFieldDensity} min={20} max={60} step={5} label={`${fieldDensity}px`} />
                        </ControlGroup>
                        <Toggle value={showEquipotential} onChange={setShowEquipotential} label="Equipotential Lines" />
                        <Toggle value={showGauss} onChange={setShowGauss} label="Gaussian Surface" />
                    </ControlPanel>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={PHYSICS_COLOR} />
            </div>
        </div>
    )
}
