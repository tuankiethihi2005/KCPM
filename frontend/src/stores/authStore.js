import { create } from "zustand";
import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
} from "../services/auth/authService";

const defaultState = {
  accessToken: null,
  user: null,
  initialized: false,
  isAuthenticated: false,
  isRefreshing: false,
  sessionStatus: "unauthenticated",
};

let refreshPromise = null;

if (typeof window !== "undefined") {
  window.localStorage.removeItem("manga-auth-store");
}

export const useAuthStore = create((set, get) => ({
  ...defaultState,
  setSession: ({ accessToken, user }) =>
    set({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      sessionStatus: accessToken && user ? "authenticated" : "unauthenticated",
    }),
  clearSession: () =>
    set({
      ...defaultState,
      initialized: true,
    }),
  initializeAuth: async () => {
    const { accessToken } = get();

    if (accessToken) {
      try {
        const me = await meRequest(accessToken);
        set({
          user: me.user,
          isAuthenticated: true,
          initialized: true,
          sessionStatus: "authenticated",
        });
        return;
      } catch (error) {
        if (error.status !== 401) {
          set({ initialized: true, sessionStatus: "unauthenticated" });
          return;
        }
      }
    }

    try {
      await get().refreshSession();
      const currentAccessToken = get().accessToken;
      const me = await meRequest(currentAccessToken);
      set({
        user: me.user,
        isAuthenticated: true,
        initialized: true,
        sessionStatus: "authenticated",
      });
    } catch (refreshError) {
      get().clearSession();
    }
  },
  login: async ({ email, password }) => {
    set({ sessionStatus: "authenticating" });
    try {
      const result = await loginRequest({ email, password });
      set({
        accessToken: result.accessToken,
        user: result.user,
        isAuthenticated: true,
        initialized: true,
        sessionStatus: "authenticated",
      });
      return result;
    } catch (error) {
      set({ sessionStatus: "unauthenticated" });
      throw error;
    }
  },
  refreshSession: async () => {
    if (refreshPromise) {
      return refreshPromise;
    }

    set({ isRefreshing: true, sessionStatus: "refreshing" });

    refreshPromise = (async () => {
      const result = await refreshRequest();
      set({
        accessToken: result.accessToken,
        isAuthenticated: true,
        sessionStatus: "authenticated",
      });
      return result;
    })();

    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
      set({ isRefreshing: false });
    }
  },
  logout: async () => {
    set({ sessionStatus: "logging_out" });
    try {
      await logoutRequest();
    } finally {
      get().clearSession();
    }
  },
}));
