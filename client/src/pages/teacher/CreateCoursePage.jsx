import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader.jsx";
import TeacherNav from "../../components/teacher/TeacherNav.jsx";
import api from "../../services/api.js";

const initialValues = {
  courseCode: "",
  title: "",
  description: "",
  category: "",
  difficulty: "beginner",
  visibility: "private",
};

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await api.get("/teacher/course-categories");
        setCategories(response.data.data || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Course categories could not be loaded.");
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!values.courseCode.trim()) nextErrors.courseCode = "Enter a course code.";
    if (!values.title.trim()) nextErrors.title = "Enter a course title.";
    if (!values.category) nextErrors.category = "Select a course category.";
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await api.post("/teacher/courses", {
        ...values,
        courseCode: values.courseCode.trim(),
        title: values.title.trim(),
        description: values.description.trim(),
      });
      navigate(`/teacher/courses/${response.data.data.id}`, {
        replace: true,
        state: { success: "Course created successfully." },
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Course creation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <TeacherNav />
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:underline" to="/teacher/courses">
          <ArrowLeft aria-hidden="true" size={16} /> Back to My Courses
        </Link>
        <div className="mt-4">
          <PageHeader
            description="New courses start as private drafts. You can manage publishing later."
            eyebrow="Teacher workspace"
            title="Create Course"
          />
        </div>
        <form className="ph-card-enter ph-surface mt-8 rounded-2xl p-6" onSubmit={submit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Course Code
              <input
                aria-describedby={
                  fieldErrors.courseCode ? "course-code-error" : undefined
                }
                aria-invalid={Boolean(fieldErrors.courseCode)}
                className="rounded-xl border border-slate-300 px-3 py-3 font-normal"
                maxLength="50"
                onChange={(event) =>
                  update("courseCode", event.target.value)
                }
                placeholder="IT101"
                required
                value={values.courseCode}
              />
              {fieldErrors.courseCode && (
                <span className="font-normal text-red-700" id="course-code-error">
                  {fieldErrors.courseCode}
                </span>
              )}
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Difficulty
              <select
                className="rounded-xl border border-slate-300 px-3 py-3 font-normal"
                onChange={(event) =>
                  update("difficulty", event.target.value)
                }
                value={values.difficulty}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>
          <label className="mt-5 grid gap-2 text-sm font-bold text-slate-700">
            Course Title
            <input
              aria-describedby={
                fieldErrors.title ? "course-title-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.title)}
              className="rounded-xl border border-slate-300 px-3 py-3 font-normal"
              maxLength="200"
              onChange={(event) => update("title", event.target.value)}
              placeholder="Introduction to Information Technology"
              required
              value={values.title}
            />
            {fieldErrors.title && (
              <span className="font-normal text-red-700" id="course-title-error">
                {fieldErrors.title}
              </span>
            )}
          </label>
          <label className="mt-5 grid gap-2 text-sm font-bold text-slate-700">
            Description
            <textarea
              className="min-h-32 rounded-xl border border-slate-300 px-3 py-3 font-normal"
              maxLength="4000"
              onChange={(event) => update("description", event.target.value)}
              placeholder="Describe what students will learn in this course."
              value={values.description}
            />
          </label>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Category
              <select
                aria-describedby={
                  fieldErrors.category ? "course-category-error" : undefined
                }
                aria-invalid={Boolean(fieldErrors.category)}
                className="rounded-xl border border-slate-300 px-3 py-3 font-normal"
                disabled={loadingCategories || !categories.length}
                onChange={(event) => update("category", event.target.value)}
                required
                value={values.category}
              >
                <option value="">{loadingCategories ? "Loading categories..." : "Select a category"}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              {fieldErrors.category && (
                <span className="font-normal text-red-700" id="course-category-error">
                  {fieldErrors.category}
                </span>
              )}
              {!loadingCategories && !categories.length && (
                <span className="font-normal text-red-700">
                  No active categories are available. Ask an administrator to
                  add one.
                </span>
              )}
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Visibility
              <select
                className="rounded-xl border border-slate-300 px-3 py-3 font-normal"
                onChange={(event) =>
                  update("visibility", event.target.value)
                }
                value={values.visibility}
              >
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </select>
            </label>
          </div>
          {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <Link className="rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50" to="/teacher/courses">Cancel</Link>
            <button
              className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                submitting || loadingCategories || !categories.length
              }
              type="submit"
            >
              {submitting ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
