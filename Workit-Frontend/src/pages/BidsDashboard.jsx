import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../hooks/useApiClient';
import { useSocket } from '../hooks/useSocket';

const BidsDashboard = () => {
  const navigate = useNavigate();
  const { client, isLoaded } = useApiClient();
  const socket = useSocket();

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Fetch bids
  useEffect(() => {
    if (!client) return;

    let active = true;
    const fetchBids = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await client.get('/api/bids/my');
        if (!active) return;
        const data = response?.data;
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setBids(list);
      } catch (err) {
        if (!active) return;
        const message = err?.response?.data?.error || 'Failed to load bids';
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchBids();

    return () => {
      active = false;
    };
  }, [client]);

  // Listen for bid status changes via socket
  useEffect(() => {
    if (!socket) return;

    const handleBidStatusChange = (data) => {
      console.log('Bid status changed:', data);
      setBids((prevBids) =>
        prevBids.map((bid) =>
          bid.id === data.bidId ? { ...bid, status: data.status } : bid
        )
      );
    };

    const handleNewBidSubmitted = (data) => {
      console.log('New bid submitted (freelancer view):', data);
      // Refresh bids list
      if (client) {
        client.get('/api/bids/my').then((response) => {
          const list = Array.isArray(response?.data?.data) ? response.data.data : [];
          setBids(list);
        });
      }
    };

    socket.on('bid:status-changed', handleBidStatusChange);
    socket.on('bid:submitted', handleNewBidSubmitted);

    return () => {
      socket.off('bid:status-changed', handleBidStatusChange);
      socket.off('bid:submitted', handleNewBidSubmitted);
    };
  }, [socket, client]);

  // Filter bids
  const filteredBids = useMemo(() => {
    let filtered = [...bids];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((bid) => bid.status === statusFilter);
    }

    return filtered;
  }, [bids, statusFilter]);

  // Sort bids
  const sortedBids = useMemo(() => {
    let sorted = [...filteredBids];

    if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'highest-price') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'lowest-price') {
      sorted.sort((a, b) => a.price - b.price);
    }

    return sorted;
  }, [filteredBids, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: bids.length,
      pending: bids.filter((b) => b.status === 'pending').length,
      hired: bids.filter((b) => b.status === 'hired').length,
      rejected: bids.filter((b) => b.status === 'rejected').length,
      totalValue: bids
        .filter((b) => b.status === 'pending')
        .reduce((sum, b) => sum + (b.price || 0), 0),
    };
  }, [bids]);

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

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-900/50 text-amber-200 border-amber-700',
      hired: 'bg-emerald-900/50 text-emerald-200 border-emerald-700',
      rejected: 'bg-rose-900/50 text-rose-200 border-rose-700',
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className="text-sm text-zinc-300">Your Bids</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">Bids Dashboard</h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Track all your submitted bids and manage your pipeline.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-2">
          <p className="text-sm text-zinc-400">Total Bids</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-800 bg-amber-900/20 p-6 space-y-2">
          <p className="text-sm text-amber-300">Pending</p>
          <p className="text-3xl font-bold text-amber-200">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-emerald-800 bg-emerald-900/20 p-6 space-y-2">
          <p className="text-sm text-emerald-300">Hired</p>
          <p className="text-3xl font-bold text-emerald-200">{stats.hired}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-2">
          <p className="text-sm text-zinc-400">Pending Value</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalValue)}</p>
        </div>
      </div>

      {/* Filter and Sort */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'hired', 'rejected'].map((status) => (
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
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-white focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50 outline-none"
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="highest-price">Highest Price</option>
          <option value="lowest-price">Lowest Price</option>
        </select>
      </div>

      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <div className="inline-flex items-center gap-3 text-zinc-300">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading bids...</span>
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

      {!loading && !error && sortedBids.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-4">
          <svg className="w-16 h-16 text-zinc-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white">No bids found</p>
            <p className="text-sm text-zinc-400">
              {statusFilter !== 'all'
                ? `No ${statusFilter} bids at the moment`
                : 'Submit your first bid to get started'}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && sortedBids.length > 0 && (
        <div className="space-y-4">
          {sortedBids.map((bid) => (
            <div
              key={bid.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/70 p-6 transition cursor-pointer"
              onClick={() => navigate(`/gigs/${bid.gig?.id}`)}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                {/* Left Section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white truncate">{bid.gig?.title}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(bid.status)} whitespace-nowrap capitalize`}>
                      {bid.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{bid.message}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-400">
                      Gig budget: <span className="text-white font-semibold">{formatCurrency(bid.gig?.budget)}</span>
                    </span>
                    <span className="text-zinc-400">
                      {formatDate(bid.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4 md:flex-col md:items-end">
                  <div className="text-right">
                    <p className="text-sm text-zinc-400">Your Bid</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(bid.price)}</p>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-zinc-800/50 text-zinc-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BidsDashboard;
