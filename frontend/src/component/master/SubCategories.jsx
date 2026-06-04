import { useEffect, useState } from 'react'
import axios from 'axios'
import { Tabs, Tab, Dropdown } from 'react-bootstrap'
import { FaSearch, FaPlus, FaTimes, FaArrowLeft } from 'react-icons/fa'
import SearchPanel from '../../utils/filterPanel'
import './Company.css'

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
    loadSubcategories()
  }

  // ================= EXCEL =================

  const downloadExcel = () => {
    window.open('http://localhost:5000/api/subcategory/download-xlsx')
  }

  return (
    <div className="page-container">
      {/* HEADER SECTION */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
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
          {!showForm && <span className="text-success">({activeList.length})</span>}
        </h1>

        <div className="page-actions d-flex gap-3 align-items-center">
          {!showForm && (
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
                transition: 'all 0.2s'
              }}
            >
              <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
            </button>
          )}

          <button
            type="button"
            className="btn-primary shadow-sm rounded-3"
            onClick={() => {
              if (showForm) {
                resetForm()
              } else {
                setShowForm(true)
                setShowSearch(false)
              }
            }}
            style={{
              padding: '6px 14px',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500',
              transition: 'all 0.2s'
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
        <div className="card shadow-sm border-primary animate__animated animate__fadeIn">
          <div className="card-header bg-primary text-white py-2 fw-semibold">
            {editId ? 'Update Existing Record' : 'Fill Subcategory Details'}
          </div>
          <form onSubmit={handleSubmit} className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">
                  Primary Category <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-sm"
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
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">
                  Category <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-sm"
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
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">
                  Subcategory Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control form-control-sm"
                  placeholder="Enter Subcategory Name"
                  value={subcategoryName}
                  required
                  onChange={(e) => setSubcategoryName(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Upload Image</label>
                <input
                  id="subcategory-image"
                  type="file"
                  accept="image/*"
                  className="form-control form-control-sm"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>

              {editId && existingImage && (
                <div className="col-12 mt-2">
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
                </div>
              )}
            </div>

            <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn btn-light btn-sm px-4 border"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success btn-sm px-5 fw-bold"
              >
                {editId ? 'Update Changes' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW 2: SHOW SEARCH, TABS AND TABLES ONLY WHEN FORM IS NOT ACTIVE */
        <>
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
            onSelect={(k) => setTabKey(k)}
            className="mb-3 custom-bootstrap-tabs"
            style={{ overflow: 'visible', flexWrap: 'wrap' }}
          >
            {/* ACTIVE TAB */}
            <Tab eventKey="active" title="Active">
              <table className="table table-bordered table-striped mt-3 shadow-sm bg-white">
                <thead className="table">
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Primary Category</th>
                    <th>Category</th>
                    <th>Subcategory</th>
                    <th width="120" className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
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
                    activeList.map((item) => (
                      <tr key={item.id} className="align-middle">
                        <td>{item.id}</td>
                        <td>
                          {item.image ? (
                            <img
                              src={`http://localhost:5000/uploads/${item.image}`}
                              alt={item.subcategory_name}
                              width="50"
                              height="50"
                              style={{
                                objectFit: 'cover',
                                borderRadius: '5px',
                              }}
                            />
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>{item.primary_categories_name}</td>
                        <td>{item.category_name}</td>
                        <td className="fw-semibold">{item.subcategory_name}</td>
                        <td className="text-center">
                          <Dropdown>
                            <Dropdown.Toggle
                              size="sm"
                              variant="outline-secondary"
                              className="bg-secondary text-white"
                            >
                              Action
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleEdit(item)}>
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
            </Tab>

            {/* DELETED TAB */}
            <Tab eventKey="deleted" title="Deleted">
              <table className="table table-bordered table-striped mt-3 shadow-sm bg-white">
                <thead className="table">
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Primary Category</th>
                    <th>Category</th>
                    <th>Subcategory</th>
                    <th width="120" className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
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
                    deletedList.map((item) => (
                      <tr key={item.id} className="align-middle">
                        <td>{item.id}</td>
                        <td>
                          {item.image ? (
                            <img
                              src={`http://localhost:5000/uploads/${item.image}`}
                              alt={item.subcategory_name}
                              width="50"
                              height="50"
                              style={{
                                objectFit: 'cover',
                                borderRadius: '5px',
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
            </Tab>
          </Tabs>
        </>
      )}
    </div>
  )
}
