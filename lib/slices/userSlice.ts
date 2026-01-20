import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  id: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  organizationName: string | null;
  organizationLogo: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const USER_STORAGE_KEY = "cabipro_user_state";

// Load initial state from localStorage
const loadStateFromStorage = (): UserState => {
  if (typeof window === "undefined") {
    // Server-side: return default state
    return {
      id: null,
      email: null,
      firstName: null,
      lastName: null,
      photoUrl: null,
      organizationName: null,
      organizationLogo: null,
      isAdmin: false,
      isAuthenticated: false,
    };
  }

  try {
    const serializedState = localStorage.getItem(USER_STORAGE_KEY);
    if (serializedState === null) {
      return {
        id: null,
        email: null,
        firstName: null,
        lastName: null,
        photoUrl: null,
        organizationName: null,
        organizationLogo: null,
        isAdmin: false,
        isAuthenticated: false,
      };
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Error loading user state from localStorage:", error);
    return {
      id: null,
      email: null,
      firstName: null,
      lastName: null,
      photoUrl: null,
      organizationName: null,
      organizationLogo: null,
      isAdmin: false,
      isAuthenticated: false,
    };
  }
};

const initialState: UserState = loadStateFromStorage();

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<Omit<UserState, "isAuthenticated">>,
    ) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.photoUrl = action.payload.photoUrl;
      state.organizationName = action.payload.organizationName;
      state.organizationLogo = action.payload.organizationLogo;
      state.isAdmin = action.payload.isAdmin;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.id = null;
      state.email = null;
      state.firstName = null;
      state.lastName = null;
      state.photoUrl = null;
      state.organizationName = null;
      state.organizationLogo = null;
      state.isAdmin = false;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
