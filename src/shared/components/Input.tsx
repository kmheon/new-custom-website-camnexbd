import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-[#111827] mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        {...props}
        className={`w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-white border text-xs sm:text-sm text-[#111827] placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F15A24]/20 ${
          error ? 'border-rose-500 focus:border-rose-500' : 'border-[#EDE8E1] focus:border-[#F15A24]'
        } ${className}`}
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#5B6472]">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

