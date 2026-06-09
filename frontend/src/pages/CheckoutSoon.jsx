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

const CheckoutSoon = () => {
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
    <div className="p-3">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="text-warning fw-bold">
          Checkout Soon (0–1 Day Remaining)
        </h4>

        <Badge bg="warning" text="dark">
          Total: {bookings.length}
        </Badge>
      </div>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        Object.values(grouped).map((g, i) => (
          <div key={i} className="mb-4">
            <h5 className="text-primary fw-bold">{g.hotel}</h5>
            <h6 className="text-secondary border-bottom pb-1">{g.floor}</h6>

            <Row className="g-2">
              {g.items.map((item) => {
                const info = getInfo(item)

                return (
                  <Col md={4} key={item.id || item.booking_id}>
                    <Card
                      onClick={() => handleClick(item)}
                      className="border-warning shadow-sm"
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body>
                        {/* 🔥 ONLY BASIC INFO IN CARD */}
                        <div className="d-flex justify-content-between">
                          <strong>Room {item.room_no}</strong>

                          <Badge bg="warning" text="dark">
                            {info?.days} day left
                          </Badge>
                        </div>

                        <div className="small text-muted">
                          {item.guest_name}
                        </div>

                        <div className="small mt-1">
                          Out: {item.check_out_date?.split('T')[0]}
                        </div>
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
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Full Booking Overview</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selected &&
            (() => {
              const info = getInfo(selected)
              const total = Number(selected.total_amount || 0)
              const extra = info?.extraAmount || 0
              const final = total + extra

              return (
                <Table bordered size="sm">
                  <tbody>
                    <tr>
                      <td>Guest Name</td>
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
                      <td>₹ {total}</td>
                    </tr>

                    <tr>
                      <td>Remaining Days</td>
                      <td className="text-warning fw-bold">{info?.days}</td>
                    </tr>

                    <tr>
                      <td>Extra Charge</td>
                      <td>₹ {extra}</td>
                    </tr>

                    <tr className="bg-light fw-bold">
                      <td>Final Amount</td>
                      <td>₹ {final}</td>
                    </tr>
                  </tbody>
                </Table>
              )
            })()}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>

          <Button
            variant="warning"
            onClick={handleCheckout}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? 'Processing...' : 'Checkout Now'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default CheckoutSoon
