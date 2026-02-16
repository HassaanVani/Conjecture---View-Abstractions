import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, Slider, Button, Toggle, Select } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'

const PC = 'rgb(160, 100, 255)'

export default function Buoyancy() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [fluidDensity, setFluidDensity] = useState(1000)
    const [blockDensity, setBlockDensity] = useState(500)
    const [showForces, setShowForces] = useState(true)
    const [showPressure, setShowPressure] = useState(true)
    const [fluidType, setFluidType] = useState('water')

    const blockVolume = 0.001
    const gravity = 9.8
    const scale = 400

    const stateRef = useRef({ y: -0.2, vy: 0, isDragging: false, dragOffsetY: 0 })

    const reset = useCallback(() => {
        stateRef.current = { y: -0.2, vy: 0, isDragging: false, dragOffsetY: 0 }
        setIsRunning(false)
    }, [])

    // Fluid presets
    useEffect(() => {
        const presets: Record<string, number> = { oil: 800, water: 1000, saltwater: 1025, honey: 1400, mercury: 13600 }
        if (presets[fluidType]) setFluidDensity(presets[fluidType])
    }, [fluidType])

    const L = Math.pow(blockVolume, 1 / 3)
    const massBl = blockDensity * blockVolume
    const Fg = massBl * gravity
    const top = stateRef.current.y - L / 2
    const bottom = stateRef.current.y + L / 2
    let subH = top >= 0 ? L : bottom <= 0 ? 0 : Math.max(0, bottom)
    const Vdisp = subH * L * L
    const Fb = fluidDensity * Vdisp * gravity
    const Fnet = Fg - Fb
    const willFloat = blockDensity < fluidDensity
    const fracSubmerged = willFloat ? blockDensity / fluidDensity : 1
    const pAtBottom = fluidDensity * gravity * Math.max(0, bottom)

    const demoSteps = [
        { title: 'Buoyancy & Archimedes', description: 'A submerged object experiences an upward buoyant force equal to the weight of fluid displaced: Fb = \u03C1_fluid \u00B7 V_disp \u00B7 g.', highlight: 'Drag the block to submerge it.' },
        { title: 'Floating Objects', description: 'When block density < fluid density, the object floats. It sinks until it displaces exactly its own weight in fluid.', setup: () => { setBlockDensity(500); setFluidType('water') } },
        { title: 'Sinking Objects', description: 'When block density > fluid density, buoyancy cannot support the weight. The object sinks to the bottom.', setup: () => { setBlockDensity(2500) } },
        { title: 'Neutral Buoyancy', description: 'When densities are equal, the object is neutrally buoyant. It stays wherever you place it.', setup: () => { setBlockDensity(1000) } },
        { title: 'Pressure with Depth', description: 'Pressure increases linearly with depth: P = P\u2080 + \u03C1gh. The pressure difference across the block creates the buoyant force.', setup: () => { setShowPressure(true); setBlockDensity(500) } },
        { title: 'Fluid Density Matters', description: 'Denser fluids provide more buoyancy. An object that sinks in water may float in mercury. Try different fluid types.', setup: () => { setFluidType('mercury'); setBlockDensity(2500) } },
        { title: 'Fraction Submerged', description: 'For floating objects, the fraction submerged equals \u03C1_object / \u03C1_fluid. Ice floats with about 90% submerged in water.', setup: () => { setFluidType('water'); setBlockDensity(900) } },
        { title: 'Explore!', description: 'Drag the block, change densities, and switch fluids. Observe how forces and pressure change in real time.' },
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

        const handleMouseDown = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            const my = e.clientY - rect.top
            const waterLevel = canvas.offsetHeight / 2
            const blockYPix = waterLevel + stateRef.current.y * scale
            if (Math.abs(my - blockYPix) < L * scale / 2 + 20) {
                stateRef.current.isDragging = true
                stateRef.current.dragOffsetY = my - blockYPix
                stateRef.current.vy = 0
            }
        }
        const handleMouseMove = (e: MouseEvent) => {
            if (stateRef.current.isDragging) {
                const rect = canvas.getBoundingClientRect()
                const my = e.clientY - rect.top
                const waterLevel = canvas.offsetHeight / 2
                stateRef.current.y = (my - stateRef.current.dragOffsetY - waterLevel) / scale
                stateRef.current.vy = 0
            }
        }
        const handleMouseUp = () => { stateRef.current.isDragging = false }

        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        let animId: number
        const dt = 0.016

        const animate = () => {
            const w = canvas.offsetWidth; const h = canvas.offsetHeight
            const cx = w / 2; const cy = h / 2

            if (isRunning && !stateRef.current.isDragging) {
                const top = stateRef.current.y - L / 2
                const bottom = stateRef.current.y + L / 2
                let sH = top >= 0 ? L : bottom <= 0 ? 0 : Math.max(0, bottom)
                const Vd = sH * L * L
                const mass = blockDensity * blockVolume
                const fg = mass * gravity
                const fb = fluidDensity * Vd * gravity
                let c = 0.1; if (sH > 0) c += 2.0 * (sH / L)
                const fd = -c * stateRef.current.vy
                const fnet = fg - fb + fd
                const acc = fnet / mass
                stateRef.current.vy += acc * dt
                stateRef.current.y += stateRef.current.vy * dt
            }

            ctx.clearRect(0, 0, w, h)

            // Water fill with gradient
            const waterGrad = ctx.createLinearGradient(0, cy, 0, h)
            const fluidColor = fluidType === 'mercury' ? 'rgba(180,180,190,' : fluidType === 'oil' ? 'rgba(180,160,60,' : fluidType === 'honey' ? 'rgba(200,150,50,' : 'rgba(59,130,246,'
            waterGrad.addColorStop(0, fluidColor + '0.15)')
            waterGrad.addColorStop(1, fluidColor + '0.35)')
            ctx.fillStyle = waterGrad; ctx.fillRect(0, cy, w, h / 2)

            // Surface line
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy)
            ctx.strokeStyle = fluidColor + '0.8)'; ctx.lineWidth = 2; ctx.stroke()

            // Pressure depth visualization
            if (showPressure) {
                for (let d = 0; d < h / 2; d += 30) {
                    const depth = d / scale
                    const P = 101325 + fluidDensity * gravity * depth
                    const intensity = Math.min(1, d / (h / 2))
                    ctx.fillStyle = `rgba(160,100,255,${intensity * 0.15})`
                    ctx.fillRect(0, cy + d, w, 28)
                    if (d % 90 === 0 && d > 0) {
                        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '9px monospace'; ctx.textAlign = 'right'
                        ctx.fillText(`P=${(P / 1000).toFixed(1)} kPa`, w - 10, cy + d + 12)
                        ctx.fillText(`d=${depth.toFixed(2)} m`, w - 10, cy + d + 22)
                    }
                }
            }

            // Block
            const Lpix = L * scale
            const yPix = cy + stateRef.current.y * scale
            ctx.save(); ctx.translate(cx, yPix)
            const blockColor = blockDensity > 2000 ? '#9ca3af' : blockDensity > 1200 ? '#a78bfa' : '#f59e0b'
            ctx.fillStyle = blockColor
            ctx.shadowColor = blockColor; ctx.shadowBlur = 8
            ctx.fillRect(-Lpix / 2, -Lpix / 2, Lpix, Lpix)
            ctx.shadowBlur = 0
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.strokeRect(-Lpix / 2, -Lpix / 2, Lpix, Lpix)
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill()

            // Forces
            if (showForces) {
                const mass = blockDensity * blockVolume
                const fgCalc = mass * gravity
                const topC = stateRef.current.y - L / 2; const bottomC = stateRef.current.y + L / 2
                let sH2 = topC >= 0 ? L : bottomC <= 0 ? 0 : Math.max(0, bottomC)
                const Vd2 = sH2 * L * L
                const fbCalc = fluidDensity * Vd2 * gravity
                const fScale = 3.0

                // Fg down
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, fgCalc * fScale)
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5; ctx.stroke()
                ctx.fillStyle = '#ef4444'; ctx.beginPath()
                ctx.moveTo(0, fgCalc * fScale); ctx.lineTo(-5, fgCalc * fScale - 8); ctx.lineTo(5, fgCalc * fScale - 8); ctx.fill()
                ctx.font = '10px monospace'; ctx.textAlign = 'left'
                ctx.fillText(`Fg=${fgCalc.toFixed(3)}N`, 8, fgCalc * fScale - 2)

                // Fb up
                if (fbCalc > 0.001) {
                    const cbOffset = (L / 2 - sH2 / 2) * scale
                    ctx.beginPath(); ctx.moveTo(0, cbOffset / scale); ctx.lineTo(0, -fbCalc * fScale)
                    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2.5; ctx.stroke()
                    ctx.fillStyle = '#3b82f6'; ctx.beginPath()
                    ctx.moveTo(0, -fbCalc * fScale); ctx.lineTo(-5, -fbCalc * fScale + 8); ctx.lineTo(5, -fbCalc * fScale + 8); ctx.fill()
                    ctx.font = '10px monospace'; ctx.textAlign = 'left'
                    ctx.fillText(`Fb=${fbCalc.toFixed(3)}N`, 8, -fbCalc * fScale + 4)
                }
            }

            ctx.restore()

            // Surface label
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '10px monospace'; ctx.textAlign = 'left'
            ctx.fillText('P\u2080 = 1 atm (surface)', 10, cy - 6)

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
    }, [isRunning, fluidDensity, blockDensity, showForces, showPressure, fluidType, L, scale])

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><PhysicsBackground /></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Buoyancy Lab</h1>
                        <p className="text-xs text-white/50">Archimedes&apos; Principle &amp; Fluid Pressure</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <APTag course="Physics 2" unit="Unit 1" color={PC} />
                    <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-[260px]">
                        <EquationDisplay departmentColor={PC} equations={[
                            { label: 'Buoyancy', expression: 'Fb = \u03C1_f V_disp g' },
                            { label: 'Pressure', expression: 'P = P\u2080 + \u03C1gh' },
                            { label: 'Float', expression: '\u03C1_obj < \u03C1_fluid \u2192 floats' },
                            { label: '% Submerged', expression: 'f = \u03C1_obj / \u03C1_fluid', description: `= ${(fracSubmerged * 100).toFixed(0)}%` },
                        ]} />
                    </div>

                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PC} title="Buoyancy Data" items={[
                            { label: 'Fg', value: Fg, unit: 'N', color: '#ef4444' },
                            { label: 'Fb', value: Fb, unit: 'N', color: '#3b82f6' },
                            { label: 'Fnet', value: Fnet, unit: 'N' },
                            { label: 'V displaced', value: Vdisp * 1e6, unit: 'cm\u00B3' },
                            { label: '% Submerged', value: `${(fracSubmerged * 100).toFixed(0)}%` },
                            { label: 'P at bottom', value: (101325 + pAtBottom) / 1000, unit: 'kPa' },
                            { label: 'Behavior', value: willFloat ? 'Floats' : 'Sinks', color: willFloat ? '#22c55e' : '#ef4444' },
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
                        <Select label="Fluid Type" value={fluidType} onChange={setFluidType} options={[
                            { value: 'oil', label: 'Oil (800 kg/m\u00B3)' },
                            { value: 'water', label: 'Water (1000 kg/m\u00B3)' },
                            { value: 'saltwater', label: 'Saltwater (1025 kg/m\u00B3)' },
                            { value: 'honey', label: 'Honey (1400 kg/m\u00B3)' },
                            { value: 'mercury', label: 'Mercury (13600 kg/m\u00B3)' },
                        ]} />
                        <Slider label={`Fluid Density \u2014 ${fluidDensity} kg/m\u00B3`} value={fluidDensity} onChange={setFluidDensity} min={100} max={14000} step={100} />
                        <Slider label={`Block Density \u2014 ${blockDensity} kg/m\u00B3`} value={blockDensity} onChange={setBlockDensity} min={100} max={3000} step={50} />
                    </ControlPanel>

                    <div className="flex gap-2">
                        <Button onClick={() => setIsRunning(!isRunning)} className="flex-1">
                            {isRunning ? 'Pause' : 'Start'}
                        </Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>

                    <Toggle label="Force Vectors" value={showForces} onChange={setShowForces} />
                    <Toggle label="Pressure Depth Viz" value={showPressure} onChange={setShowPressure} />
                </div>
            </div>
        </div>
    )
}
