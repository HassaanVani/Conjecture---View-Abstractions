import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

const PHYSICS_COLOR = 'rgb(160, 100, 255)'

type LensType = 'convex' | 'concave'

export default function ThinLenses() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [lensType, setLensType] = useState<LensType>('convex')
    const [focalLength, setFocalLength] = useState(120)
    const [objectDist, setObjectDist] = useState(250)
    const [objectHeight, setObjectHeight] = useState(70)
    const [isDragging, setIsDragging] = useState(false)
    const [showSecondLens, setShowSecondLens] = useState(false)
    const [lens2Offset, setLens2Offset] = useState(200)
    const [lens2Focal, setLens2Focal] = useState(100)

    // Thin lens equation: 1/f = 1/do + 1/di
    const f = lensType === 'convex' ? focalLength : -focalLength
    const di = objectDist !== f ? (f * objectDist) / (objectDist - f) : Infinity
    const M = Math.abs(di) < 5000 ? -di / objectDist : 0
    const imageH = M * objectHeight

    // Second lens calculations
    let di2 = 0, M2 = 0, imageH2 = 0, do2 = 0
    if (showSecondLens && Math.abs(di) < 5000) {
        do2 = lens2Offset - di
        if (do2 > 0 && do2 !== lens2Focal) {
            di2 = (lens2Focal * do2) / (do2 - lens2Focal)
            M2 = -di2 / do2
            imageH2 = M2 * Math.abs(imageH)
        }
    }

    const totalM = showSecondLens && Math.abs(di2) < 5000 ? M * M2 : M

    const demoSteps: DemoStep[] = [
        { title: 'Thin Lens Equation', description: '1/f = 1/do + 1/di. This relates focal length (f), object distance (do), and image distance (di).', highlight: 'Drag the object to change do and see di respond.' },
        { title: 'Convex Lens (Converging)', description: 'f > 0. Real, inverted image when do > f. Virtual, upright image when do < f.', setup: () => { setLensType('convex'); setFocalLength(120); setObjectDist(250); setShowSecondLens(false) } },
        { title: 'Object Beyond 2f', description: 'When do > 2f, image is real, inverted, and diminished (|M| < 1). Image is between f and 2f.', setup: () => { setObjectDist(300) }, highlight: 'Image is smaller than object.' },
        { title: 'Object at 2f', description: 'When do = 2f, image is real, inverted, and same size (M = -1). Image is at 2f on other side.', setup: () => { setObjectDist(240) } },
        { title: 'Object Between f and 2f', description: 'Image is real, inverted, and magnified (|M| > 1). This is how projectors work.', setup: () => { setObjectDist(160) }, highlight: 'Image is larger than object.' },
        { title: 'Object Inside f', description: 'When do < f, image is virtual, upright, and magnified. This is a magnifying glass!', setup: () => { setObjectDist(80) }, highlight: 'Dashed image = virtual. It appears on the same side as object.' },
        { title: 'Concave Lens (Diverging)', description: 'f < 0. Always produces virtual, upright, diminished images regardless of object position.', setup: () => { setLensType('concave'); setFocalLength(120); setObjectDist(200) } },
        { title: 'Two-Lens System', description: 'Image from lens 1 becomes the object for lens 2. Total magnification = M1 * M2.', setup: () => { setLensType('convex'); setShowSecondLens(true); setObjectDist(250); setLens2Offset(200); setLens2Focal(100) }, highlight: 'Toggle second lens to see compound optics.' },
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
            const cx = w / 2, cy = h / 2
            const lensH = 200

            ctx.clearRect(0, 0, w, h)

            // Optical axis
            ctx.setLineDash([5, 5])
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()
            ctx.setLineDash([])

            // Draw lens 1
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(cx, cy - lensH / 2); ctx.lineTo(cx, cy + lensH / 2)
            ctx.stroke()

            // Lens shape indicators
            if (lensType === 'convex') {
                ctx.beginPath()
                ctx.moveTo(cx, cy - lensH / 2); ctx.lineTo(cx - 8, cy - lensH / 2 + 10)
                ctx.moveTo(cx, cy - lensH / 2); ctx.lineTo(cx + 8, cy - lensH / 2 + 10)
                ctx.moveTo(cx, cy + lensH / 2); ctx.lineTo(cx - 8, cy + lensH / 2 - 10)
                ctx.moveTo(cx, cy + lensH / 2); ctx.lineTo(cx + 8, cy + lensH / 2 - 10)
                ctx.stroke()
            } else {
                ctx.beginPath()
                ctx.moveTo(cx, cy - lensH / 2); ctx.lineTo(cx - 8, cy - lensH / 2 - 8)
                ctx.moveTo(cx, cy - lensH / 2); ctx.lineTo(cx + 8, cy - lensH / 2 - 8)
                ctx.moveTo(cx, cy + lensH / 2); ctx.lineTo(cx - 8, cy + lensH / 2 + 8)
                ctx.moveTo(cx, cy + lensH / 2); ctx.lineTo(cx + 8, cy + lensH / 2 + 8)
                ctx.stroke()
            }

            // Focal points
            ctx.fillStyle = '#facc15'
            ctx.beginPath(); ctx.arc(cx - Math.abs(f), cy, 4, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.arc(cx + Math.abs(f), cy, 4, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'rgba(250, 204, 21, 0.5)'
            ctx.font = '11px monospace'
            ctx.textAlign = 'center'
            ctx.fillText('F', cx - Math.abs(f), cy + 18)
            ctx.fillText("F'", cx + Math.abs(f), cy + 18)

            // 2f markers
            ctx.fillStyle = 'rgba(250, 204, 21, 0.25)'
            ctx.beginPath(); ctx.arc(cx - Math.abs(f) * 2, cy, 3, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.arc(cx + Math.abs(f) * 2, cy, 3, 0, Math.PI * 2); ctx.fill()
            ctx.fillText('2F', cx - Math.abs(f) * 2, cy + 18)
            ctx.fillText("2F'", cx + Math.abs(f) * 2, cy + 18)

            // Object
            const ox = cx - objectDist
            const oy = cy - objectHeight
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 3
            ctx.beginPath(); ctx.moveTo(ox, cy); ctx.lineTo(ox, oy); ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(ox - 5, oy + 8); ctx.lineTo(ox, oy); ctx.lineTo(ox + 5, oy + 8)
            ctx.stroke()
            ctx.fillStyle = '#3b82f6'
            ctx.font = '11px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('Object', ox, oy - 10)

            // Image from lens 1
            if (Math.abs(di) < 5000) {
                const ix = cx + di
                const iy = cy - imageH
                const isVirtual = di < 0

                ctx.strokeStyle = isVirtual ? 'rgba(239, 68, 68, 0.4)' : '#ef4444'
                ctx.lineWidth = 3
                if (isVirtual) ctx.setLineDash([6, 4])
                ctx.beginPath(); ctx.moveTo(ix, cy); ctx.lineTo(ix, iy); ctx.stroke()
                ctx.beginPath()
                const arrowDir = imageH > 0 ? 8 : -8
                ctx.moveTo(ix - 5, iy + arrowDir); ctx.lineTo(ix, iy); ctx.lineTo(ix + 5, iy + arrowDir)
                ctx.stroke()
                ctx.setLineDash([])

                ctx.fillStyle = isVirtual ? 'rgba(239, 68, 68, 0.6)' : '#ef4444'
                ctx.font = '11px sans-serif'
                ctx.fillText(isVirtual ? 'Virtual Image' : 'Real Image', ix, iy - 10)

                // Ray tracing for lens 1
                ctx.lineWidth = 1.2
                ctx.globalAlpha = 0.5

                // Ray 1: Parallel -> through F'
                ctx.strokeStyle = '#fbbf24'
                ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cx, oy); ctx.stroke()
                if (lensType === 'convex') {
                    ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx + Math.abs(f) * 4, cy + (cy - oy) / f * Math.abs(f) * 4); ctx.stroke()
                } else {
                    // Diverges as if from F on same side
                    const slope = (oy - cy) / (cx - (cx + f))
                    ctx.beginPath(); ctx.moveTo(cx, oy)
                    ctx.lineTo(cx + 400, oy + slope * 400); ctx.stroke()
                    ctx.setLineDash([3, 3])
                    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'
                    ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx + f, cy); ctx.stroke()
                    ctx.setLineDash([])
                }

                // Ray 2: Through center
                ctx.strokeStyle = '#a855f7'
                ctx.beginPath()
                const slope2 = (oy - cy) / (ox - cx)
                ctx.moveTo(ox, oy); ctx.lineTo(cx + 400, cy + slope2 * 400)
                ctx.stroke()

                // Ray 3: Through F -> parallel (for convex)
                if (lensType === 'convex') {
                    ctx.strokeStyle = '#34d399'
                    const fLeftX = cx - Math.abs(f)
                    const slopeToF = (oy - cy) / (ox - fLeftX)
                    const yAtLens = cy + slopeToF * (cx - fLeftX)
                    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(cx, yAtLens); ctx.stroke()
                    ctx.beginPath(); ctx.moveTo(cx, yAtLens); ctx.lineTo(cx + 400, yAtLens); ctx.stroke()
                }

                ctx.globalAlpha = 1.0
            }

            // Second lens
            if (showSecondLens) {
                const l2x = cx + lens2Offset
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(l2x, cy - lensH * 0.8 / 2); ctx.lineTo(l2x, cy + lensH * 0.8 / 2)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(l2x, cy - lensH * 0.8 / 2); ctx.lineTo(l2x - 6, cy - lensH * 0.8 / 2 + 8)
                ctx.moveTo(l2x, cy - lensH * 0.8 / 2); ctx.lineTo(l2x + 6, cy - lensH * 0.8 / 2 + 8)
                ctx.moveTo(l2x, cy + lensH * 0.8 / 2); ctx.lineTo(l2x - 6, cy + lensH * 0.8 / 2 - 8)
                ctx.moveTo(l2x, cy + lensH * 0.8 / 2); ctx.lineTo(l2x + 6, cy + lensH * 0.8 / 2 - 8)
                ctx.stroke()

                // Lens 2 focal points
                ctx.fillStyle = 'rgba(100, 200, 255, 0.5)'
                ctx.beginPath(); ctx.arc(l2x - lens2Focal, cy, 3, 0, Math.PI * 2); ctx.fill()
                ctx.beginPath(); ctx.arc(l2x + lens2Focal, cy, 3, 0, Math.PI * 2); ctx.fill()

                ctx.font = '10px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('Lens 2', l2x, cy - lensH * 0.8 / 2 - 10)

                // Image from lens 2
                if (Math.abs(di2) < 5000 && do2 > 0) {
                    const i2x = l2x + di2
                    const i2y = cy - imageH2 * (imageH < 0 ? -1 : 1)
                    const isV2 = di2 < 0

                    ctx.strokeStyle = isV2 ? 'rgba(100, 255, 150, 0.4)' : 'rgba(100, 255, 150, 0.8)'
                    ctx.lineWidth = 3
                    if (isV2) ctx.setLineDash([4, 4])
                    ctx.beginPath(); ctx.moveTo(i2x, cy); ctx.lineTo(i2x, i2y); ctx.stroke()
                    ctx.setLineDash([])
                    ctx.fillStyle = 'rgba(100, 255, 150, 0.7)'
                    ctx.fillText(isV2 ? 'Final (Virtual)' : 'Final (Real)', i2x, i2y - 10)
                }
            }

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [lensType, focalLength, objectDist, objectHeight, showSecondLens, lens2Offset, lens2Focal, f, di, imageH, di2, imageH2, do2])

    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const cx = canvas.offsetWidth / 2
        const ox = cx - objectDist
        if (Math.abs(mx - ox) < 30) setIsDragging(true)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const cx = canvas.offsetWidth / 2
        const newDist = cx - mx
        if (newDist > 20 && newDist < cx - 20) setObjectDist(newDist)
    }

    const imgChar = di > 0
        ? (Math.abs(M) > 1 ? 'Real, Inverted, Magnified' : Math.abs(M) < 1 ? 'Real, Inverted, Diminished' : 'Real, Inverted, Same Size')
        : 'Virtual, Upright, Magnified'

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
                        <h1 className="text-xl font-medium tracking-tight">Thin Lenses</h1>
                        <p className="text-xs text-white/50">Optics</p>
                    </div>
                    <APTag course="Physics 2" unit="Unit 6" color={PHYSICS_COLOR} />
                </div>
                <Button onClick={demo.open} variant="secondary">Demo Mode</Button>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative cursor-ew-resize">
                    <canvas ref={canvasRef} className="w-full h-full block"
                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
                        onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)} />
                    <div className="absolute top-4 left-4 space-y-2">
                        <EquationDisplay departmentColor={PHYSICS_COLOR} title="Thin Lens"
                            equations={[
                                { label: 'Lens eq', expression: '1/f = 1/do + 1/di', description: 'Thin lens equation' },
                                { label: 'Magnify', expression: 'M = -di/do = hi/ho', description: 'Magnification' },
                                { label: 'Power', expression: 'P = 1/f (diopters)', description: 'Lens power' },
                            ]} />
                    </div>
                    <div className="absolute top-4 right-4">
                        <InfoPanel departmentColor={PHYSICS_COLOR} title="Image Properties"
                            items={[
                                { label: 'Type', value: lensType },
                                { label: 'f', value: f.toFixed(0), unit: 'px' },
                                { label: 'do', value: objectDist.toFixed(0), unit: 'px' },
                                { label: 'di', value: Math.abs(di) < 5000 ? di.toFixed(0) : 'inf', unit: 'px' },
                                { label: 'M', value: Math.abs(M) < 100 ? M.toFixed(2) : 'inf' },
                                { label: 'Image', value: Math.abs(di) < 5000 ? imgChar : 'At infinity' },
                                ...(showSecondLens ? [{ label: 'Total M', value: Math.abs(totalM) < 100 ? totalM.toFixed(2) : 'inf' }] : []),
                            ]} />
                    </div>
                </div>

                <div className="w-72 bg-[#0d0a1a]/90 border-l border-white/10 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ButtonGroup label="Lens Type" value={lensType} onChange={v => setLensType(v as LensType)}
                            options={[{ value: 'convex', label: 'Convex (+)' }, { value: 'concave', label: 'Concave (-)' }]}
                            color={PHYSICS_COLOR} />
                        <ControlGroup label="Focal Length |f|">
                            <Slider value={focalLength} onChange={setFocalLength} min={40} max={250} step={5} label={`${focalLength} px`} />
                        </ControlGroup>
                        <ControlGroup label="Object Distance (do)">
                            <Slider value={objectDist} onChange={setObjectDist} min={20} max={400} step={5} label={`${objectDist} px`} />
                        </ControlGroup>
                        <ControlGroup label="Object Height (ho)">
                            <Slider value={objectHeight} onChange={setObjectHeight} min={20} max={150} step={5} label={`${objectHeight} px`} />
                        </ControlGroup>
                        <Toggle value={showSecondLens} onChange={setShowSecondLens} label="Two-Lens System" />
                        {showSecondLens && (
                            <>
                                <ControlGroup label="Lens 2 Offset">
                                    <Slider value={lens2Offset} onChange={setLens2Offset} min={50} max={400} step={10} label={`${lens2Offset} px`} />
                                </ControlGroup>
                                <ControlGroup label="Lens 2 Focal">
                                    <Slider value={lens2Focal} onChange={setLens2Focal} min={30} max={200} step={5} label={`${lens2Focal} px`} />
                                </ControlGroup>
                            </>
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
