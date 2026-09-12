import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";
import { getProfileDestination } from "../../utils/auth.js";

function NotFoundPage() {
  const { profile } = useAuth();
  const destination = profile ? getProfileDestination(profile) : "/";
  const destinationLabel = profile ? "Return to my workspace" : "Return home";

  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
          404
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-slate-600">
          The page you requested does not exist.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800"
            to={destination}
          >
            {destinationLabel}
          </Link>
          {profile && destination !== "/" && (
            <Link
              className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
              to="/"
            >
              Public home
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export default NotFoundPage;
