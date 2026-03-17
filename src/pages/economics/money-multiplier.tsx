import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, Slider, Button } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

interface BankData {
    deposits: number
    reserves: number
    loans: number
}

const GOLD = 'rgb(220, 180, 80)'

export default function MoneyMultiplier() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [initialDeposit, setInitialDeposit] = useState(1000)
    const [reserveRatio, setReserveRatio] = useState(10)
    const [animationStep, setAnimationStep] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const animationRef = useRef<number | null>(null)

    const rr = reserveRatio / 100
    const moneyMultiplier = 1 / rr
    const maxMoney = initialDeposit * moneyMultiplier

    const calculateBankStates = useCallback((): BankData[] => {
        const states: BankData[] = []
        let remainingDeposit = initialDeposit
        for (let i = 0; i < 12 && remainingDeposit > 0.5; i++) {
            const reserves = remainingDeposit * rr
            const loans = remainingDeposit * (1 - rr)
            states.push({ deposits: remainingDeposit, reserves, loans })
            remainingDeposit = loans
        }
        return states
    }, [initialDeposit, rr])

    const bankStates = calculateBankStates()
    const visibleBanks = Math.min(animationStep + 1, bankStates.length)
    const totalDeposits = bankStates.slice(0, visibleBanks).reduce((sum, b) => sum + b.deposits, 0)
    const totalReserves = bankStates.slice(0, visibleBanks).reduce((sum, b) => sum + b.reserves, 0)
    const totalLoans = bankStates.slice(0, visibleBanks).reduce((sum, b) => sum + b.loans, 0)

    const startAnimation = useCallback(() => { setAnimationStep(0); setIsAnimating(true) }, [])

    useEffect(() => {
        if (isAnimating && animationStep < bankStates.length - 1) {
            animationRef.current = window.setTimeout(() => setAnimationStep(s => s + 1), 1200)
        } else if (animationStep >= bankStates.length - 1) setIsAnimating(false)
        return () => { if (animationRef.current) clearTimeout(animationRef.current) }
    }, [isAnimating, animationStep, bankStates.length])

    useEffect(() => { setAnimationStep(bankStates.length - 1); setIsAnimating(false) }, [initialDeposit, reserveRatio])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'Fractional Reserve Banking', description: 'Banks don\'t keep all deposits in reserve -- they lend most of it out. This creates new money!', setup: () => { setAnimationStep(0); setIsAnimating(false) } },
        { title: 'Reserve Requirement', description: 'Banks must keep a fraction as reserves (set by the Fed). 10% means they can lend 90% of each deposit.', setup: () => { setReserveRatio(10); startAnimation() } },
        { title: 'Money Creation Chain', description: 'Bank A gets $1000 -> keeps $100, lends $900. Bank B gets $900 -> keeps $90, lends $810. Continues!', setup: () => startAnimation() },
        { title: 'The Money Multiplier', description: 'Multiplier = 1 / reserve ratio. With 10%: 1/0.10 = 10x. $1000 creates up to $10,000!', setup: () => { setAnimationStep(bankStates.length - 1); setIsAnimating(false) } },
        { title: 'Higher Reserves = Less Money', description: 'Increase the reserve ratio. More reserves = less lending = less money creation. This is how the Fed controls money supply.', setup: () => { setReserveRatio(20); setAnimationStep(bankStates.length - 1) } },
        { title: 'Excess Reserves', description: 'Banks can hold excess reserves beyond the requirement. This reduces the actual multiplier below the theoretical maximum.', setup: () => { setReserveRatio(10); setAnimationStep(bankStates.length - 1) } },
        { title: 'Fed Tools', description: 'The Fed controls money supply via: reserve requirements, discount rate, and open market operations (buying/selling bonds).', setup: () => { setReserveRatio(10); setAnimationStep(bankStates.length - 1) } },
        { title: 'Experiment', description: 'Adjust deposit and reserve ratio. Click "Animate" to watch money multiply step by step.', setup: () => { setReserveRatio(10); setAnimationStep(bankStates.length - 1) } },
    ], [bankStates.length, startAnimation])

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
        ctx.fillStyle = '#1a150a'; ctx.fillRect(0, 0, width, height)

        const bankWidth = Math.min(100, (width - 100) / Math.min(6, visibleBanks) - 20)
        const bankHeight = 60
        const startX = 50
        const banksPerRow = Math.floor((width - 100) / (bankWidth + 50))
        const visibleStates = bankStates.slice(0, visibleBanks)

        visibleStates.forEach((bank, i) => {
            const row = Math.floor(i / banksPerRow), col = i % banksPerRow, isEvenRow = row % 2 === 0
            const x = isEvenRow ? startX + col * (bankWidth + 50) : width - startX - bankWidth - col * (bankWidth + 50)
            const y = 90 + row * 130

            ctx.fillStyle = 'rgba(100,150,255,0.1)'; ctx.beginPath(); ctx.roundRect(x, y, bankWidth, bankHeight, 8); ctx.fill()
            ctx.strokeStyle = i === animationStep && isAnimating ? 'rgba(220,180,80,0.8)' : 'rgba(100,150,255,0.4)'; ctx.lineWidth = i === animationStep && isAnimating ? 2 : 1; ctx.stroke()

            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(`Bank ${String.fromCharCode(65 + i)}`, x + bankWidth / 2, y + 16)
            ctx.fillStyle = 'rgba(100,200,150,0.8)'; ctx.font = '10px system-ui'; ctx.fillText(`+$${bank.deposits.toFixed(0)}`, x + bankWidth / 2, y + 32)
            ctx.fillStyle = 'rgba(255,100,100,0.6)'; ctx.font = '9px monospace'; ctx.textAlign = 'left'; ctx.fillText(`R: $${bank.reserves.toFixed(0)}`, x + 5, y + bankHeight - 8)
            ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(100,150,255,0.8)'; ctx.fillText(`L: $${bank.loans.toFixed(0)}`, x + bankWidth - 5, y + bankHeight - 8)

            if (i < visibleStates.length - 1) {
                const isLastInRow = (i + 1) % banksPerRow === 0
                if (isLastInRow) {
                    ctx.strokeStyle = 'rgba(100,200,150,0.5)'; ctx.lineWidth = 2; ctx.beginPath()
                    ctx.moveTo(x + bankWidth / 2, y + bankHeight); ctx.lineTo(x + bankWidth / 2, y + bankHeight + 50); ctx.stroke()
                    ctx.fillStyle = 'rgba(100,200,150,0.5)'; ctx.beginPath()
                    ctx.moveTo(x + bankWidth / 2, y + bankHeight + 50); ctx.lineTo(x + bankWidth / 2 - 5, y + bankHeight + 40); ctx.lineTo(x + bankWidth / 2 + 5, y + bankHeight + 40); ctx.closePath(); ctx.fill()
                } else {
                    ctx.strokeStyle = 'rgba(100,200,150,0.5)'; ctx.lineWidth = 2
                    const arrowDir = isEvenRow ? 1 : -1
                    ctx.beginPath(); ctx.moveTo(x + (isEvenRow ? bankWidth : 0), y + bankHeight / 2); ctx.lineTo(x + (isEvenRow ? bankWidth + 35 : -35), y + bankHeight / 2); ctx.stroke()
                    ctx.fillStyle = 'rgba(100,200,150,0.5)'; ctx.beginPath()
                    const arrowX = x + (isEvenRow ? bankWidth + 35 : -35)
                    ctx.moveTo(arrowX, y + bankHeight / 2); ctx.lineTo(arrowX - arrowDir * 8, y + bankHeight / 2 - 5); ctx.lineTo(arrowX - arrowDir * 8, y + bankHeight / 2 + 5); ctx.closePath(); ctx.fill()
                }
            }
        })

        // Summary meters
        const meterY = height - 80, meterW = (width - 200) / 3
        const meters = [
            { label: 'Total Deposits', value: totalDeposits, color: 'rgba(100,200,150,', pct: totalDeposits / maxMoney },
            { label: 'Total Reserves', value: totalReserves, color: 'rgba(255,100,100,', pct: totalReserves / maxMoney },
            { label: 'Total Loans', value: totalLoans, color: 'rgba(100,150,255,', pct: totalLoans / maxMoney },
        ]
        meters.forEach((m, i) => {
            const mx = 50 + meterW * i
            ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.roundRect(mx, meterY, meterW - 20, 35, 6); ctx.fill()
            ctx.fillStyle = m.color + '0.6)'; ctx.beginPath(); ctx.roundRect(mx, meterY, (meterW - 20) * Math.min(1, m.pct), 35, 6); ctx.fill()
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'; ctx.fillText(m.label, mx + meterW / 2 - 10, meterY + 14)
            ctx.font = 'bold 14px monospace'; ctx.fillStyle = m.color + '1)'; ctx.fillText(`$${m.value.toFixed(0)}`, mx + meterW / 2 - 10, meterY + 28)
        })

        return () => window.removeEventListener('resize', resize)
    }, [bankStates, visibleBanks, animationStep, isAnimating, maxMoney, totalDeposits, totalReserves, totalLoans])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <Slider label="Initial Deposit ($)" value={initialDeposit} onChange={setInitialDeposit} min={500} max={5000} step={100} />
                        <Slider label="Reserve Ratio (%)" value={reserveRatio} onChange={setReserveRatio} min={5} max={50} />
                        <div className="flex gap-2 flex-wrap">
                            <Button onClick={startAnimation} disabled={isAnimating}>{isAnimating ? 'Running...' : 'Animate'}</Button>
                            <Button onClick={() => setAnimationStep(bankStates.length - 1)} variant="secondary">Show All</Button>
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 4" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title="Money Creation" items={[
                        { label: 'Multiplier', value: `${moneyMultiplier.toFixed(1)}x`, color: GOLD },
                        { label: 'Initial Deposit', value: `$${initialDeposit}`, color: 'rgba(100,200,150,1)' },
                        { label: 'Max Money Supply', value: `$${maxMoney.toFixed(0)}`, color: GOLD },
                        { label: 'Current Total', value: `$${totalDeposits.toFixed(0)}` },
                        { label: 'Progress', value: `${((totalDeposits / maxMoney) * 100).toFixed(1)}%`, color: 'rgba(100,150,255,1)' },
                    ]} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={[
                        { label: 'Multiplier', expression: 'm = 1 / rr', description: 'Simple money multiplier' },
                        { label: 'Max M', expression: 'M = D x (1/rr)', description: 'Maximum money created' },
                        { label: 'Each Bank', expression: 'Loans = D x (1 - rr)', description: 'Amount each bank can lend' },
                    ]} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
