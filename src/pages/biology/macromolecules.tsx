import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type MoleculeType = 'protein' | 'lipid' | 'carbohydrate' | 'nucleic-acid'

interface MoleculeInfo {
  name: string
  formula: string
  bondType: string
  functionalGroups: string
  monomers: string
  elements: string
}

const moleculeData: Record<MoleculeType, MoleculeInfo> = {
  protein: {
    name: 'Protein (Polypeptide)',
    formula: '(C₂H₃ONH)ₙ',
    bondType: 'Peptide bond',
    functionalGroups: 'Amino (-NH₂), Carboxyl (-COOH), R-group',
    monomers: 'Amino acids',
    elements: 'C, H, O, N, S',
  },
  lipid: {
    name: 'Lipid (Triglyceride)',
    formula: 'C₅₅H₁₀₄O₆',
    bondType: 'Ester bond',
    functionalGroups: 'Hydroxyl (-OH), Carboxyl (-COOH)',
    monomers: 'Glycerol + 3 fatty acids',
    elements: 'C, H, O',
  },
  carbohydrate: {
    name: 'Carbohydrate (Polysaccharide)',
    formula: '(C₆H₁₀O₅)ₙ',
    bondType: 'Glycosidic bond',
    functionalGroups: 'Hydroxyl (-OH), Carbonyl (C=O)',
    monomers: 'Monosaccharides (glucose)',
    elements: 'C, H, O',
  },
  'nucleic-acid': {
    name: 'Nucleic Acid (DNA/RNA)',
    formula: 'Nucleotide polymer',
    bondType: 'Phosphodiester bond',
    functionalGroups: 'Phosphate (-PO₄), Hydroxyl (-OH), Nitrogenous base',
    monomers: 'Nucleotides',
    elements: 'C, H, O, N, P',
  },
}

const BIO_COLOR = 'rgb(80, 200, 120)'

