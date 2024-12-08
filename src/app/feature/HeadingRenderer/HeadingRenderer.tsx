import type { JSX, SetStateAction } from "react";
import type { Comment } from "../../types";

type Props = {
  level: number;
  children: React.ReactNode;
  setIsEditing: (value: SetStateAction<boolean>) => void;
  setEditBody: (value: SetStateAction<string>) => void;
  selectedComment: Comment;
  isEditing: boolean;
};

export const HeadingRenderer = ({
  level,
  children,
  setIsEditing,
  setEditBody,
  selectedComment,
  isEditing,
}: Props) => {
  const handleEdit = () => {
    if (selectedComment) {
      setIsEditing(true);
      setEditBody(selectedComment.body);
    }
  };

  if (level === 2 && !isEditing) {
    // h2のときにアイコンを右側に挿入
    return (
      <h2 className="relative group flex items-center">
        {children}
        <button
          type="button"
          className="ml-2 text-gray-500 hover:text-gray-800 transition-opacity"
          onClick={handleEdit}
          title="このセクションを編集"
        >
          ✏️
        </button>
      </h2>
    );
  }

  // それ以外のヘッダは通常のまま
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag>{children}</Tag>;
};
