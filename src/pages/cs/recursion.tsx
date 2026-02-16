import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, Select, Toggle } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type Algorithm = 'fibonacci' | 'factorial' | 'mergesort'

interface TreeNode {
  id: number
  label: string
  depth: number
  x: number
  y: number
  parentId: number | null
  returnValue: number | null
  active: boolean
  completed: boolean
  order: number
}

function buildFibTree(n: number): TreeNode[] {
  const nodes: TreeNode[] = []
  let idCounter = 0
  let orderCounter = 0
  const build = (val: number, depth: number, parentId: number | null): number => {
    const id = idCounter++
    const order = orderCounter++
    nodes.push({ id, label: `fib(${val})`, depth, x: 0, y: 0, parentId, returnValue: null, active: false, completed: false, order })
    if (val <= 1) { nodes[id].returnValue = val; return id }
    build(val - 1, depth + 1, id)
    build(val - 2, depth + 1, id)
    return id
  }
  build(n, 0, null)
  return nodes
}

function buildFactTree(n: number): TreeNode[] {
  const nodes: TreeNode[] = []
  for (let i = 0; i <= n; i++) {
    nodes.push({ id: i, label: `${n - i}!`, depth: i, x: 0, y: 0, parentId: i > 0 ? i - 1 : null, returnValue: null, active: false, completed: false, order: i })
  }
  return nodes
}

function buildMergeSortTree(n: number): TreeNode[] {
  const nodes: TreeNode[] = []
  let idCounter = 0
  let orderCounter = 0
  const build = (arr: number[], depth: number, parentId: number | null): number => {
    const id = idCounter++
    const order = orderCounter++
    const label = `[${arr.join(',')}]`
    nodes.push({ id, label, depth, x: 0, y: 0, parentId, returnValue: null, active: false, completed: false, order })
    if (arr.length <= 1) return id
    const mid = Math.floor(arr.length / 2)
    build(arr.slice(0, mid), depth + 1, id)
    build(arr.slice(mid), depth + 1, id)
    return id
  }
  const arr = Array.from({ length: Math.min(n, 8) }, (_, i) => Math.floor(Math.random() * 20) + 1)
  build(arr, 0, null)
  return nodes
}

function layoutTree(nodes: TreeNode[], width: number, height: number, padding: number): void {
  if (nodes.length === 0) return
  const maxDepth = Math.max(...nodes.map(n => n.depth))
  const levelHeight = Math.min(60, (height - padding * 2) / (maxDepth + 1))
  const levels: Map<number, TreeNode[]> = new Map()
  for (const node of nodes) {
    if (!levels.has(node.depth)) levels.set(node.depth, [])
    levels.get(node.depth)!.push(node)
  }
  for (const [depth, lvlNodes] of levels) {
    const count = lvlNodes.length
    const spacing = (width - padding * 2) / (count + 1)
    lvlNodes.forEach((node, i) => {
      node.x = padding + spacing * (i + 1)
      node.y = padding + 30 + depth * levelHeight
    })
  }
}

const CS_COLOR = 'rgb(80, 200, 220)'

