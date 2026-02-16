import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type ReactionView = 'both' | 'light' | 'calvin'

const BIO_COLOR = 'rgb(80, 200, 120)'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  type: 'photon' | 'electron' | 'H+' | 'ATP' | 'NADPH' | 'O2' | 'CO2' | 'G3P'
  life: number
}

export default function Photosynthesis() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])

  const [lightIntensity, setLightIntensity] = useState(70)
  const [co2Concentration, setCo2Concentration] = useState(50)
  const [temperature, setTemperature] = useState(25)
  const [reactionView, setReactionView] = useState<ReactionView>('both')

  const atpRate = Math.min(lightIntensity / 100, co2Concentration / 100) * (temperature > 10 && temperature < 40 ? 1 : 0.3)
  const o2Rate = lightIntensity * 0.8 / 100
  const glucoseRate = atpRate * co2Concentration / 100

  const reset = useCallback(() => {
    setLightIntensity(70)
    setCo2Concentration(50)
    setTemperature(25)
    setReactionView('both')
    particlesRef.current = []
    timeRef.current = 0
  }, [])

  const demoSteps: DemoStep[] = [
    {
      title: 'Overview of Photosynthesis',
      description: 'Photosynthesis converts light energy into chemical energy (glucose). It occurs in chloroplasts and has two stages: Light Reactions and the Calvin Cycle.',
      setup: () => { setReactionView('both'); setLightIntensity(70) },
    },
    {
      title: 'Light Reactions (Thylakoid)',
      description: 'Light hits photosystem II, exciting electrons. Water is split (photolysis) releasing O₂. Electrons pass through the ETC, pumping H⁺ to make ATP. NADP⁺ is reduced to NADPH.',
      setup: () => { setReactionView('light'); setLightIntensity(90) },
    },
    {
      title: 'Calvin Cycle (Stroma)',
      description: 'CO₂ is fixed by RuBisCO to RuBP (carbon fixation). ATP and NADPH from light reactions reduce the molecule to G3P. Some G3P exits to make glucose; the rest regenerates RuBP.',
      setup: () => { setReactionView('calvin'); setCo2Concentration(80) },
    },
    {
      title: 'Limiting Factors',
      description: 'Light intensity, CO₂ concentration, and temperature all limit the rate. At high temperatures, RuBisCO binds O₂ instead of CO₂ (photorespiration).',
      setup: () => { setReactionView('both'); setTemperature(35) },
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

    const spawnParticle = (type: Particle['type'], x: number, y: number, vx: number, vy: number) => {
      particlesRef.current.push({ x, y, vx, vy, type, life: 1 })
      if (particlesRef.current.length > 200) particlesRef.current.shift()
    }

    const animate = () => {
      timeRef.current += 0.016
      const t = timeRef.current
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.fillStyle = '#0a1a12'
      ctx.fillRect(0, 0, w, h)

      const showLight = reactionView !== 'calvin'
      const showCalvin = reactionView !== 'light'

      // Chloroplast outline
      ctx.strokeStyle = 'rgba(80, 200, 80, 0.3)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(w / 2, h / 2, w * 0.42, h * 0.38, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(80, 200, 80, 0.03)'
      ctx.fill()

      // Thylakoid region (left)
      if (showLight) {
        const tx = w * 0.25
        const ty = h * 0.5
        const tw = w * 0.22
        const th = h * 0.55

        // Thylakoid membrane stacks (granum)
        ctx.fillStyle = 'rgba(60, 160, 60, 0.15)'
        for (let i = 0; i < 6; i++) {
          const sy = ty - th / 2 + (i / 5) * th
          ctx.fillStyle = `rgba(60, 160, 60, ${0.1 + Math.sin(t + i) * 0.03})`
          ctx.beginPath()
          ctx.ellipse(tx, sy, tw * 0.8, 12, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = 'rgba(80, 200, 80, 0.3)'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // Photosystem II label
        ctx.fillStyle = 'rgba(255, 220, 50, 0.7)'
        ctx.font = 'bold 11px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('PSII', tx - tw * 0.3, ty - th / 2 - 10)

        // Photosystem I label
        ctx.fillText('PSI', tx + tw * 0.3, ty - th / 2 - 10)

        // Light photons coming in
        const photonRate = lightIntensity / 50
        if (Math.random() < photonRate * 0.1) {
          spawnParticle('photon', tx - tw + Math.random() * tw * 0.5, ty - th / 2 - 30, 0, 2)
        }

        // ETC arrow
        ctx.strokeStyle = 'rgba(255, 180, 50, 0.4)'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(tx - tw * 0.3, ty - th * 0.25)
        ctx.lineTo(tx + tw * 0.3, ty - th * 0.25)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255, 180, 50, 0.5)'
        ctx.font = '10px system-ui'
        ctx.fillText('ETC (e⁻ flow)', tx, ty - th * 0.25 - 8)

        // H₂O splitting
        ctx.fillStyle = 'rgba(100, 180, 255, 0.6)'
        ctx.font = '11px system-ui'
        ctx.fillText('H₂O → 2H⁺ + ½O₂ + 2e⁻', tx - tw * 0.15, ty + th * 0.35)

        // ATP synthase
        ctx.fillStyle = 'rgba(255, 100, 150, 0.5)'
        ctx.beginPath()
        ctx.arc(tx + tw * 0.5, ty + th * 0.1, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'white'
        ctx.font = 'bold 8px system-ui'
        ctx.fillText('ATP', tx + tw * 0.5, ty + th * 0.1 + 3)
        ctx.fillText('synthase', tx + tw * 0.5, ty + th * 0.1 + 13)

        // O₂ bubbles
        if (Math.random() < o2Rate * 0.05) {
          spawnParticle('O2', tx + Math.random() * 40 - 20, ty + th * 0.4, (Math.random() - 0.5) * 0.5, -1)
        }

        // ATP/NADPH output
        if (Math.random() < atpRate * 0.04) {
          spawnParticle('ATP', tx + tw * 0.6, ty + Math.random() * 40 - 20, 1.5, 0)
        }
        if (Math.random() < atpRate * 0.03) {
          spawnParticle('NADPH', tx + tw * 0.6, ty + 20 + Math.random() * 30, 1.5, 0)
        }

        // Section label
        ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
        ctx.font = 'bold 14px system-ui'
        ctx.fillText('Light Reactions', tx, ty - th / 2 - 30)
        ctx.font = '11px system-ui'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fillText('(Thylakoid membrane)', tx, ty - th / 2 - 16)
      }

      // Calvin Cycle (right)
      if (showCalvin) {
        const cx2 = w * 0.72
        const cy2 = h * 0.5
        const cr = Math.min(w, h) * 0.2

        // Cycle circle
        ctx.strokeStyle = 'rgba(80, 200, 120, 0.2)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(cx2, cy2, cr, 0, Math.PI * 2)
        ctx.stroke()

        // Cycle stages
        const stages = [
          { angle: -Math.PI / 2, label: 'CO₂ Fixation', sub: 'RuBisCO' },
          { angle: Math.PI / 6, label: 'Reduction', sub: 'ATP + NADPH' },
          { angle: 5 * Math.PI / 6, label: 'Regeneration', sub: 'of RuBP' },
        ]
        stages.forEach((s, i) => {
          const sx = cx2 + Math.cos(s.angle) * cr * 0.75
          const sy = cy2 + Math.sin(s.angle) * cr * 0.75
          // Stage dot
          ctx.fillStyle = `rgba(80, 200, 120, ${0.5 + Math.sin(t * 2 + i * 2) * 0.2})`
          ctx.beginPath()
          ctx.arc(sx, sy, 8, 0, Math.PI * 2)
          ctx.fill()
          // Label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
          ctx.font = 'bold 11px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText(s.label, sx, sy - 16)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
          ctx.font = '10px system-ui'
          ctx.fillText(s.sub, sx, sy + 22)
        })

        // Rotating arrow
        const arrowAngle = t * 0.8
        for (let i = 0; i < 3; i++) {
          const a = arrowAngle + i * (Math.PI * 2 / 3)
          const ax = cx2 + Math.cos(a) * cr
          const ay = cy2 + Math.sin(a) * cr
          ctx.fillStyle = `rgba(80, 200, 120, ${0.4 + Math.sin(t + i) * 0.2})`
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(ax + Math.cos(a + 0.3) * 8, ay + Math.sin(a + 0.3) * 8)
          ctx.lineTo(ax + Math.cos(a - 0.3) * 8, ay + Math.sin(a - 0.3) * 8)
          ctx.fill()
        }

        // CO₂ input
        if (Math.random() < co2Concentration / 500) {
          spawnParticle('CO2', cx2, cy2 - cr - 30, 0, 1.5)
        }

        // G3P output
        if (Math.random() < glucoseRate * 0.02) {
          spawnParticle('G3P', cx2 + cr + 10, cy2, 1.5, 0)
        }

        // Glucose output label
        ctx.fillStyle = 'rgba(255, 200, 50, 0.6)'
        ctx.font = 'bold 12px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText('→ G3P → Glucose', cx2 + cr + 20, cy2 + 5)

        // Section label
        ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Calvin Cycle', cx2, cy2 - cr - 35)
        ctx.font = '11px system-ui'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fillText('(Stroma)', cx2, cy2 - cr - 20)
      }

      // Update and draw particles
      const colors: Record<string, string> = {
        photon: 'rgba(255, 255, 100, 0.8)',
        electron: 'rgba(100, 200, 255, 0.8)',
        'H+': 'rgba(255, 150, 200, 0.7)',
        ATP: 'rgba(255, 100, 150, 0.8)',
        NADPH: 'rgba(150, 100, 255, 0.8)',
        O2: 'rgba(100, 200, 255, 0.7)',
        CO2: 'rgba(200, 200, 200, 0.7)',
        G3P: 'rgba(255, 200, 50, 0.8)',
      }
      const labels: Record<string, string> = {
        photon: 'hv', electron: 'e⁻', 'H+': 'H⁺', ATP: 'ATP', NADPH: 'NADPH', O2: 'O₂', CO2: 'CO₂', G3P: 'G3P',
      }

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.005
        if (p.life <= 0) return false
        ctx.fillStyle = colors[p.type]
        ctx.font = `bold ${p.type === 'photon' ? 8 : 10}px system-ui`
        ctx.textAlign = 'center'
        ctx.fillText(labels[p.type], p.x, p.y)
        return p.x > 0 && p.x < w && p.y > 0 && p.y < h
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [lightIntensity, co2Concentration, temperature, reactionView, atpRate, o2Rate, glucoseRate])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1a12]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
          <APTag course="Biology" unit="Unit 3" color={BIO_COLOR} />
          <InfoPanel
            title="Photosynthesis Data"
            departmentColor={BIO_COLOR}
            items={[
              { label: 'ATP Production', value: `${(atpRate * 100).toFixed(0)}%`, color: 'rgb(255, 100, 150)' },
              { label: 'O₂ Output', value: `${(o2Rate * 100).toFixed(0)}%`, color: 'rgb(100, 200, 255)' },
              { label: 'Glucose Yield', value: `${(glucoseRate * 100).toFixed(0)}%`, color: 'rgb(255, 200, 50)' },
              { label: 'Temperature', value: `${temperature} C` },
              { label: 'Efficiency', value: temperature > 10 && temperature < 40 ? 'Optimal' : 'Reduced' },
            ]}
          />
        </div>

        <div className="absolute top-4 right-4">
          <EquationDisplay
            departmentColor={BIO_COLOR}
            title="Photosynthesis"
            equations={[
              { label: 'Overall', expression: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', description: 'Light energy required' },
              { label: 'Light Rx', expression: '2H₂O → O₂ + 4H⁺ + 4e⁻', description: 'Photolysis in thylakoid' },
              { label: 'Calvin', expression: '3CO₂ + 9ATP + 6NADPH → G3P', description: 'Carbon fixation in stroma' },
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
          <div className="w-36">
            <Slider value={lightIntensity} onChange={setLightIntensity} min={0} max={100} label="Light Intensity" />
          </div>
          <div className="w-36">
            <Slider value={co2Concentration} onChange={setCo2Concentration} min={0} max={100} label="CO₂ Conc." />
          </div>
          <div className="w-36">
            <Slider value={temperature} onChange={setTemperature} min={0} max={50} label="Temp (C)" />
          </div>
          <ButtonGroup
            value={reactionView}
            onChange={(v) => setReactionView(v as ReactionView)}
            options={[
              { value: 'both', label: 'Both' },
              { value: 'light', label: 'Light Rx' },
              { value: 'calvin', label: 'Calvin' },
            ]}
            label="Show Reactions"
            color={BIO_COLOR}
          />
          <div className="flex gap-2">
            <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
            <Button onClick={reset} variant="secondary">Reset</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
