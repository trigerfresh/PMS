import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
    Container,
    Row,
    Col,
    Card,
    Table,
    Spinner,
    Dropdown,
    Button,
    Form,
} from 'react-bootstrap'
import { FaArrowLeft, FaBed, FaDoorOpen, FaDoorClosed, FaPercentage, FaSearch } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import SearchPanel from '../utils/filterPanel_2'
import * as XLSX from 'xlsx'

const Occupiency = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)

    const [hotels, setHotels] = useState([])
    const [hotelId, setHotelId] = useState(localStorage.getItem('hotelId') || '')
    const [searchHotel, setSearchHotel] = useState('')

    const [branches, setBranches] = useState([])
    const [branchId, setBranchId] = useState(localStorage.getItem('branchId') || '')
    const [searchBranch, setSearchBranch] = useState('')

    const [rooms, setRooms] = useState([])
    const [statusFilter, setStatusFilter] = useState('all')

    const [showSearchPanel, setShowSearchPanel] = useState(false)
    const [searchFields, setSearchFields] = useState([{ field: 'room_no', keyword: '' }])
    const [activeSearchFields, setActiveSearchFields] = useState([])

    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(1)

    const searchOptions = [
        { label: 'Hotel Name', value: 'hotel_name' },
        { label: 'Floor', value: 'floor_name' },
        { label: 'Room No', value: 'room_no' },
        { label: 'Room Type', value: 'room_type' },
        { label: 'Status', value: 'status' },
    ]

    const handleSearch = () => {
        setActiveSearchFields([...searchFields])
        setCurrentPage(1)
    }

    const handleReset = () => {
        setSearchFields([{ field: 'room_no', keyword: '' }])
        setActiveSearchFields([])
        setCurrentPage(1)
    }

    const handleDownloadExcel = () => {
        const dataToExport = tableData.map((room) => ({
            Hotel: room.hotel_name || 'N/A',
            Floor: room.floor_name || 'N/A',
            'Room No': room.room_no || 'N/A',
            'Room Type': room.room_type || 'N/A',
            Price: room.price || 'N/A',
            Status: room.status || 'N/A',
        }))

        const worksheet = XLSX.utils.json_to_sheet(dataToExport)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rooms')
        XLSX.writeFile(workbook, 'occupancy_rooms.xlsx')
    }

    useEffect(() => {
        fetchHotels()
        fetchBranches()
    }, [])

    useEffect(() => {
        fetchRooms()
    }, [hotelId, branchId, hotels])

    const fetchHotels = async () => {
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

    const fetchBranches = async () => {
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

    const fetchRooms = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const res = await axios.get('http://localhost:5000/api/rooms', {
                headers: { Authorization: `Bearer ${token}` },
            })
            const allRooms = res.data.data || []
            setRooms(allRooms)
        } catch (error) {
            console.error('Error fetching rooms', error)
        } finally {
            setLoading(false)
        }
    }

    const handleHotelChange = (e) => {
        const value = e.target.value
        setHotelId(value)

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

    // Filter Logic
    const branchHotelIds = branchId
        ? hotels.filter((h) => h.branch_id == branchId).map((h) => Number(h.id))
        : []

    const filteredRooms = rooms.filter((r) => {
        if (hotelId && Number(r.hotel_id) !== Number(hotelId)) return false
        if (branchId && !branchHotelIds.includes(Number(r.hotel_id))) return false
        return true
    })

    const totalRooms = filteredRooms.length
    const occupiedRooms = filteredRooms.filter(
        (room) => room.status?.toLowerCase() === 'occupied'
    ).length
    const availableRooms = filteredRooms.filter(
        (room) =>
            room.status?.toLowerCase() === 'available' ||
            room.status?.toLowerCase() === 'avalable'
    ).length
    const maintenanceRooms = filteredRooms.filter(
        (room) => room.status?.toLowerCase() === 'maintenance'
    ).length

    const occupancyRate =
        totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0

    // Further filter for table based on statusFilter and activeSearchFields
    const tableData = filteredRooms.filter((r) => {
        // Status Filter
        if (statusFilter === 'occupied' && r.status?.toLowerCase() !== 'occupied') return false
        if (statusFilter === 'available' && r.status?.toLowerCase() !== 'available' && r.status?.toLowerCase() !== 'avalable') return false
        if (statusFilter === 'maintenance' && r.status?.toLowerCase() !== 'maintenance') return false

        // Search Filter
        if (activeSearchFields.length > 0) {
            let matches = true
            for (const sf of activeSearchFields) {
                if (sf.field && sf.keyword) {
                    const val = String(r[sf.field] || '').toLowerCase()
                    if (!val.includes(sf.keyword.toLowerCase())) {
                        matches = false
                        break
                    }
                }
            }
            if (!matches) return false
        }
        return true
    })

    // Pagination
    const totalPages = Math.ceil(tableData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedRooms = tableData.slice(startIndex, startIndex + itemsPerPage)

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
                        <span style={{ fontSize: '1.2rem', color: '#64748b' }}>
                            <FaArrowLeft />
                        </span>
                    </Button>
                    <div>
                        <h2 className="mb-0 fw-bold text-dark" style={{ fontSize: '26px' }}>
                            Occupancy Overview
                        </h2>
                        <small className="text-muted fw-bold" style={{ letterSpacing: '0.5px' }}>
                            Hotel Occupancy & Room Status
                        </small>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <Row className="g-3 row-cols-xl-4 row-cols-md-2 row-cols-1 mb-4">
                <Col>
                    <Card className="dashboard-card shadow-sm border-0 rounded-3">
                        <Card.Body
                            className="text-white rounded-3 p-3 position-relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #b92b27 0%, #1565C0 100%)' }}
                        >
                            <FaPercentage className="position-absolute" size={60} style={{ right: '-5px', bottom: '-10px', opacity: 0.2 }} />
                            <h2 className="mb-1 fw-bold position-relative z-1">{occupancyRate}%</h2>
                            <p className="mb-0 opacity-100 small fw-bold position-relative z-1">Occupancy Rate</p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col>
                    <Card onClick={() => { setStatusFilter('all'); setCurrentPage(1); }} className="dashboard-card shadow-sm rounded-3" style={{ cursor: 'pointer', transition: 'all 0.3s ease', border: statusFilter === 'all' ? '2px solid #0d6efd' : '2px solid transparent' }}>
                        <Card.Body className="p-3 position-relative overflow-hidden bg-white rounded-3">
                            <FaBed className="position-absolute text-primary" size={40} style={{ right: '5px', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }} />
                            <h2 className="mb-1 fw-bold text-dark position-relative z-1">{totalRooms}</h2>
                            <p className="text-primary mb-0 small fw-bold position-relative z-1">Total Rooms</p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col>
                    <Card onClick={() => { setStatusFilter('occupied'); setCurrentPage(1); }} className="dashboard-card shadow-sm rounded-3" style={{ cursor: 'pointer', transition: 'all 0.3s ease', border: statusFilter === 'occupied' ? '2px solid #dc3545' : '2px solid transparent' }}>
                        <Card.Body className="p-3 position-relative overflow-hidden bg-white rounded-3">
                            <FaDoorClosed className="position-absolute text-danger" size={40} style={{ right: '5px', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }} />
                            <h2 className="mb-1 fw-bold text-dark position-relative z-1">{occupiedRooms}</h2>
                            <p className="text-danger mb-0 small fw-bold position-relative z-1">Occupied Rooms</p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col>
                    <Card onClick={() => { setStatusFilter('available'); setCurrentPage(1); }} className="dashboard-card shadow-sm rounded-3" style={{ cursor: 'pointer', transition: 'all 0.3s ease', border: statusFilter === 'available' ? '2px solid #198754' : '2px solid transparent' }}>
                        <Card.Body className="p-3 position-relative overflow-hidden bg-white rounded-3">
                            <FaDoorOpen className="position-absolute text-success" size={40} style={{ right: '5px', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }} />
                            <h2 className="mb-1 fw-bold text-dark position-relative z-1">{availableRooms}</h2>
                            <p className="text-success mb-0 small fw-bold position-relative z-1">Available Rooms</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-sm border-0 rounded-4 mb-4">
                <Card.Body className="p-4">
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-3 gap-3">
                        <div className="d-flex flex-column flex-sm-row gap-3 w-100 w-lg-auto">
                            <Dropdown align="start" onSelect={(val) => handleHotelChange({ target: { value: val } })} className="flex-fill">
                                <Dropdown.Toggle
                                    variant="light"
                                    className="shadow-sm border-0 rounded-pill px-3 text-start d-flex justify-content-between align-items-center w-100"
                                >
                                    {hotelId ? hotels.find((h) => h.id == hotelId)?.hotel_name || 'All Hotels' : 'All Hotels'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="border-0 shadow-lg rounded-4 p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                                    <Dropdown.Item eventKey="" active={hotelId === ''} onClick={() => setSearchHotel('')}>
                                        All Hotels
                                    </Dropdown.Item>
                                    {hotels
                                        .filter((h) => h.hotel_name.toLowerCase().includes(searchHotel.toLowerCase()))
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

                            <Dropdown align="start" onSelect={(val) => handleBranchChange({ target: { value: val } })} className="flex-fill">
                                <Dropdown.Toggle
                                    variant="light"
                                    className="shadow-sm border-0 rounded-pill px-3 text-start d-flex justify-content-between align-items-center w-100"
                                >
                                    {branchId ? branches.find((b) => b.id == branchId)?.branch_name || 'All Branches' : 'All Branches'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="border-0 shadow-lg rounded-4 p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                                    <Dropdown.Item eventKey="" active={branchId === ''} onClick={() => setSearchBranch('')}>
                                        All Branches
                                    </Dropdown.Item>
                                    {branches
                                        .filter((b) => b.branch_name.toLowerCase().includes(searchBranch.toLowerCase()))
                                        .filter((b) => {
                                            if (!hotelId) return true
                                            const selectedHotel = hotels.find((h) => h.id == hotelId)
                                            return selectedHotel && selectedHotel.branch_id ? b.id == selectedHotel.branch_id : true
                                        })
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

                        <div className="d-flex align-items-center gap-3 mt-3 mt-md-0">
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
                            <div className="d-flex align-items-center">
                                <span className="text-muted small me-2 text-nowrap">Show:</span>
                                <Form.Select
                                    size="sm"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value))
                                        setCurrentPage(1)
                                    }}
                                    className="shadow-sm rounded-pill"
                                    style={{ width: '80px' }}
                                >
                                    <option value={10}>10</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={150}>150</option>
                                </Form.Select>
                            </div>
                        </div>
                    </div>

                    {showSearchPanel && (
                        <SearchPanel
                            searchFields={searchFields}
                            setSearchFields={setSearchFields}
                            onSearch={handleSearch}
                            onReset={handleReset}
                            searchOptions={searchOptions}
                            filterMode="none"
                            showDownload={true}
                            onDownloadExcel={handleDownloadExcel}
                        />
                    )}

                    <style>
                        {`
              .compact-booking-table th, .compact-booking-table td {
                  padding: 0.5rem !important;
              }
            `}
                    </style>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="success" />
                            <p className="mt-3 text-muted fw-medium">Loading occupancy details...</p>
                        </div>
                    ) : (
                        <div className="table-responsive" style={{ overflowX: 'auto', minHeight: '200px' }}>
                            <Table
                                bordered
                                hover
                                size="sm"
                                className="list-table compact-booking-table align-middle mb-0 shadow-sm"
                                style={{ fontSize: '14px' }}
                            >
                                <thead className="table-light text-center text-secondary">
                                    <tr>
                                        <th className="fw-semibold">Hotel</th>
                                        <th className="fw-semibold">Floor</th>
                                        <th className="text-center fw-semibold">Room No</th>
                                        <th className="text-center fw-semibold">Room Type</th>
                                        <th className="text-center fw-semibold">Price</th>
                                        <th className="text-center fw-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-center">
                                    {paginatedRooms.length > 0 ? (
                                        paginatedRooms.map((room) => (
                                            <tr key={room.room_id}>
                                                <td>{room.hotel_name || 'N/A'}</td>
                                                <td>{room.floor_name || 'N/A'}</td>
                                                <td>{room.room_no || 'N/A'}</td>
                                                <td>{room.room_type || 'N/A'}</td>
                                                <td>₹{room.price || 'N/A'}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${room.status?.toLowerCase() === 'occupied'
                                                            ? 'bg-danger'
                                                            : room.status?.toLowerCase() === 'available' ||
                                                                room.status?.toLowerCase() === 'avalable'
                                                                ? 'bg-success'
                                                                : room.status?.toLowerCase() === 'maintenance'
                                                                    ? 'bg-warning text-dark'
                                                                    : 'bg-secondary'
                                                            }`}
                                                    >
                                                        {room.status || 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5 text-muted">
                                                No rooms found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {!loading && totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <span className="text-muted small">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, tableData.length)} of {tableData.length} records
                            </span>
                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="rounded-pill px-3"
                                >
                                    Previous
                                </Button>
                                <span className="d-flex align-items-center px-2 small fw-bold text-muted">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="rounded-pill px-3"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    )
}

export default Occupiency
