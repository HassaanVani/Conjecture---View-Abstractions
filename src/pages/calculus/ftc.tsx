import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'
import { Select, Toggle, Slider } from '@/components/control-panel'

type FuncKey = 'sin' | 'x2' | 'cos' | 'exp' | 'x3x'

const FUNCS: Record<FuncKey, { label: string; f: (t: number) => number; tex: string }> = {
  sin:  { label: 'sin(x)',    f: t => Math.sin(t),            tex: 'sin(t)' },
  x2:   { label: 'x\u00B2',  f: t => t * t,                  tex: 't\u00B2' },
  cos:  { label: 'cos(x)',    f: t => Math.cos(t),            tex: 'cos(t)' },
  exp:  { label: 'e\u02E3-1', f: t => Math.exp(t) - 1,       tex: 'e\u1D57-1' },
  x3x:  { label: 'x\u00B3-x',f: t => t * t * t - t,         tex: 't\u00B3-t' },
}

const ACCENT = 'rgb(180, 120, 255)'
const BG = '#120a1a'

function integrate(f: (t: number) => number, a: number, b: number, n = 200): number {
  const h = (b - a) / n
  let sum = 0.5 * (f(a) + f(b))
  for (let i = 1; i < n; i++) sum += f(a + i * h)
  return sum * h
}

