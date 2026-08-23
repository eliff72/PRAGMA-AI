import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MessageBubble from "../../components/MessageBubble";
import QuestionInput from "../../components/QuestionInput";
import { fetchCompetitions } from "../../api/competitions";
import { askQuestion } from "../../api/questions";
import type { ChatMessage, Competition } from "../../types";

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ChatPage() {
  const { competitionSlug } = useParams<{ competitionSlug: string }>();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!competitionSlug) return;
    fetchCompetitions()
      .then((list) => {
        const found = list.find((c) => c.slug === competitionSlug);
        if (found) setCompetition(found);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [competitionSlug]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4 text-center">
        <div>
          <p className="text-navy-100 mb-3">Geçersiz yarışma seçimi.</p>
          <button
            onClick={() => navigate("/sorular")}
            className="text-sm font-medium text-signal-orange underline underline-offset-2"
          >
            Yarışma seçimine dön
          </button>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900">
        <div className="flex items-center gap-2 text-sm text-navy-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-signal-orange" />
          Yükleniyor...
        </div>
      </div>
    );
  }

  const handleSend = async (question: string) => {
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: "user", content: question },
    ]);
    setLoading(true);

    try {
      const result = await askQuestion(competition.slug, question);
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content: result.needs_human
            ? "Bu konuda yeterli kaynağım yok, sorunuzu destek ekibine yönlendiriyorum."
            : (result.answer ?? ""),
          confidence: result.confidence,
          sources: result.sources,
          needsHuman: result.needs_human,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content: "Bir hata oluştu, lütfen tekrar deneyin.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7FB]">
      <header className="bg-navy-900 px-4 py-3.5 shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/sorular")}
              className="mb-1 flex items-center gap-1 text-xs font-medium text-navy-200 transition hover:text-white"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Yarışma değiştir
            </button>
            <h1 className="font-display text-base font-semibold text-white">
              {competition.name}
            </h1>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal-orange text-sm font-bold text-navy-900 font-display">
            P
          </div>
        </div>
      </header>

      <main className="chat-scroll mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-5">
        {messages.length === 0 && (
          <div className="mt-14 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-100">
              <svg
                className="h-6 w-6 text-navy-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.117 0-2.185-.183-3.166-.518L3 21l1.518-4.834C3.556 15.185 3 13.64 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="font-display text-base font-medium text-navy-900">
              {competition.name} hakkında sormak istediğin bir şey mi var?
            </p>
            <p className="mt-1.5 max-w-xs text-sm text-slate-500">
              Yanıtlar yalnızca doğrulanmış şartname ve kılavuzlardan, kaynak
              gösterilerek üretilir.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {loading && (
          <div className="flex items-center gap-1.5 px-2 py-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-400 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-400 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-400" />
          </div>
        )}
      </main>

      <div className="mx-auto w-full max-w-2xl">
        <QuestionInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}
