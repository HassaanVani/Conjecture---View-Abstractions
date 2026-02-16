import { useState, useEffect, useRef } from 'react'
import { ControlPanel, ControlGroup, Button, ButtonGroup, Toggle, Select } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode, type DemoStep } from '@/components/demo-mode'

const CHEM_COLOR = 'rgb(255, 160, 80)'
const BG = '#1a120a'

interface Atom {
    x: number; y: number; symbol: string; electrons: number
    color: string; electronegativity: number; group: number
}
interface Bond { from: number; to: number; type: 'ionic' | 'covalent' | 'polar-covalent' }

const atomDefs: { symbol: string; electrons: number; color: string; en: number; group: number }[] = [
    { symbol: 'H', electrons: 1, color: 'rgba(255,255,255,0.9)', en: 2.2, group: 1 },
    { symbol: 'C', electrons: 4, color: 'rgba(120,120,120,0.9)', en: 2.55, group: 14 },
    { symbol: 'N', electrons: 5, color: 'rgba(80,120,255,0.9)', en: 3.04, group: 15 },
    { symbol: 'O', electrons: 6, color: 'rgba(255,80,80,0.9)', en: 3.44, group: 16 },
    { symbol: 'F', electrons: 7, color: 'rgba(100,255,100,0.9)', en: 3.98, group: 17 },
    { symbol: 'Na', electrons: 1, color: 'rgba(200,160,255,0.9)', en: 0.93, group: 1 },
    { symbol: 'Cl', electrons: 7, color: 'rgba(80,255,80,0.9)', en: 3.16, group: 17 },
]

const presets: { id: string; label: string; atoms: Omit<Atom, 'x' | 'y'>[]; bonds: Bond[]; positions: { x: number; y: number }[] }[] = [
    {
        id: 'water', label: 'H2O',
        atoms: [
            { symbol: 'O', electrons: 6, color: 'rgba(255,80,80,0.9)', electronegativity: 3.44, group: 16 },
            { symbol: 'H', electrons: 1, color: 'rgba(255,255,255,0.9)', electronegativity: 2.2, group: 1 },
            { symbol: 'H', electrons: 1, color: 'rgba(255,255,255,0.9)', electronegativity: 2.2, group: 1 },
        ],
        bonds: [{ from: 0, to: 1, type: 'polar-covalent' }, { from: 0, to: 2, type: 'polar-covalent' }],
        positions: [{ x: 0.5, y: 0.45 }, { x: 0.38, y: 0.6 }, { x: 0.62, y: 0.6 }],
    },
    {
        id: 'nacl', label: 'NaCl',
        atoms: [
            { symbol: 'Na', electrons: 1, color: 'rgba(200,160,255,0.9)', electronegativity: 0.93, group: 1 },
            { symbol: 'Cl', electrons: 7, color: 'rgba(80,255,80,0.9)', electronegativity: 3.16, group: 17 },
        ],
        bonds: [{ from: 0, to: 1, type: 'ionic' }],
        positions: [{ x: 0.4, y: 0.5 }, { x: 0.6, y: 0.5 }],
    },
    {
        id: 'methane', label: 'CH4',
        atoms: [
            { symbol: 'C', electrons: 4, color: 'rgba(120,120,120,0.9)', electronegativity: 2.55, group: 14 },
            ...Array(4).fill(null).map(() => ({ symbol: 'H', electrons: 1, color: 'rgba(255,255,255,0.9)', electronegativity: 2.2, group: 1 })),
        ],
        bonds: [{ from: 0, to: 1, type: 'covalent' as const }, { from: 0, to: 2, type: 'covalent' as const }, { from: 0, to: 3, type: 'covalent' as const }, { from: 0, to: 4, type: 'covalent' as const }],
        positions: [{ x: 0.5, y: 0.5 }, { x: 0.4, y: 0.38 }, { x: 0.6, y: 0.38 }, { x: 0.4, y: 0.62 }, { x: 0.6, y: 0.62 }],
    },
    {
        id: 'hf', label: 'HF',
        atoms: [
            { symbol: 'H', electrons: 1, color: 'rgba(255,255,255,0.9)', electronegativity: 2.2, group: 1 },
            { symbol: 'F', electrons: 7, color: 'rgba(100,255,100,0.9)', electronegativity: 3.98, group: 17 },
        ],
        bonds: [{ from: 0, to: 1, type: 'polar-covalent' }],
        positions: [{ x: 0.4, y: 0.5 }, { x: 0.6, y: 0.5 }],
    },
]

