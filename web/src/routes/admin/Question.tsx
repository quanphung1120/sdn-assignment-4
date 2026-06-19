import { useEffect, useState } from "react"
import { Container, Table, Button, Modal, Form, Alert, Badge } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import { Formik, FieldArray } from "formik"
import * as Yup from "yup"
import type { AppDispatch, RootState } from "../../store"
import {
  fetchQuestionsThunk,
  createQuestionThunk,
  updateQuestionThunk,
  deleteQuestionThunk,
  clearQuestionError,
} from "../../stores/questionSlice"
import type { Question as QuestionType } from "../../stores/questionSlice"

interface FormValues {
  text: string
  options: string[]
  correctAnswerIndex: number
  keywordsString: string
}

// Validation Schema using Yup
const questionValidationSchema = Yup.object().shape({
  text: Yup.string().trim().required("Question text is required"),
  options: Yup.array()
    .of(Yup.string().trim().required("Option content is required"))
    .min(2, "At least 2 options are required"),
  correctAnswerIndex: Yup.number()
    .integer()
    .required()
    .min(0)
    .test(
      "valid-index",
      "Correct answer index must correspond to an option",
      function (val) {
        const { options } = this.parent
        return val !== undefined && options && val < options.length
      }
    ),
  keywordsString: Yup.string(),
})

