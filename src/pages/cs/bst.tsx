import { useState, useEffect, useRef, useCallback } from 'react'
import { ControlPanel, ControlGroup, Button, Select, Toggle, NumberInput } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

type BSTOp = 'insert' | 'delete' | 'search'
type Traversal = 'inorder' | 'preorder' | 'postorder'

interface BSTNode {
  value: number
  left: BSTNode | null
  right: BSTNode | null
}

function insertBST(root: BSTNode | null, val: number): BSTNode {
  if (!root) return { value: val, left: null, right: null }
  if (val < root.value) return { ...root, left: insertBST(root.left, val) }
  if (val > root.value) return { ...root, right: insertBST(root.right, val) }
  return root
}

function deleteBST(root: BSTNode | null, val: number): BSTNode | null {
  if (!root) return null
  if (val < root.value) return { ...root, left: deleteBST(root.left, val) }
  if (val > root.value) return { ...root, right: deleteBST(root.right, val) }
  if (!root.left) return root.right
  if (!root.right) return root.left
  let minNode = root.right
  while (minNode.left) minNode = minNode.left
  return { ...root, value: minNode.value, right: deleteBST(root.right, minNode.value) }
}

function searchPath(root: BSTNode | null, val: number): number[] {
  const path: number[] = []
  let cur = root
  while (cur) {
    path.push(cur.value)
    if (val === cur.value) break
    cur = val < cur.value ? cur.left : cur.right
  }
  return path
}

function getHeight(root: BSTNode | null): number {
  if (!root) return 0
  return 1 + Math.max(getHeight(root.left), getHeight(root.right))
}

function countNodes(root: BSTNode | null): number {
  if (!root) return 0
  return 1 + countNodes(root.left) + countNodes(root.right)
}

function isBalanced(root: BSTNode | null): boolean {
  if (!root) return true
  const diff = Math.abs(getHeight(root.left) - getHeight(root.right))
  return diff <= 1 && isBalanced(root.left) && isBalanced(root.right)
}

function traverse(root: BSTNode | null, type: Traversal): number[] {
  if (!root) return []
  if (type === 'inorder') return [...traverse(root.left, type), root.value, ...traverse(root.right, type)]
  if (type === 'preorder') return [root.value, ...traverse(root.left, type), ...traverse(root.right, type)]
  return [...traverse(root.left, type), ...traverse(root.right, type), root.value]
}

interface LayoutNode {
  value: number
  x: number
  y: number
  parentX: number | null
  parentY: number | null
}

function layoutBST(root: BSTNode | null, cx: number, cy: number, spread: number, depth: number, parent: { x: number; y: number } | null, result: LayoutNode[]): void {
  if (!root) return
  result.push({ value: root.value, x: cx, y: cy, parentX: parent?.x ?? null, parentY: parent?.y ?? null })
  const nextSpread = spread * 0.55
  const nextY = cy + 55
  layoutBST(root.left, cx - spread, nextY, nextSpread, depth + 1, { x: cx, y: cy }, result)
  layoutBST(root.right, cx + spread, nextY, nextSpread, depth + 1, { x: cx, y: cy }, result)
}

const CS_COLOR = 'rgb(80, 200, 220)'

