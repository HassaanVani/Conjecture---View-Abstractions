import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type GamePreset = 'prisoners-dilemma' | 'chicken' | 'stag-hunt' | 'battle-of-sexes' | 'custom'

interface Payoffs {
    CC: [number, number]
    CD: [number, number]
    DC: [number, number]
    DD: [number, number]
}

interface GameInfo {
    name: string
    payoffs: Payoffs
    description: string
    realWorld: string
}

const presets: Record<GamePreset, GameInfo> = {
    'prisoners-dilemma': {
        name: "Prisoner's Dilemma",
        payoffs: { CC: [3, 3], CD: [0, 5], DC: [5, 0], DD: [1, 1] },
        description: 'Both players would be better off cooperating, but individual incentives lead to mutual defection.',
        realWorld: 'Arms races, price wars, environmental agreements',
    },
    'chicken': {
        name: 'Game of Chicken',
        payoffs: { CC: [0, 0], CD: [-1, 1], DC: [1, -1], DD: [-10, -10] },
        description: 'Neither wants to back down, but mutual aggression is catastrophic. Two equilibria exist.',
        realWorld: 'Nuclear standoffs, labor negotiations, traffic merging',
    },
    'stag-hunt': {
        name: 'Stag Hunt',
        payoffs: { CC: [4, 4], CD: [0, 3], DC: [3, 0], DD: [3, 3] },
        description: 'Cooperation yields the best outcome, but requires trust. Defection is safer but suboptimal.',
        realWorld: 'Team projects, international cooperation, social contracts',
    },
    'battle-of-sexes': {
        name: 'Battle of the Sexes',
        payoffs: { CC: [3, 2], CD: [0, 0], DC: [0, 0], DD: [2, 3] },
        description: 'Players prefer different outcomes but both prefer coordination over disagreement.',
        realWorld: 'Date night decisions, technology standards, meeting locations',
    },
    'custom': {
        name: 'Custom Game',
        payoffs: { CC: [3, 3], CD: [0, 5], DC: [5, 0], DD: [1, 1] },
        description: 'Create your own game by editing the payoffs directly.',
        realWorld: 'Click any cell to edit payoff values',
    },
}

