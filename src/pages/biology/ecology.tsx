import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const BIO_COLOR = 'rgb(80, 200, 120)'

interface TrophicOrganism {
  id: string
  name: string
  level: number
  emoji: string
  color: string
  x: number
  y: number
  eats: string[]
}

const DEFAULT_ORGANISMS: TrophicOrganism[] = [
  { id: 'sun', name: 'Sun (Energy)', level: 0, emoji: 'Sun', color: '#ffcc00', x: 0.5, y: 0.05, eats: [] },
  { id: 'grass', name: 'Grass', level: 1, emoji: 'Grass', color: '#44cc44', x: 0.2, y: 0.25, eats: ['sun'] },
  { id: 'algae', name: 'Algae', level: 1, emoji: 'Algae', color: '#66dd66', x: 0.5, y: 0.25, eats: ['sun'] },
  { id: 'tree', name: 'Oak Tree', level: 1, emoji: 'Tree', color: '#228822', x: 0.8, y: 0.25, eats: ['sun'] },
  { id: 'rabbit', name: 'Rabbit', level: 2, emoji: 'Rabbit', color: '#cc8844', x: 0.15, y: 0.5, eats: ['grass'] },
  { id: 'mouse', name: 'Mouse', level: 2, emoji: 'Mouse', color: '#aa8866', x: 0.4, y: 0.5, eats: ['grass', 'tree'] },
  { id: 'insect', name: 'Insect', level: 2, emoji: 'Insect', color: '#88aa44', x: 0.65, y: 0.5, eats: ['algae', 'tree'] },
  { id: 'deer', name: 'Deer', level: 2, emoji: 'Deer', color: '#bb8844', x: 0.85, y: 0.5, eats: ['grass', 'tree'] },
  { id: 'snake', name: 'Snake', level: 3, emoji: 'Snake', color: '#668844', x: 0.25, y: 0.72, eats: ['rabbit', 'mouse'] },
  { id: 'hawk', name: 'Hawk', level: 3, emoji: 'Hawk', color: '#886644', x: 0.55, y: 0.72, eats: ['mouse', 'insect', 'snake'] },
  { id: 'fox', name: 'Fox', level: 3, emoji: 'Fox', color: '#cc6644', x: 0.8, y: 0.72, eats: ['rabbit', 'insect', 'deer'] },
  { id: 'eagle', name: 'Eagle', level: 4, emoji: 'Eagle', color: '#664422', x: 0.5, y: 0.92, eats: ['snake', 'hawk', 'fox'] },
]

const ADDABLE_ORGANISMS: TrophicOrganism[] = [
  { id: 'frog', name: 'Frog', level: 2, emoji: 'Frog', color: '#44aa66', x: 0.5, y: 0.5, eats: ['insect'] },
  { id: 'owl', name: 'Owl', level: 3, emoji: 'Owl', color: '#886655', x: 0.4, y: 0.72, eats: ['mouse', 'insect'] },
  { id: 'wolf', name: 'Wolf', level: 4, emoji: 'Wolf', color: '#555555', x: 0.3, y: 0.92, eats: ['deer', 'rabbit'] },
]

