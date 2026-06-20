import { api } from "./api";
import type { Bug, BugType } from "@/types/api";

export async function listBugs(projectId?: string): Promise<Bug[]> {
  const query = projectId ? `?project=${projectId}` : "";
  return api.get<Bug[]>(`/bugs/${query}`);
}

export async function getBug(id: string): Promise<Bug> {
  return api.get<Bug>(`/bugs/${id}/`);
}

export interface CreateBugPayload {
  title: string;
  description: string;
  type: BugType;
  priority?: string;
  category?: string;
  project: string;
  deadline?: string;
  assigned_to_id?: string;
  screenshot?: File | null;
}

export async function createBug(payload: CreateBugPayload): Promise<Bug> {
  // Screenshot upload requires multipart/form-data, not JSON.
  if (payload.screenshot) {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("type", payload.type);
    if (payload.priority) formData.append("priority", payload.priority);
    if (payload.category) formData.append("category", payload.category);
    formData.append("project", payload.project);
    if (payload.deadline) formData.append("deadline", payload.deadline);
    if (payload.assigned_to_id) formData.append("assigned_to_id", payload.assigned_to_id);
    formData.append("screenshot", payload.screenshot);
    return api.post<Bug>("/bugs/", formData, { isFormData: true });
  }

  const jsonPayload = {
    title: payload.title,
    description: payload.description,
    type: payload.type,
    ...(payload.priority ? { priority: payload.priority } : {}),
    ...(payload.category ? { category: payload.category } : {}),
    project: payload.project,
    ...(payload.deadline ? { deadline: payload.deadline } : {}),
    ...(payload.assigned_to_id ? { assigned_to_id: payload.assigned_to_id } : {}),
  };
  return api.post<Bug>("/bugs/", jsonPayload);
}

export async function updateBug(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    deadline: string;
    assigned_to_id: string;
  }>
): Promise<Bug> {
  return api.patch<Bug>(`/bugs/${id}/`, payload);
}

export async function assignBug(id: string, assignedToId: string): Promise<Bug> {
  return api.post<Bug>(`/bugs/${id}/assign/`, { assigned_to_id: assignedToId });
}

export async function updateBugStatus(
  id: string,
  payload: { status: string; resolution_notes?: string }
): Promise<Bug> {
  return api.patch<Bug>(`/bugs/${id}/status/`, payload);
}

export interface SearchBugsResult {
  results: Bug[];
  method: "ai" | "fallback";
}

export async function searchBugs(query: string, projectId?: string): Promise<SearchBugsResult> {
  const params = new URLSearchParams({ q: query });
  if (projectId) params.set("project", projectId);
  return api.get<SearchBugsResult>(`/bugs/search/?${params.toString()}`);
}