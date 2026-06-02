import axios from 'axios'

const API = 'http://localhost:5000/api/amenities'

const token = () => localStorage.getItem('token')

// GET ALL
export const getAmenities = () =>
  axios.get(API, {
    headers: {
      Authorization: `Bearer ${token()}`,
    },
  })

// CREATE
export const createAmenity = (data) =>
  axios.post(API, data, {
    headers: {
      Authorization: `Bearer ${token()}`,
    },
  })

// UPDATE
export const updateAmenity = (id, data) =>
  axios.put(`${API}/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token()}`,
    },
  })

// DELETE
export const deleteAmenity = (id) =>
  axios.delete(`${API}/${id}`, {
    headers: {
      Authorization: `Bearer ${token()}`,
    },
  })
