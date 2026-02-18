import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // POLISHED: Could send to error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// POLISHED: Error fallback component
interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  return (
    <motion.div
      className="min-h-screen bg-[#0a1411] flex items-center justify-center p-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-md w-full text-center">
        <motion.div
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center"
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5, repeat: 2, repeatDelay: 1 }}
        >
          <span className="material-symbols-outlined text-3xl text-red-500">error</span>
        </motion.div>
        
        <h2 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h2>
        
        <p className="text-gray-400 mb-6">
          We encountered an unexpected error. Don't worry, your commute data is safe!
        </p>

        {error && (
          <motion.div
            className="bg-white/5 rounded-lg p-4 mb-6 text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-gray-500 font-mono break-all">
              {error.message}
            </p>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            onClick={() => window.location.reload()}
            className="bg-[#0fb880] hover:bg-[#0fb880]/90 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Refresh Page
          </motion.button>
          
          {onRetry && (
            <motion.button
              onClick={onRetry}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
          )}
          
          <motion.a
            href="/"
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Home
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}

// POLISHED: Network error component
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="material-symbols-outlined text-2xl text-yellow-500">wifi_off</span>
      </motion.div>
      
      <h3 className="text-lg font-semibold text-white mb-2">Connection Lost</h3>
      <p className="text-gray-400 text-sm mb-4">
        Unable to connect to our servers. Please check your internet connection.
      </p>
      
      {onRetry && (
        <motion.button
          onClick={onRetry}
          className="bg-[#0fb880] hover:bg-[#0fb880]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Retry Connection
        </motion.button>
      )}
    </motion.div>
  );
}

// POLISHED: Empty state component
interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-2xl text-gray-400">{icon}</span>
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-6 max-w-sm">{description}</p>
      
      {action && (
        <motion.button
          onClick={action.onClick}
          className="bg-[#0fb880] hover:bg-[#0fb880]/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
