import { useState, useRef, useEffect, useCallback } from 'react'
import { ControlGroup, Select, Toggle, Button } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CHEM_COLOR = 'rgb(255, 160, 80)'
const BG = '#1a120a'

interface ReactionData {
  name: string
  equation: string
  deltaH: number // kJ/mol
  eA: number
  reactantLabel: string
  productLabel: string
  hessSteps: { equation: string; dH: number }[]
  bondEnergies: { broken: { bond: string; energy: number }[]; formed: { bond: string; energy: number }[] }
}

const reactionData: ReactionData[] = [
  {
    name: 'Combustion of Methane (exo)',
    equation: 'CH4 + 2O2 -> CO2 + 2H2O',
    deltaH: -890,
    eA: 150,
    reactantLabel: 'CH4 + 2O2',
    productLabel: 'CO2 + 2H2O',
    hessSteps: [
      { equation: 'C + O2 -> CO2', dH: -394 },
      { equation: 'H2 + 1/2 O2 -> H2O', dH: -286 },
      { equation: 'C + 2H2 -> CH4', dH: 75 },
    ],
    bondEnergies: {
      broken: [{ bond: 'C-H x4', energy: 1652 }, { bond: 'O=O x2', energy: 998 }],
      formed: [{ bond: 'C=O x2', energy: 1598 }, { bond: 'O-H x4', energy: 1852 }],
    },
  },
  {
    name: 'Dissolving NH4NO3 (endo)',
    equation: 'NH4NO3(s) -> NH4+(aq) + NO3-(aq)',
    deltaH: 25.7,
    eA: 40,
    reactantLabel: 'NH4NO3(s)',
    productLabel: 'NH4+(aq) + NO3-(aq)',
    hessSteps: [
      { equation: 'NH4NO3 -> NH4+ + NO3- (lattice)', dH: 660 },
      { equation: 'NH4+ hydration', dH: -330 },
      { equation: 'NO3- hydration', dH: -304 },
    ],
    bondEnergies: {
      broken: [{ bond: 'Lattice energy', energy: 660 }],
      formed: [{ bond: 'Ion-dipole (NH4+)', energy: 330 }, { bond: 'Ion-dipole (NO3-)', energy: 304 }],
    },
  },
  {
    name: 'Formation of HCl (exo)',
    equation: 'H2 + Cl2 -> 2HCl',
    deltaH: -185,
    eA: 80,
    reactantLabel: 'H2 + Cl2',
    productLabel: '2HCl',
    hessSteps: [
      { equation: 'H2 -> 2H', dH: 436 },
      { equation: 'Cl2 -> 2Cl', dH: 242 },
      { equation: '2H + 2Cl -> 2HCl', dH: -863 },
    ],
    bondEnergies: {
      broken: [{ bond: 'H-H', energy: 436 }, { bond: 'Cl-Cl', energy: 242 }],
      formed: [{ bond: 'H-Cl x2', energy: 863 }],
    },
  },
  {
    name: 'Photosynthesis (endo)',
    equation: '6CO2 + 6H2O -> C6H12O6 + 6O2',
    deltaH: 2803,
    eA: 200,
    reactantLabel: '6CO2 + 6H2O',
    productLabel: 'C6H12O6 + 6O2',
    hessSteps: [
      { equation: '6CO2 -> 6C + 6O2', dH: 2364 },
      { equation: '6H2O -> 6H2 + 3O2', dH: 1716 },
      { equation: '6C + 6H2 + 3O2 -> C6H12O6', dH: -1277 },
    ],
    bondEnergies: {
      broken: [{ bond: 'C=O x12', energy: 9588 }, { bond: 'O-H x12', energy: 5556 }],
      formed: [{ bond: 'C-H,C-O,C-C,O=O', energy: 12341 }],
    },
  },
]

