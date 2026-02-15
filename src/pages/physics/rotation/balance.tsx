import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

interface Weight {
    id: number
    mass: number
    x: number // Position on beam (-relative to center)
    y: number // Visual y (usually on top of beam)
    color: string
    isDragging: boolean
}

export default function TorqueBalance() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(true)
    const [showForces, setShowForces] = useState(true)
    const [weights, setWeights] = useState<Weight[]>([
        { id: 1, mass: 10, x: -100, y: 0, color: '#3b82f6', isDragging: false },
        { id: 2, mass: 5, x: 200, y: 0, color: '#ec4899', isDragging: false }
    ])

    // Physics State
    const stateRef = useRef({
        angle: 0, // angular position
        omega: 0, // angular velocity
        alpha: 0 // angular acceleration
    })

    // Dragging state needs to be ref to be accessible in event listeners without re-binding
    const dragRef = useRef<{ id: number | null, offsetX: number, offsetY: number }>({ id: null, offsetX: 0, offsetY: 0 })

    const addWeight = (mass: number) => {
        const id = Math.max(0, ...weights.map(w => w.id)) + 1
        // Place it somewhere
        setWeights([...weights, { id, mass, x: 0, y: -50, color: mass > 5 ? '#3b82f6' : '#ec4899', isDragging: false }])
    }

    const removeWeight = (id: number) => {
        setWeights(weights.filter(w => w.id !== id))
    }

    const reset = () => {
        stateRef.current = { angle: 0, omega: 0, alpha: 0 }
        setWeights([
            { id: 1, mass: 10, x: -100, y: 0, color: '#3b82f6', isDragging: false },
            { id: 2, mass: 5, x: 200, y: 0, color: '#ec4899', isDragging: false }
        ])
    }

    // Update weights ref for animation loop?
    // We can just use the state weights in the loop via a ref if needed, or update the ref when state changes.
    // Better: use a ref for weights for physics thread, sync with state for React.
    // Actually, simple React state is fine if fps isn't critical or we use refs for high freq updates.
    // Dragging updates state frequently.

    const weightsRef = useRef(weights)
    useEffect(() => { weightsRef.current = weights }, [weights])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        const handleMouseDown = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            const mx = e.clientX - rect.left
            const my = e.clientY - rect.top

            // Check weights
            // We need to transform mouse coordinates to beam coordinates if rotating?
            // Actually, for dragging, let's assume we pick them up and position them relative to the beam center.
            // Visually they are drawn at rotated positions.

            // It's easier if we only allow dragging when simulation is loosely running or handled.
            // Let's iterate weights and check distance.

            const cx = canvas.offsetWidth / 2
            const cy = canvas.offsetHeight / 2 + 50
            const angle = stateRef.current.angle

            for (const w of weightsRef.current) {
                // Weight position in world
                // Beam vector: (cos a, sin a)
                // Pos = Center + (x * cos a, x * sin a) - (0, w_height) rotated?
                // Simplified: Just center + x along beam + y offset.

                // Rotated x:
                const wx = cx + w.x * Math.cos(angle) - (-20) * Math.sin(angle) // -20 is height offset
                const wy = cy + w.x * Math.sin(angle) + (-20) * Math.cos(angle)

                const boxSize = 25 + Math.sqrt(w.mass) * 3

                // Distance check (circle approx)
                const dist = Math.sqrt((mx - wx) ** 2 + (my - wy) ** 2)
                if (dist < boxSize) {
                    dragRef.current = { id: w.id, offsetX: 0, offsetY: 0 }
                    // Update drag state
                    setWeights(prev => prev.map(pw => pw.id === w.id ? { ...pw, isDragging: true } : pw))
                    return
                }
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (dragRef.current.id !== null) {
                const rect = canvas.getBoundingClientRect()
                const mx = e.clientX - rect.left
                // const my = e.clientY - rect.top

                // Map mouse X to beam position X
                // We want to project mouse position onto the beam line?
                const cx = canvas.offsetWidth / 2
                const cy = canvas.offsetHeight / 2 + 50
                const angle = stateRef.current.angle

                // Vector from pivot to mouse
                const vmx = mx - cx
                const vmy = (e.clientY - rect.top) - cy

                // Beam unit vector
                const bux = Math.cos(angle)
                const buy = Math.sin(angle)

                // Project v onto b: dot product
                let beamPos = vmx * bux + vmy * buy

                // Clamp to beam length
                const beamLen = 300 // Half length
                beamPos = Math.max(-beamLen, Math.min(beamLen, beamPos))

                // Update weight
                setWeights(prev => prev.map(w => {
                    if (w.id === dragRef.current.id) {
                        return { ...w, x: beamPos }
                    }
                    return w
                }))
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
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight
            const cx = width / 2
            const cy = height / 2 + 50

            // Physics
            if (isRunning && dragRef.current.id === null) {
                // Calculate Net Torque
                let netTorque = 0
                let momentOfInertia = 0

                // Beam MOI
                const beamMass = 5 // kg
                // const beamLen = 600 // pixels? Let's say 1 px = 1mm -> 0.6m
                // const beamLenM = 3.0 // 3 meters total length?
                // I need consistent units.
                // Let's use pixels for position r.
                // Torque = r * F.

                const g = 9.8 * 20 // scale g

                // Torque due to weights
                weightsRef.current.forEach(w => {
                    // r is horizontal distance from pivot?
                    // r is w.x. Force is gravity (down).
                    // Torque = r X F. 
                    // F vector (0, mg). r vector (x, y) rotated.
                    // Just use Perpendicular component.
                    // tau = r * F * cos(theta) where theta is beam angle?
                    // Angle 0 is horizontal. Force is vertical.
                    // Angle between r and horizontal is 'angle'.
                    // Effective lever arm is r * cos(angle).

                    const r = w.x
                    const force = w.mass * g
                    // Torque = r * F_perpendicular
                    // F_perp = F * cos(angle)

                    netTorque += r * force * Math.cos(stateRef.current.angle)

                    // MOI: m * r^2
                    momentOfInertia += w.mass * (w.x) ** 2
                })

                // Add Beam MOI: 1/12 * M * L^2
                // L = 600 total (-300 to 300)
                momentOfInertia += 1 / 12 * beamMass * (600) ** 2

                // Damping
                netTorque -= stateRef.current.omega * 10000 // Damping constant

                // Restoring torque if it hits ground??
                // Limit angle to +/- 30 deg
                if (stateRef.current.angle > 0.5) {
                    netTorque -= (stateRef.current.angle - 0.5) * 500000 // Springy bounce wall
                } else if (stateRef.current.angle < -0.5) {
                    netTorque -= (stateRef.current.angle + 0.5) * 500000
                }

                stateRef.current.alpha = netTorque / momentOfInertia
                stateRef.current.omega += stateRef.current.alpha * dt
                stateRef.current.angle += stateRef.current.omega * dt
            }

            // Draw
            ctx.clearRect(0, 0, width, height)

            ctx.save()
            ctx.translate(cx, cy)

            // Draw Support
            ctx.fillStyle = '#64748b'
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(-20, 40)
            ctx.lineTo(20, 40)
            ctx.fill()

            // Rotate Beam
            ctx.rotate(stateRef.current.angle)

            // Draw Beam
            ctx.fillStyle = '#94a3b8' // Slate-400
            ctx.fillRect(-300, -5, 600, 10)

            // Ticks
            ctx.fillStyle = '#475569'
            for (let i = -250; i <= 250; i += 50) {
                ctx.fillRect(i, -5, 1, 10)
            }

            // Draw Weights
            weightsRef.current.forEach(w => {
                const boxSize = 25 + Math.sqrt(w.mass) * 3
                ctx.fillStyle = w.color
                // Position on beam
                const yPos = -5 - boxSize
                ctx.fillRect(w.x - boxSize / 2, yPos, boxSize, boxSize)

                ctx.fillStyle = 'rgba(255,255,255,0.9)'
                ctx.font = '10px monospace'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(`${w.mass}`, w.x, yPos + boxSize / 2)

                // Force Arrow
                if (showForces) {
                    // Draw vertical arrow relative to world?
                    // We are in rotated context.
                    // Rotate back to draw vertical arrow?
                    ctx.save()
                    ctx.translate(w.x, 0)
                    ctx.rotate(-stateRef.current.angle) // Back to vertical
                    const arrowLen = w.mass * 3
                    ctx.strokeStyle = '#ef4444' // Red arrow
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.moveTo(0, 0)
                    ctx.lineTo(0, arrowLen)
                    ctx.stroke()
                    // Head
                    ctx.beginPath()
                    ctx.moveTo(0, arrowLen)
                    ctx.lineTo(-3, arrowLen - 5)
                    ctx.lineTo(3, arrowLen - 5)
                    ctx.fill()
                    ctx.restore()
                }
            })

            ctx.restore()

            // Draw UI Stats
            ctx.fillStyle = 'white'
            ctx.font = '14px monospace'
            ctx.textAlign = 'left'
            ctx.fillText(`Net Torque: ${(stateRef.current.alpha * 100).toFixed(0)} arb. units`, 20, 30)
            ctx.fillText(`Angle: ${(stateRef.current.angle * 180 / Math.PI).toFixed(1)}°`, 20, 50)

            if (showForces) {
                ctx.font = '12px sans-serif'
                ctx.fillStyle = '#ef4444'
                ctx.fillText('Red arrows: Gravity Force', 20, 80)
            }

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
    }, [isRunning, showForces, weights]) // Re-bind if weights ref/state logic changes? With weightsRef we are good.

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <PhysicsBackground />
            </div>

            {/* Navbar */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Torque Balance</h1>
                        <p className="text-xs text-white/50">Rotation Unit</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

                    <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => addWeight(5)} className="bg-pink-500/20 text-pink-400 border border-pink-500/50 px-3 py-1 rounded text-sm hover:bg-pink-500/30">
                            + 5kg
                        </button>
                        <button onClick={() => addWeight(10)} className="bg-blue-500/20 text-blue-400 border border-blue-500/50 px-3 py-1 rounded text-sm hover:bg-blue-500/30">
                            + 10kg
                        </button>
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div className="text-sm text-white/70 leading-relaxed">
                        Drag weights along the beam to balance the torque.
                        <br /><br />
                        Torque τ = r × F
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${isRunning
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                : 'bg-green-500 text-white hover:bg-green-400'
                                }`}
                        >
                            {isRunning ? 'Freeze' : 'Unfreeze'}
                        </button>
                        <button
                            onClick={reset}
                            className="px-4 py-3 rounded-xl font-medium text-sm bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Show Force Vectors</span>
                            <input
                                type="checkbox"
                                checked={showForces}
                                onChange={(e) => setShowForces(e.target.checked)}
                                className="accent-blue-500"
                            />
                        </label>
                    </div>

                    {/* Weight List to remove? */}
                    <div className="space-y-2 mt-4">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Active Masses</h3>
                        {weights.map(w => (
                            <div key={w.id} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded">
                                <span style={{ color: w.color }}>{w.mass}kg</span>
                                <span className="font-mono text-white/50">r={w.x.toFixed(0)}</span>
                                <button onClick={() => removeWeight(w.id)} className="text-red-400 hover:text-red-300">×</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
