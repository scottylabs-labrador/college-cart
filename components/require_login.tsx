"use client";

import { signInWithKeycloak } from "@/lib/auth-client";

export default function RequireLogin() {
    const handleSignIn = async () => {
      try {
        await signInWithKeycloak({ callbackURL: window.location.href });
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to sign in.");
      }
    };

    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center">
          <h2 className="mb-4 text-2xl font-semibold">Sign in to use this feature</h2>
          <button
            onClick={() => void handleSignIn()}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-6 text-base font-medium text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Sign in
          </button>
        </div>
      </main>
    );
}
