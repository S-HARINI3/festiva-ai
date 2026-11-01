import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-xl';
      case 'card':
        return 'rounded-[18px] h-40 w-full';
      case 'text':
      default:
        return 'rounded-md h-4 w-full';
    }
  };

  const customStyle: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <div
      className={`skeleton ${getVariantStyles()} ${className}`}
      style={customStyle}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="festiva-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="space-y-1.5">
            <Skeleton width={140} height={16} />
            <Skeleton width={80} height={12} />
          </div>
        </div>
        <Skeleton width={60} height={20} className="rounded-full" />
      </div>
      <Skeleton width="100%" height={12} />
      <Skeleton width="75%" height={12} />
      <div className="pt-3 border-t border-[var(--border)] flex justify-between">
        <Skeleton width={100} height={14} />
        <Skeleton width={80} height={28} className="rounded-lg" />
      </div>
    </div>
  );
}

export default Skeleton;
