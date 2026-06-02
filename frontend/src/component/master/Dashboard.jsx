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
    labels: ['Booked', 'Reserved', 'Cancelled', 'Checked Out'],
    datasets: [
      {
        data: [
          bookingStats.current_bookings,
          bookingStats.reserved_bookings,
          bookingStats.cancelled_bookings,
          bookingStats.checkedout_bookings,
        ],
        backgroundColor: ['#0d6efd', '#ffc107', '#dc3545', '#198754'],
      },
    ],
  }

  useEffect(() => {
    fetchHotels()
  }, [])

  useEffect(() => {
    if (hotelId) {
      fetchDashboardData()
    }
  }, [hotelId])

  const fetchHotels = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_URL}/api/hotels`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const hotelList = res.data.data || []
      setHotels(hotelList)
      if (!localStorage.getItem('hotelId') && hotelList.length > 0) {
        setHotelId(hotelList[0].id)
      }
    } catch (err) {
      console.error('Hotel Load Error:', err)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [roomRes, bookingRes] = await Promise.all([
        axios.get(`${API_URL}/api/rooms`),
        axios.get(`${API_URL}/api/bookings`),
      ])

      const rooms = roomRes.data.data || []
      const hotelRooms = rooms.filter(
        (room) => Number(room.hotel_id) === Number(hotelId),
      )

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
      const hotelBookings = bookings.filter(
        (booking) => Number(booking.hotel_id) === Number(hotelId),
      )

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

      setBookingStats({
        total_bookings: hotelBookings.length,
        current_bookings: hotelBookings.filter(
          (x) => x.status?.toLowerCase() === 'booked',
        ).length,
        reserved_bookings: hotelBookings.filter(
          (x) => x.status?.toLowerCase() === 'reserved',
        ).length,
        cancelled_bookings: hotelBookings.filter(
          (x) => x.status?.toLowerCase() === 'cancelled',
        ).length,
        checkedout_bookings: hotelBookings.filter(
          (x) =>
            x.status?.toLowerCase() === 'checkedout' ||
            x.status?.toLowerCase() === 'checked out',
        ).length,
        // maintenance_bookings: hotelRooms.filter(
        //   (room) => room.status?.toLowerCase() === 'maintenance',
        // ).length,
      })

      setRoomStats({
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
      })

      const latestBookings = [...hotelBookings]
        .sort((a, b) => new Date(b.created_on) - new Date(a.created_on))
        .slice(0, 5)

      setRecentBookings(latestBookings)

      // console.log('Today:', today)

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
    if (!hotelId) return alert('Please select a hotel first')
    navigate(`/rooms-details/${hotelId}/${statusType}`) // Added the 's' here
  }

  const handleBookingCardClick = (statusType) => {
    if (!hotelId) return alert('Please select a hotel first')
    navigate(`/booking-details/${hotelId}/${statusType}`)
  }

  const handleHotelChange = (e) => {
    const value = e.target.value
    setHotelId(value)
    localStorage.setItem('hotelId', value)
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
          <Form.Select
            value={hotelId}
            onChange={handleHotelChange}
            onChange={(e) => setHotelId(e.target.value)}
          >
            <option value="">Select Hotel</option>
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
          <h5 className=" fw-bold text-secondary">Booking Summary</h5>
          <Row className="g-3">
            <Col md={2} sm={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleBookingCardClick('all')}
              >
                <Card.Body className="p-3">
                  <h2 className="mb-1 fw-bold text-dark">
                    {bookingStats.total_bookings}
                  </h2>
                  <p className="mb-0 text-secondary small fw-bold">Total →</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={2} sm={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleBookingCardClick('booked')}
              >
                <Card.Body className="p-3">
                  <h2 className="mb-1 fw-bold text-dark">
                    {bookingStats.current_bookings}
                  </h2>
                  <p className="text-primary mb-0 small fw-bold">Booked →</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={2} sm={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleBookingCardClick('reserved')}
              >
                <Card.Body className="p-3">
                  <h2 className="mb-1 fw-bold text-dark">
                    {bookingStats.reserved_bookings}
                  </h2>
                  <p className="text-warning mb-0 small fw-bold">Reserved →</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={2} sm={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleBookingCardClick('cancelled')}
              >
                <Card.Body className="p-3">
                  <h2 className="mb-1 fw-bold text-dark">
                    {bookingStats.cancelled_bookings}
                  </h2>
                  <p className="text-danger mb-0 small fw-bold">Cancelled →</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={2} sm={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleBookingCardClick('checkedout')}
              >
                <Card.Body className="p-3">
                  <h2 className="mb-1 fw-bold text-dark">
                    {bookingStats.checkedout_bookings}
                  </h2>
                  <p className="text-success mb-0 small fw-bold">Vacant →</p>
                </Card.Body>
              </Card>
            </Col>

            {/* <Col md={2} sm={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleBookingCardClick('maintenance')}
              >
                <Card.Body className="p-3">
                  <h2 className="mb-1 fw-bold text-dark">
                    {bookingStats.maintenance_bookings}
                  </h2>
                  <p className="text-secondary mb-0 small fw-bold">
                    Maintenance
                  </p>
                </Card.Body>
              </Card>
            </Col> */}
          </Row>

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
