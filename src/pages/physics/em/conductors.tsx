import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

type ConductorShape = 'sphere' | 'ellipse' | 'pointed'
type ViewMode = 'single' | 'faraday' | 'two-sphere'

const k = 8.99e9

export default function Conductors() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [shape, setShape] = useState<string>('sphere')
    const [viewMode, setViewMode] = useState<string>('single')
    const [totalCharge, setTotalCharge] = useState(20) // nC
    const [externalField, setExternalField] = useState(false)
    const [showEField, setShowEField] = useState(true)
    const [showChargeDensity, setShowChargeDensity] = useState(true)
    const [radiusRatio, setRadiusRatio] = useState(2.0)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)

    const calcPhysics = useCallback(() => {
        const Q = totalCharge * 1e-9
        const R = 0.1 // base radius in meters
        const V = k * Q / R
        const sigma = Q / (4 * Math.PI * R * R)
        const Esurface = sigma / 8.854e-12

        // Two-sphere mode
        const R1 = R
        const R2 = R / radiusRatio
        const Q1 = Q * R1 / (R1 + R2)
        const Q2 = Q * R2 / (R1 + R2)
        const sigma1 = Q1 / (4 * Math.PI * R1 * R1)
        const sigma2 = Q2 / (4 * Math.PI * R2 * R2)

        return { V, sigma, Esurface, Q1: Q1 * 1e9, Q2: Q2 * 1e9, sigma1, sigma2 }
    }, [totalCharge, radiusRatio])

    const reset = useCallback(() => {
        setShape('sphere')
        setViewMode('single')
        setTotalCharge(20)
        setExternalField(false)
        setShowEField(true)
        setShowChargeDensity(true)
        setRadiusRatio(2.0)
        setPaused(false)
        timeRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'Conductors in Equilibrium', description: 'In electrostatic equilibrium, free charges in a conductor have redistributed themselves so there is no net motion. Several remarkable properties emerge from this simple condition.', setup: () => { reset() } },
        { title: 'E = 0 Inside', description: 'The electric field inside a conductor is exactly zero in equilibrium. If it were not, free charges would move until they cancelled it. Watch the field arrows vanish inside.', setup: () => { setShape('sphere'); setViewMode('single'); setShowEField(true); setTotalCharge(20) } },
        { title: 'Charge on Surface Only', description: 'All excess charge resides on the surface of the conductor. A Gaussian surface inside encloses zero net charge since E=0 inside, so by Gauss\'s law, Q_enclosed = 0.', setup: () => { setShowChargeDensity(true); setShowEField(false) } },
        { title: 'E Perpendicular to Surface', description: 'At the surface, E must be perpendicular. Any tangential component would push charges along the surface until it vanished. The magnitude is E = sigma/epsilon_0.', setup: () => { setShowEField(true); setShowChargeDensity(true) } },
        { title: 'Sharp Points — High Charge Density', description: 'Charge density is highest where curvature is greatest (sharp points). sigma is proportional to 1/R. This is why lightning rods work — they concentrate charge at their tips.', setup: () => { setShape('pointed'); setShowChargeDensity(true); setShowEField(true) } },
        { title: 'Faraday Cage', description: 'An external field causes charges on the conductor to rearrange, perfectly cancelling the field inside. This is the Faraday cage effect — the interior is shielded from external fields.', setup: () => { setShape('sphere'); setViewMode('faraday'); setExternalField(true); setShowEField(true) } },
        { title: 'Charge Redistribution', description: 'When two conducting spheres are connected by a wire, charge flows until they reach the same potential. Since V = kQ/R, the charge distributes as Q1/Q2 = R1/R2. The smaller sphere gets less charge but higher surface charge density.', setup: () => { setViewMode('two-sphere'); setRadiusRatio(2.0); setShowChargeDensity(true) } },
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

            const cx = w * 0.45
            const cy = h * 0.5
            const baseR = Math.min(w, h) * 0.18
            const mode = viewMode as ViewMode
            const shapeType = shape as ConductorShape

            // Background grid
            ctx.strokeStyle = 'rgba(255,255,255,0.03)'
            ctx.lineWidth = 1
            for (let gx = 0; gx < w; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke() }
            for (let gy = 0; gy < h; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke() }

            const drawConductorShape = (x: number, y: number, r: number, shp: ConductorShape) => {
                ctx.fillStyle = 'rgba(160, 100, 255, 0.08)'
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
                ctx.lineWidth = 2.5

                if (shp === 'sphere') {
                    ctx.beginPath()
                    ctx.arc(x, y, r, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.stroke()
                } else if (shp === 'ellipse') {
                    ctx.beginPath()
                    ctx.ellipse(x, y, r * 1.4, r * 0.7, 0, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.stroke()
                } else {
                    // Pointed conductor (teardrop)
                    ctx.beginPath()
                    ctx.moveTo(x + r * 1.8, y)
                    for (let a = 0; a <= Math.PI * 2; a += 0.05) {
                        const rr = r * (1 + 0.5 * Math.cos(a))
                        const px = x + rr * Math.cos(a)
                        const py = y + rr * Math.sin(a)
                        if (a === 0) ctx.moveTo(px, py)
                        else ctx.lineTo(px, py)
                    }
                    ctx.closePath()
                    ctx.fill()
                    ctx.stroke()
                }

                // Interior label: E = 0
                ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
                ctx.font = 'bold 14px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('E = 0', x, y + 5)
            }

            // Surface charge distribution
            const drawSurfaceCharges = (x: number, y: number, r: number, shp: ConductorShape, q: number) => {
                if (!showChargeDensity) return
                const nCharges = 36
                for (let i = 0; i < nCharges; i++) {
                    const angle = (2 * Math.PI * i) / nCharges
                    let sr: number
                    let density: number

                    if (shp === 'sphere') {
                        sr = r
                        density = 1.0
                    } else if (shp === 'ellipse') {
                        sr = (r * 1.4 * r * 0.7) / Math.sqrt(Math.pow(r * 0.7 * Math.cos(angle), 2) + Math.pow(r * 1.4 * Math.sin(angle), 2))
                        const curvature = Math.pow(Math.pow(r * 0.7 * Math.cos(angle), 2) + Math.pow(r * 1.4 * Math.sin(angle), 2), 0.5)
                        density = (r * 1.4 * r * 0.7) / (curvature * curvature) * 0.5
                    } else {
                        const rr = r * (1 + 0.5 * Math.cos(angle))
                        sr = rr
                        // Higher density at the pointed end (angle ~ 0)
                        density = 0.5 + 1.5 * Math.max(0, Math.cos(angle))
                    }

                    const px = x + sr * Math.cos(angle)
                    const py = y + sr * Math.sin(angle)
                    const chargeSize = Math.max(2, Math.min(7, density * 4)) * (q > 0 ? 1 : 0.8)
                    const alpha = Math.min(1, 0.3 + density * 0.5)

                    ctx.fillStyle = q > 0 ? `rgba(255, 120, 120, ${alpha})` : `rgba(120, 120, 255, ${alpha})`
                    ctx.beginPath()
                    ctx.arc(px, py, chargeSize, 0, Math.PI * 2)
                    ctx.fill()

                    // + or - sign
                    ctx.fillStyle = 'rgba(255,255,255,0.8)'
                    ctx.font = `bold ${Math.max(8, chargeSize * 2)}px system-ui`
                    ctx.textAlign = 'center'
                    ctx.fillText(q > 0 ? '+' : '-', px, py + chargeSize * 0.6)
                }
            }

            // E-field arrows from surface
            const drawEFieldArrows = (x: number, y: number, r: number, shp: ConductorShape) => {
                if (!showEField) return
                const nArrows = 20
                for (let i = 0; i < nArrows; i++) {
                    const angle = (2 * Math.PI * i) / nArrows
                    let sr: number
                    let density: number

                    if (shp === 'sphere') {
                        sr = r
                        density = 1.0
                    } else if (shp === 'ellipse') {
                        sr = (r * 1.4 * r * 0.7) / Math.sqrt(Math.pow(r * 0.7 * Math.cos(angle), 2) + Math.pow(r * 1.4 * Math.sin(angle), 2))
                        density = 0.8
                    } else {
                        sr = r * (1 + 0.5 * Math.cos(angle))
                        density = 0.5 + 1.5 * Math.max(0, Math.cos(angle))
                    }

                    const startX = x + sr * Math.cos(angle)
                    const startY = y + sr * Math.sin(angle)
                    const arrowLen = 15 + density * 30
                    const endX = startX + arrowLen * Math.cos(angle)
                    const endY = startY + arrowLen * Math.sin(angle)
                    const alpha = 0.3 + density * 0.4

                    ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`
                    ctx.lineWidth = 1.5 + density
                    ctx.beginPath()
                    ctx.moveTo(startX, startY)
                    ctx.lineTo(endX, endY)
                    ctx.stroke()

                    ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`
                    ctx.beginPath()
                    ctx.moveTo(endX, endY)
                    ctx.lineTo(endX - 6 * Math.cos(angle - 0.4), endY - 6 * Math.sin(angle - 0.4))
                    ctx.lineTo(endX - 6 * Math.cos(angle + 0.4), endY - 6 * Math.sin(angle + 0.4))
                    ctx.closePath()
                    ctx.fill()
                }
            }

            if (mode === 'single') {
                drawConductorShape(cx, cy, baseR, shapeType)
                drawSurfaceCharges(cx, cy, baseR, shapeType, totalCharge)
                drawEFieldArrows(cx, cy, baseR, shapeType)

                // Label
                ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`Q = ${totalCharge} nC`, cx, cy + baseR + 30)

            } else if (mode === 'faraday') {
                // External field lines (horizontal)
                if (externalField) {
                    for (let fy = -5; fy <= 5; fy++) {
                        const ly = cy + fy * 35
                        // Check if line would pass through conductor
                        const distFromCenter = Math.abs(ly - cy)
                        const insideConductor = distFromCenter < baseR

                        if (insideConductor) {
                            // Lines bend around conductor
                            ctx.strokeStyle = 'rgba(255, 200, 100, 0.25)'
                            ctx.lineWidth = 1
                            // Left segment
                            ctx.beginPath()
                            ctx.moveTo(20, ly)
                            ctx.lineTo(cx - baseR - 20, ly)
                            ctx.stroke()
                            // Right segment
                            ctx.beginPath()
                            ctx.moveTo(cx + baseR + 20, ly)
                            ctx.lineTo(w * 0.85, ly)
                            ctx.stroke()
                            // Bending around
                            const bendAngle = Math.asin(Math.min(1, (ly - cy) / baseR))
                            ctx.beginPath()
                            ctx.arc(cx, cy, baseR + 20, Math.PI - bendAngle, Math.PI + bendAngle, true)
                            ctx.stroke()
                            ctx.beginPath()
                            ctx.arc(cx, cy, baseR + 20, -bendAngle, bendAngle)
                            ctx.stroke()
                        } else {
                            // Straight lines
                            ctx.strokeStyle = 'rgba(255, 200, 100, 0.15)'
                            ctx.lineWidth = 1
                            ctx.beginPath()
                            ctx.moveTo(20, ly)
                            ctx.lineTo(w * 0.85, ly)
                            ctx.stroke()
                            // Arrow
                            ctx.fillStyle = 'rgba(255, 200, 100, 0.15)'
                            ctx.beginPath()
                            ctx.moveTo(w * 0.5, ly)
                            ctx.lineTo(w * 0.5 - 5, ly - 3)
                            ctx.lineTo(w * 0.5 - 5, ly + 3)
                            ctx.closePath()
                            ctx.fill()
                        }
                    }

                    ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('External E-field', w * 0.5, 30)
                }

                drawConductorShape(cx, cy, baseR, 'sphere')

                // Induced charges
                if (externalField && showChargeDensity) {
                    // Negative charges on left (facing field)
                    for (let i = 0; i < 8; i++) {
                        const angle = Math.PI * 0.6 + (Math.PI * 0.8 * i) / 7
                        const px = cx + baseR * Math.cos(angle)
                        const py = cy + baseR * Math.sin(angle)
                        ctx.fillStyle = 'rgba(120, 120, 255, 0.8)'
                        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill()
                        ctx.fillStyle = 'rgba(255,255,255,0.8)'
                        ctx.font = 'bold 8px system-ui'; ctx.textAlign = 'center'
                        ctx.fillText('-', px, py + 3)
                    }
                    // Positive charges on right
                    for (let i = 0; i < 8; i++) {
                        const angle = -Math.PI * 0.4 + (Math.PI * 0.8 * i) / 7
                        const px = cx + baseR * Math.cos(angle)
                        const py = cy + baseR * Math.sin(angle)
                        ctx.fillStyle = 'rgba(255, 120, 120, 0.8)'
                        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill()
                        ctx.fillStyle = 'rgba(255,255,255,0.8)'
                        ctx.font = 'bold 8px system-ui'; ctx.textAlign = 'center'
                        ctx.fillText('+', px, py + 3)
                    }
                }

                // Show E=0 inside prominently
                const pulse = 0.5 + 0.3 * Math.sin(t * 2)
                ctx.fillStyle = `rgba(100, 255, 150, ${pulse})`
                ctx.font = 'bold 16px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('E = 0 (shielded)', cx, cy + 5)

            } else if (mode === 'two-sphere') {
                const R1 = baseR
                const R2 = baseR / radiusRatio
                const spacing = R1 + R2 + 80

                const x1 = cx - spacing * 0.3
                const x2 = cx + spacing * 0.7

                // Wire connecting them
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(x1 + R1, cy)
                ctx.lineTo(x2 - R2, cy)
                ctx.stroke()
                // Wire label
                ctx.fillStyle = 'rgba(200, 200, 200, 0.5)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('conducting wire', (x1 + R1 + x2 - R2) / 2, cy - 10)

                // Sphere 1
                ctx.fillStyle = 'rgba(160, 100, 255, 0.08)'
                ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
                ctx.lineWidth = 2.5
                ctx.beginPath(); ctx.arc(x1, cy, R1, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

                // Sphere 2
                ctx.beginPath(); ctx.arc(x2, cy, R2, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

                // E=0 inside
                ctx.fillStyle = 'rgba(255,255,255,0.2)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('E = 0', x1, cy + 4)
                ctx.fillText('E = 0', x2, cy + 4)

                // Charge distribution based on radii
                const physics = calcPhysics()

                // Charges on sphere 1
                if (showChargeDensity) {
                    const n1 = 16
                    for (let i = 0; i < n1; i++) {
                        const angle = (2 * Math.PI * i) / n1
                        const px = x1 + R1 * Math.cos(angle)
                        const py = cy + R1 * Math.sin(angle)
                        ctx.fillStyle = 'rgba(255, 120, 120, 0.5)'
                        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill()
                    }
                    const n2 = Math.max(8, Math.round(16 / radiusRatio))
                    for (let i = 0; i < n2; i++) {
                        const angle = (2 * Math.PI * i) / n2
                        const px = x2 + R2 * Math.cos(angle)
                        const py = cy + R2 * Math.sin(angle)
                        // Higher density on smaller sphere
                        ctx.fillStyle = 'rgba(255, 120, 120, 0.8)'
                        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill()
                    }
                }

                // E-field arrows
                if (showEField) {
                    const nArr = 12
                    for (let i = 0; i < nArr; i++) {
                        const angle = (2 * Math.PI * i) / nArr
                        // Sphere 1
                        const s1x = x1 + R1 * Math.cos(angle)
                        const s1y = cy + R1 * Math.sin(angle)
                        const len1 = 25
                        ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)'
                        ctx.lineWidth = 1.5
                        ctx.beginPath()
                        ctx.moveTo(s1x, s1y)
                        ctx.lineTo(s1x + len1 * Math.cos(angle), s1y + len1 * Math.sin(angle))
                        ctx.stroke()

                        // Sphere 2 — stronger field (higher sigma)
                        const s2x = x2 + R2 * Math.cos(angle)
                        const s2y = cy + R2 * Math.sin(angle)
                        const len2 = 25 * radiusRatio
                        ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)'
                        ctx.lineWidth = 2
                        ctx.beginPath()
                        ctx.moveTo(s2x, s2y)
                        ctx.lineTo(s2x + len2 * Math.cos(angle), s2y + len2 * Math.sin(angle))
                        ctx.stroke()
                        // Arrowhead
                        const ex = s2x + len2 * Math.cos(angle)
                        const ey = s2y + len2 * Math.sin(angle)
                        ctx.fillStyle = 'rgba(100, 200, 255, 0.5)'
                        ctx.beginPath()
                        ctx.moveTo(ex, ey)
                        ctx.lineTo(ex - 5 * Math.cos(angle - 0.4), ey - 5 * Math.sin(angle - 0.4))
                        ctx.lineTo(ex - 5 * Math.cos(angle + 0.4), ey - 5 * Math.sin(angle + 0.4))
                        ctx.closePath()
                        ctx.fill()
                    }
                }

                // Labels
                ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                ctx.font = '12px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`R1 (large)`, x1, cy + R1 + 25)
                ctx.fillText(`Q1 = ${physics.Q1.toFixed(1)} nC`, x1, cy + R1 + 40)

                ctx.fillText(`R2 = R1/${radiusRatio.toFixed(1)}`, x2, cy + R2 + 25)
                ctx.fillText(`Q2 = ${physics.Q2.toFixed(1)} nC`, x2, cy + R2 + 40)

                // Same potential label
                const pulse = 0.5 + 0.3 * Math.sin(t * 2)
                ctx.fillStyle = `rgba(100, 255, 150, ${pulse})`
                ctx.font = 'bold 13px system-ui'
                ctx.fillText('V1 = V2 (same potential)', (x1 + x2) / 2, cy - Math.max(R1, R2) - 30)

                ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'
                ctx.font = '11px system-ui'
                ctx.fillText('sigma_2 > sigma_1 (smaller sphere, higher density)', (x1 + x2) / 2, cy + Math.max(R1, R2) + 65)
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [shape, viewMode, totalCharge, externalField, showEField, showChargeDensity, radiusRatio, paused, calcPhysics])

    const physics = calcPhysics()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics C: E&M" unit="Unit 2" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="Conductor Properties"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'Surface sigma', value: physics.sigma.toExponential(2), unit: 'C/m^2' },
                                { label: 'E at surface', value: physics.Esurface.toExponential(2), unit: 'N/C', color: 'rgb(100, 200, 255)' },
                                { label: 'Potential V', value: physics.V.toExponential(2), unit: 'V', color: 'rgb(100, 255, 150)' },
                                ...(viewMode === 'two-sphere' ? [
                                    { label: 'Q1', value: physics.Q1.toFixed(1), unit: 'nC', color: 'rgb(255, 150, 150)' },
                                    { label: 'Q2', value: physics.Q2.toFixed(1), unit: 'nC', color: 'rgb(255, 150, 150)' },
                                ] : []),
                                { label: 'E inside', value: '0', unit: 'N/C', color: 'rgb(100, 255, 150)' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Inside', expression: 'E_inside = 0', description: 'Electrostatic equilibrium' },
                                { label: 'Surface', expression: 'E_surface = sigma / epsilon_0', description: 'Perpendicular to surface' },
                                { label: 'Potential', expression: 'V = kQ / R', description: 'Constant on conductor' },
                                { label: 'Redistribution', expression: 'Q1/R1 = Q2/R2', description: 'Connected spheres' },
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
                        <ControlGroup label="View Mode">
                            <ButtonGroup
                                value={viewMode}
                                onChange={setViewMode}
                                options={[
                                    { value: 'single', label: 'Single' },
                                    { value: 'faraday', label: 'Faraday' },
                                    { value: 'two-sphere', label: '2 Spheres' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        {viewMode === 'single' && (
                            <ControlGroup label="Conductor Shape">
                                <ButtonGroup
                                    value={shape}
                                    onChange={setShape}
                                    options={[
                                        { value: 'sphere', label: 'Sphere' },
                                        { value: 'ellipse', label: 'Ellipse' },
                                        { value: 'pointed', label: 'Pointed' },
                                    ]}
                                    color="rgb(160, 100, 255)"
                                />
                            </ControlGroup>
                        )}

                        <ControlGroup label="Total Charge">
                            <Slider value={totalCharge} onChange={setTotalCharge} min={1} max={50} step={1} label={`Q = ${totalCharge} nC`} />
                        </ControlGroup>

                        {viewMode === 'two-sphere' && (
                            <ControlGroup label="Radius Ratio (R1/R2)">
                                <Slider value={radiusRatio} onChange={setRadiusRatio} min={1} max={5} step={0.1} label={`R1/R2 = ${radiusRatio.toFixed(1)}`} />
                            </ControlGroup>
                        )}

                        {viewMode === 'faraday' && (
                            <Toggle value={externalField} onChange={setExternalField} label="External E-Field" />
                        )}

                        <Toggle value={showEField} onChange={setShowEField} label="Show E-Field Arrows" />
                        <Toggle value={showChargeDensity} onChange={setShowChargeDensity} label="Show Charge Density" />
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
