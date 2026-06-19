import { createSlice, createAsyncThunk, isPending, isRejected } from "@reduxjs/toolkit"
import { apiFetch } from "../lib/api"

export interface User {
  id: string
  username: string
  isAdmin: boolean
}

interface AuthState {
  currentUser: User | null
  loading: boolean
  error: string | null
}

const getInitialUser = (): User | null => {
  try {
    const stored = localStorage.getItem("currentUser")
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const initialState: AuthState = {
  currentUser: getInitialUser(),
  loading: false,
  error: null,
}

export const loginThunk = createAsyncThunk<
  User,
  { username: string; password: string },
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const data = await apiFetch<{ user: User }>("/api/auth/login", { method: "POST", body: credentials })
    return data.user
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Invalid username or password.")
  }
})

// Registration creates the account only — it does not start a session, so it
// returns nothing and the user must log in afterward.
export const registerThunk = createAsyncThunk<
  void,
  { username: string; password: string; isAdmin: boolean },
  { rejectValue: string }
>("auth/register", async (payload, { rejectWithValue }) => {
  try {
    await apiFetch("/api/auth/register", { method: "POST", body: payload })
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Registration failed. Please try again.")
  }
})

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.currentUser = null
      state.error = null
      localStorage.removeItem("currentUser")
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.currentUser = action.payload
        localStorage.setItem("currentUser", JSON.stringify(action.payload))
      })
      // Registration does not log the user in — just clear the loading flag.
      .addCase(registerThunk.fulfilled, (state) => {
        state.loading = false
      })
      .addMatcher(isPending(loginThunk, registerThunk), (state) => {
        state.loading = true
        state.error = null
      })
      .addMatcher(isRejected(loginThunk, registerThunk), (state, action) => {
        state.loading = false
        state.error = action.payload ?? "Something went wrong."
      })
  },
})

export const { logoutUser, clearError } = authSlice.actions
export default authSlice.reducer
