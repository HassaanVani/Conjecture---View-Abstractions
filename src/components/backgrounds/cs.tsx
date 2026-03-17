import { useEffect, useRef } from 'react'

interface BackgroundProps {
    className?: string
}

export function CSBackground({ className = '' }: BackgroundProps) {
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

        const columns = Math.floor(canvas.width / 25)
        const drops: number[] = Array(columns).fill(0).map(() => Math.random() * -100)

        let frame = 0
        const animate = () => {
            frame++

            ctx.fillStyle = 'rgba(29, 29, 31, 0.05)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.font = '14px monospace'

            for (let i = 0; i < drops.length; i++) {
                const char = Math.random() > 0.5 ? '0' : '1'
                const x = i * 25
                const y = drops[i] * 20

                const alpha = 0.03 + Math.random() * 0.01
                ctx.fillStyle = `rgba(80, 200, 220, ${alpha})`
                ctx.fillText(char, x, y)

                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0
                }
                drops[i] += 0.5 + Math.random() * 0.5
            }

            if (frame % 3 === 0) {
                ctx.strokeStyle = 'rgba(80, 200, 220, 0.02)'
                ctx.lineWidth = 1
                const startX = Math.random() * canvas.width
                const startY = Math.random() * canvas.height
                ctx.beginPath()
                ctx.moveTo(startX, startY)
                let x = startX, y = startY
                for (let i = 0; i < 5; i++) {
                    if (Math.random() > 0.5) x += (Math.random() > 0.5 ? 1 : -1) * 40
                    else y += (Math.random() > 0.5 ? 1 : -1) * 40
                    ctx.lineTo(x, y)
                }
                ctx.stroke()
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
