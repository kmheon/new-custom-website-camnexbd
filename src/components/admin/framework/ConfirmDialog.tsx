import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { Button } from '../../common/UI';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmPhrase?: string; // If provided, user must type this exact text to proceed
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmPhrase,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  const [typedPhrase, setTypedPhrase] = useState('');

  if (!isOpen) return null;

  const isPhraseMatch = !confirmPhrase || typedPhrase.trim() === confirmPhrase.trim();

  const handleConfirm = async () => {
    if (!isPhraseMatch || isLoading) return;
    await onConfirm();
    setTypedPhrase('');
  };

  const handleCancel = () => {
    setTypedPhrase('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-5 flex items-start gap-3.5 ${variant === 'danger' ? 'bg-rose-50/70 border-b border-rose-100' : 'bg-slate-50 border-b border-slate-100'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${variant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
            {variant === 'danger' ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Typed phrase requirement */}
        {confirmPhrase && (
          <div className="p-5 border-b border-slate-100 bg-white">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              To proceed, please type <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 font-bold select-all">{confirmPhrase}</code> below:
            </label>
            <input
              type="text"
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={`Type "${confirmPhrase}"`}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              autoFocus
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="p-4 bg-slate-50 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            disabled={!isPhraseMatch || isLoading}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

