import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../common/UI';

export interface ErrorStateProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  details,
  onRetry
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3.5">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>

      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Retry
        </Button>
      )}

      {details && (
        <div className="w-full mt-4 text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 mx-auto"
          >
            <span>{showDetails ? 'Hide error details' : 'Show error details'}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showDetails && (
            <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] overflow-x-auto font-mono">
              {details}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

