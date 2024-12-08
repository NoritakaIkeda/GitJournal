import { type NextRequest, NextResponse } from "next/server";
import { postToDiscussion } from "@lib/github";

export async function POST(req: NextRequest) {
  try {
    const { title, body } = await req.json();
    const result = await postToDiscussion(title, body);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
