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
        <div className="max-w-xl w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Sign in to use this feature</h2>
          <button
            onClick={() => void handleSignIn()}
            className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Sign In
          </button>
        </div>
      </main>
    );
}
