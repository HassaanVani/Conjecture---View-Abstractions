import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type Phase = 'peak' | 'recession' | 'trough' | 'expansion'

interface PhaseInfo {
    name: string
    description: string
    characteristics: string[]
    color: string
    policy: string
}

const GOLD = 'rgb(220, 180, 80)'

const phaseInfo: Record<Phase, PhaseInfo> = {
    peak: { name: 'Peak', description: 'Economy at maximum output. Growth slowing, inflation rising.', characteristics: ['Low unemployment', 'High inflation', 'Rates rising', 'High confidence'], color: 'rgba(255, 180, 80, 1)', policy: 'Fed may raise rates to cool inflation' },
    recession: { name: 'Recession', description: 'Economy contracting. Two quarters of negative GDP growth.', characteristics: ['Rising unemployment', 'Falling GDP', 'Reduced spending', 'Business failures'], color: 'rgba(255, 100, 100, 1)', policy: 'Expansionary fiscal/monetary policy' },
    trough: { name: 'Trough', description: 'Economy at lowest point. Conditions for recovery forming.', characteristics: ['High unemployment', 'Low inflation', 'Low rates', 'Depressed prices'], color: 'rgba(100, 150, 255, 1)', policy: 'Aggressive stimulus measures' },
    expansion: { name: 'Expansion', description: 'Economy growing. GDP, employment, and incomes rising.', characteristics: ['Declining unemployment', 'Moderate inflation', 'Rising spending', 'Investment up'], color: 'rgba(100, 200, 150, 1)', policy: 'Monitor for overheating' },
}

