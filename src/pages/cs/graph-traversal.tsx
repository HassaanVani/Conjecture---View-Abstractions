import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

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

const algorithms: { id: Algorithm; name: string; description: string }[] = [
    { id: 'bfs', name: 'BFS', description: 'Breadth-First Search — explores level by level' },
    { id: 'dfs', name: 'DFS', description: 'Depth-First Search — explores as deep as possible first' },
    { id: 'dijkstra', name: 'Dijkstra', description: "Dijkstra's Algorithm — finds shortest weighted path" },
    { id: 'astar', name: 'A*', description: 'A* Search — uses heuristic for optimal pathfinding' },
]

export default function GraphTraversal() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [algorithm, setAlgorithm] = useState<Algorithm>('bfs')
    const [isRunning, setIsRunning] = useState(false)
    const [speed, setSpeed] = useState(200)
    const [startNode, setStartNode] = useState(0)
    const [endNode, setEndNode] = useState(8)

    const [nodes] = useState<Node[]>(() => {
        // Create a grid-like graph
        const n: Node[] = []
        const gridSize = 3
        const spacing = 120
        const offsetX = 250
        const offsetY = 120

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                n.push({
                    id: row * gridSize + col,
                    x: offsetX + col * spacing + (Math.random() - 0.5) * 20,
                    y: offsetY + row * spacing + (Math.random() - 0.5) * 20,
                })
            }
        }
        return n
    })

    const [edges] = useState<Edge[]>(() => {
        // Create edges for a connected graph
        const e: Edge[] = []
        const gridSize = 3

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const id = row * gridSize + col
                // Right neighbor
                if (col < gridSize - 1) {
                    e.push({ from: id, to: id + 1, weight: 1 + Math.floor(Math.random() * 5) })
                }
                // Down neighbor
                if (row < gridSize - 1) {
                    e.push({ from: id, to: id + gridSize, weight: 1 + Math.floor(Math.random() * 5) })
                }
                // Diagonal (optional connections)
                if (row < gridSize - 1 && col < gridSize - 1 && Math.random() > 0.5) {
                    e.push({ from: id, to: id + gridSize + 1, weight: 2 + Math.floor(Math.random() * 5) })
                }
            }
        }
        return e
    })

    const [visited, setVisited] = useState<VisitedNode[]>([])
    const [currentNode, setCurrentNode] = useState<number | null>(null)
    const [path, setPath] = useState<number[]>([])
    const [frontier, setFrontier] = useState<number[]>([])

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

    const runAlgorithm = useCallback(async () => {
        setIsRunning(true)
        setVisited([])
        setPath([])
        setFrontier([])
        setCurrentNode(null)

        const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
        const visitedSet = new Set<number>()
        const parentMap = new Map<number, number | null>()
        const distanceMap = new Map<number, number>()

        parentMap.set(startNode, null)
        distanceMap.set(startNode, 0)

        if (algorithm === 'bfs') {
            const queue: number[] = [startNode]
            setFrontier([...queue])

            while (queue.length > 0) {
                const current = queue.shift()!
                if (visitedSet.has(current)) continue

                visitedSet.add(current)
                setCurrentNode(current)
                setVisited(prev => [...prev, {
                    id: current,
                    parent: parentMap.get(current) ?? null,
                    distance: distanceMap.get(current) ?? 0
                }])

                await delay(speed)

                if (current === endNode) break

                for (const { node: neighbor } of getNeighbors(current)) {
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

            while (stack.length > 0) {
                const current = stack.pop()!
                if (visitedSet.has(current)) continue

                visitedSet.add(current)
                setCurrentNode(current)
                setVisited(prev => [...prev, {
                    id: current,
                    parent: parentMap.get(current) ?? null,
                    distance: distanceMap.get(current) ?? 0
                }])

                await delay(speed)

                if (current === endNode) break

                for (const { node: neighbor } of getNeighbors(current)) {
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

            while (pq.length > 0) {
                pq.sort((a, b) => a.dist - b.dist)
                const { node: current, dist } = pq.shift()!

                if (visitedSet.has(current)) continue

                visitedSet.add(current)
                setCurrentNode(current)
                setVisited(prev => [...prev, {
                    id: current,
                    parent: parentMap.get(current) ?? null,
                    distance: dist
                }])
                setFrontier(pq.map(p => p.node))

                await delay(speed)

                if (current === endNode) break

                for (const { node: neighbor, weight } of getNeighbors(current)) {
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

            while (openSet.length > 0) {
                openSet.sort((a, b) => a.f - b.f)
                const { node: current, g } = openSet.shift()!

                if (visitedSet.has(current)) continue

                visitedSet.add(current)
                setCurrentNode(current)
                setVisited(prev => [...prev, {
                    id: current,
                    parent: parentMap.get(current) ?? null,
                    distance: g
                }])
                setFrontier(openSet.map(p => p.node))

                await delay(speed)

                if (current === endNode) break

                for (const { node: neighbor, weight } of getNeighbors(current)) {
                    if (!visitedSet.has(neighbor)) {
                        const newG = g + weight
                        const existingG = distanceMap.get(neighbor) ?? Infinity

                        if (newG < existingG) {
                            distanceMap.set(neighbor, newG)
                            parentMap.set(neighbor, current)
                            const f = newG + heuristic(neighbor, endNode)
                            openSet.push({ node: neighbor, f, g: newG })
                        }
                    }
                }
            }
        }

        // Reconstruct path
        const reconstructedPath: number[] = []
        let current: number | null = endNode
        while (current !== null && parentMap.has(current)) {
            reconstructedPath.unshift(current)
            current = parentMap.get(current) ?? null
        }
        setPath(reconstructedPath)
        setCurrentNode(null)
        setIsRunning(false)
    }, [algorithm, startNode, endNode, speed, getNeighbors, heuristic])

    const reset = () => {
        setIsRunning(false)
        setVisited([])
        setPath([])
        setFrontier([])
        setCurrentNode(null)
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        const width = canvas.offsetWidth
        const height = canvas.offsetHeight

        ctx.fillStyle = '#0a1518'
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

            ctx.strokeStyle = isInPath ? 'rgba(80, 200, 220, 0.8)' : 'rgba(80, 200, 220, 0.2)'
            ctx.lineWidth = isInPath ? 4 : 2
            ctx.beginPath()
            ctx.moveTo(from.x, from.y)
            ctx.lineTo(to.x, to.y)
            ctx.stroke()

            // Weight label (for weighted algorithms)
            if (algorithm === 'dijkstra' || algorithm === 'astar') {
                const midX = (from.x + to.x) / 2
                const midY = (from.y + to.y) / 2
                ctx.fillStyle = 'rgba(80, 200, 220, 0.5)'
                ctx.font = '11px monospace'
                ctx.textAlign = 'center'
                ctx.fillText(edge.weight.toString(), midX, midY - 5)
            }
        })

        // Draw nodes
        nodes.forEach(node => {
            const isStart = node.id === startNode
            const isEnd = node.id === endNode
            const isVisited = visited.some(v => v.id === node.id)
            const isCurrent = node.id === currentNode
            const isInFrontier = frontier.includes(node.id)
            const isInPath = path.includes(node.id)

            // Node circle
            let fillColor = 'rgba(40, 60, 70, 0.9)'
            let strokeColor = 'rgba(80, 200, 220, 0.3)'
            let radius = 25

            if (isStart) {
                fillColor = 'rgba(80, 200, 120, 0.9)'
                strokeColor = 'rgba(80, 200, 120, 0.6)'
            } else if (isEnd) {
                fillColor = 'rgba(255, 100, 100, 0.9)'
                strokeColor = 'rgba(255, 100, 100, 0.6)'
            } else if (isCurrent) {
                fillColor = 'rgba(255, 200, 80, 0.9)'
                strokeColor = 'rgba(255, 200, 80, 0.8)'
                radius = 30
            } else if (isInPath) {
                fillColor = 'rgba(80, 200, 220, 0.9)'
                strokeColor = 'rgba(80, 200, 220, 0.8)'
            } else if (isVisited) {
                fillColor = 'rgba(80, 150, 180, 0.7)'
            } else if (isInFrontier) {
                strokeColor = 'rgba(255, 200, 80, 0.5)'
            }

            // Glow for current
            if (isCurrent) {
                ctx.fillStyle = 'rgba(255, 200, 80, 0.2)'
                ctx.beginPath()
                ctx.arc(node.x, node.y, 40, 0, Math.PI * 2)
                ctx.fill()
            }

            ctx.strokeStyle = strokeColor
            ctx.lineWidth = 3
            ctx.fillStyle = fillColor
            ctx.beginPath()
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()

            // Node label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
            ctx.font = 'bold 14px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(node.id.toString(), node.x, node.y)
        })

        // Legend
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'left'

        ctx.fillStyle = 'rgba(80, 200, 120, 0.9)'
        ctx.fillRect(width - 120, 20, 12, 12)
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.fillText('Start', width - 100, 30)

        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
        ctx.fillRect(width - 120, 40, 12, 12)
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.fillText('End', width - 100, 50)

        return () => window.removeEventListener('resize', resize)
    }, [nodes, edges, visited, currentNode, path, frontier, startNode, endNode, algorithm])

    const algoInfo = algorithms.find(a => a.id === algorithm)!

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Algorithm selector */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex gap-2"
                >
                    {algorithms.map(a => (
                        <button
                            key={a.id}
                            onClick={() => { setAlgorithm(a.id); reset() }}
                            disabled={isRunning}
                            className={`px-3 py-2 rounded-lg text-sm transition-all ${algorithm === a.id
                                ? 'bg-white/10 text-white'
                                : 'text-text-muted hover:text-white'
                                } disabled:opacity-50`}
                        >
                            {a.name}
                        </button>
                    ))}
                </motion.div>

                {/* Algorithm description */}
                <div className="absolute top-4 right-4 text-xs text-text-dim max-w-xs text-right">
                    {algoInfo.description}
                </div>

                {/* Stats */}
                {visited.length > 0 && (
                    <div className="absolute bottom-24 left-4 bg-bg-elevated/60 backdrop-blur-sm rounded-lg p-3 text-sm">
                        <div className="text-text-muted">Nodes visited: <span className="text-white">{visited.length}</span></div>
                        {path.length > 0 && (
                            <div className="text-text-muted">Path length: <span className="text-accent-teal">{path.length}</span></div>
                        )}
                    </div>
                )}
            </div>

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={runAlgorithm}
                            disabled={isRunning}
                            className="btn-primary disabled:opacity-30"
                        >
                            {isRunning ? 'Running...' : 'Run'}
                        </button>
                        <button onClick={reset} disabled={isRunning} className="btn-ghost disabled:opacity-30">
                            Reset
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Start</span>
                            <select
                                value={startNode}
                                onChange={e => { setStartNode(+e.target.value); reset() }}
                                disabled={isRunning}
                                className="bg-bg border border-border rounded px-2 py-1 text-sm"
                            >
                                {nodes.map(n => (
                                    <option key={n.id} value={n.id}>{n.id}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">End</span>
                            <select
                                value={endNode}
                                onChange={e => { setEndNode(+e.target.value); reset() }}
                                disabled={isRunning}
                                className="bg-bg border border-border rounded px-2 py-1 text-sm"
                            >
                                {nodes.map(n => (
                                    <option key={n.id} value={n.id}>{n.id}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">Speed</span>
                            <input
                                type="range"
                                min={50}
                                max={500}
                                value={550 - speed}
                                onChange={e => setSpeed(550 - +e.target.value)}
                                className="w-20 accent-text"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
