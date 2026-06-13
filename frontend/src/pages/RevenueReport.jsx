import React, { useEffect, useState } from 'react'
import dummy_user from './dummy_user.png'
import axios from 'axios'
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Form,
  Dropdown,
  Modal,
  Button,
  Tabs,
  Tab,
} from 'react-bootstrap'
import {
  FaArrowLeft,
  FaFileInvoiceDollar,
  FaRegCalendarAlt,
  FaSearch,
  FaEye,
  FaRupeeSign,
} from 'react-icons/fa'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import SearchPanel from '../utils/filterPanel_2'
import Pagination from '../utils/Pagination'

const RevenueReport = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const [hotels, setHotels] = useState([])
  const [hotelId, setHotelId] = useState(localStorage.getItem('hotelId') || '')
  const [searchHotel, setSearchHotel] = useState('')

  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState(
    localStorage.getItem('branchId') || '',
  )
  const [searchBranch, setSearchBranch] = useState('')

  useEffect(() => {
    fetchHotels()
    fetchBranches()
  }, [])

  async function fetchHotels() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:5000/api/hotels', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setHotels(res.data.data || [])
    } catch (err) {
      console.error('Hotel Load Error:', err)
    }
  }

  async function fetchBranches() {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:5000/api/branch', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBranches(res.data.data || [])
    } catch (err) {
      console.error('Branch Load Error:', err)
    }
  }

  const handleHotelChange = (e) => {
    const val = e.target.value
    setHotelId(val)
    localStorage.setItem('hotelId', val)
  }

  const handleBranchChange = (e) => {
    const val = e.target.value
    setBranchId(val)
    localStorage.setItem('branchId', val)
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [showView, setShowView] = useState(false)
  const [viewData, setViewData] = useState(null)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [searchFields, setSearchFields] = useState([
    { field: 'guest_name', keyword: '' },
  ])

  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: '',
  })
  const [filterType, setFilterType] = useState('all')

  const handleView = (b) => {
    setViewData(b)
    setShowView(true)
  }

  const searchOptions = [
    { label: 'Guest Name', value: 'guest_name' },
    { label: 'Email', value: 'guest_email' },
    { label: 'Room No', value: 'room_no' },
    { label: 'Room Type', value: 'room_type' },
    { label: 'Status', value: 'status' },
  ]

  const handleSearch = async () => {
    try {
      const params = {}

      searchFields.forEach((item) => {
        if (item.field && item.keyword) {
          params[item.field] = item.keyword
        }
      })

      if (dateFilter.from) {
        params.from_date = dateFilter.from
      }

      if (dateFilter.to) {
        params.to_date = dateFilter.to
      }

      const token = localStorage.getItem('token')

      const res = await axios.get('http://localhost:5000/api/bookings/search', {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setBookings(res.data.data || [])
    } catch (err) {
      console.log(err)
      toast.error('Search failed')
    }
  }

  const handleReset = async () => {
    setSearchFields([
      {
        field: 'guest_name',
        keyword: '',
      },
    ])

    setDateFilter({
      from: '',
      to: '',
    })

    const token = localStorage.getItem('token')

    const res = await axios.get('http://localhost:5000/api/bookings', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    setBookings(res.data.data || [])
  }

  const isAboutToCheckout = (checkOutDate, status) => {
    if (!checkOutDate) return false
    const s = String(status || '')
      .toLowerCase()
      .trim()
    if (s === 'cancelled' || s === 'checkedout') return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkout = new Date(checkOutDate)
    checkout.setHours(0, 0, 0, 0)
    const diffDays = (checkout - today) / (1000 * 60 * 60 * 24)
    return diffDays <= 1 && diffDays >= 0
  }

  const getCheckoutStatus = (checkOutDate, status) => {
    if (!checkOutDate) return null
    const s = String(status || '')
      .toLowerCase()
      .trim()
    if (s === 'cancelled' || s === 'checkedout') return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkout = new Date(checkOutDate)
    checkout.setHours(0, 0, 0, 0)
    const diffDays = (checkout - today) / (1000 * 60 * 60 * 24)
    if (diffDays < 0) return 'overdue'
    if (diffDays <= 1 && diffDays >= 0) return 'soon'
    return null
  }

  const isTodayCheckIn = (checkInDate) => {
    if (!checkInDate) return false
    const today = new Date()
    const checkIn = new Date(checkInDate)
    return (
      today.getFullYear() === checkIn.getFullYear() &&
      today.getMonth() === checkIn.getMonth() &&
      today.getDate() === checkIn.getDate()
    )
  }

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('http://localhost:5000/api/bookings', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const allBookings = res.data.data || []

        setBookings(allBookings)
      } catch (error) {
        console.error('Error fetching revenue data', error)
        toast.error('Failed to fetch revenue data')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const hotelAndBranchFilteredBookings = bookings.filter((b) => {
    if (hotelId && Number(b.hotel_id) !== Number(hotelId)) return false
    if (branchId) {
      const selectedHotelIds = hotels
        .filter((h) => h.branch_id == branchId)
        .map((h) => Number(h.id))
      if (!selectedHotelIds.includes(Number(b.hotel_id))) return false
    }
    return true
  })

  const bookingCounts = {
    total_bookings: hotelAndBranchFilteredBookings.length,
    cancelled_bookings: hotelAndBranchFilteredBookings.filter(
      (b) =>
        String(b.status || '')
          .toLowerCase()
          .trim() === 'cancelled',
    ).length,
    current_bookings: hotelAndBranchFilteredBookings.filter((b) =>
      isTodayCheckIn(b.check_in_date),
    ).length,
    reserved_bookings: hotelAndBranchFilteredBookings.filter(
      (b) =>
        String(b.status || '')
          .toLowerCase()
          .trim() === 'reserved',
    ).length,
    checkedout_bookings: hotelAndBranchFilteredBookings.filter(
      (b) =>
        String(b.status || '')
          .toLowerCase()
          .trim() === 'checkedout',
    ).length,
    about_to_checkout_bookings: hotelAndBranchFilteredBookings.filter((b) =>
      isAboutToCheckout(b.check_out_date, b.status),
    ).length,
    checkout_overdue_bookings: hotelAndBranchFilteredBookings.filter(
      (b) => getCheckoutStatus(b.check_out_date, b.status) === 'overdue',
    ).length,
  }

  const filteredBookings = hotelAndBranchFilteredBookings.filter((b) => {
    const matchesSearch =
      (b.guest_name &&
        b.guest_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.guest_email &&
        b.guest_email.toLowerCase().includes(searchTerm.toLowerCase()))
    if (!matchesSearch) return false

    if (filterType === 'all') return true
    if (filterType === 'current' && isTodayCheckIn(b.check_in_date)) return true
    if (
      filterType === 'reserved' &&
      String(b.status || '')
        .toLowerCase()
        .trim() === 'reserved'
    )
      return true
    if (
      filterType === 'cancelled' &&
      String(b.status || '')
        .toLowerCase()
        .trim() === 'cancelled'
    )
      return true
    if (
      filterType === 'checkedout' &&
      String(b.status || '')
        .toLowerCase()
        .trim() === 'checkedout'
    )
      return true
    if (filterType === 'about_to_checkout')
      return isAboutToCheckout(b.check_out_date, b.status)
    if (filterType === 'checkout_overdue')
      return getCheckoutStatus(b.check_out_date, b.status) === 'overdue'

    return false
  })

  const totalRevenue = filteredBookings
    .filter((b) => b.payment_status?.toLowerCase() === 'paid')
    .reduce((sum, item) => sum + Number(item.total_amount || 0), 0)

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const paginatedBookings = filteredBookings.slice(startIndex, endIndex)

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem('token')

      let params = {}

      searchFields.forEach((item) => {
        if (item.keyword.trim() !== '') {
          params[item.field] = item.keyword
        }
      })

      const response = await axios.get(
        'http://localhost:5000/api/bookings/download/excel',
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        },
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))

      const link = document.createElement('a')

      link.href = url
      link.setAttribute('download', 'bookings.xlsx')

      document.body.appendChild(link)

      link.click()

      link.remove()
    } catch (err) {
      console.log('Excel error:', err.message)
    }
  }

  return (
    <Container
      fluid
      className="page-container py-4"
      style={{
        background: 'linear-gradient(135deg, #f6f8fc 0%, #e9edf5 100%)',
        minHeight: '100vh',
        transition: 'background-color 0.5s ease',
      }}
    >
      <ToastContainer position="top-right" />

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
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
          <h2 className="mb-0 fw-bold text-dark" style={{ fontSize: '26px' }}>
            Revenue Report
          </h2>
        </div>

        <div className="d-flex flex-wrap gap-3 align-items-center">
          <div>
            <Card
              className="shadow border-0 rounded-4"
              style={{
                background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
                minWidth: '200px',
              }}
            >
              <Card.Body className="p-1 px-4 text-white d-flex align-items-center">
                <div>
                  <p
                    className="mb-0 small text-uppercase fw-bold"
                    style={{ letterSpacing: '1px', opacity: 0.9 }}
                  >
                    Total Revenue
                  </p>
                  <h3 className="mb-0 fw-bold">
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </h3>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Body className="p-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-3 gap-3">
            <div className="d-flex flex-column flex-sm-row gap-3 w-100 w-lg-auto">
              <Dropdown
                align="start"
                onSelect={(val) =>
                  handleHotelChange({ target: { value: val } })
                }
                className="flex-fill"
              >
                <Dropdown.Toggle
                  variant="light"
                  className="shadow-sm border-0 rounded-pill px-3 text-start d-flex justify-content-between align-items-center w-100"
                >
                  {hotelId
                    ? hotels.find((h) => h.id == hotelId)?.hotel_name ||
                    'All Hotels'
                    : 'All Hotels'}
                </Dropdown.Toggle>
                <Dropdown.Menu
                  className="border-0 shadow-lg rounded-4 p-2"
                  style={{ maxHeight: '300px', overflowY: 'auto' }}
                >
                  <div className="px-2 pb-2 mb-2 border-bottom">
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-pill"
                      placeholder="Search..."
                      onChange={(e) => setSearchHotel(e.target.value)}
                      value={searchHotel}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <Dropdown.Item
                    eventKey=""
                    active={hotelId === ''}
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
                        onClick={() => setSearchHotel('')}
                      >
                        {hotel.hotel_name}
                      </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
              </Dropdown>

              <Dropdown
                align="start"
                onSelect={(val) =>
                  handleBranchChange({ target: { value: val } })
                }
                className="flex-fill"
              >
                <Dropdown.Toggle
                  variant="light"
                  className="shadow-sm border-0 rounded-pill px-3 text-start d-flex justify-content-between align-items-center w-100"
                >
                  {branchId
                    ? branches.find((b) => b.id == branchId)?.branch_name ||
                    'All Branches'
                    : 'All Branches'}
                </Dropdown.Toggle>
                <Dropdown.Menu
                  className="border-0 shadow-lg rounded-4 p-2"
                  style={{ maxHeight: '300px', overflowY: 'auto' }}
                >
                  <div className="px-2 pb-2 mb-2 border-bottom">
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-pill"
                      placeholder="Search..."
                      onChange={(e) => setSearchBranch(e.target.value)}
                      value={searchBranch}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <Dropdown.Item
                    eventKey=""
                    active={branchId === ''}
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
                    .filter(
                      (b) =>
                        !hotelId ||
                        hotels.find((h) => h.id == hotelId)?.branch_id == b.id,
                    )
                    .map((branch) => (
                      <Dropdown.Item
                        key={branch.id}
                        eventKey={branch.id.toString()}
                        active={branchId == branch.id}
                        onClick={() => setSearchBranch('')}
                      >
                        {branch.branch_name}
                      </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <div className="d-flex align-items-center mt-3 mt-md-0">
              <button
                type="button"
                className="search-btn shadow-sm rounded-3"
                onClick={() => setShowSearchPanel(!showSearchPanel)}
                style={{
                  padding: '6px 16px',
                  backgroundColor: '#00baf2',
                  border: 'none',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
              >
                <FaSearch /> {showSearchPanel ? 'Hide' : 'Search'}
              </button>

              <span className="text-muted small ms-3 fs-6">Show:</span>
              <Form.Select
                size="sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                style={{
                  width: '80px',
                  display: 'inline-block',
                }}
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={150}>150</option>
              </Form.Select>
            </div>
          </div>

          {/* Search content */}

          {showSearchPanel && (
            <SearchPanel
              searchFields={searchFields}
              setSearchFields={setSearchFields}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              onSearch={handleSearch}
              onReset={handleReset}
              searchOptions={searchOptions}
              filterMode="date"
              showDownload={true}
              onDownloadExcel={handleDownloadExcel}
            />
          )}

          <style>
            {`
                        .compact-booking-table th, .compact-booking-table td {
                            padding: 0.1rem !important;
                        }
                        .ultra-compact-tabs .nav-link {
                            padding: 0.3rem 0.5rem !important;
                            font-size: 13px !important;
                        }
                        `}
          </style>
          <Tabs
            id="revenue-filter-tabs"
            activeKey={filterType}
            onSelect={(k) => setFilterType(k)}
            className="mb-4 custom-bootstrap-tabs ultra-compact-tabs flex-nowrap"
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            <Tab
              eventKey="all"
              title={`Total (${bookingCounts?.total_bookings || 0})`}
            />
            <Tab
              eventKey="current"
              title={`Current (${bookingCounts?.current_bookings || 0})`}
            />
            <Tab
              eventKey="cancelled"
              title={`Cancelled (${bookingCounts?.cancelled_bookings || 0})`}
            />
            <Tab
              eventKey="reserved"
              title={`Reserved (${bookingCounts?.reserved_bookings || 0})`}
            />
            <Tab
              eventKey="checkedout"
              title={`Vacant (${bookingCounts?.checkedout_bookings || 0})`}
            />
            <Tab
              eventKey="about_to_checkout"
              title={`Checkout Soon (${bookingCounts?.about_to_checkout_bookings || 0})`}
            />
            <Tab
              eventKey="checkout_overdue"
              title={`Overdue (${bookingCounts?.checkout_overdue_bookings || 0})`}
            />
          </Tabs>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-3 text-muted fw-medium">
                Loading revenue details...
              </p>
            </div>
          ) : (
            <div
              className="table-responsive"
              style={{ overflowX: 'auto', minHeight: '200px' }}
            >
              <Table
                bordered
                hover
                size="sm"
                className="list-table compact-booking-table align-middle mb-0 shadow-sm"
                style={{ fontSize: '12px' }}
              >
                <thead className="table-light text-center text-secondary">
                  <tr>
                    <th
                      className="text-center fw-semibold p-1"
                      style={{ width: '10px', whiteSpace: 'nowrap' }}
                    >
                      Room No
                    </th>
                    <th
                      className="fw-semibold p-1"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Guest
                    </th>
                    <th
                      className="text-center fw-semibold p-1"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Email
                    </th>
                    <th
                      className="text-center fw-semibold p-1"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Profile
                    </th>
                    <th
                      className="text-center fw-semibold p-1"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Room Type
                    </th>
                    <th
                      className="fw-semibold p-1"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Check In
                    </th>
                    <th
                      className="fw-semibold p-1"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Check Out
                    </th>
                    <th
                      className="fw-semibold p-1"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Status
                    </th>
                    <th
                      className="fw-semibold p-1"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Payment
                    </th>
                    <th
                      className="text-center fw-semibold p-1"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {filteredBookings.length > 0 ? (
                    paginatedBookings.map((b, index) => (
                      <tr key={b.booking_id || index}>
                        <td>{b.room_no || 'N/A'}</td>
                        <td>{b.guest_name}</td>
                        <td>{b.guest_email || 'N/A'}</td>
                        <td>
                          {b.user_profile_pic ? (
                            <img
                              src={`http://localhost:5000/uploads/${b.user_profile_pic}`}
                              alt=""
                              width="50"
                              height="50"
                              style={{
                                objectFit: 'cover',
                                borderRadius: '4px',
                              }}
                            />
                          ) : (
                            <img
                              src={dummy_user}
                              alt="Dummy User"
                              width="50"
                              height="50"
                              style={{
                                objectFit: 'cover',
                                borderRadius: '4px',
                              }}
                            />
                          )}
                        </td>
                        <td>{b.room_type || 'N/A'}</td>
                        <td>{b.check_in_date?.split('T')[0]}</td>
                        <td>
                          {b.check_out_date?.split('T')[0]}
                          {getCheckoutStatus(b.check_out_date, b.status) ===
                            'overdue' && (
                              <div>
                                <span
                                  className="badge bg-danger mt-1 d-inline-block"
                                  style={{ fontSize: '10px', padding: '3px 6px' }}
                                >
                                  Overdue
                                </span>
                              </div>
                            )}
                          {getCheckoutStatus(b.check_out_date, b.status) ===
                            'soon' && (
                              <div>
                                <span
                                  className="badge bg-warning mt-1 d-inline-block text-dark"
                                  style={{ fontSize: '10px', padding: '3px 6px' }}
                                >
                                  Soon
                                </span>
                              </div>
                            )}
                        </td>
                        <td>
                          <span
                            className={`badge ${b.status === 'Cancelled' ? 'bg-danger' : 'bg-success'}`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${b.payment_status === 'Paid' ? 'bg-success' : b.payment_status === 'Partial' ? 'bg-warning text-dark' : 'bg-danger'}`}
                          >
                            {b.payment_status}
                          </span>
                        </td>
                        <td className="text-center">
                          <Dropdown drop="start">
                            <Dropdown.Toggle
                              variant="outline-secondary"
                              size="sm"
                              className="bg-secondary text-white shadow-sm border"
                            >
                              <BsThreeDotsVertical />
                            </Dropdown.Toggle>
                            <Dropdown.Menu
                              className="shadow-sm"
                              style={{ marginRight: '40px' }}
                            >
                              <Dropdown.Item onClick={() => handleView(b)}>
                                <FaEye className="me-2 text-info" /> View
                                Details
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="text-center py-5 text-muted">
                        No revenue records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* VIEW MODAL */}
      <Modal
        show={showView}
        onHide={() => setShowView(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0 bg-light">
          <Modal.Title className="fw-bold text-dark">
            Booking Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {viewData && (
            <>
              <Row className="g-4">
                <Col md={4} className="text-center">
                  {viewData.user_profile_pic ? (
                    <img
                      src={`http://localhost:5000/uploads/${viewData.user_profile_pic}`}
                      alt="profile"
                      className="rounded-circle shadow"
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <img
                      src={dummy_user}
                      alt="profile"
                      className="rounded-circle shadow"
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  <h5 className="mt-3 fw-bold text-dark">
                    {viewData.guest_name}
                  </h5>
                  <p className="text-muted mb-0">{viewData.guest_email}</p>
                  <p className="text-muted fw-medium">{viewData.guest_phone}</p>
                </Col>
                <Col md={8}>
                  <Card className="border-0 shadow-sm rounded-3 h-100 bg-light">
                    <Card.Body>
                      <h6 className="fw-bold text-secondary border-bottom pb-2 mb-3">
                        Stay Information
                      </h6>
                      <Row className="mb-3">
                        <Col sm={6}>
                          <p className="mb-1 text-muted small">Hotel</p>
                          <p className="fw-bold text-dark mb-0">
                            {viewData.hotel_name || 'N/A'}
                          </p>
                        </Col>
                        <Col sm={6}>
                          <p className="mb-1 text-muted small">Room No.</p>
                          <p className="fw-bold text-dark mb-0">
                            {viewData.room_no || 'N/A'}
                          </p>
                        </Col>
                      </Row>
                      <Row className="mb-3">
                        <Col sm={6}>
                          <p className="mb-1 text-muted small">Check-In</p>
                          <p className="fw-bold text-dark mb-0">
                            {viewData.check_in_date?.split('T')[0]}
                          </p>
                        </Col>
                        <Col sm={6}>
                          <p className="mb-1 text-muted small">Check-Out</p>
                          <p className="fw-bold text-dark mb-0">
                            {viewData.check_out_date?.split('T')[0]}
                          </p>
                        </Col>
                      </Row>
                      <Row className="mb-3">
                        <Col sm={6}>
                          <p className="mb-1 text-muted small">Status</p>
                          <span
                            className={`badge ${viewData.status?.toLowerCase() === 'booked' ? 'bg-primary' : 'bg-secondary'} rounded-pill px-3 py-1 shadow-sm`}
                          >
                            {viewData.status || 'N/A'}
                          </span>
                        </Col>
                        <Col sm={6}>
                          <p className="mb-1 text-muted small">Payment</p>
                          <span
                            className={`badge ${viewData.payment_status?.toLowerCase() === 'paid' ? 'bg-success' : 'bg-warning text-dark'} bg-opacity-10 text-${viewData.payment_status?.toLowerCase() === 'paid' ? 'success' : 'warning'} border border-${viewData.payment_status?.toLowerCase() === 'paid' ? 'success' : 'warning'} border-opacity-25 px-3 py-1 rounded-pill shadow-sm`}
                          >
                            {viewData.payment_status || 'N/A'}
                          </span>
                        </Col>
                      </Row>
                      <Row>
                        <Col sm={12}>
                          <p className="mb-1 text-muted small">
                            Total Amount Paid
                          </p>
                          <h4 className="fw-bold text-success mb-0">
                            ₹
                            {Number(viewData.total_amount || 0).toLocaleString(
                              'en-IN',
                            )}
                          </h4>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* OTHER GUESTS SECTION */}
              {(() => {
                let otherGuests = []
                try {
                  if (typeof viewData.other_guests === 'string') {
                    otherGuests = JSON.parse(viewData.other_guests)
                  } else if (Array.isArray(viewData.other_guests)) {
                    otherGuests = viewData.other_guests
                  }
                } catch (e) {
                  console.error('Error parsing other guests:', e)
                }

                if (otherGuests && otherGuests.length > 0) {
                  return (
                    <div className="mt-4">
                      <h6 className="fw-bold text-secondary border-bottom pb-2 mb-3">
                        Other Guests Information
                      </h6>
                      <div className="table-responsive">
                        <Table
                          hover
                          className="align-middle border-0 shadow-sm rounded-3 overflow-hidden"
                        >
                          <thead className="bg-light">
                            <tr>
                              <th className="py-3 px-3 border-0 text-secondary fw-bold">
                                Profile
                              </th>
                              <th className="py-3 px-3 border-0 text-secondary fw-bold">
                                Name
                              </th>
                              <th className="py-3 px-3 border-0 text-secondary fw-bold">
                                Phone
                              </th>
                              <th className="py-3 px-3 border-0 text-secondary fw-bold">
                                Email
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {otherGuests.map((g, idx) => (
                              <tr key={idx} className="bg-white">
                                <td
                                  className="px-3 py-3 text-center"
                                  style={{ width: '70px' }}
                                >
                                  {g.profile_pic ? (
                                    <img
                                      src={`http://localhost:5000/uploads/${g.profile_pic}`}
                                      width="40"
                                      height="40"
                                      alt="Guest Profile"
                                      className="rounded-circle shadow-sm"
                                      style={{ objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <img
                                      src={dummy_user}
                                      width="40"
                                      height="40"
                                      alt="Guest Profile"
                                      className="rounded-circle shadow-sm"
                                      style={{ objectFit: 'cover' }}
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-3 fw-medium text-dark">
                                  {g.guest_name || 'N/A'}
                                </td>
                                <td className="px-3 py-3 text-muted">
                                  {g.guest_phone || 'N/A'}
                                </td>
                                <td className="px-3 py-3 text-muted">
                                  {g.guest_email || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="secondary"
            onClick={() => setShowView(false)}
            className="rounded-pill px-4 shadow-sm"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default RevenueReport
