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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={cn('glass rounded-2xl p-6 space-y-4', className)}
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
        <div className="space-y-2">
            <label className="text-sm text-text-secondary font-medium">{label}</label>
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
            className={cn('control-input w-full', className)}
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
        <div className="space-y-2">
            {label && (
                <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{label}</span>
                    <span className="text-text-primary font-mono">{value}</span>
                </div>
            )}
            <input
                type="range"
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-blue"
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
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className
            )}
        >
            {children}
        </button>
    )
}

interface VisualizationContainerProps {
    children: ReactNode
    className?: string
}

export function VisualizationContainer({ children, className }: VisualizationContainerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={cn('glass rounded-2xl p-8 min-h-[500px] relative overflow-hidden', className)}
        >
            {children}
        </motion.div>
    )
}

// New components for Phase 0

interface ToggleProps {
    value: boolean
    onChange: (value: boolean) => void
    label?: string
    className?: string
}

export function Toggle({ value, onChange, label, className }: ToggleProps) {
    return (
        <div className={cn('flex items-center justify-between', className)}>
            {label && <span className="text-sm text-white/60">{label}</span>}
            <button
                onClick={() => onChange(!value)}
                className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200',
                    value ? 'bg-blue-500/60' : 'bg-white/10'
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200',
                        value ? 'translate-x-5' : 'translate-x-0'
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
        <div className={cn('space-y-2', className)}>
            {label && <span className="text-sm text-white/60 block">{label}</span>}
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
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
        <div className={cn('space-y-2', className)}>
            {label && <span className="text-sm text-white/60 block">{label}</span>}
            <div className="flex rounded-lg overflow-hidden border border-white/10">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'flex-1 px-3 py-2 text-xs font-medium transition-all duration-200',
                            value === opt.value
                                ? 'text-white'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                        )}
                        style={value === opt.value ? {
                            backgroundColor: color ? `${color}30` : 'rgba(255,255,255,0.15)',
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
