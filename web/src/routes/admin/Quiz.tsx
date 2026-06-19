import { useEffect, useState } from "react"
import { Container, Table, Button, Modal, Form, Alert, Badge } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import { Formik } from "formik"
import * as Yup from "yup"
import type { AppDispatch, RootState } from "../../store"
import { fetchQuestionsThunk } from "../../stores/questionSlice"
import {
  fetchQuizzesThunk,
  createQuizThunk,
  updateQuizThunk,
  deleteQuizThunk,
  clearQuizError,
} from "../../stores/quizSlice"
import type { QuizListItem } from "../../stores/quizSlice"

interface FormValues {
  title: string
  description: string
  questionIds: string[]
}

// Validation Schema using Yup (mirrors the server-side Zod schema)
const quizValidationSchema = Yup.object().shape({
  title: Yup.string().trim().required("Title is required"),
  description: Yup.string(),
  questionIds: Yup.array()
    .of(Yup.string())
    .min(1, "Select at least one question"),
})

export function Quiz() {
  const dispatch = useDispatch<AppDispatch>()
  const { quizzes, loading, error } = useSelector((state: RootState) => state.quizzes)
  const questions = useSelector((state: RootState) => state.questions.questions)

  // Local State for modals
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<QuizListItem | null>(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchQuizzesThunk())
    dispatch(fetchQuestionsThunk())
    return () => {
      dispatch(clearQuizError())
    }
  }, [dispatch])

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingQuiz(null)
    dispatch(clearQuizError())
    setShowFormModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (quiz: QuizListItem) => {
    setEditingQuiz(quiz)
    dispatch(clearQuizError())
    setShowFormModal(true)
  }

  // Open Delete confirmation Modal
  const handleOpenDelete = (id: string) => {
    setDeletingQuizId(id)
    dispatch(clearQuizError())
    setShowDeleteModal(true)
  }

  // Handle Delete execution
  const handleDeleteConfirm = async () => {
    if (deletingQuizId) {
      const result = await dispatch(deleteQuizThunk(deletingQuizId))
      if (deleteQuizThunk.fulfilled.match(result)) {
        setShowDeleteModal(false)
        setDeletingQuizId(null)
      }
    }
  }

  // Form Initial Values
  const getInitialValues = (): FormValues => {
    if (editingQuiz) {
      return {
        title: editingQuiz.title,
        description: editingQuiz.description ?? "",
        // List items carry questions as ObjectId strings — perfect for pre-selecting.
        questionIds: [...editingQuiz.questions],
      }
    }
    return {
      title: "",
      description: "",
      questionIds: [],
    }
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Quizzes</h2>
        <Button variant="primary" onClick={handleOpenAdd}>
          Add Quiz
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => dispatch(clearQuizError())} dismissible>{error}</Alert>}

      {loading && quizzes.length === 0 ? (
        <div className="text-center py-5">
          <span className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading quizzes...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted mb-0">No quizzes found. Click "Add Quiz" to create one.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table hover className="mb-0 align-middle">
            <thead className="table-dark">
              <tr>
                <th style={{ width: "30%" }}>Title</th>
                <th style={{ width: "35%" }}>Description</th>
                <th style={{ width: "10%" }}>Questions</th>
                <th style={{ width: "10%" }}>Author</th>
                <th style={{ width: "15%" }} className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz: QuizListItem) => (
                <tr key={quiz._id}>
                  <td className="fw-semibold text-wrap">{quiz.title}</td>
                  <td className="text-wrap">
                    {quiz.description ? quiz.description : <span className="text-muted small">-</span>}
                  </td>
                  <td>
                    <Badge bg="info">{quiz.questions.length}</Badge>
                  </td>
                  <td>
                    <span className="small">{quiz.author?.username || "Unknown"}</span>
                  </td>
                  <td className="text-end">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleOpenEdit(quiz)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleOpenDelete(quiz._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{editingQuiz ? "Edit Quiz" : "Add Quiz"}</Modal.Title>
        </Modal.Header>
        <Formik<FormValues>
          initialValues={getInitialValues()}
          validationSchema={quizValidationSchema}
          enableReinitialize
          onSubmit={async (values, { setSubmitting }) => {
            const payload = {
              title: values.title.trim(),
              description: values.description.trim(),
              questions: values.questionIds,
            }

            let result
            if (editingQuiz) {
              result = await dispatch(updateQuizThunk({ id: editingQuiz._id, ...payload }))
            } else {
              result = await dispatch(createQuizThunk(payload))
            }

            if (
              createQuizThunk.fulfilled.match(result) ||
              updateQuizThunk.fulfilled.match(result)
            ) {
              setShowFormModal(false)
            }
            setSubmitting(false)
          }}
        >
          {({ handleSubmit, handleChange, handleBlur, values, touched, errors, isSubmitting, setFieldValue }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form.Group className="mb-3" controlId="formQuizTitle">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="Enter quiz title"
                    value={values.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.title && !!errors.title}
                  />
                  <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formQuizDescription">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    placeholder="Optional description"
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Questions{" "}
                    <span className="text-muted small">({values.questionIds.length} selected)</span>
                  </Form.Label>
                  {questions.length === 0 ? (
                    <p className="text-muted small mb-0">
                      No questions in the bank yet. Create questions first.
                    </p>
                  ) : (
                    <div
                      className="border rounded p-2"
                      style={{ maxHeight: 300, overflowY: "auto" }}
                    >
                      {questions.map((q) => (
                        <Form.Check
                          key={q._id}
                          type="checkbox"
                          id={`question-${q._id}`}
                          className="mb-1"
                          label={q.text.length > 80 ? `${q.text.slice(0, 80)}...` : q.text}
                          checked={values.questionIds.includes(q._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFieldValue("questionIds", [...values.questionIds, q._id])
                            } else {
                              setFieldValue(
                                "questionIds",
                                values.questionIds.filter((id) => id !== q._id),
                              )
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {typeof errors.questionIds === "string" && touched.questionIds && (
                    <div className="text-danger small mt-1">{errors.questionIds}</div>
                  )}
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowFormModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} backdrop="static" centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          Are you sure you want to permanently delete this quiz? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete Quiz"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Quiz
