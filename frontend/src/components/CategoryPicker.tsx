import { useState } from "react";
import { matchesSearch } from "../utils/search";
import type { Competition } from "../types";

export function CategoryPicker({
  competitions,
  value,
  onChange,
  includeAllOption,
}: {
  competitions: Competition[];
  value: string;
  onChange: (id: string) => void;
  includeAllOption?: boolean;
}) {
  const [search, setSearch] = useState("");
  const filtered = competitions.filter((c) => matchesSearch(c.name, search));

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-white p-4">
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-500)]">
        Yarışma Kategorisi
      </label>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Kategori ara..."
        className="mb-1.5 w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium"
      >
        {includeAllOption && <option value="">Tüm kategoriler</option>}
        {filtered.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </section>
  );
}
