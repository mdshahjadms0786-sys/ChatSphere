import axios from 'axios'

const publicRoutes = new Set(['/login', '/register'])

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL 
    ? process.env.REACT_APP_API_URL + '/api'
    : 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isAuthBootstrapRequest = requestUrl.includes('/auth/me')
    const isPublicRoute = publicRoutes.has(window.location.pathname)

    if (error.response?.status === 401 && !isAuthBootstrapRequest && !isPublicRoute) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
