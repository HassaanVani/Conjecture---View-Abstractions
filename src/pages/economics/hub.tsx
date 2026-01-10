import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { EconomicsBackground } from '@/components/backgrounds'

type Track = 'micro' | 'macro'

interface Unit {
    number: number
    title: string
    visualizations: {
        id: string
        title: string
        symbol: string
        description: string
        to: string
    }[]
}

const microUnits: Unit[] = [
    {
        number: 1,
        title: 'Basic Economic Concepts',
        visualizations: [
            {
                id: 'ppc',
                title: 'Production Possibilities Curve',
                symbol: 'PPC',
                description: 'Trade-offs, opportunity cost, and economic growth',
                to: '/economics/ppc',
            },
            {
                id: 'comparative',
                title: 'Comparative Advantage',
                symbol: '⇄',
                description: 'Specialization, terms of trade, and gains from trade',
                to: '/economics/comparative',
            },
        ],
    },
    {
        number: 2,
        title: 'Supply and Demand',
        visualizations: [
            {
                id: 'supply-demand',
                title: 'Market Equilibrium',
                symbol: '⚖',
                description: 'Supply, demand, equilibrium, and determinants of shifts',
                to: '/economics/supply-demand',
            },
        ],
    },
    {
        number: 3,
        title: 'Production, Cost, and Perfect Competition',
        visualizations: [
            {
                id: 'costs',
                title: 'Production & Cost Curves',
                symbol: 'MC',
                description: 'Short-run costs, diminishing returns, and profit maximization',
                to: '/economics/costs',
            },
        ],
    },
    {
        number: 4,
        title: 'Imperfect Competition',
        visualizations: [
            {
                id: 'game-theory',
                title: 'Game Theory',
                symbol: '⊞',
                description: 'Nash equilibrium, oligopoly, and strategic behavior',
                to: '/economics/game-theory',
            },
        ],
    },
    {
        number: 5,
        title: 'Factor Markets',
        visualizations: [
            // Future: Labor market visualization
        ],
    },
    {
        number: 6,
        title: 'Market Failure and Government',
        visualizations: [
            {
                id: 'externalities',
                title: 'Externalities',
                symbol: '±',
                description: 'Market failure, deadweight loss, and Pigouvian corrections',
                to: '/economics/externalities',
            },
        ],
    },
]

const macroUnits: Unit[] = [
    {
        number: 1,
        title: 'Basic Economic Concepts',
        visualizations: [
            {
                id: 'circular-flow',
                title: 'Circular Flow Model',
                symbol: '↻',
                description: 'GDP, income approach, expenditure approach',
                to: '/economics/circular-flow',
            },
        ],
    },
    {
        number: 2,
        title: 'Economic Indicators and the Business Cycle',
        visualizations: [
            {
                id: 'business-cycle',
                title: 'Business Cycle',
                symbol: '∿',
                description: 'Expansion, peak, contraction, trough, and indicators',
                to: '/economics/business-cycle',
            },
        ],
    },
    {
        number: 3,
        title: 'National Income and Price Determination',
        visualizations: [
            {
                id: 'ad-as',
                title: 'AD-AS Model',
                symbol: 'Y*',
                description: 'Aggregate demand, short-run & long-run aggregate supply',
                to: '/economics/ad-as',
            },
        ],
    },
    {
        number: 4,
        title: 'Financial Sector',
        visualizations: [
            {
                id: 'money',
                title: 'Money Multiplier',
                symbol: '1/rr',
                description: 'Fractional reserve banking and money creation',
                to: '/economics/money',
            },
            {
                id: 'interest',
                title: 'Compound Interest',
                symbol: 'eʳᵗ',
                description: 'Time value of money and present value',
                to: '/economics/interest',
            },
        ],
    },
    {
        number: 5,
        title: 'Stabilization Policies',
        visualizations: [
            {
                id: 'phillips',
                title: 'Phillips Curve',
                symbol: 'π↔u',
                description: 'Inflation-unemployment tradeoff, NAIRU, expectations',
                to: '/economics/phillips',
            },
        ],
    },
    {
        number: 6,
        title: 'Open Economy—International Trade and Finance',
        visualizations: [
            {
                id: 'forex',
                title: 'Foreign Exchange',
                symbol: '$/€',
                description: 'Currency markets, appreciation, depreciation',
                to: '/economics/forex',
            },
        ],
    },
]

