import { useEffect, useRef } from 'react'

interface BackgroundProps {
    className?: string
}

export function EconomicsBackground({ className = '' }: BackgroundProps) {
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

        const trends = Array.from({ length: 5 }, (_, i) => ({
            yBase: 0.2 + i * 0.15,
            speed: 0.5 + Math.random() * 0.5,
            amplitude: 0.05 + Math.random() * 0.1,
            frequency: 0.01 + Math.random() * 0.02,
            phase: Math.random() * Math.PI * 2,
        }))

        const animate = () => {
            frame++
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const time = frame * 0.01

            ctx.strokeStyle = 'rgba(220, 180, 80, 0.03)'
            ctx.lineWidth = 1
            for (let x = 0; x < canvas.width; x += 60) {
                ctx.beginPath()
                ctx.moveTo(x, 0)
                ctx.lineTo(x, canvas.height)
                ctx.stroke()
            }
            for (let y = 0; y < canvas.height; y += 60) {
                ctx.beginPath()
                ctx.moveTo(0, y)
                ctx.lineTo(canvas.width, y)
                ctx.stroke()
            }

            for (const trend of trends) {
                ctx.strokeStyle = `rgba(220, 180, 80, 0.08)`
                ctx.lineWidth = 2
                ctx.beginPath()

                for (let x = 0; x < canvas.width; x += 5) {
                    const y = canvas.height * (
                        trend.yBase +
                        Math.sin(x * trend.frequency + time * trend.speed + trend.phase) * trend.amplitude +
                        Math.sin(x * trend.frequency * 2.3 + time * trend.speed * 1.5) * trend.amplitude * 0.5
                    )
                    if (x === 0) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                }
                ctx.stroke()
            }

            ctx.font = '16px serif'
            ctx.fillStyle = 'rgba(220, 180, 80, 0.04)'
            const symbols = ['$', '\u20AC', '\u00A3', '\u00A5', '\u20BF', '%', '\u2191', '\u2193']
            for (let i = 0; i < 12; i++) {
                const sx = ((i * 97 + frame * 0.2) % (canvas.width + 50)) - 25
                const sy = ((i * 71 + Math.sin(frame * 0.008 + i) * 30) % canvas.height)
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
