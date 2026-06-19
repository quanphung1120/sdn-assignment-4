import { useEffect } from "react"
import { Container, Card, Form, Button, Alert } from "react-bootstrap"
import { useNavigate } from "react-router"
import { useDispatch, useSelector } from "react-redux"
import { registerThunk, clearError } from "../stores/authSlice"
import type { AppDispatch, RootState } from "../store"
import { Formik } from "formik"
import * as Yup from "yup"

const registerSchema = Yup.object().shape({
  username: Yup.string().trim().required("Username is required"),
  password: Yup.string().min(8, "Password must be at least 8 characters long").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm password is required"),
  isAdmin: Yup.boolean(),
})

export function Register() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { error } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-5">
      <Container className="d-flex justify-content-center">
        <Card className="p-4 shadow-sm" style={{ maxWidth: "480px", width: "100%" }}>
          <Card.Body>
            <h2 className="text-center fw-bold mb-4 text-primary">Register Account</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Formik
              initialValues={{ username: "", password: "", confirmPassword: "", isAdmin: false }}
              validationSchema={registerSchema}
              onSubmit={async (values, { setFieldError, setSubmitting }) => {
                const result = await dispatch(
                  registerThunk({
                    username: values.username.trim(),
                    password: values.password,
                    isAdmin: values.isAdmin,
                  }),
                )

                if (registerThunk.fulfilled.match(result)) {
                  navigate("/login", { state: { message: "Account created. Please log in." } })
                } else if (registerThunk.rejected.match(result)) {
                  const msg = result.payload ?? ""
                  if (msg.toLowerCase().includes("username")) {
                    setFieldError("username", msg)
                  }
                }

                setSubmitting(false)
              }}
            >
              {({ handleSubmit, handleChange, handleBlur, values, touched, errors, isSubmitting }) => (
                <Form noValidate onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="registerUsername">
                    <Form.Label className="fw-semibold">Username</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      placeholder="Enter username"
                      value={values.username}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.username && !!errors.username}
                      isValid={touched.username && !errors.username}
                    />
                    <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="registerPassword">
                    <Form.Label className="fw-semibold">Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Enter password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.password && !!errors.password}
                      isValid={touched.password && !errors.password}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                    <Form.Text className="text-muted">Must be at least 8 characters long.</Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="registerConfirmPassword">
                    <Form.Label className="fw-semibold">Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                      isValid={touched.confirmPassword && !errors.confirmPassword}
                    />
                    <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="registerIsAdmin">
                    <Form.Check
                      type="checkbox"
                      name="isAdmin"
                      label="Register as Admin"
                      checked={values.isAdmin}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button variant="primary" type="submit" className="py-2 fw-semibold" disabled={isSubmitting}>
                      {isSubmitting ? "Registering..." : "Register"}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>

            <div className="text-center mt-3">
              <span className="text-muted small">
                Already have an account?{" "}
                <span
                  className="text-primary fw-semibold"
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => navigate("/login")}
                >
                  Login here
                </span>
              </span>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}

export default Register
