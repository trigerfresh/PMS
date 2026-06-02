import axios from 'axios'

const API = 'http://localhost:5000/api'

export const loginUser = async (data) => {
  return await axios.post(`${API}/auth/login`, data)
}
