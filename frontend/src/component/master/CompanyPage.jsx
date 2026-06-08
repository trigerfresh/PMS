import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  FaPlus,
  FaSearch,
  FaPen,
  FaTrashAlt,
  FaTimes,
  FaEllipsisV,
  FaStreetView,
  FaArrowLeft,
} from 'react-icons/fa'
import { BsThreeDotsVertical } from 'react-icons/bs'
import SearchPanel from '../../utils/FilterPanel'
import Pagination from '../../utils/Pagination'
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Tab,
  Table,
  Tabs,
  Alert,
  Dropdown,
  Modal,
} from 'react-bootstrap'
import './Company.css'
import download from './download.jfif'

const CompanyPage = () => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(null)
  const [activeTab, setActiveTab] = useState('companyDetails')
  const [validationErrors, setValidationErrors] = useState({})
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [counts, setCounts] = useState({
    totalCompanies: 0,
    approvedCompanies: 0,
    deletedCompanies: 0,
  })

  const [formData, setFormData] = useState({
    companyName: '',
    contactPersonName: '',
    emailId: '',
    address: '',
    country: '',
    regionState: '',
    city: '',
    pincode: '',
    stateCode: '',
    contactNo: '',
    gstNo: '',
    website: '',
    currency: 'INR',
    financialYearFrom: '',
    financialYearTo: '',
    cinNo: '',
    vatTin: '',
    cstTin: '',
    iec: '',
    invoicePrefix: '',
    termsAndCond: '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  const handleView = async (company) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/companies/${company.id}`,
        getAuthHeaders(),
      )
      setSelectedCompany(response.data.data)
      setShowViewModal(true)
    } catch (err) {
      console.error(err)
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to fetch company details.',
      )
    }
  }

  const [bankDetails, setBankDetails] = useState([
    {
      bankName: '',
      accountNo: '',
      accountType: '',
      branchCity: '',
      address: '',
      swift: '',
      micr: '',
      ifsc: '',
    },
  ])

  const [searchFields, setSearchFields] = useState([
    { field: 'companyName', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    if (!token) return {}
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  const fetchCompanies = async () => {
    setLoading(true)
    setError(null)

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

      // Fetch active companies
      const activeResponse = await axios.get(
        'http://localhost:5000/api/companies',
        {
          params,
          ...getAuthHeaders(),
        },
      )
      const activeData = activeResponse.data.data || []

      // Fetch deleted companies
      const deletedResponse = await axios.get(
        'http://localhost:5000/api/companies/deleted/list',
        {
          params,
          ...getAuthHeaders(),
        },
      )
      const deletedData = deletedResponse.data.data || []

      // Set companies based on current tab
      if (statusFilter === 'deleted') {
        setCompanies(deletedData)
      } else {
        setCompanies(activeData)
      }

      // Set accurate counts
      setCounts({
        totalCompanies: activeData.length + deletedData.length,
        approvedCompanies: activeData.length,
        deletedCompanies: deletedData.length,
      })
    } catch (err) {
      console.log(err)
      setError(err.response?.data?.message || 'Failed to fetch companies.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    fetchCompanies()
  }, [searchFields, dateFilter, statusFilter])

  // --- Form Handlers ---
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
    const file = e.target.files[0]
    setLogoFile(file)
    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleBankChange = (index, e) => {
    const { name, value } = e.target
    const updatedBanks = [...bankDetails]
    updatedBanks[index][name] = value
    setBankDetails(updatedBanks)

    // Clear validation error on change
    if (validationErrors[`${name}_${index}`]) {
      setValidationErrors((prev) => ({
        ...prev,
        [`${name}_${index}`]: '',
      }))
    }
  }

  const addBankRow = () => {
    setBankDetails([
      ...bankDetails,
      {
        bankName: '',
        accountNo: '',
        accountType: '',
        branchCity: '',
        address: '',
        swift: '',
        micr: '',
        ifsc: '',
      },
    ])
  }

  const removeBankRow = (index) => {
    setBankDetails(bankDetails.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactPersonName: '',
      emailId: '',
      address: '',
      country: '',
      regionState: '',
      city: '',
      pincode: '',
      stateCode: '',
      contactNo: '',
      gstNo: '',
      website: '',
      cinNo: '',
      vatTin: '',
      cstTin: '',
      iec: '',
    })
    setLogoFile(null)
    setLogoPreview(null)
    setBankDetails([
      {
        bankName: '',
        accountNo: '',
        accountType: '',
        branchCity: '',
        address: '',
        swift: '',
        micr: '',
        ifsc: '',
      },
    ])
    setIsEditing(null)
    setValidationErrors({})
    // setShowForm(false);
    setActiveTab('companyDetails')
  }

  // Validation logic
  const validateCompanyDetails = () => {
    const errors = {}
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!formData.companyName.trim())
      errors.companyName = 'Company Name is required.'
    if (!formData.emailId.trim()) {
      errors.emailId = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      errors.emailId = 'Invalid email format.'
    }
    if (formData.contactNo && !/^\d{10}$/.test(formData.contactNo))
      errors.contactNo = 'Contact number must be 10 digits'
    const pincodeRegex = /^[1-9][0-9]{5}$/
    if (formData.pincode && !pincodeRegex.test(formData.pincode)) {
      errors.pincode = 'Please enter a valid 6-digit Pincode.'
    }
    if (formData.gstNo && !gstRegex.test(formData.gstNo))
      errors.gstNo = 'Invalid GST Format.'

    if (formData.stateCode && isNaN(formData.stateCode)) {
      errors.stateCode = 'GST State Code must be a number.'
    }
    if (formData.financialYearFrom && isNaN(formData.financialYearFrom)) {
      errors.financialYearFrom = 'Financial Year From must be a number.'
    }
    if (formData.financialYearTo && isNaN(formData.financialYearTo)) {
      errors.financialYearTo = 'Financial Year To must be a number.'
    }
    // if (
    //   formData.website &&
    //   !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(formData.website)
    // )
    //   errors.website = "Invalid website URL.";

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateBankDetails = () => {
    const errors = {}
    bankDetails.forEach((bank, idx) => {
      if (!bank.bankName || bank.bankName.trim() === '') {
        errors[`bankName_${idx}`] = 'Bank name is required'
      }

      if (!bank.accountNo || bank.accountNo.trim() === '') {
        errors[`accountNo_${idx}`] = 'Account number is required'
      } else if (!/^[0-9]{6,18}$/.test(bank.accountNo)) {
        errors[`accountNo_${idx}`] = 'Account number must be 6-18 digits'
      }

      if (!bank.ifsc || bank.ifsc.trim() === '') {
        errors[`ifsc_${idx}`] = 'IFSC code is required'
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc)) {
        errors[`ifsc_${idx}`] = 'Invalid IFSC code'
      }
      // if (bank.micr && !/^[0-9]{9}$/.test(bank.micr)) {
      //   errors[`micr_${idx}`] = 'MICR Code must be 9 digits'
      // }
      if (!bank.accountType) {
        errors[`accountType_${idx}`] = 'Select Account Type'
      }
      if (!bank.branchCity || bank.branchCity.trim() === '') {
        errors[`branchCity_${idx}`] = 'Branch City is required'
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate Company Details
    if (!validateCompanyDetails()) {
      alert('Please fix company validation errors')
      setActiveTab('companyDetails')
      return
    }

    // Validate Bank Details
    if (!validateBankDetails()) {
      alert('Please fix bank validation errors')
      setActiveTab('bankDetails')
      return
    }

    try {
      const data = new FormData()

      // =========================
      // COMPANY DETAILS
      // =========================
      data.append('company_name', formData.companyName || '')
      data.append('contact_person', formData.contactPersonName || '')
      data.append('email_id', formData.emailId || '')
      data.append('address', formData.address || '')

      data.append('country_name', formData.country || '')
      data.append('state_name', formData.regionState || '')
      data.append('city_name', formData.city || '')

      data.append('pincode', formData.pincode || '')
      data.append('state_code', formData.stateCode || '')

      data.append('contact_no', formData.contactNo || '')
      data.append('currency_name', formData.currency || 'INR')

      data.append('gst_no', formData.gstNo || '')
      data.append('website', formData.website || '')

      data.append('vat_in', formData.vatTin || '')
      data.append('cin_no', formData.cinNo || '')
      data.append('cst', formData.cstTin || '')

      data.append('terms_conditions', formData.termsAndCond || '')

      // =========================
      // BANK DETAILS
      // =========================
      const mappedBanks = bankDetails.map((bank) => ({
        bank_name: bank.bankName || '',
        account_no: bank.accountNo || '',
        account_type: bank.accountType || '',
        branch_city: bank.branchCity || '',
        bank_address: bank.address || '',
        swift_no: bank.swift || '',
        micr_no: bank.micr || '',
        ifsc_code: bank.ifsc || '',
      }))
      data.append('banks', JSON.stringify(mappedBanks))

      // =========================
      // LOGO
      // =========================
      if (logoFile) {
        data.append('logo', logoFile)
      }

      const config = {
        headers: {
          ...getAuthHeaders().headers,
        },
      }

      let response

      // =========================
      // CREATE COMPANY
      // =========================
      if (!isEditing) {
        response = await axios.post(
          'http://localhost:5000/api/companies',
          data,
          config,
        )

        alert('Company created successfully')
      }

      // =========================
      // UPDATE COMPANY
      // =========================
      else {
        response = await axios.put(
          `http://localhost:5000/api/companies/${isEditing.id}`,
          data,
          config,
        )

        alert('Company updated successfully')
      }

      console.log(response.data)

      // =========================
      // RESET + REFRESH
      // =========================
      resetForm()
      setShowForm(false)
      fetchCompanies()
    } catch (err) {
      console.log(err)

      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Something went wrong',
      )
    }
  }

  const handleEdit = async (company) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/companies/${company.id}`,
        getAuthHeaders(),
      )
      const fullCompany = response.data.data
      setIsEditing(fullCompany)
      setValidationErrors({})

      setFormData({
        companyName: fullCompany.company_name || '',
        contactPersonName: fullCompany.contact_person || '',
        emailId: fullCompany.email_id || '',
        address: fullCompany.address || '',

        country: fullCompany.country_name || '',
        regionState: fullCompany.state_name || '',
        city: fullCompany.city_name || '',

        pincode: fullCompany.pincode || '',
        stateCode: fullCompany.state_code || '',

        contactNo: fullCompany.contact_no || '',

        gstNo: fullCompany.gst_no || '',
        website: fullCompany.website || '',

        currency: fullCompany.currency_name || 'INR',

        cinNo: fullCompany.cin_no || '',
        vatTin: fullCompany.vat_in || '',
        cstTin: fullCompany.cst || '',

        termsAndCond: fullCompany.terms_conditions || '',
      })

      if (fullCompany.banks && fullCompany.banks.length > 0) {
        setBankDetails(
          fullCompany.banks.map((b) => ({
            bankName: b.bank_name || '',
            accountNo: b.account_no || '',
            accountType: b.account_type || '',
            branchCity: b.branch_city || '',
            address: b.bank_address || '',
            swift: b.swift_no || '',
            micr: b.micr_no || '',
            ifsc: b.ifsc_code || '',
          })),
        )
      } else {
        setBankDetails([
          {
            bankName: '',
            accountNo: '',
            accountType: '',
            branchCity: '',
            address: '',
            swift: '',
            micr: '',
            ifsc: '',
          },
        ])
      }

      if (fullCompany.image) {
        setLogoPreview(`http://localhost:5000/uploads/${fullCompany.image}`)
      } else {
        setLogoPreview(null)
      }

      setShowForm(true)
      setShowSearch(false)
      setActiveTab('companyDetails')
    } catch (err) {
      console.error(err)
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to fetch company details for editing.',
      )
    }
  }
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await axios.delete(
          `http://localhost:5000/api/companies/${id}`,
          getAuthHeaders(),
        )
        alert('Company deleted successfully!')
        fetchCompanies() // refresh the list
      } catch (e) {
        if (e.response?.status === 401) {
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
        `http://localhost:5000/api/companies/restore/${id}`,
        {},
        getAuthHeaders(),
      )
      alert('Company restored successfully!')
      fetchCompanies()
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        alert('Restore failed!')
      }
    }
  }

  const handleSearch = () => fetchCompanies()
  const handleReset = () => {
    setSearchFields([{ field: 'companyName', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    setCurrentPage(1)
    setTimeout(() => fetchCompanies(), 0)
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

      const response = await axios.get(
        `http://localhost:5000/api/companies/export`,
        {
          params,
          responseType: 'blob',
          ...getAuthHeaders(),
        },
      )

      // Create Excel File
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `Companies_${randomNumber}.xlsx`
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

  const searchOptions = [
    { value: 'companyName', label: 'Company Name' },
    { value: 'contactPersonName', label: 'Contact Person' },
    { value: 'emailId', label: 'Email ID' },
    { value: 'city', label: 'City' },
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h1
          className="page-title mb-0"
          style={{
            fontSize: '25px',
          }}
        >
          {showForm
            ? isEditing
              ? 'Edit Company'
              : 'Create Company'
            : 'Company Management'}{' '}
          {!showForm && (
            <span className="text-success">({companies.length})</span>
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

      {/* Search */}
      {showSearch && (
        <SearchPanel
          searchFields={searchFields}
          setSearchFields={setSearchFields}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          onSearch={handleSearch}
          onReset={handleReset}
          onDownloadExcel={handleDownloadExcel}
          searchOptions={searchOptions}
        />
      )}

      {/* Form */}
      {showForm && (
        <Card className="company-card">
          <h2 className="card-header mb-4">
            {isEditing ? (
              <span>Edit Company - {isEditing.company_name}</span>
            ) : (
              ''
            )}
          </h2>

          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="danger">
              Please fix the validation errors below.
            </Alert>
          )}

          <div className="company-form-wrapper">
            <Form className="company-form" onSubmit={handleSubmit}>
              <Tabs
                activeKey={activeTab}
                onSelect={() => {}}
                className="mb-3 custom-bootstrap-tabs"
                style={{ overflow: 'visible', flexWrap: 'wrap' }}
                fill
              >
                {/* Company Details Tab */}
                <Tab eventKey="companyDetails" title="Company Details">
                  <Row>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="companyName">
                        <Form.Label>Company Name *</Form.Label>
                        <Form.Control
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          placeholder="Company Name"
                          isInvalid={!!validationErrors.companyName}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.companyName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="contactPersonName">
                        <Form.Label>Contact Person Name</Form.Label>
                        <Form.Control
                          name="contactPersonName"
                          value={formData.contactPersonName}
                          onChange={handleInputChange}
                          placeholder="Contact Person Name"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="emailId">
                        <Form.Label>Email ID *</Form.Label>
                        <Form.Control
                          name="emailId"
                          value={formData.emailId}
                          onChange={handleInputChange}
                          placeholder="Email ID"
                          type="email"
                          isInvalid={!!validationErrors.emailId}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.emailId}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="address">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          as={'textarea'}
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Address"
                          rows={3}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="country">
                        <Form.Label>Country</Form.Label>
                        <Form.Control
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          placeholder="Country"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="regionState">
                        <Form.Label>State</Form.Label>
                        <Form.Control
                          name="regionState"
                          value={formData.regionState}
                          onChange={handleInputChange}
                          placeholder="State"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="city">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="City"
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
                          isInvalid={!!validationErrors.pincode}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.pincode}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="stateCode">
                        <Form.Label>GST State Code</Form.Label>
                        <Form.Control
                          name="stateCode"
                          value={formData.stateCode}
                          onChange={handleInputChange}
                          isInvalid={!!validationErrors.stateCode}
                          placeholder="GST State Code"
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.stateCode}
                        </Form.Control.Feedback>
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
                          isInvalid={!!validationErrors.contactNo}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.contactNo}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="currency">
                        <Form.Label>Currency</Form.Label>
                        <Form.Select
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                        >
                          <option value={'INR'}>INR</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="gstNo">
                        <Form.Label>GST No</Form.Label>
                        <Form.Control
                          name="gstNo"
                          value={formData.gstNo}
                          onChange={handleInputChange}
                          placeholder="GST No"
                          isInvalid={!!validationErrors.gstNo}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.gstNo}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="website">
                        <Form.Label>Website</Form.Label>
                        <Form.Control
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          placeholder="Website"
                          isInvalid={!!validationErrors.website}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.website}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="financialYearFrom">
                        <Form.Label>Financial Year From</Form.Label>
                        <Form.Control
                          name="financialYearFrom"
                          value={formData.financialYearFrom}
                          onChange={handleInputChange}
                          placeholder="Financial Year From"
                          isInvalid={!!validationErrors.financialYearFrom}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.financialYearFrom}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="financialYearTo">
                        <Form.Label>Financial Year To</Form.Label>
                        <Form.Control
                          name="financialYearTo"
                          value={formData.financialYearTo}
                          onChange={handleInputChange}
                          placeholder="Financial Year To"
                          isInvalid={!!validationErrors.financialYearTo}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.financialYearTo}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="cinNo">
                        <Form.Label>CIN No.</Form.Label>
                        <Form.Control
                          name="cinNo"
                          value={formData.cinNo}
                          onChange={handleInputChange}
                          placeholder="CIN No."
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="vatTin">
                        <Form.Label>VAT TIN</Form.Label>
                        <Form.Control
                          name="vatTin"
                          value={formData.vatTin}
                          onChange={handleInputChange}
                          placeholder="VAT TIN"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="cstTin">
                        <Form.Label>CST TIN</Form.Label>
                        <Form.Control
                          name="cstTin"
                          value={formData.cstTin}
                          onChange={handleInputChange}
                          placeholder="CST TIN"
                        />
                      </Form.Group>
                    </Col>
                    {/* <Col xs={12} sm={6} md={3} className="mb-3">
                      <Form.Group controlId="iec">
                        <Form.Label>IEC</Form.Label>
                        <Form.Control
                          name="iec"
                          value={formData.iec}
                          onChange={handleInputChange}
                          placeholder="IEC"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={3} className="mb-3">
                      <Form.Group controlId="iec">
                        <Form.Label>Invoice Prefix</Form.Label>
                        <Form.Control
                          name="invoicePrefix"
                          value={formData.invoicePrefix}
                          onChange={handleInputChange}
                          placeholder="Invoice Prefix"
                        />
                      </Form.Group>
                    </Col> */}
                    <Col xs={12} sm={6} md={3} className="mb-3">
                      <Form.Group controlId="formLogo">
                        <Form.Label>Attach Logo</Form.Label>
                        <Form.Control
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          name="logo"
                          onChange={handleFileChange}
                        />
                      </Form.Group>
                    </Col>
                    {logoPreview && (
                      <Col
                        xs={12}
                        sm={6}
                        md={3}
                        className="mb-3 text-center d-flex align-items-center justify-content-center"
                      >
                        <img
                          src={logoPreview}
                          alt="logo preview"
                          style={{
                            maxHeight: '120px',
                            maxWidth: '150px',
                            objectFit: 'contain',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '4px',
                            backgroundColor: '#fff',
                          }}
                        />
                      </Col>
                    )}
                    <Col xs={12} sm={12} md={12} className="mb-3">
                      <Form.Group controlId="termsAndCond">
                        <Form.Label>Terms And Conditions</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="termsAndCond"
                          value={formData.termsAndCond}
                          onChange={handleInputChange}
                          placeholder="Terms & Conditions"
                          rows={3}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div
                    className="form-actions d-flex justify-content-end"
                    style={{
                      position: 'relative',
                      left: '-40%',
                    }}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      className="me-2"
                      onClick={() => {
                        resetForm()
                        setShowForm(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (validateCompanyDetails()) {
                          setActiveTab('bankDetails') // switch only if validation passes
                        } else {
                          alert('Please fix the validation errors.')
                        }
                      }}
                      variant="primary"
                      type="button"
                    >
                      Next
                    </Button>
                  </div>
                </Tab>

                {/* Bank Details Tab */}
                <Tab eventKey="bankDetails" title="Bank Details">
                  <Table bordered hover responsive>
                    <thead className="table-secondary">
                      <tr>
                        <th>Bank Name</th>
                        <th>Account No</th>
                        <th>Account Type</th>
                        <th>Branch City</th>
                        <th>Address</th>
                        <th>Swift A/C No</th>
                        <th>MICR No</th>
                        <th>IFSC Code</th>
                        <th>
                          <button
                            type="button"
                            onClick={addBankRow}
                            className="icon-btn add text-warning"
                          >
                            <FaPlus />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankDetails.map((bank, idx) => (
                        <tr key={idx}>
                          <td>
                            <Form.Control
                              name="bankName"
                              value={bank.bankName}
                              onChange={(e) => handleBankChange(idx, e)}
                              isInvalid={!!validationErrors[`bankName_${idx}`]}
                            />
                            <Form.Control.Feedback type="invalid">
                              {validationErrors[`bankName_${idx}`]}
                            </Form.Control.Feedback>
                          </td>

                          <td>
                            <Form.Control
                              name="accountNo"
                              value={bank.accountNo}
                              onChange={(e) => handleBankChange(idx, e)}
                              isInvalid={!!validationErrors[`accountNo_${idx}`]}
                            />
                            <Form.Control.Feedback type="invalid">
                              {validationErrors[`accountNo_${idx}`]}
                            </Form.Control.Feedback>
                          </td>

                          <td>
                            <Form.Select
                              name="accountType"
                              value={bank.accountType}
                              onChange={(e) => handleBankChange(idx, e)}
                              isInvalid={
                                !!validationErrors[`accountType_${idx}`]
                              }
                            >
                              <option value="">
                                -- Select Account Type --
                              </option>
                              <option value="Savings">Savings</option>
                              <option value="Current">Current</option>
                              <option value="Salary">Salary</option>
                              <option value="Other">Other</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {validationErrors[`accountType_${idx}`]}
                            </Form.Control.Feedback>
                          </td>

                          <td>
                            <Form.Control
                              name="branchCity"
                              value={bank.branchCity}
                              onChange={(e) => handleBankChange(idx, e)}
                              isInvalid={
                                !!validationErrors[`branchCity_${idx}`]
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {validationErrors[`branchCity_${idx}`]}
                            </Form.Control.Feedback>
                          </td>

                          <td>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              name="address"
                              value={bank.address}
                              onChange={(e) => handleBankChange(idx, e)}
                              isInvalid={!!validationErrors[`address_${idx}`]}
                            />
                            <Form.Control.Feedback type="invalid">
                              {validationErrors[`address_${idx}`]}
                            </Form.Control.Feedback>
                          </td>

                          <td>
                            <Form.Control
                              name="swift"
                              value={bank.swift}
                              onChange={(e) => handleBankChange(idx, e)}
                            />
                          </td>

                          <td>
                            <Form.Control
                              name="micr"
                              value={bank.micr}
                              isInvalid={!!validationErrors[`micr_${idx}`]}
                              onChange={(e) => handleBankChange(idx, e)}
                            />
                            <Form.Control.Feedback type="invalid">
                              {validationErrors[`micr_${idx}`]}
                            </Form.Control.Feedback>
                          </td>

                          <td>
                            <Form.Control
                              name="ifsc"
                              value={bank.ifsc}
                              isInvalid={!!validationErrors[`ifsc_${idx}`]}
                              onChange={(e) => handleBankChange(idx, e)}
                            />
                            <Form.Control.Feedback type="invalid">
                              {validationErrors[`ifsc_${idx}`]}
                            </Form.Control.Feedback>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="icon-btn delete"
                                onClick={() => removeBankRow(idx)}
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <div
                    className="form-actions d-flex justify-content-end mt-3"
                    // style={{
                    //   position: 'relative',
                    //   left: '-20%',
                    // }}
                  >
                    <Button
                      variant="outline-secondary"
                      type="button"
                      className="me-2"
                      onClick={() => setActiveTab('companyDetails')}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="me-2"
                      onClick={() => {
                        resetForm()
                        setShowForm(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      {isEditing ? 'Update Company' : 'Save Company'}
                    </Button>
                  </div>
                </Tab>
              </Tabs>
            </Form>
          </div>
        </Card>
      )}

      {/* Company Status Tabs */}
      {!showForm && (
        <div className="mb-4">
          <Tabs
            activeKey={statusFilter}
            onSelect={(key) => setStatusFilter(key)}
          >
            {/* <Tab
              eventKey="all"
              title={`Total Companies (${counts.totalCompanies})`}
            /> */}

            <Tab
              eventKey="approved"
              title={`Active (${counts.approvedCompanies})`}
            />

            <Tab
              eventKey="deleted"
              title={`Deleted (${counts.deletedCompanies})`}
            />
          </Tabs>
        </div>
      )}

      {/* Company List Table */}
      {!showForm && (
        <Card>
          {loading ? (
            <Alert variant="warning" className="mb-0 text-center">
              Loading...
            </Alert>
          ) : error ? (
            <Alert variant="danger" className="mb-0 text-center">
              {error}
            </Alert>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h4 className="mb-0">Company List</h4>

                <div className="d-flex align-items-center gap-2 p-3">
                  <span>Show</span>

                  <Form.Select
                    size="sm"
                    style={{ width: '90px' }}
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={150}>150</option>
                  </Form.Select>
                </div>
              </div>
              <Table
                bordered
                hover
                className="list-table align-middle table-sm w-auto"
              >
                <thead className="table text-center">
                  <tr>
                    <th width="80">Logo</th>
                    <th width="180">Company</th>
                    <th width="150">Contact Person</th>
                    <th width="200">Email ID</th>
                    <th width="120">Contact No</th>
                    <th width="120">City</th>
                    <th width="90">Actions</th>
                  </tr>
                </thead>

                <tbody className="text-center">
                  {companies.length === 0 ? (
                    <tr className="text-center">
                      <td colSpan={7}>No data found</td>
                    </tr>
                  ) : (
                    companies
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage,
                      )
                      .map((company) => (
                        <tr key={company.id}>
                          <td>
                            <img
                              src={
                                company.image
                                  ? `http://localhost:5000/uploads/${company.image}`
                                  : download
                              }
                              alt="Logo"
                              style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'contain',
                                border: '1px solid #eee',
                                borderRadius: '4px',
                                padding: '2px',
                                backgroundColor: '#fff',
                              }}
                              onError={(e) => {
                                e.target.src = download
                              }}
                            />
                          </td>
                          <td>{company.company_name}</td>
                          <td>{company.contact_person}</td>
                          <td>{company.email_id}</td>
                          <td>{company.contact_no}</td>
                          <td>{company.city_name}</td>

                          <td className="text-center">
                            <Dropdown>
                              <Dropdown.Toggle
                                variant="outline-secondary"
                                size="sm"
                                id={`dropdown-${company.id}`}
                                className="bg-secondary text-white"
                                style={{
                                  border: '1px solid #ddd',
                                }}
                              >
                                <BsThreeDotsVertical />
                              </Dropdown.Toggle>

                              <Dropdown.Menu
                                popperConfig={{ strategy: 'fixed' }}
                              >
                                <Dropdown.Item
                                  onClick={() => handleView(company)}
                                >
                                  <FaStreetView className="me-2 text-primary" />
                                  View
                                </Dropdown.Item>

                                <Dropdown.Item
                                  onClick={() => handleEdit(company)}
                                >
                                  <FaPen className="me-2 text-primary" />
                                  Edit
                                </Dropdown.Item>

                                {/* 🔴 ACTIVE = 0 → SHOW NORMAL DELETE */}
                                {company.active == 0 && (
                                  <Dropdown.Item
                                    onClick={() => handleDelete(company.id)}
                                    className="text-danger"
                                  >
                                    <FaTrashAlt className="me-2" />
                                    Delete
                                  </Dropdown.Item>
                                )}

                                {/* 🟢 ACTIVE = 1 → ONLY RESTORE */}
                                {company.active == 1 && (
                                  <Dropdown.Item
                                    onClick={() => handleRestore(company.id)}
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
                totalItems={companies.length}
                itemsPerPage={10}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      )}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Company Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedCompany && (
            <Row>
              {selectedCompany.image && (
                <Col md={12} className="text-center mb-4">
                  <div className="d-inline-block p-2 border rounded bg-white shadow-sm">
                    <img
                      src={
                        selectedCompany.image?.trim()
                          ? `http://localhost:5000/uploads/${selectedCompany.image}`
                          : download
                      }
                      alt={`${selectedCompany.company_name} Logo`}
                      style={{
                        maxHeight: '120px',
                        maxWidth: '240px',
                        objectFit: 'contain',
                      }}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = download
                      }}
                    />
                  </div>
                </Col>
              )}
              <Col md={6} className="mb-3">
                <strong>Company Name:</strong>
                <div>{selectedCompany.company_name}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Contact Person:</strong>
                <div>{selectedCompany.contact_person}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Email:</strong>
                <div>{selectedCompany.email_id}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Contact No:</strong>
                <div>{selectedCompany.contact_no}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Country:</strong>
                <div>{selectedCompany.country_name}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>State:</strong>
                <div>{selectedCompany.state_name}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>City:</strong>
                <div>{selectedCompany.city_name}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Pincode:</strong>
                <div>{selectedCompany.pincode}</div>
              </Col>

              <Col md={12} className="mb-3">
                <strong>Address:</strong>
                <div>{selectedCompany.address}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>GST No:</strong>
                <div>{selectedCompany.gst_no}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Website:</strong>
                <div>{selectedCompany.website}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>Currency:</strong>
                <div>{selectedCompany.currency_name}</div>
              </Col>

              <Col md={6} className="mb-3">
                <strong>State Code:</strong>
                <div>{selectedCompany.state_code}</div>
              </Col>

              <hr />

              <h5 className="mt-3 mb-2 col-12">Bank Details</h5>

              {selectedCompany.banks && selectedCompany.banks.length > 0 ? (
                <Col md={12} className="mb-3">
                  <div className="table-responsive">
                    <Table
                      size="sm"
                      bordered
                      hover
                      className="align-middle text-center table-striped mt-2"
                    >
                      <thead className="table-secondary">
                        <tr>
                          <th>#</th>
                          <th>Bank Name</th>
                          <th>Account No</th>
                          <th>Type</th>
                          <th>IFSC Code</th>
                          <th>Branch City</th>
                          <th>Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCompany.banks.map((bank, index) => (
                          <tr key={bank.id || index}>
                            <td>{index + 1}</td>
                            <td className="fw-medium">
                              {bank.bank_name || 'N/A'}
                            </td>
                            <td>{bank.account_no || 'N/A'}</td>
                            <td>{bank.account_type || 'N/A'}</td>
                            <td>{bank.ifsc_code || 'N/A'}</td>
                            <td>{bank.branch_city || 'N/A'}</td>
                            <td
                              className="text-start"
                              style={{
                                fontSize: '12px',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={bank.bank_address}
                            >
                              {bank.bank_address || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Col>
              ) : (
                <Col md={12} className="mb-3">
                  <div className="text-muted text-center p-3 bg-light border rounded">
                    No bank accounts configured.
                  </div>
                </Col>
              )}

              <Col md={12} className="mb-3">
                <strong>Terms & Conditions:</strong>
                <div>{selectedCompany.terms_conditions}</div>
              </Col>
            </Row>
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

export default CompanyPage
