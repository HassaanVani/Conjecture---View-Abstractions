import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChemistryBackground } from '@/components/backgrounds'

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
        name: 'Structure',
        visualizations: [
            { id: 'orbitals', title: 'Atomic Orbitals', description: 'Quantum numbers, electron configurations, and orbital shapes', to: '/chemistry/orbitals' },
            { id: 'bonds', title: 'Molecular Bonds', description: 'Ionic, covalent, metallic bonding and electronegativity', to: '/chemistry/bonds' },
            { id: 'vsepr', title: 'VSEPR Geometry', description: 'Electron domains, molecular shapes, and bond angles', to: '/chemistry/vsepr' },
        ],
    },
    {
        name: 'Reactions',
        visualizations: [
            { id: 'stoichiometry', title: 'Stoichiometry', description: 'Mole ratios, limiting reagents, and theoretical yield', to: '/chemistry/stoichiometry' },
            { id: 'phases', title: 'Phase Diagrams', description: 'Triple point, critical point, and phase transitions', to: '/chemistry/phases' },
        ],
    },
    {
        name: 'Kinetics',
        visualizations: [
            { id: 'reactions', title: 'Reaction Kinetics', description: 'Rate laws, activation energy, and collision theory', to: '/chemistry/reactions' },
            { id: 'kinetics', title: 'Rate Laws & Arrhenius', description: 'Reaction orders, rate constants, and temperature effects', to: '/chemistry/kinetics' },
        ],
    },
    {
        name: 'Equilibrium',
        visualizations: [
            { id: 'equilibrium', title: "Equilibrium & Le Chatelier's", description: 'Keq, Q vs K, and stress response predictions', to: '/chemistry/equilibrium' },
            { id: 'titration', title: 'Acid-Base Titration', description: 'Titration curves, buffers, and Henderson-Hasselbalch', to: '/chemistry/titration' },
        ],
    },
    {
        name: 'Thermodynamics',
        visualizations: [
            { id: 'enthalpy', title: 'Enthalpy & Thermochemistry', description: "Hess's law, enthalpy diagrams, and bond energies", to: '/chemistry/enthalpy' },
        ],
    },
]

export default function ChemistryHub() {
    return (
        <div className="min-h-screen relative bg-bg">
            <ChemistryBackground className="opacity-40" />

            <div className="relative z-10 px-5 sm:px-8 py-10 sm:py-14 max-w-6xl mx-auto">
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-text mb-1">
                        Chemistry
                    </h1>
                    <p className="text-text-secondary text-sm">
                        Atomic structure, reactions, kinetics, equilibrium, and thermodynamics
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
