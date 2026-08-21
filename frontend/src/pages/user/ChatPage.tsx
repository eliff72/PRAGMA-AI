import { useState } from "react";
import { useParams } from "react-router-dom";
import { askQuestion } from "../../api/questions";
import MessageBubble from "../../components/MessageBubble";
import type { ChatMessage } from "../../types";

export default function ChatPage() {
  const { competitionSlug = "" } = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    const question = input.trim();
    if (!question || isSending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const result = await askQuestion(competitionSlug, question);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.needs_human
          ? "Bu konuda elimde yeterli doğrulanmış kaynak yok."
          : (result.answer ?? ""),
        confidence: result.confidence,
        sources: result.sources,
        needsHuman: result.needs_human,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Bir hata oluştu, lütfen tekrar deneyin." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col px-4 py-6">
      <header className="mb-4">
        <h1 className="text-lg font-semibold text-slate-800">{competitionSlug}</h1>
        <p className="text-xs text-slate-400">Sorularınız yalnızca onaylı kaynaklardan yanıtlanır.</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && <p className="text-center text-sm text-slate-400">Bir soru yazarak başlayın.</p>}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      <div className="flex gap-2 border-t border-slate-200 pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Sorunuzu yazın..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={isSending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSending ? "..." : "Gönder"}
        </button>
      </div>
    </div>
  );
}
