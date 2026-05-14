import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorIllustration } from '@/components/illustrations/ErrorIllustration';

interface Props {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <ErrorIllustration className="mb-6" />
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">Algo correu mal</h2>
          <p className="text-sm text-neutral-500 max-w-md mb-6">
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors duration-150"
          >
            Tentar novamente
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 text-left max-w-lg w-full">
              <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-600">
                Detalhes do erro (dev)
              </summary>
              <pre className="mt-2 rounded-lg bg-neutral-100 p-3 text-xs text-neutral-600 overflow-auto max-h-40 font-mono">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
