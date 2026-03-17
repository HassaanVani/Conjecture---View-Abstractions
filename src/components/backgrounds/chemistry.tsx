import { useEffect, useRef } from 'react'

interface BackgroundProps {
    className?: string
}

export function ChemistryBackground({ className = '' }: BackgroundProps) {
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

        const molecules = Array.from({ length: 8 }, (_, i) => ({
            x: (i % 4) * 0.25 + 0.125,
            y: Math.floor(i / 4) * 0.5 + 0.25,
            phase: i * 0.7,
        }))

        const animate = () => {
            frame++
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const time = frame * 0.01

            for (const mol of molecules) {
                const cx = mol.x * canvas.width
                const cy = mol.y * canvas.height

                for (let orbit = 1; orbit <= 3; orbit++) {
                    const radius = 30 + orbit * 25
                    const alpha = 0.03 + Math.sin(time + mol.phase + orbit) * 0.015

                    ctx.strokeStyle = `rgba(255, 160, 80, ${alpha})`
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.ellipse(
                        cx, cy,
                        radius * (1 + Math.sin(time * 0.5 + orbit) * 0.1),
                        radius * 0.4 * (1 + Math.cos(time * 0.3 + orbit) * 0.1),
                        time * 0.2 + orbit * 0.5,
                        0, Math.PI * 2
                    )
                    ctx.stroke()
                }

                ctx.fillStyle = `rgba(255, 180, 100, 0.08)`
                ctx.beginPath()
                ctx.arc(cx, cy, 5, 0, Math.PI * 2)
                ctx.fill()
            }

            ctx.strokeStyle = 'rgba(255, 160, 80, 0.04)'
            ctx.lineWidth = 2
            for (let i = 0; i < molecules.length; i++) {
                for (let j = i + 1; j < molecules.length; j++) {
                    const m1 = molecules[i]
                    const m2 = molecules[j]
                    const dx = (m2.x - m1.x) * canvas.width
                    const dy = (m2.y - m1.y) * canvas.height
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 300) {
                        ctx.beginPath()
                        ctx.moveTo(m1.x * canvas.width, m1.y * canvas.height)
                        ctx.lineTo(m2.x * canvas.width, m2.y * canvas.height)
                        ctx.stroke()
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
