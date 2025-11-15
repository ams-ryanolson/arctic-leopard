import { Component, type ErrorInfo, type ReactNode } from 'react';

export type BoundaryContext = {
    error: Error;
    timestamp: string;
    componentStack?: string;
    reset: () => void;
};

export type AppErrorBoundaryProps = {
    children: ReactNode;
    fallback: (context: BoundaryContext) => ReactNode;
    onError?: (error: Error, info: ErrorInfo) => void;
};

type AppErrorBoundaryState = {
    error: Error | null;
    componentStack?: string;
};

export default class AppErrorBoundary extends Component<
    AppErrorBoundaryProps,
    AppErrorBoundaryState
> {
    override state: AppErrorBoundaryState = {
        error: null,
        componentStack: undefined,
    };

    static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
        return { error, componentStack: undefined };
    }

    override componentDidCatch(error: Error, info: ErrorInfo): void {
        this.setState({ componentStack: info.componentStack });

        if (this.props.onError) {
            this.props.onError(error, info);
        } else {
            console.error('AppErrorBoundary captured an error', error, info);
        }
    }

    private reset = () => {
        this.setState({ error: null, componentStack: undefined });
    };

    override render(): ReactNode {
        const { error, componentStack } = this.state;

        if (error) {
            return this.props.fallback({
                error,
                componentStack,
                timestamp: new Date().toISOString(),
                reset: this.reset,
            });
        }

        return this.props.children;
    }
}







