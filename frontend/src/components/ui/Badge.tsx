import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground": variant === 'default',
          "border-transparent bg-secondary text-secondary-foreground": variant === 'secondary',
          "text-foreground border-border": variant === 'outline',
          "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20": variant === 'success',
          "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:bg-amber-500/20": variant === 'warning',
          "border-transparent bg-red-500/10 text-red-700 dark:text-red-400 dark:bg-red-500/20": variant === 'error',
        },
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
