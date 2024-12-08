interface EditingSectionProps {
  headingLine: string;
  editBody: string;
  setEditBody: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditingSection({
  headingLine,
  editBody,
  setEditBody,
  onSave,
  onCancel,
}: EditingSectionProps) {
  return (
    <div>
      <h2 className="relative group flex items-center">{headingLine}</h2>
      <textarea
        className="w-full h-64 border border-gray-300 p-2 mt-2"
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
          onClick={onCancel}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
