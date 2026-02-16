import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type Process = 'replication' | 'transcription' | 'translation'

const BIO_COLOR = 'rgb(80, 200, 120)'

const PRESETS: Record<string, string> = {
  'Preset 1': 'ATGCGATAC',
  'Preset 2': 'ATGTTTGCC',
  'Preset 3': 'ATGAAACCC',
}

const COMPLEMENT: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' }
const RNA_COMP: Record<string, string> = { A: 'U', T: 'A', G: 'C', C: 'G' }

const CODON_TABLE: Record<string, string> = {
  AUG: 'Met', UUU: 'Phe', UUC: 'Phe', UUA: 'Leu', UUG: 'Leu',
  CUU: 'Leu', CUC: 'Leu', CUA: 'Leu', CUG: 'Leu', AUU: 'Ile',
  AUC: 'Ile', AUA: 'Ile', GUU: 'Val', GUC: 'Val', GUA: 'Val', GUG: 'Val',
  UCU: 'Ser', UCC: 'Ser', UCA: 'Ser', UCG: 'Ser', CCU: 'Pro', CCC: 'Pro',
  CCA: 'Pro', CCG: 'Pro', ACU: 'Thr', ACC: 'Thr', ACA: 'Thr', ACG: 'Thr',
  GCU: 'Ala', GCC: 'Ala', GCA: 'Ala', GCG: 'Ala', UAU: 'Tyr', UAC: 'Tyr',
  CAU: 'His', CAC: 'His', CAA: 'Gln', CAG: 'Gln', AAU: 'Asn', AAC: 'Asn',
  AAA: 'Lys', AAG: 'Lys', GAU: 'Asp', GAC: 'Asp', GAA: 'Glu', GAG: 'Glu',
  UGU: 'Cys', UGC: 'Cys', UGG: 'Trp', CGU: 'Arg', CGC: 'Arg', CGA: 'Arg',
  CGG: 'Arg', AGU: 'Ser', AGC: 'Ser', AGA: 'Arg', AGG: 'Arg', GGU: 'Gly',
  GGC: 'Gly', GGA: 'Gly', GGG: 'Gly', UAA: 'STOP', UAG: 'STOP', UGA: 'STOP',
}

const BASE_COLORS: Record<string, string> = {
  A: '#44dd88', T: '#dd4488', G: '#4488dd', C: '#ddaa44', U: '#ff6644',
}

