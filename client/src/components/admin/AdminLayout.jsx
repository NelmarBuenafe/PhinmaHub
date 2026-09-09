import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminTopbar from "./AdminTopbar.jsx";
import { adminApi } from "../../services/adminApi.js";

function AdminLayout() {
  const [drawer, setDrawer] = useState(false);
  const [badges, setBadges] = useState({});
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);
  useEffect(() => {
    adminApi
      .dashboard()
      .then(({ data }) =>
        setBadges({
          pending: data.summary.pendingApprovals,
          messages: data.summary.unreadMessages,
        }),
      )
      .catch(() => {});
  }, []);
  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <AdminSidebar
        badges={badges}
        onClose={() => setDrawer(false)}
        open={drawer}
      />
      <div className="min-w-0">
        <AdminTopbar onMenu={() => setDrawer(true)} />
        <main className="mx-auto max-w-[100rem] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default AdminLayout;
