import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import AnimatedBackground from './animated-background'

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation()
    const isHub = location.pathname === '/'

    return (
        <div className="min-h-screen relative overflow-hidden">
            <AnimatedBackground />

            <header className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                            <span className="text-xl">∑</span>
                        </div>
                        <span className="text-xl font-semibold text-text-primary group-hover:text-gradient transition-all">
                            MathViz
                        </span>
                    </Link>

                    {!isHub && (
                        <Link
                            to="/"
                            className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Hub
                        </Link>
                    )}
                </div>
            </header>

            <motion.main
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="pt-24 pb-12 px-6 min-h-screen relative z-10"
            >
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </motion.main>
        </div>
    )
}
