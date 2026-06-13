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
  Dropdown,
  Table,
  Badge,
} from 'react-bootstrap'
import { FaArrowLeft, FaThLarge, FaList } from 'react-icons/fa'

const API_URL = 'http://localhost:5000'

const BookingDetails = () => {
  const { hotelId, statusType } = useParams()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')

  const [hotels, setHotels] = useState([])
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState(
    localStorage.getItem('branchId') || '',
  )
  const [searchHotel, setSearchHotel] = useState('')
  const [searchBranch, setSearchBranch] = useState('')
  const [overallCounts, setOverallCounts] = useState({
    total: 0,
    booked: 0,
    reserved: 0,
    cancelled: 0,
    soon: 0,
    overdue: 0,
    deleted: 0,
    checkedout: 0,
  })

  // Modal states for Info and Checkout
  const [showModal, setShowModal] = useState(false)
  const [selectedDetails, setSelectedDetails] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    fetchHotels()
    fetchBranches()
  }, [])

  const fetchHotels = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_URL}/api/hotels`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setHotels(res.data.data || [])
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
      setBranches(res.data.data || [])
    } catch (err) {
      console.error('Branch Load Error:', err)
    }
  }

  const handleHotelChange = (e) => {
    const value = e.target.value
    let autoBranchId = ''
    if (value) {
      localStorage.setItem('hotelId', value)
      const selectedHotel = hotels.find((h) => h.id == value)
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
    navigate(`/booking-details/${value || 'all'}/${statusType}`)
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

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')
      const [bookingsRes, deletedRes, roomsRes] = await Promise.all([
        axios.get(`${API_URL}/api/bookings`),
        axios.get(`${API_URL}/api/deleted-bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/rooms`),
      ])

      const allBookings = bookingsRes.data.data || []
      const allDeleted = deletedRes.data.data || []
      const allRooms = roomsRes.data.data || []

      const branchHotelIds = branchId
        ? hotels.filter((h) => h.branch_id == branchId).map((h) => Number(h.id))
        : []

      const hotelBookingsRaw =
        hotelId && hotelId !== 'all'
          ? allBookings.filter((b) => Number(b.hotel_id) === Number(hotelId))
          : allBookings

      const hotelBookings = branchId
        ? hotelBookingsRaw.filter((b) =>
          branchHotelIds.includes(Number(b.hotel_id)),
        )
        : hotelBookingsRaw

      const hotelDeletedRaw =
        hotelId && hotelId !== 'all'
          ? allDeleted.filter((b) => Number(b.hotel_id) === Number(hotelId))
          : allDeleted

      const hotelDeleted = branchId
        ? hotelDeletedRaw.filter((b) =>
          branchHotelIds.includes(Number(b.hotel_id)),
        )
        : hotelDeletedRaw

      const hotelRoomsRaw =
        hotelId && hotelId !== 'all'
          ? allRooms.filter((r) => Number(r.hotel_id) === Number(hotelId))
          : allRooms

      const hotelRooms = branchId
        ? hotelRoomsRaw.filter((r) =>
          branchHotelIds.includes(Number(r.hotel_id)),
        )
        : hotelRoomsRaw

      const now = new Date()
      const oneDayMs = 24 * 60 * 60 * 1000
      const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, '')

      const isAboutToCheckout = (checkOutDate, status) => {
        if (!checkOutDate) return false
        const s = status?.toLowerCase().trim()
        if (s !== 'booked') return false
        const todayObj = new Date()
        todayObj.setHours(0, 0, 0, 0)
        const checkout = new Date(checkOutDate)
        checkout.setHours(0, 0, 0, 0)
        const diffDays = (checkout - todayObj) / (1000 * 60 * 60 * 24)
        return diffDays >= 0 && diffDays <= 1
      }

      const getCheckoutStatus = (checkOutDate, status) => {
        if (!checkOutDate) return null
        const s = status?.toLowerCase().trim()
        if (s !== 'booked') return null
        const todayObj = new Date()
        todayObj.setHours(0, 0, 0, 0)
        const checkout = new Date(checkOutDate)
        checkout.setHours(0, 0, 0, 0)
        const diffDays = (checkout - todayObj) / (1000 * 60 * 60 * 24)
        if (diffDays < 0) return 'overdue'
        if (diffDays <= 1 && diffDays >= 0) return 'soon'
        return null
      }
      const todayString = now.toISOString().split('T')[0]
      let counts = {
        total: hotelBookings.length + hotelDeleted.length,
        booked: hotelBookings.filter(
          (b) =>
            b.status?.toLowerCase().trim() === 'booked' &&
            b.check_in_date?.split('T')[0] === todayString,
        ).length,
        reserved: hotelBookings.filter(
          (b) => b.status?.toLowerCase().trim() === 'reserved',
        ).length,
        cancelled: hotelBookings.filter(
          (b) => b.status?.toLowerCase().trim() === 'cancelled',
        ).length,
        soon: hotelBookings.filter((b) =>
          isAboutToCheckout(b.check_out_date, b.status),
        ).length,
        overdue: hotelBookings.filter(
          (b) => getCheckoutStatus(b.check_out_date, b.status) === 'overdue',
        ).length,
        deleted: hotelDeleted.length,
        checkedout: hotelBookings.filter(
          (b) => b.status?.toLowerCase().trim() === 'checkedout',
        ).length,
      }

      setOverallCounts(counts)

      let data = []

      if (statusType === 'maintenance') {
        data = hotelRooms.filter(
          (room) => normalize(room.status) === 'maintenance',
        )
      } else if (statusType === 'deleted') {
        data = hotelDeleted.map((d) => ({ ...d, status: 'deleted' }))
      } else if (statusType === 'all') {
        data = hotelBookings
      } else {
        data = hotelBookings.filter((b) => {
          const status = normalize(b.status)

          if (statusType === 'booked') {
            return (
              b.status?.toLowerCase().trim() === 'booked' &&
              b.check_in_date?.split('T')[0] === todayString
            )
          }

          if (statusType === 'checkedout') {
            return status === 'checkedout'
          }

          if (statusType === 'checkout_soon') {
            const isSoon = isAboutToCheckout(b.check_out_date, b.status)
            if (isSoon) b.displayStatus = 'Checkout Soon'
            return isSoon
          }

          if (statusType === 'checkout_overdue') {
            const isOverdue =
              getCheckoutStatus(b.check_out_date, b.status) === 'overdue'
            if (isOverdue) {
              const todayObj = new Date()
              todayObj.setHours(0, 0, 0, 0)
              const checkOutDate = new Date(b.check_out_date)
              checkOutDate.setHours(0, 0, 0, 0)
              const diffTime = todayObj.getTime() - checkOutDate.getTime()
              const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000))
              b.displayStatus = `Overdue (${diffDays} day${diffDays > 1 ? 's' : ''})`
              b.statusTypeForColor = 'checkoutoverdue'
            }
            return isOverdue
          }

          return status === normalize(statusType)
        })
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
  }, [hotelId, statusType, branchId, hotels])

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
      case 'checkout_soon':
        return 'Checkout Soon Bookings List'
      case 'checkout_overdue':
        return 'Checkout Overdue Bookings List'
      case 'deleted':
        return 'Deleted Bookings List'
      default:
        return 'All Bookings List'
    }
  }

  const getCheckoutStatus = (checkOutDate, roomStatus) => {
    if (!checkOutDate) return null
    const s = roomStatus?.toLowerCase()
    if (s === 'cancelled' || s === 'checkedout' || s === 'deleted') return null

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

  // Color Mapping as per your request
  const getStatusConfig = (status) => {
    const currentStatus = status?.toLowerCase().replace(/\s+/g, '')
    switch (currentStatus) {
      case 'booked':
      case 'occupied':
        return { bg: 'bg-success text-white border-success' } // Green color
      case 'reserved':
        return { bg: 'bg-info text-white border-info' } // Blue color
      case 'cancelled':
        return { bg: 'bg-dark text-white border-dark' } // Dark color
      case 'checkoutsoon':
      case 'maintenance':
        return { bg: 'bg-warning text-dark border-warning' } // Warning/Yellow color
      case 'checkoutoverdue':
        return { bg: 'bg-danger text-white border-danger' } // Red color
      case 'deleted':
        return { bg: 'bg-secondary text-white border-secondary' } // Grey color
      case 'checkedout':
      case 'vacant':
        return { bg: 'bg-primary text-white border-primary' } // Blue/Primary color
      default:
        return { bg: 'bg-light text-dark border-secondary' } // Light color
    }
  }

  // Helper logic to group bookings floor wise
  const groupBookingsByFloor = () => {
    const groups = {}
    bookings.forEach((item) => {
      const floorRaw =
        item.floor ||
        `Floor ${Math.floor(Number(item.room_no) / 100)}` ||
        'Other Floor'

      const floorName =
        hotelId === 'all' && item.hotel_name
          ? `${item.hotel_name} - ${floorRaw}`
          : floorRaw

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
    <Container
      fluid
      className="page-container"
      style={{
        background: 'linear-gradient(135deg, #f6f8fc 0%, #e9edf5 100%)',
        minHeight: '100vh',
        transition: 'background-color 0.5s ease',
      }}
    >
      <Row
        className="align-items-center mb-4 pb-3 border-bottom"
        style={{ borderColor: 'rgba(0,0,0,0.05) !important' }}
      >
        <Col
          md={12}
          lg={5}
          xl={6}
          className="d-flex align-items-center mb-3 mb-lg-0"
        >
          <Button
            variant="light"
            className="shadow-sm rounded-circle d-flex align-items-center justify-content-center me-3"
            onClick={() => navigate(-1)}
            style={{
              width: '45px',
              height: '45px',
              border: '1px solid #e2e8f0',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <span style={{ fontSize: '1.2rem', color: '#64748b' }}>←</span>
          </Button>
          <div className="d-flex flex-column">
            <h2
              className="fw-bold mb-0 text-capitalize d-flex align-items-center gap-3"
              style={{ color: '#2c3e50', letterSpacing: '-0.5px' }}
            >
              {getTitle()}
              <span className="badge bg-success bg-opacity-10 text-success rounded-pill fs-6 px-3">
                {bookings.length}
              </span>
            </h2>
            <small
              className="text-muted fw-bold d-block mt-1"
              style={{
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}
            >
              Floor & Hotel Wise Details
            </small>
          </div>
        </Col>

        <Col
          md={12}
          lg={7}
          xl={6}
          className="d-flex flex-column flex-sm-row gap-3 justify-content-lg-end pe-lg-4"
        >
          {/* Hotel Dropdown */}
          <Dropdown
            align="end"
            onSelect={(val) => handleHotelChange({ target: { value: val } })}
            className="flex-fill"
            style={{ minWidth: 0 }}
          >
            <Dropdown.Toggle
              variant="light"
              title={
                hotelId && hotelId !== 'all'
                  ? hotels.find((h) => h.id == hotelId)?.hotel_name ||
                  'All Hotels'
                  : 'All Hotels'
              }
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
                textOverflow: 'ellipsis',
              }}
            >
              <span className="text-truncate" style={{ maxWidth: '90%' }}>
                {hotelId && hotelId !== 'all'
                  ? hotels.find((h) => h.id == hotelId)?.hotel_name ||
                  'All Hotels'
                  : 'All Hotels'}
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
              `}
            </style>
            <Dropdown.Menu
              className="w-100 border-0 shadow-lg rounded-4 mt-2 p-2"
              style={{ maxHeight: '300px', overflowY: 'auto' }}
            >
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
                active={!hotelId || hotelId === 'all'}
                className="hotel-dropdown-item py-2 px-3 fw-medium rounded-3 mb-1"
                onClick={() => setSearchHotel('')}
              >
                All Hotels
              </Dropdown.Item>
              {hotels
                .filter((h) =>
                  h.hotel_name
                    .toLowerCase()
                    .includes(searchHotel.toLowerCase()),
                )
                .map((hotel) => (
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
              {hotels.filter((h) =>
                h.hotel_name.toLowerCase().includes(searchHotel.toLowerCase()),
              ).length === 0 && (
                  <div className="text-muted text-center py-2 small">
                    No hotels found
                  </div>
                )}
            </Dropdown.Menu>
          </Dropdown>

          {/* Branch Dropdown */}
          <Dropdown
            align="end"
            onSelect={(val) => handleBranchChange({ target: { value: val } })}
            className="flex-fill"
            style={{ minWidth: 0 }}
          >
            <Dropdown.Toggle
              variant="light"
              title={
                branchId
                  ? branches.find((b) => b.id == branchId)?.branch_name ||
                  'All Branches'
                  : 'All Branches'
              }
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
                textOverflow: 'ellipsis',
              }}
              disabled={!hotelId || hotelId === 'all'}
            >
              <span className="text-truncate" style={{ maxWidth: '90%' }}>
                {branchId
                  ? branches.find((b) => b.id == branchId)?.branch_name ||
                  'All Branches'
                  : 'All Branches'}
              </span>
            </Dropdown.Toggle>

            <Dropdown.Menu
              className="w-100 border-0 shadow-lg rounded-4 mt-2 p-2"
              style={{ maxHeight: '300px', overflowY: 'auto' }}
            >
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
                .filter((b) =>
                  b.branch_name
                    .toLowerCase()
                    .includes(searchBranch.toLowerCase()),
                )
                .filter((b) => {
                  if (!hotelId || hotelId === 'all') return true
                  const selectedHotel = hotels.find((h) => h.id == hotelId)
                  return selectedHotel && selectedHotel.branch_id
                    ? b.id == selectedHotel.branch_id
                    : true
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
                .filter((b) =>
                  b.branch_name
                    .toLowerCase()
                    .includes(searchBranch.toLowerCase()),
                )
                .filter((b) => {
                  if (!hotelId || hotelId === 'all') return true
                  const selectedHotel = hotels.find((h) => h.id == hotelId)
                  return selectedHotel && selectedHotel.branch_id
                    ? b.id == selectedHotel.branch_id
                    : true
                }).length === 0 && (
                  <div className="text-muted text-center py-2 small">
                    No branches found
                  </div>
                )}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* COUNTS NAVIGATION BAR and VIEW TOGGLES */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 mt-2 gap-3 gap-md-0">
        <div
          className="d-flex flex-nowrap gap-2 pb-1 flex-grow-1 pe-md-3 w-100"
          style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          <style>{`.d-flex::-webkit-scrollbar { display: none; }`}</style>
          {/* Total Bookings */}
          <div
            onClick={() => navigate(`/booking-details/${hotelId}/all`)}
            style={{
              cursor: 'pointer',
              transition: '0.2s',
              border: '1px solid #e2e8f0',
            }}
            className={`px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 ${statusType === 'all' ? 'bg-secondary text-white' : 'bg-white text-secondary'}`}
          >
            <span
              className="fw-bold"
              style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}
            >
              Total
            </span>
            <span
              className={`badge ${statusType === 'all' ? 'bg-white text-secondary' : 'bg-secondary'} rounded-pill`}
              style={{ fontSize: '0.65rem' }}
            >
              {overallCounts.total}
            </span>
          </div>

          {/* Booked */}
          <div
            onClick={() => navigate(`/booking-details/${hotelId}/booked`)}
            style={{
              cursor: 'pointer',
              transition: '0.2s',
              border: '1px solid #e2e8f0',
            }}
            className={`px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 ${statusType === 'booked' ? 'bg-danger text-white' : 'bg-white text-danger'}`}
          >
            <span
              className="fw-bold"
              style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}
            >
              Booked
            </span>
            <span
              className={`badge ${statusType === 'booked' ? 'bg-white text-danger' : 'bg-danger'} rounded-pill`}
              style={{ fontSize: '0.65rem' }}
            >
              {overallCounts.booked}
            </span>
          </div>

          {/* Reserved */}
          <div
            onClick={() => navigate(`/booking-details/${hotelId}/reserved`)}
            style={{
              cursor: 'pointer',
              transition: '0.2s',
              border: '1px solid #e2e8f0',
            }}
            className={`px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 ${statusType === 'reserved' ? 'bg-info text-white' : 'bg-white text-info'}`}
          >
            <span
              className="fw-bold"
              style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}
            >
              Reserved
            </span>
            <span
              className={`badge ${statusType === 'reserved' ? 'bg-white text-info' : 'bg-info'} rounded-pill`}
              style={{ fontSize: '0.65rem' }}
            >
              {overallCounts.reserved}
            </span>
          </div>

          {/* Cancelled */}
          <div
            onClick={() => navigate(`/booking-details/${hotelId}/cancelled`)}
            style={{
              cursor: 'pointer',
              transition: '0.2s',
              border: '1px solid #e2e8f0',
            }}
            className={`px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 ${statusType === 'cancelled' ? 'bg-dark text-white' : 'bg-white text-dark'}`}
          >
            <span
              className="fw-bold"
              style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}
            >
              Cancelled
            </span>
            <span
              className={`badge ${statusType === 'cancelled' ? 'bg-white text-dark' : 'bg-dark'} rounded-pill`}
              style={{ fontSize: '0.65rem' }}
            >
              {overallCounts.cancelled}
            </span>
          </div>

          {/* Checkout Soon */}
          <div
            onClick={() =>
              navigate(`/booking-details/${hotelId}/checkout_soon`)
            }
            style={{
              cursor: 'pointer',
              transition: '0.2s',
              border: '1px solid #e2e8f0',
            }}
            className={`px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 ${statusType === 'checkout_soon' ? 'bg-warning text-dark' : 'bg-white text-warning'}`}
          >
            <span
              className="fw-bold"
              style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}
            >
              Soon
            </span>
            <span
              className={`badge ${statusType === 'checkout_soon' ? 'bg-white text-warning' : 'bg-warning text-dark'} rounded-pill`}
              style={{ fontSize: '0.65rem' }}
            >
              {overallCounts.soon}
            </span>
          </div>

          {/* Checkout Overdue */}
          <div
            onClick={() =>
              navigate(`/booking-details/${hotelId}/checkout_overdue`)
            }
            style={{
              cursor: 'pointer',
              transition: '0.2s',
              border: '1px solid #e2e8f0',
            }}
            className={`px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 ${statusType === 'checkout_overdue' ? 'bg-danger text-white' : 'bg-white text-danger'}`}
          >
            <span
              className="fw-bold"
              style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}
            >
              Overdue
            </span>
            <span
              className={`badge ${statusType === 'checkout_overdue' ? 'bg-white text-danger' : 'bg-danger'} rounded-pill`}
              style={{ fontSize: '0.65rem' }}
            >
              {overallCounts.overdue}
            </span>
          </div>

          {/* Deleted */}
          <div
            onClick={() => navigate(`/booking-details/${hotelId}/deleted`)}
            style={{
              cursor: 'pointer',
              transition: '0.2s',
              border: '1px solid #e2e8f0',
            }}
            className={`px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 ${statusType === 'deleted' ? 'bg-secondary text-white' : 'bg-white text-secondary'}`}
          >
            <span
              className="fw-bold"
              style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}
            >
              Deleted
            </span>
            <span
              className={`badge ${statusType === 'deleted' ? 'bg-white text-secondary' : 'bg-secondary'} rounded-pill`}
              style={{ fontSize: '0.65rem' }}
            >
              {overallCounts.deleted}
            </span>
          </div>

          {/* Vacant */}
          <div
            onClick={() => navigate(`/booking-details/${hotelId}/checkedout`)}
            style={{
              cursor: 'pointer',
              transition: '0.2s',
              border: '1px solid #e2e8f0',
            }}
            className={`px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 ${statusType === 'checkedout' ? 'bg-primary text-white' : 'bg-white text-primary'}`}
          >
            <span
              className="fw-bold"
              style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}
            >
              Vacant
            </span>
            <span
              className={`badge ${statusType === 'checkedout' ? 'bg-white text-primary' : 'bg-primary'} rounded-pill`}
              style={{ fontSize: '0.65rem' }}
            >
              {overallCounts.checkedout}
            </span>
          </div>
        </div>

        <div className="d-flex gap-2 flex-shrink-0 align-self-end align-self-md-auto mt-3 mt-md-0">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'light'}
            onClick={() => setViewMode('grid')}
            className="d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: '40px', height: '40px' }}
          >
            <FaThLarge color="red" size={18} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'light'}
            onClick={() => setViewMode('list')}
            className="d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: '40px', height: '40px' }}
          >
            <FaList size={18} />
          </Button>
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
      ) : viewMode === 'grid' ? (
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
                const config = getStatusConfig(
                  item.statusTypeForColor || item.displayStatus || item.status,
                )

                return (
                  <Col key={item.booking_id || item.id}>
                    <Card
                      onClick={() => handleCardClick(item)}
                      className={`text-center shadow-sm border-0 rounded-3 ${config.bg}`}
                      style={{
                        cursor: 'pointer',
                        minWidth: '90px',
                        maxWidth: '130px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)'
                        e.currentTarget.classList.add('shadow')
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.classList.remove('shadow')
                      }}
                    >
                      <Card.Body className="p-2 d-flex flex-column align-items-center justify-content-center">
                        {/* Room Number Display */}
                        <div
                          className="fw-bold px-1 text-truncate"
                          style={{
                            fontSize: '1rem',
                            lineHeight: '1.2',
                            maxWidth: '100%',
                          }}
                          title={item.room_no || item.guest_name || 'No Room'}
                        >
                          {item.room_no || item.guest_name || 'No Room'}
                        </div>
                        {/* Room Status Display */}
                        <div
                          className="text-capitalize opacity-75"
                          style={{ fontSize: '0.7rem', mt: '2px' }}
                        >
                          {item.displayStatus || item.status || 'Vacant'}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </div>
        ))
      ) : (
        /* LIST VIEW RENDERING */
        <div className="table-responsive shadow-sm rounded-4 border mb-4">
          <Table hover bordered className="align-middle mb-0 bg-white">
            <thead className="bg-light text-secondary">
              <tr>
                <th
                  className="py-3 px-4 fw-semibold"
                  style={{ borderTopLeftRadius: '16px' }}
                >
                  Hotel Name
                </th>
                <th className="py-3 px-4 fw-semibold">Floor Name</th>
                <th className="py-3 px-4 fw-semibold">Room No</th>
                <th className="py-3 px-4 fw-semibold">Guest Name</th>
                <th className="py-3 px-4 fw-semibold">Check In</th>
                <th className="py-3 px-4 fw-semibold">Check Out</th>
                <th className="py-3 px-4 fw-semibold">Amount</th>
                <th className="py-3 px-4 fw-semibold">Status</th>
                <th
                  className="py-3 px-4 fw-semibold"
                  style={{ borderTopRightRadius: '16px' }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(floorWiseBookings)
                .flatMap((floor) => floorWiseBookings[floor])
                .map((item, index) => {
                  const config = getStatusConfig(
                    item.statusTypeForColor ||
                    item.displayStatus ||
                    item.status,
                  )
                  const badgeBgClass =
                    config.bg
                      .split(' ')
                      .find((cls) => cls.startsWith('bg-'))
                      ?.replace('bg-', '') || 'secondary'
                  const hotelName =
                    item.hotel_name ||
                    hotels.find((h) => h.id == item.hotel_id)?.hotel_name ||
                    'N/A'
                  const floorNo = Math.floor(Number(item.room_no) / 100)
                  const floorName =
                    item.floor ||
                    (floorNo === 1 ? 'Ground Floor' : `Floor ${floorNo}`)
                  const amount =
                    item.total_amount || item.price || item.price_per_day || 0

                  return (
                    <tr key={item.booking_id || item.id || index}>
                      <td className="px-4 py-3 text-secondary">{hotelName}</td>
                      <td className="px-4 py-3 text-secondary">{floorName}</td>
                      <td className="px-4 py-3 fw-bold text-dark">
                        {item.room_no || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {item.guest_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {item.check_in_date
                          ? item.check_in_date.split('T')[0]
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {item.check_out_date
                          ? item.check_out_date.split('T')[0]
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-secondary">₹{amount}</td>
                      <td className="px-4 py-3">
                        <Badge
                          bg={badgeBgClass}
                          className="px-3 py-2 rounded-pill text-capitalize"
                        >
                          {item.displayStatus || item.status || 'Vacant'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Dropdown align="end">
                          <Dropdown.Toggle
                            variant="outline-primary"
                            size="sm"
                            className="rounded-pill px-3 py-1"
                          >
                            Action
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="border-0 shadow-sm rounded-3">
                            <Dropdown.Item
                              onClick={() => handleCardClick(item)}
                            >
                              View
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </Table>
        </div>
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
            {selectedDetails?.room_no
              ? `Room ${selectedDetails.room_no}`
              : 'Booking'}{' '}
            - Info
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

              <div className="mt-2">
                <p className="mb-1">
                  <strong>Hotel Name:</strong>{' '}
                  {selectedDetails.hotel_name || 'N/A'}
                </p>
                <p className="mb-1">
                  <strong>Room Type:</strong>{' '}
                  {selectedDetails.room_type || 'Standard'}
                </p>
                <p className="mb-1">
                  <strong>Guest Name:</strong>{' '}
                  {selectedDetails.guest_name || 'N/A'}
                </p>
                <p className="mb-1">
                  <strong>Check-In:</strong>{' '}
                  {selectedDetails.check_in_date
                    ? selectedDetails.check_in_date.split('T')[0]
                    : 'N/A'}
                </p>
                <p className="mb-1">
                  <strong>Check-Out:</strong>{' '}
                  {selectedDetails.check_out_date
                    ? selectedDetails.check_out_date.split('T')[0]
                    : 'N/A'}
                </p>
                <p className="mb-0">
                  <strong>Charges:</strong> ₹
                  {selectedDetails.total_amount ||
                    selectedDetails.price ||
                    selectedDetails.price_per_day ||
                    0}
                </p>

                {getCheckoutStatus(
                  selectedDetails.check_out_date,
                  selectedDetails.status || statusType,
                ) === 'crossed' && (
                    <div className="alert alert-danger p-1 mb-0 mt-2 text-center small fw-bold">
                      ⚠️ Checkout Time Overdue!
                    </div>
                  )}
                {getCheckoutStatus(
                  selectedDetails.check_out_date,
                  selectedDetails.status || statusType,
                ) === 'soon' && (
                    <div className="alert alert-warning p-1 mb-0 mt-2 text-center small fw-bold">
                      ⚠️ Checkout Soon
                    </div>
                  )}
              </div>
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
