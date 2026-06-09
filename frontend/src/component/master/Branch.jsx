import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  FaPlus,
  FaSearch,
  FaPen,
  FaTrashAlt,
  FaEye,
  FaEllipsisV,
  FaArrowLeft,
} from 'react-icons/fa' // Import icons
import SearchPanel from '../../utils/FilterPanel'
import Pagination from '../../utils/Pagination'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  Row,
  Table,
  Modal,
  Tabs,
  Tab,
} from 'react-bootstrap'
import { BsThreeDotsVertical } from 'react-icons/bs'

const BranchPage = () => {
  const [branches, setBranches] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [isEditing, setIsEditing] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [showView, setShowView] = useState(false)
  const [viewData, setViewData] = useState(null)
  const [pageSize, setPageSize] = useState(10)

  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [counts, setCounts] = useState({
    totalBranches: 0,
    approvedBranches: 0,
    deletedBranches: 0,
  })

  const initialFormData = {
    branchName: '',
    areaName: '',
    email: '',
    costingMethod: 'FIFO',
    defSalesAccount: '',
    defBranchDispAccount: '',
    address: '',
    pincode: '',
    contactNo: '',
    defPurchaseAccount: '',
    defBranchRecvAccount: '',
    companyId: [],
  }
  const [formData, setFormData] = useState(initialFormData)

  const [searchFields, setSearchFields] = useState([
    { field: 'branchName', keyword: '' },
    // { field: 'address', keyword: '' },
    // { field: 'pincode', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  const branchSearchOptions = [
    { value: 'branchName', label: 'Branch Name' },
    { value: 'address', label: 'Address' },
    { value: 'pincode', label: 'Pincode' },
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
      // Fetch active branches
      const activeRes = await axios.get(`http://localhost:5000/api/branch`, {
        params: { ...params, status: 'active' },
        ...getAuthHeaders(),
      })
      const activeData = activeRes.data.data || []

      // Fetch deleted branches
      const deletedRes = await axios.get(`http://localhost:5000/api/branch`, {
        params: { ...params, status: 'deleted' },
        ...getAuthHeaders(),
      })
      const deletedData = deletedRes.data.data || []

      if (statusFilter === 'deleted') {
        setBranches(deletedData)
      } else {
        setBranches(activeData)
      }

      setCounts({
        totalBranches: activeData.length + deletedData.length,
        approvedBranches: activeData.length,
        deletedBranches: deletedData.length,
      })
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else setError('Failed to load branches.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchBranches()
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
    setCurrentPage(1)
    fetchBranches()
  }, [searchFields, dateFilter, statusFilter])

  useEffect(() => {
    fetchCompanies()
  }, [])

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

    if (!formData.branchName.trim()) {
      errors.branchName = 'Branch name is required.'
    }

    if (!formData.companyId || formData.companyId.length === 0) {
      errors.companyId = 'Please select at least one company.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      alert('Please fix validation errors')
      return
    }

    try {
      const selectedCompanyNames = companies
        .filter((c) => formData.companyId.includes(c.id))
        .map((c) => c.company_name)
        .join(',')

      const payload = {
        branch_name: formData.branchName,
        branch_code: '',
        company_name: selectedCompanyNames,
        company_id: formData.companyId.join(','),

        email: formData.email,
        address: formData.address,
        city: formData.areaName,
        pincode: formData.pincode,

        costing_method: formData.costingMethod,
        def_purchase_ac: formData.defPurchaseAccount,
        def_sales_ac: formData.defSalesAccount,
        def_branch_recv_ac: formData.defBranchRecvAccount,
        def_branch_desp_ac: formData.defBranchDispAccount,

        phone: formData.contactNo,
        branch_id: isEditing?.branch_id || '',
      }

      const url = isEditing
        ? `http://localhost:5000/api/branch/${isEditing.id}`
        : `http://localhost:5000/api/branch`

      const method = isEditing ? 'put' : 'post'

      await axios[method](url, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      console.log(url)

      alert(`Branch ${isEditing ? 'updated' : 'created'} successfully!`)

      resetForm()
      setShowForm(false)
      fetchBranches()
    } catch (err) {
      console.error(err)

      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Operation failed',
      )
    }
  }

  const handleEdit = (branch) => {
    setIsEditing(branch)

    setValidationErrors({})

    setFormData({
      branchName: branch.branch_name || '',
      areaName: branch.city || '',
      email: branch.email || '',
      costingMethod: branch.costing_method || 'FIFO',

      defSalesAccount: branch.def_sales_ac || '',
      defBranchDispAccount: branch.def_branch_desp_ac || '',

      address: branch.address || '',
      pincode: branch.pincode || '',
      contactNo: branch.phone || '',

      defPurchaseAccount: branch.def_purchase_ac || '',
      defBranchRecvAccount: branch.def_branch_recv_ac || '',

      companyId: branch.company_id
        ? branch.company_id.split(',').map(Number)
        : [],
    })

    setShowForm(true)
    setShowSearch(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await axios.delete(
          `http://localhost:5000/api/branch/${id}`,
          getAuthHeaders(),
        )
        alert('Branch deleted successfully!')
        fetchBranches()
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        } else {
          alert('Delete failed!')
        }
      }
    }
  }

  const handleRestore = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/branch/restore/${id}`,
        {},
        getAuthHeaders(),
      )
      alert('Branch restored successfully!')
      fetchBranches()
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        alert('Restore failed!')
      }
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [searchFields, dateFilter])

  // const handleSearch = () => fetchBranches()

  const resetSearch = () => {
    setSearchFields([{ field: 'branchName', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    fetchBranches()
  }

  const handleDownloadExcel = async () => {
    try {
      const params = {}

      const validSearch = searchFields.filter((f) => f.field && f.keyword)

      if (validSearch.length) {
        params.searchFields = JSON.stringify(validSearch)
      }

      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }

      const res = await axios.get('http://localhost:5000/api/branch/export', {
        params,
        responseType: 'blob',
        ...getAuthHeaders(),
      })

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const url = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = 'branches.xlsx'
      document.body.appendChild(a)
      a.click()

      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)

      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      alert(error.response?.data?.message || 'Excel download failed')
    }
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
          {showForm
            ? isEditing
              ? 'Edit Branch'
              : 'Create Branch'
            : 'Branch Management'}{' '}
          {!showForm && (
            <span className="text-success">({branches.length})</span>
          )}
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
          )}
          <button
            type="button"
            className={`${showForm ? 'btn-danger' : 'btn-primary'} shadow-sm rounded-3`}
            onClick={() => {
              if (showForm) {
                resetForm()
                setShowForm(false)
              } else {
                resetForm()
                setShowSearch(false)
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

      {showForm && (
        <Card className="branch-card">
          <h2 className="card-header mb-4">
            {isEditing ? (
              <span>Edit Branch - {isEditing.branch_name}</span>
            ) : (
              ''
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
                <Form.Group controlId="branchName">
                  <Form.Label>Branch Name *</Form.Label>
                  <Form.Control
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleInputChange}
                    placeholder="Enter Branch name"
                    isInvalid={!!validationErrors.branchName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.branchName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="address">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Address"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="areaName">
                  <Form.Label>Area Name</Form.Label>
                  <Form.Control
                    name="areaName"
                    value={formData.areaName}
                    onChange={handleInputChange}
                    placeholder="Enter your area name"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="pincode">
                  <Form.Label>Pincode</Form.Label>
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
                  <Form.Label>Email ID</Form.Label>
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
                <Form.Group controlId="contactNo">
                  <Form.Label>Contact No</Form.Label>
                  <Form.Control
                    name="contactNo"
                    value={formData.contactNo}
                    onChange={handleInputChange}
                    placeholder="Contact No"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="costingMethod">
                  <Form.Label>Costing Method</Form.Label>
                  <Form.Select
                    name="costingMethod"
                    value={formData.costingMethod}
                    onChange={handleInputChange}
                  >
                    <option value="FIFO">FIFO</option>
                    <option value="LIFO">LIFO</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="defPurchaseAccount">
                  <Form.Label>Def. Purchase Account</Form.Label>
                  <Form.Control
                    name="defPurchaseAccount"
                    value={formData.defPurchaseAccount}
                    onChange={handleInputChange}
                    placeholder="Def. Purchase Account"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="defSalesAccount">
                  <Form.Label>Def. Sales Account</Form.Label>
                  <Form.Control
                    name="defSalesAccount"
                    value={formData.defSalesAccount}
                    onChange={handleInputChange}
                    placeholder="Def. Sales Account"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="defBranchRecvAccount">
                  <Form.Label>Def. Branch Recv. Account</Form.Label>
                  <Form.Control
                    name="defBranchRecvAccount"
                    value={formData.defBranchRecvAccount}
                    onChange={handleInputChange}
                    placeholder="Def. Branch Recv. Account"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="defBranchDispAccount">
                  <Form.Label>Def. Branch Disp. Account</Form.Label>
                  <Form.Control
                    name="defBranchDispAccount"
                    value={formData.defBranchDispAccount}
                    onChange={handleInputChange}
                    placeholder="Def. Branch Disp. Account"
                  />
                </Form.Group>
              </Col>
            </Row>
            <hr />
            <div className="mb-3 branch-company-selection">
              <h4 className="fs-5">Select Company *</h4>
              <div className="d-flex flex-wrap gap-3 mb-2">
                {companies.map((company) => (
                  <Form.Check
                    key={company.id}
                    type="checkbox"
                    id={`company-${company.id}`}
                    label={company.company_name}
                    checked={formData.companyId.includes(company.id)}
                    onChange={() => handleCompanySelection(company.id)}
                    isInvalid={!!validationErrors.companyId}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCompanySelection(company.id) // ✅ call directly
                      }
                    }}
                  />
                ))}
              </div>
              {validationErrors.companyId && (
                <div className="invalid-feedback d-block">
                  {validationErrors.companyId}
                </div>
              )}
            </div>

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
                {isEditing ? 'Update Company' : 'Save Company'}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {/* Branch Status Tabs */}
      {!showForm && (
        <div className="mb-4">
          <Tabs
            id="branch-status-tabs"
            activeKey={statusFilter}
            onSelect={(key) => setStatusFilter(key)}
            className="mb-3 custom-bootstrap-tabs"
          >
            {/* <Tab
              eventKey="all"
              title={`Total (${counts.totalBranches})`}
            /> */}
            <Tab
              eventKey="approved"
              title={`Approved (${counts.approvedBranches})`}
            />
            <Tab
              eventKey="deleted"
              title={`Deleted (${counts.deletedBranches})`}
            />
          </Tabs>
        </div>
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
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h4 className="mb-0">Branch List</h4>

                <div className="d-flex align-items-center gap-2">
                  <span>Show:</span>

                  <Form.Select
                    style={{ width: '120px' }}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1) // reset page
                    }}
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={150}>150</option>
                  </Form.Select>
                </div>
              </div>
              <Table
                hover
                bordered
                className="list-table align-middle table-sm w-auto"
              >
                <thead className="table text-center">
                  <tr>
                    <th width="10">Branch Name</th>
                    <th width="10">Address</th>
                    <th width="10">Pincode</th>
                    <th width="10">Companies</th>
                    <th width="10">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {branches.length === 0 ? (
                    <tr className="text-center">
                      <td colSpan={5}>No data found</td>
                    </tr>
                  ) : (
                    branches
                      .slice(
                        (currentPage - 1) * pageSize,
                        currentPage * pageSize,
                      )
                      .map((branch) => (
                        <tr key={branch.id}>
                          <td>{branch.branch_name}</td>
                          <td>{branch.address}</td>
                          <td>{branch.pincode}</td>
                          <td>{branch.company_name || '-'}</td>

                          <td>
                            <Dropdown align="end">
                              <Dropdown.Toggle
                                variant="outline-secondary"
                                size="sm"
                                id={`dropdown-${branch.id}`}
                                className="bg-secondary text-white shadow-sm border"
                              >
                                <BsThreeDotsVertical />
                              </Dropdown.Toggle>

                              <Dropdown.Menu
                                popperConfig={{ strategy: 'fixed' }}
                              >
                                {/* VIEW */}
                                <Dropdown.Item
                                  onClick={() => {
                                    setViewData(branch)
                                    setShowView(true)
                                  }}
                                >
                                  <FaEye className="me-2 text-info" />
                                  View
                                </Dropdown.Item>

                                {/* EDIT */}
                                <Dropdown.Item
                                  onClick={() => handleEdit(branch)}
                                >
                                  <FaPen className="me-2 text-primary" />
                                  Edit
                                </Dropdown.Item>

                                {/* 🔴 ACTIVE = 0 → SHOW NORMAL DELETE */}
                                {branch.active == 0 && (
                                  <Dropdown.Item
                                    onClick={() => handleDelete(branch.id)}
                                    className="text-danger"
                                  >
                                    <FaTrashAlt className="me-2" />
                                    Delete
                                  </Dropdown.Item>
                                )}

                                {/* 🟢 ACTIVE = 1 → ONLY RESTORE */}
                                {branch.active == 1 && (
                                  <Dropdown.Item
                                    onClick={() => handleRestore(branch.id)}
                                  >
                                    ♻️ Restore
                                  </Dropdown.Item>
                                )}
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </Table>
              <Pagination
                totalItems={branches.length}
                itemsPerPage={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </Card>
      )}
      <Modal show={showView} onHide={() => setShowView(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Branch Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>
            <b>Name:</b> {viewData?.branch_name}
          </p>
          <p>
            <b>Address:</b> {viewData?.address}
          </p>
          <p>
            <b>Pincode:</b> {viewData?.pincode}
          </p>
          <p>
            <b>Company:</b> {viewData?.company_name}
          </p>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default BranchPage
