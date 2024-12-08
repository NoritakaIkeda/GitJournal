// Expose the getServerSession function
import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { authOptions } from "./authOptions";

export const getServerSession = () => nextAuthGetServerSession(authOptions);
