import axios from 'axios'

const BASE_URL = 'http://localhost:5000/api/booking'

// 🔥 token helper
const getAuthHeader = () => {
  const token = localStorage.getItem('token')

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
}

export const getBookings = () => axios.get(BASE_URL, getAuthHeader())

export const getBookingById = (id) =>
  axios.get(`${BASE_URL}/${id}`, getAuthHeader())

export const createBooking = (data) =>
  axios.post(BASE_URL, data, getAuthHeader())

export const updateBooking = (id, data) =>
  axios.put(`${BASE_URL}/${id}`, data, getAuthHeader())

export const deleteBooking = (id) =>
  axios.delete(`${BASE_URL}/${id}`, getAuthHeader())
