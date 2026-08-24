import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { answerEscalation, fetchOpenEscalations } from "../../api/escalations";
import EscalationCard from "./EscalationCard";

export default function EscalationsPage() {
  const queryClient = useQueryClient();
  const { data: escalations, isLoading } = useQuery({
    queryKey: ["escalations"],
    queryFn: fetchOpenEscalations,
  });

  const answerMutation = useMutation({
    mutationFn: ({ id, answer, addToFaq }: { id: string; answer: string; addToFaq: boolean }) =>
      answerEscalation(id, answer, addToFaq),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["escalations"] }),
  });

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Destek Kuyruğu</h1>
        <p className="text-sm text-slate-500">Sistemin yanıtlayamadığı, insana yönlenen sorular (Akış 3).</p>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Yükleniyor...</p>}
      {escalations?.length === 0 && <p className="text-sm text-slate-400">Bekleyen soru yok.</p>}

      {escalations?.map((e) => (
        <EscalationCard
          key={e.id}
          escalation={e}
          isSubmitting={answerMutation.isPending}
          onAnswer={(answer, addToFaq) => answerMutation.mutate({ id: e.id, answer, addToFaq })}
        />
      ))}
    </div>
  );
}
