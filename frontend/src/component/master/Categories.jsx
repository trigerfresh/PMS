import { useEffect, useState } from 'react'
import axios from 'axios'
import { Tabs, Tab, Dropdown } from 'react-bootstrap'
import SearchPanel from '../../utils/filterPanel'
import { FaSearch, FaPlus, FaArrowLeft } from 'react-icons/fa'
import './Company.css'

const BASE_URL = 'http://localhost:5000/api/category'
const PRIMARY_URL = 'http://localhost:5000/api/primary-category'

export default function Categories() {
  const [name, setName] = useState('')
  const [pcatId, setPcatId] = useState('')
  const [image, setImage] = useState(null)

  const [editId, setEditId] = useState(null)
  const [existingImage, setExistingImage] = useState('') // Existing image view ke liye

  const [primaryList, setPrimaryList] = useState([])
  const [activeList, setActiveList] = useState([])
  const [deletedList, setDeletedList] = useState([])

  const [showSearch, setShowSearch] = useState(false)
  const [showForm, setShowForm] = useState(false) // Toggle full form layout state

  const [searchFields, setSearchFields] = useState([
    {
      field: 'category_name',
      keyword: '',
    },
  ])

  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: '',
  })

  const searchOptions = [
    {
      value: 'primary_categories_name',
      label: 'Primary Category',
    },
    {
      value: 'category_name',
      label: 'Category',
    },
  ]

  const [key, setKey] = useState('active')

  // ================= LOAD PRIMARY =================
  useEffect(() => {
    loadPrimaryCategories()
    loadData()
  }, [])

  const loadPrimaryCategories = async () => {
    try {
      const res = await axios.get(PRIMARY_URL)
      const data = res.data.data || []
      // Only Active Primary Categories
      setPrimaryList(data.filter((item) => item.active === '0'))
    } catch (err) {
      console.log(err)
    }
  }

  // ================= LOAD CATEGORY =================
  const loadData = async () => {
    try {
      const res = await axios.get(BASE_URL)
      const data = res.data.data || []
      setActiveList(data.filter((item) => item.active === '0'))
      setDeletedList(data.filter((item) => item.active === '1'))
    } catch (err) {
      console.log(err)
    }
  }

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const formData = new FormData()
      formData.append('category_name', name)
      formData.append('pcat_id', pcatId)

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

      resetForm() // Reset data and close form view
      loadData()
    } catch (err) {
      console.log(err)
      alert('Error saving category')
    }
  }

  // ================= RESET FORM / CLOSE =================
  const resetForm = () => {
    setName('')
    setPcatId('')
    setImage(null)
    setEditId(null)
    setExistingImage('')
    setShowForm(false) // Form close hokar table dikhegi

    const fileInput = document.getElementById('category-image')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // ================= EDIT =================
  const handleEdit = (item) => {
    setEditId(item.id)
    setName(item.category_name)
    setPcatId(item.pcat_id)
    setExistingImage(item.image || '')
    setShowForm(true) // Form open ho jayega aur list hide ho jayegi
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm('Delete category?')) return
    try {
      await axios.delete(`${BASE_URL}/${id}`)
      loadData()
    } catch (err) {
      console.log(err)
    }
  }

  // ================= RESTORE =================
  const handleRestore = async (id) => {
    try {
      await axios.put(`${BASE_URL}/restore/${id}`)
      loadData()
    } catch (err) {
      console.log(err)
    }
  }

  // ================= SEARCH =================
  const handleSearch = async () => {
    try {
      const params = {
        search: searchFields,
        from: dateFilter.from,
        to: dateFilter.to,
      }
      const res = await axios.post(`${BASE_URL}/search`, params)
      const data = res.data.data || []
      setActiveList(data.filter((item) => item.active === '0'))
      setDeletedList(data.filter((item) => item.active === '1'))
    } catch (err) {
      console.log(err)
    }
  }

  const resetSearch = () => {
    setSearchFields([
      {
        field: 'category_name',
        keyword: '',
      },
    ])
    setDateFilter({ from: '', to: '' })
    loadData()
  }

  // ================= EXCEL =================
  const downloadExcel = async () => {
    try {
      const params = {
        search: searchFields,
        from: dateFilter.from,
        to: dateFilter.to,
      }
      const res = await axios.post(`${BASE_URL}/export-excel`, params, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'categories.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.log(err)
    }
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
              ? 'Modify Category'
              : 'Create New Category'
            : 'Category Master'}{' '}
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

      {/* VIEW 1: PROPER PRO FORM (Jab showForm true hoga tabhi dikhega) */}
      {showForm ? (
        <div className="card shadow-sm border-primary animate__animated animate__fadeIn">
          <div className="card-header py-2 fw-semibold">
            {editId ? 'Update Record Details' : 'Fill Category Details'}
          </div>
          <form onSubmit={handleSubmit} className="card-body p-4">
            <div className="row g-3">
              {/* PRIMARY CATEGORY SELECT */}
              <div className="col-md-6">
                <label className="form-label small fw-bold">
                  Primary Category <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-sm"
                  value={pcatId}
                  onChange={(e) => setPcatId(e.target.value)}
                  required
                >
                  <option value="">Select Primary Category</option>
                  {primaryList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.primary_categories_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CATEGORY NAME INPUT */}
              <div className="col-md-6">
                <label className="form-label small fw-bold">
                  Category Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control form-control-sm"
                  placeholder="Enter Category Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* IMAGE INPUT */}
              <div className="col-md-6">
                <label className="form-label small fw-bold">Upload Image</label>
                <input
                  id="category-image"
                  type="file"
                  accept="image/*"
                  className="form-control form-control-sm"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>

              {/* CURRENT IMAGE PREVIEW (In Edit Mode) */}
              {editId && existingImage && (
                <div className="col-md-6 d-flex align-items-end">
                  <div className="p-2 border rounded d-inline-flex align-items-center gap-2 bg-light">
                    <img
                      src={`http://localhost:5000/uploads/${existingImage}`}
                      alt="Current"
                      width="50"
                      height="50"
                      style={{ objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div style={{ fontSize: '12px' }} className="text-muted">
                      <span className="fw-bold d-block">Current Image</span>
                      {existingImage}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FORM FOOTER BUTTONS */}
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
        /* VIEW 2: SEARCH PANEL AND TABS TABLE (Jab form band hoga) */
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
            activeKey={key} 
            onSelect={(k) => setKey(k)}
            className="mb-3 custom-bootstrap-tabs"
            style={{ overflow: 'visible', flexWrap: 'wrap' }}
          >
            {/* ACTIVE TAB */}
            <Tab eventKey="active" title="Active">
              <table className="table table-bordered table-striped mt-3 bg-white shadow-sm align-middle">
                <thead className="table">
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Primary Category</th>
                    <th>Category</th>
                    <th width="120" className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeList.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center text-muted py-3 small"
                      >
                        No active categories found.
                      </td>
                    </tr>
                  ) : (
                    activeList.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>
                          {item.image ? (
                            <img
                              src={`http://localhost:5000/uploads/${item.image}`}
                              alt={item.category_name}
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
                        <td className="fw-semibold">{item.category_name}</td>
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
                                onClick={() => handleDelete(item.id)}
                                className="text-danger"
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
              <table className="table table-bordered table-striped mt-3 bg-white shadow-sm align-middle">
                <thead className="table">
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Primary Category</th>
                    <th>Category</th>
                    <th width="120" className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deletedList.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center text-muted py-3 small"
                      >
                        No deleted records.
                      </td>
                    </tr>
                  ) : (
                    deletedList.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>
                          {item.image ? (
                            <img
                              src={`http://localhost:5000/uploads/${item.image}`}
                              alt={item.category_name}
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
            </Tab>
          </Tabs>
        </>
      )}
    </div>
  )
}
