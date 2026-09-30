import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import Loading from "../../common/Loading/Loading";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!initialized) {
    return <Loading text="Dang khoi tao phien dang nhap..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
