// Tokens are stored in localStorage. This is a teaching/demo project --
// for a production app you'd weigh httpOnly cookies instead, to protect
// against XSS reading the token. Noted here deliberately, not silently.

const ACCESS_KEY = "bugtracker_access";
const REFRESH_KEY = "bugtracker_refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function setAccessToken(access: string) {
  localStorage.setItem(ACCESS_KEY, access);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
