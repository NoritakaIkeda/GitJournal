import { type NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getServerSession } from "next-auth";
import { authOptions } from "../getServerSession/authOptions";
// NextAuthの設定ファイルのパスに合わせて変更

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

export async function GET(req: NextRequest) {
  const number = Number(req.nextUrl.searchParams.get("number") || "2"); // デフォルト値

  const session = await getServerSession(authOptions); // セッションを取得

  if (!session?.user?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized: Missing GitHub access token" },
      { status: 401 }
    );
  }

  const token = session.user.accessToken; // セッションからトークンを取得
  const owner =
    req.nextUrl.searchParams.get("owner") || process.env.GITHUB_OWNER;
  const repo =
    req.nextUrl.searchParams.get("repo") || process.env.GITHUB_REPO_NAME;

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing owner or repo parameters" },
      { status: 400 }
    );
  }

  const query = `
    query GetDiscussion($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          id
          title
          url
          comments(first: 100) {
            edges {
              node {
                id
                body
                createdAt
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await axios.post(
      GITHUB_GRAPHQL_ENDPOINT,
      { query, variables: { owner, repo, number } },
      {
        headers: {
          Authorization: `Bearer ${token}`, // セッションから取得したトークンを使用
          "Content-Type": "application/json",
        },
      }
    );

    if (res.data.errors) {
      const messages = res.data.errors
        .map((e: { message: string }) => e.message)
        .join("\n");
      return NextResponse.json({ error: messages }, { status: 500 });
    }

    return NextResponse.json(res.data.data.repository.discussion, {
      status: 200,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
