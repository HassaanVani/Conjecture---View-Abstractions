import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import Layout from '@/components/layout'

// Loading spinner for lazy-loaded routes
function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                <span className="text-white/30 text-sm">Loading...</span>
            </div>
        </div>
    )
}

// Hub pages (eagerly loaded for instant navigation)
import Hub from '@/pages/hub'

// All other pages lazy-loaded for code splitting

// Math
const Collatz = lazy(() => import('@/pages/math/collatz'))
const Euclidean = lazy(() => import('@/pages/math/euclidean'))
const Matrix = lazy(() => import('@/pages/math/matrix'))
const FibonacciSpiral = lazy(() => import('@/pages/math/fibonacci-spiral'))
const UnitCircle = lazy(() => import('@/pages/math/unit-circle'))
const Conics = lazy(() => import('@/pages/math/conics'))
const Vectors = lazy(() => import('@/pages/math/vectors'))

// Physics
const PhysicsHub = lazy(() => import('@/pages/physics/ap-hub'))
const Pendulum = lazy(() => import('@/pages/physics/pendulum'))
const WaveInterference = lazy(() => import('@/pages/physics/wave-interference'))
const ProjectileMotion = lazy(() => import('@/pages/physics/kinematics/projectile'))
const InclinePlane = lazy(() => import('@/pages/physics/dynamics/incline'))
const FBD = lazy(() => import('@/pages/physics/dynamics/fbd'))
const Orbit = lazy(() => import('@/pages/physics/circular/orbit'))
const GravField = lazy(() => import('@/pages/physics/circular/grav-field'))
const EnergyCoaster = lazy(() => import('@/pages/physics/energy/coaster'))
const Collision = lazy(() => import('@/pages/physics/momentum/collision'))
const SpringMass = lazy(() => import('@/pages/physics/shm/spring'))
const TorqueBalance = lazy(() => import('@/pages/physics/rotation/balance'))
const Buoyancy = lazy(() => import('@/pages/physics/fluids/buoyancy'))
const FluidFlow = lazy(() => import('@/pages/physics/fluids/flow'))
const IdealGas = lazy(() => import('@/pages/physics/thermo/gas'))
const PVDiagram = lazy(() => import('@/pages/physics/thermo/pv'))
const HeatEngines = lazy(() => import('@/pages/physics/thermo/cycles'))
const ElectricFields = lazy(() => import('@/pages/physics/electro/fields'))
const RCCircuit = lazy(() => import('@/pages/physics/circuits/rc'))
const DCCircuit = lazy(() => import('@/pages/physics/circuits/dc'))
const RLLCCircuit = lazy(() => import('@/pages/physics/circuits/rl-lc'))
const MagneticParticle = lazy(() => import('@/pages/physics/magnetism/particle'))
const FaradayFlux = lazy(() => import('@/pages/physics/magnetism/flux'))
const SnellsLaw = lazy(() => import('@/pages/physics/optics/snell'))
const LensesMirrors = lazy(() => import('@/pages/physics/optics/lenses'))
const StandingWaves = lazy(() => import('@/pages/physics/waves/standing'))
const DopplerEffect = lazy(() => import('@/pages/physics/waves/doppler'))
const Diffraction = lazy(() => import('@/pages/physics/waves/diffraction'))
const Photoelectric = lazy(() => import('@/pages/physics/modern/photoelectric'))
const EnergyLevels = lazy(() => import('@/pages/physics/modern/energy-levels'))
const NuclearDecay = lazy(() => import('@/pages/physics/modern/decay'))
const DragSimulation = lazy(() => import('@/pages/physics/mechanics/drag'))
const Oscillator = lazy(() => import('@/pages/physics/mechanics/oscillator'))
const Resonance = lazy(() => import('@/pages/physics/mechanics/resonance'))
const CenterOfMass = lazy(() => import('@/pages/physics/mechanics/center-of-mass'))
const GaussLaw = lazy(() => import('@/pages/physics/em/gauss'))
const BiotSavart = lazy(() => import('@/pages/physics/em/biot-savart'))
const RLC = lazy(() => import('@/pages/physics/em/rlc'))
const Capacitor = lazy(() => import('@/pages/physics/em/capacitor'))
const Ampere = lazy(() => import('@/pages/physics/em/ampere'))
const EMWave = lazy(() => import('@/pages/physics/em/em-wave'))

