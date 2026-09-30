import React, { useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";

export default function AuthBootstrap({ children }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return children;
}
