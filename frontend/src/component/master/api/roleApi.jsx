import axios from 'axios'

const API = 'http://localhost:5000/api/roles'

const token = () => localStorage.getItem('token')

export const getRoles = () =>
  axios.get(API, {
    headers: { Authorization: `Bearer ${token()}` },
  })

export const createRole = (data) =>
  axios.post(API, data, {
    headers: { Authorization: `Bearer ${token()}` },
  })

export const updateRole = (id, data) =>
  axios.put(`${API}/${id}`, data, {
    headers: { Authorization: `Bearer ${token()}` },
  })

export const deleteRole = (id) =>
  axios.delete(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${token()}` },
  })
