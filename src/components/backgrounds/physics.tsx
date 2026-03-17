import { useEffect, useRef } from 'react'

interface BackgroundProps {
    className?: string
}

export function PhysicsBackground({ className = '' }: BackgroundProps) {
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
        const sources = [
            { x: 0.25, y: 0.4 },
            { x: 0.75, y: 0.6 },
        ]

        const animate = () => {
            frame++
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const time = frame * 0.03
            const wavelength = 40

            for (let x = 0; x < canvas.width; x += 8) {
                for (let y = 0; y < canvas.height; y += 8) {
                    let amplitude = 0
                    for (const source of sources) {
                        const sx = source.x * canvas.width
                        const sy = source.y * canvas.height
                        const dist = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2)
                        amplitude += Math.sin((dist / wavelength) * Math.PI * 2 - time)
                    }
                    amplitude /= sources.length

                    const intensity = (amplitude + 1) / 2
                    const alpha = intensity * 0.03
                    ctx.fillStyle = `rgba(160, 100, 255, ${alpha})`
                    ctx.fillRect(x, y, 6, 6)
                }
            }

            for (const source of sources) {
                const pulse = Math.sin(time * 2) * 0.3 + 0.7
                ctx.fillStyle = `rgba(200, 150, 255, ${0.05 * pulse})`
                ctx.beginPath()
                ctx.arc(source.x * canvas.width, source.y * canvas.height, 8, 0, Math.PI * 2)
                ctx.fill()
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