export default function Macromolecules() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  const [moleculeType, setMoleculeType] = useState<MoleculeType>('protein')
  const [zoom, setZoom] = useState(1)
  const [isHydrolysis, setIsHydrolysis] = useState(false)
  const [rotation, setRotation] = useState(0)

  const reset = useCallback(() => {
    setMoleculeType('protein')
    setZoom(1)
    setIsHydrolysis(false)
    setRotation(0)
    timeRef.current = 0
  }, [])

  const demoSteps: DemoStep[] = [
    {
      title: 'Monomers & Polymers',
      description: 'Macromolecules are large biological molecules built from smaller subunits called monomers. Through dehydration synthesis, monomers join together by removing water.',
      setup: () => { setMoleculeType('carbohydrate'); setIsHydrolysis(false) },
    },
    {
      title: 'Dehydration Synthesis',
      description: 'In dehydration synthesis (condensation), an -OH from one monomer and an -H from another combine to release H₂O, forming a covalent bond between the monomers.',
      setup: () => { setMoleculeType('carbohydrate'); setIsHydrolysis(false) },
    },
    {
      title: 'Hydrolysis',
      description: 'Hydrolysis is the reverse: water is added to break covalent bonds, splitting polymers back into monomers. Digestive enzymes catalyze hydrolysis of food.',
      setup: () => { setMoleculeType('carbohydrate'); setIsHydrolysis(true) },
    },
    {
      title: 'Proteins',
      description: 'Proteins are polymers of amino acids joined by peptide bonds. The R-group determines the amino acid identity and protein folding.',
      setup: () => { setMoleculeType('protein'); setIsHydrolysis(false) },
    },
    {
      title: 'Nucleic Acids',
      description: 'DNA and RNA are polymers of nucleotides linked by phosphodiester bonds. Each nucleotide has a sugar, phosphate group, and nitrogenous base.',
      setup: () => { setMoleculeType('nucleic-acid'); setIsHydrolysis(false) },
    },
  ]

  const demo = useDemoMode(demoSteps)
  const info = moleculeData[moleculeType]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let dpr = window.devicePixelRatio || 1

    const resize = () => {
      dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      timeRef.current += 0.016
      const t = timeRef.current
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const cx = w / 2
      const cy = h / 2

      ctx.fillStyle = '#0a1a12'
      ctx.fillRect(0, 0, w, h)

      // Subtle grid
      ctx.strokeStyle = 'rgba(80, 200, 120, 0.04)'
      ctx.lineWidth = 1
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(zoom, zoom)
      ctx.rotate(rotation * Math.PI / 180)

      const reactionProgress = (Math.sin(t * 1.5) + 1) / 2

      if (moleculeType === 'protein') {
        drawProtein(ctx, t, reactionProgress, isHydrolysis)
      } else if (moleculeType === 'lipid') {
        drawLipid(ctx, t, reactionProgress, isHydrolysis)
      } else if (moleculeType === 'carbohydrate') {
        drawCarbohydrate(ctx, t, reactionProgress, isHydrolysis)
      } else {
        drawNucleicAcid(ctx, t, reactionProgress, isHydrolysis)
      }

      ctx.restore()

      // Water molecule indicator
      const waterAlpha = isHydrolysis ? (1 - reactionProgress) * 0.8 : reactionProgress * 0.8
      ctx.fillStyle = `rgba(100, 180, 255, ${waterAlpha})`
      ctx.font = 'bold 16px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(isHydrolysis ? '+ H₂O (added)' : '- H₂O (released)', cx, h - 60)

      // Reaction label
      ctx.fillStyle = 'rgba(80, 200, 120, 0.7)'
      ctx.font = '14px system-ui'
      ctx.fillText(
        isHydrolysis ? 'HYDROLYSIS: Polymer + H₂O → Monomers' : 'DEHYDRATION SYNTHESIS: Monomers → Polymer + H₂O',
        cx, h - 36
      )

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [moleculeType, zoom, isHydrolysis, rotation])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1a12]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
          <APTag course="Biology" unit="Unit 1" color={BIO_COLOR} />
          <InfoPanel
            title="Macromolecule Data"
            departmentColor={BIO_COLOR}
            items={[
              { label: 'Molecule', value: info.name },
              { label: 'Formula', value: info.formula },
              { label: 'Bond Type', value: info.bondType },
              { label: 'Functional Groups', value: info.functionalGroups },
              { label: 'Monomers', value: info.monomers },
              { label: 'Elements', value: info.elements },
            ]}
          />
        </div>

        <div className="absolute top-4 right-4">
          <EquationDisplay
            departmentColor={BIO_COLOR}
            title="Reactions"
            equations={[
              { label: 'Synthesis', expression: 'Monomer-OH + H-Monomer → Monomer-Monomer + H₂O', description: 'Dehydration / condensation reaction' },
              { label: 'Hydrolysis', expression: 'Polymer + H₂O → Monomers', description: 'Water breaks covalent bonds' },
            ]}
          />
        </div>

        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <DemoMode
            steps={demoSteps}
            currentStep={demo.currentStep}
            isOpen={demo.isOpen}
            onClose={demo.close}
            onNext={demo.next}
            onPrev={demo.prev}
            onGoToStep={demo.goToStep}
            departmentColor={BIO_COLOR}
            title="AP Bio Tutorial"
          />
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <ButtonGroup
            value={moleculeType}
            onChange={(v) => setMoleculeType(v as MoleculeType)}
            options={[
              { value: 'protein', label: 'Protein' },
              { value: 'lipid', label: 'Lipid' },
              { value: 'carbohydrate', label: 'Carb' },
              { value: 'nucleic-acid', label: 'Nucleic Acid' },
            ]}
            label="Molecule Type"
            color={BIO_COLOR}
          />
          <div className="w-32">
            <Slider value={zoom} onChange={setZoom} min={0.5} max={2} step={0.1} label="Zoom" />
          </div>
          <Toggle value={isHydrolysis} onChange={setIsHydrolysis} label="Hydrolysis" />
          <div className="w-32">
            <Slider value={rotation} onChange={setRotation} min={0} max={360} step={1} label="Rotation" />
          </div>
          <div className="flex gap-2">
            <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
            <Button onClick={reset} variant="secondary">Reset</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function drawAtom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, label: string) {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r)
  grad.addColorStop(0, color)
  grad.addColorStop(1, `${color}66`)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'white'
  ctx.font = `bold ${Math.max(8, r * 0.8)}px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x, y)
}

function drawBond(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, double?: boolean) {
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  if (double) {
    const dx = y2 - y1, dy = -(x2 - x1)
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const off = 4
    ctx.beginPath()
    ctx.moveTo(x1 + dx / len * off, y1 + dy / len * off)
    ctx.lineTo(x2 + dx / len * off, y2 + dy / len * off)
    ctx.stroke()
  }
}

function drawProtein(ctx: CanvasRenderingContext2D, t: number, rp: number, hydro: boolean) {
  const sep = hydro ? 50 + rp * 60 : 50 + (1 - rp) * 10
  const aminoAcids = 4
  for (let i = 0; i < aminoAcids; i++) {
    const bx = (i - (aminoAcids - 1) / 2) * sep
    const by = Math.sin(t + i) * 8
    // Backbone N
    drawAtom(ctx, bx - 18, by - 10, 10, '#4488ff', 'N')
    // Alpha carbon
    drawAtom(ctx, bx, by, 12, '#888888', 'C')
    // Carbonyl C=O
    drawAtom(ctx, bx + 18, by - 10, 10, '#888888', 'C')
    drawAtom(ctx, bx + 18, by - 30, 8, '#ff4444', 'O')
    drawBond(ctx, bx + 18, by - 10, bx + 18, by - 30, true)
    // R-group
    const rColors = ['#ffaa00', '#44cc88', '#cc44aa', '#4488dd']
    drawAtom(ctx, bx, by + 24, 9, rColors[i], 'R')
    drawBond(ctx, bx, by, bx, by + 15)
    // Bonds in backbone
    drawBond(ctx, bx - 18, by - 10, bx, by)
    drawBond(ctx, bx, by, bx + 18, by - 10)
    // Peptide bond to next
    if (i < aminoAcids - 1) {
      const nx = (i + 1 - (aminoAcids - 1) / 2) * sep
      const ny = Math.sin(t + i + 1) * 8
      if (!hydro || rp < 0.5) {
        ctx.strokeStyle = `rgba(80, 200, 120, ${hydro ? 1 - rp * 2 : 1})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(bx + 18, by - 10)
        ctx.lineTo(nx - 18, ny - 10)
        ctx.stroke()
      }
    }
  }
  // H and OH labels
  drawAtom(ctx, (aminoAcids - 1) / 2 * sep + 36, Math.sin(t + aminoAcids - 1) * 8 - 10, 7, '#ff4444', 'OH')
  drawAtom(ctx, -(aminoAcids - 1) / 2 * sep - 30, Math.sin(t) * 8 - 10, 7, '#ffffff', 'H')
}

