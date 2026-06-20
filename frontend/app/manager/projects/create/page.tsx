"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InputField, TextareaField } from "@/components/ui/Fields";
import { Banner } from "@/components/ui/Banner";
import { createProject } from "@/lib/projects";
import { ApiError } from "@/lib/api";

function CreateProjectContent() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const project = await createProject({ name, description });
      router.push(`/manager/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the project.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 sm:px-6 md:max-w-2xl lg:max-w-3xl">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl md:text-3xl">
          New project
        </h1>
        <p className="mt-1 text-xs text-ink-soft sm:text-sm md:text-base">
          A project is a container for QA and Developers to work in.
        </p>
      </div>

      <Card className="mt-4 p-4 sm:mt-6 sm:p-6 md:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4 md:gap-5">
          <InputField
            label="Name"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="E-commerce Website"
          />
          <TextareaField
            label="Description"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Our online shop"
            className="min-h-25 sm:min-h-30 md:min-h-40"
          />

          {error && <Banner variant="error">{error}</Banner>}

          <Button type="submit" isLoading={isSubmitting} className="w-full py-2.5 text-sm sm:py-3 sm:text-base">
            Create project
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <RequireAuth allowedRoles={["manager"]}>
      <AppShell>
        <CreateProjectContent />
      </AppShell>
    </RequireAuth>
  );
}