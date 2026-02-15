import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'

export default function PVDiagram() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [pressure, setPressure] = useState(2.0) // atm
    const [volume, setVolume] = useState(2.0) // L
    // T is derived: T ~ PV

    // Store path history to show cycle
    const historyRef = useRef<{ p: number, v: number }[]>([])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            // Graph bounds
            const gx = 60
            const gy = height - 60
            const gw = width - 100
            const gh = height - 100

            // Scales
            // V goes 0 to 5
            // P goes 0 to 5
            const scaleX = gw / 5
            const scaleY = gh / 5

            ctx.clearRect(0, 0, width, height)

            // Draw Axes
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(gx, gy - gh)
            ctx.lineTo(gx, gy)
            ctx.lineTo(gx + gw, gy)
            ctx.stroke()

            // Labels
            ctx.fillStyle = 'white'
            ctx.font = '14px monospace'
            ctx.textAlign = 'center'
            ctx.fillText('Volume (L)', gx + gw / 2, gy + 40)

            ctx.save()
            ctx.translate(20, gy - gh / 2)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Pressure (atm)', 0, 0)
            ctx.restore()

            // Grid
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'
            ctx.lineWidth = 1
            ctx.beginPath()
            for (let i = 1; i <= 5; i++) {
                // Vertical lines (V)
                const x = gx + i * scaleX
                ctx.moveTo(x, gy)
                ctx.lineTo(x, gy - gh)
                ctx.fillText(i.toString(), x, gy + 20)

                // Horizontal lines (P)
                const y = gy - i * scaleY
                ctx.moveTo(gx, y)
                ctx.lineTo(gx + gw, y)
                // P labels logic
            }
            ctx.stroke()

            // P labels manual
            for (let i = 1; i <= 5; i++) {
                const y = gy - i * scaleY
                ctx.fillText(i.toString(), 40, y + 5)
            }

            // Draw Isotherms (PV = const)
            // T1 = 1, T2 = 4, etc.
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)'
            ctx.setLineDash([5, 5])
            const isotherms = [2, 4, 8, 12]
            isotherms.forEach((k: number) => {
                ctx.beginPath()
                // P = k / V
                for (let v_iso = 0.5; v_iso <= 5; v_iso += 0.1) {
                    const p_iso = k / v_iso
                    if (p_iso > 5) continue
                    const x = gx + v_iso * scaleX
                    const y = gy - p_iso * scaleY
                    if (v_iso === 0.5 || p_iso > 5) ctx.moveTo(x, y) // Start
                    else ctx.lineTo(x, y)
                }
                ctx.stroke()
            })
            ctx.setLineDash([])

            // Draw Current Path/History
            ctx.strokeStyle = '#60a5fa' // Blue
            ctx.lineWidth = 3
            if (historyRef.current.length > 1) {
                ctx.beginPath()
                historyRef.current.forEach((pt, i) => {
                    const x = gx + pt.v * scaleX
                    const y = gy - pt.p * scaleY
                    if (i === 0) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                })
                ctx.stroke()
            }

            // Draw Current Point
            const cx = gx + volume * scaleX
            const cy_pt = gy - pressure * scaleY

            ctx.fillStyle = '#facc15' // Yellow
            ctx.beginPath()
            ctx.arc(cx, cy_pt, 6, 0, Math.PI * 2)
            ctx.fill()

            // Draw Area Under Curve (Work)
            // Ideally we shade polygon formed by history.
            // Simplified: just show current point stats lines
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)'
            ctx.setLineDash([2, 4])
            ctx.beginPath()
            ctx.moveTo(cx, cy_pt)
            ctx.lineTo(cx, gy) // Down to V axis
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(cx, cy_pt)
            ctx.lineTo(gx, cy_pt) // Left to P axis
            ctx.stroke()
            ctx.setLineDash([])

            // Calc Stats
            // W = area. Need closed cycle or integral.
            // U = 3/2 nRT = 3/2 PV (Monatomic ideal gas)
            const U = 1.5 * pressure * volume * 101.3 // Joules roughly (atm*L -> J factor approx 101.3)
            const T_proxy = pressure * volume // proportional to T

            ctx.textAlign = 'right'
            ctx.fillStyle = 'white'
            ctx.font = '14px monospace'
            ctx.fillText(`Internal Energy (U) ≈ ${U.toFixed(0)} J`, width - 20, 40)
            ctx.fillText(`PV Factor (∝ T): ${T_proxy.toFixed(2)}`, width - 20, 60)

            requestAnimationFrame(animate)
        }

        requestAnimationFrame(animate)
        return () => {
            canvas.removeEventListener('resize', resize)
        }
    }, [pressure, volume])

    // Add point to history when state changes (if desired)
    // Or we manually add points via specific process buttons?
    // Let's rely on buttons to "animate" a process, pushing points.

    const animateTo = (targetP: number, targetV: number, duration: number) => {
        // Interpolate
        const startP = pressure
        const startV = volume
        const startTime = performance.now()

        const step = (now: number) => {
            const elapsed = now - startTime
            const t = Math.min(1, elapsed / duration)
            // Linear interp?
            // Depends on process.
            // Isobaric: P const, V linear.
            // Isochoric: V const, P linear.
            // Isothermal: PV = const.

            let nextP = startP
            let nextV = startV

            // Smart interpolation based on process type?
            // For now, simple linear interp of both (works for Straight lines).
            // Isotherms require specific path.

            nextP = startP + (targetP - startP) * t
            nextV = startV + (targetV - startV) * t

            setPressure(nextP)
            setVolume(nextV)

            historyRef.current.push({ p: nextP, v: nextV })

            if (t < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
    }

    // Processes
    const isoBaricExp = () => animateTo(pressure, Math.min(5, volume + 1), 500)
    const isoBaricComp = () => animateTo(pressure, Math.max(0.5, volume - 1), 500)
    const isoChoricHeat = () => animateTo(Math.min(5, pressure + 1), volume, 500)
    const isoChoricCool = () => animateTo(Math.max(0.5, pressure - 1), volume, 500)

    const clear = () => {
        historyRef.current = []
        // Don't reset P,V necessarily?
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <PhysicsBackground />
            </div>

            {/* Navbar */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">PV Diagrams</h1>
                        <p className="text-xs text-white/50">AP Physics 2: Thermodynamics</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar z-20">
                    <div className="text-sm text-white/70 leading-relaxed">
                        Manipulate the state of the gas.
                        <br />
                        Work = Area under the curve.
                        <br />
                        Isotherms (dashed) show T = const.
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-white/80 block">Isobaric (Const P)</label>
                        <div className="flex gap-2">
                            <button onClick={isoBaricExp} className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30">Expand (+V)</button>
                            <button onClick={isoBaricComp} className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30">Compress (-V)</button>
                        </div>

                        <label className="text-sm font-medium text-white/80 block">Isochoric (Const V)</label>
                        <div className="flex gap-2">
                            <button onClick={isoChoricHeat} className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30">Heat (+P)</button>
                            <button onClick={isoChoricCool} className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30">Cool (-P)</button>
                        </div>
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Pressure</label>
                            <span className="text-xs font-mono text-white/60">{pressure.toFixed(2)} atm</span>
                        </div>
                        <input
                            type="range" min="0.5" max="5.0" step="0.1" value={pressure}
                            onChange={(e) => {
                                const val = Number(e.target.value)
                                setPressure(val)
                                historyRef.current.push({ p: val, v: volume })
                            }}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white/80">Volume</label>
                            <span className="text-xs font-mono text-white/60">{volume.toFixed(2)} L</span>
                        </div>
                        <input
                            type="range" min="0.5" max="5.0" step="0.1" value={volume}
                            onChange={(e) => {
                                const val = Number(e.target.value)
                                setVolume(val)
                                historyRef.current.push({ p: pressure, v: val })
                            }}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                    </div>

                    <button
                        onClick={clear}
                        className="w-full py-3 mt-4 rounded-xl font-medium text-sm bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                    >
                        Clear Path
                    </button>

                </div>
            </div>
        </div>
    )
}
