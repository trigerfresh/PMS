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
  Container,
  Dropdown,
} from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaThLarge, FaList } from 'react-icons/fa'

const API_URL = 'http://localhost:5000'

const Reserved = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')

  const [hotelId, setHotelId] = useState(localStorage.getItem('hotelId') || '')
  const [branchId, setBranchId] = useState(localStorage.getItem('branchId') || '')
  const [hotels, setHotels] = useState([])
  const [branches, setBranches] = useState([])
  const [searchHotel, setSearchHotel] = useState('')
  const [searchBranch, setSearchBranch] = useState('')

  const [overallCounts, setOverallCounts] = useState({
    total: 0,
    booked: 0,
    reserved: 0,
    cancelled: 0,
    soon: 0,
    overdue: 0,
    deleted: 0
  })

  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // =========================
  // RESERVED LOGIC
  // =========================
  const isReserved = (status) => {
    if (!status) return false
    return status.toLowerCase().trim() === 'reserved'
  }

  // =========================
  // FETCH DATA (REAL TIME)
  // =========================
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

  const fetchData = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const res = await axios.get(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = res.data.data || []

      const branchHotelIds = branchId
        ? hotels.filter((h) => h.branch_id == branchId).map((h) => Number(h.id))
        : []

      const hotelBookingsRaw = hotelId && hotelId !== 'all'
        ? data.filter(b => Number(b.hotel_id) === Number(hotelId))
        : data

      const hotelBookings = branchId
        ? hotelBookingsRaw.filter((b) => branchHotelIds.includes(Number(b.hotel_id)))
        : hotelBookingsRaw

      const filtered = hotelBookings.filter((b) => isReserved(b.status))

      // Calculate Counts
      const now = new Date()
      const todayMid = new Date(now).setHours(0, 0, 0, 0)
      const oneDayMs = 24 * 60 * 60 * 1000
      const normalize = (s) => (s || '').toLowerCase().replace(/\\s+/g, '')

      let counts = {
        total: hotelBookings.length,
        booked: 0,
        reserved: filtered.length,
        cancelled: 0,
        soon: 0,
        overdue: 0,
        deleted: 0
      }

      hotelBookings.forEach(b => {
        const status = normalize(b.status)
        if (status === 'booked' || status === 'occupied') counts.booked++
        if (status === 'cancelled') counts.cancelled++

        const checkout = new Date(b.check_out_date)
        const diff = checkout - now
        if (diff > 0 && diff <= oneDayMs && status !== 'cancelled' && status !== 'deleted') {
          counts.soon++
        }

        const outMid = new Date(checkout).setHours(0, 0, 0, 0)
        const overdueDays = Math.floor((todayMid - outMid) / oneDayMs)
        if (overdueDays > 0 && (status === 'booked' || status === 'occupied')) {
          counts.overdue++
        }
      })

      setOverallCounts(counts)

      setBookings(filtered)

      // optional live storage
      localStorage.setItem('reservedLiveCount', filtered.length)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const interval = setInterval(fetchData, 15000) // real-time
    return () => clearInterval(interval)
  }, [hotelId, branchId, hotels])

  // =========================
  // GROUP HOTEL + FLOOR
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'reserved':
        return 'border-primary text-primary'
      default:
        return 'border-secondary text-dark'
    }
  }

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
    <Container
      fluid
      className="page-container"
      style={{
        background: 'linear-gradient(135deg, #f6f8fc 0%, #e9edf5 100%)',
        minHeight: '100vh',
        transition: 'background-color 0.5s ease',
      }}
    >
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
            <h2 className="fw-bold mb-0 text-capitalize d-flex align-items-center gap-3" style={{ color: '#2c3e50', letterSpacing: '-0.5px' }}>
              Reserved Bookings
              <span className="badge bg-primary text-white rounded-pill fs-6 px-3">{bookings.length}</span>
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

      {/* COUNTS NAVIGATION BAR and VIEW TOGGLES */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 mt-2 gap-3 gap-md-0">
        <div
          className="d-flex flex-nowrap gap-2 pb-1 flex-grow-1 pe-md-3 w-100"
          style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
          <style>{`.d-flex::-webkit-scrollbar { display: none; }`}</style>
          {/* Total Bookings */}
          <div
            onClick={() => navigate(`/booking-details/${hotelId || 'all'}/all`)}
            style={{ cursor: 'pointer', transition: '0.2s', border: '1px solid #e2e8f0' }}
            className="px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 bg-white text-secondary"
          >
            <span className="fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Total</span>
            <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.65rem' }}>{overallCounts.total}</span>
          </div>

          {/* Booked */}
          <div
            onClick={() => navigate(`/booking-details/${hotelId || 'all'}/booked`)}
            style={{ cursor: 'pointer', transition: '0.2s', border: '1px solid #e2e8f0' }}
            className="px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 bg-white text-danger"
          >
            <span className="fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Booked</span>
            <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.65rem' }}>{overallCounts.booked}</span>
          </div>

          {/* Reserved */}
          <div
            style={{ cursor: 'default', transition: '0.2s', border: '1px solid #e2e8f0' }}
            className="px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 bg-info text-white"
          >
            <span className="fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Reserved</span>
            <span className="badge bg-white text-info rounded-pill" style={{ fontSize: '0.65rem' }}>{overallCounts.reserved}</span>
          </div>

          {/* Cancelled */}
          <div
            onClick={() => navigate(`/booking-details/${hotelId || 'all'}/cancelled`)}
            style={{ cursor: 'pointer', transition: '0.2s', border: '1px solid #e2e8f0' }}
            className="px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 bg-white text-dark"
          >
            <span className="fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Cancelled</span>
            <span className="badge bg-dark rounded-pill" style={{ fontSize: '0.65rem' }}>{overallCounts.cancelled}</span>
          </div>

          {/* Checkout Soon */}
          <div
            onClick={() => navigate(`/checkout-soon`)}
            style={{ cursor: 'pointer', transition: '0.2s', border: '1px solid #e2e8f0' }}
            className="px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 bg-white text-warning"
          >
            <span className="fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Checkout Soon</span>
            <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '0.65rem' }}>{overallCounts.soon}</span>
          </div>

          {/* Checkout Overdue */}
          <div
            onClick={() => navigate(`/checkout-overdue`)}
            style={{ cursor: 'pointer', transition: '0.2s', border: '1px solid #e2e8f0' }}
            className="px-2 py-1 rounded-3 d-flex align-items-center gap-1 shadow-sm flex-shrink-0 bg-white text-danger"
          >
            <span className="fw-bold" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Overdue</span>
            <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.65rem' }}>{overallCounts.overdue}</span>
          </div>
        </div>

        <div className="d-flex gap-2 flex-shrink-0 align-self-end align-self-md-auto mt-3 mt-md-0">
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
          <Spinner animation="border" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-5">
          <h5 className="text-muted fw-bold">No bookings available for this hotel</h5>
        </div>
      ) : viewMode === 'grid' ? (
        Object.values(grouped).map((g, i) => (
          <div key={i} className="mb-4">
            <h5 className="text-secondary fw-bold mb-2 border-bottom pb-1">
              {g.hotel} - {g.floor}
            </h5>

            <Row className="g-2 row-cols-auto">
              {g.items.map((item) => (
                <Col key={item.id || item.booking_id}>
                  <Card
                    onClick={() => handleClick(item)}
                    className="border-primary shadow-sm"
                    style={{
                      cursor: 'pointer',
                      minWidth: '95px',
                      maxWidth: '135px',
                      transition: 'all 0.3s ease'
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
                    <Card.Body className="p-2 d-flex flex-column align-items-center justify-content-center text-center">
                      <div
                        className="fw-bold px-1 text-truncate w-100"
                        style={{ fontSize: '0.9rem', lineHeight: '1.1' }}
                      >
                        Room {item.room_no || item.guest_name || 'N/A'}
                      </div>
                      <Badge bg="primary" className="mt-1" style={{ fontSize: '0.65rem' }}>
                        Reserved
                      </Badge>
                      <div className="text-muted text-truncate w-100 mt-1" style={{ fontSize: '0.75rem' }}>
                        {item.guest_name}
                      </div>
                      <div
                        className="mt-1 border-top pt-1 w-100 text-muted"
                        style={{ fontSize: '0.65rem', lineHeight: '1.2' }}
                      >
                        In: {item.check_in_date?.split('T')[0]}
                        <br />
                        Out: {item.check_out_date?.split('T')[0]}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
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
                <th className="py-3 px-4 fw-semibold">Guest Name</th>
                <th className="py-3 px-4 fw-semibold">Check In</th>
                <th className="py-3 px-4 fw-semibold">Check Out</th>
                <th className="py-3 px-4 fw-semibold">Amount</th>
                <th className="py-3 px-4 fw-semibold">Status</th>
                <th className="py-3 px-4 fw-semibold" style={{ borderTopRightRadius: '16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(grouped).flatMap(g => g.items).map((item, index) => {
                const hotelName = item.hotel_name || hotels.find(h => h.id == item.hotel_id)?.hotel_name || 'N/A';
                const floorName = item.floor_name || item.floor || 'N/A';
                const amount = item.total_amount || item.price || item.price_per_day || 0;

                return (
                  <tr key={item.booking_id || item.id || index}>
                    <td className="px-4 py-3 text-secondary">{hotelName}</td>
                    <td className="px-4 py-3 text-secondary">{floorName}</td>
                    <td className="px-4 py-3 fw-bold text-dark">{item.room_no || 'N/A'}</td>
                    <td className="px-4 py-3 text-secondary">{item.guest_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-secondary">{item.check_in_date ? item.check_in_date.split('T')[0] : 'N/A'}</td>
                    <td className="px-4 py-3 text-secondary">{item.check_out_date ? item.check_out_date.split('T')[0] : 'N/A'}</td>
                    <td className="px-4 py-3 text-secondary">₹{amount}</td>
                    <td className="px-4 py-3">
                      <Badge bg="info" className="px-3 py-2 rounded-pill text-capitalize">
                        Reserved
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="outline-primary" size="sm" className="rounded-pill px-3 py-1">
                          Action
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="border-0 shadow-sm rounded-3">
                          <Dropdown.Item onClick={() => handleClick(item)}>
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

      {/* =========================
          MODAL FULL DETAILS
      ========================= */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton className="py-2 px-3">
          <Modal.Title className="h6 fw-bold">
            Room {selected?.room_no || 'N/A'} - Overview
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-3">
          {selected && (
            <div className="mt-2">
              <Table borderless size="sm" className="mb-0" style={{ fontSize: '0.85rem' }}>
                <tbody>
                  <tr>
                    <td className="text-secondary fw-medium text-start px-0 py-1" style={{ width: '35%' }}>Guest Name</td>
                    <td className="text-dark text-start ps-3 py-1">{selected.guest_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-secondary fw-medium text-start px-0 py-1">Contact</td>
                    <td className="text-dark text-start ps-3 py-1">{selected.phone || selected.contact_no || selected.mobile || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-secondary fw-medium text-start px-0 py-1">Location</td>
                    <td className="text-dark text-start ps-3 py-1">{selected.hotel_name} - Floor {selected.floor_name}</td>
                  </tr>
                  <tr>
                    <td className="text-secondary fw-medium text-start px-0 py-1">Room Type</td>
                    <td className="text-dark text-start ps-3 py-1">{selected.room_type || 'Standard'}</td>
                  </tr>
                  <tr>
                    <td className="text-secondary fw-medium text-start px-0 py-1">Check-In</td>
                    <td className="text-dark text-start ps-3 py-1">{selected.check_in_date?.split('T')[0] || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-secondary fw-medium text-start px-0 py-1">Check-Out</td>
                    <td className="text-dark text-start ps-3 py-1">{selected.check_out_date?.split('T')[0] || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-secondary fw-medium text-start px-0 py-1">Status</td>
                    <td className="text-dark text-start ps-3 py-1">
                      <Badge bg="primary" className="fw-normal px-2 py-1 rounded-pill text-capitalize">
                        {selected.status}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
              <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>TOTAL AMOUNT</span>
                <span className="fw-bold text-primary" style={{ fontSize: '1rem' }}>₹ {selected.total_amount || 0}</span>
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
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Reserved
