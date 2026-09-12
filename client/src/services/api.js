import axios from "axios";
import { supabase } from "./supabase.js";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiBaseUrl =
  configuredApiUrl ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "");

if (!apiBaseUrl) {
  throw new Error("VITE_API_URL must be configured for production.");
}

if (
  import.meta.env.PROD &&
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(apiBaseUrl)
) {
  throw new Error("VITE_API_URL cannot target localhost in production.");
}

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

export default api;
