import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deactivateSource, fetchSources, uploadSource } from "../../api/sources";

export default function SourcesPage() {
  const queryClient = useQueryClient();
  const [competitionSlug, setCompetitionSlug] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: sources, isLoading } = useQuery({
    queryKey: ["sources", competitionSlug],
    queryFn: () => fetchSources(competitionSlug),
    enabled: Boolean(competitionSlug),
  });

  const uploadMutation = useMutation({
    mutationFn: () => uploadSource(competitionSlug, title, file as File),
    onSuccess: () => {
      setTitle("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["sources", competitionSlug] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (sourceId: string) => deactivateSource(competitionSlug, sourceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sources", competitionSlug] }),
  });

  function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    uploadMutation.mutate();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Kaynak Yönetimi</h1>
        <p className="text-sm text-slate-500">Şartname, kılavuz ve SSS belgelerini yükleyin/pasife alın (Akış 2).</p>
      </div>

      <input
        value={competitionSlug}
        onChange={(e) => setCompetitionSlug(e.target.value)}
        placeholder="Yarışma slug (örn. insansi-robot)"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      <form onSubmit={handleUpload} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-700">Yeni Kaynak Yükle</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Belge başlığı"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          required
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
          required
        />
        <button
          type="submit"
          disabled={!competitionSlug || uploadMutation.isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {uploadMutation.isPending ? "Yükleniyor..." : "Yükle"}
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700">Mevcut Kaynaklar</h2>
        {!competitionSlug && (
          <p className="px-4 py-3 text-sm text-slate-400">Kaynakları görmek için önce yarışma slug'ı girin.</p>
        )}
        {isLoading && <p className="px-4 py-3 text-sm text-slate-400">Yükleniyor...</p>}
        {sources?.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{s.title}</p>
              <p className="text-xs text-slate-400">
                {s.source_type} · v{s.version} · {s.status}
              </p>
            </div>
            {s.status === "active" && (
              <button
                onClick={() => deactivateMutation.mutate(s.id)}
                className="text-xs font-medium text-red-500 hover:underline"
              >
                Pasife al
              </button>
            )}
          </div>
        ))}
        {sources?.length === 0 && (
          <p className="px-4 py-3 text-sm text-slate-400">Bu yarışma için henüz kaynak yok.</p>
        )}
      </div>
    </div>
  );
}
