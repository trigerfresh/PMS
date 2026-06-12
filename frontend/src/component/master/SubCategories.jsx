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
import { FaSearch, FaPlus, FaTimes, FaArrowLeft } from 'react-icons/fa'
import SearchPanel from '../../utils/filterPanel'
import Pagination from '../../utils/Pagination'
import './Company.css'
import { BsThreeDotsVertical } from 'react-icons/bs'

const SUB_URL = 'http://localhost:5000/api/subcategory'
const PRIMARY_URL = 'http://localhost:5000/api/primary-category'
const CATEGORY_URL = 'http://localhost:5000/api/category'

export default function SubCategories() {
  const [primaryList, setPrimaryList] = useState([])
  const [categoryList, setCategoryList] = useState([])

  const [primaryId, setPrimaryId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryName, setSubcategoryName] = useState('')
  const [image, setImage] = useState(null)

  const [editId, setEditId] = useState(null)
  const [existingImage, setExistingImage] = useState('')

  const [activeList, setActiveList] = useState([])
  const [deletedList, setDeletedList] = useState([])
  const [pageSize, setPageSize] = useState(10)

  const [showSearch, setShowSearch] = useState(false)
  const [showForm, setShowForm] = useState(false) // State to control full view toggle

  const [searchFields, setSearchFields] = useState([
    {
      field: 'subcategory_name',
      keyword: '',
    },
  ])

  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: '',
  })

  const [tabKey, setTabKey] = useState('active')
  const [currentPage, setCurrentPage] = useState(1)

  const searchOptions = [
    {
      value: 'primary_categories_name',
      label: 'Primary Category',
    },
    {
      value: 'category_name',
      label: 'Category',
    },
    {
      value: 'subcategory_name',
      label: 'Subcategory',
    },
  ]

  // ================= LOAD DATA =================

  useEffect(() => {
    loadPrimary()
    loadCategories()
    loadSubcategories()
  }, [])

  const loadPrimary = async () => {
    try {
      const res = await axios.get(PRIMARY_URL)
      setPrimaryList((res.data.data || []).filter((x) => x.active === '0'))
    } catch (err) {
      console.log(err)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await axios.get(CATEGORY_URL)
      setCategoryList((res.data.data || []).filter((x) => x.active === '0'))
    } catch (err) {
      console.log(err)
    }
  }

  const loadSubcategories = async () => {
    try {
      const res = await axios.get(SUB_URL)
      const data = res.data.data || []
      setActiveList(data.filter((x) => x.active === '0'))
      setDeletedList(data.filter((x) => x.active === '1'))
      setCurrentPage(1)
    } catch (err) {
      console.log(err)
    }
  }

  // ================= SUBMIT =================

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const formData = new FormData()
      formData.append('category_id', categoryId)
      formData.append('subcategory_name', subcategoryName)

      if (image) {
        formData.append('image', image)
      }

      if (editId) {
        await axios.put(`${SUB_URL}/${editId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        await axios.post(SUB_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }

      resetForm()
      loadSubcategories()
    } catch (err) {
      console.log(err)
      alert('Error saving subcategory')
    }
  }

  // ================= RESET / CLOSE FORM =================

  const resetForm = () => {
    setPrimaryId('')
    setCategoryId('')
    setSubcategoryName('')
    setImage(null)
    setExistingImage('')
    setEditId(null)
    setShowForm(false) // Form band hote hi table view automatic show ho jayega

    const fileInput = document.getElementById('subcategory-image')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // ================= EDIT =================

  const handleEdit = (item) => {
    setEditId(item.id)
    setPrimaryId(item.primary_id)
    setCategoryId(item.category_id)
    setSubcategoryName(item.subcategory_name)
    setExistingImage(item.image)
    setShowForm(true) // Form screen load ho jayegi, baki sab hide ho jayega
  }

  // ================= DELETE =================

  const handleDelete = async (id) => {
    if (!window.confirm('Delete subcategory?')) return

    try {
      await axios.delete(`${SUB_URL}/${id}`)
      loadSubcategories()
    } catch (err) {
      console.log(err)
    }
  }

  // ================= RESTORE =================

  const handleRestore = async (id) => {
    try {
      await axios.put(`${SUB_URL}/restore/${id}`)
      loadSubcategories()
    } catch (err) {
      console.log(err)
    }
  }

  // ================= FILTER CATEGORY =================

  const filteredCategories = categoryList.filter(
    (c) => String(c.pcat_id) === String(primaryId),
  )

  // ================= SEARCH =================

  const handleSearch = async () => {
    try {
      const keyword = searchFields[0]?.keyword || ''
      const res = await axios.get(`${SUB_URL}/search`, {
        params: { keyword },
      })
      const data = res.data.data || []
      setActiveList(data.filter((x) => x.active === '0'))
      setDeletedList(data.filter((x) => x.active === '1'))
      setCurrentPage(1)
    } catch (err) {
      console.log(err)
    }
  }

  const resetSearch = () => {
    setSearchFields([
      {
        field: 'subcategory_name',
        keyword: '',
      },
    ])
    setCurrentPage(1)
    loadSubcategories()
  }

  // ================= EXCEL =================

  const downloadExcel = () => {
    window.open('http://localhost:5000/api/subcategory/download-xlsx')
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
              ? 'Edit Subcategory'
              : 'Add New Subcategory'
            : 'Subcategory Master'}{' '}
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

      {/* VIEW 1: ONLY SHOW FORM WHEN showForm IS TRUE */}
      {showForm ? (
        <Card className="dashboard-card shadow-sm border-0 rounded-4 overflow-hidden mb-4" style={{ transition: 'all 0.3s ease' }}>
          <Card.Body className="p-4">
            <h2 className="mb-4 fw-bold text-secondary" style={{ fontSize: '1.5rem' }}>
              {editId ? <span>Edit Subcategory - {subcategoryName}</span> : 'Subcategory Details'}
            </h2>

            <div className="company-form-wrapper">
              <Form className="company-form" onSubmit={handleSubmit}>
                <Row>
                  {/* PRIMARY CATEGORY */}
                  <Col xs={12} sm={6} md={6} className="mb-3">
                    <Form.Group controlId="primaryCategorySelect">
                      <Form.Label>Primary Category *</Form.Label>
                      <Form.Select
                        value={primaryId}
                        required
                        onChange={(e) => {
                          setPrimaryId(e.target.value)
                          setCategoryId('')
                        }}
                      >
                        <option value="">Select Primary Category</option>
                        {primaryList.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.primary_categories_name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* CATEGORY */}
                  <Col xs={12} sm={6} md={6} className="mb-3">
                    <Form.Group controlId="categorySelect">
                      <Form.Label>Category *</Form.Label>
                      <Form.Select
                        value={categoryId}
                        required
                        onChange={(e) => setCategoryId(e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {filteredCategories.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.category_name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* SUBCATEGORY NAME */}
                  <Col xs={12} sm={6} md={6} className="mb-3">
                    <Form.Group controlId="subcategoryName">
                      <Form.Label>Subcategory Name *</Form.Label>
                      <Form.Control
                        placeholder="Enter Subcategory Name"
                        value={subcategoryName}
                        required
                        onChange={(e) => setSubcategoryName(e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  {/* UPLOAD IMAGE */}
                  <Col xs={12} sm={6} md={6} className="mb-3">
                    <Form.Group controlId="subcategoryImage">
                      <Form.Label>Upload Image</Form.Label>
                      <Form.Control
                        id="subcategory-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files[0])}
                      />
                    </Form.Group>
                  </Col>

                  {/* CURRENT IMAGE PREVIEW (In Edit Mode) */}
                  {editId && existingImage && (
                    <Col xs={12} className="mb-3 mt-2">
                      <div className="p-2 border rounded d-inline-flex align-items-center gap-3 bg-light">
                        <img
                          src={`http://localhost:5000/uploads/${existingImage}`}
                          alt="Current"
                          width="60"
                          height="60"
                          style={{ objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <div>
                          <div className="small fw-bold text-muted">
                            Current Attached Image
                          </div>
                          <div
                            className="extra-small text-secondary"
                            style={{ fontSize: '11px' }}
                          >
                            {existingImage}
                          </div>
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
                    {editId ? 'Update Subcategory' : 'Save Subcategory'}
                  </Button>
                </div>
              </Form>
            </div>
          </Card.Body>
        </Card>
      ) : (
        /* VIEW 2: SHOW SEARCH, TABS AND TABLES ONLY WHEN FORM IS NOT ACTIVE */
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
              activeKey={tabKey}
              onSelect={(k) => {
                setTabKey(k)
                setCurrentPage(1)
              }}
              className="mb-3 custom-bootstrap-tabs"
              style={{ overflow: 'visible', flexWrap: 'wrap' }}
            >
              {/* ACTIVE TAB */}
              <Tab eventKey="active" title={`Active (${activeList.length})`}>
                <>
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
                    <table className="table table-bordered table-striped mt-3 shadow-sm bg-white table-sm w-100 list-table" style={{ fontSize: '13px' }}>
                      <thead className="table-light text-center text-secondary">
                        <tr>
                          <th className="text-center fw-semibold px-3 py-2 text-nowrap">ID</th>
                          <th className="text-center fw-semibold px-3 py-2 text-nowrap">Image</th>
                          <th className="fw-semibold px-3 py-2 text-nowrap">Primary Category</th>
                          <th className="fw-semibold px-3 py-2 text-nowrap">Category</th>
                          <th className="fw-semibold px-3 py-2 text-nowrap">Subcategory</th>
                          <th className="text-center fw-semibold px-3 py-2 text-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-center">
                        {activeList.length === 0 ? (
                          <tr>
                            <td
                              colSpan="6"
                              className="text-center text-muted small py-3"
                            >
                              No active subcategories found.
                            </td>
                          </tr>
                        ) : (
                          activeList
                            .slice(
                              (currentPage - 1) * pageSize,
                              currentPage * pageSize,
                            )
                            .map((item) => (
                              <tr key={item.id} className="align-middle">
                                <td className="text-center">{item.id}</td>
                                <td className="text-center">
                                  {item.image ? (
                                    <img
                                      src={`http://localhost:5000/uploads/${item.image}`}
                                      alt={item.subcategory_name}
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
                                <td>{item.primary_categories_name}</td>
                                <td>{item.category_name}</td>
                                <td>{item.subcategory_name}</td>
                                <td className="text-center">
                                  <Dropdown>
                                    <Dropdown.Toggle
                                      size="sm"
                                      variant="outline-secondary"
                                      className="bg-secondary text-white"
                                    >
                                      <BsThreeDotsVertical />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                      <Dropdown.Item
                                        onClick={() => handleEdit(item)}
                                      >
                                        Edit
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        className="text-danger"
                                        onClick={() => handleDelete(item.id)}
                                      >
                                        Delete
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
                </>
              </Tab>

              {/* DELETED TAB */}
              <Tab eventKey="deleted" title={`Deleted (${deletedList.length})`}>
                <>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Subcategory List</h5>

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
                    <table className="table table-bordered table-striped mt-3 shadow-sm bg-white table-sm w-100 list-table" style={{ fontSize: '13px' }}>
                      <thead className="table-dark text-center text-secondary">
                        <tr>
                          <th className="text-center fw-semibold px-3 py-2 text-nowrap">ID</th>
                          <th className="text-center fw-semibold px-3 py-2 text-nowrap">Image</th>
                          <th className="fw-semibold px-3 py-2 text-nowrap">Primary Category</th>
                          <th className="fw-semibold px-3 py-2 text-nowrap">Category</th>
                          <th className="fw-semibold px-3 py-2 text-nowrap">Subcategory</th>
                          <th className="text-center fw-semibold px-3 py-2 text-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-center">
                        {deletedList.length === 0 ? (
                          <tr>
                            <td
                              colSpan="6"
                              className="text-center text-muted small py-3"
                            >
                              No deleted items to restore.
                            </td>
                          </tr>
                        ) : (
                          deletedList
                            .slice(
                              (currentPage - 1) * pageSize,
                              currentPage * pageSize,
                            )
                            .map((item) => (
                              <tr key={item.id} className="align-middle">
                                <td className="text-center">{item.id}</td>
                                <td className="text-center">
                                  {item.image ? (
                                    <img
                                      src={`http://localhost:5000/uploads/${item.image}`}
                                      alt={item.subcategory_name}
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
                                <td>{item.primary_categories_name}</td>
                                <td>{item.category_name}</td>
                                <td>{item.subcategory_name}</td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-success btn-sm px-3"
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
                </>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      )}
    </Container>
  )
}
