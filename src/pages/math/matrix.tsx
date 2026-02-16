import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import { ControlPanel, Slider, ButtonGroup, Toggle, Button } from '@/components/control-panel'
import type { DemoStep } from '@/components/demo-mode'
import { delay as delayFn } from '@/lib/utils'

type MatrixSize = 2 | 3
type ViewMode = 'multiply' | 'determinant' | 'inverse' | 'eigenvalue'

const MATH_COLOR = 'rgb(100, 140, 255)'

/* ── Linear algebra helpers ─────────────────────────────────── */

function det2(m: number[][]): number {
    return m[0][0] * m[1][1] - m[0][1] * m[1][0]
}

function det3(m: number[][]): number {
    return (
        m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
        m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    )
}

function determinant(m: number[][]): number {
    return m.length === 2 ? det2(m) : det3(m)
}

function inverse2(m: number[][]): number[][] | null {
    const d = det2(m)
    if (Math.abs(d) < 1e-10) return null
    return [
        [m[1][1] / d, -m[0][1] / d],
        [-m[1][0] / d, m[0][0] / d],
    ]
}

function cofactorMatrix3(m: number[][]): number[][] {
    return [
        [
            m[1][1] * m[2][2] - m[1][2] * m[2][1],
            -(m[1][0] * m[2][2] - m[1][2] * m[2][0]),
            m[1][0] * m[2][1] - m[1][1] * m[2][0],
        ],
        [
            -(m[0][1] * m[2][2] - m[0][2] * m[2][1]),
            m[0][0] * m[2][2] - m[0][2] * m[2][0],
            -(m[0][0] * m[2][1] - m[0][1] * m[2][0]),
        ],
        [
            m[0][1] * m[1][2] - m[0][2] * m[1][1],
            -(m[0][0] * m[1][2] - m[0][2] * m[1][0]),
            m[0][0] * m[1][1] - m[0][1] * m[1][0],
        ],
    ]
}

function transpose(m: number[][]): number[][] {
    return m[0].map((_, c) => m.map(row => row[c]))
}

function inverse3(m: number[][]): number[][] | null {
    const d = det3(m)
    if (Math.abs(d) < 1e-10) return null
    const adj = transpose(cofactorMatrix3(m))
    return adj.map(row => row.map(v => v / d))
}

function inverseMatrix(m: number[][]): number[][] | null {
    return m.length === 2 ? inverse2(m) : inverse3(m)
}

/** Eigenvalues for 2x2 via quadratic formula */
function eigenvalues2(m: number[][]): { real: number; imag: number }[] {
    const tr = m[0][0] + m[1][1]
    const d = det2(m)
    const disc = tr * tr - 4 * d
    if (disc >= 0) {
        const sq = Math.sqrt(disc)
        return [
            { real: (tr + sq) / 2, imag: 0 },
            { real: (tr - sq) / 2, imag: 0 },
        ]
    }
    const sq = Math.sqrt(-disc)
    return [
        { real: tr / 2, imag: sq / 2 },
        { real: tr / 2, imag: -sq / 2 },
    ]
}

interface AnimState {
    row: number
    col: number
    k: number
    calc: string
}

