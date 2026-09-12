import { GraduationCap, Presentation } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RoleCard from "../../components/auth/RoleCard.jsx";

const roles = [
  {
    name: "Student",
    role: "student",
    icon: GraduationCap,
    description:
      "Access courses, complete lessons and activities, and track your learning progress.",
  },
  {
    name: "Teacher",
    role: "teacher",
    icon: Presentation,
    description:
      "Create courses, publish learning materials, manage activities and monitor students.",
  },
];

function ChooseRolePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");

  function chooseRole(role) {
    setSelected(role);
    window.sessionStorage.setItem("phinmahub_selected_role", role);
    navigate(`/auth/${role}`, { state: { selectedRole: role } });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-4">
          <Link
            className="text-sm font-bold text-slate-600 hover:text-emerald-700"
            to="/"
          >
            ← Back to Home
          </Link>
        </div>
        <header className="ph-page-enter mx-auto mt-14 max-w-2xl text-center">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-800">
            Choose your workspace
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            How will you use PhinmaHub?
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Choose your role to continue.
          </p>
        </header>
        <section
          aria-label="Available roles"
          className="mt-12 grid gap-6 md:grid-cols-2"
        >
          {roles.map((role, index) => (
            <div className="ph-card-enter" key={role.role} style={{ "--ph-delay": `${100 + index * 70}ms` }}>
              <RoleCard
                description={role.description}
                icon={role.icon}
                onSelect={() => chooseRole(role.role)}
                selected={selected === role.role}
                title={role.name}
              />
            </div>
          ))}
        </section>
        <p className="mt-8 text-center text-sm text-slate-500">
          Choose the role that matches your school account. You will verify
          your PHINMA email before access is activated.
        </p>
      </div>
    </main>
  );
}

export default ChooseRolePage;
