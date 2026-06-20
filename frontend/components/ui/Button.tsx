import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: "bg-ink text-paper hover:bg-ink/85 disabled:bg-ink/40",
  secondary:
    "bg-transparent text-ink border border-ink/20 hover:border-ink/40 disabled:opacity-40",
  danger: "bg-type-bug text-paper hover:bg-type-bug/85 disabled:bg-type-bug/40",
  ghost: "bg-transparent text-ink-soft hover:text-ink disabled:opacity-40",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, disabled, className = "", children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
        {...rest}
      >
        {isLoading ? "…" : children}
      </button>
    );
  }
);
Button.displayName = "Button";
