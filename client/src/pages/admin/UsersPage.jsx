import { UserPlus, X } from "lucide-react";
import { useState } from "react";
import StudentRegistrationForm from "../../components/auth/StudentRegistrationForm.jsx";
import TeacherRegistrationForm from "../../components/auth/TeacherRegistrationForm.jsx";
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

const emptyInvitation = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  studentId: "",
  employeeId: "",
  campus: "",
  program: "",
  yearLevel: "",
  section: "",
  department: "",
  position: "",
};

function InvitationDialog({ onClose, onInvited, open }) {
  const [role, setRole] = useState("student");
  const [values, setValues] = useState(emptyInvitation);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  function updateValue(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function details() {
    return role === "student"
      ? {
          studentId: values.studentId,
          campus: values.campus,
          program: values.program,
          yearLevel: values.yearLevel,
          section: values.section,
        }
      : {
          employeeId: values.employeeId,
          campus: values.campus,
          department: values.department,
          position: values.position,
        };
  }

  function validate() {
    const next = {};
    for (const field of ["firstName", "lastName", "email", "campus"]) {
      if (!values[field]?.trim()) next[field] = "This field is required.";
    }
    const roleFields =
      role === "student"
        ? ["studentId", "program", "yearLevel", "section"]
        : ["employeeId", "department"];
    for (const field of roleFields) {
      if (!values[field]?.trim()) next[field] = "This field is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function sendInvitation(event) {
    event.preventDefault();
    if (!validate()) return;
    setSending(true);
    setError("");
    try {
      const result = await adminApi.create("users/invite", {
        email: values.email,
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        role,
        details: details(),
      });
      onInvited(result.data.message);
      setValues(emptyInvitation);
      onClose();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Invitation could not be sent.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 p-4">
      <section
        aria-modal="true"
        className="mx-auto my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Invite a school user</h2>
            <p className="mt-1 text-sm text-slate-600">
              The user will receive a secure link to create their password.
            </p>
          </div>
          <button aria-label="Close invitation" onClick={onClose} type="button">
            <X />
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={sendInvitation}>
          <label className="block text-sm font-bold text-slate-700">
            Account role
            <select
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              onChange={(event) => {
                setRole(event.target.value);
                setErrors({});
              }}
              value={role}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </label>
          {role === "student" ? (
            <StudentRegistrationForm
              errors={errors}
              googleLocked={false}
              hidePassword
              onChange={updateValue}
              values={values}
            />
          ) : (
            <TeacherRegistrationForm
              errors={errors}
              googleLocked={false}
              hidePassword
              onChange={updateValue}
              values={values}
            />
          )}
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              className="rounded-xl border border-slate-300 px-4 py-2.5 font-bold"
              disabled={sending}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white disabled:opacity-60"
              disabled={sending}
              type="submit"
            >
              {sending ? "Sending invitation..." : "Send invitation"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function UsersPage({ presetRole = "" }) {
  const list = useAdminList("users", {
    page: 1,
    limit: 20,
    ...(presetRole ? { role: presetRole } : {}),
  });
  const [search, setSearch] = useState("");
  const [campus, setCampus] = useState("");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [processing, setProcessing] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const title = presetRole
    ? `${presetRole[0].toUpperCase()}${presetRole.slice(1)}s`
    : "User Management";

  async function confirm() {
    setProcessing(true);
    try {
      await adminApi.patch("users", selected.user.id, "status", {
        status: selected.status,
      });
      setToast(`User ${selected.status}.`);
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
        action={
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white"
            onClick={() => setInviteOpen(true)}
            type="button"
          >
            <UserPlus size={18} /> Invite user
          </button>
        }
        description="View accounts and safely manage access status. Permanent deletion is not available."
        title={title}
      />
      <SearchFilters
        onSearch={() =>
          list.setParams({
            ...list.params,
            page: 1,
            search,
            campus: campus || undefined,
          })
        }
        search={search}
        setSearch={setSearch}
      >
        {!presetRole && (
          <select
            aria-label="Role filter"
            className="rounded-xl border px-3"
            onChange={(event) =>
              list.setParams({
                ...list.params,
                page: 1,
                role: event.target.value || undefined,
              })
            }
          >
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
        )}
        <select
          aria-label="Status filter"
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
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          aria-label="Campus filter"
          className="rounded-xl border px-3"
          onChange={(event) => setCampus(event.target.value)}
          placeholder="Campus"
          value={campus}
        />
        <select
          aria-label="Sort users"
          className="rounded-xl border px-3"
          onChange={(event) =>
            list.setParams({ ...list.params, sort: event.target.value })
          }
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
        </select>
      </SearchFilters>
      {list.loading ? (
        <LoadingSkeleton />
      ) : list.error ? (
        <ErrorState onRetry={list.load} />
      ) : list.data.length ? (
        <>
          <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {[
                    "User",
                    "Email",
                    "Approved role",
                    "Campus",
                    "Status",
                    "Joined",
                    "Actions",
                  ].map((heading) => (
                    <th className="px-4 py-3" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.data.map((user) => (
                  <tr className="border-t" key={user.id}>
                    <td className="px-4 py-4 font-bold">{fullName(user)}</td>
                    <td className="px-4">{user.email}</td>
                    <td className="px-4">
                      <StatusBadge value={user.approved_role} />
                    </td>
                    <td className="px-4">{user.role_details?.campus || "—"}</td>
                    <td className="px-4">
                      <StatusBadge value={user.account_status} />
                    </td>
                    <td className="px-4">{formatDate(user.created_at)}</td>
                    <td className="px-4">
                      <div className="flex gap-3">
                        <button
                          className="font-bold"
                          onClick={() =>
                            setToast(`${fullName(user)} · ${user.email}`)
                          }
                          type="button"
                        >
                          View
                        </button>
                        {user.account_status === "suspended" ? (
                          <button
                            className="font-bold text-emerald-700"
                            onClick={() =>
                              setSelected({ user, status: "active" })
                            }
                            type="button"
                          >
                            Restore
                          </button>
                        ) : (
                          user.account_status !== "pending" && (
                            <button
                              className="font-bold text-red-700"
                              onClick={() =>
                                setSelected({ user, status: "suspended" })
                              }
                              type="button"
                            >
                              Suspend
                            </button>
                          )
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
        <EmptyState message="No users match these filters." />
      )}
      <ConfirmationDialog
        confirmLabel={
          selected?.status === "suspended" ? "Suspend user" : "Activate user"
        }
        destructive={selected?.status === "suspended"}
        onClose={() => setSelected(null)}
        onConfirm={confirm}
        open={Boolean(selected)}
        processing={processing}
        title="Confirm account status change"
      >
        {selected && (
          <p>
            Change <strong>{fullName(selected.user)}</strong> to{" "}
            <StatusBadge value={selected.status} />? Their database-approved
            role will not be changed.
          </p>
        )}
      </ConfirmationDialog>
      <Toast message={toast} onClose={() => setToast("")} />
      <InvitationDialog
        onClose={() => setInviteOpen(false)}
        onInvited={(message) => {
          setToast(message);
          list.load();
        }}
        open={inviteOpen}
      />
    </>
  );
}

export default UsersPage;
