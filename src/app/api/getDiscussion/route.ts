import { type NextRequest, NextResponse } from "next/server";
import axios from "axios";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

export async function GET(req: NextRequest) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const token = process.env.GITHUB_TOKEN;
  const number = Number(req.nextUrl.searchParams.get("number") || "2"); // デフォルト1など

  if (!owner || !repo || !token) {
    return NextResponse.json(
      { error: "Missing env variables" },
      { status: 500 }
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
          Authorization: `Bearer ${token}`,
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
