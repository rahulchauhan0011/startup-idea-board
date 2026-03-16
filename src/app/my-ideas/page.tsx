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
    <span className="inline-flex items-center rounded-full bg-slate-900/5 px-2.5 py-1 text-xs font-medium text-slate-700">
      {category}
    </span>
  );
}

function EmptyState({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-10 text-center">
      <div className="text-lg font-semibold tracking-tight text-slate-900">
        No ideas yet — be the first one in.
      </div>
      <div className="mt-3 text-sm leading-7 text-slate-600">
        Share something rough and early. This space is for experiments, not
        polished pitch decks.
      </div>
      <div className="mt-6 flex justify-center">
        <Link
          href={signedIn ? "/new" : "/login?next=/new"}
          className="inline-flex h-11 items-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-slate-50 shadow-sm transition hover:bg-black"
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
  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/ideas/${idea.id}`
        : `/ideas/${idea.id}`;
    try {
      await navigator.clipboard.writeText(url);
      window.alert("Link copied! You can paste it anywhere.");
    } catch {
      window.alert(
        "Sorry, could not copy the link. You can still copy it from the address bar."
      );
    }
  }

  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-transform transition-shadow duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,0.14)]">
      <div className="flex items-start justify-between gap-4">
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
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <CategoryPill category={idea.category} />
            <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Votes
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {voteCount}
            </div>
            <button
              type="button"
              onClick={onToggleVote}
              className={[
                "mt-2 inline-flex h-8 w-full items-center justify-center rounded-full text-[11px] font-semibold transition",
                signedIn
                  ? voted
                    ? "bg-slate-900/5 text-slate-900 hover:bg-slate-900/10"
                    : "bg-slate-900 text-slate-50 hover:bg-black"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {signedIn ? (voted ? "Voted" : "Upvote") : "Log in to vote"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex h-8 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Share
          </button>
        </div>
      </div>
    </article>
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

  const { ideas, voteCountByIdeaId, voteByKey, trending } = useMemo(() => {
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

    const trending = [...raw]
      .sort((a, b) => {
        const av = counts.get(a.id) ?? 0;
        const bv = counts.get(b.id) ?? 0;
        if (bv !== av) return bv - av;
        return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      })
      .slice(0, 3) as Idea[];

    return {
      ideas: sorted as Idea[],
      voteCountByIdeaId: counts,
      voteByKey: byKey,
      trending,
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
    <div className="space-y-6">
      {/* Hero */}
      <section className="space-y-5 border-b border-slate-100 pb-5">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Share ideas before they’re startups.
          </h1>
          <p className="max-w-2xl text-sm sm:text-base leading-7 text-slate-600">
            A calm, focused board for rough concepts. Post an idea in a few
            sentences, see what resonates, and learn from early signals—not
            vanity metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={user ? "/new" : "/login?next=/new"}
            className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-slate-50 shadow-sm transition hover:bg-black"
          >
            Post an idea
          </Link>
          <span className="text-xs text-slate-500">
            You can always browse without logging in.
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs">
            <span className="font-semibold text-slate-500">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs">
            <span className="font-semibold text-slate-500">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "top" | "new")}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 outline-none ring-slate-900/10 focus:ring-2"
            >
              <option value="top">Most voted</option>
              <option value="new">Newest first</option>
            </select>
          </label>
        </div>

        <div className="text-[11px] text-slate-500">
          {authLoading
            ? "Checking your login status…"
            : user
            ? "You’re signed in — posting and voting are unlocked."
            : "You’re browsing as a guest. Log in with a magic code to post and vote."}
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="space-y-3 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                Trending today
              </h2>
              <p className="text-[11px] text-slate-500">
                Top 3 ideas by votes across all categories.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {trending.map((idea) => (
              <div
                key={idea.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="block truncate text-sm font-semibold tracking-tight text-slate-900 hover:underline"
                  >
                    {idea.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>{idea.category}</span>
                    <span>•</span>
                    <span>
                      {voteCountByIdeaId.get(idea.id) ?? 0}{" "}
                      {voteCountByIdeaId.get(idea.id) === 1 ? "vote" : "votes"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ideas list */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-900">
          Error loading ideas: {error.message}
        </div>
      ) : ideas.length === 0 ? (
        <EmptyState signedIn={!!userId} />
      ) : (
        <div className="space-y-3">
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