export default function Recursion() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [algorithm, setAlgorithm] = useState<Algorithm>('fibonacci')
  const [inputN, setInputN] = useState(5)
  const [stepping, setStepping] = useState(false)
  const [speed, setSpeed] = useState(50)
  const [nodes, setNodes] = useState<TreeNode[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [completedCount, setCompletedCount] = useState(0)
  const frameRef = useRef(0)

  const maxDepth = nodes.length > 0 ? Math.max(...nodes.map(n => n.depth)) : 0
  const callStackSize = nodes.filter(n => n.active && !n.completed).length

  const resetVisualization = useCallback(() => {
    let tree: TreeNode[]
    if (algorithm === 'fibonacci') tree = buildFibTree(Math.min(inputN, 7))
    else if (algorithm === 'factorial') tree = buildFactTree(Math.min(inputN, 10))
    else tree = buildMergeSortTree(inputN)
    setNodes(tree)
    setActiveIdx(-1)
    setCompletedCount(0)
    frameRef.current = 0
  }, [algorithm, inputN])

  useEffect(() => { resetVisualization() }, [resetVisualization])

  const demoSteps: DemoStep[] = [
    { title: 'What is Recursion?', description: 'A function that calls itself to solve smaller subproblems. Every recursive function needs a base case to stop.', setup: () => { setAlgorithm('fibonacci'); setInputN(4) } },
    { title: 'The Call Tree', description: 'Each node represents a function call. Children are the recursive calls made by the parent. Watch how the tree expands downward.', setup: () => { setAlgorithm('fibonacci'); setInputN(5) } },
    { title: 'Base Cases', description: 'The leaves of the tree are base cases -- calls that return immediately without further recursion. For fib, fib(0)=0 and fib(1)=1.', setup: () => { setAlgorithm('fibonacci'); setInputN(4) } },
    { title: 'Call Stack', description: 'The call stack tracks which functions are waiting for results. Deep recursion means a tall stack, risking overflow.', setup: () => { setAlgorithm('fibonacci'); setInputN(5) } },
    { title: 'Return Values', description: 'Once base cases return, values flow back UP the tree. Parents combine child results to compute their own return value.', setup: () => { setStepping(true) } },
    { title: 'Factorial: Linear Recursion', description: 'Factorial produces a single chain: n! = n * (n-1)!. This is linear recursion with O(n) calls.', setup: () => { setAlgorithm('factorial'); setInputN(5) } },
    { title: 'Merge Sort: Divide & Conquer', description: 'Merge sort splits arrays in half recursively, then merges. This is O(n log n) -- much better than O(n^2) sorts.', setup: () => { setAlgorithm('mergesort'); setInputN(6) } },
    { title: 'Exponential Blowup', description: 'Fibonacci without memoization has O(2^n) calls. Increase n and watch the tree explode! Dynamic programming fixes this.', setup: () => { setAlgorithm('fibonacci'); setInputN(6) } },
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

    let localFrame = frameRef.current

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0a1518'
      ctx.fillRect(0, 0, w, h)

      if (nodes.length === 0) { animRef.current = requestAnimationFrame(draw); return }

      layoutTree(nodes, w - 200, h, 30)

      const tickInterval = Math.max(2, 100 - speed)
      if (!stepping) {
        localFrame++
        const stepIdx = Math.floor(localFrame / tickInterval)
        if (stepIdx !== activeIdx && stepIdx < nodes.length) {
          setActiveIdx(stepIdx)
          setCompletedCount(stepIdx + 1)
        }
      }

      // Draw edges
      for (const node of nodes) {
        if (node.parentId === null) continue
        const parent = nodes[node.parentId]
        ctx.strokeStyle = node.order <= activeIdx ? 'rgba(80,200,220,0.6)' : 'rgba(255,255,255,0.1)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(parent.x, parent.y)
        ctx.lineTo(node.x, node.y)
        ctx.stroke()
      }

      // Draw nodes
      for (const node of nodes) {
        const isActive = node.order === activeIdx
        const isDone = node.order < activeIdx
        const radius = 18
        const fontSize = Math.min(11, 200 / (node.label.length + 1))

        if (isActive) {
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 30)
          glow.addColorStop(0, 'rgba(80,200,220,0.4)')
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(node.x, node.y, 30, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = isActive ? 'rgba(80,200,220,0.3)' : isDone ? 'rgba(80,200,220,0.12)' : 'rgba(255,255,255,0.05)'
        ctx.strokeStyle = isActive ? CS_COLOR : isDone ? 'rgba(80,200,220,0.5)' : 'rgba(255,255,255,0.15)'
        ctx.lineWidth = isActive ? 2.5 : 1.5
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = isActive ? 'white' : isDone ? 'rgba(80,200,220,0.9)' : 'rgba(255,255,255,0.5)'
        ctx.font = `${fontSize}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(node.label, node.x, node.y)

        if (isDone && node.returnValue !== null) {
          ctx.fillStyle = 'rgba(100,255,180,0.8)'
          ctx.font = '9px monospace'
          ctx.fillText(`=${node.returnValue}`, node.x, node.y + radius + 10)
        }
      }

      // Call stack sidebar
      const stackX = w - 170
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fillRect(stackX, 20, 150, h - 40)
      ctx.fillStyle = 'rgba(80,200,220,0.8)'
      ctx.font = 'bold 11px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('CALL STACK', stackX + 75, 38)

      const stackNodes = nodes.filter(n => n.order <= activeIdx && n.order >= Math.max(0, activeIdx - 8))
      stackNodes.reverse().forEach((node, i) => {
        const sy = 55 + i * 24
        const isTop = i === 0
        ctx.fillStyle = isTop ? 'rgba(80,200,220,0.2)' : 'rgba(255,255,255,0.04)'
        ctx.fillRect(stackX + 8, sy, 134, 20)
        ctx.fillStyle = isTop ? CS_COLOR : 'rgba(255,255,255,0.5)'
        ctx.font = '10px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(node.label, stackX + 14, sy + 14)
      })

      frameRef.current = localFrame
      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [nodes, activeIdx, stepping, speed])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1518]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 space-y-3 w-64">
          <APTag course="CS A" unit="Recursion" color={CS_COLOR} />
          <InfoPanel
            title="Recursion State"
            departmentColor={CS_COLOR}
            items={[
              { label: 'Current Depth', value: activeIdx >= 0 && nodes[activeIdx] ? nodes[activeIdx].depth : 0 },
              { label: 'Total Calls', value: nodes.length },
              { label: 'Call Stack Size', value: callStackSize },
              { label: 'Max Depth', value: maxDepth },
            ]}
          />
          <EquationDisplay
            departmentColor={CS_COLOR}
            title="Recurrences"
            equations={
              algorithm === 'fibonacci'
                ? [
                    { label: 'Base', expression: 'fib(0) = 0, fib(1) = 1' },
                    { label: 'Recurse', expression: 'fib(n) = fib(n-1) + fib(n-2)' },
                    { label: 'Time', expression: 'O(2^n) without memo' },
                  ]
                : algorithm === 'factorial'
                ? [
                    { label: 'Base', expression: '0! = 1' },
                    { label: 'Recurse', expression: 'n! = n * (n-1)!' },
                    { label: 'Time', expression: 'O(n)' },
                  ]
                : [
                    { label: 'Split', expression: 'T(n) = 2T(n/2) + O(n)' },
                    { label: 'Merge', expression: 'Combine sorted halves' },
                    { label: 'Time', expression: 'O(n log n)' },
                  ]
            }
          />
        </div>

        <div className="absolute top-4 right-4 w-56">
          <ControlPanel>
            <ControlGroup label="Algorithm">
              <Select
                value={algorithm}
                onChange={v => setAlgorithm(v as Algorithm)}
                options={[
                  { value: 'fibonacci', label: 'Fibonacci' },
                  { value: 'factorial', label: 'Factorial' },
                  { value: 'mergesort', label: 'Merge Sort' },
                ]}
              />
            </ControlGroup>
            <ControlGroup label="Input (n)">
              <Slider value={inputN} onChange={setInputN} min={1} max={algorithm === 'fibonacci' ? 7 : 10} label={`n = ${inputN}`} />
            </ControlGroup>
            <Toggle value={stepping} onChange={setStepping} label="Step Through" />
            {stepping && (
              <div className="flex gap-2">
                <Button onClick={() => { setActiveIdx(Math.max(0, activeIdx - 1)); setCompletedCount(Math.max(0, completedCount - 1)) }} variant="secondary">Prev</Button>
                <Button onClick={() => { if (activeIdx < nodes.length - 1) { setActiveIdx(activeIdx + 1); setCompletedCount(completedCount + 1) } }}>Next</Button>
              </div>
            )}
            <ControlGroup label="Speed">
              <Slider value={speed} onChange={setSpeed} min={10} max={100} />
            </ControlGroup>
            <Button onClick={resetVisualization} variant="secondary">Reset</Button>
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
