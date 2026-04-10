import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
}

export default function Pressure() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [viewMode, setViewMode] = useState<string>('hydrostatic')
    const [fluidDensity, setFluidDensity] = useState(1000)
    const [gravity, setGravity] = useState(9.81)
    const [depth, setDepth] = useState(5)
    const [showAtmospheric, setShowAtmospheric] = useState(true)
    const [pistonRatio, setPistonRatio] = useState(4)
    const [appliedForce, setAppliedForce] = useState(100)
    const [showParticles, setShowParticles] = useState(true)
    const [paused, setPaused] = useState(false)
    const particlesRef = useRef<Particle[]>([])
    const timeRef = useRef(0)
    const initRef = useRef(false)

    // --- Mouse drag state ---
    const [dragging, setDragging] = useState<'depth' | 'piston' | null>(null)
    const [hovered, setHovered] = useState<'depth' | 'piston' | null>(null)
    // Store layout geometry so mouse handlers can reference it
    const layoutRef = useRef<{
        // hydrostatic
        containerX: number; containerW: number; surfaceY: number; containerBottom: number; maxDepth: number
        // pascal
        smallPistonRect: { x: number; y: number; w: number; h: number } | null
    }>({
        containerX: 0, containerW: 0, surfaceY: 0, containerBottom: 0, maxDepth: 10,
        smallPistonRect: null,
    })

    const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasPos(e)
        const lay = layoutRef.current
        if (viewMode === 'hydrostatic') {
            // Hit-test the depth gauge line area
            const fluidH = lay.containerBottom - lay.surfaceY
            const depthFrac = depth / lay.maxDepth
            const gaugeY = lay.surfaceY + depthFrac * fluidH
            if (x >= lay.containerX - 15 && x <= lay.containerX + lay.containerW + 25 && Math.abs(y - gaugeY) < 18) {
                setDragging('depth')
                e.preventDefault()
            }
        } else {
            // Hit-test the small piston in Pascal mode
            const pr = lay.smallPistonRect
            if (pr && x >= pr.x - 15 && x <= pr.x + pr.w + 15 && y >= pr.y - 30 && y <= pr.y + pr.h + 30) {
                setDragging('piston')
                e.preventDefault()
            }
        }
    }, [viewMode, depth, getCanvasPos])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasPos(e)
        const lay = layoutRef.current

        if (dragging === 'depth' && viewMode === 'hydrostatic') {
            const fluidH = lay.containerBottom - lay.surfaceY
            const frac = Math.max(0, Math.min(1, (y - lay.surfaceY) / fluidH))
            setDepth(Math.round(frac * lay.maxDepth * 10) / 10)
            return
        }
        if (dragging === 'piston' && viewMode === 'pascal') {
            // Map vertical mouse position to applied force (dragging lower = more force)
            const pr = lay.smallPistonRect
            if (pr) {
                // Use a reference band: 200px of vertical drag maps to 10-1000 N
                const baseline = pr.y
                const delta = Math.max(0, y - baseline)
                const force = Math.min(1000, Math.max(10, 10 + delta * 5))
                setAppliedForce(Math.round(force / 10) * 10)
            }
            return
        }

        // Hover detection
        if (viewMode === 'hydrostatic') {
            const fluidH = lay.containerBottom - lay.surfaceY
            const depthFrac = depth / lay.maxDepth
            const gaugeY = lay.surfaceY + depthFrac * fluidH
            if (x >= lay.containerX - 15 && x <= lay.containerX + lay.containerW + 25 && Math.abs(y - gaugeY) < 18) {
                setHovered('depth')
            } else {
                setHovered(null)
            }
        } else {
            const pr = lay.smallPistonRect
            if (pr && x >= pr.x - 15 && x <= pr.x + pr.w + 15 && y >= pr.y - 30 && y <= pr.y + pr.h + 30) {
                setHovered('piston')
            } else {
                setHovered(null)
            }
        }
    }, [dragging, viewMode, depth, getCanvasPos])

    const handleMouseUp = useCallback(() => {
        setDragging(null)
    }, [])

    const handleMouseLeave = useCallback(() => {
        setDragging(null)
        setHovered(null)
    }, [])

    const P_atm = showAtmospheric ? 101325 : 0
    const P_depth = fluidDensity * gravity * depth
    const P_total = P_atm + P_depth

    // Pascal's principle
    const A1 = 0.01 // small piston area m²
    const A2 = A1 * pistonRatio
    const P_pascal = appliedForce / A1
    const F2 = P_pascal * A2

    const reset = useCallback(() => {
        setViewMode('hydrostatic')
        setFluidDensity(1000)
        setGravity(9.81)
        setDepth(5)
        setShowAtmospheric(true)
        setPistonRatio(4)
        setAppliedForce(100)
        setShowParticles(true)
        setPaused(false)
        timeRef.current = 0
        initRef.current = false
    }, [])

    const demoSteps = [
        { title: 'Pressure and Depth', description: 'Pressure in a fluid increases with depth. The deeper you go, the more fluid is above you, and the greater the weight pressing down. This is why your ears pop when diving.', setup: () => { reset(); setDepth(3); setShowAtmospheric(false) } },
        { title: 'P = ρgh', description: 'Hydrostatic pressure equals fluid density (ρ) times gravitational acceleration (g) times depth (h). Double the depth → double the pressure. Try the depth slider.', setup: () => { setViewMode('hydrostatic'); setShowAtmospheric(false); setDepth(5) } },
        { title: 'Atmospheric Pressure', description: 'At the surface, atmospheric pressure (101,325 Pa = 1 atm) acts on the fluid. The total pressure at any depth is P₀ + ρgh. Toggle atmospheric pressure to see its contribution.', setup: () => { setShowAtmospheric(true); setDepth(5) } },
        { title: 'Pascal\'s Principle', description: 'Pascal\'s principle states that pressure applied to an enclosed fluid is transmitted equally to all parts of the fluid. This is the basis for hydraulic systems.', setup: () => { setViewMode('pascal'); setAppliedForce(100); setPistonRatio(4) } },
        { title: 'Hydraulic Press', description: 'A hydraulic press uses Pascal\'s principle to amplify force. F₁/A₁ = F₂/A₂, so a larger piston area produces a larger force. With ratio 4:1, 100 N input produces 400 N output!', setup: () => { setViewMode('pascal'); setAppliedForce(200); setPistonRatio(6) } },
        { title: 'Density Comparison', description: 'Different fluids have different densities. Water: 1000 kg/m³, oil: ~800 kg/m³, mercury: ~13,600 kg/m³. Higher density means more pressure at the same depth. Try adjusting density.', setup: () => { setViewMode('hydrostatic'); setFluidDensity(1000); setDepth(5); setShowAtmospheric(true) } },
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

        // Initialize particles
        if (!initRef.current) {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const pts: Particle[] = []
            for (let i = 0; i < 120; i++) {
                pts.push({
                    x: Math.random() * w * 0.5 + w * 0.15,
                    y: Math.random() * h * 0.55 + h * 0.35,
                    vx: (Math.random() - 0.5) * 30,
                    vy: (Math.random() - 0.5) * 20,
                })
            }
            particlesRef.current = pts
            initRef.current = true
        }

        let animId: number
        const dt = 0.016

        const draw = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            if (!paused) timeRef.current += dt

            if (viewMode === 'hydrostatic') {
                // --- HYDROSTATIC PRESSURE MODE ---
                const containerX = w * 0.15
                const containerW = w * 0.5
                const surfaceY = h * 0.25
                const containerBottom = h * 0.88
                const fluidH = containerBottom - surfaceY
                const maxDepth = 10 // meters mapped to container height

                // Store layout for mouse handlers
                layoutRef.current.containerX = containerX
                layoutRef.current.containerW = containerW
                layoutRef.current.surfaceY = surfaceY
                layoutRef.current.containerBottom = containerBottom
                layoutRef.current.maxDepth = maxDepth
                layoutRef.current.smallPistonRect = null

                // Container walls
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(containerX, surfaceY - 30)
                ctx.lineTo(containerX, containerBottom)
                ctx.lineTo(containerX + containerW, containerBottom)
                ctx.lineTo(containerX + containerW, surfaceY - 30)
                ctx.stroke()

                // Fluid with pressure gradient
                const numBands = 40
                for (let i = 0; i < numBands; i++) {
                    const frac = i / numBands
                    const bandY = surfaceY + frac * fluidH
                    const bandH = fluidH / numBands + 1
                    const pressureFrac = frac

                    // Blue → deeper blue/purple with depth
                    const r = Math.floor(30 + pressureFrac * 60)
                    const g = Math.floor(80 + pressureFrac * (-30))
                    const b = Math.floor(200 - pressureFrac * 50)
                    const a = 0.3 + pressureFrac * 0.35

                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
                    ctx.fillRect(containerX + 2, bandY, containerW - 4, bandH)
                }

                // Surface line
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(containerX, surfaceY)
                ctx.lineTo(containerX + containerW, surfaceY)
                ctx.stroke()

                ctx.fillStyle = 'rgba(100, 200, 255, 0.5)'
                ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('Surface (h = 0)', containerX + containerW / 2, surfaceY - 10)

                // Atmospheric pressure arrows at surface
                if (showAtmospheric) {
                    ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)'
                    ctx.lineWidth = 1.5
                    for (let i = 0; i < 5; i++) {
                        const ax = containerX + 30 + i * (containerW - 60) / 4
                        ctx.beginPath()
                        ctx.moveTo(ax, surfaceY - 30)
                        ctx.lineTo(ax, surfaceY - 5)
                        ctx.stroke()
                        // arrowhead
                        ctx.beginPath()
                        ctx.moveTo(ax, surfaceY - 5)
                        ctx.lineTo(ax - 4, surfaceY - 12)
                        ctx.lineTo(ax + 4, surfaceY - 12)
                        ctx.closePath()
                        ctx.fillStyle = 'rgba(255, 200, 100, 0.5)'
                        ctx.fill()
                    }
                    ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'
                    ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText('P₀ = 1 atm', containerX + containerW / 2, surfaceY - 35)
                }

                // Depth gauge line
                const depthFrac = depth / maxDepth
                const gaugeY = surfaceY + depthFrac * fluidH

                // Dashed depth line
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)'
                ctx.lineWidth = 1.5
                ctx.setLineDash([6, 4])
                ctx.beginPath()
                ctx.moveTo(containerX + 2, gaugeY)
                ctx.lineTo(containerX + containerW - 2, gaugeY)
                ctx.stroke()
                ctx.setLineDash([])

                // Depth label on right
                ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left'
                ctx.fillText(`h = ${depth.toFixed(1)} m`, containerX + containerW + 15, gaugeY + 4)

                // Depth arrow
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)'
                ctx.lineWidth = 1.5
                ctx.beginPath()
                ctx.moveTo(containerX + containerW + 8, surfaceY)
                ctx.lineTo(containerX + containerW + 8, gaugeY)
                ctx.stroke()
                // arrowheads
                ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
                ctx.beginPath()
                ctx.moveTo(containerX + containerW + 8, gaugeY)
                ctx.lineTo(containerX + containerW + 4, gaugeY - 6)
                ctx.lineTo(containerX + containerW + 12, gaugeY - 6)
                ctx.closePath(); ctx.fill()

                // Drag handle on depth gauge line
                const handleAlpha = dragging === 'depth' ? 1.0 : hovered === 'depth' ? 0.8 : 0.4
                const handleX = containerX + containerW / 2
                // Center grab dot
                ctx.fillStyle = `rgba(255, 100, 100, ${handleAlpha})`
                ctx.beginPath(); ctx.arc(handleX, gaugeY, 6, 0, Math.PI * 2); ctx.fill()
                // Up/down arrows
                ctx.strokeStyle = `rgba(255, 100, 100, ${handleAlpha})`
                ctx.lineWidth = 1.5
                // Up arrow
                ctx.beginPath()
                ctx.moveTo(handleX, gaugeY - 10)
                ctx.lineTo(handleX - 4, gaugeY - 6)
                ctx.moveTo(handleX, gaugeY - 10)
                ctx.lineTo(handleX + 4, gaugeY - 6)
                ctx.stroke()
                // Down arrow
                ctx.beginPath()
                ctx.moveTo(handleX, gaugeY + 10)
                ctx.lineTo(handleX - 4, gaugeY + 6)
                ctx.moveTo(handleX, gaugeY + 10)
                ctx.lineTo(handleX + 4, gaugeY + 6)
                ctx.stroke()
                // "drag" hint text
                if (hovered === 'depth' && dragging !== 'depth') {
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.6)'
                    ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText('drag to change depth', handleX, gaugeY - 16)
                }

                // Pressure arrows at depth (larger = more pressure)
                const numArrows = 7
                const arrowScale = Math.min(35, 5 + depthFrac * 30)
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
                ctx.lineWidth = 2
                for (let i = 0; i < numArrows; i++) {
                    const ax = containerX + 25 + i * (containerW - 50) / (numArrows - 1)
                    // Arrows pointing inward from all directions at that depth
                    // Left arrows
                    if (i === 0) {
                        ctx.beginPath()
                        ctx.moveTo(containerX - arrowScale, gaugeY)
                        ctx.lineTo(containerX + 5, gaugeY)
                        ctx.stroke()
                        ctx.beginPath()
                        ctx.moveTo(containerX + 5, gaugeY)
                        ctx.lineTo(containerX - 2, gaugeY - 4)
                        ctx.lineTo(containerX - 2, gaugeY + 4)
                        ctx.closePath()
                        ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'; ctx.fill()
                    }
                    // Downward arrows
                    ctx.beginPath()
                    ctx.moveTo(ax, gaugeY - arrowScale)
                    ctx.lineTo(ax, gaugeY - 3)
                    ctx.stroke()
                    ctx.beginPath()
                    ctx.moveTo(ax, gaugeY - 3)
                    ctx.lineTo(ax - 3, gaugeY - 9)
                    ctx.lineTo(ax + 3, gaugeY - 9)
                    ctx.closePath()
                    ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'; ctx.fill()
                }

                // Pressure gauge readout
                const gaugeBoxX = containerX + containerW * 0.15
                const gaugeBoxY = gaugeY + 15
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.fillRect(gaugeBoxX - 5, gaugeBoxY - 2, 220, 50)
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'
                ctx.lineWidth = 1
                ctx.strokeRect(gaugeBoxX - 5, gaugeBoxY - 2, 220, 50)

                ctx.fillStyle = 'rgba(160, 100, 255, 0.9)'
                ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left'
                const pDepth = fluidDensity * gravity * depth
                const pTotal = (showAtmospheric ? 101325 : 0) + pDepth
                ctx.fillText(`P = ${showAtmospheric ? 'P₀ + ' : ''}ρgh = ${(pTotal / 1000).toFixed(1)} kPa`, gaugeBoxX, gaugeBoxY + 14)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.font = '10px system-ui'
                if (showAtmospheric) {
                    ctx.fillText(`= ${(101325 / 1000).toFixed(1)} + ${(pDepth / 1000).toFixed(1)} kPa`, gaugeBoxX, gaugeBoxY + 30)
                } else {
                    ctx.fillText(`= ${fluidDensity} × ${gravity} × ${depth.toFixed(1)} = ${(pDepth / 1000).toFixed(1)} kPa`, gaugeBoxX, gaugeBoxY + 30)
                }
                ctx.fillText(`= ${(pTotal / 101325).toFixed(2)} atm`, gaugeBoxX, gaugeBoxY + 43)

                // Particles
                if (showParticles) {
                    const pts = particlesRef.current
                    if (!paused) {
                        pts.forEach(p => {
                            p.x += p.vx * dt
                            p.y += p.vy * dt

                            // Bounce off container walls
                            if (p.x < containerX + 5 || p.x > containerX + containerW - 5) p.vx *= -1
                            if (p.y < surfaceY + 2 || p.y > containerBottom - 3) p.vy *= -1

                            // Keep in bounds
                            p.x = Math.max(containerX + 5, Math.min(containerX + containerW - 5, p.x))
                            p.y = Math.max(surfaceY + 2, Math.min(containerBottom - 3, p.y))

                            // Add slight downward drift to simulate density
                            p.vy += (fluidDensity / 10000) * dt * 50
                            // Dampen
                            p.vx *= 0.999
                            p.vy *= 0.999
                        })
                    }

                    pts.forEach(p => {
                        const pFrac = (p.y - surfaceY) / fluidH
                        const alpha = 0.15 + pFrac * 0.3
                        ctx.fillStyle = `rgba(160, 200, 255, ${alpha})`
                        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill()
                    })
                }

                // Density label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                const fluidName = fluidDensity <= 900 ? 'Oil' : fluidDensity <= 1100 ? 'Water' : fluidDensity >= 13000 ? 'Mercury' : 'Dense Fluid'
                ctx.fillText(`ρ = ${fluidDensity} kg/m³ (${fluidName})`, containerX + containerW / 2, containerBottom + 20)

            } else {
                // --- PASCAL'S HYDRAULIC PRESS MODE ---
                layoutRef.current.smallPistonRect = null // will be set when piston is drawn
                const cx = w * 0.45
                const cy = h * 0.5

                // Tube system
                const tubeH = 180
                const smallR = 25
                const largeR = smallR * Math.sqrt(pistonRatio)
                const tubeSep = 200
                const tubeY = cy - tubeH / 2

                // Connecting tube at bottom
                const bottomY = cy + tubeH / 2
                ctx.fillStyle = 'rgba(40, 60, 140, 0.3)'

                // Small chamber
                ctx.fillRect(cx - tubeSep / 2 - smallR, tubeY, smallR * 2, tubeH)
                // Large chamber
                ctx.fillRect(cx + tubeSep / 2 - largeR, tubeY, largeR * 2, tubeH)
                // Connecting horizontal tube
                ctx.fillRect(cx - tubeSep / 2 - smallR, bottomY - 20, tubeSep + smallR + largeR, 20)

                // Tube outlines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.lineWidth = 2
                // Small tube
                ctx.strokeRect(cx - tubeSep / 2 - smallR, tubeY, smallR * 2, tubeH)
                // Large tube
                ctx.strokeRect(cx + tubeSep / 2 - largeR, tubeY, largeR * 2, tubeH)
                // Bottom connector
                ctx.beginPath()
                ctx.moveTo(cx - tubeSep / 2 - smallR, bottomY)
                ctx.lineTo(cx - tubeSep / 2 - smallR, bottomY)
                ctx.lineTo(cx + tubeSep / 2 + largeR, bottomY)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(cx - tubeSep / 2 - smallR, bottomY - 20)
                ctx.lineTo(cx + tubeSep / 2 + largeR, bottomY - 20)
                ctx.stroke()

                // Fluid fill (animated level)
                const fluidLevel = Math.sin(timeRef.current * 0.5) * 5
                const smallFluidTop = tubeY + 40 + fluidLevel
                const largeFluidTop = tubeY + 40 - fluidLevel / pistonRatio

                // Small chamber fluid
                const sGrad = ctx.createLinearGradient(0, smallFluidTop, 0, bottomY)
                sGrad.addColorStop(0, 'rgba(60, 100, 200, 0.5)')
                sGrad.addColorStop(1, 'rgba(40, 60, 160, 0.7)')
                ctx.fillStyle = sGrad
                ctx.fillRect(cx - tubeSep / 2 - smallR + 2, smallFluidTop, smallR * 2 - 4, bottomY - smallFluidTop)

                // Large chamber fluid
                const lGrad = ctx.createLinearGradient(0, largeFluidTop, 0, bottomY)
                lGrad.addColorStop(0, 'rgba(60, 100, 200, 0.5)')
                lGrad.addColorStop(1, 'rgba(40, 60, 160, 0.7)')
                ctx.fillStyle = lGrad
                ctx.fillRect(cx + tubeSep / 2 - largeR + 2, largeFluidTop, largeR * 2 - 4, bottomY - largeFluidTop)

                // Small piston
                const pistonX = cx - tubeSep / 2 - smallR + 3
                const pistonY = smallFluidTop - 12
                const pistonW = smallR * 2 - 6
                const pistonH = 12
                layoutRef.current.smallPistonRect = { x: pistonX, y: pistonY, w: pistonW, h: pistonH }

                const pistonAlpha = dragging === 'piston' ? 1.0 : hovered === 'piston' ? 0.9 : 0.8
                ctx.fillStyle = `rgba(180, 180, 200, ${pistonAlpha})`
                ctx.fillRect(pistonX, pistonY, pistonW, pistonH)
                ctx.strokeStyle = dragging === 'piston' ? 'rgba(255, 180, 80, 0.9)' : hovered === 'piston' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)'
                ctx.lineWidth = dragging === 'piston' || hovered === 'piston' ? 2.5 : 1.5
                ctx.strokeRect(pistonX, pistonY, pistonW, pistonH)

                // Drag affordance on small piston
                const pistonHandleAlpha = dragging === 'piston' ? 0.9 : hovered === 'piston' ? 0.7 : 0.3
                ctx.fillStyle = `rgba(255, 180, 80, ${pistonHandleAlpha})`
                const pistonCx = pistonX + pistonW / 2
                const pistonCy = pistonY + pistonH / 2
                // Horizontal grip lines
                ctx.strokeStyle = `rgba(255, 255, 255, ${pistonHandleAlpha})`
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(pistonCx - 8, pistonCy - 2)
                ctx.lineTo(pistonCx + 8, pistonCy - 2)
                ctx.moveTo(pistonCx - 8, pistonCy + 2)
                ctx.lineTo(pistonCx + 8, pistonCy + 2)
                ctx.stroke()
                // Drag hint
                if (hovered === 'piston' && dragging !== 'piston') {
                    ctx.fillStyle = 'rgba(255, 180, 80, 0.7)'
                    ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText('drag down to apply force', pistonCx, pistonY - 18)
                }

                // Large piston
                ctx.fillStyle = 'rgba(180, 180, 200, 0.8)'
                ctx.fillRect(cx + tubeSep / 2 - largeR + 3, largeFluidTop - 12, largeR * 2 - 6, 12)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.strokeRect(cx + tubeSep / 2 - largeR + 3, largeFluidTop - 12, largeR * 2 - 6, 12)

                // Force arrow on small piston (downward)
                const smallCx = cx - tubeSep / 2
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)'
                ctx.lineWidth = 3
                const f1ArrowLen = Math.min(60, appliedForce * 0.3)
                ctx.beginPath()
                ctx.moveTo(smallCx, smallFluidTop - 50 - f1ArrowLen)
                ctx.lineTo(smallCx, smallFluidTop - 15)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                ctx.beginPath()
                ctx.moveTo(smallCx, smallFluidTop - 15)
                ctx.lineTo(smallCx - 6, smallFluidTop - 25)
                ctx.lineTo(smallCx + 6, smallFluidTop - 25)
                ctx.closePath(); ctx.fill()
                ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
                ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`F₁ = ${appliedForce} N`, smallCx, smallFluidTop - 55 - f1ArrowLen)

                // Force arrow on large piston (upward)
                const largeCx = cx + tubeSep / 2
                const curF2 = appliedForce * pistonRatio
                const f2ArrowLen = Math.min(80, curF2 * 0.08)
                ctx.strokeStyle = 'rgba(100, 255, 150, 0.8)'
                ctx.lineWidth = 4
                ctx.beginPath()
                ctx.moveTo(largeCx, largeFluidTop + 20 + f2ArrowLen)
                ctx.lineTo(largeCx, largeFluidTop - 15)
                ctx.stroke()
                ctx.fillStyle = 'rgba(100, 255, 150, 0.8)'
                ctx.beginPath()
                ctx.moveTo(largeCx, largeFluidTop - 15)
                ctx.lineTo(largeCx - 7, largeFluidTop - 5)
                ctx.lineTo(largeCx + 7, largeFluidTop - 5)
                ctx.closePath(); ctx.fill()
                ctx.fillStyle = 'rgba(100, 255, 150, 0.9)'
                ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`F₂ = ${curF2.toFixed(0)} N`, largeCx, largeFluidTop + 35 + f2ArrowLen)

                // Area labels
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.font = '11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(`A₁ = ${(A1 * 10000).toFixed(0)} cm²`, smallCx, bottomY + 30)
                ctx.fillText(`A₂ = ${(A2 * 10000).toFixed(0)} cm²`, largeCx, bottomY + 30)

                // Pressure equal label
                const curP = appliedForce / A1
                ctx.fillStyle = 'rgba(160, 100, 255, 0.8)'
                ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
                ctx.fillText('Pressure transmitted equally:', cx, tubeY - 40)
                ctx.fillText(`P = F₁/A₁ = F₂/A₂ = ${(curP / 1000).toFixed(1)} kPa`, cx, tubeY - 20)

                // Ratio highlight
                ctx.fillStyle = 'rgba(255, 220, 100, 0.7)'
                ctx.font = 'bold 14px system-ui'
                ctx.fillText(`Force multiplied ×${pistonRatio}`, cx, bottomY + 55)

                // Pressure transmission lines (animated)
                const numDots = 12
                ctx.fillStyle = 'rgba(160, 100, 255, 0.5)'
                for (let i = 0; i < numDots; i++) {
                    const frac = ((timeRef.current * 0.8 + i / numDots) % 1)
                    const startX = cx - tubeSep / 2
                    const endX = cx + tubeSep / 2
                    const dotX = startX + frac * (endX - startX)
                    const dotY = bottomY - 10
                    ctx.beginPath(); ctx.arc(dotX, dotY, 3, 0, Math.PI * 2); ctx.fill()
                }
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [viewMode, fluidDensity, gravity, depth, showAtmospheric, pistonRatio, appliedForce, showParticles, paused, A1, A2, dragging, hovered])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                        style={{ cursor: dragging ? 'grabbing' : hovered ? 'grab' : 'default' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 1" unit="Unit 8" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title={viewMode === 'hydrostatic' ? 'Hydrostatic Pressure' : 'Hydraulic Press'}
                            departmentColor="rgb(160, 100, 255)"
                            items={viewMode === 'hydrostatic' ? [
                                { label: 'P_total', value: (P_total / 1000).toFixed(1), unit: 'kPa', color: 'rgb(160, 100, 255)' },
                                { label: 'P_atm', value: showAtmospheric ? '101.3' : '0', unit: 'kPa', color: 'rgb(255, 200, 100)' },
                                { label: 'ρgh', value: (P_depth / 1000).toFixed(1), unit: 'kPa' },
                                { label: 'ρ', value: fluidDensity.toString(), unit: 'kg/m³' },
                                { label: 'h', value: depth.toFixed(1), unit: 'm', color: 'rgb(255, 100, 100)' },
                                { label: 'P (atm)', value: (P_total / 101325).toFixed(2), unit: 'atm' },
                            ] : [
                                { label: 'F₁', value: appliedForce.toFixed(0), unit: 'N', color: 'rgb(255, 100, 100)' },
                                { label: 'F₂', value: F2.toFixed(0), unit: 'N', color: 'rgb(100, 255, 150)' },
                                { label: 'A₂/A₁', value: pistonRatio.toFixed(0), unit: '×' },
                                { label: 'P', value: (P_pascal / 1000).toFixed(1), unit: 'kPa', color: 'rgb(160, 100, 255)' },
                                { label: 'Amplification', value: `×${pistonRatio}`, color: 'rgb(255, 220, 100)' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-[340px] max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={viewMode === 'hydrostatic' ? [
                                { label: 'Hydrostatic', expression: 'P = P₀ + ρgh', description: 'Pressure increases with depth' },
                                { label: 'Pressure', expression: 'P = F / A' },
                                { label: 'Density', expression: 'ρ = m / V' },
                            ] : [
                                { label: 'Pascal\'s Principle', expression: 'F₁/A₁ = F₂/A₂', description: 'Pressure transmitted equally' },
                                { label: 'Force amplification', expression: 'F₂ = F₁ × (A₂/A₁)' },
                                { label: 'Pressure', expression: 'P = F / A' },
                            ]}
                        />
                    </div>

                    <div className="absolute bottom-4 left-4">
                        <DemoMode
                            steps={demoSteps}
                            currentStep={demo.currentStep}
                            isOpen={demo.isOpen}
                            onClose={demo.close}
                            onNext={demo.next}
                            onPrev={demo.prev}
                            onGoToStep={demo.goToStep}
                            departmentColor="rgb(160, 100, 255)"
                        />
                    </div>
                </div>

                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ControlGroup label="Mode">
                            <ButtonGroup
                                value={viewMode}
                                onChange={setViewMode}
                                options={[
                                    { value: 'hydrostatic', label: 'Hydrostatic' },
                                    { value: 'pascal', label: 'Pascal\'s Press' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        {viewMode === 'hydrostatic' ? (
                            <>
                                <ControlGroup label="Fluid Density">
                                    <Slider value={fluidDensity} onChange={setFluidDensity} min={500} max={14000} step={100} label={`ρ = ${fluidDensity} kg/m³`} />
                                </ControlGroup>

                                <ControlGroup label="Depth">
                                    <Slider value={depth} onChange={setDepth} min={0} max={10} step={0.1} label={`h = ${depth.toFixed(1)} m`} />
                                </ControlGroup>

                                <ControlGroup label="Gravity">
                                    <Slider value={gravity} onChange={setGravity} min={1} max={25} step={0.1} label={`g = ${gravity.toFixed(1)} m/s²`} />
                                </ControlGroup>

                                <Toggle value={showAtmospheric} onChange={setShowAtmospheric} label="Include Atmospheric P" />
                                <Toggle value={showParticles} onChange={setShowParticles} label="Show Particles" />
                            </>
                        ) : (
                            <>
                                <ControlGroup label="Applied Force">
                                    <Slider value={appliedForce} onChange={setAppliedForce} min={10} max={1000} step={10} label={`F₁ = ${appliedForce} N`} />
                                </ControlGroup>

                                <ControlGroup label="Area Ratio (A₂/A₁)">
                                    <Slider value={pistonRatio} onChange={setPistonRatio} min={1} max={20} step={1} label={`A₂/A₁ = ${pistonRatio}×`} />
                                </ControlGroup>
                            </>
                        )}

                        <Toggle value={paused} onChange={setPaused} label="Pause Animation" />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
