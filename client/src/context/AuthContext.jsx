import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/axios'

const AuthContext = createContext()
const publicRoutes = new Set(['/login', '/register'])

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (publicRoutes.has(window.location.pathname)) {
      setLoading(false)
      return
    }

    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/me')
        setUser(data.user)
        setIsAuthenticated(true)
      } catch (error) {
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.log(error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/login'
    }
  }

  const updateUser = (userData) => setUser(userData)

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated,
      login, logout, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext
