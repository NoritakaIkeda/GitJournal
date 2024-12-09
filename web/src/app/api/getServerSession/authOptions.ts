import type { AuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      authorization: { params: { scope: "repo read:discussion" } },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.accessToken = token.accessToken;
        session.user.login = token.login;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        // @ts-expect-error ... GitHubProfile
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        token.login = profile?.login;
      }
      return token;
    },
  },
};
