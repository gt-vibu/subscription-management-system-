import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse space-y-4">
      <div className="h-4 bg-muted rounded w-1/3"></div>
      <div className="h-8 bg-muted rounded w-1/2"></div>
      <div className="h-3 bg-muted rounded w-3/4"></div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4
}) => {
  return (
    <div className="border rounded-lg overflow-hidden animate-pulse">
      {/* Header */}
      <div className="border-b bg-muted/30 px-6 py-4 flex space-x-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded flex-1"></div>
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex space-x-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={`h-4 bg-muted rounded flex-1 ${
                  c === 0 ? 'w-3/4' : c === cols - 1 ? 'w-1/2' : ''
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CatalogSkeleton: React.FC = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto px-4 py-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-8 animate-pulse space-y-6 flex flex-col justify-between h-[450px]">
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-10 bg-muted rounded w-1/3 my-6"></div>
            <div className="space-y-2 mt-4">
              <div className="h-3 bg-muted rounded w-full"></div>
              <div className="h-3 bg-muted rounded w-5/6"></div>
              <div className="h-3 bg-muted rounded w-4/5"></div>
            </div>
          </div>
          <div className="h-10 bg-muted rounded w-full"></div>
        </div>
      ))}
    </div>
  );
};
export default CardSkeleton;
