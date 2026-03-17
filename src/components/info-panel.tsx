import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface InfoItem {
    label: string
    value: string | number
    unit?: string
    color?: string
}

interface InfoPanelProps {
    items: InfoItem[]
    title?: string
    className?: string
    departmentColor?: string
}

export function InfoPanel({
    items,
    title,
    className,
    departmentColor = 'rgb(160, 100, 255)',
}: InfoPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={cn('glass-subtle px-4 py-3', className)}
        >
            {title && (
                <h3
                    className="text-[10px] font-semibold mb-2.5 tracking-widest uppercase"
                    style={{ color: departmentColor }}
                >
                    {title}
                </h3>
            )}
            <div className="space-y-1.5">
                {items.map((item, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-4">
                        <span className="text-text-muted text-xs whitespace-nowrap">{item.label}</span>
                        <span className="font-mono text-xs tabular-nums" style={{ color: item.color || 'white' }}>
                            {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
                            {item.unit && (
                                <span className="text-text-dim text-[10px] ml-1">{item.unit}</span>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}

interface APTagProps {
    course: string
    unit?: string
    className?: string
    color?: string
}

export function APTag({ course, unit, className, color = 'rgb(160, 100, 255)' }: APTagProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide',
                'bg-white/5 border border-border',
                className
            )}
            style={{ color }}
        >
            <span className="opacity-50">AP</span>
            <span>{course}</span>
            {unit && (
                <>
                    <span className="opacity-25">|</span>
                    <span className="opacity-60">{unit}</span>
                </>
            )}
        </div>
    )
}
