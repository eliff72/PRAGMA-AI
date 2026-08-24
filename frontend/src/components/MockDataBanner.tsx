import { useSyncExternalStore } from "react";
import { getUsingMock, subscribeUsingMock } from "../api/mockFallbackState";

export default function MockDataBanner() {
  const isUsingMock = useSyncExternalStore(subscribeUsingMock, getUsingMock);

  if (!isUsingMock) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-400 px-3 py-1.5 text-center text-xs font-semibold text-amber-950 shadow">
      ⚠️ Demo/mock veri gösteriliyor — backend'e ulaşılamıyor
    </div>
  );
}
