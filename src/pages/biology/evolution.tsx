import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type SelectionType = 'directional' | 'stabilizing' | 'disruptive'

const BIO_COLOR = 'rgb(80, 200, 120)'

interface Organism {
  trait: number
  alive: boolean
  x: number
  y: number
}

export default function Evolution() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  const [populationSize, setPopulationSize] = useState(200)
  const [selectionPressure, setSelectionPressure] = useState(0.3)
  const [mutationRate, setMutationRate] = useState(0.02)
  const [generation, setGeneration] = useState(0)
  const [selectionType, setSelectionType] = useState<SelectionType>('directional')
  const [isRunning, setIsRunning] = useState(false)

  const populationRef = useRef<Organism[]>([])
  const historyRef = useRef<{ p: number; q: number; gen: number }[]>([])

  const initPopulation = useCallback(() => {
    const pop: Organism[] = []
    for (let i = 0; i < populationSize; i++) {
      const trait = Math.random()
      pop.push({
        trait,
        alive: true,
        x: Math.random(),
        y: Math.random(),
      })
    }
    populationRef.current = pop
    historyRef.current = []
    setGeneration(0)
  }, [populationSize])

  useEffect(() => { initPopulation() }, [initPopulation])

  const fitness = useCallback((trait: number): number => {
    switch (selectionType) {
      case 'directional':
        return 0.3 + trait * selectionPressure * 2
      case 'stabilizing': {
        const dist = Math.abs(trait - 0.5)
        return Math.max(0.1, 1 - dist * selectionPressure * 4)
      }
      case 'disruptive': {
        const dist = Math.abs(trait - 0.5)
        return 0.3 + dist * selectionPressure * 3
      }
      default:
        return 0.5
    }
  }, [selectionType, selectionPressure])

  const nextGeneration = useCallback(() => {
    const pop = populationRef.current
    if (pop.length === 0) return

    // Calculate allele frequencies (trait < 0.5 = q allele, trait >= 0.5 = p allele)
    const pCount = pop.filter(o => o.trait >= 0.5).length
    const p = pCount / pop.length
    const q = 1 - p

    historyRef.current.push({ p, q, gen: generation })
    if (historyRef.current.length > 100) historyRef.current.shift()

    // Selection
    const fitnessValues = pop.map(o => fitness(o.trait))
    const maxFit = Math.max(...fitnessValues)
    const normalizedFitness = fitnessValues.map(f => f / maxFit)

    // Reproduce with selection
    const newPop: Organism[] = []
    for (let i = 0; i < populationSize; i++) {
      // Roulette wheel selection
      let parent1 = pop[Math.floor(Math.random() * pop.length)]
      let parent2 = pop[Math.floor(Math.random() * pop.length)]

      // Bias selection toward fitter individuals
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = Math.floor(Math.random() * pop.length)
        if (normalizedFitness[candidate] > Math.random()) {
          parent1 = pop[candidate]
          break
        }
      }
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = Math.floor(Math.random() * pop.length)
        if (normalizedFitness[candidate] > Math.random()) {
          parent2 = pop[candidate]
          break
        }
      }

      let trait = (parent1.trait + parent2.trait) / 2

      // Mutation
      if (Math.random() < mutationRate) {
        trait += (Math.random() - 0.5) * 0.2
      }

      trait = Math.max(0, Math.min(1, trait))

      newPop.push({
        trait,
        alive: true,
        x: Math.random(),
        y: Math.random(),
      })
    }

    populationRef.current = newPop
    setGeneration(g => g + 1)
  }, [populationSize, fitness, mutationRate, generation])

  useEffect(() => {
    if (!isRunning) return
    const timer = setInterval(nextGeneration, 500)
    return () => clearInterval(timer)
  }, [isRunning, nextGeneration])

  const reset = useCallback(() => {
    setIsRunning(false)
    setPopulationSize(200)
    setSelectionPressure(0.3)
    setMutationRate(0.02)
    setSelectionType('directional')
    initPopulation()
  }, [initPopulation])

  const pop = populationRef.current
  const pFreq = pop.length > 0 ? pop.filter(o => o.trait >= 0.5).length / pop.length : 0.5
  const qFreq = 1 - pFreq
  const meanTrait = pop.length > 0 ? pop.reduce((s, o) => s + o.trait, 0) / pop.length : 0.5

  const demoSteps: DemoStep[] = [
    {
      title: 'Natural Selection',
      description: 'Organisms with traits better suited to their environment survive and reproduce more (differential reproduction). Over generations, favorable alleles increase in frequency.',
      setup: () => { setSelectionType('directional'); setIsRunning(false); initPopulation() },
    },
    {
      title: 'Directional Selection',
      description: 'Favors one extreme phenotype. The population mean shifts in one direction. Example: antibiotic resistance in bacteria, darker fur in polluted environments.',
      setup: () => { setSelectionType('directional'); setSelectionPressure(0.5); setIsRunning(true) },
    },
    {
      title: 'Stabilizing Selection',
      description: 'Favors the intermediate phenotype and selects against extremes. Reduces variation. Example: human birth weight -- too small or too large is selected against.',
      setup: () => { setSelectionType('stabilizing'); setSelectionPressure(0.5); initPopulation(); setIsRunning(true) },
    },
    {
      title: 'Disruptive Selection',
      description: 'Favors BOTH extremes and selects against the middle. Can lead to speciation. Example: beak sizes in seed-cracking birds on islands with only small and large seeds.',
      setup: () => { setSelectionType('disruptive'); setSelectionPressure(0.5); initPopulation(); setIsRunning(true) },
    },
    {
      title: 'Hardy-Weinberg Equilibrium',
      description: 'In a non-evolving population: p² + 2pq + q² = 1 and p + q = 1. Requires: no selection, no mutation, large population, random mating, no migration. Any violation = evolution.',
      setup: () => { setSelectionPressure(0); setMutationRate(0); setIsRunning(false) },
    },
  ]

  const demo = useDemoMode(demoSteps)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let dpr = window.devicePixelRatio || 1
    const resize = () => {
      dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      timeRef.current += 0.016
      const t = timeRef.current
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.fillStyle = '#0a1a12'
      ctx.fillRect(0, 0, w, h)

      const pop = populationRef.current
      const history = historyRef.current

      // Layout: left = population dots, right top = histogram, right bottom = allele freq chart

      const popAreaW = w * 0.5
      const popAreaH = h * 0.7
      const popX = 20
      const popY = 60

      // --- Population dots ---
      ctx.strokeStyle = 'rgba(80, 200, 120, 0.15)'
      ctx.lineWidth = 1
      ctx.strokeRect(popX, popY, popAreaW, popAreaH)

      ctx.fillStyle = 'rgba(80, 200, 120, 0.5)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Population', popX + popAreaW / 2, popY - 8)

      pop.forEach(org => {
        const ox = popX + org.x * popAreaW
        const oy = popY + org.y * popAreaH

        // Color based on trait value (0=blue, 1=red)
        const r = Math.floor(org.trait * 255)
        const b = Math.floor((1 - org.trait) * 255)
        const g = 80
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`
        ctx.beginPath()
        ctx.arc(ox, oy, 3, 0, Math.PI * 2)
        ctx.fill()
      })

      // --- Trait Distribution Histogram ---
      const histX = popAreaW + 60
      const histY = 60
      const histW = w - histX - 30
      const histH = h * 0.32

      ctx.strokeStyle = 'rgba(80, 200, 120, 0.15)'
      ctx.strokeRect(histX, histY, histW, histH)

      ctx.fillStyle = 'rgba(80, 200, 120, 0.5)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Trait Distribution', histX + histW / 2, histY - 8)

      // Build histogram
      const bins = 20
      const counts = new Array(bins).fill(0)
      pop.forEach(org => {
        const bin = Math.min(bins - 1, Math.floor(org.trait * bins))
        counts[bin]++
      })
      const maxCount = Math.max(1, ...counts)

      const barW = histW / bins
      counts.forEach((count, i) => {
        const barH = (count / maxCount) * (histH - 20)
        const traitVal = (i + 0.5) / bins
        const r = Math.floor(traitVal * 255)
        const b = Math.floor((1 - traitVal) * 255)
        ctx.fillStyle = `rgba(${r}, 80, ${b}, 0.6)`
        ctx.fillRect(histX + i * barW + 1, histY + histH - barH, barW - 2, barH)
      })

      // Fitness curve overlay
      ctx.strokeStyle = 'rgba(255, 200, 50, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 100; i++) {
        const trait = i / 100
        const f = fitness(trait)
        const fx = histX + trait * histW
        const fy = histY + histH - f * (histH - 20)
        i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy)
      }
      ctx.stroke()
      ctx.fillStyle = 'rgba(255, 200, 50, 0.5)'
      ctx.font = '9px system-ui'
      ctx.textAlign = 'right'
      ctx.fillText('Fitness curve', histX + histW - 5, histY + 15)

      // --- Allele Frequency Chart ---
      const freqX = popAreaW + 60
      const freqY = histY + histH + 40
      const freqW = histW
      const freqH = h - freqY - 30

      ctx.strokeStyle = 'rgba(80, 200, 120, 0.15)'
      ctx.strokeRect(freqX, freqY, freqW, freqH)

      ctx.fillStyle = 'rgba(80, 200, 120, 0.5)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Allele Frequency over Generations', freqX + freqW / 2, freqY - 8)

      if (history.length > 1) {
        // p allele line
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)'
        ctx.lineWidth = 2
        ctx.beginPath()
        history.forEach((h2, i) => {
          const hx = freqX + (i / (history.length - 1)) * freqW
          const hy = freqY + (1 - h2.p) * freqH
          i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy)
        })
        ctx.stroke()

        // q allele line
        ctx.strokeStyle = 'rgba(100, 100, 255, 0.7)'
        ctx.beginPath()
        history.forEach((h2, i) => {
          const hx = freqX + (i / (history.length - 1)) * freqW
          const hy = freqY + (1 - h2.q) * freqH
          i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy)
        })
        ctx.stroke()

        // Legend
        ctx.fillStyle = 'rgba(255, 100, 100, 0.7)'
        ctx.font = '10px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText(`p = ${pFreq.toFixed(3)}`, freqX + 8, freqY + 15)
        ctx.fillStyle = 'rgba(100, 100, 255, 0.7)'
        ctx.fillText(`q = ${qFreq.toFixed(3)}`, freqX + 8, freqY + 28)
      }

      // Axes for freq chart
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.font = '9px system-ui'
      ctx.textAlign = 'right'
      ctx.fillText('1.0', freqX - 3, freqY + 6)
      ctx.fillText('0.5', freqX - 3, freqY + freqH / 2 + 3)
      ctx.fillText('0.0', freqX - 3, freqY + freqH + 3)

      // Generation counter on population area
      ctx.fillStyle = 'rgba(80, 200, 120, 0.7)'
      ctx.font = 'bold 14px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(`Generation: ${generation}`, popX + popAreaW / 2, popY + popAreaH + 25)

      // Selection type indicator
      ctx.fillStyle = 'rgba(255, 200, 50, 0.5)'
      ctx.font = '11px system-ui'
      ctx.fillText(`Selection: ${selectionType}`, popX + popAreaW / 2, popY + popAreaH + 42)

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [generation, fitness, selectionType, pFreq, qFreq, selectionPressure])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1a12]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-[200px]">
          <APTag course="Biology" unit="Unit 7" color={BIO_COLOR} />
          <InfoPanel
            title="Evolution Data"
            departmentColor={BIO_COLOR}
            items={[
              { label: 'Generation', value: generation },
              { label: 'Pop Size', value: pop.length },
              { label: 'Mean Trait', value: meanTrait.toFixed(3) },
              { label: 'p (freq)', value: pFreq.toFixed(3), color: 'rgb(255, 100, 100)' },
              { label: 'q (freq)', value: qFreq.toFixed(3), color: 'rgb(100, 100, 255)' },
              { label: 'p² + 2pq + q²', value: (pFreq ** 2 + 2 * pFreq * qFreq + qFreq ** 2).toFixed(4) },
            ]}
          />
        </div>

        <div className="absolute top-4 right-4 max-w-[220px]">
          <EquationDisplay
            departmentColor={BIO_COLOR}
            title="Hardy-Weinberg"
            equations={[
              { label: 'Alleles', expression: 'p + q = 1' },
              { label: 'Genotypes', expression: 'p² + 2pq + q² = 1', description: 'Homozygous dom + heterozygous + homozygous rec' },
              { label: 'Conditions', expression: 'No selection, mutation, drift, migration, non-random mating' },
            ]}
          />
        </div>

        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <DemoMode
            steps={demoSteps}
            currentStep={demo.currentStep}
            isOpen={demo.isOpen}
            onClose={demo.close}
            onNext={demo.next}
            onPrev={demo.prev}
            onGoToStep={demo.goToStep}
            departmentColor={BIO_COLOR}
            title="AP Bio Tutorial"
          />
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="w-32">
            <Slider value={populationSize} onChange={(v) => setPopulationSize(Math.round(v))} min={50} max={500} step={50} label="Pop Size" />
          </div>
          <div className="w-32">
            <Slider value={selectionPressure} onChange={setSelectionPressure} min={0} max={1} step={0.05} label="Selection" />
          </div>
          <div className="w-32">
            <Slider value={mutationRate} onChange={setMutationRate} min={0} max={0.1} step={0.005} label="Mutation" />
          </div>
          <ButtonGroup
            value={selectionType}
            onChange={(v) => setSelectionType(v as SelectionType)}
            options={[
              { value: 'directional', label: 'Direct.' },
              { value: 'stabilizing', label: 'Stabil.' },
              { value: 'disruptive', label: 'Disrupt.' },
            ]}
            label="Selection Type"
            color={BIO_COLOR}
          />
          <div className="flex gap-2">
            <Button onClick={() => setIsRunning(!isRunning)}>{isRunning ? 'Pause' : 'Run'}</Button>
            <Button onClick={nextGeneration} variant="secondary">Step</Button>
            <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
            <Button onClick={reset} variant="secondary">Reset</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
