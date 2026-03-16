"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import db from "../../lib/db";
import { errorMessage } from "../../lib/instant-helpers";

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => searchParams.get("next") ?? "/",
    [searchParams]
  );

  const { user, isLoading } = db.useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoading && user) {
    router.replace(nextPath);
    return null;
  }

  async function sendCode() {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await db.auth.sendMagicCode({ email: trimmed });
      setEmail(trimmed);
      setStep("code");
    } catch (e: unknown) {
      setError(errorMessage(e, "Could not send code. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    const trimmedCode = code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await db.auth.signInWithMagicCode({ email, code: trimmedCode });
      router.replace(nextPath);
    } catch (e: unknown) {
      setError(errorMessage(e, "That code didn’t work. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Welcome back
        </h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600">
          Log in with a 6-digit code. No passwords, no stress.
        </p>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {step === "email" ? (
          <form
            className="mt-5 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
          >
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-800">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@school.edu"
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-900 outline-none ring-teal-600 placeholder:text-zinc-400 focus:ring-2"
                autoComplete="email"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-lg bg-teal-600 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send my code"}
            </button>

            <p className="text-xs leading-5 text-zinc-500">
              We’ll email you a one-time code. If you don’t see it, check spam.
            </p>
          </form>
        ) : (
          <form
            className="mt-5 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void verifyCode();
            }}
          >
            <div className="text-sm text-zinc-700">
              Code sent to <span className="font-medium">{email}</span>
            </div>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-800">
                6-digit code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                placeholder="123456"
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-900 outline-none ring-teal-600 placeholder:text-zinc-400 focus:ring-2"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-lg bg-teal-600 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {busy ? "Verifying…" : "Log in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="h-11 rounded-lg border border-zinc-200 bg-white font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>

      <div className="rounded-xl bg-teal-50 p-4 text-sm text-teal-900">
        <div className="font-semibold">New here?</div>
        <div className="mt-1 text-teal-800">
          Just enter your email and we’ll create your account automatically.
        </div>
      </div>
    </div>
  );
}

