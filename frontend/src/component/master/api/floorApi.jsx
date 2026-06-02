import axios from 'axios'

const API = 'http://localhost:5000/api'

// export const getFloorsByHotel = (hotel_id) =>
//   axios.get(`${API}/floors/${hotel_id}`)

export const getFloorsByHotel = (hotelId, searchFields = []) => {
  return axios.get(`${API}/floors/${hotelId}`, {
    params: {
      searchFields: JSON.stringify(searchFields),
    },
  })
}

export const createFloor = (data) => axios.post(`${API}/floor`, data)

export const updateFloor = (id, data) => axios.put(`${API}/floor/${id}`, data)

export const deleteFloor = (id) => axios.delete(`${API}/floor/${id}`)

export const exportFloorsExcel = (hotelId) => {
  return axios.get(`/floors/export/${hotelId}`, {
    responseType: 'blob',
  })
}
