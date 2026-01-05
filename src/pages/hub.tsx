import { motion } from 'framer-motion'
import VisualizationCard from '@/components/visualization-card'

const visualizations = [
    {
        title: 'Collatz Conjecture',
        description: 'Watch numbers dance through the famous 3n+1 problem, always finding their way to the 4-2-1 loop.',
        to: '/collatz',
        icon: '∞',
        accentColor: 'orange' as const,
    },
    {
        title: 'Sorting Algorithms',
        description: 'Race Bubble, Merge, and Quick Sort side-by-side. See which algorithm conquers the chaos fastest.',
        to: '/sorting',
        icon: '⇅',
        accentColor: 'blue' as const,
    },
    {
        title: 'Euclidean Algorithm',
        description: 'Discover the greatest common divisor through elegant rectangle subdivisions.',
        to: '/euclidean',
        icon: '÷',
        accentColor: 'teal' as const,
    },
    {
        title: 'Matrix Multiplication',
        description: 'Visualize the dot product dance as rows meet columns to create new matrices.',
        to: '/matrix',
        icon: '⊗',
        accentColor: 'purple' as const,
    },
    {
        title: 'Binary Search',
        description: 'Witness the power of divide and conquer as the search space collapses logarithmically.',
        to: '/binary-search',
        icon: '⌖',
        accentColor: 'gold' as const,
    },
]

export default function Hub() {
    return (
        <div className="space-y-16">
            <motion.section
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-6"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm">
                    <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                    Interactive Mathematics
                </div>

                <h1 className="text-5xl md:text-7xl font-bold">
                    <span className="text-gradient">Explore</span>
                    <br />
                    <span className="text-text-primary">Mathematical Beauty</span>
                </h1>

                <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
                    Dive into interactive visualizations of algorithms and mathematical concepts.
                    Each visualization brings abstract ideas to life through animation and interactivity.
                </p>
            </motion.section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visualizations.map((viz, index) => (
                    <VisualizationCard
                        key={viz.to}
                        {...viz}
                        index={index}
                    />
                ))}
            </section>

            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-center py-12"
            >
                <p className="text-text-muted text-sm">
                    Built with React, Framer Motion, and love for mathematics
                </p>
            </motion.section>
        </div>
    )
}
