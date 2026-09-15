import AppRoutes from "./routes/AppRoutes.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { NotificationProvider } from "./contexts/NotificationContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import { UserPreferencesProvider } from "./contexts/UserPreferencesContext.jsx";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <UserPreferencesProvider>
            <AppRoutes />
          </UserPreferencesProvider>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
