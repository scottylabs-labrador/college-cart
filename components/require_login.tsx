"use client";

import { signInWithKeycloak } from "@/lib/auth-client";

 
export default function RequireLogin() {
    const handleSignIn = async (requestSignUp = false) => {
      try {
        await signInWithKeycloak({
          callbackURL: window.location.href,
          requestSignUp,
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to sign in.");
      }
    };

    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Sign in to use this feature</h2>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => void handleSignIn(false)}
              className="bg-transparent border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md"
            >
              Sign In
            </button>
            <button
              onClick={() => void handleSignIn(true)}
              className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            >
              Sign Up
            </button>
          </div>
        </div>
      </main>
    );
}
