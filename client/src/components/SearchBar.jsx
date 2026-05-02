import React, { useState, useCallback } from 'react';
import api from '../utils/axios';
import { FaSearch, FaTimes } from 'react-icons/fa';

const SearchBar = ({ conversationId, onClose, onResultClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchMessages = useCallback(
    debounce(async (searchQuery) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data } = await api.get('/api/chat/messages/search', {
          params: { q: searchQuery, conversationId },
        });
        setResults(data.messages || []);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    [conversationId]
  );

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    searchMessages(value);
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-3">
      <div className="flex items-center gap-3">
        <FaSearch className="text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search messages..."
          className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <FaTimes />
        </button>
      </div>

      {loading && (
        <p className="text-gray-400 text-sm mt-2">Searching...</p>
      )}

      {results.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto">
          {results.map((msg) => (
            <div
              key={msg._id}
              onClick={() => onResultClick(msg._id)}
              className="p-2 hover:bg-gray-700 cursor-pointer rounded-lg"
            >
              <p className="text-xs text-blue-400">
                {msg.sender?.name || 'Unknown'}
              </p>
              <p className="text-sm text-white truncate">{msg.content}</p>
              <p className="text-xs text-gray-400">{formatTime(msg.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && query.length > 1 && results.length === 0 && (
        <p className="text-gray-400 text-sm mt-2">No messages found</p>
      )}
    </div>
  );
};

export default SearchBar;