export default function BST() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [root, setRoot] = useState<BSTNode | null>(null)
  const [operation, setOperation] = useState<BSTOp>('insert')
  const [inputVal, setInputVal] = useState(50)
  const [traversalType, setTraversalType] = useState<Traversal>('inorder')
  const [showTraversal, setShowTraversal] = useState(false)
  const [highlightPath, setHighlightPath] = useState<number[]>([])
  const [traversalOrder, setTraversalOrder] = useState<number[]>([])
  const [foundNode, setFoundNode] = useState<number | null>(null)

  const height = getHeight(root)
  const nodeCount = countNodes(root)
  const balanced = isBalanced(root)

  const initTree = useCallback(() => {
    let tree: BSTNode | null = null
    const vals = [50, 30, 70, 20, 40, 60, 80]
    for (const v of vals) tree = insertBST(tree, v)
    setRoot(tree)
    setHighlightPath([])
    setTraversalOrder([])
    setFoundNode(null)
  }, [])

  useEffect(() => { initTree() }, [initTree])

  const executeOp = useCallback(() => {
    if (operation === 'insert') {
      setRoot(prev => insertBST(prev, inputVal))
      setHighlightPath(searchPath(root, inputVal).concat(inputVal))
      setFoundNode(null)
      setTimeout(() => setHighlightPath([]), 1500)
    } else if (operation === 'delete') {
      setHighlightPath(searchPath(root, inputVal))
      setTimeout(() => { setRoot(prev => deleteBST(prev, inputVal)); setHighlightPath([]) }, 800)
    } else {
      const path = searchPath(root, inputVal)
      setHighlightPath(path)
      setFoundNode(path[path.length - 1] === inputVal ? inputVal : null)
      setTimeout(() => setHighlightPath([]), 2000)
    }
  }, [operation, inputVal, root])

  const runTraversal = useCallback(() => {
    if (!root) return
    const order = traverse(root, traversalType)
    setTraversalOrder(order)
    setShowTraversal(true)
    let idx = 0
    const interval = setInterval(() => {
      if (idx < order.length) {
        setHighlightPath(order.slice(0, idx + 1))
        idx++
      } else {
        clearInterval(interval)
        setTimeout(() => { setHighlightPath([]); setShowTraversal(false) }, 1000)
      }
    }, 500)
  }, [root, traversalType])

  const demoSteps: DemoStep[] = [
    { title: 'Binary Search Tree', description: 'A BST is a binary tree where left child < parent < right child. This ordering enables efficient search, insert, and delete.', setup: initTree },
    { title: 'Insert Operation', description: 'To insert: compare with root. Go left if smaller, right if larger. Repeat until you find an empty spot. O(log n) average.', setup: () => { setOperation('insert'); setInputVal(35) } },
    { title: 'Search Operation', description: 'To search: compare with root and follow left/right pointers. Each comparison eliminates half the tree. O(log n) average.', setup: () => { setOperation('search'); setInputVal(40) } },
    { title: 'Delete Operation', description: 'Delete has 3 cases: leaf (easy), one child (replace), two children (find inorder successor). O(log n) average.', setup: () => { setOperation('delete'); setInputVal(30) } },
    { title: 'Inorder Traversal', description: 'Left, Root, Right. Produces values in SORTED order! This is the key property that makes BSTs useful for ordered data.', setup: () => { setTraversalType('inorder') } },
    { title: 'Preorder Traversal', description: 'Root, Left, Right. Used to create a copy of the tree or serialize it. Processes root before children.', setup: () => { setTraversalType('preorder') } },
    { title: 'Postorder Traversal', description: 'Left, Right, Root. Used when you need to process children before parent (e.g., deleting a tree, calculating sizes).', setup: () => { setTraversalType('postorder') } },
    { title: 'Balance Matters', description: 'Unbalanced BSTs degrade to O(n). Balanced BSTs (AVL, Red-Black) guarantee O(log n). Height should be ~log(n).', setup: initTree },
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

      if (!root) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.font = '16px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Empty tree. Insert a value to begin.', w / 2, h / 2)
        animRef.current = requestAnimationFrame(draw)
        return
      }

      const nodes: LayoutNode[] = []
      layoutBST(root, w / 2 - 100, 60, Math.min(w / 4, 180), 0, null, nodes)

      // Draw edges
      for (const node of nodes) {
        if (node.parentX !== null && node.parentY !== null) {
          const onPath = highlightPath.includes(node.value)
          ctx.strokeStyle = onPath ? 'rgba(80,200,220,0.7)' : 'rgba(255,255,255,0.1)'
          ctx.lineWidth = onPath ? 2.5 : 1.5
          ctx.beginPath()
          ctx.moveTo(node.parentX, node.parentY)
          ctx.lineTo(node.x, node.y)
          ctx.stroke()
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const onPath = highlightPath.includes(node.value)
        const isFound = foundNode === node.value
        const radius = 20

        if (onPath) {
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 35)
          glow.addColorStop(0, isFound ? 'rgba(100,255,180,0.3)' : 'rgba(80,200,220,0.3)')
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(node.x, node.y, 35, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = onPath
          ? isFound ? 'rgba(100,255,180,0.2)' : 'rgba(80,200,220,0.2)'
          : 'rgba(255,255,255,0.06)'
        ctx.strokeStyle = onPath
          ? isFound ? 'rgba(100,255,180,0.8)' : CS_COLOR
          : 'rgba(255,255,255,0.15)'
        ctx.lineWidth = onPath ? 2.5 : 1.5
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = onPath ? 'white' : 'rgba(255,255,255,0.8)'
        ctx.font = 'bold 14px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(node.value), node.x, node.y)

        // Traversal order number
        if (showTraversal) {
          const orderIdx = traversalOrder.indexOf(node.value)
          if (orderIdx >= 0 && highlightPath.includes(node.value)) {
            ctx.fillStyle = 'rgba(255,200,50,0.9)'
            ctx.font = 'bold 10px monospace'
            ctx.fillText(String(orderIdx + 1), node.x + radius + 8, node.y - radius + 4)
          }
        }
      }

      // Traversal order display
      if (showTraversal && traversalOrder.length > 0) {
        ctx.fillStyle = 'rgba(80,200,220,0.8)'
        ctx.font = '13px monospace'
        ctx.textAlign = 'left'
        const visibleOrder = traversalOrder.filter(v => highlightPath.includes(v))
        ctx.fillText(`${traversalType}: [${visibleOrder.join(', ')}]`, 30, h - 30)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [root, highlightPath, foundNode, showTraversal, traversalOrder, traversalType])

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1518]">
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        <div className="absolute top-4 left-4 space-y-3 w-64">
          <APTag course="CS A" unit="Data Structures" color={CS_COLOR} />
          <InfoPanel
            title="BST State"
            departmentColor={CS_COLOR}
            items={[
              { label: 'Height', value: height },
              { label: 'Nodes', value: nodeCount },
              { label: 'Balanced', value: balanced ? 'Yes' : 'No', color: balanced ? 'rgb(100,255,180)' : 'rgb(255,100,100)' },
              { label: 'Root', value: root ? root.value : 'null' },
            ]}
          />
          <EquationDisplay
            departmentColor={CS_COLOR}
            title="Complexity"
            equations={[
              { label: 'Average', expression: 'O(log n) search/insert/delete' },
              { label: 'Worst', expression: 'O(n) if unbalanced' },
              { label: 'Inorder', expression: 'Gives sorted output' },
              { label: 'Space', expression: 'O(n)' },
            ]}
          />
        </div>

        <div className="absolute top-4 right-4 w-56">
          <ControlPanel>
            <ControlGroup label="Operation">
              <Select
                value={operation}
                onChange={v => setOperation(v as BSTOp)}
                options={[
                  { value: 'insert', label: 'Insert' },
                  { value: 'delete', label: 'Delete' },
                  { value: 'search', label: 'Search' },
                ]}
              />
            </ControlGroup>
            <ControlGroup label="Value">
              <NumberInput value={inputVal} onChange={setInputVal} min={1} max={99} />
            </ControlGroup>
            <Button onClick={executeOp}>{operation.charAt(0).toUpperCase() + operation.slice(1)}</Button>
            <ControlGroup label="Traversal">
              <Select
                value={traversalType}
                onChange={v => setTraversalType(v as Traversal)}
                options={[
                  { value: 'inorder', label: 'Inorder (LNR)' },
                  { value: 'preorder', label: 'Preorder (NLR)' },
                  { value: 'postorder', label: 'Postorder (LRN)' },
                ]}
              />
            </ControlGroup>
            <Button onClick={runTraversal} variant="secondary">Run Traversal</Button>
            <Toggle value={showTraversal} onChange={setShowTraversal} label="Show Order" />
            <Button onClick={initTree} variant="secondary">Reset</Button>
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
