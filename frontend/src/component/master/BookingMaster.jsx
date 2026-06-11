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
  Container,
} from 'react-bootstrap'
import {
  FaPen,
  FaTrashAlt,
  FaPlus,
  FaArrowLeft,
  FaSearch,
  FaCreativeCommonsRemix,
  FaEye,
} from 'react-icons/fa'
import SearchPanel from '../../utils/filterPanel'
import Pagination from '../../utils/Pagination'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { BsThreeDotsVertical } from 'react-icons/bs'
import './Company.css'

const BookingMaster = () => {
  const [hotels, setHotels] = useState([])
  const [floors, setFloors] = useState([])
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])

  const [isEdit, setIsEdit] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showForm, setShowForm] = useState(false) // New State for single screen toggle
  const latestFloorRef = useRef(null)
  const [bookingCounts, setBookingCounts] = useState({
    total_bookings: 0,
    deleted_bookings: 0,
    cancelled_bookings: 0,
    current_bookings: 0,
    reserved_bookings: 0,
    checkedout_bookings: 0,
    about_to_checkout_bookings: 0,
    checkout_overdue_bookings: 0,
  })
  const [filterHotelId, setFilterHotelId] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [deletedBookings, setDeletedBookings] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [showView, setShowView] = useState(false)
  const [viewData, setViewData] = useState(null)
  const [availableRoomsCount, setAvailableRoomsCount] = useState(0)
  const [availableRooms, setAvailableRooms] = useState([])
  // const [deletedBookings, setDeletedBookings] = useState([])

  const [formData, setFormData] = useState({
    booking_id: null,
    hotel_id: '',
    guest_email: '',
    check_in_date: '',
    check_out_date: '',
    price_per_day: '',
    status: 'Booked',
    payment_status: 'Pending',

    user_profile_pic: null,
    adhar_card_pic: null,
    pan_card_pic: null,
    otherGuests: [],

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
      otherGuests: [],
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
        otherGuests: [],
      },
    ])
  }

  const removeRoomBooking = (index) => {
    const updated = [...roomBookings]
    updated.splice(index, 1)
    setRoomBookings(updated)
  }

  const addRoomGuest = (roomIndex) => {
    const updated = [...roomBookings]
    if (!updated[roomIndex].otherGuests) updated[roomIndex].otherGuests = []
    updated[roomIndex].otherGuests.push({
      guest_name: '',
      guest_phone: '',
      guest_email: '',
      profile_pic: null,
      adhar_card_pic: null,
      pan_card_pic: null,
    })
    setRoomBookings(updated)
  }

  const removeRoomGuest = (roomIndex, guestIndex) => {
    const updated = [...roomBookings]
    updated[roomIndex].otherGuests.splice(guestIndex, 1)
    setRoomBookings(updated)
  }

  const handleRoomGuestChange = (roomIndex, guestIndex, field, value) => {
    const updated = [...roomBookings]
    updated[roomIndex].otherGuests[guestIndex][field] = value
    setRoomBookings(updated)
  }

  const handleRoomGuestFileChange = (roomIndex, guestIndex, field, file) => {
    const updated = [...roomBookings]
    updated[roomIndex].otherGuests[guestIndex][field] = file
    setRoomBookings(updated)
  }

  useEffect(() => {
    const available = rooms.filter((r) => {
      const status = r.status?.toLowerCase()?.trim()

      return (
        status === 'vacant' || status === 'available' || status === 'checkedout'
      )
    })

    setAvailableRoomsCount(available.length)
    setAvailableRooms(available)

    console.log('Rooms =>', rooms)
    console.log('Available Count =>', available.length)
  }, [rooms])

  const handleRoomBookingChange = (index, e) => {
    const { name, value } = e.target

    const updated = [...roomBookings]

    updated[index][name] = value

    if (name === 'room_id') {
      const selectedRoom = rooms.find(
        (r) => Number(r.room_id) === Number(value),
      )
      if (selectedRoom) {
        updated[index]['price_per_day'] = selectedRoom.price || ''
      } else {
        updated[index]['price_per_day'] = ''
      }
    }

    setRoomBookings(updated)
  }

  const handleRoomFileChange = (index, field, file) => {
    const updated = [...roomBookings]
    updated[index][field] = file
    setRoomBookings(updated)
  }

  const isAboutToCheckout = (checkOutDate, status) => {
    if (!checkOutDate) return false

    const s = status?.toLowerCase()
    if (s === 'cancelled' || s === 'checkedout') return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkout = new Date(checkOutDate)
    checkout.setHours(0, 0, 0, 0)

    const diffDays = (checkout - today) / (1000 * 60 * 60 * 24)

    return diffDays <= 1 && diffDays >= 0
  }

  const getOverdueDays = (checkOutDate) => {
    if (!checkOutDate) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkout = new Date(checkOutDate)
    checkout.setHours(0, 0, 0, 0)

    const diffDays = Math.round((today - checkout) / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const getCheckoutStatus = (checkOutDate, status) => {
    if (!checkOutDate) return null

    const s = status?.toLowerCase()

    if (s === 'cancelled' || s === 'checkedout') return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkout = new Date(checkOutDate)
    checkout.setHours(0, 0, 0, 0)

    const diffDays = (checkout - today) / (1000 * 60 * 60 * 24)

    if (diffDays < 0) {
      return 'overdue'
    }

    if (diffDays <= 1 && diffDays >= 0) {
      return 'soon'
    }

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

  const filteredBookings = bookings.filter((b) => {
    // HOTEL FILTER
    if (filterHotelId && String(b.hotel_id) !== String(filterHotelId)) {
      return false
    }

    // TOTAL BOOKINGS
    if (filterType === 'all') return true

    if (filterType === 'current' && isTodayCheckIn(b.check_in_date)) {
      return true
    }

    if (filterType === 'reserved' && b.status?.toLowerCase() === 'reserved') {
      return true
    }

    if (filterType === 'cancelled' && b.status?.toLowerCase() === 'cancelled') {
      return true
    }

    if (filterType === 'deleted' && b.active === '1') {
      return true
    }

    if (
      filterType === 'checkedout' &&
      b.status?.toLowerCase() === 'checkedout'
    ) {
      return true
    }

    if (filterType === 'about_to_checkout') {
      return isAboutToCheckout(b.check_out_date, b.status)
    }

    if (filterType === 'checkout_overdue') {
      return getCheckoutStatus(b.check_out_date, b.status) === 'overdue'
    }

    return false
  })

  const calculateCounts = (activeData, deletedData) => {
    return {
      total_bookings: activeData.length + deletedData.length,

      deleted_bookings: deletedData.length,

      cancelled_bookings: activeData.filter(
        (b) => b.status?.toLowerCase().trim() === 'cancelled',
      ).length,

      current_bookings: activeData.filter((b) =>
        isTodayCheckIn(b.check_in_date),
      ).length,

      reserved_bookings: activeData.filter(
        (b) => b.status?.toLowerCase().trim() === 'reserved',
      ).length,

      checkedout_bookings: activeData.filter(
        (b) => b.status?.toLowerCase().trim() === 'checkedout',
      ).length,

      about_to_checkout_bookings: activeData.filter((b) =>
        isAboutToCheckout(b.check_out_date, b.status),
      ).length,

      checkout_overdue_bookings: activeData.filter(
        (b) => getCheckoutStatus(b.check_out_date, b.status) === 'overdue',
      ).length,
    }
  }

  useEffect(() => {
    let activeData = bookings
    let deletedData = deletedBookings

    if (filterHotelId) {
      activeData = bookings.filter(
        (b) => String(b.hotel_id) === String(filterHotelId),
      )
      deletedData = deletedBookings.filter(
        (b) => String(b.hotel_id) === String(filterHotelId),
      )
    }

    setBookingCounts(calculateCounts(activeData, deletedData))
  }, [bookings, deletedBookings, filterHotelId])

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

  // const fetchDeletedBookings = async () => {
  //   try {
  //     const token = localStorage.getItem('token')
  //     const res = await axios.get(
  //       'http://localhost:5000/api/deleted-bookings',
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       },
  //     )
  //     setDeletedBookings(res.data.data || [])
  //   } catch (err) {
  //     console.log('Deleted booking error:', err.message)
  //   }
  // }

  const handleRestore = async (bookingId) => {
    if (window.confirm('Are you sure you want to restore this booking?')) {
      try {
        const token = localStorage.getItem('token')
        await axios.put(
          `http://localhost:5000/api/bookings/restore/${bookingId}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        toast.success('Booking restored successfully')
        fetchBookings() // Refresh active bookings
        fetchDeletedBookings() // Refresh deleted bookings
      } catch (err) {
        toast.error(err.response?.data?.message || 'Restore failed')
        console.log('Restore error:', err.message)
      }
    }
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
      setCurrentPage(1)
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
      setCurrentPage(1)
    } catch (err) {
      console.log(err)
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
    } catch (err) {
      console.log(err)
    }
  }

  // ================= LOAD DATA =================
  useEffect(() => {
    fetchHotels()
    fetchBookings()
    fetchDeletedBookings()
    fetchRooms()
  }, [])

  // ================= HOTELS =================
  const fetchHotels = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:5000/api/hotels', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const allHotels = res.data.data || []
      const activeHotels = allHotels.filter((h) => h.active === '0')
      setHotels(activeHotels)
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

      console.log('ROOMS DATA =>', res.data.data)

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
          pan_card_pic: null,
        },
      ])

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

      setRooms([])
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
          pan_card_pic: null,
        },
      ])

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

        otherGuests: room.otherGuests
          ? room.otherGuests.map((g) => ({
              guest_name: g.guest_name,
              guest_phone: g.guest_phone,
              guest_email: g.guest_email,
              old_user_profile_pic: g.old_profile_pic || '',
              old_adhar_card_pic: g.old_adhar_card_pic || '',
              old_pan_card_pic: g.old_pan_card_pic || '',
            }))
          : [],
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

        if (room.otherGuests) {
          room.otherGuests.forEach((g) => {
            if (g.profile_pic) {
              form.append('guest_user_profile_pic', g.profile_pic)
            }
            if (g.adhar_card_pic) {
              form.append('guest_adhar_card_pic', g.adhar_card_pic)
            }
            if (g.pan_card_pic) {
              form.append('guest_pan_card_pic', g.pan_card_pic)
            }
          })
        }
      })

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
      pan_card_pic: null,

      old_user_profile_pic: b.user_profile_pic || '',
      old_adhar_card_pic: b.adhar_card_pic || '',
      old_pan_card_pic: b.pan_card_pic || '', // ✅ ADD THIS
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
        pan_card_pic: null,

        otherGuests: (b.other_guests || []).map((g) => ({
          guest_name: g.guest_name,
          guest_phone: g.guest_phone,
          guest_email: g.guest_email,
          old_profile_pic: g.profile_pic,
          old_adhar_card_pic: g.adhar_card_pic,
          old_pan_card_pic: g.pan_card_pic,
          profile_pic: null,
          adhar_card_pic: null,
          pan_card_pic: null,
        })),
      },
    ])
  }

  useEffect(() => {
    const soonToCheckout = bookings.filter(
      (b) => b.active === '0' && isAboutToCheckout(b.check_out_date, b.status),
    )

    if (soonToCheckout.length > 0) {
      toast.warning(
        `${soonToCheckout.length} booking(s) checkout in next 24 hours`,
      )
    }
  }, [bookings])
  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:5000/api/bookings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        fetchBookings()
        fetchDeletedBookings()
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
        pan_card_pic: null,
        otherGuests: [],
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
    <Container
      fluid
      className="page-container"
      style={{
        background: 'linear-gradient(135deg, #f6f8fc 0%, #e9edf5 100%)',
        minHeight: '100vh',
        transition: 'background-color 0.5s ease',
      }}
    >
      <ToastContainer position="top-right" />

      {/* UNIFIED HEADER */}
      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-2 border-bottom gap-3">
        <h1 className="page-title mb-0" style={{ fontSize: '25px' }}>
          {showForm
            ? isEdit
              ? 'Update Booking Details'
              : 'Add New Booking'
            : 'Booking Management'}{' '}
          {!showForm && (
            <span className="text-success">({bookings.length})</span>
          )}
        </h1>

        <div className="page-actions d-flex flex-wrap gap-2 align-items-center mt-3 mt-md-0">
          {!showForm && (
            <Form.Select
              value={filterHotelId}
              onChange={(e) => setFilterHotelId(e.target.value)}
              className="shadow-sm rounded-3"
              style={{ minWidth: '150px', width: 'auto' }}
            >
              <option value="">All Hotels</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hotel_name}
                </option>
              ))}
            </Form.Select>
          )}
          {!showForm && (
            <button
              type="button"
              className="search-btn shadow-sm rounded-3"
              onClick={() => setShowSearch(!showSearch)}
              style={{
                padding: '1px 6px',
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
              <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
            </button>
          )}
          <button
            type="button"
            className={`shadow-sm rounded-3 ${showForm ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              if (showForm) {
                setShowForm(false)
                resetForm()
              } else {
                resetForm()
                setShowForm(true)
              }
            }}
            style={{
              padding: '1px 6px',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              transition: 'all 0.2s',
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
        /* ================= 1. FORM VIEW (Full Screen) ================= */
        <Card
          className="dashboard-card shadow-sm border-0 rounded-4 overflow-hidden mb-4"
          style={{ transition: 'all 0.3s ease' }}
        >
          <Card.Body className="p-4">
            <h2
              className="mb-4 fw-bold text-secondary"
              style={{ fontSize: '1.5rem' }}
            >
              {isEdit ? 'Update Booking Details' : 'Add New Booking'}
            </h2>
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
                          <option value="Partial">Partial</option>
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
                        {formData.old_adhar_card_pic && (
                          <img
                            src={`http://localhost:5000/uploads/${formData.old_adhar_card_pic}`}
                            width="80"
                            className="mt-2 border rounded"
                          />
                        )}
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
                        {formData.old_user_profile_pic && (
                          <img
                            src={`http://localhost:5000/uploads/${formData.old_user_profile_pic}`}
                            width="80"
                            className="mt-2 border rounded"
                          />
                        )}
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
                        {formData.old_pan_card_pic && (
                          <img
                            src={`http://localhost:5000/uploads/${formData.old_pan_card_pic}`}
                            width="80"
                            className="mt-2 border rounded"
                          />
                        )}
                      </Col>
                    </Row>

                    <div className="mt-3 border-top pt-3">
                      <h6 className="text-secondary mb-3">
                        Other Guests in this Room (Optional)
                      </h6>
                      {room.otherGuests &&
                        room.otherGuests.map((guest, guestIndex) => (
                          <div
                            key={guestIndex}
                            className="bg-light p-3 rounded mb-3 position-relative border border-info"
                          >
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="position-absolute top-0 end-0 m-2"
                              onClick={() => removeRoomGuest(index, guestIndex)}
                            >
                              Remove Guest
                            </Button>
                            <Row>
                              <Col md={4} className="mb-2">
                                <Form.Label>Guest Name</Form.Label>
                                <Form.Control
                                  size="sm"
                                  placeholder="Name"
                                  value={guest.guest_name}
                                  onChange={(e) =>
                                    handleRoomGuestChange(
                                      index,
                                      guestIndex,
                                      'guest_name',
                                      e.target.value,
                                    )
                                  }
                                />
                              </Col>
                              <Col md={4} className="mb-2">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control
                                  size="sm"
                                  placeholder="Phone"
                                  value={guest.guest_phone}
                                  onChange={(e) =>
                                    handleRoomGuestChange(
                                      index,
                                      guestIndex,
                                      'guest_phone',
                                      e.target.value,
                                    )
                                  }
                                />
                              </Col>
                              <Col md={4} className="mb-2">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                  size="sm"
                                  placeholder="Email"
                                  type="email"
                                  value={guest.guest_email}
                                  onChange={(e) =>
                                    handleRoomGuestChange(
                                      index,
                                      guestIndex,
                                      'guest_email',
                                      e.target.value,
                                    )
                                  }
                                />
                              </Col>
                              <Col md={4} className="mb-2">
                                <Form.Label>Profile Pic (Optional)</Form.Label>
                                <Form.Control
                                  size="sm"
                                  type="file"
                                  onChange={(e) =>
                                    handleRoomGuestFileChange(
                                      index,
                                      guestIndex,
                                      'profile_pic',
                                      e.target.files[0],
                                    )
                                  }
                                />
                                {guest.old_profile_pic && (
                                  <img
                                    src={`http://localhost:5000/uploads/${guest.old_profile_pic}`}
                                    width="50"
                                    className="mt-2 border rounded"
                                    alt="Old guest profile"
                                  />
                                )}
                              </Col>
                              <Col md={4} className="mb-2">
                                <Form.Label>Aadhar Card (Optional)</Form.Label>
                                <Form.Control
                                  size="sm"
                                  type="file"
                                  onChange={(e) =>
                                    handleRoomGuestFileChange(
                                      index,
                                      guestIndex,
                                      'adhar_card_pic',
                                      e.target.files[0],
                                    )
                                  }
                                />
                                {guest.old_adhar_card_pic && (
                                  <img
                                    src={`http://localhost:5000/uploads/${guest.old_adhar_card_pic}`}
                                    width="50"
                                    className="mt-2 border rounded"
                                    alt="Old Aadhar"
                                  />
                                )}
                              </Col>
                              <Col md={4} className="mb-2">
                                <Form.Label>PAN Card (Optional)</Form.Label>
                                <Form.Control
                                  size="sm"
                                  type="file"
                                  onChange={(e) =>
                                    handleRoomGuestFileChange(
                                      index,
                                      guestIndex,
                                      'pan_card_pic',
                                      e.target.files[0],
                                    )
                                  }
                                />
                                {guest.old_pan_card_pic && (
                                  <img
                                    src={`http://localhost:5000/uploads/${guest.old_pan_card_pic}`}
                                    width="50"
                                    className="mt-2 border rounded"
                                    alt="Old PAN"
                                  />
                                )}
                              </Col>
                            </Row>
                          </div>
                        ))}

                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => addRoomGuest(index)}
                      >
                        + Add Another Guest
                      </Button>
                    </div>

                    <div className="mt-3">
                      {roomBookings.length > 1 && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeRoomBooking(index)}
                        >
                          Remove Room
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
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
          </Card.Body>
        </Card>
      ) : (
        /* ================= 2. TABLE LIST VIEW (Full Screen) ================= */
        <Card className="dashboard-card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
          <Card.Body className="p-4">
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

            <style>
              {`
                .compact-booking-table th, .compact-booking-table td {
                  padding: 0.1rem !important;
                }
                .ultra-compact-tabs .nav-link {
                  padding: 0.5rem 0.75rem !important;
                  font-size: 13px !important;
                }
              `}
            </style>
            <Tabs
              id="booking-filter-tabs"
              activeKey={filterType}
              onSelect={(k) => {
                setFilterType(k)
                setCurrentPage(1)
              }}
              className="mb-3 custom-bootstrap-tabs ultra-compact-tabs flex-nowrap"
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {/* TOTAL BOOKINGS */}
              <Tab
                eventKey="all"
                title={`Total (${bookingCounts?.total_bookings || 0})`}
              />

              {/* CURRENT BOOKINGS */}
              <Tab
                eventKey="current"
                title={`Current (${bookingCounts?.current_bookings || 0})`}
              />

              {/* CANCELLED BOOKINGS */}
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

              <Tab
                eventKey="available"
                title={`Available (${availableRoomsCount})`}
              >
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <Table
                    bordered
                    hover
                    size="sm"
                    className="list-table compact-booking-table align-middle mb-0 mt-3 shadow-sm"
                    style={{ fontSize: '12px' }}
                  >
                    <thead className="table-light text-center text-secondary">
                      <tr>
                        <th
                          className="text-center fw-semibold p-1"
                          style={{ width: '10px' }}
                        >
                          Room No
                        </th>
                        <th
                          className="text-center fw-semibold p-1"
                          style={{ width: '120px' }}
                        >
                          Room Type
                        </th>
                        <th className="text-center fw-semibold p-1">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {(filterHotelId
                        ? availableRooms.filter(
                            (r) => String(r.hotel_id) === String(filterHotelId),
                          )
                        : availableRooms
                      ).map((r) => (
                        <tr key={r.room_id}>
                          <td>{r.room_no || 'N/A'}</td>
                          <td>{r.room_type || r.type || 'N/A'}</td>
                          <td>
                            <span className="badge bg-success">Available</span>
                          </td>
                        </tr>
                      ))}
                      {availableRooms.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center py-3">
                            No available seats found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab
                eventKey="deleted"
                title={`Deleted (${bookingCounts?.deleted_bookings || 0})`}
              >
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <Table
                    bordered
                    hover
                    size="sm"
                    className="list-table compact-booking-table align-middle mb-0 mt-3 shadow-sm"
                    style={{ fontSize: '12px' }}
                  >
                    <thead className="table text-center text-secondary">
                      <tr>
                        <th
                          className="text-center fw-semibold p-1"
                          style={{ width: '10px' }}
                        >
                          Room No
                        </th>
                        <th className="fw-semibold p-1">Guest</th>
                        <th
                          className="text-center fw-semibold p-1"
                          style={{ width: '10px' }}
                        >
                          Email
                        </th>
                        <th className="text-center fw-semibold p-1">Profile</th>
                        <th
                          className="text-center fw-semibold p-1"
                          style={{ width: '120px' }}
                        >
                          Room Type
                        </th>
                        <th className="fw-semibold p-1">Check In</th>
                        <th className="fw-semibold p-1">Check Out</th>
                        <th className="fw-semibold p-1">Status</th>
                        <th className="fw-semibold p-1">Payment</th>
                        <th className="text-center fw-semibold p-1">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {(filterHotelId
                        ? deletedBookings.filter(
                            (b) => String(b.hotel_id) === String(filterHotelId),
                          )
                        : deletedBookings
                      ).map((b) => (
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
                                style={{
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                }}
                              />
                            )}
                          </td>
                          <td>{b.room_type || 'N/A'}</td>
                          <td>{b.check_in_date?.split('T')[0]}</td>
                          <td>{b.check_out_date?.split('T')[0]}</td>
                          <td>
                            <span className="badge bg-danger">Deleted</span>
                          </td>
                          <td>{b.payment_status || 'N/A'}</td>
                          <td>
                            <Button
                              variant="success"
                              size="sm"
                              className="px-4 py-1 m-1 rounded-pill shadow-sm fw-medium"
                              style={{ transition: 'all 0.2s' }}
                              onClick={() => handleRestore(b.booking_id)}
                            >
                              Restore
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {deletedBookings.length === 0 && (
                        <tr>
                          <td colSpan="10" className="text-center py-3">
                            No deleted bookings found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Tab>
            </Tabs>

            {filterType !== 'available' && filterType !== 'deleted' && (
              <Card className="branch-card">
                <div className="p-3 mb-0 border-bottom d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">Bookings List</h4>

                  <Card
                    className="mb-3 border-success"
                    style={{ cursor: 'pointer' }}
                  >
                    {/* <Card.Body className="py-2">
                  <h6 className="mb-0 text-success ">
                    Available Rooms: {availableRoomsCount}
                  </h6>
                </Card.Body> */}
                  </Card>

                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">Show:</span>
                    <Form.Select
                      size="sm"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      style={{ width: '80px', display: 'inline-block' }}
                    >
                      <option value={10}>10</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={150}>150</option>
                    </Form.Select>
                  </div>
                </div>
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
                          style={{ width: '10px' }}
                        >
                          Room No
                        </th>
                        <th className="fw-semibold p-1">Guest</th>
                        <th
                          className="text-center fw-semibold p-1"
                          style={{ width: '10px' }}
                        >
                          Email
                        </th>
                        <th className="text-center fw-semibold p-1">Profile</th>
                        <th
                          className="text-center fw-semibold p-1"
                          style={{ width: '120px' }}
                        >
                          Room Type
                        </th>
                        <th className="fw-semibold p-1">Check In</th>
                        <th className="fw-semibold p-1">Check Out</th>
                        <th className="fw-semibold p-1">Status</th>
                        <th className="fw-semibold p-1">Payment</th>
                        <th className="text-center fw-semibold p-1">Action</th>
                      </tr>
                    </thead>

                    <tbody className="text-center">
                      {filteredBookings.length > 0 ? (
                        filteredBookings.slice(0, itemsPerPage).map((b) => (
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
                                  style={{
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                  }}
                                />
                              )}
                            </td>
                            <td>{b.room_type || 'N/A'}</td>
                            <td> {b.check_in_date?.split('T')[0]}</td>
                            <td>
                              {b.check_out_date?.split('T')[0]}

                              {getCheckoutStatus(b.check_out_date, b.status) ===
                                'overdue' && (
                                <div>
                                  <span className="badge bg-danger mt-1 d-inline-block" style={{ fontSize: '10px', padding: '3px 6px' }}>
                                    Overdue ({getOverdueDays(b.check_out_date)}{' '}
                                    days)
                                  </span>
                                </div>
                              )}

                              {getCheckoutStatus(b.check_out_date, b.status) ===
                                'soon' && (
                                <div>
                                  <span className="badge bg-warning mt-1 d-inline-block text-dark" style={{ fontSize: '10px', padding: '3px 6px' }}>
                                    Soon
                                  </span>
                                </div>
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
                                className={`badge ${
                                  b.payment_status === 'Paid'
                                    ? 'bg-success'
                                    : b.payment_status === 'Partial'
                                      ? 'bg-warning text-dark'
                                      : 'bg-danger'
                                }`}
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
                                    <FaEye className="me-2 text-info" />
                                    View
                                  </Dropdown.Item>

                                  {b.status !== 'Cancelled' && (
                                    <>
                                      <Dropdown.Item
                                        onClick={() => handleEdit(b)}
                                      >
                                        <FaPen className="me-2 text-primary" />
                                        Edit
                                      </Dropdown.Item>

                                      {b.status === 'Booked' && (
                                        <Dropdown.Item
                                          className="text-success"
                                          onClick={() =>
                                            handleCheckout(b.booking_id)
                                          }
                                        >
                                          Checkout
                                        </Dropdown.Item>
                                      )}

                                      <Dropdown.Item
                                        className="text-warning"
                                        onClick={() =>
                                          handleCancel(b.booking_id)
                                        }
                                      >
                                        Cancel Booking
                                      </Dropdown.Item>
                                    </>
                                  )}

                                  <Dropdown.Item
                                    className="text-danger"
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
                          <td colSpan="10" className="text-center py-3">
                            No bookings found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>
            )}
          </Card.Body>
        </Card>
      )}
      <Modal show={showView} onHide={() => setShowView(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Booking Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {viewData && (
            <div className="table-responsive">
              <Table bordered hover className="align-middle">
                <tbody>
                  <tr>
                    <th style={{ width: '30%', backgroundColor: '#f8f9fa' }}>
                      Guest Name
                    </th>
                    <td>{viewData.guest_name}</td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Email</th>
                    <td>{viewData.guest_email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Phone</th>
                    <td>{viewData.guest_phone || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Hotel Name</th>
                    <td>{viewData.hotel_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Floor Name</th>
                    <td>{viewData.floor_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Room No</th>
                    <td>{viewData.room_no || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Room Type</th>
                    <td>{viewData.room_type || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Status</th>
                    <td>
                      <span
                        className={`badge ${viewData.status === 'Cancelled' ? 'bg-danger' : 'bg-success'}`}
                      >
                        {viewData.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Payment</th>
                    <td>
                      <span
                        className={`badge ${viewData.payment_status === 'Paid' ? 'bg-success' : 'bg-warning text-dark'}`}
                      >
                        {viewData.payment_status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>
                      Check in date
                    </th>
                    <td>{viewData.check_in_date?.split('T')[0]}</td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>
                      Check out date
                    </th>
                    <td>{viewData.check_out_date?.split('T')[0]}</td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Total Days</th>
                    <td>
                      {Math.max(
                        1,
                        Math.ceil(
                          (new Date(viewData.check_out_date) -
                            new Date(viewData.check_in_date)) /
                            (1000 * 60 * 60 * 24),
                        ),
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>
                      Price Per Night
                    </th>
                    <td>₹{viewData.price_per_day}</td>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Total Amount</th>
                    <td>₹{viewData.total_amount}</td>
                  </tr>
                  {viewData.user_profile_pic && (
                    <tr>
                      <th style={{ backgroundColor: '#f8f9fa' }}>
                        Profile Picture
                      </th>
                      <td>
                        <img
                          src={`http://localhost:5000/uploads/${viewData.user_profile_pic}`}
                          width="120"
                          alt="Profile"
                          style={{ borderRadius: '4px', objectFit: 'cover' }}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* OTHER GUESTS */}
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
                      <h5 className="fw-bold mb-3 border-bottom pb-2">
                        Other Guests
                      </h5>
                      <Table
                        bordered
                        hover
                        className="align-middle text-center"
                      >
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                          <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Profile</th>
                          </tr>
                        </thead>
                        <tbody>
                          {otherGuests.map((g, idx) => (
                            <tr key={idx}>
                              <td>{g.guest_name || 'N/A'}</td>
                              <td>{g.guest_phone || 'N/A'}</td>
                              <td>{g.guest_email || 'N/A'}</td>
                              <td>
                                {g.profile_pic ? (
                                  <img
                                    src={`http://localhost:5000/uploads/${g.profile_pic}`}
                                    width="40"
                                    height="40"
                                    alt="Guest Profile"
                                    style={{
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                    }}
                                  />
                                ) : (
                                  'N/A'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowView(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default BookingMaster
///correct code booking mater
