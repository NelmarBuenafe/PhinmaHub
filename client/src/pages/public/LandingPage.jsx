import {
  ArrowRight,
  Award,
  Check,
  ClipboardCheck,
  Database,
  GraduationCap,
  LayoutList,
  Library,
  Presentation,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import PopularCourses from "../../components/public/PopularCourses.jsx";
import PublicFooter from "../../components/public/PublicFooter.jsx";
import PublicNavbar from "../../components/public/PublicNavbar.jsx";

const roles = [
  {
    Icon: GraduationCap,
    title: "For Students",
    description:
      "Join your courses, follow structured lessons, complete assignments, and see what comes next.",
    items: [
      "Join courses",
      "Learn through structured lessons",
      "Complete assignments",
      "Track progress",
    ],
    action: "Continue as Student",
    className: "border-emerald-100 bg-[#f0faf5] text-slate-900",
    iconClassName: "bg-white text-emerald-700",
  },
  {
    Icon: Presentation,
    title: "For Teachers",
    description:
      "Create organized learning content and manage your classes from one workspace.",
    items: [
      "Create courses",
      "Manage lessons and materials",
      "Create and grade assignments",
      "Publish announcements",
    ],
    action: "Continue as Teacher",
    className: "border-slate-800 bg-slate-950 text-white",
    iconClassName: "bg-emerald-500 text-slate-950",
  },
];

const features = [
  [
    LayoutList,
    "Structured Learning",
    "Courses, Modules, Lessons, and Sections keep learning organized.",
  ],
  [
    Library,
    "Learning Materials",
    "Access documents, videos, and activities directly inside each lesson.",
  ],
  [
    ClipboardCheck,
    "Assignments",
    "Submit requirements and receive grades and feedback.",
  ],
  [
    Award,
    "Progress",
    "Know what is complete and what to continue next.",
  ],
];

function Eyebrow({ children, dark = false }) {
  return (
    <p className={`ph-landing-eyebrow ${dark ? "text-emerald-200" : "text-emerald-700"}`}>
      {children}
    </p>
  );
}

function ProgressCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_36px_-25px_rgba(15,23,42,.42)]">
      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-emerald-700">
        Continue Learning
      </p>
      <p className="mt-3 text-xs font-bold text-slate-500">IT201</p>
      <h2 className="mt-1 text-sm font-bold leading-5 text-slate-900">
        Web Application Development
      </h2>
      <div className="mt-4 flex justify-between text-xs text-slate-500">
        <span>Lesson Progress</span>
        <span className="font-bold text-emerald-700">68%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-[68%] rounded-full bg-emerald-600" />
      </div>
    </div>
  );
}

function TechIcon({ className, children, color = "text-slate-900" }) {
  return (
    <span
      aria-hidden="true"
      className={`ph-tech-icon absolute z-20 grid place-items-center border border-white/80 bg-white text-sm font-bold shadow-[0_12px_28px_-18px_rgba(15,23,42,.45)] ${className} ${color}`}
    >
      {children}
    </span>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#fbfefc]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_87%_38%,rgba(201,240,220,.58),transparent_32%),linear-gradient(105deg,#fff_0%,#fff_42%,#effaf5_100%)]" />
      <div className="relative mx-auto grid min-h-[700px] max-w-7xl items-center gap-7 px-5 pb-10 pt-14 sm:px-8 lg:grid-cols-[.78fr_1.22fr] lg:px-8 lg:py-16">
        <div className="relative z-10">
          <Eyebrow>
            PHINMAHUB <span className="px-1 text-emerald-400">•</span> CONNECTED LEARNING
          </Eyebrow>
          <h1 className="ph-landing-display mt-5 text-[clamp(3.2rem,5.4vw,4.4rem)] leading-[.99] text-slate-950">
            Learn.<br />
            Build.<br />
            <span className="text-emerald-700">Progress.</span>
          </h1>
          <p className="mt-6 max-w-lg text-[16px] leading-7 text-slate-600">
            Courses, lessons, learning materials, assignments, and progress — all in one organized learning space.
          </p>
          <p className="mt-3 max-w-lg text-[15px] leading-6 text-slate-500">
            Designed for PHINMA students and teachers to learn, teach, and stay connected through one modern academic platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="ph-cta-primary" to="/choose-role">
              Get Started <ArrowRight size={17} />
            </Link>
            <Link className="ph-cta-secondary" to="/courses">Explore Courses</Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="text-emerald-700" size={16} />
            For authorized PHINMA students and teachers.
          </p>
        </div>

        <div className="relative mx-auto h-[370px] w-full max-w-[680px] sm:h-[510px] lg:h-[580px]">
          <div className="absolute inset-x-[6%] bottom-[5%] top-[5%] rounded-[47%_53%_43%_57%/40%_38%_62%_60%] bg-[#dff4e8]" />
          <div className="absolute left-[10%] top-[15%] size-44 rounded-full border border-emerald-200/60" />
          <div className="absolute right-[10%] top-[8%] h-48 w-48 rounded-full [background-image:radial-gradient(#82cca3_1px,transparent_1px)] [background-size:13px_13px] opacity-55" />
          <div className="absolute bottom-[15%] left-[15%] h-24 w-48 rounded-[100%] border border-emerald-200/60" />
          <img
            alt="PHINMA students using laptops for digital learning"
            className="absolute bottom-0 left-1/2 z-10 h-[95%] w-full -translate-x-1/2 object-contain object-bottom"
            fetchPriority="high"
            src="/images/phinma-students-hero.png"
          />
          <div className="absolute bottom-[8%] left-[12%] z-30 hidden w-[205px] sm:block">
            <ProgressCard />
          </div>
          <TechIcon className="left-[5%] top-[29%] size-12 -rotate-12" color="text-[#3978b8]">Py</TechIcon>
          <TechIcon className="left-[40%] top-[2%] size-13 -rotate-12 text-base" color="text-[#9a7600]">JS</TechIcon>
          <TechIcon className="right-[4%] top-[17%] size-12 rotate-12 text-lg" color="text-[#d75437]">☕</TechIcon>
          <TechIcon className="bottom-[29%] left-[4%] size-12 rotate-6 text-xs" color="text-[#7b6ca8]">php</TechIcon>
          <TechIcon className="bottom-[27%] right-[3%] size-12 -rotate-6 text-xs" color="text-[#3570c7]">CSS</TechIcon>
          <TechIcon className="bottom-[10%] right-[23%] size-12 rotate-6" color="text-[#8066ad]"><Database size={21} /></TechIcon>
        </div>
      </div>
    </section>
  );
}

