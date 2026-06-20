import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Something broke in this view.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('xoperator view error', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-[60dvh] items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={20} aria-hidden="true" />
            <h1 className="text-base font-semibold">This view hit an error.</h1>
          </div>
          <p className="text-sm text-red-800">{this.state.message}</p>
          <Button
            className="mt-4 border-red-800 bg-red-800 text-white hover:bg-red-900"
            onClick={() => this.setState({ hasError: false, message: '' })}
            icon={<RefreshCw size={16} aria-hidden="true" />}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }
}
