import React from 'react';

const ImagePreview = ({ imageUrl, onClose }) => {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: 'pointer',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-40px',
            right: '0',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '32px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
        <img
          src={imageUrl}
          alt="Full size"
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: '8px',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};

export default ImagePreview;