export default function Ecology() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  const [organisms, setOrganisms] = useState<TrophicOrganism[]>(DEFAULT_ORGANISMS)
  const [efficiency, setEfficiency] = useState(10)
  const [showPyramid, setShowPyramid] = useState(false)
  const [trophicLevel, setTrophicLevel] = useState(0)
  const [selectedOrganism, setSelectedOrganism] = useState<string | null>(null)

  const baseEnergy = 10000

  const getLevelEnergy = useCallback((level: number): number => {
    if (level === 0) return baseEnergy
    return getLevelEnergy(level - 1) * (efficiency / 100)
  }, [efficiency, baseEnergy])

  const getLevelOrganisms = useCallback((level: number): TrophicOrganism[] => {
    return organisms.filter(o => o.level === level)
  }, [organisms])

  const maxLevel = Math.max(...organisms.map(o => o.level))

  const addOrganism = useCallback((org: TrophicOrganism) => {
    if (organisms.find(o => o.id === org.id)) return
    setOrganisms(prev => [...prev, org])
  }, [organisms])

  const removeOrganism = useCallback((id: string) => {
    if (id === 'sun') return
    setOrganisms(prev => {
      const filtered = prev.filter(o => o.id !== id)
      return filtered.map(o => ({ ...o, eats: o.eats.filter(e => e !== id) }))
    })
  }, [])

  const reset = useCallback(() => {
    setOrganisms(DEFAULT_ORGANISMS)
    setEfficiency(10)
    setShowPyramid(false)
    setTrophicLevel(0)
    setSelectedOrganism(null)
    timeRef.current = 0
  }, [])

  const demoSteps: DemoStep[] = [
    {
      title: 'Food Webs',
      description: 'A food web shows all the feeding relationships in an ecosystem. Arrows point from prey to predator (direction of energy flow). Each organism can have multiple prey and predators.',
      setup: () => { setShowPyramid(false); setSelectedOrganism(null) },
    },
    {
      title: 'Trophic Levels',
      description: 'Producers (level 1) make their own food via photosynthesis. Primary consumers eat producers. Secondary consumers eat primary consumers. Tertiary consumers are top predators.',
      setup: () => { setShowPyramid(false); setTrophicLevel(1) },
    },
    {
      title: 'The 10% Rule',
      description: 'Only about 10% of energy transfers from one trophic level to the next. The rest is lost as heat through cellular respiration. This limits food chain length to 4-5 levels.',
      setup: () => { setShowPyramid(true); setEfficiency(10) },
    },
    {
      title: 'Energy Pyramid',
      description: 'An energy pyramid shows energy available at each trophic level. Producers have the most energy. Each higher level has ~10% of the level below. This is why there are fewer top predators.',
      setup: () => { setShowPyramid(true); setEfficiency(10) },
    },
    {
      title: 'Ecological Impact',
      description: 'Removing a species can cascade through the food web. Keystone species have disproportionate impact. Try removing organisms and see how energy flow changes!',
      setup: () => { setShowPyramid(false); setSelectedOrganism(null) },
    },
  ]

  const demo = useDemoMode(demoSteps)

  const trophicLevelNames = ['Source', 'Producers', 'Primary Consumers', 'Secondary Consumers', 'Tertiary Consumers']

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

      ctx.fillStyle = '#0a1a12'
      ctx.fillRect(0, 0, w, h)

      if (showPyramid) {
        drawEnergyPyramid(ctx, w, h, t)
      } else {
        drawFoodWeb(ctx, w, h, t)
      }

      animRef.current = requestAnimationFrame(animate)
    }

    const drawFoodWeb = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const padding = 40
      const areaW = w - padding * 2
      const areaH = h - padding * 2

      // Title
      ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
      ctx.font = 'bold 14px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('FOOD WEB - Energy Flow', w / 2, 24)

      // Trophic level labels on left
      for (let lvl = 0; lvl <= maxLevel; lvl++) {
        const levelOrgs = getLevelOrganisms(lvl)
        if (levelOrgs.length === 0) continue
        const avgY = levelOrgs.reduce((s, o) => s + o.y, 0) / levelOrgs.length
        const ly = padding + avgY * areaH

        ctx.fillStyle = trophicLevel === lvl ? 'rgba(80, 200, 120, 0.7)' : 'rgba(255, 255, 255, 0.2)'
        ctx.font = '10px system-ui'
        ctx.textAlign = 'right'
        ctx.fillText(trophicLevelNames[lvl] || `Level ${lvl}`, padding - 8, ly)

        // Horizontal guide line
        ctx.strokeStyle = `rgba(80, 200, 120, ${trophicLevel === lvl ? 0.15 : 0.04})`
        ctx.lineWidth = 1
        ctx.setLineDash([4, 8])
        ctx.beginPath()
        ctx.moveTo(padding, ly)
        ctx.lineTo(w - padding, ly)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Draw connection arrows first
      organisms.forEach(org => {
        org.eats.forEach(preyId => {
          const prey = organisms.find(o => o.id === preyId)
          if (!prey) return

          const fromX = padding + prey.x * areaW
          const fromY = padding + prey.y * areaH
          const toX = padding + org.x * areaW
          const toY = padding + org.y * areaH

          const isHighlighted = selectedOrganism === org.id || selectedOrganism === preyId

          // Animated energy flow
          const flowProgress = (t * 0.3) % 1
          ctx.strokeStyle = isHighlighted
            ? 'rgba(80, 200, 120, 0.6)'
            : 'rgba(80, 200, 120, 0.15)'
          ctx.lineWidth = isHighlighted ? 2.5 : 1.5
          ctx.beginPath()
          ctx.moveTo(fromX, fromY)
          ctx.lineTo(toX, toY)
          ctx.stroke()

          // Arrow head
          const angle = Math.atan2(toY - fromY, toX - fromX)
          const headLen = isHighlighted ? 10 : 7
          ctx.fillStyle = ctx.strokeStyle
          ctx.beginPath()
          ctx.moveTo(toX, toY)
          ctx.lineTo(toX - headLen * Math.cos(angle - 0.3), toY - headLen * Math.sin(angle - 0.3))
          ctx.lineTo(toX - headLen * Math.cos(angle + 0.3), toY - headLen * Math.sin(angle + 0.3))
          ctx.closePath()
          ctx.fill()

          // Energy flow dot
          if (isHighlighted) {
            const dotX = fromX + (toX - fromX) * flowProgress
            const dotY = fromY + (toY - fromY) * flowProgress
            ctx.fillStyle = 'rgba(80, 200, 120, 0.8)'
            ctx.beginPath()
            ctx.arc(dotX, dotY, 3, 0, Math.PI * 2)
            ctx.fill()
          }
        })
      })

      // Draw organism nodes
      organisms.forEach(org => {
        const ox = padding + org.x * areaW
        const oy = padding + org.y * areaH
        const isSelected = selectedOrganism === org.id
        const isHighlightedLevel = trophicLevel === org.level && trophicLevel > 0
        const nodeR = isSelected ? 22 : 18

        // Glow
        if (isSelected || isHighlightedLevel) {
          const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, nodeR * 2)
          glow.addColorStop(0, `${org.color}40`)
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(ox, oy, nodeR * 2, 0, Math.PI * 2)
          ctx.fill()
        }

        // Node circle
        ctx.fillStyle = `${org.color}${isSelected ? 'cc' : '88'}`
        ctx.beginPath()
        ctx.arc(ox, oy, nodeR, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.6)' : `${org.color}66`
        ctx.lineWidth = isSelected ? 2 : 1
        ctx.stroke()

        // Label
        ctx.fillStyle = 'white'
        ctx.font = `${isSelected ? 'bold ' : ''}${nodeR * 0.5}px system-ui`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(org.emoji, ox, oy - 2)

        ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)'
        ctx.font = '9px system-ui'
        ctx.textBaseline = 'top'
        ctx.fillText(org.name, ox, oy + nodeR + 4)
      })

      // Energy at each level
      for (let lvl = 0; lvl <= maxLevel; lvl++) {
        const energy = getLevelEnergy(lvl)
        const levelOrgs = getLevelOrganisms(lvl)
        if (levelOrgs.length === 0) continue
        ctx.fillStyle = 'rgba(255, 200, 50, 0.4)'
        ctx.font = '9px system-ui'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const avgY = levelOrgs.reduce((s, o) => s + o.y, 0) / levelOrgs.length
        ctx.fillText(`${energy.toFixed(0)} kcal`, w - padding + 5, padding + avgY * areaH)
      }
    }

    const drawEnergyPyramid = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const padding = 60
      const pyrW = w * 0.6
      const pyrH = h * 0.7
      const pyrX = (w - pyrW) / 2
      const pyrY = padding

      ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
      ctx.font = 'bold 14px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('ENERGY PYRAMID', w / 2, 24)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.font = '11px system-ui'
      ctx.fillText(`Energy transfer efficiency: ${efficiency}%`, w / 2, 42)

      const levels = maxLevel + 1
      const levelH = pyrH / levels

      for (let lvl = levels - 1; lvl >= 0; lvl--) {
        const energy = getLevelEnergy(lvl)
        const levelOrgs = getLevelOrganisms(lvl)
        const invLvl = levels - 1 - lvl

        // Width proportional to energy (log scale for visibility)
        const widthFrac = lvl === 0 ? 1 : Math.max(0.08, energy / baseEnergy)
        const barW = pyrW * widthFrac
        const barX = pyrX + (pyrW - barW) / 2
        const barY = pyrY + invLvl * levelH

        // Colors get warmer as you go up
        const hue = 120 - lvl * 25
        const sat = 60 + lvl * 10
        ctx.fillStyle = `hsla(${hue}, ${sat}%, 40%, ${0.4 + Math.sin(t + lvl) * 0.1})`
        ctx.fillRect(barX, barY + 2, barW, levelH - 4)
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, 60%, 0.5)`
        ctx.lineWidth = 1.5
        ctx.strokeRect(barX, barY + 2, barW, levelH - 4)

        // Level label
        ctx.fillStyle = 'white'
        ctx.font = 'bold 12px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(trophicLevelNames[lvl] || `Level ${lvl}`, w / 2, barY + levelH / 2 - 8)

        // Energy value
        ctx.fillStyle = 'rgba(255, 200, 50, 0.8)'
        ctx.font = 'bold 14px system-ui'
        ctx.fillText(`${energy.toFixed(0)} kcal`, w / 2, barY + levelH / 2 + 10)

        // Species count
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.font = '10px system-ui'
        const names = levelOrgs.map(o => o.name).join(', ')
        ctx.fillText(names, w / 2, barY + levelH / 2 + 24)

        // 10% rule arrow between levels
        if (lvl < levels - 1) {
          ctx.fillStyle = 'rgba(255, 100, 100, 0.6)'
          ctx.font = 'bold 10px system-ui'
          ctx.textAlign = 'right'
          ctx.fillText(`${efficiency}% →`, barX - 8, barY + levelH - 2)

          // Heat loss
          ctx.fillStyle = 'rgba(255, 100, 50, 0.4)'
          ctx.textAlign = 'left'
          ctx.fillText(`${100 - efficiency}% heat loss`, barX + barW + 8, barY + levelH - 2)
        }
      }
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [organisms, efficiency, showPyramid, trophicLevel, selectedOrganism, maxLevel, getLevelEnergy, getLevelOrganisms, baseEnergy, trophicLevelNames])

  const infoItems = showPyramid
    ? Array.from({ length: maxLevel + 1 }, (_, lvl) => ({
        label: trophicLevelNames[lvl] || `Level ${lvl}`,
        value: `${getLevelEnergy(lvl).toFixed(0)} kcal (${getLevelOrganisms(lvl).length} spp)`,
      }))
    : [
        { label: 'Total Species', value: `${organisms.length}` },
        { label: 'Producers', value: `${getLevelOrganisms(1).length}` },
        { label: 'Consumers', value: `${organisms.filter(o => o.level >= 2).length}` },
        { label: 'Top Predators', value: `${getLevelOrganisms(maxLevel).length}` },
        { label: 'Selected', value: selectedOrganism ? organisms.find(o => o.id === selectedOrganism)?.name || 'None' : 'None' },
      ]

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1a12]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-[210px]">
          <APTag course="Biology" unit="Unit 8" color={BIO_COLOR} />
          <InfoPanel
            title={showPyramid ? 'Energy Pyramid' : 'Food Web Data'}
            departmentColor={BIO_COLOR}
            items={infoItems}
          />
        </div>

        <div className="absolute top-4 right-4 max-w-[220px]">
          <EquationDisplay
            departmentColor={BIO_COLOR}
            title="Ecology"
            equations={[
              { label: '10% Rule', expression: 'E(n+1) = E(n) x 0.10', description: 'Only ~10% of energy transfers up each trophic level' },
              { label: 'Productivity', expression: 'GPP - R = NPP', description: 'Gross primary prod. minus respiration' },
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
          <div className="flex gap-1">
            {ADDABLE_ORGANISMS.filter(o => !organisms.find(e => e.id === o.id)).map(org => (
              <Button key={org.id} onClick={() => addOrganism(org)} variant="secondary">
                + {org.name}
              </Button>
            ))}
            {selectedOrganism && selectedOrganism !== 'sun' && (
              <Button onClick={() => { removeOrganism(selectedOrganism); setSelectedOrganism(null) }} variant="secondary">
                Remove {organisms.find(o => o.id === selectedOrganism)?.name}
              </Button>
            )}
          </div>
          <div className="w-36">
            <Slider value={efficiency} onChange={(v) => setEfficiency(Math.round(v))} min={5} max={20} step={1} label={`Efficiency: ${efficiency}%`} />
          </div>
          <Toggle value={showPyramid} onChange={setShowPyramid} label="Energy Pyramid" />
          <ButtonGroup
            value={String(trophicLevel)}
            onChange={(v) => setTrophicLevel(Number(v))}
            options={[
              { value: '0', label: 'All' },
              { value: '1', label: 'Prod.' },
              { value: '2', label: '1st' },
              { value: '3', label: '2nd' },
              { value: '4', label: '3rd' },
            ]}
            label="Trophic Level"
            color={BIO_COLOR}
          />
          <ButtonGroup
            value={selectedOrganism || ''}
            onChange={(v) => setSelectedOrganism(v || null)}
            options={[
              { value: '', label: 'None' },
              ...organisms.filter(o => o.level > 0).slice(0, 5).map(o => ({ value: o.id, label: o.name.slice(0, 5) })),
            ]}
            label="Select Organism"
            color={BIO_COLOR}
          />
          <div className="flex gap-2">
            <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
            <Button onClick={reset} variant="secondary">Reset</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
