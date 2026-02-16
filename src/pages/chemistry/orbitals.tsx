import { useState, useRef, useEffect, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Select, ButtonGroup, Button } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CHEM_COLOR = 'rgb(255, 160, 80)'
const BG = '#1a120a'

interface ElementData {
  symbol: string
  name: string
  Z: number
  config: string
  maxN: number
}

const elements: ElementData[] = [
  { symbol: 'H', name: 'Hydrogen', Z: 1, config: '1s1', maxN: 1 },
  { symbol: 'He', name: 'Helium', Z: 2, config: '1s2', maxN: 1 },
  { symbol: 'Li', name: 'Lithium', Z: 3, config: '1s2 2s1', maxN: 2 },
  { symbol: 'Be', name: 'Beryllium', Z: 4, config: '1s2 2s2', maxN: 2 },
  { symbol: 'B', name: 'Boron', Z: 5, config: '1s2 2s2 2p1', maxN: 2 },
  { symbol: 'C', name: 'Carbon', Z: 6, config: '1s2 2s2 2p2', maxN: 2 },
  { symbol: 'N', name: 'Nitrogen', Z: 7, config: '1s2 2s2 2p3', maxN: 2 },
  { symbol: 'O', name: 'Oxygen', Z: 8, config: '1s2 2s2 2p4', maxN: 2 },
  { symbol: 'F', name: 'Fluorine', Z: 9, config: '1s2 2s2 2p5', maxN: 2 },
  { symbol: 'Ne', name: 'Neon', Z: 10, config: '1s2 2s2 2p6', maxN: 2 },
]

type OrbitalType = 's' | 'p' | 'd'

function parseConfig(config: string): { orbital: string; count: number }[] {
  return config.split(' ').map(part => {
    const orbital = part.slice(0, 2)
    const count = parseInt(part.slice(2)) || 0
    return { orbital, count }
  })
}

