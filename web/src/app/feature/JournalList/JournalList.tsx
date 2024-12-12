"use client";
import type { Comment } from "../../types";

type Props = {
  status: string;
  comments: Comment[];
  onSelectComment: (comment: Comment) => void;
};

export const JournalList = ({ status, comments, onSelectComment }: Props) => {
  return (
    <>
      {status && <div className="p-4 text-gray-500">{status}</div>}
      {!status &&
        comments.map((comment) => (
          <button
            key={comment.id}
            type="button"
            className="p-4 block text-left hover:bg-gray-50 w-full text-gray-900"
            onClick={() => onSelectComment(comment)}
          >
            {comment.body.match(/\d{4}\/\d{2}\/\d{2}/)?.[0] ?? "日付不明"}{" "}
            の日報
          </button>
        ))}
    </>
  );
};
