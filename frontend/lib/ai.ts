import { api } from "./api";
import type { Bug } from "@/types/api";

export interface BugReportSuggestions {
  suggested_title: string;
  missing_info: string;
  improved_description: string;
  error?: string;
  is_valid: boolean;
}

export interface BugCategorization {
  type: string;
  priority: string;
  category: string;
  reason: string;
  error?: string;
  is_valid: boolean;
}

export interface SemanticSearchResult {
  results: Bug[];
  total: number;
  query: string;
  method: "ai" | "fallback";
  message?: string;
}

// ============================================
// AI Assist - Improve Bug Report
// ============================================
export async function improveBugReport(
  title: string,
  description: string
): Promise<BugReportSuggestions> {
  return api.post<BugReportSuggestions>("/ai/improve-report", { title, description });
}

// ============================================
// AI Categorization
// ============================================
export async function categorizeBug(
  title: string,
  description: string
): Promise<BugCategorization> {
  return api.post<BugCategorization>("/ai/categorize/", { title, description });
}

// ============================================
// Semantic Search
// ============================================
export async function semanticSearch(
  query: string,
  projectId?: string
): Promise<SemanticSearchResult> {
  return api.post<SemanticSearchResult>("/ai/semantic-search/", {
    query,
    project_id: projectId
  });
}


// ============================================
// Chatbot
// ============================================
export interface ChatResponse {
  conversation_id: string;
  reply: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  return api.post<ChatResponse>("/ai/chat/", {
    message,
    conversation_id: conversationId,
  });
}

export async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
  return api.get<ChatMessage[]>(`/ai/chat/${conversationId}/history/`);
}


// ============================================
// Resolution Suggestions (RAG)
// ============================================
export interface SimilarBugRef {
  id: string;
  title: string;
}

export interface ResolutionSuggestion {
  suggestion: string;
  similar_bugs: SimilarBugRef[];
  method: "ai" | "fallback";
  error: string | null;
}

export async function suggestResolution(bugId: string): Promise<ResolutionSuggestion> {
  return api.get<ResolutionSuggestion>(`/ai/suggest-resolution/${bugId}/`);
}