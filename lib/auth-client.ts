"use client";

import type { auth } from "@/lib/auth";
import { customSessionClient, genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { getDatabaseUserId } from "@/lib/user-id";

const authBaseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [customSessionClient<typeof auth>(), genericOAuthClient()],
});

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();
  const userId = getDatabaseUserId(session?.user);

  return {
    userId,
    isSignedIn: Boolean(userId),
    isLoaded: !isPending,
    session,
  };
}

export function useUser() {
  const { data: session, isPending } = authClient.useSession();

  return {
    user: session?.user ?? null,
    isLoaded: !isPending,
  };
}

export async function signInWithKeycloak(options?: {
  callbackURL?: string;
}) {
  const { error } = await authClient.signIn.oauth2({
    providerId: "keycloak",
    callbackURL: options?.callbackURL,
  });

  if (error) {
    throw new Error(error.message || "Failed to start sign-in.");
  }
}

export async function signOutFromAuth() {
  await authClient.signOut();
}
