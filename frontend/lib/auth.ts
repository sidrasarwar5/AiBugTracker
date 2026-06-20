import { api } from "./api";
import { clearTokens, setTokens } from "./tokens";
import type { LoginResponse, Profile, Role } from "@/types/api";

export interface SignupPayload {
  full_name: string;
  email: string;
  password: string;
  role: Role;
}

export async function signup(payload: SignupPayload): Promise<Profile> {
  return api.post<Profile>("/auth/signup/", payload, { skipAuth: true });
}

export async function login(email: string, password: string): Promise<Profile> {
  const data = await api.post<LoginResponse>(
    "/auth/login/",
    { email, password },
    { skipAuth: true }
  );
  setTokens(data.access, data.refresh);
  return data.user;
}

export function logout() {
  clearTokens();
}

export async function fetchMe(): Promise<Profile> {
  return api.get<Profile>("/auth/me/");
}

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "manager":
      return "/manager/dashboard";
    case "qa":
      return "/qa/dashboard";
    case "developer":
      return "/developer/dashboard";
  }
}
