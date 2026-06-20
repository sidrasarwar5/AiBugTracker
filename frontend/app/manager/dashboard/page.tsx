"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { listProjects } from "@/lib/projects";
import type { ProjectListItem } from "@/types/api";

function ManagerDashboardContent() {
  const [projects, setProjects] = useState<ProjectListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const data = await listProjects();
        if (isMounted) {
          setProjects(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Couldn't load your projects.");
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
        <p className="font-mono text-sm text-ink-soft">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl md:text-3xl">
            Manager Dashboard
          </h1>
          <p className="mt-1 text-xs text-ink-soft sm:text-sm md:text-base">
            Projects you&apos;ve created.
          </p>
        </div>
        <Link href="/manager/projects/create" className="sm:w-auto">
          <Button className="w-full sm:w-auto">New project</Button>
        </Link>
      </div>

      {/* Projects List */}
      <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:gap-4 md:mt-8 md:gap-5">
        <h2 className="font-display text-base font-semibold text-ink sm:text-lg md:text-xl">
          Your Projects
        </h2>
        
        {error && <p className="text-sm text-type-bug">{error}</p>}

        {projects && projects.length === 0 && (
          <Card>
            <p className="text-sm text-ink-soft">
              You haven&apos;t created any projects yet.{" "}
              <Link href="/manager/projects/create" className="font-medium text-ink underline">
                Create your first one
              </Link>
              .
            </p>
          </Card>
        )}

        {projects?.map((project) => (
          <Link key={project.id} href={`/manager/projects/${project.id}`}>
            <Card className="p-3 sm:p-4 md:p-5 transition-colors hover:border-ink/30">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex-1">
                  <p className="font-medium text-ink text-sm sm:text-base md:text-lg">
                    {project.name}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-soft sm:text-base line-clamp-2 sm:line-clamp-1">
                    {project.description}
                  </p>
                </div>
                <p className="font-mono text-xs text-ink-soft sm:text-sm whitespace-nowrap">
                  {project.member_count} member{project.member_count === 1 ? "" : "s"}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ManagerDashboardPage() {
  return (
    <RequireAuth allowedRoles={["manager"]}>
      <AppShell>
        <ManagerDashboardContent />
      </AppShell>
    </RequireAuth>
  );
}