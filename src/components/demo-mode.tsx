import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface DemoStep {
    title: string
    description: string
    setup?: () => void
    highlight?: string
}

interface DemoModeProps {
    steps: DemoStep[]
    currentStep: number
    isOpen: boolean
    onClose: () => void
    onNext: () => void
    onPrev: () => void
    onGoToStep: (step: number) => void
    departmentColor?: string
    className?: string
    title?: string
}

export function DemoMode({
    steps,
    currentStep,
    isOpen,
    onClose,
    onNext,
    onPrev,
    onGoToStep,
    departmentColor = 'rgb(160, 100, 255)',
    className,
    title = 'AP Tutorial',
}: DemoModeProps) {
    if (!isOpen) return null

    const step = steps[currentStep]
    const isFirst = currentStep === 0
    const isLast = currentStep === steps.length - 1

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className={cn(
                    'glass max-w-md w-full shadow-2xl shadow-black/30',
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                        <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md tracking-wider uppercase"
                            style={{
                                backgroundColor: `color-mix(in srgb, ${departmentColor} 15%, transparent)`,
                                color: departmentColor,
                            }}
                        >
                            {title}
                        </span>
                        <span className="text-text-dim text-xs tabular-nums">
                            {currentStep + 1}/{steps.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-dim hover:text-text-secondary transition-colors p-1 rounded-md hover:bg-white/5"
                        aria-label="Close tutorial"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Progress */}
                <div className="flex gap-0.5 px-5 mb-4">
                    {steps.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onGoToStep(i)}
                            className="flex-1 h-1 rounded-full transition-colors cursor-pointer hover:opacity-80"
                            style={{
                                backgroundColor: i <= currentStep ? departmentColor : 'rgba(255,255,255,0.08)',
                            }}
                            aria-label={`Go to step ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="px-5 pb-2">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.15 }}
                        >
                            <h3 className="text-base font-medium text-white mb-1.5">{step.title}</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">{step.description}</p>
                            {step.highlight && (
                                <p className="mt-2 text-[11px] italic" style={{ color: departmentColor }}>
                                    {step.highlight}
                                </p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between px-5 pb-4 pt-3">
                    <button
                        onClick={onPrev}
                        disabled={isFirst}
                        className={cn(
                            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                            isFirst
                                ? 'text-text-dim cursor-not-allowed'
                                : 'text-text-muted hover:text-text hover:bg-white/5'
                        )}
                    >
                        Prev
                    </button>

                    <button
                        onClick={isLast ? onClose : onNext}
                        className="px-5 py-1.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                            backgroundColor: `color-mix(in srgb, ${departmentColor} 20%, transparent)`,
                            color: departmentColor,
                        }}
                    >
                        {isLast ? 'Finish' : 'Next'}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

export function useDemoMode(steps: DemoStep[]) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    const open = () => {
        setCurrentStep(0)
        setIsOpen(true)
        steps[0]?.setup?.()
    }

    const close = () => setIsOpen(false)

    const next = () => {
        if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1
            setCurrentStep(nextStep)
            steps[nextStep]?.setup?.()
        }
    }

    const prev = () => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1
            setCurrentStep(prevStep)
            steps[prevStep]?.setup?.()
        }
    }

    const goToStep = (step: number) => {
        if (step >= 0 && step < steps.length) {
            setCurrentStep(step)
            steps[step]?.setup?.()
        }
    }

    return { isOpen, currentStep, open, close, next, prev, goToStep }
}
