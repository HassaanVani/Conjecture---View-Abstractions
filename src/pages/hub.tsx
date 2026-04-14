import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
    AtomIcon,
    IntegralIcon,
    DnaIcon,
    FlaskIcon,
    BinaryIcon,
    TrendingUpIcon,
    SigmaIcon,
} from '@/components/icons'

type Department = 'math' | 'physics' | 'biology' | 'chemistry' | 'cs' | 'economics' | 'calculus'

interface Visualization {
    id: string
    title: string
    description: string
    to: string
}

interface DepartmentData {
    id: Department
    name: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    color: string
    visualizations: Visualization[]
}

const departments: DepartmentData[] = [
    {
        id: 'math',
        name: 'Mathematics',
        icon: SigmaIcon,
        color: 'rgb(100, 140, 255)',
        visualizations: [
            { id: 'collatz', title: 'Collatz Conjecture', description: 'The infinite descent into the 4-2-1 loop', to: '/math/collatz' },
            { id: 'euclidean', title: 'Euclidean Algorithm', description: 'Finding common ground through division', to: '/math/euclidean' },
            { id: 'matrix', title: 'Matrix Multiplication', description: 'The dot product dance of rows and columns', to: '/math/matrix' },
            { id: 'fibonacci', title: 'Fibonacci Spiral', description: 'The golden ratio unfolds in nature', to: '/math/fibonacci' },
            { id: 'unit-circle', title: 'Unit Circle', description: 'Sine, cosine, tangent around the circle', to: '/math/unit-circle' },
            { id: 'conics', title: 'Conic Sections', description: 'Circles, ellipses, parabolas, hyperbolas', to: '/math/conics' },
            { id: 'vectors', title: 'Vectors', description: 'Direction and magnitude in 2D and 3D', to: '/math/vectors' },
        ],
    },
    {
        id: 'physics',
        name: 'Physics',
        icon: AtomIcon,
        color: 'rgb(160, 100, 255)',
        visualizations: [
            { id: 'ap-physics', title: 'Physics Hub', description: 'Mechanics, waves, E&M, thermo, and modern physics', to: '/physics' },
        ],
    },
    {
        id: 'calculus',
        name: 'Calculus',
        icon: IntegralIcon,
        color: 'rgb(180, 120, 255)',
        visualizations: [
            { id: 'ap-calculus', title: 'Calculus Hub', description: 'Limits, derivatives, integrals, series, and parametrics', to: '/calculus' },
        ],
    },
    {
        id: 'biology',
        name: 'Biology',
        icon: DnaIcon,
        color: 'rgb(80, 200, 120)',
        visualizations: [
            { id: 'ap-biology', title: 'Biology Hub', description: 'Cell biology, energetics, genetics, and ecology', to: '/biology' },
        ],
    },
    {
        id: 'chemistry',
        name: 'Chemistry',
        icon: FlaskIcon,
        color: 'rgb(255, 160, 80)',
        visualizations: [
            { id: 'ap-chemistry', title: 'Chemistry Hub', description: 'Structure, reactions, kinetics, and equilibrium', to: '/chemistry' },
        ],
    },
    {
        id: 'cs',
        name: 'Computer Science',
        icon: BinaryIcon,
        color: 'rgb(80, 200, 220)',
        visualizations: [
            { id: 'ap-cs', title: 'Computer Science Hub', description: 'Data structures, algorithms, and search', to: '/cs' },
        ],
    },
    {
        id: 'economics',
        name: 'Economics',
        icon: TrendingUpIcon,
        color: 'rgb(220, 180, 80)',
        visualizations: [
            { id: 'ap-economics', title: 'Economics Hub', description: 'Markets, policy, trade, and indicators', to: '/economics' },
        ],
    },
]

export default function Hub() {
    const [activeDept, setActiveDept] = useState<Department>('math')
    const currentDept = departments.find(d => d.id === activeDept)!

    const vizCounts: Record<Department, number> = {
        math: 7, physics: 61, calculus: 10, biology: 9, chemistry: 10, cs: 8, economics: 27,
    }

    return (
        <div className="min-h-screen bg-bg relative overflow-hidden">
            {/* Ambient background gradient keyed to active department */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeDept}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="fixed inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse 70% 50% at 30% 20%, ${currentDept.color.replace('rgb', 'rgba').replace(')', ', 0.04)')}, transparent), radial-gradient(ellipse 50% 40% at 70% 80%, ${currentDept.color.replace('rgb', 'rgba').replace(')', ', 0.025)')}, transparent)`,
                    }}
                />
            </AnimatePresence>

            <div className="relative z-10 px-5 sm:px-8 py-10 sm:py-14 max-w-6xl mx-auto">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight mb-2">
                        Conjecture
                    </h1>
                    <p className="text-text-muted text-sm">132 interactive visualizations across 7 disciplines</p>
                </motion.header>

                {/* Department Tabs */}
                <motion.nav
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-10 sm:mb-12"
                >
                    <div className="flex flex-wrap gap-1.5">
                        {departments.map((dept) => {
                            const isActive = activeDept === dept.id
                            const Icon = dept.icon
                            return (
                                <button
                                    key={dept.id}
                                    onClick={() => setActiveDept(dept.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-[--radius-md] text-sm font-medium transition-all duration-250
                                        ${isActive
                                            ? 'text-text shadow-[--shadow-sm]'
                                            : 'text-text-muted hover:text-text-secondary'
                                        }
                                    `}
                                    style={isActive ? {
                                        background: 'rgba(44, 44, 46, 0.7)',
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        border: `1px solid ${dept.color.replace('rgb', 'rgba').replace(')', ', 0.2)')}`,
                                    } : {
                                        background: 'transparent',
                                        border: '1px solid transparent',
                                    }}
                                >
                                    <Icon className="w-4 h-4" style={isActive ? { color: dept.color } : undefined} />
                                    <span>{dept.name}</span>
                                    <span
                                        className="text-[10px] tabular-nums ml-0.5 opacity-40"
                                    >
                                        {vizCounts[dept.id]}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </motion.nav>

                {/* Visualizations Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeDept}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                    >
                        {currentDept.visualizations.map((viz, index) => (
                            <motion.div
                                key={viz.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.04 }}
                            >
                                <Link to={viz.to} className="group block">
                                    <div
                                        className="rounded-[--radius-lg] p-5 shadow-[--shadow-sm] transition-all duration-250 hover:shadow-[--shadow-md] hover:-translate-y-1 border border-white/[0.04] hover:border-white/[0.1]"
                                        style={{
                                            background: `linear-gradient(135deg, rgba(44, 44, 46, 0.6) 0%, rgba(44, 44, 46, 0.4) 100%)`,
                                        }}
                                    >
                                        <div
                                            className="w-1 h-4 rounded-full mb-3 opacity-40 group-hover:opacity-70 transition-opacity"
                                            style={{ backgroundColor: currentDept.color }}
                                        />
                                        <h3 className="text-[15px] font-medium text-text mb-1 group-hover:text-text transition-colors">
                                            {viz.title}
                                        </h3>
                                        <p className="text-text-secondary text-[13px] leading-relaxed">
                                            {viz.description}
                                        </p>
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
                    transition={{ delay: 0.5 }}
                    className="mt-20 text-center text-text-dim text-xs tracking-wider"
                >
                    Interactive explorations across disciplines
                </motion.footer>
            </div>
        </div>
    )
}
