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
const allowedOriginsForSocket = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL?.replace('https://', 'https://www.'),
    'http://localhost:5173'
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOriginsForSocket,
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 8000;

// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL?.replace('https://', 'https://www.'),
    'http://localhost:5173'
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
        }
        return callback(null, true);
    },
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

app.get('/', (req, res) => {
    res.send('Hotel Site API is running...');
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
