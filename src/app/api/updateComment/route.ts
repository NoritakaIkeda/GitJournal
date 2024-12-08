import { type NextRequest, NextResponse } from "next/server";
import axios from "axios";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

const UPDATE_COMMENT = `
mutation UpdateDiscussionComment($commentId: ID!, $body: String!) {
  updateDiscussionComment(input: {commentId:$commentId, body:$body}) {
    comment {
      id
      body
    }
  }
}
`;

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Missing GITHUB_TOKEN" },
      { status: 500 }
    );
  }

  const { commentId, body } = await req.json();

  try {
    const res = await axios.post(
      GITHUB_GRAPHQL_ENDPOINT,
      { query: UPDATE_COMMENT, variables: { commentId, body } },
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

    return NextResponse.json(res.data.data.updateDiscussionComment.comment, {
      status: 200,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
