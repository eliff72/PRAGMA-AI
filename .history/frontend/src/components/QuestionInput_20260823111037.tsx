import { useState } from "react";

interface QuestionInputProps {
  onSend: (question: string) => void;
  disabled?: boolean;
}

export default function QuestionInput({
  onSend,
  disabled,
}: QuestionInputProps) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Sorunuzu yazın..."
        disabled={disabled}
        className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        Gönder
      </button>
    </div>
  );
}
