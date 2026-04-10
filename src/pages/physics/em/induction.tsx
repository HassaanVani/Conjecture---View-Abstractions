import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

type SimMode = 'rod' | 'eddy'

export default function Induction() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [simMode, setSimMode] = useState<string>('rod')
    const [bField, setBField] = useState(0.5) // Tesla
    const [rodVelocity, setRodVelocity] = useState(3) // m/s
    const [rodLength, setRodLength] = useState(0.4) // m
    const [resistance, setResistance] = useState(2) // Ohms
    const [showCurrent, setShowCurrent] = useState(true)
    const [showBrakeForce, setShowBrakeForce] = useState(true)
    const [showLenz, setShowLenz] = useState(true)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const rodPosRef = useRef(0.3)

    // --- Drag state for mouse interaction ---
    const [canvasCursor, setCanvasCursor] = useState('default')
    const draggingRef = useRef<'rod' | 'disk' | null>(null)
    const lastMouseXRef = useRef(0)
    const lastMouseTimeRef = useRef(0)
    const dragVelocitiesRef = useRef<number[]>([])
    // Store layout geometry so mouse handlers can use it
    const layoutRef = useRef({
        railTop: 0, railBot: 0, railLeft: 0, railRight: 0, railLen: 0,
        rodX: 0,
        diskCx: 0, diskCy: 0, diskR: 0,
    })

    const calcPhysics = useCallback(() => {
        const emf = bField * rodLength * rodVelocity
        const current = emf / resistance
        const brakeForce = bField * current * rodLength
        const power = current * current * resistance

        return { emf, current, brakeForce, power }
    }, [bField, rodVelocity, rodLength, resistance])

    const reset = useCallback(() => {
        setSimMode('rod')
        setBField(0.5)
        setRodVelocity(3)
        setRodLength(0.4)
        setResistance(2)
        setShowCurrent(true)
        setShowBrakeForce(true)
        setShowLenz(true)
        setPaused(false)
        timeRef.current = 0
        rodPosRef.current = 0.3
    }, [])

    // --- Mouse event handlers for canvas dragging ---
    const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasPos(e)
        const layout = layoutRef.current
        const mode = simMode as SimMode

        if (mode === 'rod') {
            // Hit-test rod: within 20px of rodX and within rail bounds
            if (Math.abs(pos.x - layout.rodX) < 20 &&
                pos.y > layout.railTop - 15 && pos.y < layout.railBot + 15) {
                draggingRef.current = 'rod'
                lastMouseXRef.current = pos.x
                lastMouseTimeRef.current = performance.now()
                dragVelocitiesRef.current = []
                setPaused(true)
                setCanvasCursor('grabbing')
            }
        } else if (mode === 'eddy') {
            // Hit-test disk: within disk radius from center
            const dx = pos.x - layout.diskCx
            const dy = pos.y - layout.diskCy
            if (Math.sqrt(dx * dx + dy * dy) < layout.diskR + 15) {
                draggingRef.current = 'disk'
                lastMouseXRef.current = pos.x
                lastMouseTimeRef.current = performance.now()
                dragVelocitiesRef.current = []
                setCanvasCursor('grabbing')
            }
        }
    }, [simMode, getCanvasPos])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasPos(e)
        const layout = layoutRef.current
        const mode = simMode as SimMode

        if (draggingRef.current === 'rod') {
            // Compute new rod position
            const newPosNorm = (pos.x - layout.railLeft) / layout.railLen
            const clamped = Math.max(0.05, Math.min(0.95, newPosNorm))
            rodPosRef.current = clamped

            // Compute velocity from drag speed
            const now = performance.now()
            const dt = (now - lastMouseTimeRef.current) / 1000
            if (dt > 0.001) {
                const dxPixels = pos.x - lastMouseXRef.current
                const dxMeters = dxPixels / layout.railLen // rough pixel-to-norm mapping
                const v = dxMeters / dt * 3 // scale factor for feel
                dragVelocitiesRef.current.push(v)
                if (dragVelocitiesRef.current.length > 5) dragVelocitiesRef.current.shift()
                // Average recent velocities for smoothness
                const avg = dragVelocitiesRef.current.reduce((a, b) => a + b, 0) / dragVelocitiesRef.current.length
                const clampedV = Math.max(0.5, Math.min(10, Math.abs(avg)))
                setRodVelocity(Math.round(clampedV * 2) / 2) // snap to 0.5 steps
            }
            lastMouseXRef.current = pos.x
            lastMouseTimeRef.current = now
            return
        }

        if (draggingRef.current === 'disk') {
            // Use horizontal drag speed to set disk speed
            const now = performance.now()
            const dt = (now - lastMouseTimeRef.current) / 1000
            if (dt > 0.001) {
                const dx = pos.x - lastMouseXRef.current
                const speed = Math.abs(dx / dt) * 0.02
                const clampedV = Math.max(0.5, Math.min(10, speed))
                setRodVelocity(Math.round(clampedV * 2) / 2)
            }
            lastMouseXRef.current = pos.x
            lastMouseTimeRef.current = now
            return
        }

        // Hover cursor logic
        if (mode === 'rod') {
            if (Math.abs(pos.x - layout.rodX) < 20 &&
                pos.y > layout.railTop - 15 && pos.y < layout.railBot + 15) {
                setCanvasCursor('grab')
            } else {
                setCanvasCursor('default')
            }
        } else if (mode === 'eddy') {
            const dx = pos.x - layout.diskCx
            const dy = pos.y - layout.diskCy
            if (Math.sqrt(dx * dx + dy * dy) < layout.diskR + 15) {
                setCanvasCursor('grab')
            } else {
                setCanvasCursor('default')
            }
        }
    }, [simMode, getCanvasPos])

    const handleMouseUp = useCallback(() => {
        if (draggingRef.current === 'rod') {
            // Keep the current velocity from dragging; unpause to let it continue
            setPaused(false)
        }
        if (draggingRef.current === 'disk') {
            // Disk keeps spinning at the set velocity
        }
        draggingRef.current = null
        setCanvasCursor('default')
    }, [])

    const handleMouseLeave = useCallback(() => {
        if (draggingRef.current) {
            draggingRef.current = null
            setPaused(false)
            setCanvasCursor('default')
        }
    }, [])

    const demoSteps = [
        { title: 'Motional EMF', description: 'When a conducting rod moves through a magnetic field, free charges in the rod experience a force (F = qv x B). This separates charges and creates a potential difference — the motional EMF.', setup: () => { reset() } },
        { title: 'EMF = BLv', description: 'The motional EMF equals the magnetic field strength times the rod length times the velocity. A faster rod or stronger field means more EMF. Watch the voltage change as you adjust parameters.', setup: () => { setBField(0.5); setRodVelocity(5); setRodLength(0.4) } },
        { title: 'Lenz\'s Law — Opposes Change', description: 'The induced current flows in a direction that opposes the change in flux that created it. As the rod moves right (increasing flux), current flows counterclockwise to create a field opposing the increase.', setup: () => { setShowLenz(true); setShowCurrent(true); setRodVelocity(4) } },
        { title: 'Braking Force', description: 'The induced current in the magnetic field creates a force on the rod (F = BIL) that opposes its motion. This is magnetic braking — no friction needed! F_brake = B^2*L^2*v/R.', setup: () => { setShowBrakeForce(true); setBField(0.8); setRodVelocity(5) } },
        { title: 'Eddy Currents', description: 'When a conducting sheet moves through a non-uniform B-field, circular current loops (eddy currents) form within the conductor. These currents create forces that oppose the motion.', setup: () => { setSimMode('eddy'); setBField(0.6) } },
        { title: 'Magnetic Braking', description: 'Eddy current braking is used in roller coasters, trains, and lab balances. The braking force increases with speed — faster motion means more flux change, more current, more opposing force.', setup: () => { setSimMode('eddy'); setBField(0.8); setRodVelocity(6) } },
        { title: 'Energy Conservation — KE to Heat', description: 'The kinetic energy lost by the braking rod is converted to heat via I^2*R in the resistance. P = F*v = B^2*L^2*v^2/R. Energy is conserved — mechanical energy becomes thermal energy.', setup: () => { setSimMode('rod'); setBField(0.5); setRodVelocity(4); setResistance(1) } },
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

        let animId: number

        const draw = () => {
            if (!paused) timeRef.current += 0.016
            const t = timeRef.current
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const mode = simMode as SimMode

            if (mode === 'rod') {
                // Rails
                const railTop = h * 0.25
                const railBot = h * 0.75
                const railLeft = w * 0.12
                const railRight = w * 0.82
                const railLen = railRight - railLeft

                // Store layout for mouse handlers
                layoutRef.current.railTop = railTop
                layoutRef.current.railBot = railBot
                layoutRef.current.railLeft = railLeft
                layoutRef.current.railRight = railRight
                layoutRef.current.railLen = railLen

                // B-field crosses (into page)
                ctx.fillStyle = 'rgba(160, 100, 255, 0.2)'
                ctx.font = '16px system-ui'
                ctx.textAlign = 'center'
                for (let bx = railLeft + 20; bx < railRight; bx += 40) {
                    for (let by = railTop + 20; by < railBot; by += 40) {
                        ctx.fillText('\u00d7', bx, by + 5)
                    }
                }
                // B label
                ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'
                ctx.font = 'bold 13px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(`B = ${bField.toFixed(1)} T (into page)`, railLeft, railTop - 15)

                // Draw rails
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'
                ctx.lineWidth = 3
                // Top rail
                ctx.beginPath(); ctx.moveTo(railLeft, railTop); ctx.lineTo(railRight, railTop); ctx.stroke()
                // Bottom rail
                ctx.beginPath(); ctx.moveTo(railLeft, railBot); ctx.lineTo(railRight, railBot); ctx.stroke()
                // Left connector (resistor)
                ctx.beginPath(); ctx.moveTo(railLeft, railTop); ctx.lineTo(railLeft, railBot); ctx.stroke()

                // Resistor symbol on left connector
                const rMid = (railTop + railBot) / 2
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.7)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(railLeft, rMid - 30)
                for (let i = 0; i < 6; i++) {
                    const yy = rMid - 30 + i * 10
                    ctx.lineTo(railLeft + (i % 2 === 0 ? 10 : -10), yy + 5)
                }
                ctx.lineTo(railLeft, rMid + 30)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(`R = ${resistance} ohm`, railLeft + 15, rMid + 5)

                // Moving rod
                if (!paused) {
                    rodPosRef.current += rodVelocity * 0.003
                    if (rodPosRef.current > 0.85) rodPosRef.current = 0.15
                }
                const rodX = railLeft + rodPosRef.current * railLen
                layoutRef.current.rodX = rodX

                // Rod glow
                const rodGlow = ctx.createLinearGradient(rodX - 8, 0, rodX + 8, 0)
                rodGlow.addColorStop(0, 'transparent')
                rodGlow.addColorStop(0.5, 'rgba(100, 200, 255, 0.15)')
                rodGlow.addColorStop(1, 'transparent')
                ctx.fillStyle = rodGlow
                ctx.fillRect(rodX - 8, railTop, 16, railBot - railTop)

                // Rod
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.9)'
                ctx.lineWidth = 4
                ctx.beginPath()
                ctx.moveTo(rodX, railTop)
                ctx.lineTo(rodX, railBot)
                ctx.stroke()

                // Grab handles on rod (dots at top and bottom)
                const handleR = draggingRef.current === 'rod' ? 7 : 5
                const handleAlpha = draggingRef.current === 'rod' ? 1.0 : 0.6
                ctx.fillStyle = `rgba(100, 200, 255, ${handleAlpha})`
                ctx.beginPath()
                ctx.arc(rodX, railTop, handleR, 0, Math.PI * 2)
                ctx.fill()
                ctx.beginPath()
                ctx.arc(rodX, railBot, handleR, 0, Math.PI * 2)
                ctx.fill()
                // Center handle
                ctx.beginPath()
                ctx.arc(rodX, (railTop + railBot) / 2, handleR - 1, 0, Math.PI * 2)
                ctx.fill()
                // Subtle grab affordance ring
                if (draggingRef.current !== 'rod') {
                    ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)'
                    ctx.lineWidth = 1
                    ctx.setLineDash([3, 3])
                    ctx.beginPath()
                    ctx.arc(rodX, (railTop + railBot) / 2, 18, 0, Math.PI * 2)
                    ctx.stroke()
                    ctx.setLineDash([])
                } else {
                    // Active drag glow
                    ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.arc(rodX, (railTop + railBot) / 2, 22, 0, Math.PI * 2)
                    ctx.stroke()
                }

                // Rod velocity arrow
                const vArrowLen = Math.min(60, rodVelocity * 12)
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(rodX, railTop - 8)
                ctx.lineTo(rodX + vArrowLen, railTop - 8)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 220, 100, 0.8)'
                ctx.beginPath()
                ctx.moveTo(rodX + vArrowLen, railTop - 8)
                ctx.lineTo(rodX + vArrowLen - 7, railTop - 13)
                ctx.lineTo(rodX + vArrowLen - 7, railTop - 3)
                ctx.closePath()
                ctx.fill()
                ctx.fillStyle = 'rgba(255, 220, 100, 0.7)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`v = ${rodVelocity.toFixed(1)} m/s`, rodX + vArrowLen / 2, railTop - 18)

                // Braking force arrow (opposing motion)
                if (showBrakeForce) {
                    const physics = calcPhysics()
                    const fArrowLen = Math.min(50, physics.brakeForce * 200)
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)'
                    ctx.lineWidth = 2.5
                    ctx.beginPath()
                    ctx.moveTo(rodX, (railTop + railBot) / 2)
                    ctx.lineTo(rodX - fArrowLen, (railTop + railBot) / 2)
                    ctx.stroke()
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                    ctx.beginPath()
                    ctx.moveTo(rodX - fArrowLen, (railTop + railBot) / 2)
                    ctx.lineTo(rodX - fArrowLen + 7, (railTop + railBot) / 2 - 4)
                    ctx.lineTo(rodX - fArrowLen + 7, (railTop + railBot) / 2 + 4)
                    ctx.closePath()
                    ctx.fill()
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
                    ctx.font = 'bold 11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`F_brake = ${physics.brakeForce.toFixed(3)} N`, rodX - fArrowLen / 2, (railTop + railBot) / 2 - 12)
                }

                // Current flow arrows
                if (showCurrent) {
                    const physics = calcPhysics()
                    const currentAlpha = Math.min(0.9, physics.current * 0.5 + 0.2)

                    // Current direction: counterclockwise (Lenz's law, flux increasing)
                    // Rod: bottom to top (positive charges pushed up by F = qv x B)
                    // Top rail: rod to left
                    // Left connector: top to bottom
                    // Bottom rail: left to rod
                    ctx.strokeStyle = `rgba(100, 255, 150, ${currentAlpha})`
                    ctx.lineWidth = 2
                    ctx.setLineDash([8, 4])

                    const animOffset = t * 40 // scrolling dash

                    // On rod (bottom to top)
                    ctx.lineDashOffset = -animOffset
                    ctx.beginPath(); ctx.moveTo(rodX, railBot - 5); ctx.lineTo(rodX, railTop + 5); ctx.stroke()

                    // Top rail (rod to left)
                    ctx.lineDashOffset = -animOffset
                    ctx.beginPath(); ctx.moveTo(rodX - 5, railTop); ctx.lineTo(railLeft + 5, railTop); ctx.stroke()

                    // Left side (top to bottom)
                    ctx.lineDashOffset = -animOffset
                    ctx.beginPath(); ctx.moveTo(railLeft, railTop + 5); ctx.lineTo(railLeft, railBot - 5); ctx.stroke()

                    // Bottom rail (left to rod)
                    ctx.lineDashOffset = -animOffset
                    ctx.beginPath(); ctx.moveTo(railLeft + 5, railBot); ctx.lineTo(rodX - 5, railBot); ctx.stroke()

                    ctx.setLineDash([])
                    ctx.lineDashOffset = 0

                    // Current label
                    ctx.fillStyle = `rgba(100, 255, 150, ${currentAlpha})`
                    ctx.font = 'bold 11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(`I = ${physics.current.toFixed(2)} A`, (railLeft + rodX) / 2, railBot + 25)

                    // Lenz's law indicator
                    if (showLenz) {
                        // Show flux change arrow
                        ctx.fillStyle = 'rgba(160, 100, 255, 0.5)'
                        ctx.font = '11px system-ui'
                        ctx.textAlign = 'center'
                        ctx.fillText('Flux increasing (area grows)', (railLeft + rodX) / 2, railBot + 45)
                        ctx.fillText('Induced B opposes: out of page (O)', (railLeft + rodX) / 2, railBot + 60)

                        // Small circles showing induced B direction inside loop
                        ctx.strokeStyle = 'rgba(100, 255, 150, 0.3)'
                        ctx.lineWidth = 1
                        const loopCx = (railLeft + rodX) / 2
                        const loopCy = (railTop + railBot) / 2
                        ctx.beginPath()
                        ctx.arc(loopCx, loopCy, 8, 0, Math.PI * 2)
                        ctx.stroke()
                        // Dot in center (out of page)
                        ctx.fillStyle = 'rgba(100, 255, 150, 0.5)'
                        ctx.beginPath()
                        ctx.arc(loopCx, loopCy, 3, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }

                // EMF label on rod
                const physics = calcPhysics()
                ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
                ctx.font = 'bold 12px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(`EMF = ${physics.emf.toFixed(2)} V`, rodX + 10, (railTop + railBot) / 2 - 20)

                // Rod length label
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'
                ctx.lineWidth = 1
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(rodX + 15, railTop)
                ctx.lineTo(rodX + 15, railBot)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(255,255,255,0.4)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'left'
                ctx.fillText(`L = ${rodLength.toFixed(2)} m`, rodX + 20, (railTop + railBot) / 2)

            } else {
                // EDDY CURRENTS MODE
                const diskCx = w * 0.45
                const diskCy = h * 0.5
                const diskR = Math.min(w, h) * 0.25

                // Store layout for mouse handlers
                layoutRef.current.diskCx = diskCx
                layoutRef.current.diskCy = diskCy
                layoutRef.current.diskR = diskR

                // Magnetic field region (right half)
                const bRegionLeft = w * 0.45
                const bRegionRight = w * 0.85
                const bRegionTop = h * 0.15
                const bRegionBot = h * 0.85

                // B-field region background
                ctx.fillStyle = 'rgba(160, 100, 255, 0.05)'
                ctx.fillRect(bRegionLeft, bRegionTop, bRegionRight - bRegionLeft, bRegionBot - bRegionTop)
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.3)'
                ctx.lineWidth = 2
                ctx.setLineDash([6, 4])
                ctx.strokeRect(bRegionLeft, bRegionTop, bRegionRight - bRegionLeft, bRegionBot - bRegionTop)
                ctx.setLineDash([])

                // B-field crosses inside region
                ctx.fillStyle = 'rgba(160, 100, 255, 0.25)'
                ctx.font = '14px system-ui'
                ctx.textAlign = 'center'
                for (let bx = bRegionLeft + 25; bx < bRegionRight; bx += 35) {
                    for (let by = bRegionTop + 25; by < bRegionBot; by += 35) {
                        ctx.fillText('\u00d7', bx, by + 5)
                    }
                }
                ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'
                ctx.font = 'bold 12px system-ui'
                ctx.fillText(`B = ${bField.toFixed(1)} T region`, (bRegionLeft + bRegionRight) / 2, bRegionTop - 8)

                // Spinning conducting disk
                const diskAngle = t * rodVelocity * 0.5
                // Disk outline
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(diskCx, diskCy, diskR, 0, Math.PI * 2)
                ctx.stroke()
                ctx.fillStyle = 'rgba(200, 200, 200, 0.05)'
                ctx.fill()

                // Center axle
                ctx.fillStyle = 'rgba(200, 200, 200, 0.6)'
                ctx.beginPath()
                ctx.arc(diskCx, diskCy, 6, 0, Math.PI * 2)
                ctx.fill()

                // Drag affordance for disk
                if (draggingRef.current === 'disk') {
                    ctx.strokeStyle = 'rgba(255, 220, 100, 0.5)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.arc(diskCx, diskCy, diskR + 5, 0, Math.PI * 2)
                    ctx.stroke()
                    // "Drag to spin" label
                    ctx.fillStyle = 'rgba(255, 220, 100, 0.7)'
                    ctx.font = '10px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('dragging...', diskCx, diskCy + diskR + 35)
                } else {
                    ctx.strokeStyle = 'rgba(200, 200, 200, 0.15)'
                    ctx.lineWidth = 1
                    ctx.setLineDash([4, 4])
                    ctx.beginPath()
                    ctx.arc(diskCx, diskCy, diskR + 5, 0, Math.PI * 2)
                    ctx.stroke()
                    ctx.setLineDash([])
                    ctx.fillStyle = 'rgba(200, 200, 200, 0.25)'
                    ctx.font = '10px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('drag to spin', diskCx, diskCy + diskR + 35)
                }

                // Rotation spokes
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.15)'
                ctx.lineWidth = 1
                for (let s = 0; s < 8; s++) {
                    const sa = diskAngle + (s * Math.PI) / 4
                    ctx.beginPath()
                    ctx.moveTo(diskCx, diskCy)
                    ctx.lineTo(diskCx + diskR * 0.9 * Math.cos(sa), diskCy + diskR * 0.9 * Math.sin(sa))
                    ctx.stroke()
                }

                // Rotation arrow
                ctx.strokeStyle = 'rgba(255, 220, 100, 0.6)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(diskCx, diskCy, diskR + 15, -0.5, 0.8)
                ctx.stroke()
                ctx.fillStyle = 'rgba(255, 220, 100, 0.6)'
                const arrAngle = 0.8
                const arrX = diskCx + (diskR + 15) * Math.cos(arrAngle)
                const arrY = diskCy + (diskR + 15) * Math.sin(arrAngle)
                ctx.beginPath()
                ctx.moveTo(arrX, arrY)
                ctx.lineTo(arrX - 8, arrY - 6)
                ctx.lineTo(arrX - 2, arrY + 6)
                ctx.closePath()
                ctx.fill()
                ctx.fillStyle = 'rgba(255, 220, 100, 0.6)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('rotation', diskCx, diskCy - diskR - 25)

                // Eddy current loops at the boundary of B-field
                if (showCurrent) {
                    const eddyCx = bRegionLeft
                    const eddyCy = diskCy
                    const eddyR = diskR * 0.4
                    const pulse = 0.4 + 0.3 * Math.sin(t * 4)

                    // Multiple eddy loops
                    for (let ey = -1; ey <= 1; ey++) {
                        const loopY = eddyCy + ey * eddyR * 1.2
                        ctx.strokeStyle = `rgba(100, 255, 150, ${pulse})`
                        ctx.lineWidth = 2
                        ctx.beginPath()
                        ctx.ellipse(eddyCx, loopY, eddyR * 0.8, eddyR * 0.5, 0, 0, Math.PI * 2)
                        ctx.stroke()

                        // Current direction arrows on loops
                        const arrowAngles = [0, Math.PI]
                        for (const aa of arrowAngles) {
                            const apx = eddyCx + eddyR * 0.8 * Math.cos(aa)
                            const apy = loopY + eddyR * 0.5 * Math.sin(aa)
                            const tangent = aa + Math.PI / 2
                            ctx.fillStyle = `rgba(100, 255, 150, ${pulse})`
                            ctx.beginPath()
                            ctx.moveTo(apx, apy)
                            ctx.lineTo(apx - 5 * Math.cos(tangent - 0.5), apy - 5 * Math.sin(tangent - 0.5))
                            ctx.lineTo(apx - 5 * Math.cos(tangent + 0.5), apy - 5 * Math.sin(tangent + 0.5))
                            ctx.closePath()
                            ctx.fill()
                        }
                    }

                    ctx.fillStyle = 'rgba(100, 255, 150, 0.6)'
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('Eddy currents', eddyCx, eddyCy + eddyR * 2.2)
                }

                // Braking force
                if (showBrakeForce) {
                    const fLen = Math.min(50, bField * rodVelocity * 15)
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)'
                    ctx.lineWidth = 2.5
                    // Force opposing rotation tangentially at boundary
                    const forceX = bRegionLeft
                    const forceY = diskCy - diskR * 0.5
                    ctx.beginPath()
                    ctx.moveTo(forceX, forceY)
                    ctx.lineTo(forceX - fLen, forceY - fLen * 0.3)
                    ctx.stroke()
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                    const fex = forceX - fLen
                    const fey = forceY - fLen * 0.3
                    const fa = Math.atan2(-fLen * 0.3, -fLen)
                    ctx.beginPath()
                    ctx.moveTo(fex, fey)
                    ctx.lineTo(fex - 6 * Math.cos(fa - 0.5), fey - 6 * Math.sin(fa - 0.5))
                    ctx.lineTo(fex - 6 * Math.cos(fa + 0.5), fey - 6 * Math.sin(fa + 0.5))
                    ctx.closePath()
                    ctx.fill()
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
                    ctx.font = 'bold 11px system-ui'
                    ctx.textAlign = 'right'
                    ctx.fillText('F_brake (opposes rotation)', forceX - fLen - 5, forceY - fLen * 0.3 - 8)
                }

                // Lenz's law label
                if (showLenz) {
                    ctx.fillStyle = 'rgba(255, 200, 100, 0.5)'
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('Entering B region: eddy currents oppose flux increase', w * 0.5, h - 35)
                    ctx.fillText('Lenz\'s Law: induced effects always oppose the change', w * 0.5, h - 20)
                }
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [simMode, bField, rodVelocity, rodLength, resistance, showCurrent, showBrakeForce, showLenz, paused])

    const physics = calcPhysics()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                        style={{ cursor: canvasCursor }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics C: E&M" unit="Unit 4" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Induction Analysis"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'Induced EMF', value: physics.emf.toFixed(3), unit: 'V', color: 'rgb(100, 200, 255)' },
                                { label: 'Current I', value: physics.current.toFixed(3), unit: 'A', color: 'rgb(100, 255, 150)' },
                                { label: 'F_brake', value: physics.brakeForce.toFixed(4), unit: 'N', color: 'rgb(255, 100, 100)' },
                                { label: 'Rod velocity', value: rodVelocity.toFixed(1), unit: 'm/s' },
                                { label: 'Power (I^2R)', value: physics.power.toFixed(4), unit: 'W', color: 'rgb(255, 200, 100)' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Motional EMF', expression: 'EMF = BLv', description: 'Rod in uniform B-field' },
                                { label: 'Current', expression: 'I = EMF / R' },
                                { label: 'Brake Force', expression: 'F = BIL = B^2*L^2*v/R', description: 'Opposes motion' },
                                { label: 'Power', expression: 'P = I^2*R = F*v', description: 'KE converted to heat' },
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
                        <ControlGroup label="Simulation Mode">
                            <ButtonGroup
                                value={simMode}
                                onChange={setSimMode}
                                options={[
                                    { value: 'rod', label: 'Sliding Rod' },
                                    { value: 'eddy', label: 'Eddy Currents' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="B-Field Strength">
                            <Slider value={bField} onChange={setBField} min={0.1} max={2.0} step={0.1} label={`B = ${bField.toFixed(1)} T`} />
                        </ControlGroup>

                        <ControlGroup label={simMode === 'rod' ? 'Rod Velocity' : 'Disk Speed'}>
                            <Slider value={rodVelocity} onChange={setRodVelocity} min={0.5} max={10} step={0.5} label={`v = ${rodVelocity.toFixed(1)} m/s`} />
                        </ControlGroup>

                        {simMode === 'rod' && (
                            <>
                                <ControlGroup label="Rod Length">
                                    <Slider value={rodLength} onChange={setRodLength} min={0.1} max={1.0} step={0.05} label={`L = ${rodLength.toFixed(2)} m`} />
                                </ControlGroup>

                                <ControlGroup label="Circuit Resistance">
                                    <Slider value={resistance} onChange={setResistance} min={0.5} max={10} step={0.5} label={`R = ${resistance.toFixed(1)} ohm`} />
                                </ControlGroup>
                            </>
                        )}

                        <Toggle value={showCurrent} onChange={setShowCurrent} label="Show Current Direction" />
                        <Toggle value={showBrakeForce} onChange={setShowBrakeForce} label="Show Braking Force" />
                        <Toggle value={showLenz} onChange={setShowLenz} label="Show Lenz's Law" />
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
