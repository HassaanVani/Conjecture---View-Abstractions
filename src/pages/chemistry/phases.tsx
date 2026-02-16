import { useState, useRef, useEffect, useCallback } from 'react'
import { ControlGroup, Slider, Select, Toggle, Button } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CHEM_COLOR = 'rgb(255, 160, 80)'
const BG = '#1a120a'

interface SubstanceData {
  name: string
  tripleT: number
  tripleP: number
  criticalT: number
  criticalP: number
  normalBP: number
  normalMP: number
  slopeSign: number // +1 normal, -1 for water
}

const substances: Record<string, SubstanceData> = {
  water: { name: 'Water (H2O)', tripleT: 0.01, tripleP: 0.006, criticalT: 374, criticalP: 218, normalBP: 100, normalMP: 0, slopeSign: -1 },
  co2: { name: 'Carbon Dioxide', tripleT: -56.6, tripleP: 5.11, criticalT: 31.1, criticalP: 72.9, normalBP: -78.5, normalMP: -56.6, slopeSign: 1 },
  generic: { name: 'Generic Substance', tripleT: -50, tripleP: 0.5, criticalT: 200, criticalP: 50, normalBP: 80, normalMP: -20, slopeSign: 1 },
}

function getPhase(T: number, P: number, sub: SubstanceData): string {
  if (T >= sub.criticalT && P >= sub.criticalP) return 'Supercritical Fluid'
  // Simplified phase boundary check
  const tNorm = (T - sub.tripleT) / (sub.criticalT - sub.tripleT)
  const vaporP = sub.tripleP * Math.exp(4.5 * tNorm)
  if (P < vaporP && T < sub.criticalT) return 'Gas'
  if (T < sub.tripleT + (P - sub.tripleP) * sub.slopeSign * 0.5) return 'Solid'
  return 'Liquid'
}

