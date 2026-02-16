import { useState, useRef, useEffect, useCallback } from 'react'
import { ControlGroup, Slider, Select, Toggle, Button } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CHEM_COLOR = 'rgb(255, 160, 80)'
const BG = '#1a120a'

interface Reaction {
  name: string
  equation: string
  reactants: { name: string; coeff: number; molarMass: number; color: string }[]
  products: { name: string; coeff: number; molarMass: number; color: string }[]
}

const reactions: Reaction[] = [
  {
    name: 'Combustion of Methane',
    equation: 'CH4 + 2O2 -> CO2 + 2H2O',
    reactants: [
      { name: 'CH4', coeff: 1, molarMass: 16.04, color: 'rgba(100,200,100,0.9)' },
      { name: 'O2', coeff: 2, molarMass: 32.00, color: 'rgba(255,100,100,0.9)' },
    ],
    products: [
      { name: 'CO2', coeff: 1, molarMass: 44.01, color: 'rgba(180,180,180,0.9)' },
      { name: 'H2O', coeff: 2, molarMass: 18.02, color: 'rgba(100,150,255,0.9)' },
    ],
  },
  {
    name: 'Synthesis of Ammonia',
    equation: 'N2 + 3H2 -> 2NH3',
    reactants: [
      { name: 'N2', coeff: 1, molarMass: 28.02, color: 'rgba(100,100,255,0.9)' },
      { name: 'H2', coeff: 3, molarMass: 2.02, color: 'rgba(255,255,100,0.9)' },
    ],
    products: [
      { name: 'NH3', coeff: 2, molarMass: 17.03, color: 'rgba(100,255,200,0.9)' },
    ],
  },
  {
    name: 'Decomposition of H2O2',
    equation: '2H2O2 -> 2H2O + O2',
    reactants: [
      { name: 'H2O2', coeff: 2, molarMass: 34.01, color: 'rgba(100,200,255,0.9)' },
    ],
    products: [
      { name: 'H2O', coeff: 2, molarMass: 18.02, color: 'rgba(100,150,255,0.9)' },
      { name: 'O2', coeff: 1, molarMass: 32.00, color: 'rgba(255,100,100,0.9)' },
    ],
  },
]

