import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Visualization error:', error, info.componentStack)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div className="min-h-screen flex items-center justify-center bg-bg">
                    <div className="bg-bg-elevated rounded-[--radius-lg] shadow-[--shadow-md] p-8 max-w-md text-center space-y-4">
                        <div className="text-2xl font-medium text-text">Something broke</div>
                        <p className="text-text-secondary text-sm">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null })
                                window.location.href = '/'
                            }}
                            className="btn-primary text-sm"
                        >
                            Back to Hub
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