export default function MolecularBonds() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [atoms, setAtoms] = useState<Atom[]>([])
    const [bonds, setBonds] = useState<Bond[]>([])
    const [selectedAtom, setSelectedAtom] = useState<number | null>(null)
    const [showElectrons, setShowElectrons] = useState(true)
    const [showEN, setShowEN] = useState(true)
    const [showPolarity, setShowPolarity] = useState(true)
    const [showLewis, setShowLewis] = useState(false)
    const [preset, setPreset] = useState('water')
    const frameRef = useRef(0)

    const loadPreset = (id: string) => {
        const p = presets.find(pr => pr.id === id)
        if (!p) return
        setPreset(id)
        setSelectedAtom(null)
        const canvas = canvasRef.current
        const w = canvas?.offsetWidth || 800
        const h = canvas?.offsetHeight || 600
        setAtoms(p.atoms.map((a, i) => ({ ...a, x: p.positions[i].x * w, y: p.positions[i].y * h })))
        setBonds([...p.bonds])
    }

    useEffect(() => { loadPreset('water') }, [])

    const addAtom = (def: typeof atomDefs[0]) => {
        const w = canvasRef.current?.offsetWidth || 800
        const h = canvasRef.current?.offsetHeight || 600
        setAtoms(prev => [...prev, {
            x: 150 + Math.random() * (w - 300),
            y: 100 + Math.random() * (h - 200),
            symbol: def.symbol, electrons: def.electrons, color: def.color,
            electronegativity: def.en, group: def.group,
        }])
    }

    const demoSteps: DemoStep[] = [
        { title: 'Chemical Bonding', description: 'Atoms bond by sharing or transferring electrons to achieve stable electron configurations. The type of bond depends on the electronegativity difference.', highlight: 'Select a preset molecule to explore.' },
        { title: 'Covalent Bonds', description: 'When electronegativity difference is < 0.5, atoms share electrons equally. Example: C-H bonds in methane (CH4).', setup: () => loadPreset('methane') },
        { title: 'Polar Covalent Bonds', description: 'When EN difference is 0.5-1.7, electrons are shared unequally. The more electronegative atom has a partial negative charge (d-).', setup: () => { loadPreset('water'); setShowPolarity(true) } },
        { title: 'Ionic Bonds', description: 'When EN difference > 1.7, one atom completely transfers electrons to the other, forming ions. Na (EN 0.93) and Cl (EN 3.16) differ by 2.23.', setup: () => loadPreset('nacl') },
        { title: 'Electronegativity Display', description: 'Each atom has an electronegativity value shown below it. Higher EN means stronger pull on shared electrons.', setup: () => { setShowEN(true) } },
        { title: 'Lewis Structures', description: 'Lewis dot structures show valence electrons as dots around each atom. Bonding pairs are shared between atoms; lone pairs belong to one atom.', setup: () => { loadPreset('water'); setShowLewis(true) } },
        { title: 'Bond Polarity Arrows', description: 'Polarity arrows point from the less electronegative atom toward the more electronegative one, showing the direction of electron density shift.', setup: () => { setShowPolarity(true); setShowLewis(false) } },
        { title: 'Build Your Own', description: 'Add atoms from the palette, then click two atoms to bond them. The bond type is determined automatically by their EN difference.', setup: () => { setAtoms([]); setBonds([]); setPreset('') } },
    ]

    const demo = useDemoMode(demoSteps)

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const idx = atoms.findIndex(a => Math.hypot(a.x - x, a.y - y) < 30)
        if (idx === -1) { setSelectedAtom(null); return }
        if (selectedAtom === null) { setSelectedAtom(idx); return }
        if (selectedAtom === idx) { setSelectedAtom(null); return }
        const exists = bonds.find(b => (b.from === selectedAtom && b.to === idx) || (b.from === idx && b.to === selectedAtom))
        if (!exists) {
            const enDiff = Math.abs(atoms[selectedAtom].electronegativity - atoms[idx].electronegativity)
            const type: Bond['type'] = enDiff > 1.7 ? 'ionic' : enDiff > 0.5 ? 'polar-covalent' : 'covalent'
            setBonds(prev => [...prev, { from: selectedAtom, to: idx, type }])
        }
        setSelectedAtom(null)
    }

    // Canvas render
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const resize = () => {
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        let animId: number
        const animate = () => {
            frameRef.current++
            const f = frameRef.current
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.fillStyle = BG
            ctx.fillRect(0, 0, w, h)

            // Bonds
            bonds.forEach(bond => {
                const a1 = atoms[bond.from]
                const a2 = atoms[bond.to]
                if (!a1 || !a2) return
                const dx = a2.x - a1.x
                const dy = a2.y - a1.y
                const dist = Math.hypot(dx, dy)
                const angle = Math.atan2(dy, dx)

                if (bond.type === 'ionic') {
                    ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)'
                    ctx.lineWidth = 3
                    ctx.setLineDash([8, 8])
                    ctx.beginPath()
                    ctx.moveTo(a1.x, a1.y)
                    ctx.lineTo(a2.x, a2.y)
                    ctx.stroke()
                    ctx.setLineDash([])
                    // Electron transfer animation
                    const t = (Math.sin(f * 0.05) + 1) / 2
                    ctx.fillStyle = 'rgba(255, 255, 100, 0.8)'
                    ctx.beginPath()
                    ctx.arc(a1.x + dx * t, a1.y + dy * t, 4, 0, Math.PI * 2)
                    ctx.fill()
                    // Charge labels
                    ctx.font = '16px sans-serif'
                    ctx.fillStyle = 'rgba(200,160,255,0.8)'
                    ctx.fillText('+', a1.x + 25, a1.y - 18)
                    ctx.fillStyle = 'rgba(80,255,80,0.8)'
                    ctx.fillText('-', a2.x + 25, a2.y - 18)
                } else {
                    const isPolar = bond.type === 'polar-covalent'
                    ctx.strokeStyle = isPolar ? 'rgba(255, 180, 100, 0.6)' : 'rgba(255, 160, 80, 0.5)'
                    ctx.lineWidth = 4
                    ctx.beginPath()
                    ctx.moveTo(a1.x, a1.y)
                    ctx.lineTo(a2.x, a2.y)
                    ctx.stroke()

                    // Shared electrons
                    const mx = (a1.x + a2.x) / 2
                    const my = (a1.y + a2.y) / 2
                    const perp = angle + Math.PI / 2
                    const osc = Math.sin(f * 0.03) * 3
                    ctx.fillStyle = 'rgba(255, 255, 100, 0.6)'
                    ctx.beginPath()
                    ctx.arc(mx + Math.cos(perp) * 6 + osc, my + Math.sin(perp) * 6, 3, 0, Math.PI * 2)
                    ctx.arc(mx - Math.cos(perp) * 6 - osc, my - Math.sin(perp) * 6, 3, 0, Math.PI * 2)
                    ctx.fill()

                    // Polarity arrow
                    if (showPolarity && isPolar) {
                        const enA = a1.electronegativity
                        const enB = a2.electronegativity
                        const moreEN = enB > enA ? 1 : -1
                        const arrowX = mx + Math.cos(angle) * 25 * moreEN
                        const arrowY = my + Math.sin(angle) * 25 * moreEN
                        ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)'
                        ctx.lineWidth = 2
                        ctx.beginPath()
                        ctx.moveTo(mx - Math.cos(angle) * 20 * moreEN, my - Math.sin(angle) * 20 * moreEN)
                        ctx.lineTo(arrowX, arrowY)
                        ctx.stroke()
                        // Arrowhead
                        ctx.fillStyle = 'rgba(255, 200, 100, 0.6)'
                        ctx.beginPath()
                        ctx.moveTo(arrowX, arrowY)
                        ctx.lineTo(arrowX - Math.cos(angle - 0.3) * 8, arrowY - Math.sin(angle - 0.3) * 8)
                        ctx.lineTo(arrowX - Math.cos(angle + 0.3) * 8, arrowY - Math.sin(angle + 0.3) * 8)
                        ctx.closePath()
                        ctx.fill()

                        // d+ and d- labels
                        const lessENAtom = enB > enA ? a1 : a2
                        const moreENAtom = enB > enA ? a2 : a1
                        ctx.font = '12px sans-serif'
                        ctx.textAlign = 'center'
                        ctx.fillStyle = 'rgba(255,200,100,0.7)'
                        ctx.fillText('d+', lessENAtom.x, lessENAtom.y - 30)
                        ctx.fillText('d-', moreENAtom.x, moreENAtom.y - 30)
                    }
                }
            })

            // Atoms
            atoms.forEach((atom, i) => {
                // Electron cloud
                if (showElectrons) {
                    const cr = 28 + atom.electrons * 3
                    const grad = ctx.createRadialGradient(atom.x, atom.y, 0, atom.x, atom.y, cr)
                    grad.addColorStop(0, 'rgba(255,160,80,0.12)')
                    grad.addColorStop(1, 'rgba(255,160,80,0)')
                    ctx.fillStyle = grad
                    ctx.beginPath()
                    ctx.arc(atom.x, atom.y, cr, 0, Math.PI * 2)
                    ctx.fill()

                    if (!showLewis) {
                        for (let e = 0; e < Math.min(atom.electrons, 8); e++) {
                            const ea = (e / 8) * Math.PI * 2 + f * 0.02
                            ctx.fillStyle = 'rgba(255, 255, 100, 0.5)'
                            ctx.beginPath()
                            ctx.arc(atom.x + Math.cos(ea) * 24, atom.y + Math.sin(ea) * 24, 3, 0, Math.PI * 2)
                            ctx.fill()
                        }
                    }
                }

                // Lewis dot structure
                if (showLewis) {
                    const valence = atom.electrons <= 4 ? atom.electrons : 8 - atom.electrons >= 0 ? atom.electrons : atom.electrons
                    const bondCount = bonds.filter(b => b.from === i || b.to === i).length
                    const loneElectrons = Math.max(0, valence - bondCount)
                    const positions2: [number, number][] = [
                        [0, -32], [32, 0], [0, 32], [-32, 0],
                        [-16, -32], [32, -16], [16, 32], [-32, 16],
                    ]
                    for (let le = 0; le < Math.min(loneElectrons, 8); le++) {
                        const [ox, oy] = positions2[le % positions2.length]
                        ctx.fillStyle = 'rgba(255, 255, 100, 0.7)'
                        ctx.beginPath()
                        ctx.arc(atom.x + ox, atom.y + oy, 3, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }

                // Nucleus
                ctx.fillStyle = atom.color
                ctx.beginPath()
                ctx.arc(atom.x, atom.y, 20, 0, Math.PI * 2)
                ctx.fill()

                // Selection ring
                if (selectedAtom === i) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.arc(atom.x, atom.y, 28, 0, Math.PI * 2)
                    ctx.stroke()
                }

                // Symbol
                ctx.fillStyle = ['C', 'N'].includes(atom.symbol) ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'
                ctx.font = 'bold 14px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(atom.symbol, atom.x, atom.y)

                // EN value
                if (showEN) {
                    ctx.fillStyle = 'rgba(255,200,100,0.6)'
                    ctx.font = '11px monospace'
                    ctx.textBaseline = 'top'
                    ctx.fillText(`EN: ${atom.electronegativity.toFixed(2)}`, atom.x, atom.y + 26)
                    ctx.textBaseline = 'middle'
                }
            })

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
    }, [atoms, bonds, selectedAtom, showElectrons, showEN, showPolarity, showLewis])

    return (
        <div className="h-[calc(100vh-64px)] relative overflow-hidden" style={{ background: BG }}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-pointer" onClick={handleCanvasClick} />

            <div className="absolute top-4 right-4 z-10">
                <APTag course="Chemistry" unit="Unit 2" color={CHEM_COLOR} />
            </div>

            {atoms.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm z-10 pointer-events-none">
                    Add atoms or select a preset molecule
                </div>
            )}
            {selectedAtom !== null && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-white/60 z-10">
                    Click another atom to create a bond
                </div>
            )}

            {/* Controls */}
            <div className="absolute top-16 left-4 w-64 z-10 space-y-3">
                <ControlPanel>
                    <Select
                        value={preset}
                        onChange={(v) => loadPreset(v)}
                        options={presets.map(p => ({ value: p.id, label: p.label }))}
                        label="Preset Molecules"
                    />
                    <ControlGroup label="Add Atoms">
                        <div className="flex flex-wrap gap-1.5">
                            {atomDefs.map(def => (
                                <button
                                    key={def.symbol}
                                    onClick={() => addAtom(def)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-110"
                                    style={{ backgroundColor: def.color }}
                                    title={`${def.symbol} (EN: ${def.en})`}
                                >
                                    <span style={{ color: ['C', 'N'].includes(def.symbol) ? '#fff' : '#000' }}>{def.symbol}</span>
                                </button>
                            ))}
                        </div>
                    </ControlGroup>
                    <Toggle value={showElectrons} onChange={setShowElectrons} label="Electron Cloud" />
                    <Toggle value={showEN} onChange={setShowEN} label="Electronegativity" />
                    <Toggle value={showPolarity} onChange={setShowPolarity} label="Polarity Arrows" />
                    <Toggle value={showLewis} onChange={setShowLewis} label="Lewis Dots" />
                    <div className="flex gap-2">
                        <Button onClick={() => { setAtoms([]); setBonds([]); setSelectedAtom(null); setPreset('') }} variant="secondary" className="flex-1 text-xs">Clear All</Button>
                        <Button onClick={demo.open} variant="secondary" className="flex-1 text-xs">Demo</Button>
                    </div>
                </ControlPanel>
            </div>

            {/* Info panel */}
            <div className="absolute top-16 right-4 w-64 z-10 space-y-3">
                <InfoPanel
                    title="Bond Info"
                    departmentColor={CHEM_COLOR}
                    items={[
                        { label: 'Atoms', value: atoms.length },
                        { label: 'Bonds', value: bonds.length },
                        { label: 'Ionic', value: bonds.filter(b => b.type === 'ionic').length },
                        { label: 'Polar Covalent', value: bonds.filter(b => b.type === 'polar-covalent').length },
                        { label: 'Covalent', value: bonds.filter(b => b.type === 'covalent').length },
                    ]}
                />
                <EquationDisplay
                    departmentColor={CHEM_COLOR}
                    title="Bond Types"
                    equations={[
                        { label: 'Ionic', expression: 'dEN > 1.7', description: 'Electron transfer (metal + nonmetal)' },
                        { label: 'Polar', expression: '0.5 < dEN < 1.7', description: 'Unequal sharing' },
                        { label: 'Covalent', expression: 'dEN < 0.5', description: 'Equal sharing (nonmetals)' },
                    ]}
                />
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                <DemoMode
                    steps={demoSteps}
                    currentStep={demo.currentStep}
                    isOpen={demo.isOpen}
                    onClose={demo.close}
                    onNext={demo.next}
                    onPrev={demo.prev}
                    onGoToStep={demo.goToStep}
                    departmentColor={CHEM_COLOR}
                    title="AP Chemistry | Unit 2"
                />
            </div>
        </div>
    )
}
