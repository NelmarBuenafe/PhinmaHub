import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../services/adminApi.js";

export function useAdminList(resource, initialParams = {}) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [params, setParams] = useState(initialParams);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await adminApi.list(resource, params);
      setData(response.data.data);
      setPagination(
        response.data.pagination || {
          page: 1,
          pages: 1,
          total: response.data.data.length,
        },
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [params, resource]);
  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    function handleSearch(event) {
      setParams((current) => ({ ...current, page: 1, search: event.detail }));
    }
    window.addEventListener("admin-search", handleSearch);
    return () => window.removeEventListener("admin-search", handleSearch);
  }, []);
  return { data, error, load, loading, pagination, params, setParams };
}
