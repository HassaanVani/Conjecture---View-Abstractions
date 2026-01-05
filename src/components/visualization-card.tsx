import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface VisualizationCardProps {
    title: string
    description: string
    to: string
    icon: ReactNode
    accentColor: 'blue' | 'purple' | 'gold' | 'teal' | 'pink' | 'orange'
    index: number
}

const accentStyles = {
    blue: 'from-accent-blue/20 to-accent-blue/5 hover:border-accent-blue/50 group-hover:text-accent-blue',
    purple: 'from-accent-purple/20 to-accent-purple/5 hover:border-accent-purple/50 group-hover:text-accent-purple',
    gold: 'from-accent-gold/20 to-accent-gold/5 hover:border-accent-gold/50 group-hover:text-accent-gold',
    teal: 'from-accent-teal/20 to-accent-teal/5 hover:border-accent-teal/50 group-hover:text-accent-teal',
    pink: 'from-accent-pink/20 to-accent-pink/5 hover:border-accent-pink/50 group-hover:text-accent-pink',
    orange: 'from-accent-orange/20 to-accent-orange/5 hover:border-accent-orange/50 group-hover:text-accent-orange',
}

const glowStyles = {
    blue: 'hover:shadow-[0_0_30px_rgba(88,166,255,0.2)]',
    purple: 'hover:shadow-[0_0_30px_rgba(188,140,255,0.2)]',
    gold: 'hover:shadow-[0_0_30px_rgba(227,179,65,0.2)]',
    teal: 'hover:shadow-[0_0_30px_rgba(63,185,80,0.2)]',
    pink: 'hover:shadow-[0_0_30px_rgba(247,120,186,0.2)]',
    orange: 'hover:shadow-[0_0_30px_rgba(240,136,62,0.2)]',
}

export default function VisualizationCard({ title, description, to, icon, accentColor, index }: VisualizationCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <Link to={to} className="group block">
                <div className={cn(
                    'relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br transition-all duration-300',
                    accentStyles[accentColor],
                    glowStyles[accentColor]
                )}>
                    <div className="p-6">
                        <div className={cn(
                            'w-14 h-14 rounded-xl bg-bg-tertiary flex items-center justify-center mb-4 transition-colors duration-300',
                            `group-hover:bg-${accentColor === 'blue' ? 'accent-blue' : accentColor === 'purple' ? 'accent-purple' : accentColor === 'gold' ? 'accent-gold' : accentColor === 'teal' ? 'accent-teal' : accentColor === 'pink' ? 'accent-pink' : 'accent-orange'}/20`
                        )}>
                            <span className={cn('text-2xl transition-colors duration-300', accentStyles[accentColor])}>
                                {icon}
                            </span>
                        </div>

                        <h3 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-gradient transition-all duration-300">
                            {title}
                        </h3>

                        <p className="text-text-secondary text-sm leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                </div>
            </Link>
        </motion.div>
    )
}
