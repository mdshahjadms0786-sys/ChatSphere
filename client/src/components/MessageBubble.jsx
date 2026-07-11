import React, { useState, useRef, useEffect } from "react";
import { CheckIcon, DoubleCheckIcon } from "./Icons";
import ImagePreview from "./ImagePreview";
import AudioPlayer from "./AudioPlayer";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const MessageBubble = ({ 
  message, currentUser, onDelete, onReply, onReact, onForward,
  onPin, onStar, onEdit 
}) => {
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
      return <DoubleCheckIcon color="#53bdeb" />;
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
      className={`flex mb-2 ${isSent ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => {
        setShowReactions(false);
        setShowDeleteOptions(false);
      }}
    >
      {!isSent && renderAvatar()}

      <div
        className={`relative max-w-xs lg:max-w-md px-3 py-2 rounded-2xl shadow-sm ${
          isSent ? "rounded-tr-none" : "rounded-tl-none"
        }`}
        style={{ 
          backgroundColor: isSent ? 'var(--bg-bubble-sent)' : 'var(--bg-bubble-recv)',
          color: isSent ? 'white' : 'var(--text-main)',
          border: isSent ? 'none' : '1px solid var(--border-color)'
        }}
      >
        {message.isPinned && (
          <div className="flex items-center gap-1 mb-1 text-[10px] text-yellow-400">
            📌 Pinned
          </div>
        )}

        {message.replyTo && (
          <div className="bg-black/20 border-l-2 border-white/50 pl-2 py-1 mb-2 rounded">
            <p className="text-[10px] opacity-70">
              Replying to {message.replyTo.sender?.name || "message"}
            </p>
            <p className="text-xs truncate opacity-90">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {message.isForwarded && (
          <p className="text-[10px] opacity-60 mb-1 flex items-center gap-1">
            ↪ Forwarded
          </p>
        )}

        {message.type === 'image' && message.imageUrl && (
          <div className="mb-2">
            <img
              src={message.imageUrl}
              alt="attachment"
              onClick={() => setShowImagePreview(true)}
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxHeight: '250px', objectFit: 'cover' }}
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
          <div className="mb-1">
            <AudioPlayer audioUrl={message.audioUrl} />
          </div>
        )}

        <div className="flex flex-col">
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          <div
            className={`flex items-center justify-end gap-1 mt-1`}
            style={{ fontSize: '10px', color: isSent ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}
          >
            {message.isEdited && <span>(edited)</span>}
            {formatTime(message.createdAt)}
            {isSent && renderStatus()}
          </div>
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction) => (
              <span
                key={reaction.emoji}
                className={`flex items-center text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                  reaction.users.includes(currentUser._id)
                    ? "bg-blue-800 border border-blue-400"
                    : "bg-gray-700 border border-transparent"
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
              isSent ? "-left-40" : "-right-40"
            } top-1/2 -translate-y-1/2 flex items-center gap-1 bg-gray-900/80 backdrop-blur-sm p-1 rounded-full shadow-xl z-10 transition-all`}
          >
            {isSent && (
              <div className="relative group">
                <button
                  onClick={() => setShowDeleteOptions(!showDeleteOptions)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-500/20 text-white text-xs"
                  title="Delete"
                >
                  🗑️
                </button>
                {showDeleteOptions && (
                  <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-2xl overflow-hidden min-w-[120px] border border-gray-700">
                    <button
                      onClick={() => { onDelete(message._id, false); setShowDeleteOptions(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-700 text-white"
                    >
                      Delete for me
                    </button>
                    <button
                      onClick={() => { onDelete(message._id, true); setShowDeleteOptions(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-700 text-red-400"
                    >
                      Delete for everyone
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {isSent && message.type === 'text' && (
              <button
                onClick={() => onEdit && onEdit()}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-yellow-500/20 text-white text-xs"
                title="Edit"
              >
                ✏️
              </button>
            )}

            <button
              onClick={() => onReply(message)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-500/20 text-white text-xs"
              title="Reply"
            >
              ↩️
            </button>
            
            <button
              onClick={() => onStar && onStar()}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-yellow-500/20 text-white text-xs"
              title="Star"
            >
              ⭐
            </button>

            <button
              onClick={() => onPin && onPin()}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-500/20 text-white text-xs"
              title="Pin"
            >
              📌
            </button>

            <button
              onClick={() => onForward && onForward(message)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-green-500/20 text-white text-xs"
              title="Forward"
            >
              ↪️
            </button>
            
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-500/20 text-white text-xs"
              title="React"
            >
              😊
            </button>

            {showReactionPicker && (
              <div
                ref={reactionPickerRef}
                className={`absolute ${
                  isSent ? "right-full mr-2" : "left-full ml-2"
                } bottom-0 z-20 bg-gray-800 p-1.5 rounded-full shadow-2xl border border-gray-700 flex gap-1`}
              >
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;