export default function GameTheory() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [preset, setPreset] = useState<GamePreset>('prisoners-dilemma')
    const [payoffs, setPayoffs] = useState<Payoffs>(presets['prisoners-dilemma'].payoffs)
    const [hoveredCell, setHoveredCell] = useState<string | null>(null)
    const [selectedCell, setSelectedCell] = useState<string | null>(null)
    const [editingPayoff, setEditingPayoff] = useState<{ cell: string; player: 'A' | 'B' } | null>(null)
    const [editValue, setEditValue] = useState('')
    const [showDemo, setShowDemo] = useState(false)
    const [demoStep, setDemoStep] = useState(0)

    const loadPreset = (p: GamePreset) => {
        setPreset(p)
        setPayoffs({ ...presets[p].payoffs })
        setSelectedCell(null)
        setEditingPayoff(null)
    }

    // Find Nash Equilibria with strict inequality check
    const findNashEquilibria = (): string[] => {
        const equilibria: string[] = []

        // CC: A can't improve by switching to D (DC[0] <= CC[0]), B can't improve (CD[1] <= CC[1])
        if (payoffs.DC[0] <= payoffs.CC[0] && payoffs.CD[1] <= payoffs.CC[1]) equilibria.push('CC')

        // CD: A can't improve (DD[0] <= CD[0]), B can't improve (CC[1] <= CD[1])
        if (payoffs.DD[0] <= payoffs.CD[0] && payoffs.CC[1] <= payoffs.CD[1]) equilibria.push('CD')

        // DC: A can't improve (CC[0] <= DC[0]), B can't improve (DD[1] <= DC[1])
        if (payoffs.CC[0] <= payoffs.DC[0] && payoffs.DD[1] <= payoffs.DC[1]) equilibria.push('DC')

        // DD: A can't improve (CD[0] <= DD[0]), B can't improve (DC[1] <= DD[1])
        if (payoffs.CD[0] <= payoffs.DD[0] && payoffs.DC[1] <= payoffs.DD[1]) equilibria.push('DD')

        return equilibria
    }

    // Find dominant strategies (strictly better regardless of opponent's choice)
    const findDominantStrategies = () => {
        let aDominant: 'C' | 'D' | null = null
        if (payoffs.CC[0] > payoffs.DC[0] && payoffs.CD[0] > payoffs.DD[0]) aDominant = 'C'
        else if (payoffs.DC[0] > payoffs.CC[0] && payoffs.DD[0] > payoffs.CD[0]) aDominant = 'D'

        let bDominant: 'C' | 'D' | null = null
        if (payoffs.CC[1] > payoffs.CD[1] && payoffs.DC[1] > payoffs.DD[1]) bDominant = 'C'
        else if (payoffs.CD[1] > payoffs.CC[1] && payoffs.DD[1] > payoffs.DC[1]) bDominant = 'D'

        return { a: aDominant, b: bDominant }
    }

    // Check for Pareto optimality
    const isParetoOptimal = (cell: string): boolean => {
        const outcomes = ['CC', 'CD', 'DC', 'DD'] as const
        const cellPayoff = payoffs[cell as keyof Payoffs]

        for (const other of outcomes) {
            if (other === cell) continue
            const otherPayoff = payoffs[other]
            // If other outcome is better for both players, this is not Pareto optimal
            if (otherPayoff[0] >= cellPayoff[0] && otherPayoff[1] >= cellPayoff[1] &&
                (otherPayoff[0] > cellPayoff[0] || otherPayoff[1] > cellPayoff[1])) {
                return false
            }
        }
        return true
    }

    const demoSteps = [
        {
            title: 'Game Theory Basics',
            description: 'Game theory studies strategic decisions where your outcome depends on others\' choices. Each cell shows payoffs for Player A (blue, top-left) and Player B (orange, bottom-right).',
        },
        {
            title: 'Nash Equilibrium',
            description: 'A Nash equilibrium (green border) is a stable outcome where neither player can improve by changing their strategy alone. It\'s where rational players "settle."',
        },
        {
            title: 'Dominant Strategy',
            description: 'A dominant strategy is always best regardless of what the opponent does. In Prisoner\'s Dilemma, both players have "Defect" as dominant, even though mutual cooperation is better!',
        },
        {
            title: 'The Dilemma',
            description: 'Notice how (C,C) gives both players 3, but the Nash equilibrium (D,D) gives only 1. This is the "dilemma" — individual rationality leads to collective irrationality.',
        },
        {
            title: 'Try Different Games',
            description: 'Click the presets to see different strategic situations. Try "Chicken" for brinkmanship or "Stag Hunt" for coordination problems.',
        },
        {
            title: 'Create Your Own',
            description: 'Select "Custom" and click any payoff number to edit it. Watch how Nash equilibria and dominant strategies change!',
        },
    ]

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

        const nash = findNashEquilibria()
        const dominant = findDominantStrategies()

        // Matrix dimensions - responsive
        const cellSize = Math.min(140, (width - 200) / 2.5, (height - 200) / 2.5)
        const matrixX = (width - cellSize * 2) / 2
        const matrixY = (height - cellSize * 2) / 2 - 10

        // Player labels with icons
        ctx.fillStyle = 'rgba(100, 180, 255, 0.9)'
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Player B →', matrixX + cellSize, matrixY - 50)

        ctx.fillStyle = 'rgba(255, 150, 100, 0.9)'
        ctx.save()
        ctx.translate(matrixX - 50, matrixY + cellSize)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('Player A →', 0, 0)
        ctx.restore()

        // Strategy labels
        ctx.font = '13px system-ui'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillText('Cooperate', matrixX + cellSize / 2, matrixY - 20)
        ctx.fillText('Defect', matrixX + cellSize * 1.5, matrixY - 20)

        ctx.textAlign = 'right'
        ctx.fillText('Cooperate', matrixX - 15, matrixY + cellSize / 2 + 5)
        ctx.fillText('Defect', matrixX - 15, matrixY + cellSize * 1.5 + 5)

        // Draw cells
        const cells: { key: string; x: number; y: number; payoff: [number, number] }[] = [
            { key: 'CC', x: matrixX, y: matrixY, payoff: payoffs.CC },
            { key: 'CD', x: matrixX + cellSize, y: matrixY, payoff: payoffs.CD },
            { key: 'DC', x: matrixX, y: matrixY + cellSize, payoff: payoffs.DC },
            { key: 'DD', x: matrixX + cellSize, y: matrixY + cellSize, payoff: payoffs.DD },
        ]

        cells.forEach(cell => {
            const isNash = nash.includes(cell.key)
            const isHovered = hoveredCell === cell.key
            const isSelected = selectedCell === cell.key
            const isPareto = isParetoOptimal(cell.key)

            // Cell background
            let bgColor = 'rgba(255, 255, 255, 0.03)'
            if (isNash) bgColor = 'rgba(80, 200, 120, 0.15)'
            if (isHovered) bgColor = 'rgba(220, 180, 80, 0.1)'
            if (isSelected) bgColor = 'rgba(220, 180, 80, 0.2)'

            ctx.fillStyle = bgColor
            ctx.beginPath()
            ctx.roundRect(cell.x + 2, cell.y + 2, cellSize - 4, cellSize - 4, 8)
            ctx.fill()

            // Cell border
            ctx.strokeStyle = isNash ? 'rgba(80, 200, 120, 0.8)' : 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = isNash ? 3 : 1
            ctx.stroke()

            // Diagonal line to separate payoffs
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(cell.x + 10, cell.y + cellSize - 10)
            ctx.lineTo(cell.x + cellSize - 10, cell.y + 10)
            ctx.stroke()

            // Player A payoff (blue, top-left)
            ctx.font = 'bold 24px system-ui'
            ctx.textAlign = 'left'
            ctx.fillStyle = 'rgba(100, 180, 255, 1)'
            ctx.fillText(cell.payoff[0].toString(), cell.x + 18, cell.y + 40)

            // Player B payoff (orange, bottom-right)
            ctx.textAlign = 'right'
            ctx.fillStyle = 'rgba(255, 150, 100, 1)'
            ctx.fillText(cell.payoff[1].toString(), cell.x + cellSize - 18, cell.y + cellSize - 20)

            // Nash badge
            if (isNash) {
                ctx.fillStyle = 'rgba(80, 200, 120, 0.9)'
                ctx.font = 'bold 10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('NASH', cell.x + cellSize / 2, cell.y + cellSize - 8)
            }

            // Pareto indicator
            if (isPareto && !isNash) {
                ctx.fillStyle = 'rgba(180, 150, 255, 0.7)'
                ctx.font = '9px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Pareto', cell.x + cellSize / 2, cell.y + 15)
            }
        })

        // Dominant strategy indicators
        ctx.font = '11px system-ui'
        ctx.textAlign = 'center'

        if (dominant.b) {
            ctx.fillStyle = 'rgba(100, 180, 255, 0.7)'
            const x = dominant.b === 'C' ? matrixX + cellSize / 2 : matrixX + cellSize * 1.5
            ctx.fillText('★ Dominant', x, matrixY - 35)
        }

        if (dominant.a) {
            ctx.fillStyle = 'rgba(255, 150, 100, 0.7)'
            ctx.textAlign = 'right'
            const y = dominant.a === 'C' ? matrixY + cellSize / 2 : matrixY + cellSize * 1.5
            ctx.fillText('★ Dominant', matrixX - 15, y + 20)
        }

        // Legend
        ctx.textAlign = 'left'
        ctx.font = '11px system-ui'
        let legendY = height - 80

        const legendItems = [
            { color: 'rgba(100, 180, 255, 1)', label: 'Player A payoff' },
            { color: 'rgba(255, 150, 100, 1)', label: 'Player B payoff' },
            { color: 'rgba(80, 200, 120, 0.8)', label: 'Nash Equilibrium' },
        ]

        legendItems.forEach(item => {
            ctx.fillStyle = item.color
            ctx.beginPath()
            ctx.arc(30, legendY, 5, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
            ctx.fillText(item.label, 45, legendY + 4)
            legendY += 20
        })

        return () => window.removeEventListener('resize', resize)
    }, [payoffs, hoveredCell, selectedCell])

    // Handle cell hover for tooltip
    const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const width = canvas.offsetWidth
        const height = canvas.offsetHeight
        const cellSize = Math.min(140, (width - 200) / 2.5, (height - 200) / 2.5)
        const matrixX = (width - cellSize * 2) / 2
        const matrixY = (height - cellSize * 2) / 2 - 10

        let found: string | null = null
        const cells = [
            { key: 'CC', x: matrixX, y: matrixY },
            { key: 'CD', x: matrixX + cellSize, y: matrixY },
            { key: 'DC', x: matrixX, y: matrixY + cellSize },
            { key: 'DD', x: matrixX + cellSize, y: matrixY + cellSize },
        ]

        for (const cell of cells) {
            if (x >= cell.x && x <= cell.x + cellSize && y >= cell.y && y <= cell.y + cellSize) {
                found = cell.key
                break
            }
        }
        setHoveredCell(found)
    }

    const handleCellClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (hoveredCell && preset === 'custom') {
            const canvas = canvasRef.current
            if (!canvas) return

            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight
            const cellSize = Math.min(140, (width - 200) / 2.5, (height - 200) / 2.5)
            const matrixX = (width - cellSize * 2) / 2
            const matrixY = (height - cellSize * 2) / 2 - 10

            const cell = [
                { key: 'CC', x: matrixX, y: matrixY },
                { key: 'CD', x: matrixX + cellSize, y: matrixY },
                { key: 'DC', x: matrixX, y: matrixY + cellSize },
                { key: 'DD', x: matrixX + cellSize, y: matrixY + cellSize },
            ].find(c => c.key === hoveredCell)

            if (cell) {
                const relX = x - cell.x
                const relY = y - cell.y
                // Top-left is Player A, bottom-right is Player B
                const isPlayerA = relX + relY < cellSize
                setEditingPayoff({ cell: hoveredCell, player: isPlayerA ? 'A' : 'B' })
                setEditValue(payoffs[hoveredCell as keyof Payoffs][isPlayerA ? 0 : 1].toString())
            }
        }
        setSelectedCell(hoveredCell)
    }

    const savePayoffEdit = () => {
        if (!editingPayoff) return
        const value = parseInt(editValue) || 0
        const cellKey = editingPayoff.cell as keyof Payoffs
        const idx = editingPayoff.player === 'A' ? 0 : 1

        setPayoffs(prev => ({
            ...prev,
            [cellKey]: idx === 0
                ? [value, prev[cellKey][1]]
                : [prev[cellKey][0], value]
        }))
        setEditingPayoff(null)
    }

    const nash = findNashEquilibria()
    const dominant = findDominantStrategies()
    const presetInfo = presets[preset]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-pointer"
                    onMouseMove={handleCanvasMove}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={handleCellClick}
                />

                {/* Preset selector */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex gap-2 flex-wrap"
                >
                    {Object.entries(presets).map(([key, p]) => (
                        <button
                            key={key}
                            onClick={() => loadPreset(key as GamePreset)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${preset === key
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'text-white/50 hover:text-white bg-black/30 border border-white/10'
                                }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </motion.div>

                {/* Analysis panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-xs"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-yellow-400">{presetInfo.name}</span>
                        <button
                            onClick={() => { setShowDemo(true); setDemoStep(0) }}
                            className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                        >
                            Learn
                        </button>
                    </div>

                    <p className="text-xs text-white/60 mb-3 leading-relaxed">{presetInfo.description}</p>
                    <p className="text-xs text-white/40 mb-4 italic">{presetInfo.realWorld}</p>

                    <div className="space-y-2 text-xs border-t border-white/10 pt-3">
                        <div className="flex justify-between">
                            <span className="text-white/50">Nash Equilibrium:</span>
                            <span className={nash.length > 0 ? 'text-green-400 font-mono' : 'text-white/30'}>
                                {nash.length > 0 ? nash.map(n => `(${n[0]},${n[1]})`).join(', ') : 'None'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">A's Dominant:</span>
                            <span className={dominant.a ? 'text-blue-400' : 'text-white/30'}>
                                {dominant.a || 'None'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">B's Dominant:</span>
                            <span className={dominant.b ? 'text-orange-400' : 'text-white/30'}>
                                {dominant.b || 'None'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Payoff edit modal */}
                <AnimatePresence>
                    {editingPayoff && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 z-50"
                            onClick={() => setEditingPayoff(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                className="bg-[#1a150a] border border-white/20 rounded-xl p-4"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="text-sm text-white/60 mb-2">
                                    Edit Player {editingPayoff.player} payoff in ({editingPayoff.cell[0]}, {editingPayoff.cell[1]})
                                </div>
                                <input
                                    type="number"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && savePayoffEdit()}
                                    className="w-20 px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-center font-mono"
                                    autoFocus
                                />
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => setEditingPayoff(null)}
                                        className="px-3 py-1 text-xs text-white/50 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={savePayoffEdit}
                                        className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                                    >
                                        Save
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="text-xs text-white/40">
                        C = Cooperate, D = Defect | Nash = no player can improve by switching alone
                    </div>
                    {preset === 'custom' && (
                        <div className="text-xs text-yellow-400/70">
                            Click payoffs to edit
                        </div>
                    )}
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
