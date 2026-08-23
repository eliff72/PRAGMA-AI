import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCompetitions } from "../../api/competitions";
import type { Competition } from "../../types";

export default function CompetitionSelectPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompetitions()
      .then(setCompetitions)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const selected = competitions.find((c) => c.slug === selectedSlug);

  const handleContinue = () => {
    if (selectedSlug) {
      navigate(`/sorular/${selectedSlug}`);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4 py-10">
      {/* arka plan dokusu */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-navy-700/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-signal-orange/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-orange text-sm font-bold text-navy-900 font-display">
            P
          </div>
          <span className="text-sm font-medium tracking-wide text-navy-100">
            PRAGMA-AI &middot; TEKNOFEST Destek Asistanı
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-navy-900/30">
          <div className="h-1.5 w-full bg-gradient-to-r from-signal-orange to-navy-600" />

          <div className="p-7">
            <h1 className="font-display text-xl font-semibold text-navy-900 mb-1.5">
              Hangi yarışma hakkında sorunuz var?
            </h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Bir kategori seçin, sorularınızı yalnızca o yarışmanın doğrulanmış
              kaynaklarına göre yanıtlayalım.
            </p>

            {loading ? (
              <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-navy-400" />
                Yükleniyor...
              </div>
            ) : error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
                Yarışmalar yüklenemedi. Backend'in çalıştığından emin olun.
              </p>
            ) : (
              <>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Yarışma kategorisi
                </label>
                <div className="relative mb-3">
                  <select
                    value={selectedSlug}
                    onChange={(e) => setSelectedSlug(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-navy-900 outline-none transition focus:border-signal-orange focus:bg-white focus:ring-2 focus:ring-signal-orange/20"
                  >
                    <option value="">Bir yarışma seçin...</option>
                    {competitions.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {selected?.description && (
                  <p className="mb-5 rounded-lg bg-navy-50 px-3.5 py-3 text-sm text-navy-700 leading-relaxed animate-rise-in">
                    {selected.description}
                  </p>
                )}

                <button
                  onClick={handleContinue}
                  disabled={!selectedSlug}
                  className="w-full rounded-xl bg-navy-800 py-3 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Devam Et
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
