export type Role = "manager" | "qa" | "developer";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  user: Profile;
  role: "qa" | "developer";
  added_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_by: Profile;
  members: ProjectMember[];
  created_at: string;
  updated_at: string;
}

// Lighter shape returned by GET /projects/ (list view)
export interface ProjectListItem {
  id: string;
  name: string;
  description: string;
  created_by: Profile;
  member_count: number;
  created_at: string;
}

export type BugType = "bug" | "feature";
export type BugStatus = "new" | "started" | "resolved" | "completed";

export interface Bug {
  id: string;
  title: string;
  description: string;
  type: BugType;
  status: BugStatus;
  deadline: string | null;
  screenshot: string | null;
  project: string;
  assigned_to: Profile | null;
  created_by: Profile;
  resolution_notes: string;
  created_at: string;
  updated_at: string;
   priority: string;
  category: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user: Profile;
}

// Generic shape of DRF validation error responses, e.g.
// {"email": ["User not found"]} or {"detail": "Not found."}
export type ApiErrorBody = Record<string, string[] | string> | { detail: string };
