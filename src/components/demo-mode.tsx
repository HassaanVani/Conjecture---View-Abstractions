import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { XIcon } from '@/components/icons'

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
    title = 'Tutorial',
}: DemoModeProps) {
    if (!isOpen) return null

    const step = steps[currentStep]
    const isFirst = currentStep === 0
    const isLast = currentStep === steps.length - 1

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.25 }}
                className={cn(
                    'bg-bg-elevated rounded-[--radius-lg] shadow-[--shadow-lg] max-w-md w-full',
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                        <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-[--radius-sm] tracking-wider uppercase bg-bg-tertiary"
                            style={{ color: departmentColor }}
                        >
                            {title}
                        </span>
                        <span className="text-text-dim text-xs tabular-nums">
                            {currentStep + 1}/{steps.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-dim hover:text-text-secondary transition-colors p-1 rounded-[--radius-sm] hover:bg-bg-tertiary"
                        aria-label="Close tutorial"
                    >
                        <XIcon className="w-4 h-4" />
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
                                backgroundColor: i <= currentStep ? departmentColor : 'rgba(255,255,255,0.06)',
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
                            <h3 className="text-base font-medium text-text mb-1.5">{step.title}</h3>
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
                            'px-4 py-1.5 rounded-[--radius-md] text-sm font-medium transition-all',
                            isFirst
                                ? 'text-text-dim cursor-not-allowed'
                                : 'text-text-muted hover:text-text hover:bg-bg-tertiary'
                        )}
                    >
                        Prev
                    </button>

                    <button
                        onClick={isLast ? onClose : onNext}
                        className="btn-secondary px-5 py-1.5 text-sm"
                        style={{ color: departmentColor }}
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
