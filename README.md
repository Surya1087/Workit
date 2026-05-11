* Workit — Freelance Marketplace Platform *

A full-stack freelance marketplace where clients post gigs, freelancers submit bids, and hiring is handled with transactional safety and real-time notifications.

Repositories : 
Workit : https://github.com/Surya1087/Workit

Workit-Frontend : https://github.com/Surya1087/Workit/tree/main/Workit-Frontend

Workit-Backend : https://github.com/Surya1087/Workit/tree/main/Workit-Backend

✨ Platform Features : 
- User Authentication — Secure login/signup powered by Clerk
- Browse & Search Gigs — Discover open freelance opportunities
- Post New Gigs — Clients can create and publish gig listings
- Submit & Manage Bids — Freelancers bid on relevant gigs
- Hire Freelancers — Atomic, race-condition-safe hiring flow
- Real-time Notifications — Instant "You Got Hired!" alerts via Socket.io
- Notification History — Persistent log stored in localStorage
- Responsive Design — Works seamlessly on desktop and mobile

* Frontend :

A modern React-based UI for browsing gigs, placing bids, and receiving real-time updates.

* Tech Stack :

 Technology :  Purpose  ->
 React 19 + Vite : UI framework & build tool 
 Tailwind CSS : Utility-first styling 
 Redux Toolkit : Global state management 
 React Router : Client-side routing 
 Clerk React : Authentication & user sessions 
 Socket.io-client : Real-time notifications 
 Axios : HTTP API calls 

* Project Structure

```
src/
├── components/    # Reusable UI components
├── pages/         # Page-level components (routes)
├── hooks/         # Custom hooks (socket, auth, API)
├── store/         # Redux store & feature slices
├── services/      # Axios API client
└── config/        # Environment & app configuration
```

*  Setup Instructions

*  Prerequisites

- Node.js v18+
- npm or yarn
- A running Workit Backend instance
- A [Clerk](https://clerk.com) account

*  Steps

1. Clone & navigate
   ```bash
   git clone https://github.com/Surya1087/Workit.git
   cd Workit/Workit-Frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment
   ```bash
   cp .env.example .env
   ```

4. Start the dev server
   ```bash
   npm run dev
   ```

*  Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000      # Backend API URL
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...       # Clerk publishable key (use pk_live_... in production)
```

*  Available Scripts

 Command : Description ->

 `npm run dev` : Start Vite development server 
 `npm run build` : Build for production 
 `npm run preview` : Preview the production build 

*  Notification System

- Socket.io Connection — Established automatically on login
- Instant Alerts — "You Got Hired!" without any page refresh
- Unread Badge — Bell icon shows count of unread notifications
- Persistent History — Stored in `localStorage`, survives reloads
- Browser Push Notifications — Native alerts for background events
- Click-to-Navigate — Each notification links to the relevant page

* Backend

A Node.js/Express REST API with atomic hiring logic and real-time Socket.io notifications.

* Tech Stack

* Technology : Purpose ->
 Node.js + Express.js : Server framework 
 MongoDB + Mongoose : Database & ODM 
 Socket.io : Real-time event notifications 
 Clerk : Authentication & identity 
 JWT + HttpOnly Cookies : Secure session handling 

* Project Structure

```
src/
├── controllers/    # Route business logic
├── models/         # Mongoose schemas (Gig, Bid, User)
├── routes/         # Express API route definitions
├── middleware/     # Auth validation & request guards
├── utils/          # Socket.io helpers & utilities
└── config/         # Database connection configuration
```

* Setup Instructions

* Prerequisites

- Node.js v18+
- MongoDB (local or [Atlas](https://cloud.mongodb.com))
- A [Clerk](https://clerk.com) account
- npm or yarn

* Steps

1. Clone & navigate
   ```bash
   git clone https://github.com/Surya1087/Workit.git
   cd Workit/Workit-Backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment
   ```bash
   cp .env.example .env
   ```

4. Start MongoDB (local or connect to Atlas)

5. Start the dev server
   ```bash
   npm run dev
   ```

* Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/workit    # MongoDB connection string
CLERK_SECRET_KEY=sk_test_...                    # Clerk secret key (use matching sk_live_... in Render/production)
PORT=5000                                        # Server port
CLIENT_URL=http://localhost:5173                 # Frontend URL (CORS)
```

* API Endpoints

* Authentication

 Method : Endpoint : Description : Auth ->
 GET : `/api/auth/me` : Get current user : ✅ 

* Gigs

Method : Endpoint : Description : Auth ->
 GET : `/api/gigs` : List all open gigs (supports `?search=`) : ❌ 
 POST : `/api/gigs` : Create a new gig : ✅ 
 GET : `/api/gigs/:id` : Get details of a specific gig : ❌ 

* Bids

Method : Endpoint : Description : Auth ->
POST : `/api/bids` : Submit a bid on a gig : ✅ 
GET : `/api/bids/:gigId` : Get all bids for a gig (owner only) : ✅ 
PATCH : `/api/bids/:bidId/hire` : Hire a freelancer (uses transactions) : ✅ 

* Notable Implementations

* Transactional Hiring

The `PATCH /api/bids/:bidId/hire` endpoint uses MongoDB transactions to guarantee:

- Only one freelancer can ever be hired per gig — no duplicates
- All writes (gig status + bid statuses) are atomic
- Failed operations are fully rolled back
- Concurrent hire requests (race conditions) are safely prevented

* Real-time Notifications

When a freelancer is hired, the server immediately emits a Socket.io event to their connected client — no polling, no page refresh required.

* Available Scripts

 Command : Description ->
 `npm run dev` : Start server with hot reload (nodemon) 
 `npm start` : Start server in production mode 

