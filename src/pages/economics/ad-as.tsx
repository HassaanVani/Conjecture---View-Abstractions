import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type Scenario = 'neutral' | 'recession' | 'inflation' | 'stagflation' | 'growth'

interface ScenarioInfo {
    name: string
    adShift: number
    srasShift: number
    description: string
    policy: string
}

const GOLD = 'rgb(220, 180, 80)'

const scenarios: Record<Scenario, ScenarioInfo> = {
    neutral: { name: 'Equilibrium', adShift: 0, srasShift: 0, description: 'Economy at potential output (Y*). No output gap.', policy: 'No intervention needed' },
    recession: { name: 'Recessionary Gap', adShift: -0.4, srasShift: 0, description: 'Real GDP below potential. High unemployment.', policy: 'Expansionary fiscal/monetary policy' },
    inflation: { name: 'Inflationary Gap', adShift: 0.4, srasShift: 0, description: 'Real GDP above potential. Rising prices.', policy: 'Contractionary fiscal/monetary policy' },
    stagflation: { name: 'Stagflation', adShift: 0, srasShift: -0.4, description: 'Negative supply shock. High unemployment AND inflation.', policy: 'Dilemma: fix inflation OR unemployment' },
    growth: { name: 'Economic Growth', adShift: 0.3, srasShift: 0.3, description: 'Both AD and LRAS shift right. Sustainable growth.', policy: 'Investment in productivity, education' },
}

