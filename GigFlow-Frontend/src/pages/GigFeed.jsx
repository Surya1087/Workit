import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApiClient } from '../hooks/useApiClient';
import GigCard from '../components/domain/GigCard';
import AdvancedGigFilters from '../components/domain/AdvancedGigFilters';

const GigFeed = () => {
  const navigate = useNavigate();
  const { client, isLoaded } = useApiClient();

  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    minBudget: '',
    maxBudget: '',
    startDate: '',
    endDate: '',
  });
  const [savedGigs, setSavedGigs] = useState(() => {
    const saved = localStorage.getItem('savedGigs');
    return saved ? JSON.parse(saved) : [];
  });

  const query = useMemo(() => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (advancedFilters.minBudget) params.minBudget = advancedFilters.minBudget;
    if (advancedFilters.maxBudget) params.maxBudget = advancedFilters.maxBudget;
    if (advancedFilters.startDate) params.startDate = advancedFilters.startDate;
    if (advancedFilters.endDate) params.endDate = advancedFilters.endDate;
    return params;
  }, [search, advancedFilters]);

  useEffect(() => {
    if (!client) return;

    let active = true;
    const fetchGigs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await client.get('/api/gigs', { params: query });
        if (!active) return;
        const data = response?.data;
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setGigs(list);
      } catch (err) {
        if (!active) return;
        const message = err?.response?.data?.message || 'Failed to load gigs';
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchGigs();

    return () => {
      active = false;
    };
  }, [client, query]);

  // Sort gigs
  const sortedGigs = useMemo(() => {
    let sorted = [...gigs];
    
    if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'highest-budget') {
      sorted.sort((a, b) => b.budget - a.budget);
    } else if (sortBy === 'lowest-budget') {
      sorted.sort((a, b) => a.budget - b.budget);
    }
    
    return sorted;
  }, [gigs, sortBy]);

  // Toggle save gig
  const toggleSaveGig = (gigId) => {
    setSavedGigs((prev) => {
      const updated = prev.includes(gigId)
        ? prev.filter((id) => id !== gigId)
        : [...prev, gigId];
      localStorage.setItem('savedGigs', JSON.stringify(updated));
      return updated;
    });
  };

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      all: gigs.length,
      open: gigs.filter((g) => g.status === 'open').length,
    };
  }, [gigs]);

  const hasActiveFilters = search || advancedFilters.minBudget || advancedFilters.maxBudget || 
                          advancedFilters.startDate || advancedFilters.endDate;

  if (!isLoaded || !client) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-sm font-medium text-slate-600">Preparing client...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/50 mb-2">
          <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-zinc-300">Explore Opportunities</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">Browse Gigs</h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Discover exciting projects that match your skills and start building your portfolio today.
        </p>
      </div>

      {/* Search and Quick Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-4">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gigs by title or description..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 pl-12 pr-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              hasActiveFilters
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters {hasActiveFilters && '✓'}
          </button>
          <Link
            to="/gigs/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-zinc-950 px-6 py-3 text-sm font-semibold shadow-sm transition hover:bg-zinc-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post a Gig
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            statusFilter === 'all'
              ? 'bg-white text-zinc-950'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          All ({statusCounts.all})
        </button>
        <button
          onClick={() => setStatusFilter('open')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            statusFilter === 'open'
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          Open ({statusCounts.open})
        </button>
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-4">
        <div className="text-sm text-zinc-400">
          {sortedGigs.length} {sortedGigs.length === 1 ? 'gig' : 'gigs'} available
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-white focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50 outline-none"
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="highest-budget">Highest Budget</option>
          <option value="lowest-budget">Lowest Budget</option>
        </select>
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

      {!loading && !error && sortedGigs.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-4">
          <svg className="w-16 h-16 text-zinc-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white">No gigs found</p>
            <p className="text-sm text-zinc-400">
              {search ? 'Try adjusting your search terms' : 'Try changing the filters'} or check back later for new opportunities
            </p>
          </div>
        </div>
      )}

      {!loading && !error && sortedGigs.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {sortedGigs.map((gig) => {
            const id = gig._id || gig.id;
            const owner = gig.owner || {};
            const ownerName = owner.name || owner.email || 'Anonymous';
            const ownerInitial = ownerName.charAt(0).toUpperCase();
            const isSaved = savedGigs.includes(id);
            
            return (
              <div key={id} className="relative">
                <GigCard
                  title={gig.title}
                  description={gig.description}
                  budget={gig.budget}
                  status={gig.status}
                  createdAt={gig.createdAt}
                  ownerName={ownerName}
                  ownerInitial={ownerInitial}
                  onClick={() => navigate(`/gigs/${id}`)}
                />
                <button
                  onClick={() => toggleSaveGig(id)}
                  className={`absolute top-4 right-4 p-2 rounded-lg transition ${
                    isSaved
                      ? 'bg-yellow-600 text-yellow-100'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                  title={isSaved ? 'Saved' : 'Save gig'}
                >
                  <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Advanced Filters Modal */}
      <AdvancedGigFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onFilterChange={setAdvancedFilters}
      />
    </div>
  );
};

export default GigFeed;
