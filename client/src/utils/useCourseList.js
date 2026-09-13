import { useApiQuery } from "./useApiQuery.js";

export function useCourseList(endpoint) {
  const { data, ...query } = useApiQuery(endpoint);
  return { courses: data?.data || [], ...query };
}
