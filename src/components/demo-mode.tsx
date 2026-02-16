import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface DemoStep {
    title: string
    description: string
    /** Callback to configure the visualization for this step */
    setup?: () => void
    /** Optional highlight region or annotation hint */
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className={cn(
                    'backdrop-blur-xl bg-black/60 border border-white/15 rounded-2xl p-5 max-w-md w-full',
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span
                            className="text-xs font-medium px-2 py-0.5 rounded-md"
                            style={{
                                backgroundColor: `${departmentColor}20`,
                                color: departmentColor,
                            }}
                        >
                            {title}
                        </span>
                        <span className="text-white/30 text-xs">
                            {currentStep + 1} / {steps.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/30 hover:text-white/60 transition-colors p-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Progress bar */}
                <div className="flex gap-1 mb-4">
                    {steps.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onGoToStep(i)}
                            className="flex-1 h-1 rounded-full transition-colors cursor-pointer"
                            style={{
                                backgroundColor: i <= currentStep ? departmentColor : 'rgba(255,255,255,0.1)',
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h3 className="text-lg font-medium text-white mb-2">{step.title}</h3>
                        <p className="text-white/60 text-sm leading-relaxed">{step.description}</p>
                        {step.highlight && (
                            <p className="mt-2 text-xs italic" style={{ color: departmentColor }}>
                                {step.highlight}
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-5">
                    <button
                        onClick={onPrev}
                        disabled={isFirst}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            isFirst
                                ? 'text-white/20 cursor-not-allowed'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                        )}
                    >
                        Previous
                    </button>

                    {isLast ? (
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                                backgroundColor: `${departmentColor}30`,
                                color: departmentColor,
                            }}
                        >
                            Finish
                        </button>
                    ) : (
                        <button
                            onClick={onNext}
                            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                                backgroundColor: `${departmentColor}30`,
                                color: departmentColor,
                            }}
                        >
                            Next
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

/** Hook for managing demo mode state */
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
