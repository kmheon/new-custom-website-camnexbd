import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 min-h-[32px]',
    md: 'text-xs sm:text-sm px-4 py-2 rounded-xl gap-2 min-h-[40px]',
    lg: 'text-sm sm:text-base px-6 py-2.5 rounded-full gap-2.5 min-h-[46px]'
  };

  const variantClasses = {
    primary: 'bg-[#F15A24] hover:bg-[#D94D1C] text-white shadow-xs focus:ring-[#F15A24]',
    secondary: 'bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xs focus:ring-[#0F172A]',
    outline: 'border border-[#EDE8E1] bg-white hover:bg-slate-50 text-[#111827] focus:ring-[#F15A24]',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500',
    ghost: 'bg-transparent hover:bg-slate-100 text-[#5B6472] hover:text-[#111827] focus:ring-slate-300'
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

