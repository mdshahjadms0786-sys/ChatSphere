import React, { useState } from 'react'
import api from '../utils/axios'
import toast from 'react-hot-toast'

const SettingsModal = ({ user, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('general')
  const [theme, setTheme] = useState(user?.theme || 'dark')
  const [notifSound, setNotifSound] = useState(user?.notificationSettings?.sound !== false)
  const [notifDesktop, setNotifDesktop] = useState(user?.notificationSettings?.desktop !== false)
  const [notifPreview, setNotifPreview] = useState(user?.notificationSettings?.messagePreview !== false)
  const [privacyLastSeen, setPrivacyLastSeen] = useState(user?.privacySettings?.lastSeen || 'everyone')
  const [privacyPhoto, setPrivacyPhoto] = useState(user?.privacySettings?.profilePhoto || 'everyone')
  const [privacyAbout, setPrivacyAbout] = useState(user?.privacySettings?.about || 'everyone')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      const { data } = await api.put('/chat/settings', {
        theme,
        notificationSettings: {
          sound: notifSound,
          desktop: notifDesktop,
          messagePreview: notifPreview,
        },
        privacySettings: {
          lastSeen: privacyLastSeen,
          profilePhoto: privacyPhoto,
          about: privacyAbout,
        },
      })
      onUpdate(data.user)
      toast.success('Settings saved!')
    } catch (err) {
      toast.error('Failed to save settings')
    }
    setLoading(false)
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill all password fields')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.put('/chat/change-password', { currentPassword, newPassword })
      toast.success('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password')
    }
    setLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm')
      return
    }
    setLoading(true)
    try {
      await api.delete('/chat/delete-account', {
        data: { password: currentPassword }
      })
      toast.success('Account deleted')
      window.location.href = '/login'
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account')
    }
    setLoading(false)
  }

  const tabs = [
    { id: 'general', label: '⚙️ General', },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'privacy', label: '🔒 Privacy' },
    { id: 'security', label: '🛡️ Security' },
  ]

  const selectStyle = {
    width: '100%', backgroundColor: '#0d1721', color: 'white',
    border: '1px solid #374151', borderRadius: '8px', padding: '10px',
    outline: 'none', fontSize: '14px', cursor: 'pointer',
  }

  const inputStyle = {
    width: '100%', backgroundColor: '#0d1721', color: 'white',
    border: '1px solid #374151', borderRadius: '8px', padding: '10px',
    outline: 'none', fontSize: '14px', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'var(--bg-sidebar)', borderRadius: '16px', padding: '0',
        width: '520px', maxWidth: '95vw', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
        }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '20px', fontWeight: '700', margin: 0 }}>Settings</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#9ca3af',
            fontSize: '24px', cursor: 'pointer',
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto',
        }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '12px 8px', background: 'none', border: 'none',
              color: activeTab === tab.id ? '#0ea5e9' : '#9ca3af',
              borderBottom: activeTab === tab.id ? '2px solid #0ea5e9' : '2px solid transparent',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'general' && (
            <div>
              <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Theme</label>
              <select value={theme} onChange={e => setTheme(e.target.value)} style={selectStyle}>
                <option value="dark">🌙 Dark</option>
                <option value="light">☀️ Light</option>
                <option value="system">💻 System</option>
              </select>
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '6px' }}>
                Choose your preferred theme appearance
              </p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Notification Sound', value: notifSound, setter: setNotifSound, desc: 'Play sound on new messages' },
                { label: 'Desktop Notifications', value: notifDesktop, setter: setNotifDesktop, desc: 'Show browser notifications' },
                { label: 'Message Preview', value: notifPreview, setter: setNotifPreview, desc: 'Show message content in notifications' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px', backgroundColor: '#0d1721', borderRadius: '10px',
                }}>
                  <div>
                    <p style={{ color: 'white', fontSize: '14px', margin: '0 0 2px' }}>{item.label}</p>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>{item.desc}</p>
                  </div>
                  <button onClick={() => item.setter(!item.value)} style={{
                    width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                    backgroundColor: item.value ? '#0ea5e9' : '#374151',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      backgroundColor: 'white', position: 'absolute', top: '3px',
                      left: item.value ? '23px' : '3px', transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Last Seen', value: privacyLastSeen, setter: setPrivacyLastSeen },
                { label: 'Profile Photo', value: privacyPhoto, setter: setPrivacyPhoto },
                { label: 'About', value: privacyAbout, setter: setPrivacyAbout },
              ].map(item => (
                <div key={item.label}>
                  <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                    {item.label}
                  </label>
                  <select value={item.value} onChange={e => item.setter(e.target.value)} style={selectStyle}>
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ color: 'white', fontSize: '16px', margin: '0 0 12px' }}>Change Password</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="password" placeholder="Current password" value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} />
                  <input type="password" placeholder="New password" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
                  <input type="password" placeholder="Confirm new password" value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)} style={inputStyle} />
                  <button onClick={handleChangePassword} disabled={loading} style={{
                    backgroundColor: '#0ea5e9', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '10px', fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  }}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              <div style={{
                borderTop: '1px solid #374151', paddingTop: '20px',
              }}>
                <h3 style={{ color: '#ef4444', fontSize: '16px', margin: '0 0 8px' }}>⚠️ Danger Zone</h3>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 12px' }}>
                  Once you delete your account, there is no going back.
                </p>
                <input type="text" placeholder='Type "DELETE" to confirm'
                  value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                  style={{ ...inputStyle, borderColor: '#ef4444', marginBottom: '10px' }} />
                <button onClick={handleDeleteAccount} disabled={loading || deleteConfirm !== 'DELETE'} style={{
                  width: '100%', backgroundColor: deleteConfirm === 'DELETE' ? '#ef4444' : '#374151',
                  color: 'white', border: 'none', borderRadius: '8px', padding: '10px',
                  fontWeight: '600', cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed',
                }}>
                  Delete Account Permanently
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button (for general/notification/privacy) */}
        {['general', 'notifications', 'privacy'].includes(activeTab) && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={handleSaveSettings} disabled={loading} style={{
              width: '100%', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: 'white', border: 'none', borderRadius: '10px', padding: '12px',
              fontSize: '15px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsModal
