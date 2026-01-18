import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, hint, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-md border bg-bg-secondary px-3.5 py-2.5 text-sm text-text-primary",
            "placeholder:text-text-tertiary",
            "border-border-default",
            "focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-150",
            error && "border-accent-red focus:border-accent-red focus:ring-accent-red/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
        {error && <p className="text-xs text-accent-red">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };






