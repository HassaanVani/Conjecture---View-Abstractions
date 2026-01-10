import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Atom {
    x: number
    y: number
    symbol: string
    electrons: number
    color: string
}

interface Bond {
    from: number
    to: number
    type: 'ionic' | 'covalent'
}

const atomTypes = [
    { symbol: 'H', electrons: 1, color: 'rgba(255, 255, 255, 0.9)' },
    { symbol: 'O', electrons: 6, color: 'rgba(255, 80, 80, 0.9)' },
    { symbol: 'N', electrons: 5, color: 'rgba(80, 120, 255, 0.9)' },
    { symbol: 'C', electrons: 4, color: 'rgba(100, 100, 100, 0.9)' },
    { symbol: 'Na', electrons: 1, color: 'rgba(200, 160, 255, 0.9)' },
    { symbol: 'Cl', electrons: 7, color: 'rgba(80, 255, 80, 0.9)' },
]

export default function MolecularBonds() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [atoms, setAtoms] = useState<Atom[]>([])
    const [bonds, setBonds] = useState<Bond[]>([])
    const [selectedAtom, setSelectedAtom] = useState<number | null>(null)
    const [showElectrons, setShowElectrons] = useState(true)
    const [preset, setPreset] = useState<string>('')

    const loadPreset = (name: string) => {
        setPreset(name)
        setSelectedAtom(null)

        if (name === 'water') {
            setAtoms([
                { x: 400, y: 300, symbol: 'O', electrons: 6, color: 'rgba(255, 80, 80, 0.9)' },
                { x: 320, y: 380, symbol: 'H', electrons: 1, color: 'rgba(255, 255, 255, 0.9)' },
                { x: 480, y: 380, symbol: 'H', electrons: 1, color: 'rgba(255, 255, 255, 0.9)' },
            ])
            setBonds([
                { from: 0, to: 1, type: 'covalent' },
                { from: 0, to: 2, type: 'covalent' },
            ])
        } else if (name === 'nacl') {
            setAtoms([
                { x: 350, y: 300, symbol: 'Na', electrons: 1, color: 'rgba(200, 160, 255, 0.9)' },
                { x: 450, y: 300, symbol: 'Cl', electrons: 7, color: 'rgba(80, 255, 80, 0.9)' },
            ])
            setBonds([
                { from: 0, to: 1, type: 'ionic' },
            ])
        } else if (name === 'methane') {
            setAtoms([
                { x: 400, y: 300, symbol: 'C', electrons: 4, color: 'rgba(100, 100, 100, 0.9)' },
                { x: 340, y: 240, symbol: 'H', electrons: 1, color: 'rgba(255, 255, 255, 0.9)' },
                { x: 460, y: 240, symbol: 'H', electrons: 1, color: 'rgba(255, 255, 255, 0.9)' },
                { x: 340, y: 360, symbol: 'H', electrons: 1, color: 'rgba(255, 255, 255, 0.9)' },
                { x: 460, y: 360, symbol: 'H', electrons: 1, color: 'rgba(255, 255, 255, 0.9)' },
            ])
            setBonds([
                { from: 0, to: 1, type: 'covalent' },
                { from: 0, to: 2, type: 'covalent' },
                { from: 0, to: 3, type: 'covalent' },
                { from: 0, to: 4, type: 'covalent' },
            ])
        } else {
            setAtoms([])
            setBonds([])
        }
    }

    const addAtom = (type: typeof atomTypes[0]) => {
        const canvas = canvasRef.current
        if (!canvas) return

        setAtoms(prev => [...prev, {
            x: 200 + Math.random() * 400,
            y: 150 + Math.random() * 300,
            ...type,
        }])
        setPreset('')
    }

    const clear = () => {
        setAtoms([])
        setBonds([])
        setSelectedAtom(null)
        setPreset('')
    }

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

        let frame = 0
        let animId: number

        const animate = () => {
            frame++
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            ctx.fillStyle = '#1a120a'
            ctx.fillRect(0, 0, width, height)

            // Draw bonds
            bonds.forEach(bond => {
                const from = atoms[bond.from]
                const to = atoms[bond.to]
                if (!from || !to) return

                if (bond.type === 'ionic') {
                    // Ionic bond - dashed line with charge transfer
                    ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)'
                    ctx.lineWidth = 3
                    ctx.setLineDash([8, 8])
                    ctx.beginPath()
                    ctx.moveTo(from.x, from.y)
                    ctx.lineTo(to.x, to.y)
                    ctx.stroke()
                    ctx.setLineDash([])

                    // Animated electron transfer
                    const t = (Math.sin(frame * 0.05) + 1) / 2
                    const ex = from.x + (to.x - from.x) * t
                    const ey = from.y + (to.y - from.y) * t
                    ctx.fillStyle = 'rgba(255, 255, 100, 0.8)'
                    ctx.beginPath()
                    ctx.arc(ex, ey, 4, 0, Math.PI * 2)
                    ctx.fill()

                    // Charge labels
                    ctx.font = '16px sans-serif'
                    ctx.fillStyle = 'rgba(200, 160, 255, 0.8)'
                    ctx.fillText('+', from.x + 25, from.y - 15)
                    ctx.fillStyle = 'rgba(80, 255, 80, 0.8)'
                    ctx.fillText('−', to.x + 25, to.y - 15)
                } else {
                    // Covalent bond - solid line with shared electrons
                    ctx.strokeStyle = 'rgba(255, 160, 80, 0.6)'
                    ctx.lineWidth = 4
                    ctx.beginPath()
                    ctx.moveTo(from.x, from.y)
                    ctx.lineTo(to.x, to.y)
                    ctx.stroke()

                    // Shared electron pair
                    const midX = (from.x + to.x) / 2
                    const midY = (from.y + to.y) / 2
                    const angle = Math.atan2(to.y - from.y, to.x - from.x) + Math.PI / 2
                    const offset = Math.sin(frame * 0.03) * 3

                    ctx.fillStyle = 'rgba(255, 255, 100, 0.7)'
                    ctx.beginPath()
                    ctx.arc(midX + Math.cos(angle) * 6 + offset, midY + Math.sin(angle) * 6, 3, 0, Math.PI * 2)
                    ctx.arc(midX - Math.cos(angle) * 6 - offset, midY - Math.sin(angle) * 6, 3, 0, Math.PI * 2)
                    ctx.fill()
                }
            })

            // Draw atoms
            atoms.forEach((atom, i) => {
                const isSelected = selectedAtom === i

                // Electron cloud
                if (showElectrons) {
                    const cloudRadius = 30 + atom.electrons * 3
                    const gradient = ctx.createRadialGradient(atom.x, atom.y, 0, atom.x, atom.y, cloudRadius)
                    gradient.addColorStop(0, 'rgba(255, 160, 80, 0.15)')
                    gradient.addColorStop(1, 'rgba(255, 160, 80, 0)')
                    ctx.fillStyle = gradient
                    ctx.beginPath()
                    ctx.arc(atom.x, atom.y, cloudRadius, 0, Math.PI * 2)
                    ctx.fill()

                    // Orbiting electrons
                    for (let e = 0; e < Math.min(atom.electrons, 8); e++) {
                        const angle = (e / 8) * Math.PI * 2 + frame * 0.02
                        const ex = atom.x + Math.cos(angle) * 25
                        const ey = atom.y + Math.sin(angle) * 25
                        ctx.fillStyle = 'rgba(255, 255, 100, 0.6)'
                        ctx.beginPath()
                        ctx.arc(ex, ey, 3, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }

                // Nucleus
                ctx.fillStyle = atom.color
                ctx.beginPath()
                ctx.arc(atom.x, atom.y, 20, 0, Math.PI * 2)
                ctx.fill()

                // Selection ring
                if (isSelected) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.arc(atom.x, atom.y, 28, 0, Math.PI * 2)
                    ctx.stroke()
                }

                // Symbol
                ctx.fillStyle = atom.symbol === 'C' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'
                ctx.font = 'bold 14px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(atom.symbol, atom.x, atom.y)
            })

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [atoms, bonds, selectedAtom, showElectrons])

    // Handle click on canvas to select atoms and create bonds
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Find clicked atom
        const clickedIndex = atoms.findIndex(atom => {
            const dx = atom.x - x
            const dy = atom.y - y
            return Math.sqrt(dx * dx + dy * dy) < 25
        })

        if (clickedIndex === -1) {
            setSelectedAtom(null)
            return
        }

        if (selectedAtom === null) {
            setSelectedAtom(clickedIndex)
        } else if (selectedAtom !== clickedIndex) {
            // Create bond between selected and clicked
            const existingBond = bonds.find(b =>
                (b.from === selectedAtom && b.to === clickedIndex) ||
                (b.from === clickedIndex && b.to === selectedAtom)
            )

            if (!existingBond) {
                const atom1 = atoms[selectedAtom]
                const atom2 = atoms[clickedIndex]
                const isIonic = (atom1.symbol === 'Na' && atom2.symbol === 'Cl') ||
                    (atom1.symbol === 'Cl' && atom2.symbol === 'Na')

                setBonds(prev => [...prev, {
                    from: selectedAtom,
                    to: clickedIndex,
                    type: isIonic ? 'ionic' : 'covalent',
                }])
            }
            setSelectedAtom(null)
        } else {
            setSelectedAtom(null)
        }
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-pointer"
                    onClick={handleCanvasClick}
                />

                {/* Atom palette */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 bg-bg-elevated/80 backdrop-blur-sm rounded-lg p-3"
                >
                    <div className="text-xs text-text-dim mb-2">Add Atoms</div>
                    <div className="flex gap-2">
                        {atomTypes.map(type => (
                            <button
                                key={type.symbol}
                                onClick={() => addAtom(type)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-transform hover:scale-110"
                                style={{ backgroundColor: type.color }}
                                title={type.symbol}
                            >
                                <span style={{ color: type.symbol === 'C' ? '#fff' : '#000' }}>
                                    {type.symbol}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Presets */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 right-4 flex gap-2"
                >
                    {['water', 'nacl', 'methane'].map(p => (
                        <button
                            key={p}
                            onClick={() => loadPreset(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${preset === p
                                    ? 'bg-white/10 text-white'
                                    : 'text-text-muted hover:text-white bg-bg-elevated/50'
                                }`}
                        >
                            {p === 'water' ? 'H₂O' : p === 'nacl' ? 'NaCl' : 'CH₄'}
                        </button>
                    ))}
                </motion.div>

                {/* Instructions */}
                {atoms.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-text-dim text-sm">
                        Add atoms or select a preset molecule
                    </div>
                )}

                {selectedAtom !== null && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-bg-elevated/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-text-muted">
                        Click another atom to create a bond
                    </div>
                )}
            </div>

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <button onClick={clear} className="btn-ghost">
                            Clear All
                        </button>
                        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showElectrons}
                                onChange={e => setShowElectrons(e.target.checked)}
                                className="accent-accent-coral"
                            />
                            Show Electrons
                        </label>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-1 bg-gradient-to-r from-orange-400 to-orange-500 rounded" />
                            <span className="text-text-muted">Covalent</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-1 border-t-2 border-dashed border-orange-300" />
                            <span className="text-text-muted">Ionic</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
