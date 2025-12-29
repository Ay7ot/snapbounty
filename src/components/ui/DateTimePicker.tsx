"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    label?: string;
    error?: string;
    placeholder?: string;
    minDate?: Date;
    disabled?: boolean;
    className?: string;
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DateTimePicker({
    value,
    onChange,
    label,
    error,
    placeholder = "Select date and time",
    minDate = new Date(),
    disabled = false,
    className,
}: DateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<"calendar" | "time">("calendar");
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Parse current value
    const parsedValue = useMemo(() => {
        if (!value) return null;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }, [value]);

    // Calendar state
    const [viewDate, setViewDate] = useState(() => parsedValue || new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(parsedValue);
    const [selectedHour, setSelectedHour] = useState(() => parsedValue?.getHours() ?? 12);
    const [selectedMinute, setSelectedMinute] = useState(() => parsedValue?.getMinutes() ?? 0);

    // Mount check for portal
    useEffect(() => {
        setMounted(true);
    }, []);

    // Update internal state when value prop changes
    useEffect(() => {
        if (parsedValue) {
            setSelectedDate(parsedValue);
            setSelectedHour(parsedValue.getHours());
            setSelectedMinute(parsedValue.getMinutes());
            setViewDate(parsedValue);
        }
    }, [parsedValue]);

    // Calculate and update dropdown position
    const updatePosition = useCallback(() => {
        if (!triggerRef.current || !isOpen) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const dropdownHeight = 380;
        const dropdownWidth = Math.max(280, triggerRect.width);
        const padding = 8;

        const spaceBelow = window.innerHeight - triggerRect.bottom - padding;
        const spaceAbove = triggerRect.top - padding;

        let top: number;
        let left = triggerRect.left;

        // Determine vertical position
        if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
            // Position below
            top = triggerRect.bottom + 8;
        } else {
            // Position above
            top = triggerRect.top - dropdownHeight - 8;
        }

        // Ensure dropdown doesn't go off-screen horizontally
        if (left + dropdownWidth > window.innerWidth - padding) {
            left = window.innerWidth - dropdownWidth - padding;
        }
        if (left < padding) {
            left = padding;
        }

        // Ensure dropdown doesn't go off-screen vertically
        if (top < padding) {
            top = padding;
        }
        if (top + dropdownHeight > window.innerHeight - padding) {
            top = window.innerHeight - dropdownHeight - padding;
        }

        setDropdownStyle({
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${dropdownWidth}px`,
            maxWidth: `calc(100vw - ${padding * 2}px)`,
            zIndex: 9999,
        });
    }, [isOpen]);

    // Update position when opening and on scroll/resize
    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen, updatePosition]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                containerRef.current &&
                !containerRef.current.contains(target) &&
                !(event.target as Element)?.closest?.('[data-datepicker-dropdown]')
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const days: (Date | null)[] = [];

        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d));
        }

        return days;
    }, [viewDate]);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setView("time");
    };

    const handleConfirm = () => {
        if (!selectedDate) return;

        const finalDate = new Date(selectedDate);
        finalDate.setHours(selectedHour, selectedMinute, 0, 0);

        const formatted = finalDate.toISOString().slice(0, 16);
        onChange?.(formatted);
        setIsOpen(false);
        setView("calendar");
    };

    const handleClear = () => {
        setSelectedDate(null);
        setSelectedHour(12);
        setSelectedMinute(0);
        onChange?.("");
        setIsOpen(false);
    };

    const navigateMonth = (delta: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
    };

    const isDateDisabled = (date: Date) => {
        const today = new Date(minDate);
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    const formatDisplay = () => {
        if (!parsedValue) return null;
        return parsedValue.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const dropdownContent = (
        <div
            data-datepicker-dropdown
            style={dropdownStyle}
            className="max-h-[380px] overflow-auto rounded-lg border border-border-default bg-bg-elevated p-4 shadow-xl shadow-black/50 animate-in fade-in-0 zoom-in-95"
        >
            {view === "calendar" ? (
                <>
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={() => navigateMonth(-1)}
                            className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium text-text-primary">
                            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </span>
                        <button
                            type="button"
                            onClick={() => navigateMonth(1)}
                            className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-text-tertiary py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date, idx) => {
                            if (!date) {
                                return <div key={`empty-${idx}`} className="p-2" />;
                            }

                            const isDisabled = isDateDisabled(date);
                            const isSelected = selectedDate?.toDateString() === date.toDateString();
                            const isToday = new Date().toDateString() === date.toDateString();

                            return (
                                <button
                                    key={date.toISOString()}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => handleDateSelect(date)}
                                    className={cn(
                                        "p-2 text-sm rounded-md transition-colors text-center",
                                        isDisabled && "opacity-30 cursor-not-allowed",
                                        !isDisabled && !isSelected && "hover:bg-accent-green/10 hover:text-accent-green",
                                        isSelected && "bg-accent-green text-bg-primary font-medium",
                                        !isSelected && isToday && "border border-accent-green/50 text-accent-green",
                                        !isSelected && !isToday && "text-text-secondary"
                                    )}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </>
            ) : (
                <>
                    {/* Time Picker */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={() => setView("calendar")}
                            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back
                        </button>
                        <span className="text-sm font-medium text-text-primary flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Set Time
                        </span>
                        <div className="w-12" />
                    </div>

                    {/* Selected Date Display */}
                    {selectedDate && (
                        <div className="text-center mb-4 pb-4 border-b border-border-default">
                            <p className="text-sm text-text-secondary">
                                {selectedDate.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    )}

                    {/* Time Selectors */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="flex flex-col items-center">
                            <label className="text-xs text-text-tertiary mb-2">Hour</label>
                            <select
                                value={selectedHour}
                                onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                                className="w-20 px-3 py-2 rounded-md bg-bg-secondary border border-border-default text-text-primary text-center appearance-none focus:outline-none focus:border-accent-green"
                            >
                                {Array.from({ length: 24 }, (_, i) => (
                                    <option key={i} value={i}>
                                        {i.toString().padStart(2, "0")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span className="text-2xl text-text-tertiary mt-6">:</span>

                        <div className="flex flex-col items-center">
                            <label className="text-xs text-text-tertiary mb-2">Minute</label>
                            <select
                                value={selectedMinute}
                                onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                                className="w-20 px-3 py-2 rounded-md bg-bg-secondary border border-border-default text-text-primary text-center appearance-none focus:outline-none focus:border-accent-green"
                            >
                                {Array.from({ length: 60 }, (_, i) => (
                                    <option key={i} value={i}>
                                        {i.toString().padStart(2, "0")}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="w-full py-2.5 rounded-md bg-accent-green text-bg-primary font-medium hover:brightness-110 transition-all"
                    >
                        Confirm
                    </button>
                </>
            )}
        </div>
    );

    return (
        <div className={cn("space-y-1.5 w-full", className)} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-text-primary">{label}</label>
            )}

            <div className="relative">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={cn(
                        "flex w-full items-center justify-between rounded-md border bg-bg-secondary px-3.5 py-2.5 text-sm transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error
                            ? "border-accent-red text-accent-red"
                            : "border-border-default text-text-primary hover:border-border-hover",
                        isOpen && "border-accent-green ring-2 ring-accent-green/20",
                        !parsedValue && "text-text-tertiary"
                    )}
                >
                    <span className="flex items-center gap-2 truncate">
                        <Calendar className="h-4 w-4 shrink-0 opacity-50" />
                        {formatDisplay() || placeholder}
                    </span>
                    {parsedValue && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                            className="p-0.5 hover:bg-white/10 rounded"
                        >
                            <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                        </button>
                    )}
                </button>

                {/* Render dropdown in a portal to escape overflow constraints */}
                {isOpen && mounted && createPortal(dropdownContent, document.body)}
            </div>

            {error && <p className="text-xs text-accent-red mt-1">{error}</p>}
        </div>
    );
}
