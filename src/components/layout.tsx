import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ArrowLeftIcon } from '@/components/icons'

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation()
    const isHome = location.pathname === '/'
    const segments = location.pathname.split('/').filter(Boolean)
    const isSubjectHub = segments.length === 1
    const parentPath = isSubjectHub ? '/' : `/${segments[0]}`
    const parentLabel = isSubjectHub ? 'Home' : segments[0] ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) : 'Home'

    return (
        <div className="min-h-screen bg-bg">
            {!isHome && (
                <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(29, 29, 31, 0.7)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                            <span className="text-base font-medium tracking-tight">Conjecture</span>
                        </Link>

                        <Link
                            to={parentPath}
                            className="flex items-center gap-1.5 text-text-secondary hover:text-text transition-colors text-sm focus-visible:outline-2 focus-visible:outline-white/40 focus-visible:outline-offset-2 rounded-[--radius-md] px-2 py-1"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">{parentLabel}</span>
                        </Link>
                    </div>
                </header>
            )}

            <motion.main
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className={!isHome ? 'pt-14' : ''}
            >
                {children}
            </motion.main>
        </div>
    )
}
