import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from '@/components/layout'
import Hub from '@/pages/hub'
import Collatz from '@/pages/collatz'
import Sorting from '@/pages/sorting'
import Euclidean from '@/pages/euclidean'
import Matrix from '@/pages/matrix'
import BinarySearch from '@/pages/binary-search'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Hub />} />
            <Route path="/collatz" element={<Collatz />} />
            <Route path="/sorting" element={<Sorting />} />
            <Route path="/euclidean" element={<Euclidean />} />
            <Route path="/matrix" element={<Matrix />} />
            <Route path="/binary-search" element={<BinarySearch />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </BrowserRouter>
  )
}
