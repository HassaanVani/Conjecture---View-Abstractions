import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'

const PC = 'rgb(160, 100, 255)'

export default function EnergyCoaster() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mass, setMass] = useState(60)
    const [gravity, setGravity] = useState(9.8)
    const [friction, setFriction] = useState(0)
    const [trackType, setTrackType] = useState('parabola')
    const [showGrid, setShowGrid] = useState(false)
    const [showBarChart, setShowBarChart] = useState(true)

    const stateRef = useRef({ x: 0, y: 0, vx: 0, energy: { pe: 0, ke: 0, total: 0, thermal: 0 } })
    const isDragging = useRef(false)

    const getTrackHeight = (x: number, w: number, h: number, type: string) => {
        const nx = (x - w / 2) / (w / 2.5)
        if (type === 'parabola') return h * 0.8 - (nx * nx) * (h * 0.6)
        if (type === 'sine') return h * 0.5 - Math.cos(nx * 3) * (h * 0.3)
        return h * 0.8
    }

    const getTrackSlope = (x: number, w: number, h: number, type: string) => {
        const d = 1
        return (getTrackHeight(x + d, w, h, type) - getTrackHeight(x - d, w, h, type)) / (2 * d)
    }

    const reset = useCallback(() => {
        setIsRunning(false)
        stateRef.current.vx = 0
        stateRef.current.energy.thermal = 0
    }, [])

    const demoSteps = [
        { title: 'Energy Conservation', description: 'Watch how potential and kinetic energy transform as a skater moves along a track. Total mechanical energy is conserved without friction.', highlight: 'Drag the skater to reposition.' },
        { title: 'Potential Energy', description: 'PE = mgh. The higher the skater, the more potential energy stored. At the peak, PE is maximum and KE is minimum.', setup: () => { setFriction(0); setTrackType('parabola'); setShowBarChart(true) } },
        { title: 'Kinetic Energy', description: 'KE = 1/2 mv\u00B2. At the bottom of the track, the skater is fastest. KE is maximum and PE is minimum.', highlight: 'Watch the energy bars trade off.' },
        { title: 'Work-Energy Theorem', description: 'The net work done on the skater equals the change in kinetic energy: W_net = \u0394KE.', setup: () => { setFriction(0) } },
        { title: 'Friction & Thermal Energy', description: 'With friction, some mechanical energy converts to thermal energy. Total energy is still conserved, but mechanical energy decreases over time.', setup: () => { setFriction(0.3) } },
        { title: 'Track Shapes', description: 'Try different track shapes. A W-track has multiple valleys. The physics is the same: energy conservation dictates the motion.', setup: () => { setTrackType('sine') } },
        { title: 'Mass Independence', description: 'The path of the skater does not depend on mass (without friction). Change mass and notice the speed stays the same.', setup: () => { setFriction(0); setMass(30) } },
        { title: 'Explore!', description: 'Adjust mass, gravity, friction, and track shape. Drag the skater to different heights and observe energy transformations.' },
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

        if (stateRef.current.x === 0) stateRef.current.x = canvas.offsetWidth * 0.2

        const handleMouseDown = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            const cx = e.clientX - rect.left
            const cy = e.clientY - rect.top
            const sx = stateRef.current.x
            const sy = getTrackHeight(sx, canvas.offsetWidth, canvas.offsetHeight, trackType)
            if (Math.sqrt((cx - sx) ** 2 + (cy - (canvas.offsetHeight - sy)) ** 2) < 30) {
                isDragging.current = true
                setIsRunning(false)
                stateRef.current.vx = 0
                stateRef.current.energy.thermal = 0
            }
        }
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging.current) {
                const rect = canvas.getBoundingClientRect()
                let mx = e.clientX - rect.left
                mx = Math.max(0, Math.min(canvas.offsetWidth, mx))
                stateRef.current.x = mx
            }
        }
        const handleMouseUp = () => {
            if (isDragging.current) { isDragging.current = false; if (!isRunning) setIsRunning(true) }
        }

        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        let animId: number
        const dt = 0.016

        const animate = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            if (isRunning && !isDragging.current) {
                const slope = getTrackSlope(stateRef.current.x, w, h, trackType)
                const angle = Math.atan(slope)
                const ax = (-gravity * Math.sin(angle)) * Math.cos(angle)
                stateRef.current.vx += ax * dt * 20
                if (friction > 0) {
                    const loss = friction * 0.05
                    stateRef.current.energy.thermal += 0.5 * mass * stateRef.current.vx ** 2 * loss / 400
                    stateRef.current.vx *= (1 - loss)
                }
                stateRef.current.x += stateRef.current.vx * dt
                if (stateRef.current.x < 0 || stateRef.current.x > w) {
                    stateRef.current.vx *= -1
                    stateRef.current.x = Math.max(0, Math.min(w, stateRef.current.x))
                }
            }

            const physY = getTrackHeight(stateRef.current.x, w, h, trackType)
            stateRef.current.y = physY
            const scale = 50
            const hMeters = physY / scale
            const pe = mass * gravity * hMeters
            const slope = getTrackSlope(stateRef.current.x, w, h, trackType)
            const angle = Math.atan(slope)
            const v = stateRef.current.vx / Math.cos(angle)
            const vReal = v / 20
            const ke = 0.5 * mass * vReal * vReal
            stateRef.current.energy = { pe, ke, total: pe + ke + stateRef.current.energy.thermal, thermal: stateRef.current.energy.thermal }

            ctx.clearRect(0, 0, w, h)

            if (showGrid) {
                ctx.strokeStyle = '#ffffff10'; ctx.lineWidth = 1; ctx.beginPath()
                for (let i = 0; i < w; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, h) }
                for (let i = 0; i < h; i += 50) { ctx.moveTo(0, i); ctx.lineTo(w, i) }
                ctx.stroke()
            }

            // Track fill
            ctx.beginPath(); ctx.moveTo(0, h)
            for (let x = 0; x <= w; x += 4) ctx.lineTo(x, h - getTrackHeight(x, w, h, trackType))
            ctx.lineTo(w, h); ctx.closePath()
            ctx.fillStyle = '#1e293b'; ctx.fill()

            // Track line
            ctx.beginPath()
            for (let x = 0; x <= w; x += 4) {
                const ty = h - getTrackHeight(x, w, h, trackType)
                x === 0 ? ctx.moveTo(x, ty) : ctx.lineTo(x, ty)
            }
            ctx.strokeStyle = PC; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke()

            // Skater
            const sx = stateRef.current.x
            const sy = h - stateRef.current.y
            ctx.save(); ctx.translate(sx, sy); ctx.rotate(-angle)
            ctx.beginPath(); ctx.arc(0, -12, 10, 0, Math.PI * 2)
            ctx.fillStyle = '#ec4899'; ctx.fill()
            ctx.fillStyle = '#fff'; ctx.fillRect(-14, 0, 28, 4)
            ctx.fillStyle = '#888'
            ctx.beginPath(); ctx.arc(-9, 5, 3, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.arc(9, 5, 3, 0, Math.PI * 2); ctx.fill()
            ctx.restore()

            // Energy bar chart overlay
            if (showBarChart) {
                const bx = 20, by = h - 180, bw = 130, bh = 150
                ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx - 5, by - 25, bw + 10, bh + 45)
                ctx.fillStyle = 'white'; ctx.font = '11px monospace'; ctx.textAlign = 'center'
                ctx.fillText('Energy', bx + bw / 2, by - 10)

                const total = stateRef.current.energy.total || 1
                const bars = [
                    { label: 'KE', val: ke, color: '#22c55e' },
                    { label: 'PE', val: pe, color: '#3b82f6' },
                    { label: 'Th', val: stateRef.current.energy.thermal, color: '#ef4444' },
                    { label: 'Tot', val: stateRef.current.energy.total, color: '#eab308' },
                ]
                const barW = 24, gap = 8
                bars.forEach((b, i) => {
                    const barH = Math.min(bh, (b.val / total) * bh)
                    const x = bx + i * (barW + gap)
                    ctx.fillStyle = b.color
                    ctx.fillRect(x, by + bh - barH, barW, barH)
                    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px monospace'
                    ctx.fillText(b.label, x + barW / 2, by + bh + 12)
                    ctx.fillStyle = b.color
                    ctx.fillText(b.val.toFixed(0), x + barW / 2, by + bh - barH - 4)
                })

                // W = delta KE annotation
                ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '9px monospace'; ctx.textAlign = 'left'
                ctx.fillText('W_net = \u0394KE', bx, by + bh + 30)
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
    }, [isRunning, mass, gravity, friction, trackType, showGrid, showBarChart])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Energy Skate Park</h1>
                        <p className="text-xs text-white/50">Conservation of Energy</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <APTag course="Physics 1" unit="Unit 4" color={PC} />
                    <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-[260px]">
                        <EquationDisplay departmentColor={PC} equations={[
                            { label: 'KE', expression: 'KE = \u00BDmv\u00B2' },
                            { label: 'PE', expression: 'PE = mgh' },
                            { label: 'Conservation', expression: 'KE\u2081 + PE\u2081 = KE\u2082 + PE\u2082 + W_f' },
                            { label: 'Work-Energy', expression: 'W_net = \u0394KE' },
                        ]} />
                    </div>

                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PC} title="Energy Data" items={[
                            { label: 'KE', value: stateRef.current.energy.ke, unit: 'J', color: '#22c55e' },
                            { label: 'PE', value: stateRef.current.energy.pe, unit: 'J', color: '#3b82f6' },
                            { label: 'Thermal', value: stateRef.current.energy.thermal, unit: 'J', color: '#ef4444' },
                            { label: 'Total E', value: stateRef.current.energy.total, unit: 'J', color: '#eab308' },
                            { label: 'Speed', value: Math.abs(stateRef.current.vx / 20), unit: 'm/s' },
                        ]} />
                    </div>

                    {demo.isOpen && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                            <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={PC} />
                        </div>
                    )}
                </div>

                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <Slider label={`Mass \u2014 ${mass} kg`} value={mass} onChange={setMass} min={20} max={100} step={1} />
                        <Slider label={`Friction \u2014 ${friction.toFixed(2)}`} value={friction} onChange={setFriction} min={0} max={1} step={0.05} />
                        <Slider label={`Gravity \u2014 ${gravity} m/s\u00B2`} value={gravity} onChange={setGravity} min={1} max={25} step={0.1} />
                        <ButtonGroup label="Track Shape" value={trackType} onChange={(v) => { setTrackType(v); reset() }} options={[
                            { value: 'parabola', label: 'U-Pipe' },
                            { value: 'sine', label: 'W-Track' },
                        ]} color={PC} />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={() => setIsRunning(!isRunning)} className="flex-1">
                            {isRunning ? 'Pause' : 'Start'}
                        </Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>

                    <Toggle label="Energy Bar Chart" value={showBarChart} onChange={setShowBarChart} />
                    <Toggle label="Show Grid" value={showGrid} onChange={setShowGrid} />
                </div>
            </div>
        </div>
    )
}
