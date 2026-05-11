* Workit Backend *

A Node.js/Express backend for a freelance marketplace with secure hiring logic and real-time notifications.

Get the Workit Backend from  : https://github.com/Surya1087/Workit/tree/main/Workit-Backend

🚀 Tech Stack
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.io (Real-time notifications)
- Clerk (Authentication)
- JWT with HttpOnly cookies

🎯 Key Features
- ✅ Secure user authentication with Clerk
- ✅ CRUD operations for Gigs (Jobs)
- ✅ Bidding system for Freelancers
- ✅ Atomic hiring logic with MongoDB Transactions
- ✅ Real-time Socket.io notifications
- ✅ Race condition prevention
- ✅ Comprehensive error handling

🔧 Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Fill in your environment variables (see below)
5. Start MongoDB (local or Atlas)
6. Run: `npm run dev`

## 🌍 Environment Variables

See `.env.example` for required variables:
- `MONGODB_URI` - MongoDB connection string
- `CLERK_SECRET_KEY` - Clerk authentication secret
- `PORT` - Server port (default: 5000)
- `CLIENT_URL` - Frontend URL for CORS

📡 API Endpoints

Authentication
- `GET /api/auth/me` - Get current user

Gigs
- `GET /api/gigs` - List all open gigs (supports search)
- `POST /api/gigs` - Create new gig (auth required)
- `GET /api/gigs/:id` - Get gig details

Bids
- `POST /api/bids` - Submit bid (auth required)
- `GET /api/bids/:gigId` - Get all bids for gig (owner only)
- `PATCH /api/bids/:bidId/hire` - **Hire freelancer** (uses transactions)

🏆 Extra Features Implemented

1: Transactional Integrity
Uses MongoDB transactions in the hire endpoint to ensure:
- Only ONE freelancer can be hired per gig
- All operations are atomic (gig status update, bid status updates)
- Race conditions are prevented

2: Real-time Notifications
Socket.io integration provides instant notifications when:
- Freelancer gets hired
- No page refresh required

📁 Backend Project Structure
```
src/
├── controllers/    # Business logic
├── models/        # MongoDB schemas
├── routes/        # API routes
├── middleware/    # Auth & validation
├── utils/         # Socket.io utility
└── config/        # Database config
```
