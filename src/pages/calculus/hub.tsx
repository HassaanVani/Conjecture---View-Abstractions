import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { CalculusBackground } from '@/components/backgrounds'

type Track = 'ab' | 'bc'

interface Unit {
    number: number
    title: string
    visualizations: {
        id: string
        title: string
        symbol: string
        description: string
        to: string
        bcOnly?: boolean
    }[]
}

const units: Unit[] = [
    {
        number: 1,
        title: 'Limits & Continuity',
        visualizations: [
            {
                id: 'limits',
                title: 'Limits & Continuity',
                symbol: 'lim',
                description: 'Epsilon-delta definition, removable and jump discontinuities',
                to: '/calculus/limits',
            },
        ],
    },
    {
        number: 2,
        title: 'Differentiation: Definition and Fundamental Properties',
        visualizations: [
            {
                id: 'derivative',
                title: 'Derivative Explorer',
                symbol: "f'(x)",
                description: 'Secant to tangent line, derivative as slope function',
                to: '/calculus/derivative',
            },
        ],
    },
    {
        number: 5,
        title: 'Analytical Applications of Differentiation',
        visualizations: [
            {
                id: 'optimization',
                title: 'Optimization',
                symbol: "f'=0",
                description: 'Critical points, extrema, and real-world optimization',
                to: '/calculus/optimization',
            },
            {
                id: 'related-rates',
                title: 'Related Rates',
                symbol: 'dr/dt',
                description: 'Chain rule applications connecting changing quantities',
                to: '/calculus/related-rates',
            },
        ],
    },
    {
        number: 6,
        title: 'Integration and Accumulation of Change',
        visualizations: [
            {
                id: 'riemann',
                title: 'Riemann Sums',
                symbol: 'Σ',
                description: 'Left, right, midpoint, and trapezoidal approximations',
                to: '/calculus/riemann',
            },
            {
                id: 'ftc',
                title: 'Fundamental Theorem',
                symbol: '∫',
                description: 'Connection between derivatives and integrals',
                to: '/calculus/ftc',
            },
        ],
    },
    {
        number: 7,
        title: 'Differential Equations',
        visualizations: [
            {
                id: 'slope-fields',
                title: 'Slope Fields',
                symbol: 'dy/dx',
                description: "Euler's method and solution curves from initial conditions",
                to: '/calculus/slope-fields',
            },
        ],
    },
    {
        number: 10,
        title: 'Infinite Sequences and Series (BC)',
        visualizations: [
            {
                id: 'taylor',
                title: 'Taylor / Maclaurin Series',
                symbol: 'Tₙ(x)',
                description: 'Polynomial approximations and convergence',
                to: '/calculus/taylor',
                bcOnly: true,
            },
        ],
    },
    {
        number: 9,
        title: 'Parametric, Polar, and Vector (BC)',
        visualizations: [
            {
                id: 'polar',
                title: 'Polar Curves',
                symbol: 'r(θ)',
                description: 'Polar coordinate graphing and area calculation',
                to: '/calculus/polar',
                bcOnly: true,
            },
            {
                id: 'parametric',
                title: 'Parametric Curves',
                symbol: '(x(t),y(t))',
                description: 'Parametric equations, velocity vectors, arc length',
                to: '/calculus/parametric',
                bcOnly: true,
            },
        ],
    },
]

export default function CalculusHub() {
    const [track, setTrack] = useState<Track>('ab')
    const trackColor = track === 'ab' ? 'rgb(180, 120, 255)' : 'rgb(140, 200, 255)'

    const filteredUnits = track === 'ab'
        ? units.map(u => ({
            ...u,
            visualizations: u.visualizations.filter(v => !v.bcOnly)
        })).filter(u => u.visualizations.length > 0)
        : units

    return (
        <div className="min-h-screen relative bg-[#120a1a]">
            <CalculusBackground />

            <div className="relative z-10 px-8 py-12 max-w-6xl mx-auto">
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
                        <span className="text-4xl">∫</span>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">
                                AP Calculus
                            </h1>
                            <p className="text-white/50 text-lg">
                                Interactive visualizations for AP Calculus AB & BC
                            </p>
                        </div>
                    </div>
                </motion.header>

                <motion.nav
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-10"
                >
                    <div className="flex gap-4">
                        <button
                            onClick={() => setTrack('ab')}
                            className={`
                                relative px-6 py-3 rounded-xl text-lg font-medium transition-all duration-300
                                flex items-center gap-3 border
                                ${track === 'ab'
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                    : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:bg-white/[0.05] hover:text-white/70'
                                }
                            `}
                        >
                            <span className="text-2xl">∫</span>
                            <div className="text-left">
                                <div className="font-semibold">Calculus AB</div>
                                <div className="text-xs opacity-60">Single Variable</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setTrack('bc')}
                            className={`
                                relative px-6 py-3 rounded-xl text-lg font-medium transition-all duration-300
                                flex items-center gap-3 border
                                ${track === 'bc'
                                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                                    : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:bg-white/[0.05] hover:text-white/70'
                                }
                            `}
                        >
                            <span className="text-2xl">∮</span>
                            <div className="text-left">
                                <div className="font-semibold">Calculus BC</div>
                                <div className="text-xs opacity-60">Extended + Series</div>
                            </div>
                        </button>
                    </div>
                </motion.nav>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={track}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-8"
                    >
                        {filteredUnits.map((unit, unitIndex) => (
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

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
                                    {unit.visualizations.map((viz) => (
                                        <Link key={viz.id} to={viz.to} className="group block">
                                            <div className="relative overflow-hidden rounded-xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                                                <div
                                                    className="absolute top-3 right-3 text-2xl font-mono opacity-10 group-hover:opacity-25 transition-opacity"
                                                    style={{ color: trackColor }}
                                                >
                                                    {viz.symbol}
                                                </div>

                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h3 className="text-lg font-medium group-hover:text-white transition-colors text-white/90">
                                                        {viz.title}
                                                    </h3>
                                                    {viz.bcOnly && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-medium">BC</span>
                                                    )}
                                                </div>

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
                            </motion.section>
                        ))}
                    </motion.div>
                </AnimatePresence>

                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 text-center text-white/30 text-xs tracking-wider"
                >
                    Aligned with College Board AP Calculus AB/BC Curriculum
                </motion.footer>
            </div>
        </div>
    )
}
