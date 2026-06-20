import { api } from "./api";
import type { Project, ProjectListItem, ProjectMember } from "@/types/api";

export async function listProjects(): Promise<ProjectListItem[]> {
  return api.get<ProjectListItem[]>("/projects/");
}

export async function getProject(id: string): Promise<Project> {
  return api.get<Project>(`/projects/${id}/`);
}

export async function createProject(payload: {
  name: string;
  description: string;
}): Promise<Project> {
  return api.post<Project>("/projects/", payload);
}

export async function addMember(
  projectId: string,
  payload: { email: string; role: "qa" | "developer" }
): Promise<ProjectMember> {
  return api.post<ProjectMember>(`/projects/${projectId}/add-member/`, payload);
}
