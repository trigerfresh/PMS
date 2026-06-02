import React, { useEffect, useState } from 'react'
import { getRooms, createRoom, updateRoom, deleteRoom } from './api/roomApi'
import { getHotels } from './api/hotelsApi'

export default function RoomMasterPage() {
  const [rooms, setRooms] = useState([])
  const [hotels, setHotels] = useState([])

  const [showForm, setShowForm] = useState(false)

  const [hotelId, setHotelId] = useState('')
  const [roomNo, setRoomNo] = useState('')
  const [roomType, setRoomType] = useState('')
  const [price, setPrice] = useState('')
  const [capacity, setCapacity] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('available')

  const [editId, setEditId] = useState(null)

  // ================= LOAD =================
  const loadRooms = async () => {
    const res = await getRooms()
    setRooms(res.data.data)
  }

  const loadHotels = async () => {
    const res = await getHotels()
    setHotels(res.data.data)
  }

  useEffect(() => {
    loadRooms()
    loadHotels()
  }, [])

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      hotel_id: hotelId,
      room_no: roomNo,
      room_type: roomType,
      price,
      capacity,
      description,
      amenities: '',
      status,
    }

    if (editId) {
      await updateRoom(editId, payload)
    } else {
      await createRoom(payload)
    }

    resetForm()
    loadRooms()
    setShowForm(false)
  }

  // ================= EDIT =================
  const handleEdit = (item) => {
    setEditId(item.room_id)
    setHotelId(item.hotel_id)
    setRoomNo(item.room_no)
    setRoomType(item.room_type)
    setPrice(item.price)
    setCapacity(item.capacity)
    setDescription(item.description)
    setStatus(item.status)

    setShowForm(true)
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm('Delete room?')) return
    await deleteRoom(id)
    loadRooms()
  }

  // ================= RESET =================
  const resetForm = () => {
    setEditId(null)
    setHotelId('')
    setRoomNo('')
    setRoomType('')
    setPrice('')
    setCapacity('')
    setDescription('')
    setStatus('available')
  }

  return (
    <div className="container mt-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3
          className="fw-bold text-primary mt-4"
          style={{
            position: 'relative',
            left: '35%',
          }}
        >
          Room Master
        </h3>

        {/* ADD NEW BUTTON */}

        <button
          className="btn btn-success"
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
        >
          + Add New Room
        </button>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="row g-2">
              {/* HOTEL */}
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={hotelId}
                  onChange={(e) => setHotelId(e.target.value)}
                >
                  <option>Select Hotel</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hotel_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ROOM NO */}
              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Room No"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                />
              </div>

              {/* TYPE */}
              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Room Type"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                />
              </div>

              {/* PRICE */}
              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              {/* CAPACITY */}
              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>

              {/* STATUS */}
              <div className="col-md-2">
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {/* DESCRIPTION */}
              <div className="col-md-10">
                <input
                  className="form-control"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* BUTTON */}
              <div className="col-md-2 d-flex gap-2">
                <button
                  className={`btn ${editId ? 'btn-warning' : 'btn-primary'} w-100`}
                >
                  {editId ? 'Update' : 'Save'}
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
        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="card shadow-sm">
        <div className="card-body table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Hotel</th>
                <th>Room No</th>
                <th>Type</th>
                <th>Price</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {rooms.map((r) => (
                <tr key={r.room_id}>
                  <td>{r.room_id}</td>
                  <td>{r.hotel_name}</td>
                  <td>{r.room_no}</td>
                  <td>{r.room_type}</td>
                  <td>{r.price}</td>
                  <td>{r.capacity}</td>
                  <td>
                    <span className="badge bg-info">{r.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary m-2"
                      onClick={() => handleEdit(r)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(r.room_id)}
                    >
                      Delete
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
