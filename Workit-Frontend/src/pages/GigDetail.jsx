import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import { useApiClient } from '../hooks/useApiClient';
import { useAuthUser } from '../hooks/useAuthUser';

const statusColors = {
  open: 'bg-emerald-100/10 text-emerald-100 border-emerald-200/30',
  assigned: 'bg-amber-100/10 text-amber-100 border-amber-200/30',
  closed: 'bg-rose-100/10 text-rose-100 border-rose-200/30',
};

const GigDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { client, isLoaded: apiLoaded } = useApiClient();
  const { authUser } = useAuthUser();

  const [gig, setGig] = useState(null);
  const [gigLoading, setGigLoading] = useState(false);
  const [gigError, setGigError] = useState(null);

  const [bids, setBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [bidsError, setBidsError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bidError, setBidError] = useState(null);
  const [bidLoading, setBidLoading] = useState(false);
  const [userBid, setUserBid] = useState(null);
  const [userBidLoading, setUserBidLoading] = useState(false);

  const isAssigned = gig?.status === 'assigned';
  const isClosed = gig?.status === 'closed';
  const canBid = gig?.status === 'open';
  const isHired = userBid?.status === 'hired';

  const statusBadgeClass = useMemo(() => {
    return statusColors[gig?.status] || statusColors.open;
  }, [gig?.status]);

  const loadGig = async () => {
    if (!client || !id) return;
    setGigLoading(true);
    setGigError(null);
    try {
      const response = await client.get(`/api/gigs/${id}`);
      const data = response?.data;
      const detail = data?.data || data;
      setGig(detail);
      const userIsOwner = detail?.isOwner === true;
      setIsOwner(userIsOwner);
      
      if (userIsOwner) {
        loadBids();
      } else {
        loadMyBid();
      }
    } catch (err) {
      const messageText = err?.response?.data?.error || err?.response?.data?.message || 'Failed to load gig';
      setGigError(messageText);
    } finally {
      setGigLoading(false);
    }
  };

  const loadBids = async () => {
    if (!client || !id) return;
    setBidsLoading(true);
    setBidsError(null);
    try {
      const response = await client.get(`/api/bids/${id}`);
      const data = response?.data;
      const list = data?.data || data || [];
      setBids(Array.isArray(list) ? list : []);
    } catch (err) {
      const messageText = err?.response?.data?.error || err?.response?.data?.message || 'Failed to load bids';
      setBidsError(messageText);
    } finally {
      setBidsLoading(false);
    }
  };

  const loadMyBid = async () => {
    if (!client || !id || !authUser) return;
    setUserBidLoading(true);
    try {
      const response = await client.get(`/api/bids/my/${id}`);
      const data = response?.data?.data;
      setUserBid(data);
      if (data) {
        setMessage(data.message || '');
        setPrice(data.price?.toString() || '');
        setContactName(data.contactName || '');
        setContactEmail(data.contactEmail || '');
        setContactPhone(data.contactPhone || '');
      }
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.error('Error loading user bid:', err);
      }
    } finally {
      setUserBidLoading(false);
    }
  };

  useEffect(() => {
    loadGig();
  }, [client, id, authUser]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!client || !id) return;

    if (!message.trim()) {
      setBidError('Message is required');
      return;
    }
    if (message.trim().length < 10) {
      setBidError('Message must be at least 10 characters');
      return;
    }
    if (price === '' || Number.isNaN(Number(price))) {
      setBidError('Price is required');
      return;
    }
    if (Number(price) <= 0) {
      setBidError('Price must be positive');
      return;
    }

    setBidLoading(true);
    setBidError(null);
    try {
      const payload = {
        message: message.trim(),
        price: Number(price),
        gigId: id,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
      };

      if (userBid) {
        await client.put(`/api/bids/${userBid.id}`, payload);
      } else {
        const response = await client.post(`/api/bids`, payload);
        setUserBid(response?.data?.data);
      }

      // Show success notification
      if (window.__toastContainer) {
        window.__toastContainer.addToast({
          type: 'success',
          title: userBid ? 'Proposal Updated! ✓' : 'Proposal Submitted! ✓',
          message: userBid ? 'Your proposal has been updated.' : 'Your proposal has been submitted.',
          duration: 5000,
        });
      }

      loadMyBid();
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || 'Failed to submit proposal';
      setBidError(errorMessage);
    } finally {
      setBidLoading(false);
    }
  };

  const handleMessageOwner = () => {
    if (!gig?.ownerId) return;
    navigate(`/messages?user=${gig.ownerId}`);
  };

  if (!apiLoaded) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-sm font-medium text-zinc-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {gigLoading ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <div className="inline-flex items-center gap-3 text-zinc-300">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading gig details...</span>
          </div>
        </div>
      ) : gigError ? (
        <div className="rounded-2xl border border-rose-800 bg-rose-900/30 p-6 text-center">
          <div className="flex items-center justify-center gap-3 text-rose-200 mb-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{gigError}</span>
          </div>
          <Button onClick={() => navigate('/gigs')} className="bg-white text-zinc-950 hover:bg-zinc-100">
            Back to Gigs
          </Button>
        </div>
      ) : gig ? (
        <>
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">{gig.title}</h1>
                  <p className="text-lg text-zinc-400">{gig.description}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold uppercase whitespace-nowrap ${statusBadgeClass}`}>
                  {gig.status}
                </span>
              </div>

              {/* Action Buttons */}
              {!isOwner && (
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={handleMessageOwner}
                    className="bg-zinc-800 text-white hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Message Owner
                  </Button>
                </div>
              )}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Bid Form or Bids List */}
              <div className="lg:col-span-2 space-y-6">
                {isOwner ? (
                  <>
                    {/* Gig Owner View - Show all bids */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
                      <h2 className="text-2xl font-bold text-white">Received Bids</h2>

                      {bidsLoading ? (
                        <div className="text-center py-8 text-zinc-400">
                          <div className="inline-flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Loading bids...</span>
                          </div>
                        </div>
                      ) : bidsError ? (
                        <div className="text-center py-8 text-rose-400">{bidsError}</div>
                      ) : bids.length === 0 ? (
                        <div className="text-center py-8 text-zinc-400">No bids yet</div>
                      ) : (
                        <div className="space-y-4">
                          {bids.map((bid) => (
                            <div
                              key={bid.id}
                              className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 hover:bg-zinc-800 transition"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="font-semibold text-white">{bid.freelancer?.name || bid.freelancerName}</p>
                                  <p className="text-sm text-zinc-400">{bid.freelancer?.email || bid.freelancerEmail}</p>
                                  {bid.contactPhone && <p className="text-sm text-zinc-400">{bid.contactPhone}</p>}
                                  <p className="text-sm text-amber-400 mt-1">${bid.price.toLocaleString()}</p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  bid.status === 'pending' ? 'bg-amber-900/50 text-amber-200' :
                                  bid.status === 'hired' ? 'bg-emerald-900/50 text-emerald-200' :
                                  'bg-rose-900/50 text-rose-200'
                                }`}>
                                  {bid.status}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-300 mb-3">{bid.message}</p>
                              {bid.status === 'pending' && (
                                <Button
                                  onClick={async () => {
                                    try {
                                      await client.patch(`/api/bids/${bid.id}/hire`, {});
                                      
                                      if (window.__toastContainer) {
                                        window.__toastContainer.addToast({
                                          type: 'success',
                                          title: 'Freelancer Hired!',
                                          message: `You hired ${bid.freelancerName}`,
                                        });
                                      }
                                      
                                      // Reload bids to reflect the change
                                      await loadBids();
                                    } catch (err) {
                                      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || 'Failed to hire freelancer';
                                      if (window.__toastContainer) {
                                        window.__toastContainer.addToast({
                                          type: 'error',
                                          title: 'Error',
                                          message: errorMessage,
                                        });
                                      }
                                    }
                                  }}
                                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 text-sm py-2"
                                >
                                  Hire
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Freelancer View - Bid Form */}
                    {isHired ? (
                      <div className="rounded-2xl border border-emerald-800 bg-emerald-900/30 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h3 className="font-semibold text-emerald-200">🎉 You've Been Hired!</h3>
                            <p className="text-sm text-emerald-300">Congratulations! The client hired you for this project.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleBidSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
                        <h2 className="text-2xl font-bold text-white">Submit Your Proposal</h2>

                        <div className="space-y-2">
                          <label htmlFor="message" className="text-sm font-semibold text-white">Your Proposal Message</label>
                          <Textarea
                            id="message"
                            name="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tell the client why you're the perfect fit for this project..."
                            disabled={bidLoading || !canBid}
                            rows={5}
                            className="border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
                          />
                          {message.length > 0 && (
                            <p className="text-xs text-zinc-500 text-right">{message.length}/5000</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="price" className="text-sm font-semibold text-white">Your Bid Price ($)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold">$</span>
                            <Input
                              id="price"
                              name="price"
                              type="number"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              placeholder="0"
                              disabled={bidLoading || !canBid}
                              required
                              className="border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600 text-xl py-4 pl-10 font-semibold"
                            />
                          </div>
                        </div>

                        {price && !Number.isNaN(Number(price)) && Number(price) > gig.budget && (
                          <div className="rounded-xl border border-amber-800 bg-amber-900/30 px-4 py-3 flex items-start gap-3">
                            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-2a9 9 0 110-18 9 9 0 010 18z" />
                            </svg>
                            <div>
                              <div className="text-sm font-semibold text-amber-300">Bid Higher Than Budget</div>
                              <div className="text-xs text-amber-400 mt-1">
                                Your bid is ${(Number(price) - gig.budget).toLocaleString()} higher than the client's budget of ${gig.budget.toLocaleString()}.
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2 text-xs text-zinc-500">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Client's budget: ${gig.budget?.toLocaleString()}. Consider bidding competitively.</span>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-zinc-700">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <label className="text-sm font-semibold text-white">Contact Information (Optional)</label>
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="contactName" className="text-xs font-medium text-zinc-300">Full Name</label>
                            <Input
                              id="contactName"
                              name="contactName"
                              type="text"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              placeholder="Your full name"
                              disabled={bidLoading || !canBid}
                              className="border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="contactEmail" className="text-xs font-medium text-zinc-300">Email</label>
                            <Input
                              id="contactEmail"
                              name="contactEmail"
                              type="email"
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              placeholder="your@email.com"
                              disabled={bidLoading || !canBid}
                              className="border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="contactPhone" className="text-xs font-medium text-zinc-300">Phone</label>
                            <Input
                              id="contactPhone"
                              name="contactPhone"
                              type="tel"
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              placeholder="+1 (555) 000-0000"
                              disabled={bidLoading || !canBid}
                              className="border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
                            />
                          </div>
                        </div>

                        {bidError && (
                          <div className="rounded-xl border border-rose-800 bg-rose-900/30 px-4 py-3 text-sm text-rose-200 flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{bidError}</span>
                          </div>
                        )}

                        <div className="pt-4">
                          <Button 
                            type="submit" 
                            disabled={bidLoading || !canBid}
                            className="w-full bg-white text-zinc-950 hover:bg-zinc-100 py-4 text-base font-semibold"
                          >
                            {bidLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {userBid ? 'Updating Your Proposal...' : 'Submitting Your Proposal...'}
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {userBid ? 'Update Proposal' : 'Submit Proposal'}
                              </span>
                            )}
                          </Button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Tips Card */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 space-y-4 sticky top-24">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Bidding Tips
                  </div>
                  
                  <div className="space-y-4 text-sm text-zinc-400">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold">1</div>
                      <p><span className="text-white font-medium">Read Carefully:</span> Understand all project requirements before bidding</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold">2</div>
                      <p><span className="text-white font-medium">Be Specific:</span> Mention relevant skills and past work</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold">3</div>
                      <p><span className="text-white font-medium">Competitive Pricing:</span> Research market rates for similar projects</p>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold">4</div>
                      <p><span className="text-white font-medium">Professional Tone:</span> Keep your message clear and courteous</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-start gap-3 text-xs text-zinc-500">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>You can update your proposal anytime before the client makes a hiring decision</p>
                    </div>
                  </div>
                </div>

                {/* Project Summary Card */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 space-y-4">
                  <div className="text-white font-semibold">Project Summary</div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Budget</span>
                      <span className="text-white font-semibold">${gig.budget?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${statusBadgeClass}`}>
                        {gig.status || 'open'}
                      </span>
                    </div>
                    {gig.highestBidder && (
                      <div className="pt-3 border-t border-zinc-800">
                        <div className="text-xs text-zinc-500 mb-1">Current Best Bid</div>
                        <div className="text-white font-semibold">${gig.highestBidder.price?.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default GigDetail;
