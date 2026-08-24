// Backend'e gercekten ulasilamadiginda (ve VITE_ENABLE_MOCK_FALLBACK=true
// iken) mock veriye dusuldugunu tum uygulamaya (ozellikle MockDataBanner'a)
// bildiren minimal bir pub-sub store. React disinda (api/*.ts) da
// cagrilabilmesi icin bir context/hook yerine duz modul state kullanildi.

type Listener = () => void;

let isUsingMock = false;
const listeners = new Set<Listener>();

export function setUsingMock(value: boolean): void {
  if (isUsingMock === value) return;
  isUsingMock = value;
  listeners.forEach((listener) => listener());
}

export function getUsingMock(): boolean {
  return isUsingMock;
}

export function subscribeUsingMock(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
