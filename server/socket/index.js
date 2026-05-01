const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('user:join', async (userId) => {
      try {
        onlineUsers.set(userId.toString(), socket.id);
        socket.userId = userId.toString();

        const User = require('../models/User');
        await User.findByIdAndUpdate(userId, {
          status: 'online',
          lastSeen: new Date(),
        });

        io.emit('user:online', { userId });

        const Message = require('../models/Message');
        const Conversation = require('../models/Conversation');

        const conversations = await Conversation.find({
          participants: { $in: [userId] },
        });

        for (const conv of conversations) {
          const messages = await Message.find({
            conversation: conv._id,
            deliveredTo: { $ne: userId },
            sender: { $ne: userId },
          });

          for (const msg of messages) {
            msg.deliveredTo.push(userId);
            msg.status = 'delivered';
            await msg.save();
            io.to(socket.id).emit('message:status', {
              messageId: msg._id,
              status: 'delivered',
            });
          }
        }
      } catch (error) {
        console.error('user:join error:', error);
      }
    });

    socket.on('message:send', async (data) => {
      try {
        const Message = require('../models/Message');
        const Conversation = require('../models/Conversation');
        const User = require('../models/User');

        const senderUser = await User.findById(data.senderId).select('blockedUsers');

        const receiverId = data.participants.find(id => id.toString() !== data.senderId.toString());

        if (receiverId) {
          const receiverUser = await User.findById(receiverId).select('blockedUsers');

          if (receiverUser.blockedUsers.map(id => id.toString()).includes(data.senderId.toString())) {
            socket.emit('message:blocked', {
              message: 'You are blocked by this user'
            });
            return;
          }
        }

        const messageData = {
          conversation: data.conversationId,
          sender: data.senderId,
          content: data.content || '',
          type: data.type || 'text',
          imageUrl: data.imageUrl || '',
          audioUrl: data.audioUrl || '',
          isForwarded: data.isForwarded || false,
          replyTo: data.replyTo || null,
        };

        if (data.replyTo) {
          messageData.replyTo = data.replyTo;
        }

        const message = await Message.create(messageData);

        await Conversation.findByIdAndUpdate(data.conversationId, {
          lastMessage: message._id,
          lastMessageTime: new Date(),
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name avatar');

        data.participants.forEach((participantId) => {
          const socketId = onlineUsers.get(participantId);
          if (socketId) {
            io.to(socketId).emit('message:receive', populatedMessage);
          }
        });
      } catch (error) {
        console.error('Message error:', error);
      }
    });

    socket.on('message:read', async (data) => {
      try {
        const Message = require('../models/Message');

        const message = await Message.findById(data.messageId);
        if (message) {
          if (!message.readBy.includes(data.userId)) {
            message.readBy.push(data.userId);
          }
          message.status = 'read';
          await message.save();

          io.to(onlineUsers.get(message.sender.toString())).emit('message:status', {
            messageId: message._id,
            status: 'read',
          });
        }
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    socket.on('typing:start', (data) => {
      data.participants.forEach((participantId) => {
        if (participantId !== data.senderId) {
          const socketId = onlineUsers.get(participantId);
          if (socketId) {
            io.to(socketId).emit('typing:start', {
              conversationId: data.conversationId,
              senderId: data.senderId,
              senderName: data.senderName,
            });
          }
        }
      });
    });

    socket.on('typing:stop', (data) => {
      data.participants.forEach((participantId) => {
        if (participantId !== data.senderId) {
          const socketId = onlineUsers.get(participantId);
          if (socketId) {
            io.to(socketId).emit('typing:stop', {
              conversationId: data.conversationId,
            });
          }
        }
      });
    });

    socket.on('reaction:add', async (data) => {
      try {
        const Message = require('../models/Message');

        const message = await Message.findById(data.messageId);
        if (message) {
          const populatedMessage = await message.populate('sender', 'name avatar');

          data.participants.forEach((participantId) => {
            const socketId = onlineUsers.get(participantId);
            if (socketId) {
              io.to(socketId).emit('reaction:update', populatedMessage);
            }
          });
        }
      } catch (error) {
        console.error('Reaction error:', error);
      }
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);

        try {
          const User = require('../models/User');
          await User.findByIdAndUpdate(socket.userId, {
            status: 'offline',
            lastSeen: new Date(),
          });
        } catch (error) {
          console.error('disconnect error:', error);
        }

        io.emit('user:offline', {
          userId: socket.userId,
          lastSeen: new Date(),
        });
      }
    });
  });
};