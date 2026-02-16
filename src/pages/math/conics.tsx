import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Toggle, Select } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type ConicType = 'circle' | 'ellipse' | 'parabola' | 'hyperbola'

const MATH_COLOR = 'rgb(100, 140, 255)'

export default function Conics() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [conicType, setConicType] = useState<ConicType>('ellipse')
  const [a, setA] = useState(3)
  const [b, setB] = useState(2)
  const [h, setH] = useState(0)
  const [k, setK] = useState(0)
  const [showFoci, setShowFoci] = useState(true)
  const [showDirectrix, setShowDirectrix] = useState(false)

  const eccentricity = useCallback((): number => {
    if (conicType === 'circle') return 0
    if (conicType === 'ellipse') {
      const major = Math.max(a, b)
      const minor = Math.min(a, b)
      return Math.sqrt(1 - (minor * minor) / (major * major))
    }
    if (conicType === 'parabola') return 1
    // hyperbola
    return Math.sqrt(1 + (b * b) / (a * a))
  }, [conicType, a, b])

  const getEquation = useCallback((): string => {
    const hStr = h === 0 ? 'x' : h > 0 ? `(x - ${h})` : `(x + ${-h})`
    const kStr = k === 0 ? 'y' : k > 0 ? `(y - ${k})` : `(y + ${-k})`
    if (conicType === 'circle') return `${hStr}\u00B2 + ${kStr}\u00B2 = ${a}\u00B2`
    if (conicType === 'ellipse') return `${hStr}\u00B2/${a}\u00B2 + ${kStr}\u00B2/${b}\u00B2 = 1`
    if (conicType === 'parabola') return `${kStr} = (1/${(4 * a).toFixed(1)})${hStr}\u00B2`
    return `${hStr}\u00B2/${a}\u00B2 - ${kStr}\u00B2/${b}\u00B2 = 1`
  }, [conicType, a, b, h, k])

  const resetAll = useCallback(() => {
    setA(3); setB(2); setH(0); setK(0)
    setShowFoci(true); setShowDirectrix(false)
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'Conic Sections', description: 'Conics are curves formed by intersecting a cone with a plane. The angle of the plane determines the shape: circle, ellipse, parabola, or hyperbola.', setup: () => { setConicType('ellipse'); resetAll() } },
    { title: 'Circle', description: 'A circle is the set of all points equidistant from the center. Eccentricity = 0. Equation: (x-h)\u00B2 + (y-k)\u00B2 = r\u00B2.', setup: () => { setConicType('circle'); setA(3) } },
    { title: 'Ellipse', description: 'An ellipse has two foci. The sum of distances from any point to both foci is constant (= 2a). Eccentricity is between 0 and 1.', setup: () => { setConicType('ellipse'); setA(4); setB(2); setShowFoci(true) } },
    { title: 'Parabola', description: 'A parabola has one focus and one directrix. Every point is equidistant from both. Eccentricity = 1. Used in satellite dishes!', setup: () => { setConicType('parabola'); setA(2); setShowFoci(true); setShowDirectrix(true) } },
    { title: 'Hyperbola', description: 'A hyperbola has two branches. The DIFFERENCE of distances to the two foci is constant. Eccentricity > 1. Has asymptotes!', setup: () => { setConicType('hyperbola'); setA(3); setB(2); setShowFoci(true) } },
    { title: 'Eccentricity', description: 'Eccentricity (e) measures how "stretched" a conic is. Circle: e=0, Ellipse: 0<e<1, Parabola: e=1, Hyperbola: e>1.', setup: () => { setConicType('ellipse'); setA(4); setB(1) } },
    { title: 'Foci and Directrix', description: 'Foci are special points that define the conic. The directrix is a line. The ratio distance-to-focus / distance-to-directrix = eccentricity.', setup: () => { setConicType('parabola'); setShowFoci(true); setShowDirectrix(true) } },
    { title: 'Translations', description: 'The center (h, k) shifts the conic. Replace x with (x-h) and y with (y-k). The shape stays the same, just moves.', setup: () => { setConicType('ellipse'); setH(2); setK(1) } },
  ]

  const demo = useDemoMode(demoSteps)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const w = canvas.offsetWidth
      const ht = canvas.offsetHeight
      ctx.clearRect(0, 0, w, ht)
      ctx.fillStyle = '#0a0e1a'
      ctx.fillRect(0, 0, w, ht)

      const cx = w / 2
      const cy = ht / 2
      const scale = Math.min(w, ht) / 16

      const toX = (x: number) => cx + x * scale
      const toY = (y: number) => cy - y * scale

      // Grid
      ctx.strokeStyle = 'rgba(100,140,255,0.05)'
      ctx.lineWidth = 1
      for (let i = -10; i <= 10; i++) {
        ctx.beginPath()
        ctx.moveTo(toX(i), 0)
        ctx.lineTo(toX(i), ht)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, toY(i))
        ctx.lineTo(w, toY(i))
        ctx.stroke()
      }

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, toY(0))
      ctx.lineTo(w, toY(0))
      ctx.moveTo(toX(0), 0)
      ctx.lineTo(toX(0), ht)
      ctx.stroke()

      // Tick marks
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      for (let i = -6; i <= 6; i++) {
        if (i === 0) continue
        ctx.fillText(String(i), toX(i), toY(0) + 14)
        ctx.textAlign = 'right'
        ctx.fillText(String(i), toX(0) - 6, toY(i) + 3)
        ctx.textAlign = 'center'
      }

      // Draw the conic
      ctx.strokeStyle = MATH_COLOR
      ctx.lineWidth = 2.5
      ctx.beginPath()

      if (conicType === 'circle') {
        ctx.arc(toX(h), toY(k), a * scale, 0, Math.PI * 2)
        ctx.stroke()

        // Center dot
        if (showFoci) {
          ctx.fillStyle = 'rgba(255,200,80,0.9)'
          ctx.beginPath()
          ctx.arc(toX(h), toY(k), 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(255,255,255,0.5)'
          ctx.font = '10px system-ui'
          ctx.textAlign = 'left'
          ctx.fillText('center', toX(h) + 10, toY(k) - 5)
        }
      } else if (conicType === 'ellipse') {
        for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.02) {
          const ex = h + a * Math.cos(t)
          const ey = k + b * Math.sin(t)
          if (t === 0) ctx.moveTo(toX(ex), toY(ey))
          else ctx.lineTo(toX(ex), toY(ey))
        }
        ctx.stroke()

        if (showFoci) {
          const c = Math.sqrt(Math.abs(a * a - b * b))
          const isHorizontal = a >= b
          const f1x = isHorizontal ? h + c : h
          const f1y = isHorizontal ? k : k + c
          const f2x = isHorizontal ? h - c : h
          const f2y = isHorizontal ? k : k - c

          ctx.fillStyle = 'rgba(255,200,80,0.9)'
          ctx.beginPath()
          ctx.arc(toX(f1x), toY(f1y), 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(toX(f2x), toY(f2y), 5, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = 'rgba(255,255,255,0.5)'
          ctx.font = '10px system-ui'
          ctx.textAlign = 'left'
          ctx.fillText('F1', toX(f1x) + 8, toY(f1y) - 5)
          ctx.fillText('F2', toX(f2x) + 8, toY(f2y) - 5)
        }
      } else if (conicType === 'parabola') {
        for (let t = -6; t <= 6; t += 0.05) {
          const px = h + t
          const py = k + t * t / (4 * a)
          if (t === -6) ctx.moveTo(toX(px), toY(py))
          else ctx.lineTo(toX(px), toY(py))
        }
        ctx.stroke()

        if (showFoci) {
          ctx.fillStyle = 'rgba(255,200,80,0.9)'
          ctx.beginPath()
          ctx.arc(toX(h), toY(k + a), 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(255,255,255,0.5)'
          ctx.font = '10px system-ui'
          ctx.textAlign = 'left'
          ctx.fillText('Focus', toX(h) + 10, toY(k + a) - 5)
        }

        if (showDirectrix) {
          ctx.strokeStyle = 'rgba(255,100,100,0.5)'
          ctx.lineWidth = 1.5
          ctx.setLineDash([6, 4])
          ctx.beginPath()
          ctx.moveTo(0, toY(k - a))
          ctx.lineTo(w, toY(k - a))
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = 'rgba(255,100,100,0.7)'
          ctx.font = '10px system-ui'
          ctx.textAlign = 'left'
          ctx.fillText('Directrix', 10, toY(k - a) - 8)
        }
      } else {
        // Hyperbola: two branches
        // Right branch
        ctx.beginPath()
        for (let t = -3; t <= 3; t += 0.02) {
          const hx = h + a / Math.cos(t)
          const hy = k + b * Math.tan(t)
          if (Math.abs(hx - h) > 8 || Math.abs(hy - k) > 8) continue
          if (hx - h > 0) {
            ctx.lineTo(toX(hx), toY(hy))
          }
        }
        ctx.stroke()
        // Left branch
        ctx.beginPath()
        for (let t = -3; t <= 3; t += 0.02) {
          const hx = h - a / Math.cos(t)
          const hy = k - b * Math.tan(t)
          if (Math.abs(hx - h) > 8 || Math.abs(hy - k) > 8) continue
          if (hx - h < 0) {
            ctx.lineTo(toX(hx), toY(hy))
          }
        }
        ctx.stroke()

        // Asymptotes
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.lineWidth = 1
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(toX(h - 8), toY(k - 8 * b / a))
        ctx.lineTo(toX(h + 8), toY(k + 8 * b / a))
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(toX(h - 8), toY(k + 8 * b / a))
        ctx.lineTo(toX(h + 8), toY(k - 8 * b / a))
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.font = '9px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText(`y = \u00B1(${b}/${a})x`, toX(h + 5), toY(k + 5 * b / a))

        if (showFoci) {
          const c = Math.sqrt(a * a + b * b)
          ctx.fillStyle = 'rgba(255,200,80,0.9)'
          ctx.beginPath()
          ctx.arc(toX(h + c), toY(k), 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(toX(h - c), toY(k), 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(255,255,255,0.5)'
          ctx.font = '10px system-ui'
          ctx.textAlign = 'left'
          ctx.fillText('F1', toX(h + c) + 8, toY(k) - 5)
          ctx.fillText('F2', toX(h - c) + 8, toY(k) - 5)
        }

        if (showDirectrix) {
          const c = Math.sqrt(a * a + b * b)
          const dVal = a * a / c
          ctx.strokeStyle = 'rgba(255,100,100,0.5)'
          ctx.lineWidth = 1.5
          ctx.setLineDash([6, 4])
          ctx.beginPath()
          ctx.moveTo(toX(h + dVal), 0)
          ctx.lineTo(toX(h + dVal), ht)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(toX(h - dVal), 0)
          ctx.lineTo(toX(h - dVal), ht)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // Eccentricity display
      ctx.fillStyle = 'rgba(100,140,255,0.7)'
      ctx.font = '13px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`e = ${eccentricity().toFixed(4)}`, 20, ht - 20)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [conicType, a, b, h, k, showFoci, showDirectrix, eccentricity])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a0e1a]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 space-y-3 w-64">
          <APTag course="Precalculus" color={MATH_COLOR} />
          <InfoPanel
            title="Conic Section"
            departmentColor={MATH_COLOR}
            items={[
              { label: 'Type', value: conicType.charAt(0).toUpperCase() + conicType.slice(1) },
              { label: 'Eccentricity', value: eccentricity().toFixed(4) },
              { label: 'a', value: a },
              { label: 'b', value: b },
              { label: 'Center', value: `(${h}, ${k})` },
            ]}
          />
          <EquationDisplay
            departmentColor={MATH_COLOR}
            title="Standard Form"
            equations={[
              { label: conicType, expression: getEquation() },
              ...(conicType === 'ellipse' ? [
                { label: 'Foci dist', expression: `c = ${Math.sqrt(Math.abs(a * a - b * b)).toFixed(2)}` },
              ] : []),
              ...(conicType === 'hyperbola' ? [
                { label: 'Asymptotes', expression: `y = \u00B1(${b}/${a})(x - ${h}) + ${k}` },
              ] : []),
              ...(conicType === 'parabola' ? [
                { label: 'Focus', expression: `(${h}, ${(k + a).toFixed(1)})` },
                { label: 'Directrix', expression: `y = ${(k - a).toFixed(1)}` },
              ] : []),
            ]}
          />
        </div>

        <div className="absolute top-4 right-4 w-56">
          <ControlPanel>
            <ControlGroup label="Conic Type">
              <Select
                value={conicType}
                onChange={v => setConicType(v as ConicType)}
                options={[
                  { value: 'circle', label: 'Circle' },
                  { value: 'ellipse', label: 'Ellipse' },
                  { value: 'parabola', label: 'Parabola' },
                  { value: 'hyperbola', label: 'Hyperbola' },
                ]}
              />
            </ControlGroup>
            <ControlGroup label="Semi-major (a)">
              <Slider value={a} onChange={setA} min={0.5} max={6} step={0.5} label={`a = ${a}`} />
            </ControlGroup>
            {conicType !== 'circle' && conicType !== 'parabola' && (
              <ControlGroup label="Semi-minor (b)">
                <Slider value={b} onChange={setB} min={0.5} max={6} step={0.5} label={`b = ${b}`} />
              </ControlGroup>
            )}
            <ControlGroup label="Center h">
              <Slider value={h} onChange={setH} min={-4} max={4} step={0.5} label={`h = ${h}`} />
            </ControlGroup>
            <ControlGroup label="Center k">
              <Slider value={k} onChange={setK} min={-4} max={4} step={0.5} label={`k = ${k}`} />
            </ControlGroup>
            <Toggle value={showFoci} onChange={setShowFoci} label="Show Foci" />
            <Toggle value={showDirectrix} onChange={setShowDirectrix} label="Show Directrix" />
            <button
              onClick={resetAll}
              className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 transition-colors border border-white/10"
            >
              Reset
            </button>
            <button
              onClick={demo.open}
              className="w-full px-3 py-2 rounded-lg text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors border border-blue-500/20"
            >
              AP Tutorial
            </button>
          </ControlPanel>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <DemoMode
            steps={demoSteps}
            currentStep={demo.currentStep}
            isOpen={demo.isOpen}
            onClose={demo.close}
            onNext={demo.next}
            onPrev={demo.prev}
            onGoToStep={demo.goToStep}
            departmentColor={MATH_COLOR}
          />
        </div>
      </div>
    </div>
  )
}
