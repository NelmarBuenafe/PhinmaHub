import { BookMarked, Dumbbell, Library } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const examples = {
  HTML: ["<main>", "  <h1>Hello, learner!</h1>", "</main>"],
  CSS: [".lesson-card {", "  border-radius: 1rem;", "}"],
  JavaScript: [
    'const goal = "Learn";',
    "const today = true;",
    "console.log(goal);",
  ],
  Python: ['course = "Python"', "progress = 75", "print(course, progress)"],
};

function StudyToolsPreview() {
  const [language, setLanguage] = useState("HTML");

  return (
    <section className="scroll-mt-24 bg-white py-18 sm:py-22" id="study-tools">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-emerald-700">
            Study tools
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Learn concepts. Read code. Keep practicing.
          </h2>
          <p className="mt-5 leading-7 text-slate-600">
            Move from lesson explanations to useful references and practice
            activities without losing your place.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              [BookMarked, "Guided lessons"],
              [Library, "Quick references"],
              [Dumbbell, "Practice activities"],
            ].map(([Icon, label]) => (
              <div
                className="flex items-center gap-3 font-bold text-slate-700"
                key={label}
              >
                <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon aria-hidden="true" size={18} />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="ph-card-enter overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl shadow-slate-900/20 [--ph-delay:100ms]">
          <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
            <div className="flex gap-2" aria-hidden="true">
              <span className="size-3 rounded-full bg-red-400" />
              <span className="size-3 rounded-full bg-yellow-300" />
              <span className="size-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs font-bold text-slate-400">
              learning-preview
            </span>
          </div>
          <div
            className="flex gap-1 overflow-x-auto border-b border-slate-800 p-3"
            role="tablist"
            aria-label="Code example language"
          >
            {Object.keys(examples).map((name) => (
              <button
                aria-selected={language === name}
                className={`ph-action rounded-lg px-3 py-2 text-xs font-bold ${language === name ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                key={name}
                onClick={() => setLanguage(name)}
                role="tab"
                type="button"
              >
                {name}
              </button>
            ))}
          </div>
          <pre className="min-h-48 overflow-x-auto p-6 text-sm leading-8 text-slate-300">
            <code>
              {examples[language].map((line, index) => (
                <span className="block" key={`${language}-${line}`}>
                  <span className="mr-5 inline-block w-4 select-none text-right text-slate-600">
                    {index + 1}
                  </span>
                  {line}
                </span>
              ))}
            </code>
          </pre>
          <div className="flex flex-wrap gap-3 border-t border-slate-800 bg-slate-900 px-5 py-4">
            {["Lessons", "References", "Practice"].map((label) => (
              <Link
                className="ph-action rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:border-emerald-500 hover:text-emerald-300"
                key={label}
                to="/courses"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StudyToolsPreview;
