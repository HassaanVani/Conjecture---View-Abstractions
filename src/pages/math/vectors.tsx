import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ControlPanel, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type Operation = 'add' | 'subtract' | 'dot' | 'cross' | 'scalar'

const MATH_COLOR = 'rgb(100, 149, 237)'
const COLOR_A = 'rgba(100, 200, 255, 0.9)'
const COLOR_B = 'rgba(255, 160, 100, 0.9)'
const COLOR_R = 'rgba(100, 255, 160, 0.9)'

interface Vec2 {
  x: number
  y: number
}

function vecAdd(a: Vec2, b: Vec2): Vec2 { return { x: a.x + b.x, y: a.y + b.y } }
function vecSub(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y } }
function vecScale(a: Vec2, s: number): Vec2 { return { x: a.x * s, y: a.y * s } }
function vecMag(a: Vec2): number { return Math.sqrt(a.x * a.x + a.y * a.y) }
function vecDot(a: Vec2, b: Vec2): number { return a.x * b.x + a.y * b.y }
function vecCross(a: Vec2, b: Vec2): number { return a.x * b.y - a.y * b.x }
function vecAngle(a: Vec2): number { return Math.atan2(a.y, a.x) * (180 / Math.PI) }
function angleBetween(a: Vec2, b: Vec2): number {
  const magA = vecMag(a)
  const magB = vecMag(b)
  if (magA < 1e-9 || magB < 1e-9) return 0
  const cosTheta = Math.max(-1, Math.min(1, vecDot(a, b) / (magA * magB)))
  return Math.acos(cosTheta) * (180 / Math.PI)
}

