import { configureStore } from "@reduxjs/toolkit";
import userReducer, { UserState } from "./slices/userSlice";

const USER_STORAGE_KEY = "cabipro_user_state";

/**
 * Save user state to localStorage
 */
const saveStateToStorage = (state: UserState) => {
  if (typeof window === "undefined") return;

  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(USER_STORAGE_KEY, serializedState);
  } catch (error) {
    console.error("Error saving user state to localStorage:", error);
  }
};

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      user: userReducer,
    },
    devTools: process.env.NODE_ENV !== "production",
  });

  // Subscribe to store changes and persist user state
  store.subscribe(() => {
    const state = store.getState();
    saveStateToStorage(state.user);
  });

  return store;
};

// Infer types from the store
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