export default function Orbitals() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const animRef = useRef<number>(0)

  const [elementIdx, setElementIdx] = useState(0)
  const [principalN, setPrincipalN] = useState(1)
  const [orbitalType, setOrbitalType] = useState<OrbitalType>('s')
  const [showConfig, setShowConfig] = useState(true)

  const element = elements[elementIdx]
  const energy = -13.6 * element.Z * element.Z / (principalN * principalN)
  const lValue = orbitalType === 's' ? 0 : orbitalType === 'p' ? 1 : 2
  const mlRange = Array.from({ length: 2 * lValue + 1 }, (_, i) => i - lValue)

  const resetAll = useCallback(() => {
    setElementIdx(0)
    setPrincipalN(1)
    setOrbitalType('s')
    setShowConfig(true)
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'Quantum Numbers', description: 'Every electron is described by four quantum numbers: n (principal), l (angular momentum), ml (magnetic), and ms (spin). Together they define an electron\'s state.', setup: () => { setElementIdx(0); setPrincipalN(1); setOrbitalType('s') } },
    { title: 'Principal Quantum Number n', description: 'n determines the energy level and size of an orbital. Higher n means higher energy and larger orbitals. For hydrogen, E = -13.6/n^2 eV.', setup: () => { setElementIdx(0); setPrincipalN(2) } },
    { title: 's Orbitals', description: 's orbitals (l=0) are spherical. Each energy level has one s orbital that can hold 2 electrons. The probability cloud is densest near the nucleus.', setup: () => { setPrincipalN(1); setOrbitalType('s') } },
    { title: 'p Orbitals', description: 'p orbitals (l=1) are dumbbell-shaped with a nodal plane through the nucleus. There are three p orbitals (px, py, pz) per energy level for n >= 2.', setup: () => { setPrincipalN(2); setOrbitalType('p') } },
    { title: 'Multi-electron Atoms', description: 'For atoms with more than one electron, electron-electron repulsion changes energy levels. The Aufbau principle fills lowest energy orbitals first.', setup: () => { setElementIdx(5); setPrincipalN(2); setOrbitalType('p') } },
    { title: 'Electron Configuration', description: 'The filling diagram shows how electrons fill orbitals following Aufbau, Pauli exclusion (max 2 per orbital), and Hund\'s rule (maximize unpaired spins).', setup: () => { setElementIdx(6); setShowConfig(true) } },
    { title: 'Neon: Noble Gas', description: 'Neon (Z=10) has a completely filled configuration: 1s2 2s2 2p6. All orbitals in the first two shells are full, making it extremely stable and unreactive.', setup: () => { setElementIdx(9); setPrincipalN(2); setOrbitalType('p') } },
  ]

  const demo = useDemoMode(demoSteps)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      frameRef.current++
      const f = frameRef.current
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const cx = w * 0.4
      const cy = h * 0.5

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)

      // Grid
      ctx.strokeStyle = 'rgba(255,160,80,0.04)'
      ctx.lineWidth = 1
      for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke() }
      for (let i = 0; i < h; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke() }

      // Draw nucleus
      const nucGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20)
      nucGlow.addColorStop(0, 'rgba(255,160,80,0.9)')
      nucGlow.addColorStop(0.5, 'rgba(255,120,40,0.4)')
      nucGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = nucGlow
      ctx.beginPath()
      ctx.arc(cx, cy, 20, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(255,160,80,1)'
      ctx.beginPath()
      ctx.arc(cx, cy, 8, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'white'
      ctx.font = 'bold 10px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(element.symbol, cx, cy)

      // Draw orbital shape
      if (orbitalType === 's') {
        // Spherical probability cloud
        const baseR = 40 + principalN * 35
        for (let i = 0; i < 300; i++) {
          const angle = Math.random() * Math.PI * 2
          const r = Math.random() * baseR
          const prob = Math.exp(-2 * r / baseR)
          if (Math.random() < prob) {
            const px = cx + Math.cos(angle) * r + Math.sin(f * 0.01 + i) * 2
            const py = cy + Math.sin(angle) * r + Math.cos(f * 0.01 + i) * 2
            ctx.fillStyle = `rgba(255,160,80,${0.3 * prob})`
            ctx.beginPath()
            ctx.arc(px, py, 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        // Shell outline
        ctx.strokeStyle = 'rgba(255,160,80,0.2)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.arc(cx, cy, baseR, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = 'rgba(255,160,80,0.6)'
        ctx.font = '12px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText(`${principalN}s orbital`, cx + baseR + 10, cy)
      } else if (orbitalType === 'p') {
        // Dumbbell p orbitals
        const baseR = 50 + principalN * 25
        const lobes = [
          { dx: 1, dy: 0, label: 'px' },
          { dx: 0, dy: 1, label: 'py' },
          { dx: 0.7, dy: 0.7, label: 'pz' },
        ]
        lobes.forEach((lobe, li) => {
          const alpha = li === 0 ? 0.5 : 0.25
          for (let sign = -1; sign <= 1; sign += 2) {
            for (let i = 0; i < 120; i++) {
              const t = Math.random()
              const spread = Math.random() * 20
              const mainDist = t * baseR * sign
              const px = cx + lobe.dx * mainDist + (Math.random() - 0.5) * spread
              const py = cy + lobe.dy * mainDist + (Math.random() - 0.5) * spread
              const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
              const prob = Math.exp(-dist / (baseR * 0.6))
              ctx.fillStyle = sign > 0
                ? `rgba(255,160,80,${alpha * prob})`
                : `rgba(100,180,255,${alpha * prob})`
              ctx.beginPath()
              ctx.arc(px + Math.sin(f * 0.02 + i) * 1, py + Math.cos(f * 0.02 + i) * 1, 2, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          // Label
          ctx.fillStyle = 'rgba(255,160,80,0.5)'
          ctx.font = '11px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText(lobe.label, cx + lobe.dx * (baseR + 20), cy + lobe.dy * (baseR + 20))
        })
      } else {
        // d orbital simplified cloverleaf
        const baseR = 40 + principalN * 20
        for (let i = 0; i < 400; i++) {
          const angle = Math.random() * Math.PI * 2
          const r = Math.random() * baseR
          const dProb = Math.abs(Math.sin(2 * angle)) * Math.exp(-r / (baseR * 0.7))
          if (Math.random() < dProb) {
            const px = cx + Math.cos(angle) * r
            const py = cy + Math.sin(angle) * r
            const clr = Math.sin(2 * angle) > 0 ? '255,160,80' : '100,180,255'
            ctx.fillStyle = `rgba(${clr},${0.4 * dProb})`
            ctx.beginPath()
            ctx.arc(px + Math.sin(f * 0.015 + i), py + Math.cos(f * 0.015 + i), 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // Filling diagram (right side)
      if (showConfig) {
        const parsed = parseConfig(element.config)
        const fdX = w * 0.72
        let fdY = 50

        ctx.fillStyle = 'rgba(255,160,80,0.8)'
        ctx.font = 'bold 13px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText('Electron Configuration', fdX, fdY)
        fdY += 25

        ctx.font = '12px monospace'
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.fillText(element.config, fdX, fdY)
        fdY += 30

        ctx.fillStyle = 'rgba(255,160,80,0.6)'
        ctx.font = 'bold 12px system-ui'
        ctx.fillText('Orbital Filling Diagram', fdX, fdY)
        fdY += 20

        parsed.forEach(({ orbital, count }) => {
          const maxE = orbital.includes('s') ? 2 : orbital.includes('p') ? 6 : 10
          const boxes = orbital.includes('s') ? 1 : orbital.includes('p') ? 3 : 5

          ctx.fillStyle = 'rgba(255,255,255,0.5)'
          ctx.font = '11px system-ui'
          ctx.fillText(orbital, fdX, fdY + 12)

          for (let b = 0; b < boxes; b++) {
            const bx = fdX + 35 + b * 30
            ctx.strokeStyle = 'rgba(255,160,80,0.3)'
            ctx.lineWidth = 1
            ctx.strokeRect(bx, fdY, 24, 20)

            const eInBox = Math.min(2, Math.max(0, count - b * 2))
            if (eInBox >= 1) {
              ctx.fillStyle = 'rgba(255,160,80,0.9)'
              ctx.font = '14px system-ui'
              ctx.textAlign = 'center'
              ctx.fillText('\u2191', bx + 8, fdY + 14)
            }
            if (eInBox >= 2) {
              ctx.fillText('\u2193', bx + 17, fdY + 14)
            }
            ctx.textAlign = 'left'
          }
          fdY += 30
        })
      }

      // Energy level diagram (bottom-right)
      const elX = w * 0.72
      const elY = h - 180
      ctx.fillStyle = 'rgba(255,160,80,0.7)'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Energy Levels', elX, elY)

      for (let n = 1; n <= Math.min(element.maxN + 1, 4); n++) {
        const yPos = elY + 20 + (4 - n) * 35
        const en = -13.6 * element.Z * element.Z / (n * n)
        ctx.strokeStyle = n === principalN ? 'rgba(255,160,80,0.8)' : 'rgba(255,160,80,0.2)'
        ctx.lineWidth = n === principalN ? 2 : 1
        ctx.beginPath()
        ctx.moveTo(elX, yPos)
        ctx.lineTo(elX + 160, yPos)
        ctx.stroke()

        ctx.fillStyle = n === principalN ? 'rgba(255,160,80,0.9)' : 'rgba(255,255,255,0.4)'
        ctx.font = '10px system-ui'
        ctx.fillText(`n=${n}`, elX + 165, yPos + 4)
        ctx.fillText(`${en.toFixed(1)} eV`, elX - 55, yPos + 4)
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [element, principalN, orbitalType, showConfig])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a120a]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
          <APTag course="Chemistry" unit="Unit 1" color={CHEM_COLOR} />
          <InfoPanel
            title="Atomic Structure"
            departmentColor={CHEM_COLOR}
            items={[
              { label: 'Element', value: `${element.symbol} (Z=${element.Z})` },
              { label: 'Config', value: element.config },
              { label: 'Energy (eV)', value: energy.toFixed(2), color: CHEM_COLOR },
              { label: 'n, l, ml', value: `${principalN}, ${lValue}, {${mlRange.join(',')}}` },
            ]}
          />
          <EquationDisplay
            departmentColor={CHEM_COLOR}
            title="Quantum Mechanics"
            equations={[
              { label: 'Energy', expression: 'En = -13.6 Z^2 / n^2  eV', description: 'Energy of electron in shell n' },
              { label: 'n', expression: `1, 2, 3, ... (principal)`, description: 'Determines size and energy' },
              { label: 'l', expression: `0..n-1 (angular)`, description: 's=0, p=1, d=2' },
              { label: 'ml', expression: `-l..+l (magnetic)`, description: 'Orientation of orbital' },
              { label: 'ms', expression: `+1/2 or -1/2 (spin)`, description: 'Pauli exclusion principle' },
            ]}
          />
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <DemoMode
            steps={demoSteps}
            currentStep={demo.currentStep}
            isOpen={demo.isOpen}
            onClose={demo.close}
            onNext={demo.next}
            onPrev={demo.prev}
            onGoToStep={demo.goToStep}
            departmentColor={CHEM_COLOR}
            title="AP Chemistry Tutorial"
          />
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-end gap-6">
          <ControlGroup label="Element">
            <Select
              value={String(elementIdx)}
              onChange={v => setElementIdx(parseInt(v))}
              options={elements.map((el, i) => ({ value: String(i), label: `${el.symbol} - ${el.name}` }))}
            />
          </ControlGroup>
          <ControlGroup label="Principal Quantum Number n">
            <Slider value={principalN} onChange={setPrincipalN} min={1} max={4} step={1} label={`n = ${principalN}`} />
          </ControlGroup>
          <ControlGroup label="Orbital Type">
            <ButtonGroup
              value={orbitalType}
              onChange={v => setOrbitalType(v as OrbitalType)}
              options={[
                { value: 's', label: 's' },
                { value: 'p', label: 'p' },
                { value: 'd', label: 'd' },
              ]}
              color={CHEM_COLOR}
            />
          </ControlGroup>
          <Button variant="secondary" onClick={demo.open}>AP Tutorial</Button>
          <Button variant="secondary" onClick={resetAll}>Reset</Button>
        </div>
      </div>
    </div>
  )
}