export default function Vectors() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)

  const [ax, setAx] = useState(3)
  const [ay, setAy] = useState(2)
  const [bx, setBx] = useState(-1)
  const [by, setBy] = useState(3)
  const [operation, setOperation] = useState<Operation>('add')
  const [scalar, setScalar] = useState(2)
  const [showComponents, setShowComponents] = useState(true)
  const [showAngle, setShowAngle] = useState(true)

  const vecA: Vec2 = { x: ax, y: ay }
  const vecB: Vec2 = { x: bx, y: by }

  const resultVec = (() => {
    switch (operation) {
      case 'add': return vecAdd(vecA, vecB)
      case 'subtract': return vecSub(vecA, vecB)
      case 'scalar': return vecScale(vecA, scalar)
      default: return { x: 0, y: 0 }
    }
  })()

  const dotProduct = vecDot(vecA, vecB)
  const crossProduct = vecCross(vecA, vecB)
  const magA = vecMag(vecA)
  const magB = vecMag(vecB)
  const magR = vecMag(resultVec)
  const angleA = vecAngle(vecA)
  const angleB = vecAngle(vecB)
  const angleAB = angleBetween(vecA, vecB)

  const resetAll = useCallback(() => {
    setAx(3)
    setAy(2)
    setBx(-1)
    setBy(3)
    setOperation('add')
    setScalar(2)
    setShowComponents(true)
    setShowAngle(true)
  }, [])

  const set = (op: Operation, a: Vec2, b: Vec2, k = 2, comp = true, ang = true) => {
    setOperation(op); setAx(a.x); setAy(a.y); setBx(b.x); setBy(b.y)
    setScalar(k); setShowComponents(comp); setShowAngle(ang)
  }

  const demoSteps: DemoStep[] = [
    { title: 'What Are Vectors?', description: 'Vectors have both magnitude (length) and direction. They are represented as arrows in 2D space with components (x, y).', setup: () => set('add', { x: 3, y: 2 }, { x: -1, y: 3 }), highlight: 'Watch the component lines along each axis' },
    { title: 'Vector Addition', description: 'To add vectors, place them tip-to-tail: the result goes from the tail of A to the tip of B. Component-wise: (Ax+Bx, Ay+By).', setup: () => set('add', { x: 3, y: 1 }, { x: 1, y: 3 }), highlight: 'The green vector is the sum A + B' },
    { title: 'Vector Subtraction', description: 'A - B reverses B and adds it to A. The result points from the tip of B to the tip of A.', setup: () => set('subtract', { x: 4, y: 3 }, { x: 1, y: 2 }) },
    { title: 'Dot Product', description: 'A . B = |A||B|cos(theta). It measures how much two vectors point in the same direction. The result is a scalar, not a vector.', setup: () => set('dot', { x: 3, y: 0 }, { x: 2, y: 2 }), highlight: 'Perpendicular vectors have dot product = 0' },
    { title: 'Cross Product (2D)', description: 'In 2D, the cross product gives a scalar: Ax*By - Ay*Bx. Its sign indicates relative orientation (+ is CCW from A to B).', setup: () => set('cross', { x: 3, y: 1 }, { x: -1, y: 3 }) },
    { title: 'Scalar Multiplication', description: 'Multiplying a vector by a scalar changes its magnitude but not direction (negative scalars reverse it).', setup: () => set('scalar', { x: 2, y: 1 }, { x: 0, y: 0 }, 2), highlight: 'Try negative scalar values to reverse the direction' },
    { title: 'Magnitude and Direction', description: '|A| = sqrt(Ax^2 + Ay^2). Direction is theta = atan2(Ay, Ax). These are the polar form of a vector.', setup: () => set('add', { x: 3, y: 4 }, { x: 0, y: 0 }) },
    { title: 'Explore Freely', description: 'Adjust vector components, change operations, and toggle options to build your vector intuition!', setup: () => set('add', { x: 3, y: 2 }, { x: -1, y: 3 }) },
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

    const drawArrow = (
      fromX: number, fromY: number, toX: number, toY: number,
      color: string, lineWidth: number, dashed: boolean,
    ) => {
      const dx = toX - fromX
      const dy = toY - fromY
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < 2) return
      const headLen = Math.min(12, len * 0.3)

      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = lineWidth
      if (dashed) ctx.setLineDash([5, 4])
      else ctx.setLineDash([])

      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      ctx.lineTo(toX, toY)
      ctx.stroke()
      ctx.setLineDash([])

      const a = Math.atan2(dy, dx)
      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(toX - headLen * Math.cos(a - 0.35), toY - headLen * Math.sin(a - 0.35))
      ctx.lineTo(toX - headLen * Math.cos(a + 0.35), toY - headLen * Math.sin(a + 0.35))
      ctx.closePath()
      ctx.fill()
    }

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0a0e1a'
      ctx.fillRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2
      const gridUnit = Math.min(w, h) / 14

      // Grid lines
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.06)'
      ctx.lineWidth = 1
      for (let i = -7; i <= 7; i++) {
        ctx.beginPath()
        ctx.moveTo(cx + i * gridUnit, 0)
        ctx.lineTo(cx + i * gridUnit, h)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, cy + i * gridUnit)
        ctx.lineTo(w, cy + i * gridUnit)
        ctx.stroke()
      }

      // Axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, cy)
      ctx.lineTo(w, cy)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, 0)
      ctx.lineTo(cx, h)
      ctx.stroke()

      // Axis labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.font = '10px system-ui'
      ctx.textAlign = 'center'
      for (let i = -6; i <= 6; i++) {
        if (i === 0) continue
        ctx.fillText(String(i), cx + i * gridUnit, cy + 14)
        ctx.fillText(String(-i), cx - 12, cy + i * gridUnit + 4)
      }

      const toScreenX = (vx: number) => cx + vx * gridUnit
      const toScreenY = (vy: number) => cy - vy * gridUnit

      // Component decomposition lines
      if (showComponents) {
        const drawComp = (vx: number, vy: number, col: string) => {
          ctx.setLineDash([4, 3]); ctx.lineWidth = 1; ctx.strokeStyle = col
          ctx.beginPath(); ctx.moveTo(toScreenX(vx), toScreenY(0)); ctx.lineTo(toScreenX(vx), toScreenY(vy)); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(toScreenX(0), toScreenY(vy)); ctx.lineTo(toScreenX(vx), toScreenY(vy)); ctx.stroke()
          ctx.setLineDash([])
        }
        drawComp(ax, ay, 'rgba(100, 200, 255, 0.3)')
        if (operation !== 'scalar') drawComp(bx, by, 'rgba(255, 160, 100, 0.3)')
      }

      // Angle arc between vectors
      if (showAngle && operation !== 'scalar' && magA > 0.1 && magB > 0.1) {
        const arcRadius = gridUnit * 0.7
        const startAngle = -Math.atan2(ay, ax)
        const endAngle = -Math.atan2(by, bx)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(cx, cy, arcRadius, startAngle, endAngle, crossProduct > 0)
        ctx.stroke()

        // Angle label
        const midAngle = (Math.atan2(ay, ax) + Math.atan2(by, bx)) / 2
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.font = '11px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(
          `${angleAB.toFixed(1)}\u00B0`,
          cx + (arcRadius + 16) * Math.cos(midAngle),
          cy - (arcRadius + 16) * Math.sin(midAngle),
        )
      }

      // Draw Vector A
      drawArrow(cx, cy, toScreenX(ax), toScreenY(ay), COLOR_A, 2.5, false)
      // Label A
      ctx.fillStyle = COLOR_A
      ctx.font = 'bold 13px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('A', toScreenX(ax) + 8, toScreenY(ay) - 8)

      if (operation !== 'scalar') {
        // Draw Vector B
        drawArrow(cx, cy, toScreenX(bx), toScreenY(by), COLOR_B, 2.5, false)
        // Label B
        ctx.fillStyle = COLOR_B
        ctx.font = 'bold 13px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText('B', toScreenX(bx) + 8, toScreenY(by) - 8)
      }

      // Draw result based on operation
      if (operation === 'add') {
        // Show tip-to-tail: translate B to tip of A
        drawArrow(
          toScreenX(ax), toScreenY(ay),
          toScreenX(ax + bx), toScreenY(ay + by),
          'rgba(255, 160, 100, 0.4)', 1.5, true,
        )
        // Result vector
        drawArrow(cx, cy, toScreenX(resultVec.x), toScreenY(resultVec.y), COLOR_R, 3, false)
        ctx.fillStyle = COLOR_R
        ctx.font = 'bold 13px system-ui'
        ctx.fillText('A+B', toScreenX(resultVec.x) + 8, toScreenY(resultVec.y) - 8)
      } else if (operation === 'subtract') {
        // Show -B from tip of A
        drawArrow(
          toScreenX(ax), toScreenY(ay),
          toScreenX(ax - bx), toScreenY(ay - by),
          'rgba(255, 160, 100, 0.4)', 1.5, true,
        )
        drawArrow(cx, cy, toScreenX(resultVec.x), toScreenY(resultVec.y), COLOR_R, 3, false)
        ctx.fillStyle = COLOR_R
        ctx.font = 'bold 13px system-ui'
        ctx.fillText('A-B', toScreenX(resultVec.x) + 8, toScreenY(resultVec.y) - 8)
      } else if (operation === 'dot') {
        // Project A onto B
        if (magB > 0.1) {
          const projScalar = dotProduct / (magB * magB)
          const projVec = vecScale(vecB, projScalar)
          ctx.setLineDash([3, 3])
          ctx.strokeStyle = 'rgba(100, 255, 160, 0.4)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(toScreenX(ax), toScreenY(ay))
          ctx.lineTo(toScreenX(projVec.x), toScreenY(projVec.y))
          ctx.stroke()
          ctx.setLineDash([])

          drawArrow(cx, cy, toScreenX(projVec.x), toScreenY(projVec.y), COLOR_R, 2.5, false)
          ctx.fillStyle = COLOR_R
          ctx.font = 'bold 12px system-ui'
          ctx.fillText('proj', toScreenX(projVec.x) + 8, toScreenY(projVec.y) - 8)
        }

        // Show dot product value on canvas
        ctx.fillStyle = COLOR_R
        ctx.font = 'bold 16px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`A \u00B7 B = ${dotProduct.toFixed(2)}`, 16, 30)
      } else if (operation === 'cross') {
        // Shade the parallelogram formed by A and B
        ctx.fillStyle = 'rgba(100, 255, 160, 0.08)'
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(toScreenX(ax), toScreenY(ay))
        ctx.lineTo(toScreenX(ax + bx), toScreenY(ay + by))
        ctx.lineTo(toScreenX(bx), toScreenY(by))
        ctx.closePath()
        ctx.fill()

        ctx.strokeStyle = 'rgba(100, 255, 160, 0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(toScreenX(ax), toScreenY(ay))
        ctx.lineTo(toScreenX(ax + bx), toScreenY(ay + by))
        ctx.lineTo(toScreenX(bx), toScreenY(by))
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = COLOR_R
        ctx.font = 'bold 16px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`A \u00D7 B = ${crossProduct.toFixed(2)}`, 16, 30)
        ctx.font = '12px system-ui'
        ctx.fillStyle = 'rgba(100, 255, 160, 0.6)'
        ctx.fillText(`(parallelogram area = ${Math.abs(crossProduct).toFixed(2)})`, 16, 50)
      } else if (operation === 'scalar') {
        drawArrow(cx, cy, toScreenX(resultVec.x), toScreenY(resultVec.y), COLOR_R, 3, false)
        ctx.fillStyle = COLOR_R
        ctx.font = 'bold 13px system-ui'
        ctx.fillText(`${scalar}A`, toScreenX(resultVec.x) + 8, toScreenY(resultVec.y) - 8)
      }

      // Point glow at vector tips
      const drawGlow = (sx: number, sy: number, color: string) => {
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 14)
        glow.addColorStop(0, color.replace('0.9', '0.35'))
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(sx, sy, 14, 0, Math.PI * 2)
        ctx.fill()
      }
      drawGlow(toScreenX(ax), toScreenY(ay), COLOR_A)
      if (operation !== 'scalar') drawGlow(toScreenX(bx), toScreenY(by), COLOR_B)
      if (operation === 'add' || operation === 'subtract' || operation === 'scalar') {
        drawGlow(toScreenX(resultVec.x), toScreenY(resultVec.y), COLOR_R)
      }

      // Coordinate labels at tips
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = 'rgba(100, 200, 255, 0.7)'
      ctx.fillText(`(${ax}, ${ay})`, toScreenX(ax) + 8, toScreenY(ay) + 16)
      if (operation !== 'scalar') {
        ctx.fillStyle = 'rgba(255, 160, 100, 0.7)'
        ctx.fillText(`(${bx}, ${by})`, toScreenX(bx) + 8, toScreenY(by) + 16)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [ax, ay, bx, by, operation, scalar, showComponents, showAngle,
      resultVec.x, resultVec.y, dotProduct, crossProduct, magA, magB, angleAB])

  const equationMap: Record<Operation, { label: string; expression: string; description?: string }[]> = {
    add: [
      { label: 'Sum', expression: `A + B = (${ax}+${bx}, ${ay}+${by}) = (${resultVec.x}, ${resultVec.y})` },
      { label: 'Rule', expression: '(Ax+Bx, Ay+By)', description: 'Component-wise addition' },
    ],
    subtract: [
      { label: 'Diff', expression: `A - B = (${ax}-${bx}, ${ay}-${by}) = (${resultVec.x}, ${resultVec.y})` },
      { label: 'Rule', expression: '(Ax-Bx, Ay-By)', description: 'Component-wise subtraction' },
    ],
    dot: [
      { label: 'Dot', expression: `A \u00B7 B = ${ax}*${bx} + ${ay}*${by} = ${dotProduct}` },
      { label: 'Alt', expression: '|A||B|cos\u03B8', description: 'Geometric definition' },
    ],
    cross: [
      { label: 'Cross', expression: `A \u00D7 B = ${ax}*${by} - ${ay}*${bx} = ${crossProduct}` },
      { label: 'Area', expression: `|A \u00D7 B| = ${Math.abs(crossProduct).toFixed(2)}`, description: 'Parallelogram area' },
    ],
    scalar: [
      { label: 'Scale', expression: `${scalar}A = (${resultVec.x}, ${resultVec.y})` },
      { label: 'Rule', expression: 'kA = (k*Ax, k*Ay)', description: 'Scale each component' },
    ],
  }
  const equations = equationMap[operation]

  const infoItems = [
    { label: '|A|', value: magA.toFixed(3), color: 'rgb(100, 200, 255)' },
    { label: '\u2220 A', value: `${angleA.toFixed(1)}\u00B0`, color: 'rgb(100, 200, 255)' },
    ...(operation !== 'scalar' ? [
      { label: '|B|', value: magB.toFixed(3), color: 'rgb(255, 160, 100)' },
      { label: '\u2220 B', value: `${angleB.toFixed(1)}\u00B0`, color: 'rgb(255, 160, 100)' },
      { label: '\u2220(A,B)', value: `${angleAB.toFixed(1)}\u00B0`, color: 'white' },
    ] : []),
    ...(operation === 'add' || operation === 'subtract' || operation === 'scalar' ? [
      { label: '|R|', value: magR.toFixed(3), color: 'rgb(100, 255, 160)' },
    ] : []),
    ...(operation === 'dot' ? [
      { label: 'A \u00B7 B', value: dotProduct.toFixed(2), color: 'rgb(100, 255, 160)' },
    ] : []),
    ...(operation === 'cross' ? [
      { label: 'A \u00D7 B', value: crossProduct.toFixed(2), color: 'rgb(100, 255, 160)' },
    ] : []),
  ]

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a0e1a]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-medium text-white/90">Vectors in 2D</h1>
          <APTag course="Precalculus" unit="Vectors" color={MATH_COLOR} />
        </div>
        <Button onClick={demo.open} className="text-xs">AP Tutorial</Button>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 relative">
          <canvas ref={canvasRef} className="w-full h-full block" />

          <div className="absolute top-4 left-4 space-y-3 max-w-xs z-10">
            <EquationDisplay
              equations={equations}
              departmentColor={MATH_COLOR}
              title="Vector Operations"
            />
          </div>

          <div className="absolute top-4 right-[calc(18rem+1rem)] min-w-[180px] z-10">
            <InfoPanel
              title="Properties"
              departmentColor={MATH_COLOR}
              items={infoItems}
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
            <DemoMode
              steps={demoSteps}
              currentStep={demo.currentStep}
              isOpen={demo.isOpen}
              onClose={demo.close}
              onNext={demo.next}
              onPrev={demo.prev}
              onGoToStep={demo.goToStep}
              departmentColor={MATH_COLOR}
              title="Vectors Tutorial"
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-72 bg-black/30 border-l border-white/10 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto">
          <ControlPanel className="!p-0 !bg-transparent !border-0 !backdrop-blur-0">
            <ButtonGroup
              label="Operation"
              value={operation}
              onChange={v => setOperation(v as Operation)}
              options={[
                { value: 'add', label: 'Add' },
                { value: 'subtract', label: 'Sub' },
                { value: 'dot', label: 'Dot' },
                { value: 'cross', label: 'Cross' },
                { value: 'scalar', label: 'Scale' },
              ]}
              color={MATH_COLOR}
            />
          </ControlPanel>

          {/* Vector A controls */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <h4 className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: 'rgb(100, 200, 255)' }}>
              Vector A
            </h4>
            <div className="space-y-3">
              <Slider label="Ax" value={ax} onChange={setAx} min={-6} max={6} step={0.5} />
              <Slider label="Ay" value={ay} onChange={setAy} min={-6} max={6} step={0.5} />
            </div>
          </div>

          {/* Vector B controls */}
          {operation !== 'scalar' && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <h4 className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: 'rgb(255, 160, 100)' }}>
                Vector B
              </h4>
              <div className="space-y-3">
                <Slider label="Bx" value={bx} onChange={setBx} min={-6} max={6} step={0.5} />
                <Slider label="By" value={by} onChange={setBy} min={-6} max={6} step={0.5} />
              </div>
            </div>
          )}

          {/* Scalar control */}
          {operation === 'scalar' && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <h4 className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: COLOR_R }}>
                Scalar
              </h4>
              <Slider label="k" value={scalar} onChange={setScalar} min={-3} max={3} step={0.25} />
            </div>
          )}

          <ControlPanel className="!p-0 !bg-transparent !border-0 !backdrop-blur-0">
            <Toggle label="Show Components" value={showComponents} onChange={setShowComponents} />
            <Toggle label="Show Angle" value={showAngle} onChange={setShowAngle} />
          </ControlPanel>

          <div className="flex flex-col gap-2">
            <Button onClick={resetAll} variant="secondary" className="w-full">Reset</Button>
          </div>

          {/* Quick reference */}
          <div className="mt-auto p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <h4 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Legend</h4>
            <ul className="text-xs text-white/50 space-y-1.5 leading-relaxed">
              <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(100, 200, 255)' }} />Vector A (blue)</li>
              <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(255, 160, 100)' }} />Vector B (orange)</li>
              <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(100, 255, 160)' }} />Result (green)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