// Calculus
const CalculusHub = lazy(() => import('@/pages/calculus/hub'))
const Limits = lazy(() => import('@/pages/calculus/limits'))
const Derivative = lazy(() => import('@/pages/calculus/derivative'))
const Riemann = lazy(() => import('@/pages/calculus/riemann'))
const FTC = lazy(() => import('@/pages/calculus/ftc'))
const Optimization = lazy(() => import('@/pages/calculus/optimization'))
const RelatedRates = lazy(() => import('@/pages/calculus/related-rates'))
const SlopeFields = lazy(() => import('@/pages/calculus/slope-fields'))
const Taylor = lazy(() => import('@/pages/calculus/taylor'))
const PolarCurves = lazy(() => import('@/pages/calculus/polar'))
const Parametric = lazy(() => import('@/pages/calculus/parametric'))

// Biology
const BiologyHub = lazy(() => import('@/pages/biology/hub'))
const CellDivision = lazy(() => import('@/pages/biology/cell-division'))
const PopulationGrowth = lazy(() => import('@/pages/biology/population-growth'))
const Macromolecules = lazy(() => import('@/pages/biology/macromolecules'))
const CellStructure = lazy(() => import('@/pages/biology/cell-structure'))
const Photosynthesis = lazy(() => import('@/pages/biology/photosynthesis'))
const Respiration = lazy(() => import('@/pages/biology/respiration'))
const DNA = lazy(() => import('@/pages/biology/dna'))
const Evolution = lazy(() => import('@/pages/biology/evolution'))
const Ecology = lazy(() => import('@/pages/biology/ecology'))

// Chemistry
const ChemistryHub = lazy(() => import('@/pages/chemistry/hub'))
const MolecularBonds = lazy(() => import('@/pages/chemistry/molecular-bonds'))
const ReactionKinetics = lazy(() => import('@/pages/chemistry/reaction-kinetics'))
const Orbitals = lazy(() => import('@/pages/chemistry/orbitals'))
const VSEPR = lazy(() => import('@/pages/chemistry/vsepr'))
const Phases = lazy(() => import('@/pages/chemistry/phases'))
const Stoichiometry = lazy(() => import('@/pages/chemistry/stoichiometry'))
const Kinetics = lazy(() => import('@/pages/chemistry/kinetics'))
const Enthalpy = lazy(() => import('@/pages/chemistry/enthalpy'))
const Equilibrium = lazy(() => import('@/pages/chemistry/equilibrium'))
// const Titration = lazy(() => import('@/pages/chemistry/titration'))

// Computer Science
const CSHub = lazy(() => import('@/pages/cs/hub'))
const Sorting = lazy(() => import('@/pages/cs/sorting'))
const BinarySearch = lazy(() => import('@/pages/cs/binary-search'))
const GraphTraversal = lazy(() => import('@/pages/cs/graph-traversal'))
const RecursionTree = lazy(() => import('@/pages/cs/recursion'))
const LinkedList = lazy(() => import('@/pages/cs/linked-list'))
const StackQueue = lazy(() => import('@/pages/cs/stack-queue'))
const BST = lazy(() => import('@/pages/cs/bst'))
const HashMap = lazy(() => import('@/pages/cs/hashmap'))

// Economics
const EconomicsHub = lazy(() => import('@/pages/economics/hub'))
const SupplyDemand = lazy(() => import('@/pages/economics/supply-demand'))
const CompoundInterest = lazy(() => import('@/pages/economics/compound-interest'))
const ProductionPossibilities = lazy(() => import('@/pages/economics/ppc'))
const ComparativeAdvantage = lazy(() => import('@/pages/economics/comparative-advantage'))
const ProductionCosts = lazy(() => import('@/pages/economics/production-costs'))
const GameTheory = lazy(() => import('@/pages/economics/game-theory'))
const Externalities = lazy(() => import('@/pages/economics/externalities'))
const CircularFlow = lazy(() => import('@/pages/economics/circular-flow'))
const BusinessCycle = lazy(() => import('@/pages/economics/business-cycle'))
const AdAsModel = lazy(() => import('@/pages/economics/ad-as'))
const MoneyMultiplier = lazy(() => import('@/pages/economics/money-multiplier'))
const PhillipsCurve = lazy(() => import('@/pages/economics/phillips-curve'))
const ForeignExchange = lazy(() => import('@/pages/economics/forex'))
const MarketStructures = lazy(() => import('@/pages/economics/market-structures'))
const LaborMarket = lazy(() => import('@/pages/economics/labor-market'))
const LoanableFunds = lazy(() => import('@/pages/economics/loanable-funds'))
const MoneyMarket = lazy(() => import('@/pages/economics/money-market'))

