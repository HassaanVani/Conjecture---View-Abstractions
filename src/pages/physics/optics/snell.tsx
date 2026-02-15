import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function SnellsLaw() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [n1, setN1] = useState(1.0) // Air
    const [n2, setN2] = useState(1.5) // Glass
    const [sourceX, setSourceX] = useState(200)
    const [sourceY, setSourceY] = useState(200) // Top half
    const [isDragging, setIsDragging] = useState(false)

    // Boundary is at height/2

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
            const centerY = height / 2
            const centerX = width / 2

            ctx.clearRect(0, 0, width, height)

            // Draw Media Backgrounds
            // Top: n1
            ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + (n1 - 1) * 0.1})`
            ctx.fillRect(0, 0, width, centerY)

            // Bottom: n2
            ctx.fillStyle = `rgba(100, 200, 255, ${0.05 + (n2 - 1) * 0.1})`
            ctx.fillRect(0, centerY, width, height / 2)

            // Draw Boundary
            ctx.beginPath()
            ctx.moveTo(0, centerY)
            ctx.lineTo(width, centerY)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.lineWidth = 1
            ctx.stroke()

            // Normal Line
            ctx.beginPath()
            ctx.moveTo(centerX, centerY - 200)
            ctx.lineTo(centerX, centerY + 200)
            ctx.setLineDash([5, 5])
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.stroke()
            ctx.setLineDash([])

            // Ray Tracing
            // Incident Ray: Source -> Center
            const dx = centerX - sourceX
            const dy = centerY - sourceY
            const angleInc = Math.atan2(dx, -dy) // Angle from vertical normal

            // Check if source is below boundary? Assumed above for now.
            // If sourceY > centerY, swap n1/n2 logic visually?
            // Let's enforce top source for simplicity or handle both.
            // Handle simple top source.

            // Incident Ray
            ctx.beginPath()
            ctx.moveTo(sourceX, sourceY)
            ctx.lineTo(centerX, centerY)
            ctx.strokeStyle = '#ef4444' // Red Laser
            ctx.lineWidth = 3
            ctx.stroke()

            // Refraction (Snell's Law)
            // n1 * sin(theta1) = n2 * sin(theta2)
            // theta1 is angleInc
            // theta2 = asin( (n1/n2) * sin(theta1) )

            // Incident angle relative to Normal (Vertical)
            // angleInc is correct.
            // Ensure positive/negative sign handling.

            const sinTheta1 = Math.sin(angleInc)
            let sinTheta2 = (n1 / n2) * sinTheta1

            // Critical Angle Check
            let tir = false
            if (Math.abs(sinTheta2) > 1.0) {
                tir = true
            }

            // Refracted Ray
            if (!tir) {
                // const theta2 = Math.asin(sinTheta2)
                const rayLen = 500
                // const rayX = centerX + Math.sin(theta2) * rayLen * (dy > 0 ? -1 : 1)
                // Wait.
                // Standard: Source Top Left. dx > 0. angleInc > 0.
                // Refracted ray goes to Bottom Right.
                // x = +sin(theta2) * len
                // y = +cos(theta2) * len

                // Vector approach simpler.
                // Incident vector: (dx, dy). Normalized: (nx, ny).
                // Refracted vector?
                // Just use angles implies simple Geometry.

                const rTheta = Math.asin((n1 / n2) * Math.sin(Math.abs(angleInc)))

                // Strict vector algebra for rendering robustness
                // Or just trust the angles
                // Ray X direction depends on source position relative to center
                // If sourceX < centerX (left), ray goes right (positive X)
                const dirX = sourceX < centerX ? 1 : -1

                const endX = centerX + Math.sin(rTheta) * rayLen * dirX
                const endY = centerY + rayLen * Math.cos(rTheta)

                ctx.beginPath()
                ctx.moveTo(centerX, centerY)
                ctx.lineTo(endX, endY)

                ctx.beginPath()
                ctx.moveTo(centerX, centerY)
                // ctx.lineTo(endX, endY)

                // Let's use strict vector algebra for rendering robustness
                // Or just trust the angles
                ctx.lineTo(endX, endY)

                ctx.strokeStyle = '#ef4444' // Red Refracted
                ctx.globalAlpha = 0.6
                ctx.stroke()
                ctx.globalAlpha = 1.0
            }

            // Reflected Ray (Always exists)
            // theta_r = theta_i
            // Ray extending past
            const reflexRayLen = 500
            // Direction: same angle, opposite X side of normal
            const refTheta = Math.abs(angleInc)
            const refEndX = centerX + Math.sin(refTheta) * reflexRayLen * (sourceX < centerX ? 1 : -1)
            const refEndY = centerY - Math.cos(refTheta) * reflexRayLen

            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.lineTo(refEndX, refEndY)
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)' // Weak reflection
            if (tir) ctx.strokeStyle = '#ef4444' // Total Internal Reflection = Strong
            ctx.lineWidth = tir ? 3 : 1
            ctx.stroke()


            // Labels
            ctx.fillStyle = 'white'
            ctx.font = '12px sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText(`n1 = ${n1}`, 20, centerY - 20)
            ctx.fillText(`n2 = ${n2}`, 20, centerY + 20)

            const thetaDeg = (Math.abs(angleInc) * 180 / Math.PI).toFixed(1)
            ctx.fillText(`θ1 = ${thetaDeg}°`, centerX + 20, centerY - 40)

            if (!tir) {
                const theta2 = Math.asin((n1 / n2) * Math.sin(Math.abs(angleInc)))
                const theta2Deg = (theta2 * 180 / Math.PI).toFixed(1)
                ctx.fillText(`θ2 = ${theta2Deg}°`, centerX + 20, centerY + 40)
            } else {
                ctx.fillStyle = '#facc15'
                ctx.fillText('TOTAL INTERNAL REFLECTION', centerX + 20, centerY + 40)
            }


            // Draw Source Handle
            ctx.fillStyle = '#ef4444'
            ctx.beginPath(); ctx.arc(sourceX, sourceY, 8, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'white'; ctx.fillText('Source (Drag)', sourceX + 12, sourceY)

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [n1, n2, sourceX, sourceY])

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top

        if (Math.hypot(mx - sourceX, my - sourceY) < 30) {
            setIsDragging(true)
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top

        // Constrain to top half
        const constrainedY = Math.min(my, canvas.offsetHeight / 2 - 10)
        setSourceX(mx)
        setSourceY(constrainedY)
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
                        <h1 className="text-xl font-medium tracking-tight">Snell's Law</h1>
                        <p className="text-xs text-white/50">AP Physics 2: Optics</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative cursor-crosshair">
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
                        Light refracts when entering a new medium.
                        <br />
                        <b>n₁sin(θ₁) = n₂sin(θ₂)</b>
                        <br />
                        Total Internal Reflection occurs if θ₂ {'>'} 90°.
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Index n₁ (Top)</label>
                                <span className="text-xs font-mono text-white/60">{n1}</span>
                            </div>
                            <input
                                type="range" min="1.0" max="2.5" step="0.05" value={n1}
                                onChange={(e) => setN1(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                            <div className="flex justify-between text-xs text-white/40 mt-1">
                                <span>Air (1.0)</span>
                                <span>Diamond (2.4)</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Index n₂ (Bottom)</label>
                                <span className="text-xs font-mono text-white/60">{n2}</span>
                            </div>
                            <input
                                type="range" min="1.0" max="2.5" step="0.05" value={n2}
                                onChange={(e) => setN2(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                            <div className="flex justify-between text-xs text-white/40 mt-1">
                                <span>Water (1.33)</span>
                                <span>Glass (1.5)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
