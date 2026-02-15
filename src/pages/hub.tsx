import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
    MathBackground,
    PhysicsBackground,
    BiologyBackground,
    ChemistryBackground,
    CSBackground,
    EconomicsBackground,
} from '@/components/backgrounds'

type Department = 'math' | 'physics' | 'biology' | 'chemistry' | 'cs' | 'economics'

interface Visualization {
    id: string
    title: string
    symbol: string
    description: string
    to: string
}

interface DepartmentData {
    id: Department
    name: string
    icon: string
    color: string
    bgColor: string
    visualizations: Visualization[]
}

const departments: DepartmentData[] = [
    {
        id: 'math',
        name: 'Mathematics',
        icon: '∫',
        color: 'rgb(100, 140, 255)',
        bgColor: '#0a0e1a',
        visualizations: [
            {
                id: 'collatz',
                title: 'Collatz Conjecture',
                symbol: '3n+1',
                description: 'The infinite descent into the 4-2-1 loop',
                to: '/math/collatz',
            },
            {
                id: 'euclidean',
                title: 'Euclidean Algorithm',
                symbol: 'gcd',
                description: 'Finding common ground through division',
                to: '/math/euclidean',
            },
            {
                id: 'matrix',
                title: 'Matrix Multiplication',
                symbol: 'A×B',
                description: 'The dot product dance of rows and columns',
                to: '/math/matrix',
            },
            {
                id: 'fibonacci',
                title: 'Fibonacci Spiral',
                symbol: 'φ',
                description: 'The golden ratio unfolds in nature',
                to: '/math/fibonacci',
            },
        ],
    },
    {
        id: 'physics',
        name: 'Physics',
        icon: '⚛',
        color: 'rgb(160, 100, 255)',
        bgColor: '#0d0a1a',
        visualizations: [
            {
                id: 'ap-physics',
                title: 'AP Physics Hub',
                symbol: '🍎',
                description: 'Full AP curriculum for Physics 1 & 2',
                to: '/physics',
            },
        ],
    },
    {
        id: 'biology',
        name: 'Biology',
        icon: '🧬',
        color: 'rgb(80, 200, 120)',
        bgColor: '#0a1a12',
        visualizations: [
            {
                id: 'cell-division',
                title: 'Cell Division',
                symbol: '⊕',
                description: 'The choreography of mitosis',
                to: '/biology/cell-division',
            },
            {
                id: 'population',
                title: 'Population Dynamics',
                symbol: 'dN/dt',
                description: 'Logistic growth and carrying capacity',
                to: '/biology/population',
            },
        ],
    },
    {
        id: 'chemistry',
        name: 'Chemistry',
        icon: '⚗',
        color: 'rgb(255, 160, 80)',
        bgColor: '#1a120a',
        visualizations: [
            {
                id: 'bonds',
                title: 'Molecular Bonds',
                symbol: '⋮⋮',
                description: 'Electrons dancing between atoms',
                to: '/chemistry/bonds',
            },
            {
                id: 'reactions',
                title: 'Reaction Kinetics',
                symbol: 'k',
                description: 'Collision theory in action',
                to: '/chemistry/reactions',
            },
        ],
    },
    {
        id: 'cs',
        name: 'Computer Science',
        icon: '⌘',
        color: 'rgb(80, 200, 220)',
        bgColor: '#0a1518',
        visualizations: [
            {
                id: 'sorting',
                title: 'Sorting Algorithms',
                symbol: 'O(n)',
                description: 'Racing complexity through ordered chaos',
                to: '/cs/sorting',
            },
            {
                id: 'binary',
                title: 'Binary Search',
                symbol: 'log₂',
                description: 'Divide and conquer in logarithmic time',
                to: '/cs/binary-search',
            },
            {
                id: 'graphs',
                title: 'Graph Traversal',
                symbol: 'G(V,E)',
                description: 'BFS, DFS, Dijkstra & A* pathfinding',
                to: '/cs/graphs',
            },
        ],
    },
    {
        id: 'economics',
        name: 'Economics',
        icon: '📈',
        color: 'rgb(220, 180, 80)',
        bgColor: '#1a150a',
        visualizations: [
            {
                id: 'ap-economics',
                title: 'AP Economics Hub',
                symbol: '📊',
                description: 'Full AP curriculum with Micro & Macro tracks',
                to: '/economics',
            },
        ],
    },
]

const backgroundComponents = {
    math: MathBackground,
    physics: PhysicsBackground,
    biology: BiologyBackground,
    chemistry: ChemistryBackground,
    cs: CSBackground,
    economics: EconomicsBackground,
}

export default function Hub() {
    const [activeDept, setActiveDept] = useState<Department>('math')
    const currentDept = departments.find(d => d.id === activeDept)!
    const BackgroundComponent = backgroundComponents[activeDept]

    return (
        <div
            className="min-h-screen relative transition-colors duration-700"
            style={{ backgroundColor: currentDept.bgColor }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeDept}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <BackgroundComponent />
                </motion.div>
            </AnimatePresence>

            <div className="relative z-10 px-8 py-12 max-w-6xl mx-auto">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-10"
                >
                    <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-2">
                        Conjecture
                    </h1>
                    <p className="text-text-muted text-lg tracking-wide">
                        View Abstractions
                    </p>
                </motion.header>

                {/* Department Tabs */}
                <motion.nav
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-12"
                >
                    <div className="flex flex-wrap gap-2">
                        {departments.map((dept) => (
                            <button
                                key={dept.id}
                                onClick={() => setActiveDept(dept.id)}
                                className={`
                                    px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                                    flex items-center gap-2 border
                                    ${activeDept === dept.id
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'bg-white/[0.02] border-white/[0.06] text-text-muted hover:bg-white/[0.05] hover:text-white'
                                    }
                                `}
                                style={{
                                    boxShadow: activeDept === dept.id
                                        ? `0 0 20px ${dept.color}20`
                                        : 'none'
                                }}
                            >
                                <span className="text-base">{dept.icon}</span>
                                <span>{dept.name}</span>
                            </button>
                        ))}
                    </div>
                </motion.nav>

                {/* Visualizations Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeDept}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {currentDept.visualizations.map((viz, index) => (
                            <motion.div
                                key={viz.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                            >
                                <Link to={viz.to} className="group block">
                                    <div
                                        className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                                        style={{
                                            '--hover-glow': currentDept.color,
                                        } as React.CSSProperties}
                                    >
                                        <div
                                            className="absolute top-4 right-4 text-3xl font-mono opacity-10 group-hover:opacity-25 transition-opacity"
                                            style={{ color: currentDept.color }}
                                        >
                                            {viz.symbol}
                                        </div>

                                        <h3 className="text-xl font-medium mb-2 group-hover:text-white transition-colors">
                                            {viz.title}
                                        </h3>

                                        <p className="text-text-muted text-sm leading-relaxed">
                                            {viz.description}
                                        </p>

                                        <div className="mt-4 flex items-center text-text-dim text-xs group-hover:text-text-muted transition-colors">
                                            <span>Explore</span>
                                            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>

                                        <div
                                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                            style={{
                                                background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${currentDept.color}08, transparent 40%)`
                                            }}
                                        />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Footer */}
                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 text-center text-text-dim text-xs tracking-wider"
                >
                    Interactive explorations across disciplines
                </motion.footer>
            </div>
        </div>
    )
}
