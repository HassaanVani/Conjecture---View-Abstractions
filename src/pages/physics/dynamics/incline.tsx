import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function InclinePlane() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [angle, setAngle] = useState(30)
    const [mass, setMass] = useState(5)
    const [muS, setMuS] = useState(0.5) // Static friction
    const [muK, setMuK] = useState(0.3) // Kinetic friction
    const [gravity, setGravity] = useState(9.8)
    const [showComponents, setShowComponents] = useState(true)

    const stateRef = useRef({
        t: 0,
        pos: 0, // Position along the incline (starts at top, moves down)
        vel: 0,
        acc: 0,
        isMoving: false,
    })

    const reset = () => {
        setIsRunning(false)
        stateRef.current = {
            t: 0,
            pos: 0,
            vel: 0,
            acc: 0,
            isMoving: false,
        }
    }

    // Recalculate physics parameters on change
    useEffect(() => {
        if (!isRunning) {
            reset()
        }
    }, [angle, mass, muS, muK, gravity])

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

        let animId: number
        const dt = 0.016

        // Calculations
        const rad = angle * Math.PI / 180
        const fg = mass * gravity
        const fgx = fg * Math.sin(rad) // Component down the slope
        const fgy = fg * Math.cos(rad) // Normal force component
        const fn = fgy
        const fsMax = muS * fn
        const fk = muK * fn

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            if (isRunning) {
                // Determine forces
                if (!stateRef.current.isMoving) {
                    // Check if static friction is overcome
                    if (fgx > fsMax) {
                        stateRef.current.isMoving = true
                    } else {
                        stateRef.current.acc = 0
                        stateRef.current.vel = 0
                    }
                }

                if (stateRef.current.isMoving) {
                    const fNet = fgx - fk
                    const acc = fNet / mass
                    stateRef.current.acc = acc
                    stateRef.current.vel += acc * dt
                    stateRef.current.pos += stateRef.current.vel * dt
                    stateRef.current.t += dt
                }
            } else {
                // If not running, just calculate potential acceleration
                if (fgx > fsMax) {
                    stateRef.current.acc = (fgx - fk) / mass
                } else {
                    stateRef.current.acc = 0
                }
            }

            // Drawing
            ctx.clearRect(0, 0, width, height)

            // Setup view transform
            // Origin at slightly left, bottom
            const rampLength = width * 0.7
            const startX = width * 0.1
            const startY = height * 0.8

            // Ramp coordinates
            const endX = startX + rampLength * Math.cos(rad)
            const endY = startY - rampLength * Math.sin(rad)

            // Draw Ramp
            ctx.fillStyle = '#1e293b'
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, startY)
            ctx.lineTo(endX, endY) // Top of ramp? No, that's wrong geometry for a wedge.
            // Wedge shape: (startX, startY) -> (endX, startY) -> (startX, startY - height?) No.
            // Let's visualize a simple wedge.
            // Top point is (width * 0.8, some height). Bottom right is (width * 0.8, bottom). Bottom left is (width * 0.1, bottom).

            const baseLength = width * 0.6
            // const wedgeH = baseLength * Math.tan(rad) // Unused
            const wedgeX = width * 0.15
            const wedgeY = height * 0.85

            // Points of the triangle
            const p1 = { x: wedgeX, y: wedgeY } // Bottom left
            const p2 = { x: wedgeX + baseLength, y: wedgeY } // Bottom right

            // Let's make angle at Bottom Left
            // p1: Bottom Left
            // p2: Bottom Right
            // p3: Top Right
            // If angle is at p1, then:
            // slope goes from p1 to p3?
            // height at p2 is baseLength * tan(angle).

            const pHigh = { x: wedgeX + baseLength, y: wedgeY - baseLength * Math.tan(rad) }

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.lineTo(pHigh.x, pHigh.y)
            ctx.closePath()
            ctx.fillStyle = '#334155'
            ctx.fill()
            ctx.strokeStyle = '#94a3b8'
            ctx.stroke()

            // Draw Angle Arc
            ctx.beginPath()
            ctx.arc(p1.x, p1.y, 40, -rad, 0) // Actually canvas Y is inverted, angle goes up (negative)
            // Wait, geometry:
            // p1 is bottom left. p2 is bottom right.
            // In canvas, y increases down.
            // pHigh is (x, y - h). So it is above.
            // The slope line is from p1 to pHigh.
            // Angle is at p1.
            // Slope is negative (up).
            // Arc from 0 to -rad.
            ctx.stroke()
            ctx.fillStyle = 'rgba(255,255,255,0.2)'
            // ctx.fill() // Open arc

            ctx.fillStyle = '#cbd5e1'
            ctx.font = '12px monospace'
            ctx.fillText(`${angle}°`, p1.x + 50, p1.y - 10)

            // Block Position
            // Moves from pHigh down to p1? Or p1 up to pHigh?
            // Usually blocks slide DOWN.
            // So Start at pHigh.

            // Distance along slope = hypotenuse
            const hypotenuse = Math.sqrt(Math.pow(pHigh.x - p1.x, 2) + Math.pow(pHigh.y - p1.y, 2))

            // pos is distance from top
            let currentPos = stateRef.current.pos
            // Clamp
            if (currentPos > hypotenuse) currentPos = hypotenuse

            // Position on slope
            // Normalized vector from High to Low (p1)
            // Vector = p1 - pHigh
            const dx = p1.x - pHigh.x
            const dy = p1.y - pHigh.y
            const len = Math.sqrt(dx * dx + dy * dy)
            const ndx = dx / len
            const ndy = dy / len

            // Block Center
            // Slightly above slope
            const blockW = 40
            const blockH = 40

            // Center on slope line:
            const slopeX = pHigh.x + ndx * currentPos
            const slopeY = pHigh.y + ndy * currentPos

            // Move perpendicular to slope (up-left-ish) for drawing
            // Normal vector (rotated -90 deg from slope vector?)
            // Slope Vector (down-left) is (ndx, ndy).
            // Normal (up-left) is (ndy, -ndx)? Wait.
            // Slope angle is -rad.
            // Normal is -rad - 90 deg.

            // Easy way: 
            // Position is (slopeX, slopeY).
            // Offset by block height/2 along normal.
            // Normal points up-left.
            // Canvas coords:
            // Slope is down-left.
            // angle is `rad` below horizontal.
            // Vector (cos(180+rad), sin(180+rad))? No.

            // Block Center
            const bx = slopeX + blockH / 2 * Math.sin(rad)
            const by = slopeY - blockH / 2 * Math.cos(rad)

            ctx.save()
            ctx.translate(bx, by)
            ctx.rotate(-rad) // Rotate to match slope

            // Draw Block
            ctx.fillStyle = '#3b82f6'
            ctx.fillRect(-blockW / 2, -blockH / 2, blockW, blockH)

            // Mass Text
            ctx.fillStyle = 'white'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(`${mass}kg`, 0, 0)

            ctx.restore()

            // Forces
            if (showComponents) {
                const vecScale = 2

                // Draw Vectors from bx, by

                // Gravity (Straight Down)
                drawArrow(ctx, bx, by, bx, by + fg * vecScale, '#ef4444', 'Fg')

                // Normal (Perpendicular to slope)
                const nx = Math.sin(rad) * fn * vecScale
                const ny = -Math.cos(rad) * fn * vecScale
                drawArrow(ctx, bx, by, bx + nx, by + ny, '#22c55e', 'Fn')

                // Friction (Opposing motion, up the slope)
                // Parallel up: (cos(rad), -sin(rad)) scaled by Friction
                const fVal = stateRef.current.isMoving ? fk : Math.min(fgx, fsMax)
                const fx = Math.cos(rad) * fVal * vecScale
                const fy = -Math.sin(rad) * fVal * vecScale

                // Friction points UP slope. (Since motion is down).
                // Slope vector is down-left?
                // Wait, my slope pHigh to p1 is down-left.
                // So up-slope is top-right.
                drawArrow(ctx, bx, by, bx + fx, by + fy, '#eab308', 'f')

                // Gravity Components dashed?
                // Fg_y (opposite normal)
                // Fg_x (down slope)
            }

            animId = requestAnimationFrame(animate)
        }

        const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string, label: string) => {
            const headlen = 10
            const dx = toX - fromX
            const dy = toY - fromY
            const angle = Math.atan2(dy, dx)

            ctx.strokeStyle = color
            ctx.lineWidth = 2 * window.devicePixelRatio
            ctx.beginPath()
            ctx.moveTo(fromX, fromY)
            ctx.lineTo(toX, toY)
            ctx.stroke()

            ctx.fillStyle = color
            ctx.beginPath()
            ctx.moveTo(toX, toY)
            ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6))
            ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6))
            ctx.fill()

            ctx.fillStyle = 'white'
            ctx.font = '12px monospace'
            ctx.fillText(label, toX + 10, toY)
        }

        animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [angle, mass, muS, muK, gravity, isRunning, showComponents])

    // Calculations for UI
    const rad = angle * Math.PI / 180
    const fg = mass * gravity
    const fgx = fg * Math.sin(rad)
    const fgy = fg * Math.cos(rad)
    const fn = fgy
    const fsMax = muS * fn
    const fk = muK * fn
    const willSlide = fgx > fsMax
    const netForce = willSlide ? fgx - fk : 0
    const accel = netForce / mass

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
                        <h1 className="text-xl font-medium tracking-tight">Incline Plane</h1>
                        <p className="text-xs text-white/50">Dynamics Unit</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    {/* Stats Overlay */}
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl min-w-[220px]">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Forces & Motion</h3>
                        <div className="space-y-2 text-sm font-mono">
                            <div className="flex justify-between">
                                <span className="text-white/60">Fg (Gravity)</span>
                                <span>{fg.toFixed(1)} N</span>
                            </div>
                            <div className="flex justify-between pl-2 border-l border-white/10">
                                <span className="text-white/50">Fg_x (Down)</span>
                                <span>{fgx.toFixed(1)} N</span>
                            </div>
                            <div className="flex justify-between pl-2 border-l border-white/10">
                                <span className="text-white/50">Fg_y (Normal)</span>
                                <span>{fgy.toFixed(1)} N</span>
                            </div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-white/10">
                                <span className="text-white/60">Fn (Normal)</span>
                                <span className="text-green-400">{fn.toFixed(1)} N</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Fs_max</span>
                                <span className="text-yellow-400/70">{fsMax.toFixed(1)} N</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Fk (Kinetic)</span>
                                <span className="text-yellow-400">{fk.toFixed(1)} N</span>
                            </div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-white/10 font-bold">
                                <span className="text-white/80">Net Force</span>
                                <span>{netForce.toFixed(1)} N</span>
                            </div>
                            <div className="flex justify-between text-blue-400">
                                <span>Acceleration</span>
                                <span>{accel.toFixed(2)} m/s²</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Inclination (θ)</label>
                            <span className="text-xs font-mono text-blue-400">{angle}°</span>
                        </div>
                        <input
                            type="range" min="0" max="60" value={angle}
                            onChange={(e) => setAngle(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Mass (m)</label>
                            <span className="text-xs font-mono text-purple-400">{mass} kg</span>
                        </div>
                        <input
                            type="range" min="1" max="100" value={mass}
                            onChange={(e) => setMass(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Gravity (g)</label>
                            <span className="text-xs font-mono text-indigo-400">{gravity} m/s²</span>
                        </div>
                        <input
                            type="range" min="1" max="25" step="0.1" value={gravity}
                            onChange={(e) => setGravity(Number(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Friction Coefficients</h3>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Static (μs)</label>
                                <span className="text-xs font-mono text-yellow-500">{muS}</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.05" value={muS}
                                onChange={(e) => setMuS(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Kinetic (μk)</label>
                                <span className="text-xs font-mono text-yellow-600">{muK}</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.05" value={muK}
                                onChange={(e) => setMuK(Math.min(Number(e.target.value), muS))} // Limit muK <= muS physics rule usually
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                            />
                            {muK > muS && <p className="text-[10px] text-red-400 mt-1">Warning: μk should be ≤ μs</p>}
                        </div>
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${isRunning
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/20'
                            }`}
                        disabled={!willSlide && !isRunning}
                    >
                        {isRunning ? 'Reset Position' : !willSlide ? 'Stuck (Friction)' : 'Release Block'}
                    </button>
                    {!willSlide && !isRunning && (
                        <div className="text-center text-xs text-yellow-500/80">
                            Block will not slide (Fg_x ≤ Fs_max)
                        </div>
                    )}

                    <div className="pt-2">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Show FBD Vectors</span>
                            <input
                                type="checkbox"
                                checked={showComponents}
                                onChange={(e) => setShowComponents(e.target.checked)}
                                className="accent-blue-500"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}
