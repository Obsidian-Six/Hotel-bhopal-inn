const express = require('express');
const router = express.Router();
const axios = require('axios');

// Fetch Google Reviews using Place Details API
router.get('/', async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        const placeId = process.env.GOOGLE_PLACE_ID;

        if (!apiKey || !placeId) {
            return res.status(500).json({ message: 'Google Places API credentials not configured properly' });
        }

        const googleApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews&key=${apiKey}`;

        const response = await axios.get(googleApiUrl);

        if (response.data && response.data.result && response.data.result.reviews) {
            // Sort by rating or just return
            // Google usually returns up to 5 top reviews
            const reviews = response.data.result.reviews.map(review => ({
                id: review.time, // Using timestamp as pseudo id
                name: review.author_name,
                profile_photo_url: review.profile_photo_url,
                rating: review.rating,
                text: review.text,
                time: review.relative_time_description,
                source: 'Google'
            }));
            
            res.status(200).json(reviews);
        } else {
            res.status(200).json([]);
        }
    } catch (error) {
        console.error('Error fetching Google Reviews:', error.message);
        res.status(500).json({ message: 'Error fetching reviews from Google', error: error.message });
    }
});

module.exports = router;
