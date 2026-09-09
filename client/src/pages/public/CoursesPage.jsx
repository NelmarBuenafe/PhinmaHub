import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import CourseCard from "../../components/public/CourseCard.jsx";
import Loading from "../../components/common/Loading.jsx";
import PublicFooter from "../../components/public/PublicFooter.jsx";
import PublicNavbar from "../../components/public/PublicNavbar.jsx";
import { useCourseList } from "../../utils/useCourseList.js";

function CoursesPage() {
  const { courses, error, loading } = useCourseList("/courses");

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900"
              to="/"
            >
              <ArrowLeft aria-hidden="true" size={17} /> Back to home
            </Link>
            <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">
              Course catalog
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Explore learning paths
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Browse published courses that are available to the PhinmaHub
              community.
            </p>
          </div>
        </section>
        <section
          aria-label="Public course catalog"
          className="mx-auto grid max-w-7xl gap-5 px-5 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8"
        >
          {loading && <Loading label="Loading courses..." />}
          {error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
              {error}
            </p>
          )}
          {!loading && !error && courses.length === 0 && (
            <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 sm:col-span-2 lg:col-span-3">
              No public courses are available yet.
            </p>
          )}
          {!loading &&
            !error &&
            courses.map((course) => (
              <CourseCard course={course} key={course.id} />
            ))}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

export default CoursesPage;
