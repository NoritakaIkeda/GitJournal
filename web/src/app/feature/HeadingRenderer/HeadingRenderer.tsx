"use client";
import type { JSX, SetStateAction } from "react";
import type { Comment } from "../../types";

type Props = {
  level: number;
  children: React.ReactNode;
  setIsEditing: (value: SetStateAction<boolean>) => void;
  setEditBody: (value: SetStateAction<string>) => void;
  selectedComment: Comment;
  isEditing: boolean;
  onEdit: () => void;
  headingIndex: number;
};

export const HeadingRenderer = ({
  level,
  children,
  onEdit,
  headingIndex,
  isEditing,
}: Props) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  // 最初のh2ならheadingIndex=0、2番目のh2ならheadingIndex=1
  // ここでheadingIndexに応じてアイコンや挙動を変えられる
  const icon = headingIndex === 0 ? "✏️(最初のH2)" : "✏️(2番目以降)";

  if (level === 2 && !isEditing) {
    return (
      <Tag className="relative group flex items-center">
        {children}
        <button
          type="button"
          className="ml-2 text-gray-500 hover:text-gray-800 transition-opacity"
          onClick={onEdit}
          title="このセクションを編集"
        >
          {icon}
        </button>
      </Tag>
    );
  }
  return <Tag>{children}</Tag>;
};
