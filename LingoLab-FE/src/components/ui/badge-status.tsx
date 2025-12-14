import { cn } from "@/lib/utils";

interface BadgeStatusProps {
  variant: "success" | "warning" | "info" | "error";
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  error: "bg-red-50 text-red-700 border-red-200",
};

export function BadgeStatus({ variant, children, className }: BadgeStatusProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export default BadgeStatus;

