import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FaPlus, FaSearch, FaPen, FaTrashAlt, FaEye } from 'react-icons/fa' // Import icons
import SearchPanel from '../../utils/FilterPanel'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Table,
  Modal,
  Tabs,
  Tab,
} from 'react-bootstrap'

import Dropdown from 'react-bootstrap/Dropdown'

const HotelPage = () => {
  const [branches, setBranches] = useState([])
  const [branch, setBranch] = useState([])

  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [isEditing, setIsEditing] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [counts, setCounts] = useState({
    totalHotels: 0,
    approvedHotels: 0,
    deletedHotels: 0,
  })

  const initialFormData = {
    hotelName: '',
    description: '',
    address: '',
    city: '',
    pincode: '',
    email: '',
    phone: '',
    gstNo: '',

    companyId: '',
    companyName: '',

    branchId: '',
    branchName: '',
    contact_person: '',

    thumbnailImage: null,
    image1: null,
    image2: null,
    image3: null,

    existingThumbnailImage: '',
    existingImage1: '',
    existingImage2: '',
    existingImage3: '',
  }

  const [formData, setFormData] = useState(initialFormData)

  const [searchFields, setSearchFields] = useState([
    { field: 'hotel_name', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  const branchSearchOptions = [
    { value: 'hotel_name', label: 'Hotel Name' },
    { value: 'branch_name', label: 'Branch Name' },
    { value: 'address', label: 'Address' },
  ]

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  const fetchBranches = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {}

      const validSearchFields = searchFields.filter((f) => f.field && f.keyword)

      if (validSearchFields.length > 0) {
        params.searchFields = JSON.stringify(validSearchFields)
      }

      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }

      // 👇 ADD THIS
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const res = await axios.get(`http://localhost:5000/api/hotels`, {
        params,
        ...getAuthHeaders(),
      })

      setBranches(res.data.data)

      setCounts({
        totalHotels: res.data.counts?.totalHotels || 0,
        approvedHotels: res.data.counts?.approvedHotels || 0,
        deletedHotels: res.data.counts?.deletedHotels || 0,
      })
    } catch (err) {
      setError('Failed to load branches.', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/companies`,
        getAuthHeaders(),
      )
      setCompanies(res.data.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else setError('Error fetching companies')
      console.error('Error fetching companies:', err)
    }
  }

  useEffect(() => {
    fetchBranches()
    fetchCompanies()
    fetchBranch()
  }, [])

  const fetchBranch = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/branch`,
        getAuthHeaders(),
      )
      setBranch(res.data.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else setError('Error fetching branch')
      console.error('Error fetching branch:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    setFormData({ ...formData, [name]: value })

    const key = name
    if (validationErrors[key]) {
      setValidationErrors((prev) => ({
        ...prev,
        [key]: '',
      }))
    }
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target

    setFormData({
      ...formData,
      [name]: files[0],
    })
  }

  const handleCompanySelection = (companyId) => {
    const selectedCompanies = [...formData.companyId]
    const index = selectedCompanies.indexOf(companyId)
    if (index > -1) {
      selectedCompanies.splice(index, 1)
    } else {
      selectedCompanies.push(companyId)
    }
    setFormData({ ...formData, companyId: selectedCompanies })

    if (validationErrors.companyId) {
      setValidationErrors((prev) => ({
        ...prev,
        companyId: '',
      }))
    }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setValidationErrors({})
    setIsEditing(null)
    // setShowForm(false);
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.hotelName.trim()) {
      errors.hotelName = 'Hotel name is required'
    }

    if (!formData.companyId) {
      errors.companyId = 'Company is required'
    }

    if (!formData.branchId) {
      errors.branchId = 'Branch is required'
    }

    setValidationErrors(errors)

    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const selectedCompany = companies.find((c) => c.id == formData.companyId)

      const selectedBranch = branch.find((b) => b.id == formData.branchId)

      const data = new FormData()

      data.append('hotel_name', formData.hotelName)
      data.append('hotel_code', '')

      data.append('description', formData.description)

      data.append('company_id', formData.companyId)
      data.append('company_name', selectedCompany?.company_name || '')

      data.append('branch_id', formData.branchId)
      data.append('branch_name', selectedBranch?.branch_name || '')

      data.append('address', formData.address)
      data.append('city', formData.city)
      data.append('pincode', formData.pincode)

      data.append('email', formData.email)
      data.append('phone', formData.phone)

      data.append('gst_no', formData.gstNo)
      data.append('contact_person', formData.contact_person)

      if (formData.thumbnailImage) {
        data.append('thumbnail_image', formData.thumbnailImage)
      }

      if (formData.image1) {
        data.append('image1', formData.image1)
      }

      if (formData.image2) {
        data.append('image2', formData.image2)
      }

      if (formData.image3) {
        data.append('image3', formData.image3)
      }

      const url = isEditing
        ? `http://localhost:5000/api/hotels/${isEditing.id}`
        : `http://localhost:5000/api/hotels`

      const method = isEditing ? 'put' : 'post'

      await axios({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      alert(`Hotel ${isEditing ? 'updated' : 'created'} successfully`)

      resetForm()
      setShowForm(false)

      fetchBranches()
    } catch (error) {
      console.log(error)

      alert(error.response?.data?.message || 'Hotel save failed')
    }
  }

  const handleEdit = (hotel) => {
    setIsEditing(hotel)

    setValidationErrors({})

    setFormData({
      hotelName: hotel.hotel_name || '',
      description: hotel.description || '',

      address: hotel.address || '',
      city: hotel.city || '',
      pincode: hotel.pincode || '',

      email: hotel.email || '',
      phone: hotel.phone || '',

      gstNo: hotel.gst_no || '',

      companyId: hotel.company_id || '',
      companyName: hotel.company_name || '',

      branchId: hotel.branch_id || '',
      branchName: hotel.branch_name || '',
      contact_person: hotel.contact_person || '',

      thumbnailImage: null,
      image1: null,
      image2: null,
      image3: null,

      existingThumbnailImage: hotel.thumbnail_image || '',
      existingImage1: hotel.image1 || '',
      existingImage2: hotel.image2 || '',
      existingImage3: hotel.image3 || '',
    })

    setShowForm(true)
    setShowSearch(false)
  }

  const handleView = (hotel) => {
    setSelectedHotel(hotel)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await axios.delete(
          `http://localhost:5000/api/hotels/${id}`,
          getAuthHeaders(),
        )
        alert('Hotel deleted successfully!')
        fetchBranches()
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        } else alert('Delete operation failed!')
      }
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [searchFields, dateFilter, statusFilter])

  const handleSearch = () => fetchBranches()

  const resetSearch = () => {
    setSearchFields([{ field: 'hotel_name', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    fetchBranches()
  }

  const handleDownloadExcel = async () => {
    try {
      const params = {}

      const validSearch = searchFields.filter((f) => f.field && f.keyword)

      if (validSearch.length > 0) {
        params.searchFields = JSON.stringify(validSearch)
      }

      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }

      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

      const response = await axios.get(
        `http://localhost:5000/api/hotels/export`,
        {
          params,
          responseType: 'blob',
          ...getAuthHeaders(),
        },
      )

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const link = document.createElement('a')

      link.href = window.URL.createObjectURL(blob)

      link.download = `Hotels_${randomNumber}.xlsx`

      document.body.appendChild(link)

      link.click()

      document.body.removeChild(link)
    } catch (error) {
      console.error('Excel download error:', error)

      if (error.response?.status === 401) {
        localStorage.removeItem('token')

        window.location.href = '/login'

        return
      }

      alert('Failed to download Excel')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1
          className="page-title"
          style={{
            fontSize: '25px',
          }}
        >
          Hotel Management{' '}
          <span className="text-success">({branches.length})</span>
        </h1>
        <div
          className="page-actions "
          style={{
            position: 'relative',
            left: '80%',
          }}
        >
          <button
            className="search-btn btn-success p-2 me-2" // Changed class name
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
          </button>
          <button
            className="btn-primary p-2" // Changed class name
            onClick={() => {
              resetForm()
              // setIsEditing(null);
              setShowSearch(false)
              setShowForm(true)
            }}
          >
            <FaPlus /> Create New
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

      <div className="mb-4">
        <Tabs
          id="hotel-status-tabs"
          activeKey={statusFilter} // Aapka current state variable ('all', 'approved', 'deleted')
          onSelect={(key) => setStatusFilter(key)} // Tab change hone par state update hogi
          className="mb-3 d-flex gap-2" // Tabs ke beech mein spacing ke liye custom gap
        >
          {/* TOTAL HOTELS */}
          <Tab
            eventKey="all"
            title={
              <div className="text-center px-3 py-1">
                <small
                  className="d-block text-uppercase fw-semibold"
                  style={{ fontSize: '0.75rem' }}
                >
                  Total Hotels
                </small>
                <strong className="fs-4 d-block mt-1 ">
                  {counts.totalHotels}
                </strong>
              </div>
            }
          />

          {/* APPROVED HOTELS */}
          <Tab
            eventKey="approved"
            title={
              <div className="text-center px-3 py-1">
                <small
                  className="d-block text-uppercase fw-semibold"
                  style={{ fontSize: '0.75rem' }}
                >
                  Approved Hotels
                </small>
                <strong className="fs-4 d-block mt-1">
                  {counts.approvedHotels}
                </strong>
              </div>
            }
          />

          {/* DELETED HOTELS */}
          <Tab
            eventKey="deleted"
            title={
              <div className="text-center px-3 py-1">
                <small
                  className="d-block text-uppercase fw-semibold"
                  style={{ fontSize: '0.75rem' }}
                >
                  Deleted Hotels
                </small>
                <strong className="fs-4 d-block mt-1">
                  {counts.deletedHotels}
                </strong>
              </div>
            }
          />
        </Tabs>
      </div>

      {showForm && (
        <Card className="branch-card p-2">
          <h2 className="card-header mb-4">
            {isEditing ? (
              <span>Hotel Branch - {isEditing.hotel_name}</span>
            ) : (
              'Create Hotel Form'
            )}
          </h2>
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="danger">
              Please fix the validation errors below.
            </Alert>
          )}
          <Form className="branch-form" onSubmit={handleSubmit}>
            <Row>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="hotelName">
                  {/* <Form.Label>Hotel Name *</Form.Label> */}
                  <Form.Control
                    name="hotelName"
                    value={formData.hotelName}
                    onChange={handleInputChange}
                    placeholder="Enter Hotel name"
                    isInvalid={!!validationErrors.hotelName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.hotelName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="address">
                  {/* <Form.Label>Address</Form.Label> */}
                  <Form.Control
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Address"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="city">
                  {/* <Form.Label>City</Form.Label> */}
                  <Form.Control
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter your city name"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="pincode">
                  {/* <Form.Label>Pincode</Form.Label> */}
                  <Form.Control
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Pincode"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="email">
                  {/* <Form.Label>Email ID</Form.Label> */}
                  <Form.Control
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email ID"
                    type="text"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="phone">
                  {/* <Form.Label>Contact No</Form.Label> */}
                  <Form.Control
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Contact Number"
                  />
                </Form.Group>
              </Col>

              {/* <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="defPurchaseAccount">
                  <Form.Label>Def. Purchase Account</Form.Label>
                  <Form.Control
                    name="defPurchaseAccount"
                    value={formData.defPurchaseAccount}
                    onChange={handleInputChange}
                    placeholder="Def. Purchase Account"
                  />
                </Form.Group>
              </Col> */}

              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="gstNo">
                  {/* <Form.Label>GST NO</Form.Label> */}
                  <Form.Control
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleInputChange}
                    placeholder="Enter GST No"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="contact_person">
                  {/* <Form.Label>Description</Form.Label> */}
                  <Form.Control
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    placeholder="Enter contact person"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="companyId">
                  {/* <Form.Label>Select Company *</Form.Label> */}

                  <Form.Select
                    name="companyId"
                    value={formData.companyId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        companyId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Company</option>

                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="branchId">
                  {/* <Form.Label>Select Branch *</Form.Label> */}

                  <Form.Select
                    name="branchId"
                    value={formData.branchId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branchId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Branch</option>

                    {branch.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.branch_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="thumbnailImage">
                  {/* <Form.Label>Hotel Image</Form.Label> */}

                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    name="thumbnailImage"
                    onChange={handleFileChange}
                  />
                  {formData.existingThumbnailImage && (
                    <small className="text-success">
                      Current File: {formData.existingThumbnailImage}
                    </small>
                  )}
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="image1">
                  {/* <Form.Label>Image 1</Form.Label> */}

                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    name="image1"
                    onChange={handleFileChange}
                  />
                  {formData.existingImage1 && (
                    <small className="text-success">
                      Current File: {formData.existingImage1}
                    </small>
                  )}
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="image2">
                  {/* <Form.Label>Image 2</Form.Label> */}

                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    name="image2"
                    onChange={handleFileChange}
                  />
                  {formData.existingImage2 && (
                    <small className="text-success">
                      Current File: {formData.existingImage2}
                    </small>
                  )}
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="image3">
                  {/* <Form.Label>Image 3</Form.Label> */}

                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    name="image3"
                    onChange={handleFileChange}
                  />
                  {formData.existingImage3 && (
                    <small className="text-success">
                      Current File: {formData.existingImage3}
                    </small>
                  )}
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="description">
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter Description"
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr />

            <div className="form-actions d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
              >
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleSubmit}>
                {isEditing ? 'Update Hotel' : 'Save Hotel'}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {/* Branch List Table */}
      {!showForm && (
        <Card className="branch-card">
          {loading ? (
            <Alert variant="warning" className="mb-0 text-center">
              Loading...
            </Alert>
          ) : error ? (
            <Alert variant="danger" className="mb-0 text-center">
              {error}
            </Alert>
          ) : (
            <Table
              hover
              bordered
              responsive
              bordered
              hover
              className="list-table align-middle"
            >
              <thead className="table-secondary">
                <tr>
                  <th>Hotel Name</th>
                  <th>Branch Name</th>
                  <th>Address</th>
                  <th>Pincode</th>
                  <th>Companies</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={5}>No data found</td>
                  </tr>
                ) : (
                  branches.map((branch) => (
                    <tr key={branch.id}>
                      <td>{branch.hotel_name}</td>
                      <td>{branch.branch_name}</td>
                      <td>{branch.address}</td>
                      <td>{branch.pincode}</td>
                      <td>{branch.company_name || '-'}</td>
                      <td className="text-center">
                        <Dropdown>
                          <Dropdown.Toggle
                            variant="secondary"
                            size="sm"
                            id={`dropdown-${branch.id}`}
                          >
                            Action
                          </Dropdown.Toggle>

                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleView(branch)}>
                              <FaEye className="me-2 text-info" />
                              View
                            </Dropdown.Item>

                            <Dropdown.Item onClick={() => handleEdit(branch)}>
                              <FaPen className="me-2 text-primary" />
                              Edit
                            </Dropdown.Item>

                            <Dropdown.Item
                              onClick={() => handleDelete(branch.id)}
                            >
                              <FaTrashAlt className="me-2 text-danger" />
                              Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* VIEW HOTEL MODAL */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Hotel Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedHotel && (
            <Row>
              <Col md={6} className="mb-3">
                <strong>Hotel Name:</strong>
                <div>{selectedHotel.hotel_name}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Branch Name:</strong>
                <div>{selectedHotel.branch_name}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Company:</strong>
                <div>{selectedHotel.company_name}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>City:</strong>
                <div>{selectedHotel.city}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Pincode:</strong>
                <div>{selectedHotel.pincode}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Email:</strong>
                <div>{selectedHotel.email}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Phone:</strong>
                <div>{selectedHotel.phone}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>GST No:</strong>
                <div>{selectedHotel.gst_no}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Contact Person:</strong>
                <div>{selectedHotel.contact_person}</div>
              </Col>

              <Col md={12} className="mb-3">
                <strong>Address:</strong>
                <div>{selectedHotel.address}</div>
              </Col>

              <Col md={12} className="mb-3">
                <strong>Description:</strong>
                <div>{selectedHotel.description}</div>
              </Col>

              {/* IMAGE */}
              <Col md={12} className="mb-3">
                {selectedHotel.thumbnail_image && (
                  <Col md={12} className="mb-3 text-center">
                    <img
                      src={`http://localhost:5000/uploads/${selectedHotel.thumbnail_image}`}
                      alt="Hotel"
                      className="img-fluid rounded"
                      style={{
                        maxHeight: '250px',
                        objectFit: 'cover',
                      }}
                    />
                  </Col>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default HotelPage
