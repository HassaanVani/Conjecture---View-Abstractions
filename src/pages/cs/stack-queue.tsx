import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup, NumberInput } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type DSType = 'stack' | 'queue'

interface DSItem {
  value: number
  id: number
  enterTime: number
}

const CS_COLOR = 'rgb(80, 200, 220)'
const MAX_SIZE = 12

export default function StackQueue() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [dsType, setDsType] = useState<DSType>('stack')
  const [items, setItems] = useState<DSItem[]>([])
  const [inputValue, setInputValue] = useState(42)
  const [lastOp, setLastOp] = useState<string>('')
  const [lastRemoved, setLastRemoved] = useState<number | null>(null)
  const [animatingIdx, setAnimatingIdx] = useState(-1)
  const [animPhase, setAnimPhase] = useState<'none' | 'enter' | 'exit'>('none')
  const nextId = useRef(0)
  const timeRef = useRef(0)

  const topOrFront = items.length > 0
    ? dsType === 'stack' ? items[items.length - 1].value : items[0].value
    : null

  const push = useCallback(() => {
    if (items.length >= MAX_SIZE) return
    const newItem: DSItem = { value: inputValue, id: nextId.current++, enterTime: Date.now() }
    setItems(prev => [...prev, newItem])
    setAnimatingIdx(items.length)
    setAnimPhase('enter')
    setLastOp(dsType === 'stack' ? 'push' : 'enqueue')
    setLastRemoved(null)
    setTimeout(() => setAnimPhase('none'), 400)
  }, [inputValue, items.length, dsType])

  const pop = useCallback(() => {
    if (items.length === 0) return
    if (dsType === 'stack') {
      setAnimatingIdx(items.length - 1)
      setLastRemoved(items[items.length - 1].value)
      setLastOp('pop')
      setAnimPhase('exit')
      setTimeout(() => { setItems(prev => prev.slice(0, -1)); setAnimPhase('none') }, 300)
    } else {
      setAnimatingIdx(0)
      setLastRemoved(items[0].value)
      setLastOp('dequeue')
      setAnimPhase('exit')
      setTimeout(() => { setItems(prev => prev.slice(1)); setAnimPhase('none') }, 300)
    }
  }, [items, dsType])

  const resetAll = useCallback(() => {
    setItems([])
    setLastOp('')
    setLastRemoved(null)
    setAnimPhase('none')
  }, [])

  const demoSteps: DemoStep[] = [
    { title: 'Stack: LIFO', description: 'A Stack is Last-In, First-Out. Think of a stack of plates: you always take from the top. push() adds to top, pop() removes from top.', setup: () => { setDsType('stack'); resetAll() } },
    { title: 'Push Operation', description: 'push(x) places element x on top of the stack. O(1) time complexity. The stack grows upward.', setup: () => { setDsType('stack'); setInputValue(10) } },
    { title: 'Pop Operation', description: 'pop() removes and returns the top element. O(1) time. If stack is empty, it underflows (error).', setup: () => setDsType('stack') },
    { title: 'Peek / Top', description: 'peek() returns the top element WITHOUT removing it. Also O(1). Useful for checking before popping.', setup: () => setDsType('stack') },
    { title: 'Queue: FIFO', description: 'A Queue is First-In, First-Out. Think of a line at a store: first person in line is served first.', setup: () => { setDsType('queue'); resetAll() } },
    { title: 'Enqueue Operation', description: 'enqueue(x) adds element x to the BACK of the queue. O(1) with a tail pointer.', setup: () => { setDsType('queue'); setInputValue(20) } },
    { title: 'Dequeue Operation', description: 'dequeue() removes and returns the FRONT element. O(1). The key difference from a stack!', setup: () => setDsType('queue') },
    { title: 'Real-World Uses', description: 'Stacks: undo/redo, call stack, expression parsing. Queues: BFS, print queues, task scheduling, buffering.', setup: () => setDsType('stack') },
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

      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0a1518'
      ctx.fillRect(0, 0, w, h)

      if (dsType === 'stack') {
        drawStack(ctx, w, h)
      } else {
        drawQueue(ctx, w, h)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    const drawStack = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const boxW = 160
      const boxH = 36
      const baseX = w / 2 - boxW / 2 - 80
      const baseY = h - 100
      const gap = 6

      // Stack container
      ctx.strokeStyle = 'rgba(80,200,220,0.2)'
      ctx.lineWidth = 2
      const containerH = (MAX_SIZE + 1) * (boxH + gap) + 20
      ctx.strokeRect(baseX - 15, baseY - containerH, boxW + 30, containerH + 10)

      // Bottom label
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('BOTTOM', baseX + boxW / 2, baseY + 20)

      // TOP label
      if (items.length > 0) {
        const topY = baseY - items.length * (boxH + gap)
        ctx.fillStyle = CS_COLOR
        ctx.font = 'bold 11px monospace'
        ctx.fillText('TOP', baseX - 30, topY + boxH / 2 + 4)
        ctx.beginPath()
        ctx.moveTo(baseX - 18, topY + boxH / 2)
        ctx.lineTo(baseX - 4, topY + boxH / 2)
        ctx.strokeStyle = CS_COLOR
        ctx.lineWidth = 2
        ctx.stroke()
        // Arrow
        ctx.fillStyle = CS_COLOR
        ctx.beginPath()
        ctx.moveTo(baseX - 4, topY + boxH / 2)
        ctx.lineTo(baseX - 10, topY + boxH / 2 - 4)
        ctx.lineTo(baseX - 10, topY + boxH / 2 + 4)
        ctx.closePath()
        ctx.fill()
      }

      items.forEach((item, i) => {
        const y = baseY - (i + 1) * (boxH + gap)
        const isTop = i === items.length - 1
        const isAnimating = i === animatingIdx

        let alpha = 1
        let offsetY = 0
        if (isAnimating && animPhase === 'enter') { alpha = 0.3 + 0.7 * Math.min(1, timeRef.current * 3); offsetY = -20 * (1 - Math.min(1, timeRef.current * 3)) }
        if (isAnimating && animPhase === 'exit') { alpha = Math.max(0, 1 - timeRef.current * 3); offsetY = -30 * timeRef.current * 3 }

        ctx.globalAlpha = alpha
        ctx.fillStyle = isTop ? 'rgba(80,200,220,0.2)' : 'rgba(255,255,255,0.06)'
        ctx.strokeStyle = isTop ? CS_COLOR : 'rgba(255,255,255,0.15)'
        ctx.lineWidth = isTop ? 2 : 1
        ctx.beginPath()
        ctx.roundRect(baseX, y + offsetY, boxW, boxH, 4)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = isTop ? 'white' : 'rgba(255,255,255,0.7)'
        ctx.font = 'bold 16px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(item.value), baseX + boxW / 2, y + boxH / 2 + offsetY)

        // Index
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.font = '9px monospace'
        ctx.textAlign = 'right'
        ctx.fillText(`[${i}]`, baseX + boxW + 30, y + boxH / 2 + offsetY + 3)
        ctx.globalAlpha = 1
      })

      // LIFO arrow
      ctx.fillStyle = 'rgba(80,200,220,0.3)'
      ctx.font = '14px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('LIFO', baseX + boxW + 70, h / 2)
      ctx.strokeStyle = 'rgba(80,200,220,0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(baseX + boxW + 70, h / 2 + 15)
      ctx.lineTo(baseX + boxW + 70, h / 2 - 15)
      ctx.stroke()
    }

    const drawQueue = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const boxW = 60
      const boxH = 50
      const gap = 12
      const startX = 80
      const centerY = h / 2

      // Container
      ctx.strokeStyle = 'rgba(80,200,220,0.15)'
      ctx.lineWidth = 2
      const totalW = items.length * (boxW + gap) + 40
      ctx.strokeRect(startX - 15, centerY - boxH / 2 - 15, Math.max(totalW, 200), boxH + 30)

      // FRONT label
      if (items.length > 0) {
        ctx.fillStyle = 'rgba(255,150,100,0.8)'
        ctx.font = 'bold 11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('FRONT', startX + boxW / 2, centerY - boxH / 2 - 25)
        ctx.beginPath()
        ctx.moveTo(startX + boxW / 2, centerY - boxH / 2 - 18)
        ctx.lineTo(startX + boxW / 2, centerY - boxH / 2 - 6)
        ctx.strokeStyle = 'rgba(255,150,100,0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // BACK label
      if (items.length > 0) {
        const backX = startX + (items.length - 1) * (boxW + gap)
        ctx.fillStyle = 'rgba(100,200,255,0.8)'
        ctx.font = 'bold 11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('BACK', backX + boxW / 2, centerY - boxH / 2 - 25)
        ctx.beginPath()
        ctx.moveTo(backX + boxW / 2, centerY - boxH / 2 - 18)
        ctx.lineTo(backX + boxW / 2, centerY - boxH / 2 - 6)
        ctx.strokeStyle = 'rgba(100,200,255,0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      items.forEach((item, i) => {
        const x = startX + i * (boxW + gap)
        const isFront = i === 0
        const isBack = i === items.length - 1

        ctx.fillStyle = isFront ? 'rgba(255,150,100,0.15)' : isBack ? 'rgba(100,200,255,0.15)' : 'rgba(255,255,255,0.05)'
        ctx.strokeStyle = isFront ? 'rgba(255,150,100,0.6)' : isBack ? 'rgba(100,200,255,0.6)' : 'rgba(255,255,255,0.15)'
        ctx.lineWidth = (isFront || isBack) ? 2 : 1
        ctx.beginPath()
        ctx.roundRect(x, centerY - boxH / 2, boxW, boxH, 4)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = 'white'
        ctx.font = 'bold 16px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(item.value), x + boxW / 2, centerY)

        // Arrow
        if (i < items.length - 1) {
          const ax = x + boxW
          const bx = x + boxW + gap
          ctx.strokeStyle = 'rgba(80,200,220,0.3)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(ax + 2, centerY)
          ctx.lineTo(bx - 2, centerY)
          ctx.stroke()
          ctx.fillStyle = 'rgba(80,200,220,0.3)'
          ctx.beginPath()
          ctx.moveTo(bx - 2, centerY)
          ctx.lineTo(bx - 8, centerY - 3)
          ctx.lineTo(bx - 8, centerY + 3)
          ctx.closePath()
          ctx.fill()
        }
      })

      // FIFO direction arrow
      ctx.fillStyle = 'rgba(80,200,220,0.3)'
      ctx.font = '13px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('FIFO', startX + totalW / 2, centerY + boxH / 2 + 40)
      ctx.strokeStyle = 'rgba(80,200,220,0.15)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(startX + totalW / 2 - 30, centerY + boxH / 2 + 50)
      ctx.lineTo(startX + totalW / 2 + 30, centerY + boxH / 2 + 50)
      ctx.stroke()
      // Left arrow (dequeue)
      ctx.fillStyle = 'rgba(255,150,100,0.4)'
      ctx.font = '10px monospace'
      ctx.fillText('dequeue <--', startX, centerY + boxH / 2 + 52)
      // Right arrow (enqueue)
      ctx.fillStyle = 'rgba(100,200,255,0.4)'
      ctx.fillText('--> enqueue', startX + totalW - 20, centerY + boxH / 2 + 52)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [items, dsType, animatingIdx, animPhase])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1518]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 space-y-3 w-64">
          <APTag course="CS A" unit="Data Structures" color={CS_COLOR} />
          <InfoPanel
            title={dsType === 'stack' ? 'Stack' : 'Queue'}
            departmentColor={CS_COLOR}
            items={[
              { label: 'Size', value: items.length },
              { label: dsType === 'stack' ? 'Top' : 'Front', value: topOrFront !== null ? topOrFront : 'empty' },
              { label: 'Empty', value: items.length === 0 ? 'true' : 'false' },
              { label: 'Last Op', value: lastOp || 'none' },
              ...(lastRemoved !== null ? [{ label: 'Removed', value: lastRemoved }] : []),
            ]}
          />
          <EquationDisplay
            departmentColor={CS_COLOR}
            title="Complexity"
            equations={
              dsType === 'stack'
                ? [
                    { label: 'push()', expression: 'O(1)' },
                    { label: 'pop()', expression: 'O(1)' },
                    { label: 'peek()', expression: 'O(1)' },
                    { label: 'Principle', expression: 'LIFO' },
                  ]
                : [
                    { label: 'enqueue()', expression: 'O(1)' },
                    { label: 'dequeue()', expression: 'O(1)' },
                    { label: 'peek()', expression: 'O(1)' },
                    { label: 'Principle', expression: 'FIFO' },
                  ]
            }
          />
        </div>

        <div className="absolute top-4 right-4 w-56">
          <ControlPanel>
            <ControlGroup label="Data Structure">
              <ButtonGroup
                value={dsType}
                onChange={v => { setDsType(v as DSType); resetAll() }}
                options={[
                  { value: 'stack', label: 'Stack' },
                  { value: 'queue', label: 'Queue' },
                ]}
                color={CS_COLOR}
              />
            </ControlGroup>
            <ControlGroup label="Value">
              <NumberInput value={inputValue} onChange={setInputValue} min={0} max={99} />
            </ControlGroup>
            <div className="flex gap-2">
              <Button onClick={push} disabled={items.length >= MAX_SIZE}>
                {dsType === 'stack' ? 'Push' : 'Enqueue'}
              </Button>
              <Button onClick={pop} variant="secondary" disabled={items.length === 0}>
                {dsType === 'stack' ? 'Pop' : 'Dequeue'}
              </Button>
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
