import { useState, useRef, useEffect, useCallback } from 'react'
import { ControlGroup, Slider, Toggle, Button, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CHEM_COLOR = 'rgb(255, 160, 80)'
const BG = '#1a120a'

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export default function Equilibrium() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const frameRef = useRef(0)

  const [concA, setConcA] = useState(1.0)
  const [concB, setConcB] = useState(0.0)
  const [tempK, setTempK] = useState(300)
  const [highPressure, setHighPressure] = useState(false)
  const [stressType, setStressType] = useState<'none' | 'addA' | 'removeB' | 'addB'>('none')

  // Equilibrium constant (temperature dependent)
  const Keq = 4.0 * Math.exp(-2000 * (1 / tempK - 1 / 300))

  // Calculate equilibrium concentrations for A <-> B
  // Keq = [B]/[A] at equilibrium
  const totalConc = concA + concB
  const eqB = totalConc * Keq / (1 + Keq)
  const eqA = totalConc - eqB

  // Reaction quotient
  const Q = concA > 0.001 ? concB / concA : concB > 0 ? Infinity : 1

  // Direction
  const direction = Q < Keq ? 'Forward (toward products)' : Q > Keq ? 'Reverse (toward reactants)' : 'At equilibrium'

  // History for concentration vs time plot
  const historyRef = useRef<{ t: number; a: number; b: number }[]>([])
  const simTimeRef = useRef(0)
  const simARef = useRef(concA)
  const simBRef = useRef(concB)

  // Reset simulation on parameter change
  useEffect(() => {
    historyRef.current = []
    simTimeRef.current = 0
    simARef.current = concA
    simBRef.current = concB
  }, [concA, concB, tempK, highPressure, stressType])

  const resetAll = useCallback(() => {
    setConcA(1.0)
    setConcB(0.0)
    setTempK(300)
    setHighPressure(false)
    setStressType('none')
  }, [])

  const applyStress = useCallback((type: 'addA' | 'removeB' | 'addB') => {
    setStressType(type)
    if (type === 'addA') setConcA(prev => clamp(prev + 0.5, 0, 3))
    else if (type === 'removeB') setConcB(prev => clamp(prev - 0.3, 0, 3))
    else if (type === 'addB') setConcB(prev => clamp(prev + 0.5, 0, 3))
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'Chemical Equilibrium', description: 'At equilibrium, forward and reverse reaction rates are EQUAL. Concentrations remain constant but reactions continue (dynamic equilibrium). It is NOT that reactions stop.', setup: () => { setConcA(1.0); setConcB(0.0); setTempK(300); setStressType('none') } },
    { title: 'Equilibrium Constant Keq', description: 'Keq = [products]/[reactants] at equilibrium. Large Keq (>>1) favors products. Small Keq (<<1) favors reactants. Keq depends ONLY on temperature.', setup: () => { setConcA(1.0); setConcB(0.0); setTempK(300) } },
    { title: 'Q vs K: Predicting Direction', description: 'Q (reaction quotient) uses CURRENT concentrations. If Q < K, reaction goes forward. If Q > K, reaction goes reverse. If Q = K, at equilibrium.', setup: () => { setConcA(2.0); setConcB(0.1) } },
    { title: "Le Chatelier's: Add Reactant", description: "Adding more reactant (increasing [A]) makes Q < K. The system shifts FORWARD to consume the added reactant and re-establish equilibrium. This is Le Chatelier's principle.", setup: () => { setConcA(1.0); setConcB(0.5); applyStress('addA') } },
    { title: "Le Chatelier's: Remove Product", description: 'Removing product (decreasing [B]) also makes Q < K. The system shifts forward to produce more B. This is how many industrial processes drive reactions to completion.', setup: () => { setConcA(0.5); setConcB(1.0); applyStress('removeB') } },
    { title: 'Temperature Effect', description: 'For exothermic reactions, increasing T decreases Keq (shifts toward reactants). For endothermic reactions, increasing T increases Keq (shifts toward products).', setup: () => { setConcA(1.0); setConcB(0.0); setTempK(400); setStressType('none') } },
    { title: 'Pressure Effect', description: 'Increasing pressure shifts equilibrium toward the side with FEWER moles of gas. This only applies to reactions involving gases where mole counts differ.', setup: () => { setConcA(1.0); setConcB(0.0); setHighPressure(true); setTempK(300) } },
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

      // Simulate approach to equilibrium
      const dt = 0.05
      const kf = 0.1
      const kr = kf / Keq
      simARef.current = clamp(simARef.current + (-kf * simARef.current + kr * simBRef.current) * dt, 0, 5)
      simBRef.current = clamp(simBRef.current + (kf * (totalConc - simBRef.current - (totalConc - concA - concB)) - kr * simBRef.current) * dt, 0, 5)
      // Simpler: approach eq values
      simARef.current += (eqA - simARef.current) * 0.02
      simBRef.current += (eqB - simBRef.current) * 0.02

      simTimeRef.current += dt
      if (historyRef.current.length < 500) {
        historyRef.current.push({ t: simTimeRef.current, a: simARef.current, b: simBRef.current })
      }

      // --- Concentration vs Time plot (top left) ---
      const p1 = { x: 60, y: 30, w: w * 0.55, h: h * 0.42 }

      ctx.fillStyle = 'rgba(255,160,80,0.7)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Concentration vs Time', p1.x, p1.y)

      ctx.strokeStyle = 'rgba(255,160,80,0.3)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y + 15)
      ctx.lineTo(p1.x, p1.y + p1.h)
      ctx.lineTo(p1.x + p1.w, p1.y + p1.h)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '10px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Time', p1.x + p1.w / 2, p1.y + p1.h + 15)

      const hist = historyRef.current
      const maxC = Math.max(totalConc * 1.2, 1)

      if (hist.length > 1) {
        const tRange = hist[hist.length - 1].t - hist[0].t || 1

        // [A] curve
        ctx.strokeStyle = 'rgba(255,100,100,0.8)'
        ctx.lineWidth = 2
        ctx.beginPath()
        hist.forEach((pt, i) => {
          const px = p1.x + ((pt.t - hist[0].t) / tRange) * p1.w
          const py = p1.y + p1.h - (pt.a / maxC) * (p1.h - 20)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
        ctx.stroke()

        // [B] curve
        ctx.strokeStyle = 'rgba(100,150,255,0.8)'
        ctx.lineWidth = 2
        ctx.beginPath()
        hist.forEach((pt, i) => {
          const px = p1.x + ((pt.t - hist[0].t) / tRange) * p1.w
          const py = p1.y + p1.h - (pt.b / maxC) * (p1.h - 20)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
        ctx.stroke()
      }

      // Equilibrium lines (dashed)
      const eqAY = p1.y + p1.h - (eqA / maxC) * (p1.h - 20)
      const eqBY = p1.y + p1.h - (eqB / maxC) * (p1.h - 20)
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = 'rgba(255,100,100,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(p1.x, eqAY); ctx.lineTo(p1.x + p1.w, eqAY); ctx.stroke()
      ctx.strokeStyle = 'rgba(100,150,255,0.3)'
      ctx.beginPath(); ctx.moveTo(p1.x, eqBY); ctx.lineTo(p1.x + p1.w, eqBY); ctx.stroke()
      ctx.setLineDash([])

      // Legend
      ctx.fillStyle = 'rgba(255,100,100,0.8)'
      ctx.font = '11px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('[A] Reactant', p1.x + p1.w + 10, p1.y + 30)
      ctx.fillStyle = 'rgba(100,150,255,0.8)'
      ctx.fillText('[B] Product', p1.x + p1.w + 10, p1.y + 48)

      // --- Q vs K comparison bar (top right) ---
      const barX = w * 0.72
      const barY = p1.y + 80
      const barW = w * 0.22
      const barH = 30

      ctx.fillStyle = 'rgba(255,160,80,0.7)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Q vs K Comparison', barX + barW / 2, barY - 15)

      // K bar
      ctx.fillStyle = 'rgba(255,160,80,0.2)'
      ctx.fillRect(barX, barY, barW, barH)
      ctx.strokeStyle = 'rgba(255,160,80,0.5)'
      ctx.lineWidth = 1
      ctx.strokeRect(barX, barY, barW, barH)

      // K marker
      const maxVal = Math.max(Q, Keq, 1) * 1.5
      const kPos = barX + (Keq / maxVal) * barW
      ctx.strokeStyle = 'rgba(255,160,80,0.9)'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(kPos, barY - 3); ctx.lineTo(kPos, barY + barH + 3); ctx.stroke()
      ctx.fillStyle = 'rgba(255,160,80,0.9)'
      ctx.font = 'bold 10px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(`K=${Keq.toFixed(2)}`, kPos, barY - 8)

      // Q marker
      const qClamped = Math.min(Q, maxVal)
      const qPos = barX + (qClamped / maxVal) * barW
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.beginPath()
      ctx.arc(qPos, barY + barH / 2, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = 'bold 10px system-ui'
      ctx.fillText(`Q=${isFinite(Q) ? Q.toFixed(2) : 'INF'}`, qPos, barY + barH + 15)

      // Direction arrow
      if (Math.abs(Q - Keq) > 0.05) {
        const arrowDir = Q < Keq ? 1 : -1
        ctx.fillStyle = 'rgba(255,200,100,0.7)'
        ctx.font = '16px system-ui'
        ctx.fillText(arrowDir > 0 ? '\u2192 Forward' : '\u2190 Reverse', barX + barW / 2, barY + barH + 35)
      } else {
        ctx.fillStyle = 'rgba(100,255,100,0.7)'
        ctx.font = '12px system-ui'
        ctx.fillText('At Equilibrium', barX + barW / 2, barY + barH + 35)
      }

      // --- Animated molecule representation (bottom) ---
      const molY = h * 0.55
      const molH = h * 0.38
      const molW = w * 0.9

      ctx.fillStyle = 'rgba(255,160,80,0.6)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Molecular View: A (red) \u21CC B (blue)', 60, molY)

      // Container box
      ctx.strokeStyle = 'rgba(255,160,80,0.2)'
      ctx.lineWidth = 1
      ctx.strokeRect(60, molY + 15, molW, molH - 25)

      // Draw molecules
      const numA = Math.round(simARef.current * 8)
      const numB = Math.round(simBRef.current * 8)

      for (let i = 0; i < numA; i++) {
        const seed = i * 137.5
        const mx = 80 + ((seed * 7.3) % (molW - 40))
        const my = molY + 25 + ((seed * 13.7) % (molH - 50))
        const wobX = Math.sin(f * 0.02 + seed) * 3
        const wobY = Math.cos(f * 0.025 + seed * 0.7) * 3

        ctx.fillStyle = 'rgba(255,100,100,0.7)'
        ctx.beginPath()
        ctx.arc(mx + wobX, my + wobY, 6, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = 0; i < numB; i++) {
        const seed = (i + 50) * 157.3
        const mx = 80 + ((seed * 7.3) % (molW - 40))
        const my = molY + 25 + ((seed * 13.7) % (molH - 50))
        const wobX = Math.sin(f * 0.02 + seed) * 3
        const wobY = Math.cos(f * 0.025 + seed * 0.7) * 3

        ctx.fillStyle = 'rgba(100,150,255,0.7)'
        ctx.beginPath()
        ctx.arc(mx + wobX, my + wobY, 6, 0, Math.PI * 2)
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [concA, concB, tempK, Keq, eqA, eqB, totalConc, Q, highPressure])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a120a]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 right-4 flex flex-col gap-3 max-w-[220px]">
          <APTag course="Chemistry" unit="Unit 7" color={CHEM_COLOR} />
          <InfoPanel
            title="Equilibrium"
            departmentColor={CHEM_COLOR}
            items={[
              { label: 'Keq', value: Keq.toFixed(3), color: CHEM_COLOR },
              { label: 'Q', value: isFinite(Q) ? Q.toFixed(3) : 'INF' },
              { label: 'Direction', value: direction },
              { label: '[A] eq', value: eqA.toFixed(3), color: 'rgba(255,100,100,0.9)' },
              { label: '[B] eq', value: eqB.toFixed(3), color: 'rgba(100,150,255,0.9)' },
            ]}
          />
          <EquationDisplay
            departmentColor={CHEM_COLOR}
            title="Equilibrium"
            equations={[
              { label: 'Keq', expression: 'Keq = [products] / [reactants]', description: 'At equilibrium only' },
              { label: 'Q', expression: 'Q = [products] / [reactants]', description: 'At any point in time' },
              { label: 'Direction', expression: 'Q < K: forward, Q > K: reverse' },
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
          <ControlGroup label="[A] Reactant">
            <Slider value={concA} onChange={setConcA} min={0} max={3} step={0.05} label={concA.toFixed(2)} />
          </ControlGroup>
          <ControlGroup label="[B] Product">
            <Slider value={concB} onChange={setConcB} min={0} max={3} step={0.05} label={concB.toFixed(2)} />
          </ControlGroup>
          <ControlGroup label="Temperature (K)">
            <Slider value={tempK} onChange={setTempK} min={200} max={500} step={5} label={`${tempK} K`} />
          </ControlGroup>
          <ControlGroup label="Pressure">
            <Toggle value={highPressure} onChange={setHighPressure} label="High P" />
          </ControlGroup>
          <ControlGroup label="Apply Stress">
            <ButtonGroup
              value={stressType}
              onChange={v => {
                const s = v as 'none' | 'addA' | 'removeB' | 'addB'
                if (s !== 'none') applyStress(s)
                else setStressType('none')
              }}
              options={[
                { value: 'none', label: 'None' },
                { value: 'addA', label: '+[A]' },
                { value: 'removeB', label: '-[B]' },
                { value: 'addB', label: '+[B]' },
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