export default function AggregateSupplyDemand() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [adShift, setAdShift] = useState(0)
    const [srasShift, setSrasShift] = useState(0)
    const [lrasShift, setLrasShift] = useState(0)
    const [showLRAS, setShowLRAS] = useState(true)
    const [scenario, setScenario] = useState<Scenario>('neutral')

    const applyScenario = useCallback((s: Scenario) => {
        setScenario(s)
        const info = scenarios[s]
        setAdShift(info.adShift); setSrasShift(info.srasShift)
        setLrasShift(s === 'growth' ? 0.3 : 0)
    }, [])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'The AD-AS Model', description: 'Aggregate Demand (AD) is total spending. Short-Run Aggregate Supply (SRAS) is total production at each price level.', setup: () => applyScenario('neutral') },
        { title: 'Long-Run Aggregate Supply', description: 'The vertical LRAS shows potential output (Y*). In the long run, output returns here regardless of prices.', setup: () => { setShowLRAS(true); applyScenario('neutral') } },
        { title: 'Recessionary Gap', description: 'AD shifts left: less spending, output falls BELOW potential. Unemployment rises.', setup: () => applyScenario('recession') },
        { title: 'Inflationary Gap', description: 'AD shifts right: more spending, output temporarily exceeds potential. Prices rise.', setup: () => applyScenario('inflation') },
        { title: 'Stagflation', description: 'Leftward SRAS shift: falling output AND rising prices. Oil crises, pandemics.', setup: () => applyScenario('stagflation') },
        { title: 'Long-Run Growth', description: 'LRAS shifts right: more capacity without inflation. Technology, education, investment.', setup: () => applyScenario('growth') },
        { title: 'Self-Correction', description: 'In the long run, SRAS adjusts to move economy back to LRAS. Wages and prices are flexible long-run.', setup: () => applyScenario('neutral') },
        { title: 'Experiment', description: 'Use sliders to shift AD and SRAS. Can you create a recession? An inflationary gap?', setup: () => applyScenario('neutral') },
    ], [applyScenario])

    const demo = useDemoMode(demoSteps)

    // Calculate equilibrium
    const srasBaseX = 15 + srasShift * 25
    const adBaseX = 90 + adShift * 25
    const eqY = (adBaseX + adShift * 10 - srasBaseX - srasShift * 10) / 1.5
    const eqX = srasBaseX + eqY * 0.75 + srasShift * 10
    const lrasX = 50 + lrasShift * 20
    const outputGap = eqX - lrasX

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
        const toCanvasX = (x: number) => padding + (x / 100) * gW
        const toCanvasY = (y: number) => height - padding - 50 - (y / 100) * gH

        // Grid
        ctx.strokeStyle = 'rgba(220,180,80,0.06)'; ctx.lineWidth = 1
        for (let i = 0; i <= 100; i += 20) { ctx.beginPath(); ctx.moveTo(toCanvasX(i), toCanvasY(0)); ctx.lineTo(toCanvasX(i), toCanvasY(100)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(toCanvasX(0), toCanvasY(i)); ctx.lineTo(toCanvasX(100), toCanvasY(i)); ctx.stroke() }

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(padding, toCanvasY(100)); ctx.lineTo(padding, toCanvasY(0)); ctx.lineTo(toCanvasX(100), toCanvasY(0)); ctx.stroke()
        ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '14px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('Real GDP (Y)', padding + gW / 2, height - 20)
        ctx.save(); ctx.translate(22, height / 2 - 25); ctx.rotate(-Math.PI / 2); ctx.fillText('Price Level (P)', 0, 0); ctx.restore()

        // LRAS
        if (showLRAS) {
            ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([8, 4])
            ctx.beginPath(); ctx.moveTo(toCanvasX(lrasX), toCanvasY(90)); ctx.lineTo(toCanvasX(lrasX), toCanvasY(10)); ctx.stroke(); ctx.setLineDash([])
            ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('LRAS', toCanvasX(lrasX), toCanvasY(95))
            ctx.font = '10px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('(Y*)', toCanvasX(lrasX), toCanvasY(90))
        }

        // SRAS
        ctx.strokeStyle = 'rgba(100,200,150,0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath()
        for (let y = 15; y <= 85; y += 1) { const x = srasBaseX + y * 0.75 + srasShift * 10; if (y === 15) ctx.moveTo(toCanvasX(x), toCanvasY(y)); else ctx.lineTo(toCanvasX(x), toCanvasY(y)) }
        ctx.stroke()
        ctx.fillStyle = 'rgba(100,200,150,0.9)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'left'
        ctx.fillText('SRAS', toCanvasX(srasBaseX + 85 * 0.75 + srasShift * 10) + 8, toCanvasY(85))

        // AD
        ctx.strokeStyle = 'rgba(255,100,100,0.9)'; ctx.lineWidth = 3; ctx.beginPath()
        for (let y = 15; y <= 85; y += 1) { const x = adBaseX - y * 0.75 + adShift * 10; if (y === 15) ctx.moveTo(toCanvasX(x), toCanvasY(y)); else ctx.lineTo(toCanvasX(x), toCanvasY(y)) }
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,100,100,0.9)'; ctx.textAlign = 'right'
        ctx.fillText('AD', toCanvasX(adBaseX - 85 * 0.75 + adShift * 10) - 8, toCanvasY(85))

        // Equilibrium
        if (eqX > 10 && eqX < 95 && eqY > 10 && eqY < 95) {
            ctx.strokeStyle = 'rgba(220,180,80,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4])
            ctx.beginPath(); ctx.moveTo(toCanvasX(eqX), toCanvasY(eqY)); ctx.lineTo(toCanvasX(eqX), toCanvasY(0)); ctx.moveTo(toCanvasX(eqX), toCanvasY(eqY)); ctx.lineTo(toCanvasX(0), toCanvasY(eqY)); ctx.stroke(); ctx.setLineDash([])
            const eqGlow = ctx.createRadialGradient(toCanvasX(eqX), toCanvasY(eqY), 0, toCanvasX(eqX), toCanvasY(eqY), 20)
            eqGlow.addColorStop(0, 'rgba(220,180,80,0.4)'); eqGlow.addColorStop(1, 'transparent')
            ctx.fillStyle = eqGlow; ctx.beginPath(); ctx.arc(toCanvasX(eqX), toCanvasY(eqY), 20, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.beginPath(); ctx.arc(toCanvasX(eqX), toCanvasY(eqY), 8, 0, Math.PI * 2); ctx.fill()
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke()

            // Gap
            if (showLRAS) {
                const gap = eqX - lrasX
                let gapText = '', gapColor = '', gapBg = ''
                if (gap > 4) { gapText = 'Inflationary Gap'; gapColor = 'rgba(255,150,100,1)'; gapBg = 'rgba(255,150,100,0.1)' }
                else if (gap < -4) { gapText = 'Recessionary Gap'; gapColor = 'rgba(100,150,255,1)'; gapBg = 'rgba(100,150,255,0.1)' }
                else { gapText = 'At Potential Output'; gapColor = 'rgba(80,200,120,1)'; gapBg = 'rgba(80,200,120,0.1)' }
                if (Math.abs(gap) > 4) ctx.fillStyle = gapBg, ctx.fillRect(Math.min(toCanvasX(eqX), toCanvasX(lrasX)), toCanvasY(eqY) - 30, Math.abs(toCanvasX(eqX) - toCanvasX(lrasX)), 60)
                ctx.fillStyle = gapColor; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(gapText, toCanvasX((eqX + lrasX) / 2), toCanvasY(eqY) - 25)
            }
            ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '11px monospace'; ctx.textAlign = 'center'
            ctx.fillText(`Y = ${eqX.toFixed(0)}`, toCanvasX(eqX), toCanvasY(0) + 18)
            ctx.textAlign = 'right'; ctx.fillText(`P = ${eqY.toFixed(0)}`, toCanvasX(0) - 8, toCanvasY(eqY) + 4)
        }

        return () => window.removeEventListener('resize', resize)
    }, [adShift, srasShift, lrasShift, showLRAS, srasBaseX, adBaseX, eqX, eqY, lrasX])

    const currentScenario = scenarios[scenario]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Scenario">
                            <ButtonGroup value={scenario} onChange={v => applyScenario(v as Scenario)} options={Object.entries(scenarios).map(([k, v]) => ({ value: k, label: v.name.split(' ')[0] }))} color={GOLD} />
                        </ControlGroup>
                        <Slider label="AD Shift" value={adShift} onChange={v => { setAdShift(v); setScenario('neutral') }} min={-0.8} max={0.8} step={0.05} />
                        <Slider label="SRAS Shift" value={srasShift} onChange={v => { setSrasShift(v); setScenario('neutral') }} min={-0.8} max={0.8} step={0.05} />
                        <Toggle label="Show LRAS" value={showLRAS} onChange={setShowLRAS} />
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={() => applyScenario('neutral')} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 3" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title={currentScenario.name} items={[
                        { label: 'Output (Y)', value: eqX.toFixed(0) },
                        { label: 'Price Level (P)', value: eqY.toFixed(0) },
                        { label: 'Output Gap', value: outputGap > 4 ? `+${outputGap.toFixed(0)} (Inflationary)` : outputGap < -4 ? `${outputGap.toFixed(0)} (Recessionary)` : 'None', color: outputGap > 4 ? 'rgba(255,150,100,1)' : outputGap < -4 ? 'rgba(100,150,255,1)' : 'rgba(80,200,120,1)' },
                    ]} />
                    <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                        <p className="text-xs text-white/60 mb-1">{currentScenario.description}</p>
                        <p className="text-xs text-green-400">Policy: {currentScenario.policy}</p>
                    </div>
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'AD', expression: 'C + I + G + NX', description: 'Total spending at each price level' },
                        { label: 'SRAS', expression: 'Y = f(P, input costs)', description: 'Short-run production' },
                        { label: 'LRAS', expression: 'Y* = f(L, K, Tech)', description: 'Potential output (vertical)' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
