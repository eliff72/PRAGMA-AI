import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { ChatBubble } from "../components/ChatBubble";
import { fetchCompetitions } from "../api/resources";
import { askQuestion, sendToSupport } from "../api/chat";
import { matchesSearch } from "../utils/search";
import type { ChatMessage, Competition } from "../types";

export function CompetitorChatPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionSearch, setCompetitionSearch] = useState("");
  const [competitionId, setCompetitionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCompetitions().then((list) => {
      setCompetitions(list);
      if (list.length) setCompetitionId(list[0].id);
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  async function handleSend() {
    if (!input.trim() || !competitionId || isThinking) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);
    setError(null);

    try {
      const answer = await askQuestion(userMessage.content, competitionId);
      setMessages((prev) => [...prev, { ...answer, competitionId }]);
    } catch {
      setError("Sorunuz yanıtlanamadı. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsThinking(false);
    }
  }

  async function handleSendToSupport(qaLogId: string) {
    await sendToSupport(qaLogId);
  }

  const selectedCompetition = competitions.find((c) => c.id === competitionId);
  const filteredCompetitions = competitions.filter((c) => matchesSearch(c.name, competitionSearch));

  return (
    <AppShell>
      <div className="mx-auto flex h-full max-w-3xl flex-col px-6 py-6">
        <header className="mb-4">
          <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">
            Sorunu doğrulanmış kaynaklardan yanıtlayalım
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">
            Önce yarışmanı seç, sonra soruyu kendi cümlelerinle yaz.
          </p>

          <input
            value={competitionSearch}
            onChange={(e) => setCompetitionSearch(e.target.value)}
            placeholder="Yarışma kategorisi ara..."
            className="mt-3 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-navy-700)]"
          />
          <select
            value={competitionId}
            onChange={(e) => {
              setCompetitionId(e.target.value);
              setMessages([]);
            }}
            className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium outline-none focus:border-[var(--color-navy-700)]"
          >
            {filteredCompetitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {selectedCompetition && (
            <p className="mt-1 text-xs text-[var(--color-ink-500)]">
              {selectedCompetition.description}
            </p>
          )}

          {competitionId && (
            <Link
              to={`/sartname?category=${competitionId}`}
              className="mt-2 inline-block text-xs font-semibold text-[var(--color-navy-700)] hover:underline"
            >
              Bu Yarışmanın Şartnamesini Gör →
            </Link>
          )}
        </header>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white/60 p-4"
        >
          {messages.length === 0 && (
            <EmptyState competitionName={selectedCompetition?.name} />
          )}

          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} onSendToSupport={handleSendToSupport} />
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-ink-500)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-flag-600)]" />
              Kaynaklarda aranıyor...
            </div>
          )}

          {error && <p className="text-xs text-[var(--color-flag-600)]">{error}</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Örn: Takım değişikliği ne zamana kadar yapılabilir?"
            className="flex-1 rounded-md border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-navy-700)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="rounded-md bg-[var(--color-navy-900)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Gönder
          </button>
        </form>
      </div>
    </AppShell>
  );
}

function EmptyState({ competitionName }: { competitionName?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center text-[var(--color-ink-500)]">
      <p className="font-display text-base font-medium text-[var(--color-ink-700)]">
        {competitionName ? `${competitionName} hakkında sormak istediğin bir şey mi var?` : "Bir yarışma seç ve sormak istediğini yaz."}
      </p>
      <p className="mt-1 text-sm">
        Yanıt yalnızca doğrulanmış şartname ve kılavuzlardan üretilir; emin
        olunmayan durumlarda destek ekibine yönlendirilirsin.
      </p>
    </div>
  );
}
