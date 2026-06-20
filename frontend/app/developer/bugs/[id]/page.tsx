"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SelectField, TextareaField } from "@/components/ui/Fields";
import { Banner } from "@/components/ui/Banner";
import { StatusPill, TypePill } from "@/components/ui/Pills";
import { getBug, updateBugStatus } from "@/lib/bugs";
import { ApiError, mediaUrl } from "@/lib/api";
import { suggestResolution, type ResolutionSuggestion } from "@/lib/ai";
import type { Bug, BugStatus } from "@/types/api";

// Status choices are restricted by bug type, mirroring the backend rule:
// Bug -> new, started, resolved | Feature -> new, started, completed
const STATUS_OPTIONS: Record<"bug" | "feature", { value: BugStatus; label: string }[]> = {
  bug: [
    { value: "new", label: "New" },
    { value: "started", label: "Started" },
    { value: "resolved", label: "Resolved" },
  ],
  feature: [
    { value: "new", label: "New" },
    { value: "started", label: "Started" },
    { value: "completed", label: "Completed" },
  ],
};

// Priority color helper
const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    critical: "bg-red-100 text-red-800 border-red-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-green-100 text-green-800 border-green-300",
  };
  return colors[priority] || colors.medium;
};

// Category color helper
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    ui: "bg-indigo-100 text-indigo-800 border-indigo-300",
    backend: "bg-cyan-100 text-cyan-800 border-cyan-300",
    database: "bg-emerald-100 text-emerald-800 border-emerald-300",
    auth: "bg-rose-100 text-rose-800 border-rose-300",
    api: "bg-violet-100 text-violet-800 border-violet-300",
    performance: "bg-amber-100 text-amber-800 border-amber-300",
    security: "bg-red-100 text-red-800 border-red-300",
    other: "bg-gray-100 text-gray-800 border-gray-300",
  };
  return colors[category] || colors.other;
};

function DeveloperBugDetailContent() {
  const params = useParams<{ id: string }>();
  const bugId = params.id;

  const [bug, setBug] = useState<Bug | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [status, setStatus] = useState<BugStatus>("new");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [suggestion, setSuggestion] = useState<ResolutionSuggestion | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  useEffect(() => {
    getBug(bugId)
      .then((data) => {
        setBug(data);
        setStatus(data.status);
        setResolutionNotes(data.resolution_notes || "");
      })
      .catch(() => setLoadError("Couldn't load this bug."));
  }, [bugId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const updated = await updateBugStatus(bugId, {
        status,
        resolution_notes: resolutionNotes,
      });
      setBug(updated);
      setSuccess("✅ Bug status updated successfully!");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update this bug.");
    } finally {
      setIsSaving(false);
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

  // ============================================
  // FIXED: Single return with proper structure
  // ============================================
  return (
    <div className="mx-auto w-full max-w-lg px-4 sm:px-6 md:max-w-2xl lg:max-w-3xl">
      {/* ============================================ */}
      {/* BADGES: Type, Priority, Category */}
      {/* ============================================ */}
      <div className="flex flex-wrap items-center gap-2">
        <TypePill type={bug.type} />
        <StatusPill status={bug.status} />
        
        {/* PRIORITY BADGE */}
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(bug.priority)}`}>
          {bug.priority || 'medium'}
        </span>
        
        {/* CATEGORY BADGE */}
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(bug.category)}`}>
          {bug.category || 'other'}
        </span>
      </div>

      {/* Title */}
      <h1 className="mt-2 font-display text-xl font-semibold text-ink sm:text-2xl md:text-3xl">
        {bug.title}
      </h1>

      {/* Description */}
      <p className="mt-1 text-sm text-ink-soft sm:text-base">{bug.description}</p>

      {/* Meta info */}
      <p className="mt-2 font-mono text-xs text-ink-soft sm:text-sm">
        Reported by {bug.created_by?.full_name ?? "Unknown"}
        {bug.deadline ? ` · Due ${bug.deadline}` : ""}
        {bug.assigned_to && ` · Assigned to ${bug.assigned_to.full_name}`}
      </p>

      {/* Screenshot */}
      {bug.screenshot && (
        <Card className="mt-4 p-4 sm:p-5 md:p-6">
          <p className="mb-2 text-sm font-medium text-ink sm:text-base">Screenshot</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={mediaUrl(bug.screenshot) ?? undefined} 
            alt={`Screenshot for ${bug.title}`} 
            className="w-full rounded-sm border border-line" 
          />
        </Card>
      )}

      {/* Resolution Notes (if already resolved) */}
      {bug.resolution_notes && (
        <Card className="mt-4 p-4 sm:p-5 md:p-6 bg-green-50 border-green-200">
          <p className="text-sm font-medium text-green-800">✅ Resolution Notes</p>
          <p className="mt-1 text-sm text-green-700">{bug.resolution_notes}</p>
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

      {/* Update Status Form */}
      <Card className="mt-4 p-4 sm:p-5 md:p-6">
        <h2 className="text-sm font-medium text-ink sm:text-base">Update Status</h2>
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:gap-4 md:gap-5">
          <SelectField
            label="Status"
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as BugStatus)}
            options={STATUS_OPTIONS[bug.type] ?? []}
            required
          />
          <TextareaField
            label="Resolution notes"
            id="resolution_notes"
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Fixed the button click event"
          />

          {error && <Banner variant="error">{error}</Banner>}
          {success && <Banner variant="success">{success}</Banner>}

          <Button type="submit" isLoading={isSaving} className="w-full py-2.5 text-sm sm:py-3 sm:text-base">
            Update Status
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function DeveloperBugDetailPage() {
  return (
    <RequireAuth allowedRoles={["developer"]}>
      <AppShell>
        <DeveloperBugDetailContent />
      </AppShell>
    </RequireAuth>
  );
}