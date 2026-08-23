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
    <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto w-full max-w-3xl px-4 py-3">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sorunuzu yazın..."
            disabled={disabled}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            aria-label="Gönder"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <span className="hidden sm:inline">Gönder</span>
            <span aria-hidden>➤</span>
          </button>
        </div>
        <p className="mt-2 hidden text-center text-[11px] text-slate-400 sm:block">
          Yanıtlar resmi şartname belgelerine dayanır; kritik konularda destek
          ekibiyle teyit edin.
        </p>
      </div>
    </div>
  );
}
