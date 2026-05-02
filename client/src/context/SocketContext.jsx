import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(
        process.env.REACT_APP_API_URL || 
        'http://localhost:5000', {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        newSocket.emit('user:join', user._id.toString());
      });

      newSocket.on('user:online', ({ userId }) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [userId]: { online: true },
        }));
      });

      newSocket.on('user:offline', ({ userId, lastSeen }) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [userId]: { online: false, lastSeen },
        }));
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export const isUserOnline = (onlineUsers, userId) => {
  return onlineUsers[userId]?.online === true;
};

export const getUserLastSeen = (onlineUsers, userId, userLastSeen) => {
  const userData = onlineUsers[userId];
  if (userData?.online) return 'online';

  const lastSeenDate = userData?.lastSeen || userLastSeen;
  if (!lastSeenDate) return 'offline';

  const date = new Date(lastSeenDate);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return minutes + ' min ago';
  if (hours < 24)
    return (
      'today at ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  if (days === 1)
    return (
      'yesterday at ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  return date.toLocaleDateString();
};

export default SocketContext;