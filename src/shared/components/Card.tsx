import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  hoverable = false,
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div
      {...props}
      className={`bg-white rounded-2xl border border-[#EDE8E1] shadow-xs ${paddingClasses[padding]} ${
        hoverable ? 'hover:shadow-lg hover:border-orange-200 transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

