import '@fortawesome/fontawesome-free/css/all.min.css'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/auth'

const Login = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const res = await loginUser({ email, password })

      const { token, user } = res.data

      // Save login data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      // ROLE BASED REDIRECT
      if (user.role === 'ADMIN') {
        navigate('/')
      } else {
        navigate('/users') // user blank page
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="row w-100 justify-content-center">
        <div className="col-md-6 col-lg-5 p-0 card-right">
          <div className="card tab2-card">
            <div className="card-body">
              <ul
              // className="nav nav-tabs nav-material"
              // id="top-tab"
              // role="tablist"
              >
                <li className="nav-item">
                  <a
                    className="nav-link active"
                    id="top-profile-tab"
                    data-bs-toggle="tab"
                    href="#top-profile"
                    role="tab"
                    aria-controls="top-profile"
                    aria-selected="true"
                  >
                    <span className="icon-user me-2"></span>Login
                  </a>
                </li>
              </ul>
              <div className="tab-content" id="top-tabContent">
                <div
                  className="tab-pane fade show active"
                  id="top-profile"
                  role="tabpanel"
                  aria-labelledby="top-profile-tab"
                >
                  <form
                    className="form-horizontal auth-form"
                    onSubmit={handleLogin}
                  >
                    <div className="form-group">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-terms">
                      <div className="custom-control custom-checkbox me-sm-2">
                        <div className="form-check">
                          {/* <input
                            className="form-check-input custom-control-input"
                            type="checkbox"
                            value=""
                            id="customControlAutosizing"
                          />
                          <label
                            className="form-check-label"
                            for="customControlAutosizing"
                          >
                            Remember me
                          </label> */}
                        </div>
                        <a href="#" className="btn btn-default forgot-pass">
                          Forgot Your Password
                        </a>
                      </div>
                    </div>
                    <div className="form-button m-2">
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Logging in...' : 'Login'}
                      </button>
                    </div>
                    {/* <div className="form-footer">
                      <span>Or Sign up with social platforms</span>

                      <ul className="social">
                        <li>
                          <i className="fa-brands fa-facebook"></i>
                        </li>

                        <li>
                          <i className="fa-brands fa-twitter"></i>
                        </li>

                        <li>
                          <i className="fa-brands fa-instagram"></i>
                        </li>

                        <li>
                          <i className="fa-brands fa-pinterest"></i>
                        </li>
                      </ul>
                    </div> */}
                  </form>
                </div>
                <div
                  className="tab-pane fade"
                  id="top-contact"
                  role="tabpanel"
                  aria-labelledby="contact-top-tab"
                >
                  <form className="form-horizontal auth-form">
                    <div className="form-group">
                      <input
                        required=""
                        name="login[username]"
                        type="email"
                        className="form-control"
                        placeholder="Username"
                        id="exampleInputEmail12"
                      />
                    </div>
                    <div className="form-group">
                      <input
                        required=""
                        name="login[password]"
                        type="password"
                        className="form-control"
                        placeholder="Password"
                      />
                    </div>
                    <div className="form-group">
                      <input
                        required=""
                        name="login[password]"
                        type="password"
                        className="form-control"
                        placeholder="Confirm Password"
                      />
                    </div>
                    <div className="form-terms">
                      <div className="custom-control custom-checkbox form-check me-sm-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          value=""
                          id="customControlAutosizing1"
                        />
                        <label
                          className="custom-control-label form-check-label"
                          for="customControlAutosizing1"
                        >
                          <span>
                            I agree all statements in{' '}
                            <a href="" className="pull-right">
                              Terms &amp; Conditions
                            </a>
                          </span>
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          value=""
                          id="flexCheckDefault"
                        />
                        <label
                          className="form-check-label"
                          for="flexCheckDefault"
                        >
                          Default checkbox
                        </label>
                      </div>
                    </div>
                    <div className="form-button"></div>
                  </form>
                </div>
                {/* <Link to="/">Home</Link> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
