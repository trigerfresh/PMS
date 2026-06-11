import React, { useState, useEffect } from 'react'
import axios from 'axios'
import SearchPanel from '../../utils/FilterPanel'
import Pagination from '../../utils/Pagination'
import {
  FaPen,
  FaTrashAlt,
  FaEye,
  FaPlus,
  FaSearch,
  FaArrowLeft,
} from 'react-icons/fa'
import { BsThreeDotsVertical } from 'react-icons/bs'
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Image,
  Modal,
  Row,
  Table,
  Dropdown,
  Tabs,
  Tab,
  Container,
} from 'react-bootstrap'
import defaultImg from './download.jfif'
import './Company.css'

const API_BASE_URL = `http://localhost:5000/api`
const IMAGE_BASE_URL = `http://localhost:5000/uploads`

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [isEditing, setIsEditing] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [logoPreview, setLogoPreview] = useState(null)

  // Dropdown and Form state
  const [roles, setRoles] = useState([])
  const [companies, setCompanies] = useState([])
  const [clients, setClients] = useState([])
  const [sites, setSites] = useState([])
  const [branches, setBranches] = useState([])
  const [profileImageFile, setProfileImageFile] = useState(null)
  const [activeTab, setActiveTab] = useState('active')

  const [deletedUsers, setDeletedUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const initialFormData = {
    first_name: '',
    last_name: '',
    fullname: '',
    email: '',
    password: '',
    phone: '',
    role: '',
    address: '',
    city: '',
    pincode: '',
    company_id: '',
    branch_id: '',
  }
  const [formData, setFormData] = useState(initialFormData)
  const [viewUser, setViewUser] = useState(null) // For the view modal

  // Dual list box state
  const [availableClients, setAvailableClients] = useState([])
  const [selectedClients, setSelectedClients] = useState([])

  // Search Panel State
  const [searchFields, setSearchFields] = useState([
    { field: 'name', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })
  const userSearchOptions = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Role' },
    { value: 'branch_name', label: 'Branch' },
    { value: 'contactNo', label: 'Contact No' },
  ]

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  const fetchactiveUsers = async () => {
    const res = await axios.get(`${API_BASE_URL}/users`)
    setUsers(res.data)
  }

  const fetchDeletedUsers = async () => {
    const res = await axios.get(`${API_BASE_URL}/users/deleted`)

    setDeletedUsers(res.data.data || [])
    setCurrentPage(1)
  }

  const handleRestore = async (id) => {
    if (!window.confirm('Restore this user?')) return

    try {
      await axios.put(
        `${API_BASE_URL}/users/restore/${id}`,
        {},
        getAuthHeaders(),
      )

      alert('User restored successfully')

      fetchUsers()
      fetchDeletedUsers()
    } catch (err) {
      alert('Failed to restore user')
    }
  }

  // --- Data Fetching ---
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      const validSearch = searchFields.filter((f) => f.field && f.keyword)
      if (validSearch.length > 0) {
        validSearch.forEach((f) => {
          if (f.field === 'name') params.fullname = f.keyword
          if (f.field === 'email') params.email = f.keyword
          if (f.field === 'role') params.role = f.keyword
          if (f.field === 'branch_name') params.branch = f.keyword
          if (f.field === 'contactNo') params.phone = f.keyword
        })
      }

      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }

      let res
      if (validSearch.length > 0) {
        // Use the search endpoint which is a POST route taking query params
        res = await axios.post(
          `${API_BASE_URL}/users/search`,
          {},
          {
            params,
            ...getAuthHeaders(),
          },
        )
      } else {
        // Default to normal GET endpoint
        res = await axios.get(`${API_BASE_URL}/users`, {
          params,
          ...getAuthHeaders(),
        })
      }

      const data = res.data

      setUsers(Array.isArray(data) ? data : data?.data || data?.users || [])
      setCurrentPage(1)
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else setError('Failed to load branches.')
      // console.error("Failed to fetch users", error);
    } finally {
      setLoading(false)
    }
  }

  // Single useEffect for all initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        const companiesRes = await axios.get(
          `${API_BASE_URL}/companies`,
          getAuthHeaders(),
        )

        const rolesRes = await axios.get(
          `${API_BASE_URL}/users/`,
          getAuthHeaders(),
        )

        const branchesRes = await axios.get(
          `${API_BASE_URL}/branch`,
          getAuthHeaders(),
        )

        setCompanies(companiesRes.data.data)
        setRoles(rolesRes.data)
        setBranches(branchesRes.data.data || [])
      } catch (error) {
        console.log('FULL ERROR =>', error)
        setError('Failed to fetch dropdown data')
      } finally {
        await fetchUsers()
        await fetchDeletedUsers()
      }
    }
    fetchInitialData()
    // console.log(clients, availableClients);
  }, [])

  // Branch dropdown is filtered client-side based on the selected company
  // --- Form Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target

    console.log('FIELD =>', name)
    console.log('VALUE =>', value)

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      }

      // Automatically sync first_name and last_name when fullname is changed
      if (name === 'fullname') {
        const parts = value.trim().split(/\s+/)
        updated.first_name = parts[0] || ''
        updated.last_name = parts.slice(1).join(' ') || ''
      }

      return updated
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setProfileImageFile(e.target.files[0])
    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setIsEditing(null)
    setLogoPreview(null)
    setValidationErrors({})
    setSelectedClients([])
    setProfileImageFile(null)
    setAvailableClients(clients)
  }

  const validateForm = () => {
    const newErrors = {}

    // Full Name
    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required'
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Password
    if (!isEditing && !formData.password) {
      newErrors.password = 'Password is required'
    }

    // Phone
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Contact number must be 10 digits'
    }

    // Role
    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    // Company
    if (!formData.company_id) {
      newErrors.company_id = 'Company is required'
    }

    // Branch
    if (!formData.branch_id) {
      newErrors.branch_id = 'Branch is required'
    }

    // Pincode
    const pincodeRegex = /^[1-9][0-9]{5}$/

    if (formData.pincode && !pincodeRegex.test(formData.pincode)) {
      newErrors.pincode = 'Please enter valid 6 digit pincode'
    }

    setValidationErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      alert('Please fix validation errors')
      return
    }

    try {
      const data = new FormData()

      // Sync name fields just in case before submitting
      let derivedFirstName = formData.first_name
      let derivedLastName = formData.last_name
      if (formData.fullname && (!derivedFirstName || !derivedLastName)) {
        const parts = formData.fullname.trim().split(/\s+/)
        derivedFirstName = parts[0] || ''
        derivedLastName = parts.slice(1).join(' ') || ''
      }

      data.append('first_name', derivedFirstName)
      data.append('last_name', derivedLastName)
      data.append('fullname', formData.fullname)
      data.append('email', formData.email)
      data.append('password', formData.password)
      data.append('role', formData.role)
      data.append('phone', formData.phone)
      data.append('address', formData.address)
      data.append('city', formData.city)
      data.append('pincode', formData.pincode)
      data.append('company_id', formData.company_id)
      data.append('branch_id', formData.branch_id)

      if (profileImageFile) {
        data.append('profile_image', profileImageFile)
      }

      const config = {
        headers: {
          ...getAuthHeaders().headers,
        },
      }

      if (isEditing) {
        await axios.put(`${API_BASE_URL}/users/${isEditing.id}`, data, config)

        alert('User updated successfully')
      } else {
        await axios.post(`${API_BASE_URL}/users`, data, config)

        alert('User created successfully')
      }

      setShowForm(false)

      resetForm()

      fetchUsers()
    } catch (error) {
      console.error(error)

      alert(error.response?.data?.message || 'Failed to save user')
    }
  }

  // === ACTION HANDLERS (UPDATED) ===
  const handleEdit = (user) => {
    console.log('EDIT USER =>', user)

    setIsEditing(user)

    const derivedFullname =
      user.fullname || `${user.first_name || ''} ${user.last_name || ''}`.trim()

    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      fullname: derivedFullname || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: user.role || '',
      address: user.address || '',
      city: user.city || '',
      pincode: user.pincode || '',
      company_id: user.company_id ? String(user.company_id) : '',
      branch_id: user.branch_id ? String(user.branch_id) : '',
    })

    setLogoPreview(
      user.profile_image ? `${IMAGE_BASE_URL}/${user.profile_image}` : null,
    )

    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API_BASE_URL}/users/${id}`, getAuthHeaders())
        alert('User deleted successfully')
        fetchUsers()
        fetchDeletedUsers()
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        } else alert('Failed to delete user')
        // console.error(error);
      }
    }
  }
  const handleView = (user) => setViewUser(user)

  // --- Search and Dual List Box Handlers ---
  const handleSearch = () => {
    fetchUsers()
  }

  useEffect(() => {
    setCurrentPage(1)
    if (activeTab === 'active') {
      fetchUsers()
    } else {
      fetchDeletedUsers()
    }
  }, [activeTab, searchFields, dateFilter])

  const resetSearch = () => {
    setSearchFields([{ field: 'email', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    setCurrentPage(1)
    fetchUsers()
  }

  const handleDownloadExcel = async () => {
    try {
      const params = {}
      const validSearch = searchFields.filter((f) => f.field && f.keyword)
      if (validSearch.length > 0)
        params.searchFields = JSON.stringify(validSearch)

      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }

      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

      const response = await axios.get(`${API_BASE_URL}/users/export`, {
        params,
        responseType: 'blob', // IMPORTANT
        ...getAuthHeaders(),
      })

      // Create Excel File
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `Users_${randomNumber}.xlsx`
      link.click()
    } catch (error) {
      // Axios sends 401 here
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      console.error('Excel download error:', error)
      alert('Failed to download Excel. Please try again.')
    }
  }

  const moveItems = (source, dest, setSource, setDest, itemIds) => {
    const itemsToMove = source.filter((item) =>
      itemIds.includes(String(item.id)),
    )

    const remainingSource = source.filter(
      (item) => !itemIds.includes(String(item.id)),
    )

    setSource(remainingSource)

    setDest(
      [...dest, ...itemsToMove].sort((a, b) =>
        (a.company_name || '').localeCompare(b.company_name || ''),
      ),
    )
  }
  const handleSelectClients = (all = false) => {
    const selectedIds = all
      ? availableClients.map((c) => String(c.id))
      : Array.from(
        document.getElementById('availableClients').selectedOptions,
      ).map((opt) => opt.value)
    moveItems(
      availableClients,
      selectedClients,
      setAvailableClients,
      setSelectedClients,
      selectedIds,
    )
  }
  const handleDeselectClients = (all = false) => {
    const selectedIds = all
      ? selectedClients.map((c) => String(c.id))
      : Array.from(
        document.getElementById('selectedClients').selectedOptions,
      ).map((opt) => opt.value)
    moveItems(
      selectedClients,
      availableClients,
      setSelectedClients,
      setAvailableClients,
      selectedIds,
    )
  }

  // === FETCH SITES BY SELECTED CLIENTS ===
  const fetchSitesByClientIds = async (selectedClientList) => {
    if (!selectedClientList || selectedClientList.length === 0) {
      console.log('No clients selected for site fetch.')
      return []
    }

    try {
      const clientIds = selectedClientList.map((c) => ({ $oid: c._id }))
      const res = await axios.post(
        `${API_BASE_URL}/clients/sites/by-client-ids`,
        { clientIds },
        getAuthHeaders(),
      )
      // console.log("Fetched Sites:", res.data.data);
      return res.data.data
    } catch (error) {
      console.error('Failed to fetch sites by client IDs:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return []
    }
  }

  // Inside handleSelectClients or handleDeselectClients
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const sites = await fetchSitesByClientIds(selectedClients)
        // console.log("Sites for selected clients:", sites);
        setSites(sites)
      } catch (error) {
        console.error('Failed to fetch sites by client IDs:', error)
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
      }
    }

    if (selectedClients.length > 0) {
      fetchSites()
    }
  }, [selectedClients])

  // --- RENDER ---
  return (
    <Container fluid className="page-container" style={{
      background: 'linear-gradient(135deg, #f6f8fc 0%, #e9edf5 100%)',
      minHeight: '100vh',
      transition: 'background-color 0.5s ease',
    }}>
      <Modal
        show={!!viewUser}
        onHide={() => setViewUser(null)}
        centered
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {viewUser && (
            <>
              <p>
                <strong>Name:</strong> {viewUser.first_name}{' '}
                {viewUser.last_name}
              </p>
              <p>
                <strong>Email:</strong> {viewUser.email}
              </p>
              <p>
                <strong>Role:</strong> {viewUser.role || 'N/A'}
              </p>
              <p>
                <strong>Company:</strong> {viewUser.company_id || 'N/A'}
              </p>
              <p>
                <strong>Branch:</strong> {viewUser.branch_id || 'N/A'}
              </p>

              {viewUser.profile_image && (
                <div className="text-center mt-3">
                  <Image
                    src={`${IMAGE_BASE_URL}/${viewUser.profile_image}`}
                    alt={viewUser.name}
                    roundedCircle
                    fluid
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setViewUser(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* UNIFIED HEADER */}
      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-2 border-bottom gap-3">
        <h1 className="page-title mb-0" style={{ fontSize: '25px' }}>
          {showForm
            ? isEditing
              ? `Edit User - ${isEditing.name || isEditing.fullname || isEditing.first_name}`
              : 'Create New User'
            : 'User Management'}{' '}
          {!showForm && <span className="text-success">({users.length})</span>}
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
            className={`shadow-sm rounded-3 ${showForm ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              if (showForm) {
                setShowForm(false)
                setIsEditing(null)
                resetForm()
              } else {
                resetForm()
                setIsEditing(null)
                setShowForm(true)
                setShowSearch(false)
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
        <Card className="dashboard-card shadow-sm border-0 rounded-4 overflow-hidden mb-4" style={{ transition: 'all 0.3s ease' }}>
          <Card.Body className="p-4">
          <h2 className="mb-4 fw-bold text-secondary" style={{ fontSize: '1.5rem' }}>
            {isEditing ? (
              <span>Edit User - {isEditing.name || isEditing.fullname || isEditing.first_name}</span>
            ) : (
              'User Details'
            )}
          </h2>
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="danger">
              Please fix the validation errors below.
            </Alert>
          )}
          <Form className="user-form" onSubmit={handleSubmit}>
            <Row>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="name">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    name="fullname"
                    placeholder="Enter full name"
                    value={formData.fullname || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.fullname}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.fullname}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="email">
                  <Form.Label>Email ID *</Form.Label>
                  <Form.Control
                    name="email"
                    placeholder="Email"
                    type="text"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="password">
                  <Form.Label>
                    {isEditing ? 'New password (optional)' : 'Password *'}
                  </Form.Label>
                  <Form.Control
                    name="password"
                    placeholder={
                      isEditing ? 'Enter new password (optional)' : 'Password'
                    }
                    type="password"
                    value={formData.password || ''}
                    onChange={handleInputChange}
                    isInvalid={!isEditing && !!validationErrors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="contactNo">
                  <Form.Label>Contact No</Form.Label>
                  <Form.Control
                    name="phone"
                    placeholder="Contact No"
                    value={formData.phone || ''}
                    isInvalid={!!validationErrors.phone}
                    onChange={handleInputChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="address">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    name="address"
                    as={'textarea'}
                    placeholder="Address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="city">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    name="city"
                    placeholder="City"
                    value={formData.city || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="pincode">
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    name="pincode"
                    placeholder="Pincode"
                    value={formData.pincode || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.pincode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.pincode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="roleId">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.role}
                  >
                    <option value="">Select Role</option>

                    {roles.map((role) => (
                      <option key={role.id} value={role.role}>
                        {role.role}
                      </option>
                    ))}
                  </Form.Select>

                  <Form.Control.Feedback type="invalid">
                    {validationErrors.role}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="company">
                  <Form.Label>Company *</Form.Label>
                  <Form.Select
                    name="company_id"
                    value={formData.company_id || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.company_id}
                  >
                    <option value="">Select Company</option>

                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </Form.Select>

                  <Form.Control.Feedback type="invalid">
                    {validationErrors.company_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="branch">
                  <Form.Label>Branch *</Form.Label>
                  <Form.Select
                    name="branch_id"
                    value={formData.branch_id || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.branch_id}
                  >
                    <option value="">Select Branch</option>

                    {branches
                      .filter((item) => {
                        const isActive = item.active == 0
                        let isAssigned = false
                        if (formData.company_id) {
                          const selectedCompanyId = String(formData.company_id)
                          if (item.company_id) {
                            const assignedCompanyIds = item.company_id
                              .split(',')
                              .map((id) => id.trim())
                            isAssigned =
                              assignedCompanyIds.includes(selectedCompanyId)
                          }
                        }
                        return isActive && isAssigned
                      })
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name}
                        </option>
                      ))}
                  </Form.Select>

                  <Form.Control.Feedback type="invalid">
                    {validationErrors.branch_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="profileImage">
                  <Form.Label>Profile Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    name="profile_image"
                    onChange={handleFileChange}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="logo preview"
                    style={{
                      width: '180px',
                      height: '200px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                )}
              </Col>
            </Row>

            <Row
              className="d-flex justify-content-center align-items-center text-center"
            // style={{ minHeight: "250px" }}
            >
              {/* <Col
                xs={12}
                md={5}
                className="d-flex justify-content-center align-items-center"
              >
                <Card className="user-card  w-100 p-3">
                  <Form.Label>Available Clients</Form.Label>
                  <Form.Select
                    id="availableClients"
                    multiple
                    className="dual-list-select"
                  >
                    {availableClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </Form.Select>
                </Card>
              </Col> */}
              {/* <Col
                // md={2}
                className="d-flex flex-column mb-3 gap-2 align-items-center justify-content-center"
              >
                <Button
                  type="button"
                  variant="secondary"
                  className="w-100"
                  onClick={() => handleSelectClients(true)}
                >
                  &gt;&gt;
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-100"
                  onClick={() => handleSelectClients(false)}
                >
                  &gt;
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-100"
                  onClick={() => handleDeselectClients(false)}
                >
                  &lt;
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-100"
                  onClick={() => handleDeselectClients(true)}
                >
                  &lt;&lt;
                </Button>
              </Col> */}
              {/* <Col
                xs={12}
                md={5}
                className="d-flex justify-content-center align-items-center"
              > */}
              {/* <Card className="user-card  w-100 p-3">
                  <Form.Label>Assigned Clients</Form.Label>
                  <Form.Select
                    id="selectedClients"
                    multiple
                    className="dual-list-select"
                  > */}
              {/* {selectedClients
                      .filter((c) => c)
                      .map((c) => (
                        <option key={c?.id} value={c?.id}>
                          {c?.company_name}
                          {/* {c?._id} */}
              {/* </option> */}
              {/* ))} */}
              {/* </Form.Select> */}
              {/* </Card> */}
              {/* </Col> */}
            </Row>

            <div className="form-actions d-flex justify-content-end gap-2 mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false)
                  setIsEditing(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="success" className="px-4">
                {isEditing ? 'Update User' : 'Save User'}
              </Button>
            </div>
          </Form>
          </Card.Body>
        </Card>
      ) : (
      /* User Status Tabs & Table */
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
              searchOptions={userSearchOptions}
            />
          )}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3 custom-bootstrap-tabs"
            style={{ overflow: 'visible', flexWrap: 'wrap' }}
          >
            <Tab eventKey="active" title={`Active Users (${users.length})`} />
            <Tab
              eventKey="deleted"
              title={`Deleted Users (${deletedUsers.length})`}
            />
          </Tabs>
          {loading ? (
            <Alert variant="warning" className="mb-0 text-center">
              Loading...
            </Alert>
          ) : error ? (
            <Alert variant="danger" className="mb-0 text-center">
              {error}
            </Alert>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Users List</h5>

                <div className="d-flex align-items-center gap-2">
                  <span>Show:</span>

                  <Form.Select
                    style={{ width: '120px' }}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={150}>150</option>
                  </Form.Select>
                </div>
              </div>
              <div className="table-responsive" style={{ overflowX: 'auto', minHeight: '200px' }}>
                <Table
                  bordered
                  hover
                  responsive
                  className="list-table align-middle table-sm w-100 shadow-sm mb-0"
                  style={{ fontSize: '13px' }}
                >
                  <thead className="table-light text-center text-secondary">
                    <tr>
                      <th className="text-center fw-semibold px-3 py-2 text-nowrap">Name</th>
                      <th className="fw-semibold px-3 py-2 text-nowrap">Email ID</th>
                      <th className="fw-semibold px-3 py-2 text-nowrap">Role</th>
                      <th className="fw-semibold px-3 py-2 text-nowrap">Branch</th>
                      <th className="fw-semibold px-3 py-2 text-nowrap">Contact No</th>
                      <th className="text-center fw-semibold px-3 py-2 text-nowrap">Actions</th>
                    </tr>
                  </thead>
                <tbody className="text-center">
                  {activeTab === 'active' ? (
                    users.length === 0 ? (
                      <tr>
                        <td colSpan="6">No active users found</td>
                      </tr>
                    ) : (
                      users
                        .slice(
                          (currentPage - 1) * pageSize,
                          currentPage * pageSize,
                        )
                        .map((user) => (
                          <tr key={user.id}>
                            <td>
                              <div className="info">
                                <img
                                  src={
                                    user.profile_image
                                      ? `${IMAGE_BASE_URL}/${user.profile_image}`
                                      : defaultImg
                                  }
                                  style={{
                                    height: '30px',
                                  }}
                                  alt={user.first_name}
                                  className="user-avatar"
                                  onError={(e) => {
                                    e.target.src = defaultImg
                                  }}
                                />
                                <div className="user-details">
                                  <span className="user-name">
                                    {user.fullname ||
                                      user.name ||
                                      user.first_name}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.branch_name || 'NA'}</td>
                            <td>{user.phone || 'NA'}</td>

                            <td>
                              <Dropdown drop="start">
                                <Dropdown.Toggle variant="secondary" size="sm">
                                  <BsThreeDotsVertical />
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                  <Dropdown.Item
                                    onClick={() => handleView(user)}
                                  >
                                    <FaEye className="me-2 text-info" />
                                    View
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    onClick={() => handleEdit(user)}
                                  >
                                    <FaPen className="me-2 text-primary" />
                                    Edit
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => handleDelete(user.id)}
                                  >
                                    <FaTrashAlt className="me-2" />
                                    Delete
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))
                    )
                  ) : deletedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6">No deleted users found</td>
                    </tr>
                  ) : (
                    deletedUsers
                      .slice(
                        (currentPage - 1) * pageSize,
                        currentPage * pageSize,
                      )
                      .map((user) => (
                        <tr key={user.id}>
                          <td>{user.fullname}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>{user.branch_name}</td>
                          <td>{user.phone}</td>

                          <td>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleRestore(user.id)}
                            >
                              Restore
                            </Button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </Table>
              <Pagination
                totalItems={
                  activeTab === 'active' ? users.length : deletedUsers.length
                }
                itemsPerPage={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
            </>
          )}
          </Card.Body>
        </Card>
      )}
    </Container>
  )
}

export default Users
