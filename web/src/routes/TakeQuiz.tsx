import { useEffect, useMemo, useState } from "react"
import { Container, Card, Form, Button, Alert, Modal, Table, Badge } from "react-bootstrap"
import { useNavigate, useParams } from "react-router"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "../store"
import { fetchQuizByIdThunk, clearCurrentQuiz } from "../stores/quizSlice"
import type { Question } from "../stores/questionSlice"
import { useRequireAuth } from "../hooks/useRequireAuth"

export function TakeQuiz() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const currentUser = useRequireAuth()
  const { current, loading, error } = useSelector((state: RootState) => state.quizzes)

  const [phase, setPhase] = useState<"doing" | "result">("doing")
  const [showSummary, setShowSummary] = useState(false)
  // questionId -> selected option index
  const [answers, setAnswers] = useState<Record<string, number>>({})

  useEffect(() => {
    if (id) {
      dispatch(fetchQuizByIdThunk(id))
    }
    return () => {
      dispatch(clearCurrentQuiz())
    }
  }, [dispatch, id])

  // Drop any dangling refs (questions deleted after being added to the quiz)
  const questions: Question[] = useMemo(
    () => (current?.questions ?? []).filter(Boolean),
    [current],
  )

  const score = useMemo(
    () =>
      questions.reduce(
        (acc, q) => acc + (answers[q._id] === q.correctAnswerIndex ? 1 : 0),
        0,
      ),
    [questions, answers],
  )

  if (!currentUser) return null

  const handleSelect = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleRetake = () => {
    setAnswers({})
    setPhase("doing")
    window.scrollTo({ top: 0 })
  }

  const Header = (
    <Container className="py-4">
      <Button variant="outline-secondary" size="sm" onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </Button>
    </Container>
  )

  // Loading state
  if (loading && !current) {
    return (
      <div className="min-vh-100 bg-light">
        {Header}
        <div className="text-center py-5">
          <span className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading quiz...</p>
        </div>
      </div>
    )
  }

  // Error / not found state
  if (error || !current) {
    return (
      <div className="min-vh-100 bg-light">
        {Header}
        <Container>
          <Alert variant="danger">{error ?? "Quiz not found."}</Alert>
        </Container>
      </div>
    )
  }

  // Quiz with no usable questions
  if (questions.length === 0) {
    return (
      <div className="min-vh-100 bg-light">
        {Header}
        <Container>
          <h2 className="fw-bold mb-3">{current.title}</h2>
          <Alert variant="warning">This quiz has no questions yet.</Alert>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-vh-100 bg-light">
      {Header}
      <Container className="pb-5">
        <h2 className="fw-bold mb-1">{current.title}</h2>
        {current.description && <p className="text-muted">{current.description}</p>}

        {phase === "doing" ? (
          <>
            {questions.map((q, qIdx) => (
              <Card key={q._id} className="mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title className="fs-6 fw-semibold">
                    {qIdx + 1}. {q.text}
                  </Card.Title>
                  <div className="mt-3">
                    {q.options.map((option, optIdx) => (
                      <Form.Check
                        key={optIdx}
                        type="radio"
                        name={`q-${q._id}`}
                        id={`q-${q._id}-opt-${optIdx}`}
                        className="mb-2"
                        label={option}
                        checked={answers[q._id] === optIdx}
                        onChange={() => handleSelect(q._id, optIdx)}
                      />
                    ))}
                  </div>
                </Card.Body>
              </Card>
            ))}

            <div className="d-flex justify-content-end mt-4">
              <Button variant="primary" size="lg" onClick={() => setShowSummary(true)}>
                Submit
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Result */}
            <Card className="mb-4 shadow-sm text-center">
              <Card.Body>
                <Card.Title className="fw-bold">Your Result</Card.Title>
                <p className="display-5 fw-bold text-primary mb-0">
                  {score} / {questions.length}
                </p>
                <p className="text-muted">
                  {Math.round((score / questions.length) * 100)}% correct
                </p>
              </Card.Body>
            </Card>

            {questions.map((q, qIdx) => {
              const selected = answers[q._id]
              const answered = selected !== undefined
              return (
                <Card key={q._id} className="mb-3 shadow-sm">
                  <Card.Body>
                    <Card.Title className="fs-6 fw-semibold">
                      {qIdx + 1}. {q.text}{" "}
                      {answered && selected === q.correctAnswerIndex ? (
                        <Badge bg="success" className="ms-1">Correct</Badge>
                      ) : (
                        <Badge bg="danger" className="ms-1">Incorrect</Badge>
                      )}
                    </Card.Title>
                    <ol className="mb-0 ps-3 mt-2">
                      {q.options.map((option, optIdx) => {
                        const isCorrect = optIdx === q.correctAnswerIndex
                        const isUserWrong = answered && selected === optIdx && !isCorrect
                        let className = "text-muted"
                        if (isCorrect) className = "text-success fw-bold"
                        else if (isUserWrong) className = "text-danger fw-bold"
                        return (
                          <li key={optIdx} className={className}>
                            {option}
                            {isCorrect && <Badge bg="success" className="ms-2 small">Correct answer</Badge>}
                            {isUserWrong && <Badge bg="danger" className="ms-2 small">Your answer</Badge>}
                          </li>
                        )
                      })}
                    </ol>
                    {!answered && (
                      <p className="text-danger small mb-0 mt-2">Not answered</p>
                    )}
                  </Card.Body>
                </Card>
              )
            })}

            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button variant="primary" onClick={handleRetake}>
                Retake Quiz
              </Button>
            </div>
          </>
        )}
      </Container>

      {/* Summary Modal — shown after first Submit */}
      <Modal show={showSummary} onHide={() => setShowSummary(false)} backdrop="static" centered>
        <Modal.Header closeButton>
          <Modal.Title>Submission Summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small">
            Review the status of each question before submitting your final answers.
          </p>
          <div className="table-responsive" style={{ maxHeight: 360, overflowY: "auto" }}>
            <Table hover className="mb-0 align-middle">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: "12%" }}>#</th>
                  <th>Question</th>
                  <th style={{ width: "25%" }} className="text-end">Status</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, qIdx) => {
                  const done = answers[q._id] !== undefined
                  return (
                    <tr key={q._id}>
                      <td>{qIdx + 1}</td>
                      <td className="text-wrap">
                        {q.text.length > 60 ? `${q.text.slice(0, 60)}...` : q.text}
                      </td>
                      <td className="text-end">
                        {done ? (
                          <Badge bg="success">Done</Badge>
                        ) : (
                          <Badge bg="secondary">Not done</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSummary(false)}>
            Back
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowSummary(false)
              setPhase("result")
              window.scrollTo({ top: 0 })
            }}
          >
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default TakeQuiz
