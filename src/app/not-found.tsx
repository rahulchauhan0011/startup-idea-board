import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <div className="text-2xl font-semibold tracking-tight text-zinc-900">
        Page not found
      </div>
      <div className="mt-2 text-sm leading-6 text-zinc-600">
        The link may be broken, or the page may have been removed.
      </div>
      <div className="mt-6 flex justify-center">
        <Link
          href="/"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Back to the Idea Board
        </Link>
      </div>
    </div>
  );
}

