import { useEffect, useRef } from 'react'

interface BackgroundProps {
    className?: string
}

// Math: Enhanced tensor grid with flowing mathematical patterns
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

            // Draw enhanced tensor grid
            for (let x = 0; x < canvas.width + gridSize; x += gridSize) {
                for (let y = 0; y < canvas.height + gridSize; y += gridSize) {
                    const i = Math.floor(x / gridSize)
                    const j = Math.floor(y / gridSize)

                    // Multi-frequency tensor field
                    const t1 = Math.sin(i * 0.3 + time) * Math.cos(j * 0.3 + time * 0.7)
                    const t2 = Math.sin(i * 0.15 + time * 1.3) * Math.cos(j * 0.2 + time * 0.5)
                    const tensorValue = (t1 + t2) / 2

                    // Dynamic line width based on tensor magnitude
                    const lineWidth = 1 + Math.abs(tensorValue) * 1.5
                    const alpha = Math.abs(tensorValue) * 0.2 + 0.03

                    ctx.strokeStyle = `rgba(100, 140, 255, ${alpha})`
                    ctx.lineWidth = lineWidth

                    // Horizontal lines with wave distortion
                    const waveOffset = Math.sin(x * 0.01 + time * 2) * 3
                    ctx.beginPath()
                    ctx.moveTo(x, y + waveOffset)
                    ctx.lineTo(x + gridSize, y + waveOffset)
                    ctx.stroke()

                    // Vertical lines with wave distortion
                    const waveOffset2 = Math.cos(y * 0.01 + time * 1.5) * 3
                    ctx.beginPath()
                    ctx.moveTo(x + waveOffset2, y)
                    ctx.lineTo(x + waveOffset2, y + gridSize)
                    ctx.stroke()

                    // Tensor magnitude nodes
                    if (Math.abs(tensorValue) > 0.6) {
                        const nodeSize = 2 + Math.abs(tensorValue) * 4
                        ctx.fillStyle = `rgba(100, 140, 255, ${Math.abs(tensorValue) * 0.15})`
                        ctx.beginPath()
                        ctx.arc(x, y, nodeSize, 0, Math.PI * 2)
                        ctx.fill()

                        // Cross pattern at high-tensor points
                        ctx.strokeStyle = `rgba(150, 180, 255, ${Math.abs(tensorValue) * 0.1})`
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

            // Flowing equation symbols overlay
            ctx.font = '12px monospace'
            ctx.fillStyle = 'rgba(100, 140, 255, 0.06)'
            const symbols = ['∫', '∑', '∏', '∂', '∇', 'π', '∞', 'λ', 'Δ', 'Ω']
            for (let i = 0; i < 15; i++) {
                const x = ((i * 137 + frame * 0.3) % (canvas.width + 100)) - 50
                const y = ((i * 89 + Math.sin(frame * 0.01 + i) * 50) % canvas.height)
                ctx.fillText(symbols[i % symbols.length], x, y)
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

// Physics: Wave interference and particle motion
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

            // Draw interference pattern
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
                    const alpha = intensity * 0.12
                    ctx.fillStyle = `rgba(160, 100, 255, ${alpha})`
                    ctx.fillRect(x, y, 6, 6)
                }
            }

            // Source points
            for (const source of sources) {
                const pulse = Math.sin(time * 2) * 0.3 + 0.7
                ctx.fillStyle = `rgba(200, 150, 255, ${0.3 * pulse})`
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

// Biology: Minimalist hexagonal cell structure pattern
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

            // Draw hexagonal grid (cell-like structure)
            for (let row = -1; row < canvas.height / hexHeight + 2; row++) {
                for (let col = -1; col < canvas.width / (hexSize * 1.5) + 2; col++) {
                    const x = col * hexSize * 1.5
                    const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2)

                    // Breathing animation
                    const breathe = Math.sin(time + col * 0.2 + row * 0.3) * 0.15 + 0.85
                    const alpha = 0.04 + Math.sin(time * 0.5 + col * 0.1 + row * 0.1) * 0.02

                    ctx.strokeStyle = `rgba(80, 200, 120, ${alpha})`
                    ctx.lineWidth = 1

                    // Draw hexagon
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

                    // Nucleus dot
                    if ((col + row) % 4 === 0) {
                        ctx.fillStyle = `rgba(80, 200, 120, ${0.06 + Math.sin(time + col) * 0.02})`
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

// Chemistry: Molecular orbital clouds and bonds
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

        // Fixed molecule positions
        const molecules = Array.from({ length: 8 }, (_, i) => ({
            x: (i % 4) * 0.25 + 0.125,
            y: Math.floor(i / 4) * 0.5 + 0.25,
            phase: i * 0.7,
        }))

        const animate = () => {
            frame++
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const time = frame * 0.01

            // Draw orbital clouds
            for (const mol of molecules) {
                const cx = mol.x * canvas.width
                const cy = mol.y * canvas.height

                // Electron orbitals
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

                // Nucleus
                ctx.fillStyle = `rgba(255, 180, 100, 0.08)`
                ctx.beginPath()
                ctx.arc(cx, cy, 5, 0, Math.PI * 2)
                ctx.fill()
            }

            // Draw bonds between nearby molecules
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

// Computer Science: Binary rain and circuit traces
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

        // Binary rain columns
        const columns = Math.floor(canvas.width / 25)
        const drops: number[] = Array(columns).fill(0).map(() => Math.random() * -100)

        let frame = 0
        const animate = () => {
            frame++

            // Fade effect
            ctx.fillStyle = 'rgba(10, 21, 24, 0.05)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.font = '14px monospace'

            for (let i = 0; i < drops.length; i++) {
                const char = Math.random() > 0.5 ? '0' : '1'
                const x = i * 25
                const y = drops[i] * 20

                // Gradient alpha based on position
                const alpha = 0.15 + Math.random() * 0.1
                ctx.fillStyle = `rgba(80, 200, 220, ${alpha})`
                ctx.fillText(char, x, y)

                // Reset or advance
                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0
                }
                drops[i] += 0.5 + Math.random() * 0.5
            }

            // Circuit traces
            if (frame % 3 === 0) {
                ctx.strokeStyle = 'rgba(80, 200, 220, 0.03)'
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

// Economics: Flowing trend lines and graph patterns
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

        // Generate trend lines
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

            // Draw grid
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

            // Draw trend lines
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

            // Floating currency symbols
            ctx.font = '16px serif'
            ctx.fillStyle = 'rgba(220, 180, 80, 0.04)'
            const symbols = ['$', '€', '£', '¥', '₿', '%', '↑', '↓']
            for (let i = 0; i < 12; i++) {
                const x = ((i * 97 + frame * 0.2) % (canvas.width + 50)) - 25
                const y = ((i * 71 + Math.sin(frame * 0.008 + i) * 30) % canvas.height)
                ctx.fillText(symbols[i % symbols.length], x, y)
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

export const departmentBackgrounds = {
    math: MathBackground,
    physics: PhysicsBackground,
    biology: BiologyBackground,
    chemistry: ChemistryBackground,
    cs: CSBackground,
    economics: EconomicsBackground,
}
