import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
  Form,
  Button,
  Row,
  Col,
  Card,
  Table,
  Dropdown,
  Modal,
  Tabs,
  Tab,
} from 'react-bootstrap'
import {
  FaPen,
  FaTrashAlt,
  FaPlus,
  FaArrowLeft,
  FaSearch,
  FaCreativeCommonsRemix,
} from 'react-icons/fa'
import SearchPanel from '../../utils/filterPanel'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const BookingMaster = () => {
  const [hotels, setHotels] = useState([])
  const [floors, setFloors] = useState([])
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])

  const [isEdit, setIsEdit] = useState(false)
  const [showForm, setShowForm] = useState(false) // New State for single screen toggle
  const latestFloorRef = useRef(null)
  const [bookingCounts, setBookingCounts] = useState({
    total_bookings: 0,
    deleted_bookings: 0,
    cancelled_bookings: 0,
    current_bookings: 0,
    reserved_bookings: 0,
    checkedout_bookings: 0,
  })
  const [filterType, setFilterType] = useState('all')
  const [deletedBookings, setDeletedBookings] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [showView, setShowView] = useState(false)
  const [viewData, setViewData] = useState(null)

  const [formData, setFormData] = useState({
    booking_id: null,
    hotel_id: '',
    // floor_id: '',
    // room_id: '',
    // guest_name: '',
    // guest_phone: '',
    // guest_email: '',
    // check_in_date: '',
    // check_out_date: '',
    // price_per_day: '',
    // status: 'Booked',
    // payment_status: 'Pending',

    // user_profile_pic: null,
    // adhar_card_pic: null,

    // old_user_profile_pic: '',
    // old_adhar_card_pic: '',
  })

  const [roomBookings, setRoomBookings] = useState([
    {
      room_id: '',
      floor_id: '',

      guest_name: '',
      guest_phone: '',
      guest_email: '',

      check_in_date: '',
      check_out_date: '',

      price_per_day: '',

      payment_status: 'Pending',
      status: 'Booked',

      user_profile_pic: null,
      adhar_card_pic: null,
      pan_card_pic: null,
    },
  ])

  const addRoomBooking = () => {
    setRoomBookings([
      ...roomBookings,
      {
        room_id: '',
        floor_id: '',

        guest_name: '',
        guest_phone: '',
        guest_email: '',

        check_in_date: '',
        check_out_date: '',

        price_per_day: '',

        payment_status: 'Pending',
        status: 'Booked',

        user_profile_pic: null,
        adhar_card_pic: null,
        pan_card_pic: null,
      },
    ])
  }

  const removeRoomBooking = (index) => {
    const updated = [...roomBookings]
    updated.splice(index, 1)
    setRoomBookings(updated)
  }

  const handleRoomBookingChange = (index, e) => {
    const { name, value } = e.target

    const updated = [...roomBookings]

    updated[index][name] = value

    setRoomBookings(updated)
  }

  const handleRoomFileChange = (index, field, file) => {
    const updated = [...roomBookings]
    updated[index][field] = file
    setRoomBookings(updated)
  }

  const filteredBookings = bookings.filter((b) => {
    // TOTAL BOOKINGS
    if (filterType === 'all') return true

    if (
      filterType === 'current' &&
      b.active === '0' &&
      b.status?.toLowerCase() === 'booked'
    ) {
      return true
    }

    if (
      filterType === 'reserved' &&
      b.active === '0' &&
      b.status?.toLowerCase() === 'reserved'
    ) {
      return true
    }

    if (
      filterType === 'cancelled' &&
      b.active === '0' &&
      b.status?.toLowerCase() === 'cancelled'
    ) {
      return true
    }

    if (filterType === 'deleted' && b.active === '1') {
      return true
    }

    if (
      filterType === 'checkedout' &&
      b.active === '0' &&
      b.status?.toLowerCase() === 'checkedout'
    ) {
      return true
    }

    return false
  })

  const calculateCounts = (data) => {
    return {
      total_bookings: data.length,

      deleted_bookings: data.filter((b) => b.active === '1').length,

      cancelled_bookings: data.filter(
        (b) =>
          b.active === '0' && b.status?.toLowerCase().trim() === 'cancelled',
      ).length,

      current_bookings: data.filter(
        (b) => b.active === '0' && b.status?.toLowerCase().trim() === 'booked',
      ).length,

      reserved_bookings: data.filter(
        (b) =>
          b.active === '0' && b.status?.toLowerCase().trim() === 'reserved',
      ).length,

      checkedout_bookings: data.filter(
        (b) =>
          b.active === '0' && b.status?.toLowerCase().trim() === 'checkedout',
      ).length,
    }
  }

  const [searchFields, setSearchFields] = useState([
    { field: 'guest_name', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  const branchSearchOptions = [
    { value: 'guest_name', label: 'Guest Name' },
    { value: 'guest_email', label: 'Email' },
    { value: 'status', label: 'Status' },
    { value: 'payment_status', label: 'Payment Status' },
  ]

  const handleView = (b) => {
    setViewData(b)
    setShowView(true)
  }

  const handleCheckout = async (bookingId) => {
    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `http://localhost:5000/api/bookings/checkout/${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      alert('Checkout Successful')

      fetchBookings()
      fetchBookingCounts()
    } catch (err) {
      console.log(err)
    }
  }

  // ================= SEARCH =================
  const handleSearch = async () => {
    try {
      const token = localStorage.getItem('token')

      let params = {}

      searchFields.forEach((item) => {
        if (item.keyword.trim() !== '') {
          params[item.field] = item.keyword
        }
      })

      const res = await axios.get('http://localhost:5000/api/bookings/search', {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = res.data.data || []

      setBookings(data)

      // 🔥 IMPORTANT: update counts from filtered data
      setBookingCounts(calculateCounts(data))
    } catch (err) {
      console.log('Search error:', err.message)
    }
  }

  // ================= RESET SEARCH =================
  const resetSearch = async () => {
    try {
      const token = localStorage.getItem('token')

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

      const res = await axios.get('http://localhost:5000/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = res.data.data || []

      setBookings(data)
      setBookingCounts(calculateCounts(data))
    } catch (err) {
      console.log(err)
    }
  }

  const fetchBookingCounts = async () => {
    try {
      const token = localStorage.getItem('token')

      const res = await axios.get('http://localhost:5000/api/bookings-counts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setBookingCounts(res.data)
    } catch (err) {
      console.log('Count error:', err.message)
    }
  }

  const fetchDeletedBookings = async () => {
    try {
      const token = localStorage.getItem('token')

      const res = await axios.get(
        'http://localhost:5000/api/deleted-bookings',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setDeletedBookings(res.data.data || [])
    } catch (err) {
      console.log('Deleted booking error:', err.message)
    }
  }

  const handleCancel = async (bookingId) => {
    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `http://localhost:5000/api/bookings/cancel/${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      alert('Booking Cancelled')

      fetchBookings()
      fetchBookingCounts()
    } catch (err) {
      console.log(err)
    }
  }

  // ================= LOAD DATA =================
  useEffect(() => {
    fetchHotels()
    fetchBookings()
    fetchBookingCounts()
    fetchDeletedBookings()
  }, [])

  // ================= HOTELS =================
  const fetchHotels = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:5000/api/hotels', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setHotels(res.data.data || [])
    } catch (err) {
      console.log('Hotel error:', err.message)
    }
  }

  // ================= BOOKINGS =================
  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBookings(res.data.data || [])
    } catch (err) {
      console.log('Booking error:', err.message)
    }
  }

  // ================= FLOORS =================
  const fetchFloors = async (hotelId) => {
    try {
      if (!hotelId) return
      const token = localStorage.getItem('token')
      const res = await axios.get(
        `http://localhost:5000/api/floors/${hotelId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setFloors(res.data.data || [])
    } catch (err) {
      console.log('Floor error:', err.response?.data || err.message)
      setFloors([])
    }
  }

  // ================= ROOMS =================
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token')

      const res = await axios.get('http://localhost:5000/api/rooms', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setRooms(res.data.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    if (!formData.floor_id) return

    const controller = new AbortController()

    const loadRooms = async () => {
      try {
        const token = localStorage.getItem('token')

        const res = await axios.get(
          `http://localhost:5000/api/rooms/floor/${formData.floor_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        )

        console.log('ROOM API RESPONSE 👉', res.data) // 👈 ADD THIS

        if (Array.isArray(res.data.data)) {
          console.log('ROOMS ARRAY 👉', res.data.data) // 👈 ADD THIS
          setRooms(res.data.data)
        } else {
          console.log('ROOMS EMPTY OR INVALID')
          setRooms([])
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.log('Room error:', err.message)
        }
      }
    }

    loadRooms()

    return () => controller.abort()
  }, [formData.floor_id])

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'hotel_id') {
      const id = Number(value)
      setFormData((prev) => ({
        ...prev,
        hotel_id: !isNaN(id) && value !== '' ? id : '',
        floor_id: '',
        room_id: '',
      }))
      setFloors([])
      setRooms([])

      if (!isNaN(id) && value !== '') {
        fetchFloors(id)
      }
      return
    }

    if (name === 'floor_id') {
      const id = value ? Number(value) : ''

      setFormData((prev) => ({
        ...prev,
        floor_id: id,
        room_id: '', // only clear when NOT edit
      }))

      if (!isEdit) {
        setRooms([])
      }

      return
    }

    if (name === 'room_id') {
      const id = Number(value)
      setFormData((prev) => ({
        ...prev,
        room_id: !isNaN(id) && value !== '' ? id : '',
      }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // ================= FILE =================
  const handleFile = (e) => {
    const { name, files } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: files[0],
    }))
  }

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')

      const form = new FormData()

      form.append('hotel_id', formData.hotel_id)
      form.append('floor_id', formData.floor_id)
      form.append('room_id', formData.room_id)

      const bookingData = roomBookings.map((room) => ({
        room_id: room.room_id,
        floor_id: room.floor_id,

        guest_name: room.guest_name,
        guest_phone: room.guest_phone,
        guest_email: room.guest_email,

        check_in_date: room.check_in_date,
        check_out_date: room.check_out_date,

        price_per_day: room.price_per_day,

        payment_status: room.payment_status,
        status: room.status,
      }))

      form.append('roomBookings', JSON.stringify(bookingData))

      roomBookings.forEach((room) => {
        if (room.user_profile_pic) {
          form.append('user_profile_pic', room.user_profile_pic)
        }

        if (room.adhar_card_pic) {
          form.append('adhar_card_pic', room.adhar_card_pic)
        }

        if (room.pan_card_pic) {
          form.append('pan_card_pic', room.pan_card_pic)
        }
      })

      // form.append('guest_name', formData.guest_name)
      // form.append('guest_phone', formData.guest_phone)
      // form.append('guest_email', formData.guest_email)

      // form.append('check_in_date', formData.check_in_date)
      // form.append('check_out_date', formData.check_out_date)

      // form.append('price_per_day', formData.price_per_day)

      // form.append('status', formData.status)
      // form.append('payment_status', formData.payment_status)

      // if (formData.user_profile_pic) {
      //   form.append('user_profile_pic', formData.user_profile_pic)
      // }

      // if (formData.adhar_card_pic) {
      //   form.append('adhar_card_pic', formData.adhar_card_pic)
      // }

      for (let pair of form.entries()) {
        console.log(pair[0], pair[1])
      }

      if (isEdit) {
        await axios.put(
          `http://localhost:5000/api/bookings/${formData.booking_id}`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          },
        )

        toast.success('Booking Updated Successfully')
      } else {
        await axios.post('http://localhost:5000/api/bookings', form, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        })

        toast.success('Booking Created Successfully')
      }

      resetForm()
      setShowForm(false)

      fetchBookings()
      fetchBookingCounts()
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Booking Save Failed')
    }
  }

  // ================= EDIT =================
  const handleEdit = async (b) => {
    setIsEdit(true)
    setShowForm(true)

    if (b.hotel_id) {
      await fetchFloors(b.hotel_id)
    }

    if (b.floor_id) {
      const res = await axios.get(
        `http://localhost:5000/api/rooms/floor/${b.floor_id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      )

      setRooms(res.data.data || [])
    }

    // Main form data
    setFormData({
      booking_id: b.booking_id,
      hotel_id: b.hotel_id || '',
      floor_id: b.floor_id || '',
      room_id: b.room_id || '',
      guest_name: b.guest_name || '',
      guest_phone: b.guest_phone || '',
      guest_email: b.guest_email || '',
      check_in_date: b.check_in_date?.split('T')[0] || '',
      check_out_date: b.check_out_date?.split('T')[0] || '',
      price_per_day: b.price_per_day || '',
      status: b.status || 'Booked',
      payment_status: b.payment_status || 'Pending',
      user_profile_pic: null,
      adhar_card_pic: null,
      old_user_profile_pic: b.user_profile_pic || '',
      old_adhar_card_pic: b.adhar_card_pic || '',
    })

    // IMPORTANT
    setRoomBookings([
      {
        room_id: b.room_id || '',
        floor_id: b.floor_id || '',

        guest_name: b.guest_name || '',
        guest_phone: b.guest_phone || '',
        guest_email: b.guest_email || '',

        check_in_date: b.check_in_date?.split('T')[0] || '',
        check_out_date: b.check_out_date?.split('T')[0] || '',

        price_per_day: b.price_per_day || '',

        payment_status: b.payment_status || 'Pending',
        status: b.status || 'Booked',

        user_profile_pic: null,
        adhar_card_pic: null,
      },
    ])
  }

  const isAboutToCheckout = (checkOutDate, status) => {
    if (!checkOutDate) return false

    const s = status?.toLowerCase()
    if (s === 'cancelled' || s === 'checkedout') return false

    const today = new Date()
    const checkout = new Date(checkOutDate)

    const diffDays = (checkout - today) / (1000 * 60 * 60 * 24)

    return diffDays <= 1 && diffDays >= 0
  }

  useEffect(() => {
    const soonToCheckout = bookings.filter(
      (b) =>
        (b.status?.toLowerCase() === 'booked' ||
          b.status?.toLowerCase() === 'reserved') &&
        isAboutToCheckout(b.check_out_date),
    )

    if (soonToCheckout.length > 0) {
      toast.warning(
        `${soonToCheckout.length} booking(s) checkout in next 24 hours`,
      )
    }
  }, [bookings])

  useEffect(() => {
    const soonToCheckout = bookings.filter((b) =>
      isAboutToCheckout(b.check_out_date, b.status),
    )

    if (soonToCheckout.length > 0) {
      toast.warning(
        `${soonToCheckout.length} booking(s) checkout in next 24 hours`,
      )
    }
  }, [bookings])

  const getCheckoutStatus = (checkOutDate, status) => {
    if (!checkOutDate) return null

    const s = status?.toLowerCase()

    // ❌ Cancelled / checkedout ko ignore karo
    if (s === 'cancelled' || s === 'checkedout') return null

    const today = new Date()
    const checkout = new Date(checkOutDate)

    const diffTime = checkout - today
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    // OVERDUE (sirf active bookings)
    if (checkout < today) {
      return 'overdue'
    }

    // SOON (next 24 hours)
    if (diffDays <= 1 && diffDays >= 0) {
      return 'soon'
    }

    return null
  }
  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:5000/api/bookings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        fetchBookings()
      } catch (err) {
        console.log('Delete error:', err.message)
      }
    }
  }

  // ================= RESET =================
  const resetForm = () => {
    setFormData({
      booking_id: null,
      hotel_id: '',
      floor_id: '',
      room_id: '',
      guest_name: '',
      guest_phone: '',
      guest_email: '',
      check_in_date: '',
      check_out_date: '',
      price_per_day: '',
      status: 'Booked',
      payment_status: 'Pending',
      user_profile_pic: null,
      adhar_card_pic: null,
      old_user_profile_pic: '',
      old_adhar_card_pic: '',
    })

    setRoomBookings([
      {
        room_id: '',
        floor_id: '',
        guest_name: '',
        guest_phone: '',
        guest_email: '',
        check_in_date: '',
        check_out_date: '',
        price_per_day: '',
        payment_status: 'Pending',
        status: 'Booked',
        user_profile_pic: null,
        adhar_card_pic: null,
      },
    ])

    setFloors([])
    setRooms([])
    setIsEdit(false)
  }

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

  // ================= UI RENDERING =================
  return (
    <div className="container-fluid p-4">
      <ToastContainer position="top-right" />
      {showForm ? (
        /* ================= 1. FORM VIEW (Full Screen) ================= */
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>{isEdit ? 'Update Booking Details' : 'Add New Booking'}</h3>
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
            >
              <FaArrowLeft className="me-2" /> Back to List
            </Button>
          </div>

          <Card className="p-4 shadow-sm">
            <Form onSubmit={handleSubmit}>
              <Row className="g-3">
                {/* HOTEL */}
                <Col md={4}>
                  <Form.Label>Hotel</Form.Label>
                  <Form.Select
                    name="hotel_id"
                    value={formData.hotel_id || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Hotel</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.hotel_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                {/* FLOOR */}
                {/* <Col md={4}>
                  <Form.Label>Floor</Form.Label>
                  <Form.Select
                    name="floor_id"
                    value={formData.floor_id || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Floor</option>
                    {floors.map((f) => (
                      <option key={f.floor_id} value={f.floor_id}>
                        {f.floor_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col> */}

                {/* ROOM */}
                {/* <Col md={4}>
                  <Form.Label>Room</Form.Label>
                  <Form.Select
                    name="room_id"
                    value={formData.room_id || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Room</option>
                    {rooms.map((r) => (
                      <option
                        key={r.room_id}
                        value={r.room_id}
                        disabled={r.status === 'Occupied'}
                      >
                        {r.room_no} ({r.status})
                      </option>
                    ))}
                  </Form.Select>
                </Col> */}
                <Col md={4}>
                  <Button
                    variant="success"
                    type="button"
                    style={{
                      position: 'relative',
                      left: '30%',
                    }}
                    onClick={addRoomBooking}
                  >
                    + Add Another Room
                  </Button>
                </Col>
                <hr />

                <h5>Room Bookings</h5>

                {roomBookings.map((room, index) => (
                  <Card className="p-3 mb-3" key={index}>
                    <Row>
                      {/* FLOOR */}
                      <Col md={3}>
                        <Form.Label>Floor</Form.Label>
                        <Form.Select
                          name="floor_id"
                          value={formData.floor_id || ''}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Floor</option>
                          {floors.map((f) => (
                            <option key={f.floor_id} value={f.floor_id}>
                              {f.floor_name}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>

                      <Col md={3}>
                        <Form.Label>Room</Form.Label>

                        <Form.Select
                          name="room_id"
                          value={room.room_id}
                          onChange={(e) => handleRoomBookingChange(index, e)}
                          required
                        >
                          <option value="">Select Room</option>

                          {rooms.map((r) => (
                            <option
                              key={r.room_id}
                              value={r.room_id}
                              disabled={
                                r.status === 'Occupied' &&
                                Number(r.room_id) !== Number(room.room_id)
                              }
                            >
                              {r.room_no} ({r.status})
                            </option>
                          ))}
                        </Form.Select>
                      </Col>

                      <Col md={3}>
                        <Form.Label>Guest Name</Form.Label>

                        <Form.Control
                          name="guest_name"
                          value={room.guest_name}
                          onChange={(e) => handleRoomBookingChange(index, e)}
                        />
                      </Col>

                      <Col md={3}>
                        <Form.Label>Phone</Form.Label>

                        <Form.Control
                          name="guest_phone"
                          value={room.guest_phone}
                          onChange={(e) => handleRoomBookingChange(index, e)}
                        />
                      </Col>

                      <Col md={3}>
                        <Form.Label>Email</Form.Label>

                        <Form.Control
                          name="guest_email"
                          value={room.guest_email}
                          onChange={(e) => handleRoomBookingChange(index, e)}
                        />
                      </Col>

                      <Col md={3}>
                        <Form.Label>Check In Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="check_in_date"
                          value={room.check_in_date}
                          onChange={(e) => handleRoomBookingChange(index, e)}
                        />
                      </Col>

                      <Col md={3}>
                        <Form.Label>Check Out Date</Form.Label>

                        <Form.Control
                          type="date"
                          name="check_out_date"
                          value={room.check_out_date}
                          onChange={(e) => handleRoomBookingChange(index, e)}
                        />
                      </Col>

                      <Col md={3}>
                        <Form.Label>Price Per Day</Form.Label>
                        <Form.Control
                          name="price_per_day"
                          value={room.price_per_day}
                          onChange={(e) => handleRoomBookingChange(index, e)}
                        />
                      </Col>

                      <Col md={3}>
                        <Form.Label>Payment Status</Form.Label>
                        <Form.Select
                          name="payment_status"
                          value={room.payment_status}
                          onChange={(e) => handleRoomBookingChange(index, e)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Paid">Partial</option>
                        </Form.Select>
                      </Col>

                      <Col md={3}>
                        <Form.Label>Status</Form.Label>

                        <Form.Select
                          name="status"
                          value={room.status}
                          onChange={(e) => handleRoomBookingChange(index, e)}
                        >
                          <option value="Reserved">Reserved</option>
                          <option value="Booked">Booked</option>
                        </Form.Select>
                      </Col>

                      <Col md={3}>
                        <Form.Label>Aadhar Card</Form.Label>

                        <Form.Control
                          type="file"
                          onChange={(e) =>
                            handleRoomFileChange(
                              index,
                              'adhar_card_pic',
                              e.target.files[0],
                            )
                          }
                        />
                      </Col>

                      <Col md={3}>
                        <Form.Label>Profile Picture</Form.Label>

                        <Form.Control
                          type="file"
                          onChange={(e) =>
                            handleRoomFileChange(
                              index,
                              'user_profile_pic',
                              e.target.files[0],
                            )
                          }
                        />
                      </Col>

                      <Col md={3}>
                        <Form.Label>PAN Card</Form.Label>

                        <Form.Control
                          type="file"
                          onChange={(e) =>
                            handleRoomFileChange(
                              index,
                              'pan_card_pic',
                              e.target.files[0],
                            )
                          }
                        />
                      </Col>
                    </Row>

                    <div className="mt-2">
                      {roomBookings.length > 1 && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeRoomBooking(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}

                {/* GUEST NAME */}
                {/* <Col md={4}>
                  <Form.Label>Guest Name</Form.Label>
                  <Form.Control
                    placeholder="Guest Name"
                    name="guest_name"
                    value={formData.guest_name}
                    onChange={handleChange}
                    required
                  />
                </Col> */}

                {/* PHONE */}
                {/* <Col md={4}>
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    placeholder="Phone"
                    name="guest_phone"
                    value={formData.guest_phone}
                    onChange={handleChange}
                    required
                  />
                </Col> */}

                {/* EMAIL */}
                {/* <Col md={4}>
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Guest Email"
                    name="guest_email"
                    value={formData.guest_email}
                    onChange={handleChange}
                  />
                </Col> */}

                {/* CHECK IN */}
                {/* <Col md={4}>
                  <Form.Label>Check-In Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="check_in_date"
                    value={formData.check_in_date}
                    onChange={handleChange}
                    required
                  />
                </Col> */}

                {/* CHECK OUT */}
                {/* <Col md={4}>
                  <Form.Label>Check-Out Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="check_out_date"
                    value={formData.check_out_date}
                    onChange={handleChange}
                    required
                  />
                </Col> */}

                {/* PRICE */}
                {/* <Col md={4}>
                  <Form.Label>Price Per Day</Form.Label>
                  <Form.Control
                    placeholder="Price"
                    name="price_per_day"
                    value={formData.price_per_day}
                    onChange={handleChange}
                    required
                  />
                </Col> */}

                {/* PAYMENT STATUS */}
                {/* <Col md={4}>
                  <Form.Label>Payment Status</Form.Label>
                  <Form.Select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleChange}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                  </Form.Select>
                </Col> */}

                {/* BOOKING STATUS */}
                {/* <Col md={4}>
                  <Form.Label>Room Status</Form.Label>

                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Reserved">Reserved</option>
                    <option value="Booked">Booked</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="CheckedOut">CheckedOut</option>
                  </Form.Select>
                </Col> */}

                {/* PROFILE PIC */}
                {/* <Col md={4}>
                  <Form.Label>Profile Picture</Form.Label>
                  <Form.Control
                    type="file"
                    name="user_profile_pic"
                    onChange={handleFile}
                  />
                  {formData.old_user_profile_pic && (
                    <img
                      src={`http://localhost:5000/uploads/${formData.old_user_profile_pic}`}
                      alt="Profile"
                      width="80"
                      className="mt-2 border rounded"
                    />
                  )}
                </Col> */}

                {/* AADHAR PIC */}
                {/* <Col md={4}>
                  <Form.Label>Aadhar Card Picture</Form.Label>
                  <Form.Control
                    type="file"
                    name="adhar_card_pic"
                    onChange={handleFile}
                  />
                  {formData.old_adhar_card_pic && (
                    <img
                      src={`http://localhost:5000/uploads/${formData.old_adhar_card_pic}`}
                      alt="Aadhar"
                      width="80"
                      className="mt-2 border rounded"
                    />
                  )}
                </Col> */}
              </Row>

              <div className="mt-4 d-flex gap-2">
                <Button type="submit" variant="success">
                  {isEdit ? 'Update Booking' : 'Save & Create Booking'}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      ) : (
        /* ================= 2. TABLE LIST VIEW (Full Screen) ================= */
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Booking Management</h2>
            <div
              style={{
                position: 'relative',
                left: '16%',
              }}
            >
              <button
                className="search-btn btn-success p-2 me-2" // Changed class name
                onClick={() => setShowSearch(!showSearch)}
                style={{
                  borderRadius: '10%',
                }}
              >
                <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
              </button>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                resetForm()
                setShowForm(true) // Click karte hi Table gayab aur sirf Form dikhega
              }}
            >
              <FaPlus className="me-2" /> Create New Booking
            </Button>
          </div>

          {showSearch && (
            <SearchPanel
              searchFields={searchFields}
              setSearchFields={setSearchFields}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              onSearch={handleSearch}
              onReset={resetSearch}
              onDownloadExcel={handleDownloadExcel}
              searchOptions={branchSearchOptions}
            />
          )}

          <Row>
            <div className="mb-4">
              <Tabs
                id="booking-filter-tabs"
                activeKey={filterType} // Aapka existing state variable (e.g., 'all', 'current', etc.)
                onSelect={(k) => setFilterType(k)} // Tab click hone par filterType state update hogi
                className="mb-3 d-flex gap-2" // Tabs ke beech me spacing ke liye custom gap
              >
                {/* TOTAL BOOKINGS */}
                <Tab
                  eventKey="all"
                  title={
                    <div className="text-center">
                      <small
                        className="d-block text-uppercase fw-semibold"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Total Bookings
                      </small>
                      <strong className="fs-4 d-block mt-1">
                        {bookingCounts.total_bookings}
                      </strong>
                    </div>
                  }
                />

                {/* CURRENT BOOKINGS */}
                <Tab
                  eventKey="current"
                  title={
                    <div className="text-center ">
                      <small
                        className=" d-block text-uppercase fw-semibold"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Current Bookings
                      </small>
                      <strong className="fs-4 d-block mt-1">
                        {bookingCounts.current_bookings}
                      </strong>
                    </div>
                  }
                />

                {/* CANCELLED BOOKINGS */}
                <Tab
                  eventKey="cancelled"
                  title={
                    <div className="text-center">
                      <small
                        className=" d-block text-uppercase fw-semibold"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Cancelled Bookings
                      </small>
                      <strong className="fs-4 d-block mt-1 ">
                        {bookingCounts.cancelled_bookings}
                      </strong>
                    </div>
                  }
                />

                {/* DELETED BOOKINGS */}
                {/* <Tab
                  eventKey="deleted"
                  title={
                    <div className="text-center px-2">
                      <small
                        className="d-block text-uppercase fw-semibold"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Deleted Bookings
                      </small>
                      <strong className="fs-4 d-block mt-1">
                        {bookingCounts.deleted_bookings}
                      </strong>
                    </div> 
                  }
                />*/}

                <Tab
                  eventKey="reserved"
                  title={
                    <div className="text-center">
                      <small
                        className="d-block text-uppercase fw-semibold"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Reserved Bookings
                      </small>

                      <strong className="fs-4 d-block mt-1">
                        {bookingCounts.reserved_bookings}
                      </strong>
                    </div>
                  }
                />

                <Tab
                  eventKey="checkedout"
                  title={
                    <div className="text-center">
                      <small
                        className="d-block text-uppercase fw-semibold"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Vacant Bookings
                      </small>

                      <strong className="fs-4 d-block mt-1">
                        {bookingCounts.checkedout_bookings}
                      </strong>
                    </div>
                  }
                />
              </Tabs>
            </div>
          </Row>

          <Card className="shadow-sm">
            <h4 className="">Bookings List</h4>
            <Table bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th>Room No</th>
                  <th>Guest</th>
                  <th>Email</th>
                  <th>Profile</th>
                  {/* <th>Adhar</th> */}

                  <th>Room Type</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => (
                    <tr key={b.booking_id}>
                      <td>{b.room_no || 'N/A'}</td>
                      <td>{b.guest_name}</td>
                      <td>{b.guest_email || 'N/A'}</td>
                      <td>
                        {b.user_profile_pic && (
                          <img
                            src={`http://localhost:5000/uploads/${b.user_profile_pic}`}
                            alt=""
                            width="50"
                            height="50"
                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                          />
                        )}
                      </td>
                      {/* <td>
                        {b.adhar_card_pic && (
                          <img
                            src={`http://localhost:5000/uploads/${b.adhar_card_pic}`}
                            alt=""
                            width="50"
                            height="50"
                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                          />
                        )}
                      </td> */}
                      <td>{b.room_no || 'N/A'}</td>
                      <td> {b.check_in_date?.split('T')[0]}</td>
                      <td>
                        {b.check_out_date?.split('T')[0]}

                        {getCheckoutStatus(b.check_out_date, b.status) ===
                          'overdue' && (
                          <span className="badge bg-danger ms-2">Overdue</span>
                        )}

                        {getCheckoutStatus(b.check_out_date, b.status) ===
                          'soon' && (
                          <span className="badge bg-warning ms-2">Soon</span>
                        )}
                      </td>{' '}
                      <td>
                        <span
                          className={`badge ${b.status === 'Cancelled' ? 'bg-danger' : 'bg-success'}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${b.payment_status === 'Paid' ? 'bg-success' : 'bg-warning text-dark'}`}
                        >
                          {b.payment_status}
                        </span>
                      </td>
                      {/* <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(b)}
                        >
                          <FaPen />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(b.booking_id)}
                        >
                          <FaTrashAlt />
                        </Button>
                      </td> */}
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle variant="secondary" size="sm">
                            Action
                          </Dropdown.Toggle>

                          <Dropdown.Menu>
                            {/* VIEW */}
                            <Dropdown.Item onClick={() => handleView(b)}>
                              View
                            </Dropdown.Item>

                            {/* EDIT */}
                            <Dropdown.Item onClick={() => handleEdit(b)}>
                              Edit
                            </Dropdown.Item>

                            <Dropdown.Item
                              disabled={
                                b.status?.toLowerCase() === 'checkedout' ||
                                b.status?.toLowerCase() === 'cancelled'
                              }
                              onClick={() => handleCheckout(b.booking_id)}
                            >
                              Checkout
                            </Dropdown.Item>

                            <Dropdown.Item
                              disabled={
                                b.status?.toLowerCase() === 'cancelled' ||
                                b.status?.toLowerCase() === 'checkedout'
                              }
                              onClick={() => handleCancel(b.booking_id)}
                            >
                              Cancel Booking
                            </Dropdown.Item>

                            {/* DELETE */}
                            <Dropdown.Item
                              // className="text-danger"
                              onClick={() => handleDelete(b.booking_id)}
                            >
                              Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-3">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </div>
      )}
      <Modal show={showView} onHide={() => setShowView(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Booking Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {viewData && (
            <div>
              <p>
                <b>Guest Name:</b> {viewData.guest_name}
              </p>
              <p>
                <b>Email:</b> {viewData.guest_email}
              </p>
              <p>
                <b>Phone:</b> {viewData.guest_phone}
              </p>
              <p>
                <b>Hotel Name:</b> {viewData.hotel_name}
              </p>

              <p>
                <b>Floor Name:</b> {viewData.floor_name}
              </p>
              <p>
                <b>Room No:</b> {viewData.room_no}
              </p>
              <p>
                <b>Room Type:</b> {viewData.room_type}
              </p>
              <p>
                <b>Status:</b> {viewData.status}
              </p>
              <p>
                <b>Payment:</b> {viewData.payment_status}
              </p>

              <p>
                <b>Check in date:</b>
                {viewData.check_in_date?.split('T')[0]}
              </p>
              <p>
                <b>Check out date:</b>
                {viewData.check_out_date?.split('T')[0]}
              </p>
              <p>
                <b>Total Days:</b>{' '}
                {Math.max(
                  1,
                  Math.ceil(
                    (new Date(viewData.check_out_date) -
                      new Date(viewData.check_in_date)) /
                      (1000 * 60 * 60 * 24),
                  ),
                )}
              </p>

              <p>
                <b>Price Per Night:</b> ₹{viewData.price_per_day}
              </p>

              <p>
                <b>Total Amount:</b> ₹{viewData.total_amount}
              </p>

              {viewData.user_profile_pic && (
                <img
                  src={`http://localhost:5000/uploads/${viewData.user_profile_pic}`}
                  width="120"
                />
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowView(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default BookingMaster
///correct code booking mater
