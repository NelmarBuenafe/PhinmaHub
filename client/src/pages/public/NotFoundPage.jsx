import { Link } from "react-router-dom";

function NotFoundPage() {
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
        <Link
          className="mt-6 inline-block font-semibold text-emerald-700 hover:text-emerald-800"
          to="/"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}

export default NotFoundPage;
