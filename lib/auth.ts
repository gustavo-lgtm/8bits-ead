// lib/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/db";
import { verify as argonVerify } from "@node-rs/argon2";

const providers: NextAuthOptions["providers"] = [
  Credentials({
    name: "credentials",
    credentials: { email: {}, password: {} },
    async authorize(creds) {
      const email = (creds?.email || "").toLowerCase().trim();
      const pass = `${creds?.password || ""}`;
      if (!email || !pass) return null;

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true,
          emailVerified: true,
          consentStatus: true, // <— importante para menores
        },
      });
      if (!user?.passwordHash) return null;

      const ok = await argonVerify(user.passwordHash, pass);
      if (!ok) return null;

      // Regras de liberação:
      // - ≥13 anos: usamos verificação de e-mail (emailVerified)
      // - <13 anos: basta consentimento aprovado
      // Como não recalculamos idade aqui, usamos a “fonte de verdade”:
      //   -> emailVerified libera
      //   -> OU consentStatus === "APPROVED" libera
      const canLogin = !!user.emailVerified || user.consentStatus === "APPROVED";
      if (!canLogin) {
        // bloqueia com erro genérico (sem vazar status)
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        role: (user as any).role ?? "USER",
      } as any;
    },
  }),
];

// SSO Google (opcional)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

// SSO Microsoft (opcional)
if (
  process.env.AZURE_AD_CLIENT_ID &&
  process.env.AZURE_AD_CLIENT_SECRET &&
  process.env.AZURE_AD_TENANT_ID
) {
  providers.push(
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7 dias
  pages: { signIn: "/login", error: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
        token.role = (user as any).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user.id = token.userId;
      (session as any).user.role = token.role;
      return session;
    },
  },
  events: {
    // Se logou por OAuth (Google/Microsoft), marcamos emailVerified
    async signIn({ user, account }) {
      try {
        if (account && account.provider !== "credentials") {
          const u = await prisma.user.findUnique({ where: { id: user.id } });
          if (u && !u.emailVerified) {
            await prisma.user.update({
              where: { id: u.id },
              data: { emailVerified: new Date() },
            });
          }
        }
      } catch {
        // não derruba o login por falha nesse update
      }
    },
  },
};
