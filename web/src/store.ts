import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./stores/authSlice"
import questionReducer from "./stores/questionSlice"
import quizReducer from "./stores/quizSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    questions: questionReducer,
    quizzes: quizReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch