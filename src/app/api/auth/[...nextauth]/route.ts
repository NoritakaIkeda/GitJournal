import NextAuth from "next-auth";
import { authOptions } from "../../authOptions/route";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
