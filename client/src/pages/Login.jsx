import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash, FaComments } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import toast from 'react-hot-toast'
import api from '../utils/axios'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpName, setOtpName] = useState('')
  const [otpStep, setOtpStep] = useState('phone')
  const [otpLoading, setOtpLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const auth = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      auth.login(data.user)
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
      toast.error(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api/auth/google'
  }

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    setOtpLoading(true)
    try {
      const { data } = await api.post('/auth/send-otp', { phone: phone.trim() })
      setPhone(data.phone || phone.trim())
      setOtpStep('verify')
      toast.success('OTP sent successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpName.trim() || !phone.trim() || !otp.trim()) {
      toast.error('Please fill in all OTP fields')
      return
    }

    setOtpLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', {
        name: otpName.trim(),
        phone: phone.trim(),
        otp: otp.trim()
      })
      auth.login(data.user)
      toast.success('Logged in successfully')
      navigate('/chat')
    } catch (err) {
      toast.error(err.response?.data?.error || 'OTP verification failed')
    } finally {
      setOtpLoading(false)
    }
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

        <h2 className="text-3xl font-bold text-white mb-2 text-center">Welcome back</h2>
        <p className="text-gray-400 text-center mb-8">Sign in to continue</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg p-3 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-4 text-gray-400 text-sm">OR</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg p-3 flex items-center justify-center gap-3 transition-colors"
        >
          <FcGoogle className="text-xl" />
          Continue with Google
        </button>

        {otpStep === 'phone' && (
          <button
            onClick={handleSendOtp}
            disabled={otpLoading}
            className="w-full mt-4 border border-primary-500 text-primary-500 hover:bg-primary-500/10 font-semibold rounded-lg p-3 transition-colors"
          >
            {otpLoading ? 'Sending OTP...' : 'Login with Phone OTP'}
          </button>
        )}

        <div className="mt-4 space-y-3">
          {otpStep === 'phone' ? (
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-dark-200 border border-dark-100 text-white rounded-lg p-3 focus:outline-none focus:border-primary-500 transition-colors"
            />
          ) : (
            <>
              <input
                type="text"
                placeholder="Your name"
                value={otpName}
                onChange={(e) => setOtpName(e.target.value)}
                className="w-full bg-dark-200 border border-dark-100 text-white rounded-lg p-3 focus:outline-none focus:border-primary-500 transition-colors"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-dark-200 border border-dark-100 text-white rounded-lg p-3 focus:outline-none focus:border-primary-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-dark-200 border border-dark-100 text-white rounded-lg p-3 focus:outline-none focus:border-primary-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpLoading}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg p-3 transition-colors disabled:opacity-50"
              >
                {otpLoading ? 'Verifying OTP...' : 'Continue to Chat'}
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading}
                className="w-full text-sm text-primary-500 hover:underline"
              >
                Resend OTP
              </button>
            </>
          )}
        </div>

        <p className="text-gray-400 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-500 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
