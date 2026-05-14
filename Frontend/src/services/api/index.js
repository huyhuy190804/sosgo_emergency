import axios from "axios";
import { auth, waitForFirebaseAuth } from "@/lib/firebase";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};
  const url = config.url || "";
  if (url.includes("/auth/firebase")) return config;

  if (config.skipStaffJwt) {
    const user = await waitForFirebaseAuth();
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }

  const jwt = typeof localStorage !== "undefined"
    ? localStorage.getItem("auth_token")
    : null;
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
    return config;
  }

  const user = await waitForFirebaseAuth();
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;