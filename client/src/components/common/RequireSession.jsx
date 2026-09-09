import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";
import Loading from "./Loading.jsx";

function RequireSession({ children }) {
  const { accessDenied, loading, session } = useAuth();
  const location = useLocation();

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center">
        <Loading label="Checking your session..." />
      </div>
    );
  if (!session) {
    return (
      <Navigate
        to={accessDenied ? "/unauthorized" : "/choose-role"}
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  return children;
}

export default RequireSession;
