import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Card,
  Spinner,
  Modal,
  Button,
  Badge,
  Row,
  Col,
  Table,
  Container,
} from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'

const API_URL = 'http://localhost:5000'

const Reserved = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // =========================
  // RESERVED LOGIC
  // =========================
  const isReserved = (status) => {
    if (!status) return false
    return status.toLowerCase().trim() === 'reserved'
  }

  // =========================
  // FETCH DATA (REAL TIME)
  // =========================
  const fetchData = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const res = await axios.get(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = res.data.data || []

      const filtered = data.filter((b) => isReserved(b.status))

      setBookings(filtered)

      // optional live storage
      localStorage.setItem('reservedLiveCount', filtered.length)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const interval = setInterval(fetchData, 15000) // real-time
    return () => clearInterval(interval)
  }, [])

  // =========================
  // GROUP HOTEL + FLOOR
  // =========================
  const groupData = () => {
    const map = {}

    bookings.forEach((b) => {
      const key = `${b.hotel_name}__${b.floor_name}`

      if (!map[key]) {
        map[key] = {
          hotel: b.hotel_name,
          floor: b.floor_name,
          items: [],
        }
      }

      map[key].items.push(b)
    })

    return map
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'reserved':
        return 'border-primary text-primary'
      default:
        return 'border-secondary text-dark'
    }
  }

  const handleClick = (item) => {
    setSelected(item)
    setShowModal(true)
  }

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true)

      const id = selected.booking_id || selected.id

      await axios.put(`${API_URL}/api/bookings/checkout/${id}`)

      setShowModal(false)
      fetchData()
    } catch (err) {
      console.log(err)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const grouped = groupData()

  return (
    <Container
      fluid
      className="page-container"
      style={{
        background: 'linear-gradient(135deg, #f6f8fc 0%, #e9edf5 100%)',
        minHeight: '100vh',
        transition: 'background-color 0.5s ease',
      }}
    >
      {/* Header */}
      <div
        className="d-flex flex-wrap align-items-center mb-4 pb-3 border-bottom"
        style={{ borderColor: 'rgba(0,0,0,0.05) !important' }}
      >
        <Button
          variant="light"
          className="shadow-sm rounded-circle d-flex align-items-center justify-content-center me-3"
          onClick={() => navigate(-1)}
          style={{
            width: '45px',
            height: '45px',
            border: '1px solid #e2e8f0',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <span style={{ fontSize: '1.2rem', color: '#64748b' }}>←</span>
        </Button>
        <div className="mb-2">
          <h2
            className="fw-bold mb-0 text-capitalize d-flex flex-wrap align-items-center gap-2"
            style={{
              color: '#2c3e50',
              letterSpacing: '-0.5px',
              fontSize: '1.5rem',
            }}
          >
            Reserved Bookings
            <Badge bg="primary" className="text-white rounded-pill fs-6 px-3">
              {bookings.length}
            </Badge>
          </h2>
          <small
            className="text-muted fw-bold"
            style={{
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
            }}
          >
            Floor & Hotel Wise Details
          </small>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <Spinner animation="border" />
      ) : bookings.length === 0 ? (
        <p>No reserved bookings found</p>
      ) : (
        Object.values(grouped).map((g, i) => (
          <div key={i} className="mb-4">
            <h5 className="text-secondary fw-bold mb-2 border-bottom pb-1">
              {g.hotel} - {g.floor}
            </h5>

            <Row className="g-3">
              {g.items.map((item) => (
                <Col
                  xs={6}
                  sm={4}
                  md={3}
                  lg={2}
                  key={item.id || item.booking_id}
                >
                  <Card
                    onClick={() => handleClick(item)}
                    className="border-primary shadow-sm h-100"
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.classList.add('shadow')
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.classList.remove('shadow')
                    }}
                  >
                    <Card.Body className="p-2 d-flex flex-column align-items-center justify-content-center text-center">
                      <div
                        className="fw-bold px-1 text-truncate w-100"
                        style={{ fontSize: '1rem', lineHeight: '1.2' }}
                      >
                        Room {item.room_no || item.guest_name || 'N/A'}
                      </div>
                      <Badge bg="primary" className="mt-2 mb-1">
                        Reserved
                      </Badge>
                      <div className="small text-muted text-truncate w-100 mt-1">
                        {item.guest_name}
                      </div>
                      <div
                        className="small mt-auto pt-2"
                        style={{ fontSize: '0.75rem' }}
                      >
                        In: {item.check_in_date?.split('T')[0]}
                        <br />
                        Out: {item.check_out_date?.split('T')[0]}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))
      )}

      {/* =========================
          MODAL FULL DETAILS
      ========================= */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="md"
        centered
        contentClassName="border-0 shadow-lg"
      >
        <Modal.Header closeButton className="bg-primary border-0 py-3">
          <Modal.Title className="fw-bold fs-5 text-white d-flex flex-wrap align-items-center gap-2">
            <span className="bg-white text-primary px-2 py-1 rounded-3 fs-6 border shadow-sm">
              Room {selected?.room_no || 'N/A'}
            </span>
            Reserved Details
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-3">
          {selected && (
            <div className="bg-white">
              <Table
                borderless
                hover
                size="sm"
                className="mb-0"
                style={{ fontSize: '0.85rem' }}
              >
                <tbody>
                  <tr className="border-bottom">
                    <td
                      className="text-secondary fw-semibold py-2"
                      style={{ letterSpacing: '0.3px' }}
                    >
                      Guest Name
                    </td>
                    <td className="fw-bold text-dark py-2 text-end">
                      {selected.guest_name}
                    </td>
                  </tr>
                  <tr className="border-bottom">
                    <td
                      className="text-secondary fw-semibold py-2"
                      style={{ letterSpacing: '0.3px' }}
                    >
                      Contact
                    </td>
                    <td className="fw-medium text-dark py-2 text-end">
                      {selected.phone || 'N/A'}
                    </td>
                  </tr>
                  <tr className="border-bottom">
                    <td
                      className="text-secondary fw-semibold py-2"
                      style={{ letterSpacing: '0.3px' }}
                    >
                      Location
                    </td>
                    <td className="fw-medium text-dark py-2 text-end">
                      {selected.hotel_name} - Floor {selected.floor_name}
                    </td>
                  </tr>
                  <tr className="border-bottom">
                    <td
                      className="text-secondary fw-semibold py-2"
                      style={{ letterSpacing: '0.3px' }}
                    >
                      Check-in
                    </td>
                    <td className="fw-medium text-dark py-2 text-end">
                      {selected.check_in_date?.split('T')[0]}
                    </td>
                  </tr>
                  <tr className="border-bottom">
                    <td
                      className="text-secondary fw-semibold py-2"
                      style={{ letterSpacing: '0.3px' }}
                    >
                      Check-out
                    </td>
                    <td className="fw-medium text-dark py-2 text-end">
                      {selected.check_out_date?.split('T')[0]}
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="text-secondary fw-semibold py-2 align-middle"
                      style={{ letterSpacing: '0.3px' }}
                    >
                      Status
                    </td>
                    <td className="py-2 text-end">
                      <Badge
                        bg="primary"
                        className="fw-normal px-2 py-1 rounded-pill text-capitalize"
                      >
                        {selected.status}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
              <div className="mt-2 pt-3 border-top d-flex justify-content-between align-items-center rounded-3 bg-light px-3 py-2 border">
                <span
                  className="text-dark fw-bold"
                  style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}
                >
                  TOTAL AMOUNT
                </span>
                <span
                  className="text-primary fw-bold text-end"
                  style={{ fontSize: '1.15rem' }}
                >
                  ₹ {selected.total_amount || 0}
                </span>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="bg-light border-0 py-3">
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
            className="rounded-pill px-4"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Reserved
