import axios from 'axios'

const API = 'http://localhost:5000/api/hotels'

const token = () => localStorage.getItem('token')

export const getHotels = () =>
  axios.get(API, {
    headers: {
      Authorization: `Bearer ${token()}`,
    },
  })
