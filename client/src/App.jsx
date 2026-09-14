import AppRoutes from "./routes/AppRoutes.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import { UserPreferencesProvider } from "./contexts/UserPreferencesContext.jsx";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <AppRoutes />
        </UserPreferencesProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
