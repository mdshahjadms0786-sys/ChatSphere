import React, { useState, useEffect } from 'react'
import api from '../utils/axios'
import toast from 'react-hot-toast'

const ContactInfoPanel = ({ conversation, currentUser, onClose, onlineUsers }) => {
  const [sharedMedia, setSharedMedia] = useState([])
  const [pinnedMessages, setPinnedMessages] = useState([])
  const [starredMessages, setStarredMessages] = useState([])
  const [activeSection, setActiveSection] = useState(null)
  const isGroup = conversation?.isGroup
  const otherUser = !isGroup
    ? conversation?.participants?.find(p => p._id !== currentUser._id)
    : null

  useEffect(() => {
    if (conversation?._id) {
      fetchSharedMedia()
      fetchPinnedMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?._id])

  const fetchSharedMedia = async () => {
    try {
      const { data } = await api.get(`/chat/media/${conversation._id}`)
      setSharedMedia(data.messages || [])
    } catch (err) {
      console.log('Media fetch error')
    }
  }

  const fetchPinnedMessages = async () => {
    try {
      const { data } = await api.get(`/chat/pinned/${conversation._id}`)
      setPinnedMessages(data.messages || [])
    } catch (err) {
      console.log('Pinned fetch error')
    }
  }

  const fetchStarredMessages = async () => {
    try {
      const { data } = await api.get('/chat/starred')
      setStarredMessages(data.messages || [])
    } catch (err) {
      console.log('Starred fetch error')
    }
  }

  const handleExportChat = async () => {
    try {
      const { data } = await api.get(`/chat/export/${conversation._id}`)
      const blob = new Blob([data.exportText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.chatName || 'chat'}_export.txt`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Chat exported!')
    } catch (err) {
      toast.error('Failed to export chat')
    }
  }

  const handleMuteToggle = async () => {
    try {
      const { data } = await api.post(`/chat/conversation/${conversation._id}/mute`)
      toast.success(data.muted ? 'Conversation muted' : 'Conversation unmuted')
    } catch (err) {
      toast.error('Failed to toggle mute')
    }
  }

  const sectionBtn = (label, emoji, onClick, active) => (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px', background: active ? 'rgba(14,165,233,0.1)' : 'transparent',
      border: 'none', borderRadius: '10px', cursor: 'pointer',
      color: active ? '#0ea5e9' : '#cbd5e1', fontSize: '14px',
      textAlign: 'left', transition: 'all 0.2s',
    }}>
      <span style={{ fontSize: '18px' }}>{emoji}</span>
      {label}
    </button>
  )

  return (
    <div style={{
      width: '320px', backgroundColor: 'var(--bg-sidebar)',
      borderLeft: '1px solid var(--border-color)', display: 'flex',
      flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h3 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '600', margin: 0 }}>
          {isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#9ca3af',
          fontSize: '20px', cursor: 'pointer',
        }}>×</button>
      </div>

      {/* Profile Section */}
      <div style={{ padding: '24px 20px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: isGroup ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px', fontWeight: '700', color: 'white',
          margin: '0 auto 12px',
        }}>
          {isGroup
            ? conversation.groupName?.[0]?.toUpperCase()
            : otherUser?.avatar
              ? <img src={otherUser.avatar} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
              : otherUser?.name?.[0]?.toUpperCase()}
        </div>
        <h4 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '600', margin: '0 0 4px' }}>
          {isGroup ? conversation.groupName : otherUser?.name}
        </h4>
        <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
          {isGroup
            ? `${conversation.participants?.length} members`
            : otherUser?.about || 'Hey there!'}
        </p>
        {!isGroup && otherUser && (
          <p style={{
            color: onlineUsers?.[otherUser._id]?.online ? '#10b981' : '#9ca3af',
            fontSize: '12px', marginTop: '4px',
          }}>
            {onlineUsers?.[otherUser._id]?.online ? '● Online' : '○ Offline'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 16px', overflowY: 'auto', flex: 1 }}>
        {sectionBtn('Shared Media', '🖼️', () => {
          setActiveSection(activeSection === 'media' ? null : 'media')
          fetchSharedMedia()
        }, activeSection === 'media')}

        {activeSection === 'media' && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px',
            padding: '8px 0', maxHeight: '200px', overflowY: 'auto',
          }}>
            {sharedMedia.length === 0 ? (
              <p style={{ gridColumn: 'span 3', color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                No shared media
              </p>
            ) : sharedMedia.map(msg => (
              <div key={msg._id} style={{
                aspectRatio: '1', borderRadius: '4px', overflow: 'hidden',
              }}>
                <img src={msg.imageUrl} alt="" style={{
                  width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer',
                }} />
              </div>
            ))}
          </div>
        )}

        {sectionBtn('Pinned Messages', '📌', () => {
          setActiveSection(activeSection === 'pinned' ? null : 'pinned')
          fetchPinnedMessages()
        }, activeSection === 'pinned')}

        {activeSection === 'pinned' && (
          <div style={{ padding: '8px 0', maxHeight: '200px', overflowY: 'auto' }}>
            {pinnedMessages.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                No pinned messages
              </p>
            ) : pinnedMessages.map(msg => (
              <div key={msg._id} style={{
                padding: '8px 12px', backgroundColor: '#0d1721', borderRadius: '8px',
                marginBottom: '4px', borderLeft: '3px solid #0ea5e9',
              }}>
                <p style={{ color: '#0ea5e9', fontSize: '11px', margin: '0 0 2px' }}>{msg.sender?.name}</p>
                <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>{msg.content}</p>
              </div>
            ))}
          </div>
        )}

        {sectionBtn('Starred Messages', '⭐', () => {
          setActiveSection(activeSection === 'starred' ? null : 'starred')
          fetchStarredMessages()
        }, activeSection === 'starred')}

        {activeSection === 'starred' && (
          <div style={{ padding: '8px 0', maxHeight: '200px', overflowY: 'auto' }}>
            {starredMessages.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                No starred messages
              </p>
            ) : starredMessages.map(msg => (
              <div key={msg._id} style={{
                padding: '8px 12px', backgroundColor: '#0d1721', borderRadius: '8px',
                marginBottom: '4px', borderLeft: '3px solid #eab308',
              }}>
                <p style={{ color: '#eab308', fontSize: '11px', margin: '0 0 2px' }}>{msg.sender?.name}</p>
                <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>{msg.content}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '8px', borderTop: '1px solid #374151', paddingTop: '8px' }}>
          {sectionBtn('Mute Conversation', '🔇', handleMuteToggle)}
          {sectionBtn('Export Chat', '📥', handleExportChat)}
        </div>

        {/* Group Members */}
        {isGroup && (
          <div style={{ marginTop: '12px', borderTop: '1px solid #374151', paddingTop: '12px' }}>
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 8px', paddingLeft: '4px' }}>
              Members ({conversation.participants?.length})
            </p>
            {conversation.participants?.map(p => (
              <div key={p._id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 4px',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: '#0ea5e9', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '13px', fontWeight: '600', flexShrink: 0,
                }}>
                  {p.avatar
                    ? <img src={p.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    : p.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>
                    {p.name} {p._id === currentUser._id ? '(You)' : ''}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>{p.about || ''}</p>
                </div>
                {conversation.groupAdmin === p._id && (
                  <span style={{
                    fontSize: '10px', color: '#10b981', backgroundColor: '#10b98120',
                    padding: '2px 6px', borderRadius: '4px',
                  }}>Admin</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactInfoPanel
