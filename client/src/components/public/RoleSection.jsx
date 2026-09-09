import { Check, GraduationCap, Presentation } from "lucide-react";
import { Link } from "react-router-dom";

const roles = [
  {
    icon: GraduationCap,
    title: "Student Experience",
    description: "A clear path from lessons to completed learning goals.",
    items: [
      "Join courses",
      "Read lessons",
      "Practice programming",
      "Submit activities",
      "Track learning progress",
    ],
    accent: "bg-emerald-700",
  },
  {
    icon: Presentation,
    title: "Teacher Experience",
    description: "Practical tools for organizing and supporting every class.",
    items: [
      "Create courses",
      "Organize lessons",
      "Publish activities",
      "Review submissions",
      "Monitor student progress",
    ],
    accent: "bg-slate-900",
  },
];

function RoleSection() {
  return (
    <section className="bg-emerald-50/60 py-18 sm:py-22">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">
            Built for your role
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            One platform, two learning experiences
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {roles.map(({ icon: Icon, title, description, items, accent }) => (
            <article
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              key={title}
            >
              <div
                className={`${accent} flex items-center gap-4 p-6 text-white`}
              >
                <div className="grid size-12 place-items-center rounded-xl bg-white/15">
                  <Icon aria-hidden="true" size={25} />
                </div>
                <div>
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className="mt-1 text-sm text-white/75">{description}</p>
                </div>
              </div>
              <ul className="grid gap-3 p-6 sm:grid-cols-2">
                {items.map((item) => (
                  <li
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                    key={item}
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check aria-hidden="true" size={14} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            className="inline-flex rounded-xl bg-emerald-700 px-6 py-3.5 font-bold text-white shadow-sm hover:bg-emerald-800"
            to="/choose-role"
          >
            Continue as Student or Teacher
          </Link>
        </div>
      </div>
    </section>
  );
}

export default RoleSection;
