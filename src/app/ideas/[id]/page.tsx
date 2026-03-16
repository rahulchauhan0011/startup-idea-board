"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import db from "../../../lib/db";
import { id as newId } from "@instantdb/react";
import { errorMessage, getUserId, nowMs } from "../../../lib/instant-helpers";

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
      setFormError("Write at least a couple words.");
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
      setFormError(errorMessage(e, "Could not post comment. Please try again."));
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
      <div className="grid gap-3">
        <div className="h-10 w-32 animate-pulse rounded-lg bg-zinc-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Error: {error.message}
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="text-lg font-semibold text-zinc-900">
          Idea not found
        </div>
        <div className="mt-2 text-sm text-zinc-600">
          It may have been deleted.
        </div>
        <div className="mt-4">
          <Link
            href="/"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
        >
          ← Back
        </Link>
        {isOwner ? (
          <Link
            href="/my-ideas"
            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            Manage in My ideas
          </Link>
        ) : null}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {idea.title}
            </h1>
            <div className="mt-2 text-sm leading-6 text-zinc-700">
              {idea.description}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded-full bg-teal-50 px-2.5 py-1 font-semibold text-teal-800">
                {idea.category}
              </span>
              <span>{new Date(idea.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center">
            <div className="text-xs font-semibold text-zinc-500">Votes</div>
            <div className="mt-1 text-3xl font-bold text-zinc-900">
              {voteCount}
            </div>
            <button
              type="button"
              onClick={toggleVote}
              className={[
                "mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition",
                userId
                  ? voted
                    ? "bg-teal-50 text-teal-800 hover:bg-teal-100"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
              ].join(" ")}
            >
              {userId ? (voted ? "Voted" : "Upvote") : "Log in to vote"}
            </button>
            <div className="mt-2 text-xs text-zinc-500">
              {!authLoading && !user ? "Voting requires login." : " "}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          Comments
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Keep it kind and constructive. One helpful sentence is enough.
        </p>

        <div className="mt-5 grid gap-3">
          {comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
              No comments yet. Be the first to give friendly feedback.
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm leading-6 text-zinc-800">
                      {c.text}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {c.userId === userId ? (
                    <button
                      type="button"
                      onClick={() => void deleteComment(c)}
                      className="shrink-0 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 rounded-xl bg-zinc-50 p-4">
          {formError ? (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {formError}
            </div>
          ) : null}

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-600">
              Add a comment
            </span>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                userId
                  ? "What’s a helpful next step or question?"
                  : "Log in to comment"
              }
              disabled={!userId || busy}
              className="min-h-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-teal-600 placeholder:text-zinc-400 focus:ring-2 disabled:bg-zinc-100"
            />
          </label>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void addComment()}
              disabled={!userId || busy}
              className="h-10 rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {busy ? "Posting…" : "Post comment"}
            </button>
            {!userId ? (
              <Link
                href={`/login?next=/ideas/${ideaId}`}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
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

