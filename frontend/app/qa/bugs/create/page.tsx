"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InputField, SelectField, TextareaField } from "@/components/ui/Fields";
import { Banner } from "@/components/ui/Banner";
import { listProjects, getProject } from "@/lib/projects";
import { createBug } from "@/lib/bugs";
import { ApiError } from "@/lib/api";
import type { ProjectListItem, ProjectMember } from "@/types/api";
import { improveBugReport, type BugReportSuggestions } from "@/lib/ai";
import { AICategorization } from "@/components/ui/AICategorization";

const ALLOWED_SCREENSHOT_EXT = [".png", ".gif"];

function useSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setSupported(false);
    }
  }, []);

  function startListening() {
    setError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const latest = e.results[e.results.length - 1];
      const transcript = latest[0].transcript;
      onResult(transcript);
    };
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        setError("Microphone permission denied. Please allow access and try again.");
      } else if (e.error === "network") {
        setError("No internet connection. Voice input needs an active connection.");
      } else if (e.error === "no-speech") {
        setError("No speech detected. Try again.");
      } else {
        setError("Voice input failed. Please try again.");
      }
    };
    recognition.start();

    return recognition;
  }

  return { isListening, supported, startListening, error };
}

function CreateBugContent() {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectId, setProjectId] = useState("");
  const [developers, setDevelopers] = useState<ProjectMember[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"bug" | "feature">("bug");
  const [priority, setPriority] = useState<string>("medium");
  const [category, setCategory] = useState<string>("other");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [aiSuggestions, setAiSuggestions] = useState<BugReportSuggestions | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const { isListening, supported, startListening } = useSpeechRecognition((text) => {
    setDescription((prev) => (prev ? prev + " " + text : text));
  });

  useEffect(() => {
    listProjects().then(setProjects);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let isCurrent = true;
    getProject(projectId).then((project) => {
      if (isCurrent) {
        setDevelopers(project.members.filter((m) => m.role === "developer"));
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [projectId]);

  const visibleDevelopers = projectId ? developers : [];

  function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setScreenshotError(null);
    if (file) {
      const lowerName = file.name.toLowerCase();
      const isValid = ALLOWED_SCREENSHOT_EXT.some((ext) => lowerName.endsWith(ext));
      if (!isValid) {
        setScreenshotError("Only PNG and GIF files are allowed.");
        setScreenshot(null);
        e.target.value = "";
        return;
      }
    }
    setScreenshot(file);
  }

  async function handleAiAssist() {
    if (!description) {
      setAiError("Write a description first.");
      return;
    }
    setAiError(null);
    setIsAiLoading(true);
    setAiSuggestions(null);
    try {
      const suggestions = await improveBugReport(title, description);
      setAiSuggestions(suggestions);
    } catch {
      setAiError("AI suggestions unavailable right now.");
    } finally {
      setIsAiLoading(false);
    }
  }

  const handleApplyCategorization = (
    suggestedType: string,
    suggestedPriority: string,
    suggestedCategory: string
  ) => {
    setType(suggestedType as "bug" | "feature");
    setPriority(suggestedPriority);
    setCategory(suggestedCategory);
    setSuccess(`✅ AI categorized as ${suggestedType} (${suggestedPriority} priority, ${suggestedCategory})`);
    setTimeout(() => setSuccess(null), 3000);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!projectId) {
      setError("Choose a project first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const bug = await createBug({
        title,
        description,
        type,
        priority,
        category,
        project: projectId,
        deadline: deadline || undefined,
        assigned_to_id: assignedTo || undefined,
        screenshot,
      });
      router.push(`/qa/bugs/${bug.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create this bug.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 sm:px-6 md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
      <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl md:text-3xl">
        Report a bug
      </h1>
      <p className="mt-1 text-xs text-ink-soft sm:text-sm md:text-base">
        Same title can&apos;t exist twice in one project.
      </p>

      <Card className="mt-4 sm:mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
          <SelectField
            label="Project"
            id="project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Choose a project"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            required
          />

          <InputField
            label="Title"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Login button not working"
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="description" className="text-sm font-medium text-ink">
                Description
              </label>
              {supported && (
                <button
                  type="button"
                  onClick={startListening}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    isListening
                      ? "bg-red-100 text-red-600 animate-pulse"
                      : "bg-surface text-ink-soft hover:text-ink"
                  }`}
                >
                  {isListening ? "🔴 Listening..." : "🎤 Speak"}
                </button>
              )}
            </div>
            <TextareaField
              label=""
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When I click login, nothing happens"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleAiAssist}
                isLoading={isAiLoading}
                className="mt-1 w-full sm:w-auto"
              >
                ✨ AI Assist
              </Button>
            </div>

            {aiError && <Banner variant="error">{aiError}</Banner>}
            {success && <Banner variant="success">{success}</Banner>}

            {aiSuggestions && (
              <Card className="bg-surface/50">
                <p className="text-sm font-medium text-ink">AI Suggestions</p>

                {aiSuggestions.suggested_title && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-ink-soft">Suggested title:</p>
                    <p className="text-sm text-ink">{aiSuggestions.suggested_title}</p>
                    <button
                      type="button"
                      onClick={() => setTitle(aiSuggestions.suggested_title)}
                      className="mt-1 text-xs font-medium text-blue-600 hover:underline"
                    >
                      Use this title
                    </button>
                  </div>
                )}

                {aiSuggestions.missing_info && aiSuggestions.missing_info !== "None" && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-ink-soft">Missing info:</p>
                    <p className="text-sm text-ink">{aiSuggestions.missing_info}</p>
                  </div>
                )}

                {aiSuggestions.improved_description && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-ink-soft">Improved description:</p>
                    <p className="text-sm text-ink">{aiSuggestions.improved_description}</p>
                    <button
                      type="button"
                      onClick={() => setDescription(aiSuggestions.improved_description)}
                      className="mt-1 text-xs font-medium text-blue-600 hover:underline"
                    >
                      Use this description
                    </button>
                  </div>
                )}
              </Card>
            )}
          </div>

          <AICategorization
            title={title}
            description={description}
            onApply={handleApplyCategorization}
            currentType={type}
          />

          <SelectField
            label="Type"
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as "bug" | "feature")}
            options={[
              { value: "bug", label: "Bug" },
              { value: "feature", label: "Feature" },
            ]}
            required
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <SelectField
              label="Priority"
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "critical", label: "Critical" },
              ]}
            />
            <SelectField
              label="Category"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: "ui", label: "UI" },
                { value: "backend", label: "Backend" },
                { value: "database", label: "Database" },
                { value: "performance", label: "Performance" },
                { value: "security", label: "Security" },
                { value: "auth", label: "Authentication" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <InputField
              label="Deadline"
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />

            <SelectField
              label="Assign to (optional)"
              id="assigned_to"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Assign later"
              options={visibleDevelopers.map((d) => ({ value: d.user.id, label: d.user.full_name }))}
              disabled={!projectId}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="screenshot" className="text-sm font-medium text-ink">
              Screenshot (PNG or GIF only)
            </label>
            <input
              id="screenshot"
              type="file"
              accept=".png,.gif,image/png,image/gif"
              onChange={handleScreenshotChange}
              className="w-full text-xs text-ink-soft sm:text-sm"
            />
            {screenshotError && (
              <p className="font-mono text-xs text-type-bug">{screenshotError}</p>
            )}
          </div>

          {error && <Banner variant="error">{error}</Banner>}

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Create bug
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function CreateBugPage() {
  return (
    <RequireAuth allowedRoles={["qa"]}>
      <AppShell>
        <CreateBugContent />
      </AppShell>
    </RequireAuth>
  );
}