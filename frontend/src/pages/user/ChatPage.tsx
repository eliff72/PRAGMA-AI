import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MessageBubble from "../../components/MessageBubble";
import QuestionInput from "../../components/QuestionInput";
import { fetchCompetitions } from "../../api/competitions";
import { askQuestion } from "../../api/questions";
import type { ChatMessage, Competition } from "../../types";

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const SUGGESTIONS = [
  "Başvuru için son tarih nedir?",
  "Takım kaç kişiden oluşabilir?",
  "Şartnamedeki teknik sınırlar neler?",
];

export default function ChatPage() {
  const { competitionSlug } = useParams<{ competitionSlug: string }>();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-3 text-3xl">🧭</div>
          <p className="mb-4 text-sm text-slate-600">Geçersiz yarışma seçimi.</p>
          <button
            onClick={() => navigate("/sorular")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Yarışma seçimine dön
          </button>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Yükleniyor...</p>
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
    <div className="flex h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Üst bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/sorular")}
            aria-label="Yarışma değiştir"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Yarışma
            </p>
            <h1 className="truncate text-sm sm:text-base font-semibold text-slate-900">
              {competition.name}
            </h1>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Çevrimiçi
          </span>
        </div>
      </header>

      {/* Mesajlar */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="mt-6 sm:mt-12 flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-3xl shadow-lg shadow-blue-600/25">
                💬
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                {competition.name} hakkında sormak istediğin bir şey mi var?
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Şartname, kurallar veya takvim ile ilgili sorunu yaz — yanıtı
                kaynağıyla birlikte getirelim.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          )}

          {loading && (
            <div className="mt-2 flex items-center gap-2 px-1">
              <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
              </div>
              <span className="text-xs text-slate-400">
                Yanıt hazırlanıyor...
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      <QuestionInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
