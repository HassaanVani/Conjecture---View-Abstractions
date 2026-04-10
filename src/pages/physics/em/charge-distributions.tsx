import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

type DistributionType = 'line' | 'ring' | 'disk' | 'plane'

const k = 8.99e9
const epsilon0 = 8.854e-12

export default function ChargeDistributions() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [distType, setDistType] = useState<string>('line')
    const [totalCharge, setTotalCharge] = useState(10) // nC
    const [dimension, setDimension] = useState(0.5) // m (length or radius)
    const [obsDistance, setObsDistance] = useState(0.3) // m
    const [numElements, setNumElements] = useState(12)
    const [showIndividualDE, setShowIndividualDE] = useState(true)
    const [showResultantE, setShowResultantE] = useState(true)
    const [paused, setPaused] = useState(false)
    const timeRef = useRef(0)
    const highlightRef = useRef(0)

    const calcAnalytical = useCallback(() => {
        const Q = totalCharge * 1e-9
        const x = obsDistance
        const type = distType as DistributionType

        if (type === 'line') {
            const L = dimension
            const lambda = Q / L
            const E = (2 * k * lambda) / x
            return { E, density: `${(lambda * 1e9).toFixed(2)} nC/m`, densityLabel: 'lambda' }
        } else if (type === 'ring') {
            const R = dimension
            const E = (k * Q * x) / Math.pow(x * x + R * R, 1.5)
            const lambda = Q / (2 * Math.PI * R)
            return { E, density: `${(lambda * 1e9).toFixed(2)} nC/m`, densityLabel: 'lambda' }
        } else if (type === 'disk') {
            const R = dimension
            const sigma = Q / (Math.PI * R * R)
            const E = (sigma / (2 * epsilon0)) * (1 - x / Math.sqrt(x * x + R * R))
            return { E, density: `${(sigma * 1e9).toFixed(2)} nC/m^2`, densityLabel: 'sigma' }
        } else {
            const sigma = Q / (Math.PI * dimension * dimension)
            const E = sigma / (2 * epsilon0)
            return { E, density: `${(sigma * 1e9).toFixed(2)} nC/m^2`, densityLabel: 'sigma' }
        }
    }, [totalCharge, dimension, obsDistance, distType])

    const calcNumerical = useCallback(() => {
        const Q = totalCharge * 1e-9
        const x = obsDistance
        const N = numElements
        const type = distType as DistributionType
        let Ex = 0, Ey = 0

        if (type === 'line') {
            const L = dimension
            const dq = Q / N
            for (let i = 0; i < N; i++) {
                const y = -L / 2 + (i + 0.5) * (L / N)
                const r2 = x * x + y * y
                const r = Math.sqrt(r2)
                Ex += k * dq * x / (r2 * r)
                Ey += k * dq * (-y) / (r2 * r)
            }
        } else if (type === 'ring') {
            const R = dimension
            const dq = Q / N
            for (let i = 0; i < N; i++) {
                const r2 = x * x + R * R
                const r = Math.sqrt(r2)
                Ex += k * dq * x / (r2 * r)
            }
        } else if (type === 'disk') {
            const R = dimension
            const rings = N
            const dq = Q / rings
            for (let i = 0; i < rings; i++) {
                const ri = (i + 0.5) * R / rings
                const r2 = x * x + ri * ri
                const r = Math.sqrt(r2)
                Ex += k * dq * x / (r2 * r)
            }
        } else {
            const sigma = Q / (Math.PI * dimension * dimension)
            Ex = sigma / (2 * epsilon0)
        }

        return { Ex, Ey, Emag: Math.sqrt(Ex * Ex + Ey * Ey) }
    }, [totalCharge, dimension, obsDistance, numElements, distType])

    const reset = useCallback(() => {
        setDistType('line')
        setTotalCharge(10)
        setDimension(0.5)
        setObsDistance(0.3)
        setNumElements(12)
        setShowIndividualDE(true)
        setShowResultantE(true)
        setPaused(false)
        timeRef.current = 0
        highlightRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'Continuous Distributions', description: 'Real charge distributions are continuous, not point charges. We compute the E-field by breaking the distribution into infinitesimal dQ elements and integrating their contributions using superposition.', setup: () => { reset() } },
        { title: 'Line Charge', description: 'A uniform line charge with linear charge density lambda = Q/L. The E-field at distance r from an infinite line: E = 2k*lambda/r. Perpendicular components cancel by symmetry.', setup: () => { setDistType('line'); setNumElements(20); setShowIndividualDE(true) } },
        { title: 'Ring on Axis', description: 'For a ring of charge, the E-field on the axis points along the axis. All perpendicular components cancel by symmetry: E = kQx/(x^2+R^2)^(3/2).', setup: () => { setDistType('ring'); setNumElements(16); setDimension(0.4) } },
        { title: 'Disk Approaches Infinite Plane', description: 'A disk is a collection of concentric rings. As the disk radius grows much larger than the observation distance, E approaches sigma/(2*epsilon_0) - the infinite plane result.', setup: () => { setDistType('disk'); setDimension(0.8); setNumElements(20) } },
        { title: 'Integration Convergence', description: 'Watch how increasing the number of integration elements makes the numerical result converge to the analytical answer. More elements = better approximation.', setup: () => { setDistType('line'); setNumElements(4); setShowIndividualDE(true); setShowResultantE(true) } },
        { title: 'Symmetry Simplifies Integrals', description: 'Symmetry is your best friend. For a ring, all dE_perp cancel. For a disk, azimuthal components cancel. Identifying symmetry before integrating saves enormous effort.', setup: () => { setDistType('ring'); setNumElements(8); setShowIndividualDE(true) } },
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

            // Coordinate system
            const cx = w * 0.4
            const cy = h * 0.5
            const pxPerM = Math.min(w, h) * 0.6 // pixels per meter

            // Grid
            ctx.strokeStyle = 'rgba(255,255,255,0.04)'
            ctx.lineWidth = 1
            for (let gx = cx % 50; gx < w; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke() }
            for (let gy = cy % 50; gy < h; gy += 50) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke() }

            const type = distType as DistributionType
            const N = numElements

            // Highlight cycling for integration animation
            highlightRef.current = Math.floor(t * 3) % N

            // Draw the charge distribution
            const drawCharge = () => {
                if (type === 'line') {
                    const L = dimension * pxPerM
                    // Draw line
                    ctx.strokeStyle = 'rgba(160, 100, 255, 0.6)'
                    ctx.lineWidth = 4
                    ctx.beginPath()
                    ctx.moveTo(cx, cy - L / 2)
                    ctx.lineTo(cx, cy + L / 2)
                    ctx.stroke()

                    // Draw dQ elements
                    const dL = L / N
                    for (let i = 0; i < N; i++) {
                        const y = cy - L / 2 + (i + 0.5) * dL
                        const isHighlighted = i === highlightRef.current
                        const baseAlpha = isHighlighted ? 1.0 : 0.5
                        ctx.fillStyle = isHighlighted ? 'rgba(255, 200, 100, 1)' : `rgba(160, 100, 255, ${baseAlpha})`
                        ctx.beginPath()
                        ctx.arc(cx, y, isHighlighted ? 6 : 4, 0, Math.PI * 2)
                        ctx.fill()

                        if (isHighlighted) {
                            ctx.fillStyle = 'rgba(255, 200, 100, 0.15)'
                            ctx.beginPath()
                            ctx.arc(cx, y, 15, 0, Math.PI * 2)
                            ctx.fill()
                            ctx.fillStyle = 'rgba(255, 200, 100, 0.8)'
                            ctx.font = '10px system-ui'
                            ctx.textAlign = 'right'
                            ctx.fillText('dQ', cx - 12, y + 3)
                        }

                        // Individual dE arrows
                        if (showIndividualDE) {
                            const obsX = cx + obsDistance * pxPerM
                            const obsY = cy
                            const dy = y - obsY
                            const dx = obsX - cx
                            const dist = Math.sqrt(dx * dx + dy * dy)
                            const dEx = dx / dist
                            const dEy = -dy / dist
                            const arrowScale = 35 / N
                            const alpha = isHighlighted ? 0.9 : 0.25
                            ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`
                            ctx.lineWidth = isHighlighted ? 2 : 1
                            ctx.beginPath()
                            ctx.moveTo(obsX, obsY)
                            ctx.lineTo(obsX + dEx * arrowScale * pxPerM, obsY + dEy * arrowScale * pxPerM)
                            ctx.stroke()
                            // Arrowhead
                            const ax = obsX + dEx * arrowScale * pxPerM
                            const ay = obsY + dEy * arrowScale * pxPerM
                            const angle = Math.atan2(dEy, dEx)
                            ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`
                            ctx.beginPath()
                            ctx.moveTo(ax, ay)
                            ctx.lineTo(ax - 6 * Math.cos(angle - 0.4), ay - 6 * Math.sin(angle - 0.4))
                            ctx.lineTo(ax - 6 * Math.cos(angle + 0.4), ay - 6 * Math.sin(angle + 0.4))
                            ctx.closePath()
                            ctx.fill()
                        }
                    }
                } else if (type === 'ring') {
                    const R = dimension * pxPerM
                    // Draw ring as ellipse (3D perspective)
                    ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.ellipse(cx, cy, R * 0.3, R, 0, 0, Math.PI * 2)
                    ctx.stroke()

                    // dQ elements on ring
                    for (let i = 0; i < N; i++) {
                        const theta = (2 * Math.PI * i) / N
                        const ex = cx + R * 0.3 * Math.cos(theta)
                        const ey = cy + R * Math.sin(theta)
                        const isHighlighted = i === highlightRef.current
                        ctx.fillStyle = isHighlighted ? 'rgba(255, 200, 100, 1)' : 'rgba(160, 100, 255, 0.6)'
                        ctx.beginPath()
                        ctx.arc(ex, ey, isHighlighted ? 5 : 3, 0, Math.PI * 2)
                        ctx.fill()

                        if (showIndividualDE) {
                            const obsX = cx + obsDistance * pxPerM
                            // dE from ring element on axis: has x-component and perpendicular component
                            const distToObs = Math.sqrt(obsDistance * obsDistance + dimension * dimension)
                            const cosAlpha = obsDistance / distToObs
                            const sinAlpha = dimension * Math.sin(theta) / distToObs
                            const arrowScale = 30 / N
                            const alpha = isHighlighted ? 0.9 : 0.2
                            // x-component (along axis)
                            ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`
                            ctx.lineWidth = isHighlighted ? 2 : 1
                            ctx.beginPath()
                            ctx.moveTo(obsX, cy)
                            ctx.lineTo(obsX + cosAlpha * arrowScale * pxPerM, cy - sinAlpha * arrowScale * pxPerM)
                            ctx.stroke()
                            const ax = obsX + cosAlpha * arrowScale * pxPerM
                            const ay = cy - sinAlpha * arrowScale * pxPerM
                            const angle = Math.atan2(-sinAlpha, cosAlpha)
                            ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`
                            ctx.beginPath()
                            ctx.moveTo(ax, ay)
                            ctx.lineTo(ax - 5 * Math.cos(angle - 0.4), ay - 5 * Math.sin(angle - 0.4))
                            ctx.lineTo(ax - 5 * Math.cos(angle + 0.4), ay - 5 * Math.sin(angle + 0.4))
                            ctx.closePath()
                            ctx.fill()
                        }
                    }
                    // Axis line
                    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
                    ctx.setLineDash([4, 4])
                    ctx.beginPath()
                    ctx.moveTo(cx - 30, cy)
                    ctx.lineTo(cx + obsDistance * pxPerM + 60, cy)
                    ctx.stroke()
                    ctx.setLineDash([])
                } else if (type === 'disk') {
                    const R = dimension * pxPerM
                    // Draw concentric rings
                    for (let i = 0; i < N; i++) {
                        const ri = ((i + 0.5) / N) * R
                        const isHighlighted = i === highlightRef.current
                        ctx.strokeStyle = isHighlighted ? 'rgba(255, 200, 100, 0.9)' : 'rgba(160, 100, 255, 0.3)'
                        ctx.lineWidth = isHighlighted ? 3 : 1.5
                        ctx.beginPath()
                        ctx.ellipse(cx, cy, ri * 0.3, ri, 0, 0, Math.PI * 2)
                        ctx.stroke()

                        if (showIndividualDE && isHighlighted) {
                            const obsX = cx + obsDistance * pxPerM
                            const ringR = ((i + 0.5) / N) * dimension
                            const dist = Math.sqrt(obsDistance * obsDistance + ringR * ringR)
                            const cosA = obsDistance / dist
                            const arrowLen = 40
                            ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)'
                            ctx.lineWidth = 2
                            ctx.beginPath()
                            ctx.moveTo(obsX, cy)
                            ctx.lineTo(obsX + cosA * arrowLen, cy)
                            ctx.stroke()
                            ctx.fillStyle = 'rgba(100, 200, 255, 0.8)'
                            ctx.beginPath()
                            ctx.moveTo(obsX + cosA * arrowLen, cy)
                            ctx.lineTo(obsX + cosA * arrowLen - 6, cy - 3)
                            ctx.lineTo(obsX + cosA * arrowLen - 6, cy + 3)
                            ctx.closePath()
                            ctx.fill()
                        }
                    }
                    // Axis
                    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
                    ctx.setLineDash([4, 4])
                    ctx.beginPath()
                    ctx.moveTo(cx - 30, cy)
                    ctx.lineTo(cx + obsDistance * pxPerM + 60, cy)
                    ctx.stroke()
                    ctx.setLineDash([])
                } else {
                    // Infinite plane — draw as wide shaded rect
                    const planeW = w * 0.03
                    ctx.fillStyle = 'rgba(160, 100, 255, 0.15)'
                    ctx.fillRect(cx - planeW / 2, 20, planeW, h - 40)
                    ctx.strokeStyle = 'rgba(160, 100, 255, 0.5)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.moveTo(cx, 20)
                    ctx.lineTo(cx, h - 20)
                    ctx.stroke()

                    // + signs along plane
                    ctx.fillStyle = 'rgba(160, 100, 255, 0.7)'
                    ctx.font = '14px system-ui'
                    ctx.textAlign = 'center'
                    for (let py = 40; py < h - 40; py += 30) {
                        ctx.fillText('+', cx, py)
                    }

                    // E-field arrows on both sides
                    if (showIndividualDE) {
                        for (let py = 60; py < h - 60; py += 50) {
                            // Right
                            ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)'
                            ctx.lineWidth = 1.5
                            ctx.beginPath()
                            ctx.moveTo(cx + 20, py)
                            ctx.lineTo(cx + 70, py)
                            ctx.stroke()
                            ctx.fillStyle = 'rgba(100, 200, 255, 0.4)'
                            ctx.beginPath()
                            ctx.moveTo(cx + 70, py)
                            ctx.lineTo(cx + 64, py - 3)
                            ctx.lineTo(cx + 64, py + 3)
                            ctx.closePath()
                            ctx.fill()
                            // Left
                            ctx.beginPath()
                            ctx.moveTo(cx - 20, py)
                            ctx.lineTo(cx - 70, py)
                            ctx.stroke()
                            ctx.beginPath()
                            ctx.moveTo(cx - 70, py)
                            ctx.lineTo(cx - 64, py - 3)
                            ctx.lineTo(cx - 64, py + 3)
                            ctx.closePath()
                            ctx.fill()
                        }
                    }

                    ctx.fillStyle = 'rgba(255,255,255,0.5)'
                    ctx.font = '11px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('E = sigma / 2*epsilon_0 (uniform, independent of distance)', cx, h - 30)
                }
            }

            drawCharge()

            // Observation point
            if (type !== 'plane') {
                const obsX = cx + obsDistance * pxPerM
                const obsY = cy
                const obsGlow = ctx.createRadialGradient(obsX, obsY, 0, obsX, obsY, 20)
                obsGlow.addColorStop(0, 'rgba(100, 255, 150, 0.4)')
                obsGlow.addColorStop(1, 'transparent')
                ctx.fillStyle = obsGlow
                ctx.beginPath(); ctx.arc(obsX, obsY, 20, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(100, 255, 150, 0.9)'
                ctx.beginPath(); ctx.arc(obsX, obsY, 6, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = 'rgba(255,255,255,0.9)'
                ctx.font = 'bold 10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('P', obsX, obsY + 3)

                // Distance label
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'
                ctx.lineWidth = 1
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(cx, cy + (type === 'line' ? dimension * pxPerM / 2 + 20 : dimension * pxPerM + 20))
                ctx.lineTo(obsX, cy + (type === 'line' ? dimension * pxPerM / 2 + 20 : dimension * pxPerM + 20))
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '10px system-ui'
                ctx.textAlign = 'center'
                const labelY = cy + (type === 'line' ? dimension * pxPerM / 2 + 35 : dimension * pxPerM + 35)
                ctx.fillText(`x = ${obsDistance.toFixed(2)} m`, (cx + obsX) / 2, labelY)

                // Resultant E-field arrow at observation point
                if (showResultantE) {
                    const numerical = calcNumerical()
                    const Emag = numerical.Emag
                    const arrowLen = Math.min(80, Math.max(20, Math.log10(Emag + 1) * 15))
                    const angle = Math.atan2(numerical.Ey, numerical.Ex)

                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)'
                    ctx.lineWidth = 3
                    ctx.beginPath()
                    ctx.moveTo(obsX, obsY)
                    ctx.lineTo(obsX + arrowLen * Math.cos(angle), obsY + arrowLen * Math.sin(angle))
                    ctx.stroke()

                    const ax = obsX + arrowLen * Math.cos(angle)
                    const ay = obsY + arrowLen * Math.sin(angle)
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
                    ctx.beginPath()
                    ctx.moveTo(ax, ay)
                    ctx.lineTo(ax - 8 * Math.cos(angle - 0.4), ay - 8 * Math.sin(angle - 0.4))
                    ctx.lineTo(ax - 8 * Math.cos(angle + 0.4), ay - 8 * Math.sin(angle + 0.4))
                    ctx.closePath()
                    ctx.fill()

                    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
                    ctx.font = 'bold 11px system-ui'
                    ctx.textAlign = 'left'
                    ctx.fillText('E (resultant)', ax + 8, ay - 5)
                }
            }

            // Legend
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'left'
            if (showIndividualDE) {
                ctx.fillStyle = 'rgba(100, 200, 255, 0.7)'
                ctx.fillRect(20, h - 50, 12, 3)
                ctx.fillText('Individual dE contributions', 38, h - 47)
            }
            if (showResultantE) {
                ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
                ctx.fillRect(20, h - 35, 12, 3)
                ctx.fillText('Resultant E-field', 38, h - 32)
            }

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [distType, totalCharge, dimension, obsDistance, numElements, showIndividualDE, showResultantE, paused, calcNumerical])

    const analytical = calcAnalytical()
    const numerical = calcNumerical()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics C: E&M" unit="Unit 1" color="rgb(160, 100, 255)" />
                        <InfoPanel
                            title="E-Field Analysis"
                            departmentColor="rgb(160, 100, 255)"
                            items={[
                                { label: 'E (analytical)', value: analytical.E.toExponential(2), unit: 'N/C', color: 'rgb(255, 100, 100)' },
                                { label: 'E (numerical)', value: numerical.Emag.toExponential(2), unit: 'N/C', color: 'rgb(100, 200, 255)' },
                                { label: analytical.densityLabel, value: analytical.density },
                                { label: 'N elements', value: numElements.toString() },
                                { label: 'Convergence', value: analytical.E > 0 ? ((numerical.Emag / analytical.E) * 100).toFixed(1) : '---', unit: '%', color: 'rgb(100, 255, 150)' },
                            ]}
                        />
                    </div>

                    <div className="absolute top-4 right-4 max-w-[280px]">
                        <EquationDisplay
                            departmentColor="rgb(160, 100, 255)"
                            equations={[
                                { label: 'Coulomb', expression: 'dE = k dq / r^2', description: 'Field from each element' },
                                { label: 'Line', expression: 'E = 2k*lambda/r', description: 'Infinite line charge' },
                                { label: 'Ring', expression: 'E = kQx/(x^2+R^2)^(3/2)', description: 'On-axis field' },
                                { label: 'Disk', expression: 'E = sigma/2e0 (1-x/sqrt(x^2+R^2))' },
                                { label: 'Plane', expression: 'E = sigma / 2*epsilon_0' },
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
                        <ControlGroup label="Distribution Type">
                            <ButtonGroup
                                value={distType}
                                onChange={setDistType}
                                options={[
                                    { value: 'line', label: 'Line' },
                                    { value: 'ring', label: 'Ring' },
                                    { value: 'disk', label: 'Disk' },
                                    { value: 'plane', label: 'Plane' },
                                ]}
                                color="rgb(160, 100, 255)"
                            />
                        </ControlGroup>

                        <ControlGroup label="Total Charge">
                            <Slider value={totalCharge} onChange={setTotalCharge} min={1} max={50} step={1} label={`Q = ${totalCharge} nC`} />
                        </ControlGroup>

                        <ControlGroup label={distType === 'line' ? 'Length' : 'Radius'}>
                            <Slider value={dimension} onChange={setDimension} min={0.1} max={1.5} step={0.05} label={`${distType === 'line' ? 'L' : 'R'} = ${dimension.toFixed(2)} m`} />
                        </ControlGroup>

                        <ControlGroup label="Observation Distance">
                            <Slider value={obsDistance} onChange={setObsDistance} min={0.05} max={1.0} step={0.01} label={`x = ${obsDistance.toFixed(2)} m`} />
                        </ControlGroup>

                        <ControlGroup label="Integration Elements">
                            <Slider value={numElements} onChange={setNumElements} min={2} max={50} step={1} label={`N = ${numElements}`} />
                        </ControlGroup>

                        <Toggle value={showIndividualDE} onChange={setShowIndividualDE} label="Show dE Contributions" />
                        <Toggle value={showResultantE} onChange={setShowResultantE} label="Show Resultant E" />
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
