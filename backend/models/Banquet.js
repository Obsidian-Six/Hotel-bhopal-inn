const mongoose = require('mongoose');

const banquetSchema = new mongoose.Schema({
    name: { type: String, default: 'Grand Ballroom' },
    title: { type: String, default: 'Banquet Hall & Event Services' },
    subHeadline: { type: String, default: 'From corporate meetings to social celebrations — we make every event memorable' },
    heroImages: [{ type: String }], // Array of URLs for hero slider
    overviewPhotos: [{ type: String }], // Array of URLs
    capacityTheatre: { type: String, default: '500' },
    capacityBanquet: { type: String, default: '300' },
    dimensions: { type: String, default: '5000' },
    naturalLight: { type: Boolean, default: true },
    airConditioning: { type: Boolean, default: true },
    avEquipment: { type: Boolean, default: true },
    parking: { type: String, default: '50' },
    cateringDescription: { type: String, default: 'Our experienced kitchen team serves authentic Indian cuisine with a focus on quality and hygiene.' },
    cuisineTypes: [{ type: String, default: ['North Indian', 'South Indian', 'Chinese'] }],
    mealOptions: [{ type: String, default: ['Breakfast', 'Lunch', 'High Tea', 'Dinner', 'Cocktail Snacks'] }]
}, { timestamps: true });

module.exports = mongoose.model('Banquet', banquetSchema);
