"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusPill, TypePill } from "@/components/ui/Pills";
import { listBugs } from "@/lib/bugs";
import type { Bug } from "@/types/api";

function MyBugsContent() {
  const [bugs, setBugs] = useState<Bug[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBugs()
      .then(setBugs)
      .catch(() => setError("Couldn't load your bugs."));
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
      <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl md:text-3xl">
        My bugs
      </h1>

      <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:gap-4 md:mt-8 md:gap-5">
        {error && <p className="text-sm text-type-bug">{error}</p>}
        {bugs === null && !error && <p className="font-mono text-sm text-ink-soft">Loading…</p>}
        {bugs && bugs.length === 0 && (
          <Card>
            <p className="text-sm text-ink-soft">Nothing assigned to you right now.</p>
          </Card>
        )}
        {bugs?.map((bug) => (
          <Link key={bug.id} href={`/developer/bugs/${bug.id}`}>
            <Card className="flex flex-col gap-2 p-3 sm:p-4 md:p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-ink/30">
  <div className="flex-1 min-w-0">
    <p className="font-medium text-ink text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-1">
      {bug.title}
    </p>
    <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">
      {bug.deadline ? `Due ${bug.deadline}` : "No deadline set"}
    </p>
  </div>
  <div className="flex flex-wrap items-center gap-2 sm:gap-2">
    <TypePill type={bug.type} />
    <StatusPill status={bug.status} />
  </div>
</Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function MyBugsPage() {
  return (
    <RequireAuth allowedRoles={["developer"]}>
      <AppShell>
        <MyBugsContent />
      </AppShell>
    </RequireAuth>
  );
}