import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function LensesMirrors() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [type, setType] = useState<'convex-lens' | 'concave-lens' | 'concave-mirror' | 'convex-mirror'>('convex-lens')
    const [focalLength, setFocalLength] = useState(100) // pixels. Negative for diverging.
    const [objectDist, setObjectDist] = useState(200) // pixels from optical center
    const [objectHeight, setObjectHeight] = useState(60) // pixels
    const [isDragging, setIsDragging] = useState(false)

    // Derived state for physics
    // 1/f = 1/do + 1/di  => 1/di = 1/f - 1/do => di = (f*do)/(do-f)
    // M = -di/do = hi/ho => hi = M * ho

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

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight
            const cx = width / 2
            const cy = height / 2

            ctx.clearRect(0, 0, width, height)

            // Optical Axis
            ctx.beginPath()
            ctx.moveTo(0, cy)
            ctx.lineTo(width, cy)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.setLineDash([5, 5])
            ctx.stroke()
            ctx.setLineDash([])

            // Draw Lens/Mirror
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 2
            const lensH = 200

            // Effective F
            let f = focalLength
            if (type === 'concave-lens' || type === 'convex-mirror') f = -Math.abs(focalLength)
            else f = Math.abs(focalLength)

            // For Mirrors, light comes from left and reflects back left?
            // Or typically drawn: Object on left, Mirror varies.
            // Concave Mirror (converging): f > 0.
            // Convex Mirror (diverging): f < 0.

            const isLens = type.includes('lens')

            if (isLens) {
                // Draw effective lens plane
                ctx.beginPath(); ctx.moveTo(cx, cy - lensH / 2); ctx.lineTo(cx, cy + lensH / 2); ctx.stroke()
                // Icons
                if (type === 'convex-lens') {
                    // Arrows pointing out
                    ctx.lineTo(cx - 10, cy + lensH / 2 - 10); ctx.moveTo(cx, cy + lensH / 2); ctx.lineTo(cx + 10, cy + lensH / 2 - 10)
                    ctx.moveTo(cx, cy - lensH / 2); ctx.lineTo(cx - 10, cy - lensH / 2 + 10); ctx.moveTo(cx, cy - lensH / 2); ctx.lineTo(cx + 10, cy - lensH / 2 + 10)
                } else {
                    // Inverted arrows (Y shape)
                    ctx.moveTo(cx, cy - lensH / 2); ctx.lineTo(cx - 10, cy - lensH / 2 - 10); ctx.moveTo(cx, cy - lensH / 2); ctx.lineTo(cx + 10, cy - lensH / 2 - 10)
                    ctx.moveTo(cx, cy + lensH / 2); ctx.lineTo(cx - 10, cy + lensH / 2 + 10); ctx.moveTo(cx, cy + lensH / 2); ctx.lineTo(cx + 10, cy + lensH / 2 + 10)
                }
                ctx.stroke()
            } else {
                // Mirror: Curve
                ctx.beginPath()
                // Simple arc
                const r = Math.abs(f) * 2 // Radius of curvature
                // Center of curvature
                // Concave: C is on left (if object left)? No, C is on Real side.
                // Standard: Object on Left.
                // Concave Mirror: )   <-- Light. C is Left.
                // Convex Mirror: (    <-- Light. C is Right.

                // Let's simplify drawing to a line with tick marks on non-reflective side
                if (type === 'concave-mirror') {
                    // ) shape
                    ctx.arc(cx - r, cy, r, -0.2, 0.2) // Very approx
                    // Actually better just draw a curved vertical line
                    ctx.moveTo(cx, cy - lensH / 2); ctx.quadraticCurveTo(cx - 20, cy, cx, cy + lensH / 2);
                } else {
                    // ( shape
                    ctx.moveTo(cx, cy - lensH / 2); ctx.quadraticCurveTo(cx + 20, cy, cx, cy + lensH / 2);
                }
                ctx.stroke()
                // Ticks on back
                // If Concave, back is Right.
                // If Convex, back is Left. (Wait, Convex reflects from outer bulge) -> Light hits (, back is ).
                // Wait: Concave ) <-- Light. Back is Right.
                // Convex ( <-- Light. Back is Right?? No. ( <-- Light would be inside bowl.
                // Convex is bulge towards light. ) <-- Light.
                // Concave is cave away from light. ( <-- Light.

                // Let's stick to standard symbols
            }

            // Draw Focal Points
            ctx.fillStyle = 'yellow'
            ctx.beginPath(); ctx.arc(cx - Math.abs(f), cy, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillText('F', cx - Math.abs(f), cy + 15)
            ctx.beginPath(); ctx.arc(cx + Math.abs(f), cy, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillText('F\'', cx + Math.abs(f), cy + 15)


            // Draw Object
            // Always on Left (negative x relative to center in standard physics convention? No, Object usually at x=0, Lens at x=do?
            // Here: Lens at cx. Object at cx - objectDist.
            const ox = cx - objectDist
            const oy = cy - objectHeight

            ctx.strokeStyle = '#3b82f6' // Blue Object
            ctx.lineWidth = 3
            ctx.beginPath(); ctx.moveTo(ox, cy); ctx.lineTo(ox, oy); ctx.stroke()
            // Arrowhead
            ctx.beginPath(); ctx.moveTo(ox - 5, oy + 5); ctx.lineTo(ox, oy); ctx.lineTo(ox + 5, oy + 5); ctx.stroke()
            ctx.fillStyle = '#3b82f6'; ctx.fillText('Object', ox, oy - 10)


            // Calculate Image
            // 1/f = 1/do + 1/di -> 1/di = 1/f - 1/do
            // do is positive (real object)
            // f sign determines type

            let di = 0
            if (objectDist !== f) {
                di = (f * objectDist) / (objectDist - f)
            } else {
                di = Infinity // Parallel rays
            }

            const M = -di / objectDist
            const imageH = M * objectHeight

            // Draw Image
            // For Lens: Real image (di > 0) is on Right side (transmit). Virtual (di < 0) is Left.
            // For Mirror: Real image (di > 0) is on Left side (reflect). Virtual (di < 0) is Right.

            let ix = 0
            if (isLens) {
                ix = cx + di
            } else {
                ix = cx - di // Mirror: Positive di means Left side (Real)
            }

            const iy = cy - imageH // y-axis up is negative in canvas, so positive Height goes up (lower pixel val)
            // Wait, oy = cy - objectHeight. objectHeight > 0 means Up.
            // imageH > 0 means Up (Upright). imageH < 0 means Down (Inverted).
            // So iy = cy - imageH is correct.

            if (Math.abs(di) < 5000) {
                ctx.strokeStyle = di > 0 ? '#ef4444' : 'rgba(239, 68, 68, 0.5)' // Solid Real, Fade Virtual
                if (!isLens && di > 0) ctx.strokeStyle = '#ef4444' // Real mirror image
                if (!isLens && di < 0) ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)' // Virtual mirror image

                ctx.lineWidth = 3
                ctx.beginPath(); ctx.moveTo(ix, cy); ctx.lineTo(ix, iy); ctx.stroke()
                // Arrow
                ctx.beginPath(); ctx.moveTo(ix - 5, iy + (imageH > 0 ? 5 : -5)); ctx.lineTo(ix, iy); ctx.lineTo(ix + 5, iy + (imageH > 0 ? 5 : -5)); ctx.stroke()

                ctx.fillStyle = '#ef4444'; ctx.fillText(di > 0 ? 'Real Image' : 'Virtual Image', ix, iy - 10)
            }


            // RAY TRACING LINES
            // 1. Parallel to axis -> Refracts/Reflects through Focal Point
            // 2. Through Focal Point -> Refracts/Reflects Parallel
            // 3. Through Center -> Un-deviated (Lens) or Reflects equal angle (Mirror - Vertex)

            ctx.lineWidth = 1
            ctx.globalAlpha = 0.6

            // Ray 1: Parallel In
            ctx.strokeStyle = '#fbbf24' // Yellow
            ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cx, oy); ctx.stroke() // To lens

            // Out
            // Lens: Through F on far side (Convex) or diverge from F on near side (Concave)
            // Mirror: Through F on near side (Concave) or diverge from F on far side (Convex)

            if (isLens) {
                // Passes through (cx, oy)
                // Target is Focal points.
                // Convex (f>0): Goes to F_right (cx + f, cy)
                // Concave (f<0): Diverges as if coming from F_left (cx + f, cy) -> (cx - |f|, cy)

                // Ray eq: passing (cx, oy) and (cx + f, cy)
                // Slope m = (cy - oy) / ((cx + f) - cx) = (cy-oy)/f

                // Draw extended ray
                const m1 = (cy - oy) / f
                const endX = width
                const endY = cy + m1 * (endX - cx) // y - y1 = m(x - x1)

                ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(endX, endY); ctx.stroke()

                // Backtrace for virtual?
                if (f < 0) {
                    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'; ctx.setLineDash([5, 5])
                    ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx + f * 10, cy + m1 * f * 10); ctx.stroke(); ctx.setLineDash([])
                }
            } else {
                // Mirror
                // Concave (f>0): Reflects through F (cx - f, cy) [Left side F]
                // Convex (f<0): Reflects as if from F (cx - f, cy) [Right side F]
                // But my f def above: Concave f>0. F is at cx - f ?
                // Standard: Concave Mirror F is on left. cx - f.
                // Convex Mirror F is on right. cx - f (where f is negative) -> cx + |f|

                const fx = cx - f
                // Ray passes (cx, oy) and goes towards fx?
                // No, Ray 1 hits (cx, oy). Reflects through F.
                // Slope m = (cy - oy) / (fx - cx) = -objectHeight / (-f) = objectHeight/f

                const m1 = (oy - cy) / (cx - fx) // (oy-0)/f

                // Drawn Ray goes to Left
                const endX = 0
                const endY = oy - m1 * (cx - endX)

                ctx.strokeStyle = '#fbbf24'
                ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(endX, endY); ctx.stroke()

                // Backtrace for convex
                if (f < 0) {
                    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'; ctx.setLineDash([5, 5])
                    ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(fx, cy); ctx.stroke(); ctx.setLineDash([])
                }
            }

            // Ray 3: Center (Lens) or Vertex (Mirror)
            ctx.strokeStyle = '#a855f7' // Purple
            if (isLens) {
                // Through center (cx, cy) undeviated
                ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cx + (cx - ox) * 2, cy + (cy - oy) * 2); ctx.stroke()
            } else {
                // Hts vertex (cx, cy). Reflects symmetrically.
                ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cx, cy); ctx.stroke()
                // Reflect
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(0, cy + (cy - oy) * (cx) / (cx - ox)); ctx.stroke()
                // Actually goes to Image Point
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ix, iy); ctx.stroke()
            }


            ctx.globalAlpha = 1.0

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [type, focalLength, objectDist, objectHeight])

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const width = canvas.offsetWidth
        const cx = width / 2

        // Check collision with Object
        const ox = cx - objectDist
        if (Math.abs(mx - ox) < 30) {
            setIsDragging(true)
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const width = canvas.offsetWidth
        const cx = width / 2

        // New distance
        const newDist = cx - mx
        if (newDist > 10 && newDist < cx - 10) {
            setObjectDist(newDist)
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }


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
                        <h1 className="text-xl font-medium tracking-tight">Lenses & Mirrors</h1>
                        <p className="text-xs text-white/50">AP Physics 2: Optics</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative cursor-ew-resize">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div className="text-sm text-white/70 leading-relaxed">
                        <b>1/f = 1/dₒ + 1/dᵢ</b>
                        <br />
                        <b>M = hᵢ/hₒ = -dᵢ/dₒ</b>
                        <br />
                        Drag the object to change dₒ.
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-white/80 mb-2 block">Optical Element</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    ['convex-lens', 'Convex Lens'],
                                    ['concave-lens', 'Concave Lens'],
                                    ['concave-mirror', 'Concave Mirror'],
                                    ['convex-mirror', 'Convex Mirror']
                                ].map(([val, label]) => (
                                    <button
                                        key={val}
                                        onClick={() => setType(val as any)}
                                        className={`px-3 py-2 text-xs rounded-lg transition-all ${type === val ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Focal Length (f)</label>
                                <span className="text-xs font-mono text-white/60">{Math.abs(focalLength)} px</span>
                            </div>
                            <input
                                type="range" min="50" max="300" step="10" value={Math.abs(focalLength)}
                                onChange={(e) => setFocalLength(Number(e.target.value) * (focalLength < 0 ? -1 : 1))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Object Height (hₒ)</label>
                                <span className="text-xs font-mono text-white/60">{objectHeight} px</span>
                            </div>
                            <input
                                type="range" min="20" max="150" step="5" value={objectHeight}
                                onChange={(e) => setObjectHeight(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
