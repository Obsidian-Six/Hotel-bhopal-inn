const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Room = require('./models/Room');
const RoomUnit = require('./models/RoomUnit');

const MONGO_URI = process.env.MONGO_URI;

const roomCategoriesData = [
  {
    category: 'Balcony Deluxe',
    title: 'Balcony Deluxe Room',
    description: 'Step out on your private balcony and soak in the city views. The Balcony Deluxe rooms offer all our standard amenities plus an exclusive outdoor space — perfect for morning tea or an evening wind-down.',
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
    tags: ['AC', 'Private Balcony'],
    roomNumbers: ['101', '102', '201', '202']
  },
  {
    category: 'Double Deluxe',
    title: 'Double Deluxe Room',
    description: 'Our Double Deluxe rooms are designed for comfort and value. Fully air-conditioned with 24-hour hot and cold water, high-speed Wi-Fi, quality bed linen, and a complete toiletries set.',
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
    tags: ['AC', 'Wi-Fi', 'Popular'],
    roomNumbers: ['103', '104', '105', '106', '203', '204', '205', '206']
  },
  {
    category: 'Super Deluxe',
    title: 'Super Deluxe Room',
    description: 'Our finest rooms, crafted for those who desire a little extra. The Super Deluxe rooms feature premium furnishings, a hair dryer, superior bed linen, and extra floor space.',
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
    tags: ['AC', 'Best in House', 'Most Popular'],
    roomNumbers: ['107', '108', '207', '208']
  }
];

const seedDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    console.log('Connected to MongoDB for room seeding...');

    const createdRooms = {};
    for (const catData of roomCategoriesData) {
      let room = await Room.findOne({ category: catData.category });
      if (!room && catData.category === 'Double Deluxe') {
        room = await Room.findOne({ category: 'Standard Deluxe' });
      }

      if (room) {
        room.category = catData.category;
        room.title = catData.title;
        room.description = catData.description;
        room.amenities = catData.amenities;
        room.details = catData.details;
        room.tags = catData.tags;
        await room.save();
      } else {
        room = new Room({
          category: catData.category,
          title: catData.title,
          description: catData.description,
          images: catData.images,
          amenities: catData.amenities,
          details: catData.details,
          tags: catData.tags
        });
        await room.save();
      }
      createdRooms[catData.category] = room._id;
    }

    const targetRoomNumbers = ['101', '102', '201', '202', '103', '104', '105', '106', '203', '204', '205', '206', '107', '108', '207', '208'];
    await RoomUnit.deleteMany({ roomNumber: { $nin: targetRoomNumbers } });

    for (const catData of roomCategoriesData) {
      const categoryId = createdRooms[catData.category];
      for (const num of catData.roomNumbers) {
        await RoomUnit.findOneAndUpdate(
          { roomNumber: num },
          { roomNumber: num, category: categoryId },
          { upsert: true, new: true }
        );
      }
    }

    console.log('Successfully seeded rooms and 16 room units!');
    if (require.main === module) process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    if (require.main === module) process.exit(1);
  }
};

if (require.main === module) {
  seedDB();
}

module.exports = seedDB;

