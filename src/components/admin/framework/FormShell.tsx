import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Check, Save, X, RotateCcw, Clock } from 'lucide-react';
import { Button } from '../../common/UI';

export interface FormShellProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  isSubmitting?: boolean;
  isDirty?: boolean;
  draftKey?: string;
  onSave: () => Promise<void> | void;
  onCancel?: () => void;
  actions?: React.ReactNode;
  errors?: Record<string, string>;
  children: React.ReactNode;
  lastSavedAt?: Date | null;
}

export const FormShell: React.FC<FormShellProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  isSubmitting = false,
  isDirty = false,
  draftKey,
  onSave,
  onCancel,
  actions,
  errors = {},
  children,
  lastSavedAt
}) => {
  const [hasUnsavedWarning, setHasUnsavedWarning] = useState(false);

  // Warn on tab/window close if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleCancelClick = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    if (onCancel) onCancel();
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              {breadcrumbs.map((b, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span>/</span>}
                  {b.onClick ? (
                    <button
                      type="button"
                      onClick={b.onClick}
                      className="hover:text-slate-700 hover:underline"
                    >
                      {b.label}
                    </button>
                  ) : (
                    <span className="text-slate-600 font-medium">{b.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {lastSavedAt && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-2">
              <Clock className="w-3 h-3" />
              Saved {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
          {isDirty && (
            <span className="text-[11px] text-amber-600 font-semibold px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">
              Unsaved changes
            </span>
          )}
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelClick}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          {actions}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onSave}
            isLoading={isSubmitting}
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Global Form Errors Banner */}
      {errorCount > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 p-4 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Please correct {errorCount} validation error{errorCount > 1 ? 's' : ''}:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-700">
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>
                  <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</strong> {msg}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Form Body */}
      <div className="p-6">{children}</div>
    </div>
  );
};

