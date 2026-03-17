// Department colors — single source of truth
// These match the CSS custom properties in index.css

export const COLORS = {
    math: 'rgb(100, 140, 255)',
    physics: 'rgb(160, 100, 255)',
    biology: 'rgb(80, 200, 120)',
    chemistry: 'rgb(255, 160, 80)',
    cs: 'rgb(80, 200, 220)',
    economics: 'rgb(220, 180, 80)',
    calculus: 'rgb(180, 120, 255)',
} as const

export type Department = keyof typeof COLORS
