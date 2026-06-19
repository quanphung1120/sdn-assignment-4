import { useEffect } from "react"
import { useNavigate } from "react-router"
import { useSelector } from "react-redux"
import type { RootState } from "../store"

/**
 * Client-side auth guard for protected pages: redirects to /login when no user
 * is authenticated. Returns the current user (null while the redirect runs), so
 * callers can `if (!user) return null`.
 */
export function useRequireAuth() {
  const navigate = useNavigate()
  const currentUser = useSelector((state: RootState) => state.auth.currentUser)

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
    }
  }, [currentUser, navigate])

  return currentUser
}
