"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import db from "../lib/db";
import { getUserId } from "../lib/instant-helpers";

function getAuthLabel(user: unknown): string {
  if (!user || typeof user !== "object") return "Signed in";
  const u = user as Record<string, unknown>;
  const email = u.email;
  if (typeof email === "string" && email.length > 0) return email;
  const nested = u.user;
  if (nested && typeof nested === "object") {
    const n = nested as Record<string, unknown>;
    if (typeof n.email === "string" && n.email.length > 0) return n.email;
    if (typeof n.id === "string" && n.id.length > 0) return n.id;
  }
  if (typeof u.id === "string" && u.id.length > 0) return u.id;
  return "Signed in";
}

function NavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-slate-900 text-slate-50"
          : "text-slate-500 hover:bg-slate-900/5 hover:text-slate-900",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function AuthControls() {
  const { user, isLoading } = db.useAuth();

  if (isLoading) {
    return (
      <div className="h-8 w-28 animate-pulse rounded-full bg-slate-200/70" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-slate-50 shadow-sm transition hover:bg-black"
      >
        Log in
      </Link>
    );
  }

  const label = getAuthLabel(user);

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[180px] truncate text-xs text-slate-500 sm:block">
        {label}
      </span>
      <button
        type="button"
        onClick={() => db.auth.signOut()}
        className="inline-flex h-9 items-center rounded-full border border-slate-200/70 bg-white/80 px-4 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-slate-50"
      >
        Log out
      </button>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = db.useAuth();
  const userId = getUserId(user);

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_#f1f5f9,_#0f172a)] text-slate-900">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-6 pt-4 sm:px-6 lg:px-8">
        {/* Top chrome */}
        <header className="mb-6 flex items-center justify-between rounded-full border border-white/40 bg-white/80 px-4 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-slate-50 shadow-sm">
              SI
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-tight text-slate-900">
                Startup Idea Board
              </span>
              <span className="text-[10px] text-slate-400">
                Share early. Learn faster.
              </span>
            </div>
            <nav className="hidden items-center gap-1.5 sm:flex">
              <NavItem href="/">Browse</NavItem>
              {userId && (
                <>
                  <NavItem href="/new">Post</NavItem>
                  <NavItem href="/my-ideas">My ideas</NavItem>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1.5 sm:hidden">
              <NavItem href="/">Browse</NavItem>
              {userId && (
                <>
                  <NavItem href="/new">Post</NavItem>
                  <NavItem href="/my-ideas">My ideas</NavItem>
                </>
              )}
            </nav>
            <AuthControls />
          </div>
        </header>

        {/* Content card */}
        <main className="flex-1">
          <div className="rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-sm sm:p-7">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-5 flex flex-col gap-1 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Built for honest, early-stage ideas.</span>
          <span>Designed to feel calm, like a fresh notebook.</span>
        </footer>
      </div>
    </div>
  );
}