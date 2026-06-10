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

const CheckoutSoon = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // =========================
  // SOON LOGIC
  // =========================
  const getSoonInfo = (checkIn, checkOut, status, totalAmount) => {
    if (!checkIn || !checkOut) return null

    const s = typeof status === 'string' ? status.toLowerCase() : ''
    if (s !== 'booked' && s !== 'occupied') return null

    const today = new Date()
    const todayMid = new Date(today.setHours(0, 0, 0, 0))

    const out = new Date(checkOut)
    const outMid = new Date(out.setHours(0, 0, 0, 0))

    const remainingDays = Math.floor(
      (outMid - todayMid) / (1000 * 60 * 60 * 24),
    )

    if (remainingDays >= 0 && remainingDays <= 1) {
      return {
        days: remainingDays,
        extraAmount: Math.round(Number(totalAmount || 0) * 0.1),
      }
    }

    return null
  }

  // =========================
  // FETCH
  // =========================
  const fetchData = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const res = await axios.get(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = res.data.data || []

      const filtered = data.filter((b) =>
        getSoonInfo(
          b.check_in_date,
          b.check_out_date,
          b.status,
          b.total_amount,
        ),
      )

      setBookings(filtered)
      localStorage.setItem('soonLiveCount', filtered.length)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  // =========================
  // GROUP
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

  const getInfo = (item) =>
    getSoonInfo(
      item.check_in_date,
      item.check_out_date,
      item.status,
      item.total_amount,
    )

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
    <Container fluid className="page-container" style={{ 
      background: 'linear-gradient(135deg, #f6f8fc 0%, #e9edf5 100%)',
      minHeight: '100vh',
      transition: 'background-color 0.5s ease',
    }}>
      {/* Header */}
      <Row className="align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05) !important' }}>
        <Col className="d-flex align-items-center">
          <Button
            variant="light"
            className="shadow-sm rounded-circle d-flex align-items-center justify-content-center me-3"
            onClick={() => navigate(-1)}
            style={{ width: '45px', height: '45px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ fontSize: '1.2rem', color: '#64748b' }}>←</span>
          </Button>
          <div>
            <h2 className="fw-bold mb-0 text-capitalize d-flex align-items-center gap-3" style={{ color: '#2c3e50', letterSpacing: '-0.5px' }}>
              Checkout Soon
              <span className="badge bg-warning text-dark rounded-pill fs-6 px-3">{bookings.length}</span>
            </h2>
            <small className="text-muted fw-bold" style={{ letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              0–1 Day Remaining
            </small>
          </div>
        </Col>
      </Row>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        Object.values(grouped).map((g, i) => (
          <div key={i} className="mb-4">
            <h5 className="text-secondary fw-bold mb-2 border-bottom pb-1">{g.hotel} - {g.floor}</h5>

            <Row className="g-2 row-cols-auto">
              {g.items.map((item) => {
                const info = getInfo(item)

                return (
                  <Col key={item.id || item.booking_id}>
                    <Card
                      onClick={() => handleClick(item)}
                      className="border-warning shadow-sm"
                      style={{ cursor: 'pointer', minWidth: '150px', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
                    >
                      <Card.Body className="p-2 d-flex flex-column align-items-center justify-content-center">
                        <div className="fw-bold px-1 text-truncate" style={{ fontSize: '1rem', lineHeight: '1.2', maxWidth: '100%' }}>
                          Room {item.room_no || item.guest_name || 'N/A'}
                        </div>
                        <div className="small text-muted text-truncate w-100 text-center mt-1">
                          {item.guest_name}
                        </div>
                        <Badge bg="warning" text="dark" className="mt-2">
                          {info?.days} day left
                        </Badge>
                      </Card.Body>
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </div>
        ))
      )}

      {/* =========================
          FULL OVERALL MODAL
      ========================= */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="md" centered contentClassName="border-0 shadow-lg">
        <Modal.Header closeButton className="bg-warning border-0 py-3">
          <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center gap-2">
            <span className="bg-white text-dark px-2 py-1 rounded-3 fs-6 border border-warning shadow-sm">Room {selected?.room_no || 'N/A'}</span>
            Booking Overview
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-3">
          {selected &&
            (() => {
              const info = getInfo(selected)
              const total = Number(selected.total_amount || 0)
              const extra = info?.extraAmount || 0
              const final = total + extra

              return (
                <div className="bg-white">
                  <Table borderless hover size="sm" className="mb-0" style={{ fontSize: '0.85rem' }}>
                    <tbody>
                      <tr className="border-bottom">
                        <td className="text-secondary fw-semibold py-2" style={{ letterSpacing: '0.3px' }}>Guest Name</td>
                        <td className="fw-bold text-dark py-2 text-end">{selected.guest_name}</td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-secondary fw-semibold py-2" style={{ letterSpacing: '0.3px' }}>Contact</td>
                        <td className="fw-medium text-dark py-2 text-end">{selected.phone || 'N/A'}</td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-secondary fw-semibold py-2" style={{ letterSpacing: '0.3px' }}>Location</td>
                        <td className="fw-medium text-dark py-2 text-end">{selected.hotel_name} - Floor {selected.floor_name}</td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-secondary fw-semibold py-2" style={{ letterSpacing: '0.3px' }}>Check-in</td>
                        <td className="fw-medium text-dark py-2 text-end">{selected.check_in_date?.split('T')[0]}</td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-secondary fw-semibold py-2" style={{ letterSpacing: '0.3px' }}>Check-out</td>
                        <td className="fw-medium text-dark py-2 text-end">{selected.check_out_date?.split('T')[0]}</td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-secondary fw-semibold py-2" style={{ letterSpacing: '0.3px' }}>Remaining Days</td>
                        <td className="py-2 text-end">
                          <Badge bg="warning" text="dark" className="fw-bold px-2 py-1 rounded-pill">{info?.days} Days</Badge>
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-secondary fw-semibold py-2" style={{ letterSpacing: '0.3px' }}>Base Amount</td>
                        <td className="fw-bold text-dark py-2 text-end">₹ {total}</td>
                      </tr>
                      <tr>
                        <td className="text-warning fw-semibold py-2" style={{ letterSpacing: '0.3px' }}>Extra Charge</td>
                        <td className="text-warning fw-bold py-2 text-end">+ ₹ {extra}</td>
                      </tr>
                    </tbody>
                  </Table>
                  <div className="mt-2 pt-3 border-top d-flex justify-content-between align-items-center rounded-3 bg-light px-3 py-2 border">
                    <span className="text-dark fw-bold" style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>FINAL AMOUNT</span>
                    <span className="text-warning fw-bold text-end" style={{ fontSize: '1.15rem' }}>₹ {final}</span>
                  </div>
                </div>
              )
            })()}
        </Modal.Body>

        <Modal.Footer className="bg-light border-0 py-3">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowModal(false)}
            className="rounded-pill px-4"
          >
            Close
          </Button>

          <Button
            variant="warning"
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="rounded-pill px-4 shadow-sm fw-bold text-dark d-flex align-items-center gap-2"
            style={{ transition: 'all 0.2s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {checkoutLoading ? (
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            ) : null}
            <span>{checkoutLoading ? 'Processing...' : 'Checkout Now'}</span>
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default CheckoutSoon
