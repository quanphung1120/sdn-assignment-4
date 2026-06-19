import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { Provider } from "react-redux"

import "bootstrap/dist/css/bootstrap.min.css"
import "./index.css"
import Login from "./routes/Login.tsx"
import Register from "./routes/Register.tsx"
import Dashboard from "./routes/Dashboard.tsx"
import TakeQuiz from "./routes/TakeQuiz.tsx"
import AdminLayout from "./components/AdminLayout.tsx"
import Question from "./routes/admin/Question.tsx"
import Quiz from "./routes/admin/Quiz.tsx"
import { store } from "./store.ts"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/quiz/:id" element={<TakeQuiz />} />
          <Route path="/admin" element={<Navigate to="/admin/question" replace />} />
          <Route
            path="/admin/question"
            element={
              <AdminLayout>
                <Question />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/quiz"
            element={
              <AdminLayout>
                <Quiz />
              </AdminLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  </StrictMode>
)
