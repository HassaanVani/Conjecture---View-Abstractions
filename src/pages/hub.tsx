import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

const visualizations = [
    {
        id: 'collatz',
        title: 'Collatz Conjecture',
        symbol: '3n+1',
        description: 'The infinite descent into the 4-2-1 loop',
        to: '/collatz',
    },
    {
        id: 'sorting',
        title: 'Sorting Algorithms',
        symbol: 'O(n)',
        description: 'Racing complexity through ordered chaos',
        to: '/sorting',
    },
    {
        id: 'euclidean',
        title: 'Euclidean Algorithm',
        symbol: 'gcd',
        description: 'Finding common ground through division',
        to: '/euclidean',
    },
    {
        id: 'matrix',
        title: 'Matrix Multiplication',
        symbol: 'A×B',
        description: 'The dot product dance of rows and columns',
        to: '/matrix',
    },
    {
        id: 'binary',
        title: 'Binary Search',
        symbol: 'log₂',
        description: 'Divide and conquer in logarithmic time',
        to: '/binary-search',
    },
]

function TensorBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        let frame = 0
        const animate = () => {
            frame++
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const gridSize = 80
            const time = frame * 0.01

            for (let x = 0; x < canvas.width + gridSize; x += gridSize) {
                for (let y = 0; y < canvas.height + gridSize; y += gridSize) {
                    const i = Math.floor(x / gridSize)
                    const j = Math.floor(y / gridSize)

                    const tensorValue = Math.sin(i * 0.3 + time) * Math.cos(j * 0.3 + time * 0.7)
                    const alpha = Math.abs(tensorValue) * 0.15 + 0.02

                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
                    ctx.lineWidth = 1

                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x + gridSize, y)
                    ctx.stroke()

                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x, y + gridSize)
                    ctx.stroke()

                    if (Math.abs(tensorValue) > 0.7) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(tensorValue) * 0.08})`
                        ctx.beginPath()
                        ctx.arc(x, y, 3, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }
            }

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [])

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />
}

export default function Hub() {
    return (
        <div className="min-h-screen relative">
            <TensorBackground />

            <div className="relative z-10 px-8 py-16 max-w-6xl mx-auto">
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-16"
                >
                    <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-3">
                        Conjecture
                    </h1>
                    <p className="text-text-muted text-lg tracking-wide">
                        View Abstractions
                    </p>
                </motion.header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {visualizations.map((viz, index) => (
                        <motion.div
                            key={viz.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Link to={viz.to} className="group block">
                                <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                                    <div className="absolute top-4 right-4 text-3xl font-mono text-white/10 group-hover:text-white/20 transition-colors">
                                        {viz.symbol}
                                    </div>

                                    <h3 className="text-xl font-medium mb-2 group-hover:text-white transition-colors">
                                        {viz.title}
                                    </h3>

                                    <p className="text-text-muted text-sm leading-relaxed">
                                        {viz.description}
                                    </p>

                                    <div className="mt-4 flex items-center text-text-dim text-xs group-hover:text-text-muted transition-colors">
                                        <span>Explore</span>
                                        <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>

                                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{
                                        background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.03), transparent 40%)'
                                    }} />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-20 text-center text-text-dim text-xs tracking-wider"
                >
                    Interactive mathematical explorations
                </motion.footer>
            </div>
        </div>
    )
}
