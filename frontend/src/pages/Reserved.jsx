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
} from 'react-bootstrap'

const API_URL = 'http://localhost:5000'

const Reserved = () => {
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
    <div className="p-3">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="text-primary fw-bold">Reserved Bookings</h4>

        <Badge bg="primary">Total: {bookings.length}</Badge>
      </div>

      {/* LOADING */}
      {loading ? (
        <Spinner animation="border" />
      ) : bookings.length === 0 ? (
        <p>No reserved bookings found</p>
      ) : (
        Object.values(grouped).map((g, i) => (
          <div key={i} className="mb-4">
            {/* HOTEL */}
            <h5 className="text-primary fw-bold">{g.hotel}</h5>

            {/* FLOOR */}
            <h6 className="text-secondary border-bottom pb-1">{g.floor}</h6>

            {/* CARDS */}
            <Row className="g-2">
              {g.items.map((item) => (
                <Col md={4} key={item.id || item.booking_id}>
                  <Card
                    onClick={() => handleClick(item)}
                    className="border-primary shadow-sm"
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between">
                        <strong>Room {item.room_no}</strong>

                        <Badge bg="primary">Reserved</Badge>
                      </div>

                      <div className="small text-muted mt-1">
                        {item.guest_name}
                      </div>

                      <div className="small mt-2">
                        Check-In: {item.check_in_date?.split('T')[0]}
                      </div>

                      <div className="small">
                        Check-Out: {item.check_out_date?.split('T')[0]}
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
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Reserved Booking Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selected && (
            <Table bordered size="sm">
              <tbody>
                <tr>
                  <td>Guest</td>
                  <td>{selected.guest_name}</td>
                </tr>

                <tr>
                  <td>Phone</td>
                  <td>{selected.phone || 'N/A'}</td>
                </tr>

                <tr>
                  <td>Hotel</td>
                  <td>{selected.hotel_name}</td>
                </tr>

                <tr>
                  <td>Floor</td>
                  <td>{selected.floor_name}</td>
                </tr>

                <tr>
                  <td>Room</td>
                  <td>{selected.room_no}</td>
                </tr>

                <tr>
                  <td>Check In</td>
                  <td>{selected.check_in_date?.split('T')[0]}</td>
                </tr>

                <tr>
                  <td>Check Out</td>
                  <td>{selected.check_out_date?.split('T')[0]}</td>
                </tr>

                <tr>
                  <td>Total Amount</td>
                  <td>₹ {selected.total_amount || 0}</td>
                </tr>

                <tr>
                  <td>Status</td>
                  <td className="text-primary fw-bold">{selected.status}</td>
                </tr>
              </tbody>
            </Table>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>

          {/* <Button
            variant="primary"
            onClick={handleCheckout}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? 'Processing...' : 'Convert to Active'}
          </Button> */}
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Reserved
