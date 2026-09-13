import { Suspense, useCallback, useId, useState, useSyncExternalStore } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MobileNavigationDrawer from "./MobileNavigationDrawer.jsx";
import RoleSidebar from "./RoleSidebar.jsx";
import TopUtilityHeader from "./TopUtilityHeader.jsx";
import WorkspaceRouteLoading from "./WorkspaceRouteLoading.jsx";

function subscribeDesktop(callback) {
  const media = window.matchMedia("(min-width: 1200px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const desktopSnapshot = () => window.matchMedia("(min-width: 1200px)").matches;
const serverSnapshot = () => false;

export default function AuthenticatedShell({ role }) {
  const { pathname, key: locationKey } = useLocation();
  const desktop = useSyncExternalStore(subscribeDesktop, desktopSnapshot, serverSnapshot);
  const [preference, setPreference] = useState(null);
  const [learningPreference, setLearningPreference] = useState(null);
  const [drawerState, setDrawerState] = useState({ key: locationKey, open: false });
  const drawerOpen = drawerState.key === locationKey && drawerState.open;
  if (drawerState.key !== locationKey) setDrawerState({ key: locationKey, open: false });
  const drawerId = useId();
  const learning = role === "Student" && /^\/student\/courses\/[^/]+\/?$/.test(pathname);
  const expanded = learning ? learningPreference?.path === pathname && learningPreference.expanded : preference ?? desktop;
  const closeDrawer = useCallback(() => setDrawerState((state) => ({ ...state, open: false })), []);

  return (
    <div className="ph-role-shell flex min-h-dvh" data-expanded={Boolean(expanded)}>
      <a className="fixed left-4 top-2 z-[60] -translate-y-24 rounded-lg bg-emerald-800 px-4 py-3 text-sm font-semibold text-white focus:translate-y-0" href="#role-workspace" inert={drawerOpen}>Skip to content</a>
      <aside className="ph-global-sidebar sticky top-0 z-40 hidden h-dvh shrink-0 flex-col border-r border-slate-200 bg-white md:flex" inert={drawerOpen}>
        <RoleSidebar expanded={Boolean(expanded)} role={role} onToggle={() => {
          if (learning) setLearningPreference({ path: pathname, expanded: !expanded });
          else setPreference(!expanded);
        }} />
      </aside>
      <div className="min-w-0 flex-1" inert={drawerOpen}>
        <TopUtilityHeader drawerId={drawerId} drawerOpen={drawerOpen} onOpenDrawer={() => setDrawerState({ key: locationKey, open: true })} role={role} />
        <main className="ph-role-workspace min-w-0" id="role-workspace" tabIndex={-1}><Suspense fallback={<WorkspaceRouteLoading role={role} />}><Outlet /></Suspense></main>
      </div>
      {drawerOpen && <MobileNavigationDrawer id={drawerId} onClose={closeDrawer} role={role} />}
    </div>
  );
}
