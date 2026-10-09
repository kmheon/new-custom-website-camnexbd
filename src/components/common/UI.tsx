import React from 'react';
import { X, ChevronRight, AlertCircle, CheckCircle, Info } from 'lucide-react';

// ----------------------------------------------------------------------------
// Button
// ----------------------------------------------------------------------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const isBusy = isLoading || loading;
  const base = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#F15A24] hover:bg-[#D94D1C] text-white shadow-md shadow-orange-600/20 focus:ring-[#F15A24]',
    secondary: 'bg-[#111827] hover:bg-slate-800 text-white shadow-sm focus:ring-[#111827]',
    outline: 'border-2 border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white focus:ring-[#111827]',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'text-slate-700 hover:bg-slate-100 hover:text-[#F15A24] focus:ring-slate-300'
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-2 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5'
  };

  return (
    <button
      className={`${base} ${fullWidth ? 'w-full' : ''} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isBusy}
      {...props}
    >
      {isBusy && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

// ----------------------------------------------------------------------------
// Badge
// ----------------------------------------------------------------------------
export interface BadgeProps {
  variant?: 'orange' | 'dark' | 'success' | 'warning' | 'info' | 'gray' | 'danger' | 'yellow';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'gray',
  children,
  className = ''
}) => {
  const variants = {
    orange: 'bg-[#F15A24]/10 text-[#F15A24] border border-[#F15A24]/20',
    dark: 'bg-[#111827] text-white',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    gray: 'bg-slate-100 text-slate-700 border border-slate-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ----------------------------------------------------------------------------
// Card
// ----------------------------------------------------------------------------
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 ${className}`}>
      {children}
    </div>
  );
};

// ----------------------------------------------------------------------------
// Input & Select
// ----------------------------------------------------------------------------
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', id, ...props }) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-white border text-base text-slate-900 rounded-xl px-4 py-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent ${
          error ? 'border-red-500 bg-red-50/20' : 'border-slate-300 hover:border-slate-400'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string | number; label: string }>;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className = '', id, ...props }) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-white border text-base text-slate-900 rounded-xl px-3.5 py-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:border-transparent ${
          error ? 'border-red-500' : 'border-slate-300'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};

// ----------------------------------------------------------------------------
// Modal
// ----------------------------------------------------------------------------
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white w-full ${maxWidth} rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-[#111827]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[85vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// Breadcrumbs
// ----------------------------------------------------------------------------
export const Breadcrumbs: React.FC<{
  items: Array<{ label: string; href?: string; onClick?: () => void }>;
}> = ({ items }) => {
  return (
    <nav className="flex items-center text-xs font-semibold text-slate-500 py-3 space-x-1.5 overflow-x-auto">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
          {item.onClick || item.href ? (
            <button
              type="button"
              onClick={item.onClick}
              className="hover:text-[#F15A24] transition-colors whitespace-nowrap"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-[#111827] font-bold whitespace-nowrap">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// ----------------------------------------------------------------------------
// Alert
// ----------------------------------------------------------------------------
export const Alert: React.FC<{
  type?: 'info' | 'success' | 'warning' | 'danger';
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
}> = ({ type, variant, title, children }) => {
  const effectiveType = variant || type || 'info';
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    danger: 'bg-red-50 border-red-200 text-red-900'
  };

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${styles[effectiveType]}`}>
      {effectiveType === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
      {effectiveType === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
      {effectiveType === 'danger' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
      {effectiveType === 'info' && <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
      <div className="text-sm">
        {title && <div className="font-bold mb-0.5">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
};
