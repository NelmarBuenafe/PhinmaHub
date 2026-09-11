import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import TeacherAnnouncementsPanel from "../../components/teacher/TeacherAnnouncementsPanel.jsx";
import TeacherNav from "../../components/teacher/TeacherNav.jsx";
import api from "../../services/api.js";

const tabs = ["Overview", "Modules", "Assignments", "Students", "Announcements"];
const fieldClass = "mt-1 w-full rounded-xl border border-slate-300 px-3 py-2";
const emptyLesson = {
  title: "",
  learningObjectives: "",
  content: "",
  isPublished: false,
};
const emptyAssignment = {
  title: "",
  instructions: "",
  totalPoints: "100",
  dueAt: "",
  isPublished: false,
  allowLateSubmissions: false,
};

function Alert({ children, error = false }) {
  if (!children) return null;
  return (
    <p
      className={`mt-4 rounded-xl border p-3 text-sm ${
        error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {children}
    </p>
  );
}

function confirmAction(title, message) {
  return window.confirm(`${title}\n\n${message}`);
}

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

export default function TeacherCourseOverviewPage() {
  const { courseId } = useParams();
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.success || "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [module, setModule] = useState({ title: "", description: "" });
  const [lesson, setLesson] = useState({});
  const [assignment, setAssignment] = useState(emptyAssignment);
  const [email, setEmail] = useState("");
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [grades, setGrades] = useState({});

  const loadCourse = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/teacher/courses/${courseId}`);
      setCourse(response.data.data);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Course details could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const loadTab = useCallback(async () => {
    if (tab === "Overview" || tab === "Announcements") return;
    const endpoint =
      tab === "Modules" ? "modules" : tab === "Assignments" ? "assignments" : "students";
    try {
      const response = await api.get(`/teacher/courses/${courseId}/${endpoint}`);
      setItems(response.data.data || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          `Unable to load ${tab.toLowerCase()}.`,
      );
    }
  }, [courseId, tab]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    if (course) loadTab();
  }, [course, loadTab]);

  async function save(action, message) {
    setBusy(true);
    setError("");
    try {
      await action();
      setNotice(message);
      await Promise.all([loadCourse(), loadTab()]);
      return true;
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "The change could not be saved.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function loadSubmissions(assignmentItem) {
    try {
      const response = await api.get(
        `/teacher/assignments/${assignmentItem.id}/submissions`,
      );
      setSelectedAssignment(assignmentItem);
      setSubmissions(response.data.data || []);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load submissions.",
      );
    }
  }

  async function deleteModule(item) {
    const count = item.lessons?.length || 0;
    if (
      !confirmAction(
        "Delete Module?",
        `This module contains ${count} lesson${count === 1 ? "" : "s"}. Deleting it may also remove its lessons, materials, and progress. This action cannot be undone.`,
      )
    ) return;
    await save(
      () => api.delete(`/teacher/modules/${item.id}`),
      "Module deleted.",
    );
  }

  async function deleteLesson(item) {
    if (
      !confirmAction(
        "Delete Lesson?",
        "Students may already have progress associated with this lesson. Deleting it also removes related materials and affects progress calculations.",
      )
    ) return;
    await save(
      () => api.delete(`/teacher/lessons/${item.id}`),
      "Lesson deleted.",
    );
  }

  async function deleteAssignment(item) {
    if (
      !confirmAction(
        "Delete Assignment?",
        "Assignments with Student submissions cannot be deleted. Continue only if this assignment has no submissions.",
      )
    ) return;
    await save(
      () => api.delete(`/teacher/assignments/${item.id}`),
      "Assignment deleted.",
    );
  }

  async function removeStudent(item) {
    if (
      !confirmAction(
        "Remove Student from Course?",
        "The Student account and history will be preserved, but the Student will lose active access to this course.",
      )
    ) return;
    await save(
      () => api.delete(`/teacher/courses/${courseId}/students/${item.id}`),
      "Student removed from course.",
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <TeacherNav />
        <div className="p-10">
<Loading label="Loading course..." />
</div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-slate-50">
        <TeacherNav />
        <div className="mx-auto max-w-5xl p-10">
          <Alert error>{error}</Alert>
          <button
            className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white"
            onClick={loadCourse}
            type="button"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <TeacherNav />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link className="text-sm font-bold text-emerald-800" to="/teacher/courses">
          â† Back to My Courses
        </Link>
        <p className="mt-7 text-sm font-bold uppercase tracking-wider text-emerald-700">
          Manage Course
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {course.course_code} Â· {course.title}
        </h1>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                className={`rounded-t-xl px-4 py-3 text-sm font-bold ${
                  tab === item
                    ? "bg-emerald-700 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                key={item}
                onClick={() => {
                  setTab(item);
                  setError("");
                }}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <Link
            className="mb-2 text-sm font-bold text-emerald-800 hover:underline"
            to={`/teacher/courses/${courseId}/materials`}
          >
            Manage lesson materials
          </Link>
        </div>

        <Alert>{notice}</Alert>
        <Alert error>{error}</Alert>
        {tab === "Overview" && (
          <OverviewTab course={course} busy={busy} onSave={save} onChange={setCourse} />
        )}
        {tab === "Announcements" && <TeacherAnnouncementsPanel courseId={courseId} />}
        {tab === "Modules" && (
          <ModulesTab
            busy={busy}
            courseId={courseId}
            editingLesson={editingLesson}
            editingModule={editingModule}
            items={items}
            lesson={lesson}
            module={module}
            onDeleteLesson={deleteLesson}
            onDeleteModule={deleteModule}
            onSave={save}
            setEditingLesson={setEditingLesson}
            setEditingModule={setEditingModule}
            setLesson={setLesson}
            setModule={setModule}
          />
        )}
        {tab === "Assignments" && (
          <AssignmentsTab
            assignment={assignment}
            busy={busy}
            courseId={courseId}
            editingAssignment={editingAssignment}
            grades={grades}
            items={items}
            selectedAssignment={selectedAssignment}
            submissions={submissions}
            onDelete={deleteAssignment}
            onLoadSubmissions={loadSubmissions}
            onSave={save}
            setAssignment={setAssignment}
            setEditingAssignment={setEditingAssignment}
            setGrades={setGrades}
          />
        )}
        {tab === "Students" && (
          <StudentsTab
            busy={busy}
            courseId={courseId}
            email={email}
            items={items}
            onRemove={removeStudent}
            onSave={save}
            setEmail={setEmail}
          />
        )}
      </section>
    </main>
  );
}

function OverviewTab({ course, busy, onSave, onChange }) {
  const [copyNotice, setCopyNotice] = useState("");

  async function copyJoinCode() {
    try {
      await navigator.clipboard.writeText(course.join_code);
      setCopyNotice("Join code copied.");
    } catch {
      setCopyNotice("Copy failed. Select the code and copy it manually.");
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <article className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-black">Course overview</h2>
        <p className="mt-4 leading-7 text-slate-600">
          {course.description || "No course description yet."}
        </p>
        <dl className="mt-7 grid grid-cols-2 gap-4 text-sm">
          <div>
<dt className="font-bold text-slate-500">Category</dt>
<dd>{course.category}</dd>
</div>
          <div>
<dt className="font-bold text-slate-500">Difficulty</dt>
<dd className="capitalize">{course.difficulty}</dd>
</div>
          <div>
<dt className="font-bold text-slate-500">Students</dt>
<dd>{course.student_count || 0}</dd>
</div>
          <div>
<dt className="font-bold text-slate-500">Lessons</dt>
<dd>{course.lesson_count || 0}</dd>
</div>
        </dl>
      </article>
      <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-xl font-black text-slate-950">Student Enrollment</h2>
        <p className="mt-2 text-sm text-slate-600">
          Share this code with Students so they can join your course.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <code className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-lg font-black tracking-[0.2em] text-emerald-800">
            {course.join_code || "Unavailable"}
          </code>
          <button
            className="rounded-xl border border-emerald-700 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!course.join_code}
            onClick={copyJoinCode}
            type="button"
          >
            Copy Code
          </button>
        </div>
        {copyNotice && <p className="mt-3 text-sm font-semibold text-emerald-800">{copyNotice}</p>}
      </article>
      <form
        className="rounded-2xl border bg-white p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSave(
            () => api.patch(`/teacher/courses/${course.id}/settings`, {
              status: course.status,
              visibility: course.visibility,
            }),
            "Course settings updated.",
          );
        }}
      >
        <h2 className="text-xl font-black">Publishing</h2>
        <label className="mt-4 block text-sm font-bold">Status
          <select className={fieldClass} onChange={(event) => onChange({ ...course, status: event.target.value })} value={course.status}>
            <option value="draft">Draft</option>
<option value="published">Published</option>
          </select>
        </label>
        <label className="mt-4 block text-sm font-bold">Visibility
          <select className={fieldClass} onChange={(event) => onChange({ ...course, visibility: event.target.value })} value={course.visibility}>
            <option value="private">Private</option>
<option value="unlisted">Unlisted</option>
<option value="public">Public</option>
          </select>
        </label>
        <p className="mt-3 text-xs text-slate-500">Only published public courses appear on the public page.</p>
        <button className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" disabled={busy} type="submit">Save settings</button>
      </form>
    </div>
  );
}

function ModulesTab({ busy, courseId, items, module, setModule, onSave, lesson, setLesson, editingModule, setEditingModule, editingLesson, setEditingLesson, onDeleteModule, onDeleteLesson }) {
  return (
    <div className="mt-6 space-y-5">
      <form className="rounded-2xl border bg-white p-6" onSubmit={async (event) => {
        event.preventDefault();
        if (await onSave(() => api.post(`/teacher/courses/${courseId}/modules`, module), "Module created.")) setModule({ title: "", description: "" });
      }}>
        <h2 className="text-xl font-black">Add module</h2>
        <input className={fieldClass} onChange={(event) => setModule({ ...module, title: event.target.value })} placeholder="Module title" required value={module.title} />
        <textarea className={fieldClass} onChange={(event) => setModule({ ...module, description: event.target.value })} placeholder="Description" rows="3" value={module.description} />
        <button className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" disabled={busy} type="submit">Add module</button>
      </form>
      {items.length === 0 && <p className="rounded-2xl border bg-white p-6 text-slate-600">No modules yet.</p>}
      {items.map((item) => <ModuleCard key={item.id} busy={busy} courseId={courseId} item={item} lesson={lesson} editingModule={editingModule} editingLesson={editingLesson} setEditingModule={setEditingModule} setEditingLesson={setEditingLesson} setLesson={setLesson} onSave={onSave} onDeleteModule={onDeleteModule} onDeleteLesson={onDeleteLesson} />)}
    </div>
  );
}

function ModuleCard({
  courseId,
  item,
  busy,
  lesson,
  setLesson,
  editingModule,
  setEditingModule,
  editingLesson,
  setEditingLesson,
  onSave,
  onDeleteModule,
  onDeleteLesson,
}) {
  async function saveModule(event) {
    event.preventDefault();
    if (await onSave(
      () => api.put(`/teacher/modules/${item.id}`, {
        title: editingModule.title,
        description: editingModule.description,
      }),
      "Module updated successfully.",
    )) setEditingModule(null);
  }

  async function addLesson(event) {
    event.preventDefault();
    const values = lesson[item.id] || emptyLesson;
    if (await onSave(
      () => api.post(`/teacher/modules/${item.id}/lessons`, values),
      "Lesson created.",
    )) setLesson({ ...lesson, [item.id]: emptyLesson });
  }

  return (
    <article className="rounded-2xl border bg-white p-6">
      {editingModule?.id === item.id ? (
        <form className="rounded-xl bg-slate-50 p-4" onSubmit={saveModule}>
          <h2 className="font-black">Edit Module</h2>
          <input
            className={fieldClass}
            onChange={(event) => setEditingModule({
              ...editingModule,
              title: event.target.value,
            })}
            required
            value={editingModule.title}
          />
          <textarea
            className={fieldClass}
            onChange={(event) => setEditingModule({
              ...editingModule,
              description: event.target.value,
            })}
            rows="3"
            value={editingModule.description}
          />
          <div className="mt-3 flex gap-3">
            <button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white" disabled={busy} type="submit">Save</button>
            <button className="rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setEditingModule(null)} type="button">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">{item.title}</h2>
            <p className="mt-2 text-slate-600">{item.description || "No description."}</p>
          </div>
          <div className="flex gap-3 text-sm font-bold">
            <button className="text-emerald-800 hover:underline" onClick={() => setEditingModule({ id: item.id, title: item.title, description: item.description || "" })} type="button">Edit</button>
            <button className="text-red-700 hover:underline" onClick={() => onDeleteModule(item)} type="button">Delete</button>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {(!item.lessons || item.lessons.length === 0) && (
          <p className="text-sm text-slate-500">No lessons in this module yet.</p>
        )}
        {item.lessons?.map((current) => (
          <LessonRow
            busy={busy}
            courseId={courseId}
            editing={editingLesson?.id === current.id ? editingLesson : null}
            item={current}
            key={current.id}
            onDelete={onDeleteLesson}
            onSave={onSave}
            setEditing={setEditingLesson}
          />
        ))}
      </div>

      <form className="mt-5 rounded-xl border border-dashed p-4" onSubmit={addLesson}>
        <h3 className="font-bold">Add lesson</h3>
        <input className={fieldClass} onChange={(event) => setLesson({ ...lesson, [item.id]: { ...(lesson[item.id] || emptyLesson), title: event.target.value } })} placeholder="Lesson title" required value={lesson[item.id]?.title || ""} />
        <textarea className={fieldClass} onChange={(event) => setLesson({ ...lesson, [item.id]: { ...(lesson[item.id] || emptyLesson), learningObjectives: event.target.value } })} placeholder="Learning objectives / description" rows="2" value={lesson[item.id]?.learningObjectives || ""} />
        <textarea className={fieldClass} onChange={(event) => setLesson({ ...lesson, [item.id]: { ...(lesson[item.id] || emptyLesson), content: event.target.value } })} placeholder="Lesson content" rows="3" value={lesson[item.id]?.content || ""} />
        <label className="mt-3 flex gap-2 text-sm font-bold">
<input checked={lesson[item.id]?.isPublished || false} onChange={(event) => setLesson({ ...lesson, [item.id]: { ...(lesson[item.id] || emptyLesson), isPublished: event.target.checked } })} type="checkbox" /> Publish lesson</label>
        <button className="mt-3 rounded-xl border border-emerald-700 px-4 py-2 font-bold text-emerald-800" disabled={busy} type="submit">Add lesson</button>
      </form>
    </article>
  );
}

function LessonRow({ courseId, item, busy, editing, setEditing, onSave, onDelete }) {
  if (editing) {
    return (
      <form
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (await onSave(
            () => api.put(`/teacher/lessons/${item.id}`, {
              title: editing.title,
              learningObjectives: editing.learningObjectives,
              content: editing.content,
              isPublished: editing.isPublished,
            }),
            "Lesson updated successfully.",
          )) setEditing(null);
        }}
      >
        <h3 className="font-bold">Edit Lesson</h3>
        <input className={fieldClass} onChange={(event) => setEditing({ ...editing, title: event.target.value })} required value={editing.title} />
        <textarea className={fieldClass} onChange={(event) => setEditing({ ...editing, learningObjectives: event.target.value })} placeholder="Learning objectives / description" rows="2" value={editing.learningObjectives} />
        <textarea className={fieldClass} onChange={(event) => setEditing({ ...editing, content: event.target.value })} placeholder="Lesson content" rows="4" value={editing.content} />
        <label className="mt-3 flex gap-2 text-sm font-bold">
<input checked={editing.isPublished} onChange={(event) => setEditing({ ...editing, isPublished: event.target.checked })} type="checkbox" /> Published</label>
        <div className="mt-3 flex gap-3">
<button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white" disabled={busy} type="submit">Save</button>
<button className="rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setEditing(null)} type="button">Cancel</button>
</div>
      </form>
    );
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold">{item.title} Â· {item.is_published ? "Published" : "Draft"}</p>
        <div className="flex gap-3 text-xs font-bold">
          <button className="text-emerald-800 hover:underline" onClick={() => setEditing({ id: item.id, ...lessonValues(item) })} type="button">Edit</button>
          <Link className="text-emerald-800 hover:underline" to={`/teacher/courses/${courseId}/materials`}>Materials</Link>
          <button className="text-red-700 hover:underline" onClick={() => onDelete(item)} type="button">Delete</button>
        </div>
      </div>
    </div>
  );
}

function AssignmentsTab({ assignment, setAssignment, busy, courseId, items, editingAssignment, setEditingAssignment, onSave, onDelete, onLoadSubmissions, selectedAssignment, submissions, grades, setGrades }) {
  return <div className="mt-6 space-y-5">
<form className="rounded-2xl border bg-white p-6" onSubmit={async (event) => { event.preventDefault(); const values = { ...assignment, dueAt: toIsoOrNull(assignment.dueAt) }; if (await onSave(() => api.post(`/teacher/courses/${courseId}/assignments`, values), "Assignment created.")) setAssignment(emptyAssignment); }}>
<h2 className="text-xl font-black">Create assignment</h2>
<input className={fieldClass} onChange={(event) => setAssignment({ ...assignment, title: event.target.value })} placeholder="Assignment title" required value={assignment.title} />
<textarea className={fieldClass} onChange={(event) => setAssignment({ ...assignment, instructions: event.target.value })} placeholder="Instructions" rows="4" value={assignment.instructions} />
<div className="mt-3 grid gap-3 sm:grid-cols-2">
<input className={fieldClass} min="0.01" onChange={(event) => setAssignment({ ...assignment, totalPoints: event.target.value })} required step="0.01" type="number" value={assignment.totalPoints} />
<input className={fieldClass} onChange={(event) => setAssignment({ ...assignment, dueAt: event.target.value })} type="datetime-local" value={assignment.dueAt} />
</div>
<Toggle checked={assignment.isPublished} label="Publish now" onChange={(value) => setAssignment({ ...assignment, isPublished: value })} />
<Toggle checked={assignment.allowLateSubmissions} label="Allow late submissions" onChange={(value) => setAssignment({ ...assignment, allowLateSubmissions: value })} />
<button className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" disabled={busy} type="submit">Create assignment</button>
</form>{items.length === 0 && <p className="rounded-2xl border bg-white p-6 text-slate-600">No assignments yet.</p>}{items.map((item) => <AssignmentCard key={item.id} item={item} busy={busy} editing={editingAssignment?.id === item.id ? editingAssignment : null} setEditing={setEditingAssignment} onDelete={onDelete} onLoadSubmissions={onLoadSubmissions} onSave={onSave} />)}{selectedAssignment && <SubmissionList assignment={selectedAssignment} busy={busy} submissions={submissions} grades={grades} setGrades={setGrades} onSave={onSave} onReload={() => onLoadSubmissions(selectedAssignment)} />}</div>;
}

function Toggle({ checked, label, onChange }) { return <label className="mt-3 flex gap-2 text-sm font-bold">
<input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" /> {label}</label>; }

function AssignmentCard({ item, busy, editing, setEditing, onDelete, onLoadSubmissions, onSave }) {
  if (editing) return <form className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5" onSubmit={async (event) => { event.preventDefault(); const values = { title: editing.title, instructions: editing.instructions, totalPoints: editing.totalPoints, dueAt: toIsoOrNull(editing.dueAt), isPublished: editing.isPublished, allowLateSubmissions: editing.allowLateSubmissions }; if (await onSave(() => api.put(`/teacher/assignments/${item.id}`, values), "Assignment updated.")) setEditing(null); }}>
<h2 className="font-black">Edit Assignment</h2>
<input className={fieldClass} onChange={(event) => setEditing({ ...editing, title: event.target.value })} required value={editing.title} />
<textarea className={fieldClass} onChange={(event) => setEditing({ ...editing, instructions: event.target.value })} rows="3" value={editing.instructions} />
<div className="grid gap-3 sm:grid-cols-2">
<input className={fieldClass} min="0.01" onChange={(event) => setEditing({ ...editing, totalPoints: event.target.value })} required step="0.01" type="number" value={editing.totalPoints} />
<input className={fieldClass} onChange={(event) => setEditing({ ...editing, dueAt: event.target.value })} type="datetime-local" value={editing.dueAt} />
</div>
<Toggle checked={editing.isPublished} label="Published" onChange={(value) => setEditing({ ...editing, isPublished: value })} />
<Toggle checked={editing.allowLateSubmissions} label="Allow late submissions" onChange={(value) => setEditing({ ...editing, allowLateSubmissions: value })} />
<div className="mt-3 flex gap-3">
<button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white" disabled={busy} type="submit">Save</button>
<button className="rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setEditing(null)} type="button">Cancel</button>
</div>
</form>;
  return <article className="rounded-2xl border bg-white p-5">
<div className="flex flex-wrap items-start justify-between gap-3">
<div>
<h2 className="font-black">{item.title}</h2>
<p className="mt-2 text-sm text-slate-600">{item.total_points} points Â· {item.is_published ? "Published" : "Draft"}</p>
</div>
<div className="flex gap-3 text-sm font-bold">
<button className="text-emerald-800 hover:underline" onClick={() => setEditing({ id: item.id, ...assignmentValues(item) })} type="button">Edit</button>
<button className="text-red-700 hover:underline" onClick={() => onDelete(item)} type="button">Delete</button>
</div>
</div>
<button className="mt-3 text-sm font-bold text-emerald-800 hover:underline" onClick={() => onLoadSubmissions(item)} type="button">View submissions</button>
</article>;
}

function SubmissionList({ assignment, busy, submissions, grades, setGrades, onSave, onReload }) { return <section className="rounded-2xl border bg-white p-6">
<h2 className="text-xl font-black">Submissions: {assignment.title}</h2>{submissions.length === 0 && <p className="mt-4 text-slate-600">No submissions yet.</p>}{submissions.map((submission) => <form className="mt-5 border-t pt-5" key={submission.id} onSubmit={async (event) => { event.preventDefault(); const grade = grades[submission.id] || {}; if (await onSave(() => api.put(`/teacher/submissions/${submission.id}/grade`, grade), "Submission graded.")) onReload(); }}>
<p className="font-bold">{[submission.student?.first_name, submission.student?.last_name].filter(Boolean).join(" ") || submission.student?.email || "Student"}</p>
<p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{submission.written_answer || "No written answer."}</p>
<div className="mt-3 grid gap-3 sm:grid-cols-2">
<input className={fieldClass} min="0" onChange={(event) => setGrades({ ...grades, [submission.id]: { ...(grades[submission.id] || {}), score: event.target.value } })} placeholder="Score" required step="0.01" type="number" value={grades[submission.id]?.score ?? submission.score ?? ""} />
<input className={fieldClass} onChange={(event) => setGrades({ ...grades, [submission.id]: { ...(grades[submission.id] || {}), feedback: event.target.value } })} placeholder="Feedback" value={grades[submission.id]?.feedback ?? submission.feedback ?? ""} />
</div>
<button className="mt-3 rounded-xl border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800" disabled={busy} type="submit">Save grade</button>
</form>)}</section>; }

function StudentsTab({ busy, courseId, email, setEmail, items, onSave, onRemove }) { return <div className="mt-6 space-y-5">
<form className="rounded-2xl border bg-white p-6" onSubmit={async (event) => { event.preventDefault(); if (await onSave(() => api.post(`/teacher/courses/${courseId}/students`, { email }), "Student enrolled.")) setEmail(""); }}>
<h2 className="text-xl font-black">Enroll a student</h2>
<p className="mt-2 text-sm text-slate-600">Use an active Student accountâ€™s PHINMA email.</p>
<div className="mt-4 flex flex-col gap-3 sm:flex-row">
<input className="flex-1 rounded-xl border border-slate-300 px-3 py-2" onChange={(event) => setEmail(event.target.value)} placeholder="student@phinmaed.com" required type="email" value={email} />
<button className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" disabled={busy} type="submit">Enroll</button>
</div>
</form>{items.length === 0 && <p className="rounded-2xl border bg-white p-6 text-slate-600">No students are enrolled yet.</p>}{items.length > 0 && <div className="rounded-2xl border bg-white">{items.map((item) => <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 last:border-0" key={item.id}>
<div>
<p className="font-bold">{[item.student?.first_name, item.student?.last_name].filter(Boolean).join(" ") || "Unnamed student"}</p>
<p className="text-sm text-slate-600">{item.student?.email} Â· {item.status}</p>
</div>{item.status === "active" && <button className="text-sm font-bold text-red-700 hover:underline" onClick={() => onRemove(item)} type="button">Remove</button>}</div>)}</div>}</div>; }

