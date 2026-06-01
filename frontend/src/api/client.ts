import axios, { AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "inventorypro_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Attach the bearer token to every request when present.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Pull a human-readable message out of a FastAPI error response. */
export function extractError(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) {
      return detail.map((d: { msg: string }) => d.msg).join(", ");
    }
    if (err.response?.data?.errors?.[0]?.msg) {
      return err.response.data.errors[0].msg;
    }
    return err.message;
  }
  return "Something went wrong. Please try again.";
}
