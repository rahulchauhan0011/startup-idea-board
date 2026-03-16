"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import db from "../../lib/db";
import { id } from "@instantdb/react";
import { errorMessage, getUserId, nowMs } from "../../lib/instant-helpers";

const CATEGORIES = ["EdTech", "FinTech", "HealthTech", "Other"] as const;
type Category = (typeof CATEGORIES)[number];

export default function NewIdeaPage() {
  const router = useRouter();
  const { user, isLoading } = db.useAuth();
  const userId = getUserId(user);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const t = title.trim();
    const d = description.trim();
    return t.length >= 6 && d.length >= 10 && d.length <= 400;
  }, [title, description]);

  if (!isLoading && !user) {
    router.replace("/login?next=/new");
    return null;
  }

  async function submit() {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      const ideaId = id();
      await db.transact(
        db.tx.ideas[ideaId].update({
          title: title.trim(),
          description: description.trim(),
          category,
          createdAt: nowMs(),
          authorId: userId,
        })
      );
      router.push(`/ideas/${ideaId}`);
    } catch (e: unknown) {
      setError(errorMessage(e, "Could not post your idea. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Post a startup idea
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Keep it simple: a clear title and 1–3 sentences. Early ideas welcome.
        </p>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <form
          className="mt-6 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy && canSubmit) void submit();
          }}
        >
          <label className="grid gap-1">
            <span className="text-sm font-semibold text-zinc-800">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI tutor for GMAT prep"
              className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-900 outline-none ring-teal-600 placeholder:text-zinc-400 focus:ring-2"
              maxLength={80}
            />
            <span className="text-xs text-zinc-500">
              {title.trim().length}/80
            </span>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-semibold text-zinc-800">
              Description (1–3 sentences)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What problem does it solve, and who is it for?"
              className="min-h-28 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none ring-teal-600 placeholder:text-zinc-400 focus:ring-2"
              maxLength={400}
            />
            <span className="text-xs text-zinc-500">
              {description.trim().length}/400
            </span>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-semibold text-zinc-800">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-900 outline-none ring-teal-600 focus:ring-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="h-11 rounded-lg bg-teal-600 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {busy ? "Posting…" : "Post idea"}
          </button>
        </form>
      </div>

      <div className="rounded-xl bg-teal-50 p-4 text-sm text-teal-900">
        <div className="font-semibold">Tip</div>
        <div className="mt-1 text-teal-800">
          If you’re unsure, write the title like: “A tool that helps [who] do
          [what] faster.”
        </div>
      </div>
    </div>
  );
}

