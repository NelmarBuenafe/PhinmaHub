import { Outlet } from "react-router-dom";
import AdminTopbar from "./AdminTopbar.jsx";

function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminTopbar />
      <main className="ph-app-container py-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