export default function Stoichiometry() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const frameRef = useRef(0)

  const [reactionIdx, setReactionIdx] = useState(0)
  const [reactantAmounts, setReactantAmounts] = useState([2.0, 5.0])
  const [showLimiting, setShowLimiting] = useState(true)

  const rxn = reactions[reactionIdx]

  const setAmount = useCallback((idx: number, val: number) => {
    setReactantAmounts(prev => {
      const next = [...prev]
      next[idx] = val
      return next
    })
  }, [])

  // Calculate limiting reagent and yields
  const molesAvailable = rxn.reactants.map((r, i) => (reactantAmounts[i] || 0) / r.coeff)
  const limitingIdx = molesAvailable.indexOf(Math.min(...molesAvailable))
  const limitingMoles = molesAvailable[limitingIdx]
  const productMoles = rxn.products.map(p => limitingMoles * p.coeff)
  const productMasses = rxn.products.map((p, i) => productMoles[i] * p.molarMass)
  const excessAmounts = rxn.reactants.map((r, i) => {
    if (i === limitingIdx) return 0
    return (reactantAmounts[i] || 0) - limitingMoles * r.coeff
  })

  const resetAll = useCallback(() => {
    setReactionIdx(0)
    setReactantAmounts([2.0, 5.0])
    setShowLimiting(true)
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'Stoichiometry', description: 'Stoichiometry is the quantitative study of reactants and products in chemical reactions. It uses mole ratios from balanced equations to predict amounts.', setup: () => { setReactionIdx(0); setReactantAmounts([2.0, 5.0]) } },
    { title: 'Balanced Equations', description: 'Coefficients tell us the mole ratios. In CH4 + 2O2 -> CO2 + 2H2O, 1 mole of methane reacts with exactly 2 moles of oxygen. Matter is conserved!', setup: () => { setReactionIdx(0); setReactantAmounts([1.0, 2.0]) } },
    { title: 'Mole Ratios', description: 'The mole ratio is the key bridge between substances. If we know moles of one substance, we can find moles of any other using the coefficients as conversion factors.', setup: () => { setReactionIdx(0); setReactantAmounts([3.0, 6.0]) } },
    { title: 'Limiting Reagent', description: 'The limiting reagent is completely consumed first and determines the maximum product. The other reactant(s) are in "excess." Think of it like making sandwiches.', setup: () => { setReactionIdx(0); setReactantAmounts([2.0, 3.0]); setShowLimiting(true) } },
    { title: 'Excess Reagent', description: 'The excess reagent has leftover moles after the limiting reagent is fully consumed. The amount of excess = initial moles - (moles used in reaction).', setup: () => { setReactantAmounts([1.0, 8.0]) } },
    { title: 'Theoretical Yield', description: 'Theoretical yield = moles of product (from limiting reagent) x molar mass. This is the MAXIMUM possible product assuming 100% efficiency. Actual yield is often less.', setup: () => { setReactantAmounts([5.0, 10.0]) } },
    { title: 'Synthesis Reaction', description: 'In N2 + 3H2 -> 2NH3 (Haber process), nitrogen and hydrogen combine to form ammonia. The 1:3:2 mole ratio means we need 3x as much H2 as N2.', setup: () => { setReactionIdx(1); setReactantAmounts([1.0, 3.0]) } },
  ]

  const demo = useDemoMode(demoSteps)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      frameRef.current++
      const f = frameRef.current
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)

      // Grid
      ctx.strokeStyle = 'rgba(255,160,80,0.04)'
      ctx.lineWidth = 1
      for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke() }
      for (let i = 0; i < h; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke() }

      // Balanced equation display
      ctx.fillStyle = 'rgba(255,160,80,0.9)'
      ctx.font = 'bold 18px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(rxn.equation, w * 0.5, 40)

      // Molecule counting visualization
      const molAreaY = 70
      const molAreaH = h * 0.35
      const totalReactants = rxn.reactants.length
      const totalProducts = rxn.products.length
      const allCount = totalReactants + totalProducts
      const colW = (w * 0.9) / allCount

      // Draw reactant molecule balls
      rxn.reactants.forEach((r, ri) => {
        const cx = w * 0.05 + ri * colW + colW / 2
        const amount = reactantAmounts[ri] || 0
        const ballCount = Math.min(Math.round(amount * 3), 30)

        // Label
        ctx.fillStyle = r.color
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(`${r.coeff} ${r.name}`, cx, molAreaY + 15)
        ctx.font = '11px system-ui'
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.fillText(`${amount.toFixed(1)} mol`, cx, molAreaY + 32)

        if (showLimiting && ri === limitingIdx) {
          ctx.fillStyle = 'rgba(255,100,100,0.3)'
          ctx.fillRect(cx - colW * 0.4, molAreaY + 40, colW * 0.8, molAreaH - 50)
          ctx.fillStyle = 'rgba(255,100,100,0.8)'
          ctx.font = '10px system-ui'
          ctx.fillText('LIMITING', cx, molAreaY + molAreaH)
        } else if (showLimiting && excessAmounts[ri] > 0) {
          ctx.fillStyle = 'rgba(255,200,80,0.7)'
          ctx.font = '10px system-ui'
          ctx.fillText(`Excess: ${excessAmounts[ri].toFixed(2)} mol`, cx, molAreaY + molAreaH)
        }

        // Draw balls
        for (let b = 0; b < ballCount; b++) {
          const row = Math.floor(b / 5)
          const col = b % 5
          const bx = cx - 30 + col * 14
          const by = molAreaY + 50 + row * 14
          const bobble = Math.sin(f * 0.03 + b * 0.5) * 2
          ctx.fillStyle = r.color
          ctx.beginPath()
          ctx.arc(bx + bobble, by, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Arrow
      const arrowX = w * 0.05 + totalReactants * colW
      ctx.fillStyle = 'rgba(255,160,80,0.6)'
      ctx.font = '24px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('\u2192', arrowX, molAreaY + molAreaH / 2 + 10)

      // Draw product molecule balls
      rxn.products.forEach((p, pi) => {
        const cx = arrowX + 30 + pi * colW + colW / 2
        const moles = productMoles[pi]
        const mass = productMasses[pi]
        const ballCount = Math.min(Math.round(moles * 3), 30)

        ctx.fillStyle = p.color
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(`${p.coeff} ${p.name}`, cx, molAreaY + 15)
        ctx.font = '11px system-ui'
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.fillText(`${moles.toFixed(2)} mol`, cx, molAreaY + 32)

        for (let b = 0; b < ballCount; b++) {
          const row = Math.floor(b / 5)
          const col = b % 5
          const bx = cx - 30 + col * 14
          const by = molAreaY + 50 + row * 14
          const bobble = Math.sin(f * 0.03 + b * 0.7) * 2
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(bx + bobble, by, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Yield bar chart (bottom half)
      const chartY = h * 0.55
      const chartH = h * 0.35
      const chartPad = 80

      ctx.fillStyle = 'rgba(255,160,80,0.7)'
      ctx.font = 'bold 13px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Theoretical Yield', chartPad, chartY)

      // Axes
      ctx.strokeStyle = 'rgba(255,160,80,0.3)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(chartPad, chartY + 15)
      ctx.lineTo(chartPad, chartY + chartH)
      ctx.lineTo(w - chartPad, chartY + chartH)
      ctx.stroke()

      const maxMass = Math.max(...productMasses, 1)
      const barW = Math.min(60, (w - chartPad * 2) / (rxn.products.length * 2))

      rxn.products.forEach((p, pi) => {
        const mass = productMasses[pi]
        const moles = productMoles[pi]
        const barH = (mass / (maxMass * 1.2)) * (chartH - 25)
        const bx = chartPad + 40 + pi * (barW * 2.5)
        const by = chartY + chartH - barH

        // Bar
        const grad = ctx.createLinearGradient(bx, by, bx, chartY + chartH)
        grad.addColorStop(0, p.color)
        grad.addColorStop(1, p.color.replace('0.9', '0.3'))
        ctx.fillStyle = grad
        ctx.fillRect(bx, by, barW, barH)

        // Bar border
        ctx.strokeStyle = p.color
        ctx.lineWidth = 1
        ctx.strokeRect(bx, by, barW, barH)

        // Labels
        ctx.fillStyle = p.color
        ctx.font = 'bold 12px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(p.name, bx + barW / 2, chartY + chartH + 15)
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '11px system-ui'
        ctx.fillText(`${mass.toFixed(2)} g`, bx + barW / 2, by - 8)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.font = '10px system-ui'
        ctx.fillText(`${moles.toFixed(2)} mol`, bx + barW / 2, by - 22)
      })

      // Y axis label
      ctx.save()
      ctx.translate(chartPad - 15, chartY + chartH / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillStyle = 'rgba(255,160,80,0.5)'
      ctx.font = '11px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Mass (g)', 0, 0)
      ctx.restore()

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [rxn, reactantAmounts, showLimiting, limitingIdx, productMoles, productMasses, excessAmounts])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a120a]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 right-4 flex flex-col gap-3 max-w-xs">
          <APTag course="Chemistry" unit="Unit 4" color={CHEM_COLOR} />
          <InfoPanel
            title="Stoichiometry"
            departmentColor={CHEM_COLOR}
            items={[
              { label: 'Limiting Reagent', value: rxn.reactants[limitingIdx]?.name ?? '-', color: 'rgba(255,100,100,0.9)' },
              ...rxn.products.map((p, i) => ({ label: `Yield (${p.name})`, value: `${productMasses[i].toFixed(2)} g` })),
              ...excessAmounts.filter(e => e > 0).map((e, i) => ({ label: `Excess`, value: `${e.toFixed(2)} mol`, color: 'rgba(255,200,80,0.8)' })),
            ]}
          />
          <EquationDisplay
            departmentColor={CHEM_COLOR}
            title="Stoichiometry"
            equations={[
              { label: 'Mole Ratio', expression: 'n(A)/a = n(B)/b', description: 'Coefficients a,b from balanced equation' },
              { label: 'Yield', expression: 'mass = moles x molar mass', description: 'Theoretical yield from limiting reagent' },
              { label: 'Limiting', expression: 'min(n_i / coeff_i)', description: 'Smallest moles/coefficient ratio' },
            ]}
          />
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <DemoMode
            steps={demoSteps}
            currentStep={demo.currentStep}
            isOpen={demo.isOpen}
            onClose={demo.close}
            onNext={demo.next}
            onPrev={demo.prev}
            onGoToStep={demo.goToStep}
            departmentColor={CHEM_COLOR}
            title="AP Chemistry Tutorial"
          />
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-end gap-6">
          <ControlGroup label="Reaction">
            <Select
              value={String(reactionIdx)}
              onChange={v => { setReactionIdx(parseInt(v)); setReactantAmounts([2.0, 5.0]) }}
              options={reactions.map((r, i) => ({ value: String(i), label: r.name }))}
            />
          </ControlGroup>
          {rxn.reactants.map((r, i) => (
            <ControlGroup key={r.name} label={`${r.name} (mol)`}>
              <Slider value={reactantAmounts[i] || 0} onChange={v => setAmount(i, v)} min={0} max={10} step={0.1} label={`${(reactantAmounts[i] || 0).toFixed(1)}`} />
            </ControlGroup>
          ))}
          <ControlGroup label="Limiting Reagent">
            <Toggle value={showLimiting} onChange={setShowLimiting} label="Show" />
          </ControlGroup>
          <Button variant="secondary" onClick={demo.open}>AP Tutorial</Button>
          <Button variant="secondary" onClick={resetAll}>Reset</Button>
        </div>
      </div>
    </div>
  )
}
