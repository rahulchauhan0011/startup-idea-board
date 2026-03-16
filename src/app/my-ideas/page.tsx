"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import db from "../../lib/db";
import { errorMessage, getUserId } from "../../lib/instant-helpers";

const CATEGORIES = ["EdTech", "FinTech", "HealthTech", "Other"] as const;
type Category = (typeof CATEGORIES)[number];

type Idea = {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: number;
  authorId: string;
};

function isCategory(v: string): v is Category {
  return (CATEGORIES as readonly string[]).includes(v);
}

function IdeaEditor({
  idea,
  onDone,
}: {
  idea: Idea;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(idea.title);
  const [description, setDescription] = useState(idea.description);
  const [category, setCategory] = useState<Category>(
    isCategory(idea.category) ? idea.category : "Other"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = title.trim().length >= 6 && description.trim().length >= 10;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await db.transact(
        db.tx.ideas[idea.id].update({
          title: title.trim(),
          description: description.trim(),
          category,
        })
      );
      onDone();
    } catch (e: unknown) {
      setError(errorMessage(e, "Could not save changes. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      {error ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-zinc-600">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-teal-600 focus:ring-2"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-zinc-600">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-teal-600 focus:ring-2"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-zinc-600">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-teal-600 focus:ring-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void save()}
            disabled={!canSave || busy}
            className="h-10 rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyIdeasPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = db.useAuth();

  const userId = getUserId(user);

  const { isLoading, error, data } = db.useQuery({
    ideas: {},
  });

  const myIdeas: Idea[] = useMemo(() => {
    const q = data as unknown as { ideas?: Idea[] };
    const raw = q?.ideas ?? [];
    return raw
      .filter((i) => i.authorId === userId)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [data, userId]);

  const [editingId, setEditingId] = useState<string | null>(null);

  if (!authLoading && !user) {
    router.replace("/login?next=/my-ideas");
    return null;
  }

  async function deleteIdea(ideaId: string) {
    if (!confirm("Delete this idea? This cannot be undone.")) return;
    await db.transact(db.tx.ideas[ideaId].delete());
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              My ideas
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Edit or delete your posts anytime. Keep experimenting.
            </p>
          </div>
          <Link
            href="/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Post a new idea
          </Link>
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-3">
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-200" />
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-200" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Error: {error.message}
        </div>
      ) : myIdeas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <div className="text-lg font-semibold text-zinc-900">
            You haven’t posted any ideas yet.
          </div>
          <div className="mt-2 text-sm leading-6 text-zinc-600">
            Your first post can be short. The goal is momentum, not perfection.
          </div>
          <div className="mt-5 flex justify-center">
            <Link
              href="/new"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Post my first idea
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {myIdeas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="block text-base font-semibold tracking-tight text-zinc-900 hover:underline"
                  >
                    {idea.title}
                  </Link>
                  <div className="mt-2 text-sm leading-6 text-zinc-700">
                    {idea.description}
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">
                    {idea.category} •{" "}
                    {new Date(idea.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingId((cur) => (cur === idea.id ? null : idea.id))
                    }
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    {editingId === idea.id ? "Close" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteIdea(idea.id)}
                    className="h-9 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingId === idea.id ? (
                <IdeaEditor idea={idea} onDone={() => setEditingId(null)} />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

