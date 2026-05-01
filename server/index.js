require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const passport = require('./config/passport');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      callback(null, true)
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket handler
const socketHandler = require('./socket/index');
socketHandler(io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Passport
app.use(passport.initialize());
connectDB();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ChatSphere server is running' });
});
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Error Handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});