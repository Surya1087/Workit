import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../hooks/useApiClient';

const GigOwnerDashboard = () => {
  const { client } = useApiClient();
  const navigate = useNavigate();
  
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchMyGigs();
  }, [client]);

  const fetchMyGigs = async () => {
    if (!client) return;

    setLoading(true);
    setError(null);
    try {
      const response = await client.get('/gigs/my');
      const data = response?.data;
      const list = Array.isArray(data?.data) ? data.data : [];
      setGigs(list);
    } catch (err) {
      const message = err?.response?.data?.error || 'Failed to load your gigs';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGig = async (gigId) => {
    if (!client) return;

    setDeletingId(gigId);
    setShowDeleteConfirm(null);
    
    try {
      await client.delete(`/gigs/${gigId}`);
      
      // Remove gig from state
      setGigs((prevGigs) => prevGigs.filter((gig) => gig.id !== gigId));
      
      setSuccessMessage(`Gig deleted successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const message = err?.response?.data?.error || 'Failed to delete gig';
      setError(message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ NEW: Navigate to gig detail page
  const handleGigClick = (gigId) => {
    navigate(`/gigs/${gigId}`);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
        <div className="inline-flex items-center gap-3 text-zinc-300">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading your gigs...</span>
        </div>
      </div>
    );
  }

  if (error && gigs.length === 0) {
    return (
      <div className="rounded-2xl border border-rose-800 bg-rose-900/30 p-6 text-center">
        <div className="flex items-center justify-center gap-3 text-rose-200">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (gigs.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-4">
        <svg className="w-16 h-16 text-zinc-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6v-6m0 6v6m0-6h-6m0 0H0" />
        </svg>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-white">No gigs posted yet</p>
          <p className="text-sm text-zinc-400">Start by posting a gig to find freelancers for your project</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-800 bg-emerald-900/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-200 hover:text-emerald-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && gigs.length > 0 && (
        <div className="rounded-2xl border border-rose-800 bg-rose-900/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-rose-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-200 hover:text-rose-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-white mb-6">Your Posted Gigs ({gigs.length})</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {gigs.map((gig) => (
          <div 
            key={gig.id} 
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 transition-all cursor-pointer group"
            onClick={() => handleGigClick(gig.id)}
          >
            {/* Header with Status */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">{gig.title}</h3>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    gig.status === 'open'
                      ? 'bg-emerald-900/30 text-emerald-200 border border-emerald-800'
                      : gig.status === 'assigned'
                      ? 'bg-amber-900/30 text-amber-200 border border-amber-800'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}>
                    {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
              {gig.description}
            </p>

            {/* Budget */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Budget</span>
              <span className="text-2xl font-bold text-white">${gig.budget}</span>
            </div>

            {/* Dates */}
            <div className="mb-6 space-y-2 text-xs text-zinc-500">
              <p>Posted: {new Date(gig.createdAt).toLocaleDateString()}</p>
              <p>Last updated: {new Date(gig.updatedAt).toLocaleDateString()}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {/* View Bids Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGigClick(gig.id);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 transition border border-blue-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Bids
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(gig.id);
                }}
                disabled={deletingId === gig.id}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-900/20 text-rose-200 hover:bg-rose-900/40 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 transition border border-rose-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deletingId === gig.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm === gig.id && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full">
                  <h3 className="text-lg font-bold text-white mb-2">Delete Gig?</h3>
                  <p className="text-zinc-400 mb-6">
                    Are you sure you want to delete "<span className="font-semibold">{gig.title}</span>"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteGig(gig.id)}
                      disabled={deletingId === gig.id}
                      className="flex-1 px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {deletingId === gig.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GigOwnerDashboard;