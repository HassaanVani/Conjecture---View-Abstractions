import { useState, useRef, useEffect, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Select, Toggle, Button } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CHEM_COLOR = 'rgb(255, 160, 80)'
const BG = '#1a120a'

interface GeometryInfo {
  name: string
  angle: string
  hybridization: string
}

function getGeometry(bp: number, lp: number): GeometryInfo {
  const key = `${bp}-${lp}`
  const table: Record<string, GeometryInfo> = {
    '1-0': { name: 'Linear', angle: '180', hybridization: 'sp' },
    '2-0': { name: 'Linear', angle: '180', hybridization: 'sp' },
    '2-1': { name: 'Bent', angle: '~120', hybridization: 'sp2' },
    '2-2': { name: 'Bent', angle: '~104.5', hybridization: 'sp3' },
    '3-0': { name: 'Trigonal Planar', angle: '120', hybridization: 'sp2' },
    '3-1': { name: 'Trigonal Pyramidal', angle: '~107', hybridization: 'sp3' },
    '4-0': { name: 'Tetrahedral', angle: '109.5', hybridization: 'sp3' },
    '4-1': { name: 'Seesaw', angle: '90/120', hybridization: 'sp3d' },
    '4-2': { name: 'Square Planar', angle: '90', hybridization: 'sp3d2' },
    '5-0': { name: 'Trigonal Bipyramidal', angle: '90/120', hybridization: 'sp3d' },
    '5-1': { name: 'Square Pyramidal', angle: '~90', hybridization: 'sp3d2' },
    '6-0': { name: 'Octahedral', angle: '90', hybridization: 'sp3d2' },
  }
  return table[key] || { name: 'Unknown', angle: '-', hybridization: '-' }
}

function get3DPositions(bp: number, lp: number): { x: number; y: number; z: number; isLone: boolean }[] {
  const total = bp + lp
  const positions: { x: number; y: number; z: number }[] = []

  if (total === 2) {
    positions.push({ x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 })
  } else if (total === 3) {
    for (let i = 0; i < 3; i++) {
      const a = (i * 2 * Math.PI) / 3
      positions.push({ x: Math.cos(a), y: Math.sin(a), z: 0 })
    }
  } else if (total === 4) {
    positions.push(
      { x: 0, y: 0, z: 1 },
      { x: 0.943, y: 0, z: -0.333 },
      { x: -0.471, y: 0.816, z: -0.333 },
      { x: -0.471, y: -0.816, z: -0.333 }
    )
  } else if (total === 5) {
    positions.push(
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 },
      { x: 1, y: 0, z: 0 },
      { x: -0.5, y: 0.866, z: 0 },
      { x: -0.5, y: -0.866, z: 0 }
    )
  } else if (total === 6) {
    positions.push(
      { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
    )
  } else {
    positions.push({ x: 1, y: 0, z: 0 })
  }

  return positions.slice(0, bp + lp).map((p, i) => ({
    ...p,
    isLone: i >= bp,
  }))
}

