import { useEffect, useState } from 'react'
import axios from 'axios'
import { Tabs, Tab, Dropdown } from 'react-bootstrap'

const SUB_URL = 'http://localhost:5000/api/subcategory'
const PRIMARY_URL = 'http://localhost:5000/api/primary-category'
const CATEGORY_URL = 'http://localhost:5000/api/category'

export default function SubCategories() {
  const [primaryList, setPrimaryList] = useState([])
  const [categoryList, setCategoryList] = useState([])

  const [primaryId, setPrimaryId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryName, setSubcategoryName] = useState('')

  const [editId, setEditId] = useState(null)

  const [activeList, setActiveList] = useState([])
  const [deletedList, setDeletedList] = useState([])

  const [tabKey, setTabKey] = useState('active')

  // ================= LOAD PRIMARY =================

  useEffect(() => {
    loadPrimary()
    loadCategories()
    loadSubcategories()
  }, [])

  const loadPrimary = async () => {
    const res = await axios.get(PRIMARY_URL)

    setPrimaryList((res.data.data || []).filter((x) => x.active === '0'))
  }

  const loadCategories = async () => {
    const res = await axios.get(CATEGORY_URL)

    setCategoryList((res.data.data || []).filter((x) => x.active === '0'))
  }

  // ================= LOAD SUBCATEGORY =================

  const loadSubcategories = async () => {
    const res = await axios.get(SUB_URL)

    const data = res.data.data || []

    setActiveList(data.filter((x) => x.active === '0'))
    setDeletedList(data.filter((x) => x.active === '1'))
  }

  // ================= SUBMIT =================

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      category_id: categoryId,
      subcategory_name: subcategoryName,
    }

    if (editId) {
      await axios.put(`${SUB_URL}/${editId}`, payload)
    } else {
      await axios.post(SUB_URL, payload)
    }

    resetForm()
    loadSubcategories()
  }

  // ================= RESET =================

  const resetForm = () => {
    setPrimaryId('')
    setCategoryId('')
    setSubcategoryName('')
    setEditId(null)
  }

  // ================= EDIT =================

  const handleEdit = (item) => {
    setEditId(item.id)

    setPrimaryId(item.primary_id)
    setCategoryId(item.category_id)
    setSubcategoryName(item.subcategory_name)
  }

  // ================= DELETE =================

  const handleDelete = async (id) => {
    if (!window.confirm('Delete subcategory?')) return

    await axios.delete(`${SUB_URL}/${id}`)

    loadSubcategories()
  }

  // ================= RESTORE =================

  const handleRestore = async (id) => {
    await axios.put(`${SUB_URL}/restore/${id}`)

    loadSubcategories()
  }

  // ================= FILTER CATEGORY =================

  const filteredCategories = categoryList.filter(
    (c) => String(c.pcat_id) === String(primaryId),
  )

  return (
    <div className="container mt-4">
      <h3>Subcategory Master</h3>

      {/* FORM */}

      <form onSubmit={handleSubmit} className="card p-3 mb-3">
        <div className="d-flex gap-2 align-items-center">
          <select
            className="form-control form-control-sm"
            style={{ maxWidth: '220px' }}
            value={primaryId}
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

          <select
            className="form-control form-control-sm"
            style={{ maxWidth: '220px' }}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select Category</option>

            {filteredCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.category_name}
              </option>
            ))}
          </select>

          <input
            className="form-control form-control-sm"
            style={{ maxWidth: '220px' }}
            placeholder="Subcategory Name"
            value={subcategoryName}
            onChange={(e) => setSubcategoryName(e.target.value)}
          />

          <button className="btn btn-primary btn-sm">
            {editId ? 'Update' : 'Add'}
          </button>
        </div>
      </form>

      {/* TABS */}

      <Tabs activeKey={tabKey} onSelect={(k) => setTabKey(k)}>
        {/* ACTIVE */}

        <Tab eventKey="active" title="Active">
          <table className="table table-bordered mt-3">
            <thead>
              <tr>
                <th>ID</th>
                <th>Primary Category</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th width="120">Action</th>
              </tr>
            </thead>

            <tbody>
              {activeList.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>

                  <td>{item.primary_categories_name}</td>

                  <td>{item.category_name}</td>

                  <td>{item.subcategory_name}</td>

                  <td>
                    <Dropdown>
                      <Dropdown.Toggle size="sm" variant="secondary">
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
              ))}
            </tbody>
          </table>
        </Tab>

        {/* DELETED */}

        <Tab eventKey="deleted" title="Deleted">
          <table className="table table-bordered mt-3">
            <thead>
              <tr>
                <th>ID</th>
                <th>Primary Category</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th width="120">Action</th>
              </tr>
            </thead>

            <tbody>
              {deletedList.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>

                  <td>{item.primary_categories_name}</td>

                  <td>{item.category_name}</td>

                  <td>{item.subcategory_name}</td>

                  <td>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleRestore(item.id)}
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tab>
      </Tabs>
    </div>
  )
}
