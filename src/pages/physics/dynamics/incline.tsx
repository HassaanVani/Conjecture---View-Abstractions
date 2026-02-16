import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'

const PC = 'rgb(160, 100, 255)'

export default function InclinePlane() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [angle, setAngle] = useState(30)
    const [mass, setMass] = useState(5)
    const [muS, setMuS] = useState(0.5)
    const [muK, setMuK] = useState(0.3)
    const [gravity, setGravity] = useState(9.8)
    const [showFBD, setShowFBD] = useState(true)
    const [showComponents, setShowComponents] = useState(true)

    const stateRef = useRef({ t: 0, pos: 0, vel: 0, acc: 0, isMoving: false })

    const reset = useCallback(() => {
        setIsRunning(false)
        stateRef.current = { t: 0, pos: 0, vel: 0, acc: 0, isMoving: false }
    }, [])

    useEffect(() => { if (!isRunning) reset() }, [angle, mass, muS, muK, gravity, isRunning, reset])

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

    const demoSteps = [
        { title: 'Welcome', description: 'This simulation models a block on an inclined plane with friction. You control the angle, mass, and friction coefficients.', highlight: 'Adjust parameters on the left panel.' },
        { title: 'Gravity Components', description: 'Weight (mg) decomposes into two components: mg sin(theta) parallel to the incline and mg cos(theta) perpendicular to it.', setup: () => { setAngle(30); setShowFBD(true); setShowComponents(true) } },
        { title: 'Normal Force', description: 'The normal force equals mg cos(theta). It pushes the block away from the surface and determines friction magnitude.', highlight: 'Green arrow on the FBD.' },
        { title: 'Static Friction', description: 'Static friction can hold the block in place up to fs_max = mu_s * Fn. If mg sin(theta) exceeds this, the block slides.', setup: () => { setAngle(15); setMuS(0.5) } },
        { title: 'Kinetic Friction', description: 'Once sliding, kinetic friction fk = mu_k * Fn opposes motion. Since mu_k < mu_s, the block accelerates once it starts moving.', setup: () => { setAngle(35); setMuK(0.3) } },
        { title: 'Critical Angle', description: 'The critical angle where the block just starts to slide is theta_c = arctan(mu_s). Try adjusting mu_s and the angle to find it.', setup: () => { setAngle(Math.round(Math.atan(0.5) * 180 / Math.PI)); setMuS(0.5) } },
        { title: 'Net Force & Acceleration', description: 'When the block slides, Fnet = mg sin(theta) - mu_k * mg cos(theta). The acceleration a = g(sin(theta) - mu_k cos(theta)).', setup: () => { setAngle(40); setIsRunning(false) } },
        { title: 'Try It!', description: 'Release the block and watch it accelerate. Change the angle to see how steeper inclines increase acceleration. Toggle the FBD overlay to study forces.' },
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
        const dt = 0.016
        const rad = angle * Math.PI / 180
        const fg = mass * gravity
        const fgx = fg * Math.sin(rad)
        const fgy = fg * Math.cos(rad)
        const fn = fgy
        const fsMax = muS * fn
        const fk = muK * fn

        const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, color: string, label: string) => {
            const headlen = 10
            const dx = toX - fromX
            const dy = toY - fromY
            const a = Math.atan2(dy, dx)
            ctx.strokeStyle = color
            ctx.lineWidth = 2.5
            ctx.beginPath()
            ctx.moveTo(fromX, fromY)
            ctx.lineTo(toX, toY)
            ctx.stroke()
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.moveTo(toX, toY)
            ctx.lineTo(toX - headlen * Math.cos(a - Math.PI / 6), toY - headlen * Math.sin(a - Math.PI / 6))
            ctx.lineTo(toX - headlen * Math.cos(a + Math.PI / 6), toY - headlen * Math.sin(a + Math.PI / 6))
            ctx.fill()
            ctx.fillStyle = color
            ctx.font = 'bold 11px monospace'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, toX + 6, toY - 2)
        }

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            if (isRunning) {
                if (!stateRef.current.isMoving) {
                    if (fgx > fsMax) stateRef.current.isMoving = true
                    else { stateRef.current.acc = 0; stateRef.current.vel = 0 }
                }
                if (stateRef.current.isMoving) {
                    const a = (fgx - fk) / mass
                    stateRef.current.acc = a
                    stateRef.current.vel += a * dt
                    stateRef.current.pos += stateRef.current.vel * dt
                    stateRef.current.t += dt
                }
            }

            ctx.clearRect(0, 0, width, height)

            const baseLength = width * 0.55
            const wedgeX = width * 0.15
            const wedgeY = height * 0.85
            const p1 = { x: wedgeX, y: wedgeY }
            const p2 = { x: wedgeX + baseLength, y: wedgeY }
            const pHigh = { x: wedgeX + baseLength, y: wedgeY - baseLength * Math.tan(rad) }

            // Ramp
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.lineTo(pHigh.x, pHigh.y)
            ctx.closePath()
            const grad = ctx.createLinearGradient(p1.x, p1.y, pHigh.x, pHigh.y)
            grad.addColorStop(0, '#1e293b')
            grad.addColorStop(1, '#334155')
            ctx.fillStyle = grad
            ctx.fill()
            ctx.strokeStyle = '#64748b'
            ctx.lineWidth = 1.5
            ctx.stroke()

            // Angle arc
            ctx.beginPath()
            ctx.arc(p1.x, p1.y, 40, -rad, 0)
            ctx.strokeStyle = 'rgba(160,100,255,0.6)'
            ctx.lineWidth = 1.5
            ctx.stroke()
            ctx.fillStyle = PC
            ctx.font = '13px monospace'
            ctx.textAlign = 'left'
            ctx.fillText(`${angle}\u00B0`, p1.x + 46, p1.y - 8)

            // Block position
            const hyp = Math.sqrt((pHigh.x - p1.x) ** 2 + (pHigh.y - p1.y) ** 2)
            let curPos = Math.min(stateRef.current.pos, hyp)
            const dx = (p1.x - pHigh.x) / hyp
            const dy = (p1.y - pHigh.y) / hyp
            const slopeX = pHigh.x + dx * curPos
            const slopeY = pHigh.y + dy * curPos
            const blockW = 44
            const blockH = 44
            const bx = slopeX + blockH / 2 * Math.sin(rad)
            const by = slopeY - blockH / 2 * Math.cos(rad)

            ctx.save()
            ctx.translate(bx, by)
            ctx.rotate(-rad)
            ctx.fillStyle = 'rgba(160,100,255,0.85)'
            ctx.shadowColor = PC
            ctx.shadowBlur = 12
            ctx.fillRect(-blockW / 2, -blockH / 2, blockW, blockH)
            ctx.shadowBlur = 0
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'
            ctx.strokeRect(-blockW / 2, -blockH / 2, blockW, blockH)
            ctx.fillStyle = 'white'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.font = 'bold 12px monospace'
            ctx.fillText(`${mass}kg`, 0, 0)
            ctx.restore()

            // FBD overlay
            if (showFBD) {
                const vs = 2.2
                drawArrow(bx, by, bx, by + fg * vs, '#ef4444', 'mg')
                const nx = Math.sin(rad) * fn * vs
                const ny = -Math.cos(rad) * fn * vs
                drawArrow(bx, by, bx + nx, by + ny, '#22c55e', 'Fn')
                const fVal = stateRef.current.isMoving ? fk : Math.min(fgx, fsMax)
                const frx = Math.cos(rad) * fVal * vs
                const fry = -Math.sin(rad) * fVal * vs
                drawArrow(bx, by, bx + frx, by + fry, '#eab308', 'f')

                if (showComponents) {
                    ctx.setLineDash([4, 4])
                    drawArrow(bx, by, bx - Math.cos(rad) * fgx * vs, by - (-Math.sin(rad)) * fgx * vs, '#f87171', 'mg sin\u03B8')
                    const pnx = Math.sin(rad) * fgy * vs
                    const pny = -Math.cos(rad) * fgy * vs
                    drawArrow(bx, by, bx - pnx, by - pny, '#f87171', 'mg cos\u03B8')
                    ctx.setLineDash([])
                }
            }

            // Ground line
            ctx.strokeStyle = '#475569'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(0, wedgeY)
            ctx.lineTo(width, wedgeY)
            ctx.stroke()

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [angle, mass, muS, muK, gravity, isRunning, showFBD, showComponents])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Incline Plane</h1>
                        <p className="text-xs text-white/50">Dynamics &mdash; Forces on a Ramp</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <APTag course="Physics 1" unit="Unit 2" color={PC} />
                    <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-[260px]">
                        <EquationDisplay departmentColor={PC} equations={[
                            { label: 'Weight', expression: 'Fg = mg', description: `= ${fg.toFixed(1)} N` },
                            { label: 'Parallel', expression: 'Fg\u2225 = mg sin \u03B8', description: `= ${fgx.toFixed(1)} N` },
                            { label: 'Normal', expression: 'Fn = mg cos \u03B8', description: `= ${fn.toFixed(1)} N` },
                            { label: 'Friction', expression: 'f = \u03BC Fn', description: willSlide ? `fk = ${fk.toFixed(1)} N` : `fs \u2264 ${fsMax.toFixed(1)} N` },
                            { label: 'Net', expression: 'Fnet = mg sin\u03B8 \u2212 \u03BCk mg cos\u03B8', description: `= ${netForce.toFixed(1)} N` },
                        ]} />
                    </div>

                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PC} title="Forces & Motion" items={[
                            { label: 'Fg', value: fg, unit: 'N' },
                            { label: 'Fg\u2225', value: fgx, unit: 'N' },
                            { label: 'Fn', value: fn, unit: 'N', color: '#22c55e' },
                            { label: 'fs max', value: fsMax, unit: 'N', color: '#eab308' },
                            { label: 'fk', value: fk, unit: 'N', color: '#eab308' },
                            { label: 'Net Force', value: netForce, unit: 'N', color: PC },
                            { label: 'Acceleration', value: accel, unit: 'm/s\u00B2', color: '#38bdf8' },
                            { label: 'Velocity', value: stateRef.current.vel, unit: 'm/s' },
                            { label: 'Will Slide?', value: willSlide ? 'Yes' : 'No' },
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
                        <Slider label={`Angle (\u03B8) \u2014 ${angle}\u00B0`} value={angle} onChange={setAngle} min={0} max={60} step={1} />
                        <Slider label={`Mass \u2014 ${mass} kg`} value={mass} onChange={setMass} min={1} max={50} step={1} />
                        <Slider label={`Gravity \u2014 ${gravity} m/s\u00B2`} value={gravity} onChange={setGravity} min={1} max={25} step={0.1} />
                    </ControlPanel>

                    <ControlPanel>
                        <Slider label={`\u03BCs (static) \u2014 ${muS}`} value={muS} onChange={setMuS} min={0} max={1} step={0.05} />
                        <Slider label={`\u03BCk (kinetic) \u2014 ${muK}`} value={muK} onChange={(v) => setMuK(Math.min(v, muS))} min={0} max={1} step={0.05} />
                        {muK > muS && <p className="text-[10px] text-red-400">\u03BCk should be \u2264 \u03BCs</p>}
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={() => isRunning ? reset() : setIsRunning(true)} className="flex-1">
                            {isRunning ? 'Reset' : !willSlide ? 'Stuck (Friction)' : 'Release Block'}
                        </Button>
                    </div>
                    {!willSlide && !isRunning && <p className="text-center text-xs text-yellow-500/80">Block will not slide (Fg\u2225 \u2264 fs,max)</p>}

                    <Toggle label="Free Body Diagram" value={showFBD} onChange={setShowFBD} />
                    <Toggle label="Gravity Components" value={showComponents} onChange={setShowComponents} />
                </div>
            </div>
        </div>
    )
}
