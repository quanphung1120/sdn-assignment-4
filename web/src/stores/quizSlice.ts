import { createSlice, createAsyncThunk, isPending, isRejected } from "@reduxjs/toolkit"
import { apiFetch } from "../lib/api"
import type { Author, Question } from "./questionSlice"

// List view: questions come back as ObjectId strings (used for counts).
export interface QuizListItem {
  _id: string
  title: string
  description?: string
  author?: Author
  questions: string[]
}

// Detail view: questions are fully populated (used for taking the quiz).
export interface QuizDetail {
  _id: string
  title: string
  description?: string
  author?: Author
  questions: Question[]
}

interface QuizState {
  quizzes: QuizListItem[]
  current: QuizDetail | null
  loading: boolean
  error: string | null
}

const initialState: QuizState = {
  quizzes: [],
  current: null,
  loading: false,
  error: null,
}

export const fetchQuizzesThunk = createAsyncThunk<
  QuizListItem[],
  void,
  { rejectValue: string }
>("quizzes/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await apiFetch<QuizListItem[]>("/api/quizzes")
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Failed to fetch quizzes.")
  }
})

export const fetchQuizByIdThunk = createAsyncThunk<
  QuizDetail,
  string,
  { rejectValue: string }
>("quizzes/fetchById", async (id, { rejectWithValue }) => {
  try {
    return await apiFetch<QuizDetail>(`/api/quizzes/${id}`)
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Failed to fetch the quiz.")
  }
})

export const createQuizThunk = createAsyncThunk<
  QuizListItem,
  { title: string; description: string; questions: string[] },
  { rejectValue: string }
>("quizzes/create", async (payload, { rejectWithValue }) => {
  try {
    return await apiFetch<QuizListItem>("/api/quizzes", { method: "POST", body: payload })
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Failed to create the quiz.")
  }
})

export const updateQuizThunk = createAsyncThunk<
  QuizListItem,
  { id: string; title?: string; description?: string; questions?: string[] },
  { rejectValue: string }
>("quizzes/update", async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    return await apiFetch<QuizListItem>(`/api/quizzes/${id}`, { method: "PUT", body: payload })
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Failed to update the quiz.")
  }
})

export const deleteQuizThunk = createAsyncThunk<
  string, // Return ID of deleted quiz on success
  string, // Payload: quiz ID
  { rejectValue: string }
>("quizzes/delete", async (id, { rejectWithValue }) => {
  try {
    await apiFetch(`/api/quizzes/${id}`, { method: "DELETE" })
    return id
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Failed to delete the quiz.")
  }
})

const quizThunks = [
  fetchQuizzesThunk,
  fetchQuizByIdThunk,
  createQuizThunk,
  updateQuizThunk,
  deleteQuizThunk,
] as const

export const quizSlice = createSlice({
  name: "quizzes",
  initialState,
  reducers: {
    clearQuizError: (state) => {
      state.error = null
    },
    clearCurrentQuiz: (state) => {
      state.current = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizzesThunk.fulfilled, (state, action) => {
        state.loading = false
        state.quizzes = action.payload
      })
      .addCase(fetchQuizByIdThunk.pending, (state) => {
        state.current = null
      })
      .addCase(fetchQuizByIdThunk.fulfilled, (state, action) => {
        state.loading = false
        state.current = action.payload
      })
      .addCase(createQuizThunk.fulfilled, (state, action) => {
        state.loading = false
        state.quizzes.push(action.payload)
      })
      .addCase(updateQuizThunk.fulfilled, (state, action) => {
        state.loading = false
        const index = state.quizzes.findIndex((q) => q._id === action.payload._id)
        if (index !== -1) {
          state.quizzes[index] = action.payload
        }
      })
      .addCase(deleteQuizThunk.fulfilled, (state, action) => {
        state.loading = false
        state.quizzes = state.quizzes.filter((q) => q._id !== action.payload)
      })
      .addMatcher(isPending(...quizThunks), (state) => {
        state.loading = true
        state.error = null
      })
      .addMatcher(isRejected(...quizThunks), (state, action) => {
        state.loading = false
        state.error = action.payload ?? "Something went wrong."
      })
  },
})

export const { clearQuizError, clearCurrentQuiz } = quizSlice.actions
export default quizSlice.reducer
