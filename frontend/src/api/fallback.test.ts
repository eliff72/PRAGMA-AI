import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("./client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

// vi.mock("./auth") mock zinciri client.ts uzerinden tetiklenmesin diye
// gerekli degil — apiClient'in kendisi yukarida tamamen sahteleniyor.

import { fetchCompetitions } from "./competitions";
import { askQuestion } from "./questions";
import { getUsingMock } from "./mockFallbackState";

function networkError() {
  const err = new Error("Network Error") as Error & { isAxiosError: boolean; request: unknown };
  err.isAxiosError = true;
  err.request = {};
  return err;
}

function httpError(status: number) {
  const err = new Error(`Request failed with status code ${status}`) as Error & {
    isAxiosError: boolean;
    response: { status: number; data: unknown };
  };
  err.isAxiosError = true;
  err.response = { status, data: { detail: "backend hatasi" } };
  return err;
}

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("fetchCompetitions — mock fallback kurallari", () => {
  it("basarili gercek yanit doner ve mock bayragini kapatir", async () => {
    const real = [{ id: 1, name: "Gercek Yarisma", slug: "gercek", description: null, is_active: true }];
    mockGet.mockResolvedValue({ data: real });

    const result = await fetchCompetitions();

    expect(result).toEqual(real);
    expect(getUsingMock()).toBe(false);
  });

  it("bos liste donerse fallback'a DUSMEZ (fallback acik olsa bile) — bu gecerli bir gercek durumdur", async () => {
    vi.stubEnv("VITE_ENABLE_MOCK_FALLBACK", "true");
    mockGet.mockResolvedValue({ data: [] });

    const result = await fetchCompetitions();

    expect(result).toEqual([]);
  });

  it("gercek HTTP hatasinda (error.response var) fallback acik olsa bile mock'a DUSMEZ, hatayi firlatir", async () => {
    vi.stubEnv("VITE_ENABLE_MOCK_FALLBACK", "true");
    mockGet.mockRejectedValue(httpError(500));

    await expect(fetchCompetitions()).rejects.toThrow();
  });

  it("varsayilan (fallback KAPALI) durumda ag hatasinda bile mock'a DUSMEZ, hatayi firlatir", async () => {
    mockGet.mockRejectedValue(networkError());

    await expect(fetchCompetitions()).rejects.toThrow();
  });

  it("fallback ACIKKEN gercek ag hatasinda (error.response yok) mock veriye duser ve bayragi acar", async () => {
    vi.stubEnv("VITE_ENABLE_MOCK_FALLBACK", "true");
    mockGet.mockRejectedValue(networkError());

    const result = await fetchCompetitions();

    expect(result.length).toBeGreaterThan(0);
    expect(getUsingMock()).toBe(true);
  });
});

describe("askQuestion — mock fallback kurallari", () => {
  it("basarili gercek yanit doner", async () => {
    const real = { qa_log_id: 1, answer: "gercek cevap", confidence: 0.9, needs_human: false, sources: [] };
    mockPost.mockResolvedValue({ data: real });

    const result = await askQuestion("gercek", "soru");

    expect(result).toEqual(real);
    expect(getUsingMock()).toBe(false);
  });

  it("gercek HTTP hatasinda (orn. 404 yarisma yok) fallback acik olsa bile mock'a DUSMEZ", async () => {
    vi.stubEnv("VITE_ENABLE_MOCK_FALLBACK", "true");
    mockPost.mockRejectedValue(httpError(404));

    await expect(askQuestion("olmayan-yarisma", "soru")).rejects.toThrow();
  });

  it("varsayilan (fallback KAPALI) durumda ag hatasinda mock'a DUSMEZ, hatayi firlatir", async () => {
    mockPost.mockRejectedValue(networkError());

    await expect(askQuestion("iha", "soru")).rejects.toThrow();
  });

  it("fallback ACIKKEN gercek ag hatasinda mock cevap doner ve bayragi acar", async () => {
    vi.stubEnv("VITE_ENABLE_MOCK_FALLBACK", "true");
    mockPost.mockRejectedValue(networkError());

    const result = await askQuestion("iha", "azami agirlik kac kg");

    expect(result.needs_human).toBe(false);
    expect(getUsingMock()).toBe(true);
  });
});
