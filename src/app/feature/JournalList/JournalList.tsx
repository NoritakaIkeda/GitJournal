"use client";
import type { SetStateAction } from "react";
import type { Comment } from "../../types";

type Props = {
  status: string;
  comments: Comment[];
  selectedComment: Comment | null;
  setSelectedComment: (value: SetStateAction<Comment | null>) => void;
  setIsEditing: (value: SetStateAction<boolean>) => void;
  setEditBody: (value: SetStateAction<string>) => void;
};

export const JournalList = ({
  status,
  comments,
  selectedComment,
  setSelectedComment,
  setIsEditing,
  setEditBody,
}: Props) => {
  const extractDate = (body: string) => {
    const match = body.match(/\d{4}\/\d{2}\/\d{2}/);
    return match ? match[0] : "日付不明";
  };
  const handleSelectComment = (comment: Comment) => {
    setSelectedComment(comment);
    setIsEditing(false);
    setEditBody("");
  };
  return (
    <>
      {status && <div className="p-4 text-gray-500">{status}</div>}
      {!status &&
        comments.map((comment) => {
          const date = extractDate(comment.body);
          return (
            <button
              key={comment.id}
              type="button"
              tabIndex={0}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${
                selectedComment?.id === comment.id ? "bg-gray-200" : ""
              }`}
              onClick={() => handleSelectComment(comment)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelectComment(comment);
                }
              }}
            >
              {date} の日報
            </button>
          );
        })}
    </>
  );
};
