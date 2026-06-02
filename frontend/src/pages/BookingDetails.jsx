import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Container,
  Card,
  Spinner,
  Button,
  Row,
  Col,
  Modal,
} from 'react-bootstrap'

const API_URL = 'http://localhost:5000'

const BookingDetails = () => {
  const { hotelId, statusType } = useParams()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal states for Info and Checkout
  const [showModal, setShowModal] = useState(false)
  const [selectedDetails, setSelectedDetails] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)

      let data = []

      if (statusType === 'maintenance') {
        const res = await axios.get(`${API_URL}/api/rooms`)
        data = res.data.data || []

        data = data.filter(
          (room) =>
            Number(room.hotel_id) === Number(hotelId) &&
            room.status?.toLowerCase() === 'maintenance',
        )
      } else {
        const res = await axios.get(`${API_URL}/api/bookings`)
        data = res.data.data || []

        data = data.filter((b) => Number(b.hotel_id) === Number(hotelId))

        if (statusType !== 'all') {
          data = data.filter((b) => {
            const status = b.status?.toLowerCase()

            if (statusType === 'checkedout') {
              return status === 'checkedout' || status === 'checked out'
            }

            return status === statusType
          })
        }
      }

      setBookings(data)
    } catch (err) {
      console.error('Error fetching booking details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hotelId && statusType) {
      fetchBookingDetails()
    }
  }, [hotelId, statusType])

  const getTitle = () => {
    switch (statusType) {
      case 'booked':
        return 'Booked Rooms List'
      case 'reserved':
        return 'Reserved Rooms List'
      case 'cancelled':
        return 'Cancelled Bookings List'
      case 'checkedout':
        return 'Checked Out Bookings List'
      case 'maintenance':
        return 'Maintenance Rooms List'
      default:
        return 'All Bookings List'
    }
  }

  // Color Mapping as per your request
  const getStatusConfig = (status) => {
    const currentStatus = status?.toLowerCase()
    switch (currentStatus) {
      case 'booked':
      case 'occupied':
        return { bg: 'bg-success text-white border-success' } // Green color
      case 'reserved':
        return { bg: 'bg-primary text-white border-primary' } // Blue color
      case 'cancelled':
        return { bg: 'bg-danger text-white border-danger' } // Red color
      case 'maintenance':
        return { bg: 'bg-warning text-dark border-warning' } // Warning/Yellow color
      case 'checkedout':
      case 'checked out':
      case 'vacant':
      default:
        return { bg: 'bg-light text-dark border-secondary' } // Light color
    }
  }

  // Helper logic to group bookings floor wise
  const groupBookingsByFloor = () => {
    const groups = {}
    bookings.forEach((item) => {
      const floorName =
        item.floor ||
        `Floor ${Math.floor(Number(item.room_no) / 100)}` ||
        'Other Floor'

      if (!groups[floorName]) {
        groups[floorName] = []
      }
      groups[floorName].push(item)
    })
    return groups
  }

  // Handle Card Click Action for Room Info (All states are now clickable)
  const handleCardClick = (data) => {
    setSelectedDetails(data)
    setShowModal(true)
  }

  const handleCheckoutSubmit = async () => {
    if (!selectedDetails) return

    const id = selectedDetails.booking_id || selectedDetails.id

    if (!id) {
      alert('Booking ID not found for this record!')
      return
    }

    try {
      setCheckoutLoading(true)
      const res = await axios.put(`${API_URL}/api/bookings/checkout/${id}`)
      if (res.data.success) {
        alert(res.data.message || 'Checked out successfully!')
        setShowModal(false)

        setBookings([])
        await fetchBookingDetails()
      } else {
        alert(res.data.message || 'Checkout failed')
      }
    } catch (err) {
      console.error('Checkout Error:', err)
      alert(err.response?.data?.message || 'Internal server checkout error')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const floorWiseBookings = groupBookingsByFloor()

  return (
    <Container className="py-3">
      <Button
        variant="outline-secondary"
        size="sm"
        className="mb-3"
        onClick={() => navigate(-1)}
      >
        ← Back to Dashboard
      </Button>

      <h4 className="text-capitalize mb-4 fw-bold">{getTitle()}</h4>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" variant="primary" />
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-muted small ps-2">
          No bookings found for this status.
        </p>
      ) : (
        /* FLOOR WISE RENDERING */
        Object.keys(floorWiseBookings).map((floor) => (
          <div key={floor} className="mb-4">
            {/* Floor Header */}
            <h5 className="text-secondary fw-bold mb-2 border-bottom pb-1">
              {floor}
            </h5>

            {/* Rooms in a single line row */}
            <Row className="g-2 row-cols-auto">
              {floorWiseBookings[floor].map((item) => {
                const config = getStatusConfig(item.status)

                return (
                  <Col key={item.booking_id || item.id}>
                    <Card
                      onClick={() => handleCardClick(item)}
                      className={`text-center shadow-sm ${config.bg}`}
                      style={{
                        cursor: 'pointer',
                        minWidth: '90px',
                        maxWidth: '130px',
                      }}
                    >
                      <Card.Body className="p-2 d-flex flex-column align-items-center justify-content-center">
                        {/* Room Number Display */}
                        <div
                          className="fw-bold"
                          style={{ fontSize: '1rem', lineHeight: '1.2' }}
                        >
                          {item.room_no}
                        </div>
                        {/* Room Status Display */}
                        <div
                          className="text-capitalize opacity-75"
                          style={{ fontSize: '0.7rem', mt: '2px' }}
                        >
                          {item.status || 'Vacant'}
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

      {/* DETAILED INFO & CHECKOUT POPUP (MODAL) */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton className="py-2 px-3">
          <Modal.Title className="h6 fw-bold">
            Room {selectedDetails?.room_no} - Info
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-3" style={{ fontSize: '0.9rem' }}>
          {selectedDetails && (
            <div>
              <p className="mb-2">
                <strong>Status:</strong>{' '}
                <span className="text-capitalize fw-bold">
                  {selectedDetails.status || 'Vacant'}
                </span>
              </p>

              {/* Conditional Display: Agar Room Booked/Occupied hai to baaki details dikhao */}
              {selectedDetails.status?.toLowerCase() === 'booked' ||
              selectedDetails.status?.toLowerCase() === 'occupied' ? (
                <>
                  <p className="mb-1">
                    <strong>Guest Name:</strong>{' '}
                    {selectedDetails.guest_name || 'N/A'}
                  </p>
                  <p className="mb-1">
                    <strong>Check-In:</strong>{' '}
                    {selectedDetails.check_in_date?.split('T')[0] || 'N/A'}
                  </p>
                  <p className="mb-1">
                    <strong>Check-Out:</strong>{' '}
                    {selectedDetails.check_out_date?.split('T')[0] || 'N/A'}
                  </p>
                  <p className="mb-0">
                    <strong>Total Amount:</strong> ₹
                    {selectedDetails.total_amount || 0}
                  </p>
                </>
              ) : (
                <p className="text-muted small mb-0">
                  No active guest details for this status.
                </p>
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="py-1 px-3 d-flex justify-content-end">
          <Button
            variant="secondary"
            size="sm"
            className="me-auto"
            onClick={() => setShowModal(false)}
          >
            Close
          </Button>

          {/* Confirm Checkout Button sirf tabhi dikhega jab room Booked ya Occupied ho */}
          {(selectedDetails?.status?.toLowerCase() === 'booked' ||
            selectedDetails?.status?.toLowerCase() === 'occupied') && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCheckoutSubmit}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? 'Processing...' : 'Confirm Checkout'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default BookingDetails
