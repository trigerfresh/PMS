import { useNavigate } from 'react-router-dom'
import { Container, Card, Button } from 'react-bootstrap'

const Blank = () => {
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user'))

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <Container fluid className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{
      background: 'linear-gradient(135deg, #f6f8fc 0%, #e9edf5 100%)',
    }}>
      <Card className="dashboard-card shadow-sm border-0 rounded-4 overflow-hidden text-center p-5" style={{ transition: 'all 0.3s ease', maxWidth: '500px', width: '100%' }}>
        <Card.Body>
          <h2 className="mb-4 fw-bold text-secondary" style={{ fontSize: '1.5rem' }}>User has no dashboard access</h2>

          {/* SHOW ONLY IF USER LOGGED IN */}
          {user && (
            <Button onClick={handleLogout} variant="danger" className="mt-3 shadow-sm rounded-3 px-4 py-2" style={{ fontWeight: '500' }}>
              Logout
            </Button>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}

export default Blank
