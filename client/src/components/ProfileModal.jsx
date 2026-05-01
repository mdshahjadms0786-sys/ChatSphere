import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const ProfileModal = ({ user, onClose, onUpdate, currentUser }) => {
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (user?._id) {
      checkBlockStatus();
    }
  }, [user?._id]);

  const checkBlockStatus = async () => {
    try {
      const { data } = await api.get('/chat/check-blocked/' + user._id);
      setIsBlocked(data.isBlocked);
    } catch(err) {
      console.log('check block error:', err);
    }
  };

  const handleBlock = async () => {
    setBlockLoading(true);
    try {
      if (isBlocked) {
        await api.post('/chat/unblock/' + user._id);
        setIsBlocked(false);
        toast.success('User unblocked');
      } else {
        await api.post('/chat/block/' + user._id);
        setIsBlocked(true);
        toast.success('User blocked');
      }
    } catch(err) {
      toast.error('Failed to update block status');
    }
    setBlockLoading(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const { data } = await api.put('/auth/profile', { avatar: base64 });
        onUpdate(data.user);
        toast.success('Photo updated!');
      } catch (error) {
        toast.error('Failed to update photo');
      }
    };
  };

  const handleSave = async () => {
    try {
      const { data } = await api.put('/auth/profile', { name, about });
      onUpdate(data.user);
      toast.success('Profile updated!');
      onClose();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-96 max-w-full mx-4">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white float-right text-2xl"
        >
          ×
        </button>

        <div className="clear-both pt-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover mx-auto"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold text-white mx-auto">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="block mx-auto mt-2 text-blue-400 hover:text-blue-300 text-sm"
          >
            Change Photo
          </button>

          <div className="mt-6">
            <label className="text-gray-300 text-sm">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg p-3 mt-1"
            />
          </div>

          <div className="mt-4">
            <label className="text-gray-300 text-sm">About</label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={150}
              rows={3}
              className="w-full bg-gray-700 text-white rounded-lg p-3 mt-1 resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{about.length}/150</p>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-3 mt-4 font-medium"
          >
            Save Changes
          </button>

          {user._id !== currentUser?._id && (
            <button
              onClick={handleBlock}
              disabled={blockLoading}
              style={{
                width: '100%',
                backgroundColor: isBlocked ? '#374151' : '#ef444420',
                color: isBlocked ? '#9ca3af' : '#ef4444',
                border: isBlocked ? '1px solid #374151' : '1px solid #ef4444',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '14px',
                cursor: blockLoading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                transition: 'all 0.2s'
              }}
            >
              {blockLoading ? 'Loading...' : isBlocked ? '✓ Unblock User' : '🚫 Block User'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;