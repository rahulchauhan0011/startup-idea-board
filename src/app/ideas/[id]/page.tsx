"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import db from "../../../lib/db";
import { id as newId } from "@instantdb/react";
import {
  errorMessage,
  getUserId,
  nowMs,
} from "../../../lib/instant-helpers";

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

type Comment = {
  id: string;
  ideaId: string;
  userId: string;
  text: string;
  createdAt: number;
};

export default function IdeaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const ideaId = params.id;

  const { user, isLoading: authLoading } = db.useAuth();
  const userId = getUserId(user);

  const { isLoading, error, data } = db.useQuery({
    ideas: {},
    votes: {},
    comments: {},
  });

  const { idea, voteCount, voted, existingVote, comments } = useMemo(() => {
    const q = data as unknown as {
      ideas?: Idea[];
      votes?: Vote[];
      comments?: Comment[];
    };
    const ideas = q?.ideas ?? [];
    const votes = q?.votes ?? [];
    const rawComments = q?.comments ?? [];

    const idea = ideas.find((i) => i.id === ideaId) ?? null;

    const voteCount = votes.reduce(
      (acc, v) => (v.ideaId === ideaId ? acc + 1 : acc),
      0
    );
    const key = userId ? `${ideaId}:${userId}` : "";
    const existingVote = key ? votes.find((v) => v.key === key) ?? null : null;

    const comments = rawComments
      .filter((c) => c.ideaId === ideaId)
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

    return {
      idea,
      voteCount,
      voted: !!existingVote,
      existingVote,
      comments,
    };
  }, [data, ideaId, userId]);

  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function toggleVote() {
    if (!userId) {
      router.push(`/login?next=/ideas/${ideaId}`);
      return;
    }
    if (existingVote) {
      db.transact(db.tx.votes[existingVote.id].delete());
      return;
    }
    db.transact(
      db.tx.votes[newId()].update({
        ideaId,
        userId,
        key: `${ideaId}:${userId}`,
        createdAt: nowMs(),
      })
    );
  }

  async function addComment() {
    if (!userId) {
      router.push(`/login?next=/ideas/${ideaId}`);
      return;
    }
    const text = commentText.trim();
    if (text.length < 2) {
      setFormError("Write at least a couple of words.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await db.transact(
        db.tx.comments[newId()].update({
          ideaId,
          userId,
          text,
          createdAt: nowMs(),
        })
      );
      setCommentText("");
    } catch (e: unknown) {
      setFormError(
        errorMessage(e, "Could not post comment. Please try again.")
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment(comment: Comment) {
    if (comment.userId !== userId) return;
    if (!confirm("Delete this comment?")) return;
    await db.transact(db.tx.comments[comment.id].delete());
  }

  const isOwner = !!idea && !!userId && idea.authorId === userId;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-32 animate-pulse rounded-full bg-slate-100" />
        <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-900">
        Error loading idea: {error.message}
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="text-lg font-semibold text-slate-900">
          Idea not found
        </div>
        <div className="mt-2 text-sm text-slate-600">
          It may have been deleted or the link is incorrect.
        </div>
        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-slate-50 shadow-sm transition hover:bg-black"
          >
            Back to the board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top nav row */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <span>←</span>
          <span>Back to ideas</span>
        </Link>
        {isOwner ? (
          <Link
            href="/my-ideas"
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
          >
            Manage in My ideas →
          </Link>
        ) : null}
      </div>

      {/* Idea + votes */}
      <section className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:grid-cols-[minmax(0,3fr)_minmax(0,1.3fr)]">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Live idea</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {idea.title}
          </h1>
          <p className="text-sm sm:text-base leading-7 text-slate-700">
            {idea.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center rounded-full bg-slate-900/5 px-2.5 py-1 font-medium text-slate-800">
              {idea.category}
            </span>
            <span>{new Date(idea.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col items-stretch justify-between rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
          <div className="space-y-2 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Interest
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {voteCount}
            </div>
            <p className="text-[11px] leading-5 text-slate-500">
              Each vote is from someone who’d like to see this explored.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={toggleVote}
              className={[
                "inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold transition",
                userId
                  ? voted
                    ? "bg-slate-900/5 text-slate-900 hover:bg-slate-900/10"
                    : "bg-slate-900 text-slate-50 hover:bg-black"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {userId ? (voted ? "Voted" : "Upvote idea") : "Log in to vote"}
            </button>
            <div className="text-[11px] text-slate-500">
              {!authLoading && !user ? "Voting requires a quick login." : " "}
            </div>
          </div>
        </div>
      </section>

      {/* Comments */}
      <section className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              Comments
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Short, kind, specific feedback is the most helpful.
            </p>
          </div>

          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-sm text-slate-600">
                No comments yet. Be the first to share a thought or a question.
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-slate-800">{c.text}</p>
                      <div className="mt-2 text-[11px] text-slate-500">
                        {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {c.userId === userId ? (
                      <button
                        type="button"
                        onClick={() => void deleteComment(c)}
                        className="shrink-0 rounded-full border border-rose-200 bg-white px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-slate-50/80 p-4 text-sm">
          {formError ? (
            <div className="mb-2 rounded-2xl border border-rose-200 bg-rose-50/90 px-3 py-2 text-sm text-rose-900">
              {formError}
            </div>
          ) : null}

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Add a comment
            </span>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                userId
                  ? "What’s one helpful next step, question, or angle to explore?"
                  : "Log in to leave a comment."
              }
              disabled={!userId || busy}
              className="min-h-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-2 disabled:bg-slate-100"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => void addComment()}
              disabled={!userId || busy}
              className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-slate-50 shadow-sm transition hover:bg-black disabled:opacity-40"
            >
              {busy ? "Posting…" : "Post comment"}
            </button>
            {!userId ? (
              <Link
                href={`/login?next=/ideas/${ideaId}`}
                className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Log in to comment
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}