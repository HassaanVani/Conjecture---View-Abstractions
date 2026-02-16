import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const PURPLE = 'rgb(168, 85, 247)'

type Point = { x: number; y: number }

export default function BiotSavart() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [wirePath, setWirePath] = useState<Point[]>([])
    const [isDrawing, setIsDrawing] = useState(false)
    const [current, setCurrent] = useState(5.0)
    const [wireMode, setWireMode] = useState('freehand')
    const [gridSize, setGridSize] = useState(20)
    const [showMagnitude, setShowMagnitude] = useState(true)
    const [probePoint, setProbePoint] = useState<Point | null>(null)
    const [probeBz, setProbeBz] = useState(0)
    const animRef = useRef<number>(0)

    const generateLoop = useCallback((cx: number, cy: number, radius: number) => {
        const pts: Point[] = []
        for (let i = 0; i <= 60; i++) {
            const theta = (i / 60) * Math.PI * 2
            pts.push({ x: cx + Math.cos(theta) * radius, y: cy + Math.sin(theta) * radius })
        }
        return pts
    }, [])

    const generateSolenoid = useCallback((cx: number, cy: number, length: number, turns: number) => {
        const pts: Point[] = []
        const startX = cx - length / 2
        for (let i = 0; i <= turns * 40; i++) {
            const t = i / (turns * 40)
            const x = startX + t * length
            const y = cy + Math.sin(t * turns * Math.PI * 2) * 40
            pts.push({ x, y })
        }
        return pts
    }, [])

    const generateStraightWire = useCallback((cx: number, cy: number, length: number) => {
        const pts: Point[] = []
        const startX = cx - length / 2
        for (let i = 0; i <= 60; i++) {
            pts.push({ x: startX + (i / 60) * length, y: cy })
        }
        return pts
    }, [])

    const calcBzAt = useCallback((px: number, py: number, path: Point[], I: number) => {
        let Bz = 0
        const step = Math.max(1, Math.floor(path.length / 80))
        for (let i = 0; i < path.length - 1; i += step) {
            const p1 = path[i]
            const p2 = path[i + 1]
            const dLx = p2.x - p1.x
            const dLy = p2.y - p1.y
            const midX = (p1.x + p2.x) / 2
            const midY = (p1.y + p2.y) / 2
            const rx = px - midX
            const ry = py - midY
            const r2 = rx * rx + ry * ry + 100
            const r = Math.sqrt(r2)
            const crossZ = dLx * ry - dLy * rx
            Bz += crossZ / (r * r * r)
        }
        return Bz * I * 50
    }, [])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (wireMode !== 'freehand') return
        if (e.shiftKey) {
            // Probe mode
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top }
            setProbePoint(pt)
            if (wirePath.length > 1) {
                setProbeBz(calcBzAt(pt.x, pt.y, wirePath, current))
            }
            return
        }
        setIsDrawing(true)
        setWirePath([])
        setProbePoint(null)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        setWirePath(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top }])
    }

    const handleMouseUp = () => { setIsDrawing(false) }

    const clearWire = useCallback(() => {
        setWirePath([])
        setProbePoint(null)
        setProbeBz(0)
    }, [])

    const demoSteps: DemoStep[] = [
        {
            title: 'Biot-Savart Law',
            description: 'The magnetic field from a current-carrying wire is found by integrating dB = (mu_0 / 4pi) * (I dl x r_hat) / r^2 along the wire.',
            setup: () => { clearWire(); setWireMode('freehand'); setCurrent(5) },
        },
        {
            title: 'Draw a Wire',
            description: 'Click and drag to draw a wire. The B-field is computed at every grid point. Red dots = out of page, blue crosses = into page.',
            setup: () => { clearWire(); setWireMode('freehand'); setShowMagnitude(true) },
        },
        {
            title: 'Straight Wire',
            description: 'A straight current-carrying wire produces circular B-field lines around it. The field strength falls off as 1/r.',
            setup: () => {
                setWireMode('straight')
                const canvas = canvasRef.current
                if (canvas) {
                    const w = canvas.offsetWidth
                    const h = canvas.offsetHeight
                    setWirePath(generateStraightWire(w / 2, h / 2, w * 0.7))
                }
            },
        },
        {
            title: 'Current Loop',
            description: 'A circular current loop creates a magnetic dipole field. The field is strongest at the center of the loop.',
            setup: () => {
                setWireMode('loop')
                const canvas = canvasRef.current
                if (canvas) {
                    setWirePath(generateLoop(canvas.offsetWidth / 2, canvas.offsetHeight / 2, 100))
                }
            },
        },
        {
            title: 'Solenoid',
            description: 'A solenoid is many loops in a row. The field inside is nearly uniform, and outside is very weak -- like a bar magnet.',
            setup: () => {
                setWireMode('solenoid')
                const canvas = canvasRef.current
                if (canvas) {
                    setWirePath(generateSolenoid(canvas.offsetWidth / 2, canvas.offsetHeight / 2, 300, 8))
                }
            },
        },
        {
            title: 'Current Strength',
            description: 'Increasing the current I scales the B-field proportionally. Try adjusting the slider to see the field intensify.',
            setup: () => { setCurrent(8) },
        },
        {
            title: 'Probe Point',
            description: 'Hold Shift and click anywhere to probe the exact B-field value at that point. A marker will show the calculated magnitude.',
            setup: () => { setShowMagnitude(true) },
        },
        {
            title: 'Grid Resolution',
            description: 'Adjust the grid size for finer or coarser field visualization. Smaller grids are more detailed but slower to compute.',
            setup: () => { setGridSize(15) },
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
            ctx.clearRect(0, 0, w, h)

            // Draw Wire
            if (wirePath.length > 1) {
                ctx.strokeStyle = '#fbbf24'
                ctx.lineWidth = 3
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.beginPath()
                ctx.moveTo(wirePath[0].x, wirePath[0].y)
                for (let i = 1; i < wirePath.length; i++) {
                    ctx.lineTo(wirePath[i].x, wirePath[i].y)
                }
                ctx.stroke()

                // Current direction arrows
                if (wirePath.length > 5) {
                    ctx.fillStyle = '#fbbf24'
                    for (let i = 5; i < wirePath.length; i += 20) {
                        const p1 = wirePath[i - 1]
                        const p2 = wirePath[i]
                        const dx = p2.x - p1.x
                        const dy = p2.y - p1.y
                        const angle = Math.atan2(dy, dx)
                        ctx.save()
                        ctx.translate(p2.x, p2.y)
                        ctx.rotate(angle)
                        ctx.beginPath()
                        ctx.moveTo(-5, -5)
                        ctx.lineTo(5, 0)
                        ctx.lineTo(-5, 5)
                        ctx.fill()
                        ctx.restore()
                    }
                }

                // B-field grid
                for (let y = 0; y < h; y += gridSize) {
                    for (let x = 0; x < w; x += gridSize) {
                        const val = calcBzAt(x, y, wirePath, current)

                        if (Math.abs(val) > 0.5) {
                            const maxVal = 20
                            const normVal = Math.min(Math.abs(val) / maxVal, 1)

                            ctx.beginPath()
                            if (val > 0) {
                                ctx.fillStyle = `rgba(239, 68, 68, ${normVal})`
                                ctx.arc(x, y, showMagnitude ? 1 + normVal * 3 : 2, 0, Math.PI * 2)
                                ctx.fill()
                            } else {
                                ctx.strokeStyle = `rgba(59, 130, 246, ${normVal})`
                                ctx.lineWidth = showMagnitude ? 0.5 + normVal * 2 : 1.5
                                ctx.moveTo(x - 3, y - 3)
                                ctx.lineTo(x + 3, y + 3)
                                ctx.moveTo(x + 3, y - 3)
                                ctx.lineTo(x - 3, y + 3)
                                ctx.stroke()
                            }
                        }
                    }
                }
            }

            // Probe point
            if (probePoint) {
                ctx.strokeStyle = PURPLE
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(probePoint.x, probePoint.y, 8, 0, Math.PI * 2)
                ctx.stroke()
                ctx.beginPath()
                ctx.arc(probePoint.x, probePoint.y, 2, 0, Math.PI * 2)
                ctx.fillStyle = PURPLE
                ctx.fill()

                ctx.fillStyle = 'white'
                ctx.font = '12px monospace'
                ctx.textAlign = 'left'
                ctx.fillText(`B_z = ${probeBz.toFixed(3)} (arb.)`, probePoint.x + 14, probePoint.y - 4)
                ctx.fillText(probeBz > 0 ? 'Out of page' : probeBz < 0 ? 'Into page' : '--', probePoint.x + 14, probePoint.y + 12)
            }

            // Empty state
            if (wirePath.length === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.15)'
                ctx.font = '14px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('Click and drag to draw a wire, or select a preset', w / 2, h / 2)
            }

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [wirePath, current, gridSize, showMagnitude, probePoint, probeBz, calcBzAt])

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
                        <h1 className="text-xl font-medium tracking-tight">Biot-Savart Law</h1>
                        <APTag course="Physics C: E&M" unit="Unit 3" color={PURPLE} />
                    </div>
                </div>
                <Button variant="secondary" onClick={demo.open}>Tutorial</Button>
            </div>

            <div className="flex-1 relative flex">
                <div
                    className="flex-1 relative cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    {/* Equation overlay */}
                    <div className="absolute top-4 left-4 z-10">
                        <EquationDisplay
                            departmentColor={PURPLE}
                            title="Biot-Savart Law"
                            equations={[
                                { label: 'dB', expression: '(mu_0 / 4pi)(I dl x r_hat) / r^2', description: 'Infinitesimal field contribution' },
                                { label: 'B_wire', expression: 'mu_0 I / (2pi r)', description: 'Long straight wire' },
                                { label: 'B_loop', expression: 'mu_0 I R^2 / (2(R^2 + z^2)^(3/2))', description: 'On axis of circular loop' },
                                { label: 'B_sol', expression: 'mu_0 n I', description: 'Inside ideal solenoid' },
                            ]}
                        />
                    </div>

                    {/* Info panel */}
                    <div className="absolute top-4 right-4 z-10">
                        <InfoPanel
                            departmentColor={PURPLE}
                            title="Field Info"
                            items={[
                                { label: 'Current', value: current.toFixed(1), unit: 'A' },
                                { label: 'Wire points', value: `${wirePath.length}` },
                                { label: 'Grid size', value: `${gridSize}`, unit: 'px' },
                                { label: 'Mode', value: wireMode },
                                ...(probePoint ? [
                                    { label: 'Probe B_z', value: probeBz.toFixed(4), unit: 'arb.', color: probeBz > 0 ? '#ef4444' : '#3b82f6' },
                                ] : []),
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
                        <ControlGroup label="Wire Configuration">
                            <ButtonGroup
                                value={wireMode}
                                onChange={(v) => {
                                    setWireMode(v)
                                    const canvas = canvasRef.current
                                    if (!canvas) return
                                    const w = canvas.offsetWidth
                                    const h = canvas.offsetHeight
                                    if (v === 'loop') setWirePath(generateLoop(w / 2, h / 2, 100))
                                    else if (v === 'solenoid') setWirePath(generateSolenoid(w / 2, h / 2, 300, 8))
                                    else if (v === 'straight') setWirePath(generateStraightWire(w / 2, h / 2, w * 0.7))
                                    else clearWire()
                                }}
                                options={[
                                    { value: 'freehand', label: 'Draw' },
                                    { value: 'straight', label: 'Wire' },
                                    { value: 'loop', label: 'Loop' },
                                    { value: 'solenoid', label: 'Solenoid' },
                                ]}
                                color={PURPLE}
                            />
                        </ControlGroup>
                    </ControlPanel>

                    <ControlPanel>
                        <ControlGroup label="Parameters">
                            <Slider label="Current (I)" value={current} onChange={setCurrent} min={1} max={10} step={0.5} />
                            <Slider label="Grid Resolution" value={gridSize} onChange={setGridSize} min={10} max={40} step={5} />
                        </ControlGroup>
                        <Toggle label="Scale by magnitude" value={showMagnitude} onChange={setShowMagnitude} />
                    </ControlPanel>

                    <ControlPanel>
                        <p className="text-xs text-white/40 leading-relaxed">
                            <span className="text-red-400">Red dots</span> = B out of page.{' '}
                            <span className="text-blue-400">Blue crosses</span> = B into page.
                            <br />Shift+Click to probe B-field at a point.
                        </p>
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={clearWire}>Clear Wire</Button>
                        <Button variant="secondary" onClick={() => {
                            clearWire()
                            setCurrent(5)
                            setGridSize(20)
                            setWireMode('freehand')
                            setShowMagnitude(true)
                        }}>
                            Reset
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
