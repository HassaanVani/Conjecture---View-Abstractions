import { useEffect, useRef } from 'react'

interface BackgroundProps {
    className?: string
}

export function MathBackground({ className = '' }: BackgroundProps) {
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

            const gridSize = 60
            const time = frame * 0.008

            for (let x = 0; x < canvas.width + gridSize; x += gridSize) {
                for (let y = 0; y < canvas.height + gridSize; y += gridSize) {
                    const i = Math.floor(x / gridSize)
                    const j = Math.floor(y / gridSize)

                    const t1 = Math.sin(i * 0.3 + time) * Math.cos(j * 0.3 + time * 0.7)
                    const t2 = Math.sin(i * 0.15 + time * 1.3) * Math.cos(j * 0.2 + time * 0.5)
                    const tensorValue = (t1 + t2) / 2

                    const lineWidth = 1 + Math.abs(tensorValue) * 1.5
                    const alpha = Math.abs(tensorValue) * 0.04 + 0.01

                    ctx.strokeStyle = `rgba(100, 140, 255, ${alpha})`
                    ctx.lineWidth = lineWidth

                    const waveOffset = Math.sin(x * 0.01 + time * 2) * 3
                    ctx.beginPath()
                    ctx.moveTo(x, y + waveOffset)
                    ctx.lineTo(x + gridSize, y + waveOffset)
                    ctx.stroke()

                    const waveOffset2 = Math.cos(y * 0.01 + time * 1.5) * 3
                    ctx.beginPath()
                    ctx.moveTo(x + waveOffset2, y)
                    ctx.lineTo(x + waveOffset2, y + gridSize)
                    ctx.stroke()

                    if (Math.abs(tensorValue) > 0.6) {
                        const nodeSize = 2 + Math.abs(tensorValue) * 4
                        ctx.fillStyle = `rgba(100, 140, 255, ${Math.abs(tensorValue) * 0.03})`
                        ctx.beginPath()
                        ctx.arc(x, y, nodeSize, 0, Math.PI * 2)
                        ctx.fill()

                        ctx.strokeStyle = `rgba(150, 180, 255, ${Math.abs(tensorValue) * 0.02})`
                        ctx.lineWidth = 0.5
                        ctx.beginPath()
                        ctx.moveTo(x - 8, y)
                        ctx.lineTo(x + 8, y)
                        ctx.moveTo(x, y - 8)
                        ctx.lineTo(x, y + 8)
                        ctx.stroke()
                    }
                }
            }

            ctx.font = '12px monospace'
            ctx.fillStyle = 'rgba(100, 140, 255, 0.02)'
            const symbols = ['\u222B', '\u2211', '\u220F', '\u2202', '\u2207', '\u03C0', '\u221E', '\u03BB', '\u0394', '\u03A9']
            for (let i = 0; i < 15; i++) {
                const sx = ((i * 137 + frame * 0.3) % (canvas.width + 100)) - 50
                const sy = ((i * 89 + Math.sin(frame * 0.01 + i) * 50) % canvas.height)
                ctx.fillText(symbols[i % symbols.length], sx, sy)
            }

            requestAnimationFrame(animate)
        }

        const animId = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [])

    return <canvas ref={canvasRef} className={`fixed inset-0 pointer-events-none ${className}`} />
}
