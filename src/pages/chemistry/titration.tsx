import { useState, useRef, useEffect, useCallback } from 'react'
import { ControlGroup, Slider, Select, Toggle, Button } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CHEM_COLOR = 'rgb(255, 160, 80)'
const BG = '#1a120a'

type AcidType = 'strong' | 'weak'
type BaseType = 'strong' | 'weak'

function calculatePH(
  acidType: AcidType,
  baseType: BaseType,
  acidConc: number,
  baseConc: number,
  acidVol: number,
  baseVol: number,
  Ka: number
): number {
  const totalVol = acidVol + baseVol
  if (totalVol <= 0) return 7

  const molesAcid = acidConc * acidVol / 1000
  const molesBase = baseConc * baseVol / 1000

  if (acidType === 'strong' && baseType === 'strong') {
    if (molesBase < molesAcid) {
      const excessH = (molesAcid - molesBase) / (totalVol / 1000)
      return -Math.log10(Math.max(excessH, 1e-14))
    } else if (molesBase > molesAcid) {
      const excessOH = (molesBase - molesAcid) / (totalVol / 1000)
      const pOH = -Math.log10(Math.max(excessOH, 1e-14))
      return 14 - pOH
    }
    return 7
  }

  if (acidType === 'weak' && baseType === 'strong') {
    if (molesBase < molesAcid) {
      // Buffer region
      const ha = molesAcid - molesBase
      const aConj = molesBase
      if (aConj <= 0) {
        // Only weak acid
        const cAcid = molesAcid / (totalVol / 1000)
        const h = Math.sqrt(Ka * cAcid)
        return -Math.log10(Math.max(h, 1e-14))
      }
      // Henderson-Hasselbalch
      const pKa = -Math.log10(Ka)
      return pKa + Math.log10(aConj / ha)
    } else if (Math.abs(molesBase - molesAcid) < 0.0001) {
      // Equivalence point: conjugate base hydrolysis
      const cBase = molesAcid / (totalVol / 1000)
      const Kb = 1e-14 / Ka
      const oh = Math.sqrt(Kb * cBase)
      return 14 + Math.log10(Math.max(oh, 1e-14))
    } else {
      // Excess strong base
      const excessOH = (molesBase - molesAcid) / (totalVol / 1000)
      return 14 + Math.log10(Math.max(excessOH, 1e-14))
    }
  }

  // Fallback for other combos (simplified)
  if (molesBase < molesAcid) {
    const excessH = (molesAcid - molesBase) / (totalVol / 1000)
    return -Math.log10(Math.max(excessH, 1e-14))
  } else if (molesBase > molesAcid) {
    const excessOH = (molesBase - molesAcid) / (totalVol / 1000)
    return 14 + Math.log10(Math.max(excessOH, 1e-14))
  }
  return 7
}

function phToColor(pH: number): string {
  if (pH < 3) return 'rgba(255,50,50,0.8)'
  if (pH < 5) return 'rgba(255,130,50,0.7)'
  if (pH < 6.5) return 'rgba(255,200,50,0.7)'
  if (pH < 7.5) return 'rgba(100,220,100,0.7)'
  if (pH < 9) return 'rgba(50,150,255,0.7)'
  if (pH < 11) return 'rgba(100,80,255,0.7)'
  return 'rgba(160,50,255,0.7)'
}

