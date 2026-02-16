import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'
import { Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'

const ECON_COLOR = 'rgb(220, 180, 80)'

interface Country { name: string; goodA: number; goodB: number }

const scenarios = [
    { name: 'Classic Trade', countries: [{ name: 'USA', goodA: 100, goodB: 50 }, { name: 'China', goodA: 80, goodB: 160 }] as [Country, Country], description: 'USA better at tech; China better at manufacturing.' },
    { name: 'Oil vs Services', countries: [{ name: 'Saudi Arabia', goodA: 200, goodB: 40 }, { name: 'Japan', goodA: 30, goodB: 120 }] as [Country, Country], description: 'Resource-rich vs service-oriented.' },
    { name: 'Absolute Advantage', countries: [{ name: 'Germany', goodA: 100, goodB: 100 }, { name: 'Brazil', goodA: 50, goodB: 50 }] as [Country, Country], description: 'Germany better at both, but trade still benefits!' },
]

export default function ComparativeAdvantage() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [scenarioIndex, setScenarioIndex] = useState(0)
    const [country1, setCountry1] = useState(scenarios[0].countries[0])
    const [country2, setCountry2] = useState(scenarios[0].countries[1])
    const [specializationLevel, setSpecializationLevel] = useState(0)
    const [showTrade, setShowTrade] = useState(false)
    const [showTermsOfTrade, setShowTermsOfTrade] = useState(false)
    const goodALabel = 'Tech Goods'
    const goodBLabel = 'Consumer Goods'

    const loadScenario = (idx: number) => { setScenarioIndex(idx); setCountry1(scenarios[idx].countries[0]); setCountry2(scenarios[idx].countries[1]); setSpecializationLevel(0); setShowTrade(false) }

    const getOC = useCallback((c: Country) => ({ costAinB: c.goodB / c.goodA, costBinA: c.goodA / c.goodB }), [])
    const oc1 = getOC(country1), oc2 = getOC(country2)
    const c1AdvIn = oc1.costAinB < oc2.costAinB ? 'A' as const : 'B' as const
    const c2AdvIn = c1AdvIn === 'A' ? 'B' as const : 'A' as const

    // Terms of trade range
    const totMin = c1AdvIn === 'A' ? oc1.costAinB : oc2.costAinB
    const totMax = c1AdvIn === 'A' ? oc2.costAinB : oc1.costAinB

    const getProd = useCallback((c: Country, adv: 'A' | 'B', lvl: number) => {
        if (adv === 'A') return { a: Math.max(0, c.goodA * (0.5 + lvl * 0.5)), b: Math.max(0, c.goodB * (0.5 - lvl * 0.5)) }
        return { a: Math.max(0, c.goodA * (0.5 - lvl * 0.5)), b: Math.max(0, c.goodB * (0.5 + lvl * 0.5)) }
    }, [])

    const prod1 = getProd(country1, c1AdvIn, specializationLevel)
    const prod2 = getProd(country2, c2AdvIn, specializationLevel)
    const totalA = prod1.a + prod2.a, totalB = prod1.b + prod2.b
    const baseA = country1.goodA * 0.5 + country2.goodA * 0.5, baseB = country1.goodB * 0.5 + country2.goodB * 0.5
    const gainA = totalA - baseA, gainB = totalB - baseB

    const demoSteps: DemoStep[] = [
        { title: 'Comparative vs Absolute Advantage', description: 'Even if one country produces EVERYTHING better, both benefit from trade by specializing in what they are RELATIVELY better at.', setup: () => { loadScenario(0); setSpecializationLevel(0) } },
        { title: 'Opportunity Cost', description: 'Each country sacrifices something to produce a good. Compare opportunity costs to find comparative advantage -- the country with LOWER OC has the advantage.', setup: () => { setSpecializationLevel(0); setShowTrade(false) } },
        { title: 'Finding Comparative Advantage', description: 'The country with lower opportunity cost specializes in that good. Watch the opportunity cost numbers highlighted in green.', setup: () => setSpecializationLevel(0.3) },
        { title: 'Terms of Trade', description: 'Trade must occur at a price BETWEEN the two countries\' opportunity costs. This range ensures BOTH countries gain from trade.', highlight: 'Toggle "Terms of Trade" to see the acceptable range', setup: () => { setSpecializationLevel(0.5); setShowTermsOfTrade(true) } },
        { title: 'Full Specialization', description: 'With full specialization and trade, world output increases. Both countries can consume MORE than they could produce alone!', setup: () => { setSpecializationLevel(1); setShowTrade(true) } },
        { title: 'Gains from Trade Area', description: 'The gains from trade represent the extra output created by specialization. With trade, consumption possibilities exceed production possibilities.', setup: () => { setSpecializationLevel(1); setShowTrade(true) } },
        { title: 'Absolute Advantage Case', description: 'Germany is better at BOTH goods. But Brazil still has comparative advantage in one! Trade benefits both. This is Ricardo\'s key insight.', setup: () => { loadScenario(2); setSpecializationLevel(1); setShowTrade(true) } },
        { title: 'Explore', description: 'Try different scenarios and specialization levels. Can you find where gains from trade are maximized?', setup: () => { loadScenario(0); setSpecializationLevel(0) } },
    ]
    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d'); if (!ctx) return
        const dpr = window.devicePixelRatio || 1
        const resize = () => { canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
        resize(); window.addEventListener('resize', resize)
        const w = canvas.offsetWidth, h = canvas.offsetHeight
        ctx.fillStyle = '#1a150a'; ctx.fillRect(0, 0, w, h)
        const gw = (w - 100) / 2 - 40, gh = h - 200, pad = 50

        const drawPPC = (c: Country, adv: 'A' | 'B', sx: number, color: string) => {
            const mA = c.goodA * 1.1, mB = c.goodB * 1.1
            ctx.strokeStyle = 'rgba(220,180,80,0.4)'; ctx.lineWidth = 1; ctx.beginPath()
            ctx.moveTo(sx + pad, 60); ctx.lineTo(sx + pad, 60 + gh); ctx.lineTo(sx + pad + gw, 60 + gh); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.7)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(goodALabel, sx + pad + gw / 2, 60 + gh + 35)
            ctx.save(); ctx.translate(sx + pad - 30, 60 + gh / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(goodBLabel, 0, 0); ctx.restore()
            // PPC line
            ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath()
            ctx.moveTo(sx + pad, 60 + gh - (c.goodB / mB) * gh); ctx.lineTo(sx + pad + (c.goodA / mA) * gw, 60 + gh); ctx.stroke()
            // Gains area (shaded)
            if (showTrade && specializationLevel > 0.5) {
                ctx.fillStyle = 'rgba(100,200,150,0.1)'; ctx.beginPath()
                ctx.moveTo(sx + pad, 60 + gh - (c.goodB / mB) * gh)
                ctx.lineTo(sx + pad + (c.goodA / mA) * gw, 60 + gh)
                ctx.lineTo(sx + pad, 60 + gh); ctx.closePath(); ctx.fill()
            }
            // Production point
            const pr = getProd(c, adv, specializationLevel)
            const px = sx + pad + (pr.a / mA) * gw, py = 60 + gh - (pr.b / mB) * gh
            const gl = ctx.createRadialGradient(px, py, 0, px, py, 15)
            gl.addColorStop(0, color.replace('0.9)', '0.4)')); gl.addColorStop(1, 'transparent')
            ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(px, py, 15, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
            ctx.fillText(`(${pr.a.toFixed(0)}, ${pr.b.toFixed(0)})`, px, py - 15)
            ctx.fillStyle = color; ctx.font = 'bold 16px system-ui'; ctx.fillText(c.name, sx + pad + gw / 2, 40)
            // OC display
            const oc = getOC(c); ctx.font = '11px system-ui'; ctx.textAlign = 'left'
            const ocY = 60 + gh + 55
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillText(`OC 1 ${goodALabel.split(' ')[0]}:`, sx + pad, ocY)
            ctx.fillStyle = adv === 'A' ? 'rgba(100,200,150,1)' : 'rgba(255,255,255,0.8)'
            ctx.fillText(`${oc.costAinB.toFixed(2)} ${goodBLabel.split(' ')[0]}`, sx + pad + 85, ocY)
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillText(`OC 1 ${goodBLabel.split(' ')[0]}:`, sx + pad, ocY + 18)
            ctx.fillStyle = adv === 'B' ? 'rgba(100,200,150,1)' : 'rgba(255,255,255,0.8)'
            ctx.fillText(`${oc.costBinA.toFixed(2)} ${goodALabel.split(' ')[0]}`, sx + pad + 85, ocY + 18)
            ctx.fillStyle = 'rgba(100,200,150,0.2)'; ctx.beginPath(); ctx.roundRect(sx + pad, ocY + 32, gw, 24, 6); ctx.fill()
            ctx.fillStyle = 'rgba(100,200,150,1)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(`Specializes in: ${adv === 'A' ? goodALabel : goodBLabel}`, sx + pad + gw / 2, ocY + 48)
        }
        drawPPC(country1, c1AdvIn, 0, 'rgba(100,150,255,0.9)')
        drawPPC(country2, c2AdvIn, w / 2, 'rgba(255,150,100,0.9)')

        // Trade arrows
        if (showTrade && specializationLevel > 0.5) {
            const ay = 60 + gh / 2, asx = pad + gw, aex = w / 2 + pad
            ctx.strokeStyle = 'rgba(220,180,80,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4])
            ctx.beginPath(); ctx.moveTo(asx + 20, ay - 20); ctx.lineTo(aex - 20, ay - 20); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(c1AdvIn === 'A' ? goodALabel : goodBLabel, (asx + aex) / 2, ay - 30)
            ctx.beginPath(); ctx.moveTo(aex - 20, ay + 20); ctx.lineTo(asx + 20, ay + 20); ctx.stroke()
            ctx.fillText(c2AdvIn === 'A' ? goodALabel : goodBLabel, (asx + aex) / 2, ay + 35)
            ctx.setLineDash([])
        }
        // Terms of trade range
        if (showTermsOfTrade) {
            ctx.fillStyle = 'rgba(220,180,80,0.15)'; ctx.beginPath()
            ctx.roundRect(w / 2 - 130, h - 140, 260, 40, 8); ctx.fill()
            ctx.fillStyle = 'rgba(220,180,80,1)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(`Terms of Trade: ${totMin.toFixed(2)} < TOT < ${totMax.toFixed(2)}`, w / 2, h - 125)
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px system-ui'
            ctx.fillText(`(${goodBLabel} per ${goodALabel})`, w / 2, h - 110)
        }
        // World production summary
        const sy = h - 60
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.roundRect(w / 2 - 250, sy - 30, 500, 55, 10); ctx.fill()
        ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(220,180,80,1)'
        ctx.fillText('World Production', w / 2, sy - 12)
        ctx.font = '12px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.fillText(`${goodALabel}: ${totalA.toFixed(0)}  |  ${goodBLabel}: ${totalB.toFixed(0)}`, w / 2, sy + 5)
        ctx.font = '11px system-ui'; ctx.fillStyle = gainA >= 0 && gainB >= 0 ? 'rgba(100,200,150,1)' : 'rgba(255,200,100,1)'
        ctx.fillText(`Gains: ${gainA >= 0 ? '+' : ''}${gainA.toFixed(0)} ${goodALabel.split(' ')[0]}, ${gainB >= 0 ? '+' : ''}${gainB.toFixed(0)} ${goodBLabel.split(' ')[0]}`, w / 2, sy + 22)
        return () => window.removeEventListener('resize', resize)
    }, [country1, country2, specializationLevel, showTrade, showTermsOfTrade, c1AdvIn, c2AdvIn, getProd, getOC, totalA, totalB, gainA, gainB, totMin, totMax])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />
                <div className="absolute top-4 left-4 flex items-center gap-3">
                    <APTag course="Microeconomics" unit="Unit 1" color={ECON_COLOR} />
                    <ButtonGroup value={scenarioIndex.toString()} onChange={v => loadScenario(+v)} options={scenarios.map((s, i) => ({ value: i.toString(), label: s.name }))} color={ECON_COLOR} />
                    <button onClick={demo.open} className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors">AP Tutorial</button>
                </div>
                <InfoPanel title="Trade Analysis" departmentColor={ECON_COLOR} className="absolute top-14 right-4 w-56" items={[
                    { label: `${country1.name} adv.`, value: c1AdvIn === 'A' ? goodALabel : goodBLabel },
                    { label: `${country2.name} adv.`, value: c2AdvIn === 'A' ? goodALabel : goodBLabel },
                    { label: 'Specialization', value: `${(specializationLevel * 100).toFixed(0)}%` },
                    { label: 'Gain ' + goodALabel.split(' ')[0], value: gainA >= 0 ? `+${gainA.toFixed(0)}` : gainA.toFixed(0), color: gainA >= 0 ? 'rgb(100,200,150)' : 'rgb(255,100,100)' },
                    { label: 'Gain ' + goodBLabel.split(' ')[0], value: gainB >= 0 ? `+${gainB.toFixed(0)}` : gainB.toFixed(0), color: gainB >= 0 ? 'rgb(100,200,150)' : 'rgb(255,100,100)' },
                    { label: 'TOT Range', value: `${totMin.toFixed(2)}-${totMax.toFixed(2)}` },
                ]} />
                <EquationDisplay departmentColor={ECON_COLOR} className="absolute bottom-32 right-4 w-64" collapsed title="Trade Equations" equations={[
                    { label: 'OC', expression: 'OC_A = MaxB / MaxA', description: 'Opportunity cost of Good A in terms of B' },
                    { label: 'CA', expression: 'OC_A1 < OC_A2', description: 'Country 1 has comparative advantage in A' },
                    { label: 'TOT', expression: 'OC_A1 < P < OC_A2', description: 'Mutually beneficial terms of trade' },
                ]} />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={ECON_COLOR} />
                </div>
            </div>
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <Toggle label="Show Trade Flows" value={showTrade} onChange={setShowTrade} />
                    <Toggle label="Terms of Trade" value={showTermsOfTrade} onChange={setShowTermsOfTrade} />
                    <Slider label="Specialization" value={specializationLevel} onChange={setSpecializationLevel} min={0} max={1} step={0.05} />
                    <Button onClick={() => { setSpecializationLevel(0); setShowTrade(false); setShowTermsOfTrade(false) }} variant="secondary">Reset</Button>
                </div>
            </div>
        </div>
    )
}
