import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from '@/components/layout'
import Hub from '@/pages/hub'

// Math
import Collatz from '@/pages/math/collatz'
import Euclidean from '@/pages/math/euclidean'
import Matrix from '@/pages/math/matrix'
import FibonacciSpiral from '@/pages/math/fibonacci-spiral'

// Physics
import Pendulum from '@/pages/physics/pendulum'
import WaveInterference from '@/pages/physics/wave-interference'
import PhysicsHub from '@/pages/physics/ap-hub'
import ProjectileMotion from '@/pages/physics/kinematics/projectile'
import InclinePlane from '@/pages/physics/dynamics/incline'
import Orbit from '@/pages/physics/circular/orbit'
import EnergyCoaster from '@/pages/physics/energy/coaster'
import Collision from '@/pages/physics/momentum/collision'
import SpringMass from '@/pages/physics/shm/spring'
import TorqueBalance from '@/pages/physics/rotation/balance'
import Buoyancy from '@/pages/physics/fluids/buoyancy'
import FluidFlow from '@/pages/physics/fluids/flow'
import IdealGas from '@/pages/physics/thermo/gas'
import PVDiagram from '@/pages/physics/thermo/pv'
import ElectricFields from '@/pages/physics/electro/fields'
import RCCircuit from '@/pages/physics/circuits/rc'
import MagneticParticle from '@/pages/physics/magnetism/particle'
import FaradayFlux from '@/pages/physics/magnetism/flux'
import SnellsLaw from '@/pages/physics/optics/snell'
import LensesMirrors from '@/pages/physics/optics/lenses'
import Photoelectric from '@/pages/physics/modern/photoelectric'
import DragSimulation from '@/pages/physics/mechanics/drag'
import Oscillator from '@/pages/physics/mechanics/oscillator'
import GaussLaw from '@/pages/physics/em/gauss'
import BiotSavart from '@/pages/physics/em/biot-savart'
import RLC from '@/pages/physics/em/rlc'

// Biology
import CellDivision from '@/pages/biology/cell-division'
import PopulationGrowth from '@/pages/biology/population-growth'

// Chemistry
import MolecularBonds from '@/pages/chemistry/molecular-bonds'
import ReactionKinetics from '@/pages/chemistry/reaction-kinetics'

// Computer Science
import Sorting from '@/pages/cs/sorting'
import BinarySearch from '@/pages/cs/binary-search'
import GraphTraversal from '@/pages/cs/graph-traversal'

// Economics
import EconomicsHub from '@/pages/economics/hub'
import SupplyDemand from '@/pages/economics/supply-demand'
import CompoundInterest from '@/pages/economics/compound-interest'
import ProductionPossibilities from '@/pages/economics/ppc'
import ComparativeAdvantage from '@/pages/economics/comparative-advantage'
import ProductionCosts from '@/pages/economics/production-costs'
import GameTheory from '@/pages/economics/game-theory'
import Externalities from '@/pages/economics/externalities'
import CircularFlow from '@/pages/economics/circular-flow'
import BusinessCycle from '@/pages/economics/business-cycle'
import AdAsModel from '@/pages/economics/ad-as'
import MoneyMultiplier from '@/pages/economics/money-multiplier'
import PhillipsCurve from '@/pages/economics/phillips-curve'
import ForeignExchange from '@/pages/economics/forex'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Hub />} />

            {/* Math */}
            <Route path="/math/collatz" element={<Collatz />} />
            <Route path="/math/euclidean" element={<Euclidean />} />
            <Route path="/math/matrix" element={<Matrix />} />
            <Route path="/math/fibonacci" element={<FibonacciSpiral />} />

            {/* Physics */}
            <Route path="/physics" element={<PhysicsHub />} />
            <Route path="/physics/pendulum" element={<Pendulum />} />
            <Route path="/physics/waves" element={<WaveInterference />} />

            {/* AP Physics Units */}
            <Route path="/physics/kinematics/projectile" element={<ProjectileMotion />} />
            <Route path="/physics/dynamics/incline" element={<InclinePlane />} />
            <Route path="/physics/circular/orbit" element={<Orbit />} />
            <Route path="/physics/energy/coaster" element={<EnergyCoaster />} />
            <Route path="/physics/momentum/collision" element={<Collision />} />
            <Route path="/physics/shm/spring" element={<SpringMass />} />
            <Route path="/physics/rotation/balance" element={<TorqueBalance />} />
            <Route path="/physics/fluids/buoyancy" element={<Buoyancy />} />
            <Route path="/physics/fluids/flow" element={<FluidFlow />} />
            <Route path="/physics/thermo/gas" element={<IdealGas />} />
            <Route path="/physics/thermo/pv" element={<PVDiagram />} />
            <Route path="/physics/electro/fields" element={<ElectricFields />} />
            <Route path="/physics/circuits/rc" element={<RCCircuit />} />
            <Route path="/physics/magnetism/particle" element={<MagneticParticle />} />
            <Route path="/physics/magnetism/flux" element={<FaradayFlux />} />
            <Route path="/physics/optics/snell" element={<SnellsLaw />} />
            <Route path="/physics/optics/lenses" element={<LensesMirrors />} />
            <Route path="/physics/modern/photoelectric" element={<Photoelectric />} />

            {/* Mechanics C */}
            <Route path="/physics/mechanics/drag" element={<DragSimulation />} />
            <Route path="/physics/mechanics/oscillator" element={<Oscillator />} />

            {/* E&M C */}
            <Route path="/physics/em/gauss" element={<GaussLaw />} />
            <Route path="/physics/em/biot-savart" element={<BiotSavart />} />
            <Route path="/physics/em/rlc" element={<RLC />} />

            {/* Biology */}
            <Route path="/biology/cell-division" element={<CellDivision />} />
            <Route path="/biology/population" element={<PopulationGrowth />} />

            {/* Chemistry */}
            <Route path="/chemistry/bonds" element={<MolecularBonds />} />
            <Route path="/chemistry/reactions" element={<ReactionKinetics />} />

            {/* Computer Science */}
            <Route path="/cs/sorting" element={<Sorting />} />
            <Route path="/cs/binary-search" element={<BinarySearch />} />
            <Route path="/cs/graphs" element={<GraphTraversal />} />

            {/* Economics - Hub */}
            <Route path="/economics" element={<EconomicsHub />} />

            {/* Economics - Microeconomics */}
            <Route path="/economics/ppc" element={<ProductionPossibilities />} />
            <Route path="/economics/comparative" element={<ComparativeAdvantage />} />
            <Route path="/economics/supply-demand" element={<SupplyDemand />} />
            <Route path="/economics/costs" element={<ProductionCosts />} />
            <Route path="/economics/game-theory" element={<GameTheory />} />
            <Route path="/economics/externalities" element={<Externalities />} />

            {/* Economics - Macroeconomics */}
            <Route path="/economics/circular-flow" element={<CircularFlow />} />
            <Route path="/economics/business-cycle" element={<BusinessCycle />} />
            <Route path="/economics/ad-as" element={<AdAsModel />} />
            <Route path="/economics/money" element={<MoneyMultiplier />} />
            <Route path="/economics/phillips" element={<PhillipsCurve />} />
            <Route path="/economics/forex" element={<ForeignExchange />} />
            <Route path="/economics/interest" element={<CompoundInterest />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </BrowserRouter>
  )
}
