import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type CellType = 'animal' | 'plant'
type Organelle = 'nucleus' | 'mitochondria' | 'er' | 'golgi' | 'ribosome' | 'lysosome' | 'chloroplast' | 'vacuole' | 'membrane' | 'none'

interface OrganelleInfo {
  name: string
  fn: string
  size: string
  plantOnly?: boolean
  animalOnly?: boolean
}

const organelleData: Record<Exclude<Organelle, 'none'>, OrganelleInfo> = {
  nucleus: { name: 'Nucleus', fn: 'Contains DNA, controls gene expression and cell activity', size: '5-10 um' },
  mitochondria: { name: 'Mitochondria', fn: 'Cellular respiration; produces ATP from glucose + O₂', size: '1-10 um' },
  er: { name: 'Endoplasmic Reticulum', fn: 'Rough ER: protein synthesis. Smooth ER: lipid synthesis, detox', size: 'Network' },
  golgi: { name: 'Golgi Apparatus', fn: 'Modifies, packages, and ships proteins in vesicles', size: '1-3 um stacks' },
  ribosome: { name: 'Ribosomes', fn: 'Translates mRNA into proteins (free or bound to ER)', size: '20-30 nm' },
  lysosome: { name: 'Lysosome', fn: 'Digests macromolecules, old organelles; contains hydrolytic enzymes', size: '0.1-1.2 um', animalOnly: true },
  chloroplast: { name: 'Chloroplast', fn: 'Photosynthesis; converts light energy to glucose', size: '5-10 um', plantOnly: true },
  vacuole: { name: 'Central Vacuole', fn: 'Stores water, ions, waste; maintains turgor pressure', size: 'Large (plant)', plantOnly: true },
  membrane: { name: 'Cell Membrane', fn: 'Phospholipid bilayer; selectively permeable boundary', size: '7-8 nm thick' },
}

const BIO_COLOR = 'rgb(80, 200, 120)'

