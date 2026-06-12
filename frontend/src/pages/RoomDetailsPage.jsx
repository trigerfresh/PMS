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
  Dropdown,
  Table,
  Badge,
} from 'react-bootstrap'
import { FaThLarge, FaList } from 'react-icons/fa'

const API_URL = 'http://localhost:5000'

const RoomDetailsPage = () => {
  const { hotelId, status } = useParams()
  const navigate = useNavigate()

  const [viewMode, setViewMode] = useState('grid')
  const [loading, setLoading] = useState(false)
  const [roomsData, setRoomsData] = useState([])
  const [bookingsData, setBookingsData] = useState([])

  const [hotels, setHotels] = useState([])
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState(localStorage.getItem('branchId') || '')
  const [searchHotel, setSearchHotel] = useState('')
  const [searchBranch, setSearchBranch] = useState('')

  const [overallCounts, setOverallCounts] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
    booked: 0,
    reserved: 0
  })

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
    navigate(`/rooms-details/${value || 'all'}/${status}`)
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

  useEffect(() => {
    if (hotelId && status) {
      fetchDetailedData()
    }
  }, [hotelId, status, branchId, hotels])

  const fetchDetailedData = async () => {
    try {
      setLoading(true)
      const currentStatus = status?.toLowerCase()

      setRoomsData([])
      setBookingsData([])

      // FETCH ALL DATA ONCE FOR OVERALL COUNTS
      const [roomsRes, bookingsRes] = await Promise.all([
        axios.get(`${API_URL}/api/rooms`),
        axios.get(`${API_URL}/api/bookings`),
      ])

      const allRooms = roomsRes.data.data || []
      const allBookings = bookingsRes.data.data || []

      const branchHotelIds = branchId
        ? hotels.filter((h) => h.branch_id == branchId).map((h) => Number(h.id))
        : []

      const hotelRoomsRaw = hotelId === 'all'
        ? allRooms
        : allRooms.filter((room) => Number(room.hotel_id) === Number(hotelId))

      const hotelRooms = branchId
        ? hotelRoomsRaw.filter((room) => branchHotelIds.includes(Number(room.hotel_id)))
        : hotelRoomsRaw

      const hotelBookingsRaw = hotelId === 'all'
        ? allBookings
        : allBookings.filter((b) => Number(b.hotel_id) === Number(hotelId))

      const hotelBookings = branchId
        ? hotelBookingsRaw.filter((b) => branchHotelIds.includes(Number(b.hotel_id)))
        : hotelBookingsRaw

      const activeHotelBookings = hotelBookings.filter((b) => isActiveBooking(b))

      // CALCULATE OVERALL COUNTS
      setOverallCounts({
        total: hotelRooms.length,
        available: hotelRooms.filter(r => r.status?.toLowerCase() === 'available' || r.status?.toLowerCase() === 'vacant' || r.status?.toLowerCase() === 'avalable').length,
        occupied: hotelRooms.filter(r => r.status?.toLowerCase() === 'occupied').length,
        maintenance: hotelRooms.filter(r => r.status?.toLowerCase() === 'maintenance').length,
        booked: hotelBookings.filter(b => b.status?.toLowerCase() === 'booked' && b.active === '0').length,
        reserved: hotelRooms.filter(r => r.status?.toLowerCase() === 'reserved').length
      })

      // 1. ALL ROOMS
      if (currentStatus === 'all') {
        const mergedRooms = hotelRooms.map((room) => {
          const activeBooking = activeHotelBookings.find(
            (b) =>
              Number(b.room_id) === Number(room.room_id) ||
              String(b.room_no) === String(room.room_no),
          )

          if (activeBooking) {
            return {
              ...room,
              booking_id: activeBooking.booking_id || activeBooking.id || activeBooking.bookingId,
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
        const filteredRooms = hotelRooms.filter(
          (room) =>
            room.status?.toLowerCase() === 'available' ||
            room.status?.toLowerCase() === 'vacant' ||
            room.status?.toLowerCase() === 'avalable'
        )
        setRoomsData(filteredRooms)
      }
      // 3. MAINTENANCE ROOMS
      else if (currentStatus === 'maintenance') {
        const filteredRooms = hotelRooms.filter(
          (room) => room.status?.toLowerCase() === 'maintenance'
        )
        setRoomsData(filteredRooms)
      }
      // 4. RESERVED ROOMS
      else if (currentStatus === 'reserved') {
        const filteredRooms = hotelRooms.filter(
          (room) => room.status?.toLowerCase() === 'reserved'
        )
        setRoomsData(filteredRooms)
      }
      // 5. OCCUPIED / BOOKED ROOMS
      else if (currentStatus === 'occupied' || currentStatus === 'booked') {
        const occupiedBookingsArray = hotelBookings
          .filter(
            (b) =>
              b.status?.toLowerCase() === 'booked' ||
              b.status?.toLowerCase() === 'occupied'
          )
          .map((booking) => {
            const room = hotelRooms.find(
              (r) =>
                Number(r.room_id) === Number(booking.room_id) ||
                Number(r.room_no) === Number(booking.room_no)
            )

            return {
              ...booking,
              room_no: room?.room_no || booking.room_no,
              room_type: room?.room_type,
              floor: room?.floor,
              price: room?.price || booking?.total_amount,
              rent: room?.rent,
            }
          })

        setBookingsData(occupiedBookingsArray)
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
        return { bg: 'bg-danger text-white border-danger' } // Red color (matches Occupied tab)
      case 'reserved':
        return { bg: 'bg-info text-white border-info' } // Blue/Info color (matches Reserved tab)
      case 'cancelled':
        return { bg: 'bg-dark text-white border-dark' }
      case 'maintenance':
        return { bg: 'bg-warning text-dark border-warning' } // Yellow color (matches Maintenance tab)
      case 'available':
      case 'vacant':
      case 'avalable':
        return { bg: 'bg-success text-white border-success' } // Green color (matches Available tab)
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
      const floorNo = Math.floor(Number(item.room_no) / 100)
      const floorRaw =
        item.floor ||
        (floorNo === 1 ? 'Ground Floor' : `Floor ${floorNo}`) ||
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
        <Col md={12} lg={5} xl={6} className="d-flex align-items-center mb-3 mb-lg-0">
          <Button
            variant="light"
            className="shadow-sm rounded-circle d-flex align-items-center justify-content-center me-3"
            onClick={() => navigate(-1)}
            style={{ width: '45px', height: '45px', border: '1px solid #e2e8f0', transition: 'all 0.2s', flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ fontSize: '1.2rem', color: '#64748b' }}>←</span>
          </Button>
          <div className="d-flex flex-column">
            <h2 className="fw-bold mb-0 text-capitalize" style={{ color: '#2c3e50', letterSpacing: '-0.5px' }}>
              {status === 'all' ? 'All' : status} Rooms Information
            </h2>
            <small className="text-muted fw-bold d-block mt-1" style={{ letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Floor & Hotel Wise Details
            </small>
          </div>
        </Col>

        <Col md={12} lg={7} xl={6} className="d-flex flex-column flex-sm-row gap-3 justify-content-lg-end pe-lg-4">
          {/* Hotel Dropdown */}
          <Dropdown align="end" onSelect={(val) => handleHotelChange({ target: { value: val } })} className="flex-fill" style={{ minWidth: 0 }}>
            <Dropdown.Toggle
              variant="light"
              title={hotelId && hotelId !== 'all' ? hotels.find(h => h.id == hotelId)?.hotel_name || 'All Hotels' : 'All Hotels'}
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
                {hotelId && hotelId !== 'all' ? hotels.find(h => h.id == hotelId)?.hotel_name || 'All Hotels' : 'All Hotels'}
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
                active={!hotelId || hotelId === 'all'}
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
              disabled={!hotelId || hotelId === 'all'}
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
                  if (!hotelId || hotelId === 'all') return true;
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
                  if (!hotelId || hotelId === 'all') return true;
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

      {/* COUNTS NAVIGATION BAR */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div className="d-flex flex-wrap gap-2">
        {/* Total Rooms */}
        <div
          onClick={() => navigate(`/rooms-details/${hotelId}/all`)}
          style={{ cursor: 'pointer', transition: '0.2s', border: '1px solid #e2e8f0' }}
          className={`px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm ${status === 'all' ? 'bg-secondary text-white' : 'bg-white text-secondary'}`}
        >
          <span className="fw-bold" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Total</span>
          <span className={`badge ${status === 'all' ? 'bg-white text-secondary' : 'bg-secondary'} rounded-pill`}>{overallCounts.total}</span>
        </div>

        {/* Available Rooms */}
        <div
          onClick={() => navigate(`/rooms-details/${hotelId}/available`)}
          style={{ cursor: 'pointer', transition: '0.2s', border: '1px solid #e2e8f0' }}
          className={`px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm ${status === 'available' ? 'bg-success text-white' : 'bg-white text-success'}`}
        >
          <span className="fw-bold" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Available</span>
          <span className={`badge ${status === 'available' ? 'bg-white text-success' : 'bg-success'} rounded-pill`}>{overallCounts.available}</span>
        </div>

        {/* Occupied Rooms */}
        <div
          onClick={() => navigate(`/rooms-details/${hotelId}/occupied`)}
          style={{ cursor: 'pointer', transition: '0.2s', border: '1px solid #e2e8f0' }}
          className={`px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm ${status === 'occupied' ? 'bg-danger text-white' : 'bg-white text-danger'}`}
        >
          <span className="fw-bold" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Occupied</span>
          <span className={`badge ${status === 'occupied' ? 'bg-white text-danger' : 'bg-danger'} rounded-pill`}>{overallCounts.occupied}</span>
        </div>

        {/* Maintenance Rooms */}
        <div
          onClick={() => navigate(`/rooms-details/${hotelId}/maintenance`)}
          style={{ cursor: 'pointer', transition: '0.2s', border: '1px solid #e2e8f0' }}
          className={`px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm ${status === 'maintenance' ? 'bg-warning text-dark' : 'bg-white text-warning'}`}
        >
          <span className="fw-bold" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Maintenance</span>
          <span className={`badge ${status === 'maintenance' ? 'bg-white text-warning' : 'bg-warning text-dark'} rounded-pill`}>{overallCounts.maintenance}</span>
        </div>

        {/* Reserved Rooms */}
        <div
          onClick={() => navigate(`/rooms-details/${hotelId}/reserved`)}
          style={{ cursor: 'pointer', transition: '0.2s', border: '1px solid #e2e8f0' }}
          className={`px-3 py-2 rounded-3 d-flex align-items-center gap-2 shadow-sm ${status === 'reserved' ? 'bg-info text-white' : 'bg-white text-info'}`}
        >
          <span className="fw-bold" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Reserved</span>
          <span className={`badge ${status === 'reserved' ? 'bg-white text-info' : 'bg-info'} rounded-pill`}>{overallCounts.reserved}</span>
        </div>
        </div>

        <div className="d-flex gap-2">
          <Button 
            variant={viewMode === 'grid' ? 'primary' : 'light'} 
            onClick={() => setViewMode('grid')} 
            className="d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: '40px', height: '40px' }}
          >
            <FaThLarge size={18} />
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
      ) : Object.keys(floorWiseData).length === 0 ? (
        <p className="text-muted small ps-2">
          No records found under this category.
        </p>
      ) : viewMode === 'grid' ? (
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
      ) : (
        /* LIST VIEW RENDERING */
        <div className="table-responsive shadow-sm rounded-4 border mb-4">
          <Table hover bordered className="align-middle mb-0 bg-white">
            <thead className="bg-light text-secondary">
              <tr>
                <th className="py-3 px-4 fw-semibold" style={{ borderTopLeftRadius: '16px' }}>Hotel Name</th>
                <th className="py-3 px-4 fw-semibold">Floor Name</th>
                <th className="py-3 px-4 fw-semibold">Room No</th>
                <th className="py-3 px-4 fw-semibold">Type</th>
                <th className="py-3 px-4 fw-semibold">Price</th>
                <th className="py-3 px-4 fw-semibold">Status</th>
                <th className="py-3 px-4 fw-semibold" style={{ borderTopRightRadius: '16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(floorWiseData).flatMap(floor => floorWiseData[floor]).map((item, index) => {
                const itemStatus = item.status || status;
                const config = getStatusConfig(itemStatus);
                const badgeBgClass = config.bg.replace('bg-', '').replace(' text-white', '').replace(' text-dark', '');
                const hotelName = item.hotel_name || hotels.find(h => h.id == item.hotel_id)?.hotel_name || 'N/A';
                const floorNo = Math.floor(Number(item.room_no) / 100);
                const floorName = item.floor || (floorNo === 1 ? 'Ground Floor' : `Floor ${floorNo}`);
                return (
                  <tr key={index}>
                    <td className="px-4 py-3 text-secondary">{hotelName}</td>
                    <td className="px-4 py-3 text-secondary">{floorName}</td>
                    <td className="px-4 py-3 fw-bold text-dark">{item.room_no}</td>
                    <td className="px-4 py-3 text-secondary">{item.room_type || 'Standard'}</td>
                    <td className="px-4 py-3 text-secondary">₹{item.price || item.rent || 0}</td>
                    <td className="px-4 py-3">
                      <Badge bg={badgeBgClass} className="px-3 py-2 rounded-pill">
                        {itemStatus.charAt(0).toUpperCase() + itemStatus.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="outline-primary" size="sm" className="rounded-pill px-3 py-1">
                          Action
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="border-0 shadow-sm rounded-3">
                          <Dropdown.Item onClick={() => handleCardClick(item)}>
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

              <div className="mt-2">
                <p className="mb-1">
                  <strong>Hotel Name:</strong>{' '}
                  {selectedDetails.hotel_name || 'N/A'}
                </p>
                <p className="mb-1">
                  <strong>Room Type:</strong>{' '}
                  {selectedDetails.room_type || 'Standard'}
                </p>
                {((selectedDetails.status || status)?.toLowerCase() === 'occupied' || (selectedDetails.status || status)?.toLowerCase() === 'booked') && (
                  <>
                    <p className="mb-1">
                      <strong>Guest Name:</strong>{' '}
                      {selectedDetails.guest_name || 'N/A'}
                    </p>
                    <p className="mb-1">
                      <strong>Check-In:</strong>{' '}
                      {selectedDetails.check_in_date ? selectedDetails.check_in_date.split('T')[0] : 'N/A'}
                    </p>
                    <p className="mb-1">
                      <strong>Check-Out:</strong>{' '}
                      {selectedDetails.check_out_date ? selectedDetails.check_out_date.split('T')[0] : 'N/A'}
                    </p>
                  </>
                )}
                <p className="mb-0">
                  <strong>Charges:</strong> ₹
                  {selectedDetails.total_amount || selectedDetails.price || selectedDetails.price_per_day || 0}
                </p>

                {getCheckoutStatus(
                  selectedDetails.check_out_date,
                  selectedDetails.status || status,
                ) === 'crossed' && (
                    <div className="alert alert-danger p-1 mb-0 mt-2 text-center small fw-bold">
                      ⚠️ Checkout Time Overdue!
                    </div>
                  )}
                {getCheckoutStatus(
                  selectedDetails.check_out_date,
                  selectedDetails.status || status,
                ) === 'soon' && (
                    <div className="alert alert-warning p-1 mb-0 mt-2 text-center small fw-bold">
                      ⚠️ Checkout Soon
                    </div>
                  )}
              </div>
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
