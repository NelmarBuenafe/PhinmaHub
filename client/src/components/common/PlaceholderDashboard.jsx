import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";

function PlaceholderDashboard({ role }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "PhinmaHub user";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-emerald-700">PhinmaHub</p>
            <p className="text-sm text-slate-500">{role} workspace</p>
          </div>
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            onClick={signOut}
            type="button"
          >
            Sign out
          </button>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-16">
        {location.state?.roleNotice && (
          <p
            className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-900"
            role="status"
          >
            {location.state.roleNotice}
          </p>
        )}
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
          Temporary placeholder
        </p>
        <h1 className="mt-3 text-4xl font-bold capitalize text-slate-950">
          Welcome, {displayName}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Your {role.toLowerCase()} dashboard will be implemented in a later
          phase.
        </p>
      </section>
    </main>
  );
}

export default PlaceholderDashboard;
