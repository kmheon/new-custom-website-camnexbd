import React from 'react';

export interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 'auto';
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  columns = 4,
  className = ''
}) => {
  const getColClasses = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    }
  };

  return (
    <div className="card-grid-wrapper pt-6 pb-8 -mt-6 -mb-8 px-4 -mx-4 overflow-visible">
      <div className={`card-grid-container card-subgrid-grid grid ${getColClasses()} gap-5 sm:gap-6 items-stretch ${className}`}>
        {children}
      </div>
    </div>
  );
};
