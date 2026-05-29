import React from 'react';
import useAppStore from '../store/useAppStore';

const STEPS = [
  { id: 1, label: 'Scope Selection', desc: 'Region · AI/BD · Geo' },
  { id: 2, label: 'Sales Manager', desc: 'Pick a manager' },
  { id: 3, label: 'AE Metrics', desc: 'Review territory data' },
  { id: 4, label: 'AE Selection', desc: 'Choose collapse / growth AE' },
  { id: 5, label: 'Recommendations', desc: 'Review & approve' },
];

export default function Sidebar() {
  const step = useAppStore((s) => s.step);
  const setStep = useAppStore((s) => s.setStep);
  const filters = useAppStore((s) => s.filters);
  const manager = useAppStore((s) => s.manager);
  const mode = useAppStore((s) => s.mode);
  const selectedAE = useAppStore((s) => s.selectedAE);
  const reset = useAppStore((s) => s.reset);

  function isAccessible(id) {
    if (id === 1) return true;
    if (id === 2) return filters?.region && filters?.aibd && filters?.geoTerr;
    if (id === 3) return manager;
    if (id === 4) return mode;
    if (id === 5) return selectedAE;
    return false;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <svg viewBox="0 0 32 32" fill="none" className="logo-svg">
            <rect width="32" height="32" rx="8" fill="#0073ab" />
            <path d="M8 22L14 10L20 18L24 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="13" r="2" fill="#f78166" />
          </svg>
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-brand">Gartner</span>
          <span className="sidebar-product">Territory IQ</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Workflow</div>
        {STEPS.map((s) => {
          const accessible = isAccessible(s.id);
          const active = step === s.id;
          const done = step > s.id;

          return (
            <button
              key={s.id}
              className={`sidebar-step ${active ? 'sidebar-step--active' : ''} ${done ? 'sidebar-step--done' : ''} ${!accessible ? 'sidebar-step--locked' : ''}`}
              onClick={() => accessible && setStep(s.id)}
              disabled={!accessible}
            >
              <div className={`step-indicator ${active ? 'step-indicator--active' : done ? 'step-indicator--done' : ''}`}>
                {done ? (
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 10 }}>
                    <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                  </svg>
                ) : (
                  s.id
                )}
              </div>
              <div className="step-text">
                <span className="step-label">{s.label}</span>
                <span className="step-sub">{s.desc}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-context">
        {filters?.region && (
          <div className="ctx-row">
            <span className="ctx-key">Region</span>
            <span className="ctx-val">{filters.region.replace('North America - ', 'NA ')}</span>
          </div>
        )}
        {manager && (
          <div className="ctx-row">
            <span className="ctx-key">Manager</span>
            <span className="ctx-val">{manager.split(' ')[0]} {manager.split(' ').slice(-1)[0]}</span>
          </div>
        )}
        {mode && (
          <div className="ctx-row">
            <span className="ctx-key">Mode</span>
            <span className={`ctx-val ctx-val--${mode}`}>{mode}</span>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-reset" onClick={reset}>
          ↺ Reset workflow
        </button>
        <span className="sidebar-version">v1.0.0 · Design Leads</span>
      </div>
    </aside>
  );
}
