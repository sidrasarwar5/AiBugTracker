"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { listProjects } from "@/lib/projects";
import type { ProjectListItem } from "@/types/api";

function QaProjectsContent() {
  const [projects, setProjects] = useState<ProjectListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => setError("Couldn't load your projects."));
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
      <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl md:text-3xl">
        Your projects
      </h1>

      <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:gap-4 md:mt-8 md:gap-5">
        {error && <p className="text-sm text-type-bug">{error}</p>}
        {projects === null && !error && (
          <p className="font-mono text-sm text-ink-soft">Loading…</p>
        )}
        {projects && projects.length === 0 && (
          <Card>
            <p className="text-sm text-ink-soft">
              You haven&apos;t been added to any projects yet.
            </p>
          </Card>
        )}
        {projects?.map((project) => (
          <Card key={project.id}>
            <p className="font-medium text-ink">{project.name}</p>
            <p className="mt-0.5 text-sm text-ink-soft">{project.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function QaProjectsPage() {
  return (
    <RequireAuth allowedRoles={["qa"]}>
      <AppShell>
        <QaProjectsContent />
      </AppShell>
    </RequireAuth>
  );
}