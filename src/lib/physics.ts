// Shared physics utilities for visualization rendering

export interface Vec2 {
    x: number
    y: number
}

export function vec2(x: number, y: number): Vec2 { return { x, y } }
export function vec2Zero(): Vec2 { return { x: 0, y: 0 } }
export function vec2FromAngle(angle: number, magnitude: number = 1): Vec2 {
    return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude }
}
export function vec2Add(a: Vec2, b: Vec2): Vec2 { return { x: a.x + b.x, y: a.y + b.y } }
export function vec2Sub(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y } }
export function vec2Scale(v: Vec2, s: number): Vec2 { return { x: v.x * s, y: v.y * s } }
export function vec2Mag(v: Vec2): number { return Math.sqrt(v.x * v.x + v.y * v.y) }
export function vec2Normalize(v: Vec2): Vec2 {
    const m = vec2Mag(v)
    return m === 0 ? vec2Zero() : vec2Scale(v, 1 / m)
}
export function vec2Dot(a: Vec2, b: Vec2): number { return a.x * b.x + a.y * b.y }
export function vec2Cross(a: Vec2, b: Vec2): number { return a.x * b.y - a.y * b.x }
export function vec2Rotate(v: Vec2, angle: number): Vec2 {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos }
}

// Coordinate transforms
export function toCanvasCoords(
    x: number, y: number,
    origin: { x: number; y: number },
    scale: number
): { cx: number; cy: number } {
    return {
        cx: origin.x + x * scale,
        cy: origin.y - y * scale, // y is flipped in canvas
    }
}

export function fromCanvasCoords(
    cx: number, cy: number,
    origin: { x: number; y: number },
    scale: number
): { x: number; y: number } {
    return {
        x: (cx - origin.x) / scale,
        y: (origin.y - cy) / scale,
    }
}

// Drawing utilities
export function drawArrow(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    color: string,
    headSize: number = 10,
    lineWidth: number = 2
) {
    const dx = x2 - x1
    const dy = y2 - y1
    const angle = Math.atan2(dy, dx)

    ctx.save()
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = lineWidth

    // Shaft
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    // Arrowhead
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(
        x2 - headSize * Math.cos(angle - Math.PI / 6),
        y2 - headSize * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
        x2 - headSize * Math.cos(angle + Math.PI / 6),
        y2 - headSize * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()

    ctx.restore()
}

export function drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number, height: number,
    spacing: number,
    color: string = 'rgba(255, 255, 255, 0.05)'
) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 1

    for (let x = 0; x <= width; x += spacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
    }

    for (let y = 0; y <= height; y += spacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
    }

    ctx.restore()
}

export function drawAxes(
    ctx: CanvasRenderingContext2D,
    originX: number, originY: number,
    width: number, height: number,
    labels?: { x?: string; y?: string },
    color: string = 'rgba(255, 255, 255, 0.3)'
) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 1.5
    ctx.font = '12px Inter, system-ui, sans-serif'

    // X axis
    ctx.beginPath()
    ctx.moveTo(0, originY)
    ctx.lineTo(width, originY)
    ctx.stroke()

    // Y axis
    ctx.beginPath()
    ctx.moveTo(originX, 0)
    ctx.lineTo(originX, height)
    ctx.stroke()

    // Labels
    if (labels?.x) {
        ctx.textAlign = 'right'
        ctx.fillText(labels.x, width - 10, originY - 10)
    }
    if (labels?.y) {
        ctx.textAlign = 'left'
        ctx.fillText(labels.y, originX + 10, 20)
    }

    ctx.restore()
}

export function drawDashedLine(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    color: string,
    lineWidth: number = 1,
    dashPattern: number[] = [5, 5]
) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.setLineDash(dashPattern)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
}

export function drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number, y: number,
    options: {
        fontSize?: number
        color?: string
        font?: string
        align?: CanvasTextAlign
        baseline?: CanvasTextBaseline
        bold?: boolean
    } = {}
) {
    const {
        fontSize = 14,
        color = 'rgba(255, 255, 255, 0.8)',
        font = 'Inter, system-ui, sans-serif',
        align = 'left',
        baseline = 'middle',
        bold = false,
    } = options

    ctx.save()
    ctx.fillStyle = color
    ctx.font = `${bold ? 'bold ' : ''}${fontSize}px ${font}`
    ctx.textAlign = align
    ctx.textBaseline = baseline
    ctx.fillText(text, x, y)
    ctx.restore()
}

// Runge-Kutta 4th order ODE integrator
// Solves dy/dt = f(t, y) where y can be a vector (array)
export function rungeKutta4(
    f: (t: number, y: number[]) => number[],
    t: number,
    y: number[],
    dt: number
): number[] {
    const n = y.length
    const k1 = f(t, y)

    const y2 = new Array(n)
    for (let i = 0; i < n; i++) y2[i] = y[i] + 0.5 * dt * k1[i]
    const k2 = f(t + 0.5 * dt, y2)

    const y3 = new Array(n)
    for (let i = 0; i < n; i++) y3[i] = y[i] + 0.5 * dt * k2[i]
    const k3 = f(t + 0.5 * dt, y3)

    const y4 = new Array(n)
    for (let i = 0; i < n; i++) y4[i] = y[i] + dt * k3[i]
    const k4 = f(t + dt, y4)

    const result = new Array(n)
    for (let i = 0; i < n; i++) {
        result[i] = y[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
    }
    return result
}

// Axis tick mark generation
export function generateTicks(min: number, max: number, targetCount: number = 5): number[] {
    const range = max - min
    const roughStep = range / targetCount
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
    const residual = roughStep / magnitude

    let step: number
    if (residual <= 1.5) step = 1 * magnitude
    else if (residual <= 3.5) step = 2 * magnitude
    else if (residual <= 7.5) step = 5 * magnitude
    else step = 10 * magnitude

    const ticks: number[] = []
    const start = Math.ceil(min / step) * step
    for (let v = start; v <= max; v += step) {
        ticks.push(Math.round(v * 1e10) / 1e10) // avoid floating point drift
    }
    return ticks
}

// Color utilities
export function rgba(r: number, g: number, b: number, a: number): string {
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 }
}

// Physics constants
export const CONSTANTS = {
    g: 9.81,           // m/s^2, gravitational acceleration
    G: 6.674e-11,      // N*m^2/kg^2, gravitational constant
    k_e: 8.988e9,      // N*m^2/C^2, Coulomb's constant
    epsilon_0: 8.854e-12, // F/m, permittivity of free space
    mu_0: 1.257e-6,    // T*m/A, permeability of free space
    c: 3e8,            // m/s, speed of light
    h: 6.626e-34,      // J*s, Planck's constant
    e: 1.602e-19,      // C, elementary charge
    m_e: 9.109e-31,    // kg, electron mass
    m_p: 1.673e-27,    // kg, proton mass
    k_B: 1.381e-23,    // J/K, Boltzmann constant
    R: 8.314,          // J/(mol*K), gas constant
    N_A: 6.022e23,     // 1/mol, Avogadro's number
} as const
