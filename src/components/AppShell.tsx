"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import db from "../lib/db";

function getAuthLabel(user: unknown): string {
  if (!user || typeof user !== "object") return "Signed in";
  const u = user as Record<string, unknown>;
  const email = u.email;
  if (typeof email === "string" && email.length > 0) return email;
  const nested = u.user;
  if (nested && typeof nested === "object") {
    const n = nested as Record<string, unknown>;
    const nestedEmail = n.email;
    if (typeof nestedEmail === "string" && nestedEmail.length > 0)
      return nestedEmail;
    const nestedId = n.id;
    if (typeof nestedId === "string" && nestedId.length > 0) return nestedId;
  }
  const id = u.id;
  if (typeof id === "string" && id.length > 0) return id;
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
        "rounded-md px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-teal-600 text-white"
          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
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
      <div className="h-9 w-32 animate-pulse rounded-md bg-zinc-200" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
      >
        Log in
      </Link>
    );
  }

  const label = getAuthLabel(user);

  return (
    <div className="flex items-center gap-3">
      <div className="hidden max-w-[220px] truncate text-sm text-zinc-600 sm:block">
        {label}
      </div>
      <button
        type="button"
        onClick={() => db.auth.signOut()}
        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
      >
        Log out
      </button>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = db.useAuth();

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold tracking-tight text-zinc-900">
              Startup Idea Board
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavItem href="/">Browse</NavItem>
              {user ? (
                <>
                  <NavItem href="/new">Post</NavItem>
                  <NavItem href="/my-ideas">My ideas</NavItem>
                </>
              ) : null}
            </nav>
          </div>

          <AuthControls />
        </div>

        <div className="border-t border-zinc-200 bg-white sm:hidden">
          <div className="mx-auto flex max-w-5xl gap-1 px-2 py-2">
            <NavItem href="/">Browse</NavItem>
            {user ? (
              <>
                <NavItem href="/new">Post</NavItem>
                <NavItem href="/my-ideas">My ideas</NavItem>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div>Built for early-stage ideas. Be kind, be curious.</div>
          <div className="text-zinc-400">Teal-powered optimism.</div>
        </div>
      </footer>
    </div>
  );
}

