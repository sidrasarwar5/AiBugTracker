"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner } from "@/components/ui/Banner";
import { categorizeBug, type BugCategorization } from "@/lib/ai";

interface AICategorizationProps {
  title: string;
  description: string;
  onApply: (type: string, priority: string, category: string) => void;
  currentType: string;
}

export function AICategorization({ 
  title, 
  description, 
  onApply, 
  currentType 
}: AICategorizationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<BugCategorization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const handleCategorize = async () => {
    if (!description) {
      setError("Write a description first.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setApplied(false);
    setSuggestions(null);

    try {
      const result = await categorizeBug(title, description);
      setSuggestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get categorization");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAll = () => {
    if (suggestions) {
      onApply(suggestions.type, suggestions.priority, suggestions.category);
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    }
  };

  const handleApplyField = (type: string, priority: string, category: string) => {
    onApply(type, priority, category);
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  };

  // Get priority color for visual display
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800 border-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-green-100 text-green-800 border-green-300",
    };
    return colors[priority] || colors.medium;
  };

  const getTypeColor = (type: string) => {
    return type === 'feature' 
      ? "bg-purple-100 text-purple-800 border-purple-300"
      : "bg-blue-100 text-blue-800 border-blue-300";
  };

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

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleCategorize}
          isLoading={isLoading}
          className="w-full sm:w-auto bg-linear-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border border-purple-200 text-purple-800"
        >
          {isLoading ? "Analyzing..." : "🏷️ AI Categorize"}
        </Button>
        {applied && (
          <span className="text-sm text-green-600 animate-in fade-in duration-300">
            ✅ Applied!
          </span>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <Banner variant="error">{error}</Banner>
        </div>
      )}

      {suggestions && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <Card className="bg-surface/50 p-4 border-purple-200 border-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-ink">🤖 AI Categorization</p>
              {suggestions.is_valid !== false && (
                <button
                  type="button"
                  onClick={handleApplyAll}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Apply All
                </button>
              )}
            </div>

            {/* Invalid Input - Friendly Message */}
            {suggestions.is_valid === false && suggestions.error && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {suggestions.error}
                    </p>
                    <p className="text-xs text-amber-600 mt-2">
                      💡 Tip: Add more details like steps to reproduce, expected vs actual behavior
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Valid Suggestions */}
            {suggestions.is_valid !== false && (
              <div className="space-y-3">
                {/* Type */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-ink-soft">Type</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(suggestions.type)}`}>
                      {suggestions.type || 'bug'}
                    </span>
                  </div>
                  {suggestions.type && suggestions.type !== currentType && (
                    <button
                      type="button"
                      onClick={() => handleApplyField(suggestions.type, suggestions.priority, suggestions.category)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Use this
                    </button>
                  )}
                </div>

                {/* Priority */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-ink-soft">Priority</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(suggestions.priority)}`}>
                      {suggestions.priority || 'medium'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyField(suggestions.type, suggestions.priority, suggestions.category)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Use this
                  </button>
                </div>

                {/* Category */}
                <div>
                  <p className="text-xs font-medium text-ink-soft">Category</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(suggestions.category)}`}>
                    {suggestions.category || 'other'}
                  </span>
                </div>

                {/* Reason */}
                {suggestions.reason && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-xs font-medium text-ink-soft">Why:</p>
                    <p className="text-sm text-ink mt-1">{suggestions.reason}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}