export default function PhaseDiagrams() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const frameRef = useRef(0)

  const [substanceKey, setSubstanceKey] = useState('water')
  const [temperature, setTemperature] = useState(25)
  const [pressure, setPressure] = useState(1)
  const [showPoints, setShowPoints] = useState(true)

  const sub = substances[substanceKey]
  const currentPhase = getPhase(temperature, pressure, sub)

  const resetAll = useCallback(() => {
    setSubstanceKey('water')
    setTemperature(25)
    setPressure(1)
    setShowPoints(true)
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'Phase Diagrams', description: 'A phase diagram shows what phase (solid, liquid, gas) a substance exists in at a given temperature and pressure. The boundaries show conditions where phases coexist.', setup: () => { setSubstanceKey('water'); setTemperature(25); setPressure(1) } },
    { title: 'Triple Point', description: 'The triple point is the unique T and P where all three phases coexist in equilibrium. For water, this is 0.01C and 0.006 atm. It defines the lower end of the liquid region.', setup: () => { setTemperature(0.01); setPressure(0.006); setShowPoints(true) } },
    { title: 'Critical Point', description: 'Above the critical point, the liquid-gas boundary disappears. The substance becomes a supercritical fluid with properties of both liquid and gas. For water: 374C, 218 atm.', setup: () => { setTemperature(374); setPressure(218) } },
    { title: 'Normal Boiling Point', description: 'The normal boiling point occurs at 1 atm pressure. For water, this is 100C. At higher altitudes (lower pressure), water boils at lower temperatures.', setup: () => { setTemperature(100); setPressure(1) } },
    { title: 'Water is Anomalous', description: 'Water\'s solid-liquid boundary slopes LEFT (negative slope). This means ice is LESS dense than liquid water. Increasing pressure on ice can melt it - unique among common substances!', setup: () => { setSubstanceKey('water'); setTemperature(-5); setPressure(100) } },
    { title: 'CO2 Phase Diagram', description: 'CO2 cannot exist as a liquid at 1 atm. Its triple point is at 5.11 atm. At 1 atm, solid CO2 (dry ice) sublimes directly to gas - it never melts into liquid at atmospheric pressure.', setup: () => { setSubstanceKey('co2'); setTemperature(-78); setPressure(1) } },
    { title: 'Phase Transitions', description: 'Moving across phase boundaries: melting (S to L), freezing (L to S), boiling/vaporization (L to G), condensation (G to L), sublimation (S to G), deposition (G to S).', setup: () => { setSubstanceKey('generic'); setTemperature(50); setPressure(5) } },
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

      // Phase diagram area
      const pad = 80
      const gw = w * 0.62 - pad * 2
      const gh = h - pad * 2 - 40

      // Temperature and pressure ranges
      const tMin = sub.tripleT - 80
      const tMax = sub.criticalT + 60
      const pMin = 0
      const pMax = sub.criticalP * 1.3

      const toX = (t: number) => pad + ((t - tMin) / (tMax - tMin)) * gw
      const toY = (p: number) => h - pad - 40 - ((p - pMin) / (pMax - pMin)) * gh

      // Grid
      ctx.strokeStyle = 'rgba(255,160,80,0.05)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 10; i++) {
        const x = pad + (i / 10) * gw
        ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, h - pad - 40); ctx.stroke()
        const y = pad + (i / 10) * gh
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + gw, y); ctx.stroke()
      }

      // Axes
      ctx.strokeStyle = 'rgba(255,160,80,0.4)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(pad, pad)
      ctx.lineTo(pad, h - pad - 40)
      ctx.lineTo(pad + gw, h - pad - 40)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,160,80,0.7)'
      ctx.font = '13px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Temperature (\u00B0C)', pad + gw / 2, h - 15)
      ctx.save()
      ctx.translate(18, pad + gh / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('Pressure (atm)', 0, 0)
      ctx.restore()

      // Axis ticks
      ctx.fillStyle = 'rgba(255,160,80,0.4)'
      ctx.font = '10px system-ui'
      for (let i = 0; i <= 5; i++) {
        const t = tMin + (i / 5) * (tMax - tMin)
        ctx.textAlign = 'center'
        ctx.fillText(`${t.toFixed(0)}`, toX(t), h - pad - 25)
      }
      for (let i = 0; i <= 5; i++) {
        const p = pMin + (i / 5) * (pMax - pMin)
        ctx.textAlign = 'right'
        ctx.fillText(`${p.toFixed(1)}`, pad - 8, toY(p) + 4)
      }

      // Phase regions - fill with colors
      // Solid region
      ctx.fillStyle = 'rgba(100,150,255,0.08)'
      ctx.beginPath()
      ctx.moveTo(toX(tMin), toY(pMax))
      ctx.lineTo(toX(sub.tripleT), toY(pMax))
      ctx.lineTo(toX(sub.tripleT), toY(sub.tripleP))
      ctx.lineTo(toX(tMin), toY(sub.tripleP * 0.3))
      ctx.closePath()
      ctx.fill()

      // Liquid region
      ctx.fillStyle = 'rgba(80,200,255,0.08)'
      ctx.beginPath()
      ctx.moveTo(toX(sub.tripleT), toY(sub.tripleP))
      ctx.lineTo(toX(sub.tripleT), toY(pMax))
      ctx.lineTo(toX(sub.criticalT), toY(pMax))
      ctx.lineTo(toX(sub.criticalT), toY(sub.criticalP))
      // Vapor pressure curve
      for (let t = sub.criticalT; t >= sub.tripleT; t -= 2) {
        const tNorm = (t - sub.tripleT) / (sub.criticalT - sub.tripleT)
        const vp = sub.tripleP + (sub.criticalP - sub.tripleP) * Math.pow(tNorm, 0.7)
        ctx.lineTo(toX(t), toY(vp))
      }
      ctx.closePath()
      ctx.fill()

      // Gas region
      ctx.fillStyle = 'rgba(255,160,80,0.05)'
      ctx.beginPath()
      ctx.moveTo(toX(tMin), toY(pMin))
      ctx.lineTo(toX(tMax), toY(pMin))
      ctx.lineTo(toX(tMax), toY(pMax))
      ctx.lineTo(toX(sub.criticalT), toY(sub.criticalP))
      for (let t = sub.criticalT; t >= sub.tripleT; t -= 2) {
        const tNorm = (t - sub.tripleT) / (sub.criticalT - sub.tripleT)
        const vp = sub.tripleP + (sub.criticalP - sub.tripleP) * Math.pow(tNorm, 0.7)
        ctx.lineTo(toX(t), toY(vp))
      }
      ctx.lineTo(toX(tMin), toY(sub.tripleP * 0.3))
      ctx.closePath()
      ctx.fill()

      // Phase labels
      ctx.font = 'bold 16px system-ui'
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(100,150,255,0.5)'
      ctx.fillText('SOLID', toX(tMin + (sub.tripleT - tMin) * 0.4), toY(pMax * 0.6))
      ctx.fillStyle = 'rgba(80,200,255,0.5)'
      ctx.fillText('LIQUID', toX((sub.tripleT + sub.criticalT) / 2), toY(pMax * 0.7))
      ctx.fillStyle = 'rgba(255,160,80,0.4)'
      ctx.fillText('GAS', toX((sub.tripleT + tMax) / 2), toY(pMax * 0.15))

      // Solid-liquid boundary
      ctx.strokeStyle = 'rgba(150,200,255,0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(toX(sub.tripleT), toY(sub.tripleP))
      const slEndT = sub.tripleT + sub.slopeSign * (-20)
      ctx.lineTo(toX(slEndT), toY(pMax))
      ctx.stroke()

      // Liquid-gas boundary (vapor pressure curve)
      ctx.strokeStyle = 'rgba(255,160,80,0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(toX(sub.tripleT), toY(sub.tripleP))
      for (let t = sub.tripleT; t <= sub.criticalT; t += 1) {
        const tNorm = (t - sub.tripleT) / (sub.criticalT - sub.tripleT)
        const vp = sub.tripleP + (sub.criticalP - sub.tripleP) * Math.pow(tNorm, 0.7)
        ctx.lineTo(toX(t), toY(vp))
      }
      ctx.stroke()

      // Solid-gas boundary (sublimation curve)
      ctx.strokeStyle = 'rgba(200,150,255,0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(toX(sub.tripleT), toY(sub.tripleP))
      ctx.lineTo(toX(tMin), toY(sub.tripleP * 0.3))
      ctx.stroke()

      // Triple point
      if (showPoints) {
        const tpx = toX(sub.tripleT)
        const tpy = toY(sub.tripleP)
        const glow = ctx.createRadialGradient(tpx, tpy, 0, tpx, tpy, 20)
        glow.addColorStop(0, 'rgba(255,255,100,0.5)')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(tpx, tpy, 20, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,100,0.9)'
        ctx.beginPath()
        ctx.arc(tpx, tpy, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,100,0.8)'
        ctx.font = '11px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText('Triple Point', tpx + 10, tpy - 8)
        ctx.font = '9px system-ui'
        ctx.fillText(`${sub.tripleT}\u00B0C, ${sub.tripleP} atm`, tpx + 10, tpy + 6)

        // Critical point
        const cpx = toX(sub.criticalT)
        const cpy = toY(sub.criticalP)
        const cglow = ctx.createRadialGradient(cpx, cpy, 0, cpx, cpy, 20)
        cglow.addColorStop(0, 'rgba(255,100,100,0.5)')
        cglow.addColorStop(1, 'transparent')
        ctx.fillStyle = cglow
        ctx.beginPath()
        ctx.arc(cpx, cpy, 20, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,100,100,0.9)'
        ctx.beginPath()
        ctx.arc(cpx, cpy, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,100,100,0.8)'
        ctx.font = '11px system-ui'
        ctx.fillText('Critical Point', cpx + 10, cpy - 8)
        ctx.font = '9px system-ui'
        ctx.fillText(`${sub.criticalT}\u00B0C, ${sub.criticalP} atm`, cpx + 10, cpy + 6)
      }

      // Current state dot
      const stateX = toX(temperature)
      const stateY = toY(pressure)
      if (stateX >= pad && stateX <= pad + gw && stateY >= pad && stateY <= h - pad - 40) {
        const pulse = Math.sin(f * 0.05) * 0.3 + 0.7
        const sGlow = ctx.createRadialGradient(stateX, stateY, 0, stateX, stateY, 25)
        sGlow.addColorStop(0, `rgba(255,255,255,${0.5 * pulse})`)
        sGlow.addColorStop(1, 'transparent')
        ctx.fillStyle = sGlow
        ctx.beginPath()
        ctx.arc(stateX, stateY, 25, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.beginPath()
        ctx.arc(stateX, stateY, 7, 0, Math.PI * 2)
        ctx.fill()

        // Dashed lines to axes
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(stateX, stateY)
        ctx.lineTo(stateX, h - pad - 40)
        ctx.moveTo(stateX, stateY)
        ctx.lineTo(pad, stateY)
        ctx.stroke()
        ctx.setLineDash([])
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [sub, temperature, pressure, showPoints])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a120a]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
          <APTag course="Chemistry" unit="Unit 3" color={CHEM_COLOR} />
          <InfoPanel
            title="Phase State"
            departmentColor={CHEM_COLOR}
            items={[
              { label: 'Substance', value: sub.name },
              { label: 'Phase', value: currentPhase, color: CHEM_COLOR },
              { label: 'Temperature', value: `${temperature.toFixed(1)}\u00B0C` },
              { label: 'Pressure', value: `${pressure.toFixed(2)} atm` },
            ]}
          />
          <EquationDisplay
            departmentColor={CHEM_COLOR}
            title="Phase Equations"
            equations={[
              { label: 'Clausius-Clapeyron', expression: 'ln(P2/P1) = -DH/R (1/T2 - 1/T1)', description: 'Relates vapor pressure to temperature' },
              { label: 'Phase Rule', expression: 'F = C - P + 2', description: 'F=degrees of freedom, C=components, P=phases' },
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
          <ControlGroup label="Substance">
            <Select
              value={substanceKey}
              onChange={setSubstanceKey}
              options={[
                { value: 'water', label: 'Water (H2O)' },
                { value: 'co2', label: 'Carbon Dioxide' },
                { value: 'generic', label: 'Generic' },
              ]}
            />
          </ControlGroup>
          <ControlGroup label="Temperature (\u00B0C)">
            <Slider value={temperature} onChange={setTemperature} min={sub.tripleT - 80} max={sub.criticalT + 60} step={0.5} label={`${temperature.toFixed(1)}\u00B0C`} />
          </ControlGroup>
          <ControlGroup label="Pressure (atm)">
            <Slider value={pressure} onChange={setPressure} min={0} max={sub.criticalP * 1.3} step={0.1} label={`${pressure.toFixed(1)} atm`} />
          </ControlGroup>
          <ControlGroup label="Key Points">
            <Toggle value={showPoints} onChange={setShowPoints} label="Show" />
          </ControlGroup>
          <Button variant="secondary" onClick={demo.open}>AP Tutorial</Button>
          <Button variant="secondary" onClick={resetAll}>Reset</Button>
        </div>
      </div>
    </div>
  )
}
