const mongoose = require('mongoose');
const Room = require('./models/Room');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const rooms = [
  {
    category: 'Standard Deluxe',
    title: 'Standard Deluxe Room',
    description: 'Our Standard Deluxe rooms are designed for comfort and value. Fully air-conditioned with 24-hour hot and cold water, high-speed Wi-Fi, quality bed linen, and a complete toiletries set. Ideal for business travellers and couples seeking a clean, comfortable stay in Bhopal city centre.',
    images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop'],
    amenities: ['AC', 'Wi-Fi', 'Hot Water', 'TV', 'Toiletries', 'Premium Linen'],
    details: {
      noOfRooms: 8,
      maxOccupancy: '2 guests',
      bedType: 'Double / Twin',
      view: 'City / Courtyard',
      startingPrice: 1999,
      extraPersonCharge: 500
    },
    tags: ['AC', 'Wi-Fi', 'Budget']
  },
  {
    category: 'Balcony Deluxe',
    title: 'Balcony Deluxe Room',
    description: 'Step out on your private balcony and soak in the city views. The Balcony Deluxe rooms offer all our standard amenities plus an exclusive outdoor space — perfect for morning tea or an evening wind-down. A favourite for guests who love a breath of fresh air.',
    images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop'],
    amenities: ['AC', 'Wi-Fi', 'Hot Water', 'TV', 'Toiletries', 'Premium Linen', 'Private Balcony'],
    details: {
      noOfRooms: 4,
      maxOccupancy: '2 guests',
      bedType: 'Double',
      view: 'Balcony + City',
      startingPrice: 2499,
      extraPersonCharge: 600
    },
    tags: ['AC', 'Private Balcony']
  },
  {
    category: 'Super Deluxe',
    title: 'Super Deluxe Room',
    description: 'Our finest rooms, crafted for those who desire a little extra. The Super Deluxe rooms feature premium furnishings, a hair dryer, superior bed linen, and extra floor space — delivering the best in-room experience at Hotel Bhopal Inn. Ideal for honeymoon couples or guests celebrating a special occasion.',
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop'],
    amenities: ['AC', 'Wi-Fi', 'Hot Water', 'TV', 'Toiletries', 'Premium Linen', 'Hair Dryer'],
    details: {
      noOfRooms: 4,
      maxOccupancy: '2–3 guests',
      bedType: 'King / Double',
      view: 'Premium City View',
      startingPrice: 2999,
      extraPersonCharge: 750
    },
    tags: ['AC', 'Best in House', 'Most Popular']
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    await Room.deleteMany({});
    await Room.insertMany(rooms);
    console.log('Database Seeded Successfully');
    process.exit();
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedDB();
