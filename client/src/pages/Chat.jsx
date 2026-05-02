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

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchConversations();
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!socket) return;

    socket.on('message:receive', (message) => {
      if (selectedConversation && message.conversation === selectedConversation._id) {
        setMessages((prev) => [...prev, message]);
        markAsRead(selectedConversation._id);
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.conversation]: (prev[message.conversation] || 0) + 1,
        }));
        if (soundEnabled && message.sender._id !== user._id) {
          playNotificationSound();
        }
        if (document.hidden && message.sender._id !== user._id) {
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

    return () => {
      socket.off('message:receive');
      socket.off('message:status');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('reaction:update');
      socket.off('message:blocked');
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
    try {
      const { data } = await api.get('/chat/messages/' + conversationId);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoadingMessages(false);
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
    <div className="flex h-screen bg-gray-900">
      <div className="w-80 bg-gray-800 flex flex-col border-r border-gray-700">
        <div style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #374151',
          backgroundColor: '#162029'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end'
          }}>
            <span style={{fontSize: '24px'}}>💬</span>
            <span style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              ChatSphere
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowCreateGroup(true)}
              title="Create Group"
              style={{
                background: 'none',
                border: '1px solid #374151',
                color: '#9ca3af',
                borderRadius: '8px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              👥 <span>New Group</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute' : 'Unmute'}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: soundEnabled ? '#0ea5e9' : '#9ca3af',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>

            <div
              onClick={() => setShowProfile(true)}
              title="Profile"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>

            <button
              onClick={logout}
              style={{
                background: 'none',
                border: '1px solid #374151',
                color: '#9ca3af',
                borderRadius: '8px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: '13px',
                flexBasis: '100%',
                textAlign: 'center'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="p-3 border-b border-gray-700">
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-gray-700 text-white rounded-full px-4 py-2 text-sm outline-none"
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
                  <p className="text-white text-sm">{u.name}</p>
                  <p className="text-gray-400 text-xs">{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <p className="text-xs text-gray-400 px-4 py-2">Conversations</p>
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
                  className={
                    isSelected
                      ? 'bg-gray-700 flex items-center gap-3 px-4 py-3 cursor-pointer'
                      : 'flex items-center gap-3 px-4 py-3 hover:bg-gray-700 cursor-pointer'
                  }
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
                          border: '2px solid #1e2a35',
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-white text-sm font-medium">{displayName}</p>
                      <p className="text-gray-400 text-xs">
                        {formatTime(conv.lastMessageTime)}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-400 text-xs truncate">
                        {conv.lastMessage?.content || 'Start chatting'}
                      </p>
                      {unreadCounts[conv._id] > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
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
      </div>

      <div className="flex-1 flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-400">
                Select a conversation to start chatting
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{
                    backgroundColor: selectedConversation?.isGroup ? '#10b981' : '#0ea5e9',
                  }}
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
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="text-gray-400 hover:text-white p-2"
              >
                🔍
              </button>
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

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {loadingMessages ? (
                <div className="text-center text-gray-400">Loading...</div>
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

            <div className="p-4 bg-gray-800 border-t border-gray-700">
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
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() && !selectedImage}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center"
                >
                  ➤
                </button>
              </div>
            </div>
          </>
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
    </div>
  );
};

export default Chat;
