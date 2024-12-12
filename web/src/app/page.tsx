"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Comment } from "./types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { JournalDetail, JournalList } from "./feature";

interface DiscussionEdge {
  node: Comment;
}

const STORAGE_PREFIX = "git_journal_";

export default function Page() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [status, setStatus] = useState<string>("loading...");

  // Discussion指定用
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [discussionNumber, setDiscussionNumber] = useState("");

  const [discussionTitle, setDiscussionTitle] = useState("");

  const [sections, setSections] = useState<string[]>([]);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(
    null
  );
  const [editBody, setEditBody] = useState<string>("");

  const [nippouResult, setNippouResult] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // テンプレート用状態
  const [template, setTemplate] = useState<string>("");
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

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
      (edge: DiscussionEdge) => edge.node as Comment
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
        Authorization: `Bearer ${token}`,
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

  // ローカルストレージからの復元
  useEffect(() => {
    const storedOwner = localStorage.getItem(`${STORAGE_PREFIX}owner`) || "";
    const storedRepo = localStorage.getItem(`${STORAGE_PREFIX}repo`) || "";
    const storedDiscussionNumber =
      localStorage.getItem(`${STORAGE_PREFIX}discussionNumber`) || "";
    const storedTemplate =
      localStorage.getItem(`${STORAGE_PREFIX}template`) || "";

    setOwner(storedOwner);
    setRepo(storedRepo);
    setDiscussionNumber(storedDiscussionNumber);
    setTemplate(storedTemplate);
  }, []);

  // ローカルストレージ保存
  const saveToLocalStorage = (key: string, value: string) => {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
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

    // github-nippou結果取得処理(省略可)
    const dateMatch = selectedComment?.body.match(/\d{4}\/\d{2}\/\d{2}/);
    if (dateMatch) {
      const currentDateStr = dateMatch[0];
      const currentDate = new Date(currentDateStr.replace(/\//g, "-"));
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().slice(0, 10);

      const url = new URL("/api/nippou", window.location.href);
      url.searchParams.set("settingsGistId", "");
      url.searchParams.set("sinceDate", prevDateStr);
      url.searchParams.set("untilDate", prevDateStr);

      try {
        const nippouRes = await fetch(url.toString());

        if (!nippouRes.ok) {
          const errorText = await nippouRes.text();
          throw new Error(`Fetch failed: ${errorText}`);
        }

        const nippouData = await nippouRes.json();
        if (nippouData.result) {
          setNippouResult(nippouData.result);
        } else {
          setNippouResult("昨日のアクティビティは空です");
        }
      } catch (error) {
        console.error("Error fetching nippou data:", error);
        setNippouResult("An unexpected error occurred");
      }
    }
  };

  // テンプレート設定モーダル関連
  const handleOpenTemplateModal = () => {
    setIsTemplateModalOpen(true);
  };

  const handleCloseTemplateModal = () => {
    setIsTemplateModalOpen(false);
  };

  const handleSaveTemplate = () => {
    saveToLocalStorage("template", template);
    handleCloseTemplateModal();
  };

  // 新規コメント作成
  const handleCreateNewComment = async () => {
    if (!token || !owner || !repo || !discussionNumber) {
      alert("Discussion設定が不完全です");
      return;
    }
    if (!template) {
      alert("テンプレートが設定されていません。");
      return;
    }

    const now = new Date();
    const year = now.getFullYear(); // 年を動的に取得
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}/${month}/${day}`;

    const body = `${dateStr}\n\n${template}`;

    setStatus("Creating new comment...");
    const res = await fetch("/api/addComment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        discussionNumber: Number(discussionNumber),
        owner,
        repo,
        body,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(errText);
      setStatus("Error creating comment");
      return;
    }

    // 成功時はDiscussionを再取得
    setStatus("");
    await handleLoadDiscussion();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex flex-row flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 text-xl font-bold text-center bg-gray-200 text-gray-900">
            Git Journal
          </div>
          <div className="p-4 flex items-center space-x-2 border-b border-gray-200">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm text-gray-600">?</span>
              </div>
            )}
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

          {/* Discussion設定フォームトグル */}
          <div className="p-4 border-b border-gray-200">
            <button
              type="button"
              className="w-full bg-blue-500 text-white py-1 rounded hover:bg-blue-600"
              onClick={() => setIsFormOpen(!isFormOpen)}
            >
              {isFormOpen ? "閉じる" : "Discussion設定を開く"}
            </button>
            {isFormOpen && (
              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="owner"
                    className="block text-sm font-medium text-gray-700 flex items-center"
                  >
                    リポジトリのオーナー
                    <div className="relative group ml-2">
                      <span className="text-gray-400 cursor-pointer">ℹ️</span>
                      <div className="absolute left-0 top-full mt-1 hidden w-64 p-2 bg-gray-700 text-white text-sm rounded shadow-lg group-hover:block z-50">
                        GitHubリポジトリの所有者名を入力してください
                      </div>
                    </div>
                  </label>
                  <input
                    id="owner"
                    className="mt-1 w-full border p-1"
                    value={owner}
                    onChange={(e) => {
                      setOwner(e.target.value);
                      saveToLocalStorage("owner", e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="repo"
                    className="block text-sm font-medium text-gray-700 flex items-center"
                  >
                    リポジトリ名
                    <div className="relative group ml-2">
                      <span className="text-gray-400 cursor-pointer">ℹ️</span>
                      <div className="absolute left-0 top-full mt-1 hidden w-64 p-2 bg-gray-700 text-white text-sm rounded shadow-lg group-hover:block z-50">
                        GitHubリポジトリ名を入力してください
                      </div>
                    </div>
                  </label>
                  <input
                    id="repo"
                    className="mt-1 w-full border p-1"
                    value={repo}
                    onChange={(e) => {
                      setRepo(e.target.value);
                      saveToLocalStorage("repo", e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="discussionNumber"
                    className="block text-sm font-medium text-gray-700 flex items-center"
                  >
                    ディスカッション番号
                    <div className="relative group ml-2">
                      <span className="text-gray-400 cursor-pointer">ℹ️</span>
                      <div className="absolute left-0 top-full mt-1 hidden w-64 p-2 bg-gray-700 text-white text-sm rounded shadow-lg group-hover:block z-50">
                        DiscussionのURL末尾の数字
                      </div>
                    </div>
                  </label>
                  <input
                    id="discussionNumber"
                    className="mt-1 w-full border p-1"
                    value={discussionNumber}
                    onChange={(e) => {
                      setDiscussionNumber(e.target.value);
                      saveToLocalStorage("discussionNumber", e.target.value);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="w-full bg-green-500 text-white py-1 rounded hover:bg-green-600"
                  onClick={handleLoadDiscussion}
                >
                  取得
                </button>
              </div>
            )}
          </div>

          {/* Discussion Title + 新規作成ボタン、テンプレート設定ボタン */}
          {discussionTitle && (
            <div className="p-4 border-b border-gray-200">
              <div className="text-lg font-bold text-gray-800 mb-2">
                {discussionTitle}
              </div>
              <button
                type="button"
                onClick={handleCreateNewComment}
                className="w-full mb-2 bg-purple-500 text-white py-1 rounded hover:bg-purple-600"
              >
                今日の日報を作成
              </button>
              <button
                type="button"
                onClick={handleOpenTemplateModal}
                className="w-full bg-gray-500 text-white py-1 rounded hover:bg-gray-600"
              >
                テンプレート設定
              </button>
            </div>
          )}

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

        {/* Main Content: ここにスクロール適用 */}
        <div className="flex-1 p-6 overflow-y-auto">
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
                  return (
                    <div key={sectionIndex}>
                      <h2 className="relative group flex items-center">
                        {headingLine}
                      </h2>

                      {/* 編集画面全体をflexで横並びにする */}
                      <div className="flex gap-4 items-stretch">
                        {/* テキストエリア側 */}
                        <div className="flex-1 flex flex-col">
                          {/* テキストエリア部分を固定高さで確保 */}
                          <div className="h-64 flex flex-col">
                            <textarea
                              className="w-full h-full border border-gray-300 p-2 resize-none"
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                            />
                          </div>
                          {/* ボタン部分はテキストエリアの下に配置 */}
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
                        </div>

                        {/* アクティビティ側: 同じ高さ(h-64)でoverflow-y-auto */}
                        <div className="flex-1 h-64 border border-gray-300 rounded bg-white overflow-y-auto p-2">
                          <h3 className="font-bold text-lg mb-2">
                            昨日のGitHubアクティビティ
                          </h3>
                          {nippouResult ? (
                            <pre className="whitespace-pre-wrap">
                              {nippouResult}
                            </pre>
                          ) : (
                            <div>Loading</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
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

        {/* テンプレート設定モーダル */}
        {isTemplateModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
              className="fixed inset-0 bg-black opacity-50"
              onClick={handleCloseTemplateModal}
              onKeyDown={handleCloseTemplateModal}
              role="button"
              tabIndex={0}
            />
            <div className="bg-white rounded p-4 z-10 w-1/2">
              <h2 className="text-xl font-bold mb-2">テンプレート設定</h2>
              <textarea
                className="w-full h-64 border border-gray-300 p-2"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                  onClick={handleSaveTemplate}
                >
                  保存
                </button>
                <button
                  type="button"
                  className="bg-gray-300 text-black px-4 py-1 rounded hover:bg-gray-400"
                  onClick={handleCloseTemplateModal}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* フッター */}
      <footer className="border-t border-gray-300 bg-gray-100 py-4 px-4 text-sm text-gray-700">
        <h3 className="font-bold mb-2">このツールの使い方</h3>
        <p className="mb-2">
          このサイト、Git Journal は、GitHub上のアクティビティを集約して GitHub
          の Discussion へ日報を投稿できるツールです。
        </p>
        <p className="mb-2">
          このサイトは、@masutaka さんが作成された
          <a
            href="https://github.com/masutaka/github-nippou"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600"
          >
            github-nippou
          </a>
          （CLIツール）および、@MH4GF さんが作成された
          <a
            href="https://github.com/MH4GF/github-nippou-web"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600"
          >
            github-nippou-web
          </a>
          の実装・コードを参考にし、改変・活用しています。
        </p>
      </footer>
    </div>
  );
}
