import { FolderOpen } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { ConfirmationDialog } from "../../components/admin/AdminUI.jsx";
import TeacherAnnouncementsPanel from "../../components/teacher/TeacherAnnouncementsPanel.jsx";
import {
  AssignmentsTab,
  ModulesTab,
  OverviewTab,
  StudentsTab,
} from "../../components/teacher/TeacherCourseOverviewTabs.jsx";
import { emptyAssignment } from "../../components/teacher/teacherCourseOverviewConstants.js";
import api from "../../services/api.js";
import { useApiQuery } from "../../utils/useApiQuery.js";
import { useToast } from "../../contexts/toastStore.js";
import { actionErrorMessage } from "../../utils/actionFeedback.js";

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
  const [tab, setTab] = useState("Overview");
  const [actionError, setError] = useState("");
  const toast = useToast();
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

  const courseQuery = useApiQuery(`/teacher/courses/${courseId}`, { errorMessage: "Course details could not be loaded." });
  const endpoint = tab === "Modules" ? "modules" : tab === "Assignments" ? "assignments" : "students";
  const tabQuery = useApiQuery(`/teacher/courses/${courseId}/${endpoint}`, { enabled: !["Overview", "Announcements"].includes(tab), errorMessage: `Unable to load ${tab.toLowerCase()}.` });
  const [courseEdit, setCourseEdit] = useState(null);
  const course = courseEdit?.courseId === courseId && courseEdit.base === courseQuery.data ? courseEdit.value : courseQuery.data?.data;
  const setCourse = (updater) => setCourseEdit({ courseId, base: courseQuery.data, value: typeof updater === "function" ? updater(course) : updater });
  const items = tabQuery.data?.data || [];
  const loading = courseQuery.loading;
  const error = actionError || courseQuery.error || tabQuery.error;
  const loadCourse = courseQuery.reload;
  const loadTab = tabQuery.reload;

  async function save(action, message) {
    setBusy(true);
    setError("");
    try {
      await action();
      toast.success(message);
      await Promise.all([loadCourse(), loadTab()]);
      return true;
    } catch (requestError) {
      const errorMessage = actionErrorMessage(requestError, "The change could not be saved.");
      setError(errorMessage);
      toast.error(errorMessage);
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
      action: () => save(() => api.delete(`/teacher/modules/${item.id}`), "Module deleted successfully."),
    });
  }

  function deleteLesson(item) {
    setConfirmation({
      title: "Delete lesson?",
      message: "Students may already have progress associated with this lesson. Deleting it also removes related materials and affects progress calculations.",
      confirmLabel: "Delete lesson",
      action: () => save(() => api.delete(`/teacher/lessons/${item.id}`), "Lesson deleted successfully."),
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
    return save(
      () => api.delete(`/teacher/courses/${courseId}/students/${item.id}`),
      "Student removed from the course.",
    );
  }

  if (loading) {
    return (
      <div className="min-w-0">

        <div className="ph-role-page">
          <PageHeader eyebrow="Teacher workspace" title="Manage Course" />
          <div className="mt-6"><Loading variant="courses" label="Loading course..." /></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-w-0">

        <div className="ph-role-page">
          <Alert error>{error}</Alert>
          <button
            className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white"
            onClick={loadCourse}
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">

      <section className="ph-role-page">
        <Link className="ph-action inline-flex text-sm font-bold text-emerald-800 hover:-translate-x-0.5" to="/teacher/courses">
          ← Back to My Courses
        </Link>
        <div className="ph-page-enter ph-surface mt-5 rounded-2xl px-6 py-5 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Manage Course · {course.course_code}</p>
            <StatusBadge value={course.status} />
          </div>
          <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{course.title}</h1>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-3 pt-2 sm:px-5">
          <div className="ph-tabs max-w-full border-b-0">
            {tabs.map((item) => (
              <button
                className={`ph-tab ${
                  tab === item
                    ? "ph-tab-active"
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
            className="ph-action mb-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            to={`/teacher/courses/${courseId}/materials`}
          >
            <FolderOpen aria-hidden="true" size={16} /> Manage Materials
          </Link>
        </div>

          <div className="px-4 pb-5 sm:px-5 sm:pb-6">
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
        {tabQuery.loading && <div className="mt-6"><Loading variant="courses" label={`Loading ${tab.toLowerCase()}...`} /></div>}
        {tabQuery.error && <button className="mt-3 font-bold underline" onClick={loadTab} type="button">Retry section</button>}
        {tab === "Modules" && !tabQuery.loading && !tabQuery.error && (
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
        {tab === "Assignments" && !tabQuery.loading && !tabQuery.error && (
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
        {tab === "Students" && !tabQuery.loading && !tabQuery.error && (
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
          </div>
        </div>
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
    </div>
  );
}
