import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const TOKEN_STORAGE_KEY = "access_token";

// Bu branch'te henuz gercek bir login ekrani yok. Yarismaci akisini gercek
// backend'e karsi test edebilmek icin sabit bir demo "competitor" hesabiyla
// otomatik login yapiliyor (yoksa once register edilir). Gercek bir login
// ekrani eklendiginde bu dosyanin sadece ensureAccessToken cagrisi kalir,
// DEMO_CREDENTIALS ve registerDemoUser kaldirilir.
const DEMO_CREDENTIALS = {
  email: "demo.competitor@pragma.ai",
  password: "PragmaDemo123!",
  full_name: "Demo Yarismaci",
  role: "competitor",
};

async function login(): Promise<string> {
  const { data } = await axios.post(`${BASE_URL}/auth/login`, {
    email: DEMO_CREDENTIALS.email,
    password: DEMO_CREDENTIALS.password,
  });
  return data.access_token;
}

async function registerDemoUser(): Promise<void> {
  await axios.post(`${BASE_URL}/auth/register`, DEMO_CREDENTIALS);
}

export async function ensureAccessToken(): Promise<string> {
  const cached = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (cached) return cached;

  let token: string;
  try {
    token = await login();
  } catch {
    await registerDemoUser();
    token = await login();
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  return token;
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}
