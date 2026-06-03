import { useEffect, useState } from 'react'
import axios from 'axios'
import { Tabs, Tab, Dropdown } from 'react-bootstrap'

const BASE_URL = 'http://localhost:5000/api/category'
const PRIMARY_URL = 'http://localhost:5000/api/primary-category'

export default function Categories() {
  const [name, setName] = useState('')
  const [pcatId, setPcatId] = useState('')
  const [editId, setEditId] = useState(null)

  const [primaryList, setPrimaryList] = useState([])

  const [activeList, setActiveList] = useState([])
  const [deletedList, setDeletedList] = useState([])

  const [key, setKey] = useState('active')

  // ================= LOAD PRIMARY =================
  useEffect(() => {
    axios.get(PRIMARY_URL).then((res) => {
      setPrimaryList(res.data.data || [])
    })
  }, [])

  // ================= LOAD CATEGORY =================
  const loadData = async () => {
    const res = await axios.get(BASE_URL)
    const data = res.data.data || []

    setActiveList(data.filter((i) => i.active === '0'))
    setDeletedList(data.filter((i) => i.active === '1'))
  }

  useEffect(() => {
    loadData()
  }, [])

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      category_name: name,
      pcat_id: pcatId,
    }

    if (editId) {
      await axios.put(`${BASE_URL}/${editId}`, payload)
    } else {
      await axios.post(BASE_URL, payload)
    }

    setName('')
    setPcatId('')
    setEditId(null)
    loadData()
  }

  // ================= EDIT =================
  const handleEdit = (item) => {
    setEditId(item.id)
    setName(item.category_name)
    setPcatId(item.pcat_id)
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    await axios.delete(`${BASE_URL}/${id}`)
    loadData()
  }

  // ================= RESTORE =================
  const handleRestore = async (id) => {
    await axios.put(`${BASE_URL}/restore/${id}`)
    loadData()
  }

  return (
    <div className="container mt-4">
      <h3>Category Master</h3>

      {/* ================= FORM ================= */}
      <form onSubmit={handleSubmit} className="card p-3 mb-3">
        <div className="d-flex gap-2 align-items-center">
          {/* PRIMARY CATEGORY DROPDOWN */}
          <select
            className="form-control form-control-sm"
            style={{ maxWidth: '200px' }}
            value={pcatId}
            onChange={(e) => setPcatId(e.target.value)}
          >
            <option value="">Select Primary Category</option>
            {primaryList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.primary_categories_name}
              </option>
            ))}
          </select>

          {/* CATEGORY NAME */}
          <input
            className="form-control form-control-sm"
            style={{ maxWidth: '200px' }}
            placeholder="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button className="btn btn-primary btn-sm text-nowrap">
            {editId ? 'Update' : 'Add'}
          </button>
        </div>
      </form>

      {/* ================= TABS ================= */}
      <Tabs activeKey={key} onSelect={(k) => setKey(k)}>
        {/* ACTIVE */}
        <Tab eventKey="active" title="Active">
          <table className="table table-bordered mt-3">
            <thead>
              <tr>
                <th>ID</th>
                <th>Primary</th>
                <th>Category</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {activeList.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.primary_categories_name}</td>
                  <td>{item.category_name}</td>

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
                          onClick={() => handleDelete(item.id)}
                          className="text-danger"
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
                <th>Primary</th>
                <th>Category</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {deletedList.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.primary_categories_name}</td>
                  <td>{item.category_name}</td>

                  <td>
                    <button
                      className="btn btn-sm btn-success"
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
