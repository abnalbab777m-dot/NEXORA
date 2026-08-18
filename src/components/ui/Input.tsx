import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, ...props }, ref) => {
    const id = React.useId();
    return (
      <div className="flex w-full flex-col gap-1.5 text-right">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-neutral-300">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          className={cn(
            'flex h-12 w-full rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-red-500/50 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
