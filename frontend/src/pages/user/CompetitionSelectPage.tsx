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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Marka başlığı */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl shadow-lg shadow-blue-600/25">
            🤖
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Hangi yarışma hakkında sorunuz var?
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Bir kategori seçin, sorularınızı o yarışmanın şartnamesine göre
            yanıtlayalım.
          </p>
        </div>

        {/* Kart */}
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 sm:p-8 shadow-xl shadow-slate-900/5 backdrop-blur">
          {loading ? (
            <div className="space-y-3">
              <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm">
                ⚠️
              </span>
              <div>
                <p className="text-sm font-semibold text-rose-900">
                  Yarışmalar yüklenemedi
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-rose-700">
                  Backend'in çalıştığından emin olun ve sayfayı yenileyin.
                </p>
              </div>
            </div>
          ) : (
            <>
              <label
                htmlFor="competition"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Yarışma
              </label>

              <div className="relative">
                <select
                  id="competition"
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">Bir yarışma seçin...</option>
                  {competitions.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  ▾
                </span>
              </div>

              {selected && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    {selected.name}
                  </p>
                  {selected.description && (
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {selected.description}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={!selectedSlug}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                Devam Et
                <span aria-hidden>→</span>
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Yanıtlar resmi şartname ve kılavuz belgelerinden üretilir.
        </p>
      </div>
    </div>
  );
}
