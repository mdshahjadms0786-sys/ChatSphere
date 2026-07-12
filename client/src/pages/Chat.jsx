import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket, isUserOnline, getUserLastSeen } from '../context/SocketContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import MessageBubble from '../components/MessageBubble';
import EmojiPickerComponent from '../components/EmojiPickerComponent';
import ProfileModal from '../components/ProfileModal';
import SearchBar from '../components/SearchBar';
import TypingIndicator from '../components/TypingIndicator';
import CreateGroupModal from '../components/CreateGroupModal';
import playNotificationSound from '../utils/sound';
import ForwardModal from '../components/ForwardModal';
import SettingsModal from '../components/SettingsModal';
import ContactInfoPanel from '../components/ContactInfoPanel';

const Chat = () => {
  const { user, logout, updateUser } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [mobileSidebar, setMobileSidebar] = useState(true);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const userIdRef = useRef(user?._id);
  userIdRef.current = user?._id;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user?.theme) {
      const applyTheme = (themeName) => {
        if (themeName === 'system') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
          document.documentElement.setAttribute('data-theme', themeName);
        }
      };
      
      applyTheme(user.theme);

      // Listen for system theme changes if set to system
      if (user.theme === 'system') {
        const matcher = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e) => document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        matcher.addEventListener('change', listener);
        return () => matcher.removeEventListener('change', listener);
      }
    }
  }, [user?.theme]);

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
      markAsRead(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const currentUserId = userIdRef.current;
    const isSoundEnabled = soundEnabledRef.current;

    socket.on('message:receive', (message) => {
      if (selectedConversation && message.conversation === selectedConversation._id) {
        setMessages((prev) => [...prev, message]);
        markAsRead(selectedConversation._id);
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.conversation]: (prev[message.conversation] || 0) + 1,
        }));
        if (isSoundEnabled && message.sender._id !== currentUserId) {
          playNotificationSound();
        }
        if (document.hidden && message.sender._id !== currentUserId) {
          if (Notification.permission === 'granted') {
            new Notification('ChatSphere', {
              body: message.sender.name + ': ' +
                (message.type === 'text'
                  ? message.content
                  : message.type === 'image'
                  ? '📷 Image'
                  : message.type === 'audio'
                  ? '🎤 Voice message'
                  : 'New message'),
              icon: '/favicon.ico'
            });
          }
        }
      }
      updateConversationLastMessage(message);
    });

    socket.on('message:status', ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, status } : msg))
      );
    });

    socket.on('typing:start', ({ conversationId, senderName }) => {
      if (selectedConversation?._id === conversationId) {
        setIsTyping(true);
        setTypingUser(senderName);
      }
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (selectedConversation?._id === conversationId) {
        setIsTyping(false);
        setTypingUser('');
      }
    });

    socket.on('reaction:update', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
    });

    socket.on('message:blocked', ({ message }) => {
      toast.error(message || 'Cannot send message to this user');
    });

    socket.on('message:edited', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
    });

    socket.on('message:pinned', ({ messageId, isPinned }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, isPinned } : msg))
      );
    });

    return () => {
      socket.off('message:receive');
      socket.off('message:status');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('reaction:update');
      socket.off('message:blocked');
      socket.off('message:edited');
      socket.off('message:pinned');
    };
  }, [socket, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations);
      const counts = {};
      data.conversations.forEach((conv) => {
        if (conv.unreadCount?.get?.(user._id) > 0) {
          counts[conv._id] = conv.unreadCount.get(user._id);
        }
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    setLoadingMessages(true);
    setHasMoreMessages(true);
    try {
      const { data } = await api.get('/chat/messages/' + conversationId);
      setMessages(data.messages);
      setHasMoreMessages(data.hasMore || false);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedConversation || loadingMore || !hasMoreMessages || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0]?.createdAt;
      const { data } = await api.get('/chat/messages/' + selectedConversation._id + '?before=' + oldest);
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMoreMessages(data.hasMore || false);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleEditMessage = async (messageId, content) => {
    try {
      const { data } = await api.put('/chat/message/' + messageId + '/edit', { content });
      setMessages((prev) => prev.map((m) => (m._id === messageId ? data.message : m)));
      socket.emit('message:edit', {
        messageId, participants: selectedConversation.participants.map((p) => p._id),
      });
      setEditingMessage(null);
      setEditContent('');
      toast.success('Message edited');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to edit');
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      const { data } = await api.post('/chat/message/' + messageId + '/pin');
      setMessages((prev) => prev.map((m) => (m._id === messageId ? data.message : m)));
      socket.emit('message:pin', {
        messageId, isPinned: data.message.isPinned,
        conversationId: selectedConversation._id,
        participants: selectedConversation.participants.map((p) => p._id),
      });
      toast.success(data.message.isPinned ? 'Message pinned' : 'Message unpinned');
    } catch (err) {
      toast.error('Failed to pin message');
    }
  };

  const handleStarMessage = async (messageId) => {
    try {
      const { data } = await api.post('/chat/message/' + messageId + '/star');
      toast.success(data.starred ? 'Message starred' : 'Message unstarred');
    } catch (err) {
      toast.error('Failed to star message');
    }
  };

  const updateConversationLastMessage = (message) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === message.conversation
          ? { ...conv, lastMessage: message, lastMessageTime: message.createdAt }
          : conv
      )
    );
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowSearch(false);
    setShowContactInfo(false);
    setMobileSidebar(false);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setUnreadCounts((prev) => ({ ...prev, [conversation._id]: 0 }));
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get('/chat/users/search?q=' + query);
      setSearchResults(data.users);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSelectUser = async (userId) => {
    try {
      const { data } = await api.get('/chat/conversations/' + userId);
      setSelectedConversation(data.conversation);
      setSearchQuery('');
      setSearchResults([]);
      fetchConversations();
    } catch (error) {
      console.error('Failed to select user:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;
    const messageData = {
      conversationId: selectedConversation._id,
      senderId: user._id,
      content: newMessage.trim(),
      type: selectedImage ? 'image' : 'text',
      imageUrl: selectedImage || '',
      replyTo: replyingTo?._id || null,
      participants: selectedConversation.participants.map((p) => p._id),
    };
    socket.emit('message:send', messageData);
    setNewMessage('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setSelectedImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreview(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
  };

  const sendVoiceMessage = () => {
    if (!audioBlob || !selectedConversation) return;

    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('message:send', {
        conversationId: selectedConversation._id,
        senderId: user._id,
        content: '',
        type: 'audio',
        audioUrl: reader.result,
        imageUrl: '',
        replyTo: replyingTo?._id || null,
        participants: selectedConversation.participants.map((p) => p._id),
      });
      setAudioBlob(null);
      setAudioPreview(null);
      setRecordingTime(0);
    };
    reader.readAsDataURL(audioBlob);
  };

  const cancelVoiceMessage = () => {
    setAudioBlob(null);
    setAudioPreview(null);
    setRecordingTime(0);
  };

  const handleTyping = () => {
    if (!socket || !selectedConversation) return;
    socket.emit('typing:start', {
      conversationId: selectedConversation._id,
      senderId: user._id,
      senderName: user.name,
      participants: selectedConversation.participants.map((p) => p._id),
    });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', {
        conversationId: selectedConversation._id,
        participants: selectedConversation.participants.map((p) => p._id),
      });
    }, 2000);
  };

  const handleDeleteMessage = async (messageId, deleteForEveryone) => {
    try {
      const { data } = await api.delete('/chat/message/' + messageId, {
        data: { deleteForEveryone },
      });
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? data.message : msg))
      );
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const { data } = await api.post('/chat/message/' + messageId + '/reaction', {
        emoji,
      });
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? data.message : msg))
      );
      socket.emit('reaction:add', {
        message: data.message,
        participants: selectedConversation.participants.map((p) => p._id),
      });
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const markAsRead = async (conversationId) => {
    try {
      await api.put('/chat/conversation/' + conversationId + '/read');
      setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
    } catch (error) {
      console.log('mark as read error');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find((p) => p._id !== user._id);
  };

  const otherUser = selectedConversation
    ? getOtherParticipant(selectedConversation)
    : null;

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className={`${mobileSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-80 flex-col border-r h-full`}
        style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
        <div style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-sidebar)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{fontSize: '24px'}}>💬</span>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>ChatSphere</span>
          </div>
          
          <button
            onClick={() => setShowCreateGroup(true)}
            title="Create Group"
            style={{
              background: 'rgba(14,165,233,0.1)',
              border: '1px solid rgba(14,165,233,0.2)',
              color: '#0ea5e9',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
          >
            ➕
          </button>
        </div>

        <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-full px-4 py-2 text-sm outline-none border transition-all"
            style={{ 
              backgroundColor: 'var(--bg-main)', 
              color: 'var(--text-main)',
              borderColor: 'var(--border-color)'
            }}
          />
        </div>

        {searchResults.length > 0 ? (
          <div className="overflow-y-auto">
            <p className="text-xs text-gray-400 px-4 py-2">Search Results</p>
            {searchResults.map((u) => (
              <div
                key={u._id}
                onClick={() => handleSelectUser(u._id)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-main)' }}>{u.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <p className="text-xs px-4 py-2" style={{ color: 'var(--text-muted)' }}>Conversations</p>
            {conversations.map((conv) => {
              const isGroup = conv.isGroup;
              const displayParticipant = isGroup
                ? null
                : conv.participants?.find((p) => p._id !== user._id);
              const displayName = isGroup
                ? conv.groupName
                : displayParticipant?.name;
              const displayAvatar = displayName?.[0]?.toUpperCase();
              const avatarColor = isGroup ? '#10b981' : '#0ea5e9';
              const isSelected = selectedConversation?._id === conv._id;
              const isOnline = !isGroup && isUserOnline(onlineUsers, displayParticipant?._id?.toString());

              return (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                  style={{ 
                    backgroundColor: isSelected ? 'rgba(14,165,233,0.1)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #0ea5e9' : '3px solid transparent'
                  }}
                  onMouseEnter={e => !isSelected && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {displayAvatar}
                    </div>
                    {isOnline && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '12px',
                          height: '12px',
                          backgroundColor: '#10b981',
                          borderRadius: '50%',
                          border: '2px solid var(--bg-sidebar)',
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }}>
                        {displayName}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {formatTime(conv.lastMessageTime)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {conv.lastMessage?.content || 'Start chatting'}
                      </p>
                      {unreadCounts[conv._id] > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center ml-2">
                          {unreadCounts[conv._id]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sidebar Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-sidebar)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto'
        }}>
          <div 
            onClick={() => setShowProfile(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: '#0ea5e9', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', fontWeight: 'bold'
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: 'white', fontSize: '13px', fontWeight: '600', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </p>
              <p style={{ color: '#10b981', fontSize: '10px', margin: 0 }}>Online</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute' : 'Unmute'}
              style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: soundEnabled ? '#0ea5e9' : '#9ca3af' }}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              title="Settings"
              style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
            >
              ⚙️
            </button>
            <button
              onClick={logout}
              title="Logout"
              style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#ef4444' }}
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--bg-main)' }}>
        {!selectedConversation ? (
          <div className="hidden md:flex flex-1 items-center justify-center" style={{ backgroundColor: 'var(--bg-main)' }}>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                <span className="text-4xl">💬</span>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-main)' }}>Welcome to ChatSphere</h2>
              <p style={{ color: 'var(--text-muted)' }}>Select a conversation to start chatting</p>
            </div>
          </div>
        ) : (
          <div className={`${mobileSidebar ? 'hidden' : 'flex'} flex-1 flex-col relative h-full overflow-hidden`}
            style={{ backgroundColor: 'var(--bg-main)' }}>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between z-10 shadow-sm"
              style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden text-gray-400 mr-2 hover:text-white"
                  onClick={() => setMobileSidebar(true)}
                >
                  ⬅️
                </button>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: selectedConversation?.isGroup ? '#10b981' : '#0ea5e9',
                  }}
                  onClick={() => setShowContactInfo(true)}
                >
                  {selectedConversation?.isGroup
                    ? selectedConversation.groupName?.[0]?.toUpperCase()
                    : otherUser?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {selectedConversation?.isGroup
                      ? selectedConversation.groupName
                      : otherUser?.name}
                  </p>
                  <p
                  style={{
                    fontSize: '12px',
                    margin: 0,
                    color: isUserOnline(onlineUsers, otherUser?._id?.toString())
                      ? '#10b981'
                      : '#9ca3af',
                  }}
                >
                  {selectedConversation?.isGroup
                    ? selectedConversation.participants?.length + ' members'
                    : getUserLastSeen(
                        onlineUsers,
                        otherUser?._id?.toString(),
                        otherUser?.lastSeen
                      )}
                </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="text-gray-400 hover:text-white p-2"
                >
                  🔍
                </button>
                <button
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className="text-gray-400 hover:text-white p-2"
                  title="Contact Info"
                >
                  ℹ️
                </button>
              </div>
            </div>

            {showSearch && (
              <SearchBar
                conversationId={selectedConversation._id}
                onClose={() => setShowSearch(false)}
                onResultClick={(msgId) => {
                  const el = document.getElementById(msgId);
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}

            <div
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-1"
            >
              {hasMoreMessages && (
                <button
                  onClick={loadMoreMessages}
                  disabled={loadingMore}
                  className="mx-auto my-4 text-blue-400 text-xs hover:underline disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load previous messages'}
                </button>
              )}
              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                messages.map((message) => (
                  <div id={message._id} key={message._id}>
                    <MessageBubble
                      message={message}
                      currentUser={user}
                      onDelete={handleDeleteMessage}
                      onReply={(msg) => {
                        setReplyingTo(msg);
                        inputRef.current?.focus();
                      }}
                      onReact={handleReaction}
                      onForward={(msg) => setForwardMessage(msg)}
                      onPin={() => handlePinMessage(message._id)}
                      onStar={() => handleStarMessage(message._id)}
                      onEdit={() => {
                        setEditingMessage(message);
                        setEditContent(message.content);
                        inputRef.current?.focus();
                      }}
                    />
                  </div>
                ))
              )}
              {isTyping && <TypingIndicator userName={typingUser} />}
              <div ref={messagesEndRef} />
            </div>

            {replyingTo && (
              <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-400">
                      Replying to {replyingTo?.sender?.name}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {replyingTo?.content}
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-400 hover:text-white text-xl ml-4"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 border-t" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
              <div className="relative">
                {showEmojiPicker && (
                  <EmojiPickerComponent
                    onEmojiSelect={(emoji) =>
                      setNewMessage((prev) => prev + emoji)
                    }
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </div>

              {isRecording && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '70px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      animation: 'pulse 1s infinite',
                    }}
                  />
                  Recording... {recordingTime}s
                </div>
              )}

              {audioPreview && (
                <div
                  style={{
                    padding: '8px',
                    backgroundColor: '#1e2a35',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <audio
                    src={audioPreview}
                    controls
                    style={{ height: '32px', flex: 1 }}
                  />
                  <button
                    onClick={sendVoiceMessage}
                    style={{
                      backgroundColor: '#0ea5e9',
                      border: 'none',
                      color: 'white',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    ➤
                  </button>
                  <button
                    onClick={cancelVoiceMessage}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '20px',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              {imagePreview && (
                <div
                  style={{
                    padding: '8px',
                    backgroundColor: '#1e2a35',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'white', fontSize: '12px', margin: 0 }}>
                      Image ready to send
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      if (imageInputRef.current) {
                        imageInputRef.current.value = '';
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '20px',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '22px',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: '8px',
                  }}
                >
                  📷
                </button>
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  style={{
                    background: isRecording ? '#ef4444' : 'none',
                    border: 'none',
                    fontSize: '22px',
                    cursor: 'pointer',
                    color: isRecording ? 'white' : '#9ca3af',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s',
                  }}
                  title="Hold to record"
                >
                  🎤
                </button>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-gray-400 hover:text-white text-xl p-2"
                >
                  😊
                </button>
                <input
                  ref={inputRef}
                  value={editingMessage ? editContent : newMessage}
                  onChange={(e) => {
                    if (editingMessage) setEditContent(e.target.value);
                    else {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (editingMessage) handleEditMessage(editingMessage._id, editContent);
                      else handleSendMessage();
                    }
                  }}
                  placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                  className={`flex-1 rounded-full px-4 py-2 outline-none border transition-all`}
                  style={{ 
                    backgroundColor: 'var(--bg-main)', 
                    color: 'var(--text-main)',
                    borderColor: editingMessage ? '#eab308' : 'var(--border-color)'
                  }}
                />
                {editingMessage ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMessage(editingMessage._id, editContent)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full w-10 h-10 flex items-center justify-center"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditingMessage(null);
                        setEditContent('');
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && !selectedImage}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    ➤
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showContactInfo && selectedConversation && (
          <ContactInfoPanel
            conversation={selectedConversation}
            currentUser={user}
            onClose={() => setShowContactInfo(false)}
            onlineUsers={onlineUsers}
          />
        )}
      </div>

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={(updatedUser) => {
            updateUser(updatedUser);
            setShowProfile(false);
          }}
          currentUser={user}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(newGroup) => {
            setConversations((prev) => [newGroup, ...prev]);
            setSelectedConversation(newGroup);
            setShowCreateGroup(false);
          }}
        />
      )}

      {forwardMessage && (
        <ForwardModal
          message={forwardMessage}
          onClose={() => setForwardMessage(null)}
          conversations={conversations}
          socket={socket}
          currentUser={user}
        />
      )}

      {showSettings && (
        <SettingsModal
          user={user}
          onClose={() => setShowSettings(false)}
          onUpdate={(u) => {
            updateUser(u);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
};

export default Chat;
