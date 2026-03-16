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

  const canSave =
    title.trim().length >= 6 && description.trim().length >= 10;

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
    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
      {error ? (
        <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 text-sm">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="h-9 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={!canSave || busy}
            className="inline-flex h-9 items-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-slate-50 shadow-sm transition hover:bg-black disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50"
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

  if (!authLoading && !userId) {
    router.replace("/login?next=/my-ideas");
    return null;
  }

  async function deleteIdea(ideaId: string) {
    if (!confirm("Delete this idea? This cannot be undone.")) return;
    await db.transact(db.tx.ideas[ideaId].delete());
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 border-b border-slate-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Your ideas, in one place.
        </h1>
        <p className="max-w-2xl text-sm sm:text-base leading-7 text-slate-600">
          Come back here to refine, rename, or retire ideas as you learn more.
          Treat it like a private roadmap for your own thinking.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/new"
            className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-slate-50 shadow-sm transition hover:bg-black"
          >
            Post a new idea
          </Link>
          <span className="text-xs text-slate-500">
            You can always delete or edit later.
          </span>
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-900">
          Error loading your ideas: {error.message}
        </div>
      ) : myIdeas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center">
          <div className="text-lg font-semibold text-slate-900">
            You haven’t posted any ideas yet.
          </div>
          <div className="mt-3 text-sm leading-7 text-slate-600">
            Your first post can be short. The important part is getting the
            concept out of your head and into a place you can revisit.
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              href="/new"
              className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-slate-50 shadow-sm transition hover:bg-black"
            >
              Post my first idea
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {myIdeas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="block text-base font-semibold tracking-tight text-slate-900 hover:underline"
                  >
                    {idea.title}
                  </Link>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {idea.description}
                  </p>
                  <div className="mt-3 text-xs text-slate-500">
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
                    className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    {editingId === idea.id ? "Close" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteIdea(idea.id)}
                    className="inline-flex h-9 items-center rounded-full border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
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