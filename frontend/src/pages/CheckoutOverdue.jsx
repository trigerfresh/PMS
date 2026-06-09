import { useEffect, useState, useMemo } from 'react'
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

const CheckoutOverdue = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // =========================
  // SAFE OVERDUE CALCULATION
  // =========================
  const getOverdueInfo = (checkIn, checkOut, status, totalAmount) => {
    if (!checkIn || !checkOut) return null

    const s = typeof status === 'string' ? status.toLowerCase().trim() : ''
    if (s !== 'booked' && s !== 'occupied') return null

    const today = new Date()
    const todayMid = new Date(today.setHours(0, 0, 0, 0))

    const inMid = new Date(checkIn)
    inMid.setHours(0, 0, 0, 0)

    const outMid = new Date(checkOut)
    outMid.setHours(0, 0, 0, 0)

    const stayDays = Math.max(
      1,
      Math.round((outMid - inMid) / (1000 * 60 * 60 * 24)),
    )

    const perDayRate = Number(totalAmount || 0) / stayDays

    const overdueDays = Math.floor((todayMid - outMid) / (1000 * 60 * 60 * 24))

    if (overdueDays <= 0) return null

    const overdueAmount = Math.round(overdueDays * perDayRate)

    return {
      days: overdueDays,
      perDayRate,
      overdueAmount,
    }
  }

  // =========================
  // FETCH DATA
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
        getOverdueInfo(
          b.check_in_date,
          b.check_out_date,
          b.status,
          b.total_amount,
        ),
      )

      setBookings(filtered)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // 🔴 auto refresh (notification count live update)
    const interval = setInterval(fetchData, 30000) // every 30 sec
    return () => clearInterval(interval)
  }, [])

  // =========================
  // GROUP HOTEL + FLOOR
  // =========================
  const grouped = useMemo(() => {
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
  }, [bookings])

  // =========================
  // HANDLERS
  // =========================
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

  const getInfo = (item) =>
    getOverdueInfo(
      item.check_in_date,
      item.check_out_date,
      item.status,
      item.total_amount,
    )

  // =========================
  // NOTIFICATION COUNT
  // =========================
  const notificationCount = bookings.length

  return (
    <div className="d-flex justify-content-center">
      <div style={{ width: '900px' }} className="p-3">
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="text-danger fw-bold mb-0">
            Checkout Overdue Dashboard
          </h4>

          <Badge bg="danger" pill>
            {notificationCount} Overdue
          </Badge>
        </div>

        {/* BODY */}
        {loading ? (
          <Spinner animation="border" />
        ) : bookings.length === 0 ? (
          <p>No overdue data</p>
        ) : (
          Object.values(grouped).map((g, i) => (
            <div key={i} className="mb-4">
              <h5 className="text-primary fw-bold">{g.hotel}</h5>
              <h6 className="text-secondary border-bottom pb-1">{g.floor}</h6>

              <Row className="g-2">
                {g.items.map((item) => {
                  const info = getInfo(item)

                  const totalAmount = Number(item.total_amount || 0)
                  const overdueAmount = Number(info?.overdueAmount || 0)
                  const finalAmount = totalAmount + overdueAmount

                  return (
                    <Col md={4} key={item.id || item.booking_id}>
                      <Card
                        onClick={() => handleClick(item)}
                        className="border-danger shadow-sm"
                        style={{ cursor: 'pointer' }}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between">
                            <strong>Room {item.room_no}</strong>
                            <Badge bg="danger">{info?.days} days</Badge>
                          </div>

                          <div className="small text-muted">
                            {item.guest_name}
                          </div>

                          <div className="text-danger fw-bold mt-2">
                            ₹ {finalAmount}
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

        {/* MODAL */}
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="md"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Room {selected?.room_no} - Full Details</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {selected &&
              (() => {
                const info = getInfo(selected)

                const totalAmount = Number(selected.total_amount || 0)
                const overdueAmount = Number(info?.overdueAmount || 0)
                const finalAmount = totalAmount + overdueAmount

                return (
                  <Table bordered size="sm">
                    <tbody>
                      <tr>
                        <td>Guest</td>
                        <td>{selected.guest_name}</td>
                      </tr>
                      <tr>
                        <td>Check-in</td>
                        <td>{selected.check_in_date?.split('T')[0]}</td>
                      </tr>
                      <tr>
                        <td>Check-out</td>
                        <td>{selected.check_out_date?.split('T')[0]}</td>
                      </tr>

                      <tr>
                        <td>Total Amount</td>
                        <td>₹ {totalAmount}</td>
                      </tr>

                      <tr>
                        <td>Overdue Days</td>
                        <td className="text-danger fw-bold">{info?.days}</td>
                      </tr>

                      <tr>
                        <td>Per Day Rate</td>
                        <td>₹ {info?.perDayRate?.toFixed(2)}</td>
                      </tr>

                      <tr>
                        <td>Overdue Amount</td>
                        <td className="text-danger fw-bold">
                          ₹ {overdueAmount}
                        </td>
                      </tr>

                      <tr className="bg-light fw-bold">
                        <td>Final Amount</td>
                        <td>₹ {finalAmount}</td>
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
              variant="danger"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? 'Processing...' : 'Checkout Now'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  )
}

export default CheckoutOverdue
