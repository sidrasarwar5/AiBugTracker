"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InputField, SelectField, TextareaField } from "@/components/ui/Fields";
import { Banner } from "@/components/ui/Banner";
import { StatusPill, TypePill } from "@/components/ui/Pills";
import { getBug, updateBug, assignBug } from "@/lib/bugs";
import { getProject } from "@/lib/projects";
import { ApiError } from "@/lib/api";
import { suggestResolution, type ResolutionSuggestion } from "@/lib/ai";
import type { Bug, ProjectMember } from "@/types/api";

function QaBugDetailContent() {
  const params = useParams<{ id: string }>();
  const bugId = params.id;

  const [bug, setBug] = useState<Bug | null>(null);
  const [developers, setDevelopers] = useState<ProjectMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  const [suggestion, setSuggestion] = useState<ResolutionSuggestion | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const bugData = await getBug(bugId);
        setBug(bugData);
        setTitle(bugData.title);
        setDescription(bugData.description);
        setDeadline(bugData.deadline ?? "");
        setAssignedTo(bugData.assigned_to?.id ?? "");

        const project = await getProject(bugData.project);
        setDevelopers(project.members.filter((m) => m.role === "developer"));
      } catch {
        setLoadError("Couldn't load this bug.");
      }
    }
    loadData();
  }, [bugId]);

  async function handleSaveDetails(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const updated = await updateBug(bugId, {
        title,
        description,
        deadline: deadline || undefined,
      });
      setBug(updated);
      setSuccess("Saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save changes.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReassign() {
    if (!assignedTo) return;
    setError(null);
    setSuccess(null);
    setIsReassigning(true);
    try {
      const updated = await assignBug(bugId, assignedTo);
      setBug(updated);
      setSuccess(`Reassigned to ${updated.assigned_to?.full_name}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reassign this bug.");
    } finally {
      setIsReassigning(false);
    }
  }

  async function handleGetSuggestion() {
    setSuggestionError(null);
    setIsSuggesting(true);
    try {
      const result = await suggestResolution(bugId);
      setSuggestion(result);
    } catch {
      setSuggestionError("Couldn't get AI suggestions right now. Try again in a moment.");
    } finally {
      setIsSuggesting(false);
    }
  }

  if (loadError) return <p className="text-sm text-type-bug">{loadError}</p>;
  if (!bug) return <p className="font-mono text-sm text-ink-soft">Loading…</p>;

  return (
    <div className="mx-auto w-full max-w-lg px-4 sm:px-6 md:max-w-2xl lg:max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <TypePill type={bug.type} />
        <StatusPill status={bug.status} />
      </div>
      <h1 className="mt-2 font-display text-xl font-semibold text-ink sm:text-2xl md:text-3xl">
        {bug.title}
      </h1>
      <p className="mt-1 font-mono text-xs text-ink-soft sm:text-sm">
        Reported by {bug.created_by?.full_name ?? "Unknown"}
      </p>

      {bug.resolution_notes && (
        <Card className="mt-4 p-4 sm:p-5 md:p-6">
          <p className="text-sm font-medium text-ink sm:text-base">Resolution notes</p>
          <p className="mt-1 text-sm text-ink-soft sm:text-base">{bug.resolution_notes}</p>
        </Card>
      )}

      {/* AI Resolution Suggestions (RAG) -- only useful before it's resolved */}
      {bug.status !== "resolved" && bug.status !== "completed" && (
        <Card className="mt-4 p-4 sm:p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-ink sm:text-base">💡 AI Resolution Suggestions</h2>
            <Button
              type="button"
              onClick={handleGetSuggestion}
              isLoading={isSuggesting}
              className="text-sm"
            >
              Get AI Suggestions
            </Button>
          </div>

          {suggestionError && (
            <div className="mt-3">
              <Banner variant="error">{suggestionError}</Banner>
            </div>
          )}

          {suggestion && (
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-ink-soft">Suggested approach:</p>
                {suggestion.method === "ai" && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    ✨ AI-powered
                  </span>
                )}
                {suggestion.method === "fallback" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    ⚠️ Unavailable
                  </span>
                )}
              </div>
              <p className="text-sm text-ink">{suggestion.suggestion}</p>

              {suggestion.similar_bugs.length > 0 && (
                <div className="mt-1">
                  <p className="text-xs font-medium text-ink-soft">
                    Based on {suggestion.similar_bugs.length} similar resolved item
                    {suggestion.similar_bugs.length === 1 ? "" : "s"}:
                  </p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {suggestion.similar_bugs.map((sb) => (
                      <li key={sb.id} className="text-xs text-ink-soft">
                        • {sb.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      <Card className="mt-4 p-4 sm:p-5 md:p-6">
        <h2 className="text-sm font-medium text-ink sm:text-base">Edit details</h2>
        <form onSubmit={handleSaveDetails} className="mt-3 flex flex-col gap-3 sm:gap-4 md:gap-5">
          <InputField
            label="Title"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <TextareaField
            label="Description"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <InputField
            label="Deadline"
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          {error && <Banner variant="error">{error}</Banner>}
          {success && <Banner variant="success">{success}</Banner>}

          <Button type="submit" isLoading={isSaving} className="w-full py-2.5 text-sm sm:py-3 sm:text-base">
            Save changes
          </Button>
        </form>
      </Card>

      <Card className="mt-4 p-4 sm:p-5 md:p-6">
        <h2 className="text-sm font-medium text-ink sm:text-base">Reassign</h2>
        <p className="mt-1 text-sm text-ink-soft sm:text-base">
          Currently assigned to {bug.assigned_to?.full_name ?? "nobody"}.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="w-full sm:flex-1">
            <SelectField
              label="Developer"
              id="assigned_to"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Choose a developer"
              options={developers.map((d) => ({ value: d.user.id, label: d.user.full_name }))}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleReassign}
            isLoading={isReassigning}
            disabled={!assignedTo || assignedTo === bug.assigned_to?.id}
            className="w-full sm:w-auto"
          >
            Reassign
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function QaBugDetailPage() {
  return (
    <RequireAuth allowedRoles={["qa"]}>
      <AppShell>
        <QaBugDetailContent />
      </AppShell>
    </RequireAuth>
  );
}