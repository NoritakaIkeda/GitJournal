import { type NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getServerSession } from "../getServerSession/getServerSession";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

const ADD_COMMENT = `
mutation AddComment($discussionId: ID!, $body: String!) {
  addDiscussionComment(input:{discussionId:$discussionId, body:$body}) {
    comment {
      id
      body
      createdAt
    }
  }
}
`;

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { owner, repo, discussionNumber, body } = await req.json();
  const token = session.user.accessToken;

  // Discussion IDを取得するために先にDiscussionデータを取得
  const DISCUSSION_ID_QUERY = `
    query($owner:String!, $repo:String!, $number:Int!) {
      repository(owner:$owner, name:$repo) {
        discussion(number:$number) {
          id
        }
      }
    }
  `;

  try {
    const discussionRes = await axios.post(
      GITHUB_GRAPHQL_ENDPOINT,
      {
        query: DISCUSSION_ID_QUERY,
        variables: { owner, repo, number: discussionNumber },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const discussionId = discussionRes.data.data?.repository?.discussion?.id;
    if (!discussionId) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      );
    }

    const res = await axios.post(
      GITHUB_GRAPHQL_ENDPOINT,
      { query: ADD_COMMENT, variables: { discussionId, body } },
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

    return NextResponse.json(res.data.data.addDiscussionComment.comment, {
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
