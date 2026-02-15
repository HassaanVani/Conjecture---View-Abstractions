import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { PhysicsBackground } from '@/components/backgrounds'

type Track = 'ap1' | 'ap2'

interface Unit {
    number: number
    title: string
    visualizations: {
        id: string
        title: string
        symbol: string
        description: string
        to: string
        comingSoon?: boolean
    }[]
}

const ap1Units: Unit[] = [
    {
        number: 1,
        title: 'Kinematics',
        visualizations: [
            {
                id: 'projectile',
                title: 'Projectile Motion',
                symbol: 'v₀',
                description: '2D kinematics with gravity and launch angles',
                to: '/physics/kinematics/projectile',
            },
            {
                id: 'motion-1d',
                title: '1D Motion',
                symbol: 'x(t)',
                description: 'Position, velocity, and acceleration graphs',
                to: '/physics/kinematics/motion-1d',
                comingSoon: true
            },
        ],
    },
    {
        number: 2,
        title: 'Dynamics',
        visualizations: [
            {
                id: 'incline',
                title: 'Incline Plane',
                symbol: 'mgsinθ',
                description: 'Forces, friction, and free body diagrams',
                to: '/physics/dynamics/incline',
            },
            {
                id: 'atwood',
                title: 'Atwood Machine',
                symbol: 'ΣF=ma',
                description: 'Connected systems and tension',
                to: '/physics/dynamics/atwood',
                comingSoon: true
            },
        ],
    },
    {
        number: 3,
        title: 'Circular Motion & Gravitation',
        visualizations: [
            {
                id: 'orbit',
                title: 'Orbital Motion',
                symbol: 'GM/r²',
                description: 'Kepler\'s laws and gravitational forces',
                to: '/physics/circular/orbit',
            },
        ],
    },
    {
        number: 4,
        title: 'Energy',
        visualizations: [
            {
                id: 'coaster',
                title: 'Energy Conservation',
                symbol: '½mv²',
                description: 'Potential and kinetic energy transformations',
                to: '/physics/energy/coaster',
            },
        ],
    },
    {
        number: 5,
        title: 'Momentum',
        visualizations: [
            {
                id: 'collision',
                title: 'Collisions',
                symbol: 'p=mv',
                description: 'Elastic and inelastic collisions in 1D/2D',
                to: '/physics/momentum/collision',
            },
        ],
    },
    {
        number: 6,
        title: 'Simple Harmonic Motion',
        visualizations: [
            {
                id: 'pendulum',
                title: 'Pendulum',
                symbol: 'T=2π√(L/g)',
                description: 'Period, frequency, and restoring forces',
                to: '/physics/pendulum',
            },
            {
                id: 'spring',
                title: 'Spring Mass',
                symbol: 'F=-kx',
                description: 'Damped harmonic oscillator',
                to: '/physics/shm/spring',
            },
        ],
    },
    {
        number: 7,
        title: 'Torque & Rotation',
        visualizations: [
            {
                id: 'balance',
                title: 'Torque Balance',
                symbol: 'τ=rF',
                description: 'Rotational equilibrium and lever arms',
                to: '/physics/rotation/balance',
            },
        ],
    },
]

const ap2Units: Unit[] = [
    {
        number: 1,
        title: 'Fluids',
        visualizations: [
            {
                id: 'buoyancy',
                title: 'Buoyancy',
                symbol: 'ρVg',
                description: 'Archimedes principle and fluid dynamics',
                to: '/physics/fluids/buoyancy',
            },
            {
                id: 'flow',
                title: 'Fluid Dynamics',
                symbol: 'A₁v₁=A₂v₂',
                description: 'Bernoulli principle and continuity equation',
                to: '/physics/fluids/flow',
            },
        ],
    },
    {
        number: 2,
        title: 'Thermodynamics',
        visualizations: [
            {
                id: 'gas',
                title: 'Ideal Gas Law',
                symbol: 'PV=nRT',
                description: 'Kinetic molecular theory and particle physics',
                to: '/physics/thermo/gas',
            },
        ],
    },
    {
        number: 3,
        title: 'Electric Force, Field & Potential',
        visualizations: [
            {
                id: 'fields',
                title: 'Electric Fields',
                symbol: 'E=kQ/r²',
                description: 'Field mapping and superposition',
                to: '/physics/electro/fields',
            },
        ],
    },
    {
        number: 4,
        title: 'Electric Circuits',
        visualizations: [
            {
                id: 'rc',
                title: 'RC Circuit',
                symbol: 'τ=RC',
                description: 'Capacitor charging and exponential decay',
                to: '/physics/circuits/rc',
            },
        ],
    },
    {
        number: 5,
        title: 'Magnetism & Induction',
        visualizations: [
            {
                id: 'particle',
                title: 'Particle in B-Field',
                symbol: 'F=qvB',
                description: 'Lorentz force and cyclotron motion',
                to: '/physics/magnetism/particle',
            },
            {
                id: 'flux',
                title: 'Faraday\'s Law',
                symbol: 'ε=-dΦ/dt',
                description: 'Magnetic flux and induced EMF',
                to: '/physics/magnetism/flux',
            },
        ],
    },
    {
        number: 6,
        title: 'Geometric & Physical Optics',
        visualizations: [
            {
                id: 'waves',
                title: 'Wave Interference',
                symbol: 'λ',
                description: 'Superposition, diffraction, and interference',
                to: '/physics/waves',
            },
        ],
    },
    {
        number: 7,
        title: 'Quantum, Atomic & Nuclear Physics',
        visualizations: [],
    },

]

