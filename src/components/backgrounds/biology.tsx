import { useEffect, useRef } from 'react'

interface BackgroundProps {
    className?: string
}

export function BiologyBackground({ className = '' }: BackgroundProps) {
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

            const time = frame * 0.005
            const hexSize = 50
            const hexHeight = hexSize * Math.sqrt(3)

            for (let row = -1; row < canvas.height / hexHeight + 2; row++) {
                for (let col = -1; col < canvas.width / (hexSize * 1.5) + 2; col++) {
                    const x = col * hexSize * 1.5
                    const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2)

                    const breathe = Math.sin(time + col * 0.2 + row * 0.3) * 0.15 + 0.85
                    const alpha = 0.02 + Math.sin(time * 0.5 + col * 0.1 + row * 0.1) * 0.01

                    ctx.strokeStyle = `rgba(80, 200, 120, ${alpha})`
                    ctx.lineWidth = 1

                    ctx.beginPath()
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i - Math.PI / 6
                        const hx = x + (hexSize * breathe * 0.5) * Math.cos(angle)
                        const hy = y + (hexSize * breathe * 0.5) * Math.sin(angle)
                        if (i === 0) ctx.moveTo(hx, hy)
                        else ctx.lineTo(hx, hy)
                    }
                    ctx.closePath()
                    ctx.stroke()

                    if ((col + row) % 4 === 0) {
                        ctx.fillStyle = `rgba(80, 200, 120, ${0.02 + Math.sin(time + col) * 0.01})`
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

    return <canvas ref={canvasRef} className={`fixed inset-0 pointer-events-none ${className}`} />
}
