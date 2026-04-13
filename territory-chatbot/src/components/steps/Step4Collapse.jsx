import React, { useMemo } from 'react';
import useAppStore from '../../store/useAppStore';
import { MOCK_AE_DATA } from '../../constants/mockData';

export default function Step4Collapse() {
  const manager = useAppStore((s) => s.manager);
  const mode = useAppStore((s) => s.mode);
  const selectedAE = useAppStore((s) => s.selectedAE);
  const setSelectedAE = useAppStore((s) => s.setSelectedAE);
  const proceedToNextStep = useAppStore((s) => s.proceedToNextStep);

  const aeOptions = useMemo(() => {
    let data = MOCK_AE_DATA;
    if (manager) data = data.filter((ae) => ae.manager === manager);
    if (mode === 'growth') data = data.filter((ae) => ae.availableCapacity > 0);
    if (mode === 'collapse') data = data.filter((ae) => ae.cv > 1000);
    return data;
  }, [manager, mode]);

  const selectedAEData = useMemo(
    () => aeOptions.find((ae) => ae.id === selectedAE),
    [aeOptions, selectedAE]
  );

  const modeLabel = mode === 'growth' ? 'Growth' : 'Collapse';
  const modeColor = mode === 'growth' ? 'var(--accent3)' : 'var(--accent4)';

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-badge">Step 4</span>
        <h2 className="step-title">AE Selection — {modeLabel} Rebalancing</h2>
        <p className="step-desc">
          {mode === 'growth'
            ? 'Select an AE with available capacity to receive new accounts.'
            : 'Select an overloaded AE whose accounts will be redistributed.'}
        </p>
      </div>

      {aeOptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No eligible AEs found for {modeLabel} mode under the selected manager.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Try changing the rebalancing mode or filters.
          </p>
        </div>
      ) : (
        <div className="ae-select-list">
          {aeOptions.map((ae) => {
            const isSelected = selectedAE === ae.id;
            const ratio = ae.targetBookingSize
              ? ((ae.cv / ae.targetBookingSize) * 100).toFixed(0)
              : 0;
            const ratioColor =
              ratio > 80 ? 'var(--danger)' : ratio > 60 ? 'var(--warning)' : 'var(--success)';

            return (
              <button
                key={ae.id}
                className={`ae-card ${isSelected ? 'ae-card--selected' : ''}`}
                onClick={() => setSelectedAE(ae.id)}
                style={{ '--mode-color': modeColor }}
              >
                <div className="ae-card-left">
                  <div className="ae-avatar">
                    {ae.aeName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="ae-info">
                    <span className="ae-name">{ae.aeName}</span>
                    <span className="ae-role">{ae.role}</span>
                  </div>
                </div>
                <div className="ae-card-metrics">
                  <div className="ae-metric">
                    <span className="ae-metric-label">CV</span>
                    <span className="ae-metric-value">{ae.cv.toLocaleString()}</span>
                  </div>
                  <div className="ae-metric">
                    <span className="ae-metric-label">% Target</span>
                    <span className="ae-metric-value" style={{ color: ratioColor }}>
                      {ratio}%
                    </span>
                  </div>
                  {mode === 'growth' && (
                    <div className="ae-metric">
                      <span className="ae-metric-label">Capacity</span>
                      <span className="ae-metric-value" style={{ color: 'var(--accent3)' }}>
                        +{ae.availableCapacity}
                      </span>
                    </div>
                  )}
                  <div className="ae-metric">
                    <span className="ae-metric-label">Proxy</span>
                    <span className="ae-metric-value">{ae.proxyGraded}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="ae-card-check">
                    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18 }}>
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedAE && selectedAEData && (
        <div className="step-footer">
          <div className="selection-summary">
            <span className="tag-pill tag-pill--hybrid">AE Selected</span>
            <span className="summary-text">{selectedAEData.aeName}</span>
          </div>
          <button className="btn-primary" onClick={proceedToNextStep}>
            View Recommendations →
          </button>
        </div>
      )}
    </div>
  );
}
