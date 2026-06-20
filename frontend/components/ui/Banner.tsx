interface BannerProps {
  variant: "error" | "success" | "warning";  // ADDED warning
  children: React.ReactNode;
}

export function Banner({ variant, children }: BannerProps) {
  const getColors = () => {
    switch (variant) {
      case "error":
        return {
          color: "var(--color-type-bug)",
          borderColor: "var(--color-type-bug)",
          bg: "var(--color-type-bug)10"
        };
      case "success":
        return {
          color: "var(--color-status-resolved)",
          borderColor: "var(--color-status-resolved)",
          bg: "var(--color-status-resolved)10"
        };
      case "warning":
        return {
          color: "#d97706",  // amber-600
          borderColor: "#d97706",
          bg: "#d9770610"
        };
      default:
        return {
          color: "var(--color-ink)",
          borderColor: "var(--color-line)",
          bg: "var(--color-surface)"
        };
    }
  };

  const { color, borderColor, bg } = getColors();

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className="rounded-sm border px-3 py-2 text-sm"
      style={{ color, borderColor: borderColor, backgroundColor: bg }}
    >
      {children}
    </div>
  );
}