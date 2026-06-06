import axios from 'axios'
import {
  FaPlus,
  FaPen,
  FaArrowLeft,
  FaTrashAlt,
  FaSearch,
  FaCog,
} from 'react-icons/fa'
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Table,
  Modal,
  Tab,
  Tabs,
} from 'react-bootstrap'
import SearchPanel from '../../utils/FilterPanel'
import { useEffect, useState } from 'react'
import { Dropdown } from 'react-bootstrap'
import { FaEllipsisV, FaEye } from 'react-icons/fa'
import '../css/RoomMaster.css'
import { BsThreeDotsVertical } from 'react-icons/bs'

const RoomsMaster = () => {
  const [rooms, setRooms] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hotels, setHotels] = useState([])
  const [floors, setFloors] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [selectedStat, setSelectedStat] = useState('total')
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [allRooms, setAllRooms] = useState([])
  const [roomStats, setRoomStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    maintenanceRooms: 0,
  })
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [deletedRooms, setDeletedRooms] = useState([])

  const [previewImages, setPreviewImages] = useState({
    room_photo1: '',
    room_photo2: '',
    room_photo3: '',
    room_photo4: '',
  })

  const [formData, setFormData] = useState({
    room_id: null,
    hotel_id: '',
    floor_id: '',
    room_no: '',
    room_type: '',
    price: '',
    status: '',
    bhk: '',
    balcony: '',
    bedroom: '',
    kitchen: '',
    bathroom: '',
    bed_type: '',
    room_amenities: [],
    room_video_url: '',
    room_photo1: null,
    room_photo2: null,
    room_photo3: null,
    room_photo4: null,
  })

  const amenitiesOptions = [
    'WiFi',
    'AC',
    'TV',
    'Parking',
    'Balcony',
    'Swimming Pool',
    'Kitchen',
    'Laundry',
    'Gym',
  ]

  const getAuthHeader = () => {
    const token = localStorage.getItem('token')
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }

  // const calculateStats = (data) => {
  //   return {
  //     totalRooms: data.length,
  //     occupiedRooms: data.filter((r) => r.status?.toLowerCase() === 'occupied')
  //       .length,
  //     availableRooms: data.filter(
  //       (r) => r.status?.toLowerCase() === 'available',
  //     ).length,
  //   }
  // }

  const fetchDeletedRooms = async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/rooms/deleted',
        getAuthHeader(),
      )

      setDeletedRooms(res.data.data)
    } catch (err) {
      console.log(err)
    }
  }

  const handleRestore = async (roomId) => {
    const confirmRestore = window.confirm(
      'Are you sure you want to restore this room?',
    )

    if (!confirmRestore) return

    try {
      await axios.put(
        `http://localhost:5000/api/rooms/restore/${roomId}`,
        {},
        getAuthHeader(),
      )

      alert('Room restored successfully')

      fetchRooms()
      fetchDeletedRooms()
    } catch (err) {
      console.log(err)
      alert('Restore failed')
    }
  }

  const calculateStats = (data) => ({
    totalRooms: data.length,

    occupiedRooms: data.filter((r) => r.status?.toLowerCase() === 'occupied')
      .length,

    availableRooms: data.filter((r) => r.status?.toLowerCase() === 'available')
      .length,

    maintenanceRooms: data.filter(
      (r) => r.status?.toLowerCase() === 'maintenance',
    ).length,
  })

  const handleStatClick = (type) => {
    setSelectedStat(type)
    if (type === 'total') setRooms(allRooms)
    if (type === 'occupied')
      setRooms(allRooms.filter((r) => r.status?.toLowerCase() === 'occupied'))
    if (type === 'available')
      setRooms(allRooms.filter((r) => r.status?.toLowerCase() === 'available'))
    if (type === 'maintenance') {
      setRooms(
        allRooms.filter((r) => r.status?.toLowerCase() === 'maintenance'),
      )
    }
    if (type === 'deleted') {
      setRooms(deletedRooms)
    }
  }

  const handleView = (room) => {
    setSelectedRoom(room)
    setShowViewModal(true)
  }

  const handleAmenitiesChange = (e) => {
    const { value, checked } = e.target
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        room_amenities: [...prev.room_amenities, value],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        room_amenities: prev.room_amenities.filter((item) => item !== value),
      }))
    }
  }

  const [searchFields, setSearchFields] = useState([
    { field: 'hotel_name', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  const branchSearchOptions = [
    { value: 'hotel_name', label: 'Hotel Name' },
    { value: 'floor_name', label: 'Floor Name' },
    { value: 'room_no', label: 'Room No' },
    { value: 'room_type', label: 'Room Type' },
    { value: 'status', label: 'Status' },
  ]

  const handleSearch = async () => {
    try {
      const params = {}
      searchFields.forEach((f) => {
        if (f.keyword) params[f.field] = f.keyword
      })
      const res = await axios.get('http://localhost:5000/api/rooms/search', {
        params,
        ...getAuthHeader(),
      })
      const data = res.data.data
      setRooms(data)
      setRoomStats(calculateStats(data))
    } catch (err) {
      console.log(err)
    }
  }

  const fetchHotels = async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/hotels',
        getAuthHeader(),
      )
      const allHotels = res.data.data || []
      const activeHotels = allHotels.filter((h) => h.active === '0')
      setHotels(activeHotels)
    } catch (err) {
      console.log(err)
    }
  }

  const fetchFloors = async (hotelId) => {
    if (!hotelId) return
    try {
      const res = await axios.get(
        `http://localhost:5000/api/floors/${hotelId}`,
        getAuthHeader(),
      )
      setFloors(res.data.data)
    } catch (err) {
      console.log(err)
    }
  }

  const fetchRoomStats = async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/rooms/stats',
        getAuthHeader(),
      )
      setRoomStats(res.data.data)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    fetchRooms()
    fetchHotels()
    fetchDeletedRooms()
    fetchRoomStats()
  }, [])

  const resetSearch = async () => {
    try {
      setSearchFields([{ field: 'hotel_name', keyword: '' }])
      setDateFilter({ from: '', to: '' })
      const res = await axios.get(
        'http://localhost:5000/api/rooms',
        getAuthHeader(),
      )
      const data = res.data.data
      setRooms(data)
      setAllRooms(data)
      setRoomStats(calculateStats(data))
    } catch (err) {
      console.log(err)
    }
  }

  const handleDownloadExcel = async () => {
    try {
      const params = {}
      const validSearch = searchFields.filter((f) => f.field && f.keyword)
      if (validSearch.length > 0) {
        params.searchFields = JSON.stringify(validSearch)
      }

      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

      const res = await axios.get(
        'http://localhost:5000/api/rooms/export',
        {
          params,
          responseType: 'blob',
          ...getAuthHeader(),
        },
      )

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Rooms_${randomNumber}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.log(err)
      alert('Excel download failed')
    }
  }

  const fetchRooms = async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/rooms',
        getAuthHeader(),
      )
      const data = res.data.data
      setRooms(data)
      setAllRooms(data)
      setRoomStats(calculateStats(data))
    } catch (err) {
      console.log(err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    const file = files[0]
    if (!file) return
    setFormData((prev) => ({ ...prev, [name]: file }))
    setPreviewImages((prev) => ({ ...prev, [name]: URL.createObjectURL(file) }))
  }

  const getImageUrl = (img) => {
    if (!img) return null
    const cleanPath = img.replace(/\\/g, '/')
    return `http://localhost:5000/${cleanPath}`
  }

  // Pehle validation pass karega aur popup open karega
  const handleSaveAndNext = (e) => {
    e.preventDefault()
    setShowSettingsModal(true) // Settings popup ko open karega
  }

  // Final submit tab hoga jab modal me details save hongi
  const handleFinalSubmit = async () => {
    const form = new FormData()

    form.append('hotel_id', formData.hotel_id)
    form.append('floor_id', formData.floor_id)
    form.append('room_no', formData.room_no)
    form.append('room_type', formData.room_type)
    form.append('price', formData.price)
    form.append('status', formData.status)
    form.append('bhk', formData.bhk)
    form.append('balcony', formData.balcony)
    form.append('bedroom', formData.bedroom)
    form.append('kitchen', formData.kitchen)
    form.append('bathroom', formData.bathroom)
    form.append('bed_type', formData.bed_type)
    form.append('room_amenities', JSON.stringify(formData.room_amenities))
    form.append('room_video_url', formData.room_video_url)

    if (formData.room_photo1) form.append('room_photo1', formData.room_photo1)
    if (formData.room_photo2) form.append('room_photo2', formData.room_photo2)
    if (formData.room_photo3) form.append('room_photo3', formData.room_photo3)
    if (formData.room_photo4) form.append('room_photo4', formData.room_photo4)

    try {
      if (isEditing) {
        await axios.put(
          `http://localhost:5000/api/rooms/${formData.room_id}`,
          form,
          {
            ...getAuthHeader(),
            headers: {
              ...getAuthHeader().headers,
              'Content-Type': 'multipart/form-data',
            },
          },
        )
      } else {
        await axios.post('http://localhost:5000/api/rooms', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      setShowSettingsModal(false)
      setShowForm(false)
      setIsEditing(false)
      resetForm()
      fetchRooms()
      alert('Room saved successfully!')
    } catch (err) {
      console.log(err)
      alert(err.response?.data?.message || 'Error saving room data')
    }
  }

  const handleEdit = (room) => {
    setFormData({
      room_id: room.room_id,
      hotel_id: room.hotel_id,
      floor_id: room.floor_id,
      room_no: room.room_no,
      room_type: room.room_type,
      price: room.price,
      status: room.status,
      bhk: room.bhk || '',
      balcony: room.balcony || '',
      bedroom: room.bedroom || '',
      kitchen: room.kitchen || '',
      bathroom: room.bathroom || '',
      bed_type: room.bed_type || '',
      room_amenities: room.room_amenities
        ? JSON.parse(room.room_amenities)
        : [],
      room_video_url: room.room_video_url || '',
      room_photo1: room.room_photo1 || null,
      room_photo2: room.room_photo2 || null,
      room_photo3: room.room_photo3 || null,
      room_photo4: room.room_photo4 || null,
    })

    setPreviewImages({
      room_photo1: room.room_photo1 ? getImageUrl(room.room_photo1) : '',
      room_photo2: room.room_photo2 ? getImageUrl(room.room_photo2) : '',
      room_photo3: room.room_photo3 ? getImageUrl(room.room_photo3) : '',
      room_photo4: room.room_photo4 ? getImageUrl(room.room_photo4) : '',
    })

    if (room.hotel_id) fetchFloors(room.hotel_id)

    setIsEditing(true)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      room_id: null,
      hotel_id: '',
      floor_id: '',
      room_no: '',
      room_type: '',
      price: '',
      status: '',
      bhk: '',
      balcony: '',
      bedroom: '',
      kitchen: '',
      bathroom: '',
      bed_type: '',
      room_amenities: [],
      room_video_url: '',
      room_photo1: null,
      room_photo2: null,
      room_photo3: null,
      room_photo4: null,
    })
    setPreviewImages({
      room_photo1: '',
      room_photo2: '',
      room_photo3: '',
      room_photo4: '',
    })
  }

  const handleDelete = async (room_id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this room?',
    )
    if (!confirmDelete) return
    try {
      await axios.delete(
        `http://localhost:5000/api/rooms/${room_id}`,
        getAuthHeader(),
      )
      alert('Room deleted successfully')
      fetchRooms()
      fetchDeletedRooms()
    } catch (err) {
      console.log(err)
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="page-container">
      {/* UNIFIED HEADER */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h1 className="page-title mb-0" style={{ fontSize: '25px' }}>
          {showForm
            ? isEditing
              ? 'Edit Room Details'
              : 'Add New Room'
            : 'Room Management'}{' '}
          {!showForm && <span className="text-success">({rooms.length})</span>}
        </h1>

        <div className="page-actions d-flex gap-3 align-items-center">
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
            className={`shadow-sm rounded-3 ${showForm ? 'btn-danger' : 'btn-primary'
              }`}
            onClick={() => {
              if (showForm) {
                setShowForm(false)
                setIsEditing(false)
                resetForm()
              } else {
                resetForm()
                setIsEditing(false)
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
        <div>
          <Card className="p-4 shadow-sm">
            <Form onSubmit={handleSaveAndNext}>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label>Hotel</Form.Label>
                  <Form.Select
                    name="hotel_id"
                    value={formData.hotel_id}
                    onChange={(e) => {
                      const hotelId = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        hotel_id: hotelId,
                        floor_id: '',
                      }))
                      fetchFloors(hotelId)
                    }}
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
                  <Form.Label>Floor</Form.Label>
                  <Form.Select
                    name="floor_id"
                    value={formData.floor_id}
                    onChange={handleInputChange}
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

                <Col md={4}>
                  <Form.Label>Room No</Form.Label>
                  <Form.Control
                    placeholder="Room No"
                    name="room_no"
                    value={formData.room_no}
                    onChange={handleInputChange}
                    required
                  />
                </Col>

                <Col md={4}>
                  <Form.Label>Room Type</Form.Label>
                  <Form.Control
                    placeholder="Room Type"
                    name="room_type"
                    value={formData.room_type}
                    onChange={handleInputChange}
                  />
                </Col>

                <Col md={4}>
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    placeholder="Price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </Col>

                <Col md={4}>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                  </Form.Select>
                </Col>
              </Row>

              <div className="mt-4 d-flex gap-2">
                <Button type="submit" variant="success">
                  {isEditing ? 'Save & Next (Update)' : 'Save & Next'}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowForm(false)
                    setIsEditing(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card>

          {/* ROOM SETTINGS MODAL (Triggered via Save & Next) */}
          <Modal
            show={showSettingsModal}
            onHide={() => setShowSettingsModal(false)}
            size="lg"
            centered
            backdrop="static" // User click karke bahar modal band na kar sake, data safe rahega
          >
            <Modal.Header closeButton>
              <Modal.Title>
                <FaCog className="me-2" />
                Room Advanced Configuration
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <h5 className="mb-3 text-secondary">Room Details</h5>
                <Row className="g-3 mb-4">
                  <Col md={4}>
                    <Form.Label>BHK</Form.Label>
                    <Form.Select
                      name="bhk"
                      value={formData.bhk}
                      onChange={handleInputChange}
                    >
                      <option value="">Select BHK</option>
                      <option value="1">1 BHK</option>
                      <option value="2">2 BHK</option>
                      <option value="3">3 BHK</option>
                      <option value="4">4 BHK</option>
                    </Form.Select>
                  </Col>

                  <Col md={4}>
                    <Form.Label>Balcony</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Enter Balcony Count"
                      name="balcony"
                      value={formData.balcony}
                      onChange={handleInputChange}
                    />
                  </Col>

                  <Col md={4}>
                    <Form.Label>Bedroom</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Bedroom Count"
                      name="bedroom"
                      value={formData.bedroom}
                      onChange={handleInputChange}
                    />
                  </Col>

                  <Col md={4}>
                    <Form.Label>Bathroom</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Bathroom Count"
                      name="bathroom"
                      value={formData.bathroom}
                      onChange={handleInputChange}
                    />
                  </Col>

                  <Col md={4}>
                    <Form.Label>Bed Type</Form.Label>
                    <Form.Select
                      name="bed_type"
                      value={formData.bed_type}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Bed Type</option>
                      <option value="Single Bed">Single Bed</option>
                      <option value="Double Bed">Double Bed</option>
                      <option value="King Size">King Size</option>
                      <option value="Queen Size">Queen Size</option>
                    </Form.Select>
                  </Col>

                  <Col md={4}>
                    <Form.Label>Video URL</Form.Label>
                    <Form.Control
                      placeholder="Video URL"
                      name="room_video_url"
                      value={formData.room_video_url}
                      onChange={handleInputChange}
                    />
                  </Col>
                </Row>

                <hr />

                <h5 className="mb-3 text-secondary">Room Amenities</h5>
                <Row className="mb-4">
                  <Col md={12}>
                    <div className="d-flex flex-wrap gap-3">
                      {amenitiesOptions.map((amenity, index) => (
                        <Form.Check
                          key={index}
                          type="checkbox"
                          label={amenity}
                          value={amenity}
                          checked={formData.room_amenities.includes(amenity)}
                          onChange={handleAmenitiesChange}
                        />
                      ))}
                    </div>
                  </Col>
                </Row>

                <hr />

                <h5 className="mb-3 text-secondary">Room Photos</h5>
                <Row className="g-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Col md={6} key={i}>
                      <Form.Label>Photo {i}</Form.Label>
                      <Form.Control
                        type="file"
                        name={`room_photo${i}`}
                        onChange={handleFileChange}
                      />
                      {previewImages[`room_photo${i}`] && (
                        <img
                          src={previewImages[`room_photo${i}`]}
                          width="120"
                          height="80"
                          style={{ objectFit: 'cover' }}
                          className="mt-2 rounded border"
                          alt={`Preview ${i}`}
                        />
                      )}
                    </Col>
                  ))}
                </Row>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowSettingsModal(false)}
              >
                Back to Main Form
              </Button>
              <Button variant="primary" onClick={handleFinalSubmit}>
                Save Room Data
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      ) : (
        /* TABLE LIST SCREEN */
        <div>
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

          <Tabs
            activeKey={selectedStat}
            onSelect={(k) => handleStatClick(k)}
            className="mb-3 custom-bootstrap-tabs"
            style={{ overflow: 'visible', flexWrap: 'wrap' }}
          >
            <Tab
              eventKey="total"
              title={`Total Rooms (${roomStats.totalRooms})`}
            />
            <Tab
              eventKey="occupied"
              title={`Occupied (${roomStats.occupiedRooms})`}
            />
            <Tab
              eventKey="available"
              title={`Available (${roomStats.availableRooms})`}
            />
            <Tab
              eventKey="maintenance"
              title={`Maintenance (${roomStats.maintenanceRooms})`}
            />
            <Tab
              eventKey="deleted"
              title={`Deleted (${deletedRooms.length})`}
            />
          </Tabs>

          <Card className="branch-card">
            <Table
              bordered
              hover
              responsive
              className="list-table align-middle mb-0"
            >
              <thead className="table text-center">
                <tr>
                  <th>Hotel Name</th>
                  <th>Floor Name</th>
                  <th>Room No</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <tr key={room.room_id}>
                      <td>{room.hotel_name}</td>
                      <td>{room.floor_name}</td>
                      <td>{room.room_no}</td>
                      <td>{room.room_type}</td>
                      <td>{room.price}</td>
                      <td>{room.status}</td>
                      <td>
                        <Dropdown align="end">
                          <Dropdown.Toggle
                            variant="outline-secondary"
                            size="sm"
                            id={`dropdown-${room.room_id}`}
                            className="bg-secondary text-white shadow-sm border"
                          >
                            <BsThreeDotsVertical />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleView(room)}>
                              <FaEye className="me-2 text-primary" /> View
                            </Dropdown.Item>
                            {selectedStat !== 'deleted' && (
                              <Dropdown.Item onClick={() => handleEdit(room)}>
                                <FaPen className="me-2 text-warning" /> Edit
                              </Dropdown.Item>
                            )}
                            <Dropdown.Divider />
                            {selectedStat === 'deleted' ? (
                              <Dropdown.Item
                                onClick={() => handleRestore(room.room_id)}
                              >
                                Restore Room
                              </Dropdown.Item>
                            ) : (
                              <Dropdown.Item
                                onClick={() => handleDelete(room.room_id)}
                              >
                                <FaTrashAlt className="me-2" />
                                Delete
                              </Dropdown.Item>
                            )}
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-3">
                      No rooms found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Room Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRoom && (
            <div className="row g-3">
              <div className="col-md-6">
                <b>Hotel:</b> {selectedRoom.hotel_name}
              </div>
              <div className="col-md-6">
                <b>Floor:</b> {selectedRoom.floor_name}
              </div>
              <div className="col-md-6">
                <b>Room No:</b> {selectedRoom.room_no}
              </div>
              <div className="col-md-6">
                <b>Type:</b> {selectedRoom.room_type}
              </div>
              <div className="col-md-6">
                <b>Price:</b> {selectedRoom.price}
              </div>
              <div className="col-md-6">
                <b>Status:</b> {selectedRoom.status}
              </div>
              <div className="col-md-6">
                <b>BHK:</b> {selectedRoom.bhk || 'N/A'}
              </div>
              <div className="col-md-6">
                <b>Balcony:</b> {selectedRoom.balcony || 'N/A'}
              </div>
              <div className="col-md-6">
                <b>Bedroom:</b> {selectedRoom.bedroom || 'N/A'}
              </div>
              <div className="col-md-6">
                <b>Bathroom:</b> {selectedRoom.bathroom || 'N/A'}
              </div>
              <div className="col-md-6">
                <b>Bed Type:</b> {selectedRoom.bed_type || 'N/A'}
              </div>
              <div className="col-md-12">
                <b>Amenities:</b>{' '}
                {selectedRoom.room_amenities
                  ? JSON.parse(selectedRoom.room_amenities).join(', ')
                  : 'N/A'}
              </div>
              <div className="col-md-12">
                <b>Video:</b>{' '}
                {selectedRoom.room_video_url ? (
                  <a
                    href={selectedRoom.room_video_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Video
                  </a>
                ) : (
                  'N/A'
                )}
              </div>
              <div className="col-md-12 d-flex gap-2 flex-wrap">
                {[1, 2, 3, 4].map((i) => {
                  const img = selectedRoom?.[`room_photo${i}`]
                  const url = getImageUrl(img)
                  return (
                    url && (
                      <img
                        key={i}
                        src={url}
                        width="120"
                        className="rounded border"
                        alt="room"
                      />
                    )
                  )
                })}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default RoomsMaster
