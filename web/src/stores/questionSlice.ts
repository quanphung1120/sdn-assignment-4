import { createSlice, createAsyncThunk, isPending, isRejected } from "@reduxjs/toolkit"
import { apiFetch } from "../lib/api"

export interface Author {
  _id: string
  username: string
  isAdmin: boolean
}

export interface Question {
  _id: string
  text: string
  options: string[]
  keywords: string[]
  correctAnswerIndex: number
  author?: Author
}

interface QuestionState {
  questions: Question[]
  loading: boolean
  error: string | null
}

const initialState: QuestionState = {
  questions: [],
  loading: false,
  error: null,
}

export const fetchQuestionsThunk = createAsyncThunk<
  Question[],
  void,
  { rejectValue: string }
>("questions/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await apiFetch<Question[]>("/api/questions")
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Failed to fetch questions.")
  }
})

export const createQuestionThunk = createAsyncThunk<
  Question,
  { text: string; options: string[]; correctAnswerIndex: number; keywords: string[] },
  { rejectValue: string }
>("questions/create", async (payload, { rejectWithValue }) => {
  try {
    return await apiFetch<Question>("/api/questions", { method: "POST", body: payload })
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Failed to create question.")
  }
})

export const updateQuestionThunk = createAsyncThunk<
  Question,
  { id: string; text?: string; options?: string[]; correctAnswerIndex?: number; keywords?: string[] },
  { rejectValue: string }
>("questions/update", async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    return await apiFetch<Question>(`/api/questions/${id}`, { method: "PUT", body: payload })
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Failed to update question.")
  }
})

export const deleteQuestionThunk = createAsyncThunk<
  string, // Return ID of deleted question on success
  string, // Payload: question ID
  { rejectValue: string }
>("questions/delete", async (id, { rejectWithValue }) => {
  try {
    await apiFetch(`/api/questions/${id}`, { method: "DELETE" })
    return id
  } catch (err) {
    return rejectWithValue(err instanceof Error ? err.message : "Failed to delete question.")
  }
})

export const questionSlice = createSlice({
  name: "questions",
  initialState,
  reducers: {
    clearQuestionError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestionsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.questions = action.payload
      })
      .addCase(createQuestionThunk.fulfilled, (state, action) => {
        state.loading = false
        state.questions.push(action.payload)
      })
      .addCase(updateQuestionThunk.fulfilled, (state, action) => {
        state.loading = false
        const index = state.questions.findIndex((q) => q._id === action.payload._id)
        if (index !== -1) {
          state.questions[index] = action.payload
        }
      })
      .addCase(deleteQuestionThunk.fulfilled, (state, action) => {
        state.loading = false
        state.questions = state.questions.filter((q) => q._id !== action.payload)
      })
      .addMatcher(
        isPending(fetchQuestionsThunk, createQuestionThunk, updateQuestionThunk, deleteQuestionThunk),
        (state) => {
          state.loading = true
          state.error = null
        },
      )
      .addMatcher(
        isRejected(fetchQuestionsThunk, createQuestionThunk, updateQuestionThunk, deleteQuestionThunk),
        (state, action) => {
          state.loading = false
          state.error = action.payload ?? "Something went wrong."
        },
      )
  },
})

export const { clearQuestionError } = questionSlice.actions
export default questionSlice.reducer
