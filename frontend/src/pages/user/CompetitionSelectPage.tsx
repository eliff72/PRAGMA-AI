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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h1 className="text-xl font-semibold text-slate-800 mb-1">
          Hangi yarışma hakkında sorunuz var?
        </h1>
        <p className="text-sm text-slate-500 mb-5">
          Bir kategori seçin, sorularınızı o kategoriye göre yanıtlayalım.
        </p>

        {loading ? (
          <p className="text-sm text-slate-400">Yükleniyor...</p>
        ) : error ? (
          <p className="text-sm text-red-500">
            Yarışmalar yüklenemedi. Backend'in çalıştığından emin olun.
          </p>
        ) : (
          <>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-3 outline-none focus:border-blue-500"
            >
              <option value="">Bir yarışma seçin...</option>
              {competitions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {selected?.description && (
              <p className="text-sm text-slate-500 mb-4">{selected.description}</p>
            )}

            <button
              onClick={handleContinue}
              disabled={!selectedSlug}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Devam Et
            </button>
          </>
        )}
      </div>
    </div>
  );
}
