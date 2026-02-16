import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const PURPLE = 'rgb(168, 85, 247)'

type Charge = { x: number; y: number; q: number; id: number }

export default function GaussLaw() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [charges, setCharges] = useState<Charge[]>([])
    const [surfaceRadius, setSurfaceRadius] = useState(150)
    const [surfaceShape, setSurfaceShape] = useState('circle')
    const [showFluxArrows, setShowFluxArrows] = useState(true)
    const [showFieldLines, setShowFieldLines] = useState(false)
    const [chargeMode, setChargeMode] = useState('positive')
    const nextId = useRef(0)
    const animRef = useRef<number>(0)

    const epsilon0 = 8.854e-12

    const centerRef = useRef({ x: 0, y: 0 })

    const getEnclosedCharge = useCallback(() => {
        const cx = centerRef.current.x
        const cy = centerRef.current.y
        let qEnc = 0
        for (const c of charges) {
            const dx = c.x - cx
            const dy = c.y - cy
            const r = Math.sqrt(dx * dx + dy * dy)
            if (surfaceShape === 'circle' && r < surfaceRadius) {
                qEnc += c.q
            } else if (surfaceShape === 'square') {
                if (Math.abs(dx) < surfaceRadius && Math.abs(dy) < surfaceRadius) {
                    qEnc += c.q
                }
            } else if (surfaceShape === 'ellipse') {
                const a = surfaceRadius * 1.4
                const b = surfaceRadius * 0.7
                if ((dx * dx) / (a * a) + (dy * dy) / (b * b) < 1) {
                    qEnc += c.q
                }
            }
        }
        return qEnc
    }, [charges, surfaceRadius, surfaceShape])

    const encCharge = getEnclosedCharge()
    const flux = encCharge / epsilon0
    const totalCharge = charges.reduce((sum, c) => sum + c.q, 0)

    const handleCanvasClick = (e: React.MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const q = chargeMode === 'positive' ? 1 : chargeMode === 'negative' ? -1 : (Math.random() > 0.5 ? 1 : -1)
        setCharges(prev => [...prev, { x: mx, y: my, q, id: nextId.current++ }])
    }

    const clearCharges = useCallback(() => {
        setCharges([])
        nextId.current = 0
    }, [])

    const demoSteps: DemoStep[] = [
        {
            title: "Gauss's Law",
            description: "The total electric flux through any closed surface equals the enclosed charge divided by epsilon_0. This is one of Maxwell's equations.",
            setup: () => { clearCharges(); setSurfaceShape('circle'); setSurfaceRadius(150) },
        },
        {
            title: 'Positive Charge Inside',
            description: 'Click inside the surface to place a positive charge. Notice the outward flux arrows (green) -- net flux is positive.',
            setup: () => { clearCharges(); setSurfaceShape('circle'); setChargeMode('positive'); setSurfaceRadius(150) },
        },
        {
            title: 'Negative Charge Inside',
            description: 'A negative charge produces inward flux (red arrows). The net flux is negative. Flux direction tells you the sign of enclosed charge.',
            setup: () => { clearCharges(); setChargeMode('negative'); setSurfaceShape('circle') },
        },
        {
            title: 'Charges Outside',
            description: 'Place charges outside the surface. The net flux is zero! Field lines enter one side and exit the other -- they cancel perfectly.',
            setup: () => { clearCharges(); setSurfaceRadius(80); setSurfaceShape('circle') },
        },
        {
            title: 'Surface Shape Independence',
            description: "Gauss's Law works for ANY closed surface shape. Switch between circle, square, and ellipse -- the net flux depends only on Q_enc.",
            setup: () => { clearCharges(); setSurfaceShape('square'); setSurfaceRadius(120) },
        },
        {
            title: 'Multiple Charges',
            description: 'Place several positive and negative charges. Only the net enclosed charge matters for the total flux.',
            setup: () => { clearCharges(); setChargeMode('positive'); setSurfaceRadius(150); setSurfaceShape('circle') },
        },
        {
            title: 'Field Lines View',
            description: 'Enable field lines to see how the electric field radiates from charges. Flux counts how many lines pierce the surface.',
            setup: () => { setShowFieldLines(true); setShowFluxArrows(true) },
        },
        {
            title: 'Flux Integral',
            description: 'The arrows on the surface represent E dot dA at each point. Green = outward contribution, red = inward. Sum them all for net flux.',
            setup: () => { setShowFluxArrows(true); setShowFieldLines(false); setSurfaceShape('circle') },
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
            ctx.scale(dpr, dpr)
        }
        resize()
        window.addEventListener('resize', resize)

        const animate = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const cx = w / 2
            const cy = h / 2
            centerRef.current = { x: cx, y: cy }

            ctx.clearRect(0, 0, w, h)

            // Draw Gaussian Surface
            ctx.strokeStyle = '#fbbf24'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])

            if (surfaceShape === 'circle') {
                ctx.beginPath()
                ctx.arc(cx, cy, surfaceRadius, 0, Math.PI * 2)
                ctx.stroke()
                ctx.fillStyle = 'rgba(251, 191, 36, 0.06)'
                ctx.fill()
            } else if (surfaceShape === 'square') {
                ctx.strokeRect(cx - surfaceRadius, cy - surfaceRadius, surfaceRadius * 2, surfaceRadius * 2)
                ctx.fillStyle = 'rgba(251, 191, 36, 0.06)'
                ctx.fillRect(cx - surfaceRadius, cy - surfaceRadius, surfaceRadius * 2, surfaceRadius * 2)
            } else if (surfaceShape === 'ellipse') {
                ctx.beginPath()
                ctx.ellipse(cx, cy, surfaceRadius * 1.4, surfaceRadius * 0.7, 0, 0, Math.PI * 2)
                ctx.stroke()
                ctx.fillStyle = 'rgba(251, 191, 36, 0.06)'
                ctx.fill()
            }
            ctx.setLineDash([])

            // Surface label
            ctx.fillStyle = 'rgba(251, 191, 36, 0.5)'
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('Gaussian Surface', cx, cy - surfaceRadius - 10)

            // Draw field lines from charges
            if (showFieldLines) {
                const numLines = 12
                for (const c of charges) {
                    for (let i = 0; i < numLines; i++) {
                        const angle = (i / numLines) * Math.PI * 2
                        ctx.strokeStyle = c.q > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)'
                        ctx.lineWidth = 1
                        ctx.beginPath()
                        let lx = c.x
                        let ly = c.y
                        ctx.moveTo(lx, ly)
                        const dir = c.q > 0 ? 1 : -1
                        for (let step = 0; step < 80; step++) {
                            let Ex = 0, Ey = 0
                            for (const ch of charges) {
                                const ddx = lx - ch.x
                                const ddy = ly - ch.y
                                const r2 = ddx * ddx + ddy * ddy + 50
                                const r = Math.sqrt(r2)
                                const E = 500 * ch.q / r2
                                Ex += E * (ddx / r)
                                Ey += E * (ddy / r)
                            }
                            const mag = Math.sqrt(Ex * Ex + Ey * Ey)
                            if (mag < 0.01) break
                            lx += dir * (Ex / mag) * 5
                            ly += dir * (Ey / mag) * 5
                            if (lx < 0 || lx > w || ly < 0 || ly > h) break
                            ctx.lineTo(lx, ly)
                        }
                        ctx.stroke()
                    }
                }
            }

            // Draw Charges
            for (const c of charges) {
                ctx.beginPath()
                ctx.arc(c.x, c.y, 10, 0, Math.PI * 2)
                const chargeColor = c.q > 0 ? '#ef4444' : '#3b82f6'
                ctx.fillStyle = chargeColor
                ctx.shadowColor = chargeColor
                ctx.shadowBlur = 12
                ctx.fill()
                ctx.shadowBlur = 0

                ctx.fillStyle = 'white'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.font = 'bold 12px sans-serif'
                ctx.fillText(c.q > 0 ? '+' : '-', c.x, c.y)
            }

            // Flux arrows on surface
            if (showFluxArrows && charges.length > 0) {
                const numPoints = 36
                for (let i = 0; i < numPoints; i++) {
                    const theta = (i / numPoints) * Math.PI * 2
                    let px: number, py: number, nx: number, ny: number

                    if (surfaceShape === 'circle') {
                        px = cx + Math.cos(theta) * surfaceRadius
                        py = cy + Math.sin(theta) * surfaceRadius
                        nx = Math.cos(theta)
                        ny = Math.sin(theta)
                    } else if (surfaceShape === 'square') {
                        const t = theta / (Math.PI * 2)
                        if (t < 0.25) {
                            px = cx + surfaceRadius; py = cy - surfaceRadius + t * 4 * 2 * surfaceRadius
                            nx = 1; ny = 0
                        } else if (t < 0.5) {
                            px = cx + surfaceRadius - (t - 0.25) * 4 * 2 * surfaceRadius; py = cy + surfaceRadius
                            nx = 0; ny = 1
                        } else if (t < 0.75) {
                            px = cx - surfaceRadius; py = cy + surfaceRadius - (t - 0.5) * 4 * 2 * surfaceRadius
                            nx = -1; ny = 0
                        } else {
                            px = cx - surfaceRadius + (t - 0.75) * 4 * 2 * surfaceRadius; py = cy - surfaceRadius
                            nx = 0; ny = -1
                        }
                    } else {
                        const a = surfaceRadius * 1.4
                        const b = surfaceRadius * 0.7
                        px = cx + Math.cos(theta) * a
                        py = cy + Math.sin(theta) * b
                        nx = Math.cos(theta) / a
                        ny = Math.sin(theta) / b
                        const nMag = Math.sqrt(nx * nx + ny * ny)
                        nx /= nMag; ny /= nMag
                    }

                    let Ex = 0, Ey = 0
                    for (const c of charges) {
                        const dx = px - c.x
                        const dy = py - c.y
                        const r2 = dx * dx + dy * dy
                        const r = Math.sqrt(r2)
                        const E = 1000 * c.q / Math.max(r2, 100)
                        Ex += E * (dx / r)
                        Ey += E * (dy / r)
                    }

                    const mag = Math.sqrt(Ex * Ex + Ey * Ey)
                    if (mag > 0.1) {
                        const vecLen = Math.min(mag * 20, 40)
                        const endX = px + (Ex / mag) * vecLen
                        const endY = py + (Ey / mag) * vecLen

                        const dot = Ex * nx + Ey * ny
                        const arrowColor = dot > 0 ? '#4ade80' : '#f87171'

                        ctx.strokeStyle = arrowColor
                        ctx.lineWidth = 1.5
                        ctx.beginPath()
                        ctx.moveTo(px, py)
                        ctx.lineTo(endX, endY)
                        ctx.stroke()

                        // Arrowhead
                        const angle = Math.atan2(endY - py, endX - px)
                        ctx.fillStyle = arrowColor
                        ctx.beginPath()
                        ctx.moveTo(endX, endY)
                        ctx.lineTo(endX - 6 * Math.cos(angle - 0.4), endY - 6 * Math.sin(angle - 0.4))
                        ctx.lineTo(endX - 6 * Math.cos(angle + 0.4), endY - 6 * Math.sin(angle + 0.4))
                        ctx.closePath()
                        ctx.fill()
                    }
                }
            }

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [charges, surfaceRadius, surfaceShape, showFluxArrows, showFieldLines])

    return (
        <div className="min-h-screen flex flex-col bg-[#0f0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <PhysicsBackground />
            </div>

            {/* Navbar */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0f0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Gauss's Law</h1>
                        <APTag course="Physics C: E&M" unit="Unit 1" color={PURPLE} />
                    </div>
                </div>
                <Button variant="secondary" onClick={demo.open}>Tutorial</Button>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative cursor-crosshair" onClick={handleCanvasClick}>
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    {/* Hint */}
                    {charges.length === 0 && (
                        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none text-xs text-white/40 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                            Click to place charges on the canvas
                        </div>
                    )}

                    {/* Equation overlay */}
                    <div className="absolute top-4 left-4 z-10">
                        <EquationDisplay
                            departmentColor={PURPLE}
                            title="Gauss's Law"
                            equations={[
                                { label: 'Integral Form', expression: 'Phi_E = oint E . dA = Q_enc / epsilon_0', description: "Gauss's Law" },
                                { label: 'Flux', expression: 'Phi = E . A . cos(theta)', description: 'Flux through flat surface' },
                                { label: 'Coulomb', expression: 'E = kQ / r^2', description: 'Point charge field' },
                            ]}
                        />
                    </div>

                    {/* Info panel */}
                    <div className="absolute top-4 right-4 z-10">
                        <InfoPanel
                            departmentColor={PURPLE}
                            title="Flux Calculation"
                            items={[
                                { label: 'Q_enclosed', value: `${encCharge > 0 ? '+' : ''}${encCharge}`, unit: 'Q', color: encCharge > 0 ? '#ef4444' : encCharge < 0 ? '#3b82f6' : undefined },
                                { label: 'Net Flux', value: flux.toExponential(2), unit: 'Nm^2/C', color: flux > 0 ? '#4ade80' : flux < 0 ? '#f87171' : undefined },
                                { label: 'Q_total', value: `${totalCharge}`, unit: 'Q' },
                                { label: 'Charges', value: `${charges.length}` },
                                { label: 'Surface', value: surfaceShape },
                            ]}
                        />
                    </div>

                    {/* Demo overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                        <DemoMode
                            steps={demoSteps}
                            currentStep={demo.currentStep}
                            isOpen={demo.isOpen}
                            onClose={demo.close}
                            onNext={demo.next}
                            onPrev={demo.prev}
                            onGoToStep={demo.goToStep}
                            departmentColor={PURPLE}
                        />
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0f0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-4 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ButtonGroup
                            label="Surface Shape"
                            value={surfaceShape}
                            onChange={setSurfaceShape}
                            options={[
                                { value: 'circle', label: 'Circle' },
                                { value: 'square', label: 'Square' },
                                { value: 'ellipse', label: 'Ellipse' },
                            ]}
                            color={PURPLE}
                        />
                        <Slider label="Surface Size" value={surfaceRadius} onChange={setSurfaceRadius} min={50} max={300} step={10} />
                    </ControlPanel>

                    <ControlPanel>
                        <ControlGroup label="Charge Placement">
                            <ButtonGroup
                                value={chargeMode}
                                onChange={setChargeMode}
                                options={[
                                    { value: 'positive', label: '+Q' },
                                    { value: 'negative', label: '-Q' },
                                    { value: 'random', label: 'Random' },
                                ]}
                                color={PURPLE}
                            />
                        </ControlGroup>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={clearCharges}>Clear All</Button>
                            <Button variant="secondary" onClick={() => setCharges(prev => prev.slice(0, -1))}>Undo</Button>
                        </div>
                    </ControlPanel>

                    <ControlPanel>
                        <ControlGroup label="Display">
                            <ButtonGroup
                                value={showFluxArrows ? (showFieldLines ? 'both' : 'flux') : (showFieldLines ? 'lines' : 'none')}
                                onChange={(v) => {
                                    setShowFluxArrows(v === 'flux' || v === 'both')
                                    setShowFieldLines(v === 'lines' || v === 'both')
                                }}
                                options={[
                                    { value: 'flux', label: 'Flux' },
                                    { value: 'lines', label: 'Field' },
                                    { value: 'both', label: 'Both' },
                                    { value: 'none', label: 'None' },
                                ]}
                                color={PURPLE}
                            />
                        </ControlGroup>
                    </ControlPanel>

                    <Button variant="secondary" onClick={() => {
                        clearCharges()
                        setSurfaceRadius(150)
                        setSurfaceShape('circle')
                        setShowFluxArrows(true)
                        setShowFieldLines(false)
                        setChargeMode('positive')
                    }}>
                        Reset
                    </Button>
                </div>
            </div>
        </div>
    )
}
