import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CSBackground } from '@/components/backgrounds'

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
        name: 'Search & Sort',
        visualizations: [
            { id: 'sorting', title: 'Sorting Algorithms', description: 'Bubble, merge, quick, heap sort comparisons', to: '/cs/sorting' },
            { id: 'binary-search', title: 'Binary Search', description: 'Divide and conquer in logarithmic time', to: '/cs/binary-search' },
        ],
    },
    {
        name: 'Algorithms',
        visualizations: [
            { id: 'recursion', title: 'Recursion Tree', description: 'Call stack visualization for recursive algorithms', to: '/cs/recursion' },
            { id: 'graphs', title: 'Graph Traversal', description: 'BFS, DFS, Dijkstra & A* pathfinding', to: '/cs/graphs' },
        ],
    },
    {
        name: 'Data Structures',
        visualizations: [
            { id: 'linked-list', title: 'Linked List', description: 'Insert, delete, traverse, and reverse operations', to: '/cs/linked-list' },
            { id: 'stack-queue', title: 'Stack & Queue', description: 'LIFO vs FIFO with push, pop, enqueue, dequeue', to: '/cs/stack-queue' },
            { id: 'bst', title: 'Binary Search Tree', description: 'Insert, delete, search, and traversal orders', to: '/cs/bst' },
            { id: 'hashmap', title: 'Hash Map', description: 'Hash functions, collision resolution, and load factor', to: '/cs/hashmap' },
        ],
    },
]

export default function CSHub() {
    return (
        <div className="min-h-screen relative bg-bg">
            <CSBackground className="opacity-40" />

            <div className="relative z-10 px-5 sm:px-8 py-10 sm:py-14 max-w-6xl mx-auto">
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-text mb-1">
                        Computer Science
                    </h1>
                    <p className="text-text-secondary text-sm">
                        Data structures, algorithms, and search
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
