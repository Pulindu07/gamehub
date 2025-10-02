import { Component, type ErrorInfo, type ReactNode } from 'react';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-center p-8">
          <div className="text-2xl mb-4">😕 Something went wrong</div>
          <div className="text-gray-600 mb-6">
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={this.handleRetry}>
              🔄 Retry
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => window.location.reload()}
            >
              🔄 Reload Page
            </Button>
          </div>
          {import.meta.env.DEV && this.state.errorInfo && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">Stack trace</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}