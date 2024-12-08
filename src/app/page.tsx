"use client";

import { type JSX, SetStateAction, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Comment } from "./types";
import { HeadingRenderer } from "./feature/HeadingRenderer";
import { JournalList } from "./feature";

export default function Page() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [status, setStatus] = useState<string>("loading...");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editBody, setEditBody] = useState<string>("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/getDiscussion?number=2");
      if (!res.ok) {
        setStatus("Error loading discussion");
        return;
      }
      const discussion = await res.json();
      const c = discussion.comments.edges.map(
        (edge: any) => edge.node as Comment
      );
      // createdAtでソート (最新が上)
      c.sort(
        (a: Comment, b: Comment) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setComments(c);
      setSelectedComment(c[0] || null);
      setStatus("");
    })();
  }, []);

  const handleSave = async () => {
    if (!selectedComment) return;
    setStatus("Saving...");
    const res = await fetch("/api/updateComment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: selectedComment.id, body: editBody }),
    });
    if (!res.ok) {
      setStatus("Error saving");
      return;
    }

    const updated = comments.map((c) =>
      c.id === selectedComment.id ? { ...c, body: editBody } : c
    );
    setComments(updated);
    setSelectedComment({ ...selectedComment, body: editBody });
    setIsEditing(false);
    setEditBody("");
    setStatus("");
  };

  return (
    <div className="min-h-screen flex flex-row bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 font-bold text-xl border-b border-gray-200">
          日報一覧
        </div>
        <JournalList
          status={status}
          comments={comments}
          selectedComment={selectedComment}
          setSelectedComment={setSelectedComment}
          setIsEditing={setIsEditing}
          setEditBody={setEditBody}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {selectedComment && (
          <div className="prose prose-sm max-w-none">
            {isEditing ? (
              <div>
                <textarea
                  className="w-full h-64 border border-gray-300 p-2"
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
                    onClick={() => {
                      setIsEditing(false);
                      setEditBody("");
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Markdown表示: h2には独自レンダリング適用 */}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ ...props }) => (
                      <HeadingRenderer
                        level={2}
                        setIsEditing={setIsEditing}
                        setEditBody={setEditBody}
                        selectedComment={selectedComment}
                        isEditing={isEditing}
                        {...props}
                      />
                    ),
                    h1: ({ ...props }) => (
                      <HeadingRenderer
                        level={1}
                        setIsEditing={setIsEditing}
                        setEditBody={setEditBody}
                        selectedComment={selectedComment}
                        isEditing={isEditing}
                        {...props}
                      />
                    ),
                    h3: ({ ...props }) => (
                      <HeadingRenderer
                        level={3}
                        setIsEditing={setIsEditing}
                        setEditBody={setEditBody}
                        selectedComment={selectedComment}
                        isEditing={isEditing}
                        {...props}
                      />
                    ),
                    // 必要に応じてh4,h5,h6も同様に
                  }}
                >
                  {selectedComment.body}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
