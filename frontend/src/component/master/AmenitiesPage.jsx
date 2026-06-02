import React, { useEffect, useState } from 'react'

import {
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
} from './api/amenititesApi'

import { getHotels } from './api/hotelsApi'

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState([])
  const [hotels, setHotels] = useState([])

  const [hotelId, setHotelId] = useState('')
  const [amenityName, setAmenityName] = useState('')
  const [amenityIcon, setAmenityIcon] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAmenities, setSelectedAmenities] = useState([])

  const [editId, setEditId] = useState(null)

  const amenityOptions = [
    'WiFi',
    'Swimming Pool',
    'Gym',
    'Parking',
    'Spa',
    'Restaurant',
    'Bar',
    'Laundry',
    'Room Service',
    'Air Conditioning',
  ]

  const handleAmenityChange = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity))
    } else {
      setSelectedAmenities([...selectedAmenities, amenity])
    }
  }

  // ================= LOAD =================

  const loadAmenities = async () => {
    try {
      const res = await getAmenities()

      setAmenities(res.data.data)
    } catch (err) {
      console.log(err)
    }
  }

  const loadHotels = async () => {
    try {
      const res = await getHotels()

      setHotels(res.data.data)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    loadAmenities()
    loadHotels()
  }, [])

  // ================= SUBMIT =================

  const handleSubmit = async (e) => {
    e.preventDefault()

    const selectedHotel = hotels.find((h) => h.id == hotelId)

    const payload = {
      hotel_id: hotelId,

      hotel_name: selectedHotel?.hotel_name || '',

      amenity_name: selectedAmenities.join(','),

      amenity_icon: amenityIcon,

      description,
    }

    try {
      if (editId) {
        await updateAmenity(editId, payload)
      } else {
        await createAmenity(payload)
      }

      resetForm()

      loadAmenities()
    } catch (err) {
      console.log(err)
    }
  }

  // ================= EDIT =================

  const handleEdit = (item) => {
    setEditId(item.id)

    setHotelId(item.hotel_id)
    setAmenityName(item.amenity_name)
    setAmenityIcon(item.amenity_icon)
    setDescription(item.description)
    setSelectedAmenities(item.amenity_name ? item.amenity_name.split(',') : [])
  }

  // ================= DELETE =================

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this amenity?')) return

    await deleteAmenity(id)

    loadAmenities()
  }

  // ================= RESET =================

  const resetForm = () => {
    setEditId(null)

    setHotelId('')
    setAmenityName('')
    setAmenityIcon('')
    setDescription('')
    setSelectedAmenities([])
  }

  return (
    <div className="container mt-4">
      {/* HEADER */}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold text-primary">Amenities Master</h3>
      </div>

      {/* FORM */}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* HOTEL */}

              <div className="col-md-3 mb-3">
                <label className="form-label">Hotel</label>

                <select
                  className="form-select"
                  value={hotelId}
                  onChange={(e) => setHotelId(e.target.value)}
                  required
                >
                  <option value="">Select Hotel</option>

                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hotel_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ICON */}

              <div className="col-md-2 mb-3">
                <label className="form-label">Icon</label>

                <input
                  type="text"
                  className="form-control"
                  value={amenityIcon}
                  onChange={(e) => setAmenityIcon(e.target.value)}
                />
              </div>

              {/* DESCRIPTION */}

              <div className="col-md-4 mb-3">
                <label className="form-label">Description</label>

                <input
                  type="text"
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* AMENITY NAME */}

              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold">Select Amenities</label>

                <div className="row">
                  {amenityOptions.map((amenity, index) => (
                    <div className="col-md-3 mb-2" key={index}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={amenity}
                          checked={selectedAmenities.includes(amenity)}
                          onChange={() => handleAmenityChange(amenity)}
                        />

                        <label className="form-check-label" htmlFor={amenity}>
                          {amenity}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BUTTONS */}

            <div className="d-flex gap-2">
              <button
                type="submit"
                className={`btn ${editId ? 'btn-warning' : 'btn-primary'}`}
              >
                {editId ? 'Update Amenity' : 'Create Amenity'}
              </button>

              {editId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* TABLE */}

      <div className="card shadow-sm">
        <div className="card-body">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Hotel</th>
                <th>Amenity</th>
                <th>Icon</th>
                <th>Description</th>
                <th width="150">Action</th>
              </tr>
            </thead>

            <tbody>
              {amenities.length > 0 ? (
                amenities.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>

                    <td>{item.hotel_name}</td>

                    <td>
                      {item.amenity_name?.split(',').map((a, i) => (
                        <span key={i} className="badge bg-primary me-1">
                          {a}
                        </span>
                      ))}
                    </td>

                    <td>{item.amenity_icon}</td>

                    <td>{item.description}</td>

                    <td>
                      <button
                        className="btn btn-sm btn-primary m-2"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No Amenities Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
