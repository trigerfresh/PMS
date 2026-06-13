import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
    FaPlus,
    FaSearch,
    FaPen,
    FaTrashAlt,
    FaEye,
    FaArrowLeft,
    FaEllipsisV,
} from 'react-icons/fa'
import {
    Alert,
    Button,
    Card,
    Col,
    Container,
    Dropdown,
    Form,
    Row,
    Table,
    Tabs,
    Tab,
    Modal,
} from 'react-bootstrap'
import { BsThreeDotsVertical } from 'react-icons/bs'

const FoodOrders = () => {
    const [orders, setOrders] = useState([])
    const [hotels, setHotels] = useState([])
    const [floors, setFloors] = useState([])
    const [bookings, setBookings] = useState([])

    const [primaryCategories, setPrimaryCategories] = useState([])
    const [categories, setCategories] = useState([])
    const [subcategories, setSubcategories] = useState([])
    const [rooms, setRooms] = useState([])
    const [products, setProducts] = useState([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [isEditing, setIsEditing] = useState(null)
    const [validationErrors, setValidationErrors] = useState({})
    const [pageSize, setPageSize] = useState(50)
    const [statusFilter, setStatusFilter] = useState('approved')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedHotelFilter, setSelectedHotelFilter] = useState('')
    const [showViewModal, setShowViewModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)

    const initialFormData = {
        hotel_id: '',
        branch_id: '',
        branch_name: '',
        floor_id: '',
        room_no: '',
        booking_id: '',
        room_id: '',
        customer_name: '',
        pcat_id: '',
        primary_category_name: '',
        category_id: '',
        category_name: '',
        subcategory_id: '',
        subcategory_name: '',
        product_id: '',
        product_name: '',
        product_image: '',
        qty: 1,
        price: 0,
        gst: 0,
        remarks: '',
    }

    const [formData, setFormData] = useState(initialFormData)

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    }

    const fetchData = async () => {
        try {
            const [
                ordersRes,
                hotelsRes,
                bookingsRes,
                roomsRes,
                pcatRes,
                catRes,
                subcatRes,
                prodRes,
            ] = await Promise.all([
                axios.get('http://localhost:5000/api/food-orders', getAuthHeaders()),
                axios.get('http://localhost:5000/api/hotels', getAuthHeaders()),
                axios.get('http://localhost:5000/api/booking', getAuthHeaders()),
                axios.get('http://localhost:5000/api/rooms', getAuthHeaders()),
                axios.get(
                    'http://localhost:5000/api/primary-category',
                    getAuthHeaders(),
                ),
                axios.get('http://localhost:5000/api/category', getAuthHeaders()),
                axios.get('http://localhost:5000/api/subcategory', getAuthHeaders()),
                axios.get('http://localhost:5000/api/product', getAuthHeaders()),
            ])

            setOrders(ordersRes.data.data || [])
            setHotels(hotelsRes.data.data || [])
            setRooms(roomsRes.data.data || [])

            // Filter bookings to exclude cancelled, checked out, or deleted
            const activeBookings = (bookingsRes.data.data || []).filter((b) => {
                const s = (b.status || '').toLowerCase().replace(/\s+/g, '')
                return !['checkedout', 'cancelled', 'deleted'].includes(s)
            })
            setBookings(activeBookings)

            setPrimaryCategories(
                (pcatRes.data.data || []).filter(
                    (c) => String(c.active) === '0' || !c.active,
                ),
            )
            setCategories(
                (catRes.data.data || []).filter(
                    (c) => String(c.active) === '0' || !c.active,
                ),
            )
            setSubcategories(
                (subcatRes.data.data || []).filter(
                    (c) => String(c.active) === '0' || !c.active,
                ),
            )
            setProducts(
                (prodRes.data.data || []).filter(
                    (p) => String(p.active) === '0' || !p.active,
                ),
            )
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token')
                window.location.href = '/login'
            } else {
                setError('Failed to load data.')
            }
        } finally {
            setLoading(false)
        }
    }

    const fetchOrders = async () => {
        try {
            const res = await axios.get(
                'http://localhost:5000/api/food-orders',
                getAuthHeaders(),
            )
            setOrders(res.data.data || [])
        } catch (err) {
            console.error(err)
        }
    }

    const fetchFloors = async (hotelId) => {
        if (!hotelId) {
            setFloors([])
            return
        }
        try {
            const res = await axios.get(
                `http://localhost:5000/api/floors/${hotelId}`,
                getAuthHeaders(),
            )
            setFloors(res.data.data || [])
        } catch (err) {
            console.error('Error fetching floors', err)
            setFloors([])
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        let newFormData = { ...formData, [name]: value }

        // Handlers for dropdown selections to auto-fill names and cascade
        if (name === 'booking_id') {
            const selectedBooking = bookings.find(
                (b) => String(b.booking_id) === String(value),
            )

            if (selectedBooking) {
                newFormData.booking_id = String(selectedBooking.booking_id)
                newFormData.room_id = String(selectedBooking.room_id)
                newFormData.room_no = String(selectedBooking.room_no)
                newFormData.customer_name = selectedBooking.guest_name
            } else {
                newFormData.booking_id = ''
                newFormData.room_id = ''
                newFormData.room_no = ''
                newFormData.customer_name = ''
            }
        }

        if (name === 'hotel_id') {
            const selectedHotel = hotels.find((h) => String(h.id) === String(value))
            if (selectedHotel) {
                newFormData.branch_id = selectedHotel.branch_id || ''
                newFormData.branch_name = selectedHotel.branch_name || ''
            } else {
                newFormData.branch_id = ''
                newFormData.branch_name = ''
            }
            fetchFloors(value)
            newFormData.floor_id = ''
            newFormData.room_no = ''
            newFormData.booking_id = ''
            newFormData.room_id = ''
            newFormData.customer_name = ''
        }

        if (name === 'floor_id') {
            newFormData.room_no = ''
            newFormData.room_id = ''
            newFormData.customer_name = ''
            newFormData.booking_id = ''
        }

        if (name === 'pcat_id') {
            const pcat = primaryCategories.find((p) => String(p.id) === String(value))
            if (pcat) newFormData.primary_category_name = pcat.primary_categories_name
            newFormData.category_id = ''
            newFormData.subcategory_id = ''
            newFormData.product_id = ''
        }

        if (name === 'category_id') {
            const cat = categories.find((c) => String(c.id) === String(value))
            if (cat) newFormData.category_name = cat.category_name
            newFormData.subcategory_id = ''
            newFormData.product_id = ''
        }

        if (name === 'subcategory_id') {
            const subcat = subcategories.find((s) => String(s.id) === String(value))
            if (subcat) newFormData.subcategory_name = subcat.subcategory_name
            newFormData.product_id = ''
        }

        if (name === 'product_id') {
            const prod = products.find((p) => String(p.id) === String(value))
            if (prod) {
                newFormData.product_name = prod.product_name
                newFormData.product_image = prod.image1 || ''
                newFormData.price = prod.price || 0
                newFormData.gst = prod.gst || 0
            }
        }

        setFormData(newFormData)
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const resetForm = () => {
        setFormData(initialFormData)
        setValidationErrors({})
        setIsEditing(null)
    }

    const validateForm = () => {
        const errors = {}
        if (!formData.hotel_id) errors.hotel_id = 'Hotel is required'
        if (!formData.floor_id) errors.floor_id = 'Floor is required'
        if (!formData.room_no) errors.room_no = 'Room/Booking is required'
        if (!formData.product_id) errors.product_id = 'Product is required'
        if (!formData.qty || formData.qty < 1)
            errors.qty = 'Valid quantity is required'

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        try {
            const payload = {
                ...formData,
                ...(isEditing && { order_id: formData.order_id }),
                created_by: 'Admin',
            }

            const url = isEditing
                ? `http://localhost:5000/api/food-orders/${isEditing.order_detail_id}`
                : `http://localhost:5000/api/food-orders`

            const method = isEditing ? 'put' : 'post'

            await axios[method](url, payload, getAuthHeaders())
            alert(`Food Order ${isEditing ? 'updated' : 'created'} successfully!`)
            resetForm()
            setShowForm(false)
            fetchOrders()
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed')
        }
    }

    const handleEdit = (order) => {
        setIsEditing(order)
        setFormData({
            order_id: order.order_id,
            hotel_id: order.hotel_id || '',
            branch_id: order.branch_id || '',
            floor_id: order.floor_id || '',
            room_no: order.room_no || order.booking_id || '',
            booking_id: order.booking_id || '',
            room_id: order.room_id || '',
            customer_name: order.customer_name || '',
            pcat_id: order.pcat_id || '',
            primary_category_name: order.primary_category_name || '',
            category_id: order.category_id || '',
            category_name: order.category_name || '',
            subcategory_id: order.subcategory_id || '',
            subcategory_name: order.subcategory_name || '',
            product_id: order.product_id || '',
            product_name: order.product_name || '',
            product_image: order.product_image || '',
            qty: order.qty || 1,
            price: order.price || 0,
            gst: order.gst || 0,
            remarks: order.remarks || '',
        })
        setShowForm(true)
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                await axios.delete(
                    `http://localhost:5000/api/food-orders/${id}`,
                    getAuthHeaders(),
                )
                alert('Order deleted successfully!')
                fetchOrders()
            } catch (err) {
                alert('Delete failed!')
            }
        }
    }

    const handleRestore = async (id) => {
        try {
            await axios.put(
                `http://localhost:5000/api/food-orders/restore/${id}`,
                {},
                getAuthHeaders(),
            )
            alert('Order restored successfully!')
            fetchOrders()
        } catch (err) {
            alert('Restore failed!')
        }
    }

    const activeOrders = orders.filter((o) => o.active === '0' || !o.active)
    const deletedOrders = orders.filter((o) => o.active === '1')
    let baseOrders = statusFilter === 'deleted' ? deletedOrders : activeOrders
    if (selectedHotelFilter) {
        baseOrders = baseOrders.filter((o) => String(o.hotel_id) === String(selectedHotelFilter))
    }
    const displayOrders = baseOrders

    // Derived filtered dropdowns
    const filteredRooms = rooms.filter((r) => {
        if (formData.hotel_id && String(r.hotel_id) !== String(formData.hotel_id))
            return false
        if (formData.floor_id && String(r.floor_id) !== String(formData.floor_id))
            return false

        // Filter by Room Status: ONLY Occupied or Checked In
        const roomStatus = (r.status || '').toLowerCase().replace(/\s+/g, '')
        if (!['occupied', 'checkedin'].includes(roomStatus)) {
            return false
        }

        // Check if this room has an active booking in booking_masters
        const hasActiveBooking = bookings.find(
            (b) => String(b.room_id) === String(r.room_id),
        )
        if (!hasActiveBooking) return false

        return true
    })

    const filteredCategories = categories.filter(
        (c) => !formData.pcat_id || String(c.pcat_id) === String(formData.pcat_id),
    )
    const filteredSubcategories = subcategories.filter(
        (s) =>
            !formData.category_id ||
            String(s.category_id) === String(formData.category_id),
    )
    const filteredProducts = products.filter((p) => {
        if (!formData.category_id) return false // Require at least category to be selected
        if (formData.subcategory_id)
            return String(p.subcategory_id) === String(formData.subcategory_id)
        return String(p.category_id) === String(formData.category_id)
    })

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
            <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-2 border-bottom gap-3">
                <h1 className="page-title mb-0" style={{ fontSize: '25px' }}>
                    {showForm
                        ? isEditing
                            ? 'Edit Food Order'
                            : 'Create Food Order'
                        : 'Food Orders'}
                    {!showForm && (
                        <span className="text-success ms-2">({activeOrders.length})</span>
                    )}
                </h1>
                <div className="page-actions d-flex gap-3 align-items-center">
                    {!showForm && (
                        <div className="d-flex align-items-center gap-2">
                            <span className="fw-medium text-secondary">Hotel:</span>
                            <Form.Select
                                size="sm"
                                style={{ width: '160px', borderRadius: '6px' }}
                                value={selectedHotelFilter}
                                onChange={(e) => {
                                    setSelectedHotelFilter(e.target.value)
                                    setCurrentPage(1)
                                }}
                            >
                                <option value="">All Hotels</option>
                                {hotels.map(h => (
                                    <option key={h.id} value={h.id}>{h.hotel_name}</option>
                                ))}
                            </Form.Select>
                        </div>
                    )}
                    <button
                        type="button"
                        className={`${showForm ? 'btn-danger' : 'btn-primary'} shadow-sm rounded-3`}
                        onClick={() => {
                            if (showForm) {
                                resetForm()
                                setShowForm(false)
                            } else {
                                resetForm()
                                setShowForm(true)
                            }
                        }}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '500',
                            color: '#fff',
                        }}
                    >
                        {showForm ? (
                            <>
                                <FaArrowLeft /> Back to List
                            </>
                        ) : (
                            <>
                                <FaPlus /> Create New
                            </>
                        )}
                    </button>
                </div>
            </div>

            {showForm ? (
                <Card className="dashboard-card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
                    <Card.Body className="p-4">
                        <h2
                            className="mb-4 fw-bold text-secondary"
                            style={{ fontSize: '1.5rem' }}
                        >
                            Order Details
                        </h2>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={3} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Hotel *</Form.Label>
                                        <Form.Select
                                            name="hotel_id"
                                            value={formData.hotel_id}
                                            onChange={handleInputChange}
                                            isInvalid={!!validationErrors.hotel_id}
                                        >
                                            <option value="">Select Hotel</option>
                                            {hotels.map((h) => (
                                                <option key={h.id} value={h.id}>
                                                    {h.hotel_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {validationErrors.hotel_id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={3} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Branch</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.branch_name || ''}
                                            readOnly
                                            disabled
                                            placeholder="Auto-select from Hotel"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Floor *</Form.Label>
                                        <Form.Select
                                            name="floor_id"
                                            value={formData.floor_id}
                                            onChange={handleInputChange}
                                            isInvalid={!!validationErrors.floor_id}
                                        >
                                            <option value="">Select Floor</option>
                                            {floors.map((f) => (
                                                <option key={f.floor_id} value={f.floor_id}>
                                                    {f.floor_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {validationErrors.floor_id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={3} className="mb-3">
                                    <Form.Group className="mb-3">
                                        <Form.Label>Room No (Active Bookings) *</Form.Label>
                                        <Form.Select
                                            name="booking_id"
                                            value={formData.booking_id}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select Room</option>
                                            {filteredRooms.map((r) => {
                                                const b = bookings.find(
                                                    (bk) => String(bk.room_id) === String(r.room_id),
                                                )
                                                return (
                                                    <option key={b.booking_id} value={b.booking_id}>
                                                        {r.room_no} - {b.guest_name}
                                                    </option>
                                                )
                                            })}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {validationErrors.room_no}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Primary Category</Form.Label>
                                        <Form.Select
                                            name="pcat_id"
                                            value={formData.pcat_id}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">All</option>
                                            {primaryCategories.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.primary_categories_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Category</Form.Label>
                                        <Form.Select
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">All</option>
                                            {filteredCategories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.category_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Subcategory</Form.Label>
                                        <Form.Select
                                            name="subcategory_id"
                                            value={formData.subcategory_id}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">All</option>
                                            {filteredSubcategories.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.subcategory_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={3} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Product *</Form.Label>
                                        <Form.Select
                                            name="product_id"
                                            value={formData.product_id}
                                            onChange={handleInputChange}
                                            isInvalid={!!validationErrors.product_id}
                                        >
                                            <option value="">Select Product</option>
                                            {filteredProducts.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.product_name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {validationErrors.product_id}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={1} className="mb-3 d-flex align-items-end justify-content-center">
                                    {formData.product_image && (
                                        <div style={{ width: '100%', height: '38px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #ced4da', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
                                            <img 
                                                src={`http://localhost:5000/uploads/${formData.product_image}`} 
                                                alt="Product" 
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} 
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                </Col>
                                <Col md={2} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Qty *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="qty"
                                            min="1"
                                            value={formData.qty}
                                            onChange={handleInputChange}
                                            isInvalid={!!validationErrors.qty}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Price</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.price}
                                            readOnly
                                            disabled
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>GST (%)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.gst}
                                            readOnly
                                            disabled
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Total Estimate</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={(
                                                Number(formData.price) *
                                                Number(formData.qty) *
                                                (1 + Number(formData.gst) / 100)
                                            ).toFixed(2)}
                                            readOnly
                                            disabled
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={12} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Remarks</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleInputChange}
                                            placeholder="Any special instructions..."
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="d-flex justify-content-end mt-3">
                                <Button
                                    variant="secondary"
                                    className="me-2"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit">
                                    {isEditing ? 'Update Order' : 'Place Order'}
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            ) : (
                <Card className="dashboard-card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
                    <Card.Body className="p-4">
                        <Tabs
                            activeKey={statusFilter}
                            onSelect={(k) => setStatusFilter(k)}
                            className="mb-3 custom-bootstrap-tabs"
                        >
                            <Tab
                                eventKey="approved"
                                title={`Approved (${activeOrders.length})`}
                            />
                            <Tab
                                eventKey="deleted"
                                title={`Deleted (${deletedOrders.length})`}
                            />
                        </Tabs>

                        {loading ? (
                            <Alert variant="warning" className="text-center">
                                Loading...
                            </Alert>
                        ) : error ? (
                            <Alert variant="danger" className="text-center">
                                {error}
                            </Alert>
                        ) : (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h4 className="mb-0">Food Orders List</h4>
                                    <div className="d-flex align-items-center gap-2">
                                            <span>Show:</span>
                                            <Form.Select
                                                style={{ width: '100px' }}
                                                value={pageSize}
                                                onChange={(e) => {
                                                    setPageSize(Number(e.target.value))
                                                    setCurrentPage(1)
                                                }}
                                            >
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                                <option value={150}>150</option>
                                            </Form.Select>
                                        </div>
                                    </div>
                                <div
                                    className="table-responsive"
                                    style={{ minHeight: '200px' }}
                                >
                                    <Table
                                        hover
                                        bordered
                                        responsive
                                        className="list-table align-middle table-sm w-100 shadow-sm text-center"
                                        style={{ fontSize: '9px' }}
                                    >
                                        <thead className="table-light text-secondary">
                                            <tr style={{ '& th': { padding: '2px 4px !important' } }}>
                                                <th className="fw-semibold px-1 py-1">
                                                    Order ID
                                                </th>
                                                <th className="fw-semibold px-1 py-1">
                                                    Hotel Name
                                                </th>
                                                <th className="fw-semibold px-1 py-1">
                                                    Branch Name
                                                </th>
                                                <th className="fw-semibold px-1 py-1">
                                                    Floor
                                                </th>
                                                <th className="fw-semibold px-1 py-1">
                                                    Room No
                                                </th>
                                                <th className="fw-semibold px-1 py-1">
                                                    Customer
                                                </th>
                                                <th className="fw-semibold px-1 py-1">
                                                    Image
                                                </th>
                                                <th className="fw-semibold px-1 py-1">
                                                    Product
                                                </th>
                                                <th className="fw-semibold px-1 py-1">
                                                    Qty
                                                </th>
                                                <th className="fw-semibold px-1 py-1">
                                                    Grand Total
                                                </th>
                                                <th className="fw-semibold px-1 py-1">
                                                    Status
                                                </th>
                                                <th className="fw-semibold px-1 py-1">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan="12" className="py-4">
                                                        No orders found
                                                    </td>
                                                </tr>
                                            ) : (
                                                displayOrders
                                                    .slice(
                                                        (currentPage - 1) * pageSize,
                                                        currentPage * pageSize,
                                                    )
                                                    .map((order) => (
                                                        <tr key={order.order_detail_id}>
                                                            <td style={{ padding: '2px 4px' }}>{order.order_id}</td>
                                                            <td style={{ padding: '2px 4px', whiteSpace: 'normal', maxWidth: '80px' }}>{order.hotel_name || '-'}</td>
                                                            <td style={{ padding: '2px 4px', whiteSpace: 'normal', maxWidth: '80px' }}>{order.branch_name || '-'}</td>
                                                            <td style={{ padding: '2px 4px' }}>{order.floor_name || '-'}</td>
                                                            <td style={{ padding: '2px 4px' }}>{order.room_no}</td>
                                                            <td style={{ padding: '2px 4px' }}>{order.customer_name}</td>
                                                            <td style={{ padding: '2px 4px' }}>
                                                                {order.image || order.product_image ? (
                                                                    <div style={{ width: '22px', height: '22px', borderRadius: '4px', overflow: 'hidden', margin: '0 auto', border: '1px solid #dee2e6' }}>
                                                                        <img 
                                                                            src={`http://localhost:5000/uploads/${order.image || order.product_image}`} 
                                                                            alt="Product" 
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                        />
                                                                    </div>
                                                                ) : '-'}
                                                            </td>
                                                            <td style={{ padding: '2px 4px', whiteSpace: 'normal', maxWidth: '100px' }}>{order.product_name}</td>
                                                            <td style={{ padding: '2px 4px' }}>{order.qty}</td>
                                                            <td style={{ padding: '2px 4px' }}>₹{order.grand_total}</td>
                                                            <td style={{ padding: '2px 4px' }}>
                                                                <span
                                                                    className={`badge bg-${order.order_status === 'Pending' ? 'warning text-dark' : 'success'}`}
                                                                    style={{ fontSize: '8px', padding: '3px 4px' }}
                                                                >
                                                                    {order.order_status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '2px 4px' }}>
                                                                <Dropdown drop="start">
                                                                    <Dropdown.Toggle
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        className="bg-secondary text-white shadow-sm border py-0 px-1"
                                                                        style={{ fontSize: '9px' }}
                                                                    >
                                                                        <BsThreeDotsVertical />
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu style={{ minWidth: '80px', padding: '4px 0', fontSize: '10px' }}>
                                                                        <Dropdown.Item
                                                                            style={{ padding: '4px 12px' }}
                                                                            onClick={() => {
                                                                                setSelectedOrder(order)
                                                                                setShowViewModal(true)
                                                                            }}
                                                                        >
                                                                            <FaEye className="me-2 text-primary" /> View
                                                                        </Dropdown.Item>
                                                                        {statusFilter === 'approved' ? (
                                                                            <>
                                                                                <Dropdown.Item
                                                                                    style={{ padding: '4px 12px' }}
                                                                                    onClick={() => handleEdit(order)}
                                                                                >
                                                                                    <FaPen className="me-2" /> Edit
                                                                                </Dropdown.Item>
                                                                                <Dropdown.Item
                                                                                    className="text-danger"
                                                                                    style={{ padding: '4px 12px' }}
                                                                                    onClick={() =>
                                                                                        handleDelete(order.order_detail_id)
                                                                                    }
                                                                                >
                                                                                    <FaTrashAlt className="me-2" /> Delete
                                                                                </Dropdown.Item>
                                                                            </>
                                                                        ) : (
                                                                            <Dropdown.Item
                                                                                className="text-success"
                                                                                style={{ padding: '4px 12px' }}
                                                                                onClick={() =>
                                                                                    handleRestore(order.order_detail_id)
                                                                                }
                                                                            >
                                                                                Restore
                                                                            </Dropdown.Item>
                                                                        )}
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </Card.Body>
                </Card>
            )}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Food Order Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <Row className="g-3">
                            <Col md={6}><strong>Order ID:</strong> {selectedOrder.order_id}</Col>
                            <Col md={6}><strong>Status:</strong> <span className={`badge bg-${selectedOrder.order_status === 'Pending' ? 'warning text-dark' : 'success'}`}>{selectedOrder.order_status}</span></Col>
                            <Col md={6}><strong>Hotel Name:</strong> {selectedOrder.hotel_name || '-'}</Col>
                            <Col md={6}><strong>Branch Name:</strong> {selectedOrder.branch_name || '-'}</Col>
                            <Col md={6}><strong>Floor:</strong> {selectedOrder.floor_name || '-'}</Col>
                            <Col md={6}><strong>Room No:</strong> {selectedOrder.room_no}</Col>
                            <Col md={6}><strong>Customer:</strong> {selectedOrder.customer_name}</Col>
                            <Col md={6}><strong>Product:</strong> {selectedOrder.product_name}</Col>
                            <Col md={6}><strong>Primary Category:</strong> {selectedOrder.primary_category_name}</Col>
                            <Col md={6}><strong>Category:</strong> {selectedOrder.category_name}</Col>
                            <Col md={6}><strong>Subcategory:</strong> {selectedOrder.subcategory_name}</Col>
                            <Col md={4}><strong>Quantity:</strong> {selectedOrder.qty}</Col>
                            <Col md={4}><strong>Price:</strong> ₹{selectedOrder.price}</Col>
                            <Col md={4}><strong>GST:</strong> {selectedOrder.gst}%</Col>
                            <Col md={6}><strong>Amount:</strong> ₹{selectedOrder.amount}</Col>
                            <Col md={6}><strong>Grand Total:</strong> ₹{selectedOrder.grand_total}</Col>
                            <Col md={12}><strong>Remarks:</strong> {selectedOrder.remarks || 'None'}</Col>
                        </Row>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    )
}

export default FoodOrders
