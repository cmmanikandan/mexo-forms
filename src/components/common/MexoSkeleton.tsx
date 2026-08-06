import React from 'react';
import { clsx } from 'clsx';

interface MexoSkeletonProps {
  className?: string;
  lines?: number;
}

export const MexoSkeleton: React.FC<MexoSkeletonProps> = ({ className }) => (
  <div className={clsx('animate-pulse bg-slate-200 rounded-xl', className)} />
);

export const MexoSkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl border border-app-border p-5 space-y-3">
    <div className="flex items-start justify-between">
      <MexoSkeleton className="h-4 w-48" />
      <MexoSkeleton className="h-6 w-20 rounded-full" />
    </div>
    <MexoSkeleton className="h-3 w-32" />
    <div className="flex items-center gap-4 pt-1">
      <MexoSkeleton className="h-3 w-24" />
      <MexoSkeleton className="h-3 w-20" />
    </div>
  </div>
);

interface MexoEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const MexoEmptyState: React.FC<MexoEmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
    {icon && (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 flex items-center justify-center mb-5 text-app-muted">
        {icon}
      </div>
    )}
    <h3 className="text-base font-bold text-app-heading mb-2">{title}</h3>
    {description && <p className="text-sm text-app-body max-w-xs mb-5">{description}</p>}
    {action}
  </div>
);
