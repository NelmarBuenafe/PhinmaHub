import api from "./api.js";

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard", { timeout: 15000 }),
  list: (resource, params = {}) =>
    api.get(`/admin/${resource}`, { params, timeout: 15000 }),
  patch: (resource, id, action, body) =>
    api.patch(`/admin/${resource}/${id}${action ? `/${action}` : ""}`, body, {
      timeout: 15000,
    }),
  create: (resource, body) =>
    api.post(`/admin/${resource}`, body, { timeout: 15000 }),
};