export default function BusinessCycle() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [currentPhase, setCurrentPhase] = useState<Phase>('expansion')
    const [animationTime, setAnimationTime] = useState(0)
    const [isAnimating, setIsAnimating] = useState(true)
    const [speed, setSpeed] = useState(1)
    const [showIndicators, setShowIndicators] = useState(true)

    const getGDPGrowth = useCallback((t: number) => 3 * Math.sin(t * 0.02) + 2, [])
    const getUnemployment = useCallback((t: number) => 5 - 2 * Math.sin((t - 20) * 0.02), [])
    const getInflation = useCallback((t: number) => 2 + 1.5 * Math.sin((t - 15) * 0.02), [])

    const determinePhase = useCallback((t: number): Phase => {
        const cyclePos = (t * 0.02) % (2 * Math.PI)
        if (cyclePos < Math.PI / 2) return 'expansion'
        if (cyclePos < Math.PI) return 'peak'
        if (cyclePos < 3 * Math.PI / 2) return 'recession'
        return 'trough'
    }, [])

    useEffect(() => { setCurrentPhase(determinePhase(animationTime)) }, [animationTime, determinePhase])

    useEffect(() => {
        if (!isAnimating) return
        const interval = setInterval(() => setAnimationTime(t => t + speed), 50)
        return () => clearInterval(interval)
    }, [isAnimating, speed])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'The Business Cycle', description: 'Economies naturally fluctuate through periods of growth and contraction.', setup: () => { setIsAnimating(true); setAnimationTime(0) } },
        { title: 'Expansion Phase', description: 'GDP grows, unemployment falls, consumer spending rises. The "good times."', setup: () => { setAnimationTime(10); setIsAnimating(false) } },
        { title: 'Peak', description: 'Highest point of activity. Growth slows, inflation pressures build, economy overheating.', setup: () => { setAnimationTime(80); setIsAnimating(false) } },
        { title: 'Recession', description: 'Two consecutive quarters of declining GDP. Unemployment rises, spending falls.', setup: () => { setAnimationTime(130); setIsAnimating(false) } },
        { title: 'Trough', description: 'The lowest point. While painful, sets the stage for recovery.', setup: () => { setAnimationTime(210); setIsAnimating(false) } },
        { title: 'Key Indicators', description: 'GDP, unemployment, and inflation move together with different timing (leads and lags).', setup: () => { setShowIndicators(true); setIsAnimating(true); setAnimationTime(0) } },
        { title: 'Policy Responses', description: 'Fiscal policy (G, T) and monetary policy (interest rates, money supply) counter the cycle.', setup: () => { setIsAnimating(true); setAnimationTime(0) } },
        { title: 'Explore', description: 'Click phase buttons to jump. Adjust speed. Watch how indicators relate to each phase.', setup: () => { setIsAnimating(true); setAnimationTime(0) } },
    ], [])

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const resize = () => { canvas.width = canvas.offsetWidth * window.devicePixelRatio; canvas.height = canvas.offsetHeight * window.devicePixelRatio; ctx.scale(window.devicePixelRatio, window.devicePixelRatio) }
        resize()
        window.addEventListener('resize', resize)
        const width = canvas.offsetWidth, height = canvas.offsetHeight
        const pad = { left: 70, right: 30, top: 40, bottom: 80 }
        const gW = width - pad.left - pad.right, gH = height - pad.top - pad.bottom
        ctx.fillStyle = '#1a150a'; ctx.fillRect(0, 0, width, height)

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.3)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, height - pad.bottom); ctx.lineTo(width - pad.right, height - pad.bottom); ctx.stroke()
        ctx.fillStyle = 'rgba(220,180,80,0.6)'; ctx.font = '11px system-ui'; ctx.textAlign = 'right'
        ctx.fillText('High', pad.left - 10, pad.top + 20); ctx.fillText('Low', pad.left - 10, height - pad.bottom - 10)
        ctx.textAlign = 'center'; ctx.fillText('Time', width / 2, height - 20)

        // Potential GDP
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([8, 4])
        const potY = pad.top + gH * 0.4
        ctx.beginPath(); ctx.moveTo(pad.left, potY); ctx.lineTo(width - pad.right, potY); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px system-ui'; ctx.textAlign = 'left'
        ctx.fillText('Potential GDP (Y*)', pad.left + 10, potY - 8)

        const cycleLen = 320, visStart = Math.max(0, animationTime - cycleLen)

        // Phase shading
        for (let t = visStart; t < animationTime - 1; t += 1) {
            const phase = determinePhase(t)
            const info = phaseInfo[phase]
            const x = pad.left + ((t - visStart) / cycleLen) * gW
            ctx.fillStyle = info.color.replace('1)', '0.05)')
            ctx.fillRect(x, pad.top, 3, gH)
        }

        // GDP curve
        ctx.strokeStyle = 'rgba(220,180,80,0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath()
        for (let t = visStart; t <= animationTime; t += 1) {
            const x = pad.left + ((t - visStart) / cycleLen) * gW
            const gdpVal = getGDPGrowth(t)
            const y = pad.top + (1 - (gdpVal / 10)) * gH
            if (t === visStart) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Current point
        const curX = width - pad.right
        const curGDP = getGDPGrowth(animationTime)
        const curY = pad.top + (1 - (curGDP / 10)) * gH
        const glow = ctx.createRadialGradient(curX, curY, 0, curX, curY, 20)
        glow.addColorStop(0, phaseInfo[currentPhase].color.replace('1)', '0.5)')); glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(curX, curY, 20, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = phaseInfo[currentPhase].color; ctx.beginPath(); ctx.arc(curX, curY, 8, 0, Math.PI * 2); ctx.fill()

        // Indicators
        if (showIndicators) {
            const iH = 50, iBase = height - pad.bottom + 25
            ctx.strokeStyle = 'rgba(255,100,100,0.6)'; ctx.lineWidth = 2; ctx.beginPath()
            for (let t = visStart; t <= animationTime; t += 2) {
                const x = pad.left + ((t - visStart) / cycleLen) * gW
                const u = getUnemployment(t), y = iBase - ((u - 3) / 4) * iH
                if (t === visStart) ctx.moveTo(x, y); else ctx.lineTo(x, y)
            }
            ctx.stroke()
            ctx.strokeStyle = 'rgba(150,100,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath()
            for (let t = visStart; t <= animationTime; t += 2) {
                const x = pad.left + ((t - visStart) / cycleLen) * gW
                const inf = getInflation(t), y = iBase - ((inf) / 5) * iH
                if (t === visStart) ctx.moveTo(x, y); else ctx.lineTo(x, y)
            }
            ctx.stroke()
            ctx.font = '10px system-ui'; ctx.textAlign = 'left'
            ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.fillText('GDP', pad.left + 20, iBase + 20)
            ctx.fillStyle = 'rgba(255,100,100,0.8)'; ctx.fillText('Unemployment', pad.left + 60, iBase + 20)
            ctx.fillStyle = 'rgba(150,100,255,0.8)'; ctx.fillText('Inflation', pad.left + 160, iBase + 20)
        }

        // Phase label
        ctx.fillStyle = phaseInfo[currentPhase].color.replace('1)', '0.2)')
        ctx.beginPath(); ctx.roundRect(width - pad.right - 100, pad.top + 10, 90, 28, 6); ctx.fill()
        ctx.fillStyle = phaseInfo[currentPhase].color; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(phaseInfo[currentPhase].name, width - pad.right - 55, pad.top + 29)

        return () => window.removeEventListener('resize', resize)
    }, [animationTime, currentPhase, showIndicators, determinePhase, getGDPGrowth, getUnemployment, getInflation])

    const gdpGrowth = getGDPGrowth(animationTime)
    const unemployment = getUnemployment(animationTime)
    const inflation = getInflation(animationTime)
    const phase = phaseInfo[currentPhase]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Jump to Phase">
                            <div className="flex flex-wrap gap-1">
                                {(Object.keys(phaseInfo) as Phase[]).map(p => (
                                    <button key={p} onClick={() => { setIsAnimating(false); const phases: Phase[] = ['expansion', 'peak', 'recession', 'trough']; setAnimationTime(10 + phases.indexOf(p) * 78) }}
                                        className="px-2 py-1 rounded text-xs transition-all" style={{ backgroundColor: currentPhase === p ? phaseInfo[p].color.replace('1)', '0.2)') : 'rgba(255,255,255,0.05)', color: currentPhase === p ? phaseInfo[p].color : 'rgba(255,255,255,0.5)', border: `1px solid ${currentPhase === p ? phaseInfo[p].color : 'rgba(255,255,255,0.1)'}` }}>
                                        {phaseInfo[p].name}
                                    </button>
                                ))}
                            </div>
                        </ControlGroup>
                        <Toggle label="Show Indicators" value={showIndicators} onChange={setShowIndicators} />
                        <Slider label="Speed" value={speed} onChange={setSpeed} min={0.2} max={3} step={0.2} />
                        <div className="flex gap-2">
                            <Button onClick={() => setIsAnimating(!isAnimating)}>{isAnimating ? 'Pause' : 'Play'}</Button>
                            <Button onClick={() => { setAnimationTime(0); setIsAnimating(true) }} variant="secondary">Reset</Button>
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 2" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={phase.color} title={phase.name} items={[
                        { label: 'GDP Growth', value: `${gdpGrowth >= 0 ? '+' : ''}${gdpGrowth.toFixed(1)}%`, color: gdpGrowth >= 0 ? 'rgba(100,200,150,1)' : 'rgba(255,100,100,1)' },
                        { label: 'Unemployment', value: `${unemployment.toFixed(1)}%`, color: 'rgba(255,150,100,1)' },
                        { label: 'Inflation', value: `${inflation.toFixed(1)}%`, color: 'rgba(150,100,255,1)' },
                    ]} />
                    <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                        <p className="text-xs text-white/60 mb-2">{phase.description}</p>
                        <p className="text-xs text-white/40">Policy: {phase.policy}</p>
                    </div>
                    <EquationDisplay departmentColor={GOLD} title="Key Concepts" collapsed equations={[
                        { label: 'GDP', expression: 'Y = C + I + G + NX' },
                        { label: 'Recession', expression: '2 consecutive quarters of negative GDP growth' },
                        { label: 'Okun', expression: 'Each 1% above NRU = 2% output gap' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
