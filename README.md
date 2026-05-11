# Hotel Bhopal Inn - Management System

A comprehensive, luxury-focused Hotel Management System built with the MERN stack (MongoDB, Express, React, Node.js). This system manages room bookings, banquet events, inventory, and finances with a premium, high-end user interface.

## 🚀 Features

- **Luxury User Interface**: High-end design with smooth animations and premium aesthetics.
- **Dynamic Booking Engine**: Real-time room availability and booking management.
- **Banquet Management**: Dedicated module for event planning and banquet enquiries.
- **Inventory & Finance**: Comprehensive tracking of hotel assets and daily financial transactions.
- **Admin Dashboard**: Powerful analytics and management tools for hotel administrators.
- **Real-time Updates**: Socket.io integration for instant status updates across the system.

---

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, TailwindCSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Atlas).
- **Authentication**: JWT (JSON Web Tokens).
- **Communication**: Socket.io, Axios.

---

## 📦 Installation & Setup

Follow these steps to get the project running locally on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/Obsidian-Six/Hotel-bhopal-inn.git
cd Hotel-bhopal-inn
```

### 2. Backend Setup
Go to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder and add the following:
```env
MONGO_URI=your_mongodb_atlas_connection_string
PORT=8000
JWT_SECRET=your_secure_random_string
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 3. Frontend Setup
Go to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder and add:
```env
VITE_API_URL=http://localhost:8000
```

### 4. Seed Admin User
Run the following command in the `backend` folder to create an initial admin account:
```bash
cd backend
node seedAdmin.js
```
**Default Admin Credentials:**
- **Email:** `admin@bhopalinn.com`
- **Password:** `adminpassword123`

---

## 🚀 Running the Project

### Start Backend
```bash
cd backend
npm run start # or nodemon server.js
```

### Start Frontend
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.
The backend will be available at `http://localhost:8000`.

---

## 📄 License
This project is for internal hotel management use. All rights reserved.

---

## 👤 Author
Developed for **Hotel Bhopal Inn**.
