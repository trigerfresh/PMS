import React, { useEffect, useState } from 'react'
import { getRoles, createRole, updateRole, deleteRole } from './api/roleApi'

export default function RoleMasterPage() {
  const [roles, setRoles] = useState([])
  const [roleName, setRoleName] = useState('')
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  // ================= LOAD =================
  const loadRoles = async () => {
    try {
      const res = await getRoles()

      const formatted = res.data.data.map((r) => ({
        id: r.id,
        role: r.role || r.role_name, // 👈 IMPORTANT FIX
      }))

      setRoles(formatted)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!roleName.trim()) return alert('Role name required')

    try {
      setLoading(true)

      if (editId) {
        await updateRole(editId, { role: roleName })
        setEditId(null)
      } else {
        await createRole({ role: roleName })
      }

      setRoleName('')
      loadRoles()
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  // ================= EDIT =================
  const handleEdit = (role) => {
    setEditId(role.id)
    setRoleName(role.role || role.role_name)
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return

    await deleteRole(id)
    loadRoles()
  }

  // ================= RESET =================
  const handleReset = () => {
    setEditId(null)
    setRoleName('')
  }

  return (
    <div className="container mt-4">
      {/* ================= HEADER ================= */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold text-primary">Role Master</h3>
      </div>

      {/* ================= CARD FORM ================= */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-2 align-items-center">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Enter Role Name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>

            <div className="col-md-4 d-flex gap-2">
              <button
                type="submit"
                className={`btn ${editId ? 'btn-warning' : 'btn-primary'} w-100`}
                disabled={loading}
              >
                {loading ? 'Saving...' : editId ? 'Update Role' : 'Create Role'}
              </button>

              {editId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleReset}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ================= TABLE CARD ================= */}
      <div className="card shadow-sm">
        <div className="card-body">
          <table className="table table-hover table-striped align-middle">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Role Name</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {roles.length > 0 ? (
                roles.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>
                      <span className="badge bg-info text-dark px-3 py-2">
                        {r.role}
                      </span>
                    </td>

                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleEdit(r)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(r.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center text-muted">
                    No Roles Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
