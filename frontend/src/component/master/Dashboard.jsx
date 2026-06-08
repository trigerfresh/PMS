import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Container, Row, Col, Card, Form, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'

import { Pie, Bar } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
)

const API_URL = 'http://localhost:5000'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [hotels, setHotels] = useState([])
  const [hotelId, setHotelId] = useState(localStorage.getItem('hotelId') || '')

  const [dashboardStats, setDashboardStats] = useState({
    revenue: 0,
    todayCheckIn: 0,
    todayCheckOut: 0,
    occupancyRate: 0,
  })

  const [recentBookings, setRecentBookings] = useState([])

  const [roomStats, setRoomStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    maintenanceRooms: 0,
  })

  const [bookingStats, setBookingStats] = useState({
    total_bookings: 0,
    cancelled_bookings: 0,
    current_bookings: 0,
    reserved_bookings: 0,
    checkedout_bookings: 0,
    maintenance_bookings: 0,
    checkout_soon_bookings: 0,
    checkout_overdue_bookings: 0,
    deleted_bookings: 0,
  })

  const roomBarData = {
    labels: ['Available', 'Occupied', 'Maintenance'],
    datasets: [
      {
        label: 'Rooms',
        data: [
          roomStats.availableRooms,
          roomStats.occupiedRooms,
          roomStats.maintenanceRooms,
        ],
        backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
      },
    ],
  }

  const bookingChartData = {
    labels: [
      'Booked',
      'Reserved',
      'Cancelled',
      'Checked Out',
      'Checkout Soon',
      'Checkout Overdue',
      'Deleted',
    ],
    datasets: [
      {
        data: [
          bookingStats.current_bookings,
          bookingStats.reserved_bookings,
          bookingStats.cancelled_bookings,
          bookingStats.checkedout_bookings,
          bookingStats.checkout_soon_bookings,
          bookingStats.checkout_overdue_bookings,
          bookingStats.deleted_bookings,
        ],
        backgroundColor: [
          '#0d6efd',
          '#ffc107',
          '#dc3545',
          '#198754',
          '#28a745',
          '#ff5733',
          '#6c757d',
        ],
      },
    ],
  }

  useEffect(() => {
    fetchHotels()
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [hotelId])

  const fetchHotels = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_URL}/api/hotels`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const hotelList = res.data.data || []
      setHotels(hotelList)
      // Do not auto-select a hotel; keep empty for All Hotels
    } catch (err) {
      console.error('Hotel Load Error:', err)
    }
  }

  const fetchDeletedBookings = async () => {
    try {
      const token = localStorage.getItem('token')

      const res = await axios.get(`${API_URL}/api/deleted-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return res.data.data || []
    } catch (err) {
      console.log(err)
      return []
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [roomRes, bookingRes, deletedBookings] = await Promise.all([
        axios.get(`${API_URL}/api/rooms`),
        axios.get(`${API_URL}/api/bookings`),
        fetchDeletedBookings(),
      ])

      const rooms = roomRes.data.data || []

      const hotelRooms = hotelId
        ? rooms.filter((room) => Number(room.hotel_id) === Number(hotelId))
        : rooms

      const totalRooms = hotelRooms.length

      const occupiedRooms = hotelRooms.filter(
        (room) => room.status?.toLowerCase() === 'occupied',
      ).length

      const availableRooms = hotelRooms.filter(
        (room) =>
          room.status?.toLowerCase() === 'available' ||
          room.status?.toLowerCase() === 'avalable',
      ).length

      const maintenanceRooms = hotelRooms.filter(
        (room) => room.status?.toLowerCase() === 'maintenance',
      ).length

      const bookings = bookingRes.data.data || []

      const hotelBookings = hotelId
        ? bookings.filter(
            (booking) => Number(booking.hotel_id) === Number(hotelId),
          )
        : bookings

      const isAboutToCheckout = (checkOutDate, status) => {
        if (!checkOutDate) return false

        const s = status?.toLowerCase().trim()

        if (s !== 'booked') return false

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const checkout = new Date(checkOutDate)
        checkout.setHours(0, 0, 0, 0)

        const diffDays = (checkout - today) / (1000 * 60 * 60 * 24)

        return diffDays >= 0 && diffDays <= 1
      }

      const getCheckoutStatus = (checkOutDate, status) => {
        if (!checkOutDate) return null

        const s = status?.toLowerCase().trim()

        // Sirf Booked booking hi overdue ya soon ho sakti hai
        if (s !== 'booked') return null

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const checkout = new Date(checkOutDate)
        checkout.setHours(0, 0, 0, 0)

        const diffDays = (checkout - today) / (1000 * 60 * 60 * 24)

        if (diffDays < 0) return 'overdue'

        if (diffDays <= 1 && diffDays >= 0) return 'soon'

        return null
      }

      const occupancyRate =
        totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0

      const today = new Date().toISOString().split('T')[0]

      const todayCheckIn = hotelBookings.filter((b) => {
        const checkIn = b.check_in_date?.split('T')[0]
        return checkIn === today
      }).length

      const todayCheckOut = hotelBookings.filter(
        (b) =>
          b.status?.toLowerCase() === 'checked out' ||
          b.status?.toLowerCase() === 'checkedout',
      ).length

      const revenue = hotelBookings
        .filter((b) => b.payment_status?.toLowerCase() === 'paid')
        .reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

      setDashboardStats({ revenue, todayCheckIn, todayCheckOut, occupancyRate })

      // ===================== FIXED BOOKING STATS =====================

      const now = new Date()
      const oneDayMs = 24 * 60 * 60 * 1000

      const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, '')

      const checkoutSoon = hotelBookings.filter((b) => {
        const checkout = new Date(b.check_out_date)
        const diff = checkout - now
        const status = normalize(b.status)

        return (
          diff > 0 &&
          diff <= oneDayMs &&
          status !== 'cancelled' &&
          status !== 'deleted'
        )
      }).length

      const checkoutOverdue = hotelBookings.filter((b) => {
        const checkout = new Date(b.check_out_date)
        const status = normalize(b.status)

        return checkout < now && status !== 'cancelled' && status !== 'deleted'
      }).length

      const deletedCount = hotelBookings.filter(
        (b) => normalize(b.status) === 'deleted',
      ).length

      const cancelledCount = hotelBookings.filter(
        (b) => normalize(b.status) === 'cancelled',
      ).length

      const bookedCount = hotelBookings.filter(
        (b) => normalize(b.status) === 'booked',
      ).length

      const reservedCount = hotelBookings.filter(
        (b) => normalize(b.status) === 'reserved',
      ).length

      const checkedoutCount = hotelBookings.filter(
        (b) =>
          normalize(b.status) === 'checkedout' ||
          normalize(b.status) === 'checkedout',
      ).length

      // ✅ FINAL SET (FIXED + CONSISTENT)
      const activeBookings = hotelBookings

      const hotelDeletedBookings = hotelId
        ? deletedBookings.filter((b) => Number(b.hotel_id) === Number(hotelId))
        : deletedBookings

      setBookingStats({
        total_bookings: activeBookings.length + hotelDeletedBookings.length,

        deleted_bookings: hotelDeletedBookings.length,

        cancelled_bookings: activeBookings.filter(
          (b) => b.status?.toLowerCase().trim() === 'cancelled',
        ).length,

        current_bookings: activeBookings.filter((b) => {
          const checkInDate = b.check_in_date?.split('T')[0]

          return (
            b.status?.toLowerCase().trim() === 'booked' && checkInDate === today
          )
        }).length,

        reserved_bookings: activeBookings.filter(
          (b) => b.status?.toLowerCase().trim() === 'reserved',
        ).length,

        checkedout_bookings: activeBookings.filter(
          (b) => b.status?.toLowerCase().trim() === 'checkedout',
        ).length,

        checkout_soon_bookings: activeBookings.filter((b) =>
          isAboutToCheckout(b.check_out_date, b.status),
        ).length,

        checkout_overdue_bookings: activeBookings.filter(
          (b) => getCheckoutStatus(b.check_out_date, b.status) === 'overdue',
        ).length,
      })

      // ===================== ROOM STATS =====================

      setRoomStats({
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
      })

      // ===================== RECENT BOOKINGS =====================

      const todayBookings = hotelBookings.filter((booking) => {
        const checkInDate = booking.check_in_date?.split('T')[0]
        return checkInDate === today
      })

      const latestBookings = [...todayBookings]
        .sort((a, b) => new Date(b.created_on) - new Date(a.created_on))
        .slice(0, 5)

      setRecentBookings(latestBookings)

      hotelBookings.forEach((b) => {
        console.log('CheckIn:', b.check_in_date, 'CheckOut:', b.check_out_date)
      })
    } catch (err) {
      console.error('Dashboard Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // NOTE: Change route path according to your App.js layout routing
  const handleRoomCardClick = (statusType) => {
    const targetId = hotelId || 'all'
    navigate(`/rooms-details/${targetId}/${statusType}`)
  }

  const handleBookingCardClick = (statusType) => {
    const targetId = hotelId || 'all'
    navigate(`/booking-details/${targetId}/${statusType}`)
  }

  const handleHotelChange = (e) => {
    const value = e.target.value
    setHotelId(value)
    if (value) {
      localStorage.setItem('hotelId', value)
    } else {
      localStorage.removeItem('hotelId')
    }
  }

  return (
    <Container fluid className="dashboard-container py-4">
      {/* Header */}
      <Row className="align-items-center">
        <Col md={6}>
          <h2 className="fw-bold">Hotel Dashboard</h2>
          <small className="text-muted">Room & Booking Overview</small>
        </Col>

        <Col md={4} className="ms-auto">
          <Form.Select value={hotelId} onChange={handleHotelChange}>
            <option value="">All Hotels</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.hotel_name}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          {/* <h5 className="mb-3">Overview</h5> */}
          <h5 className="mb-1 fw-bold text-secondary">Overview</h5>
          {/* Row me justify-content classes aur gap set kiya hai taaki even look aaye */}
          <Row className="g-3 row-cols-xl-5 row-cols-md-3 row-cols-sm-2 row-cols-1">
            <Col md={3} sm={6} xs={6}>
              <Card className="dashboard-card shadow-sm border-0 rounded-3">
                <Card.Body className="bg-success text-white rounded-3 p-3">
                  <h2 className="mb-1 fw-bold">₹{dashboardStats.revenue}</h2>
                  <p className="mb-0 opacity-75 small">Revenue</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} sm={6} xs={6}>
              <Card className="dashboard-card shadow-sm border-0 rounded-3">
                <Card.Body className="bg-primary text-white rounded-3 p-3">
                  <h2 className="mb-1 fw-bold">
                    {dashboardStats.todayCheckIn}
                  </h2>
                  <p className="mb-0 opacity-75 small">Today's Check In</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} sm={6} xs={6}>
              <Card className="dashboard-card shadow-sm border-0 rounded-3">
                <Card.Body className="bg-danger text-white rounded-3 p-3">
                  <h2 className="mb-1 fw-bold">
                    {dashboardStats.todayCheckOut}
                  </h2>
                  <p className="mb-0 opacity-75 small">Today's Check Out</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} sm={6} xs={6}>
              <Card className="dashboard-card shadow-sm border-0 rounded-3">
                <Card.Body className="bg-info text-white rounded-3 p-3">
                  <h2 className="mb-1 fw-bold">
                    {dashboardStats.occupancyRate}%
                  </h2>
                  <p className="mb-0 opacity-75 small">Occupancy Rate</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ROOM STATS */}
          <h5 className="mb-1 fw-bold text-secondary">Room Summary</h5>
          <Row className="g-3">
            <Col md={2} sm={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleRoomCardClick('all')}
              >
                <Card.Body className="p-3">
                  <h2 className="mb-1 fw-bold text-dark">
                    {roomStats.totalRooms}
                  </h2>
                  <p className="text-primary mb-0 small fw-bold">
                    Total Rooms →
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={2} sm={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleRoomCardClick('available')}
              >
                <Card.Body className="p-3">
                  <h2 className="mb-1 fw-bold text-dark">
                    {roomStats.availableRooms}
                  </h2>
                  <p className="text-success mb-0 small fw-bold">Available →</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={2} sm={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleRoomCardClick('occupied')}
              >
                <Card.Body className="p-3">
                  <h2 className="mb-1 fw-bold text-dark">
                    {roomStats.occupiedRooms}
                  </h2>
                  <p className="text-danger mb-0 small fw-bold">Occupied →</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={2} sm={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleRoomCardClick('maintenance')}
              >
                <Card.Body className="p-3">
                  <h2 className="mb-1 fw-bold text-dark">
                    {roomStats.maintenanceRooms}
                  </h2>
                  <p className="text-warning mb-0 small fw-bold">
                    Maintenance →
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* BOOKING STATS SECTION */}
          {/* BOOKING STATS SECTION */}
          <h5 className="fw-bold text-secondary mt-4 mb-2">Booking Summary</h5>

          {/* scrollbar dikhne par customize karne ke liye aur continuous row maintain karne ke liye styles add kiye hain */}
          <div
            className="w-100 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="d-flex gap-2" style={{ minWidth: '900px' }}>
              {/* Card 1: Total */}
              <div className="flex-fill" style={{ width: '12.5%' }}>
                <Card
                  className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleBookingCardClick('all')}
                >
                  <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center">
                    <h4 className="mb-0 fw-bold text-dark">
                      {bookingStats.total_bookings}
                    </h4>
                    <p
                      className="mb-0 text-secondary small fw-bold mt-1"
                      style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Total →
                    </p>
                  </Card.Body>
                </Card>
              </div>

              {/* Card 2: Booked */}
              <div className="flex-fill" style={{ width: '12.5%' }}>
                <Card
                  className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleBookingCardClick('booked')}
                >
                  <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center">
                    <h4 className="mb-0 fw-bold text-primary">
                      {bookingStats.current_bookings}
                    </h4>
                    <p
                      className="text-primary mb-0 small fw-bold mt-1"
                      style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Booked →
                    </p>
                  </Card.Body>
                </Card>
              </div>

              {/* Card 3: Reserved */}
              <div className="flex-fill" style={{ width: '12.5%' }}>
                <Card
                  className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleBookingCardClick('reserved')}
                >
                  <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center">
                    <h4 className="mb-0 fw-bold text-warning">
                      {bookingStats.reserved_bookings}
                    </h4>
                    <p
                      className="text-warning mb-0 small fw-bold mt-1"
                      style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Reserved →
                    </p>
                  </Card.Body>
                </Card>
              </div>

              {/* Card 4: Cancelled */}
              <div className="flex-fill" style={{ width: '12.5%' }}>
                <Card
                  className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleBookingCardClick('cancelled')}
                >
                  <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center">
                    <h4 className="mb-0 fw-bold text-danger">
                      {bookingStats.cancelled_bookings}
                    </h4>
                    <p
                      className="text-danger mb-0 small fw-bold mt-1"
                      style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Cancelled →
                    </p>
                  </Card.Body>
                </Card>
              </div>

              {/* Card 5: Checkout Soon */}
              <div className="flex-fill" style={{ width: '12.5%' }}>
                <Card
                  className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleBookingCardClick('checkout_soon')}
                >
                  <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center">
                    <h4 className="mb-0 fw-bold text-success">
                      {bookingStats.checkout_soon_bookings}
                    </h4>
                    <p
                      className="text-success mb-0 small fw-bold mt-1"
                      style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Soon →
                    </p>
                  </Card.Body>
                </Card>
              </div>

              {/* Card 6: Checkout Overdue */}
              <div className="flex-fill" style={{ width: '12.5%' }}>
                <Card
                  className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleBookingCardClick('checkout_overdue')}
                >
                  <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center">
                    <h4 className="mb-0 fw-bold text-danger">
                      {bookingStats.checkout_overdue_bookings}
                    </h4>
                    <p
                      className="text-danger mb-0 small fw-bold mt-1"
                      style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Overdue →
                    </p>
                  </Card.Body>
                </Card>
              </div>

              {/* Card 7: Deleted */}
              <div className="flex-fill" style={{ width: '12.5%' }}>
                <Card
                  className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleBookingCardClick('deleted')}
                >
                  <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center">
                    <h4 className="mb-0 fw-bold text-muted">
                      {bookingStats.deleted_bookings}
                    </h4>
                    <p
                      className="text-muted mb-0 small fw-bold mt-1"
                      style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Deleted →
                    </p>
                  </Card.Body>
                </Card>
              </div>

              {/* Card 8: Vacant */}
              <div className="flex-fill" style={{ width: '12.5%' }}>
                <Card
                  className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleBookingCardClick('checkedout')}
                >
                  <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center">
                    <h4 className="mb-0 fw-bold text-info">
                      {bookingStats.checkedout_bookings}
                    </h4>
                    <p
                      className="text-info mb-0 small fw-bold mt-1"
                      style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Vacant →
                    </p>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </div>

          <h5 className="mt-5 mb-3">Recent Bookings</h5>
          <Card className="dashboard-card">
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((item) => (
                      <tr key={item.booking_id}>
                        <td>{item.guest_name}</td>
                        <td>{item.room_no}</td>
                        <td>{item.check_in_date?.split('T')[0]}</td>
                        <td>{item.check_out_date?.split('T')[0]}</td>
                        <td>{item.status}</td>
                        <td>₹{item.total_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {/* CHARTS */}
      <Row className="mb-4 mt-4">
        <Col md={4}>
          <Card>
            <Card.Body>
              <h5>Booking Status</h5>
              <Pie data={bookingChartData} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={7}>
          <Card>
            <Card.Body>
              <h5>Room Comparison</h5>
              <Bar data={roomBarData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Dashboard
