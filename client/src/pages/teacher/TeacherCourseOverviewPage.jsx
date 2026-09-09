import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import TeacherNav from "../../components/teacher/TeacherNav.jsx";
import api from "../../services/api.js";

const tabs = ["Overview", "Modules", "Assignments", "Students"];
const fieldClass = "mt-1 w-full rounded-xl border border-slate-300 px-3 py-2";

function Alert({ children, error = false }) {
  if (!children) return null;
  return <p className={`mt-4 rounded-xl border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{children}</p>;
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
  const [assignment, setAssignment] = useState({ title: "", instructions: "", totalPoints: "100", dueAt: "", isPublished: false, allowLateSubmissions: false });
  const [email, setEmail] = useState("");
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
      setError(requestError.response?.data?.message || "Course details could not be loaded.");
    } finally { setLoading(false); }
  }, [courseId]);

  const loadTab = useCallback(async () => {
    if (tab === "Overview") return;
    const endpoint = tab === "Modules" ? "modules" : tab === "Assignments" ? "assignments" : "students";
    try {
      const response = await api.get(`/teacher/courses/${courseId}/${endpoint}`);
      setItems(response.data.data);
    } catch (requestError) { setError(requestError.response?.data?.message || `Unable to load ${tab.toLowerCase()}.`); }
  }, [courseId, tab]);

  useEffect(() => { loadCourse(); }, [loadCourse]);
  useEffect(() => { if (course) loadTab(); }, [course, loadTab]);

  async function save(action, message) {
    setBusy(true); setError("");
    try { await action(); setNotice(message); await Promise.all([loadCourse(), loadTab()]); return true; }
    catch (requestError) { setError(requestError.response?.data?.message || "The change could not be saved."); return false; }
    finally { setBusy(false); }
  }

  async function loadSubmissions(assignmentItem) {
    try {
      const response = await api.get(`/teacher/assignments/${assignmentItem.id}/submissions`);
      setSelectedAssignment(assignmentItem);
      setSubmissions(response.data.data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load submissions.");
    }
  }

  if (loading) return <main className="min-h-screen bg-slate-50"><TeacherNav /><div className="p-10"><Loading label="Loading course..." /></div></main>;
  if (!course) return <main className="min-h-screen bg-slate-50"><TeacherNav /><div className="mx-auto max-w-5xl p-10"><Alert error>{error}</Alert><button className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" onClick={loadCourse} type="button">Retry</button></div></main>;

  return <main className="min-h-screen bg-slate-50"><TeacherNav /><section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
    <Link className="text-sm font-bold text-emerald-800" to="/teacher/courses">← Back to My Courses</Link>
    <p className="mt-7 text-sm font-bold uppercase tracking-wider text-emerald-700">Manage Course</p><h1 className="mt-2 text-3xl font-black text-slate-950">{course.course_code} · {course.title}</h1>
    <div className="mt-7 flex flex-wrap gap-2 border-b border-slate-200">{tabs.map((item) => <button className={`rounded-t-xl px-4 py-3 text-sm font-bold ${tab === item ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"}`} key={item} onClick={() => setTab(item)} type="button">{item}</button>)}</div>
    <Alert>{notice}</Alert><Alert error>{error}</Alert>
    {tab === "Overview" && <div className="mt-6 grid gap-6 lg:grid-cols-2"><article className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">Course overview</h2><p className="mt-4 leading-7 text-slate-600">{course.description || "No course description yet."}</p><dl className="mt-7 grid grid-cols-2 gap-4 text-sm"><div><dt className="font-bold text-slate-500">Category</dt><dd>{course.category}</dd></div><div><dt className="font-bold text-slate-500">Difficulty</dt><dd className="capitalize">{course.difficulty}</dd></div><div><dt className="font-bold text-slate-500">Students</dt><dd>{course.student_count || 0}</dd></div><div><dt className="font-bold text-slate-500">Lessons</dt><dd>{course.lesson_count || 0}</dd></div></dl></article><form className="rounded-2xl border bg-white p-6" onSubmit={async (event) => { event.preventDefault(); await save(() => api.patch(`/teacher/courses/${courseId}/settings`, { status: course.status, visibility: course.visibility }), "Course settings updated."); }}><h2 className="text-xl font-black">Publishing</h2><label className="mt-4 block text-sm font-bold">Status<select className={fieldClass} onChange={(event) => setCourse({ ...course, status: event.target.value })} value={course.status}><option value="draft">Draft</option><option value="published">Published</option></select></label><label className="mt-4 block text-sm font-bold">Visibility<select className={fieldClass} onChange={(event) => setCourse({ ...course, visibility: event.target.value })} value={course.visibility}><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></label><p className="mt-3 text-xs text-slate-500">Only published public courses appear on the public page.</p><button className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" disabled={busy} type="submit">Save settings</button></form></div>}
    {tab === "Modules" && <div className="mt-6 space-y-5"><form className="rounded-2xl border bg-white p-6" onSubmit={async (event) => { event.preventDefault(); if (await save(() => api.post(`/teacher/courses/${courseId}/modules`, module), "Module created.")) setModule({ title: "", description: "" }); }}><h2 className="text-xl font-black">Add module</h2><input className={fieldClass} onChange={(event) => setModule({ ...module, title: event.target.value })} placeholder="Module title" required value={module.title} /><textarea className={fieldClass} onChange={(event) => setModule({ ...module, description: event.target.value })} placeholder="Description" rows="3" value={module.description} /><button className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" disabled={busy} type="submit">Add module</button></form>{items.length === 0 ? <p className="rounded-2xl border bg-white p-6 text-slate-600">No modules yet.</p> : items.map((item) => <article className="rounded-2xl border bg-white p-6" key={item.id}><h2 className="text-xl font-black">{item.title}</h2><p className="mt-2 text-slate-600">{item.description}</p>{item.lessons?.map((current) => <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm" key={current.id}>{current.title} · {current.is_published ? "Published" : "Draft"}</p>)}<form className="mt-4 rounded-xl border border-dashed p-4" onSubmit={async (event) => { event.preventDefault(); const values = lesson[item.id] || {}; if (await save(() => api.post(`/teacher/modules/${item.id}/lessons`, values), "Lesson created.")) setLesson({ ...lesson, [item.id]: {} }); }}><h3 className="font-bold">Add lesson</h3><input className={fieldClass} onChange={(event) => setLesson({ ...lesson, [item.id]: { ...(lesson[item.id] || {}), title: event.target.value } })} placeholder="Lesson title" required value={lesson[item.id]?.title || ""} /><textarea className={fieldClass} onChange={(event) => setLesson({ ...lesson, [item.id]: { ...(lesson[item.id] || {}), content: event.target.value } })} placeholder="Lesson content" rows="3" value={lesson[item.id]?.content || ""} /><label className="mt-3 flex gap-2 text-sm font-bold"><input checked={lesson[item.id]?.isPublished || false} onChange={(event) => setLesson({ ...lesson, [item.id]: { ...(lesson[item.id] || {}), isPublished: event.target.checked } })} type="checkbox" /> Publish lesson</label><button className="mt-3 rounded-xl border border-emerald-700 px-4 py-2 font-bold text-emerald-800" disabled={busy} type="submit">Add lesson</button></form></article>)}</div>}
    {tab === "Assignments" && <div className="mt-6 space-y-5"><form className="rounded-2xl border bg-white p-6" onSubmit={async (event) => { event.preventDefault(); const values = { ...assignment, dueAt: assignment.dueAt ? new Date(assignment.dueAt).toISOString() : null }; if (await save(() => api.post(`/teacher/courses/${courseId}/assignments`, values), "Assignment created.")) setAssignment({ title: "", instructions: "", totalPoints: "100", dueAt: "", isPublished: false, allowLateSubmissions: false }); }}><h2 className="text-xl font-black">Create assignment</h2><input className={fieldClass} onChange={(event) => setAssignment({ ...assignment, title: event.target.value })} placeholder="Assignment title" required value={assignment.title} /><textarea className={fieldClass} onChange={(event) => setAssignment({ ...assignment, instructions: event.target.value })} placeholder="Instructions" rows="4" value={assignment.instructions} /><div className="mt-3 grid gap-3 sm:grid-cols-2"><input className={fieldClass} min="0.01" onChange={(event) => setAssignment({ ...assignment, totalPoints: event.target.value })} required step="0.01" type="number" value={assignment.totalPoints} /><input className={fieldClass} onChange={(event) => setAssignment({ ...assignment, dueAt: event.target.value })} type="datetime-local" value={assignment.dueAt} /></div><label className="mt-3 flex gap-2 text-sm font-bold"><input checked={assignment.isPublished} onChange={(event) => setAssignment({ ...assignment, isPublished: event.target.checked })} type="checkbox" /> Publish now</label><label className="mt-2 flex gap-2 text-sm font-bold"><input checked={assignment.allowLateSubmissions} onChange={(event) => setAssignment({ ...assignment, allowLateSubmissions: event.target.checked })} type="checkbox" /> Allow late submissions</label><button className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" disabled={busy} type="submit">Create assignment</button></form>{items.length === 0 ? <p className="rounded-2xl border bg-white p-6 text-slate-600">No assignments yet.</p> : items.map((item) => <article className="rounded-2xl border bg-white p-5" key={item.id}><h2 className="font-black">{item.title}</h2><p className="mt-2 text-sm text-slate-600">{item.total_points} points · {item.is_published ? "Published" : "Draft"}</p><button className="mt-3 text-sm font-bold text-emerald-800" onClick={() => loadSubmissions(item)} type="button">View submissions</button></article>)}{selectedAssignment && <section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">Submissions: {selectedAssignment.title}</h2>{submissions.length === 0 ? <p className="mt-4 text-slate-600">No submissions yet.</p> : submissions.map((submission) => <form className="mt-5 border-t pt-5" key={submission.id} onSubmit={async (event) => { event.preventDefault(); const grade = grades[submission.id] || {}; const saved = await save(() => api.put(`/teacher/submissions/${submission.id}/grade`, grade), "Submission graded."); if (saved) await loadSubmissions(selectedAssignment); }}><p className="font-bold">{[submission.student?.first_name, submission.student?.last_name].filter(Boolean).join(" ") || submission.student?.email || "Student"}</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{submission.written_answer || "No written answer."}</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><input className={fieldClass} min="0" onChange={(event) => setGrades({ ...grades, [submission.id]: { ...(grades[submission.id] || {}), score: event.target.value } })} placeholder="Score" required step="0.01" type="number" value={grades[submission.id]?.score ?? submission.score ?? ""} /><input className={fieldClass} onChange={(event) => setGrades({ ...grades, [submission.id]: { ...(grades[submission.id] || {}), feedback: event.target.value } })} placeholder="Feedback" value={grades[submission.id]?.feedback ?? submission.feedback ?? ""} /></div><button className="mt-3 rounded-xl border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800" disabled={busy} type="submit">Save grade</button></form>)}</section>}</div>}
    {tab === "Students" && <div className="mt-6 space-y-5"><form className="rounded-2xl border bg-white p-6" onSubmit={async (event) => { event.preventDefault(); if (await save(() => api.post(`/teacher/courses/${courseId}/students`, { email }), "Student enrolled.")) setEmail(""); }}><h2 className="text-xl font-black">Enroll a student</h2><p className="mt-2 text-sm text-slate-600">Use an active Student account’s PHINMA email.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input className="flex-1 rounded-xl border border-slate-300 px-3 py-2" onChange={(event) => setEmail(event.target.value)} placeholder="student@phinmaed.com" required type="email" value={email} /><button className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" disabled={busy} type="submit">Enroll</button></div></form>{items.length === 0 ? <p className="rounded-2xl border bg-white p-6 text-slate-600">No students are enrolled yet.</p> : <div className="rounded-2xl border bg-white">{items.map((item) => <div className="border-b p-4 last:border-0" key={item.id}><p className="font-bold">{[item.student?.first_name, item.student?.last_name].filter(Boolean).join(" ") || "Unnamed student"}</p><p className="text-sm text-slate-600">{item.student?.email} · {item.status}</p></div>)}</div>}</div>}
  </section></main>;
}
