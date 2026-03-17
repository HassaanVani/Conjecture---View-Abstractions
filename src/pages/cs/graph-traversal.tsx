import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ControlPanel, ControlGroup, Slider, Button, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const CS_TEAL = 'rgb(80, 200, 220)'

type Algorithm = 'bfs' | 'dfs' | 'dijkstra' | 'astar'

interface Node {
    id: number
    x: number
    y: number
}

interface Edge {
    from: number
    to: number
    weight: number
}

interface VisitedNode {
    id: number
    parent: number | null
    distance: number
}

function generateGraph(): { nodes: Node[]; edges: Edge[] } {
    const n: Node[] = []
    const gridSize = 4
    const spacing = 100
    const offsetX = 200
    const offsetY = 100

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            n.push({
                id: row * gridSize + col,
                x: offsetX + col * spacing + (Math.random() - 0.5) * 20,
                y: offsetY + row * spacing + (Math.random() - 0.5) * 20,
            })
        }
    }

    const e: Edge[] = []
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const id = row * gridSize + col
            if (col < gridSize - 1) {
                e.push({ from: id, to: id + 1, weight: 1 + Math.floor(Math.random() * 5) })
            }
            if (row < gridSize - 1) {
                e.push({ from: id, to: id + gridSize, weight: 1 + Math.floor(Math.random() * 5) })
            }
            if (row < gridSize - 1 && col < gridSize - 1 && Math.random() > 0.5) {
                e.push({ from: id, to: id + gridSize + 1, weight: 2 + Math.floor(Math.random() * 5) })
            }
        }
    }
    return { nodes: n, edges: e }
}

