import React, { useState, useMemo } from 'react';
import useAppStore from '../../store/useAppStore';
import { SALES_MANAGERS } from '../../constants/mockData';

export default function Step2Manager() {
  const filters = useAppStore((s) => s.filters);
  const manager = useAppStore((s) => s.manager);
  const setManager = useAppStore((s) => s.setManager);
  const proceedToNextStep = useAppStore((s) => s.proceedToNextStep);

  const [search, setSearch] = useState('');

  const regionManagers = useMemo(() => {
    if (!filters?.region) return [];
    const all = [];
    Object.entries(SALES_MANAGERS).forEach(([region, managers]) => {
      if (filters.region === 'All' || region === filters.region) {
        all.push(...managers);
      }
    });
    return all;
  }, [filters]);

  const filtered = useMemo(
    () =>
      regionManagers.filter((m) =>
        m.toLowerCase().includes(search.toLowerCase())
      ),
    [regionManagers, search]
  );

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-badge">Step 2</span>
        <h2 className="step-title">Sales Manager Selection</h2>
        <p className="step-desc">
          Select the sales manager whose territory you want to rebalance.
          {filters?.region && (
            <span className="step-desc-region"> Region: {filters.region}</span>
          )}
        </p>
      </div>

      <div className="manager-search-wrap">
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search managers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="manager-list">
          {filtered.length === 0 && (
            <div className="manager-empty">No managers found for this region.</div>
          )}
          {filtered.map((m) => (
            <button
              key={m}
              className={`manager-row ${manager === m ? 'manager-row--active' : ''}`}
              onClick={() => setManager(m)}
            >
              <div className="manager-avatar">
                {m.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="manager-info">
                <span className="manager-name">{m}</span>
                <span className="manager-region">{filters?.region}</span>
              </div>
              {manager === m && (
                <svg className="manager-check" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {manager && (
        <div className="step-footer">
          <div className="selection-summary">
            <span className="tag-pill tag-pill--llm">Manager</span>
            <span className="summary-text">{manager}</span>
          </div>
          <button className="btn-primary" onClick={proceedToNextStep}>
            Proceed to Step 3 →
          </button>
        </div>
      )}
    </div>
  );
}
