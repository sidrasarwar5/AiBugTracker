"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner } from "@/components/ui/Banner";
import { semanticSearch } from "@/lib/ai";
import type { Bug } from "@/types/api";
import { StatusPill, TypePill } from "@/components/ui/Pills";

interface SemanticSearchProps {
  projectId?: string;
  onResultClick?: (bugId: string) => void;
  placeholder?: string;
}

export function SemanticSearch({ 
  projectId, 
  onResultClick,
  placeholder = "Search bugs by meaning..." 
}: SemanticSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Bug[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const router = useRouter();

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await semanticSearch(query, projectId);
      setResults(result.results);
      if (result.results.length === 0) {
        setError("No bugs found matching your search.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (bugId: string) => {
    if (onResultClick) {
      onResultClick(bugId);
    } else {
      router.push(`/qa/bugs/${bugId}`);
    }
  };

  // Priority text styling (no colors, just text)
  const getPriorityText = (priority: string) => {
    const labels: Record<string, string> = {
      critical: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low",
    };
    return labels[priority] || "Medium";
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink bg-surface text-ink placeholder:text-ink-soft/50 text-sm"
          disabled={isLoading}
        />
        <Button
          type="button"
          onClick={handleSearch}
          isLoading={isLoading}
          className="sm:w-auto w-full bg-ink text-white hover:bg-ink/80"
        >
          {isLoading ? "Searching..." : "🔍 Search"}
        </Button>
      </div>

      {error && (
        <div className="mt-3">
          <Banner variant={hasSearched && results.length === 0 ? "warning" : "error"}>
            {error}
          </Banner>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm text-ink-soft">
            Found {results.length} result{results.length > 1 ? 's' : ''}
          </p>
          
          {results.map((bug) => (
            <Card 
              key={bug.id}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-ink/20 bg-surface"
              onClick={() => handleResultClick(bug.id)}
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <TypePill type={bug.type} />
                <StatusPill status={bug.status} />
                {bug.priority && bug.priority !== 'medium' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-line text-ink-soft">
                    {getPriorityText(bug.priority)}
                  </span>
                )}
                {bug.category && bug.category !== 'other' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-line text-ink-soft">
                    {bug.category}
                  </span>
                )}
              </div>
              
              <h3 className="text-base font-semibold text-ink hover:text-ink/70 transition-colors">
                {bug.title}
              </h3>
              
              <p className="mt-1 text-sm text-ink-soft line-clamp-2">
                {bug.description}
              </p>
              
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-soft/70">
                <span>Created: {new Date(bug.created_at).toLocaleDateString()}</span>
                {bug.assigned_to && (
                  <span>→ {bug.assigned_to.full_name}</span>
                )}
                {bug.deadline && (
                  <span>Due: {bug.deadline}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}