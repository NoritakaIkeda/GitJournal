import { type NextRequest, NextResponse } from "next/server";

import { object, parse, safeParse, string, optional } from "valibot";
import { getServerSession } from "../getServerSession/getServerSession";

const noHyphens = (str: string) => str.replace(/-/g, "");

// 入力パラメータのスキーマ定義
const paramsSchema = object({
  token: string(),
  settingsGistId: optional(string()),
  sinceDate: string(),
  untilDate: string(),
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
    token: session.user?.accessToken,
    settingsGistId: searchParams.get("settingsGistId"),
    sinceDate: searchParams.get("sinceDate"),
    untilDate: searchParams.get("untilDate"),
  });

  if (!parsed.success) {
    // バリデーション失敗時
    console.log("Validation failed. Issues:", parsed.issues);
    return NextResponse.json({
      success: "false",
      error: parsed.issues,
    });
  }

  const { token, settingsGistId, sinceDate, untilDate } = parsed.output;

  // GoサーバーのURLを構築
  const apiUrl = new URL("https://git-journal-za9x.vercel.app/api/nippou");
  apiUrl.searchParams.set("token", token);
  apiUrl.searchParams.set("settings_gist_id", settingsGistId || "");
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
      { error: "Failed to fetch data from Go server", details: error },
      { status: 500 }
    );
  }
}
