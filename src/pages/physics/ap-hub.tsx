import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

interface Viz {
    id: string
    title: string
    description: string
    to: string
    comingSoon?: boolean
}

interface TopicGroup {
    name: string
    visualizations: Viz[]
}

const topics: TopicGroup[] = [
    {
        name: 'Mechanics',
        visualizations: [
            { id: 'motion-graphs', title: 'Motion Graphs', description: 'Real-time x-t, v-t, a-t graphs for 1D kinematics', to: '/physics/kinematics/motion-graphs' },
            { id: 'projectile', title: 'Projectile Motion', description: '2D kinematics with gravity and launch angles', to: '/physics/kinematics/projectile' },
            { id: 'newtons-laws', title: "Newton's Laws", description: 'F=ma sandbox with friction, inclines, and 3rd law pairs', to: '/physics/dynamics/newtons-laws' },
            { id: 'incline', title: 'Incline Plane', description: 'Forces, friction, and free body diagrams', to: '/physics/dynamics/incline' },
            { id: 'orbit', title: 'Orbital Motion', description: "Kepler's laws and gravitational forces", to: '/physics/circular/orbit' },
            { id: 'work-energy', title: 'Work & Energy', description: 'Work-energy theorem, power, and energy bar charts', to: '/physics/energy/work-energy' },
            { id: 'coaster', title: 'Energy Conservation', description: 'Potential and kinetic energy transformations', to: '/physics/energy/coaster' },
            { id: 'impulse', title: 'Impulse & Momentum', description: 'Impulse-momentum theorem and F-t graphs', to: '/physics/momentum/impulse' },
            { id: 'collision', title: 'Collisions', description: 'Elastic and inelastic collisions in 1D/2D', to: '/physics/momentum/collision' },
            { id: 'pendulum', title: 'Pendulum', description: 'Period, frequency, and restoring forces', to: '/physics/pendulum' },
            { id: 'spring', title: 'Spring Mass', description: 'Damped harmonic oscillator', to: '/physics/shm/spring' },
            { id: 'balance', title: 'Torque Balance', description: 'Rotational equilibrium and lever arms', to: '/physics/rotation/balance' },
            { id: 'rotational-dynamics', title: 'Rotational Dynamics', description: 'Torque, moment of inertia, and angular kinematics', to: '/physics/rotation/rotational-dynamics' },
            { id: 'angular-momentum', title: 'Angular Momentum', description: 'Conservation of L, rolling, and rotational energy', to: '/physics/rotation/angular-momentum' },
            { id: 'drag', title: 'Drag Simulation', description: 'Air resistance, terminal velocity, and Reynolds number', to: '/physics/mechanics/drag' },
            { id: 'oscillator', title: 'Oscillator', description: 'Damped harmonic motion and phase space', to: '/physics/mechanics/oscillator' },
            { id: 'resonance', title: 'Driven Resonance', description: 'Driven oscillation, resonance curves, and Q-factor', to: '/physics/mechanics/resonance' },
            { id: 'center-of-mass', title: 'Center of Mass', description: 'Multi-body systems, explosions, and collisions', to: '/physics/mechanics/center-of-mass' },
            { id: 'grav-field', title: 'Gravitational Field', description: 'Field visualization and equipotential surfaces', to: '/physics/circular/grav-field' },
        ],
    },
    {
        name: 'Waves & Optics',
        visualizations: [
            { id: 'waves', title: 'Wave Interference', description: 'Superposition, diffraction, and interference', to: '/physics/waves' },
            { id: 'diffraction', title: 'Diffraction', description: 'Single and double slit diffraction patterns', to: '/physics/waves/diffraction' },
            { id: 'doppler', title: 'Doppler Effect', description: 'Frequency shifts from relative motion', to: '/physics/waves/doppler' },
            { id: 'standing', title: 'Standing Waves', description: 'Nodes, antinodes, and harmonics', to: '/physics/waves/standing' },
            { id: 'properties', title: 'Wave Properties', description: 'Transverse, longitudinal, boundary behavior, and polarization', to: '/physics/waves/properties' },
            { id: 'snell', title: "Snell's Law", description: 'Refraction at boundaries', to: '/physics/optics/snell' },
            { id: 'lenses', title: 'Lenses', description: 'Converging and diverging lens ray tracing', to: '/physics/optics/lenses' },
            { id: 'mirrors', title: 'Mirrors', description: 'Concave/convex mirror ray diagrams and image formation', to: '/physics/optics/mirrors' },
            { id: 'thin-film', title: 'Thin Film Interference', description: 'Soap bubbles, oil films, and anti-reflection coatings', to: '/physics/optics/thin-film' },
        ],
    },
    {
        name: 'Electricity & Magnetism',
        visualizations: [
            { id: 'fields', title: 'Electric Fields', description: 'Field mapping and superposition', to: '/physics/electro/fields' },
            { id: 'coulomb', title: "Coulomb's Law", description: 'Electric force, charging by conduction and induction', to: '/physics/electro/coulomb' },
            { id: 'potential', title: 'Electric Potential', description: 'Potential landscapes, equipotential lines, and test charges', to: '/physics/electro/potential' },
            { id: 'dc', title: 'DC Circuits', description: 'Series and parallel resistor networks', to: '/physics/circuits/dc' },
            { id: 'rc', title: 'RC Circuit', description: 'Capacitor charging and exponential decay', to: '/physics/circuits/rc' },
            { id: 'particle', title: 'Particle in B-Field', description: 'Lorentz force and cyclotron motion', to: '/physics/magnetism/particle' },
            { id: 'flux', title: "Faraday's Law", description: 'Magnetic flux and induced EMF', to: '/physics/magnetism/flux' },
            { id: 'gauss', title: "Gauss's Law", description: 'Gaussian surfaces and enclosed charge', to: '/physics/em/gauss' },
            { id: 'capacitor', title: 'Capacitors & Dielectrics', description: 'Parallel plate capacitors and energy storage', to: '/physics/em/capacitor' },
            { id: 'biot-savart', title: 'Biot-Savart Law', description: 'Magnetic field from current elements', to: '/physics/em/biot-savart' },
            { id: 'ampere', title: "Ampere's Law", description: 'Solenoids, toroids, and enclosed current', to: '/physics/em/ampere' },
            { id: 'rlc', title: 'RLC Circuit', description: 'Impedance, resonance, and phasor diagrams', to: '/physics/em/rlc' },
            { id: 'rl-lc', title: 'RL/LC Circuits', description: 'Transient response and LC oscillations', to: '/physics/circuits/rl-lc' },
            { id: 'kirchhoff', title: "Kirchhoff's Laws", description: 'KVL, KCL, loop analysis, and current splitting', to: '/physics/circuits/kirchhoff' },
            { id: 'em-wave', title: 'EM Wave Propagation', description: 'Electric and magnetic field wave coupling', to: '/physics/em/em-wave' },
            { id: 'charge-distributions', title: 'Charge Distributions', description: 'E-fields from line, ring, disk, and plane via integration', to: '/physics/em/charge-distributions' },
            { id: 'conductors', title: 'Conductors & Shielding', description: 'Electrostatic equilibrium, Faraday cage, charge redistribution', to: '/physics/em/conductors' },
            { id: 'induction', title: 'Motional EMF & Eddy Currents', description: 'Sliding rod, Lenz\'s law, and magnetic braking', to: '/physics/em/induction' },
        ],
    },
    {
        name: 'Thermodynamics',
        visualizations: [
            { id: 'gas', title: 'Ideal Gas Law', description: 'Kinetic molecular theory and particle physics', to: '/physics/thermo/gas' },
            { id: 'pv', title: 'PV Diagrams', description: 'Work, heat, and thermodynamic processes', to: '/physics/thermo/pv' },
            { id: 'cycles', title: 'Thermodynamic Cycles', description: 'Carnot, Otto, and Diesel cycles', to: '/physics/thermo/cycles' },
            { id: 'heat-transfer', title: 'Heat Transfer', description: 'Thermal equilibrium, conduction, and heating curves', to: '/physics/thermo/heat-transfer' },
        ],
    },
    {
        name: 'Modern Physics',
        visualizations: [
            { id: 'photoelectric', title: 'Photoelectric Effect', description: 'Photon energy and electron ejection', to: '/physics/modern/photoelectric' },
            { id: 'energy-levels', title: 'Energy Levels', description: 'Atomic spectra and quantum transitions', to: '/physics/modern/energy-levels' },
            { id: 'decay', title: 'Radioactive Decay', description: 'Half-life, decay chains, and activity', to: '/physics/modern/decay' },
            { id: 'duality', title: 'Wave-Particle Duality', description: 'Double-slit experiment and de Broglie wavelength', to: '/physics/modern/duality' },
            { id: 'blackbody', title: 'Blackbody Radiation', description: "Planck's law, Wien's displacement, and UV catastrophe", to: '/physics/modern/blackbody' },
            { id: 'compton', title: 'Compton Scattering', description: 'Photon-electron collisions and wavelength shift', to: '/physics/modern/compton' },
        ],
    },
    {
        name: 'Fluids',
        visualizations: [
            { id: 'buoyancy', title: 'Buoyancy', description: "Archimedes' principle and fluid statics", to: '/physics/fluids/buoyancy' },
            { id: 'flow', title: 'Fluid Dynamics', description: 'Bernoulli principle and continuity equation', to: '/physics/fluids/flow' },
            { id: 'pressure', title: 'Pressure & Pascal\'s Law', description: 'Hydrostatic pressure, depth, and hydraulic press', to: '/physics/fluids/pressure' },
        ],
    },
]

export default function PhysicsHub() {
    return (
        <div className="min-h-screen relative bg-bg">
            <PhysicsBackground className="opacity-40" />

            <div className="relative z-10 px-5 sm:px-8 py-10 sm:py-14 max-w-6xl mx-auto">
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-text mb-1">
                        Physics
                    </h1>
                    <p className="text-text-secondary text-sm">
                        Mechanics, waves, E&M, thermodynamics, and modern physics
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
                                    <Link
                                        key={viz.id}
                                        to={viz.comingSoon ? '#' : viz.to}
                                        className={`group block ${viz.comingSoon ? 'cursor-not-allowed opacity-50' : ''}`}
                                        onClick={(e) => viz.comingSoon && e.preventDefault()}
                                    >
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