function drawLipid(ctx: CanvasRenderingContext2D, t: number, rp: number, hydro: boolean) {
  const sep = hydro ? rp * 40 : 0
  // Glycerol backbone
  for (let i = 0; i < 3; i++) {
    const gy = (i - 1) * 50
    drawAtom(ctx, -100, gy, 12, '#888888', 'C')
    drawAtom(ctx, -120, gy, 8, '#ff4444', 'O')
    drawBond(ctx, -100, gy, -120, gy)
    if (i < 2) drawBond(ctx, -100, gy, -100, gy + 50)
    // Ester bond
    if (!hydro || rp < 0.5) {
      ctx.strokeStyle = `rgba(80, 200, 120, ${hydro ? 1 - rp * 2 : 0.8})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-120, gy)
      ctx.lineTo(-140 - sep, gy)
      ctx.stroke()
    }
    // Fatty acid chain
    const startX = -140 - sep
    drawAtom(ctx, startX, gy, 10, '#888888', 'C')
    drawAtom(ctx, startX, gy - 18, 7, '#ff4444', 'O')
    drawBond(ctx, startX, gy, startX, gy - 18, true)
    for (let j = 1; j <= 5; j++) {
      const fx = startX - j * 26
      const fy = gy + Math.sin(t * 0.8 + j + i) * 4
      drawAtom(ctx, fx, fy, 8, '#aaaaaa', 'C')
      drawBond(ctx, fx + 26, fy - Math.sin(t * 0.8 + j - 1 + i) * 4, fx, fy)
      // H atoms
      drawAtom(ctx, fx, fy - 14, 5, '#ffffff', 'H')
      drawAtom(ctx, fx, fy + 14, 5, '#ffffff', 'H')
    }
  }
  ctx.fillStyle = 'rgba(80, 200, 120, 0.5)'
  ctx.font = '11px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('Glycerol', -100, 90)
  ctx.fillText('Fatty Acid Chains', -250, 90)
}

function drawCarbohydrate(ctx: CanvasRenderingContext2D, t: number, rp: number, hydro: boolean) {
  const sep = hydro ? 80 + rp * 50 : 80
  for (let m = 0; m < 3; m++) {
    const ox = (m - 1) * sep
    const oy = 0
    // Hexagonal ring
    const sides = 6
    const rr = 30
    const pts: [number, number][] = []
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i) / sides - Math.PI / 6
      pts.push([ox + Math.cos(a) * rr, oy + Math.sin(a) * rr])
    }
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    pts.forEach((p, i) => { i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]) })
    ctx.closePath()
    ctx.stroke()
    // Carbons at vertices
    for (let i = 0; i < 5; i++) {
      drawAtom(ctx, pts[i][0], pts[i][1], 8, '#888888', 'C')
    }
    // Oxygen in ring
    drawAtom(ctx, pts[5][0], pts[5][1], 9, '#ff4444', 'O')
    // OH groups
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * 2 * i) / sides - Math.PI / 6
      const ohx = ox + Math.cos(a) * (rr + 18)
      const ohy = oy + Math.sin(a) * (rr + 18)
      drawAtom(ctx, ohx, ohy, 6, '#ff6666', 'OH')
      drawBond(ctx, pts[i][0], pts[i][1], ohx, ohy)
    }
    // Glycosidic bond
    if (m < 2) {
      const nx = (m) * sep
      if (!hydro || rp < 0.5) {
        ctx.strokeStyle = `rgba(80, 200, 120, ${hydro ? 1 - rp * 2 : 0.9})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(ox + rr + 2, oy)
        ctx.lineTo(nx + sep - rr - 2, oy)
        ctx.stroke()
        // Water animation
        const waterX = (ox + rr + nx + sep - rr) / 2
        const waterY = oy - 30 - Math.sin(t * 3) * 10 * (hydro ? (1 - rp) : rp)
        const wAlpha = hydro ? (1 - rp) : rp
        if (wAlpha > 0.1) {
          drawAtom(ctx, waterX, waterY, 6, `rgba(100, 180, 255, ${wAlpha})`, 'O')
          drawAtom(ctx, waterX - 10, waterY - 8, 4, `rgba(255, 255, 255, ${wAlpha})`, 'H')
          drawAtom(ctx, waterX + 10, waterY - 8, 4, `rgba(255, 255, 255, ${wAlpha})`, 'H')
        }
      }
    }
  }
}

