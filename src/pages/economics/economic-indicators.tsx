import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type View = 'cpi' | 'unemployment' | 'gdp'

const GOLD = 'rgb(220, 180, 80)'

interface BasketItem { name: string; basePrice: number; currentPrice: number; weight: number; color: string }

const defaultBasket: BasketItem[] = [
    { name: 'Housing', basePrice: 1200, currentPrice: 1400, weight: 0.33, color: 'rgba(255,120,80,0.9)' },
    { name: 'Food', basePrice: 400, currentPrice: 460, weight: 0.14, color: 'rgba(100,200,120,0.9)' },
    { name: 'Transport', basePrice: 300, currentPrice: 370, weight: 0.15, color: 'rgba(100,150,255,0.9)' },
    { name: 'Medical', basePrice: 250, currentPrice: 320, weight: 0.09, color: 'rgba(200,100,255,0.9)' },
    { name: 'Education', basePrice: 200, currentPrice: 260, weight: 0.07, color: 'rgba(255,200,80,0.9)' },
    { name: 'Apparel', basePrice: 100, currentPrice: 108, weight: 0.06, color: 'rgba(255,150,200,0.9)' },
    { name: 'Recreation', basePrice: 150, currentPrice: 165, weight: 0.06, color: 'rgba(80,220,220,0.9)' },
    { name: 'Other', basePrice: 200, currentPrice: 225, weight: 0.10, color: 'rgba(180,180,180,0.9)' },
]

interface GDPPeriod { year: number; nominal: number; deflator: number; C: number; I: number; G: number; NX: number }

const defaultGDPData: GDPPeriod[] = [
    { year: 2018, nominal: 20.5, deflator: 100, C: 14.0, I: 3.6, G: 3.5, NX: -0.6 },
    { year: 2019, nominal: 21.4, deflator: 104, C: 14.6, I: 3.7, G: 3.7, NX: -0.6 },
    { year: 2020, nominal: 21.0, deflator: 106, C: 14.0, I: 3.5, G: 4.1, NX: -0.6 },
    { year: 2021, nominal: 23.3, deflator: 112, C: 15.8, I: 4.0, G: 4.0, NX: -0.5 },
    { year: 2022, nominal: 25.5, deflator: 120, C: 17.4, I: 4.4, G: 4.3, NX: -0.6 },
    { year: 2023, nominal: 27.4, deflator: 125, C: 18.7, I: 4.6, G: 4.6, NX: -0.5 },
    { year: 2024, nominal: 28.8, deflator: 129, C: 19.5, I: 4.8, G: 4.9, NX: -0.4 },
]

