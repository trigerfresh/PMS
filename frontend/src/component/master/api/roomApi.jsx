import axios from 'axios'

const API = 'http://localhost:5000/api/rooms'

const token = () => localStorage.getItem('token')

export const getRooms = () =>
  axios.get(API, {
    headers: { Authorization: `Bearer ${token()}` },
  })

export const createRoom = (data) =>
  axios.post(API, data, {
    headers: { Authorization: `Bearer ${token()}` },
  })

export const updateRoom = (id, data) =>
  axios.put(`${API}/${id}`, data, {
    headers: { Authorization: `Bearer ${token()}` },
  })

export const deleteRoom = (id) =>
  axios.delete(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${token()}` },
  })

export const getRoomsByHotel = (hotel_id) =>
  axios.get(`${API}/hotel/${hotel_id}`, {
    headers: { Authorization: `Bearer ${token()}` },
  })
