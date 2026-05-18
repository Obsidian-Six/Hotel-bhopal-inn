const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const cron = require('node-cron');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================

// Safely fetch URL content using Node's standard libraries
const fetchUrl = (url) => {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Failed to fetch: ${res.statusCode} status`));
            }
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

// Robust, standard-compliant iCal Date parser (RFC 5545)
const parseIcalDate = (dateStr) => {
    if (!dateStr) return null;
    // Clean string of unwanted characters
    const cleanStr = dateStr.replace(/[^0-9T]/g, '');
    if (cleanStr.length >= 8) {
        const y = parseInt(cleanStr.slice(0, 4), 10);
        const m = parseInt(cleanStr.slice(4, 6), 10) - 1; // 0-indexed month
        const d = parseInt(cleanStr.slice(6, 8), 10);
        
        if (cleanStr.includes('T') && cleanStr.length >= 15) {
            const hh = parseInt(cleanStr.slice(9, 11), 10);
            const mm = parseInt(cleanStr.slice(11, 13), 10);
            const ss = parseInt(cleanStr.slice(13, 15), 10);
            // Treat as UTC
            return new Date(Date.UTC(y, m, d, hh, mm, ss));
        }
        // Treat as local date range (all day event)
        return new Date(y, m, d);
    }
    return null;
};

// Compliant VEVENT parser supporting line unfolding
const parseICS = (icsText) => {
    const events = [];
    const lines = icsText.split(/\r?\n/);
    let currentEvent = null;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // RFC 5545: Unfold wrapped lines starting with spaces or tabs
        while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
            line += lines[i + 1].slice(1);
            i++;
        }
        
        if (line.startsWith('BEGIN:VEVENT')) {
            currentEvent = {};
        } else if (line.startsWith('END:VEVENT')) {
            if (currentEvent && currentEvent.uid && currentEvent.start && currentEvent.end) {
                events.push(currentEvent);
            }
            currentEvent = null;
        } else if (currentEvent) {
            const colonIdx = line.indexOf(':');
            if (colonIdx !== -1) {
                const keyPart = line.slice(0, colonIdx);
                const val = line.slice(colonIdx + 1);
                
                if (keyPart.startsWith('DTSTART')) {
                    currentEvent.start = parseIcalDate(val);
                } else if (keyPart.startsWith('DTEND')) {
                    currentEvent.end = parseIcalDate(val);
                } else if (keyPart.startsWith('SUMMARY')) {
                    currentEvent.summary = val;
                } else if (keyPart.startsWith('UID')) {
                    currentEvent.uid = val;
                }
            }
        }
    }
    return events;
};

// Internal Sync engine that queries databases and processes ICS
const syncCalendarsInternal = async () => {
    const rooms = await Room.find();
    let stats = { processed: 0, created: 0, cancelled: 0 };
    
    for (const room of rooms) {
        const activeUids = [];
        
        const syncOtaCalendar = async (url, sourceName) => {
            if (!url) return;
            try {
                const icsText = await fetchUrl(url);
                const events = parseICS(icsText);
                
                for (const ev of events) {
                    activeUids.push(ev.uid);
                    stats.processed++;
                    
                    let booking = await Booking.findOne({ otaReferenceId: ev.uid });
                    
                    if (!booking) {
                        // Create a new blocked reservation block
                        booking = new Booking({
                            guestDetails: {
                                firstName: sourceName,
                                lastName: `Guest (${ev.summary?.split('#').pop() || ev.uid.slice(0, 6)})`,
                                phone: 'N/A',
                                email: '',
                                adults: 1,
                                children: 0,
                                specialRequests: `Imported via iCal Sync.\nEvent Summary: ${ev.summary || 'Blocked'}`
                            },
                            roomCategory: room._id,
                            checkInDate: ev.start,
                            checkOutDate: ev.end,
                            status: 'Confirmed',
                            financials: {
                                roomTariff: 0,
                                totalAmount: 0,
                                amountPaid: 0,
                                balance: 0,
                                paymentMode: 'Online'
                            },
                            source: sourceName,
                            otaReferenceId: ev.uid
                        });
                        await booking.save();
                        stats.created++;
                    } else {
                        // Update dates or status if changed on OTA side
                        let updated = false;
                        if (booking.checkInDate.getTime() !== ev.start.getTime()) {
                            booking.checkInDate = ev.start;
                            updated = true;
                        }
                        if (booking.checkOutDate.getTime() !== ev.end.getTime()) {
                            booking.checkOutDate = ev.end;
                            updated = true;
                        }
                        if (booking.status === 'Cancelled') {
                            booking.status = 'Confirmed';
                            updated = true;
                        }
                        if (updated) {
                            await booking.save();
                        }
                    }
                }
            } catch (err) {
                console.error(`Error syncing ${sourceName} calendar for room ${room.title}:`, err.message);
            }
        };
        
        // Sync Booking.com
        if (room.icalUrls?.bookingCom) {
            await syncOtaCalendar(room.icalUrls.bookingCom, 'Booking.com');
        }
        
        // Sync MakeMyTrip
        if (room.icalUrls?.makeMyTrip) {
            await syncOtaCalendar(room.icalUrls.makeMyTrip, 'MakeMyTrip');
        }
        
        // Handle cancellations: Mark any booking not in active feed as Cancelled
        if (activeUids.length > 0) {
            const cancelledResult = await Booking.updateMany({
                roomCategory: room._id,
                source: { $in: ['Booking.com', 'MakeMyTrip'] },
                status: { $ne: 'Cancelled' },
                otaReferenceId: { $nin: activeUids }
            }, {
                $set: { status: 'Cancelled' }
            });
            stats.cancelled += cancelledResult.modifiedCount;
        }
    }
    
    return stats;
};

// ==========================================
// 2. EXPRESS ROUTES
// ==========================================

// POST: Trigger manual synchronization from CMS
router.post('/sync-ical', async (req, res) => {
    try {
        const stats = await syncCalendarsInternal();
        res.status(200).json({ message: "Sync successful", stats });
    } catch (err) {
        console.error("Error running calendar sync:", err);
        res.status(500).json({ message: err.message });
    }
});

// GET: Export local bookings in standard ICS format for OTAs to read (Returns empty feed to support 1-Way Sync only)
router.get('/export-ical/:roomCategoryId', async (req, res) => {
    try {
        const { roomCategoryId } = req.params;
        const room = await Room.findById(roomCategoryId);
        if (!room) {
            return res.status(404).send('Room category not found');
        }
        
        // Return empty VCALENDAR to ensure nothing gets blocked on Booking.com / MakeMyTrip (1-Way Inbound Sync)
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Hotel Bhopal Inn//Direct Channel Exporter//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'END:VCALENDAR'
        ];
        
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="room-${roomCategoryId}.ics"`);
        res.send(icsContent.join('\r\n'));
    } catch (err) {
        console.error('Error exporting calendar:', err);
        res.status(500).send('Internal Server Error');
    }
});

// ==========================================
// 3. BACKGROUND CRON JOB
// ==========================================
// Automatically run calendar synchronization every hour
cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running scheduled hourly OTA iCal sync...');
    try {
        const stats = await syncCalendarsInternal();
        console.log('[Cron] iCal sync finished:', stats);
    } catch (err) {
        console.error('[Cron] Error in automatic iCal sync:', err.message);
    }
});

module.exports = router;
