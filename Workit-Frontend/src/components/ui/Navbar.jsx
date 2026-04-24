import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useState } from 'react';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/gigs', label: 'Browse Gigs' },
    { to: '/gigs/new', label: 'Post a Gig', protected: true },
    { to: '/dashboard', label: 'Your Gigs', protected: true },
    { to: '/dashboard/bids', label: 'Your Bids', protected: true },
    { to: '/messages', label: 'Messages', protected: true },
  ];

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
      <nav className="relative flex items-center justify-between px-4 py-3 rounded-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800 shadow-lg">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm bg-white flex items-center justify-center">
            <span className="text-zinc-950 font-bold text-sm">WI</span>
          </div>
          <span className="font-semibold text-white hidden sm:block text-xl" style={{ fontFamily: 'Delius, cursive' }}>Workit</span>
        </Link>

        {/* Center Navigation - Desktop */}
        <div className="hidden md:flex items-center gap-1 relative">
          {navLinks.map((link) => {
            if (link.protected && !authUser) return null;
            // Exact match for active state to avoid conflicts
            const isActive = location.pathname === link.to;
            
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-4 py-2 text-sm transition-colors rounded-full ${
                  isActive 
                    ? 'text-white bg-zinc-800' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Side - Auth */}
        <div className="hidden md:flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all h-8 rounded-md gap-1.5 px-3 text-zinc-400 hover:text-white hover:bg-zinc-800">
                Sign In
              </button>
            </SignInButton>
            <Link
              to="/register"
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all h-8 gap-1.5 bg-white text-zinc-950 hover:bg-zinc-200 rounded-full px-4"
            >
              Get Started
            </Link>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <span className="text-xs text-zinc-400 hidden lg:block">
                {authUser?.email || authUser?.name}
              </span>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 rounded-full ring-2 ring-zinc-700 hover:ring-zinc-600 transition-all',
                    userButtonPopoverCard: 'bg-zinc-900 border border-zinc-800',
                    userButtonPopoverActionButton: 'hover:bg-zinc-800',
                  },
                }}
              />
            </div>
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg md:hidden">
            <div className="p-4 space-y-2">
              {navLinks.map((link) => {
                if (link.protected && !authUser) return null;
                const isActive = location.pathname === link.to;
                
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded-lg transition ${
                      isActive
                        ? 'text-white bg-zinc-800'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
