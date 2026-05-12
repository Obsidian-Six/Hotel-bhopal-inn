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
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
const testimonialRoutes = require('./routes/testimonialRoutes');
const offerRoutes = require('./routes/offerRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const financeRoutes = require('./routes/financeRoutes');
const otaRoutes = require('./routes/otaRoutes');
const authRoutes = require('./routes/authRoutes');
const reelRoutes = require('./routes/reelRoutes');
const menuRoutes = require('./routes/menuRoutes');
const postRoutes = require('./routes/postRoutes');

app.use('/api/hero-images', heroRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/banquet', banquetRoutes);
app.use('/api/event-gallery', galleryRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/ota', otaRoutes);
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
