import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash, FaComments } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import toast from 'react-hot-toast'
import api from '../utils/axios'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const auth = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', { name, email, password })
      auth.login(data.user)
      navigate('/chat')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = () => {
    window.location.href = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/auth/google'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-300 px-4">
      <div className="w-full max-w-md bg-dark-100 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4">
            <FaComments className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-primary-500">ChatSphere</h1>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h2>
        <p className="text-gray-400 text-center mb-8">Join ChatSphere today</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-200 border border-dark-100 text-white rounded-lg p-3 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-200 border border-dark-100 text-white rounded-lg p-3 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-200 border border-dark-100 text-white rounded-lg p-3 focus:outline-none focus:border-primary-500 transition-colors pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-dark-200 border border-dark-100 text-white rounded-lg p-3 focus:outline-none focus:border-primary-500 transition-colors pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg p-3 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-4 text-gray-400 text-sm">OR</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        <button
          onClick={handleGoogleRegister}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg p-3 flex items-center justify-center gap-3 transition-colors"
        >
          <FcGoogle className="text-xl" />
          Continue with Google
        </button>

        <p className="text-gray-400 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register