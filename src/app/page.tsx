"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import db from "../lib/db";
import { id } from "@instantdb/react";
import { getUserId, nowMs } from "../lib/instant-helpers";

const CATEGORIES = ["All", "EdTech", "FinTech", "HealthTech", "Other"] as const;
type Category = (typeof CATEGORIES)[number];

type Idea = {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: number;
  authorId: string;
};

type Vote = {
  id: string;
  ideaId: string;
  userId: string;
  key: string;
  createdAt: number;
};

function CategoryPill({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
      {category}
    </span>
  );
}

function EmptyState({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
      <div className="text-lg font-semibold text-zinc-900">
        No ideas yet — be the first.
      </div>
      <div className="mt-2 text-sm leading-6 text-zinc-600">
        Share something early and imperfect. This is a low-stakes place to learn.
      </div>
      <div className="mt-5 flex justify-center">
        <Link
          href={signedIn ? "/new" : "/login?next=/new"}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Post an idea
        </Link>
      </div>
    </div>
  );
}

function IdeaCard({
  idea,
  voteCount,
  voted,
  onToggleVote,
  signedIn,
}: {
  idea: Idea;
  voteCount: number;
  voted: boolean;
  signedIn: boolean;
  onToggleVote: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
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
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <CategoryPill category={idea.category} />
            <span className="text-xs text-zinc-500">
              {new Date(idea.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs font-semibold text-zinc-500">Votes</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">
            {voteCount}
          </div>
          <button
            type="button"
            onClick={onToggleVote}
            className={[
              "mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg text-sm font-semibold transition",
              signedIn
                ? voted
                  ? "bg-teal-50 text-teal-800 hover:bg-teal-100"
                  : "bg-teal-600 text-white hover:bg-teal-700"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
            ].join(" ")}
          >
            {signedIn ? (voted ? "Voted" : "Upvote") : "Log in to vote"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BrowseIdeasPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = db.useAuth();

  const { isLoading, error, data } = db.useQuery({
    ideas: {},
    votes: {},
  });

  const [category, setCategory] = useState<Category>("All");
  const [sort, setSort] = useState<"top" | "new">("top");

  const userId = getUserId(user);

  const { ideas, voteCountByIdeaId, voteByKey } = useMemo(() => {
    const q = data as unknown as { ideas?: Idea[]; votes?: Vote[] };
    const raw = q?.ideas ?? [];
    const rawVotes = q?.votes ?? [];

    const counts = new Map<string, number>();
    for (const v of rawVotes) {
      counts.set(v.ideaId, (counts.get(v.ideaId) ?? 0) + 1);
    }

    const byKey = new Map<string, Vote>();
    for (const v of rawVotes) {
      byKey.set(v.key, v);
    }

    const filtered =
      category === "All"
        ? raw
        : raw.filter((i) => i.category === category);

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "new") return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      const av = counts.get(a.id) ?? 0;
      const bv = counts.get(b.id) ?? 0;
      if (bv !== av) return bv - av;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });

    return {
      ideas: sorted as Idea[],
      voteCountByIdeaId: counts,
      voteByKey: byKey,
    };
  }, [data, category, sort]);

  function toggleVote(ideaId: string) {
    if (!userId) {
      router.push("/login?next=/");
      return;
    }
    const key = `${ideaId}:${userId}`;
    const existing = voteByKey.get(key);
    if (existing) {
      db.transact(db.tx.votes[existing.id].delete());
      return;
    }
    db.transact(
      db.tx.votes[id()].update({
        ideaId,
        userId,
        key,
        createdAt: nowMs(),
      })
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Startup Idea Board
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              Share early-stage startup ideas, browse what others are thinking,
              and vote to surface what’s most exciting.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href={user ? "/new" : "/login?next=/new"}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Post an idea
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-600">
              Category
            </span>
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

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-600">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "top" | "new")}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-teal-600 focus:ring-2"
            >
              <option value="top">Most voted</option>
              <option value="new">Newest</option>
            </select>
          </label>
        </div>

        <div className="mt-4 text-xs text-zinc-500">
          {authLoading
            ? "Checking login…"
            : user
              ? "You’re signed in — voting and posting are enabled."
              : "You can browse without logging in. Log in to post and vote."}
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-3">
          <div className="h-28 animate-pulse rounded-2xl bg-zinc-200" />
          <div className="h-28 animate-pulse rounded-2xl bg-zinc-200" />
          <div className="h-28 animate-pulse rounded-2xl bg-zinc-200" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Error: {error.message}
        </div>
      ) : ideas.length === 0 ? (
        <EmptyState signedIn={!!user} />
      ) : (
        <div className="grid gap-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              voteCount={voteCountByIdeaId.get(idea.id) ?? 0}
              voted={!!voteByKey.get(`${idea.id}:${userId}`)}
              signedIn={!!userId}
              onToggleVote={() => toggleVote(idea.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <BrowseIdeasPage />;
}
