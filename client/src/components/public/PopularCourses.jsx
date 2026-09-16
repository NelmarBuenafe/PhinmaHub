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
            <p className="ph-landing-eyebrow text-emerald-700">
              Explore learning
            </p>
            <h2 className="ph-section-title mt-4">
              Available Courses
            </h2>
            <p className="ph-section-copy">
              Explore published courses available through PhinmaHub.
            </p>
          </div>
          <Link
            className="ph-cta-secondary shrink-0"
            to="/courses"
          >
            Browse All Courses
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && <p className="text-slate-600">Loading courses...</p>}
          {error && <p className="text-red-700">{error}</p>}
          {!loading && !error && featuredCourses.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600">No public courses are available yet. Please check back soon.</p>
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
