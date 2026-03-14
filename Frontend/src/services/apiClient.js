import axios from 'axios'

let authToken = null

export function setApiAuthToken(token) {
  authToken = token
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

export default apiClient