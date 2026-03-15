import type { Session, User } from "better-auth";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { customSession, genericOAuth } from "better-auth/plugins";
import { Pool } from "pg";
import { getUserIdFromEmail } from "@/lib/user-id";

interface Auth {
  session: Session;
  user: User;
}

function requireEnv(name: string, value?: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requirePostgresUrl(name: string, value?: string) {
  const resolvedValue = requireEnv(name, value);
  if (!/^postgres(?:ql)?:\/\//.test(resolvedValue)) {
    throw new Error(
      `${name} must be a valid Postgres connection string starting with postgres:// or postgresql://`,
    );
  }
  return resolvedValue;
}

const env = {
  SERVER_URL: requireEnv(
    "BETTER_AUTH_URL",
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  ),
  BETTER_AUTH_URL: requireEnv(
    "NEXT_PUBLIC_BETTER_AUTH_URL",
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL,
  ),
  BETTER_AUTH_SECRET: requireEnv("BETTER_AUTH_SECRET", process.env.BETTER_AUTH_SECRET),
  DATABASE_URL: requirePostgresUrl("DATABASE_URL", process.env.DATABASE_URL),
  AUTH_ISSUER: requireEnv("AUTH_ISSUER", process.env.AUTH_ISSUER),
  AUTH_CLIENT_ID: requireEnv("AUTH_CLIENT_ID", process.env.AUTH_CLIENT_ID),
  AUTH_CLIENT_SECRET: requireEnv("AUTH_CLIENT_SECRET", process.env.AUTH_CLIENT_SECRET),
};

const globalForPool = globalThis as unknown as {
  betterAuthPool?: Pool;
};

const pool =
  globalForPool.betterAuthPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.betterAuthPool = pool;
}

export const auth = betterAuth({
  baseURL: env.SERVER_URL,
  trustedOrigins: [env.BETTER_AUTH_URL],
  secret: env.BETTER_AUTH_SECRET,
  database: pool,
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            // `full_email` is present for CMU Keycloak but not part of Better Auth's typed user object.
            // @ts-expect-error The user here actually includes JWT claims such as `full_email`.
            id: getUserIdFromEmail(user["full_email"]) ?? user.id,
          },
        }),
      },
    },
  },
  plugins: [
    nextCookies(),
    genericOAuth({
      config: [
        {
          providerId: "keycloak",
          clientId: env.AUTH_CLIENT_ID,
          clientSecret: env.AUTH_CLIENT_SECRET,
          discoveryUrl: `${env.AUTH_ISSUER}/.well-known/openid-configuration`,
          redirectURI: `${env.SERVER_URL}/api/auth/oauth2/callback/keycloak`,
          scopes: ["openid", "email", "profile", "offline_access"],
        },
      ],
    }),
    customSession(async ({ user, session }): Promise<Auth> => ({ session, user })),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
