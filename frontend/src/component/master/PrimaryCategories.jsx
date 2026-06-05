import { useEffect, useState } from 'react'
import axios from 'axios'
import { Tabs, Tab, Dropdown } from 'react-bootstrap'
import SearchPanel from '../../utils/filterPanel'
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

  // ================= LOAD =================
  const loadData = async () => {
    try {
      const res = await axios.get(BASE_URL)
      const data = res.data.data || []

      setActiveList(data.filter((i) => i.active === '0'))
      setDeletedList(data.filter((i) => i.active === '1'))
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
            className={`btn shadow-sm rounded-3 text-white ${
              showForm ? 'btn-danger' : 'btn-primary'
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
        <div className="card shadow-sm border-primary">
          <div className="card-header bg-primary text-white py-2 fw-semibold">
            {editId
              ? 'Edit Primary Category Details'
              : 'Add New Primary Category'}
          </div>
          <form onSubmit={handleSubmit} className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">
                  Primary Category Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control form-control-sm"
                  placeholder="Enter Category Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">
                  Category Image
                </label>
                <input
                  id="primary-image"
                  type="file"
                  className="form-control form-control-sm"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>

              {editId && existingImage && (
                <div className="col-md-6">
                  <div className="p-2 border rounded d-inline-flex align-items-center gap-2 bg-light">
                    <img
                      src={`http://localhost:5000/uploads/${existingImage}`}
                      alt="Current"
                      width="55"
                      height="55"
                      style={{ objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div style={{ fontSize: '12px' }} className="text-muted">
                      <span className="fw-bold d-block">Current Image:</span>
                      {existingImage}
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
        /* VIEW 2: TABS TABLE LIST (Fixed structure width attributes) */
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
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table table-bordered table-striped bg-white shadow-sm align-middle table-sm w-auto mb-0">
                  <thead className="table text-center">
                    <tr>
                      <th width="50" className="text-center">
                        ID
                      </th>
                      <th width="200">Name</th>
                      <th width="70" className="text-center">
                        Image
                      </th>
                      <th width="90" className="text-center">
                        Action
                      </th>
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
                      activeList.map((item) => (
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
                                <Dropdown.Item onClick={() => handleEdit(item)}>
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
              </div>
            </Tab>

            {/* DELETED TAB */}
            <Tab eventKey="deleted" title="Deleted">
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table table-bordered table-striped bg-white shadow-sm align-middle table-sm w-auto mb-0">
                  <thead className="table-dark text-center">
                    <tr>
                      <th width="50" className="text-center">
                        ID
                      </th>
                      <th width="200">Name</th>
                      <th width="70" className="text-center">
                        Image
                      </th>
                      <th width="90" className="text-center">
                        Action
                      </th>
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
                      deletedList.map((item) => (
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
              </div>
            </Tab>
          </Tabs>
        </>
      )}
    </div>
  )
}
