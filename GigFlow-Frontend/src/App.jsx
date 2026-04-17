import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useSocket } from './hooks/useSocket';
import { Navbar } from './components/ui/Navbar';
import ToastContainer from './components/ui/ToastContainer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import GigCreate from './pages/GigCreate';
import GigDetail from './pages/GigDetail';
import GigFeed from './pages/GigFeed';
import BidsDashboard from './pages/BidsDashboard';
import Messages from './pages/Messages';
import Login from './pages/Login';
import Register from './pages/Register';

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <p className="text-sm font-medium text-slate-600">Loading session...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const location = useLocation();
  const { isSignedIn, isLoaded } = useUser();
  
  // Initialize socket connection
  useSocket();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-sm font-medium text-zinc-400">Loading...</p>
      </div>
    );
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-zinc-950">
      {!isAuthPage && <Navbar />}
      {isAuthPage ? (
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      ) : (
        <main className="mx-auto max-w-6xl px-4 pt-24 pb-10">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 shadow-[0_10px_50px_-25px_rgba(0,0,0,0.6)] backdrop-blur">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/gigs" element={<GigFeed />} />
              <Route
                path="/gigs/new"
                element={(
                  <ProtectedRoute>
                    <GigCreate />
                  </ProtectedRoute>
                )}
              />
              <Route path="/gigs/:id" element={<GigDetail />} />
              <Route
                path="/dashboard"
                element={(
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/dashboard/bids"
                element={(
                  <ProtectedRoute>
                    <BidsDashboard />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/messages"
                element={(
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                )}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      )}
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

export default App;
