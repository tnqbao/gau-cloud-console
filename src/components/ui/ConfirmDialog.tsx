import { Button } from "./Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./Dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
}: ConfirmDialogProps) {
  const iconColor = {
    danger: "text-red-600 dark:text-red-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    info: "text-blue-600 dark:text-blue-400",
  }[variant];

  const iconBg = {
    danger: "bg-red-100 dark:bg-red-900/20",
    warning: "bg-yellow-100 dark:bg-yellow-900/20",
    info: "bg-blue-100 dark:bg-blue-900/20",
  }[variant];

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="flex gap-4">
          <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
            {variant === "danger" && (
              <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {variant === "warning" && (
              <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {variant === "info" && (
              <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === "danger" ? "destructive" : "default"}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

