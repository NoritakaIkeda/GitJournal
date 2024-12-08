"use client";

import type React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface JournalDetailProps {
  sec: string;
  sectionIndex: number;
  onEdit: (index: number) => void;
}

export const JournalDetail: React.FC<JournalDetailProps> = ({
  sec,
  sectionIndex,
  onEdit,
}) => {
  const lines = sec.split("\n");
  const headingLine = lines[0];
  const bodyLines = lines.slice(1).join("\n");

  return (
    <div className="group relative">
      <div className="flex items-center">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{headingLine}</ReactMarkdown>
        <button
          type="button"
          className="ml-2 text-gray-500 hover:text-gray-800 transition-opacity"
          onClick={() => onEdit(sectionIndex)}
          title="このセクションを編集"
        >
          ✏️
        </button>
      </div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyLines}</ReactMarkdown>
    </div>
  );
};
