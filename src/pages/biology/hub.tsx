import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BiologyBackground } from '@/components/backgrounds'

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

const units: Unit[] = [
    {
        number: 1,
        title: 'Chemistry of Life',
        visualizations: [
            {
                id: 'macromolecules',
                title: 'Macromolecules',
                symbol: 'C₆H₁₂O₆',
                description: 'Proteins, lipids, carbohydrates, and nucleic acids',
                to: '/biology/macromolecules',
            },
        ],
    },
    {
        number: 2,
        title: 'Cell Structure and Function',
        visualizations: [
            {
                id: 'cell-structure',
                title: 'Cell Structure',
                symbol: '⊕',
                description: 'Organelles, plant vs animal cells, membrane transport',
                to: '/biology/cell-structure',
            },
            {
                id: 'cell-division',
                title: 'Cell Division',
                symbol: '⊕→⊕',
                description: 'Mitosis, meiosis, and the cell cycle',
                to: '/biology/cell-division',
            },
        ],
    },
    {
        number: 3,
        title: 'Cellular Energetics',
        visualizations: [
            {
                id: 'photosynthesis',
                title: 'Photosynthesis',
                symbol: 'hν',
                description: 'Light reactions, Calvin cycle, and electron transport',
                to: '/biology/photosynthesis',
            },
            {
                id: 'respiration',
                title: 'Cellular Respiration',
                symbol: 'ATP',
                description: 'Glycolysis, Krebs cycle, and oxidative phosphorylation',
                to: '/biology/respiration',
            },
        ],
    },
    {
        number: 5,
        title: 'Heredity',
        visualizations: [
            {
                id: 'dna',
                title: 'DNA & Gene Expression',
                symbol: '🧬',
                description: 'Replication, transcription, translation, and mutations',
                to: '/biology/dna',
            },
        ],
    },
    {
        number: 7,
        title: 'Natural Selection',
        visualizations: [
            {
                id: 'evolution',
                title: 'Evolution & Selection',
                symbol: 'p²+2pq+q²',
                description: 'Hardy-Weinberg, natural selection, and genetic drift',
                to: '/biology/evolution',
            },
        ],
    },
    {
        number: 8,
        title: 'Ecology',
        visualizations: [
            {
                id: 'population',
                title: 'Population Dynamics',
                symbol: 'dN/dt',
                description: 'Logistic growth, carrying capacity, and competition',
                to: '/biology/population',
            },
            {
                id: 'ecology',
                title: 'Food Webs & Energy',
                symbol: '⟫',
                description: 'Trophic levels, energy pyramids, and nutrient cycling',
                to: '/biology/ecology',
            },
        ],
    },
]

export default function BiologyHub() {
    const trackColor = 'rgb(80, 200, 120)'

    return (
        <div className="min-h-screen relative bg-[#0a1a12]">
            <BiologyBackground />

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
                        <span className="text-4xl">🧬</span>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">
                                AP Biology
                            </h1>
                            <p className="text-white/50 text-lg">
                                Interactive visualizations for AP Biology
                            </p>
                        </div>
                    </div>
                </motion.header>

                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
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
                                                <h3 className="text-lg font-medium mb-1.5 group-hover:text-white transition-colors text-white/90">
                                                    {viz.title}
                                                </h3>
                                                <p className="text-white/50 text-sm leading-relaxed">{viz.description}</p>
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
                    Aligned with College Board AP Biology Curriculum
                </motion.footer>
            </div>
        </div>
    )
}
