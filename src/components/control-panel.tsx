import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ControlPanelProps {
    children: ReactNode
    className?: string
}

export function ControlPanel({ children, className }: ControlPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className={cn('glass p-5 space-y-3', className)}
        >
            {children}
        </motion.div>
    )
}

interface ControlGroupProps {
    label: string
    children: ReactNode
}

export function ControlGroup({ label, children }: ControlGroupProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs text-text-secondary font-medium uppercase tracking-wider">{label}</label>
            {children}
        </div>
    )
}

interface NumberInputProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    placeholder?: string
    className?: string
}

export function NumberInput({ value, onChange, min = 1, max = 1000000, placeholder, className }: NumberInputProps) {
    return (
        <input
            type="number"
            value={value}
            onChange={e => onChange(Math.min(max, Math.max(min, parseInt(e.target.value) || min)))}
            min={min}
            max={max}
            placeholder={placeholder}
            className={cn('control-input w-full text-sm', className)}
        />
    )
}

interface SliderProps {
    value: number
    onChange: (value: number) => void
    min: number
    max: number
    step?: number
    label?: string
}

export function Slider({ value, onChange, min, max, step = 1, label }: SliderProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <div className="flex justify-between items-baseline">
                    <span className="text-xs text-text-secondary">{label}</span>
                    <span className="text-xs text-text font-mono tabular-nums">{value}</span>
                </div>
            )}
            <input
                type="range"
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
            />
        </div>
    )
}

interface ButtonProps {
    onClick: () => void
    children: ReactNode
    variant?: 'primary' | 'secondary'
    disabled?: boolean
    className?: string
}

export function Button({ onClick, children, variant = 'primary', disabled, className }: ButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                variant === 'primary' ? 'btn-primary' : 'btn-secondary',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
                className
            )}
        >
            {children}
        </button>
    )
}

interface ToggleProps {
    value: boolean
    onChange: (value: boolean) => void
    label?: string
    className?: string
}

export function Toggle({ value, onChange, label, className }: ToggleProps) {
    return (
        <div className={cn('flex items-center justify-between gap-3', className)}>
            {label && <span className="text-xs text-text-secondary">{label}</span>}
            <button
                role="switch"
                aria-checked={value}
                aria-label={label}
                onClick={() => onChange(!value)}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!value) } }}
                className={cn(
                    'relative w-10 h-5.5 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-white/40 focus-visible:outline-offset-2',
                    value ? 'bg-white/30' : 'bg-white/10'
                )}
                style={{ width: 40, height: 22 }}
            >
                <span
                    className={cn(
                        'absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200',
                        value ? 'translate-x-[18px]' : 'translate-x-0'
                    )}
                />
            </button>
        </div>
    )
}

interface SelectOption {
    value: string
    label: string
}

interface SelectProps {
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
    label?: string
    className?: string
}

export function Select({ value, onChange, options, label, className }: SelectProps) {
    return (
        <div className={cn('space-y-1.5', className)}>
            {label && <span className="text-xs text-text-secondary block uppercase tracking-wider">{label}</span>}
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-border-hover focus:ring-1 focus:ring-white/10 transition-colors appearance-none cursor-pointer"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                }}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}

interface ButtonGroupOption {
    value: string
    label: string
}

interface ButtonGroupProps {
    value: string
    onChange: (value: string) => void
    options: ButtonGroupOption[]
    label?: string
    className?: string
    color?: string
}

export function ButtonGroup({ value, onChange, options, label, className, color }: ButtonGroupProps) {
    return (
        <div className={cn('space-y-1.5', className)}>
            {label && <span className="text-xs text-text-secondary block uppercase tracking-wider">{label}</span>}
            <div className="flex rounded-lg overflow-hidden border border-border">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'flex-1 px-3 py-1.5 text-xs font-medium transition-all duration-150',
                            value === opt.value
                                ? 'text-white'
                                : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
                        )}
                        style={value === opt.value ? {
                            backgroundColor: color ? `color-mix(in srgb, ${color} 20%, transparent)` : 'rgba(255,255,255,0.12)',
                            color: color || 'white',
                        } : undefined}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
