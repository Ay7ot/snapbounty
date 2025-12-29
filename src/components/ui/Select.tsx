"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, options, value, onChange, placeholder = "Select...", error, label, disabled, id, name }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectId = id || `select-${Math.random().toString(36).slice(2)}`;

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      if (onChange) {
        onChange(optionValue);
      }
      setIsOpen(false);
    };

    return (
      <div className={cn("space-y-1.5 w-full", className)} ref={containerRef}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            id={selectId}
            name={name}
            ref={ref}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              "flex w-full items-center justify-between rounded-md border bg-bg-secondary px-3.5 py-2.5 text-sm transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-accent-red text-accent-red focus:border-accent-red focus:ring-accent-red/20"
                : "border-border-default text-text-primary hover:border-border-hover",
              isOpen && "border-accent-green ring-2 ring-accent-green/20 shadow-[0_0_0_1px_rgba(0,255,163,0.1)]",
              !selectedOption && "text-text-tertiary"
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className="truncate block text-left">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 opacity-50 transition-transform duration-200 shrink-0 ml-2",
                isOpen && "rotate-180"
              )}
            />
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-border-default bg-bg-elevated py-1 shadow-xl shadow-black/50 animate-in fade-in-0 zoom-in-95 origin-top">
              {options.length === 0 ? (
                <div className="px-2 py-3 text-sm text-text-tertiary text-center">No options available</div>
              ) : (
                <div role="listbox">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={option.value === value}
                      disabled={option.disabled}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center py-2.5 pl-3 pr-9 text-sm outline-none transition-colors",
                        "hover:bg-accent-green/10 hover:text-accent-green",
                        option.value === value
                          ? "bg-accent-green/10 text-accent-green font-medium"
                          : "text-text-secondary hover:text-text-primary",
                        option.disabled && "pointer-events-none opacity-50"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {option.value === value && (
                        <span className="absolute right-3 flex h-3.5 w-3.5 items-center justify-center">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-accent-red mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
