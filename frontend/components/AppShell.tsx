"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types/api";
import { ChatWidget } from "@/components/ui/ChatWidget";

interface NavLink {
  href: string;
  label: string;
}

const NAV_BY_ROLE: Record<Role, NavLink[]> = {
  manager: [
    { href: "/manager/dashboard", label: "Dashboard" },
    { href: "/manager/projects", label: "Projects" },
  ],
  qa: [
    { href: "/qa/dashboard", label: "Dashboard" },
    { href: "/qa/projects", label: "Projects" },
    { href: "/qa/bugs/create", label: "Report bug" },
    { href: "/search", label: "Search" },
  ],
  developer: [
    { href: "/developer/dashboard", label: "Dashboard" },
    { href: "/developer/bugs", label: "My bugs" },
    { href: "/search", label: "Search" },
  ],
};
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const links = NAV_BY_ROLE[user.role];

  return (
    <div className="flex min-h-screen flex-col bg-paper md:flex-row">
      {/* Mobile top bar -- hidden on md and up, where the sidebar is always visible */}
      <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
        <p className="font-display text-lg font-semibold tracking-tight text-ink">Bug Tracker</p>
        <button
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
          className="rounded-sm border border-ink/20 p-2 text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* Backdrop -- only rendered (and only intercepts taps) while the drawer is open */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-40 bg-ink/30 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col border-r border-line bg-white px-4 py-6 transition-transform duration-200 md:relative md:translate-x-0 md:w-60 ${
          isMenuOpen ? "translate-x-0" : ""
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-ink">
              Bug Tracker
            </p>
            <p className="mt-0.5 font-mono text-xs text-ink-soft">{user.role}</p>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
            className="rounded-sm p-1 text-ink-soft md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l10 10M14 4L4 14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`rounded-sm px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-ink text-paper"
                    : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line pt-4">
          <p className="truncate px-2 text-sm font-medium text-ink">{user.full_name}</p>
          <p className="truncate px-2 font-mono text-xs text-ink-soft">{user.email}</p>
          <button
            onClick={logout}
            className="mt-2 w-full rounded-sm px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">{children}</main>

      <ChatWidget />
    </div>
  );
}