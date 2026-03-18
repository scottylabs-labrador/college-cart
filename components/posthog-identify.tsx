'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { useAuth, useUser } from '@/lib/auth-client';

/**
 * Identifies the signed-in user in PostHog (Better Auth session).
 * Place in the root layout so it runs on every page.
 */
export function PostHogIdentify() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const distinctId = userId ?? user?.id;
    if (isSignedIn && distinctId) {
      posthog.identify(distinctId, {
        email: user?.email ?? undefined,
        name: user?.name ?? undefined,
        image: user?.image ?? undefined,
      });
    } else if (!isSignedIn) {
      posthog.reset();
    }
  }, [isSignedIn, userId, user]);

  return null;
}

export default PostHogIdentify;
