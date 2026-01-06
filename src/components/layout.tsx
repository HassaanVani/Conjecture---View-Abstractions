import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation()
    const isSimulation = location.pathname !== '/'

    return (
        <div className="min-h-screen bg-bg">
            {isSimulation && (
                <header className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-sm border-b border-border">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <span className="text-lg font-medium">Conjecture</span>
                            <span className="text-xs text-text-dim tracking-wider">View Abstractions</span>
                        </Link>

                        <Link
                            to="/"
                            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Exit
                        </Link>
                    </div>
                </header>
            )}

            <motion.main
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={isSimulation ? 'pt-16' : ''}
            >
                {children}
            </motion.main>
        </div>
    )
}
