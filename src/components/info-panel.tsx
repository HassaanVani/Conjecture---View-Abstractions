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
            className={cn('rounded-[--radius-lg] shadow-[--shadow-sm] px-4 py-3 border border-white/[0.06]', className)}
            style={{
                background: 'rgba(44, 44, 46, 0.6)',
                backdropFilter: 'blur(16px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
            }}
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
                        <span className="font-mono text-xs tabular-nums" style={{ color: item.color || '#f5f5f7' }}>
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
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[--radius-md] text-[10px] font-semibold tracking-wide border border-white/[0.06]',
                className
            )}
            style={{
                color,
                background: 'rgba(58, 58, 60, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
            }}
        >
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
