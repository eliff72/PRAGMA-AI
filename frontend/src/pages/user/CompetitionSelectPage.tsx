import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchCompetitions } from "../../api/competitions";

export default function CompetitionSelectPage() {
  const navigate = useNavigate();
  const {
    data: competitions,
    isLoading,
    isError,
  } = useQuery({ queryKey: ["competitions"], queryFn: fetchCompetitions });

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-800">Yarışmanı Seç</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sorularının hangi yarışmanın kaynaklarında aranacağını belirler.
        </p>
      </div>

      {isLoading && <p className="text-slate-400">Yükleniyor...</p>}
      {isError && <p className="text-red-500">Yarışmalar yüklenemedi.</p>}

      <div className="grid w-full gap-3">
        {competitions?.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/sorular/${c.slug}`)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-400 hover:shadow"
          >
            <span className="font-medium text-slate-800">{c.name}</span>
          </button>
        ))}
        {competitions?.length === 0 && (
          <p className="text-center text-sm text-slate-400">
            Henüz tanımlı yarışma yok. (feature/database ve feature/backend-api
            entegrasyonu bekleniyor)
          </p>
        )}
      </div>
    </div>
  );
}
