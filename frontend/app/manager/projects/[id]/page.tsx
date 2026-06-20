"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InputField, SelectField } from "@/components/ui/Fields";
import { Banner } from "@/components/ui/Banner";
import { StatusPill, TypePill } from "@/components/ui/Pills";
import { getProject, addMember } from "@/lib/projects";
import { listBugs } from "@/lib/bugs";
import { ApiError } from "@/lib/api";
import type { Project, Bug } from "@/types/api";

function ProjectDetailContent() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [projectData, bugsData] = await Promise.all([
        getProject(projectId),
        listBugs(projectId),
      ]);
      setProject(projectData);
      setBugs(bugsData);
    } catch {
      setLoadError("Couldn't load this project.");
    }
  }, [projectId]);

  useEffect(() => {
    // react-hooks/set-state-in-effect false positive: loadData is async
    // and only calls setState after its awaited calls resolve.
    // See https://github.com/facebook/react/issues/34743
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    if (!memberRole) {
      setAddError("Choose a role for this member.");
      return;
    }

    setIsAdding(true);
    try {
      await addMember(projectId, { email, role: memberRole as "qa" | "developer" });
      setAddSuccess(`${email} was added to the project.`);
      setEmail("");
      setMemberRole("");
      await loadData();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : "Couldn't add that member.");
    } finally {
      setIsAdding(false);
    }
  }

  if (loadError) return <p className="text-sm text-type-bug">{loadError}</p>;
  if (!project) return <p className="font-mono text-sm text-ink-soft">Loading…</p>;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl md:text-3xl">
          {project.name}
        </h1>
        <p className="mt-1 text-sm text-ink-soft sm:text-base">{project.description}</p>
        <p className="mt-1 font-mono text-xs text-ink-soft sm:text-sm">
          Created {new Date(project.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 md:grid-cols-[1fr_320px] lg:gap-8">
        <div>
          <h2 className="font-display text-base font-semibold text-ink sm:text-lg md:text-xl">
            Bugs &amp; features
          </h2>
          <p className="mt-1 text-sm text-ink-soft">View only — managers don&apos;t edit bugs.</p>

          <div className="mt-4 flex flex-col gap-2 sm:gap-3 md:gap-4">
            {bugs.length === 0 && (
              <Card>
                <p className="text-sm text-ink-soft">No bugs reported in this project yet.</p>
              </Card>
            )}
            {bugs.map((bug) => (
              <Card key={bug.id} className="flex flex-col gap-2 p-3 sm:p-4 md:p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="font-medium text-ink text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-1">
                    {bug.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">
                    Assigned to {bug.assigned_to?.full_name ?? "nobody yet"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <TypePill type={bug.type} />
                  <StatusPill status={bug.status} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-ink sm:text-lg md:text-xl">
            Members
          </h2>
          <div className="mt-4 flex flex-col gap-2 sm:gap-3">
            {project.members.length === 0 && (
              <p className="text-sm text-ink-soft">No members added yet.</p>
            )}
            {project.members.map((member) => (
              <Card key={member.id} className="flex flex-col gap-1 p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink sm:text-base">{member.user.full_name}</p>
                  <p className="font-mono text-xs text-ink-soft sm:text-sm">{member.user.email}</p>
                </div>
                <span className="font-mono text-xs text-ink-soft sm:text-sm whitespace-nowrap">{member.role}</span>
              </Card>
            ))}
          </div>

          <Card className="mt-4 p-4 sm:p-5 md:p-6">
            <h3 className="text-sm font-medium text-ink sm:text-base">Add member</h3>
            <form onSubmit={handleAddMember} className="mt-3 flex flex-col gap-3 sm:gap-4">
              <InputField
                label="Email"
                id="member_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@gmail.com"
                required
              />
              <SelectField
                label="Role on this project"
                id="member_role"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                placeholder="Choose a role"
                options={[
                  { value: "qa", label: "QA" },
                  { value: "developer", label: "Developer" },
                ]}
                required
              />
              {addError && <Banner variant="error">{addError}</Banner>}
              {addSuccess && <Banner variant="success">{addSuccess}</Banner>}
              <Button type="submit" isLoading={isAdding} className="w-full py-2.5 text-sm sm:py-3 sm:text-base">
                Add to project
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <RequireAuth allowedRoles={["manager"]}>
      <AppShell>
        <ProjectDetailContent />
      </AppShell>
    </RequireAuth>
  );
}