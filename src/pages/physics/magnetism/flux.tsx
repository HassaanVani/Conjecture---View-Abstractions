import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function FaradayFlux() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [loopX, setLoopX] = useState(150) // Center Position
    // const [velocity, setVelocity] = useState(0) // Derived from drag or auto?
    const [isDragging, setIsDragging] = useState(false)
    const [autoMove, setAutoMove] = useState(false)

    // Physics State
    const lastX = useRef(150)
    const lastTime = useRef(0)
    const historyRef = useRef<{ t: number, phi: number, emf: number }[]>([])

    // Constants
    const loopW = 100
    const loopH = 100
    const fieldStartX = 400
    const fieldEndX = 700
    const B = 1.0 // Tesla

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

        lastTime.current = performance.now()

        const animate = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTime.current) / 1000, 0.05)
            lastTime.current = now

            const width = canvas.offsetWidth
            const height = canvas.offsetHeight
            const cy = height / 3

            // Auto Move Logic
            if (autoMove && !isDragging) {
                // Move back and forth through field
                const speed = 100 // px/s
                // const limitL = 100
                // const limitR = width - 100

                // Simple harmonic or constant speed bounce?
                // Let's do simple bounce for constant v -> constant EMF pulses
                // Need direction state?
                // Let's just use sine wave for smooth changing flux?
                // Or just manual control is best.
                // Let's implement simple constant velocity scan.

                let nextX = loopX + speed * dt
                if (nextX > width - 50) setAutoMove(false) // Stop at end
                else setLoopX(nextX)
            }

            // Calculate Flux
            // Area overlap with field
            const left = loopX - loopW / 2
            const right = loopX + loopW / 2

            // Field Region: [fieldStartX, fieldEndX]
            // Intersection
            const overlapL = Math.max(left, fieldStartX)
            const overlapR = Math.min(right, fieldEndX)

            let overlapW = 0
            if (overlapR > overlapL) overlapW = overlapR - overlapL

            const Area = (overlapW * loopH) / 10000 // scale? just use pixels
            const Flux = B * Area

            // Calculate EMF = -dPhi/dt
            // dPhi = B * dArea
            // v = dx/dt
            // If entering (right moving): dArea = +v * H * dt
            // If leaving: dArea = -v * H * dt

            // Numerical derivative
            const dPhi = Flux - (historyRef.current.length > 0 ? historyRef.current[historyRef.current.length - 1].phi : Flux)
            // No, dt is frame time.
            // Better: use current velocity.

            // Velocity calculation
            // const currentV = (loopX - lastX.current) / dt
            lastX.current = loopX

            // Theoretical EMF
            // EMF = - B * L * v (entering/leaving)
            // Check edges
            // let activeL = 0 
            // If left edge is cutting field boundary?
            // Entering: Right edge crosses StartX.
            // Leaving: Left edge crosses EndX.
            // Actually simply: EMF = - (Phi_new - Phi_old)/dt

            const emf = -(dPhi / dt) // Volts (scaled)

            // Record
            historyRef.current.push({ t: now, phi: Flux, emf: emf })
            if (historyRef.current.length > 300) historyRef.current.shift()


            // DRAWING
            ctx.clearRect(0, 0, width, height)

            // Draw B-Field Region
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
            ctx.fillRect(fieldStartX, cy - 150, fieldEndX - fieldStartX, 300)
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'
            ctx.strokeRect(fieldStartX, cy - 150, fieldEndX - fieldStartX, 300)

            // Draw Field Vectors (X for into page)
            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.font = '16px sans-serif'
            for (let x = fieldStartX + 20; x < fieldEndX; x += 40) {
                for (let y = cy - 130; y < cy + 150; y += 40) {
                    ctx.fillText('×', x, y)
                }
            }
            ctx.fillStyle = '#3b82f6'
            ctx.fillText('B-Field (Into Page)', (fieldStartX + fieldEndX) / 2, cy - 170)


            // Draw Loop
            ctx.strokeStyle = '#facc15' // Yellow conductor
            ctx.lineWidth = 4
            ctx.strokeRect(left, cy - loopH / 2, loopW, loopH)

            // Draw Current Direction (Lenz's Law)
            // Induced I proportional to EMF
            if (Math.abs(emf) > 100) { // Threshold
                const ccw = dPhi > 0
                // Wait, CCW opposes B_in? Yes. Right hand rule.

                ctx.fillStyle = '#ef4444'
                // Arrow logic...
                // Draw arrow on top segment
                ctx.beginPath()
                if (ccw) {
                    // CCW: Top moves Left
                    ctx.moveTo(loopX + 10, cy - loopH / 2); ctx.lineTo(loopX - 10, cy - loopH / 2)
                    // Arrowhead
                    ctx.lineTo(loopX - 5, cy - loopH / 2 - 5)
                } else {
                    // CW: Top moves Right
                    ctx.moveTo(loopX - 10, cy - loopH / 2); ctx.lineTo(loopX + 10, cy - loopH / 2)
                    // Arrowhead
                    ctx.lineTo(loopX + 5, cy - loopH / 2 - 5)
                }
                ctx.stroke()
                ctx.fillText(ccw ? 'CCW' : 'CW', loopX, cy - loopH / 2 - 15)
            }

            // Draw Loop Handle/Body
            ctx.fillStyle = 'white' // Handle
            ctx.beginPath(); ctx.arc(loopX, cy, 5, 0, Math.PI * 2); ctx.fill()


            // Graphs
            const graphH = 100
            const graphW = width - 100
            const gx = 50

            // Flux Graph
            const gy1 = height - 180
            ctx.strokeStyle = '#60a5fa'
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(gx, gy1); ctx.lineTo(gx, gy1 - graphH); ctx.stroke() // Y
            ctx.beginPath(); ctx.moveTo(gx, gy1); ctx.lineTo(gx + graphW, gy1); ctx.stroke() // X

            if (historyRef.current.length > 1) {
                const tMax = now
                const tMin = tMax - 5000 // 5 seconds window

                ctx.beginPath()
                ctx.strokeStyle = '#60a5fa' // Flux Blue
                ctx.lineWidth = 2
                historyRef.current.forEach((pt, i) => {
                    if (pt.t < tMin) return
                    const x = gx + ((pt.t - tMin) / 5000) * graphW
                    const y = gy1 - (pt.phi / 50000) * graphH // Scale
                    if (i === 0 || historyRef.current[i - 1].t < tMin) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                })
                ctx.stroke()
                ctx.fillStyle = '#60a5fa'; ctx.fillText('Magnetic Flux (Φ)', gx + 20, gy1 - graphH + 20)
            }

            // EMF Graph
            const gy2 = height - 40
            ctx.strokeStyle = '#ef4444'
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(gx, gy2 - graphH / 2); ctx.lineTo(gx + graphW, gy2 - graphH / 2); ctx.stroke() // X (center zero)

            if (historyRef.current.length > 1) {
                const tMax = now
                const tMin = tMax - 5000

                ctx.beginPath()
                ctx.strokeStyle = '#ef4444' // EMF Red
                ctx.lineWidth = 2
                historyRef.current.forEach((pt, i) => {
                    if (pt.t < tMin) return
                    const x = gx + ((pt.t - tMin) / 5000) * graphW
                    const y = (gy2 - graphH / 2) - (pt.emf / 2000) * (graphH / 2) // Scale
                    if (i === 0 || historyRef.current[i - 1].t < tMin) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                })
                ctx.stroke()
                ctx.fillStyle = '#ef4444'; ctx.fillText('Induced EMF (ε)', gx + 20, gy2 - graphH + 20)
            }

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [loopX, autoMove, isDragging]) // Only specific deps needs restart? 
    // Actually animate loop uses refs mostly, so it's fine.

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const cy = canvas.offsetHeight / 3

        // Loop hit test
        if (Math.abs(mx - loopX) < 60 && Math.abs(my - cy) < 60) {
            setIsDragging(true)
            setAutoMove(false)
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        setLoopX(mx)
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
                        <h1 className="text-xl font-medium tracking-tight">Faraday's Law</h1>
                        <p className="text-xs text-white/50">AP Physics 2: Magnetism</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative cursor-grab active:cursor-grabbing">
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
                        Move the coil through the magnetic field to induce EMF.
                        <br />
                        <b>Φ = B · A</b> (Flux)
                        <br />
                        <b>ε = -dΦ/dt</b> (Faraday's Law)
                        <br />
                        Lenz's Law: Induced current opposes the change in flux.
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <button
                        onClick={() => {
                            setAutoMove(true)
                            setLoopX(100)
                        }}
                        className="w-full py-3 mb-2 rounded-xl font-medium text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all border border-blue-500/30"
                    >
                        Auto Scan
                    </button>

                    <button
                        onClick={() => {
                            setLoopX(150)
                            setAutoMove(false)
                        }}
                        className="w-full py-3 rounded-xl font-medium text-sm bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                    >
                        Reset Position
                    </button>
                </div>
            </div>
        </div>
    )
}
