import CallToAction from "../../components/public/CallToAction.jsx";
import FeatureSection from "../../components/public/FeatureSection.jsx";
import HeroSection from "../../components/public/HeroSection.jsx";
import PopularCourses from "../../components/public/PopularCourses.jsx";
import PublicFooter from "../../components/public/PublicFooter.jsx";
import PublicNavbar from "../../components/public/PublicNavbar.jsx";
import RoleSection from "../../components/public/RoleSection.jsx";
import StatsSection from "../../components/public/StatsSection.jsx";
import StudyToolsPreview from "../../components/public/StudyToolsPreview.jsx";

function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <PublicNavbar />
      <main>
        <HeroSection />
        <StatsSection />
        <RoleSection />
        <FeatureSection />
        <PopularCourses />
        <StudyToolsPreview />
        <CallToAction />
      </main>
      <PublicFooter />
    </div>
  );
}

export default LandingPage;