export default function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                    <AnimatePresence mode="wait">
                        <Routes>
                            <Route path="/" element={<Hub />} />

                            {/* Math */}
                            <Route path="/math/collatz" element={<Collatz />} />
                            <Route path="/math/euclidean" element={<Euclidean />} />
                            <Route path="/math/matrix" element={<Matrix />} />
                            <Route path="/math/fibonacci" element={<FibonacciSpiral />} />
                            <Route path="/math/unit-circle" element={<UnitCircle />} />
                            <Route path="/math/conics" element={<Conics />} />
                            <Route path="/math/vectors" element={<Vectors />} />

                            {/* Physics Hub */}
                            <Route path="/physics" element={<PhysicsHub />} />

                            {/* AP Physics 1 */}
                            <Route path="/physics/pendulum" element={<Pendulum />} />
                            <Route path="/physics/waves" element={<WaveInterference />} />
                            <Route path="/physics/kinematics/projectile" element={<ProjectileMotion />} />
                            <Route path="/physics/dynamics/incline" element={<InclinePlane />} />
                            <Route path="/physics/dynamics/fbd" element={<FBD />} />
                            <Route path="/physics/circular/orbit" element={<Orbit />} />
                            <Route path="/physics/circular/grav-field" element={<GravField />} />
                            <Route path="/physics/energy/coaster" element={<EnergyCoaster />} />
                            <Route path="/physics/momentum/collision" element={<Collision />} />
                            <Route path="/physics/shm/spring" element={<SpringMass />} />
                            <Route path="/physics/rotation/balance" element={<TorqueBalance />} />

                            {/* AP Physics 2 */}
                            <Route path="/physics/fluids/buoyancy" element={<Buoyancy />} />
                            <Route path="/physics/fluids/flow" element={<FluidFlow />} />
                            <Route path="/physics/thermo/gas" element={<IdealGas />} />
                            <Route path="/physics/thermo/pv" element={<PVDiagram />} />
                            <Route path="/physics/thermo/cycles" element={<HeatEngines />} />
                            <Route path="/physics/electro/fields" element={<ElectricFields />} />
                            <Route path="/physics/circuits/rc" element={<RCCircuit />} />
                            <Route path="/physics/circuits/dc" element={<DCCircuit />} />
                            <Route path="/physics/circuits/rl-lc" element={<RLLCCircuit />} />
                            <Route path="/physics/magnetism/particle" element={<MagneticParticle />} />
                            <Route path="/physics/magnetism/flux" element={<FaradayFlux />} />
                            <Route path="/physics/optics/snell" element={<SnellsLaw />} />
                            <Route path="/physics/optics/lenses" element={<LensesMirrors />} />
                            <Route path="/physics/waves/standing" element={<StandingWaves />} />
                            <Route path="/physics/waves/doppler" element={<DopplerEffect />} />
                            <Route path="/physics/waves/diffraction" element={<Diffraction />} />
                            <Route path="/physics/modern/photoelectric" element={<Photoelectric />} />
                            <Route path="/physics/modern/energy-levels" element={<EnergyLevels />} />
                            <Route path="/physics/modern/decay" element={<NuclearDecay />} />

                            {/* Physics C: Mechanics */}
                            <Route path="/physics/mechanics/drag" element={<DragSimulation />} />
                            <Route path="/physics/mechanics/oscillator" element={<Oscillator />} />
                            <Route path="/physics/mechanics/resonance" element={<Resonance />} />
                            <Route path="/physics/mechanics/center-of-mass" element={<CenterOfMass />} />

                            {/* Physics C: E&M */}
                            <Route path="/physics/em/gauss" element={<GaussLaw />} />
                            <Route path="/physics/em/biot-savart" element={<BiotSavart />} />
                            <Route path="/physics/em/rlc" element={<RLC />} />
                            <Route path="/physics/em/capacitor" element={<Capacitor />} />
                            <Route path="/physics/em/ampere" element={<Ampere />} />
                            <Route path="/physics/em/em-wave" element={<EMWave />} />

                            {/* Calculus */}
                            <Route path="/calculus" element={<CalculusHub />} />
                            <Route path="/calculus/limits" element={<Limits />} />
                            <Route path="/calculus/derivative" element={<Derivative />} />
                            <Route path="/calculus/riemann" element={<Riemann />} />
                            <Route path="/calculus/ftc" element={<FTC />} />
                            <Route path="/calculus/optimization" element={<Optimization />} />
                            <Route path="/calculus/related-rates" element={<RelatedRates />} />
                            <Route path="/calculus/slope-fields" element={<SlopeFields />} />
                            <Route path="/calculus/taylor" element={<Taylor />} />
                            <Route path="/calculus/polar" element={<PolarCurves />} />
                            <Route path="/calculus/parametric" element={<Parametric />} />

                            {/* Biology */}
                            <Route path="/biology" element={<BiologyHub />} />
                            <Route path="/biology/cell-division" element={<CellDivision />} />
                            <Route path="/biology/population" element={<PopulationGrowth />} />
                            <Route path="/biology/macromolecules" element={<Macromolecules />} />
                            <Route path="/biology/cell-structure" element={<CellStructure />} />
                            <Route path="/biology/photosynthesis" element={<Photosynthesis />} />
                            <Route path="/biology/respiration" element={<Respiration />} />
                            <Route path="/biology/dna" element={<DNA />} />
                            <Route path="/biology/evolution" element={<Evolution />} />
                            <Route path="/biology/ecology" element={<Ecology />} />

                            {/* Chemistry */}
                            <Route path="/chemistry" element={<ChemistryHub />} />
                            <Route path="/chemistry/bonds" element={<MolecularBonds />} />
                            <Route path="/chemistry/reactions" element={<ReactionKinetics />} />
                            <Route path="/chemistry/orbitals" element={<Orbitals />} />
                            <Route path="/chemistry/vsepr" element={<VSEPR />} />
                            <Route path="/chemistry/phases" element={<Phases />} />
                            <Route path="/chemistry/stoichiometry" element={<Stoichiometry />} />
                            <Route path="/chemistry/kinetics" element={<Kinetics />} />
                            <Route path="/chemistry/enthalpy" element={<Enthalpy />} />
                            <Route path="/chemistry/equilibrium" element={<Equilibrium />} />
                            {/* <Route path="/chemistry/titration" element={<Titration />} /> */}

                            {/* Computer Science */}
                            <Route path="/cs" element={<CSHub />} />
                            <Route path="/cs/sorting" element={<Sorting />} />
                            <Route path="/cs/binary-search" element={<BinarySearch />} />
                            <Route path="/cs/graphs" element={<GraphTraversal />} />
                            <Route path="/cs/recursion" element={<RecursionTree />} />
                            <Route path="/cs/linked-list" element={<LinkedList />} />
                            <Route path="/cs/stack-queue" element={<StackQueue />} />
                            <Route path="/cs/bst" element={<BST />} />
                            <Route path="/cs/hashmap" element={<HashMap />} />

                            {/* Economics */}
                            <Route path="/economics" element={<EconomicsHub />} />
                            <Route path="/economics/ppc" element={<ProductionPossibilities />} />
                            <Route path="/economics/comparative" element={<ComparativeAdvantage />} />
                            <Route path="/economics/supply-demand" element={<SupplyDemand />} />
                            <Route path="/economics/costs" element={<ProductionCosts />} />
                            <Route path="/economics/game-theory" element={<GameTheory />} />
                            <Route path="/economics/externalities" element={<Externalities />} />
                            <Route path="/economics/circular-flow" element={<CircularFlow />} />
                            <Route path="/economics/business-cycle" element={<BusinessCycle />} />
                            <Route path="/economics/ad-as" element={<AdAsModel />} />
                            <Route path="/economics/money" element={<MoneyMultiplier />} />
                            <Route path="/economics/phillips" element={<PhillipsCurve />} />
                            <Route path="/economics/forex" element={<ForeignExchange />} />
                            <Route path="/economics/interest" element={<CompoundInterest />} />
                            <Route path="/economics/market-structures" element={<MarketStructures />} />
                            <Route path="/economics/labor-market" element={<LaborMarket />} />
                            <Route path="/economics/loanable-funds" element={<LoanableFunds />} />
                            <Route path="/economics/money-market" element={<MoneyMarket />} />
                        </Routes>
                    </AnimatePresence>
                </Suspense>
            </Layout>
        </BrowserRouter>
    )
}
