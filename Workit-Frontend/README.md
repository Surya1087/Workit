* Workit Frontend *

A modern React-based frontend for a freelance marketplace platform.

Get the Workit Frontend  : https://github.com/Surya1087/Workit/tree/main/Workit-Frontend

* Tech Stack :
  
- React 19 + Vite
- Tailwind CSS
- Redux Toolkit (State management)
- React Router
- Clerk React (Authentication)
- Socket.io-client (Real-time notifications)
- Axios (API calls)

* Key Features :
  
-  User authentication (Clerk)
-  Browse and search gigs
-  Post new gigs
-  Submit and manage bids
-  Hire freelancers with transaction safety
-  Real-time notification system with badge
-  Notification history with localStorage persistence
-  Responsive design

* Setup Instructions :
  
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Fill in your environment variables
5. Run: `npm run dev`

* Environment Variables:

See `.env.example`:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk public key

* Notification System :

The app includes a complete notification system:
- Real-time notifications via Socket.io
- Notification bell with unread count
- Persistent notification history
- Browser push notifications
- Click to navigate to relevant page

* Project Structure
```
src/
├── components/    # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom hooks (socket, auth, API)
├── store/         # Redux store & slices
├── services/      # API client
└── config/        # Environment config
```

* Imp Features Implemented

Real-time Notifications :

- Socket.io connection on login
- Instant "You Got Hired!" notifications
- No refresh required
- Notification history persists in localStorage
