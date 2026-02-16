import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const PHYS_COLOR = 'rgb(160, 100, 255)'

export default function Capacitor() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const timeRef = useRef(0)

    const [plateArea, setPlateArea] = useState(50)
    const [plateSep, setPlateSep] = useState(40)
    const [dielectricK, setDielectricK] = useState(1.0)
    const [voltage, setVoltage] = useState(100)
    const [showDielectric, setShowDielectric] = useState(false)
    const [dielectricPos, setDielectricPos] = useState(0) // 0 = out, 1 = fully in

    const epsilon0 = 8.85e-12
    const areaM2 = plateArea * 1e-4
    const sepM = plateSep * 1e-3

    const capacitance = useCallback(() => {
        const kEff = showDielectric ? 1 + (dielectricK - 1) * dielectricPos : 1
        return kEff * epsilon0 * areaM2 / sepM
    }, [showDielectric, dielectricK, dielectricPos, areaM2, sepM])

    const C = capacitance()
    const charge = C * voltage
    const energy = 0.5 * C * voltage * voltage
    const eField = voltage / sepM

    const demoSteps: DemoStep[] = [
        {
            title: 'Parallel Plate Capacitor',
            description: 'A capacitor stores charge on two conducting plates separated by a gap. The electric field between the plates is uniform, and energy is stored in this field.',
            setup: () => { setPlateArea(50); setPlateSep(40); setVoltage(100); setShowDielectric(false) },
        },
        {
            title: 'Capacitance Formula',
            description: 'C = epsilon0 * A / d. Capacitance increases with plate area and decreases with separation. It depends only on geometry, not on voltage or charge.',
            setup: () => { setPlateArea(50); setPlateSep(40); setVoltage(100) },
        },
        {
            title: 'Plate Area Effect',
            description: 'Increasing plate area A increases capacitance linearly. Larger plates can hold more charge at the same voltage because there is more surface area for charge distribution.',
            setup: () => { setPlateArea(80); setPlateSep(40) },
        },
        {
            title: 'Plate Separation Effect',
            description: 'Decreasing plate separation d increases capacitance. Closer plates create a stronger electric field for the same voltage, allowing more charge to accumulate.',
            setup: () => { setPlateArea(50); setPlateSep(20) },
        },
        {
            title: 'Electric Field Lines',
            description: 'The E-field between plates is uniform: E = V/d. Field lines go from positive to negative plate. Fringing fields at edges are small for large A/d ratios.',
            setup: () => { setPlateArea(60); setPlateSep(40); setVoltage(150) },
        },
        {
            title: 'Dielectric Insertion',
            description: 'A dielectric material between plates increases capacitance by a factor kappa. The dielectric reduces the effective field, allowing more charge at the same voltage.',
            setup: () => { setShowDielectric(true); setDielectricK(3.0); setDielectricPos(0.5) },
        },
        {
            title: 'Energy Storage',
            description: 'Energy stored: U = (1/2)CV^2. With a dielectric at constant voltage, both C and U increase. The energy is stored in the electric field between the plates.',
            setup: () => { setShowDielectric(true); setDielectricK(4.0); setDielectricPos(1.0) },
        },
    ]

    const demo = useDemoMode(demoSteps)

    // Animate dielectric sliding in
    useEffect(() => {
        if (!showDielectric) { setDielectricPos(0); return }
        let target = 1.0
        const interval = setInterval(() => {
            setDielectricPos(prev => {
                const next = prev + (target - prev) * 0.05
                if (Math.abs(next - target) < 0.01) { clearInterval(interval); return target }
                return next
            })
        }, 16)
        return () => clearInterval(interval)
    }, [showDielectric])

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

        const animate = () => {
            const now = performance.now() / 1000
            timeRef.current = now
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            const cx = w * 0.4
            const cy = h * 0.45

            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = '#0d0a1a'
            ctx.fillRect(0, 0, w, h)

            // Capacitor dimensions
            const plateH = plateArea * 2.5
            const sep = plateSep * 2
            const plateW = 8

            const leftPlateX = cx - sep / 2
            const rightPlateX = cx + sep / 2

            // Wire connections
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(leftPlateX - 60, cy)
            ctx.lineTo(leftPlateX, cy)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(rightPlateX, cy)
            ctx.lineTo(rightPlateX + 60, cy)
            ctx.stroke()

            // Battery symbol
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.5)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(leftPlateX - 60, cy)
            ctx.lineTo(leftPlateX - 60, cy - 40)
            ctx.lineTo(rightPlateX + 60, cy - 40)
            ctx.lineTo(rightPlateX + 60, cy)
            ctx.stroke()

            // Battery
            const bx = cx
            const by = cy - 40
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.7)'
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(bx - 8, by - 10)
            ctx.lineTo(bx - 8, by + 10)
            ctx.stroke()
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(bx + 4, by - 6)
            ctx.lineTo(bx + 4, by + 6)
            ctx.stroke()
            ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'
            ctx.font = '10px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`${voltage}V`, bx, by - 16)

            // Positive plate (left) glow
            const chargeIntensity = Math.min(Math.abs(voltage) / 200, 1)
            const leftGlow = ctx.createLinearGradient(leftPlateX - 20, cy, leftPlateX + plateW + 5, cy)
            leftGlow.addColorStop(0, 'transparent')
            leftGlow.addColorStop(1, `rgba(255, 80, 80, ${chargeIntensity * 0.15})`)
            ctx.fillStyle = leftGlow
            ctx.fillRect(leftPlateX - 20, cy - plateH / 2, plateW + 25, plateH)

            // Negative plate (right) glow
            const rightGlow = ctx.createLinearGradient(rightPlateX - 5, cy, rightPlateX + 20, cy)
            rightGlow.addColorStop(0, `rgba(80, 120, 255, ${chargeIntensity * 0.15})`)
            rightGlow.addColorStop(1, 'transparent')
            ctx.fillStyle = rightGlow
            ctx.fillRect(rightPlateX - 5, cy - plateH / 2, plateW + 25, plateH)

            // Plates
            const leftGrad = ctx.createLinearGradient(leftPlateX, cy - plateH / 2, leftPlateX, cy + plateH / 2)
            leftGrad.addColorStop(0, 'rgba(255, 100, 100, 0.8)')
            leftGrad.addColorStop(0.5, 'rgba(255, 130, 130, 0.9)')
            leftGrad.addColorStop(1, 'rgba(255, 100, 100, 0.8)')
            ctx.fillStyle = leftGrad
            ctx.fillRect(leftPlateX, cy - plateH / 2, plateW, plateH)

            const rightGrad = ctx.createLinearGradient(rightPlateX, cy - plateH / 2, rightPlateX, cy + plateH / 2)
            rightGrad.addColorStop(0, 'rgba(80, 120, 255, 0.8)')
            rightGrad.addColorStop(0.5, 'rgba(100, 150, 255, 0.9)')
            rightGrad.addColorStop(1, 'rgba(80, 120, 255, 0.8)')
            ctx.fillStyle = rightGrad
            ctx.fillRect(rightPlateX, cy - plateH / 2, plateW, plateH)

            // Charge symbols on plates
            const numCharges = Math.round(3 + chargeIntensity * 8)
            ctx.font = 'bold 12px system-ui'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            for (let i = 0; i < numCharges; i++) {
                const yPos = cy - plateH / 2 + (i + 0.5) * (plateH / numCharges)
                ctx.fillStyle = 'rgba(255, 200, 200, 0.8)'
                ctx.fillText('+', leftPlateX + plateW / 2, yPos)
                ctx.fillStyle = 'rgba(200, 200, 255, 0.8)'
                ctx.fillText('-', rightPlateX + plateW / 2, yPos)
            }

            // Electric field lines
            const numLines = Math.round(4 + chargeIntensity * 6)
            for (let i = 0; i < numLines; i++) {
                const yPos = cy - plateH / 2 + (i + 0.5) * (plateH / numLines)
                const x1 = leftPlateX + plateW + 4
                const x2 = rightPlateX - 4

                // Animated dashes
                const offset = (now * 30) % 20

                ctx.strokeStyle = `rgba(255, 220, 100, ${0.2 + chargeIntensity * 0.3})`
                ctx.lineWidth = 1.5
                ctx.setLineDash([8, 6])
                ctx.lineDashOffset = -offset
                ctx.beginPath()
                ctx.moveTo(x1, yPos)
                ctx.lineTo(x2, yPos)
                ctx.stroke()
                ctx.setLineDash([])

                // Arrow
                ctx.fillStyle = `rgba(255, 220, 100, ${0.3 + chargeIntensity * 0.4})`
                const arrowX = (x1 + x2) / 2
                ctx.beginPath()
                ctx.moveTo(arrowX + 5, yPos)
                ctx.lineTo(arrowX - 3, yPos - 4)
                ctx.lineTo(arrowX - 3, yPos + 4)
                ctx.closePath()
                ctx.fill()
            }

            // Dielectric
            if (showDielectric && dielectricPos > 0.01) {
                const dielW = (sep - plateW * 2 - 8) * 0.85
                const dielH = plateH * 0.9
                const dielX = leftPlateX + plateW + 4 + (1 - dielectricPos) * (dielW + 20)
                const dielY = cy - dielH / 2

                ctx.fillStyle = `rgba(100, 200, 150, ${0.15 + dielectricPos * 0.15})`
                ctx.strokeStyle = `rgba(100, 200, 150, ${0.4 + dielectricPos * 0.3})`
                ctx.lineWidth = 1.5
                ctx.beginPath()
                ctx.roundRect(dielX, dielY, dielW, dielH, 4)
                ctx.fill()
                ctx.stroke()

                // Polarization dipoles
                const dipoles = Math.round(dielectricPos * 8)
                for (let r = 0; r < dipoles; r++) {
                    for (let c = 0; c < 3; c++) {
                        const dx = dielX + (c + 0.5) * (dielW / 3)
                        const dy = dielY + (r + 0.5) * (dielH / dipoles)

                        ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
                        ctx.beginPath()
                        ctx.arc(dx - 4, dy, 2.5, 0, Math.PI * 2)
                        ctx.fill()
                        ctx.fillStyle = 'rgba(100, 100, 255, 0.5)'
                        ctx.beginPath()
                        ctx.arc(dx + 4, dy, 2.5, 0, Math.PI * 2)
                        ctx.fill()

                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
                        ctx.lineWidth = 0.5
                        ctx.beginPath()
                        ctx.moveTo(dx - 4, dy)
                        ctx.lineTo(dx + 4, dy)
                        ctx.stroke()
                    }
                }

                ctx.fillStyle = 'rgba(100, 200, 150, 0.7)'
                ctx.font = '11px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText(`K = ${dielectricK.toFixed(1)}`, dielX + dielW / 2, dielY - 8)
            }

            // Labels
            ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
            ctx.font = '12px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('+Q', leftPlateX + plateW / 2, cy + plateH / 2 + 20)
            ctx.fillStyle = 'rgba(80, 120, 255, 0.7)'
            ctx.fillText('-Q', rightPlateX + plateW / 2, cy + plateH / 2 + 20)

            ctx.fillStyle = 'rgba(255, 220, 100, 0.5)'
            ctx.font = 'bold 13px system-ui'
            ctx.fillText('E', cx, cy + plateH / 2 + 40)

            // Separation indicator
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
            ctx.lineWidth = 1
            ctx.setLineDash([3, 3])
            const indY = cy + plateH / 2 + 55
            ctx.beginPath()
            ctx.moveTo(leftPlateX + plateW, indY)
            ctx.lineTo(rightPlateX, indY)
            ctx.stroke()
            ctx.setLineDash([])
            ctx.beginPath()
            ctx.moveTo(leftPlateX + plateW, indY - 5)
            ctx.lineTo(leftPlateX + plateW, indY + 5)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(rightPlateX, indY - 5)
            ctx.lineTo(rightPlateX, indY + 5)
            ctx.stroke()
            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = '10px system-ui'
            ctx.fillText(`d = ${plateSep} mm`, cx, indY + 15)

            // Energy bar
            const barX = w * 0.72
            const barY = h * 0.2
            const barW = 30
            const barH = h * 0.5
            const energyFrac = Math.min(energy / 1e-6, 1)

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.beginPath()
            ctx.roundRect(barX - 5, barY - 20, barW + 10, barH + 40, 8)
            ctx.fill()

            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.fillRect(barX, barY, barW, barH)

            const energyGrad = ctx.createLinearGradient(barX, barY + barH, barX, barY + barH * (1 - energyFrac))
            energyGrad.addColorStop(0, 'rgba(160, 100, 255, 0.6)')
            energyGrad.addColorStop(1, 'rgba(100, 200, 255, 0.6)')
            ctx.fillStyle = energyGrad
            ctx.fillRect(barX, barY + barH * (1 - energyFrac), barW, barH * energyFrac)

            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.font = '11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText('Energy', barX + barW / 2, barY - 8)
            ctx.font = '9px system-ui'
            ctx.fillText(`${(energy * 1e9).toFixed(2)} nJ`, barX + barW / 2, barY + barH + 15)

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [plateArea, plateSep, dielectricK, voltage, showDielectric, dielectricPos, energy])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0d0a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full block" />

                <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
                    <APTag course="Physics C: E&M" unit="Unit 1" color={PHYS_COLOR} />
                    <InfoPanel
                        title="Capacitor Data"
                        departmentColor={PHYS_COLOR}
                        items={[
                            { label: 'Capacitance C', value: (C * 1e12).toFixed(2), unit: 'pF' },
                            { label: 'Charge Q', value: (charge * 1e9).toFixed(2), unit: 'nC' },
                            { label: 'Energy U', value: (energy * 1e9).toFixed(2), unit: 'nJ' },
                            { label: 'E-Field', value: (eField).toFixed(0), unit: 'V/m' },
                            { label: 'Eff. Kappa', value: (showDielectric ? 1 + (dielectricK - 1) * dielectricPos : 1).toFixed(2) },
                        ]}
                    />
                    <EquationDisplay
                        departmentColor={PHYS_COLOR}
                        title="Capacitor Equations"
                        equations={[
                            { label: 'Capacitance', expression: 'C = e0 * A / d', description: 'Parallel plate capacitor' },
                            { label: 'Dielectric', expression: 'C_k = k * C0', description: 'Dielectric increases C by factor k' },
                            { label: 'Energy', expression: 'U = (1/2)CV^2 = Q^2/(2C)', description: 'Stored in the electric field' },
                            { label: 'E-field', expression: 'E = V/d = sigma/e0' },
                        ]}
                    />
                </div>

                <div className="absolute top-4 right-4 z-10">
                    <ControlPanel>
                        <ControlGroup label="Capacitor">
                            <Button onClick={() => { setPlateArea(50); setPlateSep(40); setDielectricK(1); setVoltage(100); setShowDielectric(false) }} variant="secondary">Reset</Button>
                        </ControlGroup>
                        <Slider label={`Plate Area (${plateArea} cm^2)`} value={plateArea} onChange={v => setPlateArea(Math.round(v))} min={20} max={100} step={1} />
                        <Slider label={`Plate Separation (${plateSep} mm)`} value={plateSep} onChange={v => setPlateSep(Math.round(v))} min={10} max={80} step={1} />
                        <Slider label={`Voltage (${voltage} V)`} value={voltage} onChange={v => setVoltage(Math.round(v))} min={10} max={300} step={1} />
                        <Toggle label="Insert Dielectric" value={showDielectric} onChange={setShowDielectric} />
                        {showDielectric && (
                            <Slider label={`Dielectric K (${dielectricK.toFixed(1)})`} value={dielectricK} onChange={setDielectricK} min={1} max={10} step={0.1} />
                        )}
                        <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
                    </ControlPanel>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <DemoMode
                        steps={demoSteps}
                        currentStep={demo.currentStep}
                        isOpen={demo.isOpen}
                        onClose={demo.close}
                        onNext={demo.next}
                        onPrev={demo.prev}
                        onGoToStep={demo.goToStep}
                        departmentColor={PHYS_COLOR}
                    />
                </div>
            </div>
        </div>
    )
}