export default function PhysicsHub() {
    const [track, setTrack] = useState<Track>('ap1')
    const units = track === 'ap1' ? ap1Units : ap2Units
    const trackColor = track === 'ap1' ? 'rgb(100, 140, 255)' : 'rgb(160, 100, 255)'

    return (
        <div className="min-h-screen relative bg-[#0d0a1a]">
            <PhysicsBackground />

            <div className="relative z-10 px-8 py-12 max-w-6xl mx-auto">
                {/* Header */}
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
                        <span className="text-4xl">⚛️</span>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">
                                AP Physics
                            </h1>
                            <p className="text-white/50 text-lg">
                                Interactive visualizations for AP Physics 1 & 2
                            </p>
                        </div>
                    </div>
                </motion.header>

                {/* Track Selector */}
                <motion.nav
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-10"
                >
                    <div className="flex gap-4">
                        <button
                            onClick={() => setTrack('ap1')}
                            className={`
                                relative px-6 py-3 rounded-xl text-lg font-medium transition-all duration-300
                                flex items-center gap-3 border
                                ${track === 'ap1'
                                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                    : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:bg-white/[0.05] hover:text-white/70'
                                }
                            `}
                        >
                            <span className="text-2xl">🍎</span>
                            <div className="text-left">
                                <div className="font-semibold">AP Physics 1</div>
                                <div className="text-xs opacity-60">Mechanics</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setTrack('ap2')}
                            className={`
                                relative px-6 py-3 rounded-xl text-lg font-medium transition-all duration-300
                                flex items-center gap-3 border
                                ${track === 'ap2'
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                    : 'bg-white/[0.02] border-white/[0.08] text-white/50 hover:bg-white/[0.05] hover:text-white/70'
                                }
                            `}
                        >
                            <span className="text-2xl">⚡</span>
                            <div className="text-left">
                                <div className="font-semibold">AP Physics 2</div>
                                <div className="text-xs opacity-60">E&M, Fluids, Optics</div>
                            </div>
                        </button>
                    </div>
                </motion.nav>

                {/* Units */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={track}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
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

                                {unit.visualizations.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-11">
                                        {unit.visualizations.map((viz) => (
                                            <Link
                                                key={viz.id}
                                                to={viz.comingSoon ? '#' : viz.to}
                                                className={`group block ${viz.comingSoon ? 'cursor-not-allowed opacity-60' : ''}`}
                                                onClick={(e) => viz.comingSoon && e.preventDefault()}
                                            >
                                                <div
                                                    className="relative overflow-hidden rounded-xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                                                >
                                                    <div
                                                        className="absolute top-3 right-3 text-2xl font-mono opacity-10 group-hover:opacity-25 transition-opacity"
                                                        style={{ color: trackColor }}
                                                    >
                                                        {viz.symbol}
                                                    </div>

                                                    <h3 className="text-lg font-medium mb-1.5 group-hover:text-white transition-colors text-white/90">
                                                        {viz.title}
                                                    </h3>

                                                    <p className="text-white/50 text-sm leading-relaxed">
                                                        {viz.description}
                                                    </p>

                                                    <div className="mt-3 flex items-center text-white/30 text-xs group-hover:text-white/50 transition-colors">
                                                        <span>{viz.comingSoon ? 'Coming Soon' : 'Explore'}</span>
                                                        {!viz.comingSoon && (
                                                            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="ml-11 py-4 px-5 rounded-xl bg-white/[0.02] border border-white/[0.05] border-dashed">
                                        <p className="text-white/30 text-sm italic">
                                            Visualizations coming soon
                                        </p>
                                    </div>
                                )}
                            </motion.section>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Footer */}
                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 text-center text-white/30 text-xs tracking-wider"
                >
                    Aligned with College Board AP Physics Curriculum
                </motion.footer>
            </div>
        </div>
    )
}