export default function DNAReplication() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  const [process, setProcess] = useState<Process>('replication')
  const [preset, setPreset] = useState('Preset 1')
  const [stepThrough, setStepThrough] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [manualStep, setManualStep] = useState(0)

  const dnaSequence = PRESETS[preset]
  const templateStrand = dnaSequence.split('').map(b => COMPLEMENT[b]).join('')
  const mRNA = dnaSequence.split('').map(b => RNA_COMP[b]).join('')

  const codons: string[] = []
  for (let i = 0; i < mRNA.length - 2; i += 3) {
    codons.push(mRNA.slice(i, i + 3))
  }
  const aminoAcids = codons.map(c => CODON_TABLE[c] || '???')

  const currentCodonIdx = stepThrough ? Math.min(manualStep, codons.length - 1) : Math.floor(timeRef.current * speed * 0.3) % codons.length

  const reset = useCallback(() => {
    setProcess('replication')
    setPreset('Preset 1')
    setStepThrough(false)
    setSpeed(1)
    setManualStep(0)
    timeRef.current = 0
  }, [])

  const demoSteps: DemoStep[] = [
    {
      title: 'DNA Replication',
      description: 'DNA replication is semi-conservative: each new molecule has one original and one new strand. Helicase unwinds, primase adds primers, DNA polymerase III builds 5\' to 3\'.',
      setup: () => { setProcess('replication') },
    },
    {
      title: 'Transcription',
      description: 'RNA polymerase reads the template strand 3\' to 5\' and builds mRNA 5\' to 3\'. In eukaryotes, pre-mRNA is processed (5\' cap, poly-A tail, intron splicing).',
      setup: () => { setProcess('transcription') },
    },
    {
      title: 'Translation',
      description: 'Ribosomes read mRNA codons (3 bases each). tRNA anticodons match and bring amino acids. Start codon AUG = methionine. Continues until a stop codon (UAA, UAG, UGA).',
      setup: () => { setProcess('translation') },
    },
    {
      title: 'Central Dogma',
      description: 'DNA → (transcription) → mRNA → (translation) → Protein. This is the Central Dogma of molecular biology. Mutations in DNA can change the protein produced.',
      setup: () => { setProcess('replication') },
    },
  ]

  const demo = useDemoMode(demoSteps)

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
      if (!stepThrough) timeRef.current += 0.016 * speed
      const t = timeRef.current
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const cx = w / 2
      const cy = h / 2

      ctx.fillStyle = '#0a1a12'
      ctx.fillRect(0, 0, w, h)

      if (process === 'replication') {
        drawReplication(ctx, w, h, t, dnaSequence)
      } else if (process === 'transcription') {
        drawTranscription(ctx, w, h, t, dnaSequence, mRNA)
      } else {
        drawTranslation(ctx, w, h, t, mRNA, codons, aminoAcids, stepThrough ? manualStep : -1)
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [process, dnaSequence, mRNA, codons, aminoAcids, speed, stepThrough, manualStep])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1a12]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 flex flex-col gap-3 max-w-xs">
          <APTag course="Biology" unit="Unit 5" color={BIO_COLOR} />
          <InfoPanel
            title="Gene Expression"
            departmentColor={BIO_COLOR}
            items={[
              { label: 'Process', value: process.charAt(0).toUpperCase() + process.slice(1) },
              { label: 'DNA (coding)', value: dnaSequence },
              { label: 'DNA (template)', value: templateStrand },
              { label: 'mRNA', value: mRNA },
              { label: 'Current Codon', value: codons[currentCodonIdx] || '-' },
              { label: 'Amino Acid', value: aminoAcids[currentCodonIdx] || '-' },
              { label: 'Protein', value: aminoAcids.join('-') },
            ]}
          />
        </div>

        <div className="absolute top-4 right-4">
          <EquationDisplay
            departmentColor={BIO_COLOR}
            title="Central Dogma"
            equations={[
              { label: 'Dogma', expression: 'DNA → mRNA → Protein', description: 'Replication, transcription, translation' },
              { label: 'Pairing', expression: 'A-T (DNA), A-U (RNA), G-C' },
              { label: 'Codon', expression: '3 mRNA bases = 1 amino acid' },
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
            value={process}
            onChange={(v) => setProcess(v as Process)}
            options={[
              { value: 'replication', label: 'Replication' },
              { value: 'transcription', label: 'Transcription' },
              { value: 'translation', label: 'Translation' },
            ]}
            label="Process"
            color={BIO_COLOR}
          />
          <ButtonGroup
            value={preset}
            onChange={setPreset}
            options={Object.keys(PRESETS).map(k => ({ value: k, label: k }))}
            label="DNA Sequence"
            color={BIO_COLOR}
          />
          <Toggle value={stepThrough} onChange={setStepThrough} label="Step Mode" />
          {stepThrough && (
            <div className="w-28">
              <Slider value={manualStep} onChange={(v) => setManualStep(Math.round(v))} min={0} max={codons.length - 1} step={1} label="Step" />
            </div>
          )}
          <div className="w-28">
            <Slider value={speed} onChange={setSpeed} min={0.5} max={3} step={0.5} label="Speed" />
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

function drawBase(ctx: CanvasRenderingContext2D, x: number, y: number, base: string, size: number) {
  ctx.fillStyle = BASE_COLORS[base] || '#888'
  ctx.beginPath()
  ctx.roundRect(x - size / 2, y - size / 2, size, size, 4)
  ctx.fill()
  ctx.fillStyle = 'white'
  ctx.font = `bold ${size * 0.6}px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(base, x, y)
}

function drawReplication(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, seq: string) {
  const cx = w / 2
  const cy = h / 2
  const spacing = Math.min(50, w / (seq.length + 2))
  const forkPos = ((Math.sin(t * 0.5) + 1) / 2) * (seq.length - 1)

  ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
  ctx.font = 'bold 14px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('DNA REPLICATION', cx, 40)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.font = '11px system-ui'
  ctx.fillText('Helicase unwinds | DNA Pol III builds 5\' → 3\'', cx, 58)

  for (let i = 0; i < seq.length; i++) {
    const bx = cx + (i - seq.length / 2) * spacing
    const separation = i < forkPos ? Math.min(40, (forkPos - i) * 8) : 0
    const unwound = i < forkPos

    // Template strand (top)
    const ty = cy - 20 - separation
    drawBase(ctx, bx, ty, seq[i], 22)

    // Complement strand (bottom)
    const by = cy + 20 + separation
    const comp = COMPLEMENT[seq[i]]
    drawBase(ctx, bx, by, comp, 22)

    // Hydrogen bonds
    if (!unwound) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      ctx.moveTo(bx, ty + 11)
      ctx.lineTo(bx, by - 11)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // New complementary bases being added
    if (unwound) {
      const newAlpha = Math.min(1, (forkPos - i) * 0.3)
      ctx.globalAlpha = newAlpha
      drawBase(ctx, bx, cy - 20 + separation + 44, comp, 18)
      drawBase(ctx, bx, cy + 20 - separation - 44, seq[i], 18)
      // Bond to new
      ctx.strokeStyle = `rgba(80, 200, 120, ${newAlpha * 0.3})`
      ctx.lineWidth = 1
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      ctx.moveTo(bx, ty + 11)
      ctx.lineTo(bx, cy - 20 + separation + 44 - 9)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(bx, by - 11)
      ctx.lineTo(bx, cy + 20 - separation - 44 + 9)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }
  }

  // Helicase at fork
  const helX = cx + (forkPos - seq.length / 2) * spacing
  ctx.fillStyle = 'rgba(255, 200, 50, 0.6)'
  ctx.beginPath()
  ctx.arc(helX, cy, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'white'
  ctx.font = 'bold 7px system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('HEL', helX, cy)

  // Direction labels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.font = '10px system-ui'
  ctx.textAlign = 'left'
  ctx.fillText("5'", cx - seq.length / 2 * spacing - 20, cy - 20)
  ctx.textAlign = 'right'
  ctx.fillText("3'", cx + seq.length / 2 * spacing + 20, cy - 20)
}

function drawTranscription(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, seq: string, mRNAStr: string) {
  const cx = w / 2
  const cy = h / 2
  const spacing = Math.min(50, w / (seq.length + 2))
  const polPos = ((Math.sin(t * 0.4) + 1) / 2) * (seq.length - 1)

  ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
  ctx.font = 'bold 14px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('TRANSCRIPTION', cx, 40)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.font = '11px system-ui'
  ctx.fillText('RNA Polymerase reads template 3\'→5\', builds mRNA 5\'→3\'', cx, 58)

  // DNA double strand
  for (let i = 0; i < seq.length; i++) {
    const bx = cx + (i - seq.length / 2) * spacing
    const opened = Math.abs(i - polPos) < 2

    const sep = opened ? 35 : 0
    drawBase(ctx, bx, cy - 40 - sep, seq[i], 20)
    drawBase(ctx, bx, cy - 10 + sep, COMPLEMENT[seq[i]], 20)

    if (!opened) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      ctx.moveTo(bx, cy - 40 + 10)
      ctx.lineTo(bx, cy - 10 - 10)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // mRNA being built below
  for (let i = 0; i < Math.min(mRNAStr.length, Math.floor(polPos) + 1); i++) {
    const bx = cx + (i - seq.length / 2) * spacing
    const alpha = i <= polPos ? Math.min(1, (polPos - i) * 0.5 + 0.5) : 0
    ctx.globalAlpha = alpha
    drawBase(ctx, bx, cy + 60, mRNAStr[i], 20)
    ctx.globalAlpha = 1
  }

  ctx.fillStyle = 'rgba(255, 120, 50, 0.5)'
  ctx.font = '11px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('mRNA', cx - seq.length / 2 * spacing - 30, cy + 64)

  // RNA Polymerase
  const rpX = cx + (polPos - seq.length / 2) * spacing
  ctx.fillStyle = 'rgba(255, 150, 50, 0.6)'
  ctx.beginPath()
  ctx.ellipse(rpX, cy - 25, 18, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'white'
  ctx.font = 'bold 7px system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('RNA Pol', rpX, cy - 25)
}

function drawTranslation(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, mRNAStr: string, codonsArr: string[], aas: string[], fixedStep: number) {
  const cx = w / 2
  const cy = h / 2
  const spacing = Math.min(24, w / (mRNAStr.length + 4))

  ctx.fillStyle = 'rgba(80, 200, 120, 0.6)'
  ctx.font = 'bold 14px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('TRANSLATION', cx, 40)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.font = '11px system-ui'
  ctx.fillText('Ribosome reads mRNA codons; tRNA brings amino acids', cx, 58)

  // mRNA strand
  for (let i = 0; i < mRNAStr.length; i++) {
    const bx = cx + (i - mRNAStr.length / 2) * spacing
    drawBase(ctx, bx, cy, mRNAStr[i], 18)
  }
  ctx.fillStyle = 'rgba(255, 120, 50, 0.4)'
  ctx.font = '10px system-ui'
  ctx.textAlign = 'right'
  ctx.fillText("5'", cx - mRNAStr.length / 2 * spacing - 8, cy + 4)
  ctx.textAlign = 'left'
  ctx.fillText("3'", cx + mRNAStr.length / 2 * spacing + 8, cy + 4)

  // Codon brackets
  const activeCodon = fixedStep >= 0 ? fixedStep : Math.floor(((Math.sin(t * 0.3) + 1) / 2) * codonsArr.length) % codonsArr.length

  codonsArr.forEach((codon, ci) => {
    const startI = ci * 3
    const bx1 = cx + (startI - mRNAStr.length / 2) * spacing - spacing * 0.4
    const bx2 = cx + (startI + 2 - mRNAStr.length / 2) * spacing + spacing * 0.4
    const isActive = ci === activeCodon

    if (isActive) {
      ctx.strokeStyle = 'rgba(80, 200, 120, 0.6)'
      ctx.lineWidth = 2
      ctx.strokeRect(bx1, cy - 12, bx2 - bx1, 24)
    }

    // Codon label below
    ctx.fillStyle = isActive ? 'rgba(80, 200, 120, 0.8)' : 'rgba(255, 255, 255, 0.3)'
    ctx.font = `${isActive ? 'bold ' : ''}9px system-ui`
    ctx.textAlign = 'center'
    ctx.fillText(codon, (bx1 + bx2) / 2, cy + 24)
  })

  // Ribosome
  const riboX = cx + (activeCodon * 3 + 1 - mRNAStr.length / 2) * spacing
  ctx.fillStyle = 'rgba(80, 200, 120, 0.15)'
  ctx.beginPath()
  ctx.ellipse(riboX, cy - 40, 35, 25, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(80, 200, 120, 0.4)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = 'rgba(80, 200, 120, 0.7)'
  ctx.font = 'bold 10px system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Ribosome', riboX, cy - 40)

  // tRNA at active site
  ctx.strokeStyle = 'rgba(150, 100, 255, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(riboX, cy - 15)
  ctx.lineTo(riboX, cy - 70)
  ctx.stroke()

  // Amino acid on tRNA
  const currentAA = aas[activeCodon] || '???'
  ctx.fillStyle = 'rgba(255, 150, 100, 0.7)'
  ctx.beginPath()
  ctx.roundRect(riboX - 18, cy - 88, 36, 18, 4)
  ctx.fill()
  ctx.fillStyle = 'white'
  ctx.font = 'bold 10px system-ui'
  ctx.fillText(currentAA, riboX, cy - 79)

  // Growing polypeptide chain
  ctx.fillStyle = 'rgba(80, 200, 120, 0.5)'
  ctx.font = '10px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('Polypeptide:', cx, cy - 110)
  let chainStr = ''
  for (let i = 0; i <= activeCodon; i++) {
    if (aas[i] === 'STOP') break
    chainStr += (i > 0 ? ' - ' : '') + aas[i]
  }
  ctx.fillStyle = 'rgba(255, 200, 100, 0.8)'
  ctx.font = 'bold 12px system-ui'
  ctx.fillText(chainStr, cx, cy - 96)
}
