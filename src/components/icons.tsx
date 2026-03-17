import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const defaults: IconProps = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
}

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
    return <svg {...defaults} {...props}>{children}</svg>
}

// --- Department icons ---

export function AtomIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="2" />
            <ellipse cx="12" cy="12" rx="10" ry="4" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        </Icon>
    )
}

export function FunctionIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M9 22c1.5 0 2.5-1 3-3l4-12c.5-2 1.5-3 3-3" />
            <path d="M5 12h10" />
        </Icon>
    )
}

export function DnaIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M2 15c6.667-6 13.333 0 20-6" />
            <path d="M9 22c0-3.5 2-6 5-8" />
            <path d="M15 2c0 3.5-2 6-5 8" />
            <path d="M2 9c6.667 6 13.333 0 20 6" />
            <path d="M6.5 12.5l1-1" />
            <path d="M16.5 12.5l1-1" />
            <path d="M11.5 7.5l1-1" />
        </Icon>
    )
}

export function FlaskIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M9 3h6" />
            <path d="M10 3v7.4a2 2 0 01-.5 1.3L4 19a2 2 0 001.5 3h13a2 2 0 001.5-3l-5.5-7.3a2 2 0 01-.5-1.3V3" />
            <path d="M8.5 14h7" />
        </Icon>
    )
}

export function BinaryIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M7 4v4h2" />
            <path d="M17 4h-2v4h2" />
            <rect x="5" y="14" width="4" height="6" rx="1" />
            <path d="M17 14v6" />
            <path d="M15 16h4" />
        </Icon>
    )
}

export function TrendingUpIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </Icon>
    )
}

export function IntegralIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M11.5 3c-1.5 0-2.5 1-3 3l-2 12c-.5 2-1.5 3-3 3" />
            <path d="M20.5 3c-1.5 0-2.5 1-3 3l-2 12c-.5 2-1.5 3-3 3" />
        </Icon>
    )
}

export function SigmaIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M18 7V4H6l6 8-6 8h12v-3" />
        </Icon>
    )
}

// --- Utility icons ---

export function ArrowLeftIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
        </Icon>
    )
}

export function ArrowRightIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
        </Icon>
    )
}

export function ChevronDownIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M6 9l6 6 6-6" />
        </Icon>
    )
}

export function ChevronRightIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M9 18l6-6-6-6" />
        </Icon>
    )
}

export function XIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
        </Icon>
    )
}

export function PlayIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
        </Icon>
    )
}

export function PauseIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
            <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
        </Icon>
    )
}

export function RotateCcwIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
        </Icon>
    )
}
