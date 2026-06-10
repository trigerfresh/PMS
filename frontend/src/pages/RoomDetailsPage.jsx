import React, { useEffect, useState } from 'react'
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

const RoomDetailsPage = () => {
  const { hotelId, status } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [roomsData, setRoomsData] = useState([])
  const [bookingsData, setBookingsData] = useState([])

  // Modal states for Room Info & Checkout
  const [showModal, setShowModal] = useState(false)
  const [selectedDetails, setSelectedDetails] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const isActiveBooking = (b) => {
    const currentStatus = b.status?.toLowerCase()
    return (
      b.active === '0' &&
      (currentStatus === 'booked' || currentStatus === 'occupied')
    )
  }

  useEffect(() => {
    if (hotelId && status) {
      fetchDetailedData()
    }
  }, [hotelId, status])

  const fetchDetailedData = async () => {
    try {
      setLoading(true)
      const currentStatus = status?.toLowerCase()

      setRoomsData([])
      setBookingsData([])

      // 1. ALL ROOMS
      if (currentStatus === 'all') {
        const [roomsRes, bookingsRes] = await Promise.all([
          axios.get(`${API_URL}/api/rooms`),
          axios.get(`${API_URL}/api/bookings`),
        ])

        const rooms = roomsRes.data.data || []
        const bookings = bookingsRes.data.data || []

        const hotelRooms = hotelId === 'all'
          ? rooms
          : rooms.filter((room) => Number(room.hotel_id) === Number(hotelId))

        const hotelBookings = hotelId === 'all'
          ? bookings.filter((b) => isActiveBooking(b))
          : bookings.filter((b) => Number(b.hotel_id) === Number(hotelId) && isActiveBooking(b))

        const mergedRooms = hotelRooms.map((room) => {
          const activeBooking = hotelBookings.find(
            (b) =>
              Number(b.room_id) === Number(room.room_id) ||
              String(b.room_no) === String(room.room_no),
          )

          if (activeBooking) {
            return {
              ...room,

              booking_id:
                activeBooking.booking_id ||
                activeBooking.id ||
                activeBooking.bookingId,

              guest_name: activeBooking.guest_name,
              check_in_date: activeBooking.check_in_date,
              check_out_date: activeBooking.check_out_date,
              total_amount: activeBooking.total_amount,

              booking_status: activeBooking.status,

              status: 'occupied',
            }
          }

          return room
        })

        setRoomsData(mergedRooms)
      }
      // 2. AVAILABLE / VACANT ROOMS
      else if (currentStatus === 'available' || currentStatus === 'vacant') {
        const res = await axios.get(`${API_URL}/api/rooms`)
        const rooms = res.data.data || []
        const filteredRooms = rooms.filter(
          (room) =>
            (hotelId === 'all' || Number(room.hotel_id) === Number(hotelId)) &&
            (room.status?.toLowerCase() === 'available' ||
              room.status?.toLowerCase() === 'vacant' ||
              room.status?.toLowerCase() === 'avalable'),
        )
        setRoomsData(filteredRooms)
      }
      // 3. MAINTENANCE ROOMS
      else if (currentStatus === 'maintenance') {
        const res = await axios.get(`${API_URL}/api/rooms`)
        const rooms = res.data.data || []
        const filteredRooms = rooms.filter(
          (room) =>
            (hotelId === 'all' || Number(room.hotel_id) === Number(hotelId)) &&
            room.status?.toLowerCase() === 'maintenance',
        )
        setRoomsData(filteredRooms)
      }
      // 4. RESERVED ROOMS
      else if (currentStatus === 'reserved') {
        const res = await axios.get(`${API_URL}/api/rooms`)
        const rooms = res.data.data || []
        const filteredRooms = rooms.filter(
          (room) =>
            (hotelId === 'all' || Number(room.hotel_id) === Number(hotelId)) &&
            room.status?.toLowerCase() === 'reserved',
        )
        setRoomsData(filteredRooms)
      }
      // 5. OCCUPIED / BOOKED ROOMS
      else if (currentStatus === 'occupied' || currentStatus === 'booked') {
        const [roomsRes, bookingsRes] = await Promise.all([
          axios.get(`${API_URL}/api/rooms`),
          axios.get(`${API_URL}/api/bookings`),
        ])

        const rooms = roomsRes.data.data || []
        const bookings = bookingsRes.data.data || []

        const hotelRooms = hotelId === 'all'
          ? rooms
          : rooms.filter((room) => Number(room.hotel_id) === Number(hotelId))

        const occupiedBookings = bookings
          .filter(
            (b) =>
              (hotelId === 'all' || Number(b.hotel_id) === Number(hotelId)) &&
              (b.status?.toLowerCase() === 'booked' ||
                b.status?.toLowerCase() === 'occupied'),
          )
          .map((booking) => {
            const room = hotelRooms.find(
              (r) =>
                Number(r.room_id) === Number(booking.room_id) ||
                Number(r.room_no) === Number(booking.room_no),
            )

            return {
              ...booking,
              room_no: room?.room_no || booking.room_no,
              room_type: room?.room_type,
              floor: room?.floor,
            }
          })

        setBookingsData(occupiedBookings)
      }
    } catch (err) {
      console.error('Error loading details:', err)
    } finally {
      setLoading(false)
    }
  }

  // Centralized Dynamic Colors Map As per request
  const getStatusConfig = (roomStatus) => {
    const checkStatus = roomStatus?.toLowerCase()
    switch (checkStatus) {
      case 'occupied':
      case 'booked':
        return { bg: 'bg-success text-white border-success' } // Green color
      case 'reserved':
        return { bg: 'bg-primary text-white border-primary' } // Blue color
      case 'cancelled':
        return { bg: 'bg-danger text-white border-danger' } // Red color
      case 'maintenance':
        return { bg: 'bg-warning text-dark border-warning' } // Yellow color
      case 'available':
      case 'vacant':
      case 'avalable':
      default:
        return { bg: 'bg-light text-dark border-secondary' } // Light color
    }
  }

  const currentStatusLower = status?.toLowerCase()

  const getCheckoutStatus = (checkOutDate, roomStatus) => {
    if (!checkOutDate) return null
    const s = roomStatus?.toLowerCase()
    if (s === 'cancelled' || s === 'checkedout') return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkout = new Date(checkOutDate)
    checkout.setHours(0, 0, 0, 0)

    const diffTime = checkout.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (checkout < today) return 'crossed'
    if (diffDays <= 1 && diffDays >= 0) return 'soon'
    return null
  }

  // Grouping Data Floor Wise (Dono lists ke liye handle karega)
  const groupDataByFloor = (dataArray) => {
    const groups = {}
    dataArray.forEach((item) => {
      const floorRaw =
        item.floor ||
        `Floor ${Math.floor(Number(item.room_no) / 100)}` ||
        'Other Floor'

      const floorName = hotelId === 'all' && item.hotel_name ? `${item.hotel_name} - ${floorRaw}` : floorRaw

      if (!groups[floorName]) {
        groups[floorName] = []
      }
      groups[floorName].push(item)
    })
    return groups
  }

  // Handle Card Click Action
  const handleCardClick = (data) => {
    setSelectedDetails(data)
    setShowModal(true)
  }

  // Trigger Backend PUT Checkout Route
  const handleCheckoutSubmit = async () => {
    if (!selectedDetails) return

    const id = selectedDetails.booking_id || selectedDetails.id
    console.log('Selected Room:', selectedDetails)
    console.log('Checkout Booking ID:', id)

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

        setRoomsData([])
        setBookingsData([])

        await fetchDetailedData()
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

  // Active dataset select karke group create karna
  const activeDataset =
    currentStatusLower === 'occupied' || currentStatusLower === 'booked'
      ? bookingsData
      : roomsData
  const floorWiseData = groupDataByFloor(activeDataset)

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
            <h2 className="fw-bold mb-0 text-capitalize" style={{ color: '#2c3e50', letterSpacing: '-0.5px' }}>
              {status === 'all' ? 'All' : status} Rooms Information
            </h2>
            <small className="text-muted fw-bold" style={{ letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Floor & Hotel Wise Details
            </small>
          </div>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" variant="primary" />
        </div>
      ) : Object.keys(floorWiseData).length === 0 ? (
        <p className="text-muted small ps-2">
          No records found under this category.
        </p>
      ) : (
        /* FLOOR WISE RENDERING */
        Object.keys(floorWiseData).map((floor) => (
          <div key={floor} className="mb-4">
            {/* Floor Name Header */}
            <h5 className="text-secondary fw-bold mb-2 border-bottom pb-1">
              {floor}
            </h5>

            {/* Containers in single horizontal row */}
            <Row className="g-2 row-cols-auto">
              {floorWiseData[floor].map((item) => {
                const itemStatus = item.status || status
                const config = getStatusConfig(itemStatus)

                return (
                  <Col key={item.room_id || item.id || item.room_no}>
                    <Card
                      onClick={() => handleCardClick(item)}
                      className={`text-center shadow-sm border-0 rounded-3 ${config.bg}`}
                      style={{
                        cursor: 'pointer',
                        minWidth: '95px',
                        maxWidth: '135px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
                    >
                      <Card.Body className="p-2 d-flex flex-column align-items-center justify-content-center">
                        {/* Room Number */}
                        <div
                          className="fw-bold"
                          style={{ fontSize: '1rem', lineHeight: '1.2' }}
                        >
                          {item.room_no}
                        </div>
                        {/* Status Label */}
                        <div
                          className="text-capitalize opacity-75"
                          style={{ fontSize: '0.7rem', marginTop: '2px' }}
                        >
                          {itemStatus}
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

      {/* DETAILED ROOM INFO & CHECKOUT MODAL */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton className="py-2 px-3">
          <Modal.Title className="h6 fw-bold">
            Room {selectedDetails?.room_no} - Details
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-3" style={{ fontSize: '0.9rem' }}>
          {selectedDetails && (
            <div>
              <p className="mb-2">
                <strong>Status:</strong>{' '}
                <span className="text-capitalize fw-bold">
                  {selectedDetails.status || status}
                </span>
              </p>

              {/* Conditional Data Display for Booked/Occupied Rooms */}
              {(selectedDetails.status || status)?.toLowerCase() === 'booked' ||
                (selectedDetails.status || status)?.toLowerCase() ===
                'occupied' ? (
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
                    {selectedDetails.total_amount || selectedDetails.price || 0}
                  </p>

                  {getCheckoutStatus(
                    selectedDetails.check_out_date,
                    selectedDetails.status || status,
                  ) === 'crossed' && (
                      <div className="alert alert-danger p-1 mb-0 mt-2 text-center small fw-bold">
                        ⚠️ Checkout Time Overdue!
                      </div>
                    )}
                </>
              ) : (
                <div className="text-muted small">
                  <p className="mb-1">
                    <strong>Room Type:</strong>{' '}
                    {selectedDetails.room_type || 'Standard'}
                  </p>
                  <p className="mb-0">
                    <strong>Price / Day:</strong> ₹
                    {selectedDetails.price ||
                      selectedDetails.price_per_day ||
                      'N/A'}
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="py-1 px-3 d-flex justify-content-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowModal(false)}
          >
            Close
          </Button>

          {/* Confirm Checkout Button: Visible only when room is Booked or Occupied */}
          {((selectedDetails?.status || status)?.toLowerCase() === 'booked' ||
            (selectedDetails?.status || status)?.toLowerCase() ===
            'occupied') && (
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

export default RoomDetailsPage
