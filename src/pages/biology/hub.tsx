import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BiologyBackground } from '@/components/backgrounds'

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
        name: 'Cell Biology',
        visualizations: [
            { id: 'macromolecules', title: 'Macromolecules', description: 'Proteins, lipids, carbohydrates, and nucleic acids', to: '/biology/macromolecules' },
            { id: 'cell-structure', title: 'Cell Structure', description: 'Organelles, plant vs animal cells, membrane transport', to: '/biology/cell-structure' },
            { id: 'cell-division', title: 'Cell Division', description: 'Mitosis, meiosis, and the cell cycle', to: '/biology/cell-division' },
        ],
    },
    {
        name: 'Energetics',
        visualizations: [
            { id: 'photosynthesis', title: 'Photosynthesis', description: 'Light reactions, Calvin cycle, and electron transport', to: '/biology/photosynthesis' },
            { id: 'respiration', title: 'Cellular Respiration', description: 'Glycolysis, Krebs cycle, and oxidative phosphorylation', to: '/biology/respiration' },
        ],
    },
    {
        name: 'Genetics',
        visualizations: [
            { id: 'dna', title: 'DNA & Gene Expression', description: 'Replication, transcription, translation, and mutations', to: '/biology/dna' },
        ],
    },
    {
        name: 'Evolution',
        visualizations: [
            { id: 'evolution', title: 'Evolution & Selection', description: 'Hardy-Weinberg, natural selection, and genetic drift', to: '/biology/evolution' },
        ],
    },
    {
        name: 'Ecology',
        visualizations: [
            { id: 'population', title: 'Population Dynamics', description: 'Logistic growth, carrying capacity, and competition', to: '/biology/population' },
            { id: 'ecology', title: 'Food Webs & Energy', description: 'Trophic levels, energy pyramids, and nutrient cycling', to: '/biology/ecology' },
        ],
    },
]

export default function BiologyHub() {
    return (
        <div className="min-h-screen relative bg-bg">
            <BiologyBackground className="opacity-40" />

            <div className="relative z-10 px-5 sm:px-8 py-10 sm:py-14 max-w-6xl mx-auto">
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-text mb-1">
                        Biology
                    </h1>
                    <p className="text-text-secondary text-sm">
                        Cell biology, energetics, genetics, evolution, and ecology
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
