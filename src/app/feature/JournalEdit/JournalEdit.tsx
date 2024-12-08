"use client";
import type { SetStateAction } from "react";

type Props = {
  editBody: string;
  setEditBody: (value: SetStateAction<string>) => void;
  setIsEditing: (value: SetStateAction<boolean>) => void;
  onSave: () => Promise<void>;
};

export const JournalEdit = ({
  editBody,
  setEditBody,
  setIsEditing,
  onSave,
}: Props) => {
  return (
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
          onClick={onSave}
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
  );
};
