import { useCallback, useEffect, useState } from "react";
import api from "../services/api.js";

export function useCourseList(endpoint) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(endpoint);
        if (active) setCourses(response.data.data || []);
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.status === 403
              ? "You are not authorized to view these courses."
              : "This information could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCourses();
    return () => {
      active = false;
    };
  }, [endpoint, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);
  return { courses, error, loading, reload };
}
