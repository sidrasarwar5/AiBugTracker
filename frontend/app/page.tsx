"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardPathForRole } from "@/lib/auth";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? dashboardPathForRole(user.role) : "/login");
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <p className="font-mono text-sm text-ink-soft">Loading…</p>
    </div>
  );
}
