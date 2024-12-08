import { type NextRequest, NextResponse } from "next/server";

import { object, parse, regex, safeParse, string } from "valibot";
import { getServerSession } from "../auth/[...nextauth]/route";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const noHyphens = (str: string) => str.replace(/-/g, "");

// 入力パラメータのスキーマ定義
const paramsSchema = object({
  user: string(),
  token: string(),
  settingsGistId: string(),
  sinceDate: string([regex(dateRegex)]),
  untilDate: string([regex(dateRegex)]),
});

// レスポンスのスキーマ定義
const responseSchema = object({
  result: string(),
});

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  // セッション情報の取得
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }

  // パラメータの取得とバリデーション
  const parsed = safeParse(paramsSchema, {
    user: session.user?.login,
    token: session.user?.accessToken,
    settingsGistId: searchParams.get("settingsGistId"),
    sinceDate: searchParams.get("sinceDate"),
    untilDate: searchParams.get("untilDate"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid or missing parameters" },
      { status: 400 }
    );
  }

  const { user, token, settingsGistId, sinceDate, untilDate } = parsed.output;
  console.log("user, token, settingsGistId, sinceDate, untilDate");

  // GoサーバーのURLを構築
  const apiUrl = new URL("http://localhost:8080/api/nippou");
  apiUrl.searchParams.set("user", user);
  apiUrl.searchParams.set("token", token);
  apiUrl.searchParams.set("settings_gist_id", settingsGistId);
  apiUrl.searchParams.set("since_date", noHyphens(sinceDate));
  apiUrl.searchParams.set("until_date", noHyphens(untilDate));

  try {
    // Goサーバーにリクエストを送信
    const response = await fetch(apiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    // レスポンスの検証
    const data = await response.json();
    const result = parse(responseSchema, data);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data from Go server", details: error.message },
      { status: 500 }
    );
  }
}
