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
    CalculusBackground,
} from '@/components/backgrounds'

type Department = 'math' | 'physics' | 'biology' | 'chemistry' | 'cs' | 'economics' | 'calculus'

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
            { id: 'collatz', title: 'Collatz Conjecture', symbol: '3n+1', description: 'The infinite descent into the 4-2-1 loop', to: '/math/collatz' },
            { id: 'euclidean', title: 'Euclidean Algorithm', symbol: 'gcd', description: 'Finding common ground through division', to: '/math/euclidean' },
            { id: 'matrix', title: 'Matrix Multiplication', symbol: 'A\u00D7B', description: 'The dot product dance of rows and columns', to: '/math/matrix' },
            { id: 'fibonacci', title: 'Fibonacci Spiral', symbol: '\u03C6', description: 'The golden ratio unfolds in nature', to: '/math/fibonacci' },
            { id: 'unit-circle', title: 'Unit Circle', symbol: '\u03B8', description: 'Sine, cosine, tangent around the circle', to: '/math/unit-circle' },
            { id: 'conics', title: 'Conic Sections', symbol: '\u2215', description: 'Circles, ellipses, parabolas, hyperbolas', to: '/math/conics' },
            { id: 'vectors', title: 'Vectors', symbol: '\u2192', description: 'Direction and magnitude in 2D and 3D', to: '/math/vectors' },
        ],
    },
    {
        id: 'physics',
        name: 'Physics',
        icon: '\u269B',
        color: 'rgb(160, 100, 255)',
        bgColor: '#0d0a1a',
        visualizations: [
            { id: 'ap-physics', title: 'AP Physics Hub', symbol: '\u269B', description: 'Full AP curriculum: Physics 1, 2, C:Mech & C:E&M', to: '/physics' },
        ],
    },
    {
        id: 'calculus',
        name: 'Calculus',
        icon: '\u222B',
        color: 'rgb(180, 120, 255)',
        bgColor: '#120a1a',
        visualizations: [
            { id: 'ap-calculus', title: 'AP Calculus Hub', symbol: '\u222E', description: 'Full AP curriculum: Calculus AB & BC', to: '/calculus' },
        ],
    },
    {
        id: 'biology',
        name: 'Biology',
        icon: '\uD83E\uDDEC',
        color: 'rgb(80, 200, 120)',
        bgColor: '#0a1a12',
        visualizations: [
            { id: 'ap-biology', title: 'AP Biology Hub', symbol: '\uD83E\uDDEC', description: 'Full AP curriculum for Biology', to: '/biology' },
        ],
    },
    {
        id: 'chemistry',
        name: 'Chemistry',
        icon: '\u2697',
        color: 'rgb(255, 160, 80)',
        bgColor: '#1a120a',
        visualizations: [
            { id: 'ap-chemistry', title: 'AP Chemistry Hub', symbol: '\u2697', description: 'Full AP curriculum for Chemistry', to: '/chemistry' },
        ],
    },
    {
        id: 'cs',
        name: 'Computer Science',
        icon: '\u2318',
        color: 'rgb(80, 200, 220)',
        bgColor: '#0a1518',
        visualizations: [
            { id: 'ap-cs', title: 'AP CS Hub', symbol: '\u2318', description: 'Data structures & algorithms for AP CS A', to: '/cs' },
        ],
    },
    {
        id: 'economics',
        name: 'Economics',
        icon: '\uD83D\uDCC8',
        color: 'rgb(220, 180, 80)',
        bgColor: '#1a150a',
        visualizations: [
            { id: 'ap-economics', title: 'AP Economics Hub', symbol: '\uD83D\uDCCA', description: 'Full AP curriculum: Micro & Macro tracks', to: '/economics' },
        ],
    },
]

const backgroundComponents = {
    math: MathBackground,
    physics: PhysicsBackground,
    calculus: CalculusBackground,
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

            <div className="relative z-10 px-5 sm:px-8 py-10 sm:py-14 max-w-6xl mx-auto">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-10"
                >
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight mb-1">
                        Conjecture
                    </h1>
                    <p className="text-text-muted text-base sm:text-lg tracking-wide">
                        View Abstractions
                    </p>
                </motion.header>

                {/* Department Tabs */}
                <motion.nav
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="mb-10 sm:mb-12"
                >
                    <div className="flex flex-wrap gap-2">
                        {departments.map((dept) => {
                            const isActive = activeDept === dept.id
                            return (
                                <button
                                    key={dept.id}
                                    onClick={() => setActiveDept(dept.id)}
                                    className={`
                                        px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300
                                        flex items-center gap-2 border
                                        ${isActive
                                            ? 'bg-white/10 border-white/20 text-white shadow-lg'
                                            : 'bg-white/[0.02] border-white/[0.06] text-text-muted hover:bg-white/[0.06] hover:text-text-secondary hover:border-white/10'
                                        }
                                    `}
                                    style={isActive ? {
                                        boxShadow: `0 0 24px ${dept.color}15, 0 4px 16px rgba(0,0,0,0.3)`,
                                    } : undefined}
                                >
                                    <span className="text-base leading-none">{dept.icon}</span>
                                    <span className="hidden sm:inline">{dept.name}</span>
                                </button>
                            )
                        })}
                    </div>
                </motion.nav>

                {/* Visualizations Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeDept}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {currentDept.visualizations.map((viz, index) => (
                            <motion.div
                                key={viz.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: index * 0.06 }}
                            >
                                <Link to={viz.to} className="group block">
                                    <div className="relative overflow-hidden rounded-xl bg-white/[0.03] border border-border p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-border-hover hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5">
                                        <div
                                            className="absolute top-3.5 right-3.5 text-2xl font-mono opacity-[0.08] group-hover:opacity-20 transition-opacity duration-300"
                                            style={{ color: currentDept.color }}
                                        >
                                            {viz.symbol}
                                        </div>

                                        <h3 className="text-base font-medium mb-1.5 text-white/90 group-hover:text-white transition-colors">
                                            {viz.title}
                                        </h3>

                                        <p className="text-text-secondary text-sm leading-relaxed">
                                            {viz.description}
                                        </p>

                                        <div className="mt-3 flex items-center text-text-dim text-xs group-hover:text-text-muted transition-colors">
                                            <span>Explore</span>
                                            <svg className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
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
                    transition={{ delay: 0.6 }}
                    className="mt-16 text-center text-text-dim text-xs tracking-wider"
                >
                    Interactive explorations across disciplines
                </motion.footer>
            </div>
        </div>
    )
}
