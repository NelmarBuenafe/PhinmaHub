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
    <section className="scroll-mt-24 bg-white py-18 sm:py-22" id="about">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">
            One learning hub
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Everything you need to keep learning
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Simple tools for structured classes, programming practice and
            meaningful progress.
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
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-yellow-300">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-black">
                From sign-in to your workspace
              </h2>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              {[
                ["01", "Sign in", "Use an authorized PHINMA Google account."],
                [
                  "02",
                  "Register",
                  "Choose Student or Teacher and complete your details.",
                ],
                [
                  "03",
                  "Start learning",
                  "Wait for approval, then open the correct workspace.",
                ],
              ].map(([number, title, description]) => (
                <li
                  className="rounded-2xl border border-slate-700 bg-slate-900 p-5 transition-colors hover:border-emerald-700 hover:bg-slate-800"
                  key={number}
                >
                  <span className="text-sm font-black text-emerald-400">
                    {number}
                  </span>
                  <h3 className="mt-3 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
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
