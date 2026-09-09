import { Link } from "react-router-dom";
import CourseCard from "./CourseCard.jsx";
import { useCourseList } from "../../utils/useCourseList.js";

function PopularCourses() {
  const { courses, error, loading } = useCourseList("/courses");
  const featuredCourses = courses.slice(0, 3);

  return (
    <section className="scroll-mt-24 bg-slate-50 py-18 sm:py-22" id="courses">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">
              Start learning
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Popular Courses
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Explore practical technology lessons designed to build strong
              foundations and useful skills.
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:border-emerald-600 hover:text-emerald-800"
            to="/courses"
          >
            Browse All Courses
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && <p className="text-slate-600">Loading courses...</p>}
          {error && <p className="text-red-700">{error}</p>}
          {!loading && !error && featuredCourses.length === 0 && (
            <p className="text-slate-600">No public courses are available yet.</p>
          )}
          {!loading &&
            !error &&
            featuredCourses.map((course) => (
              <CourseCard course={course} key={course.id} />
            ))}
        </div>
      </div>
    </section>
  );
}

export default PopularCourses;
