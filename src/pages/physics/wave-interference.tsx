import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function WaveInterference() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(true)
    const [wavelength, setWavelength] = useState(30)
    const [frequency, setFrequency] = useState(2)
    const [sourceDistance, setSourceDistance] = useState(200)
    const [showSources, setShowSources] = useState(true)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        let frame = 0
        let animId: number

        const animate = () => {
            const width = canvas.offsetWidth
            const height = canvas.offsetHeight

            ctx.fillStyle = '#0d0a1a'
            ctx.fillRect(0, 0, width, height)

            if (isRunning) frame++

            const time = frame * 0.05 * frequency
            const centerY = height / 2
            const source1 = { x: width * 0.3, y: centerY - sourceDistance / 2 }
            const source2 = { x: width * 0.3, y: centerY + sourceDistance / 2 }

            // Draw interference pattern
            const resolution = 6
            for (let x = 0; x < width; x += resolution) {
                for (let y = 0; y < height; y += resolution) {
                    const d1 = Math.sqrt((x - source1.x) ** 2 + (y - source1.y) ** 2)
                    const d2 = Math.sqrt((x - source2.x) ** 2 + (y - source2.y) ** 2)

                    const wave1 = Math.sin((d1 / wavelength) * Math.PI * 2 - time)
                    const wave2 = Math.sin((d2 / wavelength) * Math.PI * 2 - time)

                    const amplitude = (wave1 + wave2) / 2
                    const intensity = (amplitude + 1) / 2

                    // Color based on constructive/destructive interference
                    const r = Math.floor(intensity * 160)
                    const g = Math.floor(intensity * 80 + (1 - intensity) * 40)
                    const b = Math.floor(intensity * 255)

                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.8})`
                    ctx.fillRect(x, y, resolution - 1, resolution - 1)
                }
            }

            // Draw source points
            if (showSources) {
                [source1, source2].forEach((source, i) => {
                    // Pulse animation
                    const pulse = Math.sin(time * 2) * 0.3 + 0.7

                    // Glow
                    const gradient = ctx.createRadialGradient(
                        source.x, source.y, 0,
                        source.x, source.y, 30
                    )
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 * pulse})`)
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
                    ctx.fillStyle = gradient
                    ctx.beginPath()
                    ctx.arc(source.x, source.y, 30, 0, Math.PI * 2)
                    ctx.fill()

                    // Core
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                    ctx.beginPath()
                    ctx.arc(source.x, source.y, 6, 0, Math.PI * 2)
                    ctx.fill()

                    // Label
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
                    ctx.font = '12px monospace'
                    ctx.fillText(`S${i + 1}`, source.x + 12, source.y + 4)
                })
            }

            // Legend
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.font = '11px sans-serif'
            ctx.fillText('Constructive', width - 100, 30)
            ctx.fillText('Destructive', width - 100, 50)

            ctx.fillStyle = 'rgba(160, 80, 255, 0.8)'
            ctx.fillRect(width - 115, 22, 10, 10)
            ctx.fillStyle = 'rgba(40, 40, 80, 0.8)'
            ctx.fillRect(width - 115, 42, 10, 10)

            animId = requestAnimationFrame(animate)
        }

        animId = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animId)
        }
    }, [isRunning, wavelength, frequency, sourceDistance, showSources])

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 relative">
                <canvas ref={canvasRef} className="w-full h-full" />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 text-xs text-text-dim max-w-xs"
                >
                    Two point sources emit waves that interfere — bright regions show constructive interference, dark regions show destructive interference
                </motion.div>
            </div>

            <div className="border-t border-border bg-bg-elevated px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className="btn-primary"
                        >
                            {isRunning ? 'Pause' : 'Play'}
                        </button>
                        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showSources}
                                onChange={e => setShowSources(e.target.checked)}
                                className="accent-accent-coral"
                            />
                            Show Sources
                        </label>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">λ</span>
                            <input
                                type="range"
                                min={15}
                                max={60}
                                value={wavelength}
                                onChange={e => setWavelength(+e.target.value)}
                                className="w-20 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono">{wavelength}px</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">f</span>
                            <input
                                type="range"
                                min={0.5}
                                max={5}
                                step={0.5}
                                value={frequency}
                                onChange={e => setFrequency(+e.target.value)}
                                className="w-20 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono">{frequency}Hz</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-text-dim text-sm">d</span>
                            <input
                                type="range"
                                min={50}
                                max={400}
                                value={sourceDistance}
                                onChange={e => setSourceDistance(+e.target.value)}
                                className="w-20 accent-text"
                            />
                            <span className="text-text-muted text-xs font-mono">{sourceDistance}px</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
