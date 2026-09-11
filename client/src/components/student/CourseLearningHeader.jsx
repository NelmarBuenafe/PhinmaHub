function ProgressBar({ value }) {
  return (
    <div
      aria-label={`${value}% complete`}
      className="h-2.5 overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-valuemax="100"
      aria-valuemin="0"
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-emerald-600 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function CourseLearningHeader({ course, completedCount, lessonCount }) {
  const progress = lessonCount
    ? Math.round((completedCount / lessonCount) * 100)
    : 0;

  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-extrabold uppercase tracking-wider text-emerald-700">
        {course.course_code}
      </p>
      <div className="mt-2 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-950">{course.title}</h1>
          <p className="mt-2 text-slate-600">Instructor: {course.teacher_name}</p>
        </div>
        <div className="w-full max-w-sm rounded-xl bg-emerald-50 p-4 sm:min-w-72">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm font-bold text-emerald-900">
              {completedCount} of {lessonCount} lessons completed
            </p>
            <p className="text-xl font-black text-emerald-800">{progress}%</p>
          </div>
          <div className="mt-3">
            <ProgressBar value={progress} />
          </div>
        </div>
      </div>
      {lessonCount > 0 && completedCount === lessonCount && (
        <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 font-bold text-emerald-800">
          Course lessons completed
        </p>
      )}
    </header>
  );
}
