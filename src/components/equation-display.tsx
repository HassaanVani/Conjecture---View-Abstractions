import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Equation {
    label: string
    expression: string
    description?: string
}

interface EquationDisplayProps {
    equations: Equation[]
    departmentColor?: string
    className?: string
    title?: string
    collapsed?: boolean
}

export function EquationDisplay({
    equations,
    departmentColor = 'rgb(160, 100, 255)',
    className,
    title = 'Equations',
    collapsed: initialCollapsed = false,
}: EquationDisplayProps) {
    const [collapsed, setCollapsed] = useState(initialCollapsed)

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className={cn('glass-subtle overflow-hidden', className)}
        >
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold tracking-wider uppercase hover:bg-white/5 transition-colors"
                style={{ color: departmentColor }}
            >
                <span className="flex items-center gap-2">
                    <span className="opacity-50 font-normal">f(x)</span>
                    {title}
                </span>
                <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {!collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-3 space-y-2">
                            {equations.map((eq, i) => (
                                <div key={i} className="space-y-0.5">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-text-muted text-[10px] min-w-fit uppercase tracking-wide">{eq.label}</span>
                                        <span
                                            className="font-mono text-xs tracking-wide"
                                            style={{ color: departmentColor }}
                                        >
                                            {eq.expression}
                                        </span>
                                    </div>
                                    {eq.description && (
                                        <p className="text-text-dim text-[10px] pl-0">{eq.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
