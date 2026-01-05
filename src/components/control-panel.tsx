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
