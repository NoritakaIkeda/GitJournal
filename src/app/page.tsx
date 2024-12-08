"use client";

import { useEffect, useState } from "react";
import type { Comment } from "./types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EditingSection, JournalDetail, JournalList } from "./feature";

export default function Page() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [status, setStatus] = useState<string>("loading...");

  const [sections, setSections] = useState<string[]>([]);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(
    null
  );
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
      c.sort(
        (a: Comment, b: Comment) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setComments(c);
      setSelectedComment(c[0] || null);
      setStatus("");
    })();
  }, []);

  useEffect(() => {
    if (selectedComment) {
      // "## "でsplitしてセクション化
      const rawSections = selectedComment.body.split("## ");
      // rawSections[0] は h2 前のテキスト
      // rawSections[1] 以降は各セクション "見出し\n本文"
      const reconstructed = rawSections.map((sec, i) =>
        i === 0 ? sec : "## " + sec
      );
      setSections(reconstructed);
    }
  }, [selectedComment]);

  const handleSave = async () => {
    if (!selectedComment || editingSectionIndex === null) return;
    setStatus("Saving...");
    const newSections = [...sections];
    // 編集中のセクションに更新を反映
    const lines = newSections[editingSectionIndex].split("\n");
    // lines[0]: "## 見出し"
    // lines[1..]: 本文
    const headingLine = lines[0];
    const newSection = [headingLine, ...editBody.split("\n")].join("\n");
    newSections[editingSectionIndex] = newSection;

    const newBody = newSections.join("\n\n");
    const res = await fetch("/api/updateComment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  };

  const handleEditSection = (sectionIndex: number) => {
    // 該当のセクションの本文のみ抽出
    const section = sections[sectionIndex];
    const lines = section.split("\n");
    const bodyLines = lines.slice(1); // 見出しを除いた本文
    const defaultValue = bodyLines.join("\n");
    setEditingSectionIndex(sectionIndex);
    setEditBody(defaultValue);
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
          onSelectComment={(comment) => {
            setSelectedComment(comment);
            setEditingSectionIndex(null);
            setEditBody("");
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {selectedComment && sections.length > 0 && (
          <div className="prose prose-sm max-w-none relative">
            {/* 最初のセクション(=sections[0])はh2前のテキスト */}
            {sections[0].trim() && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {sections[0]}
              </ReactMarkdown>
            )}

            {sections.slice(1).map((sec, i) => {
              const sectionIndex = i + 1; // sections[1]が最初のh2セクション
              const lines = sec.split("\n");
              const headingLine = lines[0].replace(/^##\s*/, ""); // "## "を取り除く

              // 編集中セクション？
              if (editingSectionIndex === sectionIndex) {
                // 編集中は見出しは表示したまま、本文はtextareaで編集
                return (
                  <EditingSection
                    key={sectionIndex}
                    headingLine={headingLine}
                    editBody={editBody}
                    setEditBody={setEditBody}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
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
