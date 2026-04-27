import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.startsWith('/auth/')
    if (err.response?.status === 401 && !isAuthRoute) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
