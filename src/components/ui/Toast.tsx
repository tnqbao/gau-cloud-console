import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "success", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[300px] max-w-[500px]",
          type === "success" && "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
          type === "error" && "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
          type === "info" && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
        )}
      >
        {type === "success" && (
          <svg className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {type === "error" && (
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {type === "info" && (
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <p className={cn(
          "text-sm font-medium",
          type === "success" && "text-green-800 dark:text-green-200",
          type === "error" && "text-red-800 dark:text-red-200",
          type === "info" && "text-blue-800 dark:text-blue-200"
        )}>
          {message}
        </p>
        <button
          onClick={onClose}
          className={cn(
            "ml-auto shrink-0 rounded-full p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
            type === "success" && "text-green-600 dark:text-green-400",
            type === "error" && "text-red-600 dark:text-red-400",
            type === "info" && "text-blue-600 dark:text-blue-400"
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

