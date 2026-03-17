import { useEffect, useRef } from 'react'

interface BackgroundProps {
    className?: string
}

export function CalculusBackground({ className = '' }: BackgroundProps) {
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

            const time = frame * 0.008

            const curves = [
                { freq: 0.008, amp: 0.15, phase: 0, speed: 1 },
                { freq: 0.012, amp: 0.1, phase: 2, speed: 0.7 },
                { freq: 0.006, amp: 0.2, phase: 4, speed: 1.3 },
            ]

            for (const curve of curves) {
                ctx.strokeStyle = `rgba(180, 120, 255, 0.06)`
                ctx.lineWidth = 2
                ctx.beginPath()
                for (let x = 0; x < canvas.width; x += 3) {
                    const y = canvas.height * (0.5 +
                        Math.sin(x * curve.freq + time * curve.speed + curve.phase) * curve.amp +
                        Math.sin(x * curve.freq * 2.5 + time * curve.speed * 0.6) * curve.amp * 0.3
                    )
                    if (x === 0) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                }
                ctx.stroke()

                if (curve === curves[0]) {
                    const shadeStart = (canvas.width * 0.3 + Math.sin(time * 0.5) * canvas.width * 0.1)
                    const shadeEnd = shadeStart + canvas.width * 0.2

                    ctx.fillStyle = `rgba(180, 120, 255, 0.02)`
                    ctx.beginPath()
                    ctx.moveTo(shadeStart, canvas.height * 0.5)

                    for (let x = shadeStart; x <= shadeEnd; x += 3) {
                        const y = canvas.height * (0.5 +
                            Math.sin(x * curve.freq + time * curve.speed + curve.phase) * curve.amp +
                            Math.sin(x * curve.freq * 2.5 + time * curve.speed * 0.6) * curve.amp * 0.3
                        )
                        ctx.lineTo(x, y)
                    }
                    ctx.lineTo(shadeEnd, canvas.height * 0.5)
                    ctx.closePath()
                    ctx.fill()
                }
            }

            for (let i = 0; i < 5; i++) {
                const px = ((i * 251 + frame * 0.4) % (canvas.width + 200)) - 100
                const py = canvas.height * (0.5 +
                    Math.sin(px * 0.008 + time + 0) * 0.15 +
                    Math.sin(px * 0.02 + time * 0.6) * 0.045
                )
                const slope = 0.15 * 0.008 * Math.cos(px * 0.008 + time) +
                    0.045 * 0.02 * Math.cos(px * 0.02 + time * 0.6)

                const tangentLen = 40
                ctx.strokeStyle = `rgba(140, 200, 255, 0.08)`
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(px - tangentLen, py - slope * tangentLen * canvas.height)
                ctx.lineTo(px + tangentLen, py + slope * tangentLen * canvas.height)
                ctx.stroke()

                ctx.fillStyle = `rgba(180, 120, 255, 0.12)`
                ctx.beginPath()
                ctx.arc(px, py, 3, 0, Math.PI * 2)
                ctx.fill()
            }

            ctx.font = '14px serif'
            ctx.fillStyle = 'rgba(180, 120, 255, 0.05)'
            const symbols = ['\u222B', 'dx', "f'", '\u2202', 'lim', '\u221E', '\u03A3', '\u03B4', '\u03B5', 'dy']
            for (let i = 0; i < 10; i++) {
                const sx = ((i * 127 + frame * 0.25) % (canvas.width + 50)) - 25
                const sy = ((i * 83 + Math.sin(frame * 0.009 + i) * 40) % canvas.height)
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