function drawNucleicAcid(ctx: CanvasRenderingContext2D, t: number, rp: number, hydro: boolean) {
  const sep = hydro ? 80 + rp * 40 : 80
  const bases = ['A', 'T', 'G', 'C']
  for (let i = 0; i < 4; i++) {
    const nx = (i - 1.5) * sep
    const ny = 0
    // Sugar (pentagon)
    const sr = 18
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let s = 0; s < 5; s++) {
      const a = (Math.PI * 2 * s) / 5 - Math.PI / 2
      const px = nx + Math.cos(a) * sr
      const py = ny + Math.sin(a) * sr
      s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
    drawAtom(ctx, nx, ny, 10, '#ffaa44', 'S')
    // Phosphate group
    drawAtom(ctx, nx, ny - 40, 11, '#44aaff', 'P')
    drawAtom(ctx, nx - 12, ny - 52, 6, '#ff4444', 'O')
    drawAtom(ctx, nx + 12, ny - 52, 6, '#ff4444', 'O')
    drawBond(ctx, nx, ny - 18, nx, ny - 40)
    drawBond(ctx, nx, ny - 40, nx - 12, ny - 52)
    drawBond(ctx, nx, ny - 40, nx + 12, ny - 52)
    // Nitrogenous base
    const baseColors: Record<string, string> = { A: '#44dd88', T: '#dd4488', G: '#4488dd', C: '#ddaa44' }
    drawAtom(ctx, nx, ny + 36, 14, baseColors[bases[i]], bases[i])
    drawBond(ctx, nx, ny + 18, nx, ny + 22)
    // Phosphodiester bond
    if (i < 3) {
      if (!hydro || rp < 0.5) {
        ctx.strokeStyle = `rgba(80, 200, 120, ${hydro ? 1 - rp * 2 : 0.8})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(nx + sr + 2, ny)
        const nextX = (i - 0.5) * sep
        ctx.lineTo(nextX - sr - 2, ny)
        ctx.stroke()
      }
    }
  }
}
