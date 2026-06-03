import { useEffect, useState } from 'react'
import axios from 'axios'
import { Tabs, Tab, Dropdown } from 'react-bootstrap'

const BASE_URL = 'http://localhost:5000/api/primary-category'

export default function PrimaryCategories() {
  const [name, setName] = useState('')
  const [editId, setEditId] = useState(null)

  const [activeList, setActiveList] = useState([])
  const [deletedList, setDeletedList] = useState([])

  const [key, setKey] = useState('active')

  // ================= LOAD =================
  const loadData = async () => {
    const res = await axios.get(BASE_URL)
    const data = res.data.data || []

    setActiveList(data.filter((i) => i.active === '0'))
    setDeletedList(data.filter((i) => i.active === '1'))
  }

  useEffect(() => {
    loadData()
  }, [])

  // ================= CREATE / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      primary_categories_name: name,
    }

    if (editId) {
      await axios.put(`${BASE_URL}/${editId}`, payload)
    } else {
      await axios.post(BASE_URL, payload)
    }

    setName('')
    setEditId(null)
    loadData()
  }

  // ================= EDIT =================
  const handleEdit = (item) => {
    setEditId(item.id)
    setName(item.primary_categories_name)
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
      <h3>Primary Category Master</h3>

      {/* ================= FORM ================= */}
      <form onSubmit={handleSubmit} className="card p-3 mb-3">
        <div className="d-flex gap-2 align-items-center">
          <input
            className="form-control form-control-sm" // smaller input
            style={{ maxWidth: '250px' }} // limit width
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
      <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
        {/* ACTIVE */}
        <Tab eventKey="active" title="Active">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {activeList.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.primary_categories_name}</td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle
                        variant="secondary"
                        size="sm"
                        id={`dropdown-${item.id}`}
                      >
                        Action
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
              ))}
            </tbody>
          </table>
        </Tab>

        {/* DELETED */}
        <Tab eventKey="deleted" title="Deleted">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {deletedList.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.primary_categories_name}</td>
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
