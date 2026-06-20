"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill, TypePill } from "@/components/ui/Pills";
import { listProjects } from "@/lib/projects";
import { listBugs } from "@/lib/bugs";
import type { ProjectListItem, Bug } from "@/types/api";

function QaDashboardContent() {
  const [projects, setProjects] = useState<ProjectListItem[] | null>(null);
  const [bugs, setBugs] = useState<Bug[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const [p, b] = await Promise.all([listProjects(), listBugs()]);
        if (isMounted) {
          setProjects(p);
          // Filter out resolved/completed bugs
          setBugs(b.filter((bug) => bug.status !== "resolved" && bug.status !== "completed"));
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Couldn't load your dashboard.");
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
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 lg:px-0">
        <p className="font-mono text-sm text-ink-soft">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 lg:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl md:text-3xl">
            QA Dashboard
          </h1>
          <p className="mt-1 text-xs text-ink-soft sm:text-sm md:text-base">
            Projects you&apos;ve been added to.
          </p>
        </div>
        <Link href="/qa/bugs/create" className="sm:w-auto">
          <Button className="w-full sm:w-auto">Report bug</Button>
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-type-bug">{error}</p>}

      {/* Projects Section */}
      <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:gap-4 md:mt-8 md:gap-5">
        <h2 className="font-display text-base font-semibold text-ink sm:text-lg md:text-xl">
          Your Projects
        </h2>
        
        {projects && projects.length === 0 && (
          <Card>
            <p className="text-sm text-ink-soft">
              You haven&apos;t been added to any projects yet. Ask a manager to add you by your
              email.
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

      {/* Recent Bugs Section */}
      {bugs && bugs.length > 0 && (
        <div className="mt-6 sm:mt-8 md:mt-10">
          <h2 className="font-display text-base font-semibold text-ink sm:text-lg md:text-xl">
            Recent reports
          </h2>
          
          <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:gap-3 md:mt-5 md:gap-4">
            {bugs.slice(0, 5).map((bug) => (
              <Link key={bug.id} href={`/qa/bugs/${bug.id}`}>
                <Card className="flex flex-col gap-2 p-3 sm:p-4 md:p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-ink/30">
                  <p className="font-medium text-ink text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-1">
                    {bug.title}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <TypePill type={bug.type} />
                    <StatusPill status={bug.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QaDashboardPage() {
  return (
    <RequireAuth allowedRoles={["qa"]}>
      <AppShell>
        <QaDashboardContent />
      </AppShell>
    </RequireAuth>
  );
}