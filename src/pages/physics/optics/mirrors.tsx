import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

export default function Mirrors() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [mirrorType, setMirrorType] = useState<string>('concave')
    const [radiusCurvature, setRadiusCurvature] = useState(300)
    const [objectDist, setObjectDist] = useState(250)
    const [objectHeight, setObjectHeight] = useState(60)
    const [showRay1, setShowRay1] = useState(true)
    const [showRay2, setShowRay2] = useState(true)
    const [showRay3, setShowRay3] = useState(true)
    const [showImage, setShowImage] = useState(true)
    const [showLabels, setShowLabels] = useState(true)

    const calcMirror = useCallback(() => {
        const f = mirrorType === 'flat' ? Infinity : (mirrorType === 'concave' ? radiusCurvature / 2 : -radiusCurvature / 2)
        const doVal = objectDist
        let di: number
        if (mirrorType === 'flat') {
            di = -doVal
        } else {
            di = (f * doVal) / (doVal - f)
        }
        const magnification = -di / doVal
        const imageHeight = magnification * objectHeight
        const isReal = di > 0
        const isUpright = magnification > 0
        const isMagnified = Math.abs(magnification) > 1

        return { f, di, magnification, imageHeight, isReal, isUpright, isMagnified }
    }, [mirrorType, radiusCurvature, objectDist, objectHeight])

    const reset = useCallback(() => {
        setMirrorType('concave')
        setRadiusCurvature(300)
        setObjectDist(250)
        setObjectHeight(60)
        setShowRay1(true)
        setShowRay2(true)
        setShowRay3(true)
        setShowImage(true)
        setShowLabels(true)
    }, [])

    const demoSteps = [
        { title: 'Law of Reflection', description: 'Light reflects off a mirror such that the angle of incidence equals the angle of reflection: theta_i = theta_r. This fundamental law governs all mirror behavior.', setup: () => { reset(); setMirrorType('flat') } },
        { title: 'Concave Mirror - Object Beyond C', description: 'When the object is beyond the center of curvature (C), the image is real, inverted, and diminished. It forms between F and C.', setup: () => { setMirrorType('concave'); setRadiusCurvature(300); setObjectDist(250) } },
        { title: 'Object Between C and F', description: 'When the object is between C and the focal point F, the image is real, inverted, and magnified. It forms beyond C.', setup: () => { setObjectDist(120) } },
        { title: 'Object Inside F - Virtual Image', description: 'When the object is inside the focal point, rays diverge after reflection. The image is virtual (behind the mirror), upright, and magnified.', setup: () => { setObjectDist(60) } },
        { title: 'Convex Mirror - Always Virtual', description: 'A convex mirror always produces a virtual, upright, diminished image regardless of object position. This is why convex mirrors are used for wide-angle views.', setup: () => { setMirrorType('convex'); setObjectDist(200) } },
        { title: 'Mirror Equation', description: '1/f = 1/do + 1/di relates the focal length to the object and image distances. For concave mirrors f > 0; for convex mirrors f < 0.', setup: () => { setMirrorType('concave'); setObjectDist(200); setRadiusCurvature(300) } },
        { title: 'Magnification', description: 'M = -di/do = hi/ho. Positive M means upright image; negative M means inverted. |M| > 1 means magnified; |M| < 1 means diminished.', setup: () => { setObjectDist(120) } },
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
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            const mirrorX = w * 0.6
            const axisY = h * 0.5
            const R = radiusCurvature
            const f = mirrorType === 'flat' ? Infinity : (mirrorType === 'concave' ? R / 2 : -R / 2)

            // Principal axis
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = 1
            ctx.setLineDash([5, 5])
            ctx.beginPath()
            ctx.moveTo(20, axisY)
            ctx.lineTo(w - 20, axisY)
            ctx.stroke()
            ctx.setLineDash([])

            // Draw mirror
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.9)'
            ctx.lineWidth = 3
            if (mirrorType === 'flat') {
                ctx.beginPath()
                ctx.moveTo(mirrorX, axisY - 130)
                ctx.lineTo(mirrorX, axisY + 130)
                ctx.stroke()
                // Hatching
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.3)'
                ctx.lineWidth = 1
                for (let i = -120; i <= 120; i += 12) {
                    ctx.beginPath()
                    ctx.moveTo(mirrorX, axisY + i)
                    ctx.lineTo(mirrorX + 10, axisY + i - 10)
                    ctx.stroke()
                }
            } else {
                const curveDir = mirrorType === 'concave' ? -1 : 1
                const arcRadius = R * 1.2
                ctx.beginPath()
                const segments = 60
                for (let i = 0; i <= segments; i++) {
                    const t = (i / segments - 0.5) * 0.4
                    const y = axisY + Math.sin(t) * 260
                    const x = mirrorX + curveDir * (1 - Math.cos(t)) * arcRadius * 0.3
                    if (i === 0) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                }
                ctx.stroke()

                // Hatching behind mirror
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.2)'
                ctx.lineWidth = 1
                for (let i = -120; i <= 120; i += 14) {
                    const frac = (i / 260 + 0.5) * 0.4 - 0.2
                    const mx = mirrorX + curveDir * (1 - Math.cos(frac)) * arcRadius * 0.3
                    const my = axisY + i
                    ctx.beginPath()
                    ctx.moveTo(mx, my)
                    ctx.lineTo(mx + curveDir * 10, my - 8)
                    ctx.stroke()
                }
            }

            // Mark F and C
            if (mirrorType !== 'flat') {
                const focalX = mirrorX - f
                const centerX = mirrorX - R * (mirrorType === 'concave' ? 1 : -1)

                // Focal point F
                ctx.fillStyle = 'rgba(255, 200, 80, 0.9)'
                ctx.beginPath()
                ctx.arc(focalX, axisY, 5, 0, Math.PI * 2)
                ctx.fill()
                if (showLabels) {
                    ctx.fillStyle = 'rgba(255, 200, 80, 0.8)'
                    ctx.font = 'bold 13px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('F', focalX, axisY + 22)
                }

                // Center of curvature C
                ctx.fillStyle = 'rgba(100, 200, 255, 0.9)'
                ctx.beginPath()
                ctx.arc(centerX, axisY, 5, 0, Math.PI * 2)
                ctx.fill()
                if (showLabels) {
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
                    ctx.font = 'bold 13px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('C', centerX, axisY + 22)
                }
            }

            // Object arrow
            const objX = mirrorX - objectDist
            ctx.strokeStyle = 'rgba(100, 255, 150, 0.9)'
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(objX, axisY)
            ctx.lineTo(objX, axisY - objectHeight)
            ctx.stroke()
            // Arrowhead
            ctx.fillStyle = 'rgba(100, 255, 150, 0.9)'
            ctx.beginPath()
            ctx.moveTo(objX, axisY - objectHeight)
            ctx.lineTo(objX - 6, axisY - objectHeight + 12)
            ctx.lineTo(objX + 6, axisY - objectHeight + 12)
            ctx.closePath()
            ctx.fill()
            if (showLabels) {
                ctx.fillStyle = 'rgba(100, 255, 150, 0.7)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Object', objX, axisY + 20)
            }

            // Calculate image
            const { di, imageHeight, isReal } = calcMirror()
            const imgX = mirrorX - di
            const imgH = imageHeight

            // Helper: find y on curved mirror at a given y-offset for reflection point
            const getMirrorX = (yPos: number): number => {
                if (mirrorType === 'flat') return mirrorX
                const curveDir = mirrorType === 'concave' ? -1 : 1
                const arcRadius = R * 1.2
                const frac = ((yPos - axisY) / 260) * 0.4
                return mirrorX + curveDir * (1 - Math.cos(frac)) * arcRadius * 0.3
            }

            // Ray tracing
            const drawRay = (fromX: number, fromY: number, toX: number, toY: number, dashed: boolean, color: string) => {
                ctx.strokeStyle = color
                ctx.lineWidth = 1.5
                if (dashed) ctx.setLineDash([6, 4])
                else ctx.setLineDash([])
                ctx.beginPath()
                ctx.moveTo(fromX, fromY)
                ctx.lineTo(toX, toY)
                ctx.stroke()
                ctx.setLineDash([])
            }

            const objTipX = objX
            const objTipY = axisY - objectHeight
            const focalX = mirrorType === 'flat' ? mirrorX : mirrorX - f
            const hitMirrorX = getMirrorX(objTipY)

            if (mirrorType !== 'flat') {
                // Ray 1: Parallel to axis -> reflects through F (concave) or appears from F (convex)
                if (showRay1) {
                    const ray1MirrorY = objTipY
                    const ray1MirrorX = getMirrorX(ray1MirrorY)
                    drawRay(objTipX, objTipY, ray1MirrorX, ray1MirrorY, false, 'rgba(255, 100, 100, 0.8)')

                    if (mirrorType === 'concave') {
                        if (isReal) {
                            // Reflect through F and beyond
                            const dx = focalX - ray1MirrorX
                            const dy = axisY - ray1MirrorY
                            const ext = 800 / Math.abs(dx) * Math.abs(dx)
                            drawRay(ray1MirrorX, ray1MirrorY, ray1MirrorX + ext * (dx / Math.abs(dx)), ray1MirrorY + ext * (dy / Math.abs(dx)), false, 'rgba(255, 100, 100, 0.8)')
                        } else {
                            // Goes through F
                            drawRay(ray1MirrorX, ray1MirrorY, focalX, axisY, false, 'rgba(255, 100, 100, 0.8)')
                            // Extend beyond F
                            const dx = focalX - ray1MirrorX
                            const dy = axisY - ray1MirrorY
                            const len = Math.sqrt(dx * dx + dy * dy)
                            drawRay(focalX, axisY, focalX + dx / len * 300, axisY + dy / len * 300, false, 'rgba(255, 100, 100, 0.8)')
                            // Virtual extension behind mirror
                            drawRay(ray1MirrorX, ray1MirrorY, ray1MirrorX - (focalX - ray1MirrorX) * 3, ray1MirrorY - (axisY - ray1MirrorY) * 3, true, 'rgba(255, 100, 100, 0.4)')
                        }
                    } else {
                        // Convex: diverges away, virtual ray extends back through F
                        const dx = ray1MirrorX - focalX
                        const dy = ray1MirrorY - axisY
                        const len = Math.sqrt(dx * dx + dy * dy)
                        drawRay(ray1MirrorX, ray1MirrorY, ray1MirrorX + dx / len * 400, ray1MirrorY + dy / len * 400, false, 'rgba(255, 100, 100, 0.8)')
                        drawRay(ray1MirrorX, ray1MirrorY, focalX, axisY, true, 'rgba(255, 100, 100, 0.4)')
                    }
                }

                // Ray 2: Through F -> reflects parallel (concave) or aimed at F -> reflects parallel (convex)
                if (showRay2) {
                    if (mirrorType === 'concave') {
                        // Ray aimed through F hits mirror, reflects parallel
                        const dx = focalX - objTipX
                        const dy = axisY - objTipY
                        const len = Math.sqrt(dx * dx + dy * dy)
                        // Find where this ray hits the mirror (approximately at same slope y)
                        const tToMirror = (mirrorX - objTipX) / (dx / len)
                        const ray2HitY = objTipY + (dy / len) * tToMirror
                        const ray2HitX = getMirrorX(ray2HitY)

                        drawRay(objTipX, objTipY, ray2HitX, ray2HitY, false, 'rgba(100, 200, 255, 0.8)')
                        if (isReal) {
                            drawRay(ray2HitX, ray2HitY, ray2HitX - 500, ray2HitY, false, 'rgba(100, 200, 255, 0.8)')
                        } else {
                            drawRay(ray2HitX, ray2HitY, ray2HitX - 500, ray2HitY, false, 'rgba(100, 200, 255, 0.8)')
                            drawRay(ray2HitX, ray2HitY, ray2HitX + 300, ray2HitY, true, 'rgba(100, 200, 255, 0.4)')
                        }
                    } else {
                        // Convex: ray aimed toward F (behind mirror)
                        const dx = focalX - objTipX
                        const dy = axisY - objTipY
                        const len = Math.sqrt(dx * dx + dy * dy)
                        const tToMirror = (hitMirrorX - objTipX) / (dx / len)
                        const ray2HitY = objTipY + (dy / len) * tToMirror
                        const ray2HitX = getMirrorX(ray2HitY)

                        drawRay(objTipX, objTipY, ray2HitX, ray2HitY, false, 'rgba(100, 200, 255, 0.8)')
                        // Reflects parallel
                        drawRay(ray2HitX, ray2HitY, ray2HitX - 500, ray2HitY, false, 'rgba(100, 200, 255, 0.8)')
                        // Virtual extension behind
                        drawRay(ray2HitX, ray2HitY, ray2HitX + 300, ray2HitY, true, 'rgba(100, 200, 255, 0.4)')
                    }
                }

                // Ray 3: Through C -> reflects back on itself
                if (showRay3) {
                    const centerX = mirrorX - R * (mirrorType === 'concave' ? 1 : -1)
                    const dx = centerX - objTipX
                    const dy = axisY - objTipY
                    const len = Math.sqrt(dx * dx + dy * dy)
                    const tToMirror = (mirrorX - objTipX) / (dx / len || 0.001)
                    const ray3HitY = objTipY + (dy / len) * Math.min(tToMirror, 600)
                    const ray3HitX = getMirrorX(ray3HitY)

                    drawRay(objTipX, objTipY, ray3HitX, ray3HitY, false, 'rgba(255, 200, 80, 0.8)')
                    // Reflects back along same path
                    if (mirrorType === 'concave' && isReal) {
                        drawRay(ray3HitX, ray3HitY, ray3HitX - (ray3HitX - objTipX) * 3, ray3HitY - (ray3HitY - objTipY) * 3, false, 'rgba(255, 200, 80, 0.8)')
                    } else {
                        drawRay(ray3HitX, ray3HitY, objTipX - 300, objTipY - (dy / len) * -300, false, 'rgba(255, 200, 80, 0.8)')
                        // Virtual behind
                        drawRay(ray3HitX, ray3HitY, ray3HitX + (ray3HitX - objTipX) * 2, ray3HitY + (ray3HitY - objTipY) * 2, true, 'rgba(255, 200, 80, 0.4)')
                    }
                }
            } else {
                // Flat mirror: simple reflection
                if (showRay1) {
                    drawRay(objTipX, objTipY, mirrorX, objTipY, false, 'rgba(255, 100, 100, 0.8)')
                    drawRay(mirrorX, objTipY, mirrorX - 400, objTipY, false, 'rgba(255, 100, 100, 0.8)')
                    drawRay(mirrorX, objTipY, mirrorX + 200, objTipY, true, 'rgba(255, 100, 100, 0.4)')
                }
                if (showRay2) {
                    const angle = Math.atan2(objectHeight, objectDist)
                    drawRay(objTipX, objTipY, mirrorX, axisY, false, 'rgba(100, 200, 255, 0.8)')
                    drawRay(mirrorX, axisY, mirrorX - 400, axisY - Math.tan(angle) * 400, false, 'rgba(100, 200, 255, 0.8)')
                    drawRay(mirrorX, axisY, mirrorX + 200, axisY + Math.tan(angle) * 200, true, 'rgba(100, 200, 255, 0.4)')
                }
            }

            // Image arrow
            if (showImage && mirrorType !== 'flat') {
                const imgTopY = axisY - imgH
                ctx.strokeStyle = isReal ? 'rgba(255, 150, 50, 0.8)' : 'rgba(255, 150, 50, 0.5)'
                ctx.lineWidth = 3
                if (!isReal) ctx.setLineDash([6, 4])
                ctx.beginPath()
                ctx.moveTo(imgX, axisY)
                ctx.lineTo(imgX, imgTopY)
                ctx.stroke()
                ctx.setLineDash([])
                // Arrowhead
                ctx.fillStyle = isReal ? 'rgba(255, 150, 50, 0.8)' : 'rgba(255, 150, 50, 0.5)'
                const arrowDir = imgH > 0 ? -1 : 1
                ctx.beginPath()
                ctx.moveTo(imgX, imgTopY)
                ctx.lineTo(imgX - 6, imgTopY + arrowDir * 12)
                ctx.lineTo(imgX + 6, imgTopY + arrowDir * 12)
                ctx.closePath()
                ctx.fill()
                if (showLabels) {
                    ctx.fillStyle = 'rgba(255, 150, 50, 0.7)'
                    ctx.font = '12px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText(isReal ? 'Real Image' : 'Virtual Image', imgX, axisY + 20)
                }
            } else if (showImage && mirrorType === 'flat') {
                // Flat mirror: virtual image behind
                const flatImgX = mirrorX + objectDist
                ctx.strokeStyle = 'rgba(255, 150, 50, 0.5)'
                ctx.lineWidth = 3
                ctx.setLineDash([6, 4])
                ctx.beginPath()
                ctx.moveTo(flatImgX, axisY)
                ctx.lineTo(flatImgX, axisY - objectHeight)
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(255, 150, 50, 0.5)'
                ctx.beginPath()
                ctx.moveTo(flatImgX, axisY - objectHeight)
                ctx.lineTo(flatImgX - 6, axisY - objectHeight + 12)
                ctx.lineTo(flatImgX + 6, axisY - objectHeight + 12)
                ctx.closePath()
                ctx.fill()
                if (showLabels) {
                    ctx.fillStyle = 'rgba(255, 150, 50, 0.7)'
                    ctx.font = '12px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('Virtual Image', flatImgX, axisY + 20)
                }
            }

            // Mirror vertex label
            if (showLabels) {
                ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                ctx.font = 'bold 13px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('V', mirrorX, axisY + 22)
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [mirrorType, radiusCurvature, objectDist, objectHeight, showRay1, showRay2, showRay3, showImage, showLabels, calcMirror])

    const mirror = calcMirror()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 13" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Mirror Optics"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'd_o', value: objectDist.toFixed(0), unit: 'px' },
                                { label: 'd_i', value: mirror.di.toFixed(1), unit: 'px', color: mirror.isReal ? 'rgb(255, 150, 50)' : 'rgb(255, 200, 100)' },
                                { label: 'f', value: mirrorType === 'flat' ? '∞' : mirror.f.toFixed(0), unit: mirrorType === 'flat' ? '' : 'px', color: 'rgb(255, 200, 80)' },
                                { label: 'M', value: mirrorType === 'flat' ? '1.00' : mirror.magnification.toFixed(2), color: 'rgb(160, 100, 255)' },
                                { label: 'Image', value: mirrorType === 'flat' ? 'Virtual, Upright' : `${mirror.isReal ? 'Real' : 'Virtual'}, ${mirror.isUpright ? 'Upright' : 'Inverted'}`, color: mirror.isReal ? 'rgb(100, 255, 150)' : 'rgb(255, 200, 100)' },
                                { label: 'Size', value: mirrorType === 'flat' ? 'Same size' : (mirror.isMagnified ? 'Magnified' : 'Diminished') },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Mirror Eq', expression: '1/f = 1/do + 1/di', description: 'Relates focal length to object and image distance' },
                                { label: 'Focal Length', expression: 'f = R / 2', description: 'Half the radius of curvature' },
                                { label: 'Magnification', expression: 'M = -di / do = hi / ho' },
                                { label: 'Reflection', expression: 'theta_i = theta_r' },
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
                        <ControlGroup label="Mirror Type">
                            <ButtonGroup
                                value={mirrorType}
                                onChange={setMirrorType}
                                options={[
                                    { value: 'concave', label: 'Concave' },
                                    { value: 'convex', label: 'Convex' },
                                    { value: 'flat', label: 'Flat' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Radius of Curvature">
                            <Slider value={radiusCurvature} onChange={setRadiusCurvature} min={100} max={500} step={10} label={`R = ${radiusCurvature} px`} />
                        </ControlGroup>

                        <ControlGroup label="Object Distance">
                            <Slider value={objectDist} onChange={setObjectDist} min={30} max={400} step={5} label={`do = ${objectDist} px`} />
                        </ControlGroup>

                        <ControlGroup label="Object Height">
                            <Slider value={objectHeight} onChange={setObjectHeight} min={20} max={120} step={5} label={`h = ${objectHeight} px`} />
                        </ControlGroup>

                        <Toggle value={showRay1} onChange={setShowRay1} label="Ray 1: Parallel" />
                        <Toggle value={showRay2} onChange={setShowRay2} label="Ray 2: Through F" />
                        <Toggle value={showRay3} onChange={setShowRay3} label="Ray 3: Through C" />
                        <Toggle value={showImage} onChange={setShowImage} label="Show Image" />
                        <Toggle value={showLabels} onChange={setShowLabels} label="Show Labels" />
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