export default function Titration() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const frameRef = useRef(0)

  const [acidType, setAcidType] = useState<AcidType>('weak')
  const [baseType, setBaseType] = useState<BaseType>('strong')
  const [acidConc, setAcidConc] = useState(0.1)
  const [baseConc, setBaseConc] = useState(0.1)
  const [titrantVol, setTitrantVol] = useState(0)
  const [showIndicator, setShowIndicator] = useState(true)
  const [Ka, setKa] = useState(1.8e-5) // acetic acid

  const acidVol = 50 // mL fixed
  const currentPH = calculatePH(acidType, baseType, acidConc, baseConc, acidVol, titrantVol, Ka)
  const equivVol = (acidConc * acidVol) / baseConc
  const halfEquivVol = equivVol / 2
  const pKa = -Math.log10(Ka)

  const resetAll = useCallback(() => {
    setAcidType('weak')
    setBaseType('strong')
    setAcidConc(0.1)
    setBaseConc(0.1)
    setTitrantVol(0)
    setShowIndicator(true)
    setKa(1.8e-5)
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'Acid-Base Titration', description: 'Titration determines unknown concentration by gradually adding a known reagent (titrant). The equivalence point occurs when moles of acid = moles of base. The pH curve reveals the acid/base strength.', setup: () => { setAcidType('weak'); setBaseType('strong'); setTitrantVol(0); setAcidConc(0.1); setBaseConc(0.1) } },
    { title: 'Strong Acid + Strong Base', description: 'SA-SB titration: starts at low pH, steep rise near equivalence point at pH 7. Both before and after equivalence, pH is determined by excess strong acid or strong base.', setup: () => { setAcidType('strong'); setBaseType('strong'); setTitrantVol(0) } },
    { title: 'Weak Acid + Strong Base', description: 'WA-SB titration: starts higher than SA, has a BUFFER REGION before equivalence, and equivalence point is ABOVE pH 7 (conjugate base is basic). The curve is less steep.', setup: () => { setAcidType('weak'); setBaseType('strong'); setTitrantVol(0); setKa(1.8e-5) } },
    { title: 'Buffer Region', description: 'In the buffer region, the solution contains significant amounts of BOTH weak acid (HA) and its conjugate base (A-). pH changes slowly. Henderson-Hasselbalch: pH = pKa + log([A-]/[HA]).', setup: () => { setAcidType('weak'); setTitrantVol(Math.round(halfEquivVol)) } },
    { title: 'Half-Equivalence Point', description: 'At the half-equivalence point, exactly half the acid is neutralized: [HA] = [A-]. Therefore pH = pKa (since log(1) = 0). This is used to experimentally determine Ka.', setup: () => { setTitrantVol(Math.round(halfEquivVol)) } },
    { title: 'Equivalence Point', description: 'At equivalence, moles acid = moles base. For WA-SB, the solution contains only conjugate base (A-), so pH > 7. For SA-SB, pH = 7. The indicator should change color here.', setup: () => { setTitrantVol(Math.round(equivVol)); setShowIndicator(true) } },
    { title: 'Beyond Equivalence', description: 'After equivalence, excess strong base dominates. pH rises sharply and is determined by [OH-] from excess NaOH. The curve levels off at high pH.', setup: () => { setTitrantVol(Math.round(equivVol * 1.5)) } },
    { title: 'Ka and Acid Strength', description: 'Larger Ka = stronger weak acid = lower initial pH. Smaller Ka = weaker acid = higher initial pH and more gradual curve. The pKa appears at the half-equivalence point.', setup: () => { setKa(1e-3); setTitrantVol(0) } },
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

      // --- Titration Curve (left side) ---
      const p = { x: 70, y: 30, w: w * 0.52, h: h * 0.8 }
      const maxVol = equivVol * 2.2

      ctx.fillStyle = 'rgba(255,160,80,0.7)'
      ctx.font = 'bold 13px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Titration Curve', p.x, p.y)

      // Axes
      ctx.strokeStyle = 'rgba(255,160,80,0.4)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(p.x, p.y + 15)
      ctx.lineTo(p.x, p.y + p.h)
      ctx.lineTo(p.x + p.w, p.y + p.h)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '10px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Volume of Base Added (mL)', p.x + p.w / 2, p.y + p.h + 18)
      ctx.save()
      ctx.translate(p.x - 30, p.y + p.h / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('pH', 0, 0)
      ctx.restore()

      // pH axis ticks
      for (let pH = 0; pH <= 14; pH += 2) {
        const yy = p.y + p.h - (pH / 14) * (p.h - 20)
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.font = '9px system-ui'
        ctx.textAlign = 'right'
        ctx.fillText(String(pH), p.x - 8, yy + 3)
        ctx.strokeStyle = 'rgba(255,160,80,0.06)'
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(p.x, yy); ctx.lineTo(p.x + p.w, yy); ctx.stroke()
      }

      // Volume ticks
      for (let v = 0; v <= maxVol; v += 10) {
        const xx = p.x + (v / maxVol) * p.w
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.font = '9px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(`${v.toFixed(0)}`, xx, p.y + p.h + 10)
      }

      // Buffer region highlight
      if (acidType === 'weak') {
        const bufStart = p.x + (halfEquivVol * 0.3 / maxVol) * p.w
        const bufEnd = p.x + (halfEquivVol * 1.7 / maxVol) * p.w
        ctx.fillStyle = 'rgba(100,200,255,0.06)'
        ctx.fillRect(bufStart, p.y + 15, bufEnd - bufStart, p.h - 15)
        ctx.fillStyle = 'rgba(100,200,255,0.4)'
        ctx.font = '10px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Buffer Region', (bufStart + bufEnd) / 2, p.y + 28)
      }

      // Draw the titration curve
      ctx.strokeStyle = 'rgba(255,160,80,0.9)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      let started = false
      for (let vol = 0; vol <= maxVol; vol += 0.5) {
        const pH = calculatePH(acidType, baseType, acidConc, baseConc, acidVol, vol, Ka)
        const clampedPH = Math.max(0, Math.min(14, pH))
        const xx = p.x + (vol / maxVol) * p.w
        const yy = p.y + p.h - (clampedPH / 14) * (p.h - 20)
        if (!started) { ctx.moveTo(xx, yy); started = true }
        else ctx.lineTo(xx, yy)
      }
      ctx.stroke()

      // Equivalence point marker
      const eqX = p.x + (equivVol / maxVol) * p.w
      const eqPH = calculatePH(acidType, baseType, acidConc, baseConc, acidVol, equivVol, Ka)
      const eqY = p.y + p.h - (Math.max(0, Math.min(14, eqPH)) / 14) * (p.h - 20)

      const eqGlow = ctx.createRadialGradient(eqX, eqY, 0, eqX, eqY, 15)
      eqGlow.addColorStop(0, 'rgba(255,255,100,0.5)')
      eqGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = eqGlow
      ctx.beginPath()
      ctx.arc(eqX, eqY, 15, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(255,255,100,0.9)'
      ctx.beginPath()
      ctx.arc(eqX, eqY, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,100,0.8)'
      ctx.font = '10px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(`Equiv: ${equivVol.toFixed(1)} mL`, eqX + 8, eqY - 5)
      ctx.fillText(`pH = ${eqPH.toFixed(2)}`, eqX + 8, eqY + 10)

      // Half-equivalence point (weak acid only)
      if (acidType === 'weak') {
        const halfX = p.x + (halfEquivVol / maxVol) * p.w
        const halfPH = pKa
        const halfY = p.y + p.h - (Math.max(0, Math.min(14, halfPH)) / 14) * (p.h - 20)

        ctx.fillStyle = 'rgba(100,255,200,0.7)'
        ctx.beginPath()
        ctx.arc(halfX, halfY, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = '10px system-ui'
        ctx.textAlign = 'right'
        ctx.fillText(`pH = pKa = ${pKa.toFixed(2)}`, halfX - 8, halfY - 5)
        ctx.fillText('Half-equiv', halfX - 8, halfY + 10)
      }

      // Current position marker
      if (titrantVol > 0) {
        const curX = p.x + (titrantVol / maxVol) * p.w
        const curY = p.y + p.h - (Math.max(0, Math.min(14, currentPH)) / 14) * (p.h - 20)
        const pulse = Math.sin(f * 0.05) * 0.3 + 0.7

        ctx.fillStyle = `rgba(255,255,255,${0.9 * pulse})`
        ctx.beginPath()
        ctx.arc(curX, curY, 6, 0, Math.PI * 2)
        ctx.fill()

        ctx.setLineDash([3, 3])
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(curX, curY)
        ctx.lineTo(curX, p.y + p.h)
        ctx.moveTo(curX, curY)
        ctx.lineTo(p.x, curY)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // --- Beaker visualization (right side) ---
      const bkX = w * 0.67
      const bkY = h * 0.15
      const bkW = w * 0.25
      const bkH = h * 0.55

      // Beaker outline
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(bkX, bkY)
      ctx.lineTo(bkX, bkY + bkH)
      ctx.lineTo(bkX + bkW, bkY + bkH)
      ctx.lineTo(bkX + bkW, bkY)
      ctx.stroke()

      // Liquid fill
      const fillLevel = 0.4 + (titrantVol / (equivVol * 2)) * 0.45
      const liquidTop = bkY + bkH * (1 - fillLevel)
      const liquidColor = showIndicator ? phToColor(currentPH) : 'rgba(200,200,255,0.3)'

      ctx.fillStyle = liquidColor
      ctx.fillRect(bkX + 1, liquidTop, bkW - 2, bkY + bkH - liquidTop - 1)

      // Liquid surface wave
      ctx.strokeStyle = liquidColor.replace('0.7', '0.9').replace('0.8', '1.0')
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let lx = bkX + 1; lx < bkX + bkW - 1; lx++) {
        const wave = Math.sin((lx - bkX) * 0.1 + f * 0.05) * 2
        if (lx === bkX + 1) ctx.moveTo(lx, liquidTop + wave)
        else ctx.lineTo(lx, liquidTop + wave)
      }
      ctx.stroke()

      // Drip animation from burette
      const buretteX = bkX + bkW / 2
      const buretteTop = bkY - 40
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(buretteX - 3, buretteTop)
      ctx.lineTo(buretteX - 3, bkY - 5)
      ctx.moveTo(buretteX + 3, buretteTop)
      ctx.lineTo(buretteX + 3, bkY - 5)
      ctx.stroke()

      // Animated drip
      if (titrantVol > 0) {
        const dripCycle = (f % 60) / 60
        const dripY = bkY - 5 + dripCycle * (liquidTop - bkY + 5)
        if (dripY < liquidTop) {
          ctx.fillStyle = 'rgba(100,150,255,0.8)'
          ctx.beginPath()
          ctx.ellipse(buretteX, dripY, 3, 4, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // pH display on beaker
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.font = 'bold 20px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(`pH ${currentPH.toFixed(2)}`, bkX + bkW / 2, bkY + bkH + 30)

      // Indicator color bar
      if (showIndicator) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.font = '10px system-ui'
        ctx.fillText('pH Scale', bkX + bkW / 2, bkY + bkH + 50)

        const scaleY = bkY + bkH + 55
        const scaleW = bkW
        for (let i = 0; i < scaleW; i++) {
          const scPH = (i / scaleW) * 14
          ctx.fillStyle = phToColor(scPH)
          ctx.fillRect(bkX + i, scaleY, 1, 10)
        }
        // Current pH marker on scale
        const markerX = bkX + (Math.max(0, Math.min(14, currentPH)) / 14) * scaleW
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.moveTo(markerX, scaleY - 3)
        ctx.lineTo(markerX - 4, scaleY - 8)
        ctx.lineTo(markerX + 4, scaleY - 8)
        ctx.closePath()
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [acidType, baseType, acidConc, baseConc, titrantVol, showIndicator, Ka, currentPH, equivVol, halfEquivVol, pKa])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a120a]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-[200px]">
          <APTag course="Chemistry" unit="Unit 8" color={CHEM_COLOR} />
          <InfoPanel
            title="Titration Data"
            departmentColor={CHEM_COLOR}
            items={[
              { label: 'pH', value: currentPH.toFixed(2), color: CHEM_COLOR },
              { label: 'Volume Added', value: `${titrantVol.toFixed(1)} mL` },
              { label: 'Equiv. Vol', value: `${equivVol.toFixed(1)} mL` },
              { label: 'pKa', value: pKa.toFixed(2) },
            ]}
          />
          <EquationDisplay
            departmentColor={CHEM_COLOR}
            title="Acid-Base"
            equations={[
              { label: 'pH', expression: 'pH = -log[H+]' },
              { label: 'H-H', expression: 'pH = pKa + log([A-]/[HA])', description: 'Henderson-Hasselbalch (buffers)' },
              { label: 'pKa', expression: 'pKa = -log(Ka)' },
              { label: 'Kw', expression: 'Kw = [H+][OH-] = 1e-14' },
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
          <ControlGroup label="Acid Type">
            <Select
              value={acidType}
              onChange={v => setAcidType(v as AcidType)}
              options={[
                { value: 'strong', label: 'Strong (HCl)' },
                { value: 'weak', label: 'Weak (CH3COOH)' },
              ]}
            />
          </ControlGroup>
          <ControlGroup label="Base Type">
            <Select
              value={baseType}
              onChange={v => setBaseType(v as BaseType)}
              options={[
                { value: 'strong', label: 'Strong (NaOH)' },
                { value: 'weak', label: 'Weak (NH3)' },
              ]}
            />
          </ControlGroup>
          {acidType === 'weak' && (
            <ControlGroup label="Ka">
              <Select
                value={String(Ka)}
                onChange={v => setKa(parseFloat(v))}
                options={[
                  { value: '1.8e-5', label: 'Acetic (1.8e-5)' },
                  { value: '6.8e-4', label: 'HF (6.8e-4)' },
                  { value: '1e-3', label: 'Medium (1e-3)' },
                  { value: '4.3e-7', label: 'H2CO3 (4.3e-7)' },
                ]}
              />
            </ControlGroup>
          )}
          <ControlGroup label="Acid Conc. (M)">
            <Slider value={acidConc} onChange={setAcidConc} min={0.01} max={0.5} step={0.01} label={acidConc.toFixed(2)} />
          </ControlGroup>
          <ControlGroup label="Titrant Vol. (mL)">
            <Slider value={titrantVol} onChange={setTitrantVol} min={0} max={equivVol * 2.2} step={0.5} label={`${titrantVol.toFixed(1)}`} />
          </ControlGroup>
          <ControlGroup label="Indicator">
            <Toggle value={showIndicator} onChange={setShowIndicator} label="Color" />
          </ControlGroup>
          <Button variant="secondary" onClick={demo.open}>AP Tutorial</Button>
          <Button variant="secondary" onClick={resetAll}>Reset</Button>
        </div>
      </div>
    </div>
  )
}
