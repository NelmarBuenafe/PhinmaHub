import { Plus, RefreshCw } from "lucide-react";
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

function Field({ label, ...props }) {
  return (
    <label className="block font-bold">
      {label}
      <input
        {...props}
        className="mt-1 w-full rounded-xl border p-3 font-normal"
      />
    </label>
  );
}
function ResourceShell({
  allowEmpty = true,
  children,
  description,
  resource,
  title,
}) {
  const list = useAdminList(resource, { page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  return (
    <>
      <PageHeader
        action={
          <button
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 font-bold"
            onClick={list.load}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        }
        description={description}
        title={title}
      />
      <SearchFilters
        onSearch={() => list.setParams({ ...list.params, page: 1, search })}
        search={search}
        setSearch={setSearch}
      />
      {list.loading ? (
        <LoadingSkeleton />
      ) : list.error ? (
        <ErrorState onRetry={list.load} />
      ) : list.data.length > 0 || allowEmpty ? (
        children(list)
      ) : (
        <EmptyState message={`No ${title.toLowerCase()} found.`} />
      )}
    </>
  );
}

export function CategoriesPage() {
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState("");
  const [processing, setProcessing] = useState(false);
  const values = form?.values || {
    name: "",
    description: "",
    color: "emerald",
    icon: "book",
    isActive: true,
  };
  async function save(load) {
    setProcessing(true);
    try {
      if (form?.item)
        await adminApi.patch("categories", form.item.id, "", values);
      else await adminApi.create("categories", values);
      setToast("Category saved.");
      setForm(null);
      load();
    } catch (e) {
      setToast(e.response?.data?.message || "Unable to save category.");
    } finally {
      setProcessing(false);
    }
  }
  return (
    <ResourceShell
      description="Create and maintain reusable course categories."
      resource="categories"
      title="Categories"
    >
      {({ data, load, pagination, params, setParams }) => (
        <>
          <button
            className="mb-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white"
            onClick={() =>
              setForm({
                values: {
                  name: "",
                  description: "",
                  color: "emerald",
                  icon: "book",
                  isActive: true,
                },
              })
            }
          >
            <Plus size={17} />
            Add Category
          </button>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((item) => (
              <article
                className="rounded-2xl border bg-white p-5"
                key={item.id}
              >
                <div className="flex justify-between">
                  <h3 className="font-black">{item.name}</h3>
                  <StatusBadge value={item.is_active ? "active" : "archived"} />
                </div>
                <p className="mt-2 min-h-12 text-sm text-slate-600">
                  {item.description || "No description."}
                </p>
                <button
                  className="mt-4 font-bold text-emerald-700"
                  onClick={() =>
                    setForm({
                      item,
                      values: {
                        name: item.name,
                        description: item.description || "",
                        color: item.color || "",
                        icon: item.icon || "",
                        isActive: item.is_active,
                      },
                    })
                  }
                >
                  Edit
                </button>
              </article>
            ))}
          </div>
          <Pagination
            onPage={(page) => setParams({ ...params, page })}
            page={pagination.page}
            pages={pagination.pages}
          />
          <ConfirmationDialog
            confirmLabel="Save category"
            onClose={() => setForm(null)}
            onConfirm={() => save(load)}
            open={Boolean(form)}
            processing={processing}
            title={form?.item ? "Edit category" : "Add category"}
          >
            {form && (
              <div className="space-y-3">
                <Field
                  label="Category name"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      values: { ...values, name: e.target.value },
                    })
                  }
                  required
                  value={values.name}
                />
                <Field
                  label="Description"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      values: { ...values, description: e.target.value },
                    })
                  }
                  value={values.description}
                />
                <Field
                  label="Color"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      values: { ...values, color: e.target.value },
                    })
                  }
                  value={values.color}
                />
                <Field
                  label="Icon"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      values: { ...values, icon: e.target.value },
                    })
                  }
                  value={values.icon}
                />
                <label className="flex gap-2">
                  <input
                    checked={values.isActive}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        values: { ...values, isActive: e.target.checked },
                      })
                    }
                    type="checkbox"
                  />
                  Active
                </label>
              </div>
            )}
          </ConfirmationDialog>
          <Toast message={toast} onClose={() => setToast("")} />
        </>
      )}
    </ResourceShell>
  );
}

