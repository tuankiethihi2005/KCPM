import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function RequireRole({ allowedRoles, children }) {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
