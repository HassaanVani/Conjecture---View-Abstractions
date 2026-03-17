import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type Scenario = 'neutral' | 'demand-pull' | 'cost-push' | 'expectations-shift' | 'volcker'

interface ScenarioInfo {
    name: string
    expectedInflation: number
    point: { unemployment: number; inflation: number }
    description: string
}

const GOLD = 'rgb(220, 180, 80)'

const scenarios: Record<Scenario, ScenarioInfo> = {
    neutral: { name: 'LR Equilibrium', expectedInflation: 2, point: { unemployment: 5, inflation: 2 }, description: 'At the natural rate with stable expectations.' },
    'demand-pull': { name: 'Demand-Pull', expectedInflation: 2, point: { unemployment: 3, inflation: 5 }, description: 'Expansionary policy: lower unemployment, higher inflation.' },
    'cost-push': { name: 'Cost-Push', expectedInflation: 4, point: { unemployment: 5, inflation: 4 }, description: 'Supply shock shifts SRPC up. Same unemployment, higher inflation.' },
    'expectations-shift': { name: 'Rising Expectations', expectedInflation: 5, point: { unemployment: 5, inflation: 5 }, description: 'Expectations adjust upward, entire SRPC shifts.' },
    'volcker': { name: 'Volcker', expectedInflation: 2, point: { unemployment: 8, inflation: 3 }, description: 'Tight policy: high unemployment to break inflation expectations.' },
}

