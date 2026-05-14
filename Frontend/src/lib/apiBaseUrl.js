/**
 * Chuẩn hóa VITE_API_URL: backend mount mọi route dưới /api/*.
 * Xử lý copy-paste sai (khoảng trắng) và thiếu hậu tố /api.
 */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  let u = String(raw).replace(/\s+/g, "").trim();
  u = u.replace(/\/+$/, "");
  if (!/\/api$/i.test(u)) {
    u = `${u}/api`;
  }
  return u;
}
