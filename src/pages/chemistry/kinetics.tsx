import { useState, useRef, useEffect, useCallback } from 'react'
import { ControlGroup, Slider, ButtonGroup, Button } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CHEM_COLOR = 'rgb(255, 160, 80)'
const BG = '#1a120a'

type ReactionOrder = '0' | '1' | '2'

function concentrationAtTime(c0: number, k: number, t: number, order: ReactionOrder): number {
  if (order === '0') return Math.max(0, c0 - k * t)
  if (order === '1') return c0 * Math.exp(-k * t)
  // 2nd order
  if (c0 <= 0) return 0
  const denom = 1 + k * c0 * t
  return denom > 0 ? c0 / denom : 0
}

function halfLife(c0: number, k: number, order: ReactionOrder): number {
  if (k <= 0) return Infinity
  if (order === '0') return c0 / (2 * k)
  if (order === '1') return Math.log(2) / k
  return 1 / (k * c0)
}

export default function Kinetics() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const frameRef = useRef(0)

  const [concA, setConcA] = useState(1.0)
  const [concB, setConcB] = useState(0.5)
  const [tempK, setTempK] = useState(300)
  const [eA, setEA] = useState(50)
  const [order, setOrder] = useState<ReactionOrder>('1')

  const R = 8.314
  const A_factor = 1e10
  const k = A_factor * Math.exp(-eA * 1000 / (R * tempK))
  const kDisplay = k > 1000 ? k.toExponential(2) : k.toFixed(4)
  const hl = halfLife(concA, k, order)
  const rate = order === '0' ? k : order === '1' ? k * concA : k * concA * concA

  const resetAll = useCallback(() => {
    setConcA(1.0)
    setConcB(0.5)
    setTempK(300)
    setEA(50)
    setOrder('1')
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'Reaction Kinetics', description: 'Kinetics studies HOW FAST reactions occur. The rate depends on concentration, temperature, and activation energy. Rate laws are determined experimentally, not from stoichiometry.', setup: () => { setConcA(1.0); setTempK(300); setOrder('1'); setEA(50) } },
    { title: 'Rate Law', description: 'rate = k[A]^m[B]^n where m and n are the reaction orders (determined experimentally). k is the rate constant. The overall order = m + n.', setup: () => { setConcA(1.0); setConcB(0.5); setOrder('1') } },
    { title: 'Zero Order', description: 'For zero order: rate = k (constant). [A] decreases linearly with time. Half-life = [A]0/2k. The rate is independent of concentration - like enzyme-saturated reactions.', setup: () => { setOrder('0'); setConcA(1.0); setEA(40) } },
    { title: 'First Order', description: 'For first order: rate = k[A]. [A] decays exponentially. Half-life = ln(2)/k is CONSTANT (independent of [A]0). Radioactive decay follows first-order kinetics.', setup: () => { setOrder('1'); setConcA(1.0) } },
    { title: 'Second Order', description: 'For second order: rate = k[A]^2. [A] decreases more slowly at low concentrations. Half-life = 1/(k[A]0) depends on initial concentration.', setup: () => { setOrder('2'); setConcA(1.0) } },
    { title: 'Arrhenius Equation', description: 'k = Ae^(-Ea/RT). As temperature increases, more molecules have enough energy to overcome the activation energy barrier. A 10C rise roughly doubles the rate.', setup: () => { setOrder('1'); setTempK(300); setEA(50) } },
    { title: 'Activation Energy', description: 'Ea is the minimum energy needed for reaction. Higher Ea means slower reaction. Catalysts lower Ea without being consumed, dramatically increasing rate.', setup: () => { setEA(80); setTempK(300) } },
    { title: 'Temperature Effect', description: 'Increasing T increases the fraction of molecules with E >= Ea (Maxwell-Boltzmann distribution). This is why reactions speed up dramatically with temperature.', setup: () => { setEA(50); setTempK(400) } },
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
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)

      // Grid
      ctx.strokeStyle = 'rgba(255,160,80,0.04)'
      ctx.lineWidth = 1
      for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke() }
      for (let i = 0; i < h; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke() }

      // --- Concentration vs Time Plot (left) ---
      const p1 = { x: 60, y: 30, w: w * 0.42, h: h * 0.45 }

      ctx.fillStyle = 'rgba(255,160,80,0.7)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('[A] vs Time', p1.x, p1.y)

      // Axes
      ctx.strokeStyle = 'rgba(255,160,80,0.4)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y + 15)
      ctx.lineTo(p1.x, p1.y + p1.h)
      ctx.lineTo(p1.x + p1.w, p1.y + p1.h)
      ctx.stroke()

      const tMax = order === '0' ? Math.max(concA / Math.max(k, 1e-10) * 2, 10) : order === '1' ? Math.max(5 / Math.max(k, 1e-10), 10) : Math.max(10 / Math.max(k * concA, 1e-10), 10)
      const tMaxClamped = Math.min(tMax, 1e6)
      const cMax = concA * 1.2

      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '9px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Time', p1.x + p1.w / 2, p1.y + p1.h + 15)
      ctx.save()
      ctx.translate(p1.x - 15, p1.y + p1.h / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('[A]', 0, 0)
      ctx.restore()

      // Concentration curves for all orders
      const orders: ReactionOrder[] = ['0', '1', '2']
      const colors = ['rgba(100,200,255,', 'rgba(255,160,80,', 'rgba(200,100,255,']
      const labels = ['0th order', '1st order', '2nd order']

      orders.forEach((o, oi) => {
        const isActive = o === order
        const alpha = isActive ? '0.9)' : '0.2)'
        ctx.strokeStyle = colors[oi] + alpha
        ctx.lineWidth = isActive ? 2.5 : 1
        ctx.beginPath()
        let started = false
        for (let px = 0; px <= p1.w; px += 2) {
          const t = (px / p1.w) * tMaxClamped
          const c = concentrationAtTime(concA, k, t, o)
          const cy = p1.y + p1.h - (c / cMax) * (p1.h - 20)
          if (!started) { ctx.moveTo(p1.x + px, cy); started = true }
          else ctx.lineTo(p1.x + px, cy)
        }
        ctx.stroke()

        // Legend
        ctx.fillStyle = colors[oi] + (isActive ? '0.9)' : '0.4)')
        ctx.font = `${isActive ? 'bold ' : ''}10px system-ui`
        ctx.textAlign = 'left'
        ctx.fillText(labels[oi], p1.x + p1.w + 10, p1.y + 30 + oi * 16)
      })

      // Half-life marker
      if (hl < tMaxClamped && hl > 0 && isFinite(hl)) {
        const hlX = p1.x + (hl / tMaxClamped) * p1.w
        const hlY = p1.y + p1.h - (concA / 2 / cMax) * (p1.h - 20)
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(hlX, p1.y + p1.h)
        ctx.lineTo(hlX, hlY)
        ctx.lineTo(p1.x, hlY)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.font = '9px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(`t1/2`, hlX, p1.y + p1.h + 12)
      }

      // --- Arrhenius Plot (right: ln k vs 1/T) ---
      const p2 = { x: w * 0.55, y: 30, w: w * 0.38, h: h * 0.45 }

      ctx.fillStyle = 'rgba(255,160,80,0.7)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Arrhenius: ln(k) vs 1/T', p2.x, p2.y)

      ctx.strokeStyle = 'rgba(255,160,80,0.4)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(p2.x, p2.y + 15)
      ctx.lineTo(p2.x, p2.y + p2.h)
      ctx.lineTo(p2.x + p2.w, p2.y + p2.h)
      ctx.stroke()

      const invTMin = 1 / 600
      const invTMax = 1 / 200
      const lnkVals: number[] = []
      for (let px = 0; px <= p2.w; px += 5) {
        const invT = invTMin + (px / p2.w) * (invTMax - invTMin)
        const lnk = Math.log(A_factor) - (eA * 1000 / R) * invT
        lnkVals.push(lnk)
      }
      const lnkMin = Math.min(...lnkVals) - 2
      const lnkMax = Math.max(...lnkVals) + 2

      ctx.strokeStyle = 'rgba(255,160,80,0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      let started2 = false
      for (let px = 0; px <= p2.w; px += 2) {
        const invT = invTMin + (px / p2.w) * (invTMax - invTMin)
        const lnk = Math.log(A_factor) - (eA * 1000 / R) * invT
        const cy = p2.y + p2.h - ((lnk - lnkMin) / (lnkMax - lnkMin)) * (p2.h - 20)
        if (!started2) { ctx.moveTo(p2.x + px, cy); started2 = true }
        else ctx.lineTo(p2.x + px, cy)
      }
      ctx.stroke()

      // Current point on Arrhenius plot
      const curInvT = 1 / tempK
      if (curInvT >= invTMin && curInvT <= invTMax) {
        const curPx = p2.x + ((curInvT - invTMin) / (invTMax - invTMin)) * p2.w
        const curLnk = Math.log(A_factor) - (eA * 1000 / R) * curInvT
        const curPy = p2.y + p2.h - ((curLnk - lnkMin) / (lnkMax - lnkMin)) * (p2.h - 20)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.beginPath()
        ctx.arc(curPx, curPy, 5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Slope annotation
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '10px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('slope = -Ea/R', p2.x + p2.w / 2, p2.y + p2.h - 10)
      ctx.fillText('1/T (K\u207B\u00B9)', p2.x + p2.w / 2, p2.y + p2.h + 15)

      // --- Energy Diagram (bottom) ---
      const p3 = { x: 60, y: h * 0.55, w: w * 0.85, h: h * 0.38 }

      ctx.fillStyle = 'rgba(255,160,80,0.7)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Energy Diagram', p3.x, p3.y)

      // Reaction coordinate axis
      ctx.strokeStyle = 'rgba(255,160,80,0.3)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(p3.x, p3.y + 15)
      ctx.lineTo(p3.x, p3.y + p3.h)
      ctx.lineTo(p3.x + p3.w, p3.y + p3.h)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '10px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Reaction Coordinate', p3.x + p3.w / 2, p3.y + p3.h + 15)

      const reactantE = p3.y + p3.h * 0.65
      const productE = p3.y + p3.h * 0.75
      const peakE = reactantE - (eA / 100) * p3.h * 0.5

      // Reactant level
      ctx.strokeStyle = 'rgba(100,200,100,0.7)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(p3.x + 20, reactantE)
      ctx.lineTo(p3.x + p3.w * 0.25, reactantE)
      ctx.stroke()

      // Energy curve (activation energy hump)
      ctx.strokeStyle = 'rgba(255,160,80,0.8)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(p3.x + p3.w * 0.25, reactantE)
      ctx.quadraticCurveTo(p3.x + p3.w * 0.5, peakE - 10, p3.x + p3.w * 0.75, productE)
      ctx.stroke()

      // Product level
      ctx.strokeStyle = 'rgba(100,150,255,0.7)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(p3.x + p3.w * 0.75, productE)
      ctx.lineTo(p3.x + p3.w - 20, productE)
      ctx.stroke()

      // Ea arrow
      ctx.strokeStyle = 'rgba(255,100,100,0.7)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(p3.x + p3.w * 0.35, reactantE)
      ctx.lineTo(p3.x + p3.w * 0.35, peakE)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(255,100,100,0.9)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(`Ea = ${eA} kJ/mol`, p3.x + p3.w * 0.35 + 8, (reactantE + peakE) / 2)

      // Labels
      ctx.fillStyle = 'rgba(100,200,100,0.8)'
      ctx.font = '11px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Reactants', p3.x + p3.w * 0.12, reactantE - 10)
      ctx.fillStyle = 'rgba(100,150,255,0.8)'
      ctx.fillText('Products', p3.x + p3.w * 0.87, productE - 10)

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [concA, concB, tempK, eA, order, k])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a120a]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3" style={{ maxWidth: '220px' }}>
          <APTag course="Chemistry" unit="Unit 5" color={CHEM_COLOR} />
          <InfoPanel
            title="Kinetics Data"
            departmentColor={CHEM_COLOR}
            items={[
              { label: 'Rate Constant k', value: kDisplay, color: CHEM_COLOR },
              { label: 'Rate', value: rate.toExponential(2), color: CHEM_COLOR },
              { label: 'Half-life', value: hl < 1e6 ? hl.toFixed(2) : 'very long', unit: 's' },
              { label: 'Order', value: `${order}${order === '0' ? 'th' : order === '1' ? 'st' : 'nd'}` },
            ]}
          />
          <EquationDisplay
            departmentColor={CHEM_COLOR}
            title="Rate Laws"
            equations={[
              { label: 'Rate Law', expression: 'rate = k[A]^m[B]^n' },
              { label: 'Arrhenius', expression: 'k = A e^(-Ea/RT)', description: 'Temperature dependence of k' },
              { label: '0th order', expression: '[A] = [A]0 - kt' },
              { label: '1st order', expression: 'ln[A] = ln[A]0 - kt' },
              { label: '2nd order', expression: '1/[A] = 1/[A]0 + kt' },
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
          <ControlGroup label="[A] (M)">
            <Slider value={concA} onChange={setConcA} min={0.1} max={3.0} step={0.1} label={concA.toFixed(1)} />
          </ControlGroup>
          <ControlGroup label="[B] (M)">
            <Slider value={concB} onChange={setConcB} min={0.1} max={3.0} step={0.1} label={concB.toFixed(1)} />
          </ControlGroup>
          <ControlGroup label="Temperature (K)">
            <Slider value={tempK} onChange={setTempK} min={200} max={600} step={5} label={`${tempK} K`} />
          </ControlGroup>
          <ControlGroup label="Ea (kJ/mol)">
            <Slider value={eA} onChange={setEA} min={10} max={120} step={1} label={String(eA)} />
          </ControlGroup>
          <ControlGroup label="Reaction Order">
            <ButtonGroup
              value={order}
              onChange={v => setOrder(v as ReactionOrder)}
              options={[
                { value: '0', label: '0th' },
                { value: '1', label: '1st' },
                { value: '2', label: '2nd' },
              ]}
              color={CHEM_COLOR}
            />
          </ControlGroup>
          <Button variant="secondary" onClick={demo.open}>AP Tutorial</Button>
          <Button variant="secondary" onClick={resetAll}>Reset</Button>
        </div>
      </div>
    </div>
  )
}
