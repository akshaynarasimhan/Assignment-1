import React from 'react';
import useAppStore from '../../store/useAppStore';
import { REGIONS, AI_BD_OPTIONS, GEO_TERR_OPTIONS } from '../../constants/mockData';

export default function Step1Filter() {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const proceedToNextStep = useAppStore((s) => s.proceedToNextStep);

  const current = filters ?? { region: '', aibd: '', geoTerr: '' };

  function update(key, value) {
    setFilters({ ...current, [key]: value });
  }

  const canProceed = current.region && current.aibd && current.geoTerr;

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-badge">Step 1</span>
        <h2 className="step-title">Scope Selection</h2>
        <p className="step-desc">
          Choose the scope of your territory rebalancing analysis.
        </p>
      </div>

      <div className="filter-grid">
        <div className="filter-group">
          <label className="filter-label">Region</label>
          <div className="chip-group">
            {REGIONS.map((r) => (
              <button
                key={r}
                className={`chip ${current.region === r ? 'chip--active' : ''}`}
                onClick={() => update('region', r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">AI / BD</label>
          <div className="chip-group">
            {AI_BD_OPTIONS.map((o) => (
              <button
                key={o}
                className={`chip ${current.aibd === o ? 'chip--active' : ''}`}
                onClick={() => update('aibd', o)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Geo Territory</label>
          <div className="chip-group">
            {GEO_TERR_OPTIONS.map((g) => (
              <button
                key={g}
                className={`chip ${current.geoTerr === g ? 'chip--active' : ''}`}
                onClick={() => update('geoTerr', g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {canProceed && (
        <div className="step-footer">
          <div className="selection-summary">
            <span className="tag-pill tag-pill--rule">Selected</span>
            <span className="summary-text">
              {current.region} &middot; {current.aibd} &middot; {current.geoTerr}
            </span>
          </div>
          <button className="btn-primary" onClick={proceedToNextStep}>
            Proceed to Step 2 →
          </button>
        </div>
      )}
    </div>
  );
}