export function Question() {
  const dispatch = useDispatch<AppDispatch>()
  const { questions, loading, error } = useSelector((state: RootState) => state.questions)

  // Local State for modals
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionType | null>(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchQuestionsThunk())
    return () => {
      dispatch(clearQuestionError())
    }
  }, [dispatch])

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingQuestion(null)
    dispatch(clearQuestionError())
    setShowFormModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (question: QuestionType) => {
    setEditingQuestion(question)
    dispatch(clearQuestionError())
    setShowFormModal(true)
  }

  // Open Delete confirmation Modal
  const handleOpenDelete = (id: string) => {
    setDeletingQuestionId(id)
    dispatch(clearQuestionError())
    setShowDeleteModal(true)
  }

  // Handle Delete execution
  const handleDeleteConfirm = async () => {
    if (deletingQuestionId) {
      const result = await dispatch(deleteQuestionThunk(deletingQuestionId))
      if (deleteQuestionThunk.fulfilled.match(result)) {
        setShowDeleteModal(false)
        setDeletingQuestionId(null)
      }
    }
  }

  // Form Initial Values
  const getInitialValues = () => {
    if (editingQuestion) {
      return {
        text: editingQuestion.text,
        options: [...editingQuestion.options],
        correctAnswerIndex: editingQuestion.correctAnswerIndex,
        keywordsString: editingQuestion.keywords.join(", "),
      }
    }
    return {
      text: "",
      options: ["", ""],
      correctAnswerIndex: 0,
      keywordsString: "",
    }
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Question Bank</h2>
        <Button variant="primary" onClick={handleOpenAdd}>
          Add Question
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => dispatch(clearQuestionError())} dismissible>{error}</Alert>}

      {loading && questions.length === 0 ? (
        <div className="text-center py-5">
          <span className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted mb-0">No questions found. Click "Add Question" to create one.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table hover className="mb-0 align-middle">
            <thead className="table-dark">
              <tr>
                <th style={{ width: "35%" }}>Question</th>
                <th style={{ width: "30%" }}>Options</th>
                <th style={{ width: "15%" }}>Keywords</th>
                <th style={{ width: "10%" }}>Author</th>
                <th style={{ width: "10%" }} className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question: QuestionType) => (
                <tr key={question._id}>
                  <td className="fw-semibold text-wrap">{question.text}</td>
                  <td>
                    <ol className="mb-0 ps-3">
                      {question.options.map((option: string, idx: number) => {
                        const isCorrect = idx === question.correctAnswerIndex
                        return (
                          <li key={idx} className={isCorrect ? "text-success fw-bold" : "text-muted"}>
                            {option} {isCorrect && <Badge bg="success" className="ms-1 small">Correct</Badge>}
                          </li>
                        )
                      })}
                    </ol>
                  </td>
                  <td>
                    {question.keywords.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {question.keywords.map((kw: string, idx: number) => (
                          <Badge key={idx} bg="secondary" pill>
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted small">-</span>
                    )}
                  </td>
                  <td>
                    <span className="small">{question.author?.username || "Unknown"}</span>
                  </td>
                  <td className="text-end">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleOpenEdit(question)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleOpenDelete(question._id)}
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
          <Modal.Title>{editingQuestion ? "Edit Question" : "Add Question"}</Modal.Title>
        </Modal.Header>
        <Formik<FormValues>
          initialValues={getInitialValues()}
          validationSchema={questionValidationSchema}
          enableReinitialize
          onSubmit={async (values, { setSubmitting }) => {
            const keywords = values.keywordsString
              .split(",")
              .map((kw) => kw.trim())
              .filter(Boolean)

            const payload = {
              text: values.text.trim(),
              options: values.options.map((opt) => opt.trim()),
              correctAnswerIndex: Number(values.correctAnswerIndex),
              keywords,
            }

            let result
            if (editingQuestion) {
              result = await dispatch(updateQuestionThunk({ id: editingQuestion._id, ...payload }))
            } else {
              result = await dispatch(createQuestionThunk(payload))
            }

            if (
              createQuestionThunk.fulfilled.match(result) ||
              updateQuestionThunk.fulfilled.match(result)
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

                <Form.Group className="mb-3" controlId="formQuestionText">
                  <Form.Label>Question Text</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="text"
                    placeholder="Enter question text"
                    value={values.text}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.text && !!errors.text}
                  />
                  <Form.Control.Feedback type="invalid">{errors.text}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Options</Form.Label>
                  <FieldArray
                    name="options"
                    render={() => (
                      <div>
                        {values.options.map((option, idx) => (
                          <div key={idx} className="d-flex gap-2 mb-2 align-items-center">
                            <span className="text-muted" style={{ minWidth: "1.5rem" }}>{idx + 1}.</span>
                            <Form.Control
                              type="text"
                              name={`options.${idx}`}
                              placeholder={`Option ${idx + 1}`}
                              value={option}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              isInvalid={
                                Array.isArray(touched.options) &&
                                !!touched.options[idx] &&
                                Array.isArray(errors.options) &&
                                !!(errors.options as string[])[idx]
                              }
                            />
                            <Button
                              type="button"
                              variant="outline-danger"
                              size="sm"
                              disabled={values.options.length <= 2}
                              onClick={() => {
                                const newOptions = values.options.filter((_, i) => i !== idx)
                                setFieldValue("options", newOptions)
                                if (values.correctAnswerIndex >= newOptions.length) {
                                  setFieldValue("correctAnswerIndex", newOptions.length - 1)
                                }
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                        {typeof errors.options === "string" && (
                          <div className="text-danger small">{errors.options}</div>
                        )}
                        <Button
                          type="button"
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setFieldValue("options", [...values.options, ""])}
                        >
                          + Add Option
                        </Button>
                      </div>
                    )}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formCorrectAnswerIndex">
                  <Form.Label>Correct Answer</Form.Label>
                  <Form.Select
                    name="correctAnswerIndex"
                    value={values.correctAnswerIndex}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.correctAnswerIndex && !!errors.correctAnswerIndex}
                  >
                    {values.options.map((option, idx) => (
                      <option key={idx} value={idx}>
                        Option {idx + 1}{option.trim() ? ` – ${option.trim().substring(0, 30)}${option.trim().length > 30 ? "..." : ""}` : ""}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.correctAnswerIndex}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formKeywords">
                  <Form.Label>Keywords</Form.Label>
                  <Form.Control
                    type="text"
                    name="keywordsString"
                    placeholder="e.g. algebra, geometry, math"
                    value={values.keywordsString}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <Form.Text className="text-muted">Comma-separated.</Form.Text>
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
          <Modal.Title>Delete Question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          Are you sure you want to permanently delete this question? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete Question"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Question
