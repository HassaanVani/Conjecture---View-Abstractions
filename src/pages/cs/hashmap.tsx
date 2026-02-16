import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Button, ButtonGroup, NumberInput, Slider } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type CollisionStrategy = 'chaining' | 'openAddressing'

interface Entry {
  key: string
  value: number
  color: string
}

type Bucket = Entry[]

const HASH_COLORS = [
  'rgba(255,100,100,0.8)', 'rgba(100,200,255,0.8)', 'rgba(100,255,180,0.8)',
  'rgba(255,200,80,0.8)', 'rgba(200,100,255,0.8)', 'rgba(255,160,100,0.8)',
  'rgba(100,255,255,0.8)', 'rgba(255,100,200,0.8)',
]

function hashFn(key: string, tableSize: number): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % tableSize
  }
  return hash
}

const CS_COLOR = 'rgb(80, 200, 220)'

export default function HashMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [tableSize, setTableSize] = useState(8)
  const [buckets, setBuckets] = useState<Bucket[]>(() => Array.from({ length: 8 }, () => []))
  const [strategy, setStrategy] = useState<CollisionStrategy>('chaining')
  const [inputKey, setInputKey] = useState('apple')
  const [inputValue, setInputValue] = useState(42)
  const [collisions, setCollisions] = useState(0)
  const [highlightBucket, setHighlightBucket] = useState(-1)
  const [highlightEntry, setHighlightEntry] = useState<string | null>(null)
  const [lastHash, setLastHash] = useState(-1)
  const [totalEntries, setTotalEntries] = useState(0)
  const keyCountRef = useRef(0)

  const loadFactor = totalEntries / tableSize

  const resetAll = useCallback(() => {
    setBuckets(Array.from({ length: tableSize }, () => []))
    setCollisions(0)
    setHighlightBucket(-1)
    setHighlightEntry(null)
    setLastHash(-1)
    setTotalEntries(0)
    keyCountRef.current = 0
  }, [tableSize])

  const doInsert = useCallback(() => {
    const key = inputKey.trim()
    if (!key) return
    const hash = hashFn(key, tableSize)
    const color = HASH_COLORS[hash % HASH_COLORS.length]
    setLastHash(hash)
    setHighlightBucket(hash)

    setBuckets(prev => {
      const newBuckets = prev.map(b => [...b])
      if (strategy === 'chaining') {
        const existing = newBuckets[hash].findIndex(e => e.key === key)
        if (existing >= 0) {
          newBuckets[hash][existing] = { key, value: inputValue, color }
        } else {
          if (newBuckets[hash].length > 0) setCollisions(c => c + 1)
          newBuckets[hash].push({ key, value: inputValue, color })
          setTotalEntries(t => t + 1)
        }
      } else {
        let idx = hash
        let probes = 0
        while (newBuckets[idx].length > 0 && newBuckets[idx][0].key !== key && probes < tableSize) {
          idx = (idx + 1) % tableSize
          probes++
          setCollisions(c => c + 1)
        }
        if (probes < tableSize) {
          if (newBuckets[idx].length === 0) setTotalEntries(t => t + 1)
          newBuckets[idx] = [{ key, value: inputValue, color }]
        }
      }
      return newBuckets
    })

    setHighlightEntry(key)
    setTimeout(() => { setHighlightBucket(-1); setHighlightEntry(null) }, 1500)
  }, [inputKey, inputValue, tableSize, strategy])

  const doLookup = useCallback(() => {
    const key = inputKey.trim()
    if (!key) return
    const hash = hashFn(key, tableSize)
    setLastHash(hash)
    setHighlightBucket(hash)

    if (strategy === 'chaining') {
      const entry = buckets[hash].find(e => e.key === key)
      setHighlightEntry(entry ? key : null)
    } else {
      let idx = hash
      let probes = 0
      while (probes < tableSize) {
        if (buckets[idx].length > 0 && buckets[idx][0].key === key) {
          setHighlightEntry(key)
          setHighlightBucket(idx)
          break
        }
        if (buckets[idx].length === 0) break
        idx = (idx + 1) % tableSize
        probes++
      }
    }
    setTimeout(() => { setHighlightBucket(-1); setHighlightEntry(null) }, 2000)
  }, [inputKey, tableSize, strategy, buckets])

  const doDelete = useCallback(() => {
    const key = inputKey.trim()
    if (!key) return
    const hash = hashFn(key, tableSize)
    setLastHash(hash)
    setHighlightBucket(hash)

    setBuckets(prev => {
      const newBuckets = prev.map(b => [...b])
      if (strategy === 'chaining') {
        const idx = newBuckets[hash].findIndex(e => e.key === key)
        if (idx >= 0) { newBuckets[hash].splice(idx, 1); setTotalEntries(t => t - 1) }
      } else {
        let idx = hash
        let probes = 0
        while (probes < tableSize) {
          if (newBuckets[idx].length > 0 && newBuckets[idx][0].key === key) {
            newBuckets[idx] = []
            setTotalEntries(t => t - 1)
            break
          }
          idx = (idx + 1) % tableSize
          probes++
        }
      }
      return newBuckets
    })
    setTimeout(() => setHighlightBucket(-1), 1000)
  }, [inputKey, tableSize, strategy])

  const demoSteps: DemoStep[] = [
    { title: 'What is a Hash Map?', description: 'A hash map stores key-value pairs. A hash function converts keys into array indices for O(1) average access time.', setup: resetAll },
    { title: 'Hash Function', description: 'The hash function takes a key (like "apple") and computes an index (like 3). A good hash function distributes keys uniformly.', setup: () => { setInputKey('apple'); setInputValue(42) } },
    { title: 'Insertion', description: 'To insert: hash the key to get an index, then store the key-value pair at that index. Watch the hash arrow!', setup: () => { setInputKey('banana'); setInputValue(17) } },
    { title: 'Collisions', description: 'When two different keys hash to the same index, we have a collision. This is inevitable when entries > table size (pigeonhole principle).', setup: () => { setInputKey('cherry'); setInputValue(99) } },
    { title: 'Chaining', description: 'Separate chaining: each bucket holds a linked list. Colliding entries are appended to the list. Simple but uses extra memory.', setup: () => { setStrategy('chaining') } },
    { title: 'Open Addressing', description: 'Linear probing: if bucket is full, check the next one. Keeps everything in-place but can cause clustering.', setup: () => { setStrategy('openAddressing') } },
    { title: 'Load Factor', description: 'Load factor = entries / table size. When it gets too high (>0.75), performance degrades. Time to resize and rehash!', setup: () => setStrategy('chaining') },
    { title: 'Lookup', description: 'To find a value: hash the key, go to that index, then check for the key. O(1) average, O(n) worst case with many collisions.', setup: () => { setInputKey('apple') } },
  ]

  const demo = useDemoMode(demoSteps)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0a1518'
      ctx.fillRect(0, 0, w, h)

      const bucketW = 120
      const bucketH = 36
      const gap = 6
      const startX = w / 2 - bucketW / 2 - 60
      const startY = 50

      // Table label
      ctx.fillStyle = 'rgba(80,200,220,0.6)'
      ctx.font = 'bold 13px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('HASH TABLE', startX + bucketW / 2, startY - 15)

      // Hash function display
      if (lastHash >= 0) {
        const arrowStartX = startX - 100
        const arrowY = startY + lastHash * (bucketH + gap) + bucketH / 2
        ctx.fillStyle = 'rgba(255,200,80,0.8)'
        ctx.font = '11px monospace'
        ctx.textAlign = 'right'
        ctx.fillText(`h("${inputKey}")`, arrowStartX, arrowY - 10)
        ctx.fillText(`= ${lastHash}`, arrowStartX, arrowY + 5)

        ctx.strokeStyle = 'rgba(255,200,80,0.5)'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(arrowStartX + 10, arrowY)
        ctx.lineTo(startX - 5, arrowY)
        ctx.stroke()
        ctx.setLineDash([])
        // Arrowhead
        ctx.fillStyle = 'rgba(255,200,80,0.5)'
        ctx.beginPath()
        ctx.moveTo(startX - 5, arrowY)
        ctx.lineTo(startX - 12, arrowY - 4)
        ctx.lineTo(startX - 12, arrowY + 4)
        ctx.closePath()
        ctx.fill()
      }

      // Draw buckets
      for (let i = 0; i < tableSize; i++) {
        const y = startY + i * (bucketH + gap)
        const isHL = i === highlightBucket
        const bucket = buckets[i]

        // Index label
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.font = '10px monospace'
        ctx.textAlign = 'right'
        ctx.fillText(`[${i}]`, startX - 8, y + bucketH / 2 + 3)

        // Bucket box
        ctx.fillStyle = isHL ? 'rgba(80,200,220,0.15)' : 'rgba(255,255,255,0.03)'
        ctx.strokeStyle = isHL ? CS_COLOR : 'rgba(255,255,255,0.1)'
        ctx.lineWidth = isHL ? 2 : 1
        ctx.beginPath()
        ctx.roundRect(startX, y, bucketW, bucketH, 4)
        ctx.fill()
        ctx.stroke()

        // Bucket contents
        if (bucket.length === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)'
          ctx.font = '10px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('empty', startX + bucketW / 2, y + bucketH / 2 + 3)
        } else if (strategy === 'chaining') {
          // First entry in the bucket box
          const first = bucket[0]
          const isEntryHL = highlightEntry === first.key
          ctx.fillStyle = isEntryHL ? 'white' : first.color
          ctx.font = '11px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(`${first.key}:${first.value}`, startX + bucketW / 2, y + bucketH / 2 + 4)

          // Chain entries to the right
          for (let j = 1; j < bucket.length; j++) {
            const cx = startX + bucketW + j * (bucketW + 15)
            const entry = bucket[j]
            const eHL = highlightEntry === entry.key

            // Arrow
            ctx.strokeStyle = 'rgba(80,200,220,0.3)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(cx - 15, y + bucketH / 2)
            ctx.lineTo(cx, y + bucketH / 2)
            ctx.stroke()
            ctx.fillStyle = 'rgba(80,200,220,0.3)'
            ctx.beginPath()
            ctx.moveTo(cx, y + bucketH / 2)
            ctx.lineTo(cx - 5, y + bucketH / 2 - 3)
            ctx.lineTo(cx - 5, y + bucketH / 2 + 3)
            ctx.closePath()
            ctx.fill()

            // Chained node
            ctx.fillStyle = eHL ? 'rgba(80,200,220,0.2)' : 'rgba(255,255,255,0.04)'
            ctx.strokeStyle = eHL ? CS_COLOR : 'rgba(255,255,255,0.1)'
            ctx.lineWidth = eHL ? 2 : 1
            ctx.beginPath()
            ctx.roundRect(cx, y, bucketW, bucketH, 4)
            ctx.fill()
            ctx.stroke()

            ctx.fillStyle = eHL ? 'white' : entry.color
            ctx.font = '11px monospace'
            ctx.textAlign = 'center'
            ctx.fillText(`${entry.key}:${entry.value}`, cx + bucketW / 2, y + bucketH / 2 + 4)
          }
        } else {
          // Open addressing: single entry
          const entry = bucket[0]
          const eHL = highlightEntry === entry.key
          ctx.fillStyle = eHL ? 'white' : entry.color
          ctx.font = '11px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(`${entry.key}:${entry.value}`, startX + bucketW / 2, y + bucketH / 2 + 4)
        }
      }

      // Load factor bar
      const barX = 40
      const barY = h - 60
      const barW = w - 80
      const barH = 12
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      ctx.fillRect(barX, barY, barW, barH)
      const lfWidth = Math.min(1, loadFactor) * barW
      const lfColor = loadFactor > 0.75 ? 'rgba(255,100,100,0.6)' : loadFactor > 0.5 ? 'rgba(255,200,80,0.6)' : 'rgba(80,200,220,0.4)'
      ctx.fillStyle = lfColor
      ctx.fillRect(barX, barY, lfWidth, barH)
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '10px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(`Load Factor: ${loadFactor.toFixed(2)}`, barX, barY - 6)

      // 0.75 threshold line
      ctx.strokeStyle = 'rgba(255,100,100,0.4)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(barX + 0.75 * barW, barY - 3)
      ctx.lineTo(barX + 0.75 * barW, barY + barH + 3)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(255,100,100,0.5)'
      ctx.font = '8px monospace'
      ctx.fillText('0.75', barX + 0.75 * barW - 8, barY + barH + 14)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [buckets, tableSize, highlightBucket, highlightEntry, lastHash, inputKey, loadFactor, strategy])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1518]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 space-y-3 w-64">
          <APTag course="CS A" unit="Data Structures" color={CS_COLOR} />
          <InfoPanel
            title="Hash Map"
            departmentColor={CS_COLOR}
            items={[
              { label: 'Load Factor', value: loadFactor.toFixed(2) },
              { label: 'Collisions', value: collisions },
              { label: 'Table Size', value: tableSize },
              { label: 'Entries', value: totalEntries },
            ]}
          />
          <EquationDisplay
            departmentColor={CS_COLOR}
            title="Complexity"
            equations={[
              { label: 'Avg', expression: 'O(1) insert/lookup/delete' },
              { label: 'Worst', expression: 'O(n) with many collisions' },
              { label: 'Hash', expression: 'h(key) = key mod tableSize' },
              { label: 'Load', expression: 'alpha = n / m' },
            ]}
          />
        </div>

        <div className="absolute top-4 right-4 w-56">
          <ControlPanel>
            <ControlGroup label="Key">
              <input
                type="text"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                className="w-full bg-[#0d1a1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/30"
                placeholder="key"
              />
            </ControlGroup>
            <ControlGroup label="Value">
              <NumberInput value={inputValue} onChange={setInputValue} min={0} max={999} />
            </ControlGroup>
            <ControlGroup label="Collision Strategy">
              <ButtonGroup
                value={strategy}
                onChange={v => { setStrategy(v as CollisionStrategy); resetAll() }}
                options={[
                  { value: 'chaining', label: 'Chaining' },
                  { value: 'openAddressing', label: 'Probing' },
                ]}
                color={CS_COLOR}
              />
            </ControlGroup>
            <ControlGroup label="Table Size">
              <Slider value={tableSize} onChange={v => { setTableSize(v); resetAll() }} min={4} max={12} label={`m = ${tableSize}`} />
            </ControlGroup>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={doInsert}>Insert</Button>
              <Button onClick={doLookup} variant="secondary">Lookup</Button>
              <Button onClick={doDelete} variant="secondary">Delete</Button>
            </div>
            <Button onClick={resetAll} variant="secondary">Reset</Button>
            <Button onClick={demo.open} variant="secondary">AP Tutorial</Button>
          </ControlPanel>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <DemoMode
            steps={demoSteps}
            currentStep={demo.currentStep}
            isOpen={demo.isOpen}
            onClose={demo.close}
            onNext={demo.next}
            onPrev={demo.prev}
            onGoToStep={demo.goToStep}
            departmentColor={CS_COLOR}
          />
        </div>
      </div>
    </div>
  )
}
