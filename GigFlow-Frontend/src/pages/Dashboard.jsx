import { useState } from 'react';
import BidsDashboard from './BidsDashboard';
import GigOwnerDashboard from './GigOwnerDashboard';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('freelancer');

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('freelancer')}
          className={`px-6 py-4 font-semibold transition border-b-2 ${
            activeTab === 'freelancer'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          My Bids
        </button>
        <button
          onClick={() => setActiveTab('owner')}
          className={`px-6 py-4 font-semibold transition border-b-2 ${
            activeTab === 'owner'
              ? 'border-white text-white'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          My Gigs
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'freelancer' && <BidsDashboard />}
        {activeTab === 'owner' && <GigOwnerDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;
