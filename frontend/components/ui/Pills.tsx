import type { BugStatus, BugType } from "@/types/api";

const STATUS_COLOR: Record<BugStatus, string> = {
  new: "var(--color-status-new)",
  started: "var(--color-status-started)",
  resolved: "var(--color-status-resolved)",
  completed: "var(--color-status-completed)",
};

export function StatusPill({ status }: { status: BugStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-xs leading-none"
      style={{ color, borderColor: color, backgroundColor: `${color}14` }}
    >
      [{status}]
    </span>
  );
}

const TYPE_COLOR: Record<BugType, string> = {
  bug: "var(--color-type-bug)",
  feature: "var(--color-type-feature)",
};

export function TypePill({ type }: { type: BugType }) {
  const color = TYPE_COLOR[type];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-xs leading-none"
      style={{ color, borderColor: color, backgroundColor: `${color}14` }}
    >
      {type}
    </span>
  );
}
