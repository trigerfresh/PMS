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
import { FaArrowLeft } from 'react-icons/fa'

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
  const [rooms, setRooms] = useState([])
  const [hotels, setHotels] = useState([])
  const [floors, setFloors] = useState([])

  const isCheckoutSoon = (checkOutDate, status) => {
    if (!checkOutDate) return false

    const s = status?.toLowerCase()

    if (s === 'cancelled' || s === 'checkedout' || s === 'checked out')
      return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkout = new Date(checkOutDate)
    checkout.setHours(0, 0, 0, 0)

    const diffDays = (checkout - today) / (1000 * 60 * 60 * 24)

    return diffDays <= 1 && diffDays >= 0
  }

  const isCheckoutOverdue = (checkOutDate, status) => {
    if (!checkOutDate) return false

    const s = status?.toLowerCase().trim()

    // Sirf active stay wale bookings overdue ho sakte hain
    if (s !== 'booked' && s !== 'occupied') {
      return false
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkout = new Date(checkOutDate)
    checkout.setHours(0, 0, 0, 0)

    return checkout < today
  }

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token')

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      setLoading(true)

      const [bookingRes, deletedRes, roomRes, hotelRes, floorRes] =
        await Promise.all([
          axios.get(`${API_URL}/api/bookings`, config),
          axios.get(`${API_URL}/api/deleted-bookings`, config),
          axios.get(`${API_URL}/api/rooms`, config),
          axios.get(`${API_URL}/api/hotels`, config),
          axios.get(`${API_URL}/api/floors`, config),
        ])

      const hotelData = hotelRes.data.data || []
      const floorData = floorRes.data.data || []

      setHotels(hotelData)
      setFloors(floorData)

      const bookingData = bookingRes.data.data || []
      const deletedData = deletedRes.data.data || []
      const roomData = roomRes.data.data || []

      setRooms(roomData)

      let data = statusType === 'deleted' ? deletedData : bookingData

      // Hotel Filter
      if (hotelId !== 'all') {
        data = data.filter((b) => Number(b.hotel_id) === Number(hotelId))
      }

      // Status Filter
      if (statusType !== 'all') {
        data = data.filter((b) => {
          const status = b.status?.toLowerCase().trim()

          switch (statusType) {
            case 'booked': {
              const today = new Date().toISOString().split('T')[0]
              const checkInDate = b.check_in_date?.split('T')[0]

              return status === 'booked' && checkInDate === today
            }

            case 'reserved':
              return status === 'reserved'

            case 'cancelled':
              return status === 'cancelled'

            case 'checkedout':
              return status === 'checkedout' || status === 'checked out'

            case 'checkout_soon':
              return isCheckoutSoon(b.check_out_date, b.status)

            case 'checkout_overdue':
              return isCheckoutOverdue(b.check_out_date, b.status)

            case 'deleted':
              return status === 'deleted'

            default:
              return true
          }
        })
      }

      // Room Join
      const finalData = data.map((booking) => {
        const room = roomData.find(
          (r) => Number(r.room_id) === Number(booking.room_id),
        )

        const hotel = hotelData.find(
          (h) => Number(h.id) === Number(room?.hotel_id),
        )

        const floor = floorData.find(
          (f) => Number(f.floor_id) === Number(room?.floor_id),
        )

        return {
          ...booking,
          hotel_name: hotel?.hotel_name || 'Unknown Hotel',
          floor_id: room?.floor_id,
          floor_name: floor?.floor_name || `Floor ${room?.floor_id}`,
        }
      })

      setBookings(finalData)
    } catch (err) {
      console.error(err)
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

      case 'deleted':
        return 'Deleted Bookings List'

      default:
        return 'All Bookings List'
    }
  }

  // Color Mapping as per your request
  const getStatusConfig = (item) => {
    // Overdue page ke liye hamesha red
    if (
      statusType === 'checkout_overdue' &&
      isCheckoutOverdue(item.check_out_date, item.status)
    ) {
      return { bg: 'bg-danger text-white border-danger' }
    }

    const currentStatus = item.status?.toLowerCase()

    switch (currentStatus) {
      case 'booked':
      case 'occupied':
        return { bg: 'bg-success text-white border-success' }

      case 'reserved':
        return { bg: 'bg-primary text-white border-primary' }

      case 'cancelled':
        return { bg: 'bg-danger text-white border-danger' }

      case 'maintenance':
        return { bg: 'bg-warning text-dark border-warning' }

      case 'checkedout':
      case 'checked out':
      case 'vacant':
      default:
        return { bg: 'bg-light text-dark border-danger' }
    }
  }

  // Helper logic to group bookings floor wise
  const groupBookingsByHotelFloor = () => {
    const groups = {}

    bookings.forEach((item) => {
      const key = `${item.hotel_name}__${item.floor_name}`

      if (!groups[key]) {
        groups[key] = {
          hotel_name: item.hotel_name,
          floor_name: item.floor_name,
          bookings: [],
        }
      }

      groups[key].bookings.push(item)
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

  const groupedBookings = groupBookingsByHotelFloor()

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h1 className="page-title mb-0" style={{ fontSize: '25px' }}>
          {getTitle()} <span className="text-success">({bookings.length})</span>
        </h1>

        <div className="page-actions d-flex gap-3 align-items-center">
          <button
            type="button"
            className="btn-danger shadow-sm rounded-3"
            onClick={() => navigate(-1)}
            style={{
              padding: '6px 14px',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              transition: 'all 0.2s',
              color: '#fff',
            }}
          >
            <FaArrowLeft /> Back to Dashboard
          </button>
        </div>
      </div>

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
        Object.keys(groupedBookings).map((key) => {
          const group = groupedBookings[key]

          return (
            <div key={key} className="mb-4">
              {/* Hotel Header */}
              <h4 className="text-primary fw-bold mb-1">{group.hotel_name}</h4>

              {/* Floor Header */}
              <h5 className="text-secondary fw-bold mb-2 border-bottom pb-1">
                {group.floor_name}
              </h5>

              {/* Rooms */}
              <Row className="g-2 row-cols-auto">
                {group.bookings.map((item) => {
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
                          <div
                            className="fw-bold"
                            style={{
                              fontSize: '1rem',
                              lineHeight: '1.2',
                            }}
                          >
                            {item.room_no}
                          </div>

                          <div
                            className="text-capitalize opacity-75"
                            style={{
                              fontSize: '0.7rem',
                              marginTop: '2px',
                            }}
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
          )
        })
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
    </div>
  )
}

export default BookingDetails
