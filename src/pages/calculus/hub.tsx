import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CalculusBackground } from '@/components/backgrounds'

interface Viz {
    id: string
    title: string
    description: string
    to: string
}

interface TopicGroup {
    name: string
    visualizations: Viz[]
}

const topics: TopicGroup[] = [
    {
        name: 'Limits',
        visualizations: [
            { id: 'limits', title: 'Limits & Continuity', description: 'Epsilon-delta definition, removable and jump discontinuities', to: '/calculus/limits' },
        ],
    },
    {
        name: 'Differentiation',
        visualizations: [
            { id: 'derivative', title: 'Derivative Explorer', description: 'Secant to tangent line, derivative as slope function', to: '/calculus/derivative' },
            { id: 'optimization', title: 'Optimization', description: 'Critical points, extrema, and real-world optimization', to: '/calculus/optimization' },
            { id: 'related-rates', title: 'Related Rates', description: 'Chain rule applications connecting changing quantities', to: '/calculus/related-rates' },
        ],
    },
    {
        name: 'Integration',
        visualizations: [
            { id: 'riemann', title: 'Riemann Sums', description: 'Left, right, midpoint, and trapezoidal approximations', to: '/calculus/riemann' },
            { id: 'ftc', title: 'Fundamental Theorem', description: 'Connection between derivatives and integrals', to: '/calculus/ftc' },
        ],
    },
    {
        name: 'Differential Equations',
        visualizations: [
            { id: 'slope-fields', title: 'Slope Fields', description: "Euler's method and solution curves from initial conditions", to: '/calculus/slope-fields' },
        ],
    },
    {
        name: 'Series',
        visualizations: [
            { id: 'taylor', title: 'Taylor / Maclaurin Series', description: 'Polynomial approximations and convergence', to: '/calculus/taylor' },
        ],
    },
    {
        name: 'Parametric & Polar',
        visualizations: [
            { id: 'polar', title: 'Polar Curves', description: 'Polar coordinate graphing and area calculation', to: '/calculus/polar' },
            { id: 'parametric', title: 'Parametric Curves', description: 'Parametric equations, velocity vectors, arc length', to: '/calculus/parametric' },
        ],
    },
]

export default function CalculusHub() {
    return (
        <div className="min-h-screen relative bg-bg">
            <CalculusBackground className="opacity-40" />

            <div className="relative z-10 px-5 sm:px-8 py-10 sm:py-14 max-w-6xl mx-auto">
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-text mb-1">
                        Calculus
                    </h1>
                    <p className="text-text-secondary text-sm">
                        Limits, derivatives, integrals, series, and parametric curves
                    </p>
                </motion.header>

                <div className="space-y-10">
                    {topics.map((group, gi) => (
                        <motion.section
                            key={group.name}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: gi * 0.08 }}
                        >
                            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
                                {group.name}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {group.visualizations.map((viz) => (
                                    <Link key={viz.id} to={viz.to} className="group block">
                                        <div className="bg-bg-elevated rounded-[--radius-lg] p-4 shadow-[--shadow-sm] transition-all duration-200 hover:shadow-[--shadow-md] hover:-translate-y-0.5">
                                            <h3 className="text-sm font-medium text-text mb-1 group-hover:text-text transition-colors">
                                                {viz.title}
                                            </h3>
                                            <p className="text-text-secondary text-xs leading-relaxed">
                                                {viz.description}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.section>
                    ))}
                </div>
            </div>
        </div>
    )
}
