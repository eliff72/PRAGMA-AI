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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-center">
        <div>
          <p className="text-slate-600 mb-3">Geçersiz yarışma seçimi.</p>
          <button
            onClick={() => navigate("/sorular")}
            className="text-blue-600 text-sm underline"
          >
            Yarışma seçimine dön
          </button>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-sm">Yükleniyor...</p>
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <button
          onClick={() => navigate("/sorular")}
          className="text-xs text-slate-400 mb-1"
        >
          ← Yarışma değiştir
        </button>
        <h1 className="text-base font-semibold text-slate-800">
          {competition.name}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            {competition.name} hakkında sormak istediğin bir şey mi var?
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {loading && (
          <div className="text-xs text-slate-400 px-2">
            Yanıt hazırlanıyor...
          </div>
        )}
      </main>

      <QuestionInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
