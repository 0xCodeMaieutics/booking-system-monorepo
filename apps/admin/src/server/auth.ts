import { randomBytes } from "node:crypto";

import type { AdminAccounts } from "@visita/api/admin";
import { eq, getDb, schema } from "@visita/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { sendEmail } from "./email";

const db = getDb();
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.NODE_ENV === "production" ? [] : ["http://localhost:*"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      admin: schema.admin,
      adminSession: schema.adminSession,
      adminAccount: schema.adminAccount,
      authVerification: schema.authVerification,
    },
  }),
  user: {
    modelName: "admin",
    additionalFields: { deactivatedAt: { type: "date", required: false, input: false } },
  },
  session: { modelName: "adminSession", fields: { userId: "adminId" } },
  account: { modelName: "adminAccount", fields: { userId: "adminId" } },
  verification: { modelName: "authVerification" },
  emailAndPassword: {
    enabled: true,
    // Admins are invited by other Admins; nobody signs up.
    disableSignUp: true,
    minPasswordLength: 10,
    revokeSessionsOnPasswordReset: true,
    // Long enough for an invitation to be opened a few days later.
    resetPasswordTokenExpiresIn: 72 * 3600,
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: "ვიზიტა — პაროლის დაყენება",
        html:
          `<p>გამარჯობა, ${escape(user.name)}!</p>` +
          `<p>ადმინისტრატორის პანელისთვის პაროლის დასაყენებლად გადადით ბმულზე (მოქმედებს 72 საათი):</p>` +
          `<p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          const [row] = await db
            .select({ deactivatedAt: schema.admin.deactivatedAt })
            .from(schema.admin)
            .where(eq(schema.admin.id, session.userId));
          if (!row || row.deactivatedAt) {
            throw new APIError("FORBIDDEN", {
              message: "This Admin account is deactivated",
              code: "ADMIN_DEACTIVATED",
            });
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
});

async function createAdminWithPassword(input: { name: string; email: string; password?: string }) {
  const ctx = await auth.$context;
  const email = input.email.toLowerCase();
  if (await ctx.internalAdapter.findUserByEmail(email)) {
    throw new APIError("CONFLICT", { message: "An Admin with this email already exists" });
  }
  const user = await ctx.internalAdapter.createUser(
    { name: input.name, email, emailVerified: true },
    { method: "admin" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    // Invited Admins get an unguessable password and set their own via the emailed link.
    password: await ctx.password.hash(input.password ?? randomBytes(32).toString("base64url")),
  });
  return user;
}

export const adminAccounts: AdminAccounts & {
  create: typeof createAdminWithPassword;
} = {
  create: createAdminWithPassword,

  async invite({ name, email }) {
    await createAdminWithPassword({ name, email });
    await auth.api.requestPasswordReset({
      body: { email: email.toLowerCase(), redirectTo: `${baseURL}/set-password` },
    });
  },

  async deactivate(adminId) {
    await db.update(schema.admin).set({ deactivatedAt: new Date() }).where(eq(schema.admin.id, adminId));
    const ctx = await auth.$context;
    await ctx.internalAdapter.deleteUserSessions(adminId);
  },

  async reactivate(adminId) {
    await db.update(schema.admin).set({ deactivatedAt: null }).where(eq(schema.admin.id, adminId));
  },
};
