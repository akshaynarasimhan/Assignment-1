import React from 'react';
import useAppStore from '../store/useAppStore';

const STEP_LABELS = {
  1: 'Scope Selection',
  2: 'Sales Manager',
  3: 'AE Metrics & Mode',
  4: 'AE Selection',
  5: 'Recommendations',
};

export default function Topbar() {
  const step = useAppStore((s) => s.step);
  const isLoading = useAppStore((s) => s.isLoading);
  const filters = useAppStore((s) => s.filters);
  const manager = useAppStore((s) => s.manager);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          <span className="topbar-step-label">Step {step} of 5</span>
          <span className="topbar-sep">›</span>
          <span className="topbar-page-title">{STEP_LABELS[step]}</span>
        </div>
        {(filters || manager) && (
          <div className="topbar-context-pills">
            {filters?.region && (
              <span className="ctx-pill">{filters.region}</span>
            )}
            {filters?.aibd && filters.aibd !== 'All' && (
              <span className="ctx-pill">{filters.aibd}</span>
            )}
            {filters?.geoTerr && filters.geoTerr !== 'All' && (
              <span className="ctx-pill">{filters.geoTerr}</span>
            )}
            {manager && (
              <span className="ctx-pill ctx-pill--manager">{manager}</span>
            )}
          </div>
        )}
      </div>
      <div className="topbar-right">
        {isLoading && (
          <div className="topbar-loading">
            <div className="spinner spinner--sm" />
            <span>Analysing…</span>
          </div>
        )}
        <div className="topbar-progress">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`progress-dot ${s <= step ? 'progress-dot--active' : ''} ${s < step ? 'progress-dot--done' : ''}`}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