export default function VSEPR() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const animRef = useRef<number>(0)

  const [bondingPairs, setBondingPairs] = useState(4)
  const [lonePairs, setLonePairs] = useState(0)
  const [showAngles, setShowAngles] = useState(true)
  const [centralAtom, setCentralAtom] = useState('C')

  const geo = getGeometry(bondingPairs, lonePairs)

  const resetAll = useCallback(() => {
    setBondingPairs(4)
    setLonePairs(0)
    setShowAngles(true)
    setCentralAtom('C')
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'VSEPR Theory', description: 'Valence Shell Electron Pair Repulsion theory predicts molecular geometry. Electron domains (bonding + lone pairs) repel each other and arrange to minimize repulsion.', setup: () => { setBondingPairs(4); setLonePairs(0) } },
    { title: 'Linear Geometry', description: 'With 2 electron domains, the molecule is linear with 180 degree bond angles. Example: CO2 (O=C=O). The sp hybridization leaves two unhybridized p orbitals.', setup: () => { setBondingPairs(2); setLonePairs(0); setCentralAtom('C') } },
    { title: 'Trigonal Planar', description: '3 bonding pairs, 0 lone pairs gives trigonal planar with 120 degree angles. Example: BF3. The sp2 hybridization uses three hybrid orbitals in a plane.', setup: () => { setBondingPairs(3); setLonePairs(0); setCentralAtom('B') } },
    { title: 'Tetrahedral', description: '4 bonding pairs arrange tetrahedrally with 109.5 degree angles. Example: CH4. sp3 hybridization. This is the most common geometry in organic chemistry.', setup: () => { setBondingPairs(4); setLonePairs(0); setCentralAtom('C') } },
    { title: 'Lone Pair Effect', description: 'Lone pairs occupy more space than bonding pairs. Water (2 bp + 2 lp) is BENT, not linear! Lone pairs compress bond angles from 109.5 to about 104.5 degrees.', setup: () => { setBondingPairs(2); setLonePairs(2); setCentralAtom('O') } },
    { title: 'Trigonal Pyramidal', description: 'NH3 has 3 bp + 1 lp giving trigonal pyramidal shape. Bond angle is compressed to about 107 degrees. The lone pair pushes bonding electrons closer together.', setup: () => { setBondingPairs(3); setLonePairs(1); setCentralAtom('N') } },
    { title: 'Expanded Octets', description: 'Elements in period 3+ can exceed 8 electrons using d orbitals. SF6 has 6 bonding pairs in an octahedral arrangement with 90 degree angles. sp3d2 hybridization.', setup: () => { setBondingPairs(6); setLonePairs(0); setCentralAtom('S') } },
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
      const cx = w * 0.42
      const cy = h * 0.5
      const scale = Math.min(w, h) * 0.22

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)

      // Grid
      ctx.strokeStyle = 'rgba(255,160,80,0.04)'
      ctx.lineWidth = 1
      for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke() }
      for (let i = 0; i < h; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke() }

      const rotY = f * 0.008
      const rotX = 0.3
      const positions = get3DPositions(bondingPairs, lonePairs)

      // Project 3D to 2D with rotation
      const projected = positions.map(p => {
        let x = p.x
        let y = p.y
        let z = p.z

        // Rotate around Y
        const x1 = x * Math.cos(rotY) + z * Math.sin(rotY)
        const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY)
        // Rotate around X
        const y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX)
        const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX)

        const perspective = 3 / (3 + z2)
        return {
          sx: cx + x1 * scale * perspective,
          sy: cy + y1 * scale * perspective,
          z: z2,
          isLone: p.isLone,
          perspective,
        }
      })

      // Sort by z for correct rendering order
      const sorted = [...projected].sort((a, b) => a.z - b.z)

      // Draw bonds and atoms
      sorted.forEach((p, i) => {
        // Bond line
        ctx.strokeStyle = p.isLone ? 'rgba(100,180,255,0.3)' : 'rgba(255,160,80,0.5)'
        ctx.lineWidth = p.isLone ? 1.5 : 3
        if (p.isLone) ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(p.sx, p.sy)
        ctx.stroke()
        ctx.setLineDash([])

        // Atom or lone pair
        if (p.isLone) {
          const lpGlow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, 18 * p.perspective)
          lpGlow.addColorStop(0, 'rgba(100,180,255,0.4)')
          lpGlow.addColorStop(1, 'transparent')
          ctx.fillStyle = lpGlow
          ctx.beginPath()
          ctx.arc(p.sx, p.sy, 18 * p.perspective, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = 'rgba(100,180,255,0.7)'
          ctx.font = `${11 * p.perspective}px system-ui`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('LP', p.sx, p.sy)
        } else {
          const r = 14 * p.perspective
          const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r * 2)
          glow.addColorStop(0, 'rgba(255,160,80,0.3)')
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(p.sx, p.sy, r * 2, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = 'rgba(255,160,80,0.9)'
          ctx.beginPath()
          ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = 'white'
          ctx.font = `bold ${10 * p.perspective}px system-ui`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('X', p.sx, p.sy)
        }
      })

      // Central atom
      ctx.fillStyle = 'rgba(255,200,120,1)'
      ctx.beginPath()
      ctx.arc(cx, cy, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a120a'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(centralAtom, cx, cy)

      // Bond angle annotations
      if (showAngles && projected.filter(p => !p.isLone).length >= 2) {
        const bondedPositions = projected.filter(p => !p.isLone)
        if (bondedPositions.length >= 2) {
          const p1 = bondedPositions[0]
          const p2 = bondedPositions[1]
          const a1 = Math.atan2(p1.sy - cy, p1.sx - cx)
          const a2 = Math.atan2(p2.sy - cy, p2.sx - cx)
          const arcR = 40

          ctx.strokeStyle = 'rgba(255,255,255,0.3)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(cx, cy, arcR, Math.min(a1, a2), Math.max(a1, a2))
          ctx.stroke()

          const midA = (a1 + a2) / 2
          ctx.fillStyle = 'rgba(255,255,255,0.7)'
          ctx.font = '11px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText(`${geo.angle}\u00B0`, cx + Math.cos(midA) * (arcR + 15), cy + Math.sin(midA) * (arcR + 15))
        }
      }

      // Geometry label
      ctx.fillStyle = 'rgba(255,160,80,0.8)'
      ctx.font = 'bold 16px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(geo.name, cx, h - 30)

      // Electron domain info (right side)
      const infoX = w * 0.72
      let infoY = 50

      ctx.fillStyle = 'rgba(255,160,80,0.7)'
      ctx.font = 'bold 13px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Electron Domain Model', infoX, infoY)
      infoY += 30

      const domains = bondingPairs + lonePairs
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '12px system-ui'
      ctx.fillText(`Total electron domains: ${domains}`, infoX, infoY); infoY += 22
      ctx.fillText(`Bonding pairs: ${bondingPairs}`, infoX, infoY); infoY += 22
      ctx.fillText(`Lone pairs: ${lonePairs}`, infoX, infoY); infoY += 22

      ctx.fillStyle = 'rgba(255,160,80,0.6)'
      ctx.fillText(`Electron geometry: ${getGeometry(domains, 0).name}`, infoX, infoY); infoY += 22
      ctx.fillText(`Molecular geometry: ${geo.name}`, infoX, infoY); infoY += 22
      ctx.fillText(`Hybridization: ${geo.hybridization}`, infoX, infoY)

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [bondingPairs, lonePairs, showAngles, centralAtom, geo])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1a120a]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
          <APTag course="Chemistry" unit="Unit 2" color={CHEM_COLOR} />
          <InfoPanel
            title="Molecular Geometry"
            departmentColor={CHEM_COLOR}
            items={[
              { label: 'Geometry', value: geo.name, color: CHEM_COLOR },
              { label: 'Bond Angle', value: `${geo.angle}\u00B0` },
              { label: 'Hybridization', value: geo.hybridization },
              { label: 'Electron Domains', value: bondingPairs + lonePairs },
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
          <ControlGroup label="Central Atom">
            <Select
              value={centralAtom}
              onChange={setCentralAtom}
              options={[
                { value: 'C', label: 'Carbon' }, { value: 'N', label: 'Nitrogen' },
                { value: 'O', label: 'Oxygen' }, { value: 'S', label: 'Sulfur' },
                { value: 'P', label: 'Phosphorus' }, { value: 'B', label: 'Boron' },
              ]}
            />
          </ControlGroup>
          <ControlGroup label="Bonding Pairs">
            <Slider value={bondingPairs} onChange={v => setBondingPairs(Math.round(v))} min={1} max={6} step={1} label={String(bondingPairs)} />
          </ControlGroup>
          <ControlGroup label="Lone Pairs">
            <Slider value={lonePairs} onChange={v => setLonePairs(Math.round(v))} min={0} max={3} step={1} label={String(lonePairs)} />
          </ControlGroup>
          <ControlGroup label="Bond Angles">
            <Toggle value={showAngles} onChange={setShowAngles} label="Show" />
          </ControlGroup>
          <Button variant="secondary" onClick={demo.open}>AP Tutorial</Button>
          <Button variant="secondary" onClick={resetAll}>Reset</Button>
        </div>
      </div>
    </div>
  )
}
