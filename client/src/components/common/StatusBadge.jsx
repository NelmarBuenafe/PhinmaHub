import {
  Archive,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FilePenLine,
  UserRound,
} from "lucide-react";

const variants = {
  active: ["bg-emerald-100 text-emerald-900", CheckCircle2],
  archived: ["bg-slate-200 text-slate-800", Archive],
  completed: ["bg-emerald-100 text-emerald-900", CheckCircle2],
  draft: ["bg-slate-100 text-slate-800", FilePenLine],
  graded: ["bg-emerald-100 text-emerald-900", CheckCircle2],
  in_progress: ["bg-slate-100 text-slate-800", Clock3],
  late: ["bg-amber-100 text-amber-950", CircleAlert],
  new: ["bg-amber-100 text-amber-950", Clock3],
  pending: ["bg-amber-100 text-amber-950", Clock3],
  published: ["bg-emerald-100 text-emerald-900", CheckCircle2],
  rejected: ["bg-red-100 text-red-900", CircleAlert],
  resolved: ["bg-emerald-100 text-emerald-900", CheckCircle2],
  student: ["bg-slate-100 text-slate-800", UserRound],
  submitted: ["bg-slate-100 text-slate-800", CheckCircle2],
  suspended: ["bg-red-100 text-red-900", CircleAlert],
  teacher: ["bg-slate-100 text-slate-800", UserRound],
};

export default function StatusBadge({ label, value }) {
  const normalized = String(value || "unknown").toLowerCase();
  const [styles, Icon] = variants[normalized] || [
    "bg-slate-100 text-slate-800",
    CircleAlert,
  ];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-current/10 px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${styles}`}
    >
      <Icon aria-hidden="true" size={13} strokeWidth={2.5} />
      {label || normalized.replaceAll("_", " ")}
    </span>
  );
}
