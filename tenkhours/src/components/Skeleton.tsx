import { FC } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  height?: string | number;
  width?: string | number;
}

const Skeleton: FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  height,
  width,
}) => {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700';
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    height: height,
    width: width,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

export default Skeleton; 