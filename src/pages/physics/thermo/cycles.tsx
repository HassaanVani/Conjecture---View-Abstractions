import { useState, useEffect, useRef, useCallback } from 'react'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

type CycleType = 'carnot' | 'otto' | 'diesel'

interface PVPoint {
    p: number
    v: number
}

export default function HeatEngineCycles() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [cycleType, setCycleType] = useState<CycleType>('carnot')
    const [tHot, setTHot] = useState(600)
    const [tCold, setTCold] = useState(300)
    const [compressionRatio, setCompressionRatio] = useState(8)
    const [showWorkArea, setShowWorkArea] = useState(true)
    const [showLabels, setShowLabels] = useState(true)
    const [animateState, setAnimateState] = useState(true)
    const timeRef = useRef(0)

    const gamma = 1.4 // diatomic ideal gas
    const nR = 1 // nR = 1 for simplicity in PV = nRT

    const generateCycle = useCallback((): PVPoint[][] => {
        const r = compressionRatio
        const Tc = tCold
        const Th = tHot

        if (cycleType === 'carnot') {
            const V1 = 1
            const V2 = V1 / r
            const P1 = nR * Tc / V1
            const P2 = nR * Tc / V2

            // Isothermal compression Tc: 1->2
            const iso1: PVPoint[] = []
            for (let i = 0; i <= 40; i++) {
                const v = V1 - (V1 - V2) * (i / 40)
                iso1.push({ v, p: nR * Tc / v })
            }

            // Adiabatic compression: 2->3 (Tc to Th)
            const V3 = V2 * Math.pow(Tc / Th, 1 / (gamma - 1))
            const adia1: PVPoint[] = []
            for (let i = 0; i <= 40; i++) {
                const v = V2 - (V2 - V3) * (i / 40)
                const p = nR * Tc * Math.pow(V2, gamma - 1) / Math.pow(v, gamma)
                adia1.push({ v, p: Math.max(p, 0.01) })
            }

            // Isothermal expansion Th: 3->4
            const V4 = V1 * Math.pow(Tc / Th, 1 / (gamma - 1))
            const iso2: PVPoint[] = []
            for (let i = 0; i <= 40; i++) {
                const v = V3 + (V4 - V3) * (i / 40)
                iso2.push({ v, p: nR * Th / v })
            }

            // Adiabatic expansion: 4->1
            const adia2: PVPoint[] = []
            for (let i = 0; i <= 40; i++) {
                const v = V4 + (V1 - V4) * (i / 40)
                const p = nR * Th * Math.pow(V4, gamma - 1) / Math.pow(v, gamma)
                adia2.push({ v, p: Math.max(p, 0.01) })
            }

            return [iso1, adia1, iso2, adia2]
        }

        if (cycleType === 'otto') {
            const V1 = 1
            const V2 = V1 / r
            const P1 = nR * Tc / V1
            const T2 = Tc * Math.pow(r, gamma - 1)
            const T3 = Th
            const T4 = T3 * Math.pow(1 / r, gamma - 1)

            // Adiabatic compression 1->2
            const adia1: PVPoint[] = []
            for (let i = 0; i <= 40; i++) {
                const v = V1 - (V1 - V2) * (i / 40)
                const p = P1 * Math.pow(V1 / v, gamma)
                adia1.push({ v, p })
            }

            // Isochoric heating 2->3
            const P2 = nR * T2 / V2
            const P3 = nR * T3 / V2
            const iso1: PVPoint[] = []
            for (let i = 0; i <= 40; i++) {
                const p = P2 + (P3 - P2) * (i / 40)
                iso1.push({ v: V2, p })
            }

            // Adiabatic expansion 3->4
            const adia2: PVPoint[] = []
            for (let i = 0; i <= 40; i++) {
                const v = V2 + (V1 - V2) * (i / 40)
                const p = P3 * Math.pow(V2 / v, gamma)
                adia2.push({ v, p })
            }

            // Isochoric cooling 4->1
            const P4 = nR * T4 / V1
            const iso2: PVPoint[] = []
            for (let i = 0; i <= 40; i++) {
                const p = P4 - (P4 - P1) * (i / 40)
                iso2.push({ v: V1, p })
            }

            return [adia1, iso1, adia2, iso2]
        }

        // Diesel
        const V1 = 1
        const V2 = V1 / r
        const P1 = nR * Tc / V1
        const T2 = Tc * Math.pow(r, gamma - 1)
        const T3 = Th
        const V3 = V2 * (T3 / T2)
        const cutoffRatio = V3 / V2
        const T4 = T3 * Math.pow(V3 / V1, gamma - 1)

        // Adiabatic compression 1->2
        const adia1: PVPoint[] = []
        for (let i = 0; i <= 40; i++) {
            const v = V1 - (V1 - V2) * (i / 40)
            const p = P1 * Math.pow(V1 / v, gamma)
            adia1.push({ v, p })
        }

        // Isobaric heating 2->3
        const P2 = nR * T2 / V2
        const isobar: PVPoint[] = []
        for (let i = 0; i <= 40; i++) {
            const v = V2 + (V3 - V2) * (i / 40)
            isobar.push({ v, p: P2 })
        }

        // Adiabatic expansion 3->4
        const P3 = P2
        const adia2: PVPoint[] = []
        for (let i = 0; i <= 40; i++) {
            const v = V3 + (V1 - V3) * (i / 40)
            const p = P3 * Math.pow(V3 / v, gamma)
            adia2.push({ v, p })
        }

        // Isochoric cooling 4->1
        const P4 = nR * T4 / V1
        const isoch: PVPoint[] = []
        for (let i = 0; i <= 40; i++) {
            const p = P4 - (P4 - P1) * (i / 40)
            isoch.push({ v: V1, p })
        }

        return [adia1, isobar, adia2, isoch]

    }, [cycleType, tHot, tCold, compressionRatio, gamma])

    const calcEfficiency = useCallback(() => {
        if (cycleType === 'carnot') return 1 - tCold / tHot
        if (cycleType === 'otto') return 1 - Math.pow(1 / compressionRatio, gamma - 1)
        // Diesel
        const T2 = tCold * Math.pow(compressionRatio, gamma - 1)
        const rc = tHot / T2
        return 1 - (1 / (gamma * Math.pow(compressionRatio, gamma - 1))) * ((Math.pow(rc, gamma) - 1) / (rc - 1))
    }, [cycleType, tHot, tCold, compressionRatio, gamma])

    const reset = useCallback(() => {
        setCycleType('carnot')
        setTHot(600)
        setTCold(300)
        setCompressionRatio(8)
        setShowWorkArea(true)
        setShowLabels(true)
        setAnimateState(true)
        timeRef.current = 0
    }, [])

    const demoSteps = [
        { title: 'Heat Engines', description: 'A heat engine converts thermal energy into mechanical work by cycling a working fluid through thermodynamic processes. The PV diagram shows the state of the gas throughout the cycle.', setup: () => reset() },
        { title: 'The Carnot Cycle', description: 'The Carnot cycle is the most efficient possible engine. It uses two isothermal processes (constant T) and two adiabatic processes (no heat exchange). Its efficiency depends only on T_hot and T_cold.', setup: () => { setCycleType('carnot'); setTHot(600); setTCold(300) } },
        { title: 'Carnot Efficiency', description: 'eta = 1 - Tc/Th. This is the theoretical maximum efficiency. With Tc=300K and Th=600K, max efficiency is 50%. No real engine can exceed this.', setup: () => { setCycleType('carnot') } },
        { title: 'The Otto Cycle', description: 'The Otto cycle models gasoline engines. It uses two adiabatic processes and two isochoric (constant volume) processes. Efficiency depends on compression ratio.', setup: () => { setCycleType('otto'); setCompressionRatio(8) } },
        { title: 'The Diesel Cycle', description: 'The Diesel cycle uses compression ignition. It has an isobaric (constant pressure) heat addition instead of isochoric. Diesel engines typically have higher compression ratios and efficiency.', setup: () => { setCycleType('diesel'); setCompressionRatio(12) } },
        { title: 'Work = Enclosed Area', description: 'The net work done per cycle equals the enclosed area on the PV diagram: W = integral of P dV around the cycle. A larger enclosed area means more work output per cycle.', setup: () => { setShowWorkArea(true); setCycleType('carnot') } },
        { title: 'Temperature Effects', description: 'Increasing Th or decreasing Tc improves efficiency. But there are practical limits: materials can only withstand so much heat, and Tc is limited by the environment.', setup: () => { setCycleType('carnot'); setTHot(800); setTCold(250) } },
        { title: 'Compression Ratio', description: 'Higher compression ratios increase efficiency for Otto and Diesel cycles. However, too much compression causes engine knock in gasoline engines, limiting practical ratios to about 8-12.', setup: () => { setCycleType('otto'); setCompressionRatio(12) } },
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

        let animId: number
        const segments = generateCycle()

        const draw = () => {
            if (animateState) timeRef.current += 0.008
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)

            // PV diagram area
            const pad = 70
            const graphW = w - pad * 2 - 120
            const graphH = h - pad * 2

            // Find data bounds
            const allPts = segments.flat()
            let maxP = 0, maxV = 0
            allPts.forEach(pt => {
                if (pt.p > maxP) maxP = pt.p
                if (pt.v > maxV) maxV = pt.v
            })
            maxP *= 1.15; maxV *= 1.15

            const toX = (v: number) => pad + (v / maxV) * graphW
            const toY = (p: number) => pad + graphH - (p / maxP) * graphH

            // Grid
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.06)'
            ctx.lineWidth = 1
            for (let i = 0; i <= 5; i++) {
                const x = pad + (i / 5) * graphW
                const y = pad + (i / 5) * graphH
                ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, pad + graphH); ctx.stroke()
                ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + graphW, y); ctx.stroke()
            }

            // Axes
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(pad, pad); ctx.lineTo(pad, pad + graphH); ctx.lineTo(pad + graphW, pad + graphH)
            ctx.stroke()

            ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'
            ctx.font = '13px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Volume (V)', pad + graphW / 2, h - 15)
            ctx.save()
            ctx.translate(18, pad + graphH / 2)
            ctx.rotate(-Math.PI / 2)
            ctx.fillText('Pressure (P)', 0, 0)
            ctx.restore()

            // Work area shading
            if (showWorkArea) {
                ctx.fillStyle = 'rgba(160, 100, 255, 0.12)'
                ctx.beginPath()
                const firstSeg = segments[0]
                if (firstSeg && firstSeg.length > 0) {
                    ctx.moveTo(toX(firstSeg[0].v), toY(firstSeg[0].p))
                }
                segments.forEach(seg => {
                    seg.forEach(pt => ctx.lineTo(toX(pt.v), toY(pt.p)))
                })
                ctx.closePath()
                ctx.fill()
            }

            // Draw cycle segments
            const segColors = cycleType === 'carnot'
                ? ['rgba(100, 200, 255, 0.9)', 'rgba(255, 220, 100, 0.9)', 'rgba(255, 100, 100, 0.9)', 'rgba(100, 255, 150, 0.9)']
                : ['rgba(255, 220, 100, 0.9)', 'rgba(255, 100, 100, 0.9)', 'rgba(100, 200, 255, 0.9)', 'rgba(100, 255, 150, 0.9)']

            const segLabels = cycleType === 'carnot'
                ? ['Isothermal (Tc)', 'Adiabatic', 'Isothermal (Th)', 'Adiabatic']
                : cycleType === 'otto'
                    ? ['Adiabatic', 'Isochoric', 'Adiabatic', 'Isochoric']
                    : ['Adiabatic', 'Isobaric', 'Adiabatic', 'Isochoric']

            segments.forEach((seg, si) => {
                if (seg.length < 2) return
                ctx.strokeStyle = segColors[si % segColors.length]
                ctx.lineWidth = 3; ctx.lineCap = 'round'
                ctx.beginPath()
                seg.forEach((pt, i) => {
                    const x = toX(pt.v); const y = toY(pt.p)
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
                })
                ctx.stroke()

                // Direction arrow at midpoint
                const mid = Math.floor(seg.length / 2)
                const midPt = seg[mid]
                const nextPt = seg[Math.min(mid + 3, seg.length - 1)]
                const ang = Math.atan2(toY(nextPt.p) - toY(midPt.p), toX(nextPt.v) - toX(midPt.v))
                const ax = toX(midPt.v); const ay = toY(midPt.p)
                ctx.fillStyle = segColors[si % segColors.length]
                ctx.beginPath()
                ctx.moveTo(ax + 8 * Math.cos(ang), ay + 8 * Math.sin(ang))
                ctx.lineTo(ax + 8 * Math.cos(ang + 2.5), ay + 8 * Math.sin(ang + 2.5))
                ctx.lineTo(ax + 8 * Math.cos(ang - 2.5), ay + 8 * Math.sin(ang - 2.5))
                ctx.closePath(); ctx.fill()

                // Segment label
                if (showLabels) {
                    ctx.fillStyle = segColors[si % segColors.length]
                    ctx.font = '10px system-ui'; ctx.textAlign = 'center'
                    const lPt = seg[Math.floor(seg.length * 0.3)]
                    ctx.fillText(segLabels[si], toX(lPt.v), toY(lPt.p) - 12)
                }
            })

            // State point labels
            const stateLabels = ['1', '2', '3', '4']
            segments.forEach((seg, si) => {
                if (seg.length === 0) return
                const pt = seg[0]
                const x = toX(pt.v); const y = toY(pt.p)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill()
                ctx.fillStyle = '#0d0a1a'
                ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
                ctx.fillText(stateLabels[si], x, y)
                ctx.textBaseline = 'alphabetic'
            })

            // Animated state point
            if (animateState) {
                const totalPts = segments.reduce((s, seg) => s + seg.length, 0)
                const idx = Math.floor((timeRef.current * 30) % totalPts)
                let cumIdx = 0
                for (const seg of segments) {
                    if (idx < cumIdx + seg.length) {
                        const pt = seg[idx - cumIdx]
                        const x = toX(pt.v); const y = toY(pt.p)
                        const glow = ctx.createRadialGradient(x, y, 0, x, y, 15)
                        glow.addColorStop(0, 'rgba(160, 100, 255, 0.6)')
                        glow.addColorStop(1, 'transparent')
                        ctx.fillStyle = glow
                        ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill()
                        ctx.fillStyle = 'rgba(160, 100, 255, 1)'
                        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill()
                        break
                    }
                    cumIdx += seg.length
                }
            }

            // Efficiency gauge (right side)
            const eff = calcEfficiency()
            const gaugeX = w - 80
            const gaugeY = pad + 30
            const gaugeH = graphH - 60
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
            ctx.fillRect(gaugeX - 15, gaugeY, 30, gaugeH)
            const effH = eff * gaugeH
            const effGrad = ctx.createLinearGradient(0, gaugeY + gaugeH - effH, 0, gaugeY + gaugeH)
            effGrad.addColorStop(0, 'rgba(160, 100, 255, 0.8)')
            effGrad.addColorStop(1, 'rgba(160, 100, 255, 0.2)')
            ctx.fillStyle = effGrad
            ctx.fillRect(gaugeX - 15, gaugeY + gaugeH - effH, 30, effH)
            ctx.strokeStyle = 'rgba(160, 100, 255, 0.4)'; ctx.lineWidth = 1
            ctx.strokeRect(gaugeX - 15, gaugeY, 30, gaugeH)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(`${(eff * 100).toFixed(1)}%`, gaugeX, gaugeY - 10)
            ctx.fillStyle = 'rgba(160, 100, 255, 0.6)'; ctx.font = '10px system-ui'
            ctx.fillText('Efficiency', gaugeX, gaugeY + gaugeH + 18)

            animId = requestAnimationFrame(draw)
        }

        animId = requestAnimationFrame(draw)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [cycleType, tHot, tCold, compressionRatio, showWorkArea, showLabels, animateState, generateCycle, calcEfficiency])

    const eff = calcEfficiency()

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0a1a] text-white overflow-hidden font-sans">
            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    <div className="absolute top-4 left-4 flex flex-col gap-3">
                        <APTag course="Physics 2" unit="Unit 2" color="rgb(160, 100, 255)" />
                        <InfoPanel title="Heat Engine" departmentColor="rgb(160, 100, 255)" items={[
                            { label: 'Cycle', value: cycleType.charAt(0).toUpperCase() + cycleType.slice(1) },
                            { label: 'Efficiency', value: (eff * 100).toFixed(1), unit: '%', color: 'rgb(160, 100, 255)' },
                            { label: 'T_hot', value: tHot, unit: 'K', color: 'rgb(255, 100, 100)' },
                            { label: 'T_cold', value: tCold, unit: 'K', color: 'rgb(100, 200, 255)' },
                            { label: 'Compression', value: `${compressionRatio}:1` },
                        ]} />
                    </div>

                    <div className="absolute top-4 right-[140px] max-w-[240px]">
                        <EquationDisplay departmentColor="rgb(160, 100, 255)" equations={[
                            { label: 'Carnot', expression: 'eta = 1 - Tc/Th', description: 'Maximum theoretical efficiency' },
                            { label: 'Work', expression: 'W = Qh - Qc = loop integral PdV' },
                            { label: 'Otto', expression: 'eta = 1 - 1/r^(gamma-1)' },
                            { label: '1st Law', expression: 'dU = Q - W' },
                        ]} />
                    </div>

                    <div className="absolute bottom-4 left-4">
                        <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor="rgb(160, 100, 255)" />
                    </div>
                </div>

                <div className="w-80 bg-[#0d0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ControlGroup label="Cycle Type">
                            <ButtonGroup value={cycleType} onChange={v => setCycleType(v as CycleType)} options={[
                                { value: 'carnot', label: 'Carnot' },
                                { value: 'otto', label: 'Otto' },
                                { value: 'diesel', label: 'Diesel' },
                            ]} color="rgb(160, 100, 255)" />
                        </ControlGroup>
                        <ControlGroup label="Hot Reservoir (Th)">
                            <Slider value={tHot} onChange={v => setTHot(Math.round(v))} min={400} max={1200} step={10} label={`${tHot} K`} />
                        </ControlGroup>
                        <ControlGroup label="Cold Reservoir (Tc)">
                            <Slider value={tCold} onChange={v => setTCold(Math.round(v))} min={200} max={tHot - 50} step={10} label={`${tCold} K`} />
                        </ControlGroup>
                        <ControlGroup label="Compression Ratio">
                            <Slider value={compressionRatio} onChange={v => setCompressionRatio(Math.round(v))} min={2} max={20} step={1} label={`${compressionRatio}:1`} />
                        </ControlGroup>
                        <Toggle value={showWorkArea} onChange={setShowWorkArea} label="Show Work Area" />
                        <Toggle value={showLabels} onChange={setShowLabels} label="Show Process Labels" />
                        <Toggle value={animateState} onChange={setAnimateState} label="Animate State Point" />
                    </ControlPanel>
                    <div className="flex gap-2">
                        <Button onClick={demo.open} className="flex-1">AP Tutorial</Button>
                        <Button onClick={reset} variant="secondary">Reset</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