export default function Enthalpy() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const frameRef = useRef(0)

  const [reactionIdx, setReactionIdx] = useState(0)
  const [showHess, setShowHess] = useState(false)
  const [showBondE, setShowBondE] = useState(false)

  const rxn = reactionData[reactionIdx]
  const isExo = rxn.deltaH < 0

  const resetAll = useCallback(() => {
    setReactionIdx(0)
    setShowHess(false)
    setShowBondE(false)
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'Enthalpy (DH)', description: 'Enthalpy is the heat content of a system at constant pressure. DH < 0 means exothermic (releases heat), DH > 0 means endothermic (absorbs heat).', setup: () => { setReactionIdx(0); setShowHess(false); setShowBondE(false) } },
    { title: 'Exothermic Reactions', description: 'In exothermic reactions, products have LOWER energy than reactants. Energy is released to surroundings. The enthalpy diagram shows products below reactants.', setup: () => { setReactionIdx(0) } },
    { title: 'Endothermic Reactions', description: 'In endothermic reactions, products have HIGHER energy than reactants. Energy is absorbed from surroundings. Dissolving NH4NO3 makes a cold pack!', setup: () => { setReactionIdx(1) } },
    { title: 'Activation Energy', description: 'Even exothermic reactions need an initial energy input (Ea) to start. The "hump" represents the transition state. Catalysts lower Ea but do NOT change DH.', setup: () => { setReactionIdx(0) } },
    { title: "Hess's Law", description: "DH for a reaction equals the sum of DH values for any series of steps that lead from reactants to products. Enthalpy is a STATE FUNCTION - path doesn't matter!", setup: () => { setReactionIdx(0); setShowHess(true) } },
    { title: 'Bond Energies', description: 'DH can be estimated from bond energies: DH = S(bonds broken) - S(bonds formed). Breaking bonds requires energy (positive), forming bonds releases energy (negative).', setup: () => { setShowBondE(true); setShowHess(false) } },
    { title: 'q = mcDT', description: 'Heat transferred: q = mass x specific heat x temperature change. For water, c = 4.184 J/(g*C). Calorimetry uses this to measure DH experimentally.', setup: () => { setReactionIdx(2); setShowBondE(false) } },
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

      // Enthalpy diagram
      const diaX = 80
      const diaY = 40
      const diaW = showHess || showBondE ? w * 0.5 : w * 0.75
      const diaH = h - 80

      // Y axis (enthalpy)
      ctx.strokeStyle = 'rgba(255,160,80,0.4)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(diaX, diaY)
      ctx.lineTo(diaX, diaY + diaH)
      ctx.stroke()

      ctx.save()
      ctx.translate(diaX - 35, diaY + diaH / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillStyle = 'rgba(255,160,80,0.6)'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Enthalpy (H)', 0, 0)
      ctx.restore()

      // Arrow on Y axis
      ctx.fillStyle = 'rgba(255,160,80,0.4)'
      ctx.beginPath()
      ctx.moveTo(diaX - 5, diaY + 5)
      ctx.lineTo(diaX, diaY)
      ctx.lineTo(diaX + 5, diaY + 5)
      ctx.fill()

      // Energy levels
      const midY = diaY + diaH * 0.45
      const absH = Math.abs(rxn.deltaH)
      const scaleFactor = Math.min(diaH * 0.3, absH * 0.15)
      const reactantY = isExo ? midY - scaleFactor * 0.3 : midY + scaleFactor * 0.3
      const productY = isExo ? midY + scaleFactor * 0.3 : midY - scaleFactor * 0.3
      const peakY = Math.min(reactantY, productY) - (rxn.eA / 200) * diaH * 0.25

      // Reactant level
      ctx.strokeStyle = 'rgba(100,200,100,0.8)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(diaX + 30, reactantY)
      ctx.lineTo(diaX + diaW * 0.3, reactantY)
      ctx.stroke()

      ctx.fillStyle = 'rgba(100,200,100,0.9)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(rxn.reactantLabel, diaX + diaW * 0.17, reactantY - 12)

      // Product level
      ctx.strokeStyle = 'rgba(100,150,255,0.8)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(diaX + diaW * 0.7, productY)
      ctx.lineTo(diaX + diaW - 30, productY)
      ctx.stroke()

      ctx.fillStyle = 'rgba(100,150,255,0.9)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(rxn.productLabel, diaX + diaW * 0.83, productY - 12)

      // Energy curve with activation energy hump
      ctx.strokeStyle = 'rgba(255,160,80,0.7)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(diaX + diaW * 0.3, reactantY)
      ctx.bezierCurveTo(
        diaX + diaW * 0.4, reactantY,
        diaX + diaW * 0.42, peakY,
        diaX + diaW * 0.5, peakY
      )
      ctx.bezierCurveTo(
        diaX + diaW * 0.58, peakY,
        diaX + diaW * 0.6, productY,
        diaX + diaW * 0.7, productY
      )
      ctx.stroke()

      // DH arrow
      const arrowX = diaX + diaW * 0.85
      ctx.strokeStyle = isExo ? 'rgba(255,100,100,0.8)' : 'rgba(100,150,255,0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(arrowX, reactantY)
      ctx.lineTo(arrowX, productY)
      ctx.stroke()
      // Arrowhead
      const arrowDir = productY > reactantY ? 1 : -1
      ctx.beginPath()
      ctx.moveTo(arrowX - 5, productY - arrowDir * 8)
      ctx.lineTo(arrowX, productY)
      ctx.lineTo(arrowX + 5, productY - arrowDir * 8)
      ctx.stroke()

      ctx.fillStyle = isExo ? 'rgba(255,100,100,0.9)' : 'rgba(100,150,255,0.9)'
      ctx.font = 'bold 13px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(`DH = ${rxn.deltaH} kJ/mol`, arrowX + 8, (reactantY + productY) / 2 + 5)

      // Ea arrow
      const eaArrowX = diaX + diaW * 0.38
      ctx.strokeStyle = 'rgba(255,200,100,0.6)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(eaArrowX, reactantY)
      ctx.lineTo(eaArrowX, peakY)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(255,200,100,0.8)'
      ctx.font = '11px system-ui'
      ctx.textAlign = 'right'
      ctx.fillText(`Ea = ${rxn.eA} kJ`, eaArrowX - 5, (reactantY + peakY) / 2)

      // Transition state label
      ctx.fillStyle = 'rgba(255,160,80,0.6)'
      ctx.font = '10px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Transition State', diaX + diaW * 0.5, peakY - 10)

      // Equation title
      ctx.fillStyle = 'rgba(255,160,80,0.9)'
      ctx.font = 'bold 14px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(rxn.equation, diaX + diaW / 2, diaY + diaH + 25)

      // Hess's Law panel (right side)
      if (showHess) {
        const hx = w * 0.58
        let hy = 50

        ctx.fillStyle = 'rgba(255,160,80,0.8)'
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText("Hess's Law Path", hx, hy)
        hy += 25

        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.font = '11px system-ui'
        ctx.fillText('DH_rxn = Sum of DH steps', hx, hy)
        hy += 30

        let runningH = 0
        const stepBarW = w * 0.35
        const stepBarMaxH = h * 0.12

        rxn.hessSteps.forEach((step, si) => {
          const barH = (Math.abs(step.dH) / Math.max(...rxn.hessSteps.map(s => Math.abs(s.dH)))) * stepBarMaxH
          const barColor = step.dH < 0 ? 'rgba(100,200,100,' : 'rgba(255,100,100,'

          ctx.fillStyle = barColor + '0.3)'
          ctx.fillRect(hx, hy, stepBarW * (Math.abs(step.dH) / 1000), barH)
          ctx.strokeStyle = barColor + '0.6)'
          ctx.lineWidth = 1
          ctx.strokeRect(hx, hy, stepBarW * (Math.abs(step.dH) / 1000), barH)

          ctx.fillStyle = 'rgba(255,255,255,0.7)'
          ctx.font = '10px system-ui'
          ctx.textAlign = 'left'
          ctx.fillText(`Step ${si + 1}: ${step.equation}`, hx + 5, hy + barH / 2 + 4)
          ctx.fillStyle = barColor + '0.9)'
          ctx.textAlign = 'right'
          ctx.fillText(`DH = ${step.dH} kJ`, hx + stepBarW, hy + barH / 2 + 4)

          runningH += step.dH
          hy += barH + 12
        })

        hy += 10
        ctx.fillStyle = 'rgba(255,160,80,0.9)'
        ctx.font = 'bold 12px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText(`Total DH = ${rxn.deltaH} kJ/mol`, hx, hy)
      }

      // Bond energy panel
      if (showBondE) {
        const bx = w * 0.58
        let by = showHess ? h * 0.55 : 50

        ctx.fillStyle = 'rgba(255,160,80,0.8)'
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText('Bond Energies', bx, by)
        by += 25

        ctx.fillStyle = 'rgba(255,100,100,0.7)'
        ctx.font = 'bold 11px system-ui'
        ctx.fillText('Bonds Broken (energy IN):', bx, by)
        by += 18

        let totalBroken = 0
        rxn.bondEnergies.broken.forEach(b => {
          ctx.fillStyle = 'rgba(255,255,255,0.5)'
          ctx.font = '10px system-ui'
          ctx.fillText(`  ${b.bond}: +${b.energy} kJ`, bx, by)
          totalBroken += b.energy
          by += 16
        })
        ctx.fillStyle = 'rgba(255,100,100,0.8)'
        ctx.font = 'bold 10px system-ui'
        ctx.fillText(`  Total: +${totalBroken} kJ`, bx, by)
        by += 25

        ctx.fillStyle = 'rgba(100,200,100,0.7)'
        ctx.font = 'bold 11px system-ui'
        ctx.fillText('Bonds Formed (energy OUT):', bx, by)
        by += 18

        let totalFormed = 0
        rxn.bondEnergies.formed.forEach(b => {
          ctx.fillStyle = 'rgba(255,255,255,0.5)'
          ctx.font = '10px system-ui'
          ctx.fillText(`  ${b.bond}: -${b.energy} kJ`, bx, by)
          totalFormed += b.energy
          by += 16
        })
        ctx.fillStyle = 'rgba(100,200,100,0.8)'
        ctx.font = 'bold 10px system-ui'
        ctx.fillText(`  Total: -${totalFormed} kJ`, bx, by)
        by += 25

        ctx.fillStyle = 'rgba(255,160,80,0.9)'
        ctx.font = 'bold 12px system-ui'
        ctx.fillText(`DH = ${totalBroken} - ${totalFormed} = ${totalBroken - totalFormed} kJ`, bx, by)
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [rxn, showHess, showBondE])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a120a]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-[200px]">
          <APTag course="Chemistry" unit="Unit 6" color={CHEM_COLOR} />
          <InfoPanel
            title="Thermochemistry"
            departmentColor={CHEM_COLOR}
            items={[
              { label: 'Reaction', value: rxn.name },
              { label: 'DH', value: `${rxn.deltaH} kJ/mol`, color: isExo ? 'rgba(255,100,100,0.9)' : 'rgba(100,150,255,0.9)' },
              { label: 'Type', value: isExo ? 'Exothermic' : 'Endothermic', color: CHEM_COLOR },
              { label: 'Ea', value: `${rxn.eA} kJ/mol` },
            ]}
          />
          <EquationDisplay
            departmentColor={CHEM_COLOR}
            title="Thermochemistry"
            equations={[
              { label: 'Enthalpy', expression: 'DH = S(products) - S(reactants)' },
              { label: 'Calorimetry', expression: 'q = mcDT', description: 'q=heat, m=mass, c=specific heat' },
              { label: "Hess's Law", expression: 'DH_rxn = S(DH_steps)' },
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
              onChange={v => setReactionIdx(parseInt(v))}
              options={reactionData.map((r, i) => ({ value: String(i), label: r.name }))}
            />
          </ControlGroup>
          <ControlGroup label="Hess's Law Path">
            <Toggle value={showHess} onChange={setShowHess} label="Show" />
          </ControlGroup>
          <ControlGroup label="Bond Energies">
            <Toggle value={showBondE} onChange={setShowBondE} label="Show" />
          </ControlGroup>
          <Button variant="secondary" onClick={demo.open}>AP Tutorial</Button>
          <Button variant="secondary" onClick={resetAll}>Reset</Button>
        </div>
      </div>
    </div>
  )
}
