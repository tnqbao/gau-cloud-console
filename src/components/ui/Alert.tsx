import { cn } from "@/lib/utils";

interface AlertProps {
  variant?: "default" | "destructive" | "success" | "warning";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({
  variant = "default",
  title,
  children,
  className,
}: AlertProps) {
  const variantStyles = {
    default: "bg-background text-foreground border",
    destructive: "bg-destructive/10 text-destructive border-destructive/50",
    success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-100 dark:border-green-800",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-100 dark:border-yellow-800",
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        variantStyles[variant],
        className
      )}
    >
      {title && <h5 className="mb-1 font-medium leading-none">{title}</h5>}
      <div className="text-sm">{children}</div>
    </div>
  );
}
