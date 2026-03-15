'use client';

import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import posthog from 'posthog-js';

/**
 * PostHogIdentify component handles user identification with PostHog
 * when a user is signed in via Clerk. This component should be placed
 * in the app layout to ensure identification happens on every page.
 */
export function PostHogIdentify() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isSignedIn && userId) {
      // Identify the user in PostHog
      posthog.identify(userId, {
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName || user?.firstName,
        username: user?.username,
        created_at: user?.createdAt?.toISOString(),
      });
    } else if (!isSignedIn) {
      // Reset PostHog when user logs out
      posthog.reset();
    }
  }, [isSignedIn, userId, user]);

  return null;
}

export default PostHogIdentify;
