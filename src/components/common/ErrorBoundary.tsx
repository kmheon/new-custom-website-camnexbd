import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Report error to server log endpoint asynchronously
    try {
      fetch('/api/admin/system/error-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: this.props.sectionName || 'unknown',
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    } catch (_) {}
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  private handleCopy = async () => {
    const details = `Section: ${this.props.sectionName || 'Unknown'}\nError: ${this.state.error?.message || 'Unknown error'}\nStack: ${this.state.error?.stack || ''}\nComponent Stack: ${this.state.errorInfo?.componentStack || ''}`;
    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (_) {
      // Fallback
    }
  };

  public render() {
    if (this.state.hasError) {
      const sectionName = this.props.sectionName || 'This section';
      return (
        <div className="p-6 my-4 bg-slate-900 border border-red-800/60 rounded-xl text-slate-200 shadow-xl max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-700/80 flex items-center justify-center shrink-0 text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{sectionName} failed to load</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                An unexpected error occurred while rendering this module. Other parts of the platform remain fully operational.
              </p>

              {this.state.error && (
                <div className="mt-3 p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-red-300 break-all overflow-x-auto max-h-36">
                  {this.state.error.message}
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F15A24] hover:bg-[#d94a18] text-white text-xs font-semibold shadow transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Section</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                >
                  {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{this.state.copied ? 'Copied Details' : 'Copy Error Details'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

