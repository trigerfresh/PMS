import { useEffect, useState } from 'react'
import { getHotels } from './api/hotelsApi'
import SearchPanel from '../../utils/filterPanel'
import {
  getFloorsByHotel,
  createFloor,
  updateFloor,
  deleteFloor,
  exportFloorsExcel,
} from './api/floorApi'
import { FaEye, FaPen, FaSearch, FaTrashAlt } from 'react-icons/fa'
import Dropdown from 'react-bootstrap/Dropdown'
import Modal from 'react-bootstrap/Modal'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Table from 'react-bootstrap/Table'
import axios from 'axios'

export default function FloorPage() {
  const [hotels, setHotels] = useState([])
  const [floors, setFloors] = useState([])

  const [hotelId, setHotelId] = useState('')
  const [floorName, setFloorName] = useState('')
  const [floorNumber, setFloorNumber] = useState('')

  const [editId, setEditId] = useState(null)
  const [showSearch, setShowSearch] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [viewFloor, setViewFloor] = useState(null)
  const [floorStatus, setFloorStatus] = useState('0')
  const [statusFilter, setStatusFilter] = useState('all')
  const [counts, setCounts] = useState({
    totalHotels: 0,
    approvedHotels: 0,
    deletedHotels: 0,
  })

  const handleView = (floor) => {
    setViewFloor(floor)
    setShowModal(true)
  }

  // ================= LOAD HOTELS =================
  useEffect(() => {
    const loadHotels = async () => {
      const res = await getHotels()
      setHotels(res.data.data || [])
    }
    loadHotels()
  }, [])

  const [searchFields, setSearchFields] = useState([
    { field: 'hotel_name', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  const branchSearchOptions = [
    { value: 'floor_name', label: 'Floor Name' },
    { value: 'floor_number', label: 'Floor Number' },
  ]

  // ================= LOAD FLOORS =================
  //   const loadFloors = async (hid) => {
  //   if (!hid) return setFloors([])
  //   const res = await getFloorsByHotel(hid)
  //   setFloors(res.data.data || [])
  // }

  const loadFloors = async (
    hid,
    search = searchFields,
    status = floorStatus,
  ) => {
    if (!hid) return setFloors([])

    const res = await getFloorsByHotel(hid, search, status)
    setFloors(res.data.data || [])
  }

  const handleSearch = () => {
    loadFloors(hotelId, searchFields)
  }

  const resetSearch = () => {
    setSearchFields([{ field: 'floor_name', keyword: '' }])
    loadFloors(hotelId, [])
  }

  const handleDownloadExcel = async () => {
    try {
      const res = await exportFloorsExcel(hotelId)

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `floors_${hotelId}.xlsx`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.log(err)
      alert('Excel download failed')
    }
  }

  // when hotel changes
  useEffect(() => {
    if (hotelId) {
      loadFloors(hotelId, searchFields, floorStatus)
    }
  }, [hotelId, floorStatus])

  // ================= RESET =================
  const reset = () => {
    setEditId(null)
    setFloorName('')
    setFloorNumber('')
  }

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      hotel_id: Number(hotelId),
      floor_name: floorName,
      floor_number: Number(floorNumber),
    }

    if (editId) {
      await updateFloor(editId, payload)
    } else {
      await createFloor(payload)
    }

    reset()
    loadFloors(hotelId, searchFields, floorStatus)
  }

  // ================= EDIT =================
  const handleEdit = (f) => {
    setEditId(f.floor_id)
    setFloorName(f.floor_name)
    setFloorNumber(f.floor_number)
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm('Delete floor?')) return

    await deleteFloor(id)
    loadFloors(hotelId, searchFields, floorStatus)
  }

  const handleRestore = async (id) => {
    await axios.put(`http://localhost:5000/api/floor/restore/${id}`)
    loadFloors(hotelId, searchFields, floorStatus)
  }

  return (
    <div className="page-container">
      <div className="page-header d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h1
          className="page-title mb-0"
          style={{
            fontSize: '25px',
          }}
        >
          {editId ? 'Edit Floor' : 'Floor Master'}
        </h1>

        <div className="page-actions d-flex gap-3 align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted fw-semibold">Hotel:</span>
            <select
              className="form-select"
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              <option value="">Select Hotel</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hotel_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="search-btn shadow-sm rounded-3"
            onClick={() => setShowSearch(!showSearch)}
            style={{
              padding: '6px 14px',
              backgroundColor: '#00baf2',
              border: 'none',
              color: '#ffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
          >
            <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
          </button>
        </div>
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

      {/* FORM */}
      {/* {hotelId && (
        <form onSubmit={handleSubmit} className="card p-3 mb-3">
          <input
            className="form-control mb-2"
            placeholder="Floor Name"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
          />

          <input
            className="form-control mb-2"
            placeholder="Floor Number"
            value={floorNumber}
            onChange={(e) => setFloorNumber(e.target.value)}
          />

          <button className="btn btn-primary">
            {editId ? 'Update Floor' : 'Add Floor'}
          </button>
        </form>
      )} */}

      {/* FORM */}
      {hotelId && (
        <form onSubmit={handleSubmit} className="card p-3 mb-3">
          <div className="d-flex gap-2 align-items-center">
            <input
              className="form-control"
              placeholder="Floor Name"
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
            />

            <input
              className="form-control"
              placeholder="Floor Number"
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
            />

            <button className="btn btn-primary text-nowrap">
              {editId ? 'Update Floor' : 'Add Floor'}
            </button>
          </div>
        </form>
      )}

      <Tabs
        activeKey={floorStatus}
        onSelect={(k) => setFloorStatus(k)}
        className="mb-3 custom-bootstrap-tabs"
        style={{ overflow: 'visible', flexWrap: 'wrap' }}
      >
        <Tab eventKey="0" title="Active Floors" />
        <Tab eventKey="1" title="Deleted Floors" />
      </Tabs>

      {/* TABLE */}
      <div className="card branch-card">
        <div className="card-body p-0">
          <Table hover bordered responsive className="list-table align-middle mb-0">
            <thead className="table">
              <tr>
                <th>Floor No</th>
                <th>Floor Name</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {floors.map((f) => (
                <tr key={f.floor_id}>
                  <td>{f.floor_number}</td>
                  <td>{f.floor_name}</td>

                  <td className="text-center">
                    <Dropdown>
                      <Dropdown.Toggle
                        variant="outline-secondary"
                        size="sm"
                        id={`dropdown-${f.floor_id}`}
                        className="bg-secondary text-white shadow-sm border"
                      >
                        Action
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        <Dropdown.Item
                        // onClick={() => handleView(branch)}
                        >
                          <FaEye
                            className="me-2 text-info"
                            onClick={() => handleView(f)}
                          />
                          View
                        </Dropdown.Item>

                        <Dropdown.Item onClick={() => handleEdit(f)}>
                          <FaPen className="me-2 text-primary" />
                          Edit
                        </Dropdown.Item>

                        {floorStatus === '0' && (
                          <Dropdown.Item
                            onClick={() => handleDelete(f.floor_id)}
                          >
                            <FaTrashAlt className="me-2 text-danger" />
                            Delete
                          </Dropdown.Item>
                        )}

                        {floorStatus === '1' && (
                          <Dropdown.Item
                            onClick={() => handleRestore(f.floor_id)}
                          >
                            ♻ Restore
                          </Dropdown.Item>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Floor Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {viewFloor ? (
            <div>
              <p>
                <b>Floor ID:</b> {viewFloor.floor_id}
              </p>
              <p>
                <b>Floor Name:</b> {viewFloor.floor_name}
              </p>
              <p>
                <b>Floor Number:</b> {viewFloor.floor_number}
              </p>
              <p>
                <b>Hotel ID:</b> {viewFloor.hotel_id}
              </p>
              <p>
                <b>Status:</b>{' '}
                {viewFloor.active === '0' ? 'Active' : 'Inactive'}
              </p>
            </div>
          ) : (
            <p>No data</p>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => setShowModal(false)}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
