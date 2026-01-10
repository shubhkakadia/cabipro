"use client";

import { useRouter } from "next/navigation";
import { useAppDispatch } from "./hooks";
import { clearUser } from "./slices/userSlice";

const USER_STORAGE_KEY = "cabipro_user_state";

/**
 * Custom hook for handling logout functionality
 * Clears user data from Redux store, localStorage, and calls logout API
 */
export function useLogout() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const logout = async (redirectTo: string = "/login") => {
    try {
      // Call logout API to clear server-side session
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Logout API error:", await response.text());
      }
    } catch (error) {
      console.error("Error calling logout API:", error);
    } finally {
      // Always clear client-side state regardless of API success
      // Clear Redux store
      dispatch(clearUser());
      
      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_STORAGE_KEY);
      }

      // Redirect to login page
      router.push(redirectTo);
      router.refresh();
    }
  };

  return { logout };
}

