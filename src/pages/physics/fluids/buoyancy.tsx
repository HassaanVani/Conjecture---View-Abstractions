import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function Buoyancy() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [fluidDensity, setFluidDensity] = useState(1000) // kg/m^3 (Water)
    const [blockDensity, setBlockDensity] = useState(500) // kg/m^3 (Wood-ish)
    // const [blockVolume, setBlockVolume] = useState(0.001) // Unused setter
    const blockVolume = 0.001
    // const [gravity, setGravity] = useState(9.8) // Unused setter
    const gravity = 9.8
    // const [showForces, setShowForces] = useState(true) // Unused setter
    const showForces = true

    const stateRef = useRef({
        y: 0, // Depth (0 is surface, positive is down)
        vy: 0,
        isDragging: false,
        dragOffsetY: 0
    })

    const reset = () => {
        stateRef.current.y = -0.2 // Start above water
        stateRef.current.vy = 0
        setIsRunning(false)
    }

    // Block dimensions in pixels
    // Let's say 1 meter = 400 pixels
    const scale = 400
    const blockSize = Math.pow(blockVolume, 1 / 3) * scale // Cube root for side length

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
            // const mx = e.clientX - rect.left
            const my = e.clientY - rect.top

            // const width = canvas.offsetWidth // Unused
            const height = canvas.offsetHeight
            // const cx = width / 2
            const waterLevel = height / 2

            const blockYPix = waterLevel + stateRef.current.y * scale
            // const blockXPix = cx - blockSize/2

            // Check collision with block
            // Simplified vertical check mostly
            const distY = Math.abs(my - blockYPix)

            if (distY < blockSize / 2 + 20) { // +20 margin
                stateRef.current.isDragging = true
                stateRef.current.dragOffsetY = my - blockYPix
                // Pause physics while dragging usually feels better
                // But we can also let velocities reset
                stateRef.current.vy = 0
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (stateRef.current.isDragging) {
                const rect = canvas.getBoundingClientRect()
                const my = e.clientY - rect.top

                const height = canvas.offsetHeight
                const waterLevel = height / 2

                // Update Y
                const newYPix = my - stateRef.current.dragOffsetY
                stateRef.current.y = (newYPix - waterLevel) / scale
                stateRef.current.vy = 0
            }
        }

        const handleMouseUp = () => {
            stateRef.current.isDragging = false
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
            const cy = height / 2 // Water Level

            // Physics Integation
            if (isRunning && !stateRef.current.isDragging) {
                // Determine displaced volume
                // Block side length in meters
                const L = Math.pow(blockVolume, 1 / 3)

                // y is center of block. 
                // Bottom of block = y + L/2
                // Top of block = y - L/2

                const top = stateRef.current.y - L / 2
                const bottom = stateRef.current.y + L / 2

                let submergedH = 0
                if (top >= 0) {
                    // Fully submerged
                    submergedH = L
                } else if (bottom <= 0) {
                    // Fully above
                    submergedH = 0
                } else {
                    // Partially
                    submergedH = bottom // Since surface is 0
                }

                // V_displaced
                const V_disp = submergedH * L * L

                // Forces
                // Fg = mg (down, positive)
                const mass = blockDensity * blockVolume
                const Fg = mass * gravity

                // Fb = rho_fluid * V_disp * g (up, negative)
                const Fb = fluidDensity * V_disp * gravity

                // Drag (damping)
                // Fd = -c * v
                // Fluid drag is higher than air drag
                let c = 0.1
                if (submergedH > 0) c += 2.0 * (submergedH / L) // More drag in water

                const Fd = -c * stateRef.current.vy

                const Fnet = Fg - Fb + Fd // Note: Fb is subtracted because it opposes gravity

                const acc = Fnet / mass

                stateRef.current.vy += acc * dt
                stateRef.current.y += stateRef.current.vy * dt
            }

            // Draw
            ctx.clearRect(0, 0, width, height)

            // Draw Water
            ctx.fillStyle = 'rgba(59, 130, 246, 0.2)' // Blue-500
            ctx.fillRect(0, cy, width, height / 2)

            // Water Surface Line
            ctx.beginPath()
            ctx.moveTo(0, cy)
            ctx.lineTo(width, cy)
            ctx.strokeStyle = '#60a5fa'
            ctx.lineWidth = 2
            ctx.stroke()

            // Draw Block
            const L_pix = Math.pow(blockVolume, 1 / 3) * scale
            const y_pix = cy + stateRef.current.y * scale

            ctx.fillStyle = '#f59e0b' // Amber (Wood-like?)
            // If density is high, maybe gray (metal)?
            if (blockDensity > 2000) ctx.fillStyle = '#9ca3af' // Gray

            ctx.save()
            ctx.translate(cx, y_pix)

            // Draw square centered
            ctx.fillRect(-L_pix / 2, -L_pix / 2, L_pix, L_pix)
            ctx.strokeStyle = 'white'
            ctx.strokeRect(-L_pix / 2, -L_pix / 2, L_pix, L_pix)

            // Draw Center of Mass Dot
            ctx.fillStyle = 'white'
            ctx.beginPath()
            ctx.arc(0, 0, 3, 0, Math.PI * 2)
            ctx.fill()

            // Forces
            if (showForces) {
                // Calculate forces for viz (re-calculate or store?)
                const L = Math.pow(blockVolume, 1 / 3)
                const mass = blockDensity * blockVolume
                const Fg = mass * gravity

                const top = stateRef.current.y - L / 2
                const bottom = stateRef.current.y + L / 2
                let submergedH = 0
                if (top >= 0) submergedH = L
                else if (bottom <= 0) submergedH = 0
                else submergedH = bottom
                const V_disp = submergedH * L * L
                const Fb = fluidDensity * V_disp * gravity

                // Scale factor for arrows
                const fScale = 2.0

                // Fg (Down)
                ctx.beginPath()
                ctx.moveTo(0, 0)
                ctx.lineTo(0, Fg * fScale)
                ctx.strokeStyle = '#ef4444' // Red
                ctx.lineWidth = 2
                ctx.stroke()
                // Arrowhead
                ctx.beginPath()
                ctx.moveTo(0, Fg * fScale)
                ctx.lineTo(-4, Fg * fScale - 6)
                ctx.lineTo(4, Fg * fScale - 6)
                ctx.fillStyle = '#ef4444'
                ctx.fill()

                // Fb (Up/Buoyancy) - Center of buoyancy is center of submerged part
                // Let's just draw from center for simplicity or offset slightly?
                // Realistically it acts on center of displaced volume.
                // Center of displaced volume y_cb = y + L/2 - submergedH/2
                const y_cb_offset = L / 2 - submergedH / 2

                if (Fb > 0.01) {
                    ctx.beginPath()
                    const startY = y_cb_offset * scale
                    ctx.moveTo(0, startY)
                    ctx.lineTo(0, startY - Fb * fScale)
                    ctx.strokeStyle = '#3b82f6' // Blue
                    ctx.lineWidth = 2
                    ctx.stroke()
                    // Arrowhead
                    ctx.beginPath()
                    ctx.moveTo(0, startY - Fb * fScale)
                    ctx.lineTo(-4, startY - Fb * fScale + 6)
                    ctx.lineTo(4, startY - Fb * fScale + 6)
                    ctx.fillStyle = '#3b82f6'
                    ctx.fill()
                }
            }

            ctx.restore()

            // Info Overlay
            ctx.fillStyle = 'white'
            ctx.font = '14px monospace'
            ctx.textAlign = 'left'
            ctx.fillText(`Fluid Density: ${fluidDensity} kg/m³`, 20, 30)
            ctx.fillText(`Block Density: ${blockDensity} kg/m³`, 20, 50)

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
    }, [isRunning, fluidDensity, blockDensity, blockVolume, gravity, showForces])


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
                        <h1 className="text-xl font-medium tracking-tight">Buoyancy Lab</h1>
                        <p className="text-xs text-white/50">AP Physics 2: Fluids</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div className="text-sm text-white/70 leading-relaxed">
                        Adjust densities to see if the block sinks or floats. Drag the block to submerge it manually.
                        <br /><br />
                        Archimedes Principle: <br />  F_b = ρ_fluid · V_disp · g
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div>
                        <label className="text-sm font-medium text-white/80 block mb-2">Simulation</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsRunning(!isRunning)}
                                className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${isRunning
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-green-500 text-white hover:bg-green-400'
                                    }`}
                            >
                                {isRunning ? 'Pause' : 'Start'}
                            </button>
                            <button
                                onClick={reset}
                                className="px-4 py-3 rounded-xl font-medium text-sm bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Fluid Density</label>
                                <span className="text-xs font-mono text-blue-400">{fluidDensity} kg/m³</span>
                            </div>
                            <input
                                type="range" min="100" max="2000" step="100" value={fluidDensity}
                                onChange={(e) => setFluidDensity(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-[10px] text-white/30 mt-1">
                                <span>Oil (800)</span>
                                <span>Water (1000)</span>
                                <span>Honey (1400)</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white/80">Block Density</label>
                                <span className="text-xs font-mono text-amber-400">{blockDensity} kg/m³</span>
                            </div>
                            <input
                                type="range" min="100" max="3000" step="100" value={blockDensity}
                                onChange={(e) => setBlockDensity(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="flex justify-between text-[10px] text-white/30 mt-1">
                                <span>Wood (500)</span>
                                <span>Brick (1900)</span>
                                <span>Alum (2700)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
