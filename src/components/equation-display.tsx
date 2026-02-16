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
            className={cn(
                'backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl overflow-hidden',
                className
            )}
        >
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium hover:bg-white/5 transition-colors"
                style={{ color: departmentColor }}
            >
                <span className="flex items-center gap-2">
                    <span className="opacity-60">f(x)</span>
                    {title}
                </span>
                <svg
                    className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`}
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
                        <div className="px-4 pb-3 space-y-2.5">
                            {equations.map((eq, i) => (
                                <div key={i} className="space-y-0.5">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-white/40 text-xs min-w-fit">{eq.label}</span>
                                        <span
                                            className="font-mono text-sm tracking-wide"
                                            style={{ color: departmentColor }}
                                        >
                                            {eq.expression}
                                        </span>
                                    </div>
                                    {eq.description && (
                                        <p className="text-white/30 text-xs pl-0">{eq.description}</p>
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
