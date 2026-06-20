"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types/api";
import { dashboardPathForRole } from "@/lib/auth";

interface RequireAuthProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

/**
 * Wraps a page. Per the spec:
 * - not logged in -> redirect to /login
 * - logged in but wrong role for this page -> redirect to their own dashboard
 *   (e.g. a Developer hitting /manager/dashboard bounces to /developer/dashboard)
 */
export function RequireAuth({ allowedRoles, children }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <p className="font-mono text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}