export type Comment = {
  id: string;
  body: string;
  createdAt: string;
};

import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string;
      email?: string;
      image?: string;
      accessToken?: string;
      login: string;
    };
  }
}
