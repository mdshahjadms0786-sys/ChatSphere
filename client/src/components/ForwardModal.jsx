import React, { useState } from 'react'
import api from '../utils/axios'
import toast from 'react-hot-toast'

const ForwardModal = ({ 
  message, 
  onClose, 
  conversations,
  socket,
  currentUser
}) => {
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  const toggleSelect = (convId) => {
    setSelected(prev =>
      prev.includes(convId)
        ? prev.filter(id => id !== convId)
        : [...prev, convId]
    )
  }

  const handleForward = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one conversation')
      return
    }
    setLoading(true)
    try {
      selected.forEach(convId => {
        const conv = conversations.find(
          c => c._id === convId)
        if (!conv) return

        socket.emit('message:send', {
          conversationId: convId,
          senderId: currentUser._id,
          content: message.content || '',
          type: message.type || 'text',
          imageUrl: message.imageUrl || '',
          audioUrl: message.audioUrl || '',
          replyTo: null,
          isForwarded: true,
          participants: conv.participants
            .map(p => p._id)
        })
      })
      toast.success('Message forwarded!')
      onClose()
    } catch(err) {
      toast.error('Failed to forward message')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1e2a35',
        borderRadius: '16px',
        padding: '24px',
        width: '380px',
        maxWidth: '90vw',
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        Header:
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0
          }}>
            Forward Message
          </h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '24px',
            cursor: 'pointer'
          }}>×</button>
        </div>

        Message preview:
        <div style={{
          backgroundColor: '#0d1721',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '16px',
          borderLeft: '3px solid #0ea5e9'
        }}>
          <p style={{
            color: '#9ca3af',
            fontSize: '11px',
            margin: '0 0 4px'
          }}>
            Forwarding:
          </p>
          <p style={{
            color: 'white',
            fontSize: '13px',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {message.type === 'image' 
              ? '📷 Image' 
              : message.type === 'audio'
              ? '🎤 Voice message'
              : message.content}
          </p>
        </div>

        Conversations list:
        <p style={{
          color: '#9ca3af',
          fontSize: '12px',
          margin: '0 0 8px'
        }}>
          Select conversations:
        </p>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '16px'
        }}>
          {conversations.map(conv => {
            const otherUser = conv.participants
              ?.find(p => p._id !== currentUser._id)
            const name = conv.isGroup 
              ? conv.groupName 
              : otherUser?.name
            const isSelected = selected
              .includes(conv._id)

            return (
              <div
                key={conv._id}
                onClick={() => toggleSelect(conv._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: isSelected 
                    ? '#0ea5e920' : 'transparent',
                  border: isSelected 
                    ? '1px solid #0ea5e9' 
                    : '1px solid transparent',
                  marginBottom: '4px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: conv.isGroup 
                    ? '#10b981' : '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {name?.[0]?.toUpperCase()}
                </div>
                <p style={{
                  color: 'white',
                  margin: 0,
                  fontSize: '14px',
                  flex: 1
                }}>
                  {name}
                </p>
                {isSelected && (
                  <span style={{
                    color: '#0ea5e9',
                    fontSize: '18px'
                  }}>✓</span>
                )}
              </div>
            )
          })}
        </div>

        Forward button:
        <button
          onClick={handleForward}
          disabled={loading || selected.length === 0}
          style={{
            width: '100%',
            backgroundColor: selected.length > 0 
              ? '#0ea5e9' : '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: selected.length > 0 
              ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Forwarding...' : 
            'Forward' + (selected.length > 0 
              ? ' (' + selected.length + ')' : '')}
        </button>
      </div>
    </div>
  )
}

export default ForwardModal