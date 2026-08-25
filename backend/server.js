const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://hotelbhopalinn.tenontenstays.com',
    'http://hotelbhopalinn.tenontenstays.com'
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

const checkCorsOrigin = (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
    }
    callback(null, true);
};

const io = new Server(server, {
    cors: {
        origin: checkCorsOrigin,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true
    }
});

const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: checkCorsOrigin,
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    etag: true,
    lastModified: true
}));

// Socket setup
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Make io accessible to routes
app.set('socketio', io);

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Routes
const heroRoutes = require('./routes/heroRoutes');
const roomRoutes = require('./routes/roomRoutes');
const banquetRoutes = require('./routes/banquetRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const offerRoutes = require('./routes/offerRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const financeRoutes = require('./routes/financeRoutes');
const authRoutes = require('./routes/authRoutes');
const reelRoutes = require('./routes/reelRoutes');
const menuRoutes = require('./routes/menuRoutes');
const postRoutes = require('./routes/postRoutes');

app.use('/api/hero-images', heroRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/banquet', banquetRoutes);
app.use('/api/event-gallery', galleryRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => {
    res.send('Hotel Site API is running...');
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