export default function PhillipsCurve() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [currentPoint, setCurrentPoint] = useState({ unemployment: 5, inflation: 2 })
    const [expectedInflation, setExpectedInflation] = useState(2)
    const [showLRPC, setShowLRPC] = useState(true)
    const naturalRate = 5
    const [scenario, setScenario] = useState<Scenario>('neutral')
    const [isDragging, setIsDragging] = useState(false)

    const applyScenario = useCallback((s: Scenario) => {
        setScenario(s)
        const info = scenarios[s]
        setExpectedInflation(info.expectedInflation)
        setCurrentPoint(info.point)
    }, [])

    const getSRPCInflation = useCallback((u: number) => expectedInflation - 0.8 * (u - naturalRate), [expectedInflation, naturalRate])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'The Phillips Curve', description: 'Shows the short-run tradeoff between unemployment and inflation. Lower unemployment = higher inflation.', setup: () => applyScenario('neutral') },
        { title: 'Short-Run Phillips Curve', description: 'Downward-sloping SRPC shows the tradeoff. Policymakers can move ALONG the curve.', setup: () => applyScenario('demand-pull') },
        { title: 'Long-Run Phillips Curve', description: 'Vertical LRPC: NO long-run tradeoff. Unemployment returns to natural rate regardless of inflation.', setup: () => { setShowLRPC(true); applyScenario('neutral') } },
        { title: 'Expectations Matter', description: 'SRPC shifts when inflation expectations change. Higher expectations = curve shifts UP.', setup: () => applyScenario('expectations-shift') },
        { title: 'Cost-Push Inflation', description: 'Supply shocks (oil prices, wages) shift SRPC up. Same unemployment but higher inflation.', setup: () => applyScenario('cost-push') },
        { title: 'The Volcker Shock', description: 'Paul Volcker raised rates sharply in 1980s. High unemployment broke inflation expectations.', setup: () => applyScenario('volcker') },
        { title: 'Adaptive Expectations', description: 'People form expectations based on past inflation. Persistently high inflation shifts expectations up.', setup: () => applyScenario('neutral') },
        { title: 'Experiment', description: 'Drag the point to explore. Adjust expected inflation to shift the SRPC. Find LR equilibrium!', setup: () => applyScenario('neutral') },
    ], [applyScenario])

    const demo = useDemoMode(demoSteps)

    const expectedOnCurve = getSRPCInflation(currentPoint.unemployment)
    const distFromCurve = Math.abs(currentPoint.inflation - expectedOnCurve)
    const isOnCurve = distFromCurve < 0.3
    const isAboveCurve = currentPoint.inflation > expectedOnCurve + 0.3

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const resize = () => { canvas.width = canvas.offsetWidth * window.devicePixelRatio; canvas.height = canvas.offsetHeight * window.devicePixelRatio; ctx.scale(window.devicePixelRatio, window.devicePixelRatio) }
        resize()
        window.addEventListener('resize', resize)
        const width = canvas.offsetWidth, height = canvas.offsetHeight
        const padding = 80, gW = width - padding * 2, gH = height - padding * 2 - 50
        ctx.fillStyle = '#1a150a'; ctx.fillRect(0, 0, width, height)
        const maxU = 10, maxI = 10, minI = -2
        const toCanvasX = (u: number) => padding + (u / maxU) * gW
        const toCanvasY = (i: number) => height - padding - 50 - ((i - minI) / (maxI - minI)) * gH

        // Grid
        ctx.strokeStyle = 'rgba(220,180,80,0.06)'; ctx.lineWidth = 1
        for (let u = 0; u <= maxU; u += 1) { ctx.beginPath(); ctx.moveTo(toCanvasX(u), toCanvasY(minI)); ctx.lineTo(toCanvasX(u), toCanvasY(maxI)); ctx.stroke() }
        for (let i = minI; i <= maxI; i += 1) { ctx.beginPath(); ctx.moveTo(toCanvasX(0), toCanvasY(i)); ctx.lineTo(toCanvasX(maxU), toCanvasY(i)); ctx.stroke() }

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(padding, toCanvasY(maxI)); ctx.lineTo(padding, toCanvasY(minI)); ctx.lineTo(toCanvasX(maxU), toCanvasY(minI)); ctx.stroke()
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(toCanvasX(0), toCanvasY(0)); ctx.lineTo(toCanvasX(maxU), toCanvasY(0)); ctx.stroke()
        ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '14px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('Unemployment Rate (%)', padding + gW / 2, height - 20)
        ctx.save(); ctx.translate(22, height / 2 - 25); ctx.rotate(-Math.PI / 2); ctx.fillText('Inflation Rate (%)', 0, 0); ctx.restore()

        // Ticks
        ctx.font = '10px system-ui'; ctx.fillStyle = 'rgba(220,180,80,0.5)'
        for (let u = 2; u <= maxU; u += 2) { ctx.textAlign = 'center'; ctx.fillText(u + '%', toCanvasX(u), toCanvasY(minI) + 15) }
        for (let i = 0; i <= maxI; i += 2) { ctx.textAlign = 'right'; ctx.fillText(i + '%', toCanvasX(0) - 8, toCanvasY(i) + 4) }

        // LRPC
        if (showLRPC) {
            ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([8, 4])
            ctx.beginPath(); ctx.moveTo(toCanvasX(naturalRate), toCanvasY(maxI - 0.5)); ctx.lineTo(toCanvasX(naturalRate), toCanvasY(minI + 0.5)); ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('LRPC', toCanvasX(naturalRate), toCanvasY(maxI + 0.2))
            ctx.font = '10px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText(`NRU = ${naturalRate}%`, toCanvasX(naturalRate), toCanvasY(maxI - 0.5))
        }

        // SRPC
        const gradient = ctx.createLinearGradient(toCanvasX(1), 0, toCanvasX(9), 0)
        gradient.addColorStop(0, 'rgba(255,100,100,0.9)'); gradient.addColorStop(1, 'rgba(100,150,255,0.9)')
        ctx.strokeStyle = gradient; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath()
        for (let u = 1; u <= 9; u += 0.1) { const i = getSRPCInflation(u); if (i < minI || i > maxI) continue; if (u === 1) ctx.moveTo(toCanvasX(u), toCanvasY(i)); else ctx.lineTo(toCanvasX(u), toCanvasY(i)) }
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,150,100,0.9)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'left'
        const srpcLabelY = getSRPCInflation(1.5)
        if (srpcLabelY <= maxI && srpcLabelY >= minI) ctx.fillText('SRPC', toCanvasX(1.2), toCanvasY(srpcLabelY) - 10)

        // Expected inflation line
        ctx.strokeStyle = 'rgba(100,200,150,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
        ctx.beginPath(); ctx.moveTo(toCanvasX(0), toCanvasY(expectedInflation)); ctx.lineTo(toCanvasX(maxU), toCanvasY(expectedInflation)); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = 'rgba(100,200,150,0.8)'; ctx.font = '11px system-ui'; ctx.textAlign = 'right'
        ctx.fillText(`Expected = ${expectedInflation}%`, toCanvasX(maxU) - 5, toCanvasY(expectedInflation) - 8)

        // Current point
        const px = toCanvasX(currentPoint.unemployment), py = toCanvasY(currentPoint.inflation)
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 25)
        glow.addColorStop(0, 'rgba(220,180,80,0.4)'); glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, py, 25, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'
        ctx.fillText(`(${currentPoint.unemployment.toFixed(1)}%, ${currentPoint.inflation.toFixed(1)}%)`, px, py - 18)

        return () => window.removeEventListener('resize', resize)
    }, [currentPoint, expectedInflation, showLRPC, naturalRate, getSRPCInflation])

    const handleCanvasInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const width = canvas.offsetWidth, height = canvas.offsetHeight
        const padding = 80, gW = width - padding * 2, gH = height - padding * 2 - 50
        let clientX: number, clientY: number
        if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY } else { clientX = e.clientX; clientY = e.clientY }
        const clickX = clientX - rect.left, clickY = clientY - rect.top
        const maxU = 10, maxI = 10, minI = -2
        const u = ((clickX - padding) / gW) * maxU
        const i = (1 - (clickY - (height - padding - 50 - gH)) / gH) * (maxI - minI) + minI
        if (u >= 0.5 && u <= 9.5 && i >= minI && i <= maxI) { setCurrentPoint({ unemployment: u, inflation: i }); setScenario('neutral') }
    }, [])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full cursor-crosshair"
                    onClick={handleCanvasInteraction}
                    onMouseDown={() => setIsDragging(true)} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
                    onMouseMove={e => isDragging && handleCanvasInteraction(e)}
                    onTouchStart={e => { setIsDragging(true); handleCanvasInteraction(e) }}
                    onTouchMove={e => isDragging && handleCanvasInteraction(e)} onTouchEnd={() => setIsDragging(false)}
                />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Scenario">
                            <ButtonGroup value={scenario} onChange={v => applyScenario(v as Scenario)} options={Object.entries(scenarios).map(([k, v]) => ({ value: k, label: v.name.split(' ')[0] }))} color={GOLD} />
                        </ControlGroup>
                        <Slider label="Expected Inflation" value={expectedInflation} onChange={v => { setExpectedInflation(v); setScenario('neutral') }} min={-1} max={8} step={0.5} />
                        <Toggle label="Show LRPC" value={showLRPC} onChange={setShowLRPC} />
                        <div className="flex gap-2 flex-wrap">
                            <Button onClick={() => setCurrentPoint(prev => ({ ...prev, inflation: getSRPCInflation(prev.unemployment) }))} variant="secondary">Snap to SRPC</Button>
                            <Button onClick={() => setCurrentPoint({ unemployment: naturalRate, inflation: expectedInflation })} variant="secondary">LR Eq</Button>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={() => applyScenario('neutral')} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 5" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title="Current Position" items={[
                        { label: 'Unemployment', value: `${currentPoint.unemployment.toFixed(1)}%`, color: 'rgba(100,150,255,1)' },
                        { label: 'Inflation', value: `${currentPoint.inflation.toFixed(1)}%`, color: 'rgba(255,100,100,1)' },
                        { label: 'Expected Infl.', value: `${expectedInflation}%`, color: 'rgba(100,200,150,1)' },
                        { label: 'Position', value: isOnCurve ? 'On SRPC' : isAboveCurve ? 'Above SRPC' : 'Below SRPC', color: isOnCurve ? 'rgba(80,200,120,1)' : GOLD },
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'SRPC', expression: 'pi = pi_e - b(U - U_n)', description: 'Inflation = expected - slope x gap' },
                        { label: 'LRPC', expression: 'U = U_n (vertical)', description: 'No long-run tradeoff' },
                        { label: 'NRU', expression: 'Frictional + Structural', description: 'Natural rate of unemployment' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