export function AnnouncementsPage() {
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState("");
  const [processing, setProcessing] = useState(false);
  async function save(load) {
    setProcessing(true);
    try {
      await adminApi.create("announcements", form);
      setToast(form.publishNow ? "Announcement published." : "Draft saved.");
      setForm(null);
      load();
    } catch (e) {
      setToast(e.response?.data?.message || "Unable to create announcement.");
    } finally {
      setProcessing(false);
    }
  }
  return (
    <ResourceShell
      description="Create targeted platform updates and save drafts safely."
      resource="announcements"
      title="Announcements"
    >
      {({ data, load, pagination, params, setParams }) => (
        <>
          <button
            className="mb-4 rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white"
            onClick={() =>
              setForm({
                title: "",
                message: "",
                audience: "all",
                courseId: null,
                publishNow: false,
              })
            }
          >
            Create Announcement
          </button>
          <div className="space-y-3">
            {data.map((item) => (
              <article
                className="rounded-2xl border bg-white p-5"
                key={item.id}
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-black">{item.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {item.body}
                    </p>
                  </div>
                  <div>
                    <StatusBadge
                      value={item.published_at ? "published" : "draft"}
                    />
                    <p className="mt-2 text-xs">Audience: {item.audience}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pagination
            onPage={(page) => setParams({ ...params, page })}
            page={pagination.page}
            pages={pagination.pages}
          />
          <ConfirmationDialog
            confirmLabel={form?.publishNow ? "Publish" : "Save draft"}
            onClose={() => setForm(null)}
            onConfirm={() => save(load)}
            open={Boolean(form)}
            processing={processing}
            title="Preview announcement"
          >
            {form && (
              <div className="space-y-3">
                <Field
                  label="Title"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  value={form.title}
                />
                <label className="block font-bold">
                  Message
                  <textarea
                    className="mt-1 w-full rounded-xl border p-3 font-normal"
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    required
                    rows="4"
                    value={form.message}
                  />
                </label>
                <label className="block font-bold">
                  Audience
                  <select
                    className="mt-1 w-full rounded-xl border p-3 font-normal"
                    onChange={(e) =>
                      setForm({ ...form, audience: e.target.value })
                    }
                    value={form.audience}
                  >
                    {["all", "teachers", "students"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="flex gap-2">
                  <input
                    checked={form.publishNow}
                    onChange={(e) =>
                      setForm({ ...form, publishNow: e.target.checked })
                    }
                    type="checkbox"
                  />
                  Publish now
                </label>
                <div className="rounded-xl bg-slate-50 p-3">
                  <strong>Preview:</strong>
                  <p className="mt-1">{form.title || "Untitled"}</p>
                  <p className="text-sm">{form.message || "No message yet."}</p>
                </div>
              </div>
            )}
          </ConfirmationDialog>
          <Toast message={toast} onClose={() => setToast("")} />
        </>
      )}
    </ResourceShell>
  );
}

export function StudyToolsPage() {
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState("");
  const [processing, setProcessing] = useState(false);
  async function save(load) {
    setProcessing(true);
    try {
      if (form.item)
        await adminApi.patch("study-tools", form.item.id, "", form.values);
      else await adminApi.create("study-tools", form.values);
      setToast("Study tool saved.");
      setForm(null);
      load();
    } catch (e) {
      setToast(e.response?.data?.message || "Unable to save tool.");
    } finally {
      setProcessing(false);
    }
  }
  return (
    <ResourceShell
      description="Manage trusted learning references and coding resources."
      resource="study-tools"
      title="Study Tools"
    >
      {({ data, load, pagination, params, setParams }) => (
        <>
          <button
            className="mb-4 rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white"
            onClick={() =>
              setForm({
                values: {
                  title: "",
                  description: "",
                  toolType: "reference",
                  url: "",
                  isActive: true,
                },
              })
            }
          >
            Add Study Tool
          </button>
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Title", "Type", "URL", "Status", "Creator", "Actions"].map(
                    (h) => (
                      <th className="px-4 py-3" key={h}>
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr className="border-t" key={item.id}>
                    <td className="px-4 py-4 font-bold">{item.title}</td>
                    <td className="px-4">{item.tool_type}</td>
                    <td className="max-w-52 truncate px-4">{item.url}</td>
                    <td className="px-4">
                      <StatusBadge
                        value={item.is_active ? "active" : "archived"}
                      />
                    </td>
                    <td className="px-4 text-xs">{item.creator_id}</td>
                    <td className="px-4">
                      <button
                        className="font-bold text-emerald-700"
                        onClick={() =>
                          setForm({
                            item,
                            values: {
                              title: item.title,
                              description: item.description || "",
                              toolType: item.tool_type,
                              url: item.url,
                              isActive: item.is_active,
                            },
                          })
                        }
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            onPage={(page) => setParams({ ...params, page })}
            page={pagination.page}
            pages={pagination.pages}
          />
          <ConfirmationDialog
            confirmLabel="Save tool"
            onClose={() => setForm(null)}
            onConfirm={() => save(load)}
            open={Boolean(form)}
            processing={processing}
            title="Study tool"
          >
            {form && (
              <div className="space-y-3">
                {["title", "description", "toolType", "url"].map((key) => (
                  <Field
                    key={key}
                    label={key.replace(/([A-Z])/g, " $1")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        values: { ...form.values, [key]: e.target.value },
                      })
                    }
                    required={key !== "description"}
                    type={key === "url" ? "url" : "text"}
                    value={form.values[key]}
                  />
                ))}
              </div>
            )}
          </ConfirmationDialog>
          <Toast message={toast} onClose={() => setToast("")} />
        </>
      )}
    </ResourceShell>
  );
}

export function MessagesPage() {
  const [toast, setToast] = useState("");
  async function status(id, value, load) {
    try {
      await adminApi.patch("messages", id, "status", { status: value });
      setToast(`Message marked ${value.replace("_", " ")}.`);
      load();
    } catch (e) {
      setToast(e.response?.data?.message || "Unable to update message.");
    }
  }
  return (
    <ResourceShell
      description="Private messages submitted through the public contact form."
      resource="messages"
      title="Contact Messages"
    >
      {({ data, load, pagination, params, setParams }) => (
        <>
          <div className="space-y-3">
            {data.map((item) => (
              <article
                className="rounded-2xl border bg-white p-5"
                key={item.id}
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-black">{item.subject}</h3>
                    <p className="text-sm text-slate-500">
                      {item.sender_name} · {item.sender_email}
                    </p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                  {item.message}
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    className="font-bold"
                    onClick={() => setToast(item.message)}
                  >
                    Open
                  </button>
                  <button
                    className="font-bold text-blue-700"
                    onClick={() => status(item.id, "in_progress", load)}
                  >
                    Mark as read
                  </button>
                  <button
                    className="font-bold text-emerald-700"
                    onClick={() => status(item.id, "resolved", load)}
                  >
                    Resolve
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
          <Toast message={toast} onClose={() => setToast("")} />
        </>
      )}
    </ResourceShell>
  );
}

export function AuditLogsPage() {
  return (
    <ResourceShell
      description="Read-only record of important administrative actions."
      resource="audit-logs"
      title="Audit Logs"
    >
      {({ data, pagination, params, setParams }) => (
        <>
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Timestamp",
                    "Actor",
                    "Action",
                    "Entity type",
                    "Entity",
                    "Details",
                  ].map((h) => (
                    <th className="px-4 py-3" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr className="border-t" key={item.id}>
                    <td className="px-4 py-4">{formatDate(item.created_at)}</td>
                    <td className="px-4 text-xs">
                      {item.actor_id || "System"}
                    </td>
                    <td className="px-4 font-bold">{item.action}</td>
                    <td className="px-4">{item.entity_type}</td>
                    <td className="px-4 text-xs">{item.entity_id || "—"}</td>
                    <td className="max-w-64 truncate px-4">
                      {Object.keys(item.metadata || {}).length
                        ? JSON.stringify(item.metadata)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            onPage={(page) => setParams({ ...params, page })}
            page={pagination.page}
            pages={pagination.pages}
          />
        </>
      )}
    </ResourceShell>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader
        description="Safe profile and interface preferences only. Secrets and database credentials are never shown here."
        title="Settings"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6">
          <h3 className="font-black">Admin profile</h3>
          <p className="mt-3 text-sm text-slate-600">
            Profile identity and approved role are managed from the secured
            database.
          </p>
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h3 className="font-black">Interface preferences</h3>
          <label className="mt-4 flex gap-3 text-sm">
            <input type="checkbox" />
            Receive in-app approval reminders
          </label>
          <p className="mt-3 text-xs text-slate-500">
            Preference persistence will be connected when a supported settings
            table is added.
          </p>
        </section>
      </div>
    </>
  );
}
