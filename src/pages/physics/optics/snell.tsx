import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, ControlGroup, Slider, Button, Select, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

const PHYSICS_COLOR = 'rgb(160, 100, 255)'

const MATERIAL_PRESETS = [
    { value: 'custom', label: 'Custom' },
    { value: 'air-glass', label: 'Air -> Glass (1.0 / 1.5)' },
    { value: 'air-water', label: 'Air -> Water (1.0 / 1.33)' },
    { value: 'air-diamond', label: 'Air -> Diamond (1.0 / 2.42)' },
    { value: 'water-glass', label: 'Water -> Glass (1.33 / 1.5)' },
    { value: 'glass-air', label: 'Glass -> Air (1.5 / 1.0)' },
    { value: 'water-air', label: 'Water -> Air (1.33 / 1.0)' },
    { value: 'diamond-air', label: 'Diamond -> Air (2.42 / 1.0)' },
]

export default function SnellsLaw() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [n1, setN1] = useState(1.0)
    const [n2, setN2] = useState(1.5)
    const [sourceX, setSourceX] = useState(250)
    const [sourceY, setSourceY] = useState(150)
    const [isDragging, setIsDragging] = useState(false)
    const [preset, setPreset] = useState('air-glass')
    const [showCritical, setShowCritical] = useState(true)
    const [animateTIR, setAnimateTIR] = useState(false)
    const animAngleRef = useRef(0)

    useEffect(() => {
        const p: Record<string, [number, number]> = {
            'air-glass': [1.0, 1.5],
            'air-water': [1.0, 1.33],
            'air-diamond': [1.0, 2.42],
            'water-glass': [1.33, 1.5],
            'glass-air': [1.5, 1.0],
            'water-air': [1.33, 1.0],
            'diamond-air': [2.42, 1.0],
        }
        if (p[preset]) { setN1(p[preset][0]); setN2(p[preset][1]) }
    }, [preset])

    useEffect(() => {
        if (!animateTIR) return
        const canvas = canvasRef.current
        if (!canvas) return
        const centerX = canvas.offsetWidth / 2
        const centerY = canvas.offsetHeight / 2
        let angle = 0
        const interval = setInterval(() => {
            angle += 0.01
            if (angle > 1.4) { setAnimateTIR(false); return }
            const sx = centerX - Math.sin(angle) * (centerY - 30)
            const sy = 30
            setSourceX(sx)
            setSourceY(sy)
        }, 30)
        return () => clearInterval(interval)
    }, [animateTIR])

    const criticalAngle = n1 > n2 ? Math.asin(n2 / n1) : null

    const demoSteps: DemoStep[] = [
        { title: 'Snell\'s Law', description: 'When light crosses a boundary between media, it bends. n1*sin(theta1) = n2*sin(theta2).', highlight: 'Drag the light source to change the angle of incidence.' },
        { title: 'Refraction Basics', description: 'Light slows in denser media (higher n). It bends toward the normal when entering denser medium.', setup: () => { setPreset('air-glass'); setSourceX(250); setSourceY(100) } },
        { title: 'Material Presets', description: 'Different materials have different indices: air (1.0), water (1.33), glass (1.5), diamond (2.42).', setup: () => { setPreset('air-diamond') }, highlight: 'Diamond bends light dramatically due to high n.' },
        { title: 'Critical Angle', description: 'When going from dense to less dense medium, there is a critical angle beyond which no refraction occurs.', setup: () => { setPreset('glass-air'); setShowCritical(true); setSourceX(300); setSourceY(100) }, highlight: 'Critical angle shown as a dashed arc.' },
        { title: 'Total Internal Reflection', description: 'Beyond the critical angle, ALL light is reflected. This is how fiber optics and diamonds sparkle!', setup: () => { setPreset('glass-air'); setAnimateTIR(true) }, highlight: 'Watch as angle increases until TIR occurs.' },
        { title: 'Dense to Less Dense', description: 'Light going from water to air bends away from normal. Critical angle for water-air is about 48.8 degrees.', setup: () => { setPreset('water-air'); setSourceX(280); setSourceY(120) } },
        { title: 'Reflected Ray', description: 'A reflected ray always exists at the same angle as incidence. During TIR, reflection is 100% intensity.', setup: () => { setPreset('glass-air') }, highlight: 'The faint reflected ray becomes bright at TIR.' },
    ]

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let dpr = window.devicePixelRatio || 1
        const resize = () => {
            dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        const animate = () => {
            const w = canvas.offsetWidth, h = canvas.offsetHeight
            const centerY = h / 2, centerX = w / 2

            ctx.clearRect(0, 0, w, h)

            // Media backgrounds
            ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + (n1 - 1) * 0.04})`
            ctx.fillRect(0, 0, w, centerY)
            ctx.fillStyle = `rgba(100, 180, 255, ${0.03 + (n2 - 1) * 0.06})`
            ctx.fillRect(0, centerY, w, h / 2)

            // Boundary
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(w, centerY); ctx.stroke()

            // Normal line
            ctx.setLineDash([4, 4])
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.beginPath()
            ctx.moveTo(centerX, centerY - 220); ctx.lineTo(centerX, centerY + 220)
            ctx.stroke()
            ctx.setLineDash([])

            // Media labels
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '12px sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText(`n1 = ${n1.toFixed(2)}`, 15, centerY - 15)
            ctx.fillText(`n2 = ${n2.toFixed(2)}`, 15, centerY + 25)

            // Critical angle arc
            if (showCritical && criticalAngle !== null) {
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)'
                ctx.lineWidth = 1.5
                ctx.setLineDash([4, 3])
                ctx.beginPath()
                ctx.arc(centerX, centerY, 60, -Math.PI / 2, -Math.PI / 2 + criticalAngle)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'
                ctx.font = '10px monospace'
                ctx.textAlign = 'left'
                ctx.fillText(`theta_c = ${(criticalAngle * 180 / Math.PI).toFixed(1)} deg`, centerX + 65, centerY - 55)
            }

            // Ray calculations
            const dx = centerX - sourceX, dy = centerY - sourceY
            const angleInc = Math.atan2(dx, -dy)
            const sinTheta1 = Math.sin(angleInc)
            const sinTheta2 = (n1 / n2) * sinTheta1
            const tir = Math.abs(sinTheta2) > 1.0

            // Incident ray (with glow)
            ctx.save()
            ctx.strokeStyle = '#ef4444'
            ctx.lineWidth = 3
            ctx.shadowColor = '#ef4444'
            ctx.shadowBlur = 8
            ctx.beginPath()
            ctx.moveTo(sourceX, sourceY); ctx.lineTo(centerX, centerY)
            ctx.stroke()
            ctx.restore()

            // Refracted ray
            if (!tir) {
                const rTheta = Math.asin(Math.abs(sinTheta2))
                const dirX = sourceX < centerX ? 1 : -1
                const rayLen = 500
                const endX = centerX + Math.sin(rTheta) * rayLen * dirX
                const endY = centerY + Math.cos(rTheta) * rayLen

                ctx.save()
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'
                ctx.lineWidth = 2.5
                ctx.shadowColor = '#ef4444'
                ctx.shadowBlur = 4
                ctx.beginPath()
                ctx.moveTo(centerX, centerY); ctx.lineTo(endX, endY)
                ctx.stroke()
                ctx.restore()
            }

            // Reflected ray
            const refTheta = Math.abs(angleInc)
            const refDirX = sourceX < centerX ? 1 : -1
            const refLen = 500
            const refEndX = centerX + Math.sin(refTheta) * refLen * refDirX
            const refEndY = centerY - Math.cos(refTheta) * refLen

            ctx.save()
            if (tir) {
                ctx.strokeStyle = '#ef4444'
                ctx.lineWidth = 3
                ctx.shadowColor = '#ef4444'
                ctx.shadowBlur = 10
            } else {
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)'
                ctx.lineWidth = 1.5
            }
            ctx.beginPath()
            ctx.moveTo(centerX, centerY); ctx.lineTo(refEndX, refEndY)
            ctx.stroke()
            ctx.restore()

            // Angle arcs
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)'
            ctx.lineWidth = 1
            // theta1 arc
            const arcR = 40
            ctx.beginPath()
            ctx.arc(centerX, centerY, arcR, -Math.PI / 2, -Math.PI / 2 + angleInc)
            ctx.stroke()

            // Labels
            ctx.fillStyle = 'rgba(255, 200, 100, 0.8)'
            ctx.font = '12px monospace'
            ctx.textAlign = 'left'
            const thetaDeg = (Math.abs(angleInc) * 180 / Math.PI).toFixed(1)
            ctx.fillText(`theta1 = ${thetaDeg} deg`, centerX + 50, centerY - 50)

            if (!tir) {
                const theta2Deg = (Math.asin(Math.abs(sinTheta2)) * 180 / Math.PI).toFixed(1)
                // theta2 arc
                if (!tir) {
                    const t2 = Math.asin(Math.abs(sinTheta2))
                    ctx.beginPath()
                    ctx.arc(centerX, centerY, arcR, Math.PI / 2 - t2, Math.PI / 2)
                    ctx.stroke()
                }
                ctx.fillText(`theta2 = ${theta2Deg} deg`, centerX + 50, centerY + 40)
            } else {
                ctx.fillStyle = '#facc15'
                ctx.font = 'bold 13px sans-serif'
                ctx.fillText('TOTAL INTERNAL REFLECTION', centerX + 50, centerY + 40)
            }

            // Source handle
            ctx.save()
            ctx.fillStyle = '#ef4444'
            ctx.shadowColor = '#ef4444'
            ctx.shadowBlur = 12
            ctx.beginPath(); ctx.arc(sourceX, sourceY, 8, 0, Math.PI * 2); ctx.fill()
            ctx.restore()
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText('Drag', sourceX + 12, sourceY + 4)

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [n1, n2, sourceX, sourceY, showCritical, criticalAngle])

    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        if (Math.hypot(mx - sourceX, my - sourceY) < 30) setIsDragging(true)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const my = Math.min(e.clientY - rect.top, canvas.offsetHeight / 2 - 10)
        setSourceX(e.clientX - rect.left)
        setSourceY(my)
    }

    const thetaInc = Math.abs(Math.atan2(
        (canvasRef.current?.offsetWidth ?? 400) / 2 - sourceX,
        -(canvasRef.current?.offsetHeight ?? 400) / 2 + sourceY
    ))
    const sinT2 = (n1 / n2) * Math.sin(thetaInc)
    const isTIR = Math.abs(sinT2) > 1

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Snell's Law</h1>
                        <p className="text-xs text-white/50">Optics</p>
                    </div>
                    <APTag course="Physics 2" unit="Unit 6" color={PHYSICS_COLOR} />
                </div>
                <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative cursor-crosshair">
                    <canvas ref={canvasRef} className="w-full h-full block"
                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
                        onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)} />
                    <div className="absolute top-4 left-4 space-y-2">
                        <EquationDisplay departmentColor={PHYSICS_COLOR} title="Optics"
                            equations={[
                                { label: 'Snell', expression: 'n1 sin(theta1) = n2 sin(theta2)', description: 'Law of refraction' },
                                { label: 'Critical', expression: 'theta_c = arcsin(n2/n1)', description: 'Critical angle (n1 > n2)' },
                                { label: 'Reflection', expression: 'theta_r = theta_i', description: 'Law of reflection' },
                            ]} />
                    </div>
                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PHYSICS_COLOR} title="Ray Data"
                            items={[
                                { label: 'n1', value: n1.toFixed(2) },
                                { label: 'n2', value: n2.toFixed(2) },
                                { label: 'theta_i', value: `${(thetaInc * 180 / Math.PI).toFixed(1)} deg` },
                                { label: 'theta_r', value: isTIR ? 'TIR' : `${(Math.asin(Math.abs(sinT2)) * 180 / Math.PI).toFixed(1)} deg` },
                                { label: 'Critical', value: criticalAngle ? `${(criticalAngle * 180 / Math.PI).toFixed(1)} deg` : 'N/A' },
                                { label: 'TIR', value: isTIR ? 'Yes' : 'No' },
                            ]} />
                    </div>
                </div>

                <div className="w-72 bg-[#0d0a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <Select label="Material Preset" value={preset} onChange={setPreset} options={MATERIAL_PRESETS} />
                        <ControlGroup label="Index n1 (top)">
                            <Slider value={n1} onChange={v => { setN1(v); setPreset('custom') }} min={1.0} max={2.5} step={0.01} label={`${n1.toFixed(2)}`} />
                        </ControlGroup>
                        <ControlGroup label="Index n2 (bottom)">
                            <Slider value={n2} onChange={v => { setN2(v); setPreset('custom') }} min={1.0} max={2.5} step={0.01} label={`${n2.toFixed(2)}`} />
                        </ControlGroup>
                        <Toggle value={showCritical} onChange={setShowCritical} label="Show Critical Angle" />
                        {n1 > n2 && (
                            <Button onClick={() => setAnimateTIR(true)} variant="secondary">
                                Animate to TIR
                            </Button>
                        )}
                    </ControlPanel>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={PHYSICS_COLOR} />
            </div>
        </div>
    )
}
