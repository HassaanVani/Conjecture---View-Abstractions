import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BankData {
    deposits: number
    reserves: number
    loans: number
    excessReserves: number
}

export default function MoneyMultiplier() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [initialDeposit, setInitialDeposit] = useState(1000)
    const [reserveRatio, setReserveRatio] = useState(10)
    const [animationStep, setAnimationStep] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [speed] = useState(1)
    const [showDemo, setShowDemo] = useState(false)
    const [demoStep, setDemoStep] = useState(0)
    const animationRef = useRef<number | null>(null)

    const rr = reserveRatio / 100
    const moneyMultiplier = 1 / rr
    const maxMoney = initialDeposit * moneyMultiplier

    // Calculate bank states for each round
    const calculateBankStates = useCallback((): BankData[] => {
        const states: BankData[] = []
        let remainingDeposit = initialDeposit

        for (let i = 0; i < 12 && remainingDeposit > 0.5; i++) {
            const reserves = remainingDeposit * rr
            const loans = remainingDeposit * (1 - rr)
            states.push({
                deposits: remainingDeposit,
                reserves,
                loans,
                excessReserves: 0,
            })
            remainingDeposit = loans
        }

        return states
    }, [initialDeposit, rr])

    const bankStates = calculateBankStates()
    const visibleBanks = Math.min(animationStep + 1, bankStates.length)

    const totalDeposits = bankStates.slice(0, visibleBanks).reduce((sum, b) => sum + b.deposits, 0)
    const totalReserves = bankStates.slice(0, visibleBanks).reduce((sum, b) => sum + b.reserves, 0)
    const totalLoans = bankStates.slice(0, visibleBanks).reduce((sum, b) => sum + b.loans, 0)

    const startAnimation = useCallback(() => {
        setAnimationStep(0)
        setIsAnimating(true)
    }, [])

    useEffect(() => {
        if (isAnimating && animationStep < bankStates.length - 1) {
            animationRef.current = window.setTimeout(() => {
                setAnimationStep(s => s + 1)
            }, 1200 / speed)
        } else if (animationStep >= bankStates.length - 1) {
            setIsAnimating(false)
        }

        return () => {
            if (animationRef.current) clearTimeout(animationRef.current)
        }
    }, [isAnimating, animationStep, bankStates.length, speed])

    // Reset animation when parameters change
    useEffect(() => {
        setAnimationStep(bankStates.length - 1)
        setIsAnimating(false)
    }, [initialDeposit, reserveRatio])

    const demoSteps = [
        {
            title: 'Fractional Reserve Banking',
            description: 'Banks don\'t keep all deposits in reserve — they lend most of it out. This creates new money in the economy!',
            action: () => { setAnimationStep(0); setIsAnimating(false) },
        },
        {
            title: 'The Reserve Requirement',
            description: 'Banks must keep a fraction of deposits as reserves (set by the Fed). A 10% reserve ratio means they can lend 90% of each deposit.',
            action: () => { setReserveRatio(10); startAnimation() },
        },
        {
            title: 'Money Creation Chain',
            description: 'Bank A gets $1000 → keeps $100, lends $900. Bank B gets $900 → keeps $90, lends $810. This continues through the banking system!',
            action: () => { startAnimation() },
        },
        {
            title: 'The Money Multiplier',
            description: 'The multiplier = 1 / reserve ratio. With 10% reserves: 1 / 0.10 = 10x. So $1000 initial deposit creates up to $10,000 total money!',
            action: () => { setAnimationStep(bankStates.length - 1) },
        },
        {
            title: 'Higher Reserves = Less Money',
            description: 'Try increasing the reserve ratio. More reserves means less lending, which means less money creation. This is how the Fed controls money supply.',
            action: () => { setReserveRatio(20); setAnimationStep(bankStates.length - 1) },
        },
        {
            title: 'Try It Yourself!',
            description: 'Adjust the initial deposit and reserve ratio. Watch how money multiplies through the banking system. Click "Animate" to see it happen step by step.',
            action: () => { setReserveRatio(10); setAnimationStep(bankStates.length - 1) },
        },
    ]

    useEffect(() => {
        if (showDemo) {
            demoSteps[demoStep].action()
        }
    }, [showDemo, demoStep])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        const width = canvas.offsetWidth
        const height = canvas.offsetHeight

        ctx.fillStyle = '#1a150a'
        ctx.fillRect(0, 0, width, height)

        // Draw bank chain
        const bankWidth = Math.min(100, (width - 100) / Math.min(6, visibleBanks) - 20)
        const bankHeight = 60
        const startX = 50
        // Row positions for multi-row display
        const banksPerRow = Math.floor((width - 100) / (bankWidth + 50))

        const visibleStates = bankStates.slice(0, visibleBanks)

        visibleStates.forEach((bank, i) => {
            const row = Math.floor(i / banksPerRow)
            const col = i % banksPerRow
            const isEvenRow = row % 2 === 0

            const x = isEvenRow
                ? startX + col * (bankWidth + 50)
                : width - startX - bankWidth - col * (bankWidth + 50)
            const y = 90 + row * 130

            // Bank box
            ctx.fillStyle = 'rgba(100, 150, 255, 0.1)'
            ctx.beginPath()
            ctx.roundRect(x, y, bankWidth, bankHeight, 8)
            ctx.fill()

            ctx.strokeStyle = i === animationStep && isAnimating ? 'rgba(220, 180, 80, 0.8)' : 'rgba(100, 150, 255, 0.4)'
            ctx.lineWidth = i === animationStep && isAnimating ? 2 : 1
            ctx.stroke()

            // Bank label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.font = 'bold 11px system-ui'
            ctx.textAlign = 'center'
            ctx.fillText(`Bank ${String.fromCharCode(65 + i)}`, x + bankWidth / 2, y + 16)

            // Deposit
            ctx.fillStyle = 'rgba(100, 200, 150, 0.8)'
            ctx.font = '10px system-ui'
            ctx.fillText(`+$${bank.deposits.toFixed(0)}`, x + bankWidth / 2, y + 32)

            // Reserves and loans
            ctx.fillStyle = 'rgba(255, 100, 100, 0.6)'
            ctx.font = '9px monospace'
            ctx.textAlign = 'left'
            ctx.fillText(`R: $${bank.reserves.toFixed(0)}`, x + 5, y + bankHeight - 8)

            ctx.textAlign = 'right'
            ctx.fillStyle = 'rgba(100, 150, 255, 0.8)'
            ctx.fillText(`L: $${bank.loans.toFixed(0)}`, x + bankWidth - 5, y + bankHeight - 8)

            // Arrow to next bank
            if (i < visibleStates.length - 1) {
                // Check if last in current row
                const isLastInRow = (i + 1) % banksPerRow === 0

                if (isLastInRow) {
                    // Draw curved arrow down
                    ctx.strokeStyle = 'rgba(100, 200, 150, 0.5)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.moveTo(x + bankWidth / 2, y + bankHeight)
                    ctx.lineTo(x + bankWidth / 2, y + bankHeight + 50)
                    ctx.stroke()

                    // Arrow head
                    ctx.fillStyle = 'rgba(100, 200, 150, 0.5)'
                    ctx.beginPath()
                    ctx.moveTo(x + bankWidth / 2, y + bankHeight + 50)
                    ctx.lineTo(x + bankWidth / 2 - 5, y + bankHeight + 40)
                    ctx.lineTo(x + bankWidth / 2 + 5, y + bankHeight + 40)
                    ctx.closePath()
                    ctx.fill()
                } else {
                    // Arrow direction based on row

                    ctx.strokeStyle = 'rgba(100, 200, 150, 0.5)'
                    ctx.lineWidth = 2
                    const arrowDir = isEvenRow ? 1 : -1

                    ctx.beginPath()
                    ctx.moveTo(x + (isEvenRow ? bankWidth : 0), y + bankHeight / 2)
                    ctx.lineTo(x + (isEvenRow ? bankWidth + 35 : -35), y + bankHeight / 2)
                    ctx.stroke()

                    // Arrow head
                    ctx.fillStyle = 'rgba(100, 200, 150, 0.5)'
                    ctx.beginPath()
                    const arrowX = x + (isEvenRow ? bankWidth + 35 : -35)
                    ctx.moveTo(arrowX, y + bankHeight / 2)
                    ctx.lineTo(arrowX - arrowDir * 8, y + bankHeight / 2 - 5)
                    ctx.lineTo(arrowX - arrowDir * 8, y + bankHeight / 2 + 5)
                    ctx.closePath()
                    ctx.fill()
                }
            }
        })

        // Summary meters at bottom
        const meterY = height - 80
        const meterWidth = (width - 200) / 3

        // Total Deposits meter
        const depositPct = totalDeposits / maxMoney
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.beginPath()
        ctx.roundRect(50, meterY, meterWidth - 20, 35, 6)
        ctx.fill()

        ctx.fillStyle = 'rgba(100, 200, 150, 0.6)'
        ctx.beginPath()
        ctx.roundRect(50, meterY, (meterWidth - 20) * Math.min(1, depositPct), 35, 6)
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '11px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Total Deposits', 50 + meterWidth / 2 - 10, meterY + 14)
        ctx.font = 'bold 14px monospace'
        ctx.fillStyle = 'rgba(100, 200, 150, 1)'
        ctx.fillText(`$${totalDeposits.toFixed(0)}`, 50 + meterWidth / 2 - 10, meterY + 28)

        // Total Reserves meter
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.beginPath()
        ctx.roundRect(50 + meterWidth, meterY, meterWidth - 20, 35, 6)
        ctx.fill()

        const reservePct = totalReserves / maxMoney
        ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
        ctx.beginPath()
        ctx.roundRect(50 + meterWidth, meterY, (meterWidth - 20) * Math.min(1, reservePct), 35, 6)
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '11px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Total Reserves', 50 + meterWidth + meterWidth / 2 - 10, meterY + 14)
        ctx.font = 'bold 14px monospace'
        ctx.fillStyle = 'rgba(255, 100, 100, 1)'
        ctx.fillText(`$${totalReserves.toFixed(0)}`, 50 + meterWidth + meterWidth / 2 - 10, meterY + 28)

        // Total Loans meter
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.beginPath()
        ctx.roundRect(50 + meterWidth * 2, meterY, meterWidth - 20, 35, 6)
        ctx.fill()

        const loanPct = totalLoans / maxMoney
        ctx.fillStyle = 'rgba(100, 150, 255, 0.5)'
        ctx.beginPath()
        ctx.roundRect(50 + meterWidth * 2, meterY, (meterWidth - 20) * Math.min(1, loanPct), 35, 6)
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '11px system-ui'
        ctx.fillText('Total Loans', 50 + meterWidth * 2 + meterWidth / 2 - 10, meterY + 14)
        ctx.font = 'bold 14px monospace'
        ctx.fillStyle = 'rgba(100, 150, 255, 1)'
        ctx.fillText(`$${totalLoans.toFixed(0)}`, 50 + meterWidth * 2 + meterWidth / 2 - 10, meterY + 28)

        return () => window.removeEventListener('resize', resize)
    }, [bankStates, visibleBanks, animationStep, isAnimating, maxMoney, totalDeposits, totalReserves, totalLoans])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Formula display */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10"
                >
                    <div className="text-xs text-white/50 mb-1">Money Multiplier</div>
                    <div className="font-mono text-lg">
                        <span className="text-white/60">1 / </span>
                        <span className="text-yellow-400">{reserveRatio}%</span>
                        <span className="text-white/60"> = </span>
                        <span className="text-green-400 font-bold">{moneyMultiplier.toFixed(1)}x</span>
                    </div>
                </motion.div>

                {/* Info panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-xs"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-white/60">Money Creation</span>
                        <button
                            onClick={() => { setShowDemo(true); setDemoStep(0) }}
                            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            Learn
                        </button>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-white/50">Initial Deposit:</span>
                            <span className="text-green-400 font-mono">${initialDeposit}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">Max Money Supply:</span>
                            <span className="text-yellow-400 font-mono">${maxMoney.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">Current Total:</span>
                            <span className="text-white font-mono">${totalDeposits.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">Progress:</span>
                            <span className="text-blue-400 font-mono">{((totalDeposits / maxMoney) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm">Initial Deposit</span>
                            <input
                                type="range"
                                min={500}
                                max={5000}
                                step={100}
                                value={initialDeposit}
                                onChange={e => setInitialDeposit(+e.target.value)}
                                className="w-28 accent-green-400"
                            />
                            <span className="text-green-400 text-sm font-mono w-14">${initialDeposit}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm">Reserve Ratio</span>
                            <input
                                type="range"
                                min={5}
                                max={50}
                                step={1}
                                value={reserveRatio}
                                onChange={e => setReserveRatio(+e.target.value)}
                                className="w-28 accent-yellow-400"
                            />
                            <span className="text-yellow-400 text-sm font-mono w-10">{reserveRatio}%</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={startAnimation}
                            disabled={isAnimating}
                            className="px-4 py-1.5 rounded-lg text-sm bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-40"
                        >
                            {isAnimating ? 'Animating...' : 'Animate'}
                        </button>
                        <button
                            onClick={() => setAnimationStep(bankStates.length - 1)}
                            className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                        >
                            Show All
                        </button>
                    </div>
                </div>
            </div>

            {/* Demo Modal */}
            <AnimatePresence>
                {showDemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowDemo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a150a] border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs text-white/40">
                                    {demoStep + 1} of {demoSteps.length}
                                </span>
                                <button
                                    onClick={() => setShowDemo(false)}
                                    className="text-white/40 hover:text-white text-xl"
                                >
                                    ×
                                </button>
                            </div>

                            <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                                {demoSteps[demoStep].title}
                            </h3>
                            <p className="text-white/70 mb-6 leading-relaxed">
                                {demoSteps[demoStep].description}
                            </p>

                            <div className="flex justify-center gap-2 mb-6">
                                {demoSteps.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setDemoStep(i)}
                                        className={`w-2 h-2 rounded-full transition-colors ${i === demoStep ? 'bg-yellow-400' : 'bg-white/20 hover:bg-white/40'
                                            }`}
                                    />
                                ))}
                            </div>

                            <div className="flex justify-between gap-3">
                                <button
                                    onClick={() => setDemoStep(Math.max(0, demoStep - 1))}
                                    disabled={demoStep === 0}
                                    className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Previous
                                </button>
                                {demoStep < demoSteps.length - 1 ? (
                                    <button
                                        onClick={() => setDemoStep(demoStep + 1)}
                                        className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                                    >
                                        Next →
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowDemo(false)}
                                        className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                    >
                                        Done ✓
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
