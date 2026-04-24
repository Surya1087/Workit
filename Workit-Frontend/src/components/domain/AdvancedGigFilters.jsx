import { useState, useEffect } from 'react';

const AdvancedGigFilters = ({ onFilterChange, isOpen, onClose }) => {
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApply = () => {
    onFilterChange({
      minBudget,
      maxBudget,
      startDate,
      endDate,
    });
    onClose();
  };

  const handleReset = () => {
    setMinBudget('');
    setMaxBudget('');
    setStartDate('');
    setEndDate('');
    onFilterChange({
      minBudget: '',
      maxBudget: '',
      startDate: '',
      endDate: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-2xl md:rounded-2xl max-w-md w-full md:w-96 p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Advanced Filters</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Budget Range */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-white">Budget Range</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Min budget"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50 outline-none"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Max budget"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50 outline-none"
                />
              </div>
            </div>
            {minBudget || maxBudget ? (
              <p className="text-xs text-zinc-400">
                ${minBudget || '0'} - ${maxBudget || 'any'}
              </p>
            ) : null}
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-white">Posted Date Range</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50 outline-none"
                />
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/50 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(minBudget || maxBudget || startDate || endDate) && (
            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-zinc-300 uppercase">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {minBudget && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-900/50 text-blue-200 text-xs">
                    Min: ${minBudget}
                    <button onClick={() => setMinBudget('')} className="hover:text-blue-100">✕</button>
                  </span>
                )}
                {maxBudget && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-900/50 text-blue-200 text-xs">
                    Max: ${maxBudget}
                    <button onClick={() => setMaxBudget('')} className="hover:text-blue-100">✕</button>
                  </span>
                )}
                {startDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-900/50 text-purple-200 text-xs">
                    From: {new Date(startDate).toLocaleDateString()}
                    <button onClick={() => setStartDate('')} className="hover:text-purple-100">✕</button>
                  </span>
                )}
                {endDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-900/50 text-purple-200 text-xs">
                    To: {new Date(endDate).toLocaleDateString()}
                    <button onClick={() => setEndDate('')} className="hover:text-purple-100">✕</button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-zinc-800">
          <button
            onClick={handleReset}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 rounded-lg bg-white text-zinc-950 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedGigFilters;
