import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Select, NumberInput } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

interface LLNode {
  value: number
  id: number
}

type Operation = 'insertFront' | 'insertBack' | 'insertAt' | 'delete' | 'reverse' | 'search'

const CS_COLOR = 'rgb(80, 200, 220)'

export default function LinkedList() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [list, setList] = useState<LLNode[]>([
    { value: 10, id: 0 }, { value: 20, id: 1 }, { value: 30, id: 2 }, { value: 40, id: 3 },
  ])
  const [operation, setOperation] = useState<Operation>('insertFront')
  const [inputValue, setInputValue] = useState(50)
  const [inputIndex, setInputIndex] = useState(0)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [animProgress, setAnimProgress] = useState(1)
  const [animType, setAnimType] = useState<'none' | 'insert' | 'delete' | 'search' | 'reverse'>('none')
  const [animTarget, setAnimTarget] = useState(-1)
  const [searchResult, setSearchResult] = useState<number | null>(null)
  const nextId = useRef(10)
  const timeRef = useRef(0)

  const doInsertFront = useCallback(() => {
    const newNode: LLNode = { value: inputValue, id: nextId.current++ }
    setAnimType('insert'); setAnimTarget(0); setAnimProgress(0)
    setList(prev => [newNode, ...prev])
    setHighlightIdx(0)
  }, [inputValue])

  const doInsertBack = useCallback(() => {
    const newNode: LLNode = { value: inputValue, id: nextId.current++ }
    setAnimType('insert'); setAnimTarget(list.length); setAnimProgress(0)
    setList(prev => [...prev, newNode])
    setHighlightIdx(list.length)
  }, [inputValue, list.length])

  const doInsertAt = useCallback(() => {
    const idx = Math.min(inputIndex, list.length)
    const newNode: LLNode = { value: inputValue, id: nextId.current++ }
    setAnimType('insert'); setAnimTarget(idx); setAnimProgress(0)
    setList(prev => [...prev.slice(0, idx), newNode, ...prev.slice(idx)])
    setHighlightIdx(idx)
  }, [inputValue, inputIndex, list.length])

  const doDelete = useCallback(() => {
    if (list.length === 0) return
    const idx = Math.min(inputIndex, list.length - 1)
    setAnimType('delete'); setAnimTarget(idx); setAnimProgress(0)
    setTimeout(() => setList(prev => prev.filter((_, i) => i !== idx)), 400)
    setHighlightIdx(idx)
  }, [inputIndex, list.length])

  const doReverse = useCallback(() => {
    setAnimType('reverse'); setAnimProgress(0)
    setTimeout(() => setList(prev => [...prev].reverse()), 600)
  }, [])

  const doSearch = useCallback(() => {
    setAnimType('search'); setAnimProgress(0); setSearchResult(null)
    const idx = list.findIndex(n => n.value === inputValue)
    let step = 0
    const interval = setInterval(() => {
      setHighlightIdx(step)
      if (step === idx || step >= list.length) {
        clearInterval(interval)
        setSearchResult(idx)
      }
      step++
    }, 300)
  }, [inputValue, list])

  const executeOp = useCallback(() => {
    if (operation === 'insertFront') doInsertFront()
    else if (operation === 'insertBack') doInsertBack()
    else if (operation === 'insertAt') doInsertAt()
    else if (operation === 'delete') doDelete()
    else if (operation === 'reverse') doReverse()
    else if (operation === 'search') doSearch()
  }, [operation, doInsertFront, doInsertBack, doInsertAt, doDelete, doReverse, doSearch])

  const resetAll = useCallback(() => {
    setList([{ value: 10, id: 0 }, { value: 20, id: 1 }, { value: 30, id: 2 }, { value: 40, id: 3 }])
    setHighlightIdx(-1); setAnimType('none'); setSearchResult(null)
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'Linked List Basics', description: 'A linked list is a linear data structure where each node points to the next. Unlike arrays, elements are not contiguous in memory.', setup: resetAll },
    { title: 'Node Structure', description: 'Each node contains data and a "next" pointer. The first node is called the head. The last node points to null.', setup: resetAll },
    { title: 'Insert at Front', description: 'O(1) operation: Create new node, point its next to current head, update head. No shifting needed!', setup: () => { setOperation('insertFront'); setInputValue(5) } },
    { title: 'Insert at Back', description: 'O(n) operation with single pointer: Must traverse entire list to find the tail. O(1) if we maintain a tail pointer.', setup: () => { setOperation('insertBack'); setInputValue(99) } },
    { title: 'Insert at Index', description: 'O(n) operation: Traverse to position, update pointers. Watch how the arrows reconnect.', setup: () => { setOperation('insertAt'); setInputIndex(2); setInputValue(25) } },
    { title: 'Delete a Node', description: 'O(n) to find, O(1) to remove: Traverse to the node before, skip over the target by updating the next pointer.', setup: () => { setOperation('delete'); setInputIndex(1) } },
    { title: 'Search', description: 'O(n) operation: Must traverse from head, checking each value. No random access like arrays.', setup: () => { setOperation('search'); setInputValue(30) } },
    { title: 'Reverse', description: 'O(n) operation: Flip all pointers. Use three pointers: prev, current, next. Classic interview question!', setup: () => { setOperation('reverse') } },
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
      timeRef.current += 0.016
      if (animProgress < 1) setAnimProgress(p => Math.min(1, p + 0.03))

      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0a1518'
      ctx.fillRect(0, 0, w, h)

      const nodeW = 80
      const nodeH = 40
      const gap = 50
      const startX = 60
      const centerY = h / 2

      // HEAD label
      if (list.length > 0) {
        ctx.fillStyle = 'rgba(80,200,220,0.7)'
        ctx.font = 'bold 12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('HEAD', startX + nodeW / 2, centerY - nodeH / 2 - 20)
        ctx.beginPath()
        ctx.moveTo(startX + nodeW / 2, centerY - nodeH / 2 - 14)
        ctx.lineTo(startX + nodeW / 2, centerY - nodeH / 2 - 4)
        ctx.strokeStyle = 'rgba(80,200,220,0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      list.forEach((node, i) => {
        const x = startX + i * (nodeW + gap)
        const y = centerY - nodeH / 2
        const isHL = i === highlightIdx
        const isInsert = animType === 'insert' && i === animTarget && animProgress < 1
        const isDel = animType === 'delete' && i === animTarget && animProgress < 1

        const alpha = isDel ? 1 - animProgress : isInsert ? animProgress : 1
        const scale = isInsert ? 0.5 + 0.5 * animProgress : isDel ? 1 - 0.5 * animProgress : 1

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(x + nodeW / 2, y + nodeH / 2)
        ctx.scale(scale, scale)
        ctx.translate(-(x + nodeW / 2), -(y + nodeH / 2))

        // Node box
        if (isHL) {
          const glow = ctx.createRadialGradient(x + nodeW / 2, y + nodeH / 2, 0, x + nodeW / 2, y + nodeH / 2, 50)
          glow.addColorStop(0, 'rgba(80,200,220,0.25)')
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.fillRect(x - 10, y - 10, nodeW + 20, nodeH + 20)
        }

        ctx.fillStyle = isHL ? 'rgba(80,200,220,0.2)' : 'rgba(255,255,255,0.05)'
        ctx.strokeStyle = isHL ? CS_COLOR : 'rgba(255,255,255,0.2)'
        ctx.lineWidth = isHL ? 2.5 : 1.5
        ctx.beginPath()
        ctx.roundRect(x, y, nodeW, nodeH, 6)
        ctx.fill()
        ctx.stroke()

        // Value
        ctx.fillStyle = isHL ? 'white' : 'rgba(255,255,255,0.8)'
        ctx.font = 'bold 16px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(node.value), x + nodeW * 0.4, y + nodeH / 2)

        // Pointer partition
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x + nodeW * 0.7, y)
        ctx.lineTo(x + nodeW * 0.7, y + nodeH)
        ctx.stroke()

        // Dot for pointer
        ctx.fillStyle = i < list.length - 1 ? 'rgba(80,200,220,0.8)' : 'rgba(255,100,100,0.6)'
        ctx.beginPath()
        ctx.arc(x + nodeW * 0.85, y + nodeH / 2, 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        // Arrow to next node
        if (i < list.length - 1) {
          const ax = x + nodeW
          const bx = x + nodeW + gap
          ctx.strokeStyle = isHL ? CS_COLOR : 'rgba(80,200,220,0.4)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(ax, centerY)
          ctx.lineTo(bx, centerY)
          ctx.stroke()
          // Arrowhead
          ctx.fillStyle = isHL ? CS_COLOR : 'rgba(80,200,220,0.4)'
          ctx.beginPath()
          ctx.moveTo(bx, centerY)
          ctx.lineTo(bx - 8, centerY - 5)
          ctx.lineTo(bx - 8, centerY + 5)
          ctx.closePath()
          ctx.fill()
        } else {
          // NULL
          ctx.fillStyle = 'rgba(255,100,100,0.5)'
          ctx.font = '10px monospace'
          ctx.textAlign = 'left'
          ctx.fillText('NULL', x + nodeW + 10, centerY + 4)
        }
      })

      // Search result label
      if (searchResult !== null) {
        ctx.fillStyle = searchResult >= 0 ? 'rgba(100,255,180,0.9)' : 'rgba(255,100,100,0.9)'
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(
          searchResult >= 0 ? `Found at index ${searchResult}` : 'Not found',
          w / 2, centerY + 60
        )
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [list, highlightIdx, animType, animTarget, animProgress, searchResult])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1518]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 space-y-3 w-64">
          <APTag course="CS A" unit="Data Structures" color={CS_COLOR} />
          <InfoPanel
            title="Linked List"
            departmentColor={CS_COLOR}
            items={[
              { label: 'Size', value: list.length },
              { label: 'Head', value: list.length > 0 ? list[0].value : 'null' },
              { label: 'Tail', value: list.length > 0 ? list[list.length - 1].value : 'null' },
            ]}
          />
          <EquationDisplay
            departmentColor={CS_COLOR}
            title="Time Complexity"
            equations={[
              { label: 'Insert Front', expression: 'O(1)' },
              { label: 'Insert Back', expression: 'O(n) or O(1) w/ tail' },
              { label: 'Delete', expression: 'O(n)' },
              { label: 'Search', expression: 'O(n)' },
            ]}
          />
        </div>

        <div className="absolute top-4 right-4 w-56">
          <ControlPanel>
            <ControlGroup label="Operation">
              <Select
                value={operation}
                onChange={v => setOperation(v as Operation)}
                options={[
                  { value: 'insertFront', label: 'Insert Front' },
                  { value: 'insertBack', label: 'Insert Back' },
                  { value: 'insertAt', label: 'Insert at Index' },
                  { value: 'delete', label: 'Delete at Index' },
                  { value: 'reverse', label: 'Reverse' },
                  { value: 'search', label: 'Search' },
                ]}
              />
            </ControlGroup>
            {(operation !== 'reverse') && (
              <ControlGroup label="Value">
                <NumberInput value={inputValue} onChange={setInputValue} min={0} max={99} />
              </ControlGroup>
            )}
            {(operation === 'insertAt' || operation === 'delete') && (
              <ControlGroup label="Index">
                <Slider value={inputIndex} onChange={setInputIndex} min={0} max={Math.max(0, list.length - (operation === 'delete' ? 1 : 0))} label={`i = ${inputIndex}`} />
              </ControlGroup>
            )}
            <Button onClick={executeOp}>Execute</Button>
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
