"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Comment } from "./types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { JournalDetail, JournalList } from "./feature";

export default function Page() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [status, setStatus] = useState<string>("loading...");

  const [owner, setOwner] = useState("NoritakaIkeda");
  const [repo, setRepo] = useState("GitJournal-sample-blog");
  const [discussionNumber, setDiscussionNumber] = useState("2");

  const [discussionTitle, setDiscussionTitle] = useState("");

  const [sections, setSections] = useState<string[]>([]);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(
    null
  );
  const [editBody, setEditBody] = useState<string>("");

  const [nippouResult, setNippouResult] = useState<string>(""); // github-nippou結果表示用

  useEffect(() => {
    if (!token) {
      setStatus("Please Sign in");
      return;
    }
    handleLoadDiscussion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleLoadDiscussion() {
    if (!owner || !repo || !discussionNumber) return;
    setStatus("Loading discussion...");
    const res = await fetch(
      `/api/getDiscussion?owner=${owner}&repo=${repo}&number=${discussionNumber}`,
      {
        headers: {
          // 認証ヘッダをユーザトークンで追加
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) {
      setStatus("Error loading discussion");
      return;
    }
    const discussion = await res.json();
    const c = discussion.comments.edges.map(
      (edge: any) => edge.node as Comment
    );
    c.sort(
      (a: Comment, b: Comment) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setComments(c);
    setSelectedComment(c[0] || null);
    setDiscussionTitle(discussion.title);
    setStatus("");
  }

  useEffect(() => {
    if (selectedComment) {
      const rawSections = selectedComment.body.split("## ");
      const reconstructed = rawSections.map((sec, i) =>
        i === 0 ? sec : `## ${sec}`
      );
      setSections(reconstructed);
    }
  }, [selectedComment]);

  const handleSave = async () => {
    if (!selectedComment || editingSectionIndex === null) return;
    setStatus("Saving...");
    const newSections = [...sections];
    const lines = newSections[editingSectionIndex].split("\n");
    const headingLine = lines[0];
    const newSection = [headingLine, ...editBody.split("\n")].join("\n");
    newSections[editingSectionIndex] = newSection;

    const newBody = newSections.join("\n\n");
    const res = await fetch("/api/updateComment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 認証必須
      },
      body: JSON.stringify({ commentId: selectedComment.id, body: newBody }),
    });

    if (!res.ok) {
      setStatus("Error saving");
      return;
    }

    const updated = comments.map((c) =>
      c.id === selectedComment.id ? { ...c, body: newBody } : c
    );
    setComments(updated);
    setSelectedComment({ ...selectedComment, body: newBody });
    setSections(newSections);
    setEditingSectionIndex(null);
    setEditBody("");
    setStatus("");
  };

  const handleCancel = () => {
    setEditingSectionIndex(null);
    setEditBody("");
    setNippouResult("");
  };

  const handleEditSection = async (sectionIndex: number) => {
    const section = sections[sectionIndex];
    const lines = section.split("\n");
    const bodyLines = lines.slice(1);
    const defaultValue = bodyLines.join("\n");
    setEditingSectionIndex(sectionIndex);
    setEditBody(defaultValue);

    // 編集ボタン押下でgithub-nippouを叩く(取得している日付から前日を計算)
    const dateMatch = selectedComment?.body.match(/\d{4}\/\d{2}\/\d{2}/);
    if (dateMatch) {
      const currentDateStr = dateMatch[0]; // "2024/12/06" のような
      const currentDate = new Date(currentDateStr.replace(/\//g, "-"));
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().slice(0, 10); // "2024-12-05"

      const nippouRes = await fetch(
        `/api/nippou?sinceDate=${prevDateStr}&untilDate=${prevDateStr}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const nippouData = await nippouRes.json();
      if (nippouData.success) {
        setNippouResult(nippouData.result);
      } else {
        setNippouResult("Error fetching nippou data");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-row bg-gray-100">
      {/* Sidebar: Owner/Repo/Number指定フォーム + 日報一覧 */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 font-bold text-xl border-b border-gray-200 flex items-center justify-between">
          <span>日報一覧</span>
          <div>{discussionTitle}</div>
          {session ? (
            <button
              type="button"
              className="text-sm text-gray-600 underline"
              onClick={() => signOut()}
            >
              サインアウト
            </button>
          ) : (
            <button
              type="button"
              className="text-sm text-blue-500 underline"
              onClick={() => signIn("github")}
            >
              GitHubでサインイン
            </button>
          )}
        </div>

        {/* リポジトリ/ディスカッション指定フォーム */}
        <div className="p-2 border-b border-gray-200 space-y-2">
          <input
            className="w-full border p-1"
            placeholder="owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
          <input
            className="w-full border p-1"
            placeholder="repo"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
          />
          <input
            className="w-full border p-1"
            placeholder="discussion number"
            value={discussionNumber}
            onChange={(e) => setDiscussionNumber(e.target.value)}
          />
          <button
            type="button"
            className="w-full bg-blue-500 text-white py-1 rounded hover:bg-blue-600"
            onClick={handleLoadDiscussion}
          >
            Load
          </button>
        </div>

        <JournalList
          status={status}
          comments={comments}
          onSelectComment={(comment) => {
            setSelectedComment(comment);
            setEditingSectionIndex(null);
            setEditBody("");
            setNippouResult("");
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {selectedComment && sections.length > 0 && (
          <div className="prose prose-sm max-w-none relative">
            {sections[0].trim() && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {sections[0]}
              </ReactMarkdown>
            )}

            {sections.slice(1).map((sec, i) => {
              const sectionIndex = i + 1;
              const lines = sec.split("\n");
              const headingLine = lines[0].replace(/^##\s*/, "");

              if (editingSectionIndex === sectionIndex) {
                // 編集中UI。見出しを表示し、その下にtextareaとgithub-nippou結果を表示
                return (
                  <div key={sectionIndex}>
                    <h2 className="relative group flex items-center">
                      {headingLine}
                    </h2>
                    <textarea
                      className="w-full h-64 border border-gray-300 p-2 mt-2"
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                        onClick={handleSave}
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        className="bg-gray-300 text-black px-4 py-1 rounded hover:bg-gray-400"
                        onClick={handleCancel}
                      >
                        キャンセル
                      </button>
                    </div>

                    {/* github-nippou結果表示 */}
                    {nippouResult && (
                      <div className="mt-4 p-2 border border-gray-300 rounded bg-white">
                        <h3 className="font-bold text-lg mb-2">
                          昨日のGitHubアクティビティ
                        </h3>
                        <pre className="whitespace-pre-wrap">
                          {nippouResult}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              }
              // 通常表示モード
              return (
                <JournalDetail
                  key={sectionIndex}
                  sec={sec}
                  sectionIndex={sectionIndex}
                  onEdit={handleEditSection}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
