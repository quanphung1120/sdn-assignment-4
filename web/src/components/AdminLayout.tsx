import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate, useLocation } from "react-router"
import { Navbar, Container, Nav, Button } from "react-bootstrap"
import type { RootState } from "../store"
import { logoutUser } from "../stores/authSlice"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const currentUser = useSelector((state: RootState) => state.auth.currentUser)

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
    } else if (!currentUser.isAdmin) {
      navigate("/dashboard")
    }
  }, [currentUser, navigate])

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate("/login")
  }

  if (!currentUser || !currentUser.isAdmin) {
    return null
  }

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Admin Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand
            onClick={() => navigate("/dashboard")}
            style={{ cursor: "pointer" }}
            className="text-info"
          >
            Quiz System
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-navbar-nav" />
          <Navbar.Collapse id="admin-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link
                onClick={() => navigate("/admin/quiz")}
                active={location.pathname === "/admin/quiz"}
                style={{ cursor: "pointer" }}
              >
                Quiz
              </Nav.Link>
              <Nav.Link
                onClick={() => navigate("/admin/question")}
                active={location.pathname === "/admin/question" || location.pathname === "/admin"}
                style={{ cursor: "pointer" }}
              >
                Question
              </Nav.Link>
            </Nav>
            <Nav className="align-items-center gap-2 ms-auto">
              <span className="text-white-50 small me-2">
                Hello, <span className="text-light">{currentUser.username}</span>
              </span>
              <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Content */}
      <main style={{ flexGrow: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white-50 py-3 text-center mt-auto">
        <Container>
          <small>SDN302 Assignment 4 &copy; {new Date().getFullYear()}</small>
        </Container>
      </footer>
    </div>
  )
}

export default AdminLayout
