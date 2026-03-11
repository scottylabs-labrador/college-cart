import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDatabaseUserId } from "@/lib/user-id";

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getServerUserId() {
  const session = await getServerSession();
  return getDatabaseUserId(session?.user);
}

export async function getRequestUserId(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return getDatabaseUserId(session?.user);
}
