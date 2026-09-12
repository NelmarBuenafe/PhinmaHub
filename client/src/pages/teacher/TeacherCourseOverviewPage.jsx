import { useCallback, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import { ConfirmationDialog } from "../../components/admin/AdminUI.jsx";
import TeacherAnnouncementsPanel from "../../components/teacher/TeacherAnnouncementsPanel.jsx";
import {
  AssignmentsTab,
  ModulesTab,
  OverviewTab,
  StudentsTab,
} from "../../components/teacher/TeacherCourseOverviewTabs.jsx";
import { emptyAssignment } from "../../components/teacher/teacherCourseOverviewConstants.js";
import TeacherNav from "../../components/teacher/TeacherNav.jsx";
import api from "../../services/api.js";
import { useDeferredLoad } from "../../utils/useDeferredLoad.js";

const tabs = ["Overview", "Modules", "Assignments", "Students", "Announcements"];

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
  const [confirmation, setConfirmation] = useState(null);

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
      tab === "Modules"
        ? "modules"
        : tab === "Assignments"
          ? "assignments"
          : "students";
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

  const loadReadyTab = useCallback(() => {
    if (course) return loadTab();
    return undefined;
  }, [course, loadTab]);

  useDeferredLoad(loadCourse);
  useDeferredLoad(loadReadyTab);

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

  function deleteModule(item) {
    const count = item.lessons?.length || 0;
    setConfirmation({
      title: "Delete module?",
      message: `This module contains ${count} lesson${count === 1 ? "" : "s"}. Deleting it may also remove its lessons, materials, and progress. This action cannot be undone.`,
      confirmLabel: "Delete module",
      action: () => save(() => api.delete(`/teacher/modules/${item.id}`), "Module deleted."),
    });
  }

  function deleteLesson(item) {
    setConfirmation({
      title: "Delete lesson?",
      message: "Students may already have progress associated with this lesson. Deleting it also removes related materials and affects progress calculations.",
      confirmLabel: "Delete lesson",
      action: () => save(() => api.delete(`/teacher/lessons/${item.id}`), "Lesson deleted."),
    });
  }

  function deleteAssignment(item) {
    setConfirmation({
      title: "Delete assignment?",
      message: "Assignments with Student submissions cannot be deleted. Continue only if this assignment has no submissions.",
      confirmLabel: "Delete assignment",
      action: () => save(() => api.delete(`/teacher/assignments/${item.id}`), "Assignment deleted."),
    });
  }

  function removeStudent(item) {
    setConfirmation({
      title: "Remove Student from course?",
      message: "The Student account and history will be preserved, but the Student will lose active access to this course.",
      confirmLabel: "Remove Student",
      action: () => save(() => api.delete(`/teacher/courses/${courseId}/students/${item.id}`), "Student removed from course."),
    });
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
        <Link className="ph-action inline-flex text-sm font-bold text-emerald-800 hover:-translate-x-0.5" to="/teacher/courses">
          ← Back to My Courses
        </Link>
        <div className="ph-page-enter ph-surface-soft relative mt-6 overflow-hidden rounded-3xl p-6 sm:p-8">
          <div aria-hidden="true" className="absolute -right-12 -top-16 size-44 rounded-full border-[26px] border-emerald-100/70" />
          <p className="relative text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Manage Course</p>
          <h1 className="relative mt-2 text-3xl font-black tracking-tight text-slate-950">{course.course_code} · {course.title}</h1>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                className={`ph-action rounded-t-xl px-4 py-3 text-sm font-bold ${
                  tab === item
                    ? "bg-emerald-700 text-white shadow-sm"
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
          <OverviewTab
            busy={busy}
            course={course}
            onChange={setCourse}
            onSave={save}
          />
        )}
        {tab === "Announcements" && (
          <TeacherAnnouncementsPanel courseId={courseId} />
        )}
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
            onDelete={deleteAssignment}
            onLoadSubmissions={loadSubmissions}
            onSave={save}
            selectedAssignment={selectedAssignment}
            setAssignment={setAssignment}
            setEditingAssignment={setEditingAssignment}
            setGrades={setGrades}
            submissions={submissions}
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
        <ConfirmationDialog
          confirmLabel={confirmation?.confirmLabel}
          destructive
          onClose={() => setConfirmation(null)}
          onConfirm={async () => {
            await confirmation?.action();
            setConfirmation(null);
          }}
          open={Boolean(confirmation)}
          processing={busy}
          title={confirmation?.title}
        >
          {confirmation?.message}
        </ConfirmationDialog>
      </section>
    </main>
  );
}
