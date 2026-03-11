type UserIdentity = {
  id?: string | null;
  email?: string | null;
} | null | undefined;

export function getUserIdFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [prefix] = email.split("@");
  return prefix?.trim() || null;
}

export function getDatabaseUserId(user: UserIdentity): string | null {
  return getUserIdFromEmail(user?.email) ?? user?.id ?? null;
}
