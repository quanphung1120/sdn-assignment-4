import { Container, Card, Form, Button, Alert } from "react-bootstrap"
import { useNavigate, useLocation } from "react-router"
import { useDispatch, useSelector } from "react-redux"
import { loginThunk, clearError } from "../stores/authSlice"
import type { AppDispatch, RootState } from "../store"
import { Formik } from "formik"
import * as Yup from "yup"
import { useEffect } from "react"

const loginSchema = Yup.object().shape({
  username: Yup.string().trim().required("Username is required"),
  password: Yup.string().required("Password is required"),
})

export function Login() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const { error } = useSelector((state: RootState) => state.auth)

  // Success flash passed from registration (e.g. "Account created. Please log in.")
  const flash = (location.state as { message?: string } | null)?.message

  // Clear any stale error when landing on this page
  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-5">
      <Container className="d-flex justify-content-center">
        <Card className="p-4 shadow-sm" style={{ maxWidth: "440px", width: "100%" }}>
          <Card.Body>
            <h2 className="text-center fw-bold mb-4 text-primary">Login</h2>

            {flash && <Alert variant="success">{flash}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Formik
              initialValues={{ username: "", password: "" }}
              validationSchema={loginSchema}
              onSubmit={async (values, { setSubmitting }) => {
                const result = await dispatch(
                  loginThunk({
                    username: values.username.trim(),
                    password: values.password,
                  }),
                )
                if (loginThunk.fulfilled.match(result)) {
                  navigate("/dashboard")
                }
                setSubmitting(false)
              }}
            >
              {({ handleSubmit, handleChange, handleBlur, values, touched, errors, isSubmitting }) => (
                <Form noValidate onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="loginUsername">
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

                  <Form.Group className="mb-4" controlId="loginPassword">
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
                  </Form.Group>

                  <div className="d-grid gap-2 mb-3">
                    <Button variant="primary" type="submit" className="py-2 fw-semibold" disabled={isSubmitting}>
                      {isSubmitting ? "Logging in..." : "Login"}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>

            <div className="text-center">
              <span className="text-muted small">
                Don't have an account?{" "}
                <span
                  className="text-primary fw-semibold"
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => navigate("/register")}
                >
                  Register here
                </span>
              </span>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}

export default Login