function RoleSection() {
  return (
    <section className="ph-section bg-white" id="about">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-8">
        <div className="max-w-xl">
          <Eyebrow>BUILT FOR YOUR ROLE</Eyebrow>
          <h2 className="ph-section-title mt-4">Designed for students<br />and teachers.</h2>
          <p className="ph-section-copy">One connected platform for learning, teaching, and managing course activity.</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {roles.map(({ Icon, title, description, items, action, className, iconClassName }) => (
            <article className={`rounded-2xl border p-6 sm:p-7 ${className}`} key={title}>
              <span className={`grid size-11 place-items-center rounded-xl ${iconClassName}`}><Icon size={21} /></span>
              <h3 className="ph-landing-card-title mt-5">{title}</h3>
              <p className={`mt-3 max-w-md text-sm leading-6 ${title === "For Teachers" ? "text-slate-300" : "text-slate-600"}`}>{description}</p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {items.map((item) => <li className={`flex items-center gap-2 text-xs font-medium ${title === "For Teachers" ? "text-slate-200" : "text-slate-600"}`} key={item}><Check className="shrink-0 text-emerald-500" size={15} />{item}</li>)}
              </ul>
              <Link className={`mt-7 inline-flex items-center gap-1 text-sm font-bold ${title === "For Teachers" ? "text-emerald-300" : "text-emerald-700"}`} to="/choose-role">{action} <ArrowRight size={16} /></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="ph-section bg-[#f8fafc]" id="features">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-8">
        <div className="max-w-xl">
          <Eyebrow>WHAT YOU NEED</Eyebrow>
          <h2 className="ph-section-title mt-4">Learning essentials,<br />all connected.</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([Icon, title, description]) => (
            <article className="border-t border-slate-200 pt-5" key={title}>
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={20} /></span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-emerald-700 px-5 py-16 text-center text-white sm:px-8 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <Eyebrow dark>PHINMAHUB</Eyebrow>
        <h2 className="ph-section-title mt-4 text-white">Ready to start learning?</h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-emerald-50">Access your courses, lessons, assignments, and progress in one connected learning space.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="ph-cta-white" to="/choose-role">Get Started <ArrowRight size={17} /></Link>
          <Link className="ph-cta-outline" to="/courses">Explore Courses</Link>
        </div>
      </div>
    </section>
  );
}

function LandingPage() {
  return (
    <div className="ph-landing min-h-screen overflow-x-hidden bg-white text-slate-900">
      <PublicNavbar />
      <main>
        <HeroSection />
        <RoleSection />
        <FeaturesSection />
        <PopularCourses />
        <FinalCta />
      </main>
      <PublicFooter />
    </div>
  );
}

export default LandingPage;
