import React, { useEffect, useState } from 'react'
import { getRooms, createRoom, updateRoom, deleteRoom } from './api/roomApi'
import { getHotels } from './api/hotelsApi'
import { FaPlus, FaArrowLeft, FaPen, FaTrashAlt } from 'react-icons/fa'
import Dropdown from 'react-bootstrap/Dropdown'
import Table from 'react-bootstrap/Table'

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
    <div className="page-container">
      {/* HEADER SECTION */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h1
          className="page-title mb-0"
          style={{
            fontSize: '25px',
          }}
        >
          {showForm
            ? editId
              ? 'Update Room'
              : 'Add Room'
            : 'Room Master'}{' '}
          {!showForm && (
            <span className="text-success">({rooms.length})</span>
          )}
        </h1>

        <div className="page-actions d-flex gap-3 align-items-center">
          <button
            type="button"
            className={`btn shadow-sm rounded-3 text-white d-flex align-items-center gap-2 px-4 py-2 ${
              showForm ? 'btn-danger' : 'btn-primary'
            }`}
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
              border: 'none',
              fontWeight: '500',
              transition: 'all 0.2s ease',
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
      {!showForm && (
        <div className="card branch-card">
          <div className="card-body p-0">
            <Table hover bordered responsive className="list-table align-middle mb-0">
              <thead className="table">
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
                    <td className="text-center">
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          size="sm"
                          id={`dropdown-${r.room_id}`}
                          className="bg-secondary text-white shadow-sm border"
                        >
                          Action
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleEdit(r)}>
                            <FaPen className="me-2 text-primary" />
                            Edit
                          </Dropdown.Item>

                          <Dropdown.Item
                            onClick={() => handleDelete(r.room_id)}
                            className="text-danger"
                          >
                            <FaTrashAlt className="me-2" />
                            Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
