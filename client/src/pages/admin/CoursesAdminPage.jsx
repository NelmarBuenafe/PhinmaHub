import { useState } from "react";
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  Pagination,
  SearchFilters,
  StatusBadge,
  Toast,
} from "../../components/admin/AdminUI.jsx";
import { adminApi } from "../../services/adminApi.js";
import { formatDate } from "../../utils/admin.js";
import { useAdminList } from "../../utils/useAdminList.js";

function CoursesAdminPage() {
  const list = useAdminList("courses", { page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [teacher, setTeacher] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [processing, setProcessing] = useState(false);

  async function confirm() {
    setProcessing(true);
    try {
      await adminApi.patch("courses", selected.course.id, "status", {
        status: selected.status,
      });
      setToast(`Course changed to ${selected.status}.`);
      setSelected(null);
      list.load();
    } catch (error) {
      setToast(error.response?.data?.message || "Update failed.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <PageHeader
        description="Supervise publishing status while Teachers remain the owners of course content."
        title="Course Management"
      />
      <SearchFilters
        onSearch={() =>
          list.setParams({
            ...list.params,
            page: 1,
            search,
            teacher: teacher || undefined,
            category: category || undefined,
          })
        }
        search={search}
        setSearch={setSearch}
      >
        <input
          aria-label="Teacher ID filter"
          className="rounded-xl border px-3"
          onChange={(event) => setTeacher(event.target.value)}
          placeholder="Teacher UUID"
          value={teacher}
        />
        <select
          aria-label="Course status"
          className="rounded-xl border px-3"
          onChange={(event) =>
            list.setParams({
              ...list.params,
              page: 1,
              status: event.target.value || undefined,
            })
          }
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <input
          aria-label="Category filter"
          className="rounded-xl border px-3"
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Category"
          value={category}
        />
      </SearchFilters>
      {list.loading ? (
        <LoadingSkeleton />
      ) : list.error ? (
        <ErrorState onRetry={list.load} />
      ) : list.data.length ? (
        <>
          <div
            aria-label="Course management table"
            className="overflow-x-auto rounded-2xl border bg-white"
            role="region"
            tabIndex="0"
          >
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {[
                    "Course",
                    "Code",
                    "Teacher",
                    "Enrollments",
                    "Category",
                    "Status",
                    "Updated",
                    "Actions",
                  ].map((heading) => (
                    <th className="px-4 py-3" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.data.map((course) => (
                  <tr className="ph-table-row border-t" key={course.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {course.thumbnail_url ? (
                          <img
                            alt=""
                            className="size-10 rounded-lg object-cover"
                            src={course.thumbnail_url}
                          />
                        ) : (
                          <span className="size-10 rounded-lg bg-emerald-100" />
                        )}
                        <strong>{course.title}</strong>
                      </div>
                    </td>
                    <td className="px-4">{course.course_code}</td>
                    <td className="px-4">{course.teacher_name}</td>
                    <td className="px-4">{course.enrollment_count}</td>
                    <td className="px-4">{course.category || "—"}</td>
                    <td className="px-4">
                      <StatusBadge value={course.status} />
                    </td>
                    <td className="px-4">{formatDate(course.updated_at)}</td>
                    <td className="px-4">
                      <div className="flex gap-3">
                        <button
                          className="font-bold"
                          onClick={() =>
                            setToast(`${course.title} (${course.course_code})`)
                          }
                          type="button"
                        >
                          View
                        </button>
                        {course.status !== "published" && (
                          <button
                            className="font-bold text-emerald-700"
                            onClick={() =>
                              setSelected({ course, status: "published" })
                            }
                            type="button"
                          >
                            Publish
                          </button>
                        )}
                        {course.status !== "archived" && (
                          <button
                            className="font-bold text-red-700"
                            onClick={() =>
                              setSelected({ course, status: "archived" })
                            }
                            type="button"
                          >
                            Archive
                          </button>
                        )}
                        {course.status === "archived" && (
                          <button
                            className="font-bold text-blue-700"
                            onClick={() =>
                              setSelected({ course, status: "draft" })
                            }
                            type="button"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            onPage={(page) => list.setParams({ ...list.params, page })}
            page={list.pagination.page}
            pages={list.pagination.pages}
          />
        </>
      ) : (
        <EmptyState message="No courses found." />
      )}
      <ConfirmationDialog
        destructive={selected?.status === "archived"}
        onClose={() => setSelected(null)}
        onConfirm={confirm}
        open={Boolean(selected)}
        processing={processing}
        title="Confirm course status change"
      >
        {selected && (
          <p>
            Change <strong>{selected.course.title}</strong> to{" "}
            <StatusBadge value={selected.status} />? Course lesson content will
            not be modified.
          </p>
        )}
      </ConfirmationDialog>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}

export default CoursesAdminPage;
