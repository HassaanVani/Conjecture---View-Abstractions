import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type Stage = 'glycolysis' | 'krebs' | 'etc' | 'all'

const BIO_COLOR = 'rgb(80, 200, 120)'

interface FlowParticle {
  x: number
  y: number
  vx: number
  vy: number
  label: string
  color: string
  life: number
}

export default function Respiration() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const particlesRef = useRef<FlowParticle[]>([])

  const [glucoseInput, setGlucoseInput] = useState(1)
  const [isAerobic, setIsAerobic] = useState(true)
  const [stage, setStage] = useState<Stage>('all')
  const [speed, setSpeed] = useState(1)

  const atpGlycolysis = glucoseInput * 2
  const atpKrebs = isAerobic ? glucoseInput * 2 : 0
  const atpETC = isAerobic ? glucoseInput * 34 : 0
  const totalATP = atpGlycolysis + atpKrebs + atpETC
  const nadh = isAerobic ? glucoseInput * 10 : glucoseInput * 2
  const fadh2 = isAerobic ? glucoseInput * 2 : 0

  const reset = useCallback(() => {
    setGlucoseInput(1)
    setIsAerobic(true)
    setStage('all')
    setSpeed(1)
    particlesRef.current = []
    timeRef.current = 0
  }, [])

  const demoSteps: DemoStep[] = [
    {
      title: 'Overview of Cellular Respiration',
      description: 'Cellular respiration breaks down glucose to produce ATP. It has three main stages: Glycolysis, Krebs Cycle, and the Electron Transport Chain. The overall equation reverses photosynthesis.',
      setup: () => { setStage('all'); setIsAerobic(true) },
    },
    {
      title: 'Glycolysis',
      description: 'Occurs in the cytoplasm (no O₂ needed). Glucose (6C) splits into 2 pyruvate (3C). Net gain: 2 ATP and 2 NADH. Invests 2 ATP, produces 4 ATP.',
      setup: () => { setStage('glycolysis'); setIsAerobic(true) },
    },
    {
      title: 'Krebs Cycle',
      description: 'Occurs in the mitochondrial matrix. Acetyl-CoA (2C) joins oxaloacetate (4C) to form citrate (6C). Per glucose: 2 ATP, 8 NADH, 2 FADH₂, 6 CO₂ released.',
      setup: () => { setStage('krebs'); setIsAerobic(true) },
    },
    {
      title: 'Electron Transport Chain',
      description: 'Occurs on inner mitochondrial membrane. NADH and FADH₂ donate electrons. Protons pumped across membrane; ATP synthase produces ~34 ATP. O₂ is the final electron acceptor.',
      setup: () => { setStage('etc'); setIsAerobic(true) },
    },
    {
      title: 'Anaerobic Respiration',
      description: 'Without O₂, only glycolysis runs. Pyruvate is converted to ethanol (yeast) or lactate (animals) to regenerate NAD⁺. Only 2 ATP per glucose -- much less efficient.',
      setup: () => { setStage('all'); setIsAerobic(false) },
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

    const spawn = (label: string, color: string, x: number, y: number, vx: number, vy: number) => {
      particlesRef.current.push({ x, y, vx: vx * speed, vy: vy * speed, label, color, life: 1 })
      if (particlesRef.current.length > 150) particlesRef.current.shift()
    }

    const animate = () => {
      timeRef.current += 0.016 * speed
      const t = timeRef.current
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.fillStyle = '#0a1a12'
      ctx.fillRect(0, 0, w, h)

      const showGlyc = stage === 'all' || stage === 'glycolysis'
      const showKrebs = (stage === 'all' || stage === 'krebs') && isAerobic
      const showETC = (stage === 'all' || stage === 'etc') && isAerobic

      // Section widths
      const sectionW = w / (isAerobic ? 3 : 1)

      // --- GLYCOLYSIS ---
      if (showGlyc) {
        const sx = isAerobic && stage === 'all' ? 0 : w * 0.1
        const sw = isAerobic && stage === 'all' ? sectionW : w * 0.8
        const sy = h * 0.1
        const sh = h * 0.7

        // Box
        ctx.strokeStyle = 'rgba(80, 200, 120, 0.2)'
        ctx.lineWidth = 1
        ctx.strokeRect(sx + 10, sy, sw - 20, sh)

        ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
        ctx.font = 'bold 13px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('GLYCOLYSIS', sx + sw / 2, sy - 8)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.font = '10px system-ui'
        ctx.fillText('(Cytoplasm)', sx + sw / 2, sy + 14)

        // Glucose -> 2 Pyruvate pathway
        const midX = sx + sw / 2
        const steps = ['Glucose (6C)', '2 ATP invested', 'Fructose-1,6-BP', '4 ATP produced', '2 Pyruvate (3C)']
        const stepY = sh / (steps.length + 1)

        steps.forEach((label, i) => {
          const y = sy + 30 + stepY * (i + 0.5)
          const isHighlight = i === 0 || i === steps.length - 1
          ctx.fillStyle = isHighlight ? 'rgba(80, 200, 120, 0.8)' : 'rgba(255, 255, 255, 0.5)'
          ctx.font = `${isHighlight ? 'bold ' : ''}11px system-ui`
          ctx.textAlign = 'center'
          ctx.fillText(label, midX, y)

          if (i < steps.length - 1) {
            ctx.strokeStyle = 'rgba(80, 200, 120, 0.3)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(midX, y + 6)
            ctx.lineTo(midX, y + stepY - 10)
            ctx.stroke()
            // Arrow head
            ctx.beginPath()
            ctx.moveTo(midX - 4, y + stepY - 14)
            ctx.lineTo(midX, y + stepY - 8)
            ctx.lineTo(midX + 4, y + stepY - 14)
            ctx.fill()
          }
        })

        // NADH side products
        ctx.fillStyle = 'rgba(150, 100, 255, 0.5)'
        ctx.font = '10px system-ui'
        ctx.fillText('2 NADH →', midX + sw * 0.25, sy + sh * 0.6)

        // ATP counter
        ctx.fillStyle = 'rgba(255, 100, 150, 0.7)'
        ctx.font = 'bold 14px system-ui'
        ctx.fillText(`Net: ${atpGlycolysis} ATP`, midX, sy + sh - 10)

        // Particles
        if (Math.random() < 0.03 * speed * glucoseInput) {
          spawn('ATP', 'rgba(255, 100, 150, 0.8)', midX + (Math.random() - 0.5) * 40, sy + sh * 0.7, (Math.random() - 0.5) * 0.5, -0.8)
        }
      }

      // --- KREBS CYCLE ---
      if (showKrebs) {
        const sx = stage === 'all' ? sectionW : w * 0.1
        const sw = stage === 'all' ? sectionW : w * 0.8
        const sy = h * 0.1
        const sh = h * 0.7

        ctx.strokeStyle = 'rgba(80, 200, 120, 0.2)'
        ctx.lineWidth = 1
        ctx.strokeRect(sx + 10, sy, sw - 20, sh)

        ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
        ctx.font = 'bold 13px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('KREBS CYCLE', sx + sw / 2, sy - 8)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.font = '10px system-ui'
        ctx.fillText('(Mitochondrial Matrix)', sx + sw / 2, sy + 14)

        // Cycle
        const cxK = sx + sw / 2
        const cyK = sy + sh / 2 + 10
        const cr = Math.min(sw, sh) * 0.25

        ctx.strokeStyle = 'rgba(80, 200, 120, 0.2)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(cxK, cyK, cr, 0, Math.PI * 2)
        ctx.stroke()

        // Cycle labels
        const cycleLabels = [
          { angle: -Math.PI / 2, text: 'Acetyl-CoA (2C)' },
          { angle: 0, text: 'Citrate (6C)' },
          { angle: Math.PI / 2, text: 'a-ketoglutarate' },
          { angle: Math.PI, text: 'Oxaloacetate (4C)' },
        ]
        cycleLabels.forEach(cl => {
          const lx = cxK + Math.cos(cl.angle) * cr * 0.7
          const ly = cyK + Math.sin(cl.angle) * cr * 0.7
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
          ctx.font = '10px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText(cl.text, lx, ly)
        })

        // Rotating arrow
        const rotA = t * 0.6
        ctx.fillStyle = 'rgba(80, 200, 120, 0.5)'
        const ax = cxK + Math.cos(rotA) * cr
        const ay = cyK + Math.sin(rotA) * cr
        ctx.beginPath()
        ctx.arc(ax, ay, 5, 0, Math.PI * 2)
        ctx.fill()

        // CO₂ output
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)'
        ctx.font = '10px system-ui'
        ctx.fillText('CO₂ released', cxK + cr + 20, cyK - 20)
        ctx.fillText('CO₂ released', cxK + cr + 20, cyK + 20)

        // Side products
        ctx.fillStyle = 'rgba(150, 100, 255, 0.5)'
        ctx.fillText('8 NADH, 2 FADH₂', cxK, cyK + cr + 25)

        ctx.fillStyle = 'rgba(255, 100, 150, 0.7)'
        ctx.font = 'bold 14px system-ui'
        ctx.fillText(`${atpKrebs} ATP`, cxK, sy + sh - 10)

        if (Math.random() < 0.02 * speed * glucoseInput) {
          spawn('CO₂', 'rgba(200, 200, 200, 0.7)', cxK + cr + 10, cyK + (Math.random() - 0.5) * 30, 1, -0.5)
        }
        if (Math.random() < 0.02 * speed * glucoseInput) {
          spawn('NADH', 'rgba(150, 100, 255, 0.7)', cxK + (Math.random() - 0.5) * 30, cyK + cr, 0.5, 1)
        }
      }

      // --- ETC ---
      if (showETC) {
        const sx = stage === 'all' ? sectionW * 2 : w * 0.1
        const sw = stage === 'all' ? sectionW : w * 0.8
        const sy = h * 0.1
        const sh = h * 0.7

        ctx.strokeStyle = 'rgba(80, 200, 120, 0.2)'
        ctx.lineWidth = 1
        ctx.strokeRect(sx + 10, sy, sw - 20, sh)

        ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
        ctx.font = 'bold 13px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('ELECTRON TRANSPORT CHAIN', sx + sw / 2, sy - 8)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.font = '10px system-ui'
        ctx.fillText('(Inner Mitochondrial Membrane)', sx + sw / 2, sy + 14)

        const midX = sx + sw / 2
        const memY = sy + sh * 0.45

        // Membrane
        ctx.fillStyle = 'rgba(80, 200, 120, 0.08)'
        ctx.fillRect(sx + 20, memY - 15, sw - 40, 30)
        ctx.strokeStyle = 'rgba(80, 200, 120, 0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(sx + 20, memY - 15)
        ctx.lineTo(sx + sw - 20, memY - 15)
        ctx.moveTo(sx + 20, memY + 15)
        ctx.lineTo(sx + sw - 20, memY + 15)
        ctx.stroke()

        // Complexes I-IV
        const complexes = ['I', 'II', 'III', 'IV']
        complexes.forEach((c, i) => {
          const cx2 = sx + 40 + i * ((sw - 80) / 3)
          ctx.fillStyle = `rgba(80, 200, 120, ${0.3 + Math.sin(t * 2 + i) * 0.1})`
          ctx.fillRect(cx2 - 12, memY - 20, 24, 40)
          ctx.fillStyle = 'white'
          ctx.font = 'bold 10px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText(c, cx2, memY + 3)
        })

        // ATP synthase
        const asX = sx + sw - 60
        ctx.fillStyle = `rgba(255, 100, 150, ${0.4 + Math.sin(t * 3) * 0.2})`
        ctx.beginPath()
        ctx.arc(asX, memY, 16, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'white'
        ctx.font = 'bold 8px system-ui'
        ctx.fillText('ATP', asX, memY - 2)
        ctx.fillText('Synth', asX, memY + 8)

        // Electron flow arrow
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)'
        ctx.lineWidth = 2
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(sx + 40, memY)
        ctx.lineTo(sx + sw - 80, memY)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(100, 200, 255, 0.5)'
        ctx.font = '10px system-ui'
        ctx.fillText('e⁻ flow →', midX, memY - 28)

        // H⁺ gradient
        ctx.fillStyle = 'rgba(255, 150, 200, 0.4)'
        ctx.font = '10px system-ui'
        ctx.fillText('H⁺ H⁺ H⁺ H⁺', midX, memY - 45)
        ctx.fillText('(intermembrane space)', midX, memY - 56)

        // O₂ as final acceptor
        ctx.fillStyle = 'rgba(100, 200, 255, 0.6)'
        ctx.font = '11px system-ui'
        ctx.fillText('½O₂ + 2H⁺ + 2e⁻ → H₂O', midX, memY + 50)

        // NADH/FADH₂ input
        ctx.fillStyle = 'rgba(150, 100, 255, 0.5)'
        ctx.font = '10px system-ui'
        ctx.fillText('NADH → NAD⁺ + H⁺ + e⁻', midX, memY + 70)
        ctx.fillText('FADH₂ → FAD + 2H⁺ + 2e⁻', midX, memY + 84)

        ctx.fillStyle = 'rgba(255, 100, 150, 0.7)'
        ctx.font = 'bold 14px system-ui'
        ctx.fillText(`~${atpETC} ATP`, midX, sy + sh - 10)

        // Particles
        if (Math.random() < 0.04 * speed * glucoseInput) {
          spawn('H⁺', 'rgba(255, 150, 200, 0.7)', sx + 30 + Math.random() * (sw - 60), memY - 40, (Math.random() - 0.5) * 0.3, -0.3)
        }
        if (Math.random() < 0.03 * speed * glucoseInput) {
          spawn('ATP', 'rgba(255, 100, 150, 0.8)', asX, memY + 25, 0, 0.8)
        }
      }

      // Anaerobic pathway
      if (!isAerobic) {
        ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'
        ctx.font = 'bold 13px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('FERMENTATION', w / 2, h * 0.85)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.font = '11px system-ui'
        ctx.fillText('Pyruvate → Lactate (animals) or Ethanol + CO₂ (yeast)', w / 2, h * 0.89)
        ctx.fillText('Regenerates NAD⁺ so glycolysis can continue', w / 2, h * 0.93)
      }

      // Total ATP counter
      ctx.fillStyle = 'rgba(255, 100, 150, 0.9)'
      ctx.font = 'bold 18px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(`Total ATP: ~${totalATP}`, w / 2, h - 20)

      // Draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.008
        if (p.life <= 0) return false
        ctx.fillStyle = p.color
        ctx.font = '9px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(p.label, p.x, p.y)
        return p.x > 0 && p.x < w && p.y > 0 && p.y < h
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [glucoseInput, isAerobic, stage, speed, atpGlycolysis, atpKrebs, atpETC, totalATP])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1a12]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
          <APTag course="Biology" unit="Unit 3" color={BIO_COLOR} />
          <InfoPanel
            title="Respiration Data"
            departmentColor={BIO_COLOR}
            items={[
              { label: 'Glucose In', value: `${glucoseInput} molecule(s)` },
              { label: 'Glycolysis ATP', value: `${atpGlycolysis}`, color: 'rgb(255, 100, 150)' },
              { label: 'Krebs ATP', value: `${atpKrebs}`, color: 'rgb(255, 100, 150)' },
              { label: 'ETC ATP', value: `~${atpETC}`, color: 'rgb(255, 100, 150)' },
              { label: 'Total NADH', value: `${nadh}`, color: 'rgb(150, 100, 255)' },
              { label: 'Total FADH₂', value: `${fadh2}`, color: 'rgb(150, 100, 255)' },
              { label: 'Mode', value: isAerobic ? 'Aerobic' : 'Anaerobic' },
            ]}
          />
        </div>

        <div className="absolute top-4 right-4">
          <EquationDisplay
            departmentColor={BIO_COLOR}
            title="Cellular Respiration"
            equations={[
              { label: 'Overall', expression: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~36 ATP' },
              { label: 'Glycolysis', expression: 'Glucose → 2 Pyruvate + 2 ATP + 2 NADH' },
              { label: 'Fermentation', expression: 'Pyruvate → Lactate (or Ethanol + CO₂)', description: 'Only 2 ATP, regenerates NAD⁺' },
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
            <Slider value={glucoseInput} onChange={setGlucoseInput} min={1} max={5} step={1} label="Glucose" />
          </div>
          <Toggle value={isAerobic} onChange={setIsAerobic} label={isAerobic ? 'Aerobic' : 'Anaerobic'} />
          <ButtonGroup
            value={stage}
            onChange={(v) => setStage(v as Stage)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'glycolysis', label: 'Glycolysis' },
              { value: 'krebs', label: 'Krebs' },
              { value: 'etc', label: 'ETC' },
            ]}
            label="Show Stage"
            color={BIO_COLOR}
          />
          <div className="w-28">
            <Slider value={speed} onChange={setSpeed} min={0.5} max={3} step={0.5} label="Speed" />
          </div>
          <div className="flex gap-2">
            <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
            <Button onClick={reset} variant="secondary">Reset</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