export default function GraphTraversal() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [algorithm, setAlgorithm] = useState<Algorithm>('bfs')
    const [isRunning, setIsRunning] = useState(false)
    const [speed, setSpeed] = useState(200)
    const [startNode, setStartNode] = useState(0)
    const [endNode, setEndNode] = useState(15)

    const [graph, setGraph] = useState(() => generateGraph())
    const nodes = graph.nodes
    const edges = graph.edges

    const [visited, setVisited] = useState<VisitedNode[]>([])
    const [currentNode, setCurrentNode] = useState<number | null>(null)
    const [path, setPath] = useState<number[]>([])
    const [frontier, setFrontier] = useState<number[]>([])
    const [pathWeight, setPathWeight] = useState(0)
    const [edgesExplored, setEdgesExplored] = useState(0)
    const stopRef = useRef(false)

    const getNeighbors = useCallback((nodeId: number): { node: number; weight: number }[] => {
        const neighbors: { node: number; weight: number }[] = []
        edges.forEach(e => {
            if (e.from === nodeId) neighbors.push({ node: e.to, weight: e.weight })
            if (e.to === nodeId) neighbors.push({ node: e.from, weight: e.weight })
        })
        return neighbors
    }, [edges])

    const heuristic = useCallback((a: number, b: number): number => {
        const nodeA = nodes[a]
        const nodeB = nodes[b]
        return Math.sqrt((nodeA.x - nodeB.x) ** 2 + (nodeA.y - nodeB.y) ** 2) / 50
    }, [nodes])

    const reset = useCallback(() => {
        stopRef.current = true
        setIsRunning(false)
        setVisited([])
        setPath([])
        setFrontier([])
        setCurrentNode(null)
        setPathWeight(0)
        setEdgesExplored(0)
    }, [])

    const runAlgorithm = useCallback(async () => {
        stopRef.current = false
        setIsRunning(true)
        setVisited([])
        setPath([])
        setFrontier([])
        setCurrentNode(null)
        setPathWeight(0)
        setEdgesExplored(0)

        let exploredCount = 0
        const d = (ms: number) => new Promise(r => setTimeout(r, ms))
        const visitedSet = new Set<number>()
        const parentMap = new Map<number, number | null>()
        const distanceMap = new Map<number, number>()

        parentMap.set(startNode, null)
        distanceMap.set(startNode, 0)

        if (algorithm === 'bfs') {
            const queue: number[] = [startNode]
            setFrontier([...queue])
            while (queue.length > 0 && !stopRef.current) {
                const current = queue.shift()!
                if (visitedSet.has(current)) continue
                visitedSet.add(current)
                setCurrentNode(current)
                setVisited(prev => [...prev, { id: current, parent: parentMap.get(current) ?? null, distance: distanceMap.get(current) ?? 0 }])
                await d(speed)
                if (current === endNode) break
                for (const { node: neighbor } of getNeighbors(current)) {
                    exploredCount++
                    setEdgesExplored(exploredCount)
                    if (!visitedSet.has(neighbor) && !queue.includes(neighbor)) {
                        queue.push(neighbor)
                        parentMap.set(neighbor, current)
                        distanceMap.set(neighbor, (distanceMap.get(current) ?? 0) + 1)
                    }
                }
                setFrontier([...queue])
            }
        } else if (algorithm === 'dfs') {
            const stack: number[] = [startNode]
            setFrontier([...stack])
            while (stack.length > 0 && !stopRef.current) {
                const current = stack.pop()!
                if (visitedSet.has(current)) continue
                visitedSet.add(current)
                setCurrentNode(current)
                setVisited(prev => [...prev, { id: current, parent: parentMap.get(current) ?? null, distance: distanceMap.get(current) ?? 0 }])
                await d(speed)
                if (current === endNode) break
                for (const { node: neighbor } of getNeighbors(current)) {
                    exploredCount++
                    setEdgesExplored(exploredCount)
                    if (!visitedSet.has(neighbor)) {
                        stack.push(neighbor)
                        if (!parentMap.has(neighbor)) {
                            parentMap.set(neighbor, current)
                            distanceMap.set(neighbor, (distanceMap.get(current) ?? 0) + 1)
                        }
                    }
                }
                setFrontier([...stack])
            }
        } else if (algorithm === 'dijkstra') {
            const pq: { node: number; dist: number }[] = [{ node: startNode, dist: 0 }]
            while (pq.length > 0 && !stopRef.current) {
                pq.sort((a, b) => a.dist - b.dist)
                const { node: current, dist } = pq.shift()!
                if (visitedSet.has(current)) continue
                visitedSet.add(current)
                setCurrentNode(current)
                setVisited(prev => [...prev, { id: current, parent: parentMap.get(current) ?? null, distance: dist }])
                setFrontier(pq.map(p => p.node))
                await d(speed)
                if (current === endNode) break
                for (const { node: neighbor, weight } of getNeighbors(current)) {
                    exploredCount++
                    setEdgesExplored(exploredCount)
                    if (!visitedSet.has(neighbor)) {
                        const newDist = dist + weight
                        const existingDist = distanceMap.get(neighbor) ?? Infinity
                        if (newDist < existingDist) {
                            distanceMap.set(neighbor, newDist)
                            parentMap.set(neighbor, current)
                            pq.push({ node: neighbor, dist: newDist })
                        }
                    }
                }
            }
        } else if (algorithm === 'astar') {
            const openSet: { node: number; f: number; g: number }[] = [
                { node: startNode, f: heuristic(startNode, endNode), g: 0 }
            ]
            while (openSet.length > 0 && !stopRef.current) {
                openSet.sort((a, b) => a.f - b.f)
                const { node: current, g } = openSet.shift()!
                if (visitedSet.has(current)) continue
                visitedSet.add(current)
                setCurrentNode(current)
                setVisited(prev => [...prev, { id: current, parent: parentMap.get(current) ?? null, distance: g }])
                setFrontier(openSet.map(p => p.node))
                await d(speed)
                if (current === endNode) break
                for (const { node: neighbor, weight } of getNeighbors(current)) {
                    exploredCount++
                    setEdgesExplored(exploredCount)
                    if (!visitedSet.has(neighbor)) {
                        const newG = g + weight
                        const existingG = distanceMap.get(neighbor) ?? Infinity
                        if (newG < existingG) {
                            distanceMap.set(neighbor, newG)
                            parentMap.set(neighbor, current)
                            openSet.push({ node: neighbor, f: newG + heuristic(neighbor, endNode), g: newG })
                        }
                    }
                }
            }
        }

        // Reconstruct path and compute weight
        const reconstructedPath: number[] = []
        let cur: number | null = endNode
        while (cur !== null && parentMap.has(cur)) {
            reconstructedPath.unshift(cur)
            cur = parentMap.get(cur) ?? null
        }
        setPath(reconstructedPath)

        let totalWeight = 0
        for (let i = 0; i < reconstructedPath.length - 1; i++) {
            const from = reconstructedPath[i]
            const to = reconstructedPath[i + 1]
            const edge = edges.find(e => (e.from === from && e.to === to) || (e.to === from && e.from === to))
            if (edge) totalWeight += edge.weight
        }
        setPathWeight(totalWeight)
        setCurrentNode(null)
        setIsRunning(false)
    }, [algorithm, startNode, endNode, speed, getNeighbors, heuristic, edges])

    const regenerateGraph = useCallback(() => {
        reset()
        const g = generateGraph()
        setGraph(g)
        setStartNode(0)
        setEndNode(g.nodes.length - 1)
    }, [reset])

    const queueOrStackLabel = algorithm === 'bfs' ? 'Queue Size' : algorithm === 'dfs' ? 'Stack Size' : 'PQ Size'

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.scale(dpr, dpr)
        }
        resize()
        window.addEventListener('resize', resize)

        const rect = canvas.getBoundingClientRect()
        const width = rect.width
        const height = rect.height

        ctx.fillStyle = '#0a1a1a'
        ctx.fillRect(0, 0, width, height)

        // Draw edges
        edges.forEach(edge => {
            const from = nodes[edge.from]
            const to = nodes[edge.to]
            const isInPath = path.length > 1 && path.some((_p, i) =>
                i < path.length - 1 &&
                ((path[i] === edge.from && path[i + 1] === edge.to) ||
                    (path[i] === edge.to && path[i + 1] === edge.from))
            )

            ctx.strokeStyle = isInPath ? 'rgba(80, 200, 220, 0.8)' : 'rgba(80, 200, 220, 0.15)'
            ctx.lineWidth = isInPath ? 4 : 2
            ctx.beginPath()
            ctx.moveTo(from.x, from.y)
            ctx.lineTo(to.x, to.y)
            ctx.stroke()

            // Weight label
            if (algorithm === 'dijkstra' || algorithm === 'astar') {
                const midX = (from.x + to.x) / 2
                const midY = (from.y + to.y) / 2
                ctx.fillStyle = isInPath ? 'rgba(80, 200, 220, 0.9)' : 'rgba(80, 200, 220, 0.4)'
                ctx.font = '11px monospace'
                ctx.textAlign = 'center'
                ctx.fillText(edge.weight.toString(), midX, midY - 5)
            }
        })

        // Draw path direction arrows
        if (path.length > 1) {
            for (let i = 0; i < path.length - 1; i++) {
                const from = nodes[path[i]]
                const to = nodes[path[i + 1]]
                const mx = (from.x + to.x) / 2
                const my = (from.y + to.y) / 2
                const angle = Math.atan2(to.y - from.y, to.x - from.x)

                ctx.save()
                ctx.translate(mx, my)
                ctx.rotate(angle)
                ctx.fillStyle = 'rgba(80, 200, 220, 0.7)'
                ctx.beginPath()
                ctx.moveTo(6, 0)
                ctx.lineTo(-4, -4)
                ctx.lineTo(-4, 4)
                ctx.closePath()
                ctx.fill()
                ctx.restore()
            }
        }

        // Draw nodes
        nodes.forEach(node => {
            const isStart = node.id === startNode
            const isEnd = node.id === endNode
            const isVisited = visited.some(v => v.id === node.id)
            const isCurrent = node.id === currentNode
            const isInFrontier = frontier.includes(node.id)
            const isInPath = path.includes(node.id)

            let fillColor = 'rgba(20, 40, 50, 0.9)'
            let strokeColor = 'rgba(80, 200, 220, 0.3)'
            let radius = 22

            if (isStart) { fillColor = 'rgba(80, 200, 120, 0.9)'; strokeColor = 'rgba(80, 200, 120, 0.6)' }
            else if (isEnd) { fillColor = 'rgba(255, 100, 100, 0.9)'; strokeColor = 'rgba(255, 100, 100, 0.6)' }
            else if (isCurrent) { fillColor = 'rgba(255, 200, 80, 0.9)'; strokeColor = 'rgba(255, 200, 80, 0.8)'; radius = 28 }
            else if (isInPath) { fillColor = 'rgba(80, 200, 220, 0.9)'; strokeColor = 'rgba(80, 200, 220, 0.8)' }
            else if (isVisited) { fillColor = 'rgba(60, 150, 180, 0.6)' }
            else if (isInFrontier) { strokeColor = 'rgba(255, 200, 80, 0.5)' }

            if (isCurrent) {
                ctx.fillStyle = 'rgba(255, 200, 80, 0.15)'
                ctx.beginPath()
                ctx.arc(node.x, node.y, 36, 0, Math.PI * 2)
                ctx.fill()
            }

            ctx.strokeStyle = strokeColor
            ctx.lineWidth = 3
            ctx.fillStyle = fillColor
            ctx.beginPath()
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()

            // Distance label
            const dist = visited.find(v => v.id === node.id)?.distance
            if (dist !== undefined) {
                ctx.fillStyle = 'rgba(255,255,255,0.4)'
                ctx.font = '9px monospace'
                ctx.textAlign = 'center'
                ctx.fillText(`d=${algorithm === 'bfs' || algorithm === 'dfs' ? dist : dist.toFixed(1)}`, node.x, node.y + radius + 14)
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.font = 'bold 13px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(node.id.toString(), node.x, node.y)
        })

        return () => window.removeEventListener('resize', resize)
    }, [nodes, edges, visited, currentNode, path, frontier, startNode, endNode, algorithm])

    const demoSteps: DemoStep[] = useMemo(() => [
        {
            title: 'Graph Representation',
            description: 'A graph is a set of vertices (nodes) connected by edges. This grid graph has weighted edges. Adjacency lists or matrices store the connections.',
            setup: () => { setAlgorithm('bfs'); reset() },
        },
        {
            title: 'BFS: Level-Order',
            description: 'BFS visits all nodes at distance d before any node at distance d+1. It explores the graph in concentric layers from the start node.',
            setup: () => { setAlgorithm('bfs'); reset() },
        },
        {
            title: 'BFS: The Queue',
            description: 'BFS uses a FIFO queue. Neighbors are enqueued, and the front of the queue is dequeued next. This guarantees level-order traversal.',
            highlight: 'Watch the frontier (queue) grow and shrink as BFS runs.',
            setup: () => { setAlgorithm('bfs'); reset() },
        },
        {
            title: 'DFS: Depth-First',
            description: 'DFS plunges as deep as possible before backtracking. It follows one path to a dead end, then retreats to explore alternatives.',
            setup: () => { setAlgorithm('dfs'); reset() },
        },
        {
            title: 'DFS: Stack / Recursion',
            description: 'DFS uses a LIFO stack (or the call stack via recursion). The most recently discovered node is explored first.',
            highlight: 'Compare the stack-based frontier to the BFS queue.',
            setup: () => { setAlgorithm('dfs'); reset() },
        },
        {
            title: 'Shortest Path',
            description: 'BFS guarantees the shortest path in unweighted graphs. For weighted graphs, Dijkstra finds the minimum-cost path using a priority queue.',
            setup: () => { setAlgorithm('dijkstra'); reset() },
        },
        {
            title: 'Connected Components',
            description: 'Both BFS and DFS can find all nodes reachable from a source. Running traversal from every unvisited node identifies all connected components.',
            setup: () => { setAlgorithm('bfs'); reset() },
        },
        {
            title: 'BFS vs DFS Comparison',
            description: 'BFS: optimal unweighted shortest path, more memory. DFS: less memory, useful for cycle detection and topological sort, but no shortest-path guarantee.',
            highlight: 'Run both algorithms and compare nodes visited and path found.',
            setup: () => { setAlgorithm('bfs'); reset() },
        },
    ], [reset])

    const demo = useDemoMode(demoSteps)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a1a1a]">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Controls — top-left */}
                <div className="absolute top-4 left-4 space-y-3 max-w-[260px]">
                    <ControlPanel>
                        <ButtonGroup
                            label="Algorithm"
                            value={algorithm}
                            onChange={v => { setAlgorithm(v as Algorithm); reset() }}
                            options={[
                                { value: 'bfs', label: 'BFS' },
                                { value: 'dfs', label: 'DFS' },
                                { value: 'dijkstra', label: 'Djk' },
                                { value: 'astar', label: 'A*' },
                            ]}
                            color={CS_TEAL}
                        />
                        <ControlGroup label="Start Node">
                            <select
                                value={startNode}
                                onChange={e => { setStartNode(+e.target.value); reset() }}
                                disabled={isRunning}
                                className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono"
                            >
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                            </select>
                        </ControlGroup>
                        <ControlGroup label="End Node">
                            <select
                                value={endNode}
                                onChange={e => { setEndNode(+e.target.value); reset() }}
                                disabled={isRunning}
                                className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono"
                            >
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                            </select>
                        </ControlGroup>
                        <Slider label="Speed" value={550 - speed} onChange={v => setSpeed(550 - v)} min={50} max={500} />
                        <div className="flex gap-2">
                            <Button onClick={runAlgorithm} disabled={isRunning}>
                                {isRunning ? 'Running...' : 'Run'}
                            </Button>
                            <Button onClick={reset} variant="secondary">Reset</Button>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={regenerateGraph} variant="secondary" disabled={isRunning}>New Graph</Button>
                            <Button onClick={demo.open} variant="secondary">Tutorial</Button>
                        </div>
                    </ControlPanel>
                    <APTag course="AP CS A" unit="Unit 10" color={CS_TEAL} />
                </div>

                {/* Info + Equations — top-right */}
                <div className="absolute top-4 right-4 space-y-3 max-w-[240px]">
                    <InfoPanel
                        title="Traversal Data"
                        departmentColor={CS_TEAL}
                        items={[
                            { label: 'Nodes Visited', value: visited.length, color: CS_TEAL },
                            { label: 'Edges Explored', value: edgesExplored },
                            { label: queueOrStackLabel, value: frontier.length },
                            { label: 'Path Length', value: path.length > 0 ? path.length : '--' },
                            { label: 'Path Weight', value: pathWeight > 0 ? pathWeight : '--' },
                        ]}
                    />
                    <EquationDisplay
                        departmentColor={CS_TEAL}
                        title="Complexity"
                        collapsed
                        equations={[
                            { label: 'BFS', expression: 'O(V + E)', description: 'Breadth-first time complexity' },
                            { label: 'DFS', expression: 'O(V + E)', description: 'Depth-first time complexity' },
                            { label: 'Shortest', expression: 'BFS on unweighted', description: 'BFS guarantees shortest path' },
                        ]}
                    />
                </div>

                {/* DemoMode — bottom center */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <DemoMode
                        steps={demoSteps}
                        currentStep={demo.currentStep}
                        isOpen={demo.isOpen}
                        onClose={demo.close}
                        onNext={demo.next}
                        onPrev={demo.prev}
                        onGoToStep={demo.goToStep}
                        departmentColor={CS_TEAL}
                    />
                </div>
            </div>
        </div>
    )
}
