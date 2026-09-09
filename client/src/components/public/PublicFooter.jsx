import { Link } from "react-router-dom";

const year = new Date().getFullYear();

function PublicFooter() {
  return (
    <footer className="scroll-mt-24 bg-slate-950 text-slate-300" id="contact">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link className="text-xl font-black text-white" to="/">
            Phinma<span className="text-emerald-400">Hub</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
            An accessible learning platform for PHINMA students and teachers.
          </p>
        </div>
        <div>
          <h2 className="font-black text-white">Platform</h2>
          <nav
            aria-label="Platform links"
            className="mt-4 flex flex-col gap-3 text-sm"
          >
            <Link className="hover:text-emerald-300" to="/">
              Home
            </Link>
            <Link className="hover:text-emerald-300" to="/courses">
              Courses
            </Link>
            <Link className="hover:text-emerald-300" to="/choose-role">
              Login or Register
            </Link>
          </nav>
        </div>
        <div>
          <h2 className="font-black text-white">Learning resources</h2>
          <nav
            aria-label="Learning resource links"
            className="mt-4 flex flex-col gap-3 text-sm"
          >
            <a className="hover:text-emerald-300" href="/#study-tools">
              Study Tools
            </a>
            <Link className="hover:text-emerald-300" to="/courses">
              Programming Lessons
            </Link>
            <Link className="hover:text-emerald-300" to="/courses">
              Practice Activities
            </Link>
          </nav>
        </div>
        <div>
          <h2 className="font-black text-white">Contact</h2>
          <address className="mt-4 space-y-2 text-sm not-italic text-slate-400">
            <p>PHINMA campus support office</p>
            <p>Email: support@example.edu</p>
            <p>Phone: (000) 000-0000</p>
            <p className="text-xs">Contact details are placeholders.</p>
          </address>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© {year} PhinmaHub. All rights reserved.</p>
          <div className="flex gap-5">
            <span>Privacy Policy</span>
            <span>Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
