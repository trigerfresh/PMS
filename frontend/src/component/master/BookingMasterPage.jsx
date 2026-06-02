import { useEffect, useState } from 'react'
import {
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking,
} from './api/bookingApi'

import { getRooms } from './api/roomApi'
import { getHotels } from './api/hotelsApi'
import SearchPanel from '../../utils/filterPanel'
// import SearchPanel from '../../utils/FilterPanel'
import { FaSearch } from 'react-icons/fa'
import axios from 'axios'

export default function BookingMasterPage() {
  const [bookings, setBookings] = useState([])
  const [hotels, setHotels] = useState([])
  const [rooms, setRooms] = useState([])

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)

  const [hotelId, setHotelId] = useState('')
  const [roomId, setRoomId] = useState('')

  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('')
  const [price, setPrice] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const [statusFilter, setStatusFilter] = useState('all')
  const [bookingCounts, setBookingCounts] = useState({
    total_bookings: 0,
    deleted_bookings: 0,
    cancelled_bookings: 0,
    current_bookings: 0,
  })

  const [searchFields, setSearchFields] = useState([
    { field: 'guest_name', keyword: '' },
  ])

  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  const branchSearchOptions = [
    { value: 'guest_name', label: 'Guest Name' },
    { value: 'guest_email', label: 'Guest Email' },
    { value: 'room_no', label: 'Room No' },
    { value: 'status', label: 'Status' },
    { value: 'payment_status', label: 'Payment Status' },
  ]

  const getBookingCounts = () =>
    axios.get('http://localhost:5000/api/bookings-counts')

  // ================= LOAD =================

  const loadBookings = async () => {
    const res = await getBookings()
    setBookings(res.data.data || [])
  }

  const loadHotels = async () => {
    const res = await getHotels()
    setHotels(res.data.data || [])
  }

  const loadRooms = async () => {
    const res = await getRooms()
    setRooms(res.data.data || [])
  }

  const loadBookingCounts = async () => {
    const res = await getBookingCounts()
    setBookingCounts(res.data)
  }

  useEffect(() => {
    loadBookings()
    loadHotels()
    loadRooms()
    loadBookingCounts()
  }, [])

  // ================= FILTER ROOMS =================

  const filteredRooms = rooms.filter(
    (r) => Number(r.hotel_id) === Number(hotelId),
  )

  // ================= RESET FORM =================

  const resetForm = () => {
    setEditId(null)
    setHotelId('')
    setRoomId('')
    setGuestName('')
    setGuestPhone('')
    setCheckIn('')
    setCheckOut('')
    setGuests('')
    setPrice('')
  }

  const handleSearch = async () => {
    try {
      const params = {}

      searchFields.forEach((f) => {
        if (f.keyword) {
          params[f.field] = f.keyword
        }
      })

      if (dateFilter.from) params.from = dateFilter.from
      if (dateFilter.to) params.to = dateFilter.to

      const res = await axios.get('http://localhost:5000/api/bookings/search', {
        params,
      })

      setBookings(res.data.data)
    } catch (err) {
      console.log(err)
    }
  }

  // ================= SUBMIT =================

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      hotel_id: Number(hotelId),
      room_id: Number(roomId),
      guest_name: guestName,
      guest_phone: guestPhone,
      check_in_date: checkIn,
      check_out_date: checkOut,
      no_of_guests: Number(guests),
      price_per_night: Number(price),
      status: 'booked',
    }

    if (editId) {
      await updateBooking(editId, payload)
    } else {
      await createBooking(payload)
    }

    resetForm()
    loadBookings()
    setShowForm(false)
    loadBookingCounts()
  }

  // ================= EDIT =================

  const handleEdit = (b) => {
    setEditId(b.booking_id)

    setHotelId(String(b.hotel_id))
    setRoomId(String(b.room_id))

    setGuestName(b.guest_name)
    setGuestPhone(b.guest_phone)
    setCheckIn(b.check_in_date?.split('T')[0])
    setCheckOut(b.check_out_date?.split('T')[0])
    setGuests(b.no_of_guests)

    const room = rooms.find((r) => Number(r.room_id) === Number(b.room_id))

    if (room) setPrice(room.price)

    setShowForm(true)
  }

  // ================= DELETE =================

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel booking?')) return
    await deleteBooking(id)
    loadBookings()
  }

  return (
    <div className="container mt-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between mb-3">
        <h3>Booking Master</h3>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch className="me-1" />
            {showSearch ? 'Hide Search' : 'Search'}
          </button>
        </div>

        <button
          className="btn btn-success"
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
        >
          + New Booking
        </button>
      </div>

      {showSearch && <div className="card p-3 mb-3">Search Panel Working</div>}

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6>All Bookings</h6>
              <h3>{bookingCounts.total_bookings}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6>Current Bookings</h6>
              <h3>{bookingCounts.current_bookings}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6>Cancelled</h6>
              <h3>{bookingCounts.cancelled_bookings}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6>Deleted</h6>
              <h3>{bookingCounts.deleted_bookings}</h3>
            </div>
          </div>
        </div>
      </div>
      {/* FORM */}
      {showForm && (
        <div className="card p-3 mb-4">
          <form onSubmit={handleSubmit} className="row g-2">
            {/* HOTEL */}
            <select
              className="form-select"
              value={hotelId}
              onChange={(e) => {
                setHotelId(e.target.value)
                setRoomId('')
                setPrice('')
              }}
            >
              <option value="">Select Hotel</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hotel_name}
                </option>
              ))}
            </select>

            {/* ROOM */}
            <select
              className="form-select"
              value={roomId}
              onChange={(e) => {
                const id = e.target.value
                setRoomId(id)

                const room = filteredRooms.find(
                  (r) => Number(r.room_id) === Number(id),
                )

                if (room) setPrice(room.price)
              }}
            >
              <option value="">Select Room</option>

              {filteredRooms.map((r) => (
                <option key={r.room_id} value={r.room_id}>
                  Room {r.room_no} - {r.room_type} - {r.status}
                </option>
              ))}
            </select>

            {/* GUEST NAME */}
            <input
              className="form-control"
              placeholder="Guest Name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />

            {/* PHONE */}
            <input
              className="form-control"
              placeholder="Phone"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
            />

            {/* DATES */}
            <input
              type="date"
              className="form-control"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />

            <input
              type="date"
              className="form-control"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />

            {/* PRICE */}
            <input className="form-control" value={price} readOnly />

            {/* BUTTONS */}
            <div className="d-flex gap-2">
              <button className="btn btn-primary w-100">
                {editId ? 'Update' : 'Book'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}
      <div className="card">
        <div className="card-body table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((b) => (
                <tr key={b.booking_id}>
                  <td>{b.booking_id}</td>
                  <td>{b.guest_name}</td>
                  <td>{b.room_no}</td>
                  <td>{b.check_in_date}</td>
                  <td>{b.check_out_date}</td>
                  <td>{b.status}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => handleEdit(b)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-danger m-2"
                      onClick={() => handleDelete(b.booking_id)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
