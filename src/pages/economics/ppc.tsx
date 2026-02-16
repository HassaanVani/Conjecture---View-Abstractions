import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'
import { Slider, Button, Toggle } from '@/components/control-panel'

interface Point { x: number; y: number }

const ECON_COLOR = 'rgb(220, 180, 80)'

export default function ProductionPossibilities() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [curvePoints, setCurvePoints] = useState<Point[]>([])
    const [selectedPoint, setSelectedPoint] = useState<Point>({ x: 60, y: 60 })
    const [shiftFactor, setShiftFactor] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [showGrowthAnimation, setShowGrowthAnimation] = useState(false)
    const [growthFrame, setGrowthFrame] = useState(0)
    const goodA = 'Consumer Goods'
    const goodB = 'Capital Goods'

    const generateCurve = useCallback((shift: number) => {
        const points: Point[] = []
        const scale = 1 + shift * 0.3
        for (let t = 0; t <= 1; t += 0.01) {
            const angle = (Math.PI / 2) * t
            const x = Math.cos(angle) * 100 * scale
            const y = Math.sin(angle) * 100 * scale
            if (x >= 0 && y >= 0 && x <= 120 && y <= 120) points.push({ x, y })
        }
        return points
    }, [])

    useEffect(() => { setCurvePoints(generateCurve(shiftFactor)) }, [shiftFactor, generateCurve])

    useEffect(() => {
        if (!showGrowthAnimation) return
        const id = setInterval(() => {
            setGrowthFrame(f => {
                if (f >= 40) { setShowGrowthAnimation(false); return 0 }
                setShiftFactor(Math.sin((f / 40) * Math.PI) * 0.6)
                return f + 1
            })
        }, 80)
        return () => clearInterval(id)
    }, [showGrowthAnimation])

    const getClosestCurvePoint = useCallback((tx: number, ty: number): Point => {
        if (curvePoints.length === 0) return { x: 50, y: 50 }
        let closest = curvePoints[0], minDist = Infinity
        for (const p of curvePoints) {
            const d = Math.sqrt((p.x - tx) ** 2 + (p.y - ty) ** 2)
            if (d < minDist) { minDist = d; closest = p }
        }
        return closest
    }, [curvePoints])

    const getOpportunityCost = useCallback(() => {
        const closest = getClosestCurvePoint(selectedPoint.x, selectedPoint.y)
        const idx = curvePoints.findIndex(p => p.x === closest.x && p.y === closest.y)
        if (idx <= 0 || idx >= curvePoints.length - 1) return { costA: '0', costB: '0' }
        const p1 = curvePoints[idx - 1], p2 = curvePoints[idx + 1]
        const dY = p2.y - p1.y, dX = p2.x - p1.x
        if (Math.abs(dX) < 0.01) return { costA: 'Inf', costB: '0' }
        if (Math.abs(dY) < 0.01) return { costA: '0', costB: 'Inf' }
        const slope = Math.abs(dY / dX)
        return { costA: slope.toFixed(2), costB: (1 / slope).toFixed(2) }
    }, [curvePoints, selectedPoint, getClosestCurvePoint])

    const getPointStatus = useCallback(() => {
        if (curvePoints.length === 0) return 'loading'
        const closest = getClosestCurvePoint(selectedPoint.x, selectedPoint.y)
        const dist = Math.sqrt((selectedPoint.x - closest.x) ** 2 + (selectedPoint.y - closest.y) ** 2)
        if (dist < 4) return 'efficient'
        const od = Math.sqrt(selectedPoint.x ** 2 + selectedPoint.y ** 2)
        const cd = Math.sqrt(closest.x ** 2 + closest.y ** 2)
        return od < cd - 2 ? 'inefficient' : 'unattainable'
    }, [curvePoints, selectedPoint, getClosestCurvePoint])

    const demoSteps: DemoStep[] = [
        { title: 'Production Possibilities Curve', description: 'The PPC shows all combinations of two goods an economy can produce with available resources. Points ON the curve are productively efficient.', setup: () => { setShiftFactor(0); setSelectedPoint({ x: 60, y: 60 }) } },
        { title: 'Efficient Production', description: 'Points on the curve use ALL resources fully. No waste, no idle workers, no unused factories.', highlight: 'Look for the green "Efficient" label', setup: () => { const c = getClosestCurvePoint(70, 70); setSelectedPoint(c) } },
        { title: 'Inefficient Production', description: 'Points INSIDE the curve mean unemployment or underutilization. The economy could produce more of BOTH goods.', highlight: 'The orange point is inside the frontier', setup: () => setSelectedPoint({ x: 40, y: 40 }) },
        { title: 'Unattainable Points', description: 'Points OUTSIDE the curve are impossible with current resources and technology. Growth is needed to reach them.', setup: () => setSelectedPoint({ x: 85, y: 85 }) },
        { title: 'Opportunity Cost', description: 'Moving along the curve shows tradeoffs. To get more of Good A, you must give up some of Good B. The bowed shape reflects INCREASING opportunity cost.', setup: () => { const c = getClosestCurvePoint(30, 95); setSelectedPoint(c) } },
        { title: 'Economic Growth', description: 'More resources or better technology shifts the entire curve OUTWARD. Previously unattainable points become possible!', highlight: 'Watch the curve shift outward', setup: () => { setShowGrowthAnimation(true); setGrowthFrame(0) } },
        { title: 'Opportunity Cost Calculator', description: 'The info panel shows the marginal opportunity cost at your current point. Notice it INCREASES as you specialize more in one good (law of increasing opportunity cost).', setup: () => { const c = getClosestCurvePoint(90, 30); setSelectedPoint(c) } },
        { title: 'Try It Yourself!', description: 'Click anywhere to move the production point. Use the growth slider to shift the curve. Snap to the frontier to see efficient production.', setup: () => { setShiftFactor(0); setSelectedPoint({ x: 60, y: 60 }) } },
    ]

    const demo = useDemoMode(demoSteps)
    const status = getPointStatus()
    const costs = getOpportunityCost()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const dpr = window.devicePixelRatio || 1
        const resize = () => { canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
        resize()
        window.addEventListener('resize', resize)
        const w = canvas.offsetWidth, h = canvas.offsetHeight, pad = 80
        const gs = Math.min(w - pad * 2, h - pad * 2 - 60)
        const ox = pad, oy = h - pad - 40
        ctx.fillStyle = '#1a150a'; ctx.fillRect(0, 0, w, h)
        const tX = (x: number) => ox + (x / 100) * gs
        const tY = (y: number) => oy - (y / 100) * gs

        // Grid
        ctx.strokeStyle = 'rgba(220,180,80,0.08)'; ctx.lineWidth = 1
        for (let i = 0; i <= 100; i += 10) {
            ctx.beginPath(); ctx.moveTo(tX(i), tY(0)); ctx.lineTo(tX(i), tY(100)); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(tX(0), tY(i)); ctx.lineTo(tX(100), tY(i)); ctx.stroke()
        }
        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.6)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(ox, tY(100)); ctx.lineTo(ox, oy); ctx.lineTo(tX(100), oy); ctx.stroke()
        ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '14px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(goodA, ox + gs / 2, oy + 35)
        ctx.save(); ctx.translate(ox - 45, oy - gs / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(goodB, 0, 0); ctx.restore()

        // Attainable region
        if (curvePoints.length > 1) {
            ctx.fillStyle = 'rgba(220,180,80,0.04)'; ctx.beginPath()
            ctx.moveTo(tX(0), tY(0)); ctx.lineTo(tX(0), tY(curvePoints[0].y))
            curvePoints.forEach(p => ctx.lineTo(tX(p.x), tY(p.y)))
            ctx.lineTo(tX(curvePoints[curvePoints.length - 1].x), tY(0)); ctx.closePath(); ctx.fill()
        }
        // PPC Curve
        if (curvePoints.length > 1) {
            const g = ctx.createLinearGradient(tX(0), tY(100), tX(100), tY(0))
            g.addColorStop(0, 'rgba(100,200,150,0.9)'); g.addColorStop(0.5, 'rgba(220,180,80,0.9)'); g.addColorStop(1, 'rgba(255,150,100,0.9)')
            ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath()
            curvePoints.forEach((p, i) => { if (i === 0) ctx.moveTo(tX(p.x), tY(p.y)); else ctx.lineTo(tX(p.x), tY(p.y)) })
            ctx.stroke()
            const lp = curvePoints[Math.floor(curvePoints.length * 0.7)]
            if (lp) { ctx.fillStyle = 'rgba(220,180,80,0.9)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'left'; ctx.fillText('PPC', tX(lp.x) + 15, tY(lp.y) - 10) }
        }
        // Selected point
        let pc = 'rgba(220,180,80,0.9)', sl = ''
        if (status === 'efficient') { pc = 'rgba(80,220,140,1)'; sl = 'Efficient' }
        else if (status === 'inefficient') { pc = 'rgba(255,180,80,1)'; sl = 'Inefficient' }
        else if (status === 'unattainable') { pc = 'rgba(255,100,100,1)'; sl = 'Unattainable' }
        const px = tX(selectedPoint.x), py = tY(selectedPoint.y)
        const gl = ctx.createRadialGradient(px, py, 0, px, py, 30)
        gl.addColorStop(0, pc.replace(/[^,]+\)$/, '0.4)')); gl.addColorStop(1, 'transparent')
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(px, py, 30, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = pc.replace(/[^,]+\)$/, '0.5)'); ctx.lineWidth = 1.5; ctx.setLineDash([6, 4])
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, oy); ctx.moveTo(px, py); ctx.lineTo(ox, py); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = pc; ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(`(${selectedPoint.x.toFixed(0)}, ${selectedPoint.y.toFixed(0)})`, px, py - 22)
        ctx.fillStyle = pc; ctx.font = '11px system-ui'; ctx.fillText(sl, px, py + 28)
        // Legend
        ctx.textAlign = 'left'; ctx.font = '11px system-ui'; let ly = 25
        const li = [{ c: 'rgba(80,220,140,1)', l: 'Efficient (on curve)' }, { c: 'rgba(255,180,80,1)', l: 'Inefficient (inside)' }, { c: 'rgba(255,100,100,1)', l: 'Unattainable (outside)' }]
        li.forEach(it => { ctx.fillStyle = it.c; ctx.beginPath(); ctx.arc(w - 164, ly, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText(it.l, w - 148, ly + 4); ly += 22 })
        return () => window.removeEventListener('resize', resize)
    }, [curvePoints, selectedPoint, goodA, goodB, status])

    const handleCanvas = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current; if (!canvas) return
        const rect = canvas.getBoundingClientRect(), w = canvas.offsetWidth, h = canvas.offsetHeight, pad = 80
        const gs = Math.min(w - pad * 2, h - pad * 2 - 60)
        let cx: number, cy: number
        if ('touches' in e) { cx = e.touches[0].clientX; cy = e.touches[0].clientY } else { cx = e.clientX; cy = e.clientY }
        const x = ((cx - rect.left - pad) / gs) * 100, y = ((h - pad - 40 - (cy - rect.top)) / gs) * 100
        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) setSelectedPoint({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full cursor-crosshair"
                    onClick={handleCanvas} onMouseDown={() => setIsDragging(true)} onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)} onMouseMove={e => isDragging && handleCanvas(e)}
                    onTouchStart={e => { setIsDragging(true); handleCanvas(e) }} onTouchMove={e => isDragging && handleCanvas(e)} onTouchEnd={() => setIsDragging(false)} />

                <div className="absolute top-4 left-4 flex items-center gap-3">
                    <APTag course="Microeconomics" unit="Unit 1" color={ECON_COLOR} />
                    <button onClick={demo.open} className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors">AP Tutorial</button>
                </div>

                <InfoPanel title="Production Point" departmentColor={ECON_COLOR} className="absolute top-14 left-4 w-64" items={[
                    { label: goodA, value: selectedPoint.x.toFixed(0) },
                    { label: goodB, value: selectedPoint.y.toFixed(0) },
                    { label: 'Status', value: status === 'efficient' ? 'On frontier' : status === 'inefficient' ? 'Underutilized' : status === 'unattainable' ? 'Beyond capacity' : '...', color: status === 'efficient' ? 'rgb(80,220,140)' : status === 'inefficient' ? 'rgb(255,180,80)' : 'rgb(255,100,100)' },
                    { label: `OC of 1 ${goodA.split(' ')[0]}`, value: `${costs.costA} ${goodB.split(' ')[0]}` },
                    { label: `OC of 1 ${goodB.split(' ')[0]}`, value: `${costs.costB} ${goodA.split(' ')[0]}` },
                ]} />

                <EquationDisplay departmentColor={ECON_COLOR} className="absolute top-4 right-4 w-72" title="PPC Equations" equations={[
                    { label: 'PPC', expression: 'x^2 + y^2 = r^2', description: 'Quarter-circle frontier (constant returns)' },
                    { label: 'OC', expression: 'OC_A = |dB/dA|', description: 'Marginal opportunity cost' },
                    { label: 'Growth', expression: 'r\' = r(1 + g)', description: 'Outward shift from growth rate g' },
                ]} />

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={ECON_COLOR} />
                </div>
            </div>

            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <Slider label="Economic Growth" value={shiftFactor} onChange={setShiftFactor} min={-1} max={1} step={0.05} />
                    <div className="flex items-center gap-3">
                        <Toggle label="Growth Animation" value={showGrowthAnimation} onChange={v => { setShowGrowthAnimation(v); if (v) setGrowthFrame(0) }} />
                        <Button onClick={() => { const c = getClosestCurvePoint(selectedPoint.x, selectedPoint.y); setSelectedPoint(c) }} variant="secondary">Snap to Curve</Button>
                        <Button onClick={() => { setSelectedPoint({ x: 50, y: 50 }); setShiftFactor(0) }} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
