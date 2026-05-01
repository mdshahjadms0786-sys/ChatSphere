import React, { useState, useRef, useEffect } from "react";
import { CheckIcon, DoubleCheckIcon } from "./Icons";
import ImagePreview from "./ImagePreview";
import AudioPlayer from "./AudioPlayer";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const MessageBubble = ({ message, currentUser, onDelete, onReply, onReact, onForward }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const reactionPickerRef = useRef(null);

  const isSent = message.sender._id === currentUser._id;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
        setShowReactionPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (message.deletedForEveryone) {
    return (
      <div className="text-center text-gray-500 italic my-2">
        This message was deleted
      </div>
    );
  }

  if (message.deletedFor && message.deletedFor.includes(currentUser._id)) {
    return null;
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStatus = () => {
    if (message.status === "read") {
      return <DoubleCheckIcon />;
    } else if (message.status === "delivered") {
      return <DoubleCheckIcon />;
    } else {
      return <CheckIcon />;
    }
  };

  const renderAvatar = () => {
    if (message.sender.avatar) {
      return (
        <img
          src={message.sender.avatar}
          alt="avatar"
          className="w-8 h-8 rounded-full object-cover mr-2"
        />
      );
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2 text-white font-bold">
          {message.sender.name ? message.sender.name.charAt(0) : "?"}
        </div>
      );
    }
  };

  return (
    <div
      className={`flex mb-4 ${isSent ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => {
        setShowReactions(false);
        setShowDeleteOptions(false);
      }}
    >
      {!isSent && renderAvatar()}

      <div
        className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow ${
          isSent
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-700 text-white rounded-bl-none"
        }`}
      >
        {message.replyTo && (
          <div className="bg-gray-800 border-l-4 border-blue-500 pl-3 py-1 mb-2 rounded-md">
            <p className="text-xs text-blue-400">
              Replying to {message.replyTo.sender?.name || "message"}
            </p>
            <p className="text-sm text-gray-400 truncate">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {message.isForwarded && (
          <p style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            margin: '0 0 4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ↪ Forwarded
          </p>
        )}

        {message.type === 'image' && message.imageUrl && (
          <div>
            <img
              src={message.imageUrl}
              alt="Shared image"
              onClick={() => setShowImagePreview(true)}
              style={{
                maxWidth: '200px',
                maxHeight: '200px',
                borderRadius: '8px',
                cursor: 'pointer',
                objectFit: 'cover',
                display: 'block',
                marginBottom: '4px',
              }}
            />
            {showImagePreview && (
              <ImagePreview
                imageUrl={message.imageUrl}
                onClose={() => setShowImagePreview(false)}
              />
            )}
          </div>
        )}

        {message.type === 'audio' && message.audioUrl && (
          <AudioPlayer audioUrl={message.audioUrl} />
        )}

        <p className="text-sm">{message.content}</p>

        <div
          className={`text-xs mt-1 ${
            isSent ? "text-blue-200 text-right" : "text-gray-400"
          }`}
        >
          {formatTime(message.createdAt)}
          {isSent && <span className="ml-1 inline-block">{renderStatus()}</span>}
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.reactions.map((reaction) => (
              <span
                key={reaction.emoji}
                className={`flex items-center text-xs px-2 py-1 rounded-full cursor-pointer ${
                  reaction.users.includes(currentUser._id)
                    ? "bg-blue-600"
                    : "bg-gray-600"
                }`}
                onClick={() => onReact(message._id, reaction.emoji)}
              >
                {reaction.emoji} {reaction.users.length}
              </span>
            ))}
          </div>
        )}

        {showReactions && (
          <div
            className={`absolute ${
              isSent ? "-left-20" : "-right-20"
            } top-1/2 -translate-y-1/2 flex gap-2`}
          >
            {isSent && (
              <button
                onClick={() => setShowDeleteOptions(!showDeleteOptions)}
                className="bg-gray-600 p-2 rounded-full text-white hover:bg-gray-500"
              >
                🗑
              </button>
            )}
            {showDeleteOptions && isSent && (
              <div className="absolute top-0 right-12 bg-gray-700 p-2 rounded-md shadow-lg flex flex-col items-start z-10">
                <button
                  onClick={() => {
                    onDelete(message._id, false);
                    setShowDeleteOptions(false);
                  }}
                  className="text-sm text-white px-2 py-1 hover:bg-gray-600 w-full text-left"
                >
                  Delete for me
                </button>
                <button
                  onClick={() => {
                    onDelete(message._id, true);
                    setShowDeleteOptions(false);
                  }}
                  className="text-sm text-white px-2 py-1 hover:bg-gray-600 w-full text-left"
                >
                  Delete for everyone
                </button>
              </div>
            )}
            <button
              onClick={() => onReply(message)}
              className="bg-gray-600 p-2 rounded-full text-white hover:bg-gray-500"
            >
              ↩
            </button>
            <button
              onClick={() => onForward && onForward(message)}
              title="Forward"
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}
            >
              ↪
            </button>
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="bg-gray-600 p-2 rounded-full text-white hover:bg-gray-500"
            >
              😊
            </button>
            {showReactionPicker && (
              <div
                ref={reactionPickerRef}
                className={`absolute ${
                  isSent ? "right-full mr-2" : "left-full ml-2"
                } bottom-0 z-10`}
              >
                <div className="flex gap-1 bg-gray-800 rounded-full p-1 shadow-lg">
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message._id, emoji);
                        setShowReactionPicker(false);
                      }}
                      className="hover:scale-125 transition-transform text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;