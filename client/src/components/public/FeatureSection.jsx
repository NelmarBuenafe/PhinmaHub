import {
  Bell,
  BookOpenCheck,
  ChartNoAxesCombined,
  ClipboardCheck,
  Code2,
  Wrench,
} from "lucide-react";

const features = [
  [
    BookOpenCheck,
    "Organized online classrooms",
    "Keep courses, modules and class materials in one clear learning space.",
  ],
  [
    Code2,
    "Step-by-step programming lessons",
    "Learn technical concepts through focused explanations and examples.",
  ],
  [
    ClipboardCheck,
    "Activities and submissions",
    "Complete requirements and submit work through an organized workflow.",
  ],
  [
    ChartNoAxesCombined,
    "Learning-progress tracking",
    "See completed lessons and understand what to study next.",
  ],
  [
    Bell,
    "Announcements and class updates",
    "Stay informed about deadlines, lessons and important class news.",
  ],
  [
    Wrench,
    "Study tools and coding resources",
    "Open useful references and practice materials while you learn.",
  ],
];

function FeatureSection() {
  return (
    <section className="scroll-mt-24 bg-slate-50 py-14 sm:py-18" id="about">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">
            One learning hub
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Everything you need to keep learning
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Courses, materials, assignments, and feedback, connected in one
            organized academic workspace.
          </p>
        </div>
        <div className="mt-12 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([Icon, title, description]) => (
            <article className="group flex gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-emerald-100 hover:bg-emerald-50/40" key={title}>
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icon aria-hidden="true" size={21} />
              </div>
              <div>
                <h3 className="font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-18 rounded-3xl bg-slate-950 px-6 py-10 text-white sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-black">
                A clear path through every course
              </h2>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              {[
                ["01", "Open your course", "Find your modules and choose a lesson."],
                [
                  "02",
                  "Learn at your pace",
                  "Read the lesson and explore its learning materials.",
                ],
                [
                  "03",
                  "Put it into practice",
                  "Submit assignments, review feedback, and track completed lessons.",
                ],
              ].map(([number, title, description]) => (
                <li
                  className="border-t border-slate-700 pt-5"
                  key={number}
                >
                  <span className="text-sm font-black text-emerald-400">
                    {number}
                  </span>
                  <h3 className="mt-3 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureSection;
