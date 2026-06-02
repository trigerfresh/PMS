import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Button, Table, Card, Alert, Form, Row, Col } from 'react-bootstrap'

const HotelInventory = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const token = localStorage.getItem('token')

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  // ================= FORM STATE =================
  const initialForm = {
    hotel_id: '',
    hotel_name: '',
    total_rooms: '',
    available_rooms: '',
    occupied_rooms: '',
    maintenance_rooms: '',
    blocked_rooms: '',
  }

  const [formData, setFormData] = useState(initialForm)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // ================= FETCH =================
  const fetchInventory = async () => {
    try {
      setLoading(true)

      const res = await axios.get(
        'http://localhost:5000/api/hotel-inventory',
        getAuthHeaders(),
      )

      setData(res.data.data)
    } catch (err) {
      setError('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  // ================= OPEN CREATE =================
  const openCreateForm = () => {
    setFormData(initialForm)
    setIsEditing(false)
    setShowForm(true)
  }

  // ================= OPEN EDIT =================
  const openEditForm = (item) => {
    setFormData({
      hotel_id: item.hotel_id,
      hotel_name: item.hotel_name,
      total_rooms: item.total_rooms,
      available_rooms: item.available_rooms,
      occupied_rooms: item.occupied_rooms,
      maintenance_rooms: item.maintenance_rooms,
      blocked_rooms: item.blocked_rooms,
    })

    setIsEditing(true)
    setShowForm(true)
  }

  // ================= SUBMIT FORM =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (isEditing) {
        // UPDATE (manual update)
        await axios.put(
          `http://localhost:5000/api/hotel-inventory/update/${formData.hotel_id}`,
          formData,
          getAuthHeaders(),
        )

        alert('Inventory updated successfully')
      } else {
        // CREATE (generate from backend OR manual insert API if you add later)
        await axios.post(
          `http://localhost:5000/api/hotel-inventory/generate/${formData.hotel_id}`,
          {},
          getAuthHeaders(),
        )

        alert('Inventory generated successfully')
      }

      setShowForm(false)
      fetchInventory()
    } catch (err) {
      alert('Save failed')
    }
  }

  // ================= DELETE =================
  const deleteInventory = async (hotelId) => {
    if (!window.confirm('Are you sure?')) return

    await axios.delete(
      `http://localhost:5000/api/hotel-inventory/${hotelId}`,
      getAuthHeaders(),
    )

    fetchInventory()
  }

  return (
    <div className="page-container">
      {/* HEADER BUTTON */}
      <div className="d-flex justify-content-between mb-3">
        <h3>Hotel Inventory Summary</h3>

        <Button variant="dark" onClick={openCreateForm}>
          + Add / Generate Inventory
        </Button>
      </div>

      {/* ERROR */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* TABLE */}
      <Card className="p-3">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <Table bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>Hotel</th>
                <th>Total</th>
                <th>Available</th>
                <th>Occupied</th>
                <th>Maintenance</th>
                <th>Blocked</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item) => (
                <tr key={item.inventory_id}>
                  <td>{item.hotel_name}</td>
                  <td>{item.total_rooms}</td>
                  <td>{item.available_rooms}</td>
                  <td>{item.occupied_rooms}</td>
                  <td>{item.maintenance_rooms}</td>
                  <td>{item.blocked_rooms}</td>

                  <td className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => openEditForm(item)}
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteInventory(item.hotel_id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ================= FORM ================= */}
      {showForm && (
        <Card className="p-4 mt-3 border-primary">
          <h4>{isEditing ? 'Update Inventory' : 'Generate Inventory'}</h4>

          <Form onSubmit={handleSubmit}>
            <Row>
              {/* HOTEL ID */}
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Hotel ID</Form.Label>
                  <Form.Control
                    name="hotel_id"
                    value={formData.hotel_id}
                    onChange={handleChange}
                    placeholder="Enter Hotel ID"
                    required
                  />
                </Form.Group>
              </Col>

              {/* HOTEL NAME */}
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Hotel Name</Form.Label>
                  <Form.Control
                    name="hotel_name"
                    value={formData.hotel_name}
                    onChange={handleChange}
                    placeholder="Hotel Name"
                    disabled
                  />
                </Form.Group>
              </Col>

              {/* ROOMS */}
              {[
                'total_rooms',
                'available_rooms',
                'occupied_rooms',
                'maintenance_rooms',
                'blocked_rooms',
              ].map((field) => (
                <Col md={6} key={field}>
                  <Form.Group className="mb-2">
                    <Form.Label>{field.replace('_', ' ')}</Form.Label>
                    <Form.Control
                      type="number"
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            <div className="d-flex gap-2 mt-3">
              <Button type="submit" variant="success">
                {isEditing ? 'Update' : 'Generate'}
              </Button>

              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card>
      )}
    </div>
  )
}

export default HotelInventory
