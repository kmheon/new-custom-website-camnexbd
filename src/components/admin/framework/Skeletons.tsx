import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full animate-pulse divide-y divide-slate-100">
      <div className="bg-slate-50 p-3.5 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3.5 bg-slate-200 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 bg-slate-100 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-7 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};

export const FormSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-5 animate-pulse max-w-2xl">
      <div className="space-y-1.5">
        <div className="h-3.5 bg-slate-200 rounded w-24" />
        <div className="h-10 bg-slate-100 rounded-xl w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 rounded w-20" />
          <div className="h-10 bg-slate-100 rounded-xl w-full" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 rounded w-20" />
          <div className="h-10 bg-slate-100 rounded-xl w-full" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3.5 bg-slate-200 rounded w-32" />
        <div className="h-24 bg-slate-100 rounded-xl w-full" />
      </div>
    </div>
  );
};

