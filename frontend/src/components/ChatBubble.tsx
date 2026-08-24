import { useState } from "react";
import { Link } from "react-router-dom";
import type { ChatMessage, ConfidenceLevel } from "../types";
import { SourceCard } from "./SourceCard";

const CONFIDENCE_META: Record<ConfidenceLevel, { label: string; dot: string }> = {
  yuksek: { label: "Yüksek güven", dot: "bg-[var(--color-success)]" },
  orta: { label: "Orta güven", dot: "bg-[var(--color-gold-500)]" },
  dusuk: { label: "Düşük güven", dot: "bg-[var(--color-flag-600)]" },
};

type SupportState = "idle" | "sending" | "sent" | "dismissed";

export function ChatBubble({
  message,
  onSendToSupport,
}: {
  message: ChatMessage;
  onSendToSupport?: (qaLogId: string) => Promise<void>;
}) {
  const isUser = message.role === "user";
  const primarySource = message.sources?.[0];
  const [supportState, setSupportState] = useState<SupportState>("idle");
  const needsEvidence = message.durum === "kanit_bulunamadi";

  async function handleSendToSupport() {
    setSupportState("sending");
    try {
      await onSendToSupport?.(message.id);
      setSupportState("sent");
    } catch {
      setSupportState("idle");
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isUser ? "" : "w-full"}`}>
        <div
          className={
            isUser
              ? "rounded-2xl rounded-tr-sm bg-[var(--color-navy-800)] px-4 py-3 text-white"
              : `rounded-2xl rounded-tl-sm border px-4 py-3 ${
                  needsEvidence
                    ? "border-[var(--color-flag-600)] bg-[var(--color-flag-50)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]"
                }`
          }
        >
          {needsEvidence ? (
            <>
              <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--color-flag-700)]">
                Kaynaklarda Bulunamadı
              </p>
              <p className="text-sm leading-relaxed">{message.mesaj ?? message.content}</p>

              {supportState === "idle" && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSendToSupport}
                    className="rounded-md bg-[var(--color-flag-600)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Destek ekibine gönder
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupportState("dismissed")}
                    className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-700)] hover:bg-white"
                  >
                    Vazgeç
                  </button>
                </div>
              )}
              {supportState === "sending" && (
                <p className="mt-3 text-xs text-[var(--color-ink-500)]">Gönderiliyor...</p>
              )}
              {supportState === "sent" && (
                <p className="mt-3 text-xs font-semibold text-[var(--color-success)]">
                  Sorunuz destek ekibine iletildi.
                </p>
              )}
              {supportState === "dismissed" && (
                <p className="mt-3 text-xs text-[var(--color-ink-500)]">
                  Vazgeçildi — sorunuzu değiştirip tekrar sorabilirsiniz.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}

          {!isUser && !needsEvidence && primarySource && message.confidenceLevel && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-ink-500)]">
              <span>
                Kaynak:{" "}
                {primarySource.documentUrl ? (
                  <a
                    href={primarySource.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-[var(--color-navy-700)]"
                  >
                    {primarySource.documentTitle}
                  </a>
                ) : (
                  primarySource.documentTitle
                )}
              </span>
              <span className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${CONFIDENCE_META[message.confidenceLevel].dot}`} />
                {CONFIDENCE_META[message.confidenceLevel].label}
              </span>
              {message.competitionId && (
                <Link
                  to={`/sartname?category=${message.competitionId}`}
                  className="ml-auto font-semibold text-[var(--color-navy-700)] hover:underline"
                >
                  Şartnameyi Gör →
                </Link>
              )}
            </div>
          )}
        </div>

        {!needsEvidence &&
          message.sources?.map((s) => <SourceCard key={s.documentId + s.section} source={s} />)}
      </div>
    </div>
  );
}