export default function CellStructure() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  const [cellType, setCellType] = useState<CellType>('animal')
  const [highlighted, setHighlighted] = useState<Organelle>('none')
  const [showLabels, setShowLabels] = useState(true)
  const [zoom, setZoom] = useState(1)

  const reset = useCallback(() => {
    setCellType('animal')
    setHighlighted('none')
    setShowLabels(true)
    setZoom(1)
  }, [])

  const demoSteps: DemoStep[] = [
    {
      title: 'Cell Theory',
      description: 'All living things are made of cells. Cells are the basic unit of life. All cells come from pre-existing cells. Both plant and animal cells share many organelles.',
      setup: () => { setCellType('animal'); setHighlighted('none') },
    },
    {
      title: 'The Nucleus',
      description: 'The nucleus houses DNA organized into chromosomes. It is surrounded by a double membrane (nuclear envelope) with pores. The nucleolus inside makes ribosomal RNA.',
      setup: () => { setHighlighted('nucleus') },
    },
    {
      title: 'Endomembrane System',
      description: 'The ER, Golgi, lysosomes, and vesicles work as a connected system. Rough ER makes proteins, Golgi modifies and ships them, lysosomes digest waste.',
      setup: () => { setHighlighted('golgi') },
    },
    {
      title: 'Energy Organelles',
      description: 'Mitochondria perform cellular respiration in ALL eukaryotic cells. Chloroplasts (plant cells only) perform photosynthesis. Both have their own DNA!',
      setup: () => { setHighlighted('mitochondria') },
    },
    {
      title: 'Plant vs Animal Cells',
      description: 'Plant cells have cell walls, chloroplasts, and a large central vacuole. Animal cells have lysosomes and centrioles. Both have a nucleus, ER, Golgi, mitochondria.',
      setup: () => { setCellType('plant'); setHighlighted('chloroplast') },
    },
  ]

  const demo = useDemoMode(demoSteps)

  const selectedInfo = highlighted !== 'none' ? organelleData[highlighted] : null

  const organelleOptions: { value: string; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'nucleus', label: 'Nucleus' },
    { value: 'mitochondria', label: 'Mitochondria' },
    { value: 'er', label: 'ER' },
    { value: 'golgi', label: 'Golgi' },
    { value: 'ribosome', label: 'Ribosomes' },
    ...(cellType === 'animal' ? [{ value: 'lysosome', label: 'Lysosome' }] : []),
    ...(cellType === 'plant' ? [
      { value: 'chloroplast', label: 'Chloroplast' },
      { value: 'vacuole', label: 'Vacuole' },
    ] : []),
    { value: 'membrane', label: 'Membrane' },
  ]

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

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(zoom, zoom)

      const cellR = Math.min(w, h) * 0.32
      const isPlant = cellType === 'plant'
      const pulse = (org: Organelle) => highlighted === org ? 0.5 + Math.sin(t * 4) * 0.3 : 0

      // Cell wall (plant)
      if (isPlant) {
        ctx.strokeStyle = `rgba(140, 200, 80, ${0.5 + pulse('membrane')})`
        ctx.lineWidth = 6
        ctx.strokeRect(-cellR - 10, -cellR * 0.75 - 10, (cellR + 10) * 2, (cellR * 0.75 + 10) * 2)
      }

      // Cell membrane
      ctx.strokeStyle = `rgba(80, 200, 120, ${0.6 + pulse('membrane')})`
      ctx.lineWidth = 3
      ctx.beginPath()
      if (isPlant) {
        ctx.roundRect(-cellR, -cellR * 0.75, cellR * 2, cellR * 1.5, 20)
      } else {
        ctx.ellipse(0, 0, cellR, cellR * 0.75, 0, 0, Math.PI * 2)
      }
      ctx.stroke()
      ctx.fillStyle = `rgba(80, 200, 120, ${0.04 + pulse('membrane') * 0.03})`
      ctx.fill()

      // Central Vacuole (plant)
      if (isPlant) {
        const va = 0.15 + pulse('vacuole') * 0.15
        ctx.fillStyle = `rgba(100, 180, 255, ${va})`
        ctx.strokeStyle = `rgba(100, 180, 255, ${0.4 + pulse('vacuole')})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(10, 10, cellR * 0.45, cellR * 0.35, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        if (showLabels) drawLabel(ctx, 10, 10, 'Central Vacuole', highlighted === 'vacuole')
      }

      // ER (rough and smooth)
      const erA = 0.3 + pulse('er')
      ctx.strokeStyle = `rgba(180, 140, 220, ${erA})`
      ctx.lineWidth = 2
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        const baseY = -cellR * 0.15 + i * 14
        ctx.moveTo(cellR * 0.1, baseY)
        ctx.bezierCurveTo(cellR * 0.2, baseY - 8, cellR * 0.35, baseY + 8, cellR * 0.5, baseY)
        ctx.stroke()
        // Ribosomes on rough ER
        if (i < 3) {
          for (let j = 0; j < 4; j++) {
            const rx = cellR * 0.15 + j * (cellR * 0.1)
            ctx.fillStyle = `rgba(255, 200, 100, ${0.4 + pulse('ribosome')})`
            ctx.beginPath()
            ctx.arc(rx, baseY + Math.sin(t + j) * 2, 2.5, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      if (showLabels) drawLabel(ctx, cellR * 0.35, -cellR * 0.2, 'ER', highlighted === 'er')

      // Nucleus
      const nucA = 0.5 + pulse('nucleus')
      ctx.strokeStyle = `rgba(120, 160, 255, ${nucA})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(-cellR * 0.15, -cellR * 0.05, cellR * 0.22, cellR * 0.18, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = `rgba(120, 160, 255, ${0.08 + pulse('nucleus') * 0.08})`
      ctx.fill()
      // Nuclear pores
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8
        ctx.fillStyle = `rgba(120, 160, 255, ${0.6 + pulse('nucleus')})`
        ctx.beginPath()
        ctx.arc(-cellR * 0.15 + Math.cos(a) * cellR * 0.22, -cellR * 0.05 + Math.sin(a) * cellR * 0.18, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      // Nucleolus
      ctx.fillStyle = `rgba(180, 200, 255, ${0.3 + pulse('nucleus') * 0.2})`
      ctx.beginPath()
      ctx.arc(-cellR * 0.15, -cellR * 0.05, cellR * 0.06, 0, Math.PI * 2)
      ctx.fill()
      if (showLabels) drawLabel(ctx, -cellR * 0.15, -cellR * 0.05, 'Nucleus', highlighted === 'nucleus')

      // Mitochondria
      const mitoPositions = [
        { x: -cellR * 0.55, y: cellR * 0.3 },
        { x: cellR * 0.5, y: -cellR * 0.4 },
        { x: -cellR * 0.4, y: -cellR * 0.45 },
      ]
      mitoPositions.forEach((pos, i) => {
        ctx.save()
        ctx.translate(pos.x, pos.y)
        ctx.rotate(i * 0.8 + Math.sin(t + i) * 0.1)
        const mA = 0.5 + pulse('mitochondria')
        ctx.strokeStyle = `rgba(255, 120, 80, ${mA})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(0, 0, 22, 10, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = `rgba(255, 120, 80, ${0.1 + pulse('mitochondria') * 0.1})`
        ctx.fill()
        // Cristae
        ctx.strokeStyle = `rgba(255, 120, 80, ${0.3 + pulse('mitochondria') * 0.2})`
        ctx.lineWidth = 1
        for (let c = -2; c <= 2; c++) {
          ctx.beginPath()
          ctx.moveTo(c * 6, -8)
          ctx.bezierCurveTo(c * 6 + 4, -3, c * 6 - 4, 3, c * 6, 8)
          ctx.stroke()
        }
        ctx.restore()
      })
      if (showLabels) drawLabel(ctx, mitoPositions[0].x, mitoPositions[0].y - 18, 'Mitochondria', highlighted === 'mitochondria')

      // Golgi apparatus
      const golgiX = cellR * 0.35
      const golgiY = cellR * 0.35
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(220, 180, 60, ${0.4 + pulse('golgi')})`
        ctx.lineWidth = 3
        ctx.beginPath()
        const gy = golgiY - 12 + i * 8
        ctx.moveTo(golgiX - 25, gy)
        ctx.bezierCurveTo(golgiX - 10, gy - 4, golgiX + 10, gy + 4, golgiX + 25, gy)
        ctx.stroke()
      }
      // Vesicles
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(220, 180, 60, ${0.3 + pulse('golgi')})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(golgiX + 32 + i * 10, golgiY - 5 + Math.sin(t + i) * 5, 4, 0, Math.PI * 2)
        ctx.stroke()
      }
      if (showLabels) drawLabel(ctx, golgiX, golgiY - 24, 'Golgi', highlighted === 'golgi')

      // Free ribosomes
      const riboPositions = [
        { x: -cellR * 0.6, y: 0 },
        { x: cellR * 0.15, y: cellR * 0.5 },
        { x: -cellR * 0.3, y: cellR * 0.55 },
        { x: cellR * 0.6, y: cellR * 0.1 },
      ]
      riboPositions.forEach(pos => {
        ctx.fillStyle = `rgba(255, 200, 100, ${0.5 + pulse('ribosome')})`
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2)
        ctx.fill()
      })
      if (showLabels) drawLabel(ctx, riboPositions[0].x, riboPositions[0].y - 10, 'Ribosome', highlighted === 'ribosome')

      // Lysosome (animal only)
      if (!isPlant) {
        ctx.strokeStyle = `rgba(200, 80, 80, ${0.5 + pulse('lysosome')})`
        ctx.fillStyle = `rgba(200, 80, 80, ${0.1 + pulse('lysosome') * 0.1})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(cellR * 0.55, cellR * 0.45, 14, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        // Enzymes inside
        ctx.fillStyle = `rgba(255, 100, 100, ${0.5 + pulse('lysosome')})`
        ctx.font = '8px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('E', cellR * 0.55, cellR * 0.45 + 3)
        if (showLabels) drawLabel(ctx, cellR * 0.55, cellR * 0.45 - 20, 'Lysosome', highlighted === 'lysosome')
      }

      // Chloroplasts (plant only)
      if (isPlant) {
        const cpPositions = [
          { x: -cellR * 0.65, y: -cellR * 0.4 },
          { x: cellR * 0.55, y: cellR * 0.45 },
        ]
        cpPositions.forEach((pos, idx) => {
          ctx.save()
          ctx.translate(pos.x, pos.y)
          ctx.rotate(idx * 0.5)
          ctx.strokeStyle = `rgba(80, 200, 80, ${0.6 + pulse('chloroplast')})`
          ctx.fillStyle = `rgba(80, 200, 80, ${0.1 + pulse('chloroplast') * 0.1})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          // Thylakoid stacks
          ctx.strokeStyle = `rgba(80, 200, 80, ${0.3 + pulse('chloroplast') * 0.2})`
          ctx.lineWidth = 1.5
          for (let g = -2; g <= 2; g++) {
            ctx.beginPath()
            ctx.ellipse(g * 7, 0, 5, 8, 0, 0, Math.PI * 2)
            ctx.stroke()
          }
          ctx.restore()
        })
        if (showLabels) drawLabel(ctx, cpPositions[0].x, cpPositions[0].y - 22, 'Chloroplast', highlighted === 'chloroplast')
      }

      ctx.restore()

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [cellType, highlighted, showLabels, zoom])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1a12]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
          <APTag course="Biology" unit="Unit 2" color={BIO_COLOR} />
          <InfoPanel
            title={selectedInfo ? selectedInfo.name : 'Cell Structure'}
            departmentColor={BIO_COLOR}
            items={selectedInfo ? [
              { label: 'Function', value: selectedInfo.fn },
              { label: 'Size', value: selectedInfo.size },
              { label: 'Found in', value: selectedInfo.plantOnly ? 'Plant cells only' : selectedInfo.animalOnly ? 'Animal cells only' : 'All eukaryotic cells' },
            ] : [
              { label: 'Cell Type', value: cellType === 'plant' ? 'Plant Cell' : 'Animal Cell' },
              { label: 'Tip', value: 'Select an organelle to learn more' },
            ]}
          />
        </div>

        <div className="absolute top-4 right-4">
          <EquationDisplay
            departmentColor={BIO_COLOR}
            title="Cell Biology"
            equations={[
              { label: 'Cell Theory', expression: 'All living things are made of cells' },
              { label: 'Surface Area', expression: 'SA:Vol ratio limits cell size', description: 'As cells grow, volume increases faster than SA' },
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
            value={cellType}
            onChange={(v) => { setCellType(v as CellType); setHighlighted('none') }}
            options={[{ value: 'animal', label: 'Animal' }, { value: 'plant', label: 'Plant' }]}
            label="Cell Type"
            color={BIO_COLOR}
          />
          <ButtonGroup
            value={highlighted}
            onChange={(v) => setHighlighted(v as Organelle)}
            options={organelleOptions}
            label="Highlight Organelle"
            color={BIO_COLOR}
          />
          <Toggle value={showLabels} onChange={setShowLabels} label="Labels" />
          <div className="w-28">
            <Slider value={zoom} onChange={setZoom} min={0.5} max={2} step={0.1} label="Zoom" />
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

function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, active: boolean) {
  ctx.font = `${active ? 'bold ' : ''}11px system-ui`
  ctx.textAlign = 'center'
  ctx.fillStyle = active ? 'rgba(80, 200, 120, 0.95)' : 'rgba(255, 255, 255, 0.5)'
  ctx.fillText(text, x, y)
}
