/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import React from 'react';

const DashboardLoader = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    default: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full gap-4">
      {/* Primary Spinner */}
      <div className="relative">
        {/* Outer spinning circle */}
        <div className={`
          ${sizeClasses[size] || sizeClasses.default}
          rounded-full
          border-primary/30
          border-t-primary
          animate-spin
        `} />
        
        {/* Inner pulsing dot */}
        <div className={`
          absolute
          top-1/2
          left-1/2
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-primary
          animate-pulse
        ${size === 'small' ? 'w-1 h-1' : size === 'large' ? 'w-3 h-3' : 'w-2 h-2'}
        `} />
      </div>

      {/* Loading Text */}
      {text && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            {text}
          </p>
          <div className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
};

// Skeleton loader for dashboard cards
export const DashboardCardSkeleton = () => {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="space-y-3">
        <div className="h-4 w-[60%] rounded-md bg-muted animate-pulse" />
        <div className="h-8 w-[40%] rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-[80%] rounded-md bg-muted animate-pulse" />
      </div>
    </div>
  );
};

// Full page loader with brand
export const FullPageLoader = () => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="text-2xl font-bold tracking-tight animate-pulse">
          Friends<span className="text-primary">Book</span>&nbsp;
          <span className="text-sm font-normal text-muted-foreground">Admin</span>
        </div>
        <DashboardLoader size="large" text="Loading your dashboard..." />
      </div>
    </div>
  );
};

// Grid skeleton for dashboard
export const DashboardGridSkeleton = ({ cards = 4 }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(cards)].map((_, i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default DashboardLoader;