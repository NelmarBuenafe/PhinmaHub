import { ArrowRight } from "lucide-react";

function RoleCard({ description, icon: Icon, onSelect, selected, title }) {
  return (
    <article
      className={`flex h-full flex-col rounded-3xl border bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-emerald-500 motion-reduce:transform-none ${selected ? "border-emerald-600 ring-2 ring-emerald-100" : "border-slate-200"}`}
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
        <Icon aria-hidden="true" size={28} />
      </span>
      <h2 className="mt-5 text-2xl font-black text-slate-950">{title}</h2>
      <p className="mt-3 flex-1 leading-7 text-slate-600">{description}</p>
      <button
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800"
        onClick={onSelect}
        type="button"
      >
        Continue as {title}
        <ArrowRight aria-hidden="true" size={18} />
      </button>
    </article>
  );
}

export default RoleCard;