export default function Matrix() {
    const [size, setSize] = useState<MatrixSize>(2)
    const [matrixA, setMatrixA] = useState<number[][]>([[1, 2], [3, 4]])
    const [matrixB, setMatrixB] = useState<number[][]>([[5, 6], [7, 8]])
    const [result, setResult] = useState<(number | null)[][]>([[null, null], [null, null]])
    const [isAnimating, setIsAnimating] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [speed, setSpeed] = useState(400)
    const [anim, setAnim] = useState<AnimState | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('multiply')
    const [showInverse, setShowInverse] = useState(false)
    const [showEigen, setShowEigen] = useState(false)
    const pauseRef = useRef(false)
    const stopRef = useRef(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => { pauseRef.current = isPaused }, [isPaused])

    const rand = () => Math.floor(Math.random() * 9) + 1

    const initMatrices = useCallback((s: MatrixSize) => {
        setMatrixA(Array(s).fill(0).map(() => Array(s).fill(0).map(rand)))
        setMatrixB(Array(s).fill(0).map(() => Array(s).fill(0).map(rand)))
        setResult(Array(s).fill(0).map(() => Array(s).fill(null)))
    }, [])

    useEffect(() => { initMatrices(size) }, [size, initMatrices])

    const delay = async (ms: number) => {
        while (pauseRef.current && !stopRef.current) await delayFn(100)
        return delayFn(ms)
    }

    const updateCell = (m: 'A' | 'B', r: number, c: number, v: number) => {
        if (m === 'A') {
            const n = matrixA.map(row => [...row])
            n[r][c] = v
            setMatrixA(n)
        } else {
            const n = matrixB.map(row => [...row])
            n[r][c] = v
            setMatrixB(n)
        }
    }

    const multiply = async () => {
        stopRef.current = false
        setIsAnimating(true)
        setIsPaused(false)
        const res: (number | null)[][] = Array(size).fill(0).map(() => Array(size).fill(null))
        setResult(res)
        for (let i = 0; i < size && !stopRef.current; i++) {
            for (let j = 0; j < size && !stopRef.current; j++) {
                let sum = 0, calc = ''
                for (let k = 0; k < size && !stopRef.current; k++) {
                    calc += (k > 0 ? ' + ' : '') + `${matrixA[i][k]}*${matrixB[k][j]}`
                    setAnim({ row: i, col: j, k, calc })
                    await delay(speed)
                    sum += matrixA[i][k] * matrixB[k][j]
                }
                res[i][j] = sum
                setResult(res.map(r => [...r]))
                setAnim({ row: i, col: j, k: -1, calc: `${calc} = ${sum}` })
                await delay(speed / 2)
            }
        }
        setAnim(null)
        setIsAnimating(false)
    }

    const reset = () => {
        stopRef.current = true
        initMatrices(size)
        setAnim(null)
        setIsAnimating(false)
        setIsPaused(false)
        setShowInverse(false)
        setShowEigen(false)
    }

    const togglePause = () => setIsPaused(!isPaused)

    const isHighlighted = (m: 'A' | 'B' | 'R', r: number, c: number) => {
        if (!anim) return false
        if (m === 'A') return anim.row === r && anim.k === c
        if (m === 'B') return anim.k === r && anim.col === c
        return anim.row === r && anim.col === c
    }

    /* ── Derived values ─────────────────────────────────────── */
    const detA = determinant(matrixA)
    const invA = inverseMatrix(matrixA)
    const eigens = size === 2 ? eigenvalues2(matrixA) : []
    const trace = matrixA.reduce((s, row, i) => s + row[i], 0)

    /* ── Eigenvalue canvas ──────────────────────────────────── */
    useEffect(() => {
        if (viewMode !== 'eigenvalue' || size !== 2) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const dpr = window.devicePixelRatio || 1
        const w = canvas.offsetWidth
        const h = canvas.offsetHeight
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        ctx.fillStyle = '#0a0e1a'
        ctx.fillRect(0, 0, w, h)

        const cx = w / 2, cy = h / 2
        const scale = Math.min(w, h) / 10

        // Grid
        ctx.strokeStyle = 'rgba(100, 140, 255, 0.06)'
        ctx.lineWidth = 1
        for (let i = -5; i <= 5; i++) {
            ctx.beginPath(); ctx.moveTo(cx + i * scale, 0); ctx.lineTo(cx + i * scale, h); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(0, cy + i * scale); ctx.lineTo(w, cy + i * scale); ctx.stroke()
        }

        // Axes
        ctx.strokeStyle = 'rgba(100, 140, 255, 0.3)'
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()

        ctx.fillStyle = 'rgba(100, 140, 255, 0.4)'
        ctx.font = '10px system-ui'
        ctx.textAlign = 'center'
        for (let i = -4; i <= 4; i++) {
            if (i === 0) continue
            ctx.fillText(i.toString(), cx + i * scale, cy + 14)
            ctx.fillText(i.toString(), cx - 16, cy - i * scale + 4)
        }

        // Unit circle reference
        ctx.strokeStyle = 'rgba(100, 140, 255, 0.1)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(cx, cy, scale, 0, Math.PI * 2)
        ctx.stroke()

        // Draw eigenvectors and eigenvalues
        eigens.forEach((ev, idx) => {
            const color = idx === 0 ? 'rgba(255, 200, 100, 0.9)' : 'rgba(100, 220, 180, 0.9)'
            const px = cx + ev.real * scale
            const py = cy - ev.imag * scale

            // Glow
            const glow = ctx.createRadialGradient(px, py, 0, px, py, 16)
            glow.addColorStop(0, idx === 0 ? 'rgba(255, 200, 100, 0.3)' : 'rgba(100, 220, 180, 0.3)')
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2); ctx.fill()

            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(px, py, 5, 0, Math.PI * 2)
            ctx.fill()

            const label = ev.imag === 0
                ? `lambda${idx + 1} = ${ev.real.toFixed(2)}`
                : `lambda${idx + 1} = ${ev.real.toFixed(2)} ${ev.imag >= 0 ? '+' : '-'} ${Math.abs(ev.imag).toFixed(2)}i`
            ctx.fillStyle = color
            ctx.font = '12px monospace'
            ctx.textAlign = idx === 0 ? 'left' : 'right'
            ctx.fillText(label, px + (idx === 0 ? 10 : -10), py - 10)
        })

        // Eigenvector arrows (only for real eigenvalues)
        if (size === 2) {
            eigens.forEach((ev, idx) => {
                if (ev.imag !== 0) return
                const A = matrixA
                // (A - lambda*I)v = 0 => find nullspace
                const a11 = A[0][0] - ev.real
                const a12 = A[0][1]
                let vx: number, vy: number
                if (Math.abs(a12) > 1e-10) {
                    vx = 1; vy = -a11 / a12
                } else if (Math.abs(a11) > 1e-10) {
                    vx = 0; vy = 1
                } else {
                    vx = 1; vy = 0
                }
                const len = Math.sqrt(vx * vx + vy * vy)
                vx /= len; vy /= len

                const arrowLen = 3 * scale
                const color = idx === 0 ? 'rgba(255, 200, 100, 0.5)' : 'rgba(100, 220, 180, 0.5)'
                ctx.strokeStyle = color
                ctx.lineWidth = 2
                ctx.setLineDash([6, 3])
                ctx.beginPath()
                ctx.moveTo(cx - vx * arrowLen, cy + vy * arrowLen)
                ctx.lineTo(cx + vx * arrowLen, cy - vy * arrowLen)
                ctx.stroke()
                ctx.setLineDash([])
            })
        }

        ctx.fillStyle = 'rgba(100, 140, 255, 0.6)'
        ctx.font = 'bold 12px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText('Eigenvalue Plot (Complex Plane)', 12, 20)
    }, [viewMode, matrixA, size, eigens])

    /* ── Demo steps ─────────────────────────────────────────── */
    const demoSteps: DemoStep[] = [
        {
            title: 'What is Matrix Multiplication?',
            description: 'Matrix multiplication combines rows of the first matrix with columns of the second. Each element C[i][j] is the dot product of row i from A and column j from B.',
            setup: () => { setViewMode('multiply'); setSize(2) },
            highlight: 'Click Multiply to see the step-by-step dot products',
        },
        {
            title: 'Row-Column Dot Products',
            description: 'For C[0][0], we multiply each element of row 0 in A by the corresponding element of column 0 in B, then sum: a00*b00 + a01*b10.',
            setup: () => { setViewMode('multiply'); setSize(2) },
        },
        {
            title: '3x3 Matrix Multiplication',
            description: 'Scaling up: a 3x3 multiplication requires 3 terms per dot product instead of 2. The algorithm is O(n^3) -- each element needs n multiplications.',
            setup: () => { setViewMode('multiply'); setSize(3) },
        },
        {
            title: 'The Determinant',
            description: 'The determinant measures how a matrix scales area (2D) or volume (3D). For 2x2: det = ad - bc. If det = 0 the matrix is singular and has no inverse.',
            setup: () => { setViewMode('determinant'); setSize(2) },
            highlight: 'Edit matrix values and watch the determinant change',
        },
        {
            title: 'Matrix Inverse',
            description: 'The inverse A^-1 satisfies A * A^-1 = I. For 2x2: swap diagonal, negate off-diagonal, divide by det. An inverse exists only when det != 0.',
            setup: () => { setViewMode('inverse'); setSize(2); setShowInverse(true) },
        },
        {
            title: 'Eigenvalues (2x2)',
            description: 'Eigenvalues lambda satisfy Av = lambda*v. For 2x2 we solve the characteristic polynomial: lambda^2 - tr(A)*lambda + det(A) = 0.',
            setup: () => { setViewMode('eigenvalue'); setSize(2); setShowEigen(true) },
            highlight: 'Eigenvalues are plotted on the complex plane',
        },
        {
            title: 'Complex Eigenvalues',
            description: 'When the discriminant tr^2 - 4*det < 0, eigenvalues are complex conjugates. This means the matrix involves rotation. Try setting A = [[0, -1], [1, 0]].',
            setup: () => {
                setViewMode('eigenvalue'); setSize(2)
                setMatrixA([[0, -1], [1, 0]])
                setShowEigen(true)
            },
        },
        {
            title: 'Explore Freely',
            description: 'Change view modes, edit matrix entries, and switch between 2x2 and 3x3 to build intuition for linear algebra concepts.',
            setup: () => { setViewMode('multiply'); setSize(2) },
        },
    ]

    const demo = useDemoMode(demoSteps)

    /* ── Render helpers ─────────────────────────────────────── */
    const renderMatrix = (m: number[][] | (number | null)[][], id: 'A' | 'B' | 'R', editable = false) => (
        <div className="flex flex-col gap-1.5">
            {m.map((row, i) => (
                <div key={i} className="flex gap-1.5">
                    {row.map((cell, j) => (
                        <motion.div
                            key={j}
                            animate={{ scale: isHighlighted(id, i, j) ? 1.1 : 1 }}
                            className={`w-12 h-12 rounded-lg flex items-center justify-center font-mono text-sm transition-colors ${
                                isHighlighted(id, i, j)
                                    ? id === 'R'
                                        ? 'bg-blue-500/20 border border-blue-400'
                                        : 'bg-amber-500/20 border border-amber-400'
                                    : 'bg-white/5 border border-white/10'
                            }`}
                            style={isHighlighted(id, i, j) ? { color: id === 'R' ? MATH_COLOR : 'rgb(255, 200, 100)' } : { color: 'white' }}
                        >
                            {editable ? (
                                <input
                                    type="number"
                                    value={cell ?? ''}
                                    onChange={e => updateCell(id as 'A' | 'B', i, j, parseInt(e.target.value) || 0)}
                                    className="w-full h-full bg-transparent text-center focus:outline-none font-mono text-sm"
                                    disabled={isAnimating}
                                />
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.span key={String(cell)} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                        {cell !== null && cell !== undefined ? (typeof cell === 'number' ? (Number.isInteger(cell) ? cell : cell.toFixed(2)) : cell) : '?'}
                                    </motion.span>
                                </AnimatePresence>
                            )}
                        </motion.div>
                    ))}
                </div>
            ))}
        </div>
    )

    const renderInverseMatrix = () => {
        if (!invA) return <div className="text-red-400 text-sm font-mono">Singular (det = 0)</div>
        return (
            <div className="flex flex-col gap-1.5">
                {invA.map((row, i) => (
                    <div key={i} className="flex gap-1.5">
                        {row.map((cell, j) => (
                            <motion.div
                                key={j}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: (i * size + j) * 0.08 }}
                                className="w-16 h-12 rounded-lg flex items-center justify-center font-mono text-xs bg-green-500/10 border border-green-500/30 text-green-300"
                            >
                                {cell.toFixed(3)}
                            </motion.div>
                        ))}
                    </div>
                ))}
            </div>
        )
    }

    /* ── Equations ───────────────────────────────────────────── */
    const equations = viewMode === 'multiply' ? [
        { label: 'Rule', expression: `C[i][j] = sum(A[i][k] * B[k][j], k=0..${size - 1})`, description: 'Dot product of row i and column j' },
        { label: 'Complexity', expression: `O(n^3) = O(${size}^3) = ${size * size * size} muls` },
    ] : viewMode === 'determinant' ? [
        { label: '2x2', expression: 'det = a*d - b*c', description: 'Area scaling factor' },
        { label: '3x3', expression: 'det = a(ei-fh) - b(di-fg) + c(dh-eg)', description: 'Cofactor expansion along first row' },
    ] : viewMode === 'inverse' ? [
        { label: 'Definition', expression: 'A * A^-1 = I', description: 'Identity matrix product' },
        { label: '2x2', expression: 'A^-1 = (1/det) * [[d, -b], [-c, a]]' },
    ] : [
        { label: 'Characteristic', expression: 'det(A - lambda*I) = 0' },
        { label: '2x2', expression: `lambda^2 - ${trace}*lambda + ${detA.toFixed(1)} = 0`, description: 'Quadratic in lambda' },
    ]

    const infoItems = [
        { label: 'Size', value: `${size}x${size}`, color: 'white' },
        { label: 'det(A)', value: detA.toFixed(2), color: Math.abs(detA) < 1e-10 ? 'rgb(255, 100, 100)' : 'rgb(100, 220, 160)' },
        { label: 'tr(A)', value: trace.toFixed(2), color: MATH_COLOR },
        { label: 'Invertible', value: Math.abs(detA) > 1e-10 ? 'Yes' : 'No', color: Math.abs(detA) > 1e-10 ? 'rgb(100, 220, 160)' : 'rgb(255, 100, 100)' },
        ...(size === 2 ? eigens.map((ev, i) => ({
            label: `lambda${i + 1}`,
            value: ev.imag === 0 ? ev.real.toFixed(3) : `${ev.real.toFixed(2)}${ev.imag >= 0 ? '+' : ''}${ev.imag.toFixed(2)}i`,
            color: i === 0 ? 'rgb(255, 200, 100)' : 'rgb(100, 220, 180)',
        })) : []),
    ]

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0a0e1a]">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Link to="/" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-lg font-medium text-white/90">Matrix Operations</h1>
                    <APTag course="Mathematics" color={MATH_COLOR} />
                </div>
                <Button onClick={demo.open} className="text-xs">AP Tutorial</Button>
            </div>

            <div className="flex-1 relative flex overflow-hidden">
                {/* Main visualization area */}
                <div className="flex-1 relative flex flex-col">
                    {/* Equation overlay */}
                    <EquationDisplay
                        equations={equations}
                        departmentColor={MATH_COLOR}
                        className="absolute top-3 left-3 max-w-xs z-10"
                        title="Matrix Algebra"
                    />

                    {/* Info panel */}
                    <InfoPanel
                        title="Properties"
                        departmentColor={MATH_COLOR}
                        className="absolute top-3 right-3 min-w-[170px] z-10"
                        items={infoItems}
                    />

                    {/* Content area */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 pt-20">
                        {viewMode === 'multiply' && (
                            <>
                                <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-center">
                                    <div className="text-center">
                                        <p className="text-white/40 text-xs mb-2 font-mono">A</p>
                                        {renderMatrix(matrixA, 'A', true)}
                                    </div>
                                    <span className="text-2xl text-white/30 font-mono">x</span>
                                    <div className="text-center">
                                        <p className="text-white/40 text-xs mb-2 font-mono">B</p>
                                        {renderMatrix(matrixB, 'B', true)}
                                    </div>
                                    <span className="text-2xl text-white/30 font-mono">=</span>
                                    <div className="text-center">
                                        <p className="text-white/40 text-xs mb-2 font-mono">C</p>
                                        {renderMatrix(result, 'R')}
                                    </div>
                                </div>
                                {anim && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-white/50 text-center text-sm h-5">
                                        {anim.calc}
                                    </motion.div>
                                )}
                            </>
                        )}

                        {viewMode === 'determinant' && (
                            <div className="flex flex-col items-center gap-8">
                                <div className="text-center">
                                    <p className="text-white/40 text-xs mb-2 font-mono">A</p>
                                    {renderMatrix(matrixA, 'A', true)}
                                </div>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center"
                                >
                                    <p className="text-white/40 text-xs mb-2">Determinant</p>
                                    <p className="text-5xl font-mono font-bold" style={{ color: Math.abs(detA) < 1e-10 ? 'rgb(255, 100, 100)' : MATH_COLOR }}>
                                        {detA.toFixed(2)}
                                    </p>
                                    {size === 2 && (
                                        <p className="text-white/30 text-xs mt-3 font-mono">
                                            = ({matrixA[0][0]}*{matrixA[1][1]}) - ({matrixA[0][1]}*{matrixA[1][0]}) = {matrixA[0][0] * matrixA[1][1]} - {matrixA[0][1] * matrixA[1][0]}
                                        </p>
                                    )}
                                    <p className="text-white/20 text-xs mt-2">
                                        {Math.abs(detA) < 1e-10 ? 'Singular -- no inverse exists' : `Area scaled by |${detA.toFixed(2)}|`}
                                    </p>
                                </motion.div>
                            </div>
                        )}

                        {viewMode === 'inverse' && (
                            <div className="flex items-center gap-6 md:gap-10 flex-wrap justify-center">
                                <div className="text-center">
                                    <p className="text-white/40 text-xs mb-2 font-mono">A</p>
                                    {renderMatrix(matrixA, 'A', true)}
                                </div>
                                <span className="text-xl text-white/30 font-mono">--{'>'}</span>
                                <div className="text-center">
                                    <p className="text-white/40 text-xs mb-2 font-mono">A^-1</p>
                                    {renderInverseMatrix()}
                                </div>
                            </div>
                        )}

                        {viewMode === 'eigenvalue' && (
                            <div className="flex items-start gap-6 flex-wrap justify-center w-full max-w-3xl">
                                <div className="text-center">
                                    <p className="text-white/40 text-xs mb-2 font-mono">A (2x2 only)</p>
                                    {renderMatrix(matrixA, 'A', true)}
                                    {size !== 2 && (
                                        <p className="text-amber-400/60 text-xs mt-2">Switch to 2x2 for eigenvalue plot</p>
                                    )}
                                </div>
                                {size === 2 && (
                                    <div className="flex-1 min-w-[280px]">
                                        <canvas
                                            ref={canvasRef}
                                            className="w-full rounded-xl border border-white/10"
                                            style={{ height: 260 }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Demo mode overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                        <DemoMode
                            steps={demoSteps}
                            currentStep={demo.currentStep}
                            isOpen={demo.isOpen}
                            onClose={demo.close}
                            onNext={demo.next}
                            onPrev={demo.prev}
                            onGoToStep={demo.goToStep}
                            departmentColor={MATH_COLOR}
                            title="Matrix Tutorial"
                        />
                    </div>
                </div>

                {/* Right sidebar controls */}
                <div className="w-72 bg-black/30 border-l border-white/10 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto">
                    <ControlPanel className="!p-0 !bg-transparent !border-0 !backdrop-blur-0">
                        <ButtonGroup
                            label="View Mode"
                            value={viewMode}
                            onChange={v => setViewMode(v as ViewMode)}
                            options={[
                                { value: 'multiply', label: 'Multiply' },
                                { value: 'determinant', label: 'Det' },
                                { value: 'inverse', label: 'Inv' },
                                { value: 'eigenvalue', label: 'Eigen' },
                            ]}
                            color={MATH_COLOR}
                        />
                        <ButtonGroup
                            label="Matrix Size"
                            value={String(size)}
                            onChange={v => { setSize(Number(v) as MatrixSize); setIsAnimating(false) }}
                            options={[
                                { value: '2', label: '2x2' },
                                { value: '3', label: '3x3' },
                            ]}
                            color={MATH_COLOR}
                        />
                        {viewMode === 'multiply' && (
                            <Slider
                                label="Animation Speed (ms)"
                                value={speed}
                                onChange={setSpeed}
                                min={100}
                                max={1000}
                                step={50}
                            />
                        )}
                        <Toggle label="Show Inverse" value={showInverse} onChange={v => { setShowInverse(v); if (v) setViewMode('inverse') }} />
                        {size === 2 && (
                            <Toggle label="Show Eigenvalues" value={showEigen} onChange={v => { setShowEigen(v); if (v) setViewMode('eigenvalue') }} />
                        )}
                    </ControlPanel>

                    <div className="flex flex-col gap-2">
                        {viewMode === 'multiply' && (
                            <>
                                <Button onClick={multiply} disabled={isAnimating} className="w-full">
                                    {isAnimating ? 'Running...' : 'Multiply'}
                                </Button>
                                {isAnimating && (
                                    <Button onClick={togglePause} variant="secondary" className="w-full">
                                        {isPaused ? 'Resume' : 'Pause'}
                                    </Button>
                                )}
                            </>
                        )}
                        <Button onClick={reset} variant="secondary" className="w-full">Reset</Button>
                        <Button onClick={() => initMatrices(size)} variant="secondary" className="w-full" disabled={isAnimating}>
                            Randomize
                        </Button>
                    </div>

                    {/* Quick reference */}
                    <div className="mt-auto p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <h4 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Quick Reference</h4>
                        <ul className="text-xs text-white/50 space-y-1.5 leading-relaxed">
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: MATH_COLOR }} />Matrix product (blue)</li>
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(255, 200, 100)' }} />Active element (amber)</li>
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(100, 220, 180)' }} />Eigenvalue 2 (teal)</li>
                            <li><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: 'rgb(100, 180, 100)' }} />Inverse entries (green)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
