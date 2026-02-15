import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "user" | "staff"; // If set, the user must have this role to access
}

// Wraps a route to enforce authentication and optional role-based access
// Usage: <ProtectedRoute requiredRole="staff"><AdminPage /></ProtectedRoute>
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  // Show a loading spinner while Firebase checks the session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Not logged in — redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but doesn't have the required role — redirect to home
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
