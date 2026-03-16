import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto h-48 w-full max-w-md animate-pulse rounded-2xl bg-zinc-200" />
      }
    >
      <LoginClient />
    </Suspense>
  );
}

