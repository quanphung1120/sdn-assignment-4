import { useEffect } from "react"
import { Navbar, Container, Nav, Button, Row, Col, Card, Badge, Alert } from "react-bootstrap"
import { useNavigate } from "react-router"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "../store"
import { logoutUser } from "../stores/authSlice"
import { fetchQuizzesThunk, clearQuizError } from "../stores/quizSlice"
import type { QuizListItem } from "../stores/quizSlice"
import { useRequireAuth } from "../hooks/useRequireAuth"

export function Dashboard() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const currentUser = useRequireAuth()
  const { quizzes, loading, error } = useSelector((state: RootState) => state.quizzes)

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchQuizzesThunk())
    }
    return () => {
      dispatch(clearQuizError())
    }
  }, [dispatch, currentUser])

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate("/login")
  }

  if (!currentUser) return null

  return (
    <div className="min-vh-100 bg-light">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>Quiz Management System</Navbar.Brand>
          <Navbar.Toggle aria-controls="dashboard-nav" />
          <Navbar.Collapse id="dashboard-nav" className="justify-content-end">
            <Nav className="align-items-center gap-2">
              {currentUser && (
                <span className="text-white-50 small me-2">
                  Hello, <span className="text-light">{currentUser.username}</span>
                </span>
              )}
              {currentUser?.isAdmin && (
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => navigate("/admin/question")}
                  className="me-2"
                >
                  Admin Panel
                </Button>
              )}
              <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="py-4">
        <h2 className="fw-bold mb-4">Available Quizzes</h2>

        {error && (
          <Alert variant="danger" onClose={() => dispatch(clearQuizError())} dismissible>
            {error}
          </Alert>
        )}

        {loading && quizzes.length === 0 ? (
          <div className="text-center py-5">
            <span className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted mb-0">No quizzes available yet. Check back later.</p>
          </div>
        ) : (
          <Row className="g-4">
            {quizzes.map((quiz: QuizListItem) => {
              const count = quiz.questions.length
              return (
                <Col key={quiz._id} xs={12} md={6} lg={4}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="fw-bold">{quiz.title}</Card.Title>
                      <Card.Text className="text-muted flex-grow-1">
                        {quiz.description ? quiz.description : "No description provided."}
                      </Card.Text>
                      <div className="d-flex align-items-center justify-content-between mt-3">
                        <Badge bg="info">{count} {count === 1 ? "question" : "questions"}</Badge>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={count === 0}
                          onClick={() => navigate(`/quiz/${quiz._id}`)}
                        >
                          Start Quiz
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}
      </Container>
    </div>
  )
}

export default Dashboard
