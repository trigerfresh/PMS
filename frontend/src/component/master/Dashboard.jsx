import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Container, Row, Col, Card, Form, Spinner, Dropdown } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import {
  FaRupeeSign,
  FaSignInAlt,
  FaSignOutAlt,
  FaPercentage,
  FaBed,
  FaDoorOpen,
  FaDoorClosed,
  FaWrench,
  FaChartLine,
  FaCheckCircle,
  FaCalendarAlt,
  FaTimesCircle,
  FaClock,
  FaExclamationCircle,
  FaTrashAlt
} from 'react-icons/fa'
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
  const [searchHotel, setSearchHotel] = useState('')

  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState(localStorage.getItem('branchId') || '')
  const [searchBranch, setSearchBranch] = useState('')

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
    reservedRooms: 0,
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
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [hotelId, branchId, hotels])

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

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = `${API_URL}/api/branch`

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const allBranches = res.data.data || []
      setBranches(allBranches)
    } catch (err) {
      console.error('Branch Load Error:', err)
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

      // Find all hotels that belong to the selected branch
      const branchHotelIds = branchId
        ? hotels.filter((h) => h.branch_id == branchId).map((h) => Number(h.id))
        : []

      const hotelRooms = hotelId
        ? rooms.filter((room) => Number(room.hotel_id) === Number(hotelId))
        : rooms

      const branchRooms = branchId
        ? hotelRooms.filter((room) => branchHotelIds.includes(Number(room.hotel_id)))
        : hotelRooms

      const totalRooms = branchRooms.length

      const occupiedRooms = branchRooms.filter(
        (room) => room.status?.toLowerCase() === 'occupied',
      ).length

      const availableRooms = branchRooms.filter(
        (room) =>
          room.status?.toLowerCase() === 'available' ||
          room.status?.toLowerCase() === 'avalable',
      ).length

      const maintenanceRooms = branchRooms.filter(
        (room) => room.status?.toLowerCase() === 'maintenance',
      ).length

      const reservedRooms = branchRooms.filter(
        (room) => room.status?.toLowerCase() === 'reserved',
      ).length

      const bookings = bookingRes.data.data || []

      const hotelBookings = hotelId
        ? bookings.filter(
          (booking) => Number(booking.hotel_id) === Number(hotelId),
        )
        : bookings

      const branchBookings = branchId
        ? hotelBookings.filter(
          (booking) => branchHotelIds.includes(Number(booking.hotel_id)),
        )
        : hotelBookings

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

      const todayCheckIn = branchBookings.filter((b) => {
        const checkIn = b.check_in_date?.split('T')[0]
        const status = b.status?.toLowerCase().trim()
        return checkIn === today && status === 'booked'
      }).length

      const todayCheckOut = branchBookings.filter((b) => {
        const checkOut = b.check_out_date?.split('T')[0]
        const status = b.status?.toLowerCase().replace(/\s+/g, '')
        return checkOut === today && status === 'checkedout'
      }).length

      const revenue = branchBookings
        .filter((b) => b.payment_status?.toLowerCase() === 'paid')
        .reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

      setDashboardStats({ revenue, todayCheckIn, todayCheckOut, occupancyRate })

      // ===================== FIXED BOOKING STATS =====================

      const now = new Date()
      const oneDayMs = 24 * 60 * 60 * 1000

      const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, '')

      const checkoutSoon = branchBookings.filter((b) => {
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

      const checkoutOverdue = branchBookings.filter((b) => {
        const checkout = new Date(b.check_out_date)
        const status = normalize(b.status)

        return checkout < now && status !== 'cancelled' && status !== 'deleted'
      }).length

      const deletedCount = branchBookings.filter(
        (b) => normalize(b.status) === 'deleted',
      ).length

      const cancelledCount = branchBookings.filter(
        (b) => normalize(b.status) === 'cancelled',
      ).length

      const bookedCount = branchBookings.filter(
        (b) => normalize(b.status) === 'booked',
      ).length

      const reservedCount = branchBookings.filter(
        (b) => normalize(b.status) === 'reserved',
      ).length

      const checkedoutCount = branchBookings.filter(
        (b) =>
          normalize(b.status) === 'checkedout' ||
          normalize(b.status) === 'checkedout',
      ).length

      // ✅ FINAL SET (FIXED + CONSISTENT)
      const activeBookings = branchBookings

      const hotelDeletedBookings = hotelId
        ? deletedBookings.filter((b) => Number(b.hotel_id) === Number(hotelId))
        : deletedBookings

      const branchDeletedBookings = branchId
        ? hotelDeletedBookings.filter((b) => branchHotelIds.includes(Number(b.hotel_id)))
        : hotelDeletedBookings

      setBookingStats({
        total_bookings: activeBookings.length + branchDeletedBookings.length,

        deleted_bookings: branchDeletedBookings.length,

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
        reservedRooms,
      })

      // ===================== RECENT BOOKINGS =====================

      const todayBookings = branchBookings.filter((booking) => {
        const checkInDate = booking.check_in_date?.split('T')[0]
        const status = booking.status?.toLowerCase().trim()
        return checkInDate === today && status === 'booked'
      })

      const latestBookings = [...todayBookings]
        .sort((a, b) => new Date(b.created_on) - new Date(a.created_on))
        .slice(0, 5)

      setRecentBookings(latestBookings)

      branchBookings.forEach((b) => {
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

    let autoBranchId = ''
    if (value) {
      localStorage.setItem('hotelId', value)
      const selectedHotel = hotels.find(h => h.id == value)
      if (selectedHotel && selectedHotel.branch_id) {
        autoBranchId = selectedHotel.branch_id
      }
    } else {
      localStorage.removeItem('hotelId')
    }

    setBranchId(autoBranchId)
    if (autoBranchId) {
      localStorage.setItem('branchId', autoBranchId)
    } else {
      localStorage.removeItem('branchId')
    }
  }

  const handleBranchChange = (e) => {
    const value = e.target.value
    setBranchId(value)
    if (value) {
      localStorage.setItem('branchId', value)
    } else {
      localStorage.removeItem('branchId')
    }
  }

  return (
    <Container fluid className="page-container" style={{
      background: 'linear-gradient(135deg, #f6f8fc 0%, #e9edf5 100%)',
      minHeight: '100vh',
      transition: 'background-color 0.5s ease',
    }}>
      {/* Header */}
      <Row className="align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05) !important' }}>
        <Col md={12} lg={5} xl={6} className="mb-3 mb-lg-0">
          <h2 className="fw-bold" style={{ color: '#2c3e50', letterSpacing: '-0.5px' }}>Hotel Dashboard</h2>
          <small className="text-muted fw-bold" style={{ letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>Room & Booking Overview</small>
        </Col>

        <Col md={12} lg={7} xl={6} className="d-flex flex-column flex-sm-row gap-3 justify-content-lg-end pe-lg-4">
          {/* Hotel Dropdown */}
          <Dropdown align="end" onSelect={(val) => handleHotelChange({ target: { value: val } })} className="flex-fill" style={{ minWidth: 0 }}>
            <Dropdown.Toggle
              variant="light"
              title={hotelId ? hotels.find(h => h.id == hotelId)?.hotel_name || 'All Hotels' : 'All Hotels'}
              className="shadow-sm border-0 rounded-pill px-3 px-md-4 w-100 d-flex justify-content-between align-items-center"
              style={{
                backgroundColor: 'white',
                color: '#495057',
                fontWeight: '500',
                fontSize: '1rem',
                paddingTop: '0.6rem',
                paddingBottom: '0.6rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              <span className="text-truncate" style={{ maxWidth: '90%' }}>
                {hotelId ? hotels.find(h => h.id == hotelId)?.hotel_name || 'All Hotels' : 'All Hotels'}
              </span>
            </Dropdown.Toggle>

            <style>
              {`
                .hotel-dropdown-item {
                  transition: all 0.2s ease;
                }
                .hotel-dropdown-item:hover {
                  background-color: #f1f5f9 !important;
                  color: #212529 !important;
                }
                .hotel-dropdown-item.active, .hotel-dropdown-item.active:hover {
                  background-color: #0d6efd !important;
                  color: white !important;
                }
                .dropdown-toggle:hover, .dropdown-toggle:focus, .dropdown-toggle:active {
                  background-color: #f8f9fa !important;
                  color: #495057 !important;
                  border-color: transparent !important;
                }
                @media (min-width: 1024px) {
                  .booking-summary-col {
                    flex: 0 0 auto;
                    width: 12.5% !important;
                  }
                }
              `}
            </style>
            <Dropdown.Menu className="w-100 border-0 shadow-lg rounded-4 mt-2 p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <div className="px-2 pb-2 mb-2 border-bottom">
                <input
                  autoFocus
                  type="text"
                  className="form-control form-control-sm rounded-pill px-3"
                  placeholder="Type to search..."
                  onChange={(e) => setSearchHotel(e.target.value)}
                  value={searchHotel}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <Dropdown.Item
                eventKey=""
                active={hotelId === ''}
                className="hotel-dropdown-item py-2 px-3 fw-medium rounded-3 mb-1"
                onClick={() => setSearchHotel('')}
              >
                All Hotels
              </Dropdown.Item>
              {hotels.filter(h => h.hotel_name.toLowerCase().includes(searchHotel.toLowerCase())).map((hotel) => (
                <Dropdown.Item
                  key={hotel.id}
                  eventKey={hotel.id.toString()}
                  active={hotelId == hotel.id}
                  className="hotel-dropdown-item py-2 px-3 fw-medium rounded-3 mb-1"
                  onClick={() => setSearchHotel('')}
                >
                  {hotel.hotel_name}
                </Dropdown.Item>
              ))}
              {hotels.filter(h => h.hotel_name.toLowerCase().includes(searchHotel.toLowerCase())).length === 0 && (
                <div className="text-muted text-center py-2 small">No hotels found</div>
              )}
            </Dropdown.Menu>
          </Dropdown>

          {/* Branch Dropdown */}
          <Dropdown align="end" onSelect={(val) => handleBranchChange({ target: { value: val } })} className="flex-fill" style={{ minWidth: 0 }}>
            <Dropdown.Toggle
              variant="light"
              title={branchId ? branches.find(b => b.id == branchId)?.branch_name || 'All Branches' : 'All Branches'}
              className="shadow-sm border-0 rounded-pill px-3 px-md-4 w-100 d-flex justify-content-between align-items-center"
              style={{
                backgroundColor: 'white',
                color: '#495057',
                fontWeight: '500',
                fontSize: '1rem',
                paddingTop: '0.6rem',
                paddingBottom: '0.6rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              disabled={!hotelId}
            >
              <span className="text-truncate" style={{ maxWidth: '90%' }}>
                {branchId ? branches.find(b => b.id == branchId)?.branch_name || 'All Branches' : 'All Branches'}
              </span>
            </Dropdown.Toggle>

            <Dropdown.Menu className="w-100 border-0 shadow-lg rounded-4 mt-2 p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <div className="px-2 pb-2 mb-2 border-bottom">
                <input
                  autoFocus
                  type="text"
                  className="form-control form-control-sm rounded-pill px-3"
                  placeholder="Type to search..."
                  onChange={(e) => setSearchBranch(e.target.value)}
                  value={searchBranch}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <Dropdown.Item
                eventKey=""
                active={branchId === ''}
                className="hotel-dropdown-item py-2 px-3 fw-medium rounded-3 mb-1"
                onClick={() => setSearchBranch('')}
              >
                All Branches
              </Dropdown.Item>
              {branches
                .filter(b => b.branch_name.toLowerCase().includes(searchBranch.toLowerCase()))
                .filter(b => {
                  if (!hotelId) return true;
                  const selectedHotel = hotels.find(h => h.id == hotelId);
                  return selectedHotel && selectedHotel.branch_id ? b.id == selectedHotel.branch_id : true;
                })
                .map((branch) => (
                  <Dropdown.Item
                    key={branch.id}
                    eventKey={branch.id.toString()}
                    active={branchId == branch.id}
                    className="hotel-dropdown-item py-2 px-3 fw-medium rounded-3 mb-1"
                    onClick={() => setSearchBranch('')}
                  >
                    {branch.branch_name}
                  </Dropdown.Item>
                ))}
              {branches
                .filter(b => b.branch_name.toLowerCase().includes(searchBranch.toLowerCase()))
                .filter(b => {
                  if (!hotelId) return true;
                  const selectedHotel = hotels.find(h => h.id == hotelId);
                  return selectedHotel && selectedHotel.branch_id ? b.id == selectedHotel.branch_id : true;
                })
                .length === 0 && (
                  <div className="text-muted text-center py-2 small">No branches found</div>
                )}
            </Dropdown.Menu>
          </Dropdown>
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
            <Col lg={3} md={6} xs={12}>
              <Card onClick={() => navigate('/master/revenue-report')} className="dashboard-card shadow-sm border-0 rounded-3" style={{ transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}>
                <Card.Body className="text-white rounded-3 p-3 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' }}>
                  <FaRupeeSign className="position-absolute" size={60} style={{ right: '-10px', bottom: '-10px', opacity: 0.2 }} />
                  <h2 className="mb-1 fw-bold position-relative z-1">₹{dashboardStats.revenue.toLocaleString('en-IN')}</h2>
                  <p className="mb-0 opacity-100 small fw-bold position-relative z-1" style={{ letterSpacing: '0.5px' }}>Revenue</p>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} xs={12}>
              <Card onClick={() => navigate('/master/today-checkin')} className="dashboard-card shadow-sm border-0 rounded-3" style={{ transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}>
                <Card.Body className="text-white rounded-3 p-3 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4481eb 0%, #04befe 100%)' }}>
                  <FaSignInAlt className="position-absolute" size={60} style={{ right: '-5px', bottom: '-10px', opacity: 0.2 }} />
                  <h2 className="mb-1 fw-bold position-relative z-1">
                    {dashboardStats.todayCheckIn}
                  </h2>
                  <p className="mb-0 opacity-100 small fw-bold position-relative z-1" style={{ letterSpacing: '0.5px' }}>Today's Check In</p>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} xs={12}>
              <Card onClick={() => navigate('/master/today-checkout')} className="dashboard-card shadow-sm border-0 rounded-3" style={{ transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}>
                <Card.Body className="text-white rounded-3 p-3 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)' }}>
                  <FaSignOutAlt className="position-absolute" size={60} style={{ right: '-5px', bottom: '-10px', opacity: 0.2 }} />
                  <h2 className="mb-1 fw-bold position-relative z-1">
                    {dashboardStats.todayCheckOut}
                  </h2>
                  <p className="mb-0 opacity-100 small fw-bold position-relative z-1" style={{ letterSpacing: '0.5px' }}>Today's Check Out</p>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} xs={12}>
              <Card onClick={() => navigate('/master/occupancy')} className="dashboard-card shadow-sm border-0 rounded-3" style={{ transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}>
                <Card.Body className="text-white rounded-3 p-3 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #b92b27 0%, #1565C0 100%)' }}>
                  <FaPercentage className="position-absolute" size={60} style={{ right: '-5px', bottom: '-10px', opacity: 0.2 }} />
                  <h2 className="mb-1 fw-bold position-relative z-1">
                    {dashboardStats.occupancyRate}%
                  </h2>
                  <p className="mb-0 opacity-100 small fw-bold position-relative z-1" style={{ letterSpacing: '0.5px' }}>Occupancy Rate</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ROOM STATS */}
          <h5 className="mb-1 fw-bold text-secondary mt-4">Room Summary</h5>
          <Row className="g-3">
            <Col xl={2} lg={3} md={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleRoomCardClick('all')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-3 position-relative overflow-hidden bg-white rounded-3">
                  <FaBed className="position-absolute text-primary" size={40} style={{ right: '5px', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }} />
                  <h2 className="mb-1 fw-bold text-dark position-relative z-1">
                    {roomStats.totalRooms}
                  </h2>
                  <p className="text-primary mb-0 small fw-bold position-relative z-1">
                    Total Rooms →
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={2} lg={3} md={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleRoomCardClick('available')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-3 position-relative overflow-hidden bg-white rounded-3">
                  <FaDoorOpen className="position-absolute text-success" size={40} style={{ right: '5px', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }} />
                  <h2 className="mb-1 fw-bold text-dark position-relative z-1">
                    {roomStats.availableRooms}
                  </h2>
                  <p className="text-success mb-0 small fw-bold position-relative z-1">Available →</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={2} lg={3} md={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleRoomCardClick('occupied')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-3 position-relative overflow-hidden bg-white rounded-3">
                  <FaDoorClosed className="position-absolute text-danger" size={40} style={{ right: '5px', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }} />
                  <h2 className="mb-1 fw-bold text-dark position-relative z-1">
                    {roomStats.occupiedRooms}
                  </h2>
                  <p className="text-danger mb-0 small fw-bold position-relative z-1">Occupied →</p>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={2} lg={3} md={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleRoomCardClick('maintenance')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-3 position-relative overflow-hidden bg-white rounded-3">
                  <FaWrench className="position-absolute text-warning" size={40} style={{ right: '5px', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }} />
                  <h2 className="mb-1 fw-bold text-dark position-relative z-1">
                    {roomStats.maintenanceRooms}
                  </h2>
                  <p className="text-warning mb-0 small fw-bold position-relative z-1">
                    Maintenance →
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={2} lg={3} md={4} xs={6}>
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleRoomCardClick('reserved')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-3 position-relative overflow-hidden bg-white rounded-3">
                  <FaCalendarAlt className="position-absolute text-info" size={40} style={{ right: '5px', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }} />
                  <h2 className="mb-1 fw-bold text-dark position-relative z-1">
                    {roomStats.reservedRooms}
                  </h2>
                  <p className="text-info mb-0 small fw-bold position-relative z-1">
                    Reserved →
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* BOOKING STATS SECTION */}
          <h5 className="fw-bold text-secondary mt-4 mb-2">Booking Summary</h5>

          <Row className="g-3">
            {/* Card 1: Total */}
            <div className="booking-summary-col col-6 col-sm-3">
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleBookingCardClick('all')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center position-relative overflow-hidden bg-white rounded-3">
                  <FaChartLine className="position-absolute text-secondary" size={30} style={{ opacity: 0.05 }} />
                  <h4 className="mb-0 fw-bold text-dark position-relative z-1">
                    {bookingStats.total_bookings}
                  </h4>
                  <p
                    className="mb-0 text-secondary small fw-bold mt-1 position-relative z-1"
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    Total →
                  </p>
                </Card.Body>
              </Card>
            </div>

            {/* Card 2: Booked */}
            <div className="booking-summary-col col-6 col-sm-3">
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleBookingCardClick('booked')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center position-relative overflow-hidden bg-white rounded-3">
                  <FaCheckCircle className="position-absolute text-primary" size={30} style={{ opacity: 0.05 }} />
                  <h4 className="mb-0 fw-bold text-primary position-relative z-1">
                    {bookingStats.current_bookings}
                  </h4>
                  <p
                    className="text-primary mb-0 small fw-bold mt-1 position-relative z-1"
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    Booked →
                  </p>
                </Card.Body>
              </Card>
            </div>

            {/* Card 3: Reserved */}
            <div className="booking-summary-col col-6 col-sm-3">
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleBookingCardClick('reserved')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center position-relative overflow-hidden bg-white rounded-3">
                  <FaCalendarAlt className="position-absolute text-warning" size={30} style={{ opacity: 0.05 }} />
                  <h4 className="mb-0 fw-bold text-warning position-relative z-1">
                    {bookingStats.reserved_bookings}
                  </h4>
                  <p
                    className="text-warning mb-0 small fw-bold mt-1 position-relative z-1"
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    Reserved →
                  </p>
                </Card.Body>
              </Card>
            </div>

            {/* Card 4: Cancelled */}
            <div className="booking-summary-col col-6 col-sm-3">
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleBookingCardClick('cancelled')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center position-relative overflow-hidden bg-white rounded-3">
                  <FaTimesCircle className="position-absolute text-danger" size={30} style={{ opacity: 0.05 }} />
                  <h4 className="mb-0 fw-bold text-danger position-relative z-1">
                    {bookingStats.cancelled_bookings}
                  </h4>
                  <p
                    className="text-danger mb-0 small fw-bold mt-1 position-relative z-1"
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    Cancelled →
                  </p>
                </Card.Body>
              </Card>
            </div>

            {/* Card 5: Checkout Soon */}
            <div className="booking-summary-col col-6 col-sm-3">
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleBookingCardClick('checkout_soon')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center position-relative overflow-hidden bg-white rounded-3">
                  <FaClock className="position-absolute text-success" size={30} style={{ opacity: 0.05 }} />
                  <h4 className="mb-0 fw-bold text-success position-relative z-1">
                    {bookingStats.checkout_soon_bookings}
                  </h4>
                  <p
                    className="text-success mb-0 small fw-bold mt-1 position-relative z-1"
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    Soon →
                  </p>
                </Card.Body>
              </Card>
            </div>

            {/* Card 6: Checkout Overdue */}
            <div className="booking-summary-col col-6 col-sm-3">
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleBookingCardClick('checkout_overdue')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center position-relative overflow-hidden bg-white rounded-3">
                  <FaExclamationCircle className="position-absolute text-danger" size={30} style={{ opacity: 0.05 }} />
                  <h4 className="mb-0 fw-bold text-danger position-relative z-1">
                    {bookingStats.checkout_overdue_bookings}
                  </h4>
                  <p
                    className="text-danger mb-0 small fw-bold mt-1 position-relative z-1"
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    Overdue →
                  </p>
                </Card.Body>
              </Card>
            </div>

            {/* Card 7: Deleted */}
            <div className="booking-summary-col col-6 col-sm-3">
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleBookingCardClick('deleted')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center position-relative overflow-hidden bg-white rounded-3">
                  <FaTrashAlt className="position-absolute text-muted" size={30} style={{ opacity: 0.05 }} />
                  <h4 className="mb-0 fw-bold text-muted position-relative z-1">
                    {bookingStats.deleted_bookings}
                  </h4>
                  <p
                    className="text-muted mb-0 small fw-bold mt-1 position-relative z-1"
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    Deleted →
                  </p>
                </Card.Body>
              </Card>
            </div>

            {/* Card 8: Vacant */}
            <div className="booking-summary-col col-6 col-sm-3">
              <Card
                className="dashboard-card shadow-sm border-0 rounded-3 h-100"
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleBookingCardClick('checkedout')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.classList.add('shadow'); }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.classList.remove('shadow'); }}
              >
                <Card.Body className="p-2 d-flex flex-column justify-content-center align-items-center text-center position-relative overflow-hidden bg-white rounded-3">
                  <FaDoorOpen className="position-absolute text-info" size={30} style={{ opacity: 0.05 }} />
                  <h4 className="mb-0 fw-bold text-info position-relative z-1">
                    {bookingStats.checkedout_bookings}
                  </h4>
                  <p
                    className="text-info mb-0 small fw-bold mt-1 position-relative z-1"
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    Vacant →
                  </p>
                </Card.Body>
              </Card>
            </div>
          </Row>

          <h5 className="mt-5 mb-3 fw-bold text-secondary">Recent Bookings</h5>
          <Card className="dashboard-card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3 text-secondary text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Guest</th>
                      <th className="border-0 px-4 py-3 text-secondary text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Room</th>
                      <th className="border-0 px-4 py-3 text-secondary text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Check In</th>
                      <th className="border-0 px-4 py-3 text-secondary text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Check Out</th>
                      <th className="border-0 px-4 py-3 text-secondary text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Status</th>
                      <th className="border-0 px-4 py-3 text-secondary text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((item) => (
                      <tr key={item.booking_id} style={{ transition: 'all 0.2s ease' }} className="table-row-hover">
                        <td className="px-4 py-3 fw-bold text-dark">{item.guest_name}</td>
                        <td className="px-4 py-3 text-primary fw-bold">{item.room_no}</td>
                        <td className="px-4 py-3 text-secondary">{item.check_in_date?.split('T')[0]}</td>
                        <td className="px-4 py-3 text-secondary">{item.check_out_date?.split('T')[0]}</td>
                        <td className="px-4 py-3">
                          <span className={`badge rounded-pill px-3 py-2 text-capitalize text-white shadow-sm ${item.status?.toLowerCase() === 'booked' ? 'bg-primary' :
                            item.status?.toLowerCase() === 'reserved' ? 'bg-warning text-dark' :
                              item.status?.toLowerCase() === 'checked out' || item.status?.toLowerCase() === 'checkedout' ? 'bg-success' :
                                item.status?.toLowerCase() === 'cancelled' ? 'bg-danger' :
                                  'bg-secondary'
                            }`} style={{ minWidth: '110px', display: 'inline-block', letterSpacing: '0.5px' }}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 fw-bold text-success">₹{item.total_amount}</td>
                      </tr>
                    ))}
                    {recentBookings.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">No recent bookings.</td>
                      </tr>
                    )}
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
