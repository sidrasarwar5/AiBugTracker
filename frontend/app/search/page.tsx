"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Fields";
import { Banner } from "@/components/ui/Banner";
import { StatusPill, TypePill } from "@/components/ui/Pills";
import { searchBugs } from "@/lib/bugs";
import { ApiError } from "@/lib/api";
import type { Bug } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";

function SearchContent() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Bug[] | null>(null);
  const [searchMethod, setSearchMethod] = useState<"ai" | "fallback" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const { user } = useAuth();

function getBugLink(bug: Bug) {
  if (user?.role === "developer") return `/developer/bugs/${bug.id}`;
  return `/qa/bugs/${bug.id}`;
}

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    try {
      const data = await searchBugs(trimmed);
      setResults(data.results);
      setSearchMethod(data.method);
      setLastQuery(trimmed);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Search failed. Try again.");
      setResults(null);
      setSearchMethod(null);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink">Search bugs</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Search by meaning, not just exact words -- try describing the problem instead of guessing
        the title.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex items-end gap-3">
        <div className="flex-1">
          <InputField
            label="What are you looking for?"
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. cant sign in, page loads slow, cart total wrong"
          />
        </div>
        <Button type="submit" isLoading={isSearching} disabled={!query.trim()}>
          Search
        </Button>
      </form>

      {error && (
        <div className="mt-4">
          <Banner variant="error">{error}</Banner>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {results !== null && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs text-ink-soft">
              {results.length} result{results.length === 1 ? "" : "s"} for &quot;{lastQuery}&quot;
            </p>
            {searchMethod === "ai" && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                ✨ AI-powered results
              </span>
            )}
            {searchMethod === "fallback" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                🔍 Keyword search (AI quota reached)
              </span>
            )}
          </div>
        )}

        {results !== null && results.length === 0 && (
          <Card>
            <p className="text-sm text-ink-soft">
              No bugs matched that search. Try describing it differently.
            </p>
          </Card>
        )}

        {results?.map((bug) => (
          <Link key={bug.id} href={getBugLink(bug)}>
            <Card className="flex flex-col gap-2 transition-colors hover:border-ink/30 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-ink">{bug.title}</p>
                <p className="mt-0.5 text-sm text-ink-soft line-clamp-1">{bug.description}</p>
              </div>
              <div className="flex items-center gap-2">
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

export default function SearchPage() {
  return (
    <RequireAuth allowedRoles={["qa", "developer"]}>
      <AppShell>
        <SearchContent />
      </AppShell>
    </RequireAuth>
  );
}