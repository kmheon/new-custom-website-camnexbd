import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export const Breadcrumbs: React.FC<{ items: BreadcrumbItem[]; onHomeClick?: () => void }> = ({
  items,
  onHomeClick
}) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 select-none">
      <button
        type="button"
        onClick={onHomeClick}
        className="flex items-center gap-1 hover:text-[#F15A24] transition-colors"
        title="Admin Home"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span className="sr-only">Home</span>
      </button>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                className="hover:text-slate-800 transition-colors font-medium truncate max-w-[150px]"
              >
                {item.label}
              </button>
            ) : (
              <span className={`truncate max-w-[200px] ${isLast ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