export default function FTC() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const [funcKey, setFuncKey] = useState<FuncKey>('sin')
  const [xVal, setXVal] = useState(3)
  const [autoAnimate, setAutoAnimate] = useState(false)
  const [speed, setSpeed] = useState(1)

  const func = FUNCS[funcKey]
  const fVal = func.f(xVal)
  const area = integrate(func.f, 0, xVal)

  // Auto-animation loop
  useEffect(() => {
    if (!autoAnimate) { cancelAnimationFrame(animRef.current); return }
    let prev = performance.now()
    const tick = (now: number) => {
      const dt = (now - prev) / 1000
      prev = now
      setXVal(v => {
        const next = v + dt * speed
        return next > 6.28 ? -3 : next
      })
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [autoAnimate, speed])

  // Demo steps
  const demoSteps: DemoStep[] = [
    {
      title: 'What is the FTC?',
      description: 'The Fundamental Theorem of Calculus links two central operations: differentiation and integration. It says that integration can be "undone" by differentiation.',
      setup: () => { setFuncKey('sin'); setXVal(0); setAutoAnimate(false) },
    },
    {
      title: 'The Integrand f(t)',
      description: 'The top panel shows f(t) = sin(t). This is the function we integrate. The signed area under f(t) from 0 to x accumulates as x moves right.',
      setup: () => { setFuncKey('sin'); setXVal(1.5); setAutoAnimate(false) },
    },
    {
      title: 'Accumulation Function F(x)',
      description: 'The bottom panel shows F(x) = integral from 0 to x of f(t) dt. Each point on F is the total signed area under f from 0 up to that x value.',
      setup: () => setXVal(3),
    },
    {
      title: 'Sweeping x',
      description: 'Watch: as x increases, the shaded area grows and F(x) rises. When f(t) is negative, the area subtracts and F(x) decreases. Toggle auto-animate to see this in action.',
      setup: () => { setAutoAnimate(true); setSpeed(1.5) },
    },
    {
      title: 'FTC Part 1: d/dx integral = f(x)',
      description: 'The derivative of the accumulation function equals the original integrand: F\'(x) = f(x). The rate at which area accumulates equals the height of f at x.',
      setup: () => { setAutoAnimate(false); setXVal(Math.PI / 2) },
      highlight: 'Notice: at x = pi/2, sin(x) = 1, and F(x) is increasing at rate 1.',
    },
    {
      title: 'FTC Part 2: Evaluation',
      description: 'If F is any antiderivative of f, then the definite integral from a to b equals F(b) - F(a). This converts area problems into simple subtraction.',
      setup: () => { setFuncKey('x2'); setXVal(2); setAutoAnimate(false) },
      highlight: 'For f(t) = t^2, the antiderivative is t^3/3. Area from 0 to 2 = 8/3 - 0 = 2.67.',
    },
    {
      title: 'Negative Area',
      description: 'When f(t) < 0, the integral subtracts. F(x) can decrease. Try x^3 - x and watch F dip where the cubic is negative between 0 and 1.',
      setup: () => { setFuncKey('x3x'); setXVal(0.7); setAutoAnimate(false) },
    },
    {
      title: 'Try Different Functions',
      description: 'Experiment! Select different f(t) functions, sweep x manually or with auto-animate, and observe how the accumulation function mirrors the integrand.',
      setup: () => { setFuncKey('sin'); setXVal(0); setAutoAnimate(true); setSpeed(1) },
    },
  ]

  const demo = useDemoMode(demoSteps)

  const reset = useCallback(() => {
    setFuncKey('sin'); setXVal(3); setAutoAnimate(false); setSpeed(1)
  }, [])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const pad = { l: 56, r: 20, t: 24, b: 12 }
    const gap = 32
    const panelH = (h - pad.t - pad.b - gap) / 2
    const panelW = w - pad.l - pad.r

    // Coordinate ranges
    const xMin = -3, xMax = 6.5
    const scaleXC = panelW / (xMax - xMin)
    const toX = (v: number) => pad.l + (v - xMin) * scaleXC

    // Compute y-ranges for top panel
    const f = func.f
    let fMin = 0, fMax = 0
    for (let t = xMin; t <= xMax; t += 0.05) {
      const v = f(t); if (v < fMin) fMin = v; if (v > fMax) fMax = v
    }
    const fPad = Math.max(0.5, (fMax - fMin) * 0.15)
    fMin -= fPad; fMax += fPad
    const scaleYTop = panelH / (fMax - fMin)
    const topY0 = pad.t
    const toYTop = (v: number) => topY0 + (fMax - v) * scaleYTop

    // Compute y-ranges for bottom panel
    let FMin = 0, FMax = 0
    for (let t = xMin; t <= xMax; t += 0.05) {
      const v = integrate(f, 0, t, 100)
      if (v < FMin) FMin = v; if (v > FMax) FMax = v
    }
    const FPad = Math.max(0.5, (FMax - FMin) * 0.15)
    FMin -= FPad; FMax += FPad
    const scaleYBot = panelH / (FMax - FMin)
    const botY0 = topY0 + panelH + gap
    const toYBot = (v: number) => botY0 + (FMax - v) * scaleYBot

    // Clear
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, w, h)

    // Helper: draw grid + axes for a panel
    const drawAxes = (
      yMinV: number, yMaxV: number,
      toY: (v: number) => number, label: string
    ) => {
      // Grid
      ctx.strokeStyle = 'rgba(180, 120, 255, 0.06)'
      ctx.lineWidth = 1
      for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
        ctx.beginPath(); ctx.moveTo(toX(gx), toY(yMaxV)); ctx.lineTo(toX(gx), toY(yMinV)); ctx.stroke()
      }
      const yStep = Math.pow(10, Math.floor(Math.log10(Math.max(1, yMaxV - yMinV)))) || 1
      for (let gy = Math.ceil(yMinV / yStep) * yStep; gy <= yMaxV; gy += yStep) {
        ctx.beginPath(); ctx.moveTo(toX(xMin), toY(gy)); ctx.lineTo(toX(xMax), toY(gy)); ctx.stroke()
      }

      // Axes
      ctx.strokeStyle = 'rgba(180, 120, 255, 0.35)'
      ctx.lineWidth = 1.5
      // x-axis (if in range)
      if (yMinV <= 0 && yMaxV >= 0) {
        ctx.beginPath(); ctx.moveTo(toX(xMin), toY(0)); ctx.lineTo(toX(xMax), toY(0)); ctx.stroke()
      }
      // y-axis (if in range)
      if (xMin <= 0 && xMax >= 0) {
        ctx.beginPath(); ctx.moveTo(toX(0), toY(yMaxV)); ctx.lineTo(toX(0), toY(yMinV)); ctx.stroke()
      }

      // Tick labels
      ctx.fillStyle = 'rgba(180, 120, 255, 0.45)'
      ctx.font = '10px system-ui'
      ctx.textAlign = 'center'
      for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
        if (gx === 0) continue
        ctx.fillText(String(gx), toX(gx), toY(yMinV) + 12)
      }
      ctx.textAlign = 'right'
      for (let gy = Math.ceil(yMinV / yStep) * yStep; gy <= yMaxV; gy += yStep) {
        if (Math.abs(gy) < 0.001) continue
        ctx.fillText(gy.toFixed(gy === Math.round(gy) ? 0 : 1), toX(xMin) - 6, toY(gy) + 4)
      }

      // Label
      ctx.fillStyle = 'rgba(180, 120, 255, 0.6)'
      ctx.font = 'bold 13px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(label, pad.l + 4, toY(yMaxV) + 14)
    }

    // --- TOP PANEL: f(t) with shaded area ---
    // Clip top panel
    ctx.save()
    ctx.beginPath()
    ctx.rect(pad.l, topY0, panelW, panelH)
    ctx.clip()

    drawAxes(fMin, fMax, toYTop, `f(t) = ${func.tex}`)

    // Shaded area from 0 to xVal
    if (Math.abs(xVal) > 0.001) {
      const aStart = Math.min(0, xVal)
      const aEnd = Math.max(0, xVal)
      const steps = Math.max(4, Math.round(Math.abs(aEnd - aStart) * 40))
      const dt = (aEnd - aStart) / steps
      const sign = xVal >= 0 ? 1 : -1

      // Positive contribution (green)
      ctx.fillStyle = 'rgba(80, 220, 140, 0.3)'
      ctx.beginPath()
      ctx.moveTo(toX(aStart), toYTop(0))
      for (let i = 0; i <= steps; i++) {
        const t = aStart + i * dt
        const fv = f(t) * sign
        ctx.lineTo(toX(t), toYTop(fv > 0 ? f(t) : 0))
      }
      ctx.lineTo(toX(aEnd), toYTop(0))
      ctx.closePath()
      ctx.fill()

      // Negative contribution (red)
      ctx.fillStyle = 'rgba(255, 100, 120, 0.25)'
      ctx.beginPath()
      ctx.moveTo(toX(aStart), toYTop(0))
      for (let i = 0; i <= steps; i++) {
        const t = aStart + i * dt
        const fv = f(t) * sign
        ctx.lineTo(toX(t), toYTop(fv < 0 ? f(t) : 0))
      }
      ctx.lineTo(toX(aEnd), toYTop(0))
      ctx.closePath()
      ctx.fill()
    }

    // f(t) curve
    ctx.strokeStyle = ACCENT
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    let started = false
    for (let px = 0; px <= panelW; px++) {
      const t = xMin + px / scaleXC
      const fv = f(t)
      const cy = toYTop(fv)
      if (cy < topY0 - 10 || cy > topY0 + panelH + 10) { started = false; continue }
      if (!started) { ctx.moveTo(toX(t), cy); started = true } else ctx.lineTo(toX(t), cy)
    }
    ctx.stroke()

    // Current x marker on f(t)
    const fxY = toYTop(fVal)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.beginPath()
    ctx.arc(toX(xVal), fxY, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = ACCENT
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.restore() // end top clip

    // --- Separator label ---
    ctx.fillStyle = 'rgba(180, 120, 255, 0.25)'
    ctx.font = '11px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('Accumulation function below', w / 2, topY0 + panelH + gap / 2 + 4)

    // --- BOTTOM PANEL: F(x) accumulation ---
    ctx.save()
    ctx.beginPath()
    ctx.rect(pad.l, botY0, panelW, panelH)
    ctx.clip()

    drawAxes(FMin, FMax, toYBot, 'F(x) = \u222B\u2080\u02E3 f(t)dt')

    // F(x) curve -- build only up to current xVal
    ctx.strokeStyle = 'rgba(80, 220, 140, 0.9)'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    started = false
    for (let px = 0; px <= panelW; px++) {
      const t = xMin + px / scaleXC
      if (t > xVal + 0.01) break
      const Fv = integrate(f, 0, t, 80)
      const cy = toYBot(Fv)
      if (cy < botY0 - 10 || cy > botY0 + panelH + 10) { started = false; continue }
      if (!started) { ctx.moveTo(toX(t), cy); started = true } else ctx.lineTo(toX(t), cy)
    }
    ctx.stroke()

    // Ghost of full F(x) curve
    ctx.strokeStyle = 'rgba(80, 220, 140, 0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    started = false
    for (let px = 0; px <= panelW; px += 2) {
      const t = xMin + px / scaleXC
      if (t <= xVal) continue
      const Fv = integrate(f, 0, t, 80)
      const cy = toYBot(Fv)
      if (cy < botY0 - 10 || cy > botY0 + panelH + 10) { started = false; continue }
      if (!started) { ctx.moveTo(toX(t), cy); started = true } else ctx.lineTo(toX(t), cy)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // Current point on F(x)
    const Fx = integrate(f, 0, xVal, 200)
    const FxY = toYBot(Fx)
    ctx.fillStyle = 'rgba(80, 220, 140, 1)'
    ctx.beginPath()
    ctx.arc(toX(xVal), FxY, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.restore() // end bottom clip

    // --- Vertical linking line across both panels ---
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(toX(xVal), topY0)
    ctx.lineTo(toX(xVal), botY0 + panelH)
    ctx.stroke()
    ctx.setLineDash([])

    // x label at bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = 'bold 11px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(`x = ${xVal.toFixed(2)}`, toX(xVal), botY0 + panelH + 11)

  }, [funcKey, xVal, func])

  // Resize handler
  useEffect(() => {
    const handle = () => setXVal(v => v) // force redraw
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col" style={{ background: BG }}>
      <div className="flex-1 relative min-h-0">
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* AP Tag */}
        <div className="absolute top-3 right-3">
          <APTag course="Calculus AB/BC" unit="Unit 6" color={ACCENT} />
        </div>

        {/* Equation Display */}
        <div className="absolute top-3 left-3 w-72">
          <EquationDisplay
            departmentColor={ACCENT}
            title="Fundamental Theorem"
            equations={[
              { label: 'FTC 1', expression: 'd/dx \u222B\u2090\u02E3 f(t)dt = f(x)', description: 'Derivative of accumulation = integrand' },
              { label: 'FTC 2', expression: 'F(b)-F(a) = \u222B\u2090\u1D47 f(t)dt', description: 'Net change = definite integral' },
            ]}
          />
        </div>

        {/* Info Panel */}
        <div className="absolute top-3 right-3 mt-10 w-56">
          <InfoPanel
            departmentColor={ACCENT}
            title="Current Values"
            items={[
              { label: 'x', value: xVal.toFixed(3), color: 'white' },
              { label: `f(x) = ${func.label}`, value: fVal.toFixed(4), color: ACCENT },
              { label: 'F(x) = area', value: area.toFixed(4), color: 'rgb(80, 220, 140)' },
              { label: 'F\'(x) approx f(x)', value: fVal.toFixed(4), color: 'rgba(255,255,255,0.6)' },
            ]}
          />
        </div>

        {/* Demo Mode */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <DemoMode
            steps={demoSteps}
            currentStep={demo.currentStep}
            isOpen={demo.isOpen}
            onClose={demo.close}
            onNext={demo.next}
            onPrev={demo.prev}
            onGoToStep={demo.goToStep}
            departmentColor={ACCENT}
            title="FTC Tutorial"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-white/10 bg-black/40 backdrop-blur-sm px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-5">
          <Select
            label="f(t)"
            value={funcKey}
            onChange={v => setFuncKey(v as FuncKey)}
            options={Object.entries(FUNCS).map(([k, v]) => ({ value: k, label: v.label }))}
            className="w-32"
          />

          <Slider
            label={`x = ${xVal.toFixed(2)}`}
            value={xVal}
            onChange={setXVal}
            min={-3}
            max={6.28}
            step={0.01}
          />

          <Toggle label="Auto-animate" value={autoAnimate} onChange={setAutoAnimate} />

          {autoAnimate && (
            <Slider label={`Speed: ${speed.toFixed(1)}x`} value={speed} onChange={setSpeed} min={0.2} max={4} step={0.1} />
          )}

          <button
            onClick={demo.open}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ backgroundColor: `${ACCENT}20`, color: ACCENT }}
          >
            AP Tutorial
          </button>

          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
