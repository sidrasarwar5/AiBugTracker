"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusPill, TypePill } from "@/components/ui/Pills";
import { listBugs } from "@/lib/bugs";
import type { Bug } from "@/types/api";

function DeveloperDashboardContent() {
  const [bugs, setBugs] = useState<Bug[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const data = await listBugs();
        if (isMounted) {
          setBugs(data.filter(b => b.status !== "resolved" && b.status !== "completed"));
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Couldn't load your bugs.");
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
        <p className="font-mono text-sm text-ink-soft">Loading your bugs...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl md:text-3xl">
          Developer Dashboard
        </h1>
        <p className="mt-1 text-xs text-ink-soft sm:text-sm md:text-base">
          Bugs assigned to you.
        </p>
      </div>

      {/* Bugs List */}
      <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:gap-4 md:mt-8 md:gap-5">
        <h2 className="font-display text-base font-semibold text-ink sm:text-lg md:text-xl">
          Your Assigned Bugs
        </h2>
        
        {error && <p className="text-sm text-type-bug">{error}</p>}

        {bugs && bugs.length === 0 && (
          <Card>
            <p className="text-sm text-ink-soft">
              No bugs assigned to you yet. Good job! 🎉
            </p>
          </Card>
        )}

        {bugs?.map((bug) => (
          <Link key={bug.id} href={`/developer/bugs/${bug.id}`}>
            <Card className="flex flex-col gap-2 p-3 sm:p-4 md:p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-ink/30">
              <div className="flex-1">
                <p className="font-medium text-ink text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-1">
                  {bug.title}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">
                  {bug.deadline ? `Due ${bug.deadline}` : "No deadline set"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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

export default function DeveloperDashboardPage() {
  return (
    <RequireAuth allowedRoles={["developer"]}>
      <AppShell>
        <DeveloperDashboardContent />
      </AppShell>
    </RequireAuth>
  );
}