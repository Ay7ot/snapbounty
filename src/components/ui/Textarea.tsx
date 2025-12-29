"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, hint, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full px-4 py-3 min-h-[120px] resize-y",
            "bg-bg-secondary border border-border-default rounded-md",
            "text-text-primary text-sm placeholder:text-text-tertiary",
            "focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-150",
            error && "border-accent-red focus:border-accent-red focus:ring-accent-red/20",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
        {error && <p className="text-xs text-accent-red">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };


