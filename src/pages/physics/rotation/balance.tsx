import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'

const PC = 'rgb(160, 100, 255)'

interface Weight {
    id: number; mass: number; x: number; color: string; isDragging: boolean
}

export default function TorqueBalance() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(true)
    const [showForces, setShowForces] = useState(true)
    const [showTorqueArcs, setShowTorqueArcs] = useState(true)
    const [weights, setWeights] = useState<Weight[]>([
        { id: 1, mass: 10, x: -100, color: '#3b82f6', isDragging: false },
        { id: 2, mass: 5, x: 200, color: '#ec4899', isDragging: false },
    ])

    const stateRef = useRef({ angle: 0, omega: 0, alpha: 0 })
    const dragRef = useRef<{ id: number | null }>({ id: null })
    const weightsRef = useRef(weights)
    useEffect(() => { weightsRef.current = weights }, [weights])

    const addWeight = (m: number) => {
        const id = Math.max(0, ...weights.map(w => w.id)) + 1
        setWeights([...weights, { id, mass: m, x: 0, color: m > 5 ? '#3b82f6' : '#ec4899', isDragging: false }])
    }

    const removeWeight = (id: number) => setWeights(weights.filter(w => w.id !== id))

    const reset = useCallback(() => {
        stateRef.current = { angle: 0, omega: 0, alpha: 0 }
        setWeights([
            { id: 1, mass: 10, x: -100, color: '#3b82f6', isDragging: false },
            { id: 2, mass: 5, x: 200, color: '#ec4899', isDragging: false },
        ])
    }, [])

    const g = 9.8 * 20
    const beamMass = 5
    const beamLen = 600

    // Calculate torques and MOI
    let netTorque = 0
    let momentOfInertia = (1 / 12) * beamMass * beamLen ** 2
    weights.forEach(w => {
        netTorque += w.x * w.mass * g * Math.cos(stateRef.current.angle)
        momentOfInertia += w.mass * w.x ** 2
    })
    const angularAccel = momentOfInertia > 0 ? netTorque / momentOfInertia : 0
    const angleDeg = stateRef.current.angle * 180 / Math.PI
    const isBalanced = Math.abs(netTorque) < 500

    const demoSteps = [
        { title: 'Torque & Rotation', description: 'Torque causes rotation. Place weights on the beam and observe how position and mass determine rotational balance.', highlight: 'Drag weights along the beam.' },
        { title: 'Torque = r x F', description: 'Torque equals the lever arm times the force. A mass farther from the pivot creates more torque.', setup: () => { reset(); setShowForces(true) } },
        { title: 'Balancing Torques', description: 'The beam is balanced when net torque is zero: sum of clockwise torques = sum of counterclockwise torques.', setup: () => { setWeights([{ id: 1, mass: 10, x: -100, color: '#3b82f6', isDragging: false }, { id: 2, mass: 10, x: 100, color: '#ec4899', isDragging: false }]) } },
        { title: 'Moment of Inertia', description: 'I = sum(mr\u00B2). Masses farther from the pivot increase the moment of inertia, making the beam harder to rotate.', setup: () => { setShowTorqueArcs(true) } },
        { title: 'Angular Acceleration', description: '\u03B1 = \u03C4_net / I. When unbalanced, the beam accelerates rotationally. Heavier side tips down.', setup: () => { setWeights([{ id: 1, mass: 15, x: -100, color: '#3b82f6', isDragging: false }, { id: 2, mass: 5, x: 100, color: '#ec4899', isDragging: false }]) } },
        { title: 'Multiple Forces', description: 'Add more weights to create complex balance scenarios. Each weight contributes its own torque about the pivot.', setup: () => { addWeight(8) } },
        { title: 'Unequal Arms', description: 'A small mass far from the pivot can balance a large mass close to it. This is the principle of levers.', setup: () => { setWeights([{ id: 1, mass: 20, x: -50, color: '#3b82f6', isDragging: false }, { id: 2, mass: 5, x: 200, color: '#ec4899', isDragging: false }]) } },
        { title: 'Experiment!', description: 'Add and remove weights. Drag them to find the balance point. Freeze/unfreeze to test your predictions.' },
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

        const handleMouseDown = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            const mx = e.clientX - rect.left; const my = e.clientY - rect.top
            const cx = canvas.offsetWidth / 2; const cy = canvas.offsetHeight / 2 + 50
            const angle = stateRef.current.angle
            for (const w of weightsRef.current) {
                const wx = cx + w.x * Math.cos(angle) - (-20) * Math.sin(angle)
                const wy = cy + w.x * Math.sin(angle) + (-20) * Math.cos(angle)
                if (Math.sqrt((mx - wx) ** 2 + (my - wy) ** 2) < 30 + Math.sqrt(w.mass) * 3) {
                    dragRef.current.id = w.id
                    setWeights(prev => prev.map(pw => pw.id === w.id ? { ...pw, isDragging: true } : pw))
                    return
                }
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (dragRef.current.id !== null) {
                const rect = canvas.getBoundingClientRect()
                const mx = e.clientX - rect.left; const my = e.clientY - rect.top
                const cx = canvas.offsetWidth / 2; const cy = canvas.offsetHeight / 2 + 50
                const angle = stateRef.current.angle
                const bux = Math.cos(angle); const buy = Math.sin(angle)
                let pos = (mx - cx) * bux + (my - cy) * buy
                pos = Math.max(-300, Math.min(300, pos))
                setWeights(prev => prev.map(w => w.id === dragRef.current.id ? { ...w, x: pos } : w))
            }
        }

        const handleMouseUp = () => {
            if (dragRef.current.id !== null) {
                setWeights(prev => prev.map(w => w.id === dragRef.current.id ? { ...w, isDragging: false } : w))
                dragRef.current.id = null
            }
        }

        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        let animId: number
        const dt = 0.016

        const animate = () => {
            const width = canvas.offsetWidth; const height = canvas.offsetHeight
            const cx = width / 2; const cy = height / 2 + 50

            if (isRunning && dragRef.current.id === null) {
                let tau = 0; let I = (1 / 12) * beamMass * beamLen ** 2
                weightsRef.current.forEach(w => {
                    tau += w.x * w.mass * g * Math.cos(stateRef.current.angle)
                    I += w.mass * w.x ** 2
                })
                tau -= stateRef.current.omega * 10000
                if (stateRef.current.angle > 0.5) tau -= (stateRef.current.angle - 0.5) * 500000
                else if (stateRef.current.angle < -0.5) tau -= (stateRef.current.angle + 0.5) * 500000
                stateRef.current.alpha = tau / I
                stateRef.current.omega += stateRef.current.alpha * dt
                stateRef.current.angle += stateRef.current.omega * dt
            }

            ctx.clearRect(0, 0, width, height)
            ctx.save(); ctx.translate(cx, cy)

            // Support triangle
            ctx.fillStyle = '#475569'; ctx.beginPath()
            ctx.moveTo(0, 0); ctx.lineTo(-22, 42); ctx.lineTo(22, 42); ctx.fill()

            ctx.rotate(stateRef.current.angle)

            // Beam
            const beamGrad = ctx.createLinearGradient(-300, 0, 300, 0)
            beamGrad.addColorStop(0, '#64748b'); beamGrad.addColorStop(0.5, '#94a3b8'); beamGrad.addColorStop(1, '#64748b')
            ctx.fillStyle = beamGrad; ctx.fillRect(-300, -6, 600, 12)

            // Ticks
            ctx.fillStyle = '#334155'
            for (let i = -250; i <= 250; i += 50) { ctx.fillRect(i - 0.5, -6, 1, 12) }

            // Weights
            weightsRef.current.forEach(w => {
                const bs = 25 + Math.sqrt(w.mass) * 3; const yPos = -6 - bs
                ctx.fillStyle = w.color; ctx.fillRect(w.x - bs / 2, yPos, bs, bs)
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(w.x - bs / 2, yPos, bs, bs)
                ctx.fillStyle = 'white'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
                ctx.fillText(`${w.mass}kg`, w.x, yPos + bs / 2)

                if (showForces) {
                    ctx.save(); ctx.translate(w.x, 0); ctx.rotate(-stateRef.current.angle)
                    const aLen = w.mass * 3
                    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, aLen); ctx.stroke()
                    ctx.fillStyle = '#ef4444'; ctx.beginPath()
                    ctx.moveTo(0, aLen); ctx.lineTo(-4, aLen - 6); ctx.lineTo(4, aLen - 6); ctx.fill()
                    ctx.fillStyle = '#ef4444'; ctx.font = '9px monospace'; ctx.textAlign = 'left'
                    ctx.fillText(`${(w.mass * 9.8).toFixed(0)}N`, 6, aLen - 3)
                    ctx.restore()
                }

                if (showTorqueArcs) {
                    ctx.save(); ctx.strokeStyle = w.x < 0 ? 'rgba(59,130,246,0.3)' : 'rgba(236,72,153,0.3)'
                    ctx.lineWidth = 2; ctx.setLineDash([3, 3])
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w.x, 0); ctx.stroke()
                    ctx.setLineDash([]); ctx.restore()
                    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '8px monospace'; ctx.textAlign = 'center'
                    ctx.fillText(`r=${Math.abs(w.x).toFixed(0)}`, w.x / 2, 18)
                }
            })

            ctx.restore()

            // Balance indicator
            const balanced = Math.abs(netTorque) < 500
            ctx.fillStyle = balanced ? '#22c55e' : '#ef4444'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'
            ctx.fillText(balanced ? 'BALANCED' : 'UNBALANCED', cx, 24)

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [isRunning, showForces, showTorqueArcs, weights, g, beamMass, beamLen])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Torque Balance</h1>
                        <p className="text-xs text-white/50">Rotational Equilibrium</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <APTag course="Physics 1" unit="Unit 7" color={PC} />
                    <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-[260px]">
                        <EquationDisplay departmentColor={PC} equations={[
                            { label: 'Torque', expression: '\u03C4 = r \u00D7 F = rF sin\u03B8' },
                            { label: 'Equilibrium', expression: '\u03A3\u03C4 = 0' },
                            { label: 'Newton 2nd', expression: '\u03C4_net = I\u03B1' },
                            { label: 'MOI point', expression: 'I = \u03A3 mr\u00B2' },
                            { label: 'MOI beam', expression: 'I = (1/12)ML\u00B2' },
                        ]} />
                    </div>

                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PC} title="Rotation Data" items={[
                            { label: 'Net Torque', value: netTorque / 100, unit: 'N\u00B7m' },
                            { label: 'MOI (I)', value: momentOfInertia / 1000, unit: 'kg\u00B7m\u00B2' },
                            { label: '\u03B1', value: angularAccel, unit: 'rad/s\u00B2' },
                            { label: '\u03C9', value: stateRef.current.omega, unit: 'rad/s' },
                            { label: 'Angle', value: `${angleDeg.toFixed(1)}\u00B0` },
                            { label: 'Status', value: isBalanced ? 'Balanced' : 'Unbalanced', color: isBalanced ? '#22c55e' : '#ef4444' },
                        ]} />
                    </div>

                    <div className="absolute top-4 right-4 mt-[260px] flex gap-2">
                        <button onClick={() => addWeight(5)} className="bg-pink-500/20 text-pink-400 border border-pink-500/50 px-3 py-1 rounded text-sm hover:bg-pink-500/30">+ 5kg</button>
                        <button onClick={() => addWeight(10)} className="bg-blue-500/20 text-blue-400 border border-blue-500/50 px-3 py-1 rounded text-sm hover:bg-blue-500/30">+ 10kg</button>
                    </div>

                    {demo.isOpen && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                            <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={PC} />
                        </div>
                    )}
                </div>

                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <p className="text-sm text-white/70 leading-relaxed">Drag weights along the beam to balance torque. Add/remove masses with the buttons.</p>
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={() => setIsRunning(!isRunning)} className="flex-1">
                            {isRunning ? 'Freeze' : 'Unfreeze'}
                        </Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>

                    <Toggle label="Force Vectors" value={showForces} onChange={setShowForces} />
                    <Toggle label="Torque Arms" value={showTorqueArcs} onChange={setShowTorqueArcs} />

                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Active Masses</h3>
                        {weights.map(w => (
                            <div key={w.id} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded">
                                <span style={{ color: w.color }}>{w.mass}kg</span>
                                <span className="font-mono text-white/50">r={w.x.toFixed(0)}</span>
                                <span className="font-mono text-white/40">\u03C4={(w.x * w.mass * 9.8 / 100).toFixed(1)}</span>
                                <button onClick={() => removeWeight(w.id)} className="text-red-400 hover:text-red-300 text-lg leading-none">&times;</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
