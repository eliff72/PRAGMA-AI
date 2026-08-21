import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "../../api/metrics";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-metrics"], queryFn: fetchDashboardMetrics });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">İzleme Paneli</h1>
        <p className="text-sm text-slate-500">Yanıt kalitesi, insana yönlendirme oranı, sık sorulan konular.</p>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Yükleniyor...</p>}

      {data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">İnsana Yönlendirme Oranı</p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">
              {data.escalation_rate !== null ? `%${Math.round(data.escalation_rate * 100)}` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">Toplam Soru</p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">{data.total_questions ?? "—"}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">Sık Sorulan Konular</p>
            {data.top_topics.length === 0 ? (
              <p className="mt-1 text-sm text-slate-400">
                Henüz veri yok (feature/database entegrasyonu bekleniyor).
              </p>
            ) : (
              <ul className="mt-2 list-disc pl-4 text-sm text-slate-700">
                {data.top_topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
