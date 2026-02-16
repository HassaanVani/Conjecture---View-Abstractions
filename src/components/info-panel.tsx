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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={cn(
                'backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl px-4 py-3',
                className
            )}
        >
            {title && (
                <h3
                    className="text-xs font-medium mb-2 tracking-wider uppercase"
                    style={{ color: departmentColor }}
                >
                    {title}
                </h3>
            )}
            <div className="space-y-1.5">
                {items.map((item, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-4">
                        <span className="text-white/40 text-xs whitespace-nowrap">{item.label}</span>
                        <span className="font-mono text-sm" style={{ color: item.color || 'white' }}>
                            {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
                            {item.unit && (
                                <span className="text-white/30 text-xs ml-1">{item.unit}</span>
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
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                'bg-white/5 border border-white/10',
                className
            )}
            style={{ color }}
        >
            <span className="opacity-60">AP</span>
            <span>{course}</span>
            {unit && (
                <>
                    <span className="opacity-30">|</span>
                    <span className="opacity-70">{unit}</span>
                </>
            )}
        </div>
    )
}
