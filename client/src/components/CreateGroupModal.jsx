import React, { useState } from 'react';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get('/chat/users/search?q=' + query);
      setSearchResults(data.users);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const toggleMember = (user) => {
    setSelectedMembers((prev) =>
      prev.find((m) => m._id === user._id)
        ? prev.filter((m) => m._id !== user._id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Enter group name');
      return;
    }
    if (selectedMembers.length < 2) {
      toast.error('Add at least 2 members');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/chat/group/create', {
        name: groupName,
        members: selectedMembers.map((m) => m._id),
      });
      toast.success('Group created!');
      onGroupCreated(data.conversation);
      onClose();
    } catch (error) {
      toast.error('Failed to create group');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#1e2a35',
          borderRadius: '16px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
            Create Group
          </h2>
          <button
            onClick={onClose}
            style={{
              color: '#9ca3af',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name..."
          style={{
            width: '100%',
            backgroundColor: '#0d1721',
            color: 'white',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '12px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <input
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users to add..."
          style={{
            width: '100%',
            backgroundColor: '#0d1721',
            color: 'white',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '8px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {searchResults.map((user) => (
          <div
            key={user._id}
            onClick={() => toggleMember(user)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor:
                selectedMembers.find((m) => m._id === user._id)
                  ? '#0ea5e9'
                  : 'transparent',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ color: 'white', margin: 0, fontSize: '14px' }}>
                {user.name}
              </p>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '12px' }}>
                {user.email}
              </p>
            </div>
            {selectedMembers.find((m) => m._id === user._id) && (
              <span style={{ marginLeft: 'auto', color: 'white' }}>✓</span>
            )}
          </div>
        ))}

        {selectedMembers.length > 0 && (
          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 4px' }}>
              Selected: {selectedMembers.length}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {selectedMembers.map((m) => (
                <span
                  key={m._id}
                  style={{
                    backgroundColor: '#374151',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {m.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMember(m);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '8px',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </div>
  );
};

export default CreateGroupModal;