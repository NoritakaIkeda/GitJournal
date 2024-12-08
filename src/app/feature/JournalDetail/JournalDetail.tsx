"use client";

import type React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { Comment } from "../../types";
import { HeadingRenderer } from "../HeadingRenderer";

interface JournalDetailProps {
  selectedComment: Comment | null;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setEditBody: React.Dispatch<React.SetStateAction<string>>;
}

export const JournalDetail: React.FC<JournalDetailProps> = ({
  selectedComment,
  isEditing,
  setIsEditing,
  setEditBody,
}) => {
  if (!selectedComment) {
    return <div>コメントが選択されていません。</div>;
  }

  return (
    <div className="relative">
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
          // 必要に応じて h4, h5, h6 も同様に
        }}
      >
        {selectedComment.body}
      </ReactMarkdown>
    </div>
  );
};
