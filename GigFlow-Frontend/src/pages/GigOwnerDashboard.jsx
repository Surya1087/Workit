import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../hooks/useApiClient';
import { useSocket } from '../hooks/useSocket';

const GigOwnerDashboard = () => {
  const navigate = useNavigate();
  const { client, isLoaded } = useApiClient();
  const socket = useSocket();

  const [gigs, setGigs] = useState([]);
  const [bidCounts, setBidCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch user's gigs
  useEffect(() => {
    if (!client) return;

    let active = true;
    const fetchGigs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await client.get('/api/gigs/my');
        if (!active) return;
        const data = response?.data;
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setGigs(list);

        // Fetch bid counts for each gig
        const counts = {};
        for (const gig of list) {
          try {
            const bidsResponse = await client.get(`/api/gigs/${gig.id}/bids`);
            counts[gig.id] = bidsResponse?.data?.count || 0;
          } catch (err) {
            counts[gig.id] = 0;
          }
        }
        setBidCounts(counts);
      } catch (err) {
        if (!active) return;
        const message = err?.response?.data?.error || 'Failed to load gigs';
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchGigs();

    return () => {
      active = false;
    };
  }, [client]);

  // Listen for new bids via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewBid = (data) => {
      console.log('New bid received:', data);
      setBidCounts((prev) => ({
        ...prev,
        [data.gigId]: (prev[data.gigId] || 0) + 1,
      }));
    };

    socket.on('bid:received', handleNewBid);

    return () => {
      socket.off('bid:received', handleNewBid);
    };
  }, [socket]);

  // Filter gigs
  const filteredGigs = useMemo(() => {
    let filtered = [...gigs];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((gig) => gig.status === statusFilter);
    }

    return filtered;
  }, [gigs, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: gigs.length,
      open: gigs.filter((g) => g.status === 'open').length,
      assigned: gigs.filter((g) => g.status === 'assigned').length,
      closed: gigs.filter((g) => g.status === 'closed').length,
      totalBids: Object.values(bidCounts).reduce((sum, count) => sum + count, 0),
    };
  }, [gigs, bidCounts]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-emerald-900/50 text-emerald-200 border-emerald-700',
      assigned: 'bg-blue-900/50 text-blue-200 border-blue-700',
      closed: 'bg-zinc-800 text-zinc-200 border-zinc-700',
    };
    return colors[status] || 'bg-zinc-800 text-zinc-200 border-zinc-700';
  };

  if (!isLoaded || !client) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-sm font-medium text-zinc-600">Preparing client...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/50 mb-2">
          <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-zinc-300">Your Gigs</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">Gig Owner Dashboard</h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Manage your posted gigs and view incoming bids.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-2">
          <p className="text-sm text-zinc-400">Total Gigs</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-800 bg-emerald-900/20 p-6 space-y-2">
          <p className="text-sm text-emerald-300">Open</p>
          <p className="text-3xl font-bold text-emerald-200">{stats.open}</p>
        </div>
        <div className="rounded-2xl border border-blue-800 bg-blue-900/20 p-6 space-y-2">
          <p className="text-sm text-blue-300">Assigned</p>
          <p className="text-3xl font-bold text-blue-200">{stats.assigned}</p>
        </div>
        <div className="rounded-2xl border border-amber-800 bg-amber-900/20 p-6 space-y-2">
          <p className="text-sm text-amber-300">Total Bids</p>
          <p className="text-3xl font-bold text-amber-200">{stats.totalBids}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-2">
          <p className="text-sm text-zinc-400">Avg Bid/Gig</p>
          <p className="text-3xl font-bold text-white">
            {stats.total > 0 ? (stats.totalBids / stats.total).toFixed(1) : '0'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'assigned', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
              statusFilter === status
                ? 'bg-white text-zinc-950'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <div className="inline-flex items-center gap-3 text-zinc-300">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading gigs...</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-800 bg-rose-900/30 p-6 text-center">
          <div className="flex items-center justify-center gap-3 text-rose-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && filteredGigs.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-4">
          <svg className="w-16 h-16 text-zinc-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white">No gigs found</p>
            <p className="text-sm text-zinc-400">
              {statusFilter !== 'all'
                ? `No ${statusFilter} gigs at the moment`
                : 'Create your first gig to get started'}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && filteredGigs.length > 0 && (
        <div className="space-y-4">
          {filteredGigs.map((gig) => {
            const bidCount = bidCounts[gig.id] || 0;
            return (
              <div
                key={gig.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/70 p-6 transition cursor-pointer"
                onClick={() => navigate(`/gigs/${gig.id}`)}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  {/* Left Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white truncate">{gig.title}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(gig.status)} whitespace-nowrap capitalize`}>
                        {gig.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{gig.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-zinc-400">
                        Posted: <span className="text-white font-semibold">{formatDate(gig.createdAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex items-center gap-6 md:flex-col md:items-end md:gap-4">
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">Budget</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(gig.budget)}</p>
                    </div>
                    {bidCount > 0 && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-900/50 border border-amber-700">
                        <span className="text-lg font-bold text-amber-200">{bidCount}</span>
                        <span className="text-sm text-amber-300">{bidCount === 1 ? 'bid' : 'bids'}</span>
                      </div>
                    )}
                    <div className="px-4 py-2 rounded-lg bg-zinc-800/50 text-zinc-300">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GigOwnerDashboard;
