import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, ClipboardList, ExternalLink, FileText, FileVideo2, Image as ImageIcon, LoaderCircle, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";
import { useToast } from "../../contexts/toastStore.js";
import Dialog from "../common/Dialog.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import {
  emptyAssignment,
  emptyLesson,
  fieldClass,
} from "./teacherCourseOverviewConstants.js";

function toIsoOrNull(value) {
  return value ? new Date(value).toISOString() : null;
}

function toLocalDateTime(value) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

function lessonValues(lesson) {
  return {
    title: lesson.title || "",
    learningObjectives: lesson.learning_objectives || "",
    content: lesson.content || "",
    isPublished: lesson.is_published === true,
  };
}

function assignmentValues(assignment) {
  return {
    title: assignment.title || "",
    instructions: assignment.instructions || "",
    totalPoints: String(assignment.total_points ?? 100),
    dueAt: toLocalDateTime(assignment.due_at),
    isPublished: assignment.is_published === true,
    allowLateSubmissions: assignment.allow_late_submissions === true,
  };
}

export function OverviewTab({ course, busy, onSave, onChange }) {
  const toast = useToast();

  async function copyJoinCode() {
    try {
      await navigator.clipboard.writeText(course.join_code);
      toast.success("Join code copied.", { duration: 1800 });
    } catch {
      toast.error("Copy failed. Select the code and copy it manually.");
    }
  }

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-950">Course Overview</h2>
        <p className="mt-4 leading-7 text-slate-600">
          {course.description || "No course description yet."}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs font-medium text-slate-500">Category</dt>
            <dd className="mt-1 font-semibold text-slate-900">{course.category || "—"}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs font-medium text-slate-500">Difficulty</dt>
            <dd className="mt-1 font-semibold capitalize text-slate-900">{course.difficulty || "—"}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs font-medium text-slate-500">Students</dt>
            <dd className="mt-1 font-semibold text-slate-900">{course.student_count || 0}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs font-medium text-slate-500">Lessons</dt>
            <dd className="mt-1 font-semibold text-slate-900">{course.lesson_count || 0}</dd>
          </div>
        </dl>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-950">Student Enrollment</h2>
        <p className="mt-2 text-sm text-slate-600">
          Share this code with Students so they can join your course.
        </p>
        <div className="mt-5 grid gap-3">
          <code className="max-w-full break-all rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold tracking-[0.12em] text-slate-950">
            {course.join_code || "Unavailable"}
          </code>
          <button
            className="ph-action inline-flex justify-center rounded-lg border border-emerald-400 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!course.join_code}
            onClick={copyJoinCode}
            type="button"
          >
            Copy Code
          </button>
        </div>
      </article>

      <form
        className="rounded-xl border border-slate-200 bg-white p-5 xl:col-start-1"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSave(
            () =>
              api.patch(`/teacher/courses/${course.id}/settings`, {
                status: course.status,
                visibility: course.visibility,
              }),
            "Course settings updated.",
          );
        }}
      >
        <h2 className="text-base font-bold text-slate-950">Publishing Settings</h2>
        <label className="mt-4 block text-sm font-bold">
          Status
          <select
            className={fieldClass}
            onChange={(event) =>
              onChange({ ...course, status: event.target.value })
            }
            value={course.status}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="mt-4 block text-sm font-bold">
          Visibility
          <select
            className={fieldClass}
            onChange={(event) =>
              onChange({ ...course, visibility: event.target.value })
            }
            value={course.visibility}
          >
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
            <option value="public">Public</option>
          </select>
        </label>
        <p className="mt-3 text-xs text-slate-500">
          Only published public courses appear on the public page.
        </p>
        <button
          className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
          disabled={busy}
          type="submit"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}