export default function EconomicIndicators() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [view, setView] = useState<View>('cpi')

    // CPI state
    const [basket, setBasket] = useState<BasketItem[]>(defaultBasket)
    const [baseYear] = useState(2020)
    const [currentYear] = useState(2024)

    // Unemployment state
    const [population] = useState(330)
    const [laborForceParticipation, setLaborForceParticipation] = useState(62)
    const [frictional, setFrictional] = useState(2.5)
    const [structural, setStructural] = useState(1.5)
    const [cyclical, setCyclical] = useState(1.0)

    // GDP state
    const [gdpData] = useState<GDPPeriod[]>(defaultGDPData)
    const [showComponents, setShowComponents] = useState(false)

    // Derived values
    const baseCost = useMemo(() => basket.reduce((s, b) => s + b.basePrice * b.weight, 0), [basket])
    const currentCost = useMemo(() => basket.reduce((s, b) => s + b.currentPrice * b.weight, 0), [basket])
    const cpiValue = useMemo(() => (currentCost / baseCost) * 100, [currentCost, baseCost])
    const inflationRate = useMemo(() => cpiValue - 100, [cpiValue])

    const laborForce = useMemo(() => population * (laborForceParticipation / 100), [population, laborForceParticipation])
    const unemploymentRate = useMemo(() => frictional + structural + cyclical, [frictional, structural, cyclical])
    const unemployedCount = useMemo(() => laborForce * (unemploymentRate / 100), [laborForce, unemploymentRate])
    const employedCount = useMemo(() => laborForce - unemployedCount, [laborForce, unemployedCount])
    const notInLaborForce = useMemo(() => population - laborForce, [population, laborForce])
    const naturalRate = useMemo(() => frictional + structural, [frictional, structural])

    const updateBasketPrice = useCallback((index: number, price: number) => {
        setBasket(prev => prev.map((item, i) => i === index ? { ...item, currentPrice: price } : item))
    }, [])

    const resetAll = useCallback(() => {
        setView('cpi')
        setBasket(defaultBasket)
        setLaborForceParticipation(62)
        setFrictional(2.5)
        setStructural(1.5)
        setCyclical(1.0)
        setShowComponents(false)
    }, [])

    const demoSteps: DemoStep[] = useMemo(() => [
        { title: 'GDP & Its Limits', description: 'Gross Domestic Product measures the total market value of all final goods and services produced within a country in a year. It misses non-market activity, quality improvements, and distribution.', setup: () => { setView('gdp'); setShowComponents(false) } },
        { title: 'CPI & Price Indices', description: 'The Consumer Price Index tracks prices of a fixed market basket of goods and services over time. Each category has a weight reflecting its share of consumer spending.', setup: () => { setView('cpi'); setBasket(defaultBasket) } },
        { title: 'Calculating Inflation', description: 'Inflation rate = percentage change in CPI. Adjust current prices to see how different sectors drive overall inflation. Housing has the largest weight.', setup: () => { setView('cpi'); setBasket(prev => prev.map(b => b.name === 'Housing' ? { ...b, currentPrice: 1500 } : b)) } },
        { title: 'Types of Unemployment', description: 'Frictional: job search between positions. Structural: skills mismatch or automation. Cyclical: due to recessions. Only cyclical varies with the business cycle.', setup: () => { setView('unemployment'); setFrictional(2.5); setStructural(1.5); setCyclical(2.0) } },
        { title: 'Natural Rate of Unemployment', description: 'NRU = frictional + structural unemployment. The economy is at "full employment" when cyclical unemployment is zero, NOT when unemployment is zero.', setup: () => { setView('unemployment'); setFrictional(2.5); setStructural(1.5); setCyclical(0) } },
        { title: 'Real vs Nominal GDP', description: 'Nominal GDP is measured in current prices. Real GDP adjusts for inflation using a base year deflator. The gap between them reveals how much of GDP growth is just price increases.', setup: () => { setView('gdp'); setShowComponents(false) } },
        { title: 'GDP Deflator', description: 'GDP Deflator = (Nominal GDP / Real GDP) x 100. It measures the price level of ALL domestically produced goods, unlike CPI which only tracks consumer purchases.', setup: () => { setView('gdp'); setShowComponents(false) } },
        { title: 'Experiment', description: 'Switch between views, adjust prices and unemployment sliders, toggle GDP components. Explore how these indicators are connected!', setup: () => resetAll() },
    ], [resetAll])

    const demo = useDemoMode(demoSteps)

    // Canvas drawing
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const resize = () => { canvas.width = canvas.offsetWidth * window.devicePixelRatio; canvas.height = canvas.offsetHeight * window.devicePixelRatio; ctx.scale(window.devicePixelRatio, window.devicePixelRatio) }
        resize()
        window.addEventListener('resize', resize)
        const W = canvas.offsetWidth, H = canvas.offsetHeight
        ctx.fillStyle = '#1a150a'; ctx.fillRect(0, 0, W, H)

        if (view === 'cpi') drawCPI(ctx, W, H)
        else if (view === 'unemployment') drawUnemployment(ctx, W, H)
        else drawGDP(ctx, W, H)

        return () => window.removeEventListener('resize', resize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, basket, frictional, structural, cyclical, laborForceParticipation, gdpData, showComponents])

    function drawCPI(ctx: CanvasRenderingContext2D, W: number, H: number) {
        const pad = 80, chartH = H - pad * 2 - 60
        const barW = Math.min(50, (W - pad * 2) / basket.length - 12)
        const maxChange = Math.max(...basket.map(b => Math.abs((b.currentPrice - b.basePrice) / b.basePrice * 100)), 10)

        // Title
        ctx.fillStyle = GOLD; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(`CPI Price Changes: ${baseYear} to ${currentYear}`, W / 2, 35)

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(pad, pad + 20); ctx.lineTo(pad, pad + chartH + 20); ctx.lineTo(W - pad, pad + chartH + 20); ctx.stroke()

        // Y axis label
        ctx.save(); ctx.translate(22, H / 2 - 20); ctx.rotate(-Math.PI / 2)
        ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('Price Change (%)', 0, 0); ctx.restore()

        // Grid lines and ticks
        ctx.font = '10px system-ui'; ctx.fillStyle = 'rgba(220,180,80,0.5)'; ctx.textAlign = 'right'
        const steps = 5
        for (let i = 0; i <= steps; i++) {
            const val = (maxChange / steps) * i
            const y = pad + chartH + 20 - (val / maxChange) * chartH
            ctx.strokeStyle = 'rgba(220,180,80,0.06)'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.5)'; ctx.fillText(`${val.toFixed(0)}%`, pad - 8, y + 4)
        }

        // Zero line
        const zeroY = pad + chartH + 20
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(pad, zeroY); ctx.lineTo(W - pad, zeroY); ctx.stroke()

        // Bars
        const totalBarArea = W - pad * 2
        const gap = totalBarArea / basket.length
        basket.forEach((item, i) => {
            const pctChange = ((item.currentPrice - item.basePrice) / item.basePrice) * 100
            const barH = (Math.abs(pctChange) / maxChange) * chartH
            const x = pad + gap * i + (gap - barW) / 2
            const y = zeroY - barH

            // Bar
            ctx.fillStyle = item.color; ctx.beginPath()
            ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]); ctx.fill()

            // Glow
            const glow = ctx.createLinearGradient(x, y, x, y + barH)
            glow.addColorStop(0, item.color.replace('0.9', '0.3')); glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow; ctx.fillRect(x, y, barW, barH)

            // Value label
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'
            ctx.fillText(`${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}%`, x + barW / 2, y - 6)

            // Category label
            ctx.fillStyle = 'rgba(220,180,80,0.6)'; ctx.font = '10px system-ui'
            ctx.save(); ctx.translate(x + barW / 2, zeroY + 14); ctx.rotate(-Math.PI / 6)
            ctx.textAlign = 'right'; ctx.fillText(item.name, 0, 0); ctx.restore()

            // Weight indicator
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(`${(item.weight * 100).toFixed(0)}%w`, x + barW / 2, zeroY + 36)
        })

        // CPI summary box
        const boxX = W - 230, boxY = 50
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.roundRect(boxX, boxY, 200, 80, 10); ctx.fill()
        ctx.strokeStyle = 'rgba(220,180,80,0.3)'; ctx.lineWidth = 1; ctx.stroke()
        ctx.fillStyle = GOLD; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'left'
        ctx.fillText(`CPI = ${cpiValue.toFixed(1)}`, boxX + 15, boxY + 25)
        ctx.fillStyle = inflationRate > 0 ? 'rgba(255,120,80,0.9)' : 'rgba(100,200,120,0.9)'
        ctx.font = 'bold 20px monospace'
        ctx.fillText(`${inflationRate > 0 ? '+' : ''}${inflationRate.toFixed(2)}%`, boxX + 15, boxY + 55)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px system-ui'
        ctx.fillText('inflation rate', boxX + 130, boxY + 55)
    }

    function drawUnemployment(ctx: CanvasRenderingContext2D, W: number, H: number) {
        ctx.fillStyle = GOLD; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('Labor Force Breakdown', W / 2, 35)

        // Stacked horizontal bar
        const barX = 100, barY = 70, barW = W - 200, barH = 60
        const segments = [
            { label: 'Employed', value: employedCount, color: 'rgba(80,200,120,0.85)' },
            { label: 'Frictional', value: laborForce * (frictional / 100), color: 'rgba(255,200,80,0.85)' },
            { label: 'Structural', value: laborForce * (structural / 100), color: 'rgba(255,140,60,0.85)' },
            { label: 'Cyclical', value: laborForce * (cyclical / 100), color: 'rgba(255,80,80,0.85)' },
        ]
        const total = laborForce

        let curX = barX
        segments.forEach(seg => {
            const segW = (seg.value / total) * barW
            if (segW < 1) return
            ctx.fillStyle = seg.color
            ctx.beginPath(); ctx.roundRect(curX, barY, segW, barH, curX === barX ? [8, 0, 0, 8] : 0)
            ctx.fill()
            if (segW > 40) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'
                ctx.fillText(seg.label, curX + segW / 2, barY + barH / 2 - 6)
                ctx.fillText(`${seg.value.toFixed(1)}M`, curX + segW / 2, barY + barH / 2 + 10)
            }
            curX += segW
        })

        // Not in labor force bar
        const nilfBarY = barY + barH + 20
        ctx.fillStyle = 'rgba(120,120,150,0.5)'
        ctx.beginPath(); ctx.roundRect(barX, nilfBarY, (notInLaborForce / population) * barW, 30, 8); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px system-ui'; ctx.textAlign = 'left'
        ctx.fillText(`Not in Labor Force: ${notInLaborForce.toFixed(1)}M (${(100 - laborForceParticipation).toFixed(1)}%)`, barX + 10, nilfBarY + 20)

        // Pie chart
        const cx = W / 2, cy = H / 2 + 50, radius = Math.min(W, H) * 0.22
        const pieData = [
            { label: 'Employed', pct: (employedCount / population) * 100, color: 'rgba(80,200,120,0.85)' },
            { label: 'Frictional U.', pct: (laborForce * frictional / 100 / population) * 100, color: 'rgba(255,200,80,0.85)' },
            { label: 'Structural U.', pct: (laborForce * structural / 100 / population) * 100, color: 'rgba(255,140,60,0.85)' },
            { label: 'Cyclical U.', pct: (laborForce * cyclical / 100 / population) * 100, color: 'rgba(255,80,80,0.85)' },
            { label: 'Not in LF', pct: (notInLaborForce / population) * 100, color: 'rgba(120,120,150,0.5)' },
        ]

        let startAngle = -Math.PI / 2
        pieData.forEach(slice => {
            const sliceAngle = (slice.pct / 100) * Math.PI * 2
            ctx.beginPath(); ctx.moveTo(cx, cy)
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle)
            ctx.closePath(); ctx.fillStyle = slice.color; ctx.fill()
            ctx.strokeStyle = '#1a150a'; ctx.lineWidth = 2; ctx.stroke()

            // Label
            if (slice.pct > 2) {
                const midAngle = startAngle + sliceAngle / 2
                const labelR = radius + 28
                const lx = cx + Math.cos(midAngle) * labelR
                const ly = cy + Math.sin(midAngle) * labelR
                ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '11px system-ui'
                ctx.textAlign = midAngle > Math.PI / 2 || midAngle < -Math.PI / 2 ? 'right' : 'left'
                ctx.fillText(`${slice.label} ${slice.pct.toFixed(1)}%`, lx, ly)
            }
            startAngle += sliceAngle
        })

        // Center label
        ctx.fillStyle = 'rgba(220,180,80,0.9)'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'
        ctx.fillText(`${unemploymentRate.toFixed(1)}%`, cx, cy - 4)
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px system-ui'
        ctx.fillText('U-Rate', cx, cy + 14)

        // Key stats at bottom
        const statsY = H - 60
        const stats = [
            { label: 'Population', value: `${population}M`, color: 'rgba(255,255,255,0.7)' },
            { label: 'Labor Force', value: `${laborForce.toFixed(1)}M`, color: 'rgba(100,150,255,0.9)' },
            { label: 'Natural Rate', value: `${naturalRate.toFixed(1)}%`, color: GOLD },
            { label: 'U-Rate', value: `${unemploymentRate.toFixed(1)}%`, color: unemploymentRate > naturalRate ? 'rgba(255,100,100,1)' : 'rgba(80,200,120,1)' },
        ]
        const statSpacing = W / (stats.length + 1)
        stats.forEach((s, i) => {
            const sx = statSpacing * (i + 1)
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(s.label, sx, statsY)
            ctx.fillStyle = s.color; ctx.font = 'bold 16px monospace'
            ctx.fillText(s.value, sx, statsY + 20)
        })
    }

    function drawGDP(ctx: CanvasRenderingContext2D, W: number, H: number) {
        const pad = 80, chartH = H - pad * 2 - 60
        ctx.fillStyle = GOLD; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(showComponents ? 'GDP Components (Expenditure Approach)' : 'Nominal vs Real GDP (Trillions $)', W / 2, 35)

        const maxVal = Math.max(...gdpData.map(d => d.nominal)) * 1.15
        const barGroupW = (W - pad * 2) / gdpData.length
        const barW = showComponents ? barGroupW * 0.75 : barGroupW * 0.35

        // Axes
        ctx.strokeStyle = 'rgba(220,180,80,0.5)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(pad, pad + 20); ctx.lineTo(pad, pad + chartH + 20); ctx.lineTo(W - pad, pad + chartH + 20); ctx.stroke()
        ctx.save(); ctx.translate(22, H / 2 - 20); ctx.rotate(-Math.PI / 2)
        ctx.fillStyle = 'rgba(220,180,80,0.8)'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('$ Trillions', 0, 0); ctx.restore()

        // Grid
        const gridSteps = 6
        for (let i = 0; i <= gridSteps; i++) {
            const val = (maxVal / gridSteps) * i
            const y = pad + chartH + 20 - (val / maxVal) * chartH
            ctx.strokeStyle = 'rgba(220,180,80,0.06)'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke()
            ctx.fillStyle = 'rgba(220,180,80,0.5)'; ctx.font = '10px system-ui'; ctx.textAlign = 'right'
            ctx.fillText(`$${val.toFixed(0)}T`, pad - 8, y + 4)
        }

        const zeroY = pad + chartH + 20

        gdpData.forEach((d, i) => {
            const groupX = pad + barGroupW * i

            if (showComponents) {
                // Stacked bar for components
                const comps = [
                    { label: 'C', value: d.C, color: 'rgba(100,200,120,0.85)' },
                    { label: 'I', value: d.I, color: 'rgba(100,150,255,0.85)' },
                    { label: 'G', value: d.G, color: 'rgba(255,200,80,0.85)' },
                    { label: 'NX', value: d.NX, color: d.NX >= 0 ? 'rgba(200,100,255,0.85)' : 'rgba(255,80,80,0.6)' },
                ]
                let curY = zeroY
                const bx = groupX + (barGroupW - barW) / 2
                comps.forEach(c => {
                    if (c.value <= 0) return
                    const h = (c.value / maxVal) * chartH
                    curY -= h
                    ctx.fillStyle = c.color
                    ctx.beginPath(); ctx.roundRect(bx, curY, barW, h, 2); ctx.fill()
                    if (h > 16) {
                        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'
                        ctx.fillText(`${c.label}: ${c.value.toFixed(1)}`, bx + barW / 2, curY + h / 2 + 4)
                    }
                })
                // NX (negative) below zero if needed
                if (d.NX < 0) {
                    const h = (Math.abs(d.NX) / maxVal) * chartH
                    ctx.fillStyle = 'rgba(255,80,80,0.5)'
                    ctx.beginPath(); ctx.roundRect(bx, zeroY, barW, h, 2); ctx.fill()
                    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'
                    ctx.fillText(`NX`, bx + barW / 2, zeroY + h + 12)
                }
            } else {
                // Nominal bar
                const nomH = (d.nominal / maxVal) * chartH
                const nx = groupX + barGroupW * 0.15
                ctx.fillStyle = 'rgba(100,150,255,0.75)'
                ctx.beginPath(); ctx.roundRect(nx, zeroY - nomH, barW, nomH, [4, 4, 0, 0]); ctx.fill()

                // Real bar
                const realGDP = d.nominal / (d.deflator / 100)
                const realH = (realGDP / maxVal) * chartH
                const rx = groupX + barGroupW * 0.52
                ctx.fillStyle = 'rgba(80,200,120,0.75)'
                ctx.beginPath(); ctx.roundRect(rx, zeroY - realH, barW, realH, [4, 4, 0, 0]); ctx.fill()

                // Value labels
                ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'
                ctx.fillText(`$${d.nominal.toFixed(1)}`, nx + barW / 2, zeroY - nomH - 6)
                ctx.fillText(`$${realGDP.toFixed(1)}`, rx + barW / 2, zeroY - realH - 6)
            }

            // Year labels
            ctx.fillStyle = 'rgba(220,180,80,0.6)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'
            ctx.fillText(String(d.year), groupX + barGroupW / 2, zeroY + 18)

            // Deflator
            if (!showComponents) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '9px system-ui'
                ctx.fillText(`D:${d.deflator}`, groupX + barGroupW / 2, zeroY + 32)
            }
        })

        // Legend
        if (!showComponents) {
            const lx = W - 180, ly = 55
            ctx.fillStyle = 'rgba(100,150,255,0.75)'; ctx.beginPath(); ctx.roundRect(lx, ly, 14, 14, 3); ctx.fill()
            ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px system-ui'; ctx.textAlign = 'left'
            ctx.fillText('Nominal GDP', lx + 20, ly + 12)
            ctx.fillStyle = 'rgba(80,200,120,0.75)'; ctx.beginPath(); ctx.roundRect(lx, ly + 22, 14, 14, 3); ctx.fill()
            ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('Real GDP', lx + 20, ly + 34)
        } else {
            const lx = W - 200, ly = 50
            const items = [
                { label: 'Consumption (C)', color: 'rgba(100,200,120,0.85)' },
                { label: 'Investment (I)', color: 'rgba(100,150,255,0.85)' },
                { label: 'Government (G)', color: 'rgba(255,200,80,0.85)' },
                { label: 'Net Exports (NX)', color: 'rgba(255,80,80,0.6)' },
            ]
            items.forEach((item, idx) => {
                ctx.fillStyle = item.color; ctx.beginPath(); ctx.roundRect(lx, ly + idx * 20, 12, 12, 3); ctx.fill()
                ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '11px system-ui'; ctx.textAlign = 'left'
                ctx.fillText(item.label, lx + 18, ly + idx * 20 + 11)
            })
        }
    }

    const viewEquations = useMemo(() => {
        if (view === 'cpi') return [
            { label: 'CPI', expression: '(Cost_current / Cost_base) × 100', description: 'Consumer Price Index' },
            { label: 'Inflation', expression: '((CPI₂ - CPI₁)/CPI₁) × 100', description: 'Inflation rate' },
        ]
        if (view === 'unemployment') return [
            { label: 'U-rate', expression: '(Unemployed / Labor Force) × 100', description: 'Unemployment rate' },
            { label: 'NRU', expression: 'Frictional + Structural', description: 'Natural rate of unemployment' },
        ]
        return [
            { label: 'Real GDP', expression: 'Nominal GDP / (Deflator/100)', description: 'Adjusted for price level' },
            { label: 'Deflator', expression: '(Nominal / Real) × 100', description: 'GDP price index' },
        ]
    }, [view])

    const infoPanelItems = useMemo(() => {
        if (view === 'cpi') return [
            { label: 'CPI Value', value: cpiValue.toFixed(1), color: GOLD },
            { label: 'Inflation Rate', value: `${inflationRate > 0 ? '+' : ''}${inflationRate.toFixed(2)}%`, color: inflationRate > 3 ? 'rgba(255,100,100,1)' : 'rgba(80,200,120,1)' },
            { label: 'Base Cost', value: `$${baseCost.toFixed(0)}`, color: 'rgba(100,150,255,1)' },
            { label: 'Current Cost', value: `$${currentCost.toFixed(0)}`, color: 'rgba(255,150,100,1)' },
        ]
        if (view === 'unemployment') return [
            { label: 'U-Rate', value: `${unemploymentRate.toFixed(1)}%`, color: unemploymentRate > naturalRate ? 'rgba(255,100,100,1)' : 'rgba(80,200,120,1)' },
            { label: 'Natural Rate', value: `${naturalRate.toFixed(1)}%`, color: GOLD },
            { label: 'Labor Force', value: `${laborForce.toFixed(1)}M`, color: 'rgba(100,150,255,1)' },
            { label: 'Employed', value: `${employedCount.toFixed(1)}M`, color: 'rgba(80,200,120,1)' },
        ]
        const latest = gdpData[gdpData.length - 1]
        const latestReal = latest.nominal / (latest.deflator / 100)
        return [
            { label: 'Nominal GDP', value: `$${latest.nominal.toFixed(1)}T`, color: 'rgba(100,150,255,1)' },
            { label: 'Real GDP', value: `$${latestReal.toFixed(1)}T`, color: 'rgba(80,200,120,1)' },
            { label: 'GDP Deflator', value: `${latest.deflator}`, color: GOLD },
            { label: 'Year', value: `${latest.year}`, color: 'rgba(255,255,255,0.7)' },
        ]
    }, [view, cpiValue, inflationRate, baseCost, currentCost, unemploymentRate, naturalRate, laborForce, employedCount, gdpData])

    const infoTitle = view === 'cpi' ? 'Price Level' : view === 'unemployment' ? 'Labor Market' : 'Output'

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a150a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <div className="absolute top-4 left-4 space-y-3 max-w-[280px]">
                    <ControlPanel>
                        <ControlGroup label="Indicator">
                            <ButtonGroup value={view} onChange={v => setView(v as View)} options={[
                                { value: 'cpi', label: 'CPI' },
                                { value: 'unemployment', label: 'Unemploy.' },
                                { value: 'gdp', label: 'GDP' },
                            ]} color={GOLD} />
                        </ControlGroup>

                        {view === 'cpi' && (
                            <>
                                <Slider label="Housing Price" value={basket[0].currentPrice} onChange={v => updateBasketPrice(0, v)} min={800} max={2000} step={10} />
                                <Slider label="Food Price" value={basket[1].currentPrice} onChange={v => updateBasketPrice(1, v)} min={200} max={800} step={10} />
                                <Slider label="Transport Price" value={basket[2].currentPrice} onChange={v => updateBasketPrice(2, v)} min={150} max={600} step={10} />
                                <Slider label="Medical Price" value={basket[3].currentPrice} onChange={v => updateBasketPrice(3, v)} min={100} max={600} step={10} />
                            </>
                        )}

                        {view === 'unemployment' && (
                            <>
                                <Slider label="Frictional %" value={frictional} onChange={setFrictional} min={0} max={6} step={0.5} />
                                <Slider label="Structural %" value={structural} onChange={setStructural} min={0} max={6} step={0.5} />
                                <Slider label="Cyclical %" value={cyclical} onChange={setCyclical} min={0} max={10} step={0.5} />
                                <Slider label="LF Participation %" value={laborForceParticipation} onChange={setLaborForceParticipation} min={50} max={75} step={1} />
                            </>
                        )}

                        {view === 'gdp' && (
                            <Toggle label="Show Components (C+I+G+NX)" value={showComponents} onChange={setShowComponents} />
                        )}

                        <div className="flex gap-2">
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                            <Button onClick={resetAll} variant="secondary">Reset</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="Macroeconomics" unit="Unit 2" color={GOLD} />
                </div>

                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel departmentColor={GOLD} title={infoTitle} items={infoPanelItems} />
                    <EquationDisplay departmentColor={GOLD} title="Key Equations" collapsed equations={viewEquations} />
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode steps={demoSteps} currentStep={demo.currentStep} isOpen={demo.isOpen} onClose={demo.close} onNext={demo.next} onPrev={demo.prev} onGoToStep={demo.goToStep} departmentColor={GOLD} />
                </div>
            </div>
        </div>
    )
}
