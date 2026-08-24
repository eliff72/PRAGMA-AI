import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { fetchAnalytics } from "../api/admin";
import type { AnalyticsSummary } from "../types";

export function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    fetchAnalytics().then(setData);
  }, []);

  if (!data) return null;

  const maxTopicCount = Math.max(...data.topTopics.map((t) => t.count));

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">
          Sistem Sağlığı
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          Yanıt kalitesi, insana yönlendirme oranı ve sık sorulan konular.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Veritabanı Durumu"
            value={data.dbStatus === "ok" ? "Çalışıyor" : "Kapalı"}
            status={data.dbStatus === "ok" ? "success" : "error"}
          />
          <StatCard
            label="AI Servis Durumu"
            value={data.aiServiceStatus === "ok" ? "Çalışıyor" : "Yapılandırılmadı"}
            status={data.aiServiceStatus === "ok" ? "success" : "error"}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Toplam Soru"
            value={data.totalQuestions.toString()}
          />
          <StatCard
            label="Son 24 Saatteki Soru"
            value={data.questionsLast24h.toString()}
          />
          <StatCard
            label="Açık Destek Talebi"
            value={data.openTicketsCount.toString()}
            accent={data.openTicketsCount > 0}
          />
          <StatCard
            label="İnsana Yönlendirme Oranı"
            value={`%${Math.round(data.escalationRate * 100)}`}
            accent
          />
          <StatCard
            label="Ortalama Güven Skoru"
            value={`%${Math.round(data.avgConfidence * 100)}`}
          />
          <StatCard
            label="Yarışma Kategorisi"
            value={data.totalCompetitions.toString()}
          />
          <StatCard
            label="Yüklü Şartname/Kaynak"
            value={data.totalSpecifications.toString()}
          />
        </div>

        <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="font-display text-sm font-semibold text-[var(--color-ink-700)]">
            Yanıt Kalitesi — Güven Seviyesi Dağılımı
          </h2>
          <p className="mt-1 text-xs text-[var(--color-ink-500)]">
            Modelin kendi değerlendirdiği güven seviyesine göre son cevaplar.
          </p>
          {(() => {
            const { yuksek, orta, dusuk } = data.confidenceDistribution;
            const total = yuksek + orta + dusuk;
            const rows: { label: string; count: number; color: string }[] = [
              { label: "Yüksek", count: yuksek, color: "bg-[var(--color-success)]" },
              { label: "Orta", count: orta, color: "bg-[var(--color-gold-500)]" },
              { label: "Düşük", count: dusuk, color: "bg-[var(--color-flag-600)]" },
            ];
            return (
              <div className="mt-4 space-y-3">
                {rows.map((r) => (
                  <div key={r.label}>
                    <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-ink-700)]">
                      <span>{r.label} güven</span>
                      <span className="font-mono">{r.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
                      <div
                        className={`h-full ${r.color}`}
                        style={{ width: total ? `${(r.count / total) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
                {total === 0 && (
                  <p className="text-xs text-[var(--color-ink-500)]">Henüz cevaplanmış soru yok.</p>
                )}
              </div>
            );
          })()}
        </div>

        <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="font-display text-sm font-semibold text-[var(--color-ink-700)]">
            Kategori Bazında İnsana Yönlendirme Oranı
          </h2>
          <div className="mt-4 space-y-3">
            {data.escalationByCategory.length === 0 && (
              <p className="text-xs text-[var(--color-ink-500)]">Henüz soru sorulmamış.</p>
            )}
            {data.escalationByCategory.map((c) => (
              <div key={c.competitionName}>
                <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-ink-700)]">
                  <span>{c.competitionName}</span>
                  <span className="font-mono">
                    %{Math.round(c.escalationRate * 100)} ({c.escalatedCount}/{c.totalQuestions})
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full bg-[var(--color-flag-600)]"
                    style={{ width: `${c.escalationRate * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="font-display text-sm font-semibold text-[var(--color-ink-700)]">
            Sık Sorulan Konular
          </h2>
          <div className="mt-4 space-y-3">
            {data.topTopics.map((t) => (
              <div key={t.topic}>
                <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-ink-700)]">
                  <span>{t.topic}</span>
                  <span className="font-mono">{t.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full bg-[var(--color-navy-700)]"
                    style={{ width: `${(t.count / maxTopicCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  accent,
  status,
}: {
  label: string;
  value: string;
  accent?: boolean;
  status?: "success" | "error";
}) {
  const colorClass =
    status === "success"
      ? "text-[var(--color-success)]"
      : status === "error"
        ? "text-[var(--color-flag-600)]"
        : accent
          ? "text-[var(--color-flag-600)]"
          : "text-[var(--color-ink-900)]";

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
      <p className="text-xs text-[var(--color-ink-500)]">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}