export default function EconomicsHub() {
    const [track, setTrack] = useState<Track>('micro')
    const units = track === 'micro' ? microUnits : macroUnits
    const trackColor = track === 'micro' ? 'rgb(100, 200, 150)' : 'rgb(100, 150, 255)'

    return (
        <div className="min-h-screen relative bg-[#1a150a]">
            <EconomicsBackground />

            <div className="relative z-10 px-8 py-12 max-w-6xl mx-auto">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-8"
                >
                    <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-4 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Hub
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">📈</span>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">
                                AP Economics
                            </h1>
                            <p className="text-white/50 text-lg">
                                Interactive visualizations for AP Micro & Macro
                            </p>
                        </div>
                    </div>
                </motion.header>

                {/* Track Selector */}
                <motion.nav
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-10"
                >
                    <div className="flex gap-4">
                        <button
                            onClick={() => setTrack('micro')}
                            className={`
                                relative px-6 py-3 rounded-xl text-lg font-medium transition-all duration-300
                                flex items-center gap-3 border
                                ${track === 'micro'
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                    : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:bg-white/[0.05] hover:text-white/70'
                                }
                            `}
                        >
                            <span className="text-2xl">🔬</span>
                            <div className="text-left">
                                <div className="font-semibold">Microeconomics</div>
                                <div className="text-xs opacity-60">6 Units • Individual Markets</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setTrack('macro')}
                            className={`
                                relative px-6 py-3 rounded-xl text-lg font-medium transition-all duration-300
                                flex items-center gap-3 border
                                ${track === 'macro'
                                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                    : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:bg-white/[0.05] hover:text-white/70'
                                }
                            `}
                        >
                            <span className="text-2xl">🌐</span>
                            <div className="text-left">
                                <div className="font-semibold">Macroeconomics</div>
                                <div className="text-xs opacity-60">6 Units • National Economy</div>
                            </div>
                        </button>
                    </div>
                </motion.nav>

                {/* Units */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={track}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-8"
                    >
                        {units.map((unit, unitIndex) => (
                            <motion.section
                                key={unit.number}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: unitIndex * 0.1 }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                                        style={{
                                            backgroundColor: `${trackColor}20`,
                                            color: trackColor
                                        }}
                                    >
                                        {unit.number}
                                    </div>
                                    <h2 className="text-xl font-medium text-white/80">
                                        {unit.title}
                                    </h2>
                                </div>

                                {unit.visualizations.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
                                        {unit.visualizations.map((viz) => (
                                            <Link key={viz.id} to={viz.to} className="group block">
                                                <div
                                                    className="relative overflow-hidden rounded-xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                                                >
                                                    <div
                                                        className="absolute top-3 right-3 text-2xl font-mono opacity-10 group-hover:opacity-25 transition-opacity"
                                                        style={{ color: trackColor }}
                                                    >
                                                        {viz.symbol}
                                                    </div>

                                                    <h3 className="text-lg font-medium mb-1.5 group-hover:text-white transition-colors text-white/90">
                                                        {viz.title}
                                                    </h3>

                                                    <p className="text-white/50 text-sm leading-relaxed">
                                                        {viz.description}
                                                    </p>

                                                    <div className="mt-3 flex items-center text-white/30 text-xs group-hover:text-white/50 transition-colors">
                                                        <span>Explore</span>
                                                        <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="ml-11 py-4 px-5 rounded-xl bg-white/[0.02] border border-white/[0.05] border-dashed">
                                        <p className="text-white/30 text-sm italic">
                                            Visualizations coming soon
                                        </p>
                                    </div>
                                )}
                            </motion.section>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Footer */}
                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 text-center text-white/30 text-xs tracking-wider"
                >
                    Aligned with College Board AP Economics Curriculum
                </motion.footer>
            </div>
        </div>
    )
}
