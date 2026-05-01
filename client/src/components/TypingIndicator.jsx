import React from 'react';

const TypingIndicator = ({ userName }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1 bg-gray-700 rounded-2xl px-4 py-2">
        <span className="text-gray-400 text-sm">{userName} is typing</span>
        <div className="flex gap-1 ml-1">
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#9ca3af',
              animation: 'bounce 1.4s infinite',
              animationDelay: '0s',
            }}
          />
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#9ca3af',
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.2s',
            }}
          />
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#9ca3af',
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.4s',
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;