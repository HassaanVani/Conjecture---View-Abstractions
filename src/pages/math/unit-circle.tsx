import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type AngleUnit = 'degrees' | 'radians'

const MATH_COLOR = 'rgb(100, 140, 255)'

const SPECIAL_ANGLES_DEG = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360]

function toRad(deg: number): number { return (deg * Math.PI) / 180 }

function formatAngle(deg: number, unit: AngleUnit): string {
  if (unit === 'degrees') return `${deg}\u00B0`
  const frac = deg / 180
  if (frac === 0) return '0'
  if (frac === 1) return '\u03C0'
  if (frac === 2) return '2\u03C0'
  const num = Math.round(frac * 6)
  const den = 6
  const g = gcd(Math.abs(num), den)
  const n = num / g
  const d = den / g
  if (d === 1) return `${n}\u03C0`
  return `${n === 1 ? '' : n === -1 ? '-' : n}\u03C0/${d}`
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export default function UnitCircle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [angle, setAngle] = useState(45)
  const [showSinCos, setShowSinCos] = useState(true)
  const [showTan, setShowTan] = useState(false)
  const [angleUnit, setAngleUnit] = useState<AngleUnit>('degrees')
  const [showSpecialAngles, setShowSpecialAngles] = useState(false)

  const rad = toRad(angle)
  const sinVal = Math.sin(rad)
  const cosVal = Math.cos(rad)
  const tanVal = Math.tan(rad)
  const cscVal = sinVal !== 0 ? 1 / sinVal : Infinity
  const secVal = cosVal !== 0 ? 1 / cosVal : Infinity
  const cotVal = tanVal !== 0 ? 1 / tanVal : Infinity

  const resetAll = useCallback(() => {
    setAngle(45)
    setShowSinCos(true)
    setShowTan(false)
    setShowSpecialAngles(false)
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'The Unit Circle', description: 'A circle with radius 1 centered at the origin. Every point on it can be described as (cos \u03B8, sin \u03B8).', setup: () => { setAngle(0); setShowSinCos(true); setShowTan(false) } },
    { title: 'Sine Function', description: 'sin \u03B8 is the Y-coordinate of the point on the unit circle. It ranges from -1 to 1. Watch the vertical projection.', setup: () => { setAngle(90); setShowSinCos(true) } },
    { title: 'Cosine Function', description: 'cos \u03B8 is the X-coordinate. Together, sin and cos fully describe any angle. Note: cos is just sin shifted by 90\u00B0.', setup: () => { setAngle(0); setShowSinCos(true) } },
    { title: 'Tangent Function', description: 'tan \u03B8 = sin \u03B8 / cos \u03B8. Geometrically, it is the length of the tangent line segment from the point to the x-axis. Undefined at 90\u00B0 and 270\u00B0.', setup: () => { setAngle(45); setShowTan(true) } },
    { title: 'Pythagorean Identity', description: 'sin\u00B2\u03B8 + cos\u00B2\u03B8 = 1 always. This comes directly from the Pythagorean theorem applied to the unit circle triangle.', setup: () => { setAngle(60); setShowSinCos(true) } },
    { title: 'Special Angles', description: 'Memorize values at 0\u00B0, 30\u00B0, 45\u00B0, 60\u00B0, 90\u00B0 and use symmetry for all others. These appear constantly on tests!', setup: () => { setShowSpecialAngles(true); setAngle(30) } },
    { title: 'Radians vs Degrees', description: '180\u00B0 = \u03C0 radians. Radians are the "natural" unit: arc length = radius * angle. Calculus always uses radians.', setup: () => { setAngleUnit('radians'); setAngle(180) } },
    { title: 'All Six Functions', description: 'sin, cos, tan and their reciprocals: csc = 1/sin, sec = 1/cos, cot = 1/tan. Know the domains and ranges!', setup: () => { setAngle(45); setShowSinCos(true); setShowTan(true) } },
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
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0a0e1a'
      ctx.fillRect(0, 0, w, h)

      const cx = w / 2 - 80
      const cy = h / 2
      const R = Math.min(w, h) * 0.3

      // Grid
      ctx.strokeStyle = 'rgba(100,140,255,0.05)'
      ctx.lineWidth = 1
      for (let i = -5; i <= 5; i++) {
        ctx.beginPath()
        ctx.moveTo(cx + i * R / 2, cy - R * 2)
        ctx.lineTo(cx + i * R / 2, cy + R * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx - R * 2, cy + i * R / 2)
        ctx.lineTo(cx + R * 2, cy + i * R / 2)
        ctx.stroke()
      }

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx - R * 1.5, cy)
      ctx.lineTo(cx + R * 1.5, cy)
      ctx.moveTo(cx, cy - R * 1.5)
      ctx.lineTo(cx, cy + R * 1.5)
      ctx.stroke()

      // Axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('1', cx + R, cy + 18)
      ctx.fillText('-1', cx - R, cy + 18)
      ctx.fillText('1', cx + 12, cy - R + 4)
      ctx.fillText('-1', cx + 16, cy + R + 4)

      // Unit circle
      ctx.strokeStyle = 'rgba(100,140,255,0.4)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.stroke()

      // Special angles dots
      if (showSpecialAngles) {
        for (const deg of SPECIAL_ANGLES_DEG) {
          if (deg === 360) continue
          const r = toRad(deg)
          const sx = cx + R * Math.cos(r)
          const sy = cy - R * Math.sin(r)
          ctx.fillStyle = 'rgba(100,140,255,0.4)'
          ctx.beginPath()
          ctx.arc(sx, sy, 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(255,255,255,0.35)'
          ctx.font = '8px monospace'
          const labelR = R + 16
          const lx = cx + labelR * Math.cos(r)
          const ly = cy - labelR * Math.sin(r)
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(formatAngle(deg, angleUnit), lx, ly)
        }
      }

      // Angle arc
      ctx.strokeStyle = 'rgba(100,140,255,0.5)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.15, 0, -rad, rad > 0)
      ctx.stroke()

      // Angle label
      ctx.fillStyle = MATH_COLOR
      ctx.font = '13px system-ui'
      ctx.textAlign = 'left'
      const labelDist = R * 0.22
      ctx.fillText(
        formatAngle(angle, angleUnit),
        cx + labelDist * Math.cos(rad / 2),
        cy - labelDist * Math.sin(rad / 2) + 4
      )

      // Radius line
      const px = cx + R * cosVal
      const py = cy - R * sinVal
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(px, py)
      ctx.stroke()

      // Point on circle
      const glow = ctx.createRadialGradient(px, py, 0, px, py, 20)
      glow.addColorStop(0, 'rgba(100,140,255,0.4)')
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(px, py, 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = MATH_COLOR
      ctx.beginPath()
      ctx.arc(px, py, 6, 0, Math.PI * 2)
      ctx.fill()

      // Coordinate label
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = '11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`(${cosVal.toFixed(3)}, ${sinVal.toFixed(3)})`, px + 12, py - 12)

      // Sin projection (vertical)
      if (showSinCos) {
        ctx.strokeStyle = 'rgba(255,80,80,0.7)'
        ctx.lineWidth = 2.5
        ctx.setLineDash([5, 3])
        ctx.beginPath()
        ctx.moveTo(px, cy)
        ctx.lineTo(px, py)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = 'rgba(255,80,80,0.9)'
        ctx.font = 'bold 12px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText(`sin = ${sinVal.toFixed(3)}`, px + 8, (cy + py) / 2)

        // Cos projection (horizontal)
        ctx.strokeStyle = 'rgba(80,200,120,0.7)'
        ctx.lineWidth = 2.5
        ctx.setLineDash([5, 3])
        ctx.beginPath()
        ctx.moveTo(cx, py)
        ctx.lineTo(px, py)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = 'rgba(80,200,120,0.9)'
        ctx.font = 'bold 12px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(`cos = ${cosVal.toFixed(3)}`, (cx + px) / 2, py + (sinVal >= 0 ? 20 : -10))
      }

      // Tan line
      if (showTan && Math.abs(cosVal) > 0.01) {
        const tanEndY = cy - R * tanVal
        ctx.strokeStyle = 'rgba(255,200,50,0.6)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx + R, cy)
        ctx.lineTo(cx + R, tanEndY)
        ctx.stroke()

        ctx.fillStyle = 'rgba(255,200,50,0.9)'
        ctx.font = 'bold 11px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText(`tan = ${tanVal.toFixed(3)}`, cx + R + 8, (cy + tanEndY) / 2)

        // Dotted line from origin to tan line endpoint
        ctx.strokeStyle = 'rgba(255,200,50,0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + R, tanEndY)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Trig values panel on the right
      const valX = w - 190
      let valY = 100
      const valSpacing = 28
      const funcs = [
        { name: 'sin \u03B8', val: sinVal, color: 'rgba(255,80,80,0.9)' },
        { name: 'cos \u03B8', val: cosVal, color: 'rgba(80,200,120,0.9)' },
        { name: 'tan \u03B8', val: Math.abs(cosVal) > 0.001 ? tanVal : NaN, color: 'rgba(255,200,50,0.9)' },
        { name: 'csc \u03B8', val: Math.abs(sinVal) > 0.001 ? cscVal : NaN, color: 'rgba(255,120,120,0.7)' },
        { name: 'sec \u03B8', val: Math.abs(cosVal) > 0.001 ? secVal : NaN, color: 'rgba(120,220,150,0.7)' },
        { name: 'cot \u03B8', val: Math.abs(sinVal) > 0.001 ? cotVal : NaN, color: 'rgba(255,220,100,0.7)' },
      ]

      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fillRect(valX - 10, valY - 30, 180, funcs.length * valSpacing + 40)
      ctx.fillStyle = 'rgba(100,140,255,0.6)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Trig Values', valX, valY - 12)

      funcs.forEach(f => {
        ctx.fillStyle = f.color
        ctx.font = '12px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(f.name, valX, valY + 4)
        ctx.textAlign = 'right'
        ctx.fillText(isNaN(f.val) ? 'undef' : f.val.toFixed(4), valX + 158, valY + 4)
        valY += valSpacing
      })

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [angle, sinVal, cosVal, tanVal, cscVal, secVal, cotVal, showSinCos, showTan, showSpecialAngles, angleUnit, rad])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a0e1a]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 space-y-3 w-64">
          <APTag course="Precalculus" color={MATH_COLOR} />
          <InfoPanel
            title="Unit Circle"
            departmentColor={MATH_COLOR}
            items={[
              { label: 'Angle', value: formatAngle(angle, angleUnit) },
              { label: 'sin \u03B8', value: sinVal.toFixed(4), color: 'rgb(255,80,80)' },
              { label: 'cos \u03B8', value: cosVal.toFixed(4), color: 'rgb(80,200,120)' },
              { label: 'tan \u03B8', value: Math.abs(cosVal) > 0.001 ? tanVal.toFixed(4) : 'undefined', color: 'rgb(255,200,50)' },
            ]}
          />
          <EquationDisplay
            departmentColor={MATH_COLOR}
            title="Identities"
            equations={[
              { label: 'Pythagorean', expression: 'sin\u00B2\u03B8 + cos\u00B2\u03B8 = 1' },
              { label: 'Tangent', expression: 'tan \u03B8 = sin \u03B8 / cos \u03B8' },
              { label: 'Verify', expression: `${(sinVal * sinVal + cosVal * cosVal).toFixed(6)} = 1` },
            ]}
          />
        </div>

        <div className="absolute top-4 right-4 w-56">
          <ControlPanel>
            <ControlGroup label="Angle">
              <Slider
                value={angle}
                onChange={setAngle}
                min={0}
                max={360}
                step={1}
                label={formatAngle(angle, angleUnit)}
              />
            </ControlGroup>
            <ControlGroup label="Unit">
              <ButtonGroup
                value={angleUnit}
                onChange={v => setAngleUnit(v as AngleUnit)}
                options={[
                  { value: 'degrees', label: 'Degrees' },
                  { value: 'radians', label: 'Radians' },
                ]}
                color={MATH_COLOR}
              />
            </ControlGroup>
            <Toggle value={showSinCos} onChange={setShowSinCos} label="Show Sin/Cos" />
            <Toggle value={showTan} onChange={setShowTan} label="Show Tan" />
            <Toggle value={showSpecialAngles} onChange={setShowSpecialAngles} label="Special Angles" />
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
