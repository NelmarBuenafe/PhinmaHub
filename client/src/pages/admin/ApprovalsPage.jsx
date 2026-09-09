import { Eye, RefreshCw, X } from "lucide-react";
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
import { formatDate, fullName } from "../../utils/admin.js";
import { useAdminList } from "../../utils/useAdminList.js";

function Details({ application, onClose }) {
  if (!application) return null;
  const d = application.role_details || {};
  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-slate-950/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        aria-modal="true"
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <div className="flex justify-between">
          <h2 className="text-xl font-black">Application details</h2>
          <button aria-label="Close details" onClick={onClose} type="button">
            <X />
          </button>
        </div>
        <div className="mt-6 flex items-center gap-4">
          {application.avatar_url ? (
            <img
              alt={`${fullName(application)} profile`}
              className="size-16 rounded-full object-cover"
              src={application.avatar_url}
            />
          ) : (
            <span className="grid size-16 place-items-center rounded-full bg-emerald-100 text-xl font-black text-emerald-800">
              {fullName(application)[0]}
            </span>
          )}
          <div>
            <h3 className="text-lg font-black">{fullName(application)}</h3>
            <p className="text-sm text-slate-500">{application.email}</p>
            <StatusBadge value={application.requested_role} />
          </div>
        </div>
        <dl className="mt-7 grid grid-cols-2 gap-4 text-sm">
          {[
            ["Campus", d.campus],
            ["Registration date", formatDate(application.created_at)],
            ["ID number", d.student_id || d.employee_id],
            ["Program / Department", d.program || d.department],
            ["Year level", d.year_level],
            ["Section", d.section],
            ["Position", d.position],
          ]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div className="rounded-xl bg-slate-50 p-4" key={label}>
                <dt className="text-xs font-bold uppercase text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 font-bold">{value}</dd>
              </div>
            ))}
        </dl>
      </aside>
    </div>
  );
}

function ApprovalsPage() {
  const { data, error, load, loading, pagination, params, setParams } =
    useAdminList("applications", { page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [campus, setCampus] = useState("");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState("");
  async function confirm() {
    if (dialog.type === "reject" && !reason.trim()) {
      setToast("Enter a rejection reason.");
      return;
    }
    setProcessing(true);
    try {
      const result = await adminApi.patch("applications", dialog.item.id, "", {
        decision: dialog.type,
        reason: dialog.type === "reject" ? reason : undefined,
      });
      setToast(result.data.message);
      setDialog(null);
      setReason("");
      load();
    } catch (e) {
      setToast(e.response?.data?.message || "Action failed.");
    } finally {
      setProcessing(false);
    }
  }
  return (
    <>
      <PageHeader
        action={
          <button
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 font-bold"
            onClick={load}
            type="button"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        }
        description="Review Student and Teacher account applications. Every decision is recorded."
        title="Account Approvals"
      />
      <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-bold text-yellow-900">
        {pagination.total} pending application
        {pagination.total === 1 ? "" : "s"}
      </div>
      <SearchFilters
        onSearch={() =>
          setParams({
            ...params,
            page: 1,
            search,
            role: role || undefined,
            campus: campus || undefined,
            date: date || undefined,
          })
        }
        search={search}
        setSearch={setSearch}
      >
        <select
          aria-label="Requested role"
          className="rounded-xl border px-3"
          onChange={(e) => setRole(e.target.value)}
          value={role}
        >
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <input
          aria-label="Campus filter"
          className="rounded-xl border px-3"
          onChange={(e) => setCampus(e.target.value)}
          placeholder="Campus filter"
          value={campus}
        />
        <input
          aria-label="Submitted after"
          className="rounded-xl border px-3"
          onChange={(e) => setDate(e.target.value)}
          type="date"
          value={date}
        />
        <select
          aria-label="Sort applications"
          className="rounded-xl border px-3"
          onChange={(e) => setParams({ ...params, sort: e.target.value })}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </SearchFilters>
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : data.length ? (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border bg-white shadow-sm md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {[
                    "Applicant",
                    "Email",
                    "Role",
                    "ID number",
                    "Campus",
                    "Program / department",
                    "Submitted",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th className="px-4 py-3" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((a) => {
                  const d = a.role_details || {};
                  return (
                    <tr className="border-t" key={a.id}>
                      <td className="px-4 py-4 font-bold">{fullName(a)}</td>
                      <td className="px-4">{a.email}</td>
                      <td className="px-4">
                        <StatusBadge value={a.requested_role} />
                      </td>
                      <td className="px-4">
                        {d.student_id || d.employee_id || "—"}
                      </td>
                      <td className="px-4">{d.campus || "—"}</td>
                      <td className="px-4">
                        {d.program || d.department || "—"}
                      </td>
                      <td className="px-4">{formatDate(a.created_at)}</td>
                      <td className="px-4">
                        <StatusBadge value={a.account_status} />
                      </td>
                      <td className="px-4">
                        <div className="flex gap-2">
                          <button
                            aria-label={`View ${fullName(a)}`}
                            onClick={() => setSelected(a)}
                            type="button"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="font-bold text-emerald-700"
                            onClick={() =>
                              setDialog({ type: "approve", item: a })
                            }
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="font-bold text-red-700"
                            onClick={() =>
                              setDialog({ type: "reject", item: a })
                            }
                            type="button"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 md:hidden">
            {data.map((a) => (
              <article className="rounded-2xl border bg-white p-5" key={a.id}>
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-black">{fullName(a)}</h3>
                    <p className="text-sm text-slate-500">{a.email}</p>
                  </div>
                  <StatusBadge value={a.requested_role} />
                </div>
                <p className="mt-4 text-sm">
                  {a.role_details?.campus || "Campus unavailable"} ·{" "}
                  {formatDate(a.created_at)}
                </p>
                <div className="mt-4 flex gap-3">
                  <button className="font-bold" onClick={() => setSelected(a)}>
                    View
                  </button>
                  <button
                    className="font-bold text-emerald-700"
                    onClick={() => setDialog({ type: "approve", item: a })}
                  >
                    Approve
                  </button>
                  <button
                    className="font-bold text-red-700"
                    onClick={() => setDialog({ type: "reject", item: a })}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
          <Pagination
            onPage={(page) => setParams({ ...params, page })}
            page={pagination.page}
            pages={pagination.pages}
          />
        </>
      ) : (
        <EmptyState message="No pending applications." />
      )}
      <Details application={selected} onClose={() => setSelected(null)} />
      <ConfirmationDialog
        confirmLabel={
          dialog?.type === "approve" ? "Approve account" : "Reject application"
        }
        destructive={dialog?.type === "reject"}
        onClose={() => setDialog(null)}
        onConfirm={confirm}
        open={Boolean(dialog)}
        processing={processing}
        title={
          dialog?.type === "approve"
            ? "Approve application?"
            : "Reject application?"
        }
      >
        {dialog && (
          <>
            <p>
              <strong>{fullName(dialog.item)}</strong> requested the{" "}
              <strong className="capitalize">
                {dialog.item.requested_role}
              </strong>{" "}
              role.
            </p>
            {dialog.type === "reject" && (
              <label className="mt-4 block font-bold">
                Rejection reason
                <textarea
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                  maxLength="500"
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows="3"
                  value={reason}
                />
              </label>
            )}
          </>
        )}
      </ConfirmationDialog>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
export default ApprovalsPage;
