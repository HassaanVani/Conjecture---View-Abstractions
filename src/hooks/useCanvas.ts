import { useEffect, useRef, useCallback } from 'react'
import type { DependencyList, RefObject } from 'react'

type DrawFunction = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dt: number
) => void

interface UseCanvasOptions {
    /** Whether to run the animation loop. Default true. */
    animate?: boolean
    /** Background color to clear with each frame. If null, no clearing is done. */
    clearColor?: string | null
}

export function useCanvas(
    draw: DrawFunction,
    deps: DependencyList,
    options: UseCanvasOptions = {}
): RefObject<HTMLCanvasElement | null> {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const animFrameRef = useRef<number>(0)
    const lastTimeRef = useRef<number>(0)

    const { animate = true, clearColor = null } = options

    const drawRef = useRef(draw)
    drawRef.current = draw

    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return null

        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr

        ctx.scale(dpr, dpr)

        return { ctx, width: rect.width, height: rect.height }
    }, [])

    useEffect(() => {
        const result = setupCanvas()
        if (!result) return

        const { ctx, width: initialWidth, height: initialHeight } = result
        let width = initialWidth
        let height = initialHeight

        const handleResize = () => {
            const canvas = canvasRef.current
            if (!canvas) return

            const dpr = window.devicePixelRatio || 1
            const rect = canvas.getBoundingClientRect()

            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr

            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.scale(dpr, dpr)

            width = rect.width
            height = rect.height
        }

        window.addEventListener('resize', handleResize)

        if (animate) {
            lastTimeRef.current = performance.now()

            const loop = (timestamp: number) => {
                const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05) // cap at 50ms
                lastTimeRef.current = timestamp

                if (clearColor) {
                    ctx.fillStyle = clearColor
                    ctx.fillRect(0, 0, width, height)
                } else if (clearColor === null) {
                    ctx.clearRect(0, 0, width, height)
                }

                drawRef.current(ctx, width, height, dt)
                animFrameRef.current = requestAnimationFrame(loop)
            }

            animFrameRef.current = requestAnimationFrame(loop)
        } else {
            drawRef.current(ctx, width, height, 0)
        }

        return () => {
            window.removeEventListener('resize', handleResize)
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return canvasRef
}
