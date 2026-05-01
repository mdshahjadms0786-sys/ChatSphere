import React, { useEffect, useRef } from 'react';

const EMOJI_LIST = [
  '😀','😂','😍','🥰','😎','😭','😅','🤔',
  '👍','👎','❤️','🔥','🎉','💯','😮','😢',
  '🙏','👏','🤝','💪','😊','🤣','😘','🥳',
  '😴','🤯','😱','🤗','😇','🥺','😤','😡',
  '👋','✌️','🤞','🖕','👌','🤌','🤏','☝️',
  '🍕','🍔','🍟','🌮','🍣','🍜','🍩','🎂',
  '⚽','🏀','🎮','🎯','🎸','🎵','🎤','🏆',
  '🌟','⭐','💫','✨','🌈','☀️','🌙','⚡'
];

const EmojiPickerComponent = ({ onEmojiSelect, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        bottom: '60px',
        left: '0',
        backgroundColor: '#1e2a35',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '12px',
        width: '280px',
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 1000,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px'
      }}
    >
      {EMOJI_LIST.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onEmojiSelect(emoji);
            onClose();
          }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) =>
            (e.target.style.background = '#374151')
          }
          onMouseLeave={(e) =>
            (e.target.style.background = 'none')
          }
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiPickerComponent;