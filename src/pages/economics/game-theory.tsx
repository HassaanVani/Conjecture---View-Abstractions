import { useState, useEffect, useRef, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ControlPanel, ControlGroup, Button, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

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

const GOLD = 'rgb(220, 180, 80)'

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
        description: 'Neither wants to back down, but mutual aggression is catastrophic.',
        realWorld: 'Nuclear standoffs, labor negotiations, traffic merging',
    },
    'stag-hunt': {
        name: 'Stag Hunt',
        payoffs: { CC: [4, 4], CD: [0, 3], DC: [3, 0], DD: [3, 3] },
        description: 'Cooperation yields the best outcome, but requires trust.',
        realWorld: 'Team projects, international cooperation, social contracts',
    },
    'battle-of-sexes': {
        name: 'Battle of the Sexes',
        payoffs: { CC: [3, 2], CD: [0, 0], DC: [0, 0], DD: [2, 3] },
        description: 'Players prefer different outcomes but both prefer coordination.',
        realWorld: 'Date night decisions, technology standards',
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

    const loadPreset = (p: GamePreset) => {
        setPreset(p)
        setPayoffs({ ...presets[p].payoffs })
        setSelectedCell(null)
        setEditingPayoff(null)
    }

    const findNashEquilibria = (): string[] => {
        const equilibria: string[] = []
        if (payoffs.DC[0] <= payoffs.CC[0] && payoffs.CD[1] <= payoffs.CC[1]) equilibria.push('CC')
        if (payoffs.DD[0] <= payoffs.CD[0] && payoffs.CC[1] <= payoffs.CD[1]) equilibria.push('CD')
        if (payoffs.CC[0] <= payoffs.DC[0] && payoffs.DD[1] <= payoffs.DC[1]) equilibria.push('DC')
        if (payoffs.CD[0] <= payoffs.DD[0] && payoffs.DC[1] <= payoffs.DD[1]) equilibria.push('DD')
        return equilibria
    }

    const findDominantStrategies = () => {
        let aDominant: 'C' | 'D' | null = null
        if (payoffs.CC[0] > payoffs.DC[0] && payoffs.CD[0] > payoffs.DD[0]) aDominant = 'C'
        else if (payoffs.DC[0] > payoffs.CC[0] && payoffs.DD[0] > payoffs.CD[0]) aDominant = 'D'
        let bDominant: 'C' | 'D' | null = null
        if (payoffs.CC[1] > payoffs.CD[1] && payoffs.DC[1] > payoffs.DD[1]) bDominant = 'C'
        else if (payoffs.CD[1] > payoffs.CC[1] && payoffs.DD[1] > payoffs.DC[1]) bDominant = 'D'
        return { a: aDominant, b: bDominant }
    }

    const isParetoOptimal = (cell: string): boolean => {
        const outcomes = ['CC', 'CD', 'DC', 'DD'] as const
        const cellPayoff = payoffs[cell as keyof Payoffs]
        for (const other of outcomes) {
            if (other === cell) continue
            const otherPayoff = payoffs[other]
            if (otherPayoff[0] >= cellPayoff[0] && otherPayoff[1] >= cellPayoff[1] &&
                (otherPayoff[0] > cellPayoff[0] || otherPayoff[1] > cellPayoff[1])) return false
        }
        return true
    }

    const nash = findNashEquilibria()
    const dominant = findDominantStrategies()
    const presetInfo = presets[preset]

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'Game Theory Basics', description: 'Game theory studies strategic decisions where your outcome depends on others\' choices. Each cell shows payoffs for Player A (blue, top-left) and Player B (orange, bottom-right).', setup: () => loadPreset('prisoners-dilemma') },
        { title: 'Nash Equilibrium', description: 'A Nash equilibrium (green border) is a stable outcome where neither player can improve by changing their strategy alone.', setup: () => loadPreset('prisoners-dilemma') },
        { title: 'Dominant Strategy', description: 'A dominant strategy is always best regardless of what the opponent does. In Prisoner\'s Dilemma, both players have "Defect" as dominant.', setup: () => loadPreset('prisoners-dilemma') },
        { title: 'The Dilemma', description: 'Notice (C,C) gives both 3, but Nash (D,D) gives only 1. Individual rationality leads to collective irrationality.', setup: () => loadPreset('prisoners-dilemma') },
        { title: 'Game of Chicken', description: 'Two equilibria exist where one player yields. Mutual aggression is catastrophic. Models brinkmanship and negotiation.', setup: () => loadPreset('chicken') },
        { title: 'Stag Hunt', description: 'Cooperation yields the best outcome but requires trust. Defection is safer but suboptimal. Models social contracts.', setup: () => loadPreset('stag-hunt') },
        { title: 'Battle of the Sexes', description: 'Players prefer different outcomes but both prefer coordination over disagreement. Models technology standards.', setup: () => loadPreset('battle-of-sexes') },
        { title: 'Create Your Own', description: 'Select "Custom" and click any payoff number to edit it. Watch how Nash equilibria and dominant strategies change!', setup: () => loadPreset('custom') },
    ], [])

    const demo = useDemoMode(demoSteps)

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

        const cellSize = Math.min(140, (width - 200) / 2.5, (height - 200) / 2.5)
        const matrixX = (width - cellSize * 2) / 2
        const matrixY = (height - cellSize * 2) / 2 - 10

        ctx.fillStyle = 'rgba(100, 180, 255, 0.9)'
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Player B', matrixX + cellSize, matrixY - 50)

        ctx.fillStyle = 'rgba(255, 150, 100, 0.9)'
        ctx.save()
        ctx.translate(matrixX - 50, matrixY + cellSize)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText('Player A', 0, 0)
        ctx.restore()

        ctx.font = '13px system-ui'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.textAlign = 'center'
        ctx.fillText('Cooperate', matrixX + cellSize / 2, matrixY - 20)
        ctx.fillText('Defect', matrixX + cellSize * 1.5, matrixY - 20)
        ctx.textAlign = 'right'
        ctx.fillText('Cooperate', matrixX - 15, matrixY + cellSize / 2 + 5)
        ctx.fillText('Defect', matrixX - 15, matrixY + cellSize * 1.5 + 5)

        const cells = [
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

            let bgColor = 'rgba(255, 255, 255, 0.03)'
            if (isNash) bgColor = 'rgba(80, 200, 120, 0.15)'
            if (isHovered) bgColor = 'rgba(220, 180, 80, 0.1)'
            if (isSelected) bgColor = 'rgba(220, 180, 80, 0.2)'

            ctx.fillStyle = bgColor
            ctx.beginPath()
            ctx.roundRect(cell.x + 2, cell.y + 2, cellSize - 4, cellSize - 4, 8)
            ctx.fill()
            ctx.strokeStyle = isNash ? 'rgba(80, 200, 120, 0.8)' : 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = isNash ? 3 : 1
            ctx.stroke()

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(cell.x + 10, cell.y + cellSize - 10)
            ctx.lineTo(cell.x + cellSize - 10, cell.y + 10)
            ctx.stroke()

            ctx.font = 'bold 24px system-ui'
            ctx.textAlign = 'left'
            ctx.fillStyle = 'rgba(100, 180, 255, 1)'
            ctx.fillText(cell.payoff[0].toString(), cell.x + 18, cell.y + 40)
            ctx.textAlign = 'right'
            ctx.fillStyle = 'rgba(255, 150, 100, 1)'
            ctx.fillText(cell.payoff[1].toString(), cell.x + cellSize - 18, cell.y + cellSize - 20)

            if (isNash) {
                ctx.fillStyle = 'rgba(80, 200, 120, 0.9)'
                ctx.font = 'bold 10px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('NASH', cell.x + cellSize / 2, cell.y + cellSize - 8)
            }
            if (isPareto && !isNash) {
                ctx.fillStyle = 'rgba(180, 150, 255, 0.7)'
                ctx.font = '9px system-ui'
                ctx.textAlign = 'center'
                ctx.fillText('Pareto', cell.x + cellSize / 2, cell.y + 15)
            }
        })

        ctx.font = '11px system-ui'
        ctx.textAlign = 'center'
        if (dominant.b) {
            ctx.fillStyle = 'rgba(100, 180, 255, 0.7)'
            const x = dominant.b === 'C' ? matrixX + cellSize / 2 : matrixX + cellSize * 1.5
            ctx.fillText('Dominant', x, matrixY - 35)
        }
        if (dominant.a) {
            ctx.fillStyle = 'rgba(255, 150, 100, 0.7)'
            ctx.textAlign = 'right'
            const y = dominant.a === 'C' ? matrixY + cellSize / 2 : matrixY + cellSize * 1.5
            ctx.fillText('Dominant', matrixX - 15, y + 20)
        }

        return () => window.removeEventListener('resize', resize)
    }, [payoffs, hoveredCell, selectedCell])

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
            [cellKey]: idx === 0 ? [value, prev[cellKey][1]] : [prev[cellKey][0], value]
        }))
        setEditingPayoff(null)
    }

    const handleReset = () => {
        loadPreset('prisoners-dilemma')
    }

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

                {/* Top-left: Controls */}
                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ControlGroup label="Game Preset">
                            <ButtonGroup
                                value={preset}
                                onChange={v => loadPreset(v as GamePreset)}
                                options={[
                                    { value: 'prisoners-dilemma', label: 'Prisoner' },
                                    { value: 'chicken', label: 'Chicken' },
                                    { value: 'stag-hunt', label: 'Stag' },
                                    { value: 'battle-of-sexes', label: 'Battle' },
                                    { value: 'custom', label: 'Custom' },
                                ]}
                                color={GOLD}
                            />
                        </ControlGroup>
                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={handleReset} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>

                    <APTag course="Microeconomics" unit="Unit 4" color={GOLD} />

                    <EquationDisplay
                        departmentColor={GOLD}
                        title="Game Theory"
                        equations={[
                            { label: 'Nash', expression: 'No player can improve by unilateral deviation', description: 'Stable outcome' },
                            { label: 'Dominant', expression: 'Best response regardless of opponent', description: 'Strictly preferred strategy' },
                            { label: 'Pareto', expression: 'No outcome makes all better off', description: 'Efficient allocation' },
                        ]}
                        collapsed
                    />
                </div>

                {/* Top-right: Info */}
                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel
                        departmentColor={GOLD}
                        title={presetInfo.name}
                        items={[
                            { label: 'Nash Equilibria', value: nash.length > 0 ? nash.map(n => `(${n[0]},${n[1]})`).join(', ') : 'None', color: 'rgba(80, 200, 120, 1)' },
                            { label: "A's Dominant", value: dominant.a || 'None', color: 'rgba(100, 180, 255, 1)' },
                            { label: "B's Dominant", value: dominant.b || 'None', color: 'rgba(255, 150, 100, 1)' },
                        ]}
                    />
                    <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                        <p className="text-xs text-white/60 leading-relaxed">{presetInfo.description}</p>
                        <p className="text-xs text-white/40 mt-1 italic">{presetInfo.realWorld}</p>
                    </div>
                </div>

                {/* Payoff edit modal */}
                <AnimatePresence>
                    {editingPayoff && (
                        <div
                            className="absolute inset-0 flex items-center justify-center bg-black/50 z-50"
                            onClick={() => setEditingPayoff(null)}
                        >
                            <div
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
                                    <Button onClick={() => setEditingPayoff(null)} variant="secondary">Cancel</Button>
                                    <Button onClick={savePayoffEdit}>Save</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Demo Mode */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode
                        steps={demoSteps}
                        currentStep={demo.currentStep}
                        isOpen={demo.isOpen}
                        onClose={demo.close}
                        onNext={demo.next}
                        onPrev={demo.prev}
                        onGoToStep={demo.goToStep}
                        departmentColor={GOLD}
                    />
                </div>
            </div>
        </div>
    )
}
