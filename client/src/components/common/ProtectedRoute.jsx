import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";
import { getProfileDestination } from "../../utils/auth.js";
import Loading from "./Loading.jsx";

function ProtectedRoute({ children, stage, requiredRole }) {
  const { accessDenied, loading, profile, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loading label="Checking your account..." />
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to={
          accessDenied
            ? "/unauthorized"
            : requiredRole === "admin"
              ? "/admin/login"
              : "/login"
        }
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const destination = getProfileDestination(profile);
  const expectedDestination = requiredRole ? `/${requiredRole}` : `/${stage}`;

  if (destination !== expectedDestination) {
    const deniedDestination =
      profile?.account_status === "active" ? "/unauthorized" : destination;
    return <Navigate to={deniedDestination} replace />;
  }

  return children;
}

export default ProtectedRoute;
