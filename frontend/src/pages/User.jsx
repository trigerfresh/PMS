import { useNavigate } from 'react-router-dom'

const Blank = () => {
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user'))

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100">
      <h2>User has no dashboard access</h2>

      {/* SHOW ONLY IF USER LOGGED IN */}
      {user && (
        <button onClick={handleLogout} className="btn btn-danger mt-3">
          Logout
        </button>
      )}
    </div>
  )
}

export default Blank
