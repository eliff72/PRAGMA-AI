import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChatBubble from "../../components/ChatBubble";
import QuestionInput from "../../components/QuestionInput";
import {
  askQuestion,
  mockCompetitions,
  type Source,
} from "../../api/questions";

interface Message {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  confidence?: number;
  needsHuman?: boolean;
}

export default function ChatPage() {
  const { competitionId } = useParams<{ competitionId: string }>();
  const navigate = useNavigate();
  const competition = mockCompetitions.find((c) => c.id === competitionId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  if (!competition) {
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

  const handleSend = async (question: string) => {
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    const result = await askQuestion(competition.id, question);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: result.answer,
        sources: result.sources,
        confidence: result.confidence,
        needsHuman: result.needsHuman,
      },
    ]);
    setLoading(false);
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

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            {competition.name} hakkında sormak istediğin bir şey mi var?
          </div>
        )}

        {messages.map((m, i) => (
          <ChatBubble
            key={i}
            role={m.role}
            text={m.text}
            sources={m.sources}
            confidence={m.confidence}
            needsHuman={m.needsHuman}
          />
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