export function ModulesTab({
  busy,
  courseId,
  items,
  module,
  setModule,
  onSave,
  lesson,
  setLesson,
  editingModule,
  setEditingModule,
  onDeleteModule,
  onDeleteLesson,
}) {
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function createModule(event) {
    event.preventDefault();
    if (!module.title.trim()) {
      setCreateError("Module title is required.");
      return;
    }
    if (await onSave(() => api.post(`/teacher/courses/${courseId}/modules`, module), "Module created successfully.")) {
      setModule({ title: "", description: "" });
      setCreating(false);
      setCreateError("");
    }
  }

  function cancelCreate() {
    setModule({ title: "", description: "" });
    setCreating(false);
    setCreateError("");
  }

  function openCreate() {
    setCreateError("");
    setCreating(true);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Modules</h2>
          <p className="mt-0.5 text-sm text-slate-600">Organize your course content into structured modules.</p>
        </div>
        <button className="ph-action inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={openCreate} type="button"><Plus aria-hidden="true" size={18} /> Add Module</button>
      </div>

      {items.length === 0 && (
        <div className="mt-6 grid min-h-[360px] place-items-center rounded-xl border border-slate-200 bg-white px-5 py-10 text-center">
          <div className="max-w-sm">
            <span className="mx-auto grid size-15 place-items-center rounded-full bg-slate-100 text-slate-400"><BookOpen aria-hidden="true" size={26} /></span>
            <h3 className="mt-5 text-lg font-bold text-slate-950">No modules yet</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">Start organizing this course by creating your first module.</p>
            <button className="ph-action mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={openCreate} type="button"><Plus aria-hidden="true" size={18} /> Create Module</button>
          </div>
        </div>
      )}
      <div className="mt-5 space-y-3">
      {items.map((item, index) => (
        <ModuleCard
          busy={busy}
          courseId={courseId}
          editingModule={editingModule}
          item={item}
          key={item.id}
          moduleNumber={index + 1}
          lesson={lesson}
          onDeleteLesson={onDeleteLesson}
          onDeleteModule={onDeleteModule}
          onSave={onSave}
          setEditingModule={setEditingModule}
          setLesson={setLesson}
        />
      ))}
      </div>
      <Dialog description="Create a new section for this course." footer={<><button className="ph-action rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={busy} onClick={cancelCreate} type="button">Cancel</button><button className="ph-action rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" disabled={busy} form="add-module" type="submit">{busy ? "Adding…" : "Add Module"}</button></>} onClose={cancelCreate} open={creating} processing={busy} title="Add Module" wide={false}>
        <form id="add-module" onSubmit={createModule}>
          <label className="block text-sm font-semibold text-slate-800">Module Title<input aria-describedby={createError ? "module-title-error" : undefined} aria-invalid={Boolean(createError)} className={fieldClass} onChange={(event) => { setModule({ ...module, title: event.target.value }); setCreateError(""); }} required value={module.title} /></label>
          {createError && <p className="mt-1 text-sm font-medium text-red-700" id="module-title-error">{createError}</p>}
          <label className="mt-4 block text-sm font-semibold text-slate-800">Description <span className="font-normal text-slate-500">(optional)</span><textarea className={`${fieldClass} min-h-25 resize-y`} onChange={(event) => setModule({ ...module, description: event.target.value })} rows="4" value={module.description} /></label>
        </form>
      </Dialog>
    </div>
  );
}

function ModuleCard({
  courseId,
  item,
  moduleNumber,
  busy,
  lesson,
  setLesson,
  editingModule,
  setEditingModule,
  onSave,
  onDeleteModule,
  onDeleteLesson,
}) {
  const [expanded, setExpanded] = useState(false);
  const [lessonDialog, setLessonDialog] = useState(null);

  async function saveModule(event) {
    event.preventDefault();
    if (
      await onSave(
        () =>
          api.put(`/teacher/modules/${item.id}`, {
            title: editingModule.title,
            description: editingModule.description,
          }),
        "Module updated successfully.",
      )
    ) {
      setEditingModule(null);
    }
  }

  async function saveLesson(event) {
    event.preventDefault();
    const values = lessonDialog?.values || emptyLesson;
    const editing = lessonDialog?.mode === "edit";
    if (
      await onSave(
        () => editing
          ? api.put(`/teacher/lessons/${lessonDialog.lessonId}`, values)
          : api.post(`/teacher/modules/${item.id}/lessons`, values),
        editing ? "Lesson updated successfully." : "Lesson created successfully.",
      )
    ) {
      setLesson({ ...lesson, [item.id]: emptyLesson });
      setLessonDialog(null);
    }
  }

  function openAddLesson() {
    setLessonDialog({ mode: "create", values: lesson[item.id] || emptyLesson });
  }

  function openEditLesson(current) {
    setLessonDialog({ mode: "edit", lessonId: current.id, values: lessonValues(current) });
  }

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {editingModule?.id === item.id ? (
        <form className="bg-slate-50 p-5" onSubmit={saveModule}>
          <h2 className="font-bold text-slate-950">Edit Module</h2>
          <input
            aria-label="Module title"
            className={fieldClass}
            onChange={(event) =>
              setEditingModule({ ...editingModule, title: event.target.value })
            }
            required
            value={editingModule.title}
          />
          <textarea
            aria-label="Module description"
            className={fieldClass}
            onChange={(event) =>
              setEditingModule({
                ...editingModule,
                description: event.target.value,
              })
            }
            rows="3"
            value={editingModule.description}
          />
          <div className="mt-3 flex gap-3">
            <button
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white"
              disabled={busy}
              type="submit"
            >
              Save
            </button>
            <button
              className="rounded-lg border px-3 py-2 text-sm font-bold"
              onClick={() => setEditingModule(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : <ModuleSummary expanded={expanded} item={item} moduleNumber={moduleNumber} onAddLesson={openAddLesson} onDelete={() => onDeleteModule(item)} onEdit={() => setEditingModule({ id: item.id, title: item.title, description: item.description || "" })} onToggle={() => setExpanded((value) => !value)} />}

      {expanded && editingModule?.id !== item.id && (
        <div className="border-t border-slate-200 px-5 py-3">
          {!item.lessons?.length ? <div className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm text-slate-600"><span>No lessons yet.</span><button className="ph-action inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 px-3 py-2 font-semibold text-emerald-800 hover:bg-emerald-50" onClick={openAddLesson} type="button"><Plus aria-hidden="true" size={16} /> Add Lesson</button></div> : item.lessons.map((current, index) => <LessonRow courseId={courseId} index={index} item={current} key={current.id} onDelete={onDeleteLesson} onEdit={() => openEditLesson(current)} />)}
        </div>
      )}

      <LessonEditorDialog busy={busy} moduleTitle={item.title} onChange={(values) => setLessonDialog((current) => ({ ...current, values }))} onClose={() => setLessonDialog(null)} onSubmit={saveLesson} state={lessonDialog} />
    </article>
  );
}

function ModuleSummary({ item, moduleNumber, expanded, onAddLesson, onDelete, onEdit, onToggle }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-500">Module {item.position ?? item.order ?? moduleNumber} · {item.lessons?.length || 0} {(item.lessons?.length || 0) === 1 ? "Lesson" : "Lessons"}</p>
        <h2 className="mt-1 text-base font-bold text-slate-950">{item.title}</h2>
        {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button className="ph-action inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100" onClick={onAddLesson} type="button"><Plus aria-hidden="true" size={16} /> Lesson</button>
        <button aria-label={`Edit ${item.title}`} className="ph-action grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-800" onClick={onEdit} type="button"><Pencil aria-hidden="true" size={17} /></button>
        <button aria-label={`Delete ${item.title}`} className="ph-action grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={onDelete} type="button"><Trash2 aria-hidden="true" size={17} /></button>
        <button aria-expanded={expanded} aria-label={`${expanded ? "Collapse" : "Expand"} ${item.title}`} className="ph-action grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-950" onClick={onToggle} type="button">{expanded ? <ChevronUp aria-hidden="true" size={18} /> : <ChevronDown aria-hidden="true" size={18} />}</button>
      </div>
    </div>
  );
}

function LessonRow({ courseId, index, item, onDelete, onEdit }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-950">Lesson {index + 1}: {item.title}</p>
          <StatusBadge value={item.is_published ? "published" : "draft"} />
        </div>
      </div>
      <div className="flex gap-3 text-xs font-bold"><button className="text-emerald-800 hover:underline" onClick={onEdit} type="button">Edit</button><Link className="text-emerald-800 hover:underline" to={`/teacher/courses/${courseId}/materials?lesson=${item.id}`}>Materials</Link><button className="text-red-700 hover:underline" onClick={() => onDelete(item)} type="button">Delete</button></div>
    </div>
  );
}

export function LessonEditorDialog({ busy, moduleTitle, onChange, onClose, onSubmit, state }) {
  const values = state?.values || emptyLesson;
  const editing = state?.mode === "edit";
  const update = (key, value) => onChange({ ...values, [key]: value });

  return (
    <Dialog description={`${editing ? "Edit" : "Add"} a lesson ${editing ? "in" : "to"} ${moduleTitle}.`} footer={<><button className="ph-action rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={busy} onClick={onClose} type="button">Cancel</button><button className="ph-action rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" disabled={busy} form="lesson-editor" type="submit">{busy ? (editing ? "Saving…" : "Adding…") : (editing ? "Save Changes" : "Add Lesson")}</button></>} onClose={onClose} open={Boolean(state)} processing={busy} title={editing ? "Edit Lesson" : "Add Lesson"}>
      <form id="lesson-editor" onSubmit={onSubmit}>
        <label className="block text-sm font-semibold text-slate-800">Lesson Title<input aria-label="Lesson title" className={fieldClass} onChange={(event) => update("title", event.target.value)} required value={values.title || ""} /></label>
        <label className="mt-4 block text-sm font-semibold text-slate-800">Learning Objectives<textarea aria-label="Learning objectives" className={`${fieldClass} min-h-30 resize-y`} onChange={(event) => update("learningObjectives", event.target.value)} placeholder="Learning objectives / description" rows="5" value={values.learningObjectives || ""} /></label>
        <label className="mt-4 block text-sm font-semibold text-slate-800">Lesson Content<textarea aria-label="Lesson content" className={`${fieldClass} min-h-55 resize-y`} onChange={(event) => update("content", event.target.value)} rows="9" value={values.content || ""} /></label>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><input checked={values.isPublished || false} onChange={(event) => update("isPublished", event.target.checked)} type="checkbox" /> Publish lesson</label>
      </form>
    </Dialog>
  );
}

export function AssignmentsTab({
  assignment,
  setAssignment,
  busy,
  courseId,
  items,
  editingAssignment,
  setEditingAssignment,
  onSave,
  onDelete,
  onLoadSubmissions,
  selectedAssignment,
  submissions,
  grades,
  setGrades,
}) {
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  function openCreate() {
    setCreateErrors({});
    setCreating(true);
  }

  function closeCreate() {
    if (busy) return;
    setAssignment(emptyAssignment);
    setCreateErrors({});
    setCreating(false);
  }

  function validationErrors(values) {
    const errors = {};
    if (!values.title.trim()) errors.title = "Assignment title is required.";
    if (!values.instructions.trim()) errors.instructions = "Instructions are required.";
    if (!values.totalPoints) errors.totalPoints = "Total points is required.";
    if (!values.dueAt) errors.dueAt = "Due date is required.";
    return errors;
  }

  function validateCreate() {
    const errors = validationErrors(assignment);
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function createAssignment(event) {
    event.preventDefault();
    if (!validateCreate()) return;
    const values = { ...assignment, dueAt: toIsoOrNull(assignment.dueAt) };
    if (await onSave(() => api.post(`/teacher/courses/${courseId}/assignments`, values), "Assignment created successfully.")) {
      setAssignment(emptyAssignment);
      setCreating(false);
      setCreateErrors({});
    }
  }

  async function saveEditAssignment(event) {
    event.preventDefault();
    if (!editingAssignment) return;
    const errors = validationErrors(editingAssignment);
    setEditErrors(errors);
    if (Object.keys(errors).length) return;
    const { id: _id, ...assignmentValuesToSave } = editingAssignment;
    const values = { ...assignmentValuesToSave, dueAt: toIsoOrNull(assignmentValuesToSave.dueAt) };
    if (await onSave(() => api.put(`/teacher/assignments/${editingAssignment.id}`, values), "Assignment updated successfully.")) {
      setEditingAssignment(null);
      setEditErrors({});
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-lg font-bold text-slate-950">Assignments</h2><p className="mt-0.5 text-sm text-slate-600">Create and manage course assignments.</p></div>
        <button className="ph-action inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={openCreate} type="button"><Plus aria-hidden="true" size={18} /> Create Assignment</button>
      </div>
      {items.length === 0 && <div className="mt-6 grid min-h-[360px] place-items-center rounded-xl border border-slate-200 bg-white px-5 py-10 text-center"><div className="max-w-sm"><span className="mx-auto grid size-15 place-items-center rounded-full bg-slate-100 text-slate-400"><ClipboardList aria-hidden="true" size={26} /></span><h3 className="mt-5 text-lg font-bold text-slate-950">No assignments yet</h3><p className="mt-1.5 text-sm leading-6 text-slate-600">Create your first assignment for students to complete.</p><button className="ph-action mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={openCreate} type="button"><Plus aria-hidden="true" size={18} /> Create Assignment</button></div></div>}
      <div className="mt-5 space-y-3">
      {items.map((item) => (
        <AssignmentCard
          item={item}
          key={item.id}
          onDelete={onDelete}
          onLoadSubmissions={onLoadSubmissions}
          setEditing={setEditingAssignment}
        />
      ))}
      </div>
      {selectedAssignment && (
        <SubmissionList
          assignment={selectedAssignment}
          busy={busy}
          grades={grades}
          onReload={() => onLoadSubmissions(selectedAssignment)}
          onSave={onSave}
          setGrades={setGrades}
          submissions={submissions}
        />
      )}
      <Dialog description="Create a new assignment for this course." footer={<><button className="ph-action rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={busy} onClick={closeCreate} type="button">Cancel</button><button className="ph-action rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" disabled={busy} form="create-assignment" type="submit">{busy ? "Creating…" : "Create Assignment"}</button></>} onClose={closeCreate} open={creating} processing={busy} title="Create Assignment" wide={false}>
        <form className="grid gap-4" id="create-assignment" onSubmit={createAssignment}>
          <AssignmentFormFields errors={createErrors} onChange={setAssignment} onClearError={(key) => setCreateErrors((current) => ({ ...current, [key]: "" }))} values={assignment} />
        </form>
      </Dialog>
      <Dialog description="Update this course assignment." footer={<><button className="ph-action rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={busy} onClick={() => { setEditingAssignment(null); setEditErrors({}); }} type="button">Cancel</button><button className="ph-action rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" disabled={busy} form="edit-assignment" type="submit">{busy ? "Saving…" : "Save Changes"}</button></>} onClose={() => { if (!busy) { setEditingAssignment(null); setEditErrors({}); } }} open={Boolean(editingAssignment)} processing={busy} size="medium" title="Edit Assignment">
        <form className="grid gap-4" id="edit-assignment" onSubmit={saveEditAssignment}>
          <AssignmentFormFields errors={editErrors} onChange={setEditingAssignment} onClearError={(key) => setEditErrors((current) => ({ ...current, [key]: "" }))} publishLabel="Published" values={editingAssignment || emptyAssignment} />
        </form>
      </Dialog>
    </div>
  );
}

function AssignmentFieldError({ children, error }) {
  return <div>{children}{error && <p className="mt-1 text-sm font-medium text-red-700">{error}</p>}</div>;
}

function AssignmentFormFields({ errors, onChange, onClearError, publishLabel = "Publish now", values }) {
  function update(key, value) {
    onChange({ ...values, [key]: value });
    onClearError(key);
  }

  return (
    <>
      <AssignmentFieldError error={errors.title}><label className="block text-sm font-semibold text-slate-800">Assignment Title<input aria-invalid={Boolean(errors.title)} className={fieldClass} onChange={(event) => update("title", event.target.value)} required value={values.title} /></label></AssignmentFieldError>
      <AssignmentFieldError error={errors.instructions}><label className="block text-sm font-semibold text-slate-800">Instructions<textarea aria-invalid={Boolean(errors.instructions)} className={`${fieldClass} min-h-28 resize-y`} onChange={(event) => update("instructions", event.target.value)} required rows="4" value={values.instructions} /></label></AssignmentFieldError>
      <div className="grid gap-4 sm:grid-cols-2"><AssignmentFieldError error={errors.totalPoints}><label className="block text-sm font-semibold text-slate-800">Total Points<input aria-invalid={Boolean(errors.totalPoints)} className={fieldClass} min="0.01" onChange={(event) => update("totalPoints", event.target.value)} required step="0.01" type="number" value={values.totalPoints} /></label></AssignmentFieldError><AssignmentFieldError error={errors.dueAt}><label className="block text-sm font-semibold text-slate-800">Due Date<input aria-invalid={Boolean(errors.dueAt)} className={fieldClass} onChange={(event) => update("dueAt", event.target.value)} required type="datetime-local" value={values.dueAt} /></label></AssignmentFieldError></div>
      <Toggle checked={values.isPublished} label={publishLabel} onChange={(value) => update("isPublished", value)} />
      <Toggle checked={values.allowLateSubmissions} label="Allow late submissions" onChange={(value) => update("allowLateSubmissions", value)} />
    </>
  );
}

function Toggle({ checked, label, onChange }) {
  return (
    <label className="mt-3 flex gap-2 text-sm font-bold">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      {label}
    </label>
  );
}

function AssignmentCard({
  item,
  setEditing,
  onDelete,
  onLoadSubmissions,
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-slate-950">{item.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.instructions || "No instructions provided."}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span>{item.total_points} points</span>
            <span>{item.due_at ? `Due ${new Date(item.due_at).toLocaleString()}` : "No due date"}</span>
            {item.allow_late_submissions && <span>Late submissions allowed</span>}
          </div>
        </div>
        <StatusBadge value={item.is_published ? "published" : "draft"} />
      </div>
      <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm font-semibold">
        <button className="text-emerald-800 hover:underline" onClick={() => onLoadSubmissions(item)} type="button">View submissions</button>
          <button
            className="text-emerald-800 hover:underline"
            onClick={() => setEditing({ id: item.id, ...assignmentValues(item) })}
            type="button"
          >
            Edit
          </button>
          <button
            className="text-red-700 hover:underline"
            onClick={() => onDelete(item)}
            type="button"
          >
            Delete
          </button>
      </div>
    </article>
  );
}

function TeacherSubmissionAttachments({ submission }) {
  const [preview, setPreview] = useState(null);
  const [loadingId, setLoadingId] = useState("");
  const [error, setError] = useState("");

  if (!submission.attachments?.length) return null;

  async function openFile(attachment) {
    setLoadingId(attachment.id);
    setError("");
    const popup = attachment.type === "image" || attachment.type === "video" ? null : window.open("about:blank", "_blank", "noopener,noreferrer");
    try {
      const response = await api.get(`/teacher/submissions/${submission.id}/attachments/${attachment.id}/access`);
      const url = response.data.data.url;
      if (attachment.type === "image" || attachment.type === "video") setPreview({ ...attachment, url });
      else if (popup) popup.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      popup?.close();
      setError(requestError.response?.data?.message || "Unable to open attachment.");
    } finally {
      setLoadingId("");
    }
  }

  return <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><PaperclipIcon /><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Student files and links</h3></div><div className="mt-3 grid gap-2">{submission.attachments.map((attachment) => <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5" key={attachment.id}>{attachment.type === "image" ? <ImageIcon aria-hidden="true" className="shrink-0 text-emerald-700" size={17} /> : attachment.type === "video" ? <FileVideo2 aria-hidden="true" className="shrink-0 text-emerald-700" size={17} /> : attachment.type === "link" ? <ExternalLink aria-hidden="true" className="shrink-0 text-emerald-700" size={17} /> : <FileText aria-hidden="true" className="shrink-0 text-emerald-700" size={17} />}<span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{attachment.type === "link" ? attachment.external_url : attachment.file_name}</span>{attachment.type === "link" ? <a className="text-xs font-bold text-emerald-800 hover:underline" href={attachment.external_url} rel="noreferrer" target="_blank">Open</a> : <button className="ph-action rounded-md bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50" disabled={loadingId === attachment.id} onClick={() => openFile(attachment)} type="button">{loadingId === attachment.id ? <LoaderCircle aria-label="Opening" className="animate-spin" size={14} /> : attachment.type === "image" ? "Preview" : attachment.type === "video" ? "View video" : "View document"}</button>}</div>)}</div>{preview?.type === "image" && <img alt={preview.file_name} className="mt-4 max-h-64 w-full rounded-lg border border-slate-200 bg-slate-100 object-contain" src={preview.url} />}{preview?.type === "video" && <video className="mt-4 max-h-64 w-full rounded-lg border border-slate-200 bg-black" controls preload="metadata" src={preview.url} />}{error && <p className="mt-2 text-xs font-semibold text-red-700" role="alert">{error}</p>}</div>;
}

function PaperclipIcon() {
  return <span aria-hidden="true" className="text-emerald-700">📎</span>;
}

function SubmissionList({
  assignment,
  busy,
  submissions,
  grades,
  setGrades,
  onSave,
  onReload,
}) {
  return (
    <section className="ph-surface rounded-2xl p-6">
      <h2 className="text-xl font-black">Submissions: {assignment.title}</h2>
      {submissions.length === 0 && (
        <p className="mt-4 text-slate-600">No submissions yet.</p>
      )}
      {submissions.map((submission) => (
        <form
          className="mt-6 grid gap-5 border-t border-slate-100 pt-6 lg:grid-cols-[1.1fr_0.9fr]"
          key={submission.id}
          onSubmit={async (event) => {
            event.preventDefault();
            const grade = grades[submission.id] || {};
            if (
              await onSave(
                () => api.put(`/teacher/submissions/${submission.id}/grade`, grade),
                "Submission graded.",
              )
            ) {
              onReload();
            }
          }}
        >
          <div className="min-w-0 rounded-xl bg-slate-50 p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Student response</h3>
            <p className="break-words font-bold">
              {[submission.student?.first_name, submission.student?.last_name]
                .filter(Boolean)
                .join(" ") ||
                submission.student?.email ||
                "Student"}
            </p>
            <p className="mt-3 break-words whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {submission.written_answer || "No written answer."}
            </p>
            <TeacherSubmissionAttachments submission={submission} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Teacher evaluation</h3>
            <div className="mt-3 grid gap-4">
              <label className="text-sm font-bold">
                Score / {assignment.total_points}
                <input
                  className={fieldClass}
                  max={assignment.total_points}
                  min="0"
                  onChange={(event) =>
                    setGrades({
                      ...grades,
                      [submission.id]: {
                        ...(grades[submission.id] || {}),
                        score: event.target.value,
                      },
                    })
                  }
                  placeholder={`0–${assignment.total_points}`}
                  required
                  step="0.01"
                  type="number"
                  value={grades[submission.id]?.score ?? submission.score ?? ""}
                />
              </label>
              <label className="text-sm font-bold">
                Feedback
                <input
                  className={fieldClass}
                  onChange={(event) =>
                    setGrades({
                      ...grades,
                      [submission.id]: {
                        ...(grades[submission.id] || {}),
                        feedback: event.target.value,
                      },
                    })
                  }
                  placeholder="Feedback"
                  value={grades[submission.id]?.feedback ?? submission.feedback ?? ""}
                />
              </label>
            </div>
            <button
              className="ph-action mt-4 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
              disabled={busy}
              type="submit"
            >
              Save grade
            </button>
          </div>
        </form>
      ))}
    </section>
  );
}

export function StudentsTab({
  busy,
  courseId,
  email,
  setEmail,
  items,
  onSave,
  onRemove,
}) {
  const toast = useToast();
  const [emailError, setEmailError] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const activeStudents = items.filter((item) => String(item.status).toLowerCase() === "active");

  function studentName(item) {
    const name = [item.student?.first_name, item.student?.last_name].filter(Boolean).join(" ");
    return name || item.student?.email || "Student";
  }

  function studentInitials(item) {
    return studentName(item).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";
  }

  async function enrollStudent(event) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setEmailError("Student email is required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setEmailError("Enter a valid PHINMA email address.");
      return;
    }
    const existingEnrollment = items.find((item) => item.student?.email?.toLowerCase() === normalizedEmail.toLowerCase());
    if (String(existingEnrollment?.status).toLowerCase() === "active") {
      toast.info("Student is already enrolled in this course.");
      return;
    }
    const successMessage = existingEnrollment ? "Student enrollment restored." : "Student enrolled successfully.";
    if (await onSave(() => api.post(`/teacher/courses/${courseId}/students`, { email: normalizedEmail }), successMessage)) {
      setEmail("");
      setEmailError("");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-bold text-slate-950">Students</h2><p className="mt-0.5 text-sm text-slate-600">Manage Students enrolled in this course.</p></div>
        <p className="pt-1 text-sm font-medium text-slate-700">{activeStudents.length} enrolled</p>
      </div>

      <form className="rounded-xl border border-slate-200 bg-slate-50/70 p-5" noValidate onSubmit={enrollStudent}>
        <h3 className="text-base font-bold text-slate-950">Enroll a Student</h3>
        <p className="mt-1 text-sm text-slate-600">Use an active Student account&apos;s PHINMA email.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="student-enrollment-email">Student PHINMA email</label>
            <input aria-describedby={emailError ? "student-enrollment-email-error" : undefined} aria-invalid={Boolean(emailError)} className={`${fieldClass} mt-0 ${emailError ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}`} id="student-enrollment-email" onChange={(event) => { setEmail(event.target.value); setEmailError(""); }} placeholder="student@phinmaed.com" type="email" value={email} />
            {emailError && <p className="mt-1.5 text-sm font-medium text-red-700" id="student-enrollment-email-error" role="alert">{emailError}</p>}
          </div>
          <button className="ph-action inline-flex shrink-0 justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy} type="submit">{busy ? "Enrolling…" : "Enroll"}</button>
        </div>
      </form>

      {activeStudents.length === 0 ? (
        <div className="grid min-h-[250px] place-items-center rounded-xl border border-slate-200 bg-white px-5 py-10 text-center">
          <div className="max-w-sm"><span className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-slate-400"><Users aria-hidden="true" size={25} /></span><h3 className="mt-4 text-lg font-bold text-slate-950">No Students enrolled yet</h3><p className="mt-1.5 text-sm leading-6 text-slate-600">Share the course join code or enroll a Student using their PHINMA email.</p></div>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600"><tr><th className="px-5 py-3.5">Student</th><th className="px-5 py-3.5">Email</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {activeStudents.map((item) => <tr key={item.id}><td className="px-5 py-3.5"><div className="flex items-center gap-3"><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">{studentInitials(item)}</span><span className="font-semibold text-slate-950">{studentName(item)}</span></div></td><td className="max-w-[320px] px-5 py-3.5 text-sm text-slate-600"><span className="block truncate" title={item.student?.email || ""}>{item.student?.email || "No email available"}</span></td><td className="px-5 py-3.5"><StatusBadge value={item.status} /></td><td className="px-5 py-3.5 text-right"><button aria-label={`Remove ${studentName(item)} from this course`} className="ph-action text-sm font-bold text-red-700 hover:underline" onClick={() => setRemoveTarget(item)} type="button">Remove</button></td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {activeStudents.map((item) => <article className="rounded-xl border border-slate-200 bg-white p-4" key={item.id}><div className="flex items-start gap-3"><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">{studentInitials(item)}</span><div className="min-w-0"><h3 className="font-semibold text-slate-950">{studentName(item)}</h3><p className="mt-1 break-words text-sm text-slate-600">{item.student?.email || "No email available"}</p><div className="mt-3"><StatusBadge value={item.status} /></div></div></div><button aria-label={`Remove ${studentName(item)} from this course`} className="ph-action mt-4 text-sm font-bold text-red-700 hover:underline" onClick={() => setRemoveTarget(item)} type="button">Remove</button></article>)}
          </div>
        </>
      )}
      <Dialog description={removeTarget ? `Remove ${studentName(removeTarget)} from this course? Their account and learning history will be preserved.` : undefined} footer={<><button className="ph-action rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={busy} onClick={() => setRemoveTarget(null)} type="button">Cancel</button><button className="ph-action rounded-lg bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800" disabled={busy} onClick={async () => { if (removeTarget && await onRemove(removeTarget)) setRemoveTarget(null); }} type="button">{busy ? "Removing…" : "Remove Student"}</button></>} onClose={() => { if (!busy) setRemoveTarget(null); }} open={Boolean(removeTarget)} processing={busy} title="Remove Student?" wide={false}>
        <p className="text-sm leading-6 text-slate-700">This removes only the course enrollment. The Student&apos;s account, submissions, grades, and lesson history remain intact.</p>
      </Dialog>
    </div>
  );
}
