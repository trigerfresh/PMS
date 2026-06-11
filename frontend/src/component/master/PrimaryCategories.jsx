import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Tabs,
  Tab,
  Dropdown,
  Card,
  Form,
  Row,
  Col,
  Button,
  Container,
} from 'react-bootstrap'
import SearchPanel from '../../utils/filterPanel'
import Pagination from '../../utils/Pagination'
import { FaSearch, FaPlus, FaArrowLeft } from 'react-icons/fa'
import './Company.css'
import { BsThreeDotsVertical } from 'react-icons/bs'

const BASE_URL = 'http://localhost:5000/api/primary-category'

export default function PrimaryCategories() {
  const [name, setName] = useState('')
  const [editId, setEditId] = useState(null)
  const [image, setImage] = useState(null)
  const [existingImage, setExistingImage] = useState('')

  const [activeList, setActiveList] = useState([])
  const [deletedList, setDeletedList] = useState([])

  const [showSearch, setShowSearch] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [pageSize, setPageSize] = useState(10)

  const [searchFields, setSearchFields] = useState([
    {
      field: 'primary_categories_name',
      keyword: '',
    },
  ])

  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: '',
  })
  const [key, setKey] = useState('active')
  const [currentPage, setCurrentPage] = useState(1)

  // ================= LOAD =================
  const loadData = async () => {
    try {
      const res = await axios.get(BASE_URL)
      const data = res.data.data || []

      setActiveList(data.filter((i) => i.active === '0'))
      setDeletedList(data.filter((i) => i.active === '1'))
      setCurrentPage(1)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const searchOptions = [
    {
      value: 'primary_categories_name',
      label: 'Category Name',
    },
  ]

  // ================= CREATE / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const formData = new FormData()
      formData.append('primary_categories_name', name)

      if (image) {
        formData.append('image', image)
      }

      if (editId) {
        await axios.put(`${BASE_URL}/${editId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        await axios.post(BASE_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }

      resetForm()
      loadData()
    } catch (err) {
      console.log(err)
      alert('Error saving primary category')
    }
  }

  // ================= RESET / CLOSE FORM =================
  const resetForm = () => {
    setName('')
    setImage(null)
    setEditId(null)
    setExistingImage('')
    setShowForm(false)

    const fileInput = document.getElementById('primary-image')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // ================= EDIT =================
  const handleEdit = (item) => {
    setEditId(item.id)
    setName(item.primary_categories_name)
    setExistingImage(item.image || '')
    setShowForm(true)
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete?')) return
    await axios.delete(`${BASE_URL}/${id}`)
    loadData()
  }

  // ================= RESTORE =================
  const handleRestore = async (id) => {
    await axios.put(`${BASE_URL}/restore/${id}`)
    loadData()
  }

  // ================= SEARCH =================
  const handleSearch = async () => {
    try {
      let params = {}
      searchFields.forEach((item) => {
        if (item.keyword.trim() !== '') {
          params[item.field] = item.keyword
        }
      })

      const res = await axios.get(`${BASE_URL}/search`, { params })
      const data = res.data.data || []

      setActiveList(data.filter((i) => i.active === '0'))
      setDeletedList(data.filter((i) => i.active === '1'))
      setCurrentPage(1)
    } catch (err) {
      console.log(err)
    }
  }

  const resetSearch = async () => {
    setSearchFields([
      {
        field: 'primary_categories_name',
        keyword: '',
      },
    ])
    setCurrentPage(1)
    loadData()
  }

  const downloadExcel = async () => {
    const res = await axios.get(`${BASE_URL}/export/excel`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'primary_categories.xlsx')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <Container fluid className="page-container" style={{
      background: 'linear-gradient(135deg, #f6f8fc 0%, #e9edf5 100%)',
      minHeight: '100vh',
      transition: 'background-color 0.5s ease',
    }}>
      {/* HEADER SECTION */}
      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-2 border-bottom gap-3">
        <h1
          className="page-title mb-0"
          style={{
            fontSize: '25px',
          }}
        >
          {showForm
            ? editId
              ? 'Update Details'
              : 'Add Primary Category'
            : 'Primary Category Master'}{' '}
          {!showForm && (
            <span className="text-success">({activeList.length})</span>
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
            className={`btn shadow-sm rounded-3 text-white ${showForm ? 'btn-danger' : 'btn-primary'
              }`}
            onClick={() => {
              if (showForm) {
                resetForm()
              } else {
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

      {/* VIEW 1: FORM LAYOUT */}
      {showForm ? (
        <Card className="dashboard-card shadow-sm border-0 rounded-4 overflow-hidden mb-4" style={{ transition: 'all 0.3s ease' }}>
          <Card.Body className="p-4">
            <h2 className="mb-4 fw-bold text-secondary" style={{ fontSize: '1.5rem' }}>
              {editId ? <span>Edit Primary Category - {name}</span> : 'Primary Category Details'}
            </h2>

            <div className="company-form-wrapper">
            <Form className="company-form" onSubmit={handleSubmit}>
              <Row>
                {/* PRIMARY CATEGORY NAME INPUT */}
                <Col xs={12} sm={6} md={6} className="mb-3">
                  <Form.Group controlId="primaryCategoryName">
                    <Form.Label>Primary Category Name *</Form.Label>
                    <Form.Control
                      placeholder="Enter Category Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                {/* IMAGE INPUT */}
                <Col xs={12} sm={6} md={6} className="mb-3">
                  <Form.Group controlId="primaryCategoryImage">
                    <Form.Label>Category Image</Form.Label>
                    <Form.Control
                      id="primary-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files[0])}
                    />
                  </Form.Group>
                </Col>

                {/* CURRENT IMAGE PREVIEW (In Edit Mode) */}
                {editId && existingImage && (
                  <Col
                    xs={12}
                    sm={6}
                    md={6}
                    className="mb-3 d-flex align-items-end"
                  >
                    <div className="p-2 border rounded d-inline-flex align-items-center gap-2 bg-light">
                      <img
                        src={`http://localhost:5000/uploads/${existingImage}`}
                        alt="Current"
                        width="55"
                        height="55"
                        style={{ objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <div style={{ fontSize: '12px' }} className="text-muted">
                        <span className="fw-bold d-block">Current Image</span>
                        {existingImage}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>

              {/* FORM FOOTER BUTTONS */}
              <div className="form-actions d-flex justify-content-end mt-4">
                <Button
                  variant="secondary"
                  className="me-2"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editId ? 'Update Primary Category' : 'Save Primary Category'}
                </Button>
              </div>
            </Form>
          </div>
          </Card.Body>
        </Card>
      ) : (
        /* VIEW 2: TABS TABLE LIST (Fixed structure width attributes) */
        <Card className="dashboard-card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
          <Card.Body className="p-4">
            {showSearch && (
            <SearchPanel
              searchFields={searchFields}
              setSearchFields={setSearchFields}
              onSearch={handleSearch}
              onReset={resetSearch}
              searchOptions={searchOptions}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              onDownloadExcel={downloadExcel}
            />
          )}

          <Tabs
            activeKey={key}
            onSelect={(k) => {
              setKey(k)
              setCurrentPage(1)
            }}
            className="mb-3 custom-bootstrap-tabs"
            style={{ overflow: 'visible', flexWrap: 'wrap' }}
          >
            {/* ACTIVE TAB */}

            <Tab eventKey="active" title="Active">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Primary Category List</h5>

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
              <div
                className="table-responsive"
                style={{ overflowX: 'auto', minHeight: '200px' }}
              >
                <table className="table table-bordered table-striped list-table bg-white shadow-sm align-middle table-sm w-100 mb-0" style={{ fontSize: '13px' }}>
                  <thead className="table-light text-center text-secondary">
                    <tr>
                      <th className="text-center fw-semibold px-3 py-2 text-nowrap">ID</th>
                      <th className="fw-semibold px-3 py-2 text-nowrap">Name</th>
                      <th className="text-center fw-semibold px-3 py-2 text-nowrap">Image</th>
                      <th className="text-center fw-semibold px-3 py-2 text-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-center">
                    {activeList.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center text-muted py-3 small"
                        >
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      activeList
                        .slice(
                          (currentPage - 1) * pageSize,
                          currentPage * pageSize,
                        )
                        .map((item) => (
                          <tr key={item.id}>
                            <td className="text-center">{item.id}</td>
                            <td>{item.primary_categories_name}</td>
                            <td className="text-center">
                              {item.image ? (
                                <img
                                  src={`http://localhost:5000/uploads/${item.image}`}
                                  alt=""
                                  width="30"
                                  height="30"
                                  style={{
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                  }}
                                />
                              ) : (
                                <span className="text-muted small">—</span>
                              )}
                            </td>
                            <td className="text-center">
                              <Dropdown>
                                <Dropdown.Toggle
                                  variant="outline-secondary"
                                  size="sm"
                                  className="bg-secondary text-white"
                                >
                                  <BsThreeDotsVertical />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item
                                    onClick={() => handleEdit(item)}
                                  >
                                    ✏️ Edit
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    onClick={() => handleDelete(item.id)}
                                    className="text-danger"
                                  >
                                    🗑️ Delete
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
                <Pagination
                  totalItems={activeList.length}
                  itemsPerPage={pageSize}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </Tab>

            {/* DELETED TAB */}
            <Tab eventKey="deleted" title="Deleted">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Primary Category List</h5>

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
                <table className="table table-bordered table-striped list-table bg-white shadow-sm align-middle table-sm w-100 mb-0" style={{ fontSize: '13px' }}>
                  <thead className="table-dark text-center">
                    <tr>
                      <th className="text-center fw-semibold px-3 py-2 text-nowrap">ID</th>
                      <th className="fw-semibold px-3 py-2 text-nowrap">Name</th>
                      <th className="text-center fw-semibold px-3 py-2 text-nowrap">Image</th>
                      <th className="text-center fw-semibold px-3 py-2 text-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-center">
                    {deletedList.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center text-muted py-3 small"
                        >
                          No deleted records.
                        </td>
                      </tr>
                    ) : (
                      deletedList
                        .slice(
                          (currentPage - 1) * pageSize,
                          currentPage * pageSize,
                        )
                        .map((item) => (
                          <tr key={item.id}>
                            <td className="text-center">{item.id}</td>
                            <td>{item.primary_categories_name}</td>
                            <td className="text-center">
                              {item.image ? (
                                <img
                                  src={`http://localhost:5000/uploads/${item.image}`}
                                  alt=""
                                  width="30"
                                  height="30"
                                  style={{
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                  }}
                                />
                              ) : (
                                <span className="text-muted small">—</span>
                              )}
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-success px-3"
                                onClick={() => handleRestore(item.id)}
                              >
                                Restore
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
                <Pagination
                  totalItems={deletedList.length}
                  itemsPerPage={pageSize}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </Tab>
          </Tabs>
          </Card.Body>
        </Card>
      )}
    </Container>
